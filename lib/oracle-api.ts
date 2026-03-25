/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EvidenceItem, EvidenceBundle, RunSummary, ExecutionMode, DiscoveredSource } from "@/lib/types";

// ─── Code-gated API helper ──────────────────────────────────────────────────

const LOCALHOST_MODE = process.env.NEXT_PUBLIC_ENABLE_PLAYGROUND_LOCALHOST_MODE === "true";

export class InvalidCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCodeError";
  }
}

/**
 * Localhost mode: call http://localhost:8000{path} directly with raw body/method.
 * Proxy mode: wrap in { code, post_data, path, method } and POST to /api/proxy/ai_data.
 */
export async function callApi(code: string, path: string, body: Record<string, any> = {}, method: "GET" | "POST" = "POST"): Promise<any> {
  if (LOCALHOST_MODE) {
    return callLocalhost(path, body, method);
  }
  return callProxy(code, path, body, method);
}

/** Direct call to localhost:8000 — no code wrapping, raw JSON response */
async function callLocalhost(path: string, body: Record<string, any>, method: "GET" | "POST"): Promise<any> {
  const url = `http://localhost:8000${path}`;
  const res = await fetch(url, {
    method,
    ...(method === "POST" && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}

/** Proxy call via /api/proxy/ai_data — wraps body in { code, post_data, path, method } */
async function callProxy(code: string, path: string, body: Record<string, any>, method: "GET" | "POST"): Promise<any> {
  const res = await fetch("/api/proxy/ai_data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      post_data: JSON.stringify(body),
      path,
      method,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  const json = await res.json();

  if (json.code === 4100) {
    throw new InvalidCodeError(json.msg || "Invalid access code");
  }

  if (json.code !== 0) {
    throw new Error(json.msg || "API error");
  }

  const resultStr = json.data?.result;
  if (typeof resultStr === "string") {
    try {
      return JSON.parse(resultStr);
    } catch {
      return resultStr;
    }
  }

  return json.data;
}

// ─── Evidence / RunSummary mapping helpers ──────────────────────────────────

/** Map evidence bundle items to EvidenceItem[] */
export function mapEvidenceItems(bundle: any): EvidenceItem[] {
  return (bundle?.items ?? []).map((item: any) => {
    let parsedExcerpt = "";
    if (item.parsed_value != null) {
      parsedExcerpt = typeof item.parsed_value === "string"
        ? item.parsed_value.slice(0, 500)
        : JSON.stringify(item.parsed_value).slice(0, 500);
    } else if (item.extracted_fields) {
      const ef = item.extracted_fields;
      const parts: string[] = [];
      if (ef.resolution_status) parts.push(`Status: ${ef.resolution_status}`);
      if (ef.confidence_score != null) parts.push(`Confidence: ${(ef.confidence_score * 100).toFixed(0)}%`);
      parsedExcerpt = parts.join(" | ");
    }

    return {
      evidence_id: item.evidence_id ?? "",
      source_uri: item.provenance?.source_uri ?? "",
      source_name: item.provenance?.source_id ?? "",
      tier: item.provenance?.tier ?? 0,
      fetched_at: item.provenance?.fetched_at ?? "",
      content_hash: item.provenance?.content_hash ?? "",
      parsed_excerpt: parsedExcerpt,
      status_code: item.status_code ?? 200,
      success: item.success,
      error: item.error,
      extracted_fields: item.extracted_fields ? {
        outcome: item.extracted_fields.outcome,
        reason: item.extracted_fields.reason,
        confidence_score: item.extracted_fields.confidence_score,
        resolution_status: item.extracted_fields.resolution_status,
        evidence_sources: (item.extracted_fields.evidence_sources ?? []).map((es: any) => ({
          source_id: es.source_id ?? null,
          url: es.url ?? es.uri ?? "",
          uri: es.uri ?? es.url ?? "",
          title: es.title ?? "",
          domain: es.domain ?? es.domain_name ?? "",
          domain_name: es.domain_name ?? es.domain ?? "",
          domain_match: es.domain_match ?? undefined,
          credibility_tier: typeof es.credibility_tier === "number" ? es.credibility_tier : 3,
          key_fact: es.key_fact ?? "",
          grounding_text: es.grounding_text ?? undefined,
          supports: es.supports ?? "N/A",
          date_published: es.date_published ?? null,
        })),
        hypothesis_match: item.extracted_fields.hypothesis_match,
        discrepancies: item.extracted_fields.discrepancies,
        hypothetical_document: item.extracted_fields.hypothetical_document,
        conflicts: item.extracted_fields.conflicts,
        missing_info: item.extracted_fields.missing_info,
        grounding_search_queries: item.extracted_fields.grounding_search_queries,
        grounding_source_count: item.extracted_fields.grounding_source_count,
        pass_used: item.extracted_fields.pass_used,
        data_source_domains_required: item.extracted_fields.data_source_domains_required,
      } : undefined,
    };
  });
}

/** Map raw evidence bundles to typed EvidenceBundle[] */
export function mapEvidenceBundles(bundles: any[]): EvidenceBundle[] {
  return bundles.map((bundle: any) => ({
    bundle_id: bundle.bundle_id ?? "",
    market_id: bundle.market_id ?? "",
    collector_name: bundle.collector_name ?? "unknown",
    weight: bundle.weight ?? 1.0,
    items: mapEvidenceItems(bundle),
    execution_time_ms: bundle.execution_time_ms,
  }));
}

/** Build RunSummary from individual step results (supports multiple bundles) */
export function buildRunSummary(
  evidenceBundles: any[],
  reasoningTrace: any,
  verdict: any,
  porBundle: any,
  outcome: string,
  confidence: number,
  porRoot: string
): RunSummary {
  const verdictMeta = verdict?.metadata ?? {};
  const porMeta = porBundle?.metadata ?? {};

  const modeMap: Record<string, ExecutionMode> = {
    development: "dry_run",
    live: "live",
    replay: "replay",
    dry_run: "dry_run",
  };

  const allEvidenceItems = evidenceBundles.flatMap(bundle => mapEvidenceItems(bundle));
  const typedBundles = mapEvidenceBundles(evidenceBundles);

  const discoveredSources: DiscoveredSource[] = evidenceBundles.flatMap(
    (bundle: any) =>
      (bundle?.items ?? []).flatMap((item: any) =>
        (item.extracted_fields?.discovered_sources ?? []).map((ds: any) => ({
          url: ds.url ?? "",
          title: ds.title ?? "",
          relevance: ds.relevance ?? "medium",
        }))
      )
  );

  const totalDurationMs = evidenceBundles.reduce(
    (sum, bundle) => sum + (bundle?.execution_time_ms ?? 0),
    0
  );

  return {
    market_id: verdict?.market_id ?? "",
    outcome: outcome as any ?? "UNKNOWN",
    confidence: confidence ?? 0,
    por_root: porRoot ?? "",
    prompt_spec_hash: verdict?.prompt_spec_hash ?? "",
    evidence_root: verdict?.evidence_root ?? "",
    reasoning_root: verdict?.reasoning_root ?? "",
    ok: true,
    verification_ok: verdictMeta.llm_review?.reasoning_valid ?? true,
    execution_mode: modeMap[porMeta.mode] ?? (porMeta.mode as ExecutionMode) ?? "dry_run",
    executed_at: porBundle?.created_at ?? new Date().toISOString(),
    duration_ms: totalDurationMs,
    checks: [],
    errors: [],
    evidence_summary: reasoningTrace?.evidence_summary,
    reasoning_summary: reasoningTrace?.reasoning_summary,
    justification: verdictMeta.justification,
    evidence_items: allEvidenceItems.length > 0 ? allEvidenceItems : undefined,
    evidence_bundles: typedBundles.length > 0 ? typedBundles : undefined,
    reasoning_steps: (reasoningTrace?.steps ?? []).length > 0 ? reasoningTrace.steps : undefined,
    llm_review: verdictMeta.llm_review
      ? {
          reasoning_valid: verdictMeta.llm_review.reasoning_valid ?? true,
          issues: verdictMeta.llm_review.reasoning_issues ?? [],
          confidence_adjustments: verdictMeta.llm_review.confidence_adjustments ?? [],
          final_justification: verdictMeta.llm_review.final_justification ?? "",
        }
      : undefined,
    discovered_sources: discoveredSources.length > 0 ? discoveredSources : undefined,
  };
}

/** Map the backend /step/resolve response to the RunSummary shape (for single-call mode) */
export function toRunSummary(raw: any): RunSummary {
  const artifacts = raw.artifacts ?? {};
  const evidenceBundles = artifacts.evidence_bundles ??
    (artifacts.evidence_bundle ? [artifacts.evidence_bundle] : []);

  return buildRunSummary(
    evidenceBundles,
    artifacts.reasoning_trace,
    artifacts.verdict,
    artifacts.por_bundle,
    raw.outcome,
    raw.confidence,
    raw.por_root
  );
}
