/**
 * Intelligence / Discovery API client
 *
 * Public endpoints are prefixed with /public/ and require no auth.
 * Premium endpoints require a `code` query parameter.
 * All responses use the standard { code, msg, data } envelope.
 */

const API_BASE = "/api/proxy";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Response envelope ───────────────────────────────────────────────────────

interface Envelope<T> {
  code: number;
  msg: string;
  data: T;
}

async function publicFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params);
  const url = `${API_BASE}/${path}${qs.toString() ? `?${qs}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: Envelope<T> = await res.json();
  if (json.code !== 0) throw new Error(json.msg || "API error");
  return json.data;
}

async function premiumFetch<T>(path: string, code: string, params?: Record<string, string>): Promise<T> {
  const merged = { ...params, code };
  return publicFetch<T>(path, merged);
}

// ─── Public types ────────────────────────────────────────────────────────────

export interface OverviewVertical {
  vertical: string;
  market_count: number;
  event_count: number;
  impact_count: number;
}

export interface OverviewData {
  total_markets: number;
  total_events: number;
  total_impacts: number;
  total_verticals: number;
  verticals: OverviewVertical[];
}

export interface FeedImpactPreview {
  id: number;
  market_id: number;
  market_title?: string;
  impact_type: string;
  direction: string;
  probability_delta: number;
  confidence: number;
  evidence_summary: string;
  created_time: string;
}

export interface FeedEvent {
  id: number;
  vertical: string;
  event_type: string;
  title: string;
  summary: string;
  entities: string;
  first_seen: string;
  last_updated: string;
  event_time: string;
  is_active: boolean;
  evidence_count: number;
  metadata: string;
  top_impacts: FeedImpactPreview[];
}

export interface FeedData {
  events: FeedEvent[];
  total: number;
}

export interface VerticalInfo {
  vertical: string;
  market_count: number;
  event_count: number;
  impact_count: number;
}

export interface VerticalsData {
  verticals: VerticalInfo[];
}

export interface CatalogEntity {
  id: number;
  entity: string;
  entity_type: string;
  vertical: string;
  event_count: number;
  first_seen: string;
  last_seen: string;
  metadata?: string;
}

export interface CatalogData {
  entities: CatalogEntity[];
  total: number;
}

export interface PublicMarket {
  id: number;
  title: string;
  description: string;
  platform_url: string;
  source: string;
  status: string;
  vertical: string;
  impact_count: number;
  start_time: string;
  end_time: string;
  created_time: string;
}

export interface PublicMarketsData {
  markets: PublicMarket[];
  total: number;
}

// Canonical event detail
export interface CanonicalEventDetail {
  id: number;
  vertical: string;
  event_type: string;
  title: string;
  entities: string;
  summary: string;
  dedup_key: string;
  first_seen: string;
  last_updated: string;
  event_time: string;
  is_active: boolean;
  evidence_count: number;
  metadata: string;
}

export interface EventImpact {
  id: number;
  market_id: number;
  market_title?: string;
  canonical_event_id: number;
  impact_type: string;
  direction: string;
  probability_delta: number;
  confidence: number;
  evidence_summary: string;
  created_time: string;
}

export interface CanonicalEventData {
  canonical_event: CanonicalEventDetail;
  impacts: EventImpact[];
}

// Premium types
export interface PremiumImpact {
  id: number;
  market_id: number;
  market_title?: string;
  canonical_event_id: number;
  canonical_event_title?: string;
  impact_type: string;
  direction: string;
  probability_delta: number;
  confidence: number;
  evidence_summary: string;
  created_time: string;
  vertical?: string;
}

export interface PremiumImpactsData {
  impacts: PremiumImpact[];
  total: number;
}

export interface SourceFreshness {
  source_name: string;
  vertical: string;
  last_fetched: string;
  event_count: number;
  status: string;
}

export interface SourcesData {
  sources: SourceFreshness[];
}

// ─── Public API functions ────────────────────────────────────────────────────

export async function fetchOverview(): Promise<OverviewData> {
  return publicFetch<OverviewData>("public/overview");
}

export async function fetchFeed(params: {
  page_num?: number;
  page_size?: number;
  vertical?: string;
  event_type?: string;
}): Promise<FeedData> {
  const qs: Record<string, string> = {
    page_num: String(params.page_num ?? 1),
    page_size: String(params.page_size ?? 20),
  };
  if (params.vertical) qs.vertical = params.vertical;
  if (params.event_type) qs.event_type = params.event_type;
  return publicFetch<FeedData>("public/feed", qs);
}

export async function fetchVerticals(): Promise<VerticalsData> {
  return publicFetch<VerticalsData>("public/verticals");
}

export async function fetchVerticalFeed(params: {
  vertical: string;
  page_num?: number;
  page_size?: number;
  event_type?: string;
}): Promise<FeedData> {
  const qs: Record<string, string> = {
    vertical: params.vertical,
    page_num: String(params.page_num ?? 1),
    page_size: String(params.page_size ?? 20),
  };
  if (params.event_type) qs.event_type = params.event_type;
  return publicFetch<FeedData>("public/verticals/feed", qs);
}

export async function fetchCatalog(params: {
  page_num?: number;
  page_size?: number;
  vertical?: string;
}): Promise<CatalogData> {
  const qs: Record<string, string> = {
    page_num: String(params.page_num ?? 1),
    page_size: String(params.page_size ?? 20),
  };
  if (params.vertical) qs.vertical = params.vertical;
  return publicFetch<CatalogData>("public/catalog", qs);
}

export async function fetchPublicMarkets(params: {
  page_num?: number;
  page_size?: number;
  sort?: string;
  order?: string;
  status?: string;
  source?: string;
  vertical?: string;
  search?: string;
}): Promise<PublicMarketsData> {
  const qs: Record<string, string> = {
    page_num: String(params.page_num ?? 1),
    page_size: String(params.page_size ?? 20),
  };
  if (params.sort) qs.sort = params.sort;
  if (params.order) qs.order = params.order;
  if (params.status) qs.status = params.status;
  if (params.source) qs.source = params.source;
  if (params.vertical) qs.vertical = params.vertical;
  if (params.search) qs.search = params.search;
  return publicFetch<PublicMarketsData>("public/markets", qs);
}

export async function fetchCanonicalEvent(id: number, code?: string): Promise<CanonicalEventData> {
  const qs: Record<string, string> = { id: String(id) };
  if (code) qs.code = code;
  return publicFetch<CanonicalEventData>("canonical_events/id", qs);
}

// ─── Premium API functions ───────────────────────────────────────────────────

export async function fetchPremiumImpacts(code: string, params: {
  page_num?: number;
  page_size?: number;
  vertical?: string;
  impact_type?: string;
  direction?: string;
  market_id?: string;
  canonical_event_id?: string;
}): Promise<PremiumImpactsData> {
  const qs: Record<string, string> = {
    page_num: String(params.page_num ?? 1),
    page_size: String(params.page_size ?? 20),
  };
  if (params.vertical) qs.vertical = params.vertical;
  if (params.impact_type) qs.impact_type = params.impact_type;
  if (params.direction) qs.direction = params.direction;
  if (params.market_id) qs.market_id = params.market_id;
  if (params.canonical_event_id) qs.canonical_event_id = params.canonical_event_id;
  return premiumFetch<PremiumImpactsData>("impacts", code, qs);
}

export async function fetchSources(code: string, vertical?: string): Promise<SourcesData> {
  const qs: Record<string, string> = {};
  if (vertical) qs.vertical = vertical;
  return premiumFetch<SourcesData>("sources", code, qs);
}
