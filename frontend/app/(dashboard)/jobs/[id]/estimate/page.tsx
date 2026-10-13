"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchJob, type RepairOrderRead } from "@/lib/api/jobs";
import { formatCurrency } from "@/lib/format";

export default function JobEstimatePage() {
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<RepairOrderRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchJob(id)
      .then((data) => {
        setJob(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load estimate for job:", err);
        setError("Unable to load repair order details.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
        <p className="text-xs text-[#8c8c8c]">Loading estimate details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center space-y-4">
        <p className="text-sm text-red-400">{error || "Repair order not found"}</p>
        <Link
          href="/jobs"
          className="inline-block rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a]"
        >
          Return to Repair Orders
        </Link>
      </div>
    );
  }

  const parts = job.items.filter((i) => i.item_type === "part");
  const labor = job.items.filter((i) => i.item_type === "labour" || i.item_type === "labor");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#212121] pb-5">
        <div>
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white mb-1 transition-colors"
          >
            <span>← Back to {job.ro_number}</span>
          </Link>
          <h1 className="text-2xl font-black text-white">
            Cost Estimate & Approval
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            {job.vehicle ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}` : "Vehicle"} &bull;
            Customer: {job.customer?.name || "Customer"}
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
          {parts.length > 0 ? (
            parts.map((p) => (
              <div
                key={p.id}
                className="flex justify-between text-xs py-1 border-b border-[#222]"
              >
                <span className="text-white">
                  {p.description} (x{p.quantity})
                </span>
                <span className="font-mono text-neutral-300">
                  {formatCurrency(p.total_price)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-500 italic">No parts recorded for this estimate.</p>
          )}
        </div>

        {/* Labor */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold text-[#38bdf8]">Mechanical Labor</p>
          {labor.length > 0 ? (
            labor.map((l) => (
              <div
                key={l.id}
                className="flex justify-between text-xs py-1 border-b border-[#222]"
              >
                <span className="text-white">
                  {l.description} ({l.labour_hours || l.quantity} hrs)
                </span>
                <span className="font-mono text-neutral-300">
                  {formatCurrency(l.total_price)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-500 italic">No labor items recorded for this estimate.</p>
          )}
        </div>

        {/* Totals */}
        <div className="pt-3 space-y-1.5 text-xs text-[#8a8a8a]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono text-white">
              {formatCurrency(job.subtotal_parts + job.subtotal_labour)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>VAT (15%):</span>
            <span className="font-mono text-white">
              {formatCurrency(job.tax_amount)}
            </span>
          </div>
          <div className="flex justify-between text-base font-black text-white pt-2 border-t border-[#262626]">
            <span>Total:</span>
            <span className="font-mono text-[#22c55e]">
              {formatCurrency(job.total_amount)}
            </span>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
          <span className="text-xs text-[#737373]">Approval Status:</span>
          <button
            onClick={() => setApproved(!approved)}
            className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
              approved
                ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
                : "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
            }`}
          >
            {approved ? "Approved by Customer ✓" : "Pending Customer Sign-off"}
          </button>
        </div>
      </div>
    </div>
  );
}
