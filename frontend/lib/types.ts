export type TrustLevel = "HIGH" | "MEDIUM" | "LOW";

export type Explanation = {
  factor: string;
  metricValue: number;
  contribution: number;
  explanation: string;
  calculatedAt: string;
};

export type TrustScoreResponse = {
  id?: number;
  userId: string;
  score: number;
  trustLevel?: TrustLevel;
  successRate: number;
  disputeRate: number;
  averageRating: number;
  calculatedAt: string;
  lastActivityAt?: string;
};

export type TrustScoreHistory = {
  id: number;
  userId: string;
  score: number;
  successRate: number;
  disputeRate: number;
  averageRating: number;
  triggerReason: string;
  recordedAt: string;
};

export type Transaction = {
  id: string;
  idempotencyKey?: string;
  senderId: string;
  receiverId: string;
  amount: string | number;
  currency?: string;
  status: "SUCCESS" | "FAILED" | "DISPUTE" | string;
  createdAt: string;
};

export type Feedback = {
  id: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  type: "POSITIVE" | "NEGATIVE" | "SCAM_REPORT" | string;
  comment?: string;
  createdAt: string;
};

export type AbuseFlag = {
  id: string;
  userId: string;
  flagType: "SPIKE" | "CLUSTER" | "FAKE_FEEDBACK" | string;
  severity: "LOW" | "MED" | "HIGH" | string;
  details: string;
  createdAt: string;
};

export type ScoringConfig = {
  successWeight: number;
  disputeWeight: number;
  feedbackWeight: number;
  networkWeight: number;
  maxInactivityPenalty: number;
  negativeFeedbackPenalty: number;
  scamReportPenalty: number;
  spikePenalty: number;
  fakeFeedbackPenalty: number;
  clusterPenalty: number;
  updatedAt?: string;
  updatedBy?: string;
};

export type AuthResponse = {
  token: string;
  tokenType: string;
  username: string;
  roles: string[];
  expiresInSeconds: number;
};

export type SimStats = {
  totalUsers: number;
  avgTrustScore: number;
  flaggedUsersCount: number;
  highestTrustUser: SimulationUserSummary | null;
  lowestTrustUser: SimulationUserSummary | null;
};

export type NetworkCounterparty = {
  userId: string;
  trustScore: number;
};

export type SimulationUserSummary = {
  userId: string;
  score: number;
};
