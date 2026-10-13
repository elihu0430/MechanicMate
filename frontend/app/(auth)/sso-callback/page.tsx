"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const clerkKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_cHJlY2lzZS13YWxydXMtMjE5MC5jbGVyay5hY2NvdW50cy5kZXYk";
  const isClerkConfigured =
    Boolean(clerkKey && !clerkKey.includes("YOUR_") && clerkKey.startsWith("pk_"));

  useEffect(() => {
    setMounted(true);
    if (!isClerkConfigured) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isClerkConfigured, router]);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-2xl animate-spin">
        ⚙️
      </div>
      <div>
        <h2 className="text-base font-bold text-white">
          Authenticating with Google...
        </h2>
        <p className="text-xs text-[#737373] mt-1">
          Connecting session to your workshop bay...
        </p>
      </div>

      {mounted && isClerkConfigured ? (
        <AuthenticateWithRedirectCallback
          signUpForceRedirectUrl="/"
          signInForceRedirectUrl="/"
        />
      ) : (
        <p className="text-xs text-[#8a8a8a] animate-pulse">
          Finalizing secure technician authorization...
        </p>
      )}
    </div>
  );
}
