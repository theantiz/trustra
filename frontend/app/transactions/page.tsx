"use client";

import Link from "next/link";
import { useState } from "react";
import {
  API_BASE_URL,
  createTransaction,
  disputeTransaction,
  getReceiverTrust,
  getTransactions,
  refundTransaction
} from "@/lib/api";
import { Transaction, TrustScoreResponse } from "@/lib/types";

export default function TransactionsPage() {
  const [senderId, setSenderId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [queryUserId, setQueryUserId] = useState("");
  const [items, setItems] = useState<Transaction[]>([]);
  const [createdTx, setCreatedTx] = useState<Transaction | null>(null);
  const [receiverTrust, setReceiverTrust] = useState<TrustScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingTrust, setCheckingTrust] = useState(false);
  const [showForms, setShowForms] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateKey = () => {
    const key = "tx-idem-" + Math.random().toString(36).substring(2, 10) + "-" + Date.now();
    setIdempotencyKey(key);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(text);
      setTimeout(() => setCopiedId((prev) => (prev === text ? null : prev)), 2000);
    } catch {
      // Fallback
    }
  };

  const onCheckReceiverTrust = async () => {
    const receiver = receiverId.trim();
    if (!receiver) {
      setError("Enter receiverId to verify trust score");
      return;
    }

    setCheckingTrust(true);
    setError("");
    setSuccess("");
    try {
      const trust = await getReceiverTrust(receiver);
      setReceiverTrust(trust);
      setSuccess(`Counterparty verified: ${trust.userId} (Trust Index: ${trust.score}/100)`);
    } catch {
      setReceiverTrust(null);
      setError("Unable to fetch counterparty trust score");
    } finally {
      setCheckingTrust(false);
    }
  };

  const onCreate = async () => {
    const value = Number(amount);
    const trimmedSender = senderId.trim();
    const trimmedReceiver = receiverId.trim();

    if (!trimmedSender || !trimmedReceiver || Number.isNaN(value) || value <= 0) {
      setError("Provide valid senderId, receiverId, and positive amount");
      return;
    }

    if (!receiverTrust || receiverTrust.userId !== trimmedReceiver) {
      setError("Verify counterparty trust score before dispatching transaction");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const created = await createTransaction({
        senderId: trimmedSender,
        receiverId: trimmedReceiver,
        amount: value,
        currency,
        idempotencyKey: idempotencyKey.trim() || undefined
      });
      setCreatedTx(created);
      setSuccess(`Transaction settled successfully! ID: ${created.id}`);
      setSenderId("");
      setReceiverId("");
      setAmount("");
      setIdempotencyKey("");
      setQueryUserId("");
      setReceiverTrust(null);
      setShowForms(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to execute transaction");
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
      setError("Unable to fetch transactions for user");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDispute = async (txId: string) => {
    setActionInProgress(txId);
    setError("");
    setSuccess("");
    try {
      const updatedTx = await disputeTransaction(txId);

      // Instant status update in local state:
      if (createdTx && createdTx.id === txId) {
        setCreatedTx({ ...createdTx, status: updatedTx.status || "DISPUTE" });
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === txId ? { ...item, status: updatedTx.status || "DISPUTE" } : item
        )
      );

      setSuccess(`Transaction ${txId} has been disputed. Trust Engine recalculated risk profile.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to dispute transaction");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRefund = async (txId: string) => {
    setActionInProgress(txId);
    setError("");
    setSuccess("");
    try {
      const updatedTx = await refundTransaction(txId);

      // Instant status update:
      if (createdTx && createdTx.id === txId) {
        setCreatedTx({ ...createdTx, status: updatedTx.status || "REFUNDED" });
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === txId ? { ...item, status: updatedTx.status || "REFUNDED" } : item
        )
      );

      setSuccess(`Transaction ${txId} refunded.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to refund transaction");
    } finally {
      setActionInProgress(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    const norm = status?.toUpperCase() || "UNKNOWN";
    if (norm === "SUCCESS") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          SUCCESS
        </span>
      );
    }
    if (norm === "DISPUTE") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          DISPUTE
        </span>
      );
    }
    if (norm === "REFUNDED") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
          REFUNDED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
        {norm}
      </span>
    );
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payment Ledger & Transactions</h1>
        <p className="mt-1 text-xs text-slate-500">
          Deterministic payment execution with idempotency, counterparty risk pre-flight checks, and direct dispute adjudication.
        </p>
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="font-bold">&times;</button>
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center justify-between">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess("")} className="font-bold">&times;</button>
        </div>
      )}

      {showForms ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Create Transaction Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-bold text-white">
                TX
              </span>
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                Issue Transaction
              </h2>
            </div>

            <form
              className="space-y-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                void onCreate();
              }}
            >
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Sender Account ID
                </label>
                <input
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  placeholder="e.g. user_alpha"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none transition focus:border-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Recipient Account ID
                </label>
                <div className="flex gap-2">
                  <input
                    value={receiverId}
                    onChange={(e) => {
                      setReceiverId(e.target.value);
                      setReceiverTrust(null);
                    }}
                    placeholder="e.g. merchant_beta"
                    className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none transition focus:border-slate-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => void onCheckReceiverTrust()}
                    disabled={checkingTrust || loading}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 whitespace-nowrap"
                  >
                    {checkingTrust ? "Checking..." : "Verify Trust"}
                  </button>
                </div>
              </div>

              {/* Recipient Trust Preview Card */}
              {receiverTrust && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-slate-700 space-y-1">
                  <div className="flex justify-between items-center font-medium">
                    <span>Recipient Trust Level:</span>
                    <span className="font-bold font-mono text-emerald-800">{receiverTrust.score} / 100</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Fulfillment Rate: {receiverTrust.successRate}%</span>
                    <span>Dispute Rate: {receiverTrust.disputeRate}%</span>
                  </div>
                </div>
              )}

              {/* Amount & Currency */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Transfer Amount & Currency
                </label>
                <div className="grid grid-cols-[1fr_100px] gap-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none transition focus:border-slate-900 font-mono"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none transition focus:border-slate-900 font-medium bg-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Idempotency Key */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-600">
                    Idempotency Key (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={generateKey}
                    className="text-[11px] text-slate-500 hover:text-slate-900 underline"
                  >
                    Generate UUID Key
                  </button>
                </div>
                <input
                  value={idempotencyKey}
                  onChange={(e) => setIdempotencyKey(e.target.value)}
                  placeholder="tx-idem-..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[11px] font-mono outline-none transition focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading || checkingTrust}
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-60"
              >
                {loading ? "Authorizing Transfer..." : "Execute Payment"}
              </button>
            </form>
          </section>

          {/* Query Transactions Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-800">
                  QR
                </span>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                  Query Ledger Records
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Search all inbound and outbound transactions associated with a counterparty identifier.
              </p>

              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void onSearch();
                }}
              >
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Account ID
                  </label>
                  <input
                    value={queryUserId}
                    onChange={(e) => setQueryUserId(e.target.value)}
                    placeholder="e.g. user_alpha"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none transition focus:border-slate-900 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !queryUserId.trim()}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  {loading ? "Searching Ledger..." : "Search Ledger"}
                </button>
              </form>
            </div>

            <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700 block mb-1">Fintech Guardrails:</span>
              <p>&bull; Transactions are processed with strict double-entry idempotency.</p>
              <p>&bull; Disputed records immediately trigger counterparty risk re-evaluation.</p>
            </div>
          </section>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setShowForms(true);
                setCreatedTx(null);
                setItems([]);
                setError("");
                setSuccess("");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <span>&larr; Back to Forms</span>
            </button>
            <span className="text-xs text-slate-500">
              {createdTx ? "1 Newly Created Transaction" : `${items.length} Ledger Records Found`}
            </span>
          </div>

          {/* Newly Created Transaction Detail View */}
          {createdTx && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Transaction Receipt
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">{createdTx.id}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdTx.id)}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-200"
                    >
                      {copiedId === createdTx.id ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <div>{renderStatusBadge(createdTx.status)}</div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <span className="text-[11px] text-slate-400 uppercase font-medium">Sender</span>
                  <p className="mt-1 font-mono font-semibold text-slate-900">{createdTx.senderId}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <span className="text-[11px] text-slate-400 uppercase font-medium">Recipient</span>
                  <p className="mt-1 font-mono font-semibold text-slate-900">{createdTx.receiverId}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <span className="text-[11px] text-slate-400 uppercase font-medium">Amount</span>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                    {createdTx.currency || "USD"} {Number(createdTx.amount).toFixed(2)}
                  </p>
                </div>
              </div>

              {createdTx.idempotencyKey && (
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs flex justify-between items-center">
                  <span className="text-slate-500">Idempotency Key:</span>
                  <span className="font-mono text-slate-700">{createdTx.idempotencyKey}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
                {createdTx.status !== "DISPUTE" && (
                  <button
                    type="button"
                    onClick={() => handleDispute(createdTx.id)}
                    disabled={actionInProgress === createdTx.id}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition disabled:opacity-60"
                  >
                    <span>{actionInProgress === createdTx.id ? "Disputing..." : "File Dispute"}</span>
                  </button>
                )}
                {createdTx.status !== "REFUNDED" && createdTx.status !== "DISPUTE" && (
                  <button
                    type="button"
                    onClick={() => handleRefund(createdTx.id)}
                    disabled={actionInProgress === createdTx.id}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
                  >
                    <span>{actionInProgress === createdTx.id ? "Refunding..." : "Refund"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Searched Items List */}
          {items.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                Ledger Entries ({items.length})
              </h3>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">#{item.id.slice(0, 8)}...</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.id)}
                          className="rounded bg-slate-100 px-1 py-0.2 text-[9px] text-slate-500 hover:bg-slate-200 font-mono"
                        >
                          {copiedId === item.id ? "Copied" : "Copy ID"}
                        </button>
                        {renderStatusBadge(item.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono font-medium text-slate-900">{item.senderId}</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="font-mono font-medium text-slate-900">{item.receiverId}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3">
                      <span className="font-mono text-base font-bold text-slate-900">
                        {item.currency || "USD"} {Number(item.amount).toFixed(2)}
                      </span>

                      <div className="flex items-center gap-2">
                        {item.status !== "DISPUTE" ? (
                          <button
                            type="button"
                            onClick={() => handleDispute(item.id)}
                            disabled={actionInProgress === item.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-60"
                          >
                            <span>{actionInProgress === item.id ? "Disputing..." : "Dispute"}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-rose-600 font-semibold px-2 py-1 bg-rose-50/60 rounded">
                            Disputed
                          </span>
                        )}

                        {item.status !== "REFUNDED" && item.status !== "DISPUTE" && (
                          <button
                            type="button"
                            onClick={() => handleRefund(item.id)}
                            disabled={actionInProgress === item.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
                          >
                            <span>Refund</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!createdTx && items.length === 0 && !loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-sm text-slate-400">No transactions recorded for this account ID.</p>
            </div>
          )}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="mt-12 flex flex-wrap justify-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-6">
        <Link href="/" className="hover:text-slate-900 underline underline-offset-4">
          Overview
        </Link>
        <Link href="/feedback" className="hover:text-slate-900 underline underline-offset-4">
          Feedback
        </Link>
        <Link href="/abuse" className="hover:text-slate-900 underline underline-offset-4">
          Abuse Detection
        </Link>
        <Link href="/network" className="hover:text-slate-900 underline underline-offset-4">
          Network Graph
        </Link>
        <Link href="/admin" className="hover:text-slate-900 underline underline-offset-4">
          Admin Console
        </Link>
        <a
          href={`${API_BASE_URL}/swagger-ui.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-900 underline underline-offset-4"
        >
          OpenAPI Specification
        </a>
      </div>
    </main>
  );
}
