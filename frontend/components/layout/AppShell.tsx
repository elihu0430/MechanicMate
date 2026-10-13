"use client";

import React, { createContext, useContext } from "react";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "./MobileBottomNav";

const ShellContext = createContext<boolean>(false);

interface AppShellProps {
  children: React.ReactNode;
  activeItem?: string;
  onNewJobClick?: () => void;
}

export function AppShell({
  children,
  activeItem,
  onNewJobClick,
}: AppShellProps) {
  const isNested = useContext(ShellContext);

  if (isNested) {
    return <>{children}</>;
  }

  return (
    <ShellContext.Provider value={true}>
      <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#22c55e] selection:text-black flex flex-col">
        <Navbar
          activeItem={activeItem}
          onNewJobClick={onNewJobClick}
          technicianName="Alex Ndlovu"
          workshopName="Dev's Auto Workshop"
        />
        <div className="flex-1 pb-20 sm:pb-8">{children}</div>
        <MobileBottomNav />
      </div>
    </ShellContext.Provider>
  );
}
