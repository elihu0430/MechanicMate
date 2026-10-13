import { apiClient } from "./client";

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
  const payload = {
    ...data,
    due_date: data.due_date || new Date(Date.now() + 14 * 86400000).toISOString(),
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

export async function fetchPortalInvoice(token: string): Promise<ApiInvoice> {
  return apiClient<ApiInvoice>(`/api/v1/invoices/portal/${token}`, {
    method: "GET",
  });
}

