"use client";

import { useState } from "react";
import type { ExecutionLog, ExecutionLogCall } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronDown,
  Terminal,
  Clock,
  AlertCircle,
} from "lucide-react";

const INITIAL_VISIBLE = 5;

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function getToolColor(tool: string): string {
  if (tool.includes("plan")) return "text-violet-400 border-violet-500/30 bg-violet-500/10";
  if (tool.includes("search")) return "text-sky-400 border-sky-500/30 bg-sky-500/10";
  if (tool.includes("fetch")) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
  if (tool.includes("assess")) return "text-teal-400 border-teal-500/30 bg-teal-500/10";
  if (tool.includes("synthesize")) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  return "text-muted-foreground border-border";
}

function CallRow({ call }: { call: ExecutionLogCall }) {
  const [expanded, setExpanded] = useState(false);
  const toolParts = call.tool.split(":");
  const toolName = toolParts.length > 1 ? toolParts[1] : call.tool;
  const toolPrefix = toolParts.length > 1 ? toolParts[0] : "";
  const duration = formatDuration(call.started_at, call.ended_at);
  const hasError = call.error !== null;

  // Build a short summary from input
  const inputSummary = Object.entries(call.input)
    .map(([k, v]) => {
      const val = typeof v === "string" ? v : JSON.stringify(v);
      const truncated = val.length > 60 ? val.slice(0, 57) + "..." : val;
      return `${k}: ${truncated}`;
    })
    .join(", ");

  return (
    <div className="border-b border-border/30 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
      >
        <Badge
          variant="outline"
          className={cn("text-[10px] font-mono shrink-0", getToolColor(call.tool))}
        >
          {toolName}
        </Badge>
        {toolPrefix && (
          <span className="text-[10px] text-muted-foreground/60 shrink-0">
            {toolPrefix}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground truncate flex-1 font-mono">
          {inputSummary}
        </span>
        {hasError && (
          <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
        )}
        <span className="text-[10px] text-muted-foreground/70 shrink-0 tabular-nums">
          {duration}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground/50 shrink-0 transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Input
              </p>
              <ScrollArea className="max-h-[200px]">
                <pre className="text-[11px] text-foreground/70 font-mono whitespace-pre-wrap bg-muted/30 rounded-md p-2 border border-border/30">
                  {JSON.stringify(call.input, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Output
              </p>
              <ScrollArea className="max-h-[200px]">
                <pre className="text-[11px] text-foreground/70 font-mono whitespace-pre-wrap bg-muted/30 rounded-md p-2 border border-border/30">
                  {JSON.stringify(call.output, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
          {hasError && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-2">
              <p className="text-[11px] text-red-400 font-mono">{call.error}</p>
            </div>
          )}
          <div className="flex gap-3 text-[10px] text-muted-foreground/60">
            <span>Started: {formatTime(call.started_at)}</span>
            <span>Ended: {formatTime(call.ended_at)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface ExecutionLogsCardProps {
  logs: ExecutionLog[];
}

export function ExecutionLogsCard({ logs }: ExecutionLogsCardProps) {
  const [showAll, setShowAll] = useState(false);

  if (logs.length === 0) return null;

  // Flatten all calls across all plans with plan context
  const allCalls = logs.flatMap((log) => log.calls);
  const totalCalls = allCalls.length;
  const visibleCalls = showAll ? allCalls : allCalls.slice(0, INITIAL_VISIBLE);
  const hiddenCount = totalCalls - INITIAL_VISIBLE;

  // Total duration across all logs
  const totalDuration = logs.reduce((acc, log) => {
    return acc + (new Date(log.ended_at).getTime() - new Date(log.started_at).getTime());
  }, 0);
  const totalDurationStr = totalDuration < 1000
    ? `${totalDuration}ms`
    : `${(totalDuration / 1000).toFixed(1)}s`;

  const errorCount = allCalls.filter((c) => c.error !== null).length;

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
        <Terminal className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold tracking-tight">Execution Logs</h3>
        <div className="flex items-center gap-2 ml-auto">
          {errorCount > 0 && (
            <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/20 bg-red-500/10">
              {errorCount} error{errorCount > 1 ? "s" : ""}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">
            {totalCalls} call{totalCalls !== 1 ? "s" : ""}
          </Badge>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {totalDurationStr}
          </div>
        </div>
      </div>

      {/* Calls list */}
      <div>
        {visibleCalls.map((call, idx) => (
          <CallRow key={idx} call={call} />
        ))}
      </div>

      {/* Show more / less */}
      {totalCalls > INITIAL_VISIBLE && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border/30 flex items-center justify-center gap-1"
        >
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              showAll && "rotate-180"
            )}
          />
          {showAll ? "Show less" : `Show ${hiddenCount} more call${hiddenCount !== 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
}
