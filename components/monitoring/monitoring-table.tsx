"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MonitoringEvent, WebSearchResult } from "@/lib/api";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLatestScan(event: MonitoringEvent): WebSearchResult | null {
  if (!event.web_search_results || event.web_search_results.length === 0) return null;
  return [...event.web_search_results].sort(
    (a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
  )[0];
}

function getSortedScans(event: MonitoringEvent): WebSearchResult[] {
  if (!event.web_search_results) return [];
  return [...event.web_search_results].sort(
    (a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
  );
}

// ─── Scan History Panel ─────────────────────────────────────────────────────

function ScanHistoryPanel({ event }: { event: MonitoringEvent }) {
  const scans = getSortedScans(event);
  const latestTime = scans[0]?.created_time;

  if (scans.length === 0) {
    return (
      <div className="p-4 bg-muted/10 border-t border-border/50">
        <p className="text-xs text-muted-foreground">No scan history available.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/10 border-t border-border/50 space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
        Scan History ({scans.length} scan{scans.length !== 1 ? "s" : ""})
      </p>
      <div className="max-h-80 overflow-y-auto space-y-2">
        {scans.map((scan, idx) => {
          const isLatest = scan.created_time === latestTime;
          return (
            <div
              key={idx}
              className={cn(
                "rounded-lg border p-3 space-y-1.5",
                isLatest
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border/50 bg-background"
              )}
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    scan.search_is_closed
                      ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                      : "text-slate-400 border-slate-500/20 bg-slate-500/10"
                  )}
                >
                  {scan.search_is_closed ? "Resolved" : "Not Resolved"}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {formatTimestamp(scan.created_time)}
                </span>
                {isLatest && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 text-emerald-400 border-emerald-500/20"
                  >
                    Latest
                  </Badge>
                )}
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {scan.search_reasoning}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Monitoring Table ───────────────────────────────────────────────────────

interface MonitoringTableProps {
  events: MonitoringEvent[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    isLoading?: boolean;
  };
}

export function MonitoringTable({ events, pagination }: MonitoringTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalCols = 7;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </p>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">Status</TableHead>
                <TableHead className="max-w-[300px]">Market</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Time Range</TableHead>
                <TableHead>Agent Verdict</TableHead>
                <TableHead>Last Scanned</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const isExpanded = expandedId === event.event_id;
                const latestScan = getLatestScan(event);
                const isActive = !event.is_closed;

                return (
                  <>
                    <TableRow
                      key={event.event_id}
                      className="cursor-pointer group"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : event.event_id)
                      }
                    >
                      {/* Status dot */}
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <span
                            className={cn(
                              "inline-block h-2.5 w-2.5 rounded-full",
                              isActive
                                ? "bg-emerald-400 animate-pulse"
                                : "bg-slate-500"
                            )}
                          />
                        </div>
                      </TableCell>

                      {/* Market */}
                      <TableCell className="max-w-[300px]">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {event.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {event.description.length > 100
                              ? event.description.slice(0, 100) + "..."
                              : event.description}
                          </p>
                        </div>
                      </TableCell>

                      {/* Source */}
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {event.source}
                        </Badge>
                      </TableCell>

                      {/* Time Range */}
                      <TableCell>
                        <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                          <span>{new Date(event.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          <span className="mx-1">→</span>
                          <span>{new Date(event.end_time).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                      </TableCell>

                      {/* Agent Verdict */}
                      <TableCell>
                        {latestScan ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              latestScan.search_is_closed
                                ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                                : "text-slate-400 border-slate-500/20 bg-slate-500/10"
                            )}
                          >
                            {latestScan.search_is_closed ? "Resolved" : "Not Resolved"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Last Scanned */}
                      <TableCell>
                        {latestScan ? (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(latestScan.created_time)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Expand chevron */}
                      <TableCell>
                        <ChevronDown
                          className={cn(
                            "h-3 w-3 text-muted-foreground transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </TableCell>
                    </TableRow>

                    {/* Expanded: Scan History */}
                    {isExpanded && (
                      <TableRow
                        key={`${event.event_id}-expand`}
                        className="hover:bg-transparent"
                      >
                        <TableCell colSpan={totalCols} className="p-0">
                          <ScanHistoryPanel event={event} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {events.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={totalCols}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No monitoring events found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page:</span>
          <select
            value={pagination.pageSize}
            onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
            disabled={pagination.isLoading}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          {pagination.isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize) || 1}
            <span className="ml-2 text-xs">({pagination.total} total)</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || pagination.isLoading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize) || pagination.isLoading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
