"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";

export type JobStatus =
  | "scheduled"
  | "in-progress"
  | "waiting-parts"
  | "ready"
  | "completed";

export interface Job {
  id: string;
  roNumber: string;
  customerName: string;
  customerPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  licensePlate: string;
  vin: string;
  status: JobStatus;
  service: string;
  concern: string;
  diagnosis: string;
  appointmentTime: string;
  estimate: number;
  parts: { name: string; qty: number; unitPrice: number }[];
  labor: { description: string; hours: number; rate: number }[];
}

const INITIAL_JOBS: Job[] = [
  {
    id: "j1",
    roNumber: "RO-1048",
    customerName: "John Smith",
    customerPhone: "071 234 5678",
    vehicleMake: "Toyota",
    vehicleModel: "Corolla",
    vehicleYear: 2018,
    licensePlate: "ABC 1234 GP",
    vin: "JTDBU4EE2A9074318",
    status: "in-progress",
    service: "Brake Replacement",
    concern:
      "Grinding noise from front brakes when stopping. Pedal feels soft.",
    diagnosis:
      "Worn front brake pads (15% left). Warped rotors. Low brake fluid.",
    appointmentTime: "10:30 AM",
    estimate: 3420,
    parts: [
      { name: "Front Brake Pads Set (Ferodo)", qty: 1, unitPrice: 650 },
      { name: "Front Disc Rotors Pair (Brembo)", qty: 1, unitPrice: 1200 },
      { name: "Brake Fluid DOT4 (500ml)", qty: 2, unitPrice: 85 },
    ],
    labor: [
      {
        description: "Front & Rear brake pad/rotor replacement",
        hours: 2.5,
        rate: 480,
      },
    ],
  },
  {
    id: "j2",
    roNumber: "RO-1047",
    customerName: "Amahle Nkosi",
    customerPhone: "083 456 7890",
    vehicleMake: "Volkswagen",
    vehicleModel: "Polo",
    vehicleYear: 2021,
    licensePlate: "CA 456 MP",
    vin: "WVWZZZ9NZMT000123",
    status: "waiting-parts",
    service: "Clutch Kit Replacement",
    concern: "Clutch slipping on acceleration, high engagement point.",
    diagnosis: "Friction disc worn to rivets. Pressure plate heat spots.",
    appointmentTime: "09:00 AM",
    estimate: 5540,
    parts: [
      { name: "OEM 3-piece Clutch Kit (Sachs)", qty: 1, unitPrice: 3200 },
      { name: "Concentric Slave Cylinder", qty: 1, unitPrice: 420 },
    ],
    labor: [
      {
        description: "Gearbox removal & clutch installation",
        hours: 4.0,
        rate: 480,
      },
    ],
  },
  {
    id: "j3",
    roNumber: "RO-1046",
    customerName: "Thabo Dlamini",
    customerPhone: "076 987 6543",
    vehicleMake: "Ford",
    vehicleModel: "Ranger 2.2 TDCi",
    vehicleYear: 2017,
    licensePlate: "XY 789 GP",
    vin: "1FTZR15E7XPA00001",
    status: "scheduled",
    service: "60,000 km Major Service",
    concern: "Scheduled maintenance interval.",
    diagnosis: "Scheduled fluid, oil, fuel and air filter replacements.",
    appointmentTime: "02:00 PM",
    estimate: 1720,
    parts: [
      { name: "Castrol 5W-30 Full Synthetic (6L)", qty: 1, unitPrice: 560 },
      { name: "Oil, Air & Fuel Filter Service Pack", qty: 1, unitPrice: 380 },
    ],
    labor: [
      {
        description: "Major multi-point safety & fluid service",
        hours: 1.5,
        rate: 480,
      },
    ],
  },
  {
    id: "j4",
    roNumber: "RO-1045",
    customerName: "Sipho Mahlangu",
    customerPhone: "082 111 2233",
    vehicleMake: "BMW",
    vehicleModel: "320i F30",
    vehicleYear: 2015,
    licensePlate: "GP 112 BMW",
    vin: "WBA8E9G59GNT12345",
    status: "ready",
    service: "Timing Chain & Water Pump",
    concern: "Rattling noise on cold start. Coolant warning lamp illuminated.",
    diagnosis: "Elongated timing chain guides. Water pump impeller leakage.",
    appointmentTime: "08:00 AM",
    estimate: 9040,
    parts: [
      { name: "Complete Timing Chain Kit & Guides", qty: 1, unitPrice: 3800 },
      { name: "Water Pump & Thermostat Housing", qty: 1, unitPrice: 1200 },
      { name: "BMW Coolant Concentrate (5L)", qty: 2, unitPrice: 160 },
    ],
    labor: [
      {
        description: "Engine timing overhaul & cooling system bleed",
        hours: 6.0,
        rate: 480,
      },
    ],
  },
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

export function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeModal, setActiveModal] = useState<
    "new-job" | "scan-vin" | "new-customer" | "new-appointment" | null
  >(null);

  // Form states for quick actions
  const [newJobForm, setNewJobForm] = useState({
    customer: "",
    plate: "",
    service: "",
    estimate: "",
  });

  const [scanQuery, setScanQuery] = useState("");
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Calculated KPI stats matching Figma mockup
  const totalJobs = jobs.length;
  const inProgressCount = jobs.filter((j) => j.status === "in-progress").length;
  const readyCount = jobs.filter((j) => j.status === "ready").length;
  const outstandingAmount = 2400; // Exact R 2 400 from the screenshot

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobForm.customer || !newJobForm.service) return;

    const newRo: Job = {
      id: `j-${Date.now()}`,
      roNumber: `RO-${1049 + jobs.length}`,
      customerName: newJobForm.customer,
      customerPhone: "072 000 1122",
      vehicleMake: "Volkswagen",
      vehicleModel: "Golf 7 GTI",
      vehicleYear: 2019,
      licensePlate: newJobForm.plate || "ND 88990",
      vin: "WVWZZZAUZJP09876",
      status: "scheduled",
      service: newJobForm.service,
      concern: "Customer booked new job via workshop desk.",
      diagnosis: "Pending inspection on bay arrival.",
      appointmentTime: "11:00 AM",
      estimate: parseFloat(newJobForm.estimate) || 1500,
      parts: [],
      labor: [{ description: newJobForm.service, hours: 2, rate: 480 }],
    };

    setJobs([newRo, ...jobs]);
    setNewJobForm({ customer: "", plate: "", service: "", estimate: "" });
    setActiveModal(null);
  };

  const handleScanSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanQuery) return;
    setScanResult(
      `✓ Verified: 2018 Toyota Corolla 1.6 Prestige (Plate: ${scanQuery.toUpperCase()}) — Owner: John Smith`,
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#22c55e] selection:text-black">
      {/* ─── Main Workshop Dashboard Content ──────────────────────── */}
      <main className="mx-auto max-w-xl sm:max-w-2xl px-4 py-6 space-y-6 pb-24 safe-inset-bottom">
        {/* Header Greeting */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Alex</span>
              <span className="text-2xl animate-bounce">👋</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
              Tuesday, 10 September 2026
            </p>
          </div>

          {/* Quick notification bell button */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#141414] border border-[#262626] text-[#a3a3a3]">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#ef4444]" />
          </div>
        </div>

        {/* ─── 4 Summary Metric Cards (2x2 Grid) ───────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Card 1: Today's Jobs */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#141414] border border-[#242424] p-4 shadow-sm">
            <span className="text-[11px] font-bold tracking-wider text-[#737373] uppercase">
              TODAY'S JOBS
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
              Active right now
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
              Awaiting collection
            </span>
          </div>

          {/* Card 4: Outstanding */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#141414] border border-[#242424] p-4 shadow-sm">
            <span className="text-[11px] font-bold tracking-wider text-[#737373] uppercase">
              OUTSTANDING
            </span>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className="text-xs font-black text-[#ef4444]">R</span>
              <span className="font-black text-2xl sm:text-3xl text-[#ef4444] mono">
                2 400
              </span>
            </div>
            <span className="text-xs font-medium text-[#7a7a7a]">
              Across all customers
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
                setActiveModal("scan-vin");
              }}
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#0c1824] border border-[#173650] px-4 py-3.5 text-sm font-bold text-[#38bdf8] shadow-sm transition-all duration-150 hover:bg-[#112436] active:scale-[0.98] min-h-[48px] select-none touch-manipulation"
            >
              {/* Scan / Barcode crosshair icon */}
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
              <span>Scan VIN</span>
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

            {/* Action 4: New Appointment (Amber) */}
            <button
              onClick={() => setActiveModal("new-appointment")}
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#1f160a] border border-[#422e11] px-4 py-3.5 text-sm font-bold text-[#f59e0b] shadow-sm transition-all duration-150 hover:bg-[#2d200d] active:scale-[0.98] min-h-[48px] select-none touch-manipulation"
            >
              {/* Calendar icon */}
              <svg
                className="h-4 w-4 text-[#f59e0b]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>New Appointment</span>
            </button>
          </div>
        </div>

        {/* ─── Today's Repair Orders ──────────────────────────────── */}
        <div className="space-y-3 pt-2">
          {/* Section Header with count badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white tracking-tight">
                Today's Repair Orders
              </h2>
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#212121] text-[11px] font-bold text-[#8a8a8a] mono">
                {jobs.length}
              </span>
            </div>
            <span className="text-xs text-[#737373]">Tap to view details</span>
          </div>

          {/* List of Repair Order Cards */}
          <div className="space-y-3">
            {jobs.map((job) => {
              const statusCfg = STATUS_CONFIG[job.status];
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
                        {job.roNumber}
                      </span>
                      <span className="text-xs font-medium text-[#737373]">
                        {job.appointmentTime}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.text} ${statusCfg.bg} border ${statusCfg.border}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`}
                      />
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Middle Row: Customer & Vehicle Specs */}
                  <div className="pt-3 pb-2 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#22c55e] transition-colors">
                        {job.customerName}
                      </h3>
                      <p className="text-xs text-[#8c8c8c] mt-0.5">
                        {job.vehicleYear} {job.vehicleMake} {job.vehicleModel}
                      </p>
                    </div>

                    {/* License Plate Badge */}
                    <div className="shrink-0 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-1">
                      <span className="font-mono text-xs font-bold text-[#ededed] tracking-wider uppercase">
                        {job.licensePlate}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Service Title & Estimated Total */}
                  <div className="pt-2 flex items-center justify-between border-t border-[#1a1a1a] text-xs">
                    <span className="text-[#737373] truncate max-w-[200px] sm:max-w-xs">
                      {job.service}
                    </span>
                    <span className="font-mono font-black text-sm text-[#ededed]">
                      R {job.estimate.toLocaleString("en-ZA")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
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
                    {selectedJob.roNumber}
                  </span>
                  <span className="text-xs text-[#737373]">
                    {selectedJob.appointmentTime}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {selectedJob.customerName}
                </h2>
                <p className="text-xs text-[#8a8a8a]">
                  {selectedJob.vehicleYear} {selectedJob.vehicleMake}{" "}
                  {selectedJob.vehicleModel} ({selectedJob.licensePlate})
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
                <p className="text-white mt-0.5">{selectedJob.concern}</p>
              </div>
              <div>
                <span className="font-bold text-[#737373] uppercase tracking-wider block">
                  Technician Diagnosis:
                </span>
                <p className="text-[#a3a3a3] mt-0.5">{selectedJob.diagnosis}</p>
              </div>
            </div>

            {/* Itemized Parts & Labor */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Itemized Line Items
              </h3>

              <div className="rounded-xl bg-[#161616] border border-[#222222] divide-y divide-[#1f1f1f] text-xs">
                {selectedJob.parts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3"
                  >
                    <span className="text-neutral-300">
                      {p.name} (x{p.qty})
                    </span>
                    <span className="font-mono text-white">
                      R {(p.qty * p.unitPrice).toLocaleString("en-ZA")}
                    </span>
                  </div>
                ))}
                {selectedJob.labor.map((l, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3"
                  >
                    <span className="text-neutral-300">
                      {l.description} ({l.hours} hrs @ R{l.rate}/hr)
                    </span>
                    <span className="font-mono text-white">
                      R {(l.hours * l.rate).toLocaleString("en-ZA")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Row */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#272727]">
                <span className="text-sm font-bold text-white">
                  Estimate Total:
                </span>
                <span className="font-mono font-extrabold text-base text-[#22c55e]">
                  R {selectedJob.estimate.toLocaleString("en-ZA")}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 min-h-[46px] rounded-xl bg-[#212121] border border-[#333] text-sm font-bold text-white hover:bg-[#282828] active:scale-95"
              >
                Print Invoice (A4)
              </button>
              <button
                onClick={() => setSelectedJob(null)}
                className="flex-1 min-h-[46px] rounded-xl bg-[#22c55e] text-sm font-bold text-black hover:bg-[#16a34a] active:scale-95"
              >
                Close Job
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
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sipho Sithole"
                  value={newJobForm.customer}
                  onChange={(e) =>
                    setNewJobForm({ ...newJobForm, customer: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#888] block mb-1">
                  License Plate / Registration
                </label>
                <input
                  type="text"
                  placeholder="e.g. CA 123-456"
                  value={newJobForm.plate}
                  onChange={(e) =>
                    setNewJobForm({ ...newJobForm, plate: e.target.value })
                  }
                  className="w-full font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#888] block mb-1">
                  Requested Service / Concern
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Minor Service & Oil Change"
                  value={newJobForm.service}
                  onChange={(e) =>
                    setNewJobForm({ ...newJobForm, service: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#888] block mb-1">
                  Estimated Amount (ZAR)
                </label>
                <input
                  type="number"
                  placeholder="1850"
                  value={newJobForm.estimate}
                  onChange={(e) =>
                    setNewJobForm({ ...newJobForm, estimate: e.target.value })
                  }
                  className="w-full font-mono"
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
                  Save Order
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
                <span className="text-[#38bdf8]">⛶</span> Vehicle Lookup
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8c8c8c]">
              Enter vehicle registration plate or 17-character VIN barcode
              number to pull customer and vehicle history.
            </p>

            <form onSubmit={handleScanSearch} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. ABC 1234 GP or VIN..."
                value={scanQuery}
                onChange={(e) => setScanQuery(e.target.value)}
                className="w-full font-mono uppercase text-center text-lg tracking-widest"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#38bdf8] text-sm font-bold text-black hover:bg-[#0284c7]"
              >
                Lookup Vehicle
              </button>
            </form>

            {scanResult && (
              <div className="rounded-xl bg-[#0e1e2c] border border-[#1b4363] p-3 text-xs text-[#7dd3fc]">
                {scanResult}
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
              <h2 className="text-lg font-bold text-white">Add Customer</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setActiveModal(null);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="Full Name"
                required
                className="w-full"
              />
              <input
                type="tel"
                placeholder="Mobile Number (e.g. 082 123 4567)"
                required
                className="w-full"
              />
              <input
                type="email"
                placeholder="Email Address (optional)"
                className="w-full"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#a78bfa] text-sm font-bold text-black hover:bg-[#8b5cf6]"
              >
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: New Appointment Modal ─────────────────────── */}
      {activeModal === "new-appointment" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm safe-inset-top safe-inset-bottom">
          <div className="relative w-full max-w-md rounded-3xl bg-[#121212] border border-[#2a2a2a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212121] pb-3">
              <h2 className="text-lg font-bold text-white">
                Book Bay Appointment
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setActiveModal(null);
              }}
              className="space-y-3"
            >
              <input type="date" required className="w-full" />
              <input
                type="time"
                defaultValue="09:00"
                required
                className="w-full"
              />
              <input
                type="text"
                placeholder="Customer & Vehicle"
                required
                className="w-full"
              />
              <input
                type="text"
                placeholder="Service Slot Details"
                required
                className="w-full"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#f59e0b] text-sm font-bold text-black hover:bg-[#d97706]"
              >
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
