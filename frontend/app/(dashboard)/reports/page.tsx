"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApi } from "@/lib/api/use-api";
import { formatCurrency } from "@/lib/format";
import { type RepairOrderRead } from "@/lib/api/jobs";
import { type ApiInvoice } from "@/lib/api/invoices";

export default function ReportsPage() {
  const api = useApi();
  const [jobs, setJobs] = useState<RepairOrderRead[]>([]);
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([api.jobs.list(), api.invoices.list()])
      .then(([jobsData, invoicesData]) => {
        if (!isMounted) return;
        setJobs(jobsData);
        setInvoices(invoicesData);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load reports data:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [api]);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
  const completedJobsCount = jobs.filter(
    (j) => j.status === "completed" || j.status === "ready"
  ).length;
  const avgTicket = jobs.length > 0 ? totalInvoiced / jobs.length : 0;

  // Aggregate concerns / services from repair orders
  const serviceCounts: Record<string, { count: number; revenue: number }> = {};
  for (const j of jobs) {
    const serviceName = j.customer_concern || "General Vehicle Service";
    if (!serviceCounts[serviceName]) {
      serviceCounts[serviceName] = { count: 0, revenue: 0 };
    }
    serviceCounts[serviceName].count += 1;
    serviceCounts[serviceName].revenue += j.total_amount || 0;
  }

  const topServices = Object.entries(serviceCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const kpis = [
    {
      label: "Total Invoiced",
      value: formatCurrency(totalInvoiced),
      change: `${invoices.length} invoices`,
    },
    {
      label: "Total Collected",
      value: formatCurrency(totalCollected),
      change: `${((totalCollected / (totalInvoiced || 1)) * 100).toFixed(0)}% recovery`,
    },
    {
      label: "Completed Jobs",
      value: `${completedJobsCount}`,
      change: `${jobs.length} total orders`,
    },
    {
      label: "Average Order Value",
      value: formatCurrency(avgTicket),
      change: "Gross ticket",
    },
  ];

  return (
    <AppShell activeItem="reports">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="border-b border-[#212121] pb-5">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Workshop Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#7a7a7a] mt-0.5">
            Gross repair revenue, technician productivity, and repair order metrics.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#737373] text-sm animate-pulse">
            Computing live analytics from database...
          </div>
        ) : (
          <>
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
                Top Services & Work Orders
              </h2>

              {topServices.length === 0 ? (
                <p className="text-xs text-[#737373] py-4 text-center">
                  No repair orders available to calculate top services.
                </p>
              ) : (
                <div className="space-y-3">
                  {topServices.map((rep, i) => (
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
                            {rep.count} repair orders
                          </p>
                        </div>
                      </div>

                      <span className="font-mono text-xs font-black text-white">
                        {formatCurrency(rep.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
