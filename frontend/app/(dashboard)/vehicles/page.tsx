"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MOCK_VEHICLES } from "@/lib/mock-data";

export default function VehiclesPage() {
  const [search, setSearch] = useState("");

  const filteredVehicles = MOCK_VEHICLES.filter((v) => {
    const q = search.toLowerCase();
    return (
      !q ||
      v.plate.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.vin.toLowerCase().includes(q) ||
      v.customerName.toLowerCase().includes(q)
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
              Registration plates, VIN barcode numbers, odometer readings, and
              service timelines.
            </p>
          </div>

          <button
            onClick={() => {
              const plate = prompt("Enter Registration Plate or VIN:");
              if (plate) {
                alert(`Vehicle ${plate.toUpperCase()} logged in fleet.`);
              }
            }}
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

        {/* Vehicles List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredVehicles.map((veh) => {
            const isInShop = veh.status === "in-shop";
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
                      {veh.plate}
                    </span>
                    <h2 className="text-base font-bold text-white group-hover:text-[#22c55e] transition-colors mt-2">
                      {veh.year} {veh.make} {veh.model}
                    </h2>
                    <p className="text-xs text-[#8c8c8c] mt-0.5">
                      Owner: {veh.customerName}
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
                    VIN: {veh.vin}
                  </span>
                  <span className="font-mono font-semibold text-neutral-300">
                    {veh.mileageKm.toLocaleString("en-ZA")} km
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
