"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

interface SignOutButtonProps {
  className?: string;
  variant?: "header" | "sidebar" | "danger" | "compact";
  showLabel?: boolean;
  children?: React.ReactNode;
}

export function SignOutButton({
  className,
  variant = "sidebar",
  showLabel = true,
  children,
}: SignOutButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = Boolean(
    mounted &&
    clerkKey &&
    !clerkKey.includes("YOUR_") &&
    clerkKey.startsWith("pk_"),
  );

  if (isClerkConfigured) {
    return (
      <ClerkSignOutTrigger
        variant={variant}
        className={className}
        showLabel={showLabel}
      >
        {children}
      </ClerkSignOutTrigger>
    );
  }

  return (
    <DemoSignOutTrigger
      variant={variant}
      className={className}
      showLabel={showLabel}
    >
      {children}
    </DemoSignOutTrigger>
  );
}

// ─── Live Clerk Sign-Out Trigger ─────────────────────────────────────────────
function ClerkSignOutTrigger({
  className,
  variant,
  showLabel,
  children,
}: SignOutButtonProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      localStorage.removeItem("mm_remembered_email");
      await signOut({ redirectUrl: "/sign-in" });
      router.push("/sign-in");
    } catch (err) {
      console.error("Error signing out:", err);
      router.push("/sign-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignOutVisualButton
      onClick={handleSignOut}
      loading={loading}
      variant={variant}
      className={className}
      showLabel={showLabel}
    >
      {children}
    </SignOutVisualButton>
  );
}

// ─── Demo Simulation Mode Sign-Out Trigger ───────────────────────────────────
function DemoSignOutTrigger({
  className,
  variant,
  showLabel,
  children,
}: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = () => {
    setLoading(true);
    localStorage.removeItem("mm_remembered_email");
    setTimeout(() => {
      setLoading(false);
      router.push("/sign-in");
    }, 400);
  };

  return (
    <SignOutVisualButton
      onClick={handleSignOut}
      loading={loading}
      variant={variant}
      className={className}
      showLabel={showLabel}
    >
      {children}
    </SignOutVisualButton>
  );
}

// ─── Visual Rendering Component ──────────────────────────────────────────────
interface VisualProps extends SignOutButtonProps {
  onClick: () => void;
  loading: boolean;
}

function SignOutVisualButton({
  onClick,
  loading,
  variant,
  className,
  showLabel,
  children,
}: VisualProps) {
  if (children) {
    return (
      <button
        onClick={onClick}
        disabled={loading}
        type="button"
        className={className}
      >
        {children}
      </button>
    );
  }

  // Variant 1: Header (compact pill next to New Job)
  if (variant === "header") {
    return (
      <button
        onClick={onClick}
        disabled={loading}
        type="button"
        title="Sign Out of Workshop"
        aria-label="Sign Out of Workshop"
        className={
          className ||
          "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] border border-[#272727] hover:border-[#383838] px-3 py-2 text-xs font-bold text-[#a3a3a3] hover:text-white transition-all active:scale-95 touch-manipulation disabled:opacity-50"
        }
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#a3a3a3] border-t-transparent" />
        ) : (
          <svg
            className="h-4 w-4 text-[#8a8a8a] group-hover:text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        )}
        {showLabel && <span className="hidden md:inline">Sign Out</span>}
      </button>
    );
  }

  // Variant 2: Danger / Settings block
  if (variant === "danger") {
    return (
      <button
        onClick={onClick}
        disabled={loading}
        type="button"
        className={
          className ||
          "inline-flex items-center justify-center gap-2 rounded-xl bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/30 px-4 py-2.5 text-sm font-bold text-[#ef4444] transition-all active:scale-95 disabled:opacity-50"
        }
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#ef4444] border-t-transparent" />
        ) : (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        )}
        <span>{loading ? "Signing out..." : "Sign Out of Workshop Bay"}</span>
      </button>
    );
  }

  // Default: Sidebar footer full-width button
  return (
    <button
      onClick={onClick}
      disabled={loading}
      type="button"
      className={
        className ||
        "group flex w-full items-center justify-center gap-2 rounded-xl bg-[#141414] hover:bg-[#ef4444]/10 border border-[#222222] hover:border-[#ef4444]/30 px-3.5 py-2.5 text-xs font-bold text-[#8a8a8a] hover:text-[#ef4444] transition-all active:scale-95 disabled:opacity-50"
      }
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#8a8a8a] border-t-transparent" />
      ) : (
        <svg
          className="h-4 w-4 text-[#737373] group-hover:text-[#ef4444] transition-colors"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      )}
      <span>{loading ? "Signing out..." : "Sign Out of Workshop"}</span>
    </button>
  );
}
