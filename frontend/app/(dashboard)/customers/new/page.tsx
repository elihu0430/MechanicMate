"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";

export default function NewCustomerPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/customers");
  };

  return (
    <AppShell activeItem="customers">
      <div className="mx-auto max-w-xl px-4 py-6 space-y-6">
        <div className="border-b border-[#212121] pb-4">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white transition-colors mb-1"
          >
            <span>← Back to customers</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Register New Customer
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
            Add a vehicle owner profile with phone number for WhatsApp status
            updates.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
            <div>
              <label className="text-xs text-[#8e8e8e] block mb-1 font-semibold">
                Customer Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sipho Sithole"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-[#8e8e8e] block mb-1 font-semibold">
                Mobile Number (for SMS & WhatsApp quotes)
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 082 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-[#8e8e8e] block mb-1 font-semibold">
                Email Address (Optional for PDF invoices)
              </label>
              <input
                type="email"
                placeholder="e.g. sipho@example.co.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-[#8e8e8e] block mb-1 font-semibold">
                Physical / Billing Address
              </label>
              <input
                type="text"
                placeholder="e.g. 12 River Road, Randburg"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-[#8e8e8e] block mb-1 font-semibold">
                Internal Workshop Notes
              </label>
              <textarea
                rows={2}
                placeholder="Special requirements, billing terms, fleet discounts..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/customers"
              className="flex-1 min-h-[48px] inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] border border-[#282828] text-sm font-bold text-white hover:bg-[#222]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="flex-1 min-h-[48px] inline-flex items-center justify-center rounded-xl bg-[#22c55e] text-sm font-bold text-black hover:bg-[#16a34a] shadow-lg shadow-emerald-950/30"
            >
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
