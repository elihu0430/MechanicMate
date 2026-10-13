import { apiClient } from "./client";

export interface IntakeLookupResult {
  vehicle: {
    id: string;
    license_plate: string;
    year: number;
    make: string;
    model: string;
    color?: string;
    mileage_km: number;
    vin?: string;
    status: string;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    is_tax_exempt: boolean;
    custom_labor_rate_hourly?: number;
  };
  past_repair_orders_count: number;
  last_service_date?: string;
  active_repair_order_id?: string;
}

export async function lookupVehicleByPlate(plateNumber: string, token?: string): Promise<IntakeLookupResult> {
  const query = encodeURIComponent(plateNumber.trim().toUpperCase());
  return apiClient<IntakeLookupResult>(`/api/v1/intake/lookup?reg_num=${query}`, {
    method: "GET",
    token,
  });
}
