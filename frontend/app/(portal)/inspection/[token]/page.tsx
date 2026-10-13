"use client";

import React from "react";
import { useParams } from "next/navigation";
import { MOCK_INSPECTIONS } from "@/lib/mock-data";

export default function CustomerInspectionPortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const inspection = MOCK_INSPECTIONS[0];

  const urgentCount = inspection.items.filter(
    (i) => i.status === "urgent",
  ).length;
  const attentionCount = inspection.items.filter(
    (i) => i.status === "attention",
  ).length;
  const goodCount = inspection.items.filter((i) => i.status === "good").length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#22c55e]">
            Digital Vehicle Health Report
          </span>
          <span className="font-mono text-xs text-[#737373]">
            {inspection.date}
          </span>
        </div>
        <h1 className="text-xl font-black text-white">
          Inspection for {inspection.vehicleName}
        </h1>
        <p className="text-xs text-[#8a8a8a]">
          License Plate:{" "}
          <span className="font-mono text-white font-bold">
            {inspection.plate}
          </span>{" "}
          &bull; Inspected by {inspection.technicianName}
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
          Inspected Components
        </h2>

        <div className="space-y-3">
          {inspection.items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-[#181818] border border-[#262626] p-3.5 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#737373] block">
                    {item.category}
                  </span>
                  <p className="text-xs font-bold text-white">{item.name}</p>
                </div>
                <span
                  className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
                    item.status === "urgent"
                      ? "bg-[#ef4444]/20 text-[#ef4444]"
                      : item.status === "attention"
                        ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                        : "bg-[#22c55e]/20 text-[#22c55e]"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              {item.notes && (
                <p className="text-xs text-[#a3a3a3] pt-1 border-t border-[#222222]">
                  {item.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
