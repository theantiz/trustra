"use client";

import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import TrustCard from "@/components/TrustCard";
import { UserTrustRecord } from "@/lib/trust";
import Link from "next/link";

export default function HomePage() {
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState<UserTrustRecord | null>(null);
  const [loading, setLoading] = useState(false);
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
      const response = await fetch(`/api/trust/${encodeURIComponent(trimmed)}`, {
        method: "GET"
      });

      if (!response.ok) {
        setResult(null);
        setError("User not found or insufficient data");
        return;
      }

      const payload = (await response.json()) as UserTrustRecord;
      setResult(payload);
    } catch {
      setResult(null);
      setError("User not found or insufficient data");
    } finally {
      setLoading(false);
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

        {loading && (
          <p className="mt-4 text-sm text-trust-muted">Calculating trust...</p>
        )}
        {!loading && error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {!loading && result && <TrustCard result={result} />}

        <Link
          href="/simulate"
          className="mt-8 text-sm text-gray-600 underline underline-offset-4"
        >
          Open Transaction Simulation
        </Link>
      </div>
    </main>
  );
}
