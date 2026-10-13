"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MOCK_VEHICLES,
  MOCK_REPAIR_ORDERS,
  formatCurrency,
} from "@/lib/mock-data";

export default function VehicleHistoryPage() {
  const params = useParams();
  const id = params?.id as string;

  const vehicle =
    MOCK_VEHICLES.find(
      (v) => v.id === id || v.plate.toLowerCase() === id?.toLowerCase(),
    ) || MOCK_VEHICLES[0];

  const vehicleJobs = MOCK_REPAIR_ORDERS.filter(
    (j) => j.vehicleId === vehicle.id || j.licensePlate === vehicle.plate,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="border-b border-[#212121] pb-5">
        <Link
          href={`/vehicles/${vehicle.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white mb-1 transition-colors"
        >
          <span>
            ← Back to {vehicle.make} {vehicle.model}
          </span>
        </Link>
        <h1 className="text-2xl font-black text-white">
          Chronological Service History
        </h1>
        <p className="text-xs text-[#737373] mt-0.5">
          Complete workshop records & maintenance timeline for plate{" "}
          <span className="font-mono text-white font-bold">
            {vehicle.plate}
          </span>
        </p>
      </div>

      <div className="space-y-4">
        {vehicleJobs.length > 0 ? (
          vehicleJobs.map((j) => (
            <Link
              key={j.id}
              href={`/jobs/${j.id}`}
              className="block rounded-2xl bg-[#141414] border border-[#242424] p-5 hover:border-[#383838] transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white bg-[#222] px-2 py-0.5 rounded">
                      {j.roNumber}
                    </span>
                    <span className="text-xs text-[#737373]">{j.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">
                    {j.service}
                  </h3>
                  <p className="text-xs text-[#8a8a8a] mt-0.5">{j.diagnosis}</p>
                </div>
                <span className="font-mono text-sm font-black text-[#22c55e]">
                  {formatCurrency(j.estimateTotal)}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl bg-[#141414] p-8 text-center text-xs text-[#737373]">
            No previous repair order history recorded for this vehicle yet.
          </div>
        )}
      </div>
    </div>
  );
}
