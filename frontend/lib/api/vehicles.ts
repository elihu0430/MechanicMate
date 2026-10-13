import { apiClient } from "./client";

export interface ApiVehicle {
  id: string;
  workshop_id: string;
  customer_id: string;
  license_plate: string;
  year: number;
  make: string;
  model: string;
  color?: string | null;
  mileage_km: number;
  engine?: string | null;
  vin?: string | null;
  status: string;
  created_at: string;
}

export type VehicleRead = ApiVehicle;

export interface VehicleCreateInput {
  customer_id: string;
  license_plate: string;
  year: number;
  make: string;
  model: string;
  color?: string;
  mileage_km?: number;
  engine?: string;
  vin?: string;
}

export async function fetchVehicles(token?: string): Promise<ApiVehicle[]> {
  return apiClient<ApiVehicle[]>(`/api/v1/vehicles`, {
    method: "GET",
    token,
  });
}

export async function fetchVehicle(vehicleId: string, token?: string): Promise<ApiVehicle> {
  return apiClient<ApiVehicle>(`/api/v1/vehicles/${vehicleId}`, {
    method: "GET",
    token,
  });
}

export async function createVehicle(data: VehicleCreateInput, token?: string): Promise<ApiVehicle> {
  return apiClient<ApiVehicle>(`/api/v1/vehicles`, {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}
