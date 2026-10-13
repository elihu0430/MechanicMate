"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
  badge?: string | number;
}

interface NavbarProps {
  onNewJobClick?: () => void;
  technicianName?: string;
  workshopName?: string;
  activeItem?: string;
  onSelectItem?: (id: string) => void;
}

export function Navbar({
  onNewJobClick,
  technicianName = "Alex Ndlovu",
  workshopName = "Dev's Auto Workshop",
  activeItem,
  onSelectItem,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/",
      icon: (active) => (
        <svg
          className={`h-5 w-5 ${active ? "text-[#22c55e]" : "text-[#a3a3a3]"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      id: "jobs",
      label: "Repair Orders",
      href: "/jobs",
      icon: (active) => (
        <svg
          className={`h-5 w-5 ${active ? "text-[#22c55e]" : "text-[#a3a3a3]"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      id: "customers",
      label: "Customers",
      href: "/customers",
      icon: (active) => (
        <svg
          className={`h-5 w-5 ${active ? "text-[#22c55e]" : "text-[#a3a3a3]"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: "vehicles",
      label: "Vehicles",
      href: "/vehicles",
      icon: (active) => (
        <svg
          className={`h-5 w-5 ${active ? "text-[#22c55e]" : "text-[#a3a3a3]"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 3.1C2 11.4 2 11.7 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      ),
    },
    {
      id: "appointments",
      label: "Appointments",
      href: "/appointments",
      icon: (active) => (
        <svg
          className={`h-5 w-5 ${active ? "text-[#22c55e]" : "text-[#a3a3a3]"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      id: "inspections",
      label: "Inspections",
      href: "/inspections",
      icon: (active) => (
        <svg
          className={`h-5 w-5 ${active ? "text-[#22c55e]" : "text-[#a3a3a3]"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      id: "invoices",
      label: "Invoices",
      href: "/invoices",
      icon: (active) => (
        <svg
          className={`h-5 w-5 ${active ? "text-[#22c55e]" : "text-[#a3a3a3]"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ];

  const isCurrentActive = (item: NavItem) => {
    if (activeItem) return activeItem === item.id;
    if (pathname === item.href) return true;
    if (item.href !== "/" && pathname?.startsWith(item.href)) return true;
    return false;
  };

  const handleItemClick = (item: NavItem) => {
    if (onSelectItem) onSelectItem(item.id);
    setIsOpen(false);
  };

  return (
    <>
      {/* ─── Top Header Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1f1f1f] safe-inset-top">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Left: Hamburger & Brand */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Hamburger Button - Hidden on Mobile (Mobile uses bottom nav), Visible on Desktop/Tablet */}
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Open navigation menu"
              type="button"
              className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl bg-[#141414] border border-[#272727] text-white transition-colors hover:bg-[#1e1e1e] hover:border-[#333333] active:scale-95 touch-manipulation select-none"
            >
              <svg
                className="h-5 w-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>

            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center text-xl sm:text-2xl font-black tracking-tight text-white select-none hover:opacity-90 transition-opacity"
            >
              <span>Mechanic</span>
              <span className="text-[#22c55e]">Mate</span>
            </Link>
          </div>

          {/* Right: + New Job Action Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onNewJobClick ? (
              <button
                onClick={onNewJobClick}
                type="button"
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#22c55e] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-black shadow-md shadow-emerald-950/20 transition-all duration-150 hover:bg-[#16a34a] active:scale-95 touch-manipulation select-none"
              >
                <span className="text-base leading-none font-extrabold">+</span>
                <span className="font-extrabold tracking-tight">New Job</span>
              </button>
            ) : (
              <Link
                href="/jobs/new"
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#22c55e] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-black shadow-md shadow-emerald-950/20 transition-all duration-150 hover:bg-[#16a34a] active:scale-95 touch-manipulation select-none"
              >
                <span className="text-base leading-none font-extrabold">+</span>
                <span className="font-extrabold tracking-tight">New Job</span>
              </Link>
            )}

            <SignOutButton variant="header" />
          </div>
        </div>
      </header>

      {/* ─── Slide-out Navigation Drawer / Sidebar ──────────────────────── */}
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar Panel */}
      <aside
        aria-label="Sidebar navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-[280px] sm:w-[320px] flex-col justify-between bg-[#0e0e0e] border-r border-[#202020] shadow-2xl transition-transform duration-300 ease-out safe-inset-top safe-inset-bottom ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-[#1c1c1c]">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center text-xl font-black tracking-tight text-white select-none"
          >
            <span>Mechanic</span>
            <span className="text-[#22c55e]">Mate</span>
          </Link>

          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#181818] border border-[#272727] text-[#a3a3a3] hover:text-white hover:bg-[#222222] transition-colors"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const active = isCurrentActive(item);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleItemClick(item)}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-150 select-none min-h-[48px] touch-manipulation ${
                  active
                    ? "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/25 font-bold shadow-sm"
                    : "text-[#a3a3a3] hover:bg-[#181818] hover:text-white hover:border-[#272727] border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon(active)}
                  <span>{item.label}</span>
                </div>

                {/* Active Indicator Dot */}
                {active && (
                  <span
                    className="h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer: Settings & Technician Profile */}
        <div className="p-4 border-t border-[#1c1c1c] space-y-3">
          {/* Settings Nav Item */}
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#a3a3a3] hover:bg-[#181818] hover:text-white transition-colors select-none"
          >
            <svg
              className="h-5 w-5 text-[#888888] group-hover:text-white transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </Link>

          {/* User Profile Pill Card */}
          <div className="flex items-center gap-3 rounded-2xl bg-[#161616] border border-[#262626] p-3 shadow-inner">
            {/* Avatar squircle with first initial */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22c55e] text-black font-black text-base shadow-sm">
              {technicianName.charAt(0).toUpperCase()}
            </div>

            {/* Name & Workshop Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white leading-tight">
                {technicianName}
              </p>
              <p className="truncate text-xs text-[#7d7d7d] leading-tight mt-0.5">
                {workshopName}
              </p>
            </div>
          </div>

          {/* Sign Out Action Button */}
          <SignOutButton variant="sidebar" />
        </div>
      </aside>
    </>
  );
}

export default Navbar;
