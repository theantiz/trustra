"use client";

import Link from "next/link";
import { useState } from "react";
import { createTransaction, getTransactions } from "@/lib/api";
import { Transaction } from "@/lib/types";

export default function TransactionsPage() {
  const [senderId, setSenderId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [queryUserId, setQueryUserId] = useState("");
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onCreate = async () => {
    const value = Number(amount);
    if (!senderId.trim() || !receiverId.trim() || Number.isNaN(value) || value <= 0) {
      setError("Provide valid senderId, receiverId, and amount");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const created = await createTransaction({
        senderId: senderId.trim(),
        receiverId: receiverId.trim(),
        amount: value
      });
      setSuccess(`Transaction created: ${created.id}`);
      setAmount("");
      if (queryUserId.trim()) {
        const data = await getTransactions(queryUserId.trim());
        setItems(data);
      }
    } catch {
      setError("Unable to create transaction");
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async () => {
    if (!queryUserId.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await getTransactions(queryUserId.trim());
      setItems(data);
    } catch {
      setError("Unable to fetch transactions");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-12 sm:px-8">
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center">
        <h1 className="mb-8 text-center text-2xl font-semibold">Transactions</h1>

        <section className="w-full rounded-xl border border-trust-border bg-white p-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Create Transaction
          </h2>
          <div className="grid gap-3">
            <input
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              placeholder="Sender User ID"
              className="rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
            />
            <input
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              placeholder="Receiver User ID"
              className="rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
            />
            <button
              type="button"
              onClick={onCreate}
              disabled={loading}
              className="rounded-lg border border-trust-border bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-70"
            >
              Create Transaction
            </button>
          </div>
        </section>

        <section className="mt-8 w-full rounded-xl border border-trust-border bg-white p-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Query Transactions
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={queryUserId}
              onChange={(e) => setQueryUserId(e.target.value)}
              placeholder="User ID"
              className="flex-1 rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
            />
            <button
              type="button"
              onClick={onSearch}
              disabled={loading}
              className="rounded-lg border border-trust-border px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:opacity-70"
            >
              Fetch
            </button>
          </div>
        </section>

        {loading && <p className="mt-4 text-sm text-trust-muted">Loading...</p>}
        {!!error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {!!success && <p className="mt-4 text-sm text-green-700">{success}</p>}

        <section className="mt-8 w-full rounded-xl border border-trust-border bg-white p-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Result
          </h2>
          <div className="space-y-3">
            {items.length === 0 && (
              <p className="text-sm text-trust-muted">No transactions found.</p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-trust-border p-3 text-sm"
              >
                <p>ID: {item.id}</p>
                <p>
                  {item.senderId} -&gt; {item.receiverId}
                </p>
                <p>Amount: {item.amount}</p>
                <p>Status: {item.status}</p>
                <p>Created: {new Date(item.createdAt).toLocaleString()}</p>
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
          <Link href="/network" className="text-gray-600 underline underline-offset-4">
            Network
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
