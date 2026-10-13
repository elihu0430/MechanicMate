"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchJob, type RepairOrderRead } from "@/lib/api/jobs";
import { fetchInvoices, createInvoice, type InvoiceRead } from "@/lib/api/invoices";
import { formatCurrency } from "@/lib/format";

export default function JobInvoiceSubPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [job, setJob] = useState<RepairOrderRead | null>(null);
  const [invoice, setInvoice] = useState<InvoiceRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([fetchJob(id), fetchInvoices()])
      .then(([jobData, invoices]) => {
        setJob(jobData);
        if (jobData) {
          const matched = invoices.find(
            (inv) =>
              inv.repair_order_id === jobData.id ||
              inv.repair_order_id === id
          );
          setInvoice(matched || null);
        }
      })
      .catch((err) => {
        console.error("Error loading job invoice info:", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleGenerateInvoice = async () => {
    if (!job) return;
    try {
      setGenerating(true);
      const newInv = await createInvoice({
        repair_order_id: job.id,
      });
      setInvoice(newInv);
      router.push(`/invoices/${newInv.id}`);
    } catch (err) {
      console.error("Failed to generate invoice:", err);
      alert("Failed to generate tax invoice. Please ensure the repair order is active.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
        <p className="text-xs text-[#8c8c8c]">Loading invoice records...</p>
      </div>
    );
  }

  const roNumber = job?.ro_number || id;
  const customerName = job?.customer?.name || "Customer";
  const vehicleName = job?.vehicle
    ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`
    : "Vehicle";
  const plate = job?.vehicle?.license_plate || "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#212121] pb-5">
        <div>
          <Link
            href={`/jobs/${job?.id || id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white mb-1 transition-colors"
          >
            <span>← Back to {roNumber}</span>
          </Link>
          <h1 className="text-2xl font-black text-white">Invoice Settlement</h1>
          <p className="text-xs text-[#737373]">
            {invoice
              ? `Associated with Tax Invoice ${invoice.invoice_number}`
              : `Pending Tax Invoice Generation for ${roNumber}`}
          </p>
        </div>

        {invoice ? (
          <Link
            href={`/invoices/${invoice.id}`}
            className="rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a]"
          >
            📄 View Full Tax Invoice ({invoice.invoice_number})
          </Link>
        ) : (
          <button
            onClick={handleGenerateInvoice}
            disabled={generating}
            className="rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a] disabled:opacity-50"
          >
            {generating ? "Generating..." : "⚡ Generate Tax Invoice"}
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3">
        <p className="text-xs text-[#a3a3a3]">
          Customer: <span className="font-bold text-white">{customerName}</span>
        </p>
        <p className="text-xs text-[#a3a3a3]">
          Vehicle:{" "}
          <span className="font-bold text-white">
            {vehicleName} {plate && `(${plate})`}
          </span>
        </p>
        {invoice && (
          <div className="pt-2 border-t border-[#222] space-y-2">
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Invoice Total:</span>
              <span className="font-mono font-bold text-white">
                {formatCurrency(invoice.total_amount)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Paid to Date:</span>
              <span className="font-mono text-[#22c55e]">
                {formatCurrency(invoice.paid_amount)}
              </span>
            </div>
            <div className="pt-2">
              <Link
                href={`/invoices/${invoice.id}`}
                className="text-xs font-bold text-[#22c55e] hover:underline"
              >
                Open Complete Printable Invoice with EFT Remittance Details →
              </Link>
            </div>
          </div>
        )}
        {!invoice && (
          <div className="pt-3 border-t border-[#222]">
            <p className="text-xs text-neutral-400">
              No tax invoice generated yet for this repair order. Click &quot;Generate Tax Invoice&quot; to issue an official invoice with line item billing and VAT.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
