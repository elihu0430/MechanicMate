import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {/* Subtle automotive emerald radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#22c55e]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Auth Container Card */}
      <div className="w-full max-w-[440px] rounded-3xl bg-[#141414] border border-[#242424] p-6 sm:p-7 shadow-2xl relative z-10">
        {children}
        {/* Clerk Smart CAPTCHA Container - present on initial SSR so Clerk finds it immediately */}
        <div id="clerk-captcha" />
      </div>

      {/* Footer Security Badge */}
      <p className="mt-6 text-center text-[11px] text-[#555] select-none">
        &copy; {new Date().getFullYear()} MechanicMate &bull; Workshop-Grade
        Security & Isolation
      </p>
    </div>
  );
}
