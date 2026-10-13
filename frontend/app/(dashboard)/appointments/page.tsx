"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MOCK_APPOINTMENTS } from "@/lib/mock-data";
import { Appointment } from "@/lib/types";

export default function AppointmentsPage() {
  const [appointments, setAppointments] =
    useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    customer: "",
    vehicle: "",
    service: "",
    timeSlot: "09:00 - 11:30",
    bay: 1,
  });

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer || !form.service) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      customerId: "c-new",
      customerName: form.customer,
      customerPhone: "071 000 2233",
      vehicleName: form.vehicle || "Customer Vehicle",
      licensePlate: "NEW 123 GP",
      serviceType: form.service,
      date: "11 Sep 2026",
      timeSlot: form.timeSlot,
      bayNumber: form.bay,
      technicianName: "Alex Ndlovu",
      status: "confirmed",
    };

    setAppointments([...appointments, newApt]);
    setShowModal(false);
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
              Manage bay allocations, vehicle intake, and scheduled technician
              labor slots.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#22c55e] px-4 py-2.5 text-sm font-bold text-black shadow-md shadow-emerald-950/20 hover:bg-[#16a34a] active:scale-95 transition-all select-none self-start sm:self-auto"
          >
            <span className="text-base font-extrabold">+</span>
            <span>Book Bay Slot</span>
          </button>
        </div>

        {/* Bays Visual Grid */}
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
                    {bayApts.length} Slots Today
                  </span>
                </div>

                <div className="space-y-3">
                  {bayApts.map((apt) => (
                    <div
                      key={apt.id}
                      className="rounded-xl bg-[#181818] border border-[#262626] p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 rounded">
                          {apt.timeSlot}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            apt.status === "in-bay"
                              ? "bg-[#22c55e]/10 text-[#22c55e]"
                              : "bg-[#f59e0b]/10 text-[#f59e0b]"
                          }`}
                        >
                          {apt.status === "in-bay" ? "Active in Bay" : "Booked"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {apt.customerName}
                        </h3>
                        <p className="text-xs text-[#8e8e8e]">
                          {apt.vehicleName} ({apt.licensePlate})
                        </p>
                      </div>

                      <p className="text-xs font-semibold text-[#22c55e]">
                        {apt.serviceType}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal: Book Slot */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm safe-inset-top safe-inset-bottom">
            <div className="relative w-full max-w-md rounded-3xl bg-[#121212] border border-[#2a2a2a] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#212121] pb-3">
                <h2 className="text-lg font-bold text-white">
                  Book Bay Appointment
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-neutral-400 hover:text-white"
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
                    className="w-full"
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
                    className="w-full"
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
                    className="w-full"
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
                    className="flex-1 py-3 rounded-xl bg-[#1c1c1c] text-sm font-bold text-white hover:bg-[#252525]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-[#22c55e] text-sm font-bold text-black hover:bg-[#16a34a]"
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
