"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs/legacy";

export default function SignInPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
        <p className="text-xs text-neutral-400">Loading sign in...</p>
      </div>
    );
  }

  return <ClerkSignInInner />;
}

// ─── Real Clerk Custom Sign-In Component ─────────────────────────────────────
function ClerkSignInInner() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Email Code / OTP sub-state (for accounts without password strategy configured)
  const [otpMode, setOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [emailAddressId, setEmailAddressId] = useState<string | null>(null);

  // Forgot password sub-state
  const [forgotMode, setForgotMode] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Load remembered email
  useEffect(() => {
    const saved = localStorage.getItem("mm_remembered_email");
    if (saved) setEmail(saved);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setErrorMsg(null);
    setInfoMsg(null);

    // Validation
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid technician email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your workshop password or security PIN.");
      return;
    }

    setLoading(true);

    try {
      // 1. First initiate sign-in with identifier to inspect supported strategies
      const initAttempt = await signIn.create({
        identifier: email.trim(),
      });

      if (initAttempt.status === "complete") {
        if (rememberMe) {
          localStorage.setItem("mm_remembered_email", email.trim());
        }
        if (initAttempt.createdSessionId) {
          await setActive({ session: initAttempt.createdSessionId });
        }
        window.location.href = "/";
        return;
      }

      if (initAttempt.status === "needs_first_factor") {
        const factors = initAttempt.supportedFirstFactors || [];
        const hasPassword = factors.some((f: any) => f.strategy === "password");
        const emailCodeFactor = factors.find((f: any) => f.strategy === "email_code") as any;

        if (hasPassword) {
          // Password strategy is valid for this account
          const result = await signIn.attemptFirstFactor({
            strategy: "password",
            password,
          });

          if (result.status === "complete") {
            if (rememberMe) {
              localStorage.setItem("mm_remembered_email", email.trim());
            } else {
              localStorage.removeItem("mm_remembered_email");
            }
            if (result.createdSessionId) {
              await setActive({ session: result.createdSessionId });
            }
            window.location.href = "/";
            return;
          } else {
            setErrorMsg(`Authentication requires additional step: ${result.status}`);
          }
        } else if (emailCodeFactor) {
          // Account was created with email OTP code (password strategy not enabled/configured)
          setEmailAddressId(emailCodeFactor.emailAddressId);
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor.emailAddressId,
          });
          setOtpMode(true);
          setInfoMsg("A 6-digit verification code has been dispatched to your email address.");
        } else {
          // Fallback direct attempt
          const result = await signIn.create({
            identifier: email.trim(),
            password,
          });
          if (result.status === "complete" && result.createdSessionId) {
            await setActive({ session: result.createdSessionId });
            window.location.href = "/";
          }
        }
      }
    } catch (err: unknown) {
      console.error("Clerk sign-in error:", err);
      const clerkError = err as {
        errors?: Array<{
          message?: string;
          longMessage?: string;
          code?: string;
        }>;
      };

      const first = clerkError.errors?.[0];
      const errMsg = first?.message || "";
      const isStrategyMismatch =
        first?.code === "strategy_for_user_invalid" ||
        errMsg.toLowerCase().includes("verification strategy is not valid");

      if (isStrategyMismatch) {
        // Fallback: Dispatch email code OTP automatically
        try {
          const fallbackAttempt = await signIn.create({ identifier: email.trim() });
          const factors = fallbackAttempt.supportedFirstFactors || [];
          const emailCodeFactor = factors.find((f: any) => f.strategy === "email_code") as any;
          if (emailCodeFactor) {
            setEmailAddressId(emailCodeFactor.emailAddressId);
            await signIn.prepareFirstFactor({
              strategy: "email_code",
              emailAddressId: emailCodeFactor.emailAddressId,
            });
            setOtpMode(true);
            setInfoMsg("Password authentication is disabled for this account. A verification code was sent to your email.");
            return;
          }
        } catch (fbErr) {
          console.error("Fallback OTP dispatch failed:", fbErr);
        }
      }

      if (first?.code === "form_identifier_not_found") {
        setErrorMsg("No workshop account found with this email. Please sign up.");
      } else if (first?.code === "form_password_incorrect") {
        setErrorMsg("Incorrect password or security PIN. Please try again.");
      } else {
        setErrorMsg(first?.longMessage || first?.message || "Failed to authenticate.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn || !otpCode.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code: otpCode.trim(),
      });

      if (result.status === "complete") {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }
        window.location.href = "/";
      } else {
        setErrorMsg(`Authentication status: ${result.status}`);
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);
      setErrorMsg(err?.errors?.[0]?.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    setOauthLoading(true);
    setErrorMsg(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: unknown) {
      console.error("Google OAuth error:", err);
      const clerkError = err as { errors?: Array<{ message?: string }> };
      setErrorMsg(
        clerkError.errors?.[0]?.message ||
          "Could not initialize Google authentication.",
      );
      setOauthLoading(false);
    }
  };

  // Forgot password flow
  const handleSendResetCode = async () => {
    if (!isLoaded || !signIn || !email.trim()) {
      setErrorMsg(
        "Please provide your email address to receive the reset code.",
      );
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setCodeSent(true);
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string }> };
      setErrorMsg(
        clerkError.errors?.[0]?.message || "Failed to dispatch reset code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode.trim(),
        password: newPassword,
      });
      if (result.status === "complete") {
        setResetSuccess(true);
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string }> };
      setErrorMsg(
        clerkError.errors?.[0]?.message || "Failed to reset password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── Top Header & Close Button ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
          {otpMode
            ? "Enter Email Verification Code"
            : forgotMode
            ? "Reset Workshop Password"
            : "Sign in to MechanicMate"}
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
            Workshop Management System & Digital Bay Access
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

      {/* Info Alert */}
      {infoMsg && (
        <div className="rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 p-3 flex items-start gap-2.5 text-xs text-[#38bdf8] animate-in fade-in duration-200">
          <span className="text-sm shrink-0">ℹ️</span>
          <p className="flex-1">{infoMsg}</p>
        </div>
      )}

      {/* OTP Mode View */}
      {otpMode ? (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <p className="text-xs text-[#8a8a8a]">
            Enter the 6-digit code sent to <strong className="text-white">{email}</strong> to sign in.
          </p>
          <div className="space-y-1">
            <label className="text-[11px] font-black tracking-wider uppercase text-[#737373]">
              6-DIGIT VERIFICATION CODE
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              className="w-full text-center tracking-[0.4em] font-mono font-bold text-lg rounded-xl bg-[#1a1a1a] border border-[#282828] px-3.5 py-2.5 text-white focus:border-[#22c55e] focus:outline-none min-h-[46px]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[46px] rounded-xl bg-[#22c55e] font-black text-sm text-black hover:bg-[#16a34a] shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Verifying... ⏳" : "Verify & Sign In →"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOtpMode(false);
              setOtpCode("");
              setInfoMsg(null);
            }}
            className="w-full text-center text-xs text-[#8a8a8a] hover:text-white pt-1"
          >
            ← Back to password sign-in
          </button>
        </form>
      ) : forgotMode ? (
        /* Forgot Password View */
        <div className="space-y-4">
          {!codeSent ? (
            <div className="space-y-3">
              <p className="text-xs text-[#8a8a8a]">
                Enter your technician email. We will send a 6-digit password
                reset code.
              </p>
              <div className="space-y-1">
                <label className="text-[11px] font-black tracking-wider uppercase text-[#737373]">
                  EMAIL
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="technician@workshop.co.za"
                  className="w-full rounded-xl bg-[#1a1a1a] border border-[#282828] px-3.5 py-2.5 text-sm text-white focus:border-[#22c55e] focus:outline-none min-h-[44px]"
                />
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleSendResetCode}
                className="w-full min-h-[46px] rounded-xl bg-[#22c55e] font-black text-sm text-black hover:bg-[#16a34a] transition-all flex items-center justify-center"
              >
                {loading ? "Sending code... ⏳" : "Send Reset Code →"}
              </button>
            </div>
          ) : resetSuccess ? (
            <div className="rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 p-4 text-center space-y-1 text-xs text-[#22c55e]">
              <p className="font-bold text-sm">✓ Password Reset Successful!</p>
              <p className="text-[#a3e635]">Redirecting to dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-black tracking-wider uppercase text-[#737373]">
                  6-DIGIT CODE
                </label>
                <input
                  type="text"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                  className="w-full font-mono text-center tracking-widest rounded-xl bg-[#1a1a1a] border border-[#282828] px-3.5 py-2.5 text-sm text-white focus:border-[#22c55e] focus:outline-none min-h-[44px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black tracking-wider uppercase text-[#737373]">
                  NEW PASSWORD
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-xl bg-[#1a1a1a] border border-[#282828] px-3.5 py-2.5 text-sm text-white focus:border-[#22c55e] focus:outline-none min-h-[44px]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[46px] rounded-xl bg-[#22c55e] font-black text-sm text-black hover:bg-[#16a34a] transition-all flex items-center justify-center"
              >
                {loading ? "Updating password... ⏳" : "Confirm & Sign In →"}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => {
              setForgotMode(false);
              setCodeSent(false);
            }}
            className="w-full text-center text-xs text-[#8a8a8a] hover:text-white pt-1"
          >
            ← Back to Sign In
          </button>
        </div>
      ) : (
        /* Standard Sign-In Form */
        <form onSubmit={handleSignIn} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-black tracking-wider uppercase text-[#737373]">
              EMAIL
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="technician@workshop.co.za"
              className="w-full rounded-xl bg-[#1a1a1a] border border-[#282828] px-3.5 py-2.5 text-sm text-white placeholder-[#555] focus:border-[#22c55e] focus:outline-none min-h-[44px] transition-colors"
            />
          </div>

          {/* Password Input with Show/Hide Toggle */}
          <div className="space-y-1">
            <label className="text-[11px] font-black tracking-wider uppercase text-[#737373]">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl bg-[#1a1a1a] border border-[#282828] pl-3.5 pr-11 py-2.5 text-sm text-white placeholder-[#555] focus:border-[#22c55e] focus:outline-none min-h-[44px] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white transition-colors p-1"
              >
                {showPassword ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between text-xs pt-0.5 select-none">
            <label className="flex items-center gap-2 text-[#8a8a8a] cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded bg-[#1a1a1a] border-[#2c2c2c] accent-[#22c55e] cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setForgotMode(true);
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className="font-semibold text-[#22c55e] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading || oauthLoading}
            className="w-full min-h-[46px] rounded-xl bg-[#22c55e] font-black text-sm text-black hover:bg-[#16a34a] shadow-lg shadow-emerald-950/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 select-none touch-manipulation disabled:opacity-50"
          >
            {loading ? (
              <span>Signing in... ⏳</span>
            ) : (
              <span>Sign In to Workshop →</span>
            )}
          </button>

          {/* Continue with Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || oauthLoading}
            className="w-full min-h-[46px] rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] hover:bg-[#242424] hover:border-[#383838] font-bold text-xs text-white transition-all flex items-center justify-center gap-2.5 select-none touch-manipulation disabled:opacity-50"
          >
            {oauthLoading ? (
              <span>Connecting Google... ⏳</span>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* ─── Footer Sign-Up Link ────────────────────────────────────── */}
      <div className="pt-2 text-center text-xs text-[#8a8a8a] border-t border-[#1c1c1c]">
        Need a workshop account?{" "}
        <Link
          href="/sign-up"
          className="font-bold text-[#22c55e] hover:underline"
        >
          Create one here →
        </Link>
      </div>
    </div>
  );
}
