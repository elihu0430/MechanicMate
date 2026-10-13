"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchPortalJob, type RepairOrderRead } from "@/lib/api/jobs";
import { formatCurrency } from "@/lib/format";

export default function CustomerEstimatePortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [job, setJob] = useState<RepairOrderRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [approved, setApproved] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchPortalJob(token)
      .then((data) => {
        setJob(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Error loading portal estimate:", err);
        setError("Unable to find or load this estimate. The link may have expired.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Initialize canvas
  useEffect(() => {
    if (loading || !job) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [loading, job]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleAuthorize = () => {
    if (!hasSignature) {
      alert("Please provide your digital signature before submitting authorization.");
      return;
    }
    setApproved(true);
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
        <p className="text-xs text-[#8c8c8c]">Loading your quotation...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm text-red-400">{error || "Quotation document not found."}</p>
        <p className="text-xs text-neutral-500">Please contact the workshop if you believe this is an error.</p>
      </div>
    );
  }

  const parts = job.items.filter((i) => i.item_type === "part");
  const labor = job.items.filter((i) => i.item_type === "labour" || i.item_type === "labor");
  const customerName = job.customer?.name || "Customer";
  const vehicleDesc = job.vehicle
    ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`
    : "Vehicle";
  const plate = job.vehicle?.license_plate || "ZA-PLATE";

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#22c55e]">
            Official Repair Quotation
          </span>
          <span className="font-mono text-xs text-[#737373]">
            {job.ro_number}
          </span>
        </div>
        <h1 className="text-xl font-black text-white">
          Hi {customerName}, please review your repair estimate
        </h1>
        <p className="text-xs text-[#8a8a8a]">
          {vehicleDesc} &bull; Plate:{" "}
          <span className="font-mono text-white font-bold">
            {plate}
          </span>
        </p>
      </div>

      {/* Technician Diagnostic Note */}
      {job.diagnosis && (
        <div className="rounded-2xl bg-[#181818] border border-[#262626] p-4 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-white font-bold">
            <span>🔧 Lead Technician Findings:</span>
          </div>
          <p className="text-neutral-300 leading-relaxed">{job.diagnosis}</p>
        </div>
      )}

      {/* Parts & Labor Breakdown */}
      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Proposed Service & Replacement Parts
        </h2>

        <div className="space-y-2.5">
          {parts.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between text-xs py-1.5 border-b border-[#1f1f1f]"
            >
              <div>
                <p className="font-medium text-white">{p.description}</p>
                <p className="text-[11px] text-[#737373]">Qty: {p.quantity}</p>
              </div>
              <span className="font-mono font-semibold text-neutral-200">
                {formatCurrency(p.total_price)}
              </span>
            </div>
          ))}

          {labor.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between text-xs py-1.5 border-b border-[#1f1f1f]"
            >
              <div>
                <p className="font-medium text-white">{l.description}</p>
                <p className="text-[11px] text-[#737373]">
                  {l.labour_hours || l.quantity} hrs labor
                </p>
              </div>
              <span className="font-mono font-semibold text-neutral-200">
                {formatCurrency(l.total_price)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="pt-2 space-y-1.5 text-xs text-[#8a8a8a]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono text-white">
              {formatCurrency(job.subtotal_parts + job.subtotal_labour)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>VAT (15%):</span>
            <span className="font-mono text-white">
              {formatCurrency(job.tax_amount)}
            </span>
          </div>
          <div className="flex justify-between text-base font-black text-white pt-2 border-t border-[#262626]">
            <span>Total Estimate:</span>
            <span className="font-mono text-[#22c55e]">
              {formatCurrency(job.total_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Digital Signature Authorization Pad */}
      {!approved ? (
        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Authorize Work & Sign On Device
              </h3>
              <p className="text-xs text-[#737373] mt-0.5">
                Draw your signature inside the box using your finger or stylus.
              </p>
            </div>
            {hasSignature && (
              <button
                onClick={clearCanvas}
                className="text-xs text-[#ef4444] hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="rounded-xl border-2 border-dashed border-[#2e2e2e] bg-[#0c0c0c] p-2 flex justify-center">
            <canvas
              ref={canvasRef}
              width={400}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="touch-none w-full max-w-[400px] h-[180px] cursor-crosshair rounded-lg"
            />
          </div>

          <button
            onClick={handleAuthorize}
            className="w-full min-h-[48px] rounded-xl bg-[#22c55e] text-black font-bold text-sm hover:bg-[#16a34a] shadow-lg transition-all"
          >
            Authorize Estimate & Begin Repair Work
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 p-5 text-center space-y-2">
          <span className="text-3xl">🎉</span>
          <h3 className="text-base font-black text-[#22c55e]">
            Estimate Approved Successfully!
          </h3>
          <p className="text-xs text-[#86efac]">
            Thank you! Your technician has been notified and vehicle repair work is now authorized to proceed under {job.ro_number}.
          </p>
        </div>
      )}
    </div>
  );
}
