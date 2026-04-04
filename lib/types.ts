// ─── Source / Official Market ────────────────────────────────────────────────

export type SourceStatus =
  | "OPEN"
  | "CLOSED"
  | "RESOLVED"
  | "CANCELLED"
  | "DISPUTED";

export type Outcome = string;

export interface SourceInfo {
  platform: string;
  event_url: string;
  title: string;
  question: string;
  resolution_deadline: string;
  resolution_window: { start: string; end: string };
  status: SourceStatus;
  official_outcome: Outcome;
  official_resolved_at: string | null;
  last_updated_at: string;
}

// ─── Parse Result / PromptSpec / ToolPlan ────────────────────────────────────

export interface ParseMetadata {
  compiler: string;
  strict_mode: boolean;
  question_type: string;
}

export interface ResolutionRule {
  rule_id: string;
  description: string;
  priority: number;
}

export interface DisputePolicy {
  dispute_window_seconds: number;
  allow_challenges: boolean;
}

export interface SourceTarget {
  uri: string;
  provider: string;
}

export interface DataRequirement {
  requirement_id: string;
  description: string;
  source_targets: SourceTarget[];
  expected_fields: string[];
  selection_policy: {
    strategy: string;
    quorum: number;
  };
  deferred_source_discovery?: boolean;
}

export interface MarketSpec {
  question: string;
  event_definition: string;
  timezone: string;
  resolution_deadline: string;
  resolution_window: { start: string; end: string };
  resolution_rules: ResolutionRule[];
  allowed_sources: string[];
  min_provenance_tier: number;
  dispute_policy: DisputePolicy;
  metadata: Record<string, unknown>;
}

export interface PromptSpec {
  schema_version: string;
  task_type: string;
  market: MarketSpec;
  prediction_semantics: string;
  data_requirements: DataRequirement[];
  output_schema_ref: string;
  forbidden_behaviors: string[];
  created_at: string | null;
  tool_plan: string | null; // reference id
  extra: Record<string, unknown>;
}

export interface ToolPlanSource {
  source_id: string;
  provider: string;
  endpoint: string;
  tier: number;
}

export interface ToolPlan {
  plan_id: string;
  requirements: string[];
  sources: ToolPlanSource[];
  min_provenance_tier: number;
  allow_fallbacks: boolean;
  extra: Record<string, unknown>;
}

export interface ParseResult {
  ok: boolean;
  prompt_spec: PromptSpec | null;
  tool_plan: ToolPlan | null;
  error: string | null;
  metadata: ParseMetadata;
}

// ─── Oracle Run Summary ─────────────────────────────────────────────────────

export type ExecutionMode = "live" | "replay" | "dry_run";

export interface Check {
  check_id: string;
  name: string;
  status: "pass" | "fail" | "warn" | "skip";
  message: string;
  requirement_id?: string;
}

export interface EvidenceSource {
  source_id: string | null;
  url: string;
  uri?: string;
  title?: string;
  domain?: string;
  domain_name?: string;
  domain_match?: boolean;
  credibility_tier: number;
  key_fact: string;
  grounding_text?: string;
  supports: "YES" | "NO" | "N/A";
  date_published: string | null;
}

export interface ExtractedFields {
  outcome?: "Yes" | "No" | "Unresolved";
  reason?: string;
  confidence_score?: number;
  resolution_status?: "RESOLVED" | "UNRESOLVED" | string;
  evidence_sources?: EvidenceSource[];
  // Collector-specific extras
  hypothesis_match?: string;
  discrepancies?: string[];
  hypothetical_document?: string;
  conflicts?: string[];
  missing_info?: string[];
  grounding_search_queries?: string[];
  grounding_source_count?: number;
  pass_used?: string;
  data_source_domains_required?: string[];
}

export interface EvidenceItem {
  evidence_id: string;
  source_uri: string;
  source_name: string;
  tier: number;
  fetched_at: string;
  content_hash: string;
  parsed_excerpt: string;
  status_code: number;
  success?: boolean;
  error?: string | null;
  extracted_fields?: ExtractedFields;
}

export interface EvidenceBundle {
  bundle_id: string;
  market_id: string;
  collector_name: string;
  weight: number;
  items: EvidenceItem[];
  execution_time_ms?: number;
}

export type ReasoningStepType =
  | "validity_check"
  | "evidence_analysis"
  | "rule_application"
  | "confidence_assessment";

export interface ReasoningStep {
  step_id: string;
  step_type: ReasoningStepType;
  description: string;
  conclusion: string;
  confidence_delta: number;
  depends_on: string[];
}

export interface ConfidenceAdjustment {
  reason: string;
  delta: number;
}

export interface ConfidenceBreakdown {
  base: number;
  adjustments: ConfidenceAdjustment[];
  final: number;
}

export interface LLMReview {
  reasoning_valid: boolean;
  issues: string[];
  confidence_adjustments: ConfidenceAdjustment[];
  final_justification: string;
}

export interface ExecutionStep {
  tool: string;
  uri: string;
  started_at: string;
  ended_at: string;
  success: boolean;
  latency_ms: number;
}

export interface ExecutionLogCall {
  tool: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  started_at: string;
  ended_at: string;
  error: string | null;
}

export interface ExecutionLog {
  plan_id: string;
  calls: ExecutionLogCall[];
  started_at: string;
  ended_at: string;
}

export interface DiscoveredSource {
  url: string;
  title: string;
  relevance: "high" | "medium" | "low";
}

export interface RunSummary {
  market_id: string;
  outcome: Outcome;
  confidence: number;
  por_root: string;
  prompt_spec_hash: string;
  evidence_root: string;
  reasoning_root: string;
  ok: boolean;
  verification_ok: boolean;
  execution_mode: ExecutionMode;
  executed_at: string;
  duration_ms: number;
  checks: Check[];
  errors: string[];
  // Extended fields
  evidence_summary?: string;
  reasoning_summary?: string;
  justification?: string;
  evidence_items?: EvidenceItem[];
  evidence_bundles?: EvidenceBundle[];
  reasoning_steps?: ReasoningStep[];
  confidence_breakdown?: ConfidenceBreakdown;
  llm_review?: LLMReview;
  execution_steps?: ExecutionStep[];
  discovered_sources?: DiscoveredSource[];
}

// ─── Temporal Constraint ─────────────────────────────────────────────────────

export interface TemporalConstraint {
  enabled: true;
  event_time: string;   // ISO 8601 UTC
  reason: string;
}

// ─── Quality Check ──────────────────────────────────────────────────────────

export interface QualityRetryHints {
  search_queries?: string[];
  required_domains?: string[];
  skip_domains?: string[];
  data_type_hint?: string | null;
  focus_requirements?: string[];
  collector_guidance?: string;
}

export interface QualityScorecard {
  source_match: "FULL" | "PARTIAL" | "NONE";
  data_type_match: boolean;
  collector_agreement: "AGREE" | "DISAGREE" | "SINGLE";
  requirements_coverage: number;
  quality_level: "HIGH" | "MEDIUM" | "LOW";
  quality_flags: string[];
  meets_threshold: boolean;
  recommendations: string[];
  retry_hints: QualityRetryHints;
}

export interface QualityCheckResponse {
  ok: boolean;
  scorecard: QualityScorecard | null;
  meets_threshold: boolean;
  errors: string[];
}

// ─── Market Case (merged view) ──────────────────────────────────────────────

export type MatchStatus =
  | "MATCH"
  | "MISMATCH"
  | "PENDING"
  | "VERIFICATION_FAILED";

export interface MarketCase {
  id: number; // internal auto-increment ID for direct lookup
  market_id: string;
  slug: string;
  proof_txn?: string;
  source: SourceInfo;
  parse_result: ParseResult;
  oracle_result: RunSummary | null;
}

// ─── Derived helpers ────────────────────────────────────────────────────────

export function getMatchStatus(c: MarketCase): MatchStatus {
  if (c.oracle_result && !c.oracle_result.verification_ok) {
    return "VERIFICATION_FAILED";
  }
  if (
    !c.oracle_result ||
    c.source.official_outcome === "UNKNOWN" ||
    c.oracle_result.outcome === "UNKNOWN"
  ) {
    return "PENDING";
  }
  return c.source.official_outcome === c.oracle_result.outcome
    ? "MATCH"
    : "MISMATCH";
}

// ─── Admin Market Monitoring ───────────────────────────────────────────────

export type AdminMarketStatus = "monitoring" | "pending_verification" | "resolved" | "conflict" | "closed";

export interface AdminMarket {
  id: number;
  title: string;
  description: string;
  platform_url: string;
  start_time: string;
  end_time: string;
  user_id: string;
  created_time: string;
  updated_time: string;
  ai_prompt: string;
  ai_prompt_time: string;
  resolve_time: string;
  ai_result: string;
  ai_outcome: string;
  ai_result_time: string;
  resolve_reasoning: string;
  status: AdminMarketStatus;
  expected_resolve_time: string;
  source: string;
  market_timing_type: string;
  silence_deadline: string;
  proof_txn?: string;
}

export interface MarketExternalData {
  id: number;
  source_name: string;
  external_id: string;
  title: string;
  entities: string; // JSON array as string
  data: string; // JSON object as string
  event_time: string;
  fetched_time: string;
  event_concluded: boolean;
  relevance_score: number;
  match_type: string;
}

export interface MarketClassification {
  market_id: number;
  category: string;
  subcategory: string;
  entity_roles: string; // JSON object as string
}

export interface MarketReview {
  id: number;
  market_id: number;
  ai_result: string;
  ai_outcome: string;
  user_id: string;
  name: string;
  created_time: string;
}

export interface MarketInfo {
  market: AdminMarket;
  external_data: MarketExternalData[];
  classification: MarketClassification | null;
  reviews: MarketReview[];
}

// ─── Disputes ────────────────────────────────────────────────────────────────

export interface Dispute {
  id: number;
  market_id: number;
  dispute_type: "manual";
  previous_ai_result: string;
  previous_ai_outcome: string;
  proposed_ai_result: string;
  proposed_ai_outcome: string;
  reason: string;
  submitted_by: string;
  is_accepted: boolean;
  accepted_by: string;
  accepted_time: string;
  created_time: string;
}

export interface DisputeListResponse {
  disputes: Dispute[];
  total: number;
}

export interface DisputeSubmitResponse {
  dispute: Dispute;
  market: AdminMarket;
}

export interface DisputeAcceptResponse {
  dispute: Dispute;
  market: AdminMarket;
}
