"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs/legacy";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(45);

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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp || loading) {
      if (!signUp) {
        router.push("/sign-up");
      }
      return;
    }
    const fullCode = otp.join("").trim();
    if (fullCode.length < 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: fullCode,
      });

      if (
        completeSignUp.status === "complete" ||
        completeSignUp.createdSessionId
      ) {
        if (completeSignUp.createdSessionId) {
          await setActive?.({ session: completeSignUp.createdSessionId });
        }
        window.location.href = "/";
        return;
      } else {
        setErrorMsg(
          `Verification status: ${completeSignUp.status}. If your account is ready, please sign in.`,
        );
      }
    } catch (err: unknown) {
      console.error("Clerk verification error:", err);
      const clerkError = err as {
        errors?: Array<{
          message?: string;
          longMessage?: string;
          code?: string;
        }>;
      };
      const firstErr = clerkError.errors?.[0];
      const isAlreadyVerified =
        firstErr?.code === "verification_already_verified" ||
        firstErr?.message?.toLowerCase().includes("already been verified") ||
        firstErr?.longMessage?.toLowerCase().includes("already been verified");

      if (isAlreadyVerified) {
        if (signUp.createdSessionId) {
          await setActive?.({ session: signUp.createdSessionId });
          window.location.href = "/";
          return;
        } else {
          setErrorMsg("Email already verified! Redirecting to sign in...");
          setTimeout(() => {
            window.location.href = "/sign-in";
          }, 1000);
          return;
        }
      }

      setErrorMsg(
        firstErr?.longMessage ||
          firstErr?.message ||
          "Invalid verification code. Please check your email.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendCooldown(45);
      setErrorMsg(null);
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string }> };
      setErrorMsg(clerkError.errors?.[0]?.message || "Failed to resend code.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <span className="text-3xl">📬</span>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Verify Workshop Email
        </h2>
        <p className="text-xs text-[#8a8a8a]">
          {signUp?.emailAddress ? (
            <>We sent a 6-digit one-time code to <span className="text-white font-mono">{signUp.emailAddress}</span>.</>
          ) : (
            "We sent a 6-digit one-time code to your registered technician email."
          )}
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 p-3 flex items-start gap-2.5 text-xs text-[#ef4444]">
          <span className="text-sm shrink-0">⚠️</span>
          <p className="flex-1">{errorMsg}</p>
        </div>
      )}

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
          onClick={handleResendCode}
          disabled={resendCooldown > 0}
          className="text-[#22c55e] hover:underline disabled:text-[#555]"
        >
          Resend code {resendCooldown > 0 && `(${resendCooldown}s)`}
        </button>
        <Link href="/sign-in" className="hover:text-white">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
