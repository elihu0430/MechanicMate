"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function NotificationSettingsPage() {
  const [smsReady, setSmsReady] = useState(true);
  const [smsQuote, setSmsQuote] = useState(true);
  const [reminder24h, setReminder24h] = useState(true);
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    "Hi {CustomerName}, your vehicle {VehiclePlate} is ready for collection at Dev's Auto Workshop. Total due: {TotalBalance}. Hours: Mon-Fri 07:30 - 17:30.",
  );
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#212121] pb-5">
        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white mb-1 transition-colors"
          >
            <span>← Back to Workshop Settings</span>
          </Link>
          <h1 className="text-2xl font-black text-white">
            Automated Customer Notifications
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Configure automated Twilio SMS triggers and WhatsApp web messaging
            templates.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a] self-start sm:self-auto"
        >
          Save Template
        </button>
      </div>

      {saved && (
        <div className="rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 p-3 text-xs text-[#22c55e]">
          Notification triggers updated successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#a3a3a3]">
            Trigger Rules
          </h2>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#242424] cursor-pointer">
            <div>
              <p className="text-xs font-bold text-white">
                24-Hour Service Appointment Reminder
              </p>
              <p className="text-[11px] text-[#737373]">
                Dispatches SMS 24 hours prior to booked bay slot.
              </p>
            </div>
            <input
              type="checkbox"
              checked={reminder24h}
              onChange={(e) => setReminder24h(e.target.checked)}
              className="h-4 w-4 accent-[#22c55e]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#242424] cursor-pointer">
            <div>
              <p className="text-xs font-bold text-white">
                Vehicle Ready for Pickup
              </p>
              <p className="text-[11px] text-[#737373]">
                Alerts customer immediately when RO status is moved to Ready.
              </p>
            </div>
            <input
              type="checkbox"
              checked={smsReady}
              onChange={(e) => setSmsReady(e.target.checked)}
              className="h-4 w-4 accent-[#22c55e]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#242424] cursor-pointer">
            <div>
              <p className="text-xs font-bold text-white">
                Quotation Approval Request
              </p>
              <p className="text-[11px] text-[#737373]">
                Sends secure portal signature link to vehicle owner.
              </p>
            </div>
            <input
              type="checkbox"
              checked={smsQuote}
              onChange={(e) => setSmsQuote(e.target.checked)}
              className="h-4 w-4 accent-[#22c55e]"
            />
          </label>
        </div>

        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#a3a3a3]">
            WhatsApp Dispatch Message Template
          </h2>
          <textarea
            rows={4}
            value={whatsappTemplate}
            onChange={(e) => setWhatsappTemplate(e.target.value)}
            className="w-full rounded-xl bg-[#181818] border border-[#282828] p-3 text-xs text-white focus:border-[#22c55e] focus:outline-none"
          />
          <p className="text-[11px] text-[#666]">
            Available variables:{" "}
            <span className="font-mono text-[#888]">
              {"{CustomerName}"}, {"{VehiclePlate}"}, {"{TotalBalance}"},{" "}
              {"{RO_Number}"}
            </span>
          </p>
        </div>
      </form>
    </div>
  );
}
