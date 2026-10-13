"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { MOCK_REPAIR_ORDERS, formatCurrency } from "@/lib/mock-data";

export default function CustomerEstimatePortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const job = MOCK_REPAIR_ORDERS[0]; // Primary sample job for portal demo

  const [approved, setApproved] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

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

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleAuthorize = () => {
    if (!hasSignature) {
      alert(
        "Please provide your digital signature before submitting authorization.",
      );
      return;
    }
    setApproved(true);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#22c55e]">
            Official Repair Quotation
          </span>
          <span className="font-mono text-xs text-[#737373]">
            {job.roNumber}
          </span>
        </div>
        <h1 className="text-xl font-black text-white">
          Hi {job.customerName}, please review your repair estimate
        </h1>
        <p className="text-xs text-[#8a8a8a]">
          {job.vehicleYear} {job.vehicleMake} {job.vehicleModel} &bull; Plate:{" "}
          <span className="font-mono text-white font-bold">
            {job.licensePlate}
          </span>
        </p>
      </div>

      {/* Technician Diagnostic Note */}
      <div className="rounded-2xl bg-[#181818] border border-[#262626] p-4 space-y-1.5 text-xs">
        <div className="flex items-center gap-2 text-white font-bold">
          <span>🔧 Lead Technician Findings:</span>
        </div>
        <p className="text-neutral-300 leading-relaxed">{job.diagnosis}</p>
      </div>

      {/* Parts & Labor Breakdown */}
      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Proposed Service & Replacement Parts
        </h2>

        <div className="space-y-2.5">
          {job.parts.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between text-xs py-1.5 border-b border-[#1f1f1f]"
            >
              <div>
                <p className="font-medium text-white">{p.name}</p>
                <p className="text-[11px] text-[#737373]">Qty: {p.qty}</p>
              </div>
              <span className="font-mono font-semibold text-neutral-200">
                {formatCurrency(p.qty * p.unitPrice)}
              </span>
            </div>
          ))}

          {job.labor.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between text-xs py-1.5 border-b border-[#1f1f1f]"
            >
              <div>
                <p className="font-medium text-white">{l.description}</p>
                <p className="text-[11px] text-[#737373]">
                  {l.hours} hrs labor
                </p>
              </div>
              <span className="font-mono font-semibold text-neutral-200">
                {formatCurrency(l.hours * l.rate)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="pt-2 space-y-1.5 text-xs text-[#8a8a8a]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono text-white">
              {formatCurrency(job.estimateSubtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>VAT (15%):</span>
            <span className="font-mono text-white">
              {formatCurrency(job.taxAmount)}
            </span>
          </div>
          <div className="flex justify-between text-base font-black text-white pt-2 border-t border-[#262626]">
            <span>Total Estimate:</span>
            <span className="font-mono text-[#22c55e]">
              {formatCurrency(job.estimateTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Digital Signature Authorization Pad (Module 06) */}
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
                type="button"
                onClick={clearSignature}
                className="text-xs text-[#ef4444] hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="rounded-xl border-2 border-dashed border-[#333333] bg-[#0d0d0d] p-1 flex justify-center">
            <canvas
              ref={canvasRef}
              width={400}
              height={160}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="touch-none w-full max-w-[400px] h-[160px] cursor-crosshair rounded-lg"
            />
          </div>

          <div className="text-[11px] text-[#666666] leading-relaxed">
            By signing, you authorize Dev&apos;s Auto Workshop to proceed with
            the specified repairs, parts orders, and diagnostic tests at the
            quoted total of {formatCurrency(job.estimateTotal)}.
          </div>

          <button
            type="button"
            onClick={handleAuthorize}
            className="w-full min-h-[48px] rounded-xl bg-[#22c55e] text-black font-black text-sm hover:bg-[#16a34a] shadow-lg transition-all select-none touch-manipulation flex items-center justify-center gap-2"
          >
            <span>✍️ Approve & Authorize Repairs</span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 p-6 text-center space-y-2">
          <span className="text-3xl">🎉</span>
          <h3 className="text-lg font-black text-white">
            Repair Work Authorized!
          </h3>
          <p className="text-xs text-[#86efac] max-w-sm mx-auto">
            Thank you, {job.customerName}. Your signature has been recorded. The
            workshop team has been notified to begin work on your vehicle.
          </p>
        </div>
      )}
    </div>
  );
}
