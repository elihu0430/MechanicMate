"use client";

import React from "react";
import Link from "next/link";

interface OnboardingScreenProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export function OnboardingScreen({
  onGetStarted,
  onSignIn,
}: OnboardingScreenProps) {
  const featurePills = [
    ["Repair Orders", "Vehicle Inspections"],
    ["Estimates & Invoices", "Appointments", "Payments"],
    ["Service History"],
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-[#0a0a0a] px-5 py-8 sm:px-6 safe-inset-top safe-inset-bottom">
      {/* Subtle workshop ambient glow background */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-emerald-500/5 blur-[120px]"
        aria-hidden="true"
      />

      <main className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        {/* Gear / Automotive Logo Icon Container */}
        <div className="group mb-7 flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-[#141414] border border-[#272727] shadow-2xl shadow-black/80 transition-transform duration-300 hover:scale-105">
          <svg
            className="h-12 w-12 sm:h-14 sm:w-14 text-[#22c55e] transition-transform duration-700 group-hover:rotate-45"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Gear Outline */}
            <circle
              cx="12"
              cy="12"
              r="3"
              fill="currentColor"
              fillOpacity="0.15"
            />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>

        {/* Brand Heading */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white select-none">
          Mechanic<span className="text-[#22c55e]">Mate</span>
        </h1>

        {/* Tagline */}
        <p className="mt-3 text-lg sm:text-xl font-semibold text-[#ededed] tracking-tight">
          Your workshop. Your business. One app.
        </p>

        {/* Sub-description */}
        <div className="mt-3 max-w-md space-y-1.5 text-xs sm:text-sm text-[#8a8a8a] leading-relaxed">
          <p className="font-medium text-[#737373]">
            Built with Next.js · Clerk authentication · Supabase · Vercel.
          </p>
          <p>
            Manage customers, repair orders, inspections, estimates and invoices
            from one dashboard.
          </p>
        </div>

        {/* Feature Badges / Ergonomic Pills */}
        <div className="my-8 flex flex-col items-center gap-2.5 w-full max-w-sm">
          {featurePills.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-wrap justify-center gap-2">
              {row.map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center justify-center rounded-xl bg-[#171717] px-3.5 py-1.5 text-xs font-medium text-[#a3a3a3] border border-[#272727] shadow-sm select-none transition-colors hover:border-[#383838] hover:text-[#ededed]"
                >
                  {feature}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex w-full max-w-xs sm:max-w-sm items-center justify-center gap-3 pt-2">
          {onGetStarted ? (
            <button
              onClick={onGetStarted}
              type="button"
              className="flex-1 inline-flex items-center justify-center min-h-[48px] rounded-xl bg-[#22c55e] px-5 py-3 text-sm sm:text-base font-bold text-black shadow-lg shadow-emerald-950/30 transition-all duration-150 hover:bg-[#16a34a] active:scale-[0.98] select-none touch-manipulation"
            >
              Get Started Free
            </button>
          ) : (
            <Link
              href="/sign-up"
              className="flex-1 inline-flex items-center justify-center min-h-[48px] rounded-xl bg-[#22c55e] px-5 py-3 text-sm sm:text-base font-bold text-black shadow-lg shadow-emerald-950/30 transition-all duration-150 hover:bg-[#16a34a] active:scale-[0.98] select-none touch-manipulation"
            >
              Get Started Free
            </Link>
          )}

          {onSignIn ? (
            <button
              onClick={onSignIn}
              type="button"
              className="inline-flex items-center justify-center min-h-[48px] rounded-xl bg-[#1c1c1c] border border-[#2c2c2c] px-6 py-3 text-sm sm:text-base font-bold text-white transition-all duration-150 hover:bg-[#262626] hover:border-[#3a3a3a] active:scale-[0.98] select-none touch-manipulation"
            >
              Sign In
            </button>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center min-h-[48px] rounded-xl bg-[#1c1c1c] border border-[#2c2c2c] px-6 py-3 text-sm sm:text-base font-bold text-white transition-all duration-150 hover:bg-[#262626] hover:border-[#3a3a3a] active:scale-[0.98] select-none touch-manipulation"
            >
              Sign In
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

export default OnboardingScreen;
