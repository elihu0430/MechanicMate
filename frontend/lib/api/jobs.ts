import { apiClient } from "./client";

export interface ApiRepairOrder {
  id: string;
  ro_number: string;
  status: "created" | "wip" | "completed" | "due";
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
  created_at: string;
  items: Array<{
    id: string;
    item_type: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    is_completed: boolean;
  }>;
}

export async function fetchJobs(status?: string, token?: string): Promise<ApiRepairOrder[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiClient<ApiRepairOrder[]>(`/api/v1/jobs${query}`, {
    method: "GET",
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
