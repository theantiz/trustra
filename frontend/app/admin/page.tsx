"use client";

import { useEffect, useState } from "react";
import { getAdminConfig, login, recalculateNetwork, updateAdminConfig } from "@/lib/api";
import { ScoringConfig, TrustScoreResponse } from "@/lib/types";

const DEFAULT_CONFIG: ScoringConfig = {
  successWeight: 50.0,
  disputeWeight: 30.0,
  feedbackWeight: 20.0,
  networkWeight: 10.0,
  maxInactivityPenalty: 15.0,
  negativeFeedbackPenalty: 10.0,
  scamReportPenalty: 25.0,
  spikePenalty: 20.0,
  fakeFeedbackPenalty: 30.0,
  clusterPenalty: 35.0
};

export default function AdminPage() {
  // Authentication State
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [activeOfficer, setActiveOfficer] = useState<string | null>(null);

  // Configuration State
  const [config, setConfig] = useState<ScoringConfig>(DEFAULT_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // Status Alerts & Feedback Toasts
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [recalcSummary, setRecalcSummary] = useState<{ count: number; timestamp: string } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  };

  // Check stored session on mount
  useEffect(() => {
    const savedToken = typeof window !== "undefined" ? localStorage.getItem("trustra_admin_jwt") : null;
    const savedOfficer = typeof window !== "undefined" ? localStorage.getItem("trustra_admin_user") : null;
    if (savedToken) {
      setToken(savedToken);
      setActiveOfficer(savedOfficer || "admin");
    }
  }, []);

  // Fetch config whenever authenticated
  useEffect(() => {
    if (!token) return;

    const fetchConfig = async () => {
      setLoadingConfig(true);
      try {
        const fetched = await getAdminConfig(token);
        setConfig(fetched);
      } catch (err: unknown) {
        showToast("error", err instanceof Error ? err.message : "Failed to load scoring configuration");
      } finally {
        setLoadingConfig(false);
      }
    };

    void fetchConfig();
  }, [token]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await login(username.trim(), password);
      setToken(res.token);
      setActiveOfficer(res.username);
      if (typeof window !== "undefined") {
        localStorage.setItem("trustra_admin_jwt", res.token);
        localStorage.setItem("trustra_admin_user", res.username);
      }
      showToast("success", `Authenticated successfully as ${res.username} (${res.roles.join(", ")})`);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Invalid credentials or unauthorized");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setActiveOfficer(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("trustra_admin_jwt");
      localStorage.removeItem("trustra_admin_user");
    }
    showToast("info", "Logged out of Admin Risk Console");
  };

  const handleQuickFill = () => {
    setUsername("admin");
    setPassword("admin123");
    setAuthError("");
    showToast("info", "Quick-filled demo credentials: admin / admin123");
  };

  const handleConfigChange = (key: keyof ScoringConfig, value: number) => {
    setConfig((prev) => ({
      ...prev,
      [key]: Number(value)
    }));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSavingConfig(true);
    try {
      const updated = await updateAdminConfig(config, token);
      setConfig(updated);
      showToast("success", "Scoring weights hot-updated successfully across production engine!");
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to update configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRecalculateNetwork = async () => {
    setRecalculating(true);
    try {
      const results: TrustScoreResponse[] = await recalculateNetwork(token || undefined);
      const count = Array.isArray(results) ? results.length : 1;
      const timestamp = new Date().toLocaleTimeString();
      setRecalcSummary({ count, timestamp });
      showToast(
        "success",
        `Network recalculation complete! Updated scores for ${count} nodes across graph.`
      );
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Network recalculation failed");
    } finally {
      setRecalculating(false);
    }
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    showToast("info", "Reset configuration values to fintech industry defaults. Click 'Save' to apply.");
  };

  const baseWeightSum =
    (Number(config.successWeight) || 0) +
    (Number(config.disputeWeight) || 0) +
    (Number(config.feedbackWeight) || 0);

  // Unauthenticated Login View
  if (!token) {
    return (
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Admin Risk Console</h1>
            <p className="mt-2 text-xs text-slate-500">
              Restricted institutional access for Risk Officers. Hot-update algorithmic scoring weights and recalculate network risk.
            </p>
          </div>

          {authError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{authError}</span>
            </div>
          )}

          {toast && (
            <div
              className={`rounded-xl border p-3.5 text-xs flex items-center justify-between ${
                toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : toast.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-blue-200 bg-blue-50 text-blue-800"
              }`}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="ml-2 font-bold hover:opacity-70"
              >
                &times;
              </button>
            </div>
          )}

          <form className="mt-8 space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium text-slate-700 uppercase tracking-wide">
                Officer Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 uppercase tracking-wide">
                Security Passphrase
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleQuickFill}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                Quick-Fill Demo Credentials
              </button>
              <button
                type="submit"
                disabled={authLoading}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-60"
              >
                {authLoading ? "Authenticating..." : "Authorize Access"}
              </button>
            </div>
          </form>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-[11px] text-slate-500">
            <p className="font-semibold text-slate-700">Pre-Configured Demo Credentials:</p>
            <p className="mt-0.5">Username: <span className="font-mono text-slate-900">admin</span> &bull; Password: <span className="font-mono text-slate-900">admin123</span></p>
          </div>
        </div>
      </main>
    );
  }

  // Authenticated Admin Console View
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`mb-6 rounded-xl border p-4 text-xs font-medium flex items-center justify-between shadow-sm transition-all ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : toast.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : "border-slate-200 bg-slate-50 text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px]">
              [{toast.type}]
            </span>
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-500 hover:text-slate-800 font-bold text-sm px-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Admin Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm font-bold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Risk Officer Console</h1>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
                Role: Admin
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Authenticated as <span className="font-semibold text-slate-800">{activeOfficer}</span> &bull; JWT Session Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Recalculate Network Button */}
          <button
            type="button"
            onClick={handleRecalculateNetwork}
            disabled={recalculating}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-60"
          >
            <svg
              className={`h-4 w-4 ${recalculating ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>{recalculating ? "Recalculating Network..." : "Recalculate Network"}</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Recalculation Summary Banner */}
      {recalcSummary && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>
              Network Graph recalculated at <strong>{recalcSummary.timestamp}</strong> across <strong>{recalcSummary.count}</strong> user nodes.
            </span>
          </div>
          <span className="text-[11px] text-emerald-700">Consensus Achieved</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Baseline Weights Sum</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {baseWeightSum.toFixed(0)}%
            </span>
            <span
              className={`text-[11px] font-medium ${
                baseWeightSum === 100 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {baseWeightSum === 100 ? "Balanced (100%)" : "Non-standard sum"}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Graph Propagation</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {config.networkWeight}%
            </span>
            <span className="text-[11px] text-slate-500">2-Hop Eigenvector</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Abuse Penalties</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">6</span>
            <span className="text-[11px] text-emerald-600">Deterministic</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Config Version</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold text-slate-700">
              {config.updatedBy ? `By ${config.updatedBy}` : "Default Seed"}
            </span>
            <span className="text-[10px] text-slate-400">
              {config.updatedAt ? new Date(config.updatedAt).toLocaleTimeString() : "Boot"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Configuration Form */}
      <form onSubmit={handleSaveConfig} className="mt-8 space-y-8">
        {/* Section 1: Core Scoring Weights */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">1. Algorithm Foundation Weights</h2>
              <p className="text-xs text-slate-500">
                Primary components allocating the 100-point maximum baseline score before penalties.
              </p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-mono text-slate-700">
              Allocated: {baseWeightSum}% / 100%
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Success Weight */}
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-800">
                  Transaction Success Weight (<span className="text-emerald-700 font-mono">successWeight</span>)
                </label>
                <span className="font-mono font-bold text-slate-900">{config.successWeight}%</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Reward weight for fulfilled, settled payment transactions.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={config.successWeight}
                  onChange={(e) => handleConfigChange("successWeight", Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={config.successWeight}
                  onChange={(e) => handleConfigChange("successWeight", Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono text-right"
                />
              </div>
            </div>

            {/* Dispute Weight */}
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-800">
                  Dispute Resistance Weight (<span className="text-emerald-700 font-mono">disputeWeight</span>)
                </label>
                <span className="font-mono font-bold text-slate-900">{config.disputeWeight}%</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Weight preserved when maintaining low chargeback and dispute ratios.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={config.disputeWeight}
                  onChange={(e) => handleConfigChange("disputeWeight", Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={config.disputeWeight}
                  onChange={(e) => handleConfigChange("disputeWeight", Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono text-right"
                />
              </div>
            </div>

            {/* Feedback Weight */}
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-800">
                  Feedback Reputation Weight (<span className="text-emerald-700 font-mono">feedbackWeight</span>)
                </label>
                <span className="font-mono font-bold text-slate-900">{config.feedbackWeight}%</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Peer rating contribution scaled linearly from 1 to 5 stars.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={config.feedbackWeight}
                  onChange={(e) => handleConfigChange("feedbackWeight", Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={config.feedbackWeight}
                  onChange={(e) => handleConfigChange("feedbackWeight", Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono text-right"
                />
              </div>
            </div>

            {/* Network Counterparty Weight */}
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-800">
                  Network Graph Propagation (<span className="text-emerald-700 font-mono">networkWeight</span>)
                </label>
                <span className="font-mono font-bold text-slate-900">{config.networkWeight}%</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Bonus/propagation derived from counterparty reliability and peer graph centrality.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={config.networkWeight}
                  onChange={(e) => handleConfigChange("networkWeight", Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={config.networkWeight}
                  onChange={(e) => handleConfigChange("networkWeight", Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono text-right"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Abuse Heuristics & Penalties */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">2. Deterministic Penalty Multipliers</h2>
            <p className="text-xs text-slate-500">
              Immediate point deductions applied when abuse patterns, fraud clusters, or anomalies are detected.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Inactivity Penalty */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1.5">
              <label className="text-xs font-semibold text-slate-800 block">
                Max Inactivity Penalty
              </label>
              <span className="text-[10px] text-slate-400 block font-mono">maxInactivityPenalty</span>
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                value={config.maxInactivityPenalty}
                onChange={(e) => handleConfigChange("maxInactivityPenalty", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
              />
              <span className="text-[10px] text-slate-500 block">Deduction for dormant accounts</span>
            </div>

            {/* Negative Feedback Penalty */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1.5">
              <label className="text-xs font-semibold text-slate-800 block">
                Negative Feedback Penalty
              </label>
              <span className="text-[10px] text-slate-400 block font-mono">negativeFeedbackPenalty</span>
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                value={config.negativeFeedbackPenalty}
                onChange={(e) => handleConfigChange("negativeFeedbackPenalty", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
              />
              <span className="text-[10px] text-slate-500 block">Deduction per negative review</span>
            </div>

            {/* Scam Report Penalty */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1.5">
              <label className="text-xs font-semibold text-rose-800 block">
                Scam Report Penalty
              </label>
              <span className="text-[10px] text-slate-400 block font-mono">scamReportPenalty</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={config.scamReportPenalty}
                onChange={(e) => handleConfigChange("scamReportPenalty", Number(e.target.value))}
                className="w-full rounded-lg border border-rose-200 bg-rose-50/30 px-3 py-2 text-sm font-mono text-rose-900"
              />
              <span className="text-[10px] text-slate-500 block">Severe deduction for scam flags</span>
            </div>

            {/* Spike Velocity Penalty */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1.5">
              <label className="text-xs font-semibold text-slate-800 block">
                Velocity Spike Penalty
              </label>
              <span className="text-[10px] text-slate-400 block font-mono">spikePenalty</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={config.spikePenalty}
                onChange={(e) => handleConfigChange("spikePenalty", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
              />
              <span className="text-[10px] text-slate-500 block">Abnormal transaction volume surge</span>
            </div>

            {/* Fake Feedback Ring Penalty */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1.5">
              <label className="text-xs font-semibold text-slate-800 block">
                Fake Feedback Ring Penalty
              </label>
              <span className="text-[10px] text-slate-400 block font-mono">fakeFeedbackPenalty</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={config.fakeFeedbackPenalty}
                onChange={(e) => handleConfigChange("fakeFeedbackPenalty", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
              />
              <span className="text-[10px] text-slate-500 block">Collusive circular review padding</span>
            </div>

            {/* Sybil Cluster Penalty */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1.5">
              <label className="text-xs font-semibold text-slate-800 block">
                Sybil Cluster Penalty
              </label>
              <span className="text-[10px] text-slate-400 block font-mono">clusterPenalty</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={config.clusterPenalty}
                onChange={(e) => handleConfigChange("clusterPenalty", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
              />
              <span className="text-[10px] text-slate-500 block">Coordinated bot / synthetic identity</span>
            </div>
          </div>
        </section>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs text-slate-500">
            Changes take effect immediately on next real-time event or recalculation trigger.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetToDefaults}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Reset to Defaults
            </button>
            <button
              type="submit"
              disabled={savingConfig || loadingConfig}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-60"
            >
              {savingConfig ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8v8H4z" fill="currentColor" className="opacity-75" />
                  </svg>
                  <span>Applying Changes...</span>
                </>
              ) : (
                <span>Save & Apply Weights</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
