import sys
import asyncio
from pathlib import Path
from decimal import Decimal
from datetime import datetime, date, timezone, timedelta
import uuid

# Ensure backend directory is in sys.path
_project_root = Path(__file__).resolve().parent.parent
_backend_dir = _project_root / "backend"
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from app.core.database import AsyncSessionLocal
from app.models.workshop import Workshop
from app.models.user import User
from app.models.customer import Customer
from app.models.vehicle import Vehicle
from app.models.job import RepairOrder, RepairOrderItem
from app.models.inspection import Inspection, InspectionChecklistItem, VehicleDamagePin
from app.models.invoice import Invoice, Payment
from sqlalchemy import select

DEV_WORKSHOP_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEV_USER_ID = "user_dev_001"

async def seed():
    print(f"[SEED] Starting database seeding for workshop {DEV_WORKSHOP_ID}...")
    async with AsyncSessionLocal() as db:
        # 1. Workshop
        ws_res = await db.execute(select(Workshop).where(Workshop.id == DEV_WORKSHOP_ID))
        workshop = ws_res.scalar_one_or_none()
        if not workshop:
            workshop = Workshop(
                id=DEV_WORKSHOP_ID,
                name="Dev's Auto Workshop",
                phone="+27 11 482 9900",
                email="service@devsauto.co.za",
                address="Unit 4, Industrial Park, 14 Main Reef Road, Johannesburg, 2092",
                vat_number="ZA-4902188201",
                labour_rate_hourly=480.00,
                tax_rate_percent=15.00,
                currency="ZAR"
            )
            db.add(workshop)
            await db.flush()
            print("  Created workshop")
        else:
            print("  Workshop already exists")

        # 2. User
        user_res = await db.execute(select(User).where(User.id == DEV_USER_ID))
        user = user_res.scalar_one_or_none()
        if not user:
            user = User(
                id=DEV_USER_ID,
                workshop_id=DEV_WORKSHOP_ID,
                name="Alex Ndlovu",
                email="alex@devsauto.co.za",
                role="owner"
            )
            db.add(user)
            await db.flush()
            print("  Created user")

        # Check if customers already exist
        cust_check = await db.execute(select(Customer).where(Customer.workshop_id == DEV_WORKSHOP_ID))
        existing_customers = cust_check.scalars().all()
        if existing_customers:
            print(f"  Found {len(existing_customers)} existing customers. Skipping duplicate insert.")
            return

        # 3. Customers
        c1 = Customer(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            first_name="John",
            last_name="Smith",
            phone="071 234 5678",
            email="john.smith@gmail.com",
            address="14 Oak Avenue, Sandton, Johannesburg",
            notes="Preferred customer. Always requests OEM parts.",
            is_tax_exempt=False,
            default_discount_percent=0.00,
        )
        c2 = Customer(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            first_name="Amahle",
            last_name="Nkosi",
            phone="083 456 7890",
            email="amahle.nkosi@outlook.com",
            address="7 Rose Street, Fourways, Sandton",
            notes="Commutes daily to Pretoria. Wants SMS status updates.",
            is_tax_exempt=False,
        )
        c3 = Customer(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            first_name="Thabo",
            last_name="Dlamini",
            phone="076 987 6543",
            email="thabo.d@business.co.za",
            address="22 Maple Road, Midrand",
            notes="Fleet vehicle for delivery operations.",
            is_tax_exempt=False,
        )
        c4 = Customer(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            first_name="Sipho",
            last_name="Mahlangu",
            phone="082 111 2233",
            email="sipho.m@law.org.za",
            address="55 Pine Close, Centurion",
            notes="Requires itemized VAT invoice for tax filing.",
            is_tax_exempt=False,
        )
        db.add_all([c1, c2, c3, c4])
        await db.flush()
        print("  Inserted 4 customers")

        # 4. Vehicles
        v1 = Vehicle(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            customer_id=c1.id,
            license_plate="ABC 1234 GP",
            year=2018,
            make="Toyota",
            model="Corolla 1.6 Prestige",
            color="Pearl White",
            mileage_km=82450,
            engine="1.6L 1ZR-FE",
            vin="JTDBU4EE2A9074318",
            status="in-shop"
        )
        v2 = Vehicle(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            customer_id=c2.id,
            license_plate="ND 452 891",
            year=2020,
            make="Volkswagen",
            model="Polo Vivo 1.4 Trendline",
            color="Reflex Silver",
            mileage_km=54100,
            engine="1.4L CLP",
            vin="WVWZZZ6RZHY194820",
            status="active"
        )
        v3 = Vehicle(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            customer_id=c3.id,
            license_plate="CA 782 109",
            year=2019,
            make="Ford",
            model="Ranger 2.2 TDCi XL",
            color="Moondust Silver",
            mileage_km=118200,
            engine="2.2L Duratorq TDCi",
            vin="MNBUMFF50JW104928",
            status="in-shop"
        )
        v4 = Vehicle(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            customer_id=c4.id,
            license_plate="CY 619 402",
            year=2017,
            make="BMW",
            model="320i M Sport",
            color="Estoril Blue",
            mileage_km=96300,
            engine="2.0L B48 Turbo",
            vin="WBA8E1200HNN12093",
            status="completed"
        )
        v5 = Vehicle(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            customer_id=c1.id,
            license_plate="CF 901 234",
            year=2021,
            make="Mercedes-Benz",
            model="C200 AMG Line",
            color="Obsidian Black",
            mileage_km=41200,
            engine="1.5L M264 EQ Boost",
            vin="WDD2050421R829104",
            status="active"
        )
        db.add_all([v1, v2, v3, v4, v5])
        await db.flush()
        print("  Inserted 5 vehicles")

        # 5. Repair Orders
        # RO 1: WIP
        ro1 = RepairOrder(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            customer_id=c1.id,
            vehicle_id=v1.id,
            ro_number="RO-1001",
            status="wip",
            customer_concern="Vehicle due for 80,000 km minor service; squeak from front left brake when coming to gentle stop.",
            diagnosis="Brake squeak traced to glazing on front brake pads; 3.5mm friction material remaining. Recommended pad replacement alongside standard service.",
            recommended_work="Front brake pad replacement, brake fluid flush, oil and filter service.",
            subtotal_parts=Decimal("1850.00"),
            subtotal_labour=Decimal("1440.00"),
            tax_amount=Decimal("493.50"),
            total_amount=Decimal("3783.50"),
            scheduled_at=datetime.now(timezone.utc) - timedelta(hours=3),
            public_token="ro_seed_token_1001",
            items=[
                RepairOrderItem(
                    item_type="part",
                    description="Engine Oil - 5W-30 Full Synthetic (4.2L)",
                    part_number="ENG-OIL-5W30",
                    quantity=Decimal("1.00"),
                    unit_price=Decimal("680.00"),
                    total_price=Decimal("680.00"),
                    is_completed=True,
                ),
                RepairOrderItem(
                    item_type="part",
                    description="OEM Oil Filter Element",
                    part_number="TOY-04152-YZZA6",
                    quantity=Decimal("1.00"),
                    unit_price=Decimal("220.00"),
                    total_price=Decimal("220.00"),
                    is_completed=True,
                ),
                RepairOrderItem(
                    item_type="part",
                    description="Front Ceramic Brake Pad Set",
                    part_number="FER-FDB1617",
                    quantity=Decimal("1.00"),
                    unit_price=Decimal("950.00"),
                    total_price=Decimal("950.00"),
                    is_completed=False,
                ),
                RepairOrderItem(
                    item_type="labour",
                    description="80,000 km Scheduled Maintenance Service",
                    quantity=Decimal("2.00"),
                    unit_price=Decimal("480.00"),
                    labour_hours=Decimal("2.00"),
                    labour_hourly_rate=Decimal("480.00"),
                    total_price=Decimal("960.00"),
                    is_completed=True,
                ),
                RepairOrderItem(
                    item_type="labour",
                    description="Front Brake Pad Renewal & Caliper Slide Pin Lubrication",
                    quantity=Decimal("1.00"),
                    unit_price=Decimal("480.00"),
                    labour_hours=Decimal("1.00"),
                    labour_hourly_rate=Decimal("480.00"),
                    total_price=Decimal("480.00"),
                    is_completed=False,
                ),
            ]
        )

        # RO 2: Created / Scheduled
        ro2 = RepairOrder(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            customer_id=c2.id,
            vehicle_id=v2.id,
            ro_number="RO-1002",
            status="created",
            customer_concern="Amber check engine light illuminated on cluster yesterday afternoon; engine slightly sluggish when accelerating in 3rd gear.",
            diagnosis="Pending OBD diagnostic scan.",
            recommended_work="OBD-II diagnostic scan, intake inspection, spark plug assessment.",
            subtotal_parts=Decimal("420.00"),
            subtotal_labour=Decimal("720.00"),
            tax_amount=Decimal("171.00"),
            total_amount=Decimal("1311.00"),
            scheduled_at=datetime.now(timezone.utc) + timedelta(days=1),
            public_token="ro_seed_token_1002",
            items=[
                RepairOrderItem(
                    item_type="part",
                    description="OBD-II Fault Log Report & Clearing",
                    quantity=Decimal("1.00"),
                    unit_price=Decimal("420.00"),
                    total_price=Decimal("420.00"),
                    is_completed=False,
                ),
                RepairOrderItem(
                    item_type="labour",
                    description="Full System Diagnostics & Smoke Test",
                    quantity=Decimal("1.50"),
                    unit_price=Decimal("480.00"),
                    labour_hours=Decimal("1.50"),
                    labour_hourly_rate=Decimal("480.00"),
                    total_price=Decimal("720.00"),
                    is_completed=False,
                ),
            ]
        )

        # RO 3: Due / Ready for pickup
        ro3 = RepairOrder(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            customer_id=c3.id,
            vehicle_id=v3.id,
            ro_number="RO-1003",
            status="due",
            customer_concern="Clutch pedal slipping under heavy acceleration when loaded with tools.",
            diagnosis="Heavy friction plate wear down to rivets. Flywheel glazed.",
            recommended_work="Full clutch kit replacement, flywheel resurface, slave cylinder flush.",
            subtotal_parts=Decimal("3800.00"),
            subtotal_labour=Decimal("1920.00"),
            tax_amount=Decimal("858.00"),
            total_amount=Decimal("6578.00"),
            scheduled_at=datetime.now(timezone.utc) - timedelta(days=2),
            completed_at=datetime.now(timezone.utc) - timedelta(hours=2),
            public_token="ro_seed_token_1003",
            items=[
                RepairOrderItem(
                    item_type="part",
                    description="Heavy Duty Clutch Kit (Pressure Plate, Disc & Release Bearing)",
                    part_number="LUK-624318000",
                    quantity=Decimal("1.00"),
                    unit_price=Decimal("3800.00"),
                    total_price=Decimal("3800.00"),
                    is_completed=True,
                ),
                RepairOrderItem(
                    item_type="labour",
                    description="Transmission Removal, Clutch Installation & Flywheel Skim",
                    quantity=Decimal("4.00"),
                    unit_price=Decimal("480.00"),
                    labour_hours=Decimal("4.00"),
                    labour_hourly_rate=Decimal("480.00"),
                    total_price=Decimal("1920.00"),
                    is_completed=True,
                ),
            ]
        )

        # RO 4: Completed
        ro4 = RepairOrder(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            customer_id=c4.id,
            vehicle_id=v4.id,
            ro_number="RO-1004",
            status="completed",
            customer_concern="Vehicle refused to crank after sitting parked over the weekend.",
            diagnosis="Battery cell failed, resting voltage 10.4V. Alternator charging system verified healthy at 14.2V.",
            recommended_work="AGM Battery replacement and battery registration in DME.",
            subtotal_parts=Decimal("2850.00"),
            subtotal_labour=Decimal("480.00"),
            tax_amount=Decimal("499.50"),
            total_amount=Decimal("3829.50"),
            scheduled_at=datetime.now(timezone.utc) - timedelta(days=5),
            completed_at=datetime.now(timezone.utc) - timedelta(days=4),
            public_token="ro_seed_token_1004",
            items=[
                RepairOrderItem(
                    item_type="part",
                    description="VARTA 80Ah AGM Start-Stop Battery",
                    part_number="VAR-F21-AGM",
                    quantity=Decimal("1.00"),
                    unit_price=Decimal("2850.00"),
                    total_price=Decimal("2850.00"),
                    is_completed=True,
                ),
                RepairOrderItem(
                    item_type="labour",
                    description="Battery Installation & DME Intelligent Battery Sensor Coding",
                    quantity=Decimal("1.00"),
                    unit_price=Decimal("480.00"),
                    labour_hours=Decimal("1.00"),
                    labour_hourly_rate=Decimal("480.00"),
                    total_price=Decimal("480.00"),
                    is_completed=True,
                ),
            ]
        )
        db.add_all([ro1, ro2, ro3, ro4])
        await db.flush()
        print("  Inserted 4 repair orders with line items")

        # 6. Inspections
        insp1 = Inspection(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            customer_id=c1.id,
            vehicle_id=v1.id,
            repair_order_id=ro1.id,
            inspection_number="INSP-1001",
            status="in_progress",
            overall_condition="fair",
            public_token="insp_seed_token_1001",
            checklist_items=[
                InspectionChecklistItem(
                    category="Brakes",
                    title="Front Brake Pads & Rotors",
                    status="fair",
                    measurement_value=Decimal("3.50"),
                    measurement_unit="mm",
                    suggested_action="Replace front brake pads (wear limit 3.0mm)",
                    notes="Inner pads worn slightly more than outer"
                ),
                InspectionChecklistItem(
                    category="Brakes",
                    title="Rear Brake Pads & Rotors",
                    status="good",
                    measurement_value=Decimal("7.00"),
                    measurement_unit="mm",
                    notes="70% life remaining"
                ),
                InspectionChecklistItem(
                    category="Tires & Wheels",
                    title="Front Left Tire Tread Depth",
                    status="good",
                    measurement_value=Decimal("5.20"),
                    measurement_unit="mm",
                    notes="Tread depth even across footprint"
                ),
                InspectionChecklistItem(
                    category="Under Hood & Fluids",
                    title="Engine Oil Level & Condition",
                    status="poor",
                    suggested_action="Oil darkened, replace along with filter",
                    notes="Service interval reached"
                ),
                InspectionChecklistItem(
                    category="Electrical & Battery",
                    title="Battery State of Health (SOH)",
                    status="good",
                    measurement_value=Decimal("12.60"),
                    measurement_unit="V",
                    notes="Tested at 92% cold cranking amps"
                ),
            ],
            damage_pins=[
                VehicleDamagePin(
                    vehicle_id=v1.id,
                    view_angle="front",
                    x_percent=Decimal("42.50"),
                    y_percent=Decimal("68.00"),
                    damage_type="scratch",
                    severity="minor",
                    notes="Minor clear coat scratch on lower front bumper lip"
                )
            ]
        )
        db.add(insp1)
        await db.flush()
        print("  Inserted 1 inspection with checklist and damage pins")

        # 7. Invoices & Payments
        inv1 = Invoice(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            repair_order_id=ro4.id,
            invoice_number="INV-1001",
            status="paid",
            due_date=date.today(),
            subtotal=Decimal("3330.00"),
            tax_rate_percent=Decimal("15.00"),
            tax_amount=Decimal("499.50"),
            total_amount=Decimal("3829.50"),
            paid_amount=Decimal("3829.50"),
            payments=[
                Payment(
                    amount=Decimal("3829.50"),
                    payment_method="card",
                    transaction_reference="AUTH-892147",
                    recorded_by_user_id=DEV_USER_ID,
                )
            ]
        )

        inv2 = Invoice(
            id=uuid.uuid4(),
            workshop_id=DEV_WORKSHOP_ID,
            repair_order_id=ro3.id,
            invoice_number="INV-1002",
            status="partially-paid",
            due_date=date.today() + timedelta(days=7),
            subtotal=Decimal("5720.00"),
            tax_rate_percent=Decimal("15.00"),
            tax_amount=Decimal("858.00"),
            total_amount=Decimal("6578.00"),
            paid_amount=Decimal("3000.00"),
            payments=[
                Payment(
                    amount=Decimal("3000.00"),
                    payment_method="eft",
                    transaction_reference="EFT-REF-44910",
                    recorded_by_user_id=DEV_USER_ID,
                )
            ]
        )
        db.add_all([inv1, inv2])
        await db.commit()
        print("  Inserted 2 invoices with payments")
        print("[SEED] Successfully seeded dev database with rich operational data!")

if __name__ == "__main__":
    asyncio.run(seed())
