import {
  AbuseFlag,
  AuthResponse,
  Explanation,
  Feedback,
  NetworkCounterparty,
  ScoringConfig,
  SimStats,
  Transaction,
  TrustScoreHistory,
  TrustScoreResponse
} from "@/lib/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8080"
    : "https://trustra-ixpk.onrender.com");

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
    let message = `Request failed (${response.status})`;
    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
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

export async function getTrustHistory(userId: string): Promise<TrustScoreHistory[]> {
  return request<TrustScoreHistory[]>(
    `/api/trust/${encodeURIComponent(userId)}/history`
  );
}

export async function createTransaction(input: {
  senderId: string;
  receiverId: string;
  amount: number;
  currency?: string;
  idempotencyKey?: string;
}): Promise<Transaction> {
  const headers: Record<string, string> = {};
  if (input.idempotencyKey) {
    headers["Idempotency-Key"] = input.idempotencyKey;
  }

  return request<Transaction>("/api/transactions", {
    method: "POST",
    headers,
    body: JSON.stringify({
      senderId: input.senderId,
      receiverId: input.receiverId,
      amount: input.amount,
      currency: input.currency || "USD",
      idempotencyKey: input.idempotencyKey
    })
  });
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  return request<Transaction[]>(
    `/api/transactions?userId=${encodeURIComponent(userId)}`
  );
}

export async function disputeTransaction(id: string): Promise<Transaction> {
  return request<Transaction>(`/api/transactions/${encodeURIComponent(id)}/dispute`, {
    method: "POST"
  });
}

export async function refundTransaction(id: string): Promise<Transaction> {
  return request<Transaction>(`/api/transactions/${encodeURIComponent(id)}/refund`, {
    method: "POST"
  });
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

export async function getAdminConfig(token?: string): Promise<ScoringConfig> {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return request<ScoringConfig>("/api/admin/config", { headers });
}

export async function updateAdminConfig(config: ScoringConfig, token?: string): Promise<ScoringConfig> {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return request<ScoringConfig>("/api/admin/config", {
    method: "PUT",
    headers,
    body: JSON.stringify(config)
  });
}

export async function recalculateNetwork(token?: string): Promise<TrustScoreResponse[]> {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    return await request<TrustScoreResponse[]>("/api/admin/recalculate", {
      method: "POST",
      headers
    });
  } catch {
    return await request<TrustScoreResponse[]>("/api/trust/recalculate-all", {
      method: "POST",
      headers
    });
  }
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/token", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
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
