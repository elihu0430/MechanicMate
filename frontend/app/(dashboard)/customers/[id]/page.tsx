"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  MOCK_CUSTOMERS,
  MOCK_VEHICLES,
  MOCK_REPAIR_ORDERS,
  formatCurrency,
} from "@/lib/mock-data";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const customer =
    MOCK_CUSTOMERS.find(
      (c) => c.id === id || c.name.toLowerCase().includes(id?.toLowerCase()),
    ) || MOCK_CUSTOMERS[0];

  const vehicles = MOCK_VEHICLES.filter((v) => v.customerId === customer.id);
  const jobs = MOCK_REPAIR_ORDERS.filter((j) => j.customerId === customer.id);

  return (
    <AppShell activeItem="customers">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Top Header */}
        <div className="border-b border-[#212121] pb-5">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white transition-colors mb-1"
          >
            <span>← Back to all customers</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {customer.name}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
                Client Profile & Service Records
              </p>
            </div>

            {/* Quick Contact Buttons */}
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/27${customer.phone.replace(/\D/g, "").slice(-9)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2416] border border-[#1d472c] px-4 py-2 text-xs font-bold text-[#22c55e] hover:bg-[#163620]"
              >
                <span>💬 WhatsApp</span>
              </a>
              <a
                href={`tel:${customer.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1c1c1c] border border-[#2b2b2b] px-4 py-2 text-xs font-bold text-white hover:bg-[#252525]"
              >
                <span>📞 Call</span>
              </a>
            </div>
          </div>
        </div>

        {/* Customer Details Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#666] tracking-wider block">
              Contact Phone
            </span>
            <p className="text-sm font-semibold text-white">{customer.phone}</p>
          </div>
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#666] tracking-wider block">
              Email Address
            </span>
            <p className="text-sm font-semibold text-white truncate">
              {customer.email}
            </p>
          </div>
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#666] tracking-wider block">
              Outstanding Account Balance
            </span>
            <p
              className={`font-mono text-sm font-black ${
                customer.outstandingBalance > 0
                  ? "text-[#ef4444]"
                  : "text-[#22c55e]"
              }`}
            >
              {customer.outstandingBalance > 0
                ? formatCurrency(customer.outstandingBalance)
                : "Settled (R 0.00)"}
            </p>
          </div>
        </div>

        {/* Vehicles Owned */}
        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              Registered Vehicles
            </h2>
            <Link
              href="/vehicles"
              className="text-xs font-bold text-[#22c55e] hover:underline"
            >
              + Add Vehicle
            </Link>
          </div>

          <div className="divide-y divide-[#1f1f1f] rounded-xl bg-[#181818] border border-[#262626]">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-3.5 text-xs sm:text-sm"
              >
                <div>
                  <Link
                    href={`/vehicles/${v.id}`}
                    className="font-bold text-white hover:text-[#22c55e] transition-colors"
                  >
                    {v.year} {v.make} {v.model}
                  </Link>
                  <p className="font-mono text-xs text-[#737373] mt-0.5">
                    VIN: {v.vin}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[#ededed] bg-[#141414] border border-[#2a2a2a] px-2.5 py-1 rounded-lg uppercase">
                    {v.plate}
                  </span>
                  <span className="text-xs text-[#8e8e8e]">
                    {v.mileageKm.toLocaleString()} km
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Order History */}
        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3.5">
          <h2 className="text-base font-bold text-white">
            Workshop Repair History
          </h2>
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <p className="text-xs text-[#737373]">
                No repair history for this client.
              </p>
            ) : (
              jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-xl bg-[#181818] border border-[#262626] p-4 hover:border-[#383838] transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#22c55e]">
                      {job.roNumber}
                    </span>
                    <span className="text-[#737373]">{job.date}</span>
                  </div>
                  <h3 className="font-bold text-white text-sm mt-1">
                    {job.service}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-[#8e8e8e] mt-2">
                    <span>
                      {job.vehicleYear} {job.vehicleMake} {job.vehicleModel}
                    </span>
                    <span className="font-mono font-bold text-[#ededed]">
                      {formatCurrency(job.estimateTotal)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
