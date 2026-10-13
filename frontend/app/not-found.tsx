import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center text-white space-y-5">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-3xl">
        🛑
      </div>
      <div className="space-y-2 max-w-sm">
        <h1 className="text-4xl font-black font-mono text-[#ef4444]">404</h1>
        <h2 className="text-lg font-bold">Bay Not Found</h2>
        <p className="text-xs text-[#737373]">
          The repair order, vehicle record, or workshop route you requested
          could not be located in the database.
        </p>
      </div>

      <Link
        href="/"
        className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#22c55e] px-5 py-2.5 text-xs font-black text-black hover:bg-[#16a34a] shadow-lg transition-all select-none"
      >
        <span>← Return to Workshop Dashboard</span>
      </Link>
    </div>
  );
}
