"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MOCK_INVOICES, MOCK_REPAIR_ORDERS } from "@/lib/mock-data";

export default function JobInvoiceSubPage() {
  const params = useParams();
  const id = params?.id as string;

  const matchedInv =
    MOCK_INVOICES.find((inv) => inv.roId === id || inv.roNumber === id) ||
    MOCK_INVOICES[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#212121] pb-5">
        <div>
          <Link
            href={`/jobs/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white mb-1 transition-colors"
          >
            <span>← Back to Job {id}</span>
          </Link>
          <h1 className="text-2xl font-black text-white">Invoice Settlement</h1>
          <p className="text-xs text-[#737373]">
            Associated with Tax Invoice {matchedInv.invoiceNumber}
          </p>
        </div>

        <Link
          href={`/invoices/${matchedInv.id}`}
          className="rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a]"
        >
          📄 View Full Tax Invoice (A4)
        </Link>
      </div>

      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3">
        <p className="text-xs text-[#a3a3a3]">
          Customer:{" "}
          <span className="font-bold text-white">
            {matchedInv.customerName}
          </span>
        </p>
        <p className="text-xs text-[#a3a3a3]">
          Vehicle:{" "}
          <span className="font-bold text-white">
            {matchedInv.vehicleName} ({matchedInv.licensePlate})
          </span>
        </p>
        <div className="pt-2 border-t border-[#222]">
          <Link
            href={`/invoices/${matchedInv.id}`}
            className="text-xs font-bold text-[#22c55e] hover:underline"
          >
            Open Complete Printable Invoice with EFT Remittance Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
