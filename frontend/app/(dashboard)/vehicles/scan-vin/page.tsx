"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ScanVinPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedVin, setScannedVin] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);
  const [decodedData, setDecodedData] = useState<{
    year: string;
    make: string;
    model: string;
    engine: string;
    bodyStyle: string;
  } | null>(null);

  // Manual input fallback
  const [manualVin, setManualVin] = useState("");

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn(
        "Camera access denied or unavailable in this environment:",
        err,
      );
      alert(
        "Camera access unavailable. You can use the instant VIN decoder below.",
      );
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleDecodeVin = (vinToDecode: string) => {
    const cleanVin = vinToDecode.trim().toUpperCase();
    if (cleanVin.length !== 17) {
      alert("VIN must be exactly 17 characters.");
      return;
    }

    setDecoding(true);
    setScannedVin(cleanVin);

    // Simulate NHTSA VPIC API lookup
    setTimeout(() => {
      setDecoding(false);
      setDecodedData({
        year: "2018",
        make: "Toyota",
        model: "Corolla 1.6 Prestige",
        engine: "1.6L 4-Cylinder DOHC (1ZR-FE)",
        bodyStyle: "Sedan 4-Door",
      });
    }, 800);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="border-b border-[#212121] pb-5">
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white mb-1 transition-colors"
        >
          <span>← Back to Fleet Vehicles</span>
        </Link>
        <h1 className="text-2xl font-black text-white">
          VIN Barcode Camera Scanner
        </h1>
        <p className="text-xs text-[#737373] mt-0.5">
          Scan door jamb or windshield barcode to decode vehicle specs via NHTSA
          VPIC.
        </p>
      </div>

      {/* Viewfinder Camera Box */}
      <div className="rounded-3xl bg-[#141414] border border-[#242424] p-5 space-y-4">
        <div className="relative aspect-video rounded-2xl bg-[#0d0d0d] border-2 border-dashed border-[#2f2f2f] overflow-hidden flex flex-col items-center justify-center text-center p-4">
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
            playsInline
            muted
          />

          {cameraActive ? (
            <div className="relative z-10 w-4/5 h-24 border-2 border-[#22c55e] rounded-xl flex items-center justify-center">
              <div className="w-full h-0.5 bg-[#22c55e] animate-pulse shadow-[0_0_10px_#22c55e]" />
            </div>
          ) : (
            <div className="space-y-3 z-10">
              <span className="text-3xl">📷</span>
              <p className="text-xs text-[#8a8a8a] max-w-xs">
                Point camera at the 17-character VIN barcode inside the driver
                side door pillar or dashboard.
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a] shadow-md"
              >
                Activate Device Camera
              </button>
            </div>
          )}
        </div>

        {/* Quick Sample Test Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#737373]">
          <span>Test with sample VIN:</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleDecodeVin("JTDBU4EE2A9074318")}
              className="font-mono text-xs font-bold text-[#22c55e] bg-[#1a1a1a] px-2.5 py-1 rounded-lg hover:bg-[#252525]"
            >
              Toyota (Corolla)
            </button>
            <button
              onClick={() => handleDecodeVin("WBA8E9G59GNT12345")}
              className="font-mono text-xs font-bold text-[#38bdf8] bg-[#1a1a1a] px-2.5 py-1 rounded-lg hover:bg-[#252525]"
            >
              BMW (320i)
            </button>
          </div>
        </div>
      </div>

      {/* Manual Fallback Input */}
      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-3">
        <label className="text-xs font-bold text-[#a3a3a3]">
          Or Type 17-Character VIN Manually
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={17}
            value={manualVin}
            onChange={(e) => setManualVin(e.target.value.toUpperCase())}
            placeholder="e.g. JTDBU4EE2A9074318"
            className="flex-1 rounded-xl bg-[#1a1a1a] border border-[#2c2c2c] px-3.5 py-2.5 text-sm font-mono tracking-widest text-white uppercase focus:border-[#22c55e] focus:outline-none"
          />
          <button
            onClick={() => handleDecodeVin(manualVin)}
            className="rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a]"
          >
            Decode
          </button>
        </div>
      </div>

      {/* Decoded Specs Card */}
      {decoding && (
        <div className="rounded-2xl bg-[#1a1a1a] p-5 text-center text-xs text-[#22c55e] animate-pulse">
          Querying NHTSA VPIC Vehicle Database...
        </div>
      )}

      {decodedData && (
        <div className="rounded-3xl bg-[#141414] border border-[#22c55e]/40 p-6 space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center border-b border-[#212121] pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#22c55e]">
                VPIC Decoder Match
              </span>
              <h3 className="text-base font-black text-white">
                {decodedData.year} {decodedData.make} {decodedData.model}
              </h3>
            </div>
            <span className="font-mono text-xs font-bold text-[#86efac] bg-[#22c55e]/10 px-2.5 py-1 rounded-md border border-[#22c55e]/20">
              {scannedVin}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#737373]">Engine Specs:</span>
              <p className="font-semibold text-white">{decodedData.engine}</p>
            </div>
            <div>
              <span className="text-[#737373]">Body Style:</span>
              <p className="font-semibold text-white">
                {decodedData.bodyStyle}
              </p>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => router.push(`/jobs/new?vin=${scannedVin}`)}
              className="flex-1 py-3 rounded-xl bg-[#22c55e] text-black font-black text-xs hover:bg-[#16a34a]"
            >
              + Create Repair Order with This Vehicle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
