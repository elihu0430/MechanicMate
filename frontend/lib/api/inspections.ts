import { apiClient } from "./client";

export interface ApiChecklistItem {
  id?: string;
  category: string;
  title: string;
  status: "good" | "fair" | "poor" | string;
  measurement_value?: number | null;
  measurement_unit?: string | null;
  suggested_action?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface ApiDamagePin {
  id?: string;
  view_angle: "top" | "front" | "rear" | "side_left" | "side_right" | string;
  x_percent: number;
  y_percent: number;
  damage_type: "dent" | "scratch" | "crack" | "paint_chip" | "rust" | string;
  severity: "minor" | "moderate" | "severe" | string;
  notes?: string | null;
  photo_url?: string | null;
  created_at?: string;
}

export interface ApiInspection {
  id: string;
  workshop_id: string;
  customer_id: string;
  vehicle_id: string;
  repair_order_id?: string | null;
  inspection_number: string;
  status: "in_progress" | "completed" | "converted" | string;
  overall_condition?: "good" | "fair" | "poor" | string | null;
  public_token?: string | null;
  created_at: string;
  checklist_items: ApiChecklistItem[];
  damage_pins: ApiDamagePin[];
}

export interface CreateInspectionInput {
  customer_id: string;
  vehicle_id: string;
  repair_order_id?: string;
  checklist_items?: Array<{
    category: string;
    title: string;
    status: string;
    measurement_value?: number;
    measurement_unit?: string;
    suggested_action?: string;
    notes?: string;
  }>;
  damage_pins?: Array<{
    view_angle: string;
    x_percent: number;
    y_percent: number;
    damage_type: string;
    severity?: string;
    notes?: string;
    photo_url?: string;
  }>;
}

export async function fetchInspections(token?: string): Promise<ApiInspection[]> {
  return apiClient<ApiInspection[]>(`/api/v1/inspections`, {
    method: "GET",
    token,
  });
}

export async function fetchInspection(inspectionId: string, token?: string): Promise<ApiInspection> {
  return apiClient<ApiInspection>(`/api/v1/inspections/${inspectionId}`, {
    method: "GET",
    token,
  });
}

export async function createInspection(
  data: CreateInspectionInput,
  token?: string
): Promise<ApiInspection> {
  return apiClient<ApiInspection>(`/api/v1/inspections`, {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function fetchPortalInspection(token: string): Promise<ApiInspection> {
  return apiClient<ApiInspection>(`/api/v1/inspections/portal/${token}`, {
    method: "GET",
  });
}

