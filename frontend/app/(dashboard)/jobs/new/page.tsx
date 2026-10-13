"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useApi, ApiCustomer, ApiVehicle } from "@/lib/api";

export default function NewJobPage() {
  const router = useRouter();
  const api = useApi();

  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [service, setService] = useState("");
  const [concern, setConcern] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("2.0");

  // Plate quick lookup
  const [plateQuery, setPlateQuery] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [cList, vList] = await Promise.all([
        api.customers.list(),
        api.vehicles.list(),
      ]);
      setCustomers(cList);
      setVehicles(vList);
      if (cList.length > 0) setCustomerId(cList[0].id);
      if (vList.length > 0) setVehicleId(vList[0].id);
    } catch (err: any) {
      console.error("Failed to load options:", err);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    initData();
  }, [initData]);

  const handlePlateLookup = async () => {
    if (!plateQuery.trim()) return;
    try {
      setIsLookingUp(true);
      setLookupMessage(null);
      const res = await api.vehicles.lookupPlate(plateQuery);
      setVehicleId(res.vehicle.id);
      setCustomerId(res.customer.id);
      setLookupMessage(`Found: ${res.vehicle.year} ${res.vehicle.make} ${res.vehicle.model} owned by ${res.customer.name}`);
    } catch (err: any) {
      setLookupMessage(err?.message || "Plate not found in database registry");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !vehicleId || !concern.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const hrs = parseFloat(estimatedHours) || 2.0;

      await api.jobs.create({
        customer_id: customerId,
        vehicle_id: vehicleId,
        customer_concern: concern.trim(),
        recommended_work: service.trim() || "General Repair",
        items: [
          {
            item_type: "labour",
            description: service.trim() || "Diagnostic & Repair Labor",
            labour_hours: hrs,
            labour_hourly_rate: 480,
          },
        ],
      });

      router.push("/jobs");
    } catch (err: any) {
      console.error("Failed to create job:", err);
      setError(err?.message || "Failed to create repair order in live database");
      setIsSubmitting(false);
    }
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

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Quick Plate Lookup Banner */}
        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-4 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[#22c55e]">
            ⚡ Fast Plate Intake Lookup
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. SARAH-GP or AEF 7756"
              value={plateQuery}
              onChange={(e) => setPlateQuery(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white uppercase focus:outline-none"
            />
            <button
              type="button"
              onClick={handlePlateLookup}
              disabled={isLookingUp}
              className="px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#333] text-xs font-bold text-white hover:bg-[#252525]"
            >
              {isLookingUp ? "Looking up..." : "Lookup Plate"}
            </button>
          </div>
          {lookupMessage && (
            <p className="text-xs text-[#38bdf8]">{lookupMessage}</p>
          )}
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
              required
              className="w-full rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] p-3 text-sm text-white focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} — {c.phone}
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
                + Manage Vehicles
              </Link>
            </div>

            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
              className="w-full rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] p-3 text-sm text-white focus:outline-none"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.license_plate} — {v.year} {v.make} {v.model} ({v.mileage_km} km)
                </option>
              ))}
            </select>
          </div>

          {/* Service & Concern */}
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-[#737373] block">
              3. Service Details & Diagnostics
            </label>

            <div>
              <label className="text-xs text-[#8e8e8e] block mb-1 font-semibold">
                Service Type / Recommended Work *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Brake Replacement & Rotor Skimming"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white placeholder:text-[#555] focus:border-[#22c55e] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-[#8e8e8e] block mb-1 font-semibold">
                Customer Concern / Symptom Description *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe what the customer reported (e.g. Grinding noise when braking at highway speeds...)"
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white placeholder:text-[#555] focus:border-[#22c55e] focus:outline-none"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/jobs"
              className="flex-1 min-h-[48px] inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] border border-[#282828] text-sm font-bold text-white hover:bg-[#222]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 min-h-[48px] inline-flex items-center justify-center rounded-xl bg-[#22c55e] text-sm font-bold text-black hover:bg-[#16a34a] shadow-lg shadow-emerald-950/30 disabled:opacity-50"
            >
              {isSubmitting ? "Creating Order..." : "Create Repair Order"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
