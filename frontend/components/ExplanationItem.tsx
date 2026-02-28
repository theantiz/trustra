import { Explanation } from "@/lib/types";

type ExplanationItemProps = {
  item: Explanation;
};

export default function ExplanationItem({ item }: ExplanationItemProps) {
  const impactColor = item.impact >= 0 ? "text-green-700" : "text-red-700";
  const impactPrefix = item.impact >= 0 ? "+" : "";

  return (
    <div className="grid grid-cols-3 gap-3 border-b border-trust-border py-3 text-sm last:border-b-0">
      <div className="text-left text-trust-muted">{item.label}</div>
      <div className="text-center text-gray-900">{item.value}</div>
      <div className={`text-right font-medium ${impactColor}`}>
        {impactPrefix}
        {item.impact}
      </div>
    </div>
  );
}
