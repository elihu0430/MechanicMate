"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchPortalInspection, type ApiInspection } from "@/lib/api/inspections";
import { formatDate } from "@/lib/format";

export default function CustomerInspectionPortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [inspection, setInspection] = useState<ApiInspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchPortalInspection(token)
      .then((data) => {
        setInspection(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Error loading portal inspection:", err);
        setError("Unable to find or load this inspection report. The link may have expired.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
        <p className="text-xs text-[#8c8c8c]">Loading vehicle inspection report...</p>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm text-red-400">{error || "Inspection document not found."}</p>
        <p className="text-xs text-neutral-500">Please contact the workshop if you need assistance.</p>
      </div>
    );
  }

  const items = inspection.checklist_items || [];
  const urgentCount = items.filter(
    (i) => i.status === "poor" || i.status === "urgent"
  ).length;
  const attentionCount = items.filter(
    (i) => i.status === "fair" || i.status === "attention"
  ).length;
  const goodCount = items.filter(
    (i) => i.status === "good" || i.status === "pass"
  ).length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#22c55e]">
            Digital Vehicle Health Report
          </span>
          <span className="font-mono text-xs text-[#737373]">
            {formatDate(inspection.created_at)}
          </span>
        </div>
        <h1 className="text-xl font-black text-white">
          Inspection Report #{inspection.inspection_number}
        </h1>
        <p className="text-xs text-[#8a8a8a]">
          Status: <span className="text-[#22c55e] font-bold capitalize">{inspection.status}</span> &bull; Verified by Lead Master Technician
        </p>
      </div>

      {/* Triage Summary Badges */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 p-3 text-center">
          <span className="text-lg font-black text-[#ef4444] font-mono">
            {urgentCount}
          </span>
          <p className="text-[10px] uppercase font-bold text-[#ef4444]">
            Urgent Items
          </p>
        </div>
        <div className="rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 p-3 text-center">
          <span className="text-lg font-black text-[#f59e0b] font-mono">
            {attentionCount}
          </span>
          <p className="text-[10px] uppercase font-bold text-[#f59e0b]">
            Attention
          </p>
        </div>
        <div className="rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 p-3 text-center">
          <span className="text-lg font-black text-[#22c55e] font-mono">
            {goodCount}
          </span>
          <p className="text-[10px] uppercase font-bold text-[#22c55e]">
            Good Condition
          </p>
        </div>
      </div>

      {/* Item Checklist */}
      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Inspected Components ({items.length})
        </h2>

        <div className="space-y-3">
          {items.map((item, idx) => {
            const isUrgent = item.status === "poor" || item.status === "urgent";
            const isAttention = item.status === "fair" || item.status === "attention";
            return (
              <div
                key={item.id || idx}
                className="rounded-xl bg-[#181818] border border-[#262626] p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#737373] block">
                      {item.category}
                    </span>
                    <p className="text-xs font-bold text-white">{item.title}</p>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
                      isUrgent
                        ? "bg-[#ef4444]/20 text-[#ef4444]"
                        : isAttention
                        ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                        : "bg-[#22c55e]/20 text-[#22c55e]"
                    }`}
                  >
                    {isUrgent ? "Urgent / Fail" : isAttention ? "Attention" : "Good / Pass"}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-xs text-[#a3a3a3] pt-1 border-t border-[#222222]">
                    {item.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
