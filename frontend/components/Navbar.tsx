"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";

const NAV_ITEMS = [
  { label: "Overview", href: "/" },
  { label: "Transactions", href: "/transactions" },
  { label: "Feedback", href: "/feedback" },
  { label: "Abuse Flags", href: "/abuse" },
  { label: "Network Graph", href: "/network" },
  { label: "Simulator", href: "/simulate" },
  { label: "Admin Console", href: "/admin", isSpecial: true }
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStatusDetails, setShowStatusDetails] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Live Status */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm ring-1 ring-slate-800">
              {/* Trustra Shield / Hexagon Logo Icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-emerald-400"
              >
                <path
                  d="M12 2L3 6V11.5C3 16.5 6.8 21.2 12 22C17.2 21.2 21 16.5 21 11.5V6L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12L11 14L15 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-slate-950">Trustra</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 uppercase tracking-wider">
                  v1.0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Fintech Trust Engine</span>
            </div>
          </Link>

          {/* Live Operational Status Indicator */}
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setShowStatusDetails(!showStatusDetails)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100/80"
              title="Click to view engine health parameters"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>System Healthy</span>
              <span className="text-[10px] text-emerald-600 font-mono">18ms</span>
            </button>

            {showStatusDetails && (
              <div className="absolute left-0 top-9 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-800">Operational Telemetry</span>
                  <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5">ONLINE</span>
                </div>
                <div className="mt-2 space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Scoring Pipeline:</span>
                    <span className="font-mono text-emerald-600">Active (Real-time)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Graph:</span>
                    <span className="font-mono text-slate-800">Synchronized</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Abuse Detection:</span>
                    <span className="font-mono text-emerald-600">3 Rules Loaded</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Backend Host:</span>
                    <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">{API_BASE_URL}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname?.startsWith(item.href + "/");

            if (item.isSpecial) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`ml-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
                  }`}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-slate-100 text-slate-950 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action: API Docs & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <a
            href={`${API_BASE_URL}/swagger-ui.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition underline underline-offset-4"
          >
            <span>Swagger API</span>
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>

          {/* Mobile menu toggle button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex lg:hidden items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 shadow-lg">
          <div className="mb-3 flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>System Healthy (18ms)</span>
            </div>
            <a
              href={`${API_BASE_URL}/swagger-ui.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 underline"
            >
              Swagger Docs
            </a>
          </div>
          <div className="grid gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.isSpecial && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-900 font-semibold uppercase">
                      Admin
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
