export type TrustLevel = "HIGH" | "MEDIUM" | "LOW";

export type Explanation = {
  label: string;
  value: string;
  impact: number;
};

export type TrustScoreResponse = {
  userId: string;
  score: number;
  level: TrustLevel | string;
  lastUpdatedAt?: string;
  lastUpdated?: string;
  explanations?: Explanation[];
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
