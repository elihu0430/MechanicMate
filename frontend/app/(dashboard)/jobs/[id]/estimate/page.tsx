"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MOCK_REPAIR_ORDERS, formatCurrency } from "@/lib/mock-data";

export default function JobEstimatePage() {
  const params = useParams();
  const id = params?.id as string;

  const job =
    MOCK_REPAIR_ORDERS.find(
      (j) => j.id === id || j.roNumber.toLowerCase() === id?.toLowerCase(),
    ) || MOCK_REPAIR_ORDERS[0];

  const [approved, setApproved] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#212121] pb-5">
        <div>
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white mb-1 transition-colors"
          >
            <span>← Back to {job.roNumber}</span>
          </Link>
          <h1 className="text-2xl font-black text-white">
            Cost Estimate & Approval
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            {job.vehicleYear} {job.vehicleMake} {job.vehicleModel} &bull;
            Customer: {job.customerName}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/jobs/${job.id}/signature`}
            className="rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a]"
          >
            ✍️ Open Signature Pad
          </Link>
        </div>
      </div>

      {/* Itemized Estimate Card */}
      <div className="rounded-3xl bg-[#141414] border border-[#242424] p-6 space-y-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Estimate Itemization
        </h2>

        {/* Parts */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#22c55e]">Materials & Parts</p>
          {job.parts.map((p) => (
            <div
              key={p.id}
              className="flex justify-between text-xs py-1 border-b border-[#222]"
            >
              <span className="text-white">
                {p.name} (x{p.qty})
              </span>
              <span className="font-mono text-neutral-300">
                {formatCurrency(p.qty * p.unitPrice)}
              </span>
            </div>
          ))}
        </div>

        {/* Labor */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold text-[#38bdf8]">Mechanical Labor</p>
          {job.labor.map((l) => (
            <div
              key={l.id}
              className="flex justify-between text-xs py-1 border-b border-[#222]"
            >
              <span className="text-white">
                {l.description} ({l.hours} hrs)
              </span>
              <span className="font-mono text-neutral-300">
                {formatCurrency(l.hours * l.rate)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="pt-3 space-y-1.5 text-xs text-[#8a8a8a]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono text-white">
              {formatCurrency(job.estimateSubtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>VAT (15%):</span>
            <span className="font-mono text-white">
              {formatCurrency(job.taxAmount)}
            </span>
          </div>
          <div className="flex justify-between text-base font-black text-white pt-2 border-t border-[#262626]">
            <span>Total:</span>
            <span className="font-mono text-[#22c55e]">
              {formatCurrency(job.estimateTotal)}
            </span>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
          <span className="text-xs text-[#737373]">Approval Status:</span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${approved ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#f59e0b]/20 text-[#f59e0b]"}`}
          >
            {approved ? "Approved by Customer" : "Pending Customer Sign-off"}
          </span>
        </div>
      </div>
    </div>
  );
}
