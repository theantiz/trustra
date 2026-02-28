"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
};

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  loading = false
}: SearchBarProps) {
  return (
    <div className="w-full rounded-xl border border-trust-border bg-white p-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter User ID"
          className="w-full rounded-lg border border-trust-border px-4 py-3 text-gray-900 outline-none transition focus:border-gray-400 sm:max-w-xs"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="rounded-lg border border-trust-border bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Check Trust
        </button>
      </div>
    </div>
  );
}
