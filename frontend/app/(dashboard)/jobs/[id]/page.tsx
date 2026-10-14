"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useApi, ApiRepairOrder } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

const STATUS_STEPS = [
  "created",
  "wip",
  "due",
  "completed",
];

const STATUS_LABELS: Record<string, string> = {
  created: "Scheduled / Created",
  scheduled: "Scheduled",
  wip: "In Progress (WIP)",
  "in-progress": "In Progress",
  due: "Ready for Pickup",
  ready: "Ready for Pickup",
  completed: "Completed",
};

export default function JobDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const api = useApi();

  const [job, setJob] = useState<ApiRepairOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.jobs.get(id);
      setJob(data);
    } catch (err: any) {
      console.error("Failed to fetch job:", err);
      setError(err?.message || "Failed to load repair order from database");
    } finally {
      setIsLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    loadJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!job) return;
    try {
      setIsUpdating(true);
      const updated = await api.jobs.updateStatus(job.id, newStatus);
      setJob(updated);
    } catch (err: any) {
      alert(err?.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    if (!job) return;
    try {
      const res = await api.jobs.toggleItem(job.id, itemId);
      setJob((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          completion_percentage: res.completion_percentage,
          items: prev.items.map((it) =>
            it.id === itemId ? { ...it, is_completed: res.is_completed } : it
          ),
        };
      });
    } catch (err: any) {
      alert(err?.message || "Failed to toggle line item");
    }
  };

  const handleSendQuote = async () => {
    if (!job) return;
    try {
      setQuoteSending(true);
      setQuoteSuccess(null);
      const res = await api.jobs.sendQuote(job.id);
      setQuoteSuccess(`WhatsApp quote dispatched to ${res.recipient}!`);
      setTimeout(() => setQuoteSuccess(null), 5000);
    } catch (err: any) {
      alert(err?.message || "Failed to dispatch quote");
    } finally {
      setQuoteSending(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell activeItem="jobs">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-[#737373] animate-pulse">
          Loading repair order from database...
        </div>
      </AppShell>
    );
  }

  if (error || !job) {
    return (
      <AppShell activeItem="jobs">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center space-y-4">
          <p className="text-red-400 font-bold">{error || "Repair order not found"}</p>
          <Link
            href="/jobs"
            className="inline-block px-4 py-2 rounded-xl bg-[#22c55e] text-xs font-bold text-black"
          >
            ← Back to Repair Orders
          </Link>
        </div>
      </AppShell>
    );
  }

  const partsItems = job.items.filter((it) => it.item_type === "part");
  const laborItems = job.items.filter((it) => it.item_type === "labour" || it.item_type === "labor");

  const customerName = job.customer?.name || "Client";
  const customerPhone = job.customer?.phone || "No phone";
  const plate = job.vehicle?.license_plate || "PLATE";
  const vehicleName = job.vehicle
    ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`
    : "Vehicle";

  return (
    <AppShell activeItem="jobs">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#212121] pb-5">
          <div className="space-y-1">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white transition-colors mb-1"
            >
              <span>← Back to all repair orders</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {job.ro_number}
              </h1>
              <span className="font-mono text-xs font-bold text-[#ededed] bg-[#1a1a1a] border border-[#2c2c2c] px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {plate}
              </span>
            </div>
          </div>

          {/* Top Actions: Quote, Inspection & Print */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleSendQuote}
              disabled={quoteSending}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#0f2416] border border-[#1d472c] px-3.5 py-2 text-xs font-bold text-[#22c55e] hover:bg-[#163620] transition-all select-none disabled:opacity-50"
            >
              <span>💬 {quoteSending ? "Dispatching..." : "Send WhatsApp Quote"}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a] shadow-md transition-all select-none"
            >
              <span>🖨️ Print Invoice (A4)</span>
            </button>
          </div>
        </div>

        {quoteSuccess && (
          <div className="p-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-xs font-bold text-[#22c55e] flex items-center justify-between animate-in fade-in">
            <span>✓ {quoteSuccess}</span>
            <button onClick={() => setQuoteSuccess(null)} className="text-white hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Status Pipeline Stepper */}
        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
              Repair Order Status Pipeline
            </span>
            <span className="text-xs font-mono font-bold text-[#22c55e]">
              Progress: {job.completion_percentage}%
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STATUS_STEPS.map((s) => {
              const active = job.status === s;
              return (
                <button
                  key={s}
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(s)}
                  className={`rounded-xl px-3 py-2.5 text-xs font-bold transition-all text-center select-none touch-manipulation ${
                    active
                      ? "bg-[#22c55e] text-black shadow-md font-black"
                      : "bg-[#1c1c1c] text-[#7a7a7a] border border-[#282828] hover:border-[#383838] hover:text-white"
                  }`}
                >
                  {STATUS_LABELS[s] || s}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column: Customer & Vehicle Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Customer Card */}
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
              Customer Information
            </span>
            <div>
              <h2 className="text-base font-bold text-white">
                {customerName}
              </h2>
              <p className="text-xs text-[#8e8e8e] mt-0.5">
                {customerPhone}
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <a
                href={`tel:${customerPhone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1c1c1c] border border-[#2b2b2b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#252525]"
              >
                <span>📞 Call</span>
              </a>
              <a
                href={`https://wa.me/${customerPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f2416] border border-[#1d472c] px-3 py-1.5 text-xs font-semibold text-[#22c55e] hover:bg-[#163620]"
              >
                <span>💬 WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Vehicle Card */}
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
              Vehicle Specifications
            </span>
            <div>
              <h2 className="text-base font-bold text-white">
                {vehicleName}
              </h2>
              <p className="text-xs font-mono text-[#8e8e8e] mt-0.5">
                {job.vehicle?.vin ? `VIN: ${job.vehicle.vin}` : "VIN: Not recorded"}
              </p>
            </div>
            <div className="pt-2">
              <span className="text-xs text-[#737373]">
                Created:{" "}
                <strong className="text-white">
                  {new Date(job.created_at).toLocaleString()}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Concern & Diagnosis */}
        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
              Customer Concern
            </span>
            <p className="text-sm text-neutral-200 leading-relaxed bg-[#181818] p-3.5 rounded-xl border border-[#242424]">
              {job.customer_concern}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
              Recommended Work / Diagnosis
            </span>
            <p className="text-sm text-neutral-200 leading-relaxed bg-[#181818] p-3.5 rounded-xl border border-[#242424]">
              {job.recommended_work || job.diagnosis || "Pending assessment."}
            </p>
          </div>
        </div>

        {/* Line Items: Parts & Labor Table with Interactive Toggle */}
        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Itemized Parts & Labor Checklist
            </h3>
            <span className="text-xs text-[#737373]">Click to toggle completion</span>
          </div>

          {/* Parts Section */}
          {partsItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#888] uppercase tracking-wider">
                Parts Line Items
              </p>
              <div className="divide-y divide-[#1f1f1f] rounded-xl bg-[#181818] border border-[#262626]">
                {partsItems.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleToggleItem(p.id)}
                    className="flex items-center justify-between p-3 text-xs sm:text-sm cursor-pointer hover:bg-[#202020] transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={p.is_completed}
                        onChange={() => {}}
                        className="h-4 w-4 rounded accent-[#22c55e] cursor-pointer"
                      />
                      <div>
                        <p className={`font-semibold ${p.is_completed ? "line-through text-[#666]" : "text-neutral-200"}`}>
                          {p.description}
                        </p>
                        <p className="text-xs text-[#737373]">
                          Qty: {p.quantity} × {formatCurrency(p.unit_price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(p.total_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Labor Section */}
          {laborItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#888] uppercase tracking-wider">
                Labor Line Items
              </p>
              <div className="divide-y divide-[#1f1f1f] rounded-xl bg-[#181818] border border-[#262626]">
                {laborItems.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => handleToggleItem(l.id)}
                    className="flex items-center justify-between p-3 text-xs sm:text-sm cursor-pointer hover:bg-[#202020] transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={l.is_completed}
                        onChange={() => {}}
                        className="h-4 w-4 rounded accent-[#22c55e] cursor-pointer"
                      />
                      <div>
                        <p className={`font-semibold ${l.is_completed ? "line-through text-[#666]" : "text-neutral-200"}`}>
                          {l.description}
                        </p>
                        <p className="text-xs text-[#737373]">
                          {l.labour_hours || l.quantity} hrs @ {formatCurrency(l.labour_hourly_rate || l.unit_price)}/hr
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(l.total_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals Calculation Card */}
          <div className="rounded-xl bg-[#181818] border border-[#262626] p-4 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-[#888]">
              <span>Subtotal Parts:</span>
              <span className="font-mono text-white">
                {formatCurrency(job.subtotal_parts)}
              </span>
            </div>
            <div className="flex justify-between text-[#888]">
              <span>Subtotal Labor:</span>
              <span className="font-mono text-white">
                {formatCurrency(job.subtotal_labour)}
              </span>
            </div>
            <div className="flex justify-between text-[#888]">
              <span>VAT (15%):</span>
              <span className="font-mono text-white">
                {formatCurrency(job.tax_amount)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#262626]">
              <span>Grand Total:</span>
              <span className="font-mono font-black text-[#22c55e] text-lg">
                {formatCurrency(job.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
