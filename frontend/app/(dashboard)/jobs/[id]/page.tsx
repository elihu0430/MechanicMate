"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MOCK_REPAIR_ORDERS, formatCurrency } from "@/lib/mock-data";
import { JobStatus, RepairOrder } from "@/lib/types";

const STATUS_STEPS: JobStatus[] = [
  "scheduled",
  "in-progress",
  "waiting-parts",
  "ready",
  "completed",
];

const STATUS_LABELS: Record<JobStatus, string> = {
  scheduled: "Scheduled",
  "in-progress": "In Progress",
  "waiting-parts": "Waiting Parts",
  ready: "Ready for Pickup",
  completed: "Completed",
};

export default function JobDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const foundJob =
    MOCK_REPAIR_ORDERS.find(
      (j) => j.id === id || j.roNumber.toLowerCase() === id?.toLowerCase(),
    ) || MOCK_REPAIR_ORDERS[0];

  const [job, setJob] = useState<RepairOrder>(foundJob);

  const updateStatus = (newStatus: JobStatus) => {
    setJob({ ...job, status: newStatus });
  };

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
                {job.roNumber}
              </h1>
              <span className="font-mono text-xs font-bold text-[#ededed] bg-[#1a1a1a] border border-[#2c2c2c] px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {job.licensePlate}
              </span>
            </div>
          </div>

          {/* Top Actions: Inspection & Print */}
          <div className="flex items-center gap-2.5">
            <Link
              href={
                job.inspectionId
                  ? `/inspections/${job.inspectionId}`
                  : "/inspections/insp-1"
              }
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#1a1a1a] border border-[#2b2b2b] px-4 py-2 text-xs font-bold text-neutral-200 hover:bg-[#242424] hover:text-white transition-all select-none"
            >
              <span>📋 Inspection Checklist</span>
            </Link>
            <button
              onClick={() => window.print()}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a] shadow-md transition-all select-none"
            >
              <span>🖨️ Print Invoice (A4)</span>
            </button>
          </div>
        </div>

        {/* Status Pipeline Stepper */}
        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-4 sm:p-5 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
            Repair Order Pipeline
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {STATUS_STEPS.map((s) => {
              const active = job.status === s;
              return (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`rounded-xl px-3 py-2.5 text-xs font-bold transition-all text-center select-none touch-manipulation ${
                    active
                      ? "bg-[#22c55e] text-black shadow-md font-black"
                      : "bg-[#1c1c1c] text-[#7a7a7a] border border-[#282828] hover:border-[#383838] hover:text-white"
                  }`}
                >
                  {STATUS_LABELS[s]}
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
                {job.customerName}
              </h2>
              <p className="text-xs text-[#8e8e8e] mt-0.5">
                {job.customerPhone}
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <a
                href={`tel:${job.customerPhone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1c1c1c] border border-[#2b2b2b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#252525]"
              >
                <span>📞 Call</span>
              </a>
              <a
                href={`https://wa.me/27${job.customerPhone.replace(/\D/g, "").slice(-9)}`}
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
                {job.vehicleYear} {job.vehicleMake} {job.vehicleModel}
              </h2>
              <p className="text-xs font-mono text-[#8e8e8e] mt-0.5">
                VIN: {job.vin}
              </p>
            </div>
            <div className="pt-2">
              <span className="text-xs text-[#737373]">
                Appointment Slot:{" "}
                <strong className="text-white">{job.appointmentTime}</strong>
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
              {job.concern}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
              Technician Diagnosis & Scope of Work
            </span>
            <p className="text-sm text-neutral-200 leading-relaxed bg-[#181818] p-3.5 rounded-xl border border-[#242424]">
              {job.diagnosis}
            </p>
          </div>
        </div>

        {/* Line Items: Parts & Labor Table */}
        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Itemized Parts & Labor
            </h3>
            <span className="text-xs text-[#737373]">15% VAT Applicable</span>
          </div>

          {/* Parts Section */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#888] uppercase tracking-wider">
              Parts Line Items
            </p>
            <div className="divide-y divide-[#1f1f1f] rounded-xl bg-[#181818] border border-[#262626]">
              {job.parts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 text-xs sm:text-sm"
                >
                  <div>
                    <p className="font-semibold text-neutral-200">{p.name}</p>
                    <p className="text-xs text-[#737373]">
                      Qty: {p.qty} × {formatCurrency(p.unitPrice)}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(p.qty * p.unitPrice)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Labor Section */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#888] uppercase tracking-wider">
              Labor Line Items
            </p>
            <div className="divide-y divide-[#1f1f1f] rounded-xl bg-[#181818] border border-[#262626]">
              {job.labor.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-3 text-xs sm:text-sm"
                >
                  <div>
                    <p className="font-semibold text-neutral-200">
                      {l.description}
                    </p>
                    <p className="text-xs text-[#737373]">
                      {l.hours} hours @ {formatCurrency(l.rate)}/hr
                    </p>
                  </div>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(l.hours * l.rate)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Calculation Card */}
          <div className="rounded-xl bg-[#181818] border border-[#262626] p-4 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-[#888]">
              <span>Subtotal:</span>
              <span className="font-mono text-white">
                {formatCurrency(job.estimateSubtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#888]">
              <span>VAT (15%):</span>
              <span className="font-mono text-white">
                {formatCurrency(job.taxAmount)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#262626]">
              <span>Estimated Grand Total:</span>
              <span className="font-mono font-black text-[#22c55e] text-lg">
                {formatCurrency(job.estimateTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
