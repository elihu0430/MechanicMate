"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useApi, ApiCustomer, ApiVehicle, ApiRepairOrder } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const api = useApi();

  const [customer, setCustomer] = useState<ApiCustomer | null>(null);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [jobs, setJobs] = useState<ApiRepairOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomerData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const [custData, allVehicles, allJobs] = await Promise.all([
        api.customers.get(id),
        api.vehicles.list().catch(() => [] as ApiVehicle[]),
        api.jobs.list().catch(() => [] as ApiRepairOrder[]),
      ]);
      setCustomer(custData);
      setVehicles(allVehicles.filter((v) => v.customer_id === custData.id));
      setJobs(allJobs.filter((j) => j.customer_id === custData.id));
    } catch (err: any) {
      console.error("Failed to load customer details:", err);
      setError(err?.message || "Failed to load customer from database");
    } finally {
      setIsLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    loadCustomerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) {
    return (
      <AppShell activeItem="customers">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-[#737373] animate-pulse">
          Loading customer record...
        </div>
      </AppShell>
    );
  }

  if (error || !customer) {
    return (
      <AppShell activeItem="customers">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center space-y-4">
          <p className="text-red-400 font-bold">{error || "Customer not found"}</p>
          <Link
            href="/customers"
            className="inline-block px-4 py-2 rounded-xl bg-[#22c55e] text-xs font-bold text-black"
          >
            ← Back to Customers
          </Link>
        </div>
      </AppShell>
    );
  }

  const fullName = `${customer.first_name} ${customer.last_name}`.trim();

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
                {fullName}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
                Client Profile & Service Records
              </p>
            </div>

            {/* Quick Contact Buttons */}
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
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
              {customer.email || "No email provided"}
            </p>
          </div>
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#666] tracking-wider block">
              Financial Terms
            </span>
            <p className="text-sm font-semibold text-[#22c55e]">
              {customer.is_tax_exempt ? "Tax Exempt" : "Standard Tax (15%)"}{" "}
              {customer.custom_payment_terms_days > 0 ? `• Net ${customer.custom_payment_terms_days}d` : "• COD"}
            </p>
          </div>
        </div>

        {/* Vehicles Owned */}
        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              Registered Vehicles ({vehicles.length})
            </h2>
            <Link
              href="/vehicles"
              className="text-xs font-bold text-[#22c55e] hover:underline"
            >
              + Add Vehicle
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <p className="text-xs text-[#737373] py-2">No vehicles registered for this client.</p>
          ) : (
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
                      {v.vin ? `VIN: ${v.vin}` : "VIN: Not recorded"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#ededed] bg-[#141414] border border-[#2a2a2a] px-2.5 py-1 rounded-lg uppercase">
                      {v.license_plate}
                    </span>
                    <span className="text-xs text-[#8e8e8e]">
                      {v.mileage_km.toLocaleString()} km
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service Order History */}
        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3.5">
          <h2 className="text-base font-bold text-white">
            Workshop Repair History ({jobs.length})
          </h2>
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <p className="text-xs text-[#737373]">
                No repair orders logged for this client yet.
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
                      {job.ro_number}
                    </span>
                    <span className="text-[#737373]">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm mt-1">
                    {job.recommended_work || job.customer_concern}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-[#8e8e8e] mt-2">
                    <span className="capitalize">
                      Status: {job.status} ({job.completion_percentage}%)
                    </span>
                    <span className="font-mono font-bold text-[#ededed]">
                      {formatCurrency(job.total_amount)}
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
