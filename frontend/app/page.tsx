"use client";

import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import TrustCard from "@/components/TrustCard";
import {
  getTrust,
  getTrustExplanations,
  recalculateAllTrust,
  recalculateTrust
} from "@/lib/api";
import { Explanation, TrustScoreResponse } from "@/lib/types";
import Link from "next/link";

export default function HomePage() {
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState<TrustScoreResponse | null>(null);
  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!userId.trim()) {
      setResult(null);
      setExplanations([]);
      setError("");
    }
  }, [userId]);

  const checkTrust = async () => {
    const trimmed = userId.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const payload = await getTrust(trimmed);
      const explanationPayload = await getTrustExplanations(trimmed);
      setResult(payload);
      setExplanations(explanationPayload);
    } catch {
      setResult(null);
      setExplanations([]);
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
    setMessage("");
    try {
      const payload = await recalculateTrust(trimmed);
      const explanationPayload = await getTrustExplanations(trimmed);
      setResult(payload);
      setExplanations(explanationPayload);
      setMessage("Trust recalculated");
    } catch {
      setError("Unable to recalculate trust score");
    } finally {
      setRecalculating(false);
    }
  };

  const runRecalculateAll = async () => {
    setBulkLoading(true);
    setError("");
    setMessage("");
    try {
      await recalculateAllTrust();
      setMessage("Recalculation triggered for all users");
      if (userId.trim()) {
        const payload = await getTrust(userId.trim());
        const explanationPayload = await getTrustExplanations(userId.trim());
        setResult(payload);
        setExplanations(explanationPayload);
      }
    } catch {
      setError("Unable to trigger recalculation for all users");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-12 sm:px-8">
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center">
        <h1 className="mb-2 text-center text-3xl font-semibold">Trustra</h1>
        <p className="mb-8 text-center text-sm text-trust-muted">
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
          className="mt-5 rounded-lg border border-trust-border px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {recalculating ? "Calculating trust..." : "Recalculate Trust"}
        </button>

        <div className="mt-5 flex w-full flex-wrap justify-center gap-3 text-xs">
          <button
            type="button"
            onClick={runRecalculateAll}
            disabled={bulkLoading}
            className="rounded-lg border border-trust-border px-3 py-2 text-gray-800 hover:bg-gray-50 disabled:opacity-60"
          >
            Recalculate All
          </button>
        </div>

        {(loading || recalculating || bulkLoading) && (
          <p className="mt-4 text-sm text-trust-muted">Calculating trust...</p>
        )}
        {!loading && !recalculating && error && (
          <p className="mt-4 text-sm text-red-700">{error}</p>
        )}
        {!loading && !recalculating && !bulkLoading && !!message && (
          <p className="mt-4 text-sm text-green-700">{message}</p>
        )}
        {!loading && !recalculating && result && (
          <TrustCard result={result} explanations={explanations} />
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-5 text-sm">
          <Link href="/user-data" className="text-gray-600 underline underline-offset-4">
            User Data
          </Link>
          <Link href="/simulate" className="text-gray-600 underline underline-offset-4">
            Simulation
          </Link>
          <Link href="/transactions" className="text-gray-600 underline underline-offset-4">
            Transactions
          </Link>
          <Link href="/feedback" className="text-gray-600 underline underline-offset-4">
            Feedback
          </Link>
          <Link href="/abuse" className="text-gray-600 underline underline-offset-4">
            Abuse Flags
          </Link>
          <Link href="/network" className="text-gray-600 underline underline-offset-4">
            Network
          </Link>
        </div>
      </div>
    </main>
  );
}
