import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketCase } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  label: string;
  timestamp: string | null;
  category: "source" | "oracle";
  status: "completed" | "pending" | "error";
}

function formatShort(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusDot: Record<TimelineEvent["status"], string> = {
  completed: "bg-emerald-500",
  pending: "bg-slate-500",
  error: "bg-red-500",
};

const categoryColor: Record<TimelineEvent["category"], string> = {
  source: "text-violet-400",
  oracle: "text-blue-400",
};

export function TimelineSection({ c }: { c: MarketCase }) {
  const events: TimelineEvent[] = [
    {
      label: "Market created",
      timestamp: c.source.last_updated_at,
      category: "source",
      status: "completed",
    },
    {
      label: "Resolution window start",
      timestamp: c.source.resolution_window.start,
      category: "source",
      status:
        new Date(c.source.resolution_window.start) <= new Date()
          ? "completed"
          : "pending",
    },
    {
      label: "Resolution deadline",
      timestamp: c.source.resolution_deadline,
      category: "source",
      status:
        new Date(c.source.resolution_deadline) <= new Date()
          ? "completed"
          : "pending",
    },
    {
      label: "Official resolution",
      timestamp: c.source.official_resolved_at,
      category: "source",
      status: c.source.official_resolved_at ? "completed" : "pending",
    },
    {
      label: "Resolution window end",
      timestamp: c.source.resolution_window.end,
      category: "source",
      status:
        new Date(c.source.resolution_window.end) <= new Date()
          ? "completed"
          : "pending",
    },
  ];

  if (c.oracle_result) {
    events.push({
      label: "Oracle executed",
      timestamp: c.oracle_result.executed_at,
      category: "oracle",
      status: c.oracle_result.ok ? "completed" : "error",
    });
  }

  // Sort by timestamp
  events.sort((a, b) => {
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {events.map((event, i) => (
            <div key={i} className="flex gap-3">
              {/* Line + dot */}
              <div className="flex flex-col items-center">
                <div className={cn("h-2.5 w-2.5 rounded-full mt-1 shrink-0", statusDot[event.status])} />
                {i < events.length - 1 && (
                  <div className="w-px flex-1 bg-border min-h-[24px]" />
                )}
              </div>
              {/* Content */}
              <div className="pb-4 min-w-0">
                <p className={cn("text-xs font-medium", categoryColor[event.category])}>
                  {event.label}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {formatShort(event.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex gap-4 mt-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            Source events
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Oracle events
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
