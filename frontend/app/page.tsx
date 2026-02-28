"use client";

import { useState } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import TrustCard from "@/components/TrustCard";
import { getTrust, getTrustExplanations } from "@/lib/api";
import { Explanation, TrustScoreResponse } from "@/lib/types";

export default function HomePage() {
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState<TrustScoreResponse | null>(null);
  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [error, setError] = useState("");

  const checkTrust = async () => {
    const trimmed = userId.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const payload = await getTrust(trimmed);
      const explanationPayload = await getTrustExplanations(trimmed);
      setResult(payload);
      setExplanations(explanationPayload);
      setUserId("");
      setShowForm(false);
    } catch {
      setResult(null);
      setExplanations([]);
      setError("User not found or insufficient data");
    } finally {
      setLoading(false);
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

        {showForm && (
          <SearchBar
            value={userId}
            onChange={setUserId}
            onSubmit={checkTrust}
            loading={loading}
          />
        )}

        {!showForm && result && (
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setResult(null);
                setExplanations([]);
                setError("");
              }}
              className="rounded-lg border border-trust-border px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
            >
              Check Another User
            </button>
          </div>
        )}

        {loading && <p className="mt-4 text-sm text-trust-muted">Calculating trust...</p>}
        {!loading && error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {!loading && result && !showForm && (
          <TrustCard result={result} explanations={explanations} />
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-5 text-sm">
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
