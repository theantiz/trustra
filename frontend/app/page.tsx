"use client";

import { useState } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import TrustCard from "@/components/TrustCard";
import { API_BASE_URL, getTrust, getTrustExplanations, getTrustHistory } from "@/lib/api";
import { Explanation, TrustScoreHistory, TrustScoreResponse } from "@/lib/types";

export default function HomePage() {
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState<TrustScoreResponse | null>(null);
  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [history, setHistory] = useState<TrustScoreHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [error, setError] = useState("");

  const checkTrust = async () => {
    const trimmed = userId.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const [payload, explanationPayload, historyPayload] = await Promise.all([
        getTrust(trimmed),
        getTrustExplanations(trimmed),
        getTrustHistory(trimmed).catch(() => [] as TrustScoreHistory[])
      ]);

      setResult(payload);
      setExplanations(explanationPayload);
      setHistory(historyPayload);
      setUserId("");
      setShowForm(false);
    } catch {
      setResult(null);
      setExplanations([]);
      setHistory([]);
      setError("User not found or insufficient data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-12 sm:px-8">
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-center">
        <div className="mb-4 rounded-full bg-gray-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          Fintech Trust Engine
        </div>
        <h1 className="mb-2 text-center text-3xl font-semibold">Trustra</h1>
        <p className="mb-8 text-center text-sm text-trust-muted">
          Trustra is an institutional-grade trust scoring engine evaluating counterparty risk in digital payment networks using real-time behavioral signals, graph network propagation, and fraud detection.
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
                setHistory([]);
                setError("");
              }}
              className="rounded-lg border border-trust-border px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
            >
              Check Another User
            </button>
          </div>
        )}

        {loading && <p className="mt-4 text-sm text-trust-muted">Calculating trust & auditing history...</p>}
        {!loading && error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {!loading && result && !showForm && (
          <TrustCard result={result} explanations={explanations} history={history} />
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
          <Link href="/admin" className="text-gray-900 font-semibold underline underline-offset-4">
            Admin Console
          </Link>
          <a
            href={`${API_BASE_URL}/swagger-ui.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 underline underline-offset-4"
          >
            Swagger UI
          </a>
        </div>
      </div>
    </main>
  );
}
