export type JobStatus =
  | "scheduled"
  | "in-progress"
  | "waiting-parts"
  | "ready"
  | "completed";

export type PaymentStatus =
  | "draft"
  | "sent"
  | "partially-paid"
  | "paid"
  | "overdue";

export type InspectionItemStatus = "good" | "attention" | "urgent";

export interface Workshop {
  id: string;
  name: string;
  vatNumber?: string;
  phone: string;
  email: string;
  address: string;
  labourRateHourly: number; // default 480.00
  taxRatePercent: number; // default 15.00
  currency: string; // 'ZAR'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarLetter: string;
  workshopName: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  vehiclesCount: number;
  lastService: string;
  outstandingBalance: number;
  notes?: string;
}

export interface ComponentHistoryEntry {
  id: string;
  vehicleId: string;
  componentType: "engine" | "chassis";
  serialNumber: string; // The physical engine stamp number or chassis/VIN
  status: "active" | "replaced" | "scrapped" | "donor";
  installedDate: string;
  removedDate?: string;
  mileageAtSwap?: number;
  reason?: string; // e.g. "Cracked block", "Connecting rod failure", "Factory Original"
  sourceOrigin?: string; // e.g. "Factory OEM", "Japanese Import Half-Cut (ZIMRA Dec #48201)", "Kaguvi Spares Inv #1049"
  cidVtsClearanceNo?: string; // Zimbabwe CID Vehicle Theft Squad clearance certificate
  cvrForm4Filed?: boolean; // CVR Form 4 filed with Central Vehicle Registry
  roNumber?: string;
  technicianName?: string;
  notes?: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  customerName: string;
  year: number;
  make: string;
  model: string;
  color: string;
  plate: string;
  vin: string;
  mileageKm: number;
  engine?: string;
  currentEngineNumber?: string;
  transmission?: string;
  lastService: string;
  status: "active" | "in-shop" | "completed";
  componentHistory?: ComponentHistoryEntry[];
}

export interface PartItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface LaborItem {
  id: string;
  description: string;
  hours: number;
  rate: number;
}

export interface RepairOrder {
  id: string;
  roNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  licensePlate: string;
  vin: string;
  status: JobStatus;
  service: string;
  concern: string;
  diagnosis: string;
  appointmentTime: string;
  date: string;
  notes: string;
  parts: PartItem[];
  labor: LaborItem[];
  estimateSubtotal: number;
  taxAmount: number;
  estimateTotal: number;
  inspectionId?: string;
}

export interface InspectionItem {
  id: string;
  category:
    | "Brakes"
    | "Tires & Wheels"
    | "Under Hood & Fluids"
    | "Suspension & Steering"
    | "Electrical & Battery"
    | "Exterior & Lighting";
  name: string;
  status: InspectionItemStatus;
  notes?: string;
}

export interface Inspection {
  id: string;
  roId: string;
  roNumber: string;
  vehicleId: string;
  vehicleName: string;
  plate: string;
  date: string;
  technicianName: string;
  items: InspectionItem[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  roId: string;
  roNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  vehicleName: string;
  licensePlate: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRatePercent: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleName: string;
  licensePlate: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  bayNumber: number;
  technicianName: string;
  status: "confirmed" | "in-bay" | "pending";
}
