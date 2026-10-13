"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchVehicle, type VehicleRead } from "@/lib/api/vehicles";
import { fetchJobs, type RepairOrderRead } from "@/lib/api/jobs";
import { formatCurrency, formatDate } from "@/lib/format";

export default function VehicleHistoryPage() {
  const params = useParams();
  const id = params?.id as string;

  const [vehicle, setVehicle] = useState<VehicleRead | null>(null);
  const [vehicleJobs, setVehicleJobs] = useState<RepairOrderRead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([fetchVehicle(id), fetchJobs()])
      .then(([v, jobs]) => {
        setVehicle(v);
        if (v) {
          const matched = jobs.filter(
            (j) =>
              j.vehicle_id === v.id ||
              j.vehicle?.license_plate?.toLowerCase().replace(/\s+/g, "") ===
                v.license_plate.toLowerCase().replace(/\s+/g, "")
          );
          setVehicleJobs(matched);
        }
      })
      .catch((err) => {
        console.error("Error loading vehicle history:", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
        <p className="text-xs text-[#8c8c8c]">Loading service history timeline...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <p className="text-sm text-red-400">Vehicle not found</p>
        <Link
          href="/vehicles"
          className="inline-block rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a]"
        >
          Return to Vehicle Registry
        </Link>
      </div>
    );
  }

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
            {vehicle.license_plate}
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
                      {j.ro_number}
                    </span>
                    <span className="text-xs text-[#737373]">{formatDate(j.created_at)}</span>
                    <span className="text-[10px] font-bold uppercase text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded">
                      {j.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">
                    {j.customer_concern}
                  </h3>
                  {j.diagnosis && (
                    <p className="text-xs text-[#8a8a8a] mt-0.5">{j.diagnosis}</p>
                  )}
                </div>
                <span className="font-mono text-sm font-black text-[#22c55e]">
                  {formatCurrency(j.total_amount)}
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
