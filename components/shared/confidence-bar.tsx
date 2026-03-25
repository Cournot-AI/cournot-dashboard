import { cn } from "@/lib/utils";
import type { ConfidenceBreakdown } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Confidence uses blue/violet spectrum — NOT red/orange (reserved for failures)
function getColor(confidence: number): string {
  if (confidence >= 0.85) return "bg-emerald-500";
  if (confidence >= 0.65) return "bg-sky-500";
  return "bg-slate-400";
}

function getTextColor(confidence: number): string {
  if (confidence >= 0.85) return "text-emerald-400";
  if (confidence >= 0.65) return "text-sky-400";
  return "text-slate-400";
}

export function ConfidenceBar({
  confidence,
  showLabel = true,
  size = "sm",
  breakdown,
}: {
  confidence: number;
  showLabel?: boolean;
  size?: "sm" | "lg";
  breakdown?: ConfidenceBreakdown;
}) {
  const pct = Math.round(confidence * 100);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2", size === "lg" ? "w-full" : "w-24")}>
            <div className={cn("flex-1 rounded-full bg-muted overflow-hidden", size === "lg" ? "h-2.5" : "h-1.5")}>
              <div
                className={cn("h-full rounded-full transition-all duration-500", getColor(confidence))}
                style={{ width: `${pct}%` }}
              />
            </div>
            {showLabel && (
              <span className={cn("font-mono font-semibold tabular-nums", getTextColor(confidence), size === "lg" ? "text-sm" : "text-xs")}>
                {pct}%
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className={cn("max-w-[320px]", breakdown && "p-3")}>
          <p className="text-xs">
            Confidence: {pct}% —{" "}
            {confidence >= 0.85
              ? "High confidence"
              : confidence >= 0.65
              ? "Moderate confidence"
              : "Low confidence"}
          </p>
          {breakdown ? (
            <div className="mt-2 space-y-1 border-t border-border/50 pt-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Base</span>
                <span className="font-mono">{Math.round(breakdown.base * 100)}%</span>
              </div>
              {breakdown.adjustments.map((adj, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] gap-3">
                  <span className="text-muted-foreground truncate">{adj.reason}</span>
                  <span
                    className={cn(
                      "font-mono shrink-0",
                      adj.delta > 0 ? "text-emerald-400" : adj.delta < 0 ? "text-red-400" : "text-muted-foreground"
                    )}
                  >
                    {adj.delta > 0 ? "+" : ""}
                    {Math.round(adj.delta * 100)}%
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between text-[11px] font-medium border-t border-border/50 pt-1">
                <span>Final</span>
                <span className="font-mono">{Math.round(breakdown.final * 100)}%</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-1">
              Confidence reflects evidence quality; not correctness.
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ConfidenceBreakdownCard({
  breakdown,
}: {
  breakdown: ConfidenceBreakdown;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Confidence Breakdown
      </p>
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Base confidence</span>
          <span className="font-mono font-medium">{Math.round(breakdown.base * 100)}%</span>
        </div>
        {breakdown.adjustments.map((adj, i) => (
          <div key={i} className="flex items-center justify-between text-xs gap-4">
            <span className="text-muted-foreground/80 truncate">{adj.reason}</span>
            <span
              className={cn(
                "font-mono font-medium shrink-0",
                adj.delta > 0
                  ? "text-emerald-400"
                  : adj.delta < 0
                  ? "text-red-400"
                  : "text-muted-foreground"
              )}
            >
              {adj.delta > 0 ? "+" : ""}
              {Math.round(adj.delta * 100)}%
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between text-xs font-semibold border-t border-border/50 pt-1.5 mt-1.5">
          <span>Final confidence</span>
          <span className={cn("font-mono", getTextColor(breakdown.final))}>
            {Math.round(breakdown.final * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
