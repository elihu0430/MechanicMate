"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const handleOtpChange = (val: string, index: number) => {
    if (val.length > 1) val = val.slice(-1);
    const updated = [...otp];
    updated[index] = val;
    setOtp(updated);

    // Auto-advance focus to next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/");
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <span className="text-3xl">📬</span>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Verify Workshop Email
        </h2>
        <p className="text-xs text-[#8a8a8a]">
          We sent a 6-digit one-time code to your registered technician email.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-center gap-2 sm:gap-3">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(e.target.value, idx)}
              className="h-12 w-11 sm:w-12 rounded-xl bg-[#1c1c1c] border border-[#2c2c2c] text-center font-mono text-lg font-black text-white focus:border-[#22c55e] focus:outline-none"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otp.join("").length < 6}
          className="w-full min-h-[46px] rounded-xl bg-[#22c55e] font-black text-sm text-black hover:bg-[#16a34a] shadow-lg transition-all flex items-center justify-center gap-2 select-none touch-manipulation disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block animate-spin">⏳</span>
          ) : (
            <span>Verify & Open Workshop Bay →</span>
          )}
        </button>
      </form>

      <div className="flex items-center justify-between text-xs text-[#737373] pt-2 border-t border-[#212121]">
        <button
          type="button"
          onClick={() => alert("Verification code resent!")}
          className="text-[#22c55e] hover:underline"
        >
          Resend code (0:45)
        </button>
        <Link href="/sign-in" className="hover:text-white">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
