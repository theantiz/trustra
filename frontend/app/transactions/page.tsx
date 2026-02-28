"use client";

import Link from "next/link";
import { useState } from "react";
import { createTransaction, getReceiverTrust, getTransactions } from "@/lib/api";
import { Transaction, TrustScoreResponse } from "@/lib/types";

export default function TransactionsPage() {
  const [senderId, setSenderId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [queryUserId, setQueryUserId] = useState("");
  const [items, setItems] = useState<Transaction[]>([]);
  const [createdTx, setCreatedTx] = useState<Transaction | null>(null);
  const [receiverTrust, setReceiverTrust] = useState<TrustScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingTrust, setCheckingTrust] = useState(false);
  const [showForms, setShowForms] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onCheckReceiverTrust = async () => {
    const receiver = receiverId.trim();
    if (!receiver) {
      setError("Enter receiverId to check trust score");
      return;
    }

    setCheckingTrust(true);
    setError("");
    setSuccess("");
    try {
      const trust = await getReceiverTrust(receiver);
      setReceiverTrust(trust);
      setSuccess(`Receiver ${trust.userId} trust score: ${trust.score}`);
    } catch {
      setReceiverTrust(null);
      setError("Unable to fetch receiver trust score");
    } finally {
      setCheckingTrust(false);
    }
  };

  const onCreate = async () => {
    const value = Number(amount);
    const trimmedSender = senderId.trim();
    const trimmedReceiver = receiverId.trim();

    if (!trimmedSender || !trimmedReceiver || Number.isNaN(value) || value <= 0) {
      setError("Provide valid senderId, receiverId, and amount");
      return;
    }

    if (!receiverTrust || receiverTrust.userId !== trimmedReceiver) {
      setError("Check receiver trust score before creating transaction");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const created = await createTransaction({
        senderId: trimmedSender,
        receiverId: trimmedReceiver,
        amount: value
      });
      setCreatedTx(created);
      setSuccess(`Transaction created: ${created.id}`);
      setSenderId("");
      setReceiverId("");
      setAmount("");
      setQueryUserId("");
      setReceiverTrust(null);
      setShowForms(false);
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
      setCreatedTx(null);
      setQueryUserId("");
      setShowForms(false);
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

        {showForms && (
          <>
            <section className="w-full rounded-xl border border-trust-border bg-white p-10">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                Create Transaction
              </h2>
              <form
                className="grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void onCreate();
                }}
              >
                <input
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  placeholder="Sender User ID"
                  className="rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
                />
                <input
                  value={receiverId}
                  onChange={(e) => {
                    setReceiverId(e.target.value);
                    setReceiverTrust(null);
                  }}
                  placeholder="Receiver User ID"
                  className="rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
                />
                <button
                  type="button"
                  onClick={() => void onCheckReceiverTrust()}
                  disabled={checkingTrust || loading}
                  className="rounded-lg border border-trust-border px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:opacity-70"
                >
                  {checkingTrust ? "Checking..." : "Check Receiver Trust Score"}
                </button>
                {receiverTrust && (
                  <div className="rounded-lg border border-trust-border bg-gray-50 p-3 text-sm text-gray-800">
                    <p>
                      Receiver: <span className="font-medium">{receiverTrust.userId}</span>
                    </p>
                    <p>
                      Trust Score: <span className="font-medium">{receiverTrust.score}</span>
                    </p>
                    <p>Success Rate: {receiverTrust.successRate}%</p>
                    <p>Dispute Rate: {receiverTrust.disputeRate}%</p>
                  </div>
                )}
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
                  type="submit"
                  disabled={loading || checkingTrust}
                  className="rounded-lg border border-trust-border bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-70"
                >
                  Create Transaction
                </button>
              </form>
            </section>

            <section className="mt-8 w-full rounded-xl border border-trust-border bg-white p-10">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                Query Transactions
              </h2>
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  void onSearch();
                }}
              >
                <input
                  value={queryUserId}
                  onChange={(e) => setQueryUserId(e.target.value)}
                  placeholder="User ID"
                  className="flex-1 rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg border border-trust-border px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:opacity-70"
                >
                  Fetch
                </button>
              </form>
            </section>
          </>
        )}

        {(loading || checkingTrust) && (
          <p className="mt-4 text-sm text-trust-muted">Loading...</p>
        )}
        {!!error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {!!success && <p className="mt-4 text-sm text-green-700">{success}</p>}

        {!showForms && (
          <button
            type="button"
            onClick={() => {
              setShowForms(true);
              setItems([]);
              setCreatedTx(null);
              setReceiverTrust(null);
              setError("");
              setSuccess("");
            }}
            className="mt-6 rounded-lg border border-trust-border px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
          >
            Submit Another
          </button>
        )}

        {!showForms && (
          <section className="mt-8 w-full rounded-xl border border-trust-border bg-white p-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
              Result
            </h2>
            <div className="space-y-3">
              {!createdTx && items.length === 0 && (
                <p className="text-sm text-trust-muted">No transactions found.</p>
              )}
              {createdTx && (
                <div className="rounded-lg border border-trust-border p-3 text-sm">
                  <p>ID: {createdTx.id}</p>
                  <p>
                    {createdTx.senderId} -&gt; {createdTx.receiverId}
                  </p>
                  <p>Amount: {createdTx.amount}</p>
                  <p>Status: {createdTx.status}</p>
                  <p>Created: {new Date(createdTx.createdAt).toLocaleString()}</p>
                </div>
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

