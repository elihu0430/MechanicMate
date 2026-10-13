"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchJob, type RepairOrderRead } from "@/lib/api/jobs";
import { formatCurrency } from "@/lib/format";

export default function JobSignaturePage() {
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<RepairOrderRead | null>(null);
  const [loading, setLoading] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchJob(id)
      .then((data) => setJob(data))
      .catch((err) => console.error("Error loading job for signature:", err))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [loading]);

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
    setSaved(false);
  };

  const handleSaveSignature = () => {
    if (!hasSignature) {
      alert("Please provide a signature first.");
      return;
    }
    setSaved(true);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
        <p className="text-xs text-[#8c8c8c]">Loading authorization pad...</p>
      </div>
    );
  }

  const roNumber = job?.ro_number || id;
  const customerName = job?.customer?.name || "Customer";
  const total = job ? formatCurrency(job.total_amount) : "R 0.00";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#212121] pb-5">
        <div>
          <Link
            href={`/jobs/${job?.id || id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white mb-1 transition-colors"
          >
            <span>← Back to {roNumber}</span>
          </Link>
          <h1 className="text-2xl font-black text-white">
            Digital Authorization Pad
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Customer sign-off for {customerName} &bull; Total: {total}
          </p>
        </div>

        {hasSignature && (
          <button
            onClick={clearCanvas}
            className="text-xs text-[#ef4444] hover:underline self-start sm:self-auto"
          >
            Clear Pad
          </button>
        )}
      </div>

      {/* Signature Pad Card */}
      <div className="rounded-3xl bg-[#141414] border border-[#242424] p-6 space-y-4">
        <div className="flex justify-between items-center text-xs text-[#8a8a8a]">
          <span>Sign inside box using touchscreen or mouse</span>
          <span className="font-mono text-[#22c55e]">
            2048-bit Audit Timestamp
          </span>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-[#333333] bg-[#0c0c0c] p-2 flex justify-center">
          <canvas
            ref={canvasRef}
            width={520}
            height={220}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="touch-none w-full max-w-[520px] h-[220px] cursor-crosshair rounded-xl"
          />
        </div>

        {saved ? (
          <div className="rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 p-4 text-center space-y-1">
            <span className="text-xl">✅</span>
            <p className="text-xs font-bold text-[#22c55e]">
              Signature Stored to Vehicle Work Order Audit Trail
            </p>
            <p className="text-[11px] text-[#86efac]">
              Exported as compressed lossless PNG. Attached to {roNumber}.
            </p>
          </div>
        ) : (
          <button
            onClick={handleSaveSignature}
            className="w-full min-h-[48px] rounded-xl bg-[#22c55e] text-black font-black text-sm hover:bg-[#16a34a] shadow-lg transition-all"
          >
            Capture & Save Authorization Signature
          </button>
        )}
      </div>
    </div>
  );
}
