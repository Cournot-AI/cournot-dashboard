"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerticalBadge } from "@/components/intelligence/vertical-card";
import { EventTypeBadge, ImpactBadge, ActiveBadge, DelayBadge } from "@/components/intelligence/badges";
import { PageLoading, PageError } from "@/components/intelligence/loading-error";
import { ConfidenceBar } from "@/components/shared/confidence-bar";
import { useRole } from "@/lib/role";
import {
  fetchCanonicalEvent,
  type CanonicalEventDetail,
  type EventImpact,
} from "@/lib/intelligence-api";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Eye,
  FileText,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function ImpactRow({ impact }: { impact: EventImpact }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-3 transition-colors hover:bg-accent/20">
      <div className="mt-0.5 shrink-0">
        <ImpactBadge direction={impact.direction} impactType={impact.impact_type} />
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/markets/${impact.market_id}`}
          className="text-sm font-medium hover:text-primary transition-colors line-clamp-1"
        >
          {impact.market_title || `Market #${impact.market_id}`}
        </Link>
        {impact.evidence_summary && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {impact.evidence_summary}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          {impact.confidence > 0 && (
            <div className="flex items-center gap-1.5">
              <span>Confidence:</span>
              <ConfidenceBar confidence={impact.confidence} size="sm" />
            </div>
          )}
          {impact.probability_delta !== 0 && (
            <span className={cn(
              "font-mono tabular-nums",
              impact.probability_delta > 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {impact.probability_delta > 0 ? "+" : ""}{(impact.probability_delta * 100).toFixed(1)}%
            </span>
          )}
          {impact.created_time && <span>{formatDate(impact.created_time)}</span>}
        </div>
      </div>
      <Link
        href={`/markets/${impact.market_id}`}
        className="shrink-0 mt-1"
      >
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-primary transition-colors" />
      </Link>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = Number(params.id);
  const { accessCode } = useRole();

  const [event, setEvent] = useState<CanonicalEventDetail | null>(null);
  const [impacts, setImpacts] = useState<EventImpact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromFeed, setFromFeed] = useState(false);

  // Try to hydrate from search params (passed from feed card)
  useEffect(() => {
    const feedData = searchParams.get("d");
    if (feedData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(feedData));
        setEvent({
          id: parsed.canonical_event_id ?? eventId,
          vertical: parsed.vertical ?? "",
          event_type: parsed.event_type ?? "",
          title: parsed.title ?? "",
          entities: parsed.entities ?? "[]",
          summary: parsed.summary ?? "",
          dedup_key: "",
          first_seen: parsed.first_seen ?? "",
          last_updated: parsed.last_updated ?? "",
          event_time: parsed.event_time ?? "",
          is_active: parsed.is_active ?? true,
          evidence_count: parsed.evidence_count ?? 0,
          metadata: "{}",
        });
        setFromFeed(true);
        setIsLoading(false);
      } catch {
        // fall through to API fetch
      }
    }
  }, [searchParams, eventId]);

  const loadData = useCallback(async () => {
    if (!eventId || fromFeed) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCanonicalEvent(eventId, accessCode || undefined);
      setEvent(data.canonical_event);
      setImpacts(data.impacts ?? []);
    } catch {
      // API may not have this event (public feed events use delayed IDs)
      // If we don't have feed data either, show not found
      if (!event) {
        setError("This event is not available via direct lookup. Navigate from the intelligence feed to view event details.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [eventId, accessCode, fromFeed, event]);

  useEffect(() => {
    if (!fromFeed) {
      loadData();
    }
  }, [loadData, fromFeed]);

  if (isLoading) return <PageLoading message="Loading event details..." />;
  if (error) return <PageError message={error} />;
  if (!event) return <PageError message="Event not found" />;

  const entities = (() => {
    try {
      const parsed = JSON.parse(event.entities);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const metadata = (() => {
    try {
      const parsed = JSON.parse(event.metadata);
      if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) return parsed;
      return null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/intelligence/feed"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back to feed
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <VerticalBadge vertical={event.vertical} />
          <EventTypeBadge eventType={event.event_type} />
          <ActiveBadge isActive={event.is_active} />
          <DelayBadge />
        </div>

        <h1 className="text-xl font-bold tracking-tight leading-snug">
          {event.title}
        </h1>

        {event.summary && event.summary !== event.title && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            {event.summary}
          </p>
        )}
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" /> First Seen
            </div>
            <p className="text-xs font-medium">{formatDate(event.first_seen)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" /> Last Updated
            </div>
            <p className="text-xs font-medium">{formatDate(event.last_updated)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Eye className="h-3 w-3" /> Evidence
            </div>
            <p className="text-xs font-medium">{event.evidence_count} items</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Layers className="h-3 w-3" /> Market Impacts
            </div>
            <p className="text-xs font-medium">{impacts.length} market{impacts.length !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
      </div>

      {/* Entities */}
      {entities.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Entities
          </h2>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(entities as string[]).map((e: string, i: number) => (
              <Badge key={i} variant="outline" className="text-[11px]">
                {e}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Metadata fields (if any) */}
      {metadata && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Event Metadata</h2>
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-xs">
                <span className="text-muted-foreground min-w-[120px] shrink-0 capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="font-medium break-all">
                  {typeof value === "string" ? value : JSON.stringify(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Impacted Markets */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">
          Impacted Markets ({impacts.length})
        </h2>
        {impacts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No market impacts recorded for this event.</p>
        ) : (
          <div className="space-y-2">
            {impacts.map((impact) => (
              <ImpactRow key={impact.id} impact={impact} />
            ))}
          </div>
        )}
      </div>

      {/* Premium notice */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-400/80">
        This event detail uses delayed public data. Premium subscribers see real-time impacts and evidence.{" "}
        <Link href="/intelligence/premium" className="underline hover:text-amber-300">
          Upgrade to premium
        </Link>
      </div>
    </div>
  );
}
