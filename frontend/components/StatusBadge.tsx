import { TrustLevel } from "@/lib/types";

type StatusBadgeProps = {
  level: TrustLevel;
};

const styleMap: Record<TrustLevel, string> = {
  HIGH: "bg-green-100 text-green-800 border-green-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
  LOW: "bg-red-100 text-red-800 border-red-300"
};

export default function StatusBadge({ level }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${styleMap[level]}`}
    >
      {level}
    </span>
  );
}
