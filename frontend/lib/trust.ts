export type TrustLevel = "HIGH" | "MEDIUM" | "LOW";

export type Explanation = {
  label: string;
  value: string;
  impact: number;
};

export type UserTrustRecord = {
  userId: string;
  score: number;
  level: TrustLevel;
  lastUpdated: string;
  explanations: Explanation[];
  flagged: boolean;
};

type TrustStore = {
  users: Record<string, UserTrustRecord>;
};

declare global {
  // eslint-disable-next-line no-var
  var __TRUST_STORE__: TrustStore | undefined;
}

const baseUsers: Record<string, UserTrustRecord> = {
  u1001: createUser("u1001", 82, [
    { label: "Account Age", value: "2.1 years", impact: 8 },
    { label: "Success Rate", value: "97%", impact: 10 },
    { label: "Chargebacks", value: "1", impact: -4 },
    { label: "Network Risk", value: "Low", impact: 5 }
  ]),
  u1002: createUser("u1002", 61, [
    { label: "Account Age", value: "11 months", impact: 3 },
    { label: "Success Rate", value: "88%", impact: 4 },
    { label: "Chargebacks", value: "4", impact: -9 },
    { label: "Network Risk", value: "Medium", impact: 1 }
  ]),
  u1003: createUser("u1003", 34, [
    { label: "Account Age", value: "3 months", impact: -5 },
    { label: "Success Rate", value: "61%", impact: -8 },
    { label: "Chargebacks", value: "9", impact: -12 },
    { label: "Network Risk", value: "High", impact: -10 }
  ])
};

function createUser(
  userId: string,
  score: number,
  explanations: Explanation[]
): UserTrustRecord {
  return {
    userId,
    score,
    level: getLevel(score),
    lastUpdated: new Date().toISOString(),
    explanations,
    flagged: score < 40
  };
}

function getStore(): TrustStore {
  if (!globalThis.__TRUST_STORE__) {
    globalThis.__TRUST_STORE__ = { users: { ...baseUsers } };
  }
  return globalThis.__TRUST_STORE__;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getLevel(score: number): TrustLevel {
  if (score >= 75) return "HIGH";
  if (score >= 45) return "MEDIUM";
  return "LOW";
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function patchValues(record: UserTrustRecord): UserTrustRecord {
  const successRate = randomInt(60, 99);
  const chargebacks = randomInt(0, 10);
  const accountAgeYears = (randomInt(1, 36) / 12).toFixed(1);
  const networkRiskIndex = randomInt(0, 2);
  const networkRisk = ["Low", "Medium", "High"][networkRiskIndex];

  const refreshed: Explanation[] = [
    {
      label: "Account Age",
      value: `${accountAgeYears} years`,
      impact: randomInt(-3, 8)
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      impact: randomInt(-8, 10)
    },
    {
      label: "Chargebacks",
      value: String(chargebacks),
      impact: randomInt(-12, -1)
    },
    {
      label: "Network Risk",
      value: networkRisk,
      impact: randomInt(-8, 6)
    }
  ];

  const totalImpact = refreshed.reduce((acc, item) => acc + item.impact, 0);
  const nextScore = clampScore(record.score + Math.round(totalImpact / 4));

  return {
    ...record,
    explanations: refreshed,
    score: nextScore,
    level: getLevel(nextScore),
    flagged: nextScore < 40,
    lastUpdated: new Date().toISOString()
  };
}

export function getTrustById(userId: string): UserTrustRecord | null {
  const store = getStore();
  return store.users[userId] ?? null;
}

export function simulateRandomTransactions(): {
  stats: TrustStats;
  sampleUserId: string;
} {
  const store = getStore();
  const ids = Object.keys(store.users);
  for (const id of ids) {
    if (Math.random() > 0.3) {
      store.users[id] = patchValues(store.users[id]);
    }
  }
  const sampleUserId = ids[randomInt(0, ids.length - 1)];
  return {
    stats: getTrustStats(),
    sampleUserId
  };
}

export function simulateMaliciousCluster(): {
  stats: TrustStats;
  sampleUserId: string;
} {
  const store = getStore();
  const ids = Object.keys(store.users);
  const clusterSize = Math.min(2, ids.length);
  const affected = ids.slice(0, clusterSize);

  for (const id of affected) {
    const current = store.users[id];
    const forcedExplanations: Explanation[] = [
      { label: "Account Age", value: "2 months", impact: -9 },
      { label: "Success Rate", value: "54%", impact: -10 },
      { label: "Chargebacks", value: "14", impact: -14 },
      { label: "Network Risk", value: "High", impact: -12 }
    ];
    const reduced = clampScore(current.score - randomInt(15, 30));
    store.users[id] = {
      ...current,
      score: reduced,
      level: getLevel(reduced),
      flagged: true,
      explanations: forcedExplanations,
      lastUpdated: new Date().toISOString()
    };
  }

  return {
    stats: getTrustStats(),
    sampleUserId: affected[0] ?? ids[0]
  };
}

export type TrustStats = {
  totalUsers: number;
  flaggedUsers: number;
  averageTrustScore: number;
};

export function getTrustStats(): TrustStats {
  const store = getStore();
  const users = Object.values(store.users);
  const totalUsers = users.length;
  const flaggedUsers = users.filter((u) => u.flagged).length;
  const average =
    totalUsers === 0
      ? 0
      : users.reduce((acc, user) => acc + user.score, 0) / totalUsers;

  return {
    totalUsers,
    flaggedUsers,
    averageTrustScore: Number(average.toFixed(1))
  };
}
