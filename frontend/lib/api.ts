import { AbuseFlag, Feedback, Transaction, TrustScoreResponse } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getTrust(userId: string): Promise<TrustScoreResponse> {
  return request<TrustScoreResponse>(`/api/trust/${encodeURIComponent(userId)}`);
}

export async function recalculateTrust(userId: string): Promise<TrustScoreResponse> {
  return request<TrustScoreResponse>(
    `/api/trust/${encodeURIComponent(userId)}/recalculate`,
    { method: "POST" }
  );
}

export async function createTransaction(input: {
  senderId: string;
  receiverId: string;
  amount: number;
}): Promise<Transaction> {
  return request<Transaction>("/api/transactions", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  return request<Transaction[]>(
    `/api/transactions?userId=${encodeURIComponent(userId)}`
  );
}

export async function createFeedback(input: {
  fromUserId: string;
  toUserId: string;
  rating: number;
  type: string;
  comment: string;
}): Promise<Feedback> {
  return request<Feedback>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getAbuseFlags(userId: string): Promise<AbuseFlag[]> {
  return request<AbuseFlag[]>(`/api/abuse/${encodeURIComponent(userId)}`);
}
