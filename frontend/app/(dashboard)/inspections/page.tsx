"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MOCK_INSPECTIONS } from "@/lib/mock-data";

export default function InspectionsPage() {
  return (
    <AppShell activeItem="inspections">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="border-b border-[#212121] pb-4">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Vehicle Health Inspections
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
            Multi-point diagnostic checklists, tire/brake wear triage, and
            customer safety reports.
          </p>
        </div>

        <div className="space-y-3.5">
          {MOCK_INSPECTIONS.map((insp) => {
            const urgentCount = insp.items.filter(
              (i) => i.status === "urgent",
            ).length;
            const attentionCount = insp.items.filter(
              (i) => i.status === "attention",
            ).length;
            const goodCount = insp.items.filter(
              (i) => i.status === "good",
            ).length;

            return (
              <Link
                key={insp.id}
                href={`/inspections/${insp.id}`}
                className="group block rounded-2xl bg-[#141414] border border-[#242424] p-5 hover:border-[#383838] transition-all shadow-sm"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded">
                      {insp.roNumber}
                    </span>
                    <span className="text-xs text-[#737373]">{insp.date}</span>
                  </div>

                  <span className="text-xs font-mono font-bold text-white bg-[#1a1a1a] px-2.5 py-1 rounded uppercase">
                    {insp.plate}
                  </span>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-white group-hover:text-[#22c55e] transition-colors">
                      {insp.vehicleName}
                    </h2>
                    <p className="text-xs text-[#8c8c8c] mt-0.5">
                      Inspected by: {insp.technicianName}
                    </p>
                  </div>

                  {/* Triage Count Badges */}
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {urgentCount > 0 && (
                      <span className="rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 px-2.5 py-1 text-[#ef4444]">
                        {urgentCount} Urgent
                      </span>
                    )}
                    {attentionCount > 0 && (
                      <span className="rounded-lg bg-[#f59e0b]/15 border border-[#f59e0b]/30 px-2.5 py-1 text-[#f59e0b]">
                        {attentionCount} Attention
                      </span>
                    )}
                    <span className="rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/30 px-2.5 py-1 text-[#22c55e]">
                      {goodCount} Passed
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
