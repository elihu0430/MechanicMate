"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MOCK_CUSTOMERS, MOCK_VEHICLES } from "@/lib/mock-data";

export default function NewJobPage() {
  const router = useRouter();

  const [customerId, setCustomerId] = useState(MOCK_CUSTOMERS[0].id);
  const [vehicleId, setVehicleId] = useState(MOCK_VEHICLES[0].id);
  const [service, setService] = useState("");
  const [concern, setConcern] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("09:00 AM");
  const [estimatedHours, setEstimatedHours] = useState("2.0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect back to jobs list
    router.push("/jobs");
  };

  return (
    <AppShell activeItem="jobs">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="border-b border-[#212121] pb-4">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white transition-colors mb-1"
          >
            <span>← Back to repair orders</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Create Repair Order
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
            Log a new customer vehicle for diagnostics and repair in the bay.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer Selection */}
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                1. Customer Assignment
              </label>
              <Link
                href="/customers/new"
                className="text-xs font-semibold text-[#22c55e] hover:underline"
              >
                + New Customer
              </Link>
            </div>

            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] p-3 text-sm text-white"
            >
              {MOCK_CUSTOMERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.phone} ({c.address})
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Selection */}
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                2. Vehicle Selection
              </label>
              <Link
                href="/vehicles"
                className="text-xs font-semibold text-[#38bdf8] hover:underline"
              >
                ⛶ Scan Plate / VIN
              </Link>
            </div>

            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] p-3 text-sm text-white font-mono"
            >
              {MOCK_VEHICLES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {v.year} {v.make} {v.model} ({v.color})
                </option>
              ))}
            </select>
          </div>

          {/* Service & Concern Details */}
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-[#737373] block">
              3. Service & Diagnostic Details
            </label>

            <div>
              <label className="text-xs text-[#8e8e8e] block mb-1 font-semibold">
                Primary Service Package / Headline
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Major 60,000km Service or Front Brake Replacement"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-[#8e8e8e] block mb-1 font-semibold">
                Customer Reported Concern
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Squeaking noise when turning left. Vehicle pulling slightly to the passenger side under braking..."
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#8e8e8e] block mb-1 font-semibold">
                  Scheduled Arrival
                </label>
                <input
                  type="text"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-[#8e8e8e] block mb-1 font-semibold">
                  Estimated Labor Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-full font-mono"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/jobs"
              className="flex-1 min-h-[48px] inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] border border-[#282828] text-sm font-bold text-white hover:bg-[#222]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="flex-1 min-h-[48px] inline-flex items-center justify-center rounded-xl bg-[#22c55e] text-sm font-bold text-black hover:bg-[#16a34a] shadow-lg shadow-emerald-950/30"
            >
              Create Repair Order
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
