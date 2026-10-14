"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApi, ApiVehicle, ApiCustomer } from "@/lib/api";

export default function VehiclesPage() {
  const api = useApi();
  const [search, setSearch] = useState("");
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [customers, setCustomers] = useState<Record<string, ApiCustomer>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New vehicle form state
  const [newPlate, setNewPlate] = useState("");
  const [newMake, setNewMake] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("2022");
  const [newMileage, setNewMileage] = useState("50000");
  const [newCustomerId, setNewCustomerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [vehList, custList] = await Promise.all([
        api.vehicles.list(),
        api.customers.list().catch(() => [] as ApiCustomer[]),
      ]);
      setVehicles(vehList);

      const custMap: Record<string, ApiCustomer> = {};
      custList.forEach((c) => {
        custMap[c.id] = c;
      });
      setCustomers(custMap);
      if (custList.length > 0) {
        setNewCustomerId((prev) => prev || custList[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load vehicles:", err);
      setError(err?.message || "Failed to load vehicles from database");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newMake || !newModel || !newCustomerId) return;

    try {
      setIsSubmitting(true);
      await api.vehicles.create({
        license_plate: newPlate.trim().toUpperCase(),
        make: newMake.trim(),
        model: newModel.trim(),
        year: parseInt(newYear) || 2022,
        mileage_km: parseInt(newMileage) || 0,
        customer_id: newCustomerId,
      });
      setShowAddModal(false);
      setNewPlate("");
      setNewMake("");
      setNewModel("");
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to add vehicle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const q = search.toLowerCase();
    const owner = customers[v.customer_id];
    const ownerName = owner ? `${owner.first_name} ${owner.last_name}`.toLowerCase() : "";
    return (
      !q ||
      v.license_plate.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.vin && v.vin.toLowerCase().includes(q)) ||
      ownerName.includes(q)
    );
  });

  return (
    <AppShell activeItem="vehicles">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Vehicles Fleet Registry
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
              Live registration plates, VINs, odometer readings, and service timelines from database.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#22c55e] px-4 py-2.5 text-sm font-bold text-black shadow-md shadow-emerald-950/20 hover:bg-[#16a34a] active:scale-95 transition-all select-none self-start sm:self-auto"
          >
            <span className="text-base font-extrabold">+</span>
            <span>Add Vehicle</span>
          </button>
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
            placeholder="Search by license plate (ABC 1234 GP), make, model, VIN, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#141414] border border-[#262626] text-sm text-white placeholder:text-[#555] focus:border-[#22c55e] focus:outline-none"
          />
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
            Loading real vehicle fleet from database...
          </div>
        )}

        {!isLoading && vehicles.length === 0 && (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[#262626] p-8 space-y-3">
            <p className="text-base font-bold text-neutral-300">No vehicles registered yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-block mt-2 rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a]"
            >
              Register First Vehicle
            </button>
          </div>
        )}

        {/* Vehicles List */}
        {!isLoading && filteredVehicles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredVehicles.map((veh) => {
              const owner = customers[veh.customer_id];
              const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : "Unknown Owner";
              const isInShop = veh.status === "in_shop" || veh.status === "in-shop";

              return (
                <Link
                  key={veh.id}
                  href={`/vehicles/${veh.id}`}
                  className="group block rounded-2xl bg-[#141414] border border-[#242424] p-5 hover:border-[#383838] transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      {/* License Plate Badge */}
                      <span className="font-mono text-xs font-black text-white bg-[#1a1a1a] border border-[#2d2d2d] px-2.5 py-1 rounded-lg uppercase tracking-wider inline-block">
                        {veh.license_plate}
                      </span>
                      <h2 className="text-base font-bold text-white group-hover:text-[#22c55e] transition-colors mt-2">
                        {veh.year} {veh.make} {veh.model}
                      </h2>
                      <p className="text-xs text-[#8c8c8c] mt-0.5">
                        Owner: {ownerName}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isInShop
                          ? "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20"
                          : "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isInShop ? "bg-[#f59e0b]" : "bg-[#22c55e]"
                        }`}
                      />
                      {isInShop ? "In Workshop Bay" : "Active"}
                    </span>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#1f1f1f] flex items-center justify-between text-xs text-[#737373]">
                    <span className="font-mono truncate max-w-[160px]">
                      {veh.vin ? `VIN: ${veh.vin}` : (veh.color ? `Color: ${veh.color}` : "No VIN")}
                    </span>
                    <span className="font-mono font-semibold text-neutral-300">
                      {veh.mileage_km.toLocaleString("en-ZA")} km
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Add Vehicle Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#262626] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#222] pb-3">
                <h3 className="text-lg font-bold text-white">Add Vehicle to Fleet</h3>
                <button onClick={() => setShowAddModal(false)} className="text-[#888] hover:text-white">✕</button>
              </div>

              <form onSubmit={handleAddVehicle} className="space-y-3">
                <div>
                  <label className="text-xs text-[#888] block mb-1">Customer / Owner *</label>
                  <select
                    value={newCustomerId}
                    onChange={(e) => setNewCustomerId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white focus:outline-none"
                  >
                    {Object.values(customers).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#888] block mb-1">Registration Plate *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ABC 123 GP"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white uppercase focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-[#888] block mb-1">Make *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Toyota"
                      value={newMake}
                      onChange={(e) => setNewMake(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#888] block mb-1">Model *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Corolla"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-[#888] block mb-1">Year</label>
                    <input
                      type="number"
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#888] block mb-1">Odometer (km)</label>
                    <input
                      type="number"
                      value={newMileage}
                      onChange={(e) => setNewMileage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#222] text-xs font-bold text-white hover:bg-[#2a2a2a]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#22c55e] text-xs font-bold text-black hover:bg-[#16a34a] disabled:opacity-50"
                  >
                    {isSubmitting ? "Adding..." : "Add Vehicle"}
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
