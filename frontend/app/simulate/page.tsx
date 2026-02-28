"use client";

import Link from "next/link";

export default function SimulatePage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center">
        <h1 className="mb-2 text-center text-2xl font-semibold">Trustra Features</h1>
        <p className="mb-6 text-center text-sm text-trust-muted">
          Trustra is a real time trust scoring engine that evaluates the reliability
          of users in digital payment systems using behavioral signals, transaction
          history, and feedback patterns.
        </p>

        <div className="w-full rounded-xl border border-trust-border bg-white p-8">
          <div className="flex flex-col gap-4 text-center text-sm">
            <Link href="/" className="text-gray-700 underline underline-offset-4">
              Trust Lookup and Recalculate
            </Link>
            <Link
              href="/transactions"
              className="text-gray-700 underline underline-offset-4"
            >
              Transactions API
            </Link>
            <Link href="/feedback" className="text-gray-700 underline underline-offset-4">
              Feedback API
            </Link>
            <Link href="/abuse" className="text-gray-700 underline underline-offset-4">
              Abuse Flags API
            </Link>
          </div>
        </div>

        <Link href="/" className="mt-8 text-sm text-gray-600 underline underline-offset-4">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
