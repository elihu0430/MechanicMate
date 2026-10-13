"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs/legacy";

export default function SignUpPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
        <p className="text-xs text-neutral-400">Loading registration...</p>
      </div>
    );
  }

  return <ClerkSignUpInner />;
}

// ─── Real Clerk Custom Sign-Up Component ─────────────────────────────────────
function ClerkSignUpInner() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  // Registration form state
  const [workshopName, setWorkshopName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Verification step state
  const [verifying, setVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(45);

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password Strength Calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-neutral-700" };
    if (pass.length < 6)
      return { score: 1, label: "Too short", color: "bg-[#ef4444]" };
    let score = 1;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score === 2) return { score: 2, label: "Fair", color: "bg-[#f59e0b]" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-[#38bdf8]" };
    return { score: 4, label: "Strong", color: "bg-[#22c55e]" };
  };

  const strength = getPasswordStrength(password);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setErrorMsg(null);

    // Validation
    if (!workshopName.trim()) {
      setErrorMsg("Please enter your workshop trade name.");
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg("Please enter the lead master technician's full name.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please provide a valid work email address.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || fullName.trim();
      const lastName = nameParts.slice(1).join(" ") || "Technician";

      await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName,
        lastName,
      });

      // Prepare email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (err: unknown) {
      console.error("Clerk sign-up error:", err);
      const clerkError = err as {
        errors?: Array<{
          message?: string;
          longMessage?: string;
          code?: string;
        }>;
      };
      if (clerkError.errors && clerkError.errors.length > 0) {
        const first = clerkError.errors[0];
        if (first.code === "form_identifier_exists") {
          setErrorMsg(
            "An account with this email address already exists. Please sign in.",
          );
        } else {
          setErrorMsg(
            first.longMessage ||
              first.message ||
              "Failed to create workshop account.",
          );
        }
      } else {
        setErrorMsg("Unable to create account. Please check your information.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    if (val.length > 1) val = val.slice(-1);
    const updated = [...otpCode];
    updated[index] = val;
    setOtpCode(updated);

    if (val && index < 5) {
      const nextInput = document.getElementById(`signup-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp || loading) return;
    const fullCode = otpCode.join("").trim();
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
        // The email code was already verified on Clerk!
        if (signUp.createdSessionId) {
          await setActive?.({ session: signUp.createdSessionId });
          window.location.href = "/";
          return;
        } else {
          // Account is verified in Clerk; send directly to sign in
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

  const handleGoogleSignUp = async () => {
    if (!isLoaded || !signUp) return;
    setOauthLoading(true);
    setErrorMsg(null);
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string }> };
      setErrorMsg(
        clerkError.errors?.[0]?.message || "Google authentication failed.",
      );
      setOauthLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── Top Header & Close Button ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
          {verifying ? "Verify Workshop Email" : "Register Workshop Account"}
        </h1>
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1f1f1f] text-[#888] hover:text-white hover:bg-[#282828] transition-colors"
          aria-label="Close"
        >
          ✕
        </Link>
      </div>

      {/* ─── Brand Card Banner ──────────────────────────────────────── */}
      <div className="flex items-center gap-3.5 rounded-2xl bg-[#142318] border border-[#22c55e]/25 p-3.5 shadow-inner">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#22c55e] text-black font-black text-lg shadow-sm">
          M
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white leading-tight">
            MechanicMate
          </p>
          <p className="text-xs text-[#86efac] leading-tight mt-0.5 font-medium">
            Multi-Bay Workshop System & Repair Order Management
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 p-3 flex items-start gap-2.5 text-xs text-[#ef4444] animate-in fade-in duration-200">
          <span className="text-sm shrink-0">⚠️</span>
          <p className="flex-1">{errorMsg}</p>
        </div>
      )}

      {/* ─── Step 2: Email OTP Verification ─────────────────────────── */}
      {verifying ? (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-1 text-center">
            <p className="text-xs text-neutral-300">
              We dispatched a 6-digit verification code to:
            </p>
            <p className="font-mono text-xs font-bold text-[#22c55e]">
              {email}
            </p>
          </div>

          <div className="flex justify-center gap-2 pt-2">
            {otpCode.map((digit, idx) => (
              <input
                key={idx}
                id={`signup-otp-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, idx)}
                className="h-12 w-11 rounded-xl bg-[#1a1a1a] border border-[#2c2c2c] text-center font-mono text-lg font-black text-white focus:border-[#22c55e] focus:outline-none"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.join("").length < 6}
            className="w-full min-h-[46px] rounded-xl bg-[#22c55e] font-black text-sm text-black hover:bg-[#16a34a] shadow-lg shadow-emerald-950/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 select-none touch-manipulation disabled:opacity-50"
          >
            {loading
              ? "Verifying code... ⏳"
              : "Verify & Launch Workshop Bay →"}
          </button>

          <div className="flex items-center justify-between text-xs text-[#737373] pt-1">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0}
              className="text-[#22c55e] hover:underline disabled:text-[#555]"
            >
              Resend code {resendCooldown > 0 && `(${resendCooldown}s)`}
            </button>
            <button
              type="button"
              onClick={() => setVerifying(false)}
              className="hover:text-white"
            >
              Change email
            </button>
          </div>
        </form>
      ) : (
        /* ─── Step 1: Registration Form ────────────────────────────── */
        <form onSubmit={handleSignUp} className="space-y-3.5">
          {/* Workshop Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-black tracking-wider uppercase text-[#737373]">
              WORKSHOP TRADE NAME
            </label>
            <input
              type="text"
              required
              value={workshopName}
              onChange={(e) => setWorkshopName(e.target.value)}
              placeholder="e.g. Apex Auto Repairs"
              className="w-full rounded-xl bg-[#1a1a1a] border border-[#282828] px-3.5 py-2.5 text-sm text-white placeholder-[#555] focus:border-[#22c55e] focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Lead Tech Full Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-black tracking-wider uppercase text-[#737373]">
              LEAD MASTER TECHNICIAN
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full rounded-xl bg-[#1a1a1a] border border-[#282828] px-3.5 py-2.5 text-sm text-white placeholder-[#555] focus:border-[#22c55e] focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Work Email */}
          <div className="space-y-1">
            <label className="text-[11px] font-black tracking-wider uppercase text-[#737373]">
              WORK EMAIL
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="technician@workshop.co.za"
              className="w-full rounded-xl bg-[#1a1a1a] border border-[#282828] px-3.5 py-2.5 text-sm text-white placeholder-[#555] focus:border-[#22c55e] focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Password with Strength Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black tracking-wider uppercase text-[#737373]">
                CREATE PASSWORD
              </label>
              {password && (
                <span className="text-[10px] font-bold text-neutral-400">
                  Strength: {strength.label}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full rounded-xl bg-[#1a1a1a] border border-[#282828] pl-3.5 pr-11 py-2.5 text-sm text-white font-mono placeholder-[#555] focus:border-[#22c55e] focus:outline-none min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white p-1"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Password strength bar */}
            {password && (
              <div className="grid grid-cols-4 gap-1 pt-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1 rounded-full transition-all ${
                      strength.score >= step ? strength.color : "bg-neutral-800"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading || oauthLoading}
            className="w-full min-h-[46px] rounded-xl bg-[#22c55e] font-black text-sm text-black hover:bg-[#16a34a] shadow-lg shadow-emerald-950/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 select-none touch-manipulation disabled:opacity-50 mt-1"
          >
            {loading ? (
              <span>Creating workshop... ⏳</span>
            ) : (
              <span>Create Workshop Account →</span>
            )}
          </button>

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading || oauthLoading}
            className="w-full min-h-[46px] rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] hover:bg-[#242424] font-bold text-xs text-white transition-all flex items-center justify-center gap-2.5 select-none touch-manipulation disabled:opacity-50"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </form>
      )}

      {/* Trust Badge */}
      <div className="rounded-xl bg-[#161616] p-2.5 border border-[#222] text-center">
        <p className="text-[10px] text-[#6d6d6d]">
          🔒 Workshop-grade 256-bit encryption & multi-tenant isolation.
        </p>
      </div>

      {/* Footer */}
      <div className="text-center pt-1 border-t border-[#1f1f1f]">
        <p className="text-xs text-[#737373]">
          Already registered?{" "}
          <Link
            href="/sign-in"
            className="font-bold text-[#22c55e] hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
