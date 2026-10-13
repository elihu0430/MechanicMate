import { apiClient } from "./client";

export interface ApiRepairOrderItem {
  id: string;
  item_type: string;
  description: string;
  part_number?: string;
  quantity: number;
  unit_price: number;
  labour_hours?: number;
  labour_hourly_rate?: number;
  total_price: number;
  is_completed: boolean;
}

export interface ApiRepairOrder {
  id: string;
  workshop_id: string;
  ro_number: string;
  status: "created" | "wip" | "completed" | "due" | string;
  customer_id: string;
  vehicle_id: string;
  customer_concern: string;
  diagnosis?: string;
  recommended_work?: string;
  subtotal_parts: number;
  subtotal_labour: number;
  tax_amount: number;
  total_amount: number;
  completion_percentage: number;
  public_token?: string;
  created_at: string;
  scheduled_at?: string;
  completed_at?: string;
  items: ApiRepairOrderItem[];
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    is_tax_exempt?: boolean;
    custom_labor_rate_hourly?: number;
  };
  vehicle?: {
    id: string;
    license_plate: string;
    year: number;
    make: string;
    model: string;
    color?: string;
    mileage_km: number;
    vin?: string;
  };
}

export type RepairOrderRead = ApiRepairOrder;
export type RepairOrderItemRead = ApiRepairOrderItem;

export interface CreateJobInput {
  customer_id: string;
  vehicle_id: string;
  customer_concern: string;
  diagnosis?: string;
  recommended_work?: string;
  scheduled_at?: string;
  items?: Array<{
    item_type: "labour" | "part" | string;
    description: string;
    part_number?: string;
    quantity?: number;
    unit_price?: number;
    labour_hours?: number;
    labour_hourly_rate?: number;
    is_completed?: boolean;
  }>;
}

export async function fetchJobs(status?: string, token?: string): Promise<ApiRepairOrder[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiClient<ApiRepairOrder[]>(`/api/v1/jobs${query}`, {
    method: "GET",
    token,
  });
}

export async function fetchJob(jobId: string, token?: string): Promise<ApiRepairOrder> {
  return apiClient<ApiRepairOrder>(`/api/v1/jobs/${jobId}`, {
    method: "GET",
    token,
  });
}

export async function createJob(data: CreateJobInput, token?: string): Promise<ApiRepairOrder> {
  return apiClient<ApiRepairOrder>(`/api/v1/jobs`, {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function updateJobStatus(jobId: string, status: string, token?: string): Promise<ApiRepairOrder> {
  return apiClient<ApiRepairOrder>(`/api/v1/jobs/${jobId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    token,
  });
}

export async function toggleJobItem(jobId: string, itemId: string, token?: string): Promise<{ success: boolean; item_id: string; is_completed: boolean; completion_percentage: number }> {
  return apiClient(`/api/v1/jobs/${jobId}/items/${itemId}/toggle`, {
    method: "PATCH",
    token,
  });
}

export async function sendJobQuote(jobId: string, token?: string): Promise<{ success: boolean; recipient: string; job_id: string }> {
  return apiClient(`/api/v1/jobs/${jobId}/send-quote`, {
    method: "POST",
    token,
  });
}

export async function fetchPortalJob(portalToken: string): Promise<ApiRepairOrder> {
  return apiClient<ApiRepairOrder>(`/api/v1/jobs/portal/${portalToken}`, {
    method: "GET",
  });
}

