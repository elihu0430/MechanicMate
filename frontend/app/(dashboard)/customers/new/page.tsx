"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useApi } from "@/lib/api";

export default function NewCustomerPage() {
  const router = useRouter();
  const api = useApi();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const parts = name.trim().split(" ");
      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ") || "Customer";

      await api.customers.create({
        first_name: firstName,
        last_name: lastName,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      router.push("/customers");
    } catch (err: any) {
      console.error("Failed to create customer:", err);
      setError(err?.message || "Failed to create customer in live database");
      setIsSubmitting(false);
    }
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
            Add a vehicle owner profile with phone number for WhatsApp status updates.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
            <div>
              <label className="text-xs text-[#8e8e8e] block mb-1 font-semibold">
                Customer Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sipho Sithole"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white placeholder:text-[#555] focus:border-[#22c55e] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-[#8e8e8e] block mb-1 font-semibold">
                Mobile Number (for SMS & WhatsApp quotes) *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +27 82 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white placeholder:text-[#555] focus:border-[#22c55e] focus:outline-none"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white placeholder:text-[#555] focus:border-[#22c55e] focus:outline-none"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white placeholder:text-[#555] focus:border-[#22c55e] focus:outline-none"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#262626] text-sm text-white placeholder:text-[#555] focus:border-[#22c55e] focus:outline-none"
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
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] inline-flex items-center justify-center rounded-xl bg-[#22c55e] text-sm font-bold text-black hover:bg-[#16a34a] shadow-lg shadow-emerald-950/30 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
