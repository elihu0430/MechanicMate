import { apiClient } from "./client";
import type { ApiRepairOrderItem } from "./jobs";

export interface ApiPayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  transaction_reference?: string | null;
  recorded_by_user_id?: string | null;
  created_at: string;
}

export interface ApiInvoice {
  id: string;
  workshop_id: string;
  repair_order_id: string;
  invoice_number: string;
  status: "draft" | "sent" | "partially-paid" | "paid" | "overdue" | string;
  due_date: string;
  subtotal: number;
  tax_rate_percent: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  created_at: string;
  payments: ApiPayment[];

  // Enriched fields from associated Repair Order / Customer / Vehicle
  ro_number?: string | null;
  public_token?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  vehicle_name?: string | null;
  license_plate?: string | null;
  vehicle_vin?: string | null;
  vehicle_mileage_km?: number | null;
  customer_concern?: string | null;
  recommended_work?: string | null;
  items?: ApiRepairOrderItem[];
}

export type InvoiceRead = ApiInvoice;

export interface CreateInvoiceInput {
  repair_order_id: string;
  due_date?: string;
}

export interface RecordPaymentInput {
  amount: number;
  payment_method: "cash" | "card" | "eft" | "account_credit" | string;
  transaction_reference?: string;
}

export async function fetchInvoices(token?: string): Promise<ApiInvoice[]> {
  return apiClient<ApiInvoice[]>(`/api/v1/invoices`, {
    method: "GET",
    token,
  });
}

export async function fetchInvoice(invoiceId: string, token?: string): Promise<ApiInvoice> {
  return apiClient<ApiInvoice>(`/api/v1/invoices/${invoiceId}`, {
    method: "GET",
    token,
  });
}

export async function createInvoice(data: CreateInvoiceInput, token?: string): Promise<ApiInvoice> {
  const defaultDueDate = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
  const payload = {
    ...data,
    due_date: data.due_date ? data.due_date.split("T")[0] : defaultDueDate,
  };
  return apiClient<ApiInvoice>(`/api/v1/invoices`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function recordPayment(
  invoiceId: string,
  data: RecordPaymentInput,
  token?: string
): Promise<ApiPayment> {
  return apiClient<ApiPayment>(`/api/v1/invoices/${invoiceId}/payments`, {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function recordPortalPayment(
  portalToken: string,
  data: RecordPaymentInput
): Promise<ApiPayment> {
  return apiClient<ApiPayment>(`/api/v1/invoices/portal/${portalToken}/pay`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchPortalInvoice(token: string): Promise<ApiInvoice> {
  return apiClient<ApiInvoice>(`/api/v1/invoices/portal/${token}`, {
    method: "GET",
  });
}
