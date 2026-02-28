import { Explanation, TrustLevel, TrustScoreResponse } from "@/lib/types";
import ExplanationItem from "@/components/ExplanationItem";
import StatusBadge from "@/components/StatusBadge";

type TrustCardProps = {
  result: TrustScoreResponse;
  explanations?: Explanation[];
};

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
          <p className="mt-2 text-6xl font-semibold leading-none text-gray-900">{result.score}</p>
          <div className="mt-5 flex">
            <StatusBadge level={level} />
          </div>
          <p className="mt-4 text-xs text-trust-muted">Calculated: {formattedDate}</p>
          <p className="mt-1 text-xs text-trust-muted">Last activity: {activityDate}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-trust-muted">Success</p>
            <p className="mt-3 text-4xl font-semibold leading-none text-gray-900">
              {result.successRate}%
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-trust-muted">Disputes</p>
            <p className="mt-3 text-4xl font-semibold leading-none text-gray-900">
              {result.disputeRate}%
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-trust-muted">Rating</p>
            <p className="mt-3 text-4xl font-semibold leading-none text-gray-900">
              {result.averageRating}
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
