"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApi, ApiInspection } from "@/lib/api";

export default function InspectionsPage() {
  const api = useApi();
  const [inspections, setInspections] = useState<ApiInspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.inspections.list();
      setInspections(data);
    } catch (err: any) {
      console.error("Failed to load inspections:", err);
      setError(err?.message || "Failed to load inspections from database");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AppShell activeItem="inspections">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="border-b border-[#212121] pb-4">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Vehicle Health Inspections
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
            Multi-point diagnostic checklists, tire/brake wear triage, and customer safety reports.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadData} className="text-xs font-bold underline hover:text-white">
              Retry
            </button>
          </div>
        )}

        {isLoading && (
          <div className="py-12 text-center text-[#737373] text-sm animate-pulse">
            Loading inspections from database...
          </div>
        )}

        {!isLoading && inspections.length === 0 && (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[#262626] p-8 space-y-2">
            <p className="text-base font-bold text-neutral-300">No inspections logged yet</p>
            <p className="text-xs text-[#737373]">
              Inspections are created from active repair orders during vehicle intake.
            </p>
          </div>
        )}

        {!isLoading && inspections.length > 0 && (
          <div className="space-y-3.5">
            {inspections.map((insp) => {
              const items = insp.checklist_items || [];
              const failCount = items.filter((i) => i.status === "fail").length;
              const cautionCount = items.filter((i) => i.status === "caution").length;
              const passCount = items.filter((i) => i.status === "pass").length;

              return (
                <Link
                  key={insp.id}
                  href={`/inspections/${insp.id}`}
                  className="group block rounded-2xl bg-[#141414] border border-[#242424] p-5 hover:border-[#383838] transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded">
                        {insp.inspection_number}
                      </span>
                      <span className="text-xs text-[#737373]">
                        {new Date(insp.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold text-white bg-[#1a1a1a] px-2.5 py-1 rounded uppercase">
                      Status: {insp.status}
                    </span>
                  </div>

                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-[#22c55e] transition-colors">
                        Inspection #{insp.inspection_number}
                      </h2>
                      <p className="text-xs text-[#8c8c8c] mt-0.5">
                        {items.length} checklist items · {insp.damage_pins?.length || 0} damage pins logged
                      </p>
                    </div>

                    {/* Triage Count Badges */}
                    <div className="flex items-center gap-2 text-xs font-bold">
                      {failCount > 0 && (
                        <span className="rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 px-2.5 py-1 text-[#ef4444]">
                          {failCount} Urgent
                        </span>
                      )}
                      {cautionCount > 0 && (
                        <span className="rounded-lg bg-[#f59e0b]/15 border border-[#f59e0b]/30 px-2.5 py-1 text-[#f59e0b]">
                          {cautionCount} Attention
                        </span>
                      )}
                      <span className="rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/30 px-2.5 py-1 text-[#22c55e]">
                        {passCount} Passed
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
