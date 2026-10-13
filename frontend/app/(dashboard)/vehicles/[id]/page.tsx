"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useApi, ApiVehicle, ApiRepairOrder } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { ComponentHistoryEntry } from "@/lib/types";

export default function VehicleDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const api = useApi();

  const [vehicle, setVehicle] = useState<any>({
    id: id || "",
    make: "Loading",
    model: "Vehicle",
    year: new Date().getFullYear(),
    plate: "...",
    vin: "...",
    mileageKm: 0,
    status: "active",
    componentHistory: [],
  });
  const [serviceHistory, setServiceHistory] = useState<ApiRepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "components">(
    "components",
  );
  const [showSwapModal, setShowSwapModal] = useState(false);

  // Load real vehicle and service history from backend
  const loadVehicleDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    try {
      const [v, jobs] = await Promise.all([
        api.vehicles.get(id),
        api.jobs.list(),
      ]);
      if (v) {
        setVehicle({
          id: v.id,
          customerId: v.customer_id,
          year: v.year,
          make: v.make,
          model: v.model,
          color: v.color || "Standard",
          plate: v.license_plate,
          vin: v.vin || "Not recorded",
          mileageKm: v.mileage_km,
          status: v.status === "in_shop" ? "in-shop" : "active",
          componentHistory: [],
        });
        setSwapMileage(v.mileage_km.toString());

        const matchedJobs = jobs.filter(
          (j) =>
            j.vehicle_id === v.id ||
            j.vehicle?.license_plate?.toLowerCase().replace(/\s+/g, "") ===
              v.license_plate.toLowerCase().replace(/\s+/g, "")
        );
        setServiceHistory(matchedJobs);
      }
    } catch (err) {
      console.error("Error loading vehicle details:", err);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    loadVehicleDetails();
  }, [loadVehicleDetails]);

  // New Swap Form State
  const [swapType, setSwapType] = useState<"engine" | "chassis">("engine");
  const [serialNumber, setSerialNumber] = useState("");
  const [swapReason, setSwapReason] = useState("");
  const [sourceOrigin, setSourceOrigin] = useState("");
  const [cidVtsClearanceNo, setCidVtsClearanceNo] = useState("");
  const [cvrForm4Filed, setCvrForm4Filed] = useState(true);
  const [swapMileage, setSwapMileage] = useState(
    vehicle.mileageKm.toString(),
  );

  const componentHistory: ComponentHistoryEntry[] = vehicle.componentHistory || [];
  const engineHistory = componentHistory.filter(
    (c) => c.componentType === "engine",
  );
  const chassisHistory = componentHistory.filter(
    (c) => c.componentType === "chassis",
  );

  const activeEngine =
    engineHistory.find((e) => e.status === "active")?.serialNumber ||
    vehicle.currentEngineNumber ||
    "Factory Block Not Logged";

  const activeChassis =
    chassisHistory.find((c) => c.status === "active")?.serialNumber ||
    vehicle.vin;

  const handleRecordSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim()) return;

    const newEntry: ComponentHistoryEntry = {
      id: `ch-${Date.now()}`,
      vehicleId: vehicle.id,
      componentType: swapType,
      serialNumber: serialNumber.trim().toUpperCase(),
      status: "active",
      installedDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      mileageAtSwap: parseInt(swapMileage, 10) || vehicle.mileageKm,
      reason: swapReason || "Routine Replacement / Overhaul",
      sourceOrigin:
        sourceOrigin || "Commercial Auto Spares / Imported Replacement",
      cidVtsClearanceNo: cidVtsClearanceNo || undefined,
      cvrForm4Filed,
      technicianName: "Lead Master Technician",
      notes: "Logged directly via MechanicMate Component Heritage Ledger.",
    };

    // Mark previous active of same type as replaced
    const updatedHistory = componentHistory.map((item) => {
      if (item.componentType === swapType && item.status === "active") {
        return {
          ...item,
          status: "replaced" as const,
          removedDate: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        };
      }
      return item;
    });

    const finalVehicle = {
      ...vehicle,
      currentEngineNumber:
        swapType === "engine" ? newEntry.serialNumber : vehicle.currentEngineNumber,
      componentHistory: [newEntry, ...updatedHistory],
    };

    setVehicle(finalVehicle);
    setShowSwapModal(false);
    setSerialNumber("");
    setSwapReason("");
    setSourceOrigin("");
    setCidVtsClearanceNo("");
  };

  return (
    <AppShell activeItem="vehicles">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Header Bar */}
        <div className="border-b border-[#212121] pb-5">
          <Link
            href="/vehicles"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white transition-colors mb-1"
          >
            <span>← Back to all vehicles</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-black text-white bg-[#1a1a1a] border border-[#2d2d2d] px-3 py-1.5 rounded-xl uppercase tracking-wider">
                {vehicle.plate}
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                <p className="text-xs text-[#7a7a7a]">
                  Owner: {vehicle.customerName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSwapModal(true)}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#1c1c1c] border border-[#2f2f2f] px-3.5 py-2 text-xs font-bold text-white hover:border-[#22c55e] transition-colors"
              >
                <span>🔄 Log Engine/Chassis Swap</span>
              </button>

              <Link
                href="/jobs/new"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a] shadow-md transition-all select-none self-start sm:self-auto"
              >
                <span>+ Book Repair Order</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#666] tracking-wider block">
              Current Engine Block
            </span>
            <p className="font-mono text-xs font-bold text-[#22c55e] truncate flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              {activeEngine}
            </p>
          </div>
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#666] tracking-wider block">
              Active Chassis / VIN
            </span>
            <p className="font-mono text-xs font-bold text-neutral-200 truncate">
              {activeChassis}
            </p>
          </div>
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#666] tracking-wider block">
              Odometer Reading
            </span>
            <p className="font-mono text-sm font-bold text-neutral-200">
              {vehicle.mileageKm.toLocaleString("en-ZA")} km
            </p>
          </div>
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#666] tracking-wider block">
              Factory Spec & Color
            </span>
            <p className="text-xs font-bold text-neutral-200 truncate">
              {vehicle.engine || "Standard"} • {vehicle.color}
            </p>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-[#242424] gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("components")}
            className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
              activeTab === "components"
                ? "text-[#22c55e]"
                : "text-[#737373] hover:text-white"
            }`}
          >
            <span>⚙️ Component Heritage & Engine History</span>
            <span className="px-2 py-0.5 rounded-full bg-[#1e1e1e] text-[10px] font-mono border border-[#333]">
              {componentHistory.length}
            </span>
            {activeTab === "components" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
              activeTab === "history"
                ? "text-[#22c55e]"
                : "text-[#737373] hover:text-white"
            }`}
          >
            <span>🔧 Service History</span>
            <span className="px-2 py-0.5 rounded-full bg-[#1e1e1e] text-[10px] font-mono border border-[#333]">
              {serviceHistory.length}
            </span>
            {activeTab === "history" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />
            )}
          </button>
        </div>

        {/* TAB 1: COMPONENT HERITAGE & ENGINE HISTORY */}
        {activeTab === "components" && (
          <div className="space-y-5">
            {/* Active Bay Status Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#161616] to-[#111111] border border-[#262626] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#22c55e]">
                      Currently Mounted in Bay
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white font-mono mt-1">
                    {activeEngine}
                  </h3>
                  <p className="text-xs text-[#808080] mt-0.5">
                    Engine specification: {vehicle.engine || "Inline-4 Gasoline"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-xl bg-[#1c1c1c] border border-[#2b2b2b] px-3 py-1.5 text-right">
                    <span className="text-[10px] text-[#737373] uppercase block font-bold">
                      CID VTS Police Clearance
                    </span>
                    <span className="text-xs font-mono font-bold text-[#22c55e] flex items-center gap-1">
                      <span>✓</span>
                      <span>
                        {engineHistory[0]?.cidVtsClearanceNo ||
                          "VTS-CLEARED-HRE"}
                      </span>
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#1c1c1c] border border-[#2b2b2b] px-3 py-1.5 text-right">
                    <span className="text-[10px] text-[#737373] uppercase block font-bold">
                      CVR 4 Logbook Status
                    </span>
                    <span className="text-xs font-bold text-neutral-200">
                      {engineHistory[0]?.cvrForm4Filed
                        ? "Filed & Stamped"
                        : "Pending Submission"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-[#181818] p-3 border border-[#232323]">
                  <span className="text-[#737373] block text-[11px]">
                    Mounted Date & Installed Mileage
                  </span>
                  <span className="font-bold text-white mt-0.5 block font-mono">
                    {engineHistory[0]?.installedDate || "Original"} (
                    {engineHistory[0]?.mileageAtSwap?.toLocaleString("en-ZA") ||
                      "0"}{" "}
                    km)
                  </span>
                </div>

                <div className="rounded-xl bg-[#181818] p-3 border border-[#232323]">
                  <span className="text-[#737373] block text-[11px]">
                    Sourced From / Customs Clearance
                  </span>
                  <span className="font-bold text-white mt-0.5 block truncate">
                    {engineHistory[0]?.sourceOrigin || "OEM Factory Assembly"}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline of All Engines & Chassis */}
            <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Engine & Chassis Provenance Ledger
                  </h3>
                  <p className="text-xs text-[#737373] mt-0.5">
                    Chronological audit trail of all blocks and chassis ever
                    fitted to {vehicle.plate}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSwapModal(true)}
                  className="text-xs font-bold text-[#22c55e] hover:underline"
                >
                  + Add Record
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {componentHistory.map((item, idx) => {
                  const isActive = item.status === "active";
                  const isEngine = item.componentType === "engine";

                  return (
                    <div
                      key={item.id}
                      className={`relative rounded-xl border p-4 transition-all ${
                        isActive
                          ? "bg-[#181818] border-[#22c55e]/40 shadow-sm"
                          : "bg-[#121212] border-[#242424] opacity-90"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pb-2 border-b border-[#212121]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isEngine
                                ? "bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20"
                                : "bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20"
                            }`}
                          >
                            {item.componentType}
                          </span>

                          <span className="font-mono text-sm font-black text-white">
                            {item.serialNumber}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isActive
                                ? "bg-[#22c55e]/15 text-[#22c55e]"
                                : "bg-[#f59e0b]/15 text-[#f59e0b]"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <span className="text-[#737373] font-mono">
                          Installed: {item.installedDate}{" "}
                          {item.removedDate && `— Removed: ${item.removedDate}`}
                        </span>
                      </div>

                      <div className="pt-2.5 space-y-1.5 text-xs">
                        <p className="text-white font-medium">
                          <strong className="text-[#737373] font-normal">
                            Reason:{" "}
                          </strong>
                          {item.reason}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#858585]">
                          {item.mileageAtSwap && (
                            <span>
                              Odometer:{" "}
                              <strong className="text-neutral-300 font-mono">
                                {item.mileageAtSwap.toLocaleString("en-ZA")} km
                              </strong>
                            </span>
                          )}
                          {item.sourceOrigin && (
                            <span>
                              Origin:{" "}
                              <strong className="text-neutral-300">
                                {item.sourceOrigin}
                              </strong>
                            </span>
                          )}
                          {item.cidVtsClearanceNo && (
                            <span>
                              CID VTS Cert:{" "}
                              <strong className="text-[#22c55e] font-mono">
                                {item.cidVtsClearanceNo}
                              </strong>
                            </span>
                          )}
                          {item.cvrForm4Filed && (
                            <span className="text-[#22c55e] font-bold">
                              ✓ CVR 4 Filed
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-[11px] text-[#707070] italic pt-1 border-t border-[#1f1f1f]">
                            “{item.notes}”
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SERVICE HISTORY */}
        {activeTab === "history" && (
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                Chronological Service History
              </h2>
              <span className="text-xs text-[#737373]">
                {serviceHistory.length} total jobs
              </span>
            </div>

            <div className="space-y-3">
              {serviceHistory.length === 0 ? (
                <p className="text-xs text-[#737373]">
                  No previous jobs recorded for this vehicle.
                </p>
              ) : (
                serviceHistory.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block rounded-xl bg-[#181818] border border-[#262626] p-4 hover:border-[#383838] transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#22c55e]">
                        {job.ro_number}
                      </span>
                      <span className="text-[#737373]">{formatDate(job.created_at)}</span>
                    </div>
                    <h3 className="font-bold text-white text-sm mt-1">
                      {job.customer_concern}
                    </h3>
                    {job.diagnosis && (
                      <p className="text-xs text-[#8e8e8e] mt-1 line-clamp-1">
                        {job.diagnosis}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-[#737373] mt-2 pt-2 border-t border-[#222]">
                      <span>
                        Status:{" "}
                        <strong className="text-neutral-300 capitalize">
                          {job.status}
                        </strong>
                      </span>
                      <span className="font-mono font-bold text-neutral-200">
                        {formatCurrency(job.total_amount)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {/* MODAL: LOG ENGINE / CHASSIS SWAP */}
        {showSwapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-[#141414] border border-[#282828] p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔄</span>
                  <h3 className="text-base font-black text-white">
                    Record Engine / Chassis Swap
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="text-neutral-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRecordSwap} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#888]">
                      Component
                    </label>
                    <select
                      value={swapType}
                      onChange={(e) =>
                        setSwapType(e.target.value as "engine" | "chassis")
                      }
                      className="w-full rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] px-3 py-2 text-xs text-white"
                    >
                      <option value="engine">Engine Block</option>
                      <option value="chassis">Chassis / Frame</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#888]">
                      New Physical Stamp / Serial #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1ZR-8924102"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      required
                      className="w-full rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] px-3 py-2 text-xs font-mono font-bold text-white placeholder:text-[#555]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#888]">
                      Mileage at Swap (KM)
                    </label>
                    <input
                      type="number"
                      value={swapMileage}
                      onChange={(e) => setSwapMileage(e.target.value)}
                      className="w-full rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] px-3 py-2 text-xs font-mono text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#888]">
                      CID VTS Clearance Cert #
                    </label>
                    <input
                      type="text"
                      placeholder="CID-VTS-HRE-2025-..."
                      value={cidVtsClearanceNo}
                      onChange={(e) => setCidVtsClearanceNo(e.target.value)}
                      className="w-full rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] px-3 py-2 text-xs font-mono text-white placeholder:text-[#555]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#888]">
                    Swap Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Overheating, cracked cylinder head, blown rod"
                    value={swapReason}
                    onChange={(e) => setSwapReason(e.target.value)}
                    className="w-full rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] px-3 py-2 text-xs text-white placeholder:text-[#555]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#888]">
                    Source Origin / Invoice / ZIMRA Doc
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Durban Japanese Half-Cut Import, Kaguvi Spares Inv #1048"
                    value={sourceOrigin}
                    onChange={(e) => setSourceOrigin(e.target.value)}
                    className="w-full rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] px-3 py-2 text-xs text-white placeholder:text-[#555]"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={cvrForm4Filed}
                    onChange={(e) => setCvrForm4Filed(e.target.checked)}
                    className="h-4 w-4 accent-[#22c55e] rounded"
                  />
                  <span className="text-xs text-white font-medium">
                    CVR 4 Form (Application for Engine Change) lodged with
                    authorities
                  </span>
                </label>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#242424]">
                  <button
                    type="button"
                    onClick={() => setShowSwapModal(false)}
                    className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-black bg-[#22c55e] hover:bg-[#16a34a] rounded-xl font-mono shadow-md"
                  >
                    Save Component Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
