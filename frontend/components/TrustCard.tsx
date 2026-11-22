import { Explanation, TrustLevel, TrustScoreHistory, TrustScoreResponse } from "@/lib/types";
import ExplanationItem from "@/components/ExplanationItem";
import StatusBadge from "@/components/StatusBadge";
import ScoreGauge from "@/components/ScoreGauge";

type TrustCardProps = {
  result: TrustScoreResponse;
  explanations?: Explanation[];
  history?: TrustScoreHistory[];
};

function formatPercent(value: number): string {
  return `${Number(value).toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

function formatRating(value: number): string {
  return Number(value).toFixed(value % 1 === 0 ? 1 : 2);
}

function getTrustLevel(score: number): TrustLevel {
  if (score >= 75) {
    return "HIGH";
  }
  if (score >= 45) {
    return "MEDIUM";
  }
  return "LOW";
}

export default function TrustCard({ result, explanations = [], history = [] }: TrustCardProps) {
  const formattedDate = result.calculatedAt
    ? new Date(result.calculatedAt).toLocaleString()
    : "-";
  const activityDate = result.lastActivityAt
    ? new Date(result.lastActivityAt).toLocaleString()
    : "No recent activity";
  const level = result.trustLevel || getTrustLevel(result.score);

  return (
    <section className="mt-8 w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-mono text-sm font-bold shadow-sm">
            {result.userId.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 text-base">{result.userId}</h3>
              <StatusBadge level={level} />
            </div>
            <p className="text-xs text-slate-400">
              Evaluated: <span className="text-slate-600">{formattedDate}</span>
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-400">
          <span>Last Activity:</span>{" "}
          <span className="font-medium text-slate-700">{activityDate}</span>
        </div>
      </div>

      {/* Main Score & Metrics Hero */}
      <div className="mt-6 grid grid-cols-1 items-center gap-8 lg:grid-cols-[auto_1fr]">
        {/* Score Gauge Meter */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50/80 to-white p-6 shadow-inner">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Real-Time Trust Index
          </p>
          <ScoreGauge score={result.score} size={150} strokeWidth={11} showLabel={true} />
          <p className="mt-3 text-[11px] text-slate-400 text-center max-w-[170px]">
            Algorithmic confidence based on multi-factor behavioral analysis
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 transition hover:border-slate-300">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>SUCCESS RATE</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-4">
              <p className="font-mono text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {formatPercent(result.successRate)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Fulfilled transactions</p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 transition hover:border-slate-300">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>DISPUTES</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  result.disputeRate > 5 ? "bg-rose-500" : "bg-slate-300"
                }`}
              />
            </div>
            <div className="mt-4">
              <p
                className={`font-mono text-3xl font-bold tracking-tight tabular-nums ${
                  result.disputeRate > 5 ? "text-rose-600" : "text-slate-900"
                }`}
              >
                {formatPercent(result.disputeRate)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Chargebacks & disputes</p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 transition hover:border-slate-300">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>AVG RATING</span>
              <span className="text-amber-500 text-xs">★</span>
            </div>
            <div className="mt-4">
              <p className="font-mono text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {formatRating(result.averageRating)}{" "}
                <span className="text-base font-normal text-slate-400">/ 5.0</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Counterparty feedback</p>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Trail */}
      <div className="mt-8 text-left">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Decision & Attribution Trail
          </h4>
          <span className="text-[11px] text-slate-400">
            {explanations.length} contributing factor{explanations.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {explanations.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-400">
              No factor explanation data available for this user.
            </p>
          )}
          {explanations.map((item) => (
            <ExplanationItem
              key={`${result.userId}-${item.factor}-${item.calculatedAt}`}
              item={item}
            />
          ))}
        </div>
      </div>

      {/* Score History / Time-Series Audit Log */}
      {history.length > 0 && (
        <div className="mt-8 text-left">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Historical Audit Trail (Time-Series)
            </h4>
            <span className="text-[11px] text-slate-400">Last {Math.min(10, history.length)} events</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Timestamp</th>
                  <th className="px-4 py-2.5 font-medium">Score</th>
                  <th className="px-4 py-2.5 font-medium">Success</th>
                  <th className="px-4 py-2.5 font-medium">Disputes</th>
                  <th className="px-4 py-2.5 font-medium">Rating</th>
                  <th className="px-4 py-2.5 font-medium">Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {history.slice(0, 10).map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-2.5 text-slate-500 font-mono">
                      {new Date(h.recordedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900 tabular-nums">
                      {h.score}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-600">{h.successRate}%</td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-600">{h.disputeRate}%</td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-600">{h.averageRating}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700">
                        {h.triggerReason}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
