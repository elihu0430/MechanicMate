"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MOCK_REPAIR_ORDERS, formatCurrency } from "@/lib/mock-data";
import { JobStatus, RepairOrder } from "@/lib/types";

const STATUS_FILTERS: { id: "all" | JobStatus; label: string }[] = [
  { id: "all", label: "All ROs" },
  { id: "in-progress", label: "In Progress" },
  { id: "waiting-parts", label: "Waiting Parts" },
  { id: "ready", label: "Ready for Pickup" },
  { id: "scheduled", label: "Scheduled" },
  { id: "completed", label: "Completed" },
];

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; text: string; bg: string; dot: string; border: string }
> = {
  scheduled: {
    label: "Scheduled",
    text: "text-[#38bdf8]",
    bg: "bg-[#38bdf8]/10",
    dot: "bg-[#38bdf8]",
    border: "border-[#38bdf8]/20",
  },
  "in-progress": {
    label: "In Progress",
    text: "text-[#f59e0b]",
    bg: "bg-[#f59e0b]/10",
    dot: "bg-[#f59e0b]",
    border: "border-[#f59e0b]/20",
  },
  "waiting-parts": {
    label: "Waiting for Parts",
    text: "text-[#a78bfa]",
    bg: "bg-[#a78bfa]/10",
    dot: "bg-[#a78bfa]",
    border: "border-[#a78bfa]/20",
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | JobStatus>("all");

  const filteredJobs = MOCK_REPAIR_ORDERS.filter((job) => {
    const matchesFilter = filter === "all" || job.status === filter;
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      job.roNumber.toLowerCase().includes(query) ||
      job.customerName.toLowerCase().includes(query) ||
      job.licensePlate.toLowerCase().includes(query) ||
      job.vehicleModel.toLowerCase().includes(query) ||
      job.service.toLowerCase().includes(query);

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
              Active workshop bay jobs, diagnostics, and service estimates.
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
            placeholder="Search by RO#, customer name, plate (e.g. ABC 1234 GP)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#141414] border border-[#262626] text-sm text-white placeholder:text-[#555] focus:border-[#22c55e] focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs (Horizontal Scrollable on Mobile) */}
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

        {/* Jobs List */}
        <div className="space-y-3.5">
          {filteredJobs.length === 0 ? (
            <div className="rounded-2xl bg-[#141414] border border-[#242424] p-8 text-center text-[#737373] text-sm">
              No repair orders matching your filter criteria.
            </div>
          ) : (
            filteredJobs.map((job) => {
              const statusCfg = STATUS_CONFIG[job.status];
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
                        {job.roNumber}
                      </span>
                      <span className="text-xs text-[#737373] font-medium">
                        {job.date} · {job.appointmentTime}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.text} ${statusCfg.bg} border ${statusCfg.border}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`}
                      />
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Customer & Vehicle Info */}
                  <div className="pt-3.5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-[#22c55e] transition-colors">
                        {job.customerName}
                      </h2>
                      <p className="text-xs text-[#8e8e8e] mt-0.5">
                        {job.vehicleYear} {job.vehicleMake} {job.vehicleModel}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#ededed] bg-[#1a1a1a] border border-[#282828] px-2.5 py-1 rounded-lg tracking-wider uppercase">
                        {job.licensePlate}
                      </span>
                      <span className="font-mono text-base font-black text-[#22c55e]">
                        {formatCurrency(job.estimateTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Service Concern */}
                  <p className="text-xs text-[#737373] line-clamp-1 mt-1">
                    <span className="text-neutral-400 font-semibold">
                      {job.service}:
                    </span>{" "}
                    {job.concern}
                  </p>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
