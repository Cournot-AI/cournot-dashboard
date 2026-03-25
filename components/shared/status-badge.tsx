import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SourceStatus, Outcome, ExecutionMode, MatchStatus } from "@/lib/types";

// ─── Source Status Badge ─────────────────────────────────────────────────────

const sourceStatusStyles: Record<SourceStatus, string> = {
  OPEN: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  CLOSED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  RESOLVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  DISPUTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export function SourceStatusBadge({ status }: { status: SourceStatus }) {
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", sourceStatusStyles[status])}>
      {status}
    </Badge>
  );
}

// ─── Outcome Badge ──────────────────────────────────────────────────────────

const outcomeStyles: Record<string, string> = {
  YES: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  NO: "bg-red-500/10 text-red-400 border-red-500/20",
  INVALID: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  UNKNOWN: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const defaultOutcomeStyle = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";

export function OutcomeBadge({
  outcome,
  size = "sm",
}: {
  outcome: Outcome;
  size?: "sm" | "lg";
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold",
        outcomeStyles[outcome] ?? defaultOutcomeStyle,
        size === "lg" ? "text-sm px-3 py-1" : "text-[11px]"
      )}
    >
      {outcome}
    </Badge>
  );
}

// ─── Match Indicator ────────────────────────────────────────────────────────

const matchStyles: Record<MatchStatus, { label: string; className: string }> = {
  MATCH: {
    label: "MATCH",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  MISMATCH: {
    label: "MISMATCH",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  PENDING: {
    label: "PENDING",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
  VERIFICATION_FAILED: {
    label: "VERIFY FAILED",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

export function MatchIndicator({
  status,
  size = "sm",
}: {
  status: MatchStatus;
  size?: "sm" | "lg";
}) {
  const config = matchStyles[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-bold tracking-wide",
        config.className,
        size === "lg" ? "text-sm px-4 py-1.5" : "text-[11px]"
      )}
    >
      {config.label}
    </Badge>
  );
}

// ─── Verification Badge ─────────────────────────────────────────────────────

export function VerificationBadge({ ok }: { ok: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] font-medium",
        ok
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-red-500/10 text-red-400 border-red-500/20"
      )}
    >
      {ok ? "Verified" : "Failed"}
    </Badge>
  );
}

// ─── Execution Mode Badge ───────────────────────────────────────────────────

const execModeStyles: Record<ExecutionMode, string> = {
  live: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  replay: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  dry_run: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export function ExecutionModeBadge({ mode }: { mode: ExecutionMode }) {
  if (!mode) return null;
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", execModeStyles[mode])}>
      {mode === "dry_run" ? "DRY RUN" : mode.toUpperCase()}
    </Badge>
  );
}

// ─── Platform Badge ─────────────────────────────────────────────────────────

export function PlatformBadge({ platform }: { platform: string }) {
  return (
    <Badge variant="outline" className="text-[11px] font-medium bg-violet-500/10 text-violet-400 border-violet-500/20 capitalize">
      {platform}
    </Badge>
  );
}

// ─── Strict Mode Badge ─────────────────────────────────────────────────────

export function StrictModeBadge({ strict }: { strict: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-medium",
        strict
          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
      )}
    >
      {strict ? "STRICT" : "RELAXED"}
    </Badge>
  );
}
