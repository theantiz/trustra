"use client";

import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import TrustCard from "@/components/TrustCard";
import { getTrust, recalculateTrust } from "@/lib/api";
import { TrustScoreResponse } from "@/lib/types";
import Link from "next/link";

export default function HomePage() {
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState<TrustScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId.trim()) {
      setResult(null);
      setError("");
    }
  }, [userId]);

  const checkTrust = async () => {
    const trimmed = userId.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const payload = await getTrust(trimmed);
      setResult(payload);
    } catch {
      setResult(null);
      setError("User not found or insufficient data");
    } finally {
      setLoading(false);
    }
  };

  const runRecalculation = async () => {
    const trimmed = userId.trim();
    if (!trimmed) return;

    setRecalculating(true);
    setError("");
    try {
      const payload = await recalculateTrust(trimmed);
      setResult(payload);
    } catch {
      setError("Unable to recalculate trust score");
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center">
        <h1 className="mb-2 text-center text-3xl font-semibold">Trustra</h1>
        <p className="mb-6 text-center text-sm text-trust-muted">
          Trustra is a real time trust scoring engine that evaluates the reliability
          of users in digital payment systems using behavioral signals, transaction
          history, and feedback patterns.
        </p>

        <SearchBar
          value={userId}
          onChange={setUserId}
          onSubmit={checkTrust}
          loading={loading}
        />
        <button
          type="button"
          onClick={runRecalculation}
          disabled={recalculating || !userId.trim()}
          className="mt-4 rounded-lg border border-trust-border px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {recalculating ? "Calculating trust..." : "Recalculate Trust"}
        </button>

        {(loading || recalculating) && (
          <p className="mt-4 text-sm text-trust-muted">Calculating trust...</p>
        )}
        {!loading && !recalculating && error && (
          <p className="mt-4 text-sm text-red-700">{error}</p>
        )}
        {!loading && !recalculating && result && <TrustCard result={result} />}

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/transactions" className="text-gray-600 underline underline-offset-4">
            Transactions
          </Link>
          <Link href="/feedback" className="text-gray-600 underline underline-offset-4">
            Feedback
          </Link>
          <Link href="/abuse" className="text-gray-600 underline underline-offset-4">
            Abuse Flags
          </Link>
        </div>
      </div>
    </main>
  );
}
