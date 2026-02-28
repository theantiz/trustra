import { TrustScoreResponse, TrustLevel } from "@/lib/types";
import ExplanationItem from "@/components/ExplanationItem";
import StatusBadge from "@/components/StatusBadge";

type TrustCardProps = {
  result: TrustScoreResponse;
};

export default function TrustCard({ result }: TrustCardProps) {
  const timestamp = result.lastUpdatedAt ?? result.lastUpdated;
  const formattedDate = timestamp ? new Date(timestamp).toLocaleString() : "-";
  const level = (["HIGH", "MEDIUM", "LOW"].includes(result.level)
    ? result.level
    : "LOW") as TrustLevel;
  const explanations = result.explanations ?? [];

  return (
    <section className="mt-8 w-full rounded-xl border border-trust-border bg-white p-8 text-center">
      <p className="text-sm text-trust-muted">Trust Score</p>
      <p className="mt-2 text-6xl font-semibold text-gray-900">{result.score}</p>
      <div className="mt-4 flex justify-center">
        <StatusBadge level={level} />
      </div>
      <p className="mt-3 text-xs text-trust-muted">Last updated: {formattedDate}</p>

      <div className="mt-8 text-left">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Explanation
        </h2>
        <div className="rounded-lg border border-trust-border px-4">
          {explanations.length === 0 && (
            <p className="py-4 text-sm text-trust-muted">No explanation data available.</p>
          )}
          {explanations.map((item) => (
            <ExplanationItem key={`${result.userId}-${item.label}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
