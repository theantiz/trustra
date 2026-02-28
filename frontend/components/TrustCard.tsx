import { Explanation, TrustLevel, TrustScoreResponse } from "@/lib/types";
import ExplanationItem from "@/components/ExplanationItem";
import StatusBadge from "@/components/StatusBadge";

type TrustCardProps = {
  result: TrustScoreResponse;
  explanations?: Explanation[];
};

function formatPercent(value: number): string {
  return `${Number(value).toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

function formatRating(value: number): string {
  return Number(value).toFixed(value % 1 === 0 ? 1 : 2);
}

function formatScore(value: number): string {
  return Number(value).toFixed(value % 1 === 0 ? 0 : 2);
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

export default function TrustCard({ result, explanations = [] }: TrustCardProps) {
  const formattedDate = result.calculatedAt
    ? new Date(result.calculatedAt).toLocaleString()
    : "-";
  const activityDate = result.lastActivityAt
    ? new Date(result.lastActivityAt).toLocaleString()
    : "No recent activity";
  const level = getTrustLevel(result.score);

  return (
    <section className="mt-10 w-full rounded-2xl border border-trust-border bg-white p-10">
      <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
        <div>
          <p className="text-sm text-trust-muted">Trust Score</p>
          <p className="mt-2 text-6xl font-semibold leading-none tabular-nums text-gray-900">
            {formatScore(result.score)}
          </p>
          <div className="mt-5 flex">
            <StatusBadge level={level} />
          </div>
          <p className="mt-4 text-xs text-trust-muted">Calculated: {formattedDate}</p>
          <p className="mt-1 text-xs text-trust-muted">Last activity: {activityDate}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          <div className="flex min-h-40 flex-col items-center justify-center rounded-xl bg-gray-50 px-6 py-6 text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-trust-muted">Success</p>
            <p className="mt-3 tabular-nums font-semibold text-gray-900 leading-tight text-3xl sm:text-4xl lg:text-5xl">
              {formatPercent(result.successRate)}
            </p>
          </div>

          <div className="flex min-h-40 flex-col items-center justify-center rounded-xl bg-gray-50 px-6 py-6 text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-trust-muted">Disputes</p>
            <p className="mt-3 tabular-nums font-semibold text-gray-900 leading-tight text-3xl sm:text-4xl lg:text-5xl">
              {formatPercent(result.disputeRate)}
            </p>
          </div>

          <div className="flex min-h-40 flex-col items-center justify-center rounded-xl bg-gray-50 px-6 py-6 text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-trust-muted">Rating</p>
            <p className="mt-3 tabular-nums font-semibold text-gray-900 leading-tight text-3xl sm:text-4xl lg:text-5xl">
              {formatRating(result.averageRating)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 text-left">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Explanation Trail
        </h2>
        <div className="rounded-lg border border-trust-border px-5 py-1">
          {explanations.length === 0 && (
            <p className="py-4 text-sm text-trust-muted">No explanation data available.</p>
          )}
          {explanations.map((item) => (
            <ExplanationItem
              key={`${result.userId}-${item.factor}-${item.calculatedAt}`}
              item={item}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
