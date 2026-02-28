"use client";

import Link from "next/link";
import { useState } from "react";
import { getAbuseFlags } from "@/lib/api";
import { AbuseFlag } from "@/lib/types";

export default function AbusePage() {
  const [userId, setUserId] = useState("");
  const [items, setItems] = useState<AbuseFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onFetch = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await getAbuseFlags(userId.trim());
      setItems(data);
    } catch {
      setError("Unable to fetch abuse flags");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center">
        <h1 className="mb-6 text-center text-2xl font-semibold">Abuse Flags</h1>

        <section className="w-full rounded-xl border border-trust-border bg-white p-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Lookup User Flags
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="flex-1 rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
            />
            <button
              type="button"
              onClick={onFetch}
              disabled={loading}
              className="rounded-lg border border-trust-border px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:opacity-70"
            >
              Fetch Flags
            </button>
          </div>
        </section>

        {loading && <p className="mt-4 text-sm text-trust-muted">Loading...</p>}
        {!!error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <section className="mt-6 w-full rounded-xl border border-trust-border bg-white p-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Result
          </h2>
          <div className="space-y-3">
            {items.length === 0 && (
              <p className="text-sm text-trust-muted">No abuse flags found.</p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-trust-border p-3 text-sm"
              >
                <p>Flag: {item.flagType}</p>
                <p>Severity: {item.severity}</p>
                <p>Details: {item.details}</p>
                <p>Created: {new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>

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
        </div>
      </div>
    </main>
  );
}
