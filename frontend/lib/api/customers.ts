import { apiClient } from "./client";

export interface ApiCustomer {
  id: string;
  workshop_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  is_tax_exempt: boolean;
  default_discount_percent: number;
  has_labor_rate_override: boolean;
  custom_labor_rate_hourly?: number | null;
  has_parts_markup_override: boolean;
  custom_parts_markup_percent?: number | null;
  custom_payment_terms_days: number;
  created_at: string;
}

export interface CustomerCreateInput {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  is_tax_exempt?: boolean;
  default_discount_percent?: number;
  has_labor_rate_override?: boolean;
  custom_labor_rate_hourly?: number;
  has_parts_markup_override?: boolean;
  custom_parts_markup_percent?: number;
  custom_payment_terms_days?: number;
}

export async function fetchCustomers(search?: string, token?: string): Promise<ApiCustomer[]> {
  const query = search ? `?search=${encodeURIComponent(search.trim())}` : "";
  return apiClient<ApiCustomer[]>(`/api/v1/customers${query}`, {
    method: "GET",
    token,
  });
}

export async function fetchCustomer(customerId: string, token?: string): Promise<ApiCustomer> {
  return apiClient<ApiCustomer>(`/api/v1/customers/${customerId}`, {
    method: "GET",
    token,
  });
}

export async function createCustomer(data: CustomerCreateInput, token?: string): Promise<ApiCustomer> {
  return apiClient<ApiCustomer>(`/api/v1/customers`, {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}
