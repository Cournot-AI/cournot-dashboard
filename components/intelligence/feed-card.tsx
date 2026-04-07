"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { VerticalBadge } from "./vertical-card";
import { EventTypeBadge, ImpactBadge, DelayBadge } from "./badges";
import type { FeedEvent } from "@/lib/intelligence-api";
import { ArrowRight } from "lucide-react";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function IntelligenceFeedCard({
  event,
  showDelay = true,
}: {
  event: FeedEvent;
  showDelay?: boolean;
}) {
  const entities = (() => {
    try {
      return JSON.parse(event.entities);
    } catch {
      return [];
    }
  })();

  return (
    <Link href={`/intelligence/events/${event.id}`}>
      <Card className="border-border/50 transition-all hover:border-primary/30 hover:bg-accent/20 cursor-pointer group">
        <CardContent className="pt-4 pb-3 px-4">
          {/* Top row: badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <VerticalBadge vertical={event.vertical} />
            <EventTypeBadge eventType={event.event_type} />
            {showDelay && <DelayBadge />}
          </div>

          {/* Title */}
          <h3 className="mt-2.5 text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {event.title}
          </h3>

          {/* Summary */}
          {event.summary && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {event.summary}
            </p>
          )}

          {/* Entities */}
          {entities.length > 0 && (
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              {(entities as string[]).slice(0, 4).map((e: string, i: number) => (
                <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {e}
                </span>
              ))}
              {entities.length > 4 && (
                <span className="text-[10px] text-muted-foreground">+{entities.length - 4}</span>
              )}
            </div>
          )}

          {/* Impact previews */}
          {event.top_impacts && event.top_impacts.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-border/50 pt-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Top impacted markets
              </p>
              {event.top_impacts.slice(0, 3).map((impact) => (
                <div key={impact.id} className="flex items-center gap-2 text-xs">
                  <ImpactBadge direction={impact.direction} />
                  <span className="truncate text-muted-foreground flex-1">
                    {impact.market_title || `Market #${impact.market_id}`}
                  </span>
                  {impact.confidence > 0 && (
                    <span className="text-[10px] font-mono text-muted-foreground/70 shrink-0">
                      {Math.round(impact.confidence * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Bottom: metadata */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>First seen {timeAgo(event.first_seen)}</span>
              {(event.evidence_count ?? 0) > 0 && (
                <span>{event.evidence_count} evidence</span>
              )}
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
