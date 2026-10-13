"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchJob, type RepairOrderRead } from "@/lib/api/jobs";
import {
  fetchInspections,
  createInspection,
  type ApiInspection,
  type ApiChecklistItem,
} from "@/lib/api/inspections";

const DEFAULT_INSPECTION_ITEMS: Array<{ category: string; title: string; status: "good" | "fair" | "poor"; notes?: string }> = [
  { category: "Brakes & Stopping", title: "Front Brake Pads & Rotors", status: "good" },
  { category: "Brakes & Stopping", title: "Rear Brake Shoes / Pads", status: "fair", notes: "Approx 4mm remaining" },
  { category: "Tyres & Alignment", title: "Front Tyres Tread Depth", status: "good" },
  { category: "Tyres & Alignment", title: "Rear Tyres Tread Depth", status: "good" },
  { category: "Underbody & Steering", title: "Shock Absorbers & Bushings", status: "fair", notes: "Slight weeping on left front strut" },
  { category: "Under Hood Fluids", title: "Engine Oil Level & Clarity", status: "poor", notes: "Darkened oil, past scheduled service interval" },
  { category: "Under Hood Fluids", title: "Brake Fluid & Coolant", status: "good" },
  { category: "Electrical & Safety", title: "12V Battery Health & Terminals", status: "good" },
  { category: "Electrical & Safety", title: "Exterior Lights & Indicators", status: "good" },
];

export default function JobInspectionSubPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [job, setJob] = useState<RepairOrderRead | null>(null);
  const [inspection, setInspection] = useState<ApiInspection | null>(null);
  const [items, setItems] = useState<Array<{ id?: string; category: string; title: string; status: "good" | "fair" | "poor"; notes?: string }>>(
    DEFAULT_INSPECTION_ITEMS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([fetchJob(id), fetchInspections()])
      .then(([jobData, inspections]) => {
        setJob(jobData);
        if (jobData) {
          const matched = inspections.find(
            (i) => i.repair_order_id === jobData.id || i.repair_order_id === id
          );
          if (matched) {
            setInspection(matched);
            if (matched.checklist_items && matched.checklist_items.length > 0) {
              setItems(
                matched.checklist_items.map((ci) => ({
                  id: ci.id,
                  category: ci.category,
                  title: ci.title,
                  status: (ci.status as any) || "good",
                  notes: ci.notes || undefined,
                }))
              );
            }
          }
        }
      })
      .catch((err) => console.error("Error loading inspection records:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const setItemStatus = (index: number, status: "good" | "fair" | "poor") => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, status } : item))
    );
  };

  const handleSaveInspection = async () => {
    if (!job) return;
    try {
      setSaving(true);
      const newInsp = await createInspection({
        customer_id: job.customer_id,
        vehicle_id: job.vehicle_id,
        repair_order_id: job.id,
        checklist_items: items.map((it) => ({
          category: it.category,
          title: it.title,
          status: it.status,
          notes: it.notes,
        })),
        damage_pins: [],
      });
      setInspection(newInsp);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save inspection report:", err);
      alert("Failed to save inspection. Please verify backend connection.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
        <p className="text-xs text-[#8c8c8c]">Loading inspection checklist...</p>
      </div>
    );
  }

  const roNumber = job?.ro_number || id;
  const plate = job?.vehicle?.license_plate || "Vehicle";
  const vehicleDesc = job?.vehicle
    ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`
    : "Vehicle";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#212121] pb-5">
        <div>
          <Link
            href={`/jobs/${job?.id || id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white mb-1 transition-colors"
          >
            <span>← Back to {roNumber}</span>
          </Link>
          <h1 className="text-2xl font-black text-white">
            Digital Vehicle Inspection (DVI)
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            {vehicleDesc} &bull; Plate: {plate}
            {inspection && ` &bull; Report #${inspection.inspection_number}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {inspection && (
            <Link
              href={`/inspections/${inspection.id}`}
              className="rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a]"
            >
              📄 Printable Inspection
            </Link>
          )}
          <button
            onClick={handleSaveInspection}
            disabled={saving}
            className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] px-4 py-2 text-xs font-bold text-white hover:bg-[#252525] disabled:opacity-50"
          >
            {saving ? "Saving..." : inspection ? "Update Checklist" : "Save DVI Report"}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 px-4 py-3 text-xs text-[#22c55e] font-semibold">
          ✓ Inspection report recorded successfully and linked to repair order {roNumber}.
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-2xl bg-[#141414] border border-[#242424] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[#737373]">
                {item.category}
              </span>
              <p className="text-sm font-bold text-white">{item.title}</p>
              {item.notes && (
                <p className="text-xs text-[#8a8a8a]">{item.notes}</p>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-[#1a1a1a] p-1 rounded-xl border border-[#262626]">
              <button
                type="button"
                onClick={() => setItemStatus(index, "good")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  item.status === "good"
                    ? "bg-[#22c55e] text-black shadow"
                    : "text-[#737373] hover:text-white"
                }`}
              >
                Pass / Good
              </button>
              <button
                type="button"
                onClick={() => setItemStatus(index, "fair")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  item.status === "fair"
                    ? "bg-[#f59e0b] text-black shadow"
                    : "text-[#737373] hover:text-white"
                }`}
              >
                Caution / Fair
              </button>
              <button
                type="button"
                onClick={() => setItemStatus(index, "poor")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  item.status === "poor"
                    ? "bg-[#ef4444] text-white shadow"
                    : "text-[#737373] hover:text-white"
                }`}
              >
                Urgent / Fail
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
