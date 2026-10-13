import React from "react";

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white flex flex-col items-center">
      {/* Customer Header Banner */}
      <header className="w-full bg-[#141414] border-b border-[#212121] py-3.5 px-4 sticky top-0 z-30">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22c55e] text-black font-black text-xs">
              MM
            </div>
            <div>
              <p className="text-xs font-black tracking-tight text-white leading-tight">
                Dev&apos;s Auto Workshop
              </p>
              <p className="text-[10px] text-[#7a7a7a] leading-tight">
                Customer Vehicle Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#8a8a8a]">
            <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span>Secure Link</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-2xl px-4 py-6 flex-1">{children}</main>

      {/* Portal Footer */}
      <footer className="w-full border-t border-[#1c1c1c] py-6 px-4 text-center text-xs text-[#525252]">
        <p>
          Dev&apos;s Auto Workshop &bull; +27 11 482 9900 &bull;
          service@devsauto.co.za
        </p>
        <p className="mt-1 text-[11px] text-[#404040]">
          Powered by MechanicMate Digital Bay System
        </p>
      </footer>
    </div>
  );
}
