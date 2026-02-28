import { Explanation } from "@/lib/types";

type ExplanationItemProps = {
  item: Explanation;
};

export default function ExplanationItem({ item }: ExplanationItemProps) {
  const impactColor = item.contribution >= 0 ? "text-green-700" : "text-red-700";
  const impactPrefix = item.contribution >= 0 ? "+" : "";

  return (
    <div className="grid gap-2 border-b border-trust-border py-3 text-sm last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="text-left">
          <div className="font-medium text-gray-900">{item.factor}</div>
          <div className="text-trust-muted">{item.explanation}</div>
        </div>
        <div className={`shrink-0 text-right font-medium ${impactColor}`}>
          Metric {item.metricValue}
        </div>
      </div>
      <div className={`text-right font-medium ${impactColor}`}>
        {impactPrefix}
        {item.contribution}
      </div>
    </div>
  );
}
