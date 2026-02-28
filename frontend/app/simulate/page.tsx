"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TrustCard from "@/components/TrustCard";
import { TrustStats, UserTrustRecord } from "@/lib/trust";

type SimulateResponse = {
  stats: TrustStats;
  sampleUserId: string;
};

export default function SimulatePage() {
  const [stats, setStats] = useState<TrustStats | null>(null);
  const [result, setResult] = useState<UserTrustRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeUserId, setActiveUserId] = useState("u1001");

  const fetchTrust = async (id: string) => {
    const response = await fetch(`/api/trust/${encodeURIComponent(id)}`);
    if (!response.ok) {
      setError("User not found or insufficient data");
      setResult(null);
      return;
    }
    const payload = (await response.json()) as UserTrustRecord;
    setResult(payload);
    setError("");
  };

  const runAction = async (path: "/api/simulate/random" | "/api/simulate/malicious") => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(path, { method: "POST" });
      if (!response.ok) {
        setError("Unable to run simulation");
        return;
      }

      const payload = (await response.json()) as SimulateResponse;
      setStats(payload.stats);
      setActiveUserId(payload.sampleUserId);
      await fetchTrust(payload.sampleUserId);
    } catch {
      setError("Unable to run simulation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/simulate/random", { method: "POST" });
        if (!response.ok) {
          setError("Unable to initialize simulation");
          return;
        }
        const payload = (await response.json()) as SimulateResponse;
        setStats(payload.stats);
        setActiveUserId(payload.sampleUserId);
        await fetchTrust(payload.sampleUserId);
      } catch {
        setError("Unable to initialize simulation");
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, []);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center">
        <h1 className="mb-2 text-center text-2xl font-semibold">Trustra Simulation</h1>
        <p className="mb-6 text-center text-sm text-trust-muted">
          Trustra is a real time trust scoring engine that evaluates the reliability
          of users in digital payment systems using behavioral signals, transaction
          history, and feedback patterns.
        </p>

        <div className="flex w-full flex-col gap-3 rounded-xl border border-trust-border bg-white p-8 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => runAction("/api/simulate/random")}
            disabled={loading}
            className="rounded-lg border border-trust-border px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Generate Random Transactions
          </button>
          <button
            type="button"
            onClick={() => runAction("/api/simulate/malicious")}
            disabled={loading}
            className="rounded-lg border border-trust-border px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Create Malicious Cluster
          </button>
        </div>

        <section className="mt-6 w-full rounded-xl border border-trust-border bg-white p-8">
          <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-700">
            Stats
          </h2>
          <div className="grid grid-cols-1 gap-2 text-center text-sm sm:grid-cols-3">
            <p>Total users: {stats?.totalUsers ?? "-"}</p>
            <p>Flagged users: {stats?.flaggedUsers ?? "-"}</p>
            <p>Average trust score: {stats?.averageTrustScore ?? "-"}</p>
          </div>
        </section>

        <p className="mt-4 text-xs text-trust-muted">
          Showing trust details for: <span className="font-medium">{activeUserId}</span>
        </p>

        {loading && <p className="mt-4 text-sm text-trust-muted">Calculating trust...</p>}
        {!loading && error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {!loading && result && <TrustCard result={result} />}

        <Link href="/" className="mt-8 text-sm text-gray-600 underline underline-offset-4">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
