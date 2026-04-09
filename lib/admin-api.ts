import type {
  AdminMarket,
  AdminMarketStatus,
  MarketClassification,
  MarketExternalData,
  MarketImpact,
  MarketInfo,
  MarketReview,
  DisputeListResponse,
  DisputeSubmitResponse,
  DisputeAcceptResponse,
} from "@/lib/types";
import { toast } from "sonner";

const API_BASE = "/api/proxy";

interface ListMarketsResponse {
  markets: AdminMarket[];
  total: number;
}

class AdminApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      if (json.msg) msg = json.msg;
      else if (json.detail) msg = json.detail;
    } catch { /* ignore */ }
    toast.error(msg);
    throw new AdminApiError(msg);
  }
  const json = await res.json();
  // Backend error envelope: { code: 4100, msg: "invalid code" }
  if (json.code && json.code !== 0) {
    const errMsg = json.msg || json.detail || "API error";
    toast.error(errMsg);
    throw new AdminApiError(errMsg);
  }
  // Backend success envelope: { code: 0, msg: "Success", data: {...} }
  if (json.data !== undefined) {
    return json.data as T;
  }
  return json as T;
}

/** Like adminFetch but returns the full envelope so callers can access fields outside `data`. */
async function adminFetchRaw(url: string, options?: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      if (json.msg) msg = json.msg;
      else if (json.detail) msg = json.detail;
    } catch { /* ignore */ }
    toast.error(msg);
    throw new AdminApiError(msg);
  }
  const json = await res.json();
  if (json.code && json.code !== 0) {
    const errMsg = json.msg || json.detail || "API error";
    toast.error(errMsg);
    throw new AdminApiError(errMsg);
  }
  return json;
}

export async function checkIsAdmin(code: string): Promise<boolean> {
  const json = await adminFetch<{ is_admin: boolean }>(
    `${API_BASE}/markets/is_admin`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }
  );
  return json.is_admin;
}

export async function fetchMarketsPublic(
  params: {
    page_num?: number;
    page_size?: number;
    sort?: string;
    order?: "asc" | "desc";
    status?: AdminMarketStatus;
    source?: string;
    market_timing_type?: string;
  } = {}
): Promise<ListMarketsResponse> {
  const qs = new URLSearchParams();
  qs.set("page_num", String(params.page_num ?? 1));
  qs.set("page_size", String(params.page_size ?? 20));
  if (params.sort) qs.set("sort", params.sort);
  if (params.order) qs.set("order", params.order);
  if (params.status) qs.set("status", params.status);
  if (params.source) qs.set("source", params.source);
  if (params.market_timing_type) qs.set("market_timing_type", params.market_timing_type);
  const data = await adminFetch<ListMarketsResponse>(
    `${API_BASE}/markets/list?${qs.toString()}`
  );
  return { markets: data.markets ?? [], total: data.total ?? 0 };
}

export async function fetchMarkets(
  code: string,
  params: {
    page_num?: number;
    page_size?: number;
    sort?: string;
    order?: "asc" | "desc";
    status?: AdminMarketStatus;
    source?: string;
    market_timing_type?: string;
  } = {}
): Promise<ListMarketsResponse> {
  const qs = new URLSearchParams();
  qs.set("code", code);
  qs.set("page_num", String(params.page_num ?? 1));
  qs.set("page_size", String(params.page_size ?? 20));
  if (params.sort) qs.set("sort", params.sort);
  if (params.order) qs.set("order", params.order);
  if (params.status) qs.set("status", params.status);
  if (params.source) qs.set("source", params.source);
  if (params.market_timing_type) qs.set("market_timing_type", params.market_timing_type);
  const data = await adminFetch<ListMarketsResponse>(
    `${API_BASE}/markets/list?${qs.toString()}`
  );
  return { markets: data.markets ?? [], total: data.total ?? 0 };
}

function extractMarketInfo(raw: Record<string, unknown>): MarketInfo | null {
  const data = (raw.data ?? raw) as Record<string, unknown>;
  if (!data.market) return null;
  // impacts may live inside data or at the envelope level
  const impacts = (data.impacts ?? raw.impacts ?? []) as MarketImpact[];
  return {
    market: data.market as AdminMarket,
    external_data: (data.external_data ?? []) as MarketExternalData[],
    classification: (data.classification ?? null) as MarketClassification | null,
    reviews: (data.reviews ?? []) as MarketReview[],
    impacts,
  };
}

export async function fetchMarket(
  code: string,
  id: number
): Promise<MarketInfo | null> {
  const qs = new URLSearchParams();
  qs.set("code", code);
  qs.set("id", String(id));
  const raw = await adminFetchRaw(
    `${API_BASE}/markets/id?${qs.toString()}`
  );
  return extractMarketInfo(raw);
}

export async function fetchPublicMarket(
  id: number
): Promise<MarketInfo | null> {
  const qs = new URLSearchParams();
  qs.set("id", String(id));
  const raw = await adminFetchRaw(
    `${API_BASE}/markets/id?${qs.toString()}`
  );
  return extractMarketInfo(raw);
}

export async function createMarket(
  code: string,
  data: {
    title: string;
    description: string;
    platform_url?: string;
    start_time: string;
    end_time: string;
  }
): Promise<{ market: AdminMarket }> {
  return adminFetch<{ market: AdminMarket }>(`${API_BASE}/markets/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, ...data }),
  });
}

export async function updateMarket(
  code: string,
  id: number,
  data: {
    title?: string;
    description?: string;
    platform_url?: string;
    start_time?: string;
    end_time?: string;
    status?: AdminMarketStatus;
    ai_result?: string;
    expected_resolve_time?: string;
    market_timing_type?: string;
    silence_deadline?: string;
  }
): Promise<{ market: AdminMarket }> {
  return adminFetch<{ market: AdminMarket }>(`${API_BASE}/markets/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, id, ...data }),
  });
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function submitReview(
  code: string,
  marketId: number,
  aiResult: string
): Promise<{ review: MarketReview }> {
  return adminFetch<{ review: MarketReview }>(`${API_BASE}/markets/submit_review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, market_id: marketId, ai_result: aiResult }),
  });
}

// ─── Disputes ────────────────────────────────────────────────────────────────

export async function submitDispute(
  code: string,
  marketId: number,
  proposedAiResult: string,
  reason?: string
): Promise<DisputeSubmitResponse> {
  return adminFetch<DisputeSubmitResponse>(
    `${API_BASE}/markets/dispute/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        market_id: marketId,
        proposed_ai_result: proposedAiResult,
        reason: reason || "",
      }),
    }
  );
}

export async function acceptDispute(
  code: string,
  disputeId: number
): Promise<DisputeAcceptResponse> {
  return adminFetch<DisputeAcceptResponse>(
    `${API_BASE}/markets/dispute/accept`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, dispute_id: disputeId }),
    }
  );
}

export async function fetchDisputes(
  code: string,
  marketId: number,
  params: { page_num?: number; page_size?: number } = {}
): Promise<DisputeListResponse> {
  const qs = new URLSearchParams();
  qs.set("code", code);
  qs.set("market_id", String(marketId));
  qs.set("dispute_type", "manual");
  qs.set("page_num", String(params.page_num ?? 1));
  qs.set("page_size", String(params.page_size ?? 10));
  const data = await adminFetch<DisputeListResponse>(
    `${API_BASE}/markets/disputes?${qs.toString()}`
  );
  return { disputes: data.disputes ?? [], total: data.total ?? 0 };
}
