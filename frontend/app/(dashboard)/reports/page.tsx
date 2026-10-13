"use client";

import React from "react";
import { formatCurrency } from "@/lib/mock-data";

export default function ReportsPage() {
  const kpis = [
    {
      label: "September Revenue",
      value: "R 84,250",
      change: "+14.2% vs Aug",
      positive: true,
    },
    {
      label: "Average Repair Order",
      value: "R 3,820",
      change: "+5.1%",
      positive: true,
    },
    {
      label: "Bays Utilization",
      value: "88.4%",
      change: "+3.2%",
      positive: true,
    },
    {
      label: "Parts Markup Margin",
      value: "32.5%",
      change: "Target: 30%",
      positive: true,
    },
  ];

  const topRepairs = [
    { name: "Brake Pads & Rotor Overhaul", count: 28, revenue: "R 42,600" },
    { name: "60k / 90k Major Routine Service", count: 24, revenue: "R 38,400" },
    { name: "Timing Chain / Belt Replacement", count: 8, revenue: "R 36,800" },
    {
      name: "Clutch Kit & Flywheel Replacement",
      count: 6,
      revenue: "R 28,200",
    },
    { name: "Suspension Bushings & Struts", count: 11, revenue: "R 21,500" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="border-b border-[#212121] pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Workshop Analytics & Reports
        </h1>
        <p className="text-xs sm:text-sm text-[#7a7a7a] mt-0.5">
          Gross repair revenue, technician productivity, parts profit margins,
          and bay throughput.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-[#141414] border border-[#242424] p-4 flex flex-col justify-between space-y-2"
          >
            <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider">
              {kpi.label}
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-white">
              {kpi.value}
            </span>
            <span className="text-[11px] font-bold text-[#22c55e]">
              {kpi.change}
            </span>
          </div>
        ))}
      </div>

      {/* Top Repair Categories */}
      <div className="rounded-3xl bg-[#141414] border border-[#242424] p-5 space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#a3a3a3]">
          Top Revenue Services (This Month)
        </h2>

        <div className="space-y-3">
          {topRepairs.map((rep, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#242424]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#22c55e]/10 text-[#22c55e] font-mono text-xs font-bold">
                  #{i + 1}
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{rep.name}</p>
                  <p className="text-[11px] text-[#737373]">
                    {rep.count} completed jobs
                  </p>
                </div>
              </div>

              <span className="font-mono text-xs font-black text-white">
                {rep.revenue}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
