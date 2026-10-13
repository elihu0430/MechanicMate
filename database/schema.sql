-- ==============================================================================
-- MechanicMate — Production Relational Database Schema (Neon PostgreSQL 16)
-- 15 Relational Tables with Composite B-Tree Indexes & Row-Level Multi-Tenancy
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. WORKSHOPS (Multi-Tenant Root Organization)
CREATE TABLE IF NOT EXISTS workshops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    vat_number VARCHAR(100),
    labour_rate_hourly NUMERIC(10, 2) NOT NULL DEFAULT 480.00,
    tax_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'ZAR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS (Mechanics & Workshop Staff mapped to Clerk Auth)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY, -- Clerk User ID (e.g. user_2...)
    workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'mechanic', -- 'owner', 'manager', 'technician', 'apprentice'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_workshop ON users(workshop_id);

-- 3. CUSTOMERS (Directory with 5-Point Financial Overrides)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    notes TEXT,
    -- 5-Point Client Financial Overrides Matrix
    is_tax_exempt BOOLEAN NOT NULL DEFAULT FALSE,
    default_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    has_labor_rate_override BOOLEAN NOT NULL DEFAULT FALSE,
    custom_labor_rate_hourly NUMERIC(10, 2),
    has_parts_markup_override BOOLEAN NOT NULL DEFAULT FALSE,
    custom_parts_markup_percent NUMERIC(5, 2),
    custom_payment_terms_days INTEGER NOT NULL DEFAULT 0, -- 0 = COD, 15, 30, 60
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customers_workshop ON customers(workshop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(workshop_id, phone);

-- 4. VEHICLES (Vehicle Registry with Fast Plate Index)
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    license_plate VARCHAR(50) NOT NULL, -- e.g. "ABC 123 GP"
    year INTEGER NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    color VARCHAR(50),
    mileage_km INTEGER NOT NULL DEFAULT 0,
    engine VARCHAR(100),
    vin VARCHAR(17),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'in-shop', 'completed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- High-priority composite index for <15ms plate intake
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(workshop_id, license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(workshop_id, vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(workshop_id, customer_id);

-- 5. REPAIR ORDERS (Core Job Cards - 4-Pill Progression)
CREATE TABLE IF NOT EXISTS repair_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    ro_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'created', -- 'created', 'wip', 'completed', 'due'
    customer_concern TEXT NOT NULL,
    diagnosis TEXT,
    recommended_work TEXT,
    subtotal_parts NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    subtotal_labour NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    public_token VARCHAR(100) UNIQUE, -- Zero-login customer authorization link
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_repair_orders_status ON repair_orders(workshop_id, status);
CREATE INDEX IF NOT EXISTS idx_repair_orders_vehicle ON repair_orders(workshop_id, vehicle_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_token ON repair_orders(public_token);

-- 6. REPAIR ORDER ITEMS (Parts, Labor Hours & Sublet Tasks)
CREATE TABLE IF NOT EXISTS repair_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repair_order_id UUID NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL, -- 'part', 'labour', 'tire', 'sublet'
    description VARCHAR(255) NOT NULL,
    part_number VARCHAR(100),
    quantity NUMERIC(8, 2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    labour_hours NUMERIC(6, 2),
    labour_hourly_rate NUMERIC(10, 2),
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE, -- For WIP progress calculation
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ro_items_order ON repair_order_items(repair_order_id);

-- 7. INVENTORY ITEMS (Inventory Triad: Parts, Tires & Canned Labor)
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'part', 'tire', 'canned_labor'
    sku VARCHAR(100),
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    retail_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    quantity_on_hand NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    reorder_threshold NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    bin_location VARCHAR(100),
    -- Tire-specific dimensions
    tire_width INTEGER,
    tire_aspect_ratio INTEGER,
    tire_rim_size INTEGER,
    tire_speed_index VARCHAR(10),
    tire_season VARCHAR(50),
    -- Canned labor standard book time
    canned_standard_hours NUMERIC(6, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inventory_workshop ON inventory_items(workshop_id, item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_items(workshop_id, sku);

-- 8. DIAGNOSTIC ENTRIES (3 C's Framework: Concern, Cause, Correction)
CREATE TABLE IF NOT EXISTS diagnostic_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repair_order_id UUID NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    system_category VARCHAR(100) NOT NULL, -- 'Engine', 'Transmission', 'Brakes', etc.
    customer_concern TEXT NOT NULL,
    technician_cause TEXT,
    correction_plan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_diagnostics_ro ON diagnostic_entries(repair_order_id);

-- 9. OBD SCAN RECORDS (Wireless Bluetooth ELM327 Telemetry & DTCs)
CREATE TABLE IF NOT EXISTS obd_scan_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repair_order_id UUID REFERENCES repair_orders(id) ON DELETE SET NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    protocol VARCHAR(100),
    dtc_codes JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g. ["P0300", "P0420"]
    live_pids JSONB NOT NULL DEFAULT '{}'::jsonb,  -- RPM, CoolantTemp, STFT, LTFT
    freeze_frame_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_obd_vehicle ON obd_scan_records(vehicle_id);

-- 10. INVOICES (Billing, A4 VAT Tax Invoices)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    repair_order_id UUID NOT NULL REFERENCES repair_orders(id),
    invoice_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'partially-paid', 'paid', 'overdue'
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_invoices_workshop ON invoices(workshop_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_ro ON invoices(repair_order_id);

-- 11. PAYMENTS (Point-Of-Sale Ledger & Split Payments)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'cash', 'card', 'eft', 'account_credit'
    transaction_reference VARCHAR(255),
    recorded_by_user_id VARCHAR(255) REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- 12. INSPECTIONS (32-Point Digital Vehicle Inspection Sessions)
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    repair_order_id UUID REFERENCES repair_orders(id),
    inspection_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'converted'
    overall_condition VARCHAR(50), -- 'good', 'fair', 'poor'
    public_token VARCHAR(100) UNIQUE, -- Tokenized link for customer portal view
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inspections_workshop ON inspections(workshop_id, status);
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle ON inspections(vehicle_id);

-- 13. INSPECTION CHECKLIST ITEMS (32 Points across 6 Subsystems)
CREATE TABLE IF NOT EXISTS inspection_checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'Engine', 'Brakes', 'Tires', 'Suspension', 'Electrical', 'Underbody'
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'good', -- 'good', 'fair', 'poor'
    measurement_value NUMERIC(8, 2), -- e.g. 4.0 for 4mm brake pad, 32.0 for PSI, 550 for CCA
    measurement_unit VARCHAR(50),    -- 'mm', 'psi', 'cca', 'volts', '%'
    suggested_action TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inspection_items ON inspection_checklist_items(inspection_id);

-- 14. VEHICLE DAMAGE PINS (Interactive 2D SVG Coordinate Pin Drops)
CREATE TABLE IF NOT EXISTS vehicle_damage_pins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    view_angle VARCHAR(50) NOT NULL, -- 'top', 'front', 'rear', 'side_left', 'side_right'
    x_percent NUMERIC(5, 2) NOT NULL, -- 0.00% to 100.00% normalized coordinate
    y_percent NUMERIC(5, 2) NOT NULL, -- 0.00% to 100.00% normalized coordinate
    damage_type VARCHAR(50) NOT NULL, -- 'dent', 'scratch', 'crack', 'paint_chip', 'hail', 'rust', 'missing'
    severity VARCHAR(50) NOT NULL DEFAULT 'minor', -- 'minor', 'moderate', 'severe'
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_damage_pins ON vehicle_damage_pins(inspection_id);

-- 15. INSPECTION ATTACHMENTS (Walkaround Photos & PDF Diagnostic Reports)
CREATE TABLE IF NOT EXISTS inspection_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    media_type VARCHAR(50) NOT NULL, -- 'image/webp', 'application/pdf'
    file_url TEXT NOT NULL,
    title VARCHAR(255),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_attachments ON inspection_attachments(inspection_id);
