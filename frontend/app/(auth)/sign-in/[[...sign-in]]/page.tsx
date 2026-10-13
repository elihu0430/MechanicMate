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

  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkAvailable = Boolean(
    mounted &&
    clerkKey &&
    !clerkKey.includes("YOUR_") &&
    clerkKey.startsWith("pk_"),
  );

  return isClerkAvailable ? <ClerkSignInInner /> : <DemoSignInInner />;
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
      const result = await signIn.create({
        identifier: email.trim(),
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
      } else {
        console.log("Sign-in incomplete status:", result.status);
        setErrorMsg(
          `Authentication requires additional step: ${result.status}`,
        );
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
      if (clerkError.errors && clerkError.errors.length > 0) {
        const first = clerkError.errors[0];
        if (first.code === "form_identifier_not_found") {
          setErrorMsg(
            "No workshop account found with this email. Please sign up.",
          );
        } else if (first.code === "form_password_incorrect") {
          setErrorMsg("Incorrect password or security PIN. Please try again.");
        } else {
          setErrorMsg(
            first.longMessage || first.message || "Failed to authenticate.",
          );
        }
      } else {
        setErrorMsg("Unable to sign in. Please verify your credentials.");
      }
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
          {forgotMode ? "Reset Workshop Password" : "Sign in to MechanicMate"}
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

      {/* Forgot Password View */}
      {forgotMode ? (
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@workshop.co.za"
                  className="w-full rounded-xl bg-[#1a1a1a] border border-[#282828] px-3.5 py-2.5 text-sm text-white focus:border-[#22c55e] focus:outline-none min-h-[44px]"
                />
              </div>
              <button
                type="button"
                onClick={handleSendResetCode}
                disabled={loading}
                className="w-full min-h-[46px] rounded-xl bg-[#22c55e] font-black text-sm text-black hover:bg-[#16a34a] transition-all flex items-center justify-center"
              >
                {loading ? "Sending code... ⏳" : "Send Reset Code →"}
              </button>
            </div>
          ) : resetSuccess ? (
            <div className="rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/30 p-4 text-center space-y-1">
              <span className="text-2xl">✅</span>
              <p className="text-xs font-bold text-[#22c55e]">
                Password Reset Successfully!
              </p>
              <p className="text-[11px] text-[#86efac]">
                Redirecting you to your workshop bay...
              </p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-black tracking-wider uppercase text-[#737373]">
                  6-DIGIT VERIFICATION CODE
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-xl bg-[#1a1a1a] border border-[#282828] px-3.5 py-2.5 text-sm font-mono text-white text-center tracking-widest focus:border-[#22c55e] focus:outline-none min-h-[44px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black tracking-wider uppercase text-[#737373]">
                  NEW PASSWORD
                </label>
                <input
                  type="password"
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
              placeholder="alex@workshop.co.za"
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
                placeholder="••••••••••••"
                className="w-full rounded-xl bg-[#1a1a1a] border border-[#282828] pl-3.5 pr-11 py-2.5 text-sm text-white placeholder-[#555] focus:border-[#22c55e] focus:outline-none min-h-[44px] transition-colors font-mono"
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
                {/* Official Google 4-Color G Icon */}
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
              </>
            )}
          </button>
        </form>
      )}

      {/* Footer Navigation */}
      <div className="text-center pt-2 border-t border-[#1f1f1f]">
        <p className="text-xs text-[#737373]">
          No account?{" "}
          <Link
            href="/sign-up"
            className="font-bold text-[#22c55e] hover:underline"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Demo Simulation Mode Component (When Clerk Keys are Pending) ─────────────
function DemoSignInInner() {
  const router = useRouter();
  const [email, setEmail] = useState("alex@workshop.co.za");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/");
    }, 500);
  };

  return (
    <div className="space-y-5">
      {/* ─── Top Header & Close Button ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
          Sign in to MechanicMate
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

      {/* Notice Pill */}
      <div className="rounded-xl bg-[#1a1a1a] border border-[#f59e0b]/30 p-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b] animate-pulse" />
            <span className="font-bold text-[#f59e0b]">
              Local Demo Mode (Clerk Keys Pending)
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#a3a3a3] uppercase">
            Simulation
          </span>
        </div>
        <p className="text-[11px] text-[#8a8a8a] leading-relaxed">
          Sign-ins here are simulated locally. Add your{" "}
          <code className="text-white font-mono bg-[#141414] px-1 py-0.5 rounded">
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
          </code>{" "}
          to{" "}
          <code className="text-white font-mono bg-[#141414] px-1 py-0.5 rounded">
            .env.local
          </code>{" "}
          to record live users in your Clerk Dashboard.
        </p>
      </div>

      <form onSubmit={handleDemoSubmit} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-black tracking-wider uppercase text-[#737373]">
            EMAIL
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-[#1a1a1a] border border-[#282828] px-3.5 py-2.5 text-sm text-white focus:border-[#22c55e] focus:outline-none min-h-[44px]"
          />
        </div>

        {/* Password Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-black tracking-wider uppercase text-[#737373]">
            PASSWORD
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-[#1a1a1a] border border-[#282828] pl-3.5 pr-11 py-2.5 text-sm text-white font-mono focus:border-[#22c55e] focus:outline-none min-h-[44px]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white p-1"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-0.5 select-none">
          <label className="flex items-center gap-2 text-[#8a8a8a] cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded bg-[#1a1a1a] border-[#2c2c2c] accent-[#22c55e]"
            />
            <span>Remember me</span>
          </label>
          <span className="font-semibold text-[#22c55e] hover:underline cursor-pointer">
            Forgot password?
          </span>
        </div>

        {/* Primary Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[46px] rounded-xl bg-[#22c55e] font-black text-sm text-black hover:bg-[#16a34a] shadow-lg shadow-emerald-950/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 select-none touch-manipulation"
        >
          {loading ? (
            <span>Signing in... ⏳</span>
          ) : (
            <span>Sign In to Workshop →</span>
          )}
        </button>

        {/* Continue with Google */}
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setTimeout(() => router.push("/"), 500);
          }}
          className="w-full min-h-[46px] rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] hover:bg-[#242424] font-bold text-xs text-white transition-all flex items-center justify-center gap-2.5 select-none touch-manipulation"
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

      {/* Footer */}
      <div className="text-center pt-2 border-t border-[#1f1f1f]">
        <p className="text-xs text-[#737373]">
          No account?{" "}
          <Link
            href="/sign-up"
            className="font-bold text-[#22c55e] hover:underline"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
