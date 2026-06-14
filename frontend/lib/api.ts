import {
  AbuseFlag,
  Explanation,
  Feedback,
  NetworkCounterparty,
  SimStats,
  Transaction,
  TrustScoreResponse
} from "@/lib/types";

export const API_BASE_URL =
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

  const contentType = response.headers.get("content-type") || "";
  if (response.status === 204 || !contentType.includes("application/json")) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getTrust(userId: string): Promise<TrustScoreResponse> {
  return request<TrustScoreResponse>(`/api/trust/${encodeURIComponent(userId)}`);
}

export async function getReceiverTrust(receiverId: string): Promise<TrustScoreResponse> {
  return request<TrustScoreResponse>(
    `/api/transactions/receiver-trust?receiverId=${encodeURIComponent(receiverId)}`
  );
}

export async function getTrustExplanations(userId: string): Promise<Explanation[]> {
  return request<Explanation[]>(
    `/api/trust/${encodeURIComponent(userId)}/explanations`
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

export async function simInit(users: number): Promise<SimStats> {
  return request<SimStats>("/api/sim/init", {
    method: "POST",
    body: JSON.stringify({ users })
  });
}

export async function simNormal(steps: number): Promise<SimStats> {
  return request<SimStats>("/api/sim/normal", {
    method: "POST",
    body: JSON.stringify({ steps })
  });
}

export async function simMalicious(
  clusterSize: number,
  steps: number
): Promise<SimStats> {
  return request<SimStats>("/api/sim/malicious", {
    method: "POST",
    body: JSON.stringify({ clusterSize, steps })
  });
}

export async function simSpike(userId: string): Promise<SimStats> {
  return request<SimStats>(`/api/sim/spike/${encodeURIComponent(userId)}`, {
    method: "POST"
  });
}

export async function getSimStats(): Promise<SimStats> {
  return request<SimStats>("/api/sim/stats");
}

export async function getNetwork(userId: string): Promise<NetworkCounterparty[]> {
  return request<NetworkCounterparty[]>(`/api/network/${encodeURIComponent(userId)}`);
}

