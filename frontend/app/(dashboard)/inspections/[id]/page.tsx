"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MOCK_INSPECTIONS } from "@/lib/mock-data";
import { Inspection, InspectionItemStatus } from "@/lib/types";

export default function InspectionDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const foundInsp =
    MOCK_INSPECTIONS.find(
      (i) => i.id === id || i.roNumber.toLowerCase() === id?.toLowerCase(),
    ) || MOCK_INSPECTIONS[0];

  const [inspection, setInspection] = useState<Inspection>(foundInsp);

  const setItemStatus = (itemId: string, newStatus: InspectionItemStatus) => {
    setInspection({
      ...inspection,
      items: inspection.items.map((it) =>
        it.id === itemId ? { ...it, status: newStatus } : it,
      ),
    });
  };

  const categories = Array.from(
    new Set(inspection.items.map((i) => i.category)),
  );

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
                  {inspection.roNumber}
                </span>
                <span className="font-mono text-xs font-bold text-white bg-[#1a1a1a] px-2 py-0.5 rounded uppercase">
                  {inspection.plate}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                {inspection.vehicleName}
              </h1>
              <p className="text-xs text-[#7a7a7a]">
                Lead Tech: {inspection.technicianName} · Date: {inspection.date}
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
            const items = inspection.items.filter(
              (i) => i.category === category,
            );
            return (
              <div
                key={category}
                className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3"
              >
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#ededed] pb-2 border-b border-[#1f1f1f]">
                  {category}
                </h2>

                <div className="divide-y divide-[#1c1c1c]">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.name}
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
                          onClick={() => setItemStatus(item.id, "good")}
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
                          onClick={() => setItemStatus(item.id, "attention")}
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
                          onClick={() => setItemStatus(item.id, "urgent")}
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
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
