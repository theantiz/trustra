"use client";

import Link from "next/link";
import { useState } from "react";
import { getNetwork } from "@/lib/api";
import { NetworkCounterparty } from "@/lib/types";

export default function NetworkPage() {
  const [userId, setUserId] = useState("");
  const [items, setItems] = useState<NetworkCounterparty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onFetch = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await getNetwork(userId.trim());
      setItems(data);
    } catch {
      setItems([]);
      setError("Unable to fetch network trust data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center">
        <h1 className="mb-6 text-center text-2xl font-semibold">Network Trust</h1>

        <section className="w-full rounded-xl border border-trust-border bg-white p-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Lookup Counterparties
          </h2>
          <div className="flex gap-3">
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="w-full rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
            />
            <button
              type="button"
              onClick={onFetch}
              disabled={loading}
              className="rounded-lg border border-trust-border px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              Fetch
            </button>
          </div>
        </section>

        {!!loading && <p className="mt-4 text-sm text-trust-muted">Loading...</p>}
        {!!error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <section className="mt-6 w-full rounded-xl border border-trust-border bg-white p-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Result
          </h2>
          <div className="space-y-3">
            {items.length === 0 && (
              <p className="text-sm text-trust-muted">No network data found.</p>
            )}
            {items.map((item, index) => (
              <div
                key={`${item.userId}-${index}`}
                className="rounded-lg border border-trust-border p-3 text-sm"
              >
                <p>User: {item.userId}</p>
                <p>Score: {item.trustScore}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 flex gap-4 text-sm">
          <Link href="/" className="text-gray-600 underline underline-offset-4">
            Home
          </Link>
          <Link href="/simulate" className="text-gray-600 underline underline-offset-4">
            Simulate
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
        </div>
      </div>
    </main>
  );
}
