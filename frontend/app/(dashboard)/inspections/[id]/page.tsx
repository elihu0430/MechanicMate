"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useApi, ApiInspection, ApiVehicle } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface FormChecklistItem {
  id?: string;
  category: string;
  title: string;
  status: "good" | "attention" | "urgent";
  notes?: string;
}

export default function InspectionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const api = useApi();

  const [inspection, setInspection] = useState<ApiInspection | null>(null);
  const [vehicle, setVehicle] = useState<ApiVehicle | null>(null);
  const [items, setItems] = useState<FormChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInspectionData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    try {
      const insp = await api.inspections.get(id);
      setInspection(insp);
      if (insp.checklist_items) {
        setItems(
          insp.checklist_items.map((ci) => ({
            id: ci.id,
            category: ci.category,
            title: ci.title,
            status:
              ci.status === "good"
                ? "good"
                : ci.status === "fair"
                ? "attention"
                : "urgent",
            notes: ci.notes || undefined,
          }))
        );
      }

      if (insp.vehicle_id) {
        try {
          const v = await api.vehicles.get(insp.vehicle_id);
          setVehicle(v);
        } catch (e) {
          console.warn("Could not load vehicle for inspection:", e);
        }
      }
    } catch (err) {
      console.error("Failed to load inspection:", err);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    loadInspectionData();
  }, [loadInspectionData]);

  const setItemStatus = (index: number, newStatus: "good" | "attention" | "urgent") => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, status: newStatus } : item))
    );
  };

  if (loading) {
    return (
      <AppShell activeItem="inspections">
        <div className="mx-auto max-w-4xl px-4 py-16 flex flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
          <p className="text-xs text-[#8c8c8c]">Loading vehicle inspection report...</p>
        </div>
      </AppShell>
    );
  }

  if (!inspection) {
    return (
      <AppShell activeItem="inspections">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
          <p className="text-sm text-red-400">Inspection record not found</p>
          <Link
            href="/inspections"
            className="inline-block rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a]"
          >
            Return to Inspections
          </Link>
        </div>
      </AppShell>
    );
  }

  const categories = Array.from(new Set(items.map((i) => i.category)));
  const vehicleName = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : "Inspected Vehicle";
  const plate = vehicle?.license_plate || "ZA-PLATE";

  return (
    <AppShell activeItem="inspections">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="border-b border-[#212121] pb-5">
          <Link
            href="/inspections"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white transition-colors mb-1"
          >
            <span>← Back to all inspections</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded">
                  {inspection.inspection_number}
                </span>
                <span className="font-mono text-xs font-bold text-white bg-[#1a1a1a] px-2 py-0.5 rounded uppercase">
                  {plate}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                {vehicleName}
              </h1>
              <p className="text-xs text-[#7a7a7a]">
                Inspector: Master Tech &bull; Date: {formatDate(inspection.created_at)}
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a] shadow-md transition-all select-none self-start sm:self-auto"
            >
              <span>🖨️ Print Inspection Report (A4)</span>
            </button>
          </div>
        </div>

        {/* Multi-point Checklist by Category */}
        <div className="space-y-5">
          {categories.map((category) => {
            const categoryItems = items.filter((i) => i.category === category);
            return (
              <div
                key={category}
                className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3"
              >
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#ededed] pb-2 border-b border-[#1f1f1f]">
                  {category}
                </h2>

                <div className="divide-y divide-[#1c1c1c]">
                  {categoryItems.map((item, idx) => {
                    const globalIdx = items.indexOf(item);
                    return (
                      <div
                        key={idx}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {item.title}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-[#8e8e8e] mt-0.5">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        {/* 3-Way Triage Toggle */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto select-none">
                          <button
                            type="button"
                            onClick={() => setItemStatus(globalIdx, "good")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all min-h-[36px] ${
                              item.status === "good"
                                ? "bg-[#22c55e] text-black shadow-sm"
                                : "bg-[#181818] text-[#737373] hover:text-white border border-[#272727]"
                            }`}
                          >
                            ✓ Good
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemStatus(globalIdx, "attention")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all min-h-[36px] ${
                              item.status === "attention"
                                ? "bg-[#f59e0b] text-black shadow-sm"
                                : "bg-[#181818] text-[#737373] hover:text-white border border-[#272727]"
                            }`}
                          >
                            ! Attention
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemStatus(globalIdx, "urgent")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all min-h-[36px] ${
                              item.status === "urgent"
                                ? "bg-[#ef4444] text-white shadow-sm"
                                : "bg-[#181818] text-[#737373] hover:text-white border border-[#272727]"
                            }`}
                          >
                            ✕ Urgent
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
