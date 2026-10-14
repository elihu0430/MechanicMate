"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApi, ApiRepairOrder } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

const STATUS_FILTERS = [
  { id: "all", label: "All ROs" },
  { id: "wip", label: "In Progress (WIP)" },
  { id: "created", label: "Scheduled / Created" },
  { id: "due", label: "Ready for Pickup" },
  { id: "completed", label: "Completed" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; text: string; bg: string; dot: string; border: string }
> = {
  created: {
    label: "Scheduled",
    text: "text-[#38bdf8]",
    bg: "bg-[#38bdf8]/10",
    dot: "bg-[#38bdf8]",
    border: "border-[#38bdf8]/20",
  },
  scheduled: {
    label: "Scheduled",
    text: "text-[#38bdf8]",
    bg: "bg-[#38bdf8]/10",
    dot: "bg-[#38bdf8]",
    border: "border-[#38bdf8]/20",
  },
  wip: {
    label: "In Progress",
    text: "text-[#f59e0b]",
    bg: "bg-[#f59e0b]/10",
    dot: "bg-[#f59e0b]",
    border: "border-[#f59e0b]/20",
  },
  "in-progress": {
    label: "In Progress",
    text: "text-[#f59e0b]",
    bg: "bg-[#f59e0b]/10",
    dot: "bg-[#f59e0b]",
    border: "border-[#f59e0b]/20",
  },
  due: {
    label: "Ready for Pickup",
    text: "text-[#22c55e]",
    bg: "bg-[#22c55e]/10",
    dot: "bg-[#22c55e]",
    border: "border-[#22c55e]/20",
  },
  ready: {
    label: "Ready for Pickup",
    text: "text-[#22c55e]",
    bg: "bg-[#22c55e]/10",
    dot: "bg-[#22c55e]",
    border: "border-[#22c55e]/20",
  },
  completed: {
    label: "Completed",
    text: "text-neutral-400",
    bg: "bg-neutral-800/40",
    dot: "bg-neutral-400",
    border: "border-neutral-700/40",
  },
};

export default function JobsPage() {
  const api = useApi();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [jobs, setJobs] = useState<ApiRepairOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const statusParam = filter !== "all" ? filter : undefined;
      const data = await api.jobs.list(statusParam);
      setJobs(data);
    } catch (err: any) {
      console.error("Failed to load jobs:", err);
      setError(err?.message || "Failed to load repair orders from database");
    } finally {
      setIsLoading(false);
    }
  }, [api, filter]);

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filteredJobs = jobs.filter((job) => {
    const matchesFilter = filter === "all" || job.status === filter;
    const query = search.toLowerCase();
    const customerName = job.customer?.name?.toLowerCase() || "";
    const plate = job.vehicle?.license_plate?.toLowerCase() || "";
    const vehicleName = `${job.vehicle?.make || ""} ${job.vehicle?.model || ""}`.toLowerCase();
    const matchesSearch =
      !query ||
      job.ro_number.toLowerCase().includes(query) ||
      customerName.includes(query) ||
      plate.includes(query) ||
      vehicleName.includes(query) ||
      (job.recommended_work && job.recommended_work.toLowerCase().includes(query)) ||
      (job.customer_concern && job.customer_concern.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  return (
    <AppShell activeItem="jobs">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Header Title & New Job CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Repair Orders
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
              Live workshop bay jobs, diagnostics, and service estimates.
            </p>
          </div>

          <Link
            href="/jobs/new"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#22c55e] px-4 py-2.5 text-sm font-bold text-black shadow-md shadow-emerald-950/20 hover:bg-[#16a34a] active:scale-95 transition-all select-none self-start sm:self-auto"
          >
            <span className="text-base font-extrabold">+</span>
            <span>New Repair Order</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#737373]">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by RO#, customer name, plate (e.g. SARAH-GP)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#141414] border border-[#262626] text-sm text-white placeholder:text-[#555] focus:border-[#22c55e] focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {STATUS_FILTERS.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[38px] select-none touch-manipulation ${
                  active
                    ? "bg-[#22c55e] text-black shadow-md"
                    : "bg-[#141414] text-[#8e8e8e] border border-[#242424] hover:border-[#383838] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadJobs} className="text-xs font-bold underline hover:text-white">
              Retry
            </button>
          </div>
        )}

        {isLoading && (
          <div className="py-12 text-center text-[#737373] text-sm animate-pulse">
            Loading repair orders from database...
          </div>
        )}

        {/* Jobs List */}
        {!isLoading && filteredJobs.length === 0 ? (
          <div className="rounded-2xl bg-[#141414] border border-dashed border-[#242424] p-12 text-center space-y-3">
            <p className="text-base font-bold text-neutral-300">No repair orders in database</p>
            <p className="text-xs text-[#737373]">
              Create a new repair order to book a vehicle into a workshop bay.
            </p>
            <Link
              href="/jobs/new"
              className="inline-block mt-2 rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a]"
            >
              + Create Repair Order
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredJobs.map((job) => {
              const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.created;
              const customerName = job.customer?.name || "Client";
              const vehicleDisplay = job.vehicle
                ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`
                : "Vehicle";
              const plate = job.vehicle?.license_plate || "PLATE";

              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group block rounded-2xl bg-[#141414] border border-[#242424] p-4 sm:p-5 transition-all duration-150 hover:border-[#383838] hover:bg-[#181818] active:scale-[0.99] shadow-sm"
                >
                  {/* Top Bar: RO# + Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-black text-[#22c55e] bg-[#22c55e]/10 px-2.5 py-1 rounded-md border border-[#22c55e]/25">
                        {job.ro_number}
                      </span>
                      <span className="text-xs text-[#737373] font-medium">
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.text} ${statusCfg.bg} border ${statusCfg.border}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label} ({job.completion_percentage}%)
                    </span>
                  </div>

                  {/* Customer & Vehicle Info */}
                  <div className="pt-3.5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-[#22c55e] transition-colors">
                        {customerName}
                      </h2>
                      <p className="text-xs text-[#8e8e8e] mt-0.5">
                        {vehicleDisplay}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#ededed] bg-[#1a1a1a] border border-[#282828] px-2.5 py-1 rounded-lg tracking-wider uppercase">
                        {plate}
                      </span>
                      <span className="font-mono text-base font-black text-[#22c55e]">
                        {formatCurrency(job.total_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Service Concern */}
                  <p className="text-xs text-[#737373] line-clamp-1 mt-1">
                    <span className="text-neutral-400 font-semibold">
                      {job.recommended_work || "Service"}:
                    </span>{" "}
                    {job.customer_concern}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
