"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getUsers } from "@/lib/api";
import { UserListItem } from "@/lib/types";

export default function UserDataPage() {
  const [items, setItems] = useState<UserListItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsers();
      setItems(data);
    } catch {
      setItems([]);
      setError("Unable to fetch users list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.userId.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <main className="min-h-screen px-6 py-12 sm:px-8">
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center">
        <h1 className="mb-8 text-center text-2xl font-semibold">Users</h1>

        <section className="w-full rounded-xl border border-trust-border bg-white p-10">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by User ID"
              className="w-full rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
            />
            <button
              type="button"
              onClick={loadUsers}
              disabled={loading}
              className="rounded-lg border border-trust-border px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              Refresh
            </button>
          </div>
        </section>

        {loading && <p className="mt-4 text-sm text-trust-muted">Loading users...</p>}
        {!!error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <section className="mt-8 w-full rounded-xl border border-trust-border bg-white p-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            User List
          </h2>
          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="text-sm text-trust-muted">No users found.</p>
            )}
            {filtered.map((item, index) => (
              <div
                key={`${item.userId}-${index}`}
                className="rounded-lg border border-trust-border p-3 text-sm"
              >
                <p>User ID: {item.userId}</p>
                <p>Score: {item.score ?? "-"}</p>
                <p>Level: {item.level ?? "-"}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap justify-center gap-5 text-sm">
          <Link href="/" className="text-gray-600 underline underline-offset-4">
            Home
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
