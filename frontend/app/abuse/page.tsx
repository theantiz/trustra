"use client";

import Link from "next/link";
import { useState } from "react";
import { API_BASE_URL, getAbuseFlags } from "@/lib/api";
import { AbuseFlag } from "@/lib/types";

export default function AbusePage() {
  const [userId, setUserId] = useState("");
  const [items, setItems] = useState<AbuseFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [error, setError] = useState("");

  const onFetch = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await getAbuseFlags(userId.trim());
      setItems(data);
      setUserId("");
      setShowForm(false);
    } catch {
      setError("Unable to fetch abuse flags");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-12 sm:px-8">
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center">
        <h1 className="mb-8 text-center text-2xl font-semibold">Abuse Flags</h1>

        {showForm && (
          <section className="w-full rounded-xl border border-trust-border bg-white p-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
              Lookup User Flags
            </h2>
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void onFetch();
              }}
            >
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User ID"
                className="flex-1 rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg border border-trust-border px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:opacity-70"
              >
                Fetch Flags
              </button>
            </form>
          </section>
        )}

        {loading && <p className="mt-4 text-sm text-trust-muted">Loading...</p>}
        {!!error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        {!showForm && (
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setItems([]);
              setError("");
            }}
            className="mt-6 rounded-lg border border-trust-border px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
          >
            Search Another User
          </button>
        )}

        {!showForm && (
          <section className="mt-8 w-full rounded-xl border border-trust-border bg-white p-10">
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
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-5 text-sm">
          <Link href="/" className="text-gray-600 underline underline-offset-4">
            Home
          </Link>
          <Link href="/simulate" className="text-gray-600 underline underline-offset-4">
            Simulation
          </Link>
          <Link href="/network" className="text-gray-600 underline underline-offset-4">
            Network
          </Link>
          <Link href="/transactions" className="text-gray-600 underline underline-offset-4">
            Transactions
          </Link>
          <Link href="/feedback" className="text-gray-600 underline underline-offset-4">
            Feedback
          </Link>
          <a
            href={`${API_BASE_URL}/swagger-ui.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 underline underline-offset-4"
          >
            Swagger UI (Simulation)
          </a>
        </div>
      </div>
    </main>
  );
}
