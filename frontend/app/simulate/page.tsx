"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getSimStats,
  getTrust,
  simInit,
  simMalicious,
  simNormal,
  simSpike
} from "@/lib/api";
import { SimStats, TrustScoreResponse } from "@/lib/types";
import TrustCard from "@/components/TrustCard";

export default function SimulatePage() {
  const [users, setUsers] = useState("100");
  const [normalSteps, setNormalSteps] = useState("200");
  const [clusterSize, setClusterSize] = useState("10");
  const [maliciousSteps, setMaliciousSteps] = useState("100");
  const [spikeUserId, setSpikeUserId] = useState("");
  const [viewUserId, setViewUserId] = useState("");
  const [stats, setStats] = useState<SimStats | null>(null);
  const [trust, setTrust] = useState<TrustScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadStats = async () => {
    const data = await getSimStats();
    setStats(data);
  };

  const refreshTrust = async () => {
    if (!viewUserId.trim()) return;
    const payload = await getTrust(viewUserId.trim());
    setTrust(payload);
  };

  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await action();
      await loadStats();
      await refreshTrust();
      setMessage(successMessage);
    } catch {
      setError("Unable to run simulation action");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadStats();
      } catch {
        setError("Unable to load simulation stats");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center">
        <h1 className="mb-6 text-center text-2xl font-semibold">Simulation</h1>

        <section className="w-full rounded-xl border border-trust-border bg-white p-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Controls
          </h2>
          <div className="grid gap-3">
            <div className="flex gap-3">
              <input
                value={users}
                onChange={(e) => setUsers(e.target.value)}
                placeholder="Users"
                className="w-full rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
              />
              <button
                type="button"
                onClick={() => run(() => simInit(Number(users)), "Users initialized")}
                disabled={loading}
                className="rounded-lg border border-trust-border px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                Init
              </button>
            </div>

            <div className="flex gap-3">
              <input
                value={normalSteps}
                onChange={(e) => setNormalSteps(e.target.value)}
                placeholder="Normal Steps"
                className="w-full rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
              />
              <button
                type="button"
                onClick={() =>
                  run(() => simNormal(Number(normalSteps)), "Normal activity simulated")
                }
                disabled={loading}
                className="rounded-lg border border-trust-border px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                Normal
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                value={clusterSize}
                onChange={(e) => setClusterSize(e.target.value)}
                placeholder="Cluster Size"
                className="rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
              />
              <input
                value={maliciousSteps}
                onChange={(e) => setMaliciousSteps(e.target.value)}
                placeholder="Steps"
                className="rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                run(
                  () => simMalicious(Number(clusterSize), Number(maliciousSteps)),
                  "Malicious cluster simulated"
                )
              }
              disabled={loading}
              className="rounded-lg border border-trust-border px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              Malicious Cluster
            </button>

            <div className="flex gap-3">
              <input
                value={spikeUserId}
                onChange={(e) => setSpikeUserId(e.target.value)}
                placeholder="User ID for Spike"
                className="w-full rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
              />
              <button
                type="button"
                onClick={() =>
                  run(() => simSpike(spikeUserId.trim()), "Spike simulation triggered")
                }
                disabled={loading || !spikeUserId.trim()}
                className="rounded-lg border border-trust-border px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                Spike
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 w-full rounded-xl border border-trust-border bg-white p-8">
          <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-700">
            Stats
          </h2>
          <div className="grid grid-cols-1 gap-2 text-center text-sm">
            <p>Total users: {stats?.totalUsers ?? "-"}</p>
            <p>Average trust score: {stats?.avgTrustScore ?? "-"}</p>
            <p>Flagged users: {stats?.flaggedUsersCount ?? "-"}</p>
            <p>Highest trust user: {stats?.highestTrustUser ?? "-"}</p>
            <p>Lowest trust user: {stats?.lowestTrustUser ?? "-"}</p>
          </div>
        </section>

        <section className="mt-6 w-full rounded-xl border border-trust-border bg-white p-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            View Trust
          </h2>
          <div className="flex gap-3">
            <input
              value={viewUserId}
              onChange={(e) => setViewUserId(e.target.value)}
              placeholder="User ID"
              className="w-full rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
            />
            <button
              type="button"
              onClick={() =>
                run(async () => {
                  await refreshTrust();
                }, "Trust loaded")
              }
              disabled={loading || !viewUserId.trim()}
              className="rounded-lg border border-trust-border px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              Load
            </button>
          </div>
        </section>

        {!!loading && <p className="mt-4 text-sm text-trust-muted">Calculating trust...</p>}
        {!!error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {!!message && <p className="mt-4 text-sm text-green-700">{message}</p>}
        {!loading && trust && <TrustCard result={trust} />}

        <div className="mt-8 flex gap-4 text-sm">
          <Link href="/" className="text-gray-600 underline underline-offset-4">
            Home
          </Link>
          <Link href="/transactions" className="text-gray-600 underline underline-offset-4">
            Transactions
          </Link>
          <Link href="/feedback" className="text-gray-600 underline underline-offset-4">
            Feedback
          </Link>
          <Link href="/abuse" className="text-gray-600 underline underline-offset-4">
            Abuse
          </Link>
          <Link href="/network" className="text-gray-600 underline underline-offset-4">
            Network
          </Link>
        </div>
      </div>
    </main>
  );
}
