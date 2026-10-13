"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("MechanicMate System Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center text-white space-y-5">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-3xl animate-bounce">
        ⚠️
      </div>
      <div className="space-y-2 max-w-sm">
        <h1 className="text-2xl font-black text-white">
          Workshop System Alert
        </h1>
        <p className="text-xs text-[#8a8a8a]">
          An unexpected error occurred during database operation or page
          rendering.
        </p>
        {error.digest && (
          <p className="font-mono text-[11px] text-[#ef4444] bg-[#1a1a1a] p-2 rounded-lg border border-[#262626]">
            Error Code: {error.digest}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="min-h-[44px] rounded-xl bg-[#22c55e] px-5 py-2.5 text-xs font-black text-black hover:bg-[#16a34a] shadow-lg transition-all"
        >
          Retry Diagnostic
        </button>
        <Link
          href="/"
          className="min-h-[44px] inline-flex items-center rounded-xl bg-[#1a1a1a] border border-[#2b2b2b] px-4 py-2.5 text-xs font-bold text-neutral-300 hover:text-white"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
