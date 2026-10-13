"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchJob, type RepairOrderRead } from "@/lib/api/jobs";

interface DamagePin {
  id: string;
  view: "top" | "front" | "rear" | "left" | "right";
  x: number;
  y: number;
  type: "Dent" | "Scratch" | "Crack" | "Rust";
  severity: "Minor" | "Moderate" | "Severe";
  notes?: string;
}

const INITIAL_PINS: DamagePin[] = [
  {
    id: "dp-1",
    view: "top",
    x: 28,
    y: 35,
    type: "Dent",
    severity: "Minor",
    notes: "Hail dent on hood",
  },
  {
    id: "dp-2",
    view: "left",
    x: 62,
    y: 55,
    type: "Scratch",
    severity: "Moderate",
    notes: "Deep scratch along rear door",
  },
];

export default function JobDamageDiagramPage() {
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<RepairOrderRead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchJob(id)
      .then((data) => setJob(data))
      .catch((err) => console.error("Error loading job for damage diagram:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const [activeView, setActiveView] = useState<
    "top" | "left" | "right" | "front" | "rear"
  >("top");
  const [pins, setPins] = useState<DamagePin[]>(INITIAL_PINS);
  const [selectedPin, setSelectedPin] = useState<DamagePin | null>(null);

  // New pin placement state
  const [pendingCoords, setPendingCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [damageType, setDamageType] = useState<
    "Dent" | "Scratch" | "Crack" | "Rust"
  >("Dent");
  const [severity, setSeverity] = useState<"Minor" | "Moderate" | "Severe">(
    "Minor",
  );
  const [notes, setNotes] = useState("");

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPendingCoords({ x, y });
    setSelectedPin(null);
  };

  const handleSavePin = () => {
    if (!pendingCoords) return;
    const newPin: DamagePin = {
      id: `dp-${Date.now()}`,
      view: activeView,
      x: pendingCoords.x,
      y: pendingCoords.y,
      type: damageType,
      severity,
      notes,
    };
    setPins([...pins, newPin]);
    setPendingCoords(null);
    setNotes("");
  };

  const handleDeletePin = (pinId: string) => {
    setPins(pins.filter((p) => p.id !== pinId));
    setSelectedPin(null);
  };

  const currentViewPins = pins.filter((p) => p.view === activeView);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
        <p className="text-xs text-[#8c8c8c]">Loading vehicle schematic...</p>
      </div>
    );
  }

  const roNumber = job?.ro_number || id;
  const plate = job?.vehicle?.license_plate || "Vehicle";
  const vehicleDesc = job?.vehicle
    ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`
    : "Vehicle Schematic";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#212121] pb-5">
        <div>
          <Link
            href={`/jobs/${job?.id || id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white mb-1 transition-colors"
          >
            <span>← Back to {roNumber} Overview</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Vehicle Damage Mapping
            </h1>
            <span className="font-mono text-xs font-bold text-white bg-[#1a1a1a] border border-[#2e2e2e] px-2.5 py-1 rounded-lg">
              {plate}
            </span>
          </div>
          <p className="text-xs text-[#737373] mt-1">
            {vehicleDesc} &bull; Tap panels to plot damage pins
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex gap-1.5 bg-[#141414] p-1.5 rounded-xl border border-[#242424] overflow-x-auto custom-scrollbar">
          {(["top", "left", "right", "front", "rear"] as const).map((view) => (
            <button
              key={view}
              onClick={() => {
                setActiveView(view);
                setPendingCoords(null);
                setSelectedPin(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all select-none ${
                activeView === view
                  ? "bg-[#22c55e] text-black shadow-sm"
                  : "text-[#8a8a8a] hover:text-white"
              }`}
            >
              {view} View
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Diagram Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-3xl bg-[#141414] border border-[#242424] p-6 relative flex flex-col items-center justify-center min-h-[380px] select-none">
          <span className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-wider text-[#737373]">
            {activeView.toUpperCase()} VIEW SCHEMATIC — TAP TO DROP PIN
          </span>

          <div
            onClick={handleDiagramClick}
            className="relative w-full max-w-[340px] h-[340px] border border-dashed border-[#2b2b2b] rounded-2xl bg-[#0e0e0e] flex items-center justify-center cursor-crosshair overflow-hidden"
          >
            {/* High-Contrast SVG Vehicle Silhouette */}
            <svg
              className="w-4/5 h-4/5 text-[#2c2c2c] transition-transform duration-300"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              {activeView === "top" && (
                <path d="M30,10 C35,5 65,5 70,10 L78,25 L80,75 L70,95 C65,98 35,98 30,95 L20,75 L22,25 Z M35,28 L65,28 L60,45 L40,45 Z M34,55 L66,55 L68,75 L32,75 Z" />
              )}
              {activeView === "left" && (
                <path d="M5,65 L15,55 L35,40 L65,40 L80,50 L95,55 L95,65 L85,65 A10,10 0 0,1 65,65 L35,65 A10,10 0 0,1 15,65 Z M38,44 L60,44 L60,55 L35,55 Z" />
              )}
              {activeView === "right" && (
                <path d="M95,65 L85,55 L65,40 L35,40 L20,50 L5,55 L5,65 L15,65 A10,10 0 0,0 35,65 L65,65 A10,10 0 0,0 85,65 Z M62,44 L40,44 L40,55 L65,55 Z" />
              )}
              {activeView === "front" && (
                <path d="M15,80 L20,35 C25,25 75,25 80,35 L85,80 C85,85 15,85 15,80 Z M28,38 L72,38 L68,55 L32,55 Z M20,68 A5,5 0 0,0 30,68 A5,5 0 0,0 20,68 Z M80,68 A5,5 0 0,0 70,68 A5,5 0 0,0 80,68 Z" />
              )}
              {activeView === "rear" && (
                <path d="M15,80 L20,35 C25,25 75,25 80,35 L85,80 C85,85 15,85 15,80 Z M28,38 L72,38 L70,55 L30,55 Z M20,60 H32 V68 H20 Z M68,60 H80 V68 H68 Z" />
              )}
            </svg>

            {/* Render Existing Pins for this View */}
            {currentViewPins.map((p) => {
              const isSelected = selectedPin?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPin(p);
                    setPendingCoords(null);
                  }}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shadow-lg transition-transform ${
                    p.severity === "Severe"
                      ? "bg-[#ef4444] text-white"
                      : p.severity === "Moderate"
                        ? "bg-[#f59e0b] text-black"
                        : "bg-[#38bdf8] text-black"
                  } ${isSelected ? "scale-125 ring-4 ring-[#22c55e]" : "hover:scale-110"}`}
                >
                  !
                </button>
              );
            })}

            {/* Pending Click Pin Indicator */}
            {pendingCoords && (
              <div
                style={{
                  left: `${pendingCoords.x}%`,
                  top: `${pendingCoords.y}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-[#22c55e] text-black flex items-center justify-center text-xs font-black animate-ping"
              />
            )}
          </div>
        </div>

        {/* Pin Management Panel */}
        <div className="lg:col-span-4 rounded-3xl bg-[#141414] border border-[#242424] p-5 space-y-4">
          {pendingCoords ? (
            <div className="space-y-4">
              <div className="border-b border-[#212121] pb-3">
                <span className="text-xs font-bold text-[#22c55e] uppercase">
                  Add Damage Pin ({pendingCoords.x}%, {pendingCoords.y}%)
                </span>
                <h3 className="text-sm font-bold text-white">Record Defect</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#a3a3a3]">
                  Damage Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Dent", "Scratch", "Crack", "Rust"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDamageType(t)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        damageType === t
                          ? "bg-[#22c55e] text-black border-[#22c55e]"
                          : "bg-[#1a1a1a] text-[#a3a3a3] border-[#2b2b2b]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#a3a3a3]">
                  Severity Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Minor", "Moderate", "Severe"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                        severity === s
                          ? s === "Severe"
                            ? "bg-[#ef4444] text-white border-[#ef4444]"
                            : s === "Moderate"
                              ? "bg-[#f59e0b] text-black border-[#f59e0b]"
                              : "bg-[#38bdf8] text-black border-[#38bdf8]"
                          : "bg-[#1a1a1a] text-[#737373] border-[#2b2b2b]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#a3a3a3]">
                  Technician Note
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paint broken, primer visible"
                  className="w-full rounded-xl bg-[#1c1c1c] border border-[#2c2c2c] p-2.5 text-xs text-white focus:border-[#22c55e] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSavePin}
                  className="flex-1 py-2.5 rounded-xl bg-[#22c55e] text-black font-bold text-xs hover:bg-[#16a34a]"
                >
                  Save Pin
                </button>
                <button
                  type="button"
                  onClick={() => setPendingCoords(null)}
                  className="px-3 py-2.5 rounded-xl bg-[#1a1a1a] text-neutral-400 text-xs hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : selectedPin ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#212121] pb-3">
                <h3 className="text-sm font-bold text-white">Pin Details</h3>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                    selectedPin.severity === "Severe"
                      ? "bg-[#ef4444]/20 text-[#ef4444]"
                      : selectedPin.severity === "Moderate"
                        ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                        : "bg-[#38bdf8]/20 text-[#38bdf8]"
                  }`}
                >
                  {selectedPin.severity}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#8a8a8a]">
                  <span>Type:</span>
                  <span className="font-bold text-white">
                    {selectedPin.type}
                  </span>
                </div>
                <div className="flex justify-between text-[#8a8a8a]">
                  <span>View:</span>
                  <span className="capitalize text-white font-mono">
                    {selectedPin.view}
                  </span>
                </div>
                <div className="flex justify-between text-[#8a8a8a]">
                  <span>Coordinates:</span>
                  <span className="font-mono text-white">
                    {selectedPin.x}%, {selectedPin.y}%
                  </span>
                </div>
                {selectedPin.notes && (
                  <div className="pt-2 border-t border-[#212121]">
                    <span className="text-[#737373] block mb-1">Notes:</span>
                    <p className="text-neutral-300 bg-[#181818] p-2 rounded-lg">
                      {selectedPin.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDeletePin(selectedPin.id)}
                  className="w-full py-2.5 rounded-xl bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#ef4444] text-xs font-bold hover:bg-[#ef4444]/30"
                >
                  Remove Pin
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <span className="text-2xl">📍</span>
              <p className="text-xs font-bold text-white">
                Total Pins Recorded: {pins.length}
              </p>
              <p className="text-[11px] text-[#737373] max-w-xs mx-auto">
                Tap anywhere on the vehicle silhouette to mark hail dents, paint
                scratches, and structural cracks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
