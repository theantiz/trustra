export type TrustLevel = "HIGH" | "MEDIUM" | "LOW";

export type Explanation = {
  factor: string;
  metricValue: number;
  contribution: number;
  explanation: string;
  calculatedAt: string;
};

export type TrustScoreResponse = {
  userId: string;
  score: number;
  successRate: number;
  disputeRate: number;
  averageRating: number;
  calculatedAt: string;
  lastActivityAt?: string;
};

export type Transaction = {
  id: string;
  senderId: string;
  receiverId: string;
  amount: string | number;
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

export type UserListItem = {
  userId: string;
  score?: number;
  level?: string;
  lastUpdatedAt?: string;
  lastActivityAt?: string;
};
