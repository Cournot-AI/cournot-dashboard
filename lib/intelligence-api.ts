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

// ─── Public types (matching actual API responses) ────────────────────────────

export interface OverviewVertical {
  vertical: string;
  market_count: number;
  event_count: number;
  impact_count: number;
}

export interface OverviewData {
  total_markets: number;
  total_canonical_events: number;
  total_impacts: number;
  total_verticals: number;
  verticals: OverviewVertical[];
}

// Feed impact preview — matches actual top_impacts items
export interface FeedImpactPreview {
  market_id: number;
  market_title?: string;
  impact_type: string;
  direction: string;
  confidence: number;
}

// Feed event — matches actual items in /public/feed
export interface FeedEvent {
  canonical_event_id: number;
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
  impacted_markets_count: number;
  top_impacts: FeedImpactPreview[] | null;
}

// Raw feed response — data.items + data.total
interface RawFeedData {
  items: FeedEvent[];
  total: number;
  public_delay_minutes?: number;
}

export interface FeedData {
  events: FeedEvent[];
  total: number;
}

// Vertical info — matches actual /public/verticals response
export interface VerticalInfo {
  vertical: string;
  display_name: string;
  enabled: boolean;
  sources: string;
  markets_count: number;
  events_count: number;
  description: string;
}

export interface VerticalsData {
  verticals: VerticalInfo[];
}

// Catalog entity — matches actual /public/catalog items
export interface CatalogEntity {
  vertical: string;
  entity_type: string;
  entity_name: string;
  source_name: string;
  event_count: number;
}

// Raw catalog response — data.items + data.total
interface RawCatalogData {
  items: CatalogEntity[];
  total: number;
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
  const raw = await publicFetch<RawFeedData>("public/feed", qs);
  return { events: raw.items ?? [], total: raw.total ?? 0 };
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
  const raw = await publicFetch<RawFeedData>("public/verticals/feed", qs);
  return { events: raw.items ?? [], total: raw.total ?? 0 };
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
  const raw = await publicFetch<RawCatalogData>("public/catalog", qs);
  return { entities: raw.items ?? [], total: raw.total ?? 0 };
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
