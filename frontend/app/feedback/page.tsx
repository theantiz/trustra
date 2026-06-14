"use client";

import Link from "next/link";
import { useState } from "react";
import { API_BASE_URL, createFeedback } from "@/lib/api";
import { Feedback } from "@/lib/types";

const feedbackTypes = ["POSITIVE", "NEGATIVE", "SCAM_REPORT"];

export default function FeedbackPage() {
  const [fromUserId, setFromUserId] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [rating, setRating] = useState("5");
  const [type, setType] = useState("POSITIVE");
  const [comment, setComment] = useState("");
  const [savedFeedback, setSavedFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async () => {
    const ratingValue = Number(rating);
    if (
      !fromUserId.trim() ||
      !toUserId.trim() ||
      Number.isNaN(ratingValue) ||
      ratingValue < 1 ||
      ratingValue > 5
    ) {
      setError("Provide valid fromUserId, toUserId, and rating between 1 and 5");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const saved = await createFeedback({
        fromUserId: fromUserId.trim(),
        toUserId: toUserId.trim(),
        rating: ratingValue,
        type,
        comment: comment.trim()
      });
      setSavedFeedback(saved);
      setSuccess(`Feedback saved: ${saved.id}`);
      setFromUserId("");
      setToUserId("");
      setRating("5");
      setType("POSITIVE");
      setComment("");
      setShowForm(false);
    } catch {
      setError("Unable to save feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-12 sm:px-8">
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center">
        <h1 className="mb-8 text-center text-2xl font-semibold">Feedback</h1>

        {showForm && (
          <section className="w-full rounded-xl border border-trust-border bg-white p-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
              Submit Feedback
            </h2>
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void onSubmit();
              }}
            >
              <input
                value={fromUserId}
                onChange={(e) => setFromUserId(e.target.value)}
                placeholder="From User ID"
                className="rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
              />
              <input
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                placeholder="To User ID"
                className="rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
              />
              <input
                type="number"
                min="1"
                max="5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="Rating (1-5)"
                className="rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
              >
                {feedbackTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comment"
                rows={3}
                className="rounded-lg border border-trust-border px-4 py-3 text-sm outline-none focus:border-gray-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg border border-trust-border bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-70"
              >
                Save Feedback
              </button>
            </form>
          </section>
        )}

        {loading && <p className="mt-4 text-sm text-trust-muted">Loading...</p>}
        {!!error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {!!success && <p className="mt-4 text-sm text-green-700">{success}</p>}
        {!showForm && savedFeedback && (
          <>
            <section className="mt-8 w-full rounded-xl border border-trust-border bg-white p-10 text-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                Output
              </h2>
              <p>ID: {savedFeedback.id}</p>
              <p>From: {savedFeedback.fromUserId}</p>
              <p>To: {savedFeedback.toUserId}</p>
              <p>Rating: {savedFeedback.rating}</p>
              <p>Type: {savedFeedback.type}</p>
            </section>
            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setSavedFeedback(null);
                setError("");
                setSuccess("");
              }}
              className="mt-6 rounded-lg border border-trust-border px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
            >
              Submit Another
            </button>
          </>
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
          <Link href="/abuse" className="text-gray-600 underline underline-offset-4">
            Abuse
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
