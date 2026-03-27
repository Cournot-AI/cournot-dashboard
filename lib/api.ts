import type { MarketCase, ParseResult, RunSummary, Outcome, SourceStatus, EvidenceItem, EvidenceBundle, ExecutionMode, DiscoveredSource } from "./types";

const API_BASE = "/api/proxy";

export interface ApiEvent {
  id: number; // internal auto-increment ID
  event_id: number;
  slug: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_closed: boolean;
  result: string;
  result_price: string;
  ai_prompt: string; // JSON string
  ai_result: string; // JSON string or empty
  source: string;
  match_result: string;
  proof_txn?: string;
}

export interface ApiEventsData {
  events: ApiEvent[];
  total: number;
}

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

function parseOutcome(result: string): Outcome {
  const trimmed = result?.trim?.() ?? "";
  if (trimmed === "") return "UNKNOWN";
  return trimmed.toUpperCase();
}

function parseSourceStatus(isClosed: boolean): SourceStatus {
  return isClosed ? "RESOLVED" : "OPEN";
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Map a raw evidence item (provenance-nested) to the flat EvidenceItem type */
function mapRawEvidenceItem(item: any): EvidenceItem {
  let parsedExcerpt = "";
  if (item.parsed_value != null) {
    parsedExcerpt = typeof item.parsed_value === "string"
      ? item.parsed_value.slice(0, 500)
      : JSON.stringify(item.parsed_value).slice(0, 500);
  } else if (item.extracted_fields) {
    const ef = item.extracted_fields;
    const parts: string[] = [];
    if (ef.reason) parts.push(ef.reason);
    else if (ef.resolution_status) parts.push(`Status: ${ef.resolution_status}`);
    if (ef.confidence_score != null) parts.push(`Confidence: ${(ef.confidence_score * 100).toFixed(0)}%`);
    parsedExcerpt = parts.join(" | ");
  }

  return {
    evidence_id: item.evidence_id ?? "",
    source_uri: item.provenance?.source_uri ?? item.source_uri ?? "",
    source_name: item.provenance?.source_id ?? item.source_name ?? "",
    tier: item.provenance?.tier ?? item.tier ?? 0,
    fetched_at: item.provenance?.fetched_at ?? item.fetched_at ?? "",
    content_hash: item.provenance?.content_hash ?? item.content_hash ?? "",
    parsed_excerpt: parsedExcerpt,
    status_code: item.status_code ?? 200,
    success: item.success,
    error: item.error,
    extracted_fields: item.extracted_fields ? {
      confidence_score: item.extracted_fields.confidence_score,
      resolution_status: item.extracted_fields.resolution_status,
      evidence_sources: (item.extracted_fields.evidence_sources ?? []).map((es: any) => ({
        source_id: es.source_id ?? null,
        url: es.url ?? "",
        domain_name: es.domain_name,
        credibility_tier: typeof es.credibility_tier === "number" ? es.credibility_tier : 3,
        key_fact: es.key_fact ?? "",
        supports: es.supports ?? "N/A",
        date_published: es.date_published ?? null,
      })),
      hypothesis_match: item.extracted_fields.hypothesis_match,
      discrepancies: item.extracted_fields.discrepancies,
      hypothetical_document: item.extracted_fields.hypothetical_document,
      conflicts: item.extracted_fields.conflicts,
      missing_info: item.extracted_fields.missing_info,
    } : undefined,
  };
}

/** Map raw evidence bundles to typed EvidenceBundle[] */
function mapRawBundles(bundles: any[]): EvidenceBundle[] {
  return bundles.map((b: any) => ({
    bundle_id: b.bundle_id ?? "",
    market_id: b.market_id ?? "",
    collector_name: b.collector_name ?? "unknown",
    weight: b.weight ?? 1.0,
    items: (b.items ?? []).map(mapRawEvidenceItem),
    execution_time_ms: b.execution_time_ms,
  }));
}

/** Transform API event to MarketCase */
export function transformEventToCase(event: ApiEvent): MarketCase {
  const now = new Date().toISOString();

  // Parse ai_prompt JSON
  let parseResult: ParseResult = {
    ok: false,
    prompt_spec: null,
    tool_plan: null,
    error: "No AI prompt data",
    metadata: {
      compiler: "unknown",
      strict_mode: false,
      question_type: "binary",
    },
  };

  if (event.ai_prompt) {
    try {
      const parsed = JSON.parse(event.ai_prompt);
      parseResult = {
        ok: parsed.ok ?? true,
        prompt_spec: parsed.prompt_spec ?? null,
        tool_plan: parsed.tool_plan ?? null,
        error: parsed.error ?? null,
        metadata: parsed.metadata ?? {
          compiler: "cournot-prompt-compiler",
          strict_mode: true,
          question_type: "binary",
        },
      };
    } catch {
      parseResult.error = "Failed to parse ai_prompt JSON";
    }
  }

  // Parse ai_result JSON (only if present and not empty)
  let oracleResult: RunSummary | null = null;

  if (event.ai_result && event.ai_result.trim() !== "") {
    try {
      const parsed = JSON.parse(event.ai_result);
      if (parsed.ok !== undefined) {
        const artifacts = parsed.artifacts ?? {};
        const verdict = artifacts.verdict ?? {};
        const verdictMeta = verdict.metadata ?? {};
        const reasoningTrace = artifacts.reasoning_trace ?? {};
        const porBundle = artifacts.por_bundle ?? {};
        const porMeta = porBundle.metadata ?? {};

        // Evidence bundles: top-level or inside artifacts
        const rawBundles: any[] = parsed.evidence_bundles ?? artifacts.evidence_bundles ?? [];
        const typedBundles = rawBundles.length > 0 ? mapRawBundles(rawBundles) : undefined;
        const allItems = rawBundles.length > 0
          ? rawBundles.flatMap((b: any) => (b.items ?? []).map(mapRawEvidenceItem))
          : parsed.evidence_items;

        // Reasoning steps: top-level or inside artifacts.reasoning_trace
        const reasoningSteps = parsed.reasoning_steps ?? reasoningTrace.steps;

        // Discovered sources from evidence items
        const discoveredSources: DiscoveredSource[] = parsed.discovered_sources ??
          rawBundles.flatMap((b: any) =>
            (b.items ?? []).flatMap((item: any) =>
              (item.extracted_fields?.discovered_sources ?? []).map((ds: any) => ({
                url: ds.url ?? "",
                title: ds.title ?? "",
                relevance: ds.relevance ?? "medium",
              }))
            )
          );

        const modeMap: Record<string, ExecutionMode> = {
          development: "dry_run", api: "live", live: "live", replay: "replay", dry_run: "dry_run",
        };

        oracleResult = {
          market_id: String(event.event_id),
          outcome: parseOutcome(parsed.outcome),
          confidence: parsed.confidence ?? 0,
          por_root: parsed.por_root ?? "",
          prompt_spec_hash: parsed.prompt_spec_hash ?? verdict.prompt_spec_hash ?? "",
          evidence_root: parsed.evidence_root ?? verdict.evidence_root ?? "",
          reasoning_root: parsed.reasoning_root ?? verdict.reasoning_root ?? "",
          ok: parsed.ok ?? true,
          verification_ok: parsed.verification_ok ?? verdictMeta.llm_review?.reasoning_valid ?? true,
          execution_mode: modeMap[parsed.execution_mode ?? porMeta.mode] ?? (parsed.execution_mode as ExecutionMode) ?? "dry_run",
          executed_at: parsed.executed_at ?? porBundle.created_at ?? now,
          duration_ms: parsed.duration_ms ?? rawBundles.reduce((sum: number, b: any) => sum + (b.execution_time_ms ?? 0), 0),
          checks: parsed.checks ?? [],
          errors: parsed.errors ?? [],
          evidence_summary: parsed.evidence_summary ?? reasoningTrace.evidence_summary,
          reasoning_summary: parsed.reasoning_summary ?? reasoningTrace.reasoning_summary,
          justification: parsed.justification ?? verdictMeta.justification,
          evidence_items: allItems?.length > 0 ? allItems : undefined,
          evidence_bundles: typedBundles,
          reasoning_steps: reasoningSteps?.length > 0 ? reasoningSteps : undefined,
          confidence_breakdown: parsed.confidence_breakdown,
          llm_review: parsed.llm_review ?? verdictMeta.llm_review
            ? {
                reasoning_valid: (parsed.llm_review ?? verdictMeta.llm_review).reasoning_valid ?? true,
                issues: (parsed.llm_review ?? verdictMeta.llm_review).reasoning_issues ?? [],
                confidence_adjustments: (parsed.llm_review ?? verdictMeta.llm_review).confidence_adjustments ?? [],
                final_justification: (parsed.llm_review ?? verdictMeta.llm_review).final_justification ?? "",
              }
            : undefined,
          execution_steps: parsed.execution_steps,
          discovered_sources: discoveredSources.length > 0 ? discoveredSources : undefined,
        };
      }
    } catch {
      // ai_result couldn't be parsed, leave as null (pending)
    }
  }

  // Determine official outcome
  const isClosed = event.is_closed;
  const officialOutcome: Outcome = isClosed ? parseOutcome(event.result) : "UNKNOWN";
  const officialResolvedAt = isClosed ? event.end_time : null;

  return {
    id: event.id,
    market_id: String(event.event_id),
    slug: event.slug,
    proof_txn: event.proof_txn || undefined,
    source: {
      platform: event.source || "unknown",
      event_url: `https://polymarket.com/event/${event.slug}`,
      title: event.title,
      question: event.description,
      resolution_deadline: event.end_time,
      resolution_window: {
        start: event.start_time,
        end: event.end_time,
      },
      status: parseSourceStatus(isClosed),
      official_outcome: officialOutcome,
      official_resolved_at: officialResolvedAt,
      last_updated_at: now,
    },
    parse_result: parseResult,
    oracle_result: oracleResult,
  };
}

/** Fetch events from the API */
export async function fetchEvents(
  pageNum: number = 1,
  pageSize: number = 20,
  filters?: { source?: string; match_result?: string }
): Promise<{ cases: MarketCase[]; total: number; pageNum: number; pageSize: number }> {
  const params = new URLSearchParams({
    page_num: String(pageNum),
    page_size: String(pageSize),
  });
  if (filters?.source) params.set("source", filters.source);
  if (filters?.match_result) params.set("match_result", filters.match_result);
  const url = `${API_BASE}/events?${params.toString()}`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.status} ${res.statusText}`);
  }

  const response: ApiResponse<ApiEventsData> = await res.json();

  if (response.code !== 0) {
    throw new Error(response.msg || "API error");
  }

  const cases = response.data.events.map(transformEventToCase);

  return {
    cases,
    total: response.data.total,
    pageNum,
    pageSize,
  };
}

// ─── Monitoring (Web Search Events) ──────────────────────────────────────────

export interface WebSearchResult {
  search_reasoning: string;
  search_is_closed: boolean;
  created_time: string;
}

export interface MonitoringEvent {
  event_id: string;
  slug: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_closed: boolean;
  result: string;
  result_price: string;
  ai_prompt: string;
  ai_result: string;
  source: string;
  match_result: string;
  id: number;
  web_search_results: WebSearchResult[];
}

export interface MonitoringEventsData {
  events: MonitoringEvent[];
  total: number;
}

/** Fetch monitoring events (web search scan results) */
export async function fetchMonitoringEvents(
  pageNum: number = 1,
  pageSize: number = 20
): Promise<{ events: MonitoringEvent[]; total: number; pageNum: number; pageSize: number }> {
  const params = new URLSearchParams({
    page_num: String(pageNum),
    page_size: String(pageSize),
  });
  const url = `${API_BASE}/web_search_events?${params.toString()}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch monitoring events: ${res.status} ${res.statusText}`);
  }

  const response: ApiResponse<MonitoringEventsData> = await res.json();

  if (response.code !== 0) {
    throw new Error(response.msg || "API error");
  }

  return {
    events: response.data.events,
    total: response.data.total,
    pageNum,
    pageSize,
  };
}

/** Fetch a single event by internal ID via POST /event */
export async function fetchEventById(eventId: string): Promise<MarketCase | null> {
  const numericId = Number(eventId);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return null;
  }

  const res = await fetch(`${API_BASE}/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: numericId }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch event: ${res.status} ${res.statusText}`);
  }

  const response: ApiResponse<{ events: ApiEvent[] }> = await res.json();

  if (response.code !== 0) {
    throw new Error(response.msg || "API error");
  }

  const events = response.data?.events ?? [];
  if (events.length === 0) {
    return null;
  }

  return transformEventToCase(events[0]);
}
