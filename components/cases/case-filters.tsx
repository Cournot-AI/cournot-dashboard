"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export type SourceFilter = "ALL" | "polymarket" | "myriad" | "kalshi" | "limitless";
export type MatchResultFilter = "ALL" | "match" | "invalid";

export interface FilterState {
  source: SourceFilter;
  matchResult: MatchResultFilter;
  needsAttention: boolean;
}

export const defaultFilters: FilterState = {
  source: "ALL",
  matchResult: "ALL",
  needsAttention: false,
};

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              value === opt.value
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CaseFilters({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card/50 px-4 py-3">
      <ChipGroup
        label="Source"
        value={filters.source}
        onChange={(v) => onChange({ ...filters, source: v })}
        options={[
          { value: "ALL", label: "All" },
          { value: "polymarket", label: "Polymarket" },
          { value: "myriad", label: "Myriad" },
          { value: "kalshi", label: "Kalshi" },
          { value: "limitless", label: "Limitless" },
        ]}
      />

      <div className="h-5 w-px bg-border hidden sm:block" />

      <ChipGroup
        label="Match"
        value={filters.matchResult}
        onChange={(v) => onChange({ ...filters, matchResult: v })}
        options={[
          { value: "ALL", label: "All" },
          { value: "match", label: "Match" },
          { value: "invalid", label: "Invalid" },
        ]}
      />

      <div className="h-5 w-px bg-border hidden sm:block" />

      <button
        onClick={() => onChange({ ...filters, needsAttention: !filters.needsAttention })}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
          filters.needsAttention
            ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
            : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <AlertTriangle className="h-3 w-3" />
        Needs Attention
      </button>
    </div>
  );
}
