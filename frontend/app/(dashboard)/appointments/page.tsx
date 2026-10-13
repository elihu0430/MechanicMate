"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { fetchJobs, type RepairOrderRead } from "@/lib/api/jobs";
import { formatDate } from "@/lib/format";

interface BaySlot {
  id: string;
  jobId?: string;
  roNumber: string;
  customerName: string;
  customerPhone: string;
  vehicleName: string;
  licensePlate: string;
  serviceType: string;
  timeSlot: string;
  bayNumber: number;
  status: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<BaySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    customer: "",
    vehicle: "",
    service: "",
    timeSlot: "09:00 - 11:30",
    bay: 1,
  });

  useEffect(() => {
    setLoading(true);
    fetchJobs()
      .then((jobs) => {
        // Map live repair orders to workshop bay allocations
        const mapped: BaySlot[] = jobs.map((j, index) => {
          const bay = (index % 2) + 1;
          const slots = ["08:00 - 10:30", "10:30 - 13:00", "14:00 - 16:30"];
          const timeSlot = slots[index % slots.length];
          return {
            id: j.id,
            jobId: j.id,
            roNumber: j.ro_number,
            customerName: j.customer?.name || "Customer",
            customerPhone: j.customer?.phone || "+27 11 000 0000",
            vehicleName: j.vehicle
              ? `${j.vehicle.year} ${j.vehicle.make} ${j.vehicle.model}`
              : "Vehicle",
            licensePlate: j.vehicle?.license_plate || "ZA-PLATE",
            serviceType: j.customer_concern,
            timeSlot,
            bayNumber: bay,
            status: j.status,
          };
        });
        setAppointments(mapped);
      })
      .catch((err) => {
        console.error("Failed to load bay appointments:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer || !form.service) return;

    const newApt: BaySlot = {
      id: `apt-${Date.now()}`,
      roNumber: `INT-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: form.customer,
      customerPhone: "071 000 2233",
      vehicleName: form.vehicle || "Customer Vehicle",
      licensePlate: "NEW 123 GP",
      serviceType: form.service,
      timeSlot: form.timeSlot,
      bayNumber: form.bay,
      status: "lead",
    };

    setAppointments([newApt, ...appointments]);
    setShowModal(false);
    setForm({
      customer: "",
      vehicle: "",
      service: "",
      timeSlot: "09:00 - 11:30",
      bay: 1,
    });
  };

  return (
    <AppShell activeItem="appointments">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Workshop Schedule & Bays
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
              Live bay allocations, active intake, and technician labor slots synced with repair orders.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#22c55e] px-4 py-2.5 text-sm font-bold text-black shadow-md shadow-emerald-950/20 hover:bg-[#16a34a] active:scale-95 transition-all select-none self-start sm:self-auto cursor-pointer"
          >
            <span className="text-base font-extrabold">+</span>
            <span>Book Bay Slot</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
            <p className="text-xs text-[#8c8c8c]">Loading bay schedule...</p>
          </div>
        ) : (
          /* Bays Visual Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((bayNum) => {
              const bayApts = appointments.filter((a) => a.bayNumber === bayNum);
              return (
                <div
                  key={bayNum}
                  className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#212121]">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#22c55e] animate-pulse" />
                      <h2 className="text-base font-bold text-white">
                        Workshop Bay #{bayNum}
                      </h2>
                    </div>
                    <span className="text-xs text-[#737373] font-mono">
                      {bayApts.length} Slots Assigned
                    </span>
                  </div>

                  <div className="space-y-3">
                    {bayApts.length === 0 ? (
                      <p className="text-xs text-neutral-500 italic py-4 text-center">
                        No active jobs assigned to this bay today.
                      </p>
                    ) : (
                      bayApts.map((apt) => (
                        <div
                          key={apt.id}
                          className="rounded-xl bg-[#181818] border border-[#262626] p-3.5 space-y-2 hover:border-[#383838] transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 rounded">
                              {apt.timeSlot}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#22c55e]/15 text-[#22c55e]">
                              {apt.status}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-bold text-white">
                                {apt.customerName}
                              </h3>
                              {apt.jobId && (
                                <Link
                                  href={`/jobs/${apt.jobId}`}
                                  className="text-[11px] font-mono font-semibold text-[#22c55e] hover:underline"
                                >
                                  {apt.roNumber} →
                                </Link>
                              )}
                            </div>
                            <p className="text-xs text-[#8a8a8a] mt-0.5">
                              {apt.vehicleName} &bull;{" "}
                              <span className="font-mono text-neutral-300">
                                {apt.licensePlate}
                              </span>
                            </p>
                          </div>

                          <div className="pt-2 border-t border-[#222] flex items-center justify-between text-xs">
                            <span className="text-[#a3a3a3] line-clamp-1">
                              {apt.serviceType}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Booking Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#2a2a2a] p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#222] pb-3">
                <h3 className="text-lg font-bold text-white">
                  Reserve Workshop Bay Slot
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleBook} className="space-y-3.5">
                <div>
                  <label className="text-xs text-[#888] font-semibold block mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sipho Mahlangu"
                    value={form.customer}
                    onChange={(e) =>
                      setForm({ ...form, customer: e.target.value })
                    }
                    className="w-full rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#888] font-semibold block mb-1">
                    Vehicle Details (Year, Make, Model, Plate)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2021 VW Polo (CA 456 MP)"
                    value={form.vehicle}
                    onChange={(e) =>
                      setForm({ ...form, vehicle: e.target.value })
                    }
                    className="w-full rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#888] font-semibold block mb-1">
                    Service Scope
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clutch Replacement or Oil Service"
                    value={form.service}
                    onChange={(e) =>
                      setForm({ ...form, service: e.target.value })
                    }
                    className="w-full rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#888] font-semibold block mb-1">
                      Time Slot
                    </label>
                    <select
                      value={form.timeSlot}
                      onChange={(e) =>
                        setForm({ ...form, timeSlot: e.target.value })
                      }
                      className="w-full rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] p-2.5 text-xs text-white"
                    >
                      <option value="08:00 - 10:30">08:00 - 10:30</option>
                      <option value="10:30 - 13:00">10:30 - 13:00</option>
                      <option value="14:00 - 16:30">14:00 - 16:30</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[#888] font-semibold block mb-1">
                      Assign Bay
                    </label>
                    <select
                      value={form.bay}
                      onChange={(e) =>
                        setForm({ ...form, bay: parseInt(e.target.value) })
                      }
                      className="w-full rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] p-2.5 text-xs text-white"
                    >
                      <option value={1}>Bay #1 (Lift 1)</option>
                      <option value={2}>Bay #2 (Lift 2)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl bg-[#1c1c1c] text-sm font-bold text-white hover:bg-[#252525] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-[#22c55e] text-sm font-bold text-black hover:bg-[#16a34a] cursor-pointer"
                  >
                    Confirm Booking
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
