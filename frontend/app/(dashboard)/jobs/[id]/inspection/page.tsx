"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MOCK_INSPECTIONS, MOCK_REPAIR_ORDERS } from "@/lib/mock-data";

export default function JobInspectionSubPage() {
  const params = useParams();
  const id = params?.id as string;

  const job =
    MOCK_REPAIR_ORDERS.find(
      (j) => j.id === id || j.roNumber.toLowerCase() === id?.toLowerCase(),
    ) || MOCK_REPAIR_ORDERS[0];

  const inspection = MOCK_INSPECTIONS[0];
  const [items, setItems] = useState(inspection.items);

  const setItemStatus = (
    itemId: string,
    status: "good" | "attention" | "urgent",
  ) => {
    setItems(items.map((it) => (it.id === itemId ? { ...it, status } : it)));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#212121] pb-5">
        <div>
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white mb-1 transition-colors"
          >
            <span>← Back to {job.roNumber}</span>
          </Link>
          <h1 className="text-2xl font-black text-white">
            Vehicle Health Inspection
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            {job.vehicleYear} {job.vehicleMake} {job.vehicleModel} &bull; Plate:{" "}
            {job.licensePlate}
          </p>
        </div>

        <Link
          href={`/inspections/${inspection.id}`}
          className="rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a] self-start sm:self-auto"
        >
          📄 View Printable Report
        </Link>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl bg-[#141414] border border-[#242424] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[#737373]">
                {item.category}
              </span>
              <p className="text-sm font-bold text-white">{item.name}</p>
              {item.notes && (
                <p className="text-xs text-[#8a8a8a]">{item.notes}</p>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-[#1a1a1a] p-1 rounded-xl border border-[#262626]">
              <button
                onClick={() => setItemStatus(item.id, "good")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  item.status === "good"
                    ? "bg-[#22c55e] text-black"
                    : "text-[#737373]"
                }`}
              >
                Good
              </button>
              <button
                onClick={() => setItemStatus(item.id, "attention")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  item.status === "attention"
                    ? "bg-[#f59e0b] text-black"
                    : "text-[#737373]"
                }`}
              >
                Attention
              </button>
              <button
                onClick={() => setItemStatus(item.id, "urgent")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  item.status === "urgent"
                    ? "bg-[#ef4444] text-white"
                    : "text-[#737373]"
                }`}
              >
                Urgent
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
