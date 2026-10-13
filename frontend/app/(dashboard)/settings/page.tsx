"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { MOCK_WORKSHOP, MOCK_USER, formatCurrency } from "@/lib/mock-data";

export default function SettingsPage() {
  // Workshop Profile State
  const [workshopName, setWorkshopName] = useState(MOCK_WORKSHOP.name);
  const [vatNumber, setVatNumber] = useState(MOCK_WORKSHOP.vatNumber);
  const [phone, setPhone] = useState(MOCK_WORKSHOP.phone);
  const [email, setEmail] = useState(MOCK_WORKSHOP.email);
  const [address, setAddress] = useState(MOCK_WORKSHOP.address);

  // Financial & Rate Settings State
  const [labourRate, setLabourRate] = useState(
    MOCK_WORKSHOP.labourRateHourly.toString(),
  );
  const [taxRate, setTaxRate] = useState(
    MOCK_WORKSHOP.taxRatePercent.toString(),
  );
  const [currency, setCurrency] = useState(MOCK_WORKSHOP.currency);
  const [paymentTerms, setPaymentTerms] = useState("7");
  const [diagnosticFee, setDiagnosticFee] = useState("350");

  // Notifications State
  const [notifyReady, setNotifyReady] = useState(true);
  const [notifyQuote, setNotifyQuote] = useState(true);
  const [autoPrintInvoice, setAutoPrintInvoice] = useState(false);

  // Team Members
  const [teamMembers] = useState([
    {
      id: "u1",
      name: MOCK_USER.name,
      email: MOCK_USER.email,
      role: MOCK_USER.role,
      active: true,
      badge: "Lead Tech",
    },
    {
      id: "u2",
      name: "Sipho Khumalo",
      email: "sipho.k@devsauto.co.za",
      role: "Apprentice Technician",
      active: true,
      badge: "Bay 2",
    },
    {
      id: "u3",
      name: "Brenda Dube",
      email: "brenda@devsauto.co.za",
      role: "Service Advisor & Customer Desk",
      active: true,
      badge: "Front Desk",
    },
  ]);

  // Workshop Bays
  const [bays] = useState([
    {
      id: "b1",
      name: "Bay 1 - Heavy Hydraulic 4-Post Lift",
      status: "In Use (RO-1048)",
      tech: "Alex Ndlovu",
    },
    {
      id: "b2",
      name: "Bay 2 - Scissor Lift & 3D Wheel Alignment",
      status: "Available",
      tech: "Sipho Khumalo",
    },
    {
      id: "b3",
      name: "Bay 3 - Diagnostics & Electrical Station",
      status: "Available",
      tech: "Flexible",
    },
  ]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <AppShell activeItem="settings">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#212121] pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Workshop Settings
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
              Configure workshop credentials, hourly labor rates, South African
              VAT, and team preferences.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#22c55e] px-5 py-2.5 text-xs font-bold text-black hover:bg-[#16a34a] shadow-md transition-all select-none touch-manipulation self-start sm:self-auto"
          >
            <span>💾 Save All Changes</span>
          </button>
        </div>

        {/* Success Alert */}
        {savedSuccess && (
          <div className="rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 p-4 flex items-center gap-3 text-sm text-[#22c55e] animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-xl">✅</span>
            <div>
              <p className="font-bold">Settings Saved Successfully!</p>
              <p className="text-xs text-[#86efac]">
                Updated workshop profile, billing rates, and notification
                parameters have been saved.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Workshop Profile */}
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#212121] pb-3">
              <span className="text-lg">🏢</span>
              <h2 className="text-base font-bold text-white">
                Workshop Business Profile
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#a3a3a3]">
                  Workshop Trade Name
                </label>
                <input
                  type="text"
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  className="w-full rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] px-3.5 py-2.5 text-sm text-white focus:border-[#22c55e] focus:outline-none min-h-[42px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#a3a3a3]">
                  South African VAT Registration No.
                </label>
                <input
                  type="text"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  className="w-full rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#22c55e] focus:outline-none min-h-[42px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#a3a3a3]">
                  Workshop Primary Telephone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#22c55e] focus:outline-none min-h-[42px]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#a3a3a3]">
                  Billing & Customer Inquiries Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] px-3.5 py-2.5 text-sm text-white focus:border-[#22c55e] focus:outline-none min-h-[42px]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#a3a3a3]">
                  Physical Workshop Location Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] px-3.5 py-2.5 text-sm text-white focus:border-[#22c55e] focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Billing & Rates */}
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#212121] pb-3">
              <span className="text-lg">💰</span>
              <h2 className="text-base font-bold text-white">
                Labor Rates & Taxation
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#a3a3a3]">
                  Standard Labor Rate (ZAR / Hour)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#737373]">
                    R
                  </span>
                  <input
                    type="number"
                    value={labourRate}
                    onChange={(e) => setLabourRate(e.target.value)}
                    className="w-full rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] pl-8 pr-3 py-2.5 text-sm font-mono font-bold text-white focus:border-[#22c55e] focus:outline-none min-h-[42px]"
                  />
                </div>
                <p className="text-[11px] text-[#6d6d6d]">
                  Current default: R 480.00/hr
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#a3a3a3]">
                  Standard Tax / VAT Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] px-3.5 py-2.5 text-sm font-mono font-bold text-white focus:border-[#22c55e] focus:outline-none min-h-[42px]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#737373]">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-[#6d6d6d]">
                  South African standard is 15%
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#a3a3a3]">
                  Default Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] px-3.5 py-2.5 text-sm font-bold text-white focus:border-[#22c55e] focus:outline-none min-h-[42px]"
                >
                  <option value="ZAR">ZAR (South African Rand - R)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
                <p className="text-[11px] text-[#6d6d6d]">
                  Used across invoices and estimates
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#a3a3a3]">
                  Diagnostic OBD Scan Fee (ZAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#737373]">
                    R
                  </span>
                  <input
                    type="number"
                    value={diagnosticFee}
                    onChange={(e) => setDiagnosticFee(e.target.value)}
                    className="w-full rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] pl-8 pr-3 py-2.5 text-sm font-mono font-bold text-white focus:border-[#22c55e] focus:outline-none min-h-[42px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#a3a3a3]">
                  Standard Invoice Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] px-3.5 py-2.5 text-sm font-medium text-white focus:border-[#22c55e] focus:outline-none min-h-[42px]"
                >
                  <option value="0">Due on Handover (Same Day)</option>
                  <option value="7">7 Days Net</option>
                  <option value="14">14 Days Net</option>
                  <option value="30">30 Days Net (Fleet Accounts)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Workshop Team & Technicians */}
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#212121] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🔧</span>
                <h2 className="text-base font-bold text-white">
                  Technicians & Workshop Staff
                </h2>
              </div>
              <button
                type="button"
                onClick={() => alert("Add team member dialog")}
                className="text-xs font-bold text-[#22c55e] hover:underline"
              >
                + Add Staff Member
              </button>
            </div>

            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-xl bg-[#1a1a1a] border border-[#282828] p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22c55e] text-black font-black text-sm">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">
                        {member.name}
                      </p>
                      <p className="text-xs text-[#8a8a8a] leading-tight mt-0.5">
                        {member.role} • {member.email}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[#a3a3a3] bg-[#222222] border border-[#333333] px-2.5 py-1 rounded-lg">
                    {member.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Workshop Bays */}
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#212121] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🏗️</span>
                <h2 className="text-base font-bold text-white">
                  Workshop Service Bays
                </h2>
              </div>
              <span className="text-xs font-medium text-[#7a7a7a]">
                3 Bays Configured
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {bays.map((bay) => (
                <div
                  key={bay.id}
                  className="rounded-xl bg-[#1a1a1a] border border-[#282828] p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">
                      {bay.name.split(" - ")[0]}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        bay.status.includes("In Use")
                          ? "bg-[#f59e0b]"
                          : "bg-[#22c55e]"
                      }`}
                    />
                  </div>
                  <p className="text-xs font-semibold text-neutral-300 truncate">
                    {bay.name.split(" - ")[1]}
                  </p>
                  <div className="text-[11px] text-[#737373] flex justify-between pt-1 border-t border-[#262626]">
                    <span>{bay.status}</span>
                    <span>{bay.tech}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Automated Comms & Notifications */}
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#212121] pb-3">
              <span className="text-lg">📲</span>
              <h2 className="text-base font-bold text-white">
                Customer Notifications & Automation
              </h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a] border border-[#282828] cursor-pointer hover:border-[#383838] transition-colors">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">
                    Send WhatsApp Alert When Vehicle is Ready for Pickup
                  </p>
                  <p className="text-[11px] text-[#7a7a7a]">
                    Automatically prompts dispatch message with total balance
                    and collection hours.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyReady}
                  onChange={(e) => setNotifyReady(e.target.checked)}
                  className="h-4 w-4 accent-[#22c55e] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a] border border-[#282828] cursor-pointer hover:border-[#383838] transition-colors">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">
                    Quotation Approval Notifications
                  </p>
                  <p className="text-[11px] text-[#7a7a7a]">
                    Sends interactive cost estimate link before parts are
                    committed to repair order.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyQuote}
                  onChange={(e) => setNotifyQuote(e.target.checked)}
                  className="h-4 w-4 accent-[#22c55e] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a] border border-[#282828] cursor-pointer hover:border-[#383838] transition-colors">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">
                    Auto-trigger Print Dialog on Invoice Finalization
                  </p>
                  <p className="text-[11px] text-[#7a7a7a]">
                    Immediately opens system print dialogue formatted for A4
                    thermal or laser printers.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoPrintInvoice}
                  onChange={(e) => setAutoPrintInvoice(e.target.checked)}
                  className="h-4 w-4 accent-[#22c55e] rounded"
                />
              </label>
            </div>
          </div>

          {/* Section 6: System & Technical Info */}
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#212121] pb-3">
              <span className="text-lg">⚙️</span>
              <h2 className="text-base font-bold text-white">
                System Architecture & Sync Status
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-[#1a1a1a] p-3 border border-[#262626]">
                <p className="text-[#737373]">Offline IndexedDB Sync</p>
                <p className="font-bold text-[#22c55e] mt-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#22c55e]" />{" "}
                  Connected & Synced
                </p>
              </div>

              <div className="rounded-xl bg-[#1a1a1a] p-3 border border-[#262626]">
                <p className="text-[#737373]">Frontend Framework</p>
                <p className="font-mono font-bold text-white mt-1">
                  Next.js 16 + Tailwind v4
                </p>
              </div>

              <div className="rounded-xl bg-[#1a1a1a] p-3 border border-[#262626]">
                <p className="text-[#737373]">Database Target</p>
                <p className="font-bold text-neutral-300 mt-1">
                  Neon PostgreSQL + Drizzle
                </p>
              </div>
            </div>
          </div>

          {/* Section 7: Security & Workshop Bay Session */}
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#212121] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🔐</span>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Technician Session & Bay Access
                  </h2>
                  <p className="text-xs text-[#737373]">
                    Manage active authentication and terminal logout
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#181818] border border-[#262626]">
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">
                  Active Terminal: {MOCK_USER.name} ({MOCK_USER.email})
                </p>
                <p className="text-xs text-[#8a8a8a]">
                  Signed in with Lead Technician privileges for {workshopName}.
                </p>
              </div>

              <SignOutButton variant="danger" />
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="flex justify-end pt-2 pb-8">
            <button
              type="submit"
              className="min-h-[48px] rounded-xl bg-[#22c55e] px-8 py-3 text-sm font-black text-black hover:bg-[#16a34a] shadow-lg transition-all select-none touch-manipulation"
            >
              Save Workshop Configuration
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
