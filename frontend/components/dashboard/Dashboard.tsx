"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  fetchJobs,
  createJob,
  ApiRepairOrder,
} from "@/lib/api/jobs";
import { lookupVehicleByPlate } from "@/lib/api/intake";
import { fetchCustomers, createCustomer, ApiCustomer } from "@/lib/api/customers";
import { fetchVehicles, ApiVehicle } from "@/lib/api/vehicles";
import { createWorkshopWebSocket } from "@/lib/api/ws";
import { formatCurrency } from "@/lib/format";

export type JobStatus =
  | "scheduled"
  | "in-progress"
  | "waiting-parts"
  | "ready"
  | "completed";

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
  "waiting-parts": {
    label: "Waiting for Parts",
    text: "text-[#a78bfa]",
    bg: "bg-[#a78bfa]/10",
    dot: "bg-[#a78bfa]",
    border: "border-[#a78bfa]/20",
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

export function Dashboard() {
  const [jobs, setJobs] = useState<ApiRepairOrder[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [selectedJob, setSelectedJob] = useState<ApiRepairOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<
    "new-job" | "scan-vin" | "new-customer" | "new-appointment" | null
  >(null);

  // Form states for quick actions
  const [newJobForm, setNewJobForm] = useState({
    customerId: "",
    vehicleId: "",
    service: "",
    concern: "",
    estimateHours: "2.0",
  });

  const [newCustForm, setNewCustForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [scanQuery, setScanQuery] = useState("");
  const [scanResult, setScanResult] = useState<{
    found: boolean;
    text: string;
    details?: any;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Load all live data from FastAPI / PostgreSQL
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [jobsData, custList, vehList] = await Promise.all([
        fetchJobs(),
        fetchCustomers().catch(() => [] as ApiCustomer[]),
        fetchVehicles().catch(() => [] as ApiVehicle[]),
      ]);
      setJobs(jobsData);
      setCustomers(custList);
      setVehicles(vehList);

      if (custList.length > 0 && !newJobForm.customerId) {
        setNewJobForm((prev) => ({
          ...prev,
          customerId: custList[0].id,
          vehicleId: vehList.length > 0 ? vehList[0].id : "",
        }));
      }
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
      setError(err?.message || "Failed to load live data from database");
    } finally {
      setIsLoading(false);
    }
  }, [newJobForm.customerId]);

  useEffect(() => {
    loadDashboardData();

    // Connect real-time WebSocket for garage display sync
    const ws = createWorkshopWebSocket(
      "00000000-0000-0000-0000-000000000001",
      (event) => {
        console.log("[WS Dashboard Event]", event);
        if (
          event?.event === "job_created" ||
          event?.event === "job_status_updated" ||
          event?.event === "wip_progress_updated"
        ) {
          loadDashboardData();
        }
      },
      () => {
        // Silently handle WS fallback if backend reconnects
      }
    );

    return () => {
      ws.close();
    };
  }, [loadDashboardData]);

  // Calculated KPI stats from live database rows
  const totalJobs = jobs.length;
  const inProgressCount = jobs.filter((j) => j.status === "wip" || j.status === "in-progress").length;
  const readyCount = jobs.filter((j) => j.status === "due" || j.status === "ready").length;
  const outstandingAmount = jobs.reduce((sum, j) => sum + (j.total_amount || 0), 0);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobForm.customerId || !newJobForm.vehicleId || !newJobForm.concern) return;

    try {
      const hrs = parseFloat(newJobForm.estimateHours) || 2.0;
      await createJob({
        customer_id: newJobForm.customerId,
        vehicle_id: newJobForm.vehicleId,
        customer_concern: newJobForm.concern,
        recommended_work: newJobForm.service || "General Workshop Inspection",
        items: [
          {
            item_type: "labour",
            description: newJobForm.service || "Workshop Labor",
            labour_hours: hrs,
            labour_hourly_rate: 480,
          },
        ],
      });

      setNewJobForm({
        customerId: customers[0]?.id || "",
        vehicleId: vehicles[0]?.id || "",
        service: "",
        concern: "",
        estimateHours: "2.0",
      });
      setActiveModal(null);
      await loadDashboardData();
    } catch (err: any) {
      alert(err?.message || "Failed to create repair order in database");
    }
  };

  const handleScanSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanQuery.trim()) return;

    try {
      setIsScanning(true);
      setScanResult(null);
      const res = await lookupVehicleByPlate(scanQuery);
      setScanResult({
        found: true,
        text: `✓ Verified: ${res.vehicle.year} ${res.vehicle.make} ${res.vehicle.model} (Plate: ${res.vehicle.license_plate}) — Owner: ${res.customer.name}`,
        details: res,
      });
    } catch (err: any) {
      setScanResult({
        found: false,
        text: `Vehicle with plate "${scanQuery.toUpperCase()}" not found in workshop directory.`,
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleCreateCustomerQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustForm.name.trim() || !newCustForm.phone.trim()) return;

    try {
      const parts = newCustForm.name.trim().split(" ");
      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ") || "Customer";

      await createCustomer({
        first_name: firstName,
        last_name: lastName,
        phone: newCustForm.phone.trim(),
        email: newCustForm.email.trim() || undefined,
      });

      setNewCustForm({ name: "", phone: "", email: "" });
      setActiveModal(null);
      await loadDashboardData();
    } catch (err: any) {
      alert(err?.message || "Failed to add customer");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#22c55e] selection:text-black">
      {/* ─── Main Workshop Dashboard Content ──────────────────────── */}
      <main className="mx-auto max-w-xl sm:max-w-2xl px-4 py-6 space-y-6 pb-24 safe-inset-bottom">
        {/* Header Greeting */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>MechanicMate Garage</span>
              <span className="text-2xl">🔧</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
              Live Database Connected · Neon PostgreSQL
            </p>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => loadDashboardData()}
            title="Refresh Live Data"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#141414] border border-[#262626] text-[#a3a3a3] hover:text-[#22c55e] transition-colors"
          >
            <svg
              className={`h-4 w-4 ${isLoading ? "animate-spin text-[#22c55e]" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => loadDashboardData()}
              className="font-bold underline hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* ─── 4 Summary Metric Cards (2x2 Grid) ───────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Card 1: Today's Jobs */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#141414] border border-[#242424] p-4 shadow-sm">
            <span className="text-[11px] font-bold tracking-wider text-[#737373] uppercase">
              TOTAL ROs
            </span>
            <div className="my-2">
              <span className="font-black text-3xl sm:text-4xl text-[#38bdf8] mono">
                {totalJobs}
              </span>
            </div>
            <span className="text-xs font-medium text-[#7a7a7a]">
              {inProgressCount} in progress
            </span>
          </div>

          {/* Card 2: In Progress */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#141414] border border-[#242424] p-4 shadow-sm">
            <span className="text-[11px] font-bold tracking-wider text-[#737373] uppercase">
              IN PROGRESS
            </span>
            <div className="my-2">
              <span className="font-black text-3xl sm:text-4xl text-[#f59e0b] mono">
                {inProgressCount}
              </span>
            </div>
            <span className="text-xs font-medium text-[#7a7a7a]">
              Active in workshop bays
            </span>
          </div>

          {/* Card 3: Ready for Pickup */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#141414] border border-[#242424] p-4 shadow-sm">
            <span className="text-[11px] font-bold tracking-wider text-[#737373] uppercase">
              READY FOR PICKUP
            </span>
            <div className="my-2">
              <span className="font-black text-3xl sm:text-4xl text-[#22c55e] mono">
                {readyCount}
              </span>
            </div>
            <span className="text-xs font-medium text-[#7a7a7a]">
              Work completed
            </span>
          </div>

          {/* Card 4: Outstanding */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#141414] border border-[#242424] p-4 shadow-sm">
            <span className="text-[11px] font-bold tracking-wider text-[#737373] uppercase">
              FLEET / RO PIPELINE
            </span>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className="font-black text-xl sm:text-2xl text-[#22c55e] mono">
                {formatCurrency(outstandingAmount)}
              </span>
            </div>
            <span className="text-xs font-medium text-[#7a7a7a]">
              {vehicles.length} registered vehicles
            </span>
          </div>
        </div>

        {/* ─── QUICK ACTIONS Section ──────────────────────────────── */}
        <div className="space-y-3 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
            QUICK ACTIONS
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {/* Action 1: New Repair Order (Green) */}
            <button
              onClick={() => setActiveModal("new-job")}
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#0e2014] border border-[#1b3d24] px-4 py-3.5 text-sm font-bold text-[#22c55e] shadow-sm transition-all duration-150 hover:bg-[#132c1c] active:scale-[0.98] min-h-[48px] select-none touch-manipulation"
            >
              <span className="text-base font-extrabold">+</span>
              <span>New Repair Order</span>
            </button>

            {/* Action 2: Scan VIN / License Plate (Cyan) */}
            <button
              onClick={() => {
                setScanResult(null);
                setScanQuery("");
                setActiveModal("scan-vin");
              }}
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#0c1824] border border-[#173650] px-4 py-3.5 text-sm font-bold text-[#38bdf8] shadow-sm transition-all duration-150 hover:bg-[#112436] active:scale-[0.98] min-h-[48px] select-none touch-manipulation"
            >
              <svg
                className="h-4 w-4 text-[#38bdf8]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              </svg>
              <span>Scan / Plate Lookup</span>
            </button>

            {/* Action 3: New Customer (Purple) */}
            <button
              onClick={() => setActiveModal("new-customer")}
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#181324] border border-[#2f224a] px-4 py-3.5 text-sm font-bold text-[#a78bfa] shadow-sm transition-all duration-150 hover:bg-[#231a36] active:scale-[0.98] min-h-[48px] select-none touch-manipulation"
            >
              <span className="text-base font-extrabold">+</span>
              <span>New Customer</span>
            </button>

            {/* Action 4: Fleet Directory (Amber) */}
            <Link
              href="/vehicles"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#1f160a] border border-[#422e11] px-4 py-3.5 text-sm font-bold text-[#f59e0b] shadow-sm transition-all duration-150 hover:bg-[#2d200d] active:scale-[0.98] min-h-[48px] select-none touch-manipulation"
            >
              <span>🚗 View Fleet Registry</span>
            </Link>
          </div>
        </div>

        {/* ─── Today's Repair Orders ──────────────────────────────── */}
        <div className="space-y-3 pt-2">
          {/* Section Header with count badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white tracking-tight">
                Active Repair Orders
              </h2>
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#212121] text-[11px] font-bold text-[#8a8a8a] mono">
                {jobs.length}
              </span>
            </div>
            <Link href="/jobs" className="text-xs text-[#22c55e] font-semibold hover:underline">
              View All ROs →
            </Link>
          </div>

          {/* List of Repair Order Cards */}
          {jobs.length === 0 ? (
            <div className="rounded-2xl bg-[#141414] border border-dashed border-[#242424] p-10 text-center space-y-3">
              <p className="text-sm font-bold text-neutral-300">No active repair orders in database</p>
              <p className="text-xs text-[#737373]">
                Click "+ New Repair Order" above to log a vehicle into the workshop.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.created;
                const customerName = job.customer?.name || "Client";
                const plate = job.vehicle?.license_plate || "PLATE";
                const vehicleName = job.vehicle
                  ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`
                  : "Vehicle";

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="group relative cursor-pointer rounded-2xl bg-[#141414] border border-[#242424] p-4 transition-all duration-150 hover:border-[#383838] hover:bg-[#181818] active:scale-[0.99] shadow-sm touch-manipulation"
                  >
                    {/* Top Row: RO# + Status Badge */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#1f1f1f]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-md border border-[#22c55e]/20">
                          {job.ro_number}
                        </span>
                        <span className="text-xs font-medium text-[#737373]">
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Status Pill */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.text} ${statusCfg.bg} border ${statusCfg.border}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`}
                        />
                        {statusCfg.label} ({job.completion_percentage}%)
                      </span>
                    </div>

                    {/* Middle Row: Customer & Vehicle Specs */}
                    <div className="pt-3 pb-2 flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#22c55e] transition-colors">
                          {customerName}
                        </h3>
                        <p className="text-xs text-[#8c8c8c] mt-0.5">
                          {vehicleName}
                        </p>
                      </div>

                      {/* License Plate Badge */}
                      <div className="shrink-0 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-1">
                        <span className="font-mono text-xs font-bold text-[#ededed] tracking-wider uppercase">
                          {plate}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Service Title & Estimated Total */}
                    <div className="pt-2 flex items-center justify-between border-t border-[#1a1a1a] text-xs">
                      <span className="text-[#737373] truncate max-w-[200px] sm:max-w-xs">
                        {job.recommended_work || job.customer_concern}
                      </span>
                      <span className="font-mono font-black text-sm text-[#ededed]">
                        {formatCurrency(job.total_amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ─── MODAL 1: Job Detail Inspection & Invoice Sheet ───────── */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm safe-inset-top safe-inset-bottom">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#121212] border border-[#2a2a2a] p-6 shadow-2xl space-y-5 custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#212121] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-md">
                    {selectedJob.ro_number}
                  </span>
                  <span className="text-xs text-[#737373]">
                    {new Date(selectedJob.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {selectedJob.customer?.name || "Client"}
                </h2>
                <p className="text-xs text-[#8a8a8a]">
                  {selectedJob.vehicle
                    ? `${selectedJob.vehicle.year} ${selectedJob.vehicle.make} ${selectedJob.vehicle.model} (${selectedJob.vehicle.license_plate})`
                    : "Vehicle details"}
                </p>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1c1c1c] text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Concern & Diagnosis */}
            <div className="rounded-xl bg-[#181818] border border-[#262626] p-4 space-y-2 text-xs">
              <div>
                <span className="font-bold text-[#737373] uppercase tracking-wider block">
                  Customer Concern:
                </span>
                <p className="text-white mt-0.5">{selectedJob.customer_concern}</p>
              </div>
              <div>
                <span className="font-bold text-[#737373] uppercase tracking-wider block">
                  Technician Diagnosis / Work:
                </span>
                <p className="text-[#a3a3a3] mt-0.5">
                  {selectedJob.recommended_work || selectedJob.diagnosis || "Pending assessment."}
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Itemized Line Items
              </h3>

              <div className="rounded-xl bg-[#161616] border border-[#222222] divide-y divide-[#1f1f1f] text-xs">
                {selectedJob.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <span className="text-neutral-300">
                      {it.description} ({it.item_type})
                    </span>
                    <span className="font-mono text-white">
                      {formatCurrency(it.total_price)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Row */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#272727]">
                <span className="text-sm font-bold text-white">
                  Grand Total:
                </span>
                <span className="font-mono font-extrabold text-base text-[#22c55e]">
                  {formatCurrency(selectedJob.total_amount)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                href={`/jobs/${selectedJob.id}`}
                className="flex-1 min-h-[46px] inline-flex items-center justify-center rounded-xl bg-[#212121] border border-[#333] text-sm font-bold text-white hover:bg-[#282828]"
              >
                Open Full RO
              </Link>
              <button
                onClick={() => setSelectedJob(null)}
                className="flex-1 min-h-[46px] rounded-xl bg-[#22c55e] text-sm font-bold text-black hover:bg-[#16a34a]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: New Repair Order Modal ────────────────────── */}
      {activeModal === "new-job" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm safe-inset-top safe-inset-bottom">
          <div className="relative w-full max-w-md rounded-3xl bg-[#121212] border border-[#2a2a2a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212121] pb-3">
              <h2 className="text-lg font-bold text-white">
                Create New Repair Order
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#888] block mb-1">
                  Customer Assignment *
                </label>
                <select
                  required
                  value={newJobForm.customerId}
                  onChange={(e) =>
                    setNewJobForm({ ...newJobForm, customerId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#888] block mb-1">
                  Vehicle Selection *
                </label>
                <select
                  required
                  value={newJobForm.vehicleId}
                  onChange={(e) =>
                    setNewJobForm({ ...newJobForm, vehicleId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white focus:outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.license_plate} — {v.year} {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#888] block mb-1">
                  Recommended Service *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brake Replacement & Skimming"
                  value={newJobForm.service}
                  onChange={(e) =>
                    setNewJobForm({ ...newJobForm, service: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#888] block mb-1">
                  Customer Concern Description *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Grinding noise when braking"
                  value={newJobForm.concern}
                  onChange={(e) =>
                    setNewJobForm({ ...newJobForm, concern: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-3 rounded-xl bg-[#1c1c1c] text-sm font-bold text-white hover:bg-[#252525]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#22c55e] text-sm font-bold text-black hover:bg-[#16a34a]"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Scan VIN / License Plate Modal ─────────────── */}
      {activeModal === "scan-vin" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm safe-inset-top safe-inset-bottom">
          <div className="relative w-full max-w-md rounded-3xl bg-[#121212] border border-[#2a2a2a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212121] pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-[#38bdf8]">⛶</span> Vehicle Intake Lookup
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8c8c8c]">
              Enter registration plate to perform instant &lt;15ms indexed database lookup.
            </p>

            <form onSubmit={handleScanSearch} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. SARAH-GP or AEF 7756"
                value={scanQuery}
                onChange={(e) => setScanQuery(e.target.value)}
                className="w-full font-mono uppercase text-center text-lg tracking-widest px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={isScanning}
                className="w-full py-3 rounded-xl bg-[#38bdf8] text-sm font-bold text-black hover:bg-[#0284c7] disabled:opacity-50"
              >
                {isScanning ? "Querying Database..." : "Lookup Vehicle in Neon"}
              </button>
            </form>

            {scanResult && (
              <div
                className={`rounded-xl border p-3 text-xs ${
                  scanResult.found
                    ? "bg-[#0e1e2c] border-[#1b4363] text-[#7dd3fc]"
                    : "bg-red-950/40 border-red-800/50 text-red-300"
                }`}
              >
                {scanResult.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 4: New Customer Modal ────────────────────────── */}
      {activeModal === "new-customer" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm safe-inset-top safe-inset-bottom">
          <div className="relative w-full max-w-md rounded-3xl bg-[#121212] border border-[#2a2a2a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212121] pb-3">
              <h2 className="text-lg font-bold text-white">Add Customer to Database</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomerQuick} className="space-y-3">
              <input
                type="text"
                placeholder="Full Name (e.g. Sipho Sithole)"
                required
                value={newCustForm.name}
                onChange={(e) =>
                  setNewCustForm({ ...newCustForm, name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white focus:outline-none"
              />
              <input
                type="tel"
                placeholder="Mobile Number (e.g. +27 82 123 4567)"
                required
                value={newCustForm.phone}
                onChange={(e) =>
                  setNewCustForm({ ...newCustForm, phone: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email Address (optional)"
                value={newCustForm.email}
                onChange={(e) =>
                  setNewCustForm({ ...newCustForm, email: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#a78bfa] text-sm font-bold text-black hover:bg-[#8b5cf6]"
              >
                Save to Neon DB
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
