# Admin Auth & Market Monitoring Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add code-based role checking and an admin market monitoring dashboard so admins can add markets, view alerts, trigger PoR, and confirm resolutions.

**Architecture:** Extend the existing access code pattern with a role endpoint. Admin pages live under `/admin/markets` with a role-gated layout. Oracle API calls reuse the existing `ai_data` gateway. All backend endpoints are code-guarded (stateless).

**Tech Stack:** Next.js 14 (App Router), React 18, Radix UI, Tailwind CSS, Lucide icons, sonner toasts. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-03-13-admin-auth-monitoring-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `lib/role.ts` | `RoleContext`, `useRole` hook, `RoleProvider` — manages access code + role state |
| `lib/oracle-api.ts` | Extracted from playground: `callApi`, `callProxy`, `callLocalhost`, `InvalidCodeError`, `toRunSummary`, `buildRunSummary`, `mapEvidenceItems`, `mapEvidenceBundles` |
| `lib/admin-api.ts` | Admin API client — CRUD markets, resolve, role check. Error handling for 4100/4030 |
| `components/auth/role-provider.tsx` | `"use client"` wrapper that provides `RoleContext` to the component tree |
| `components/auth/code-entry-dialog.tsx` | Modal dialog for entering access code |
| `components/admin/market-table.tsx` | Market list table with status tabs, filters, pagination |
| `components/admin/market-form.tsx` | Add market form (title, platform, question, times) |
| `components/admin/market-detail.tsx` | Market info card + alert reason display |
| `components/admin/por-trigger.tsx` | "Run PoR" button, loading state, result display |
| `components/admin/resolve-form.tsx` | Resolution confirmation form with outcome override |
| `app/admin/layout.tsx` | Admin role gate — redirects non-admin users |
| `app/admin/markets/page.tsx` | Market list page |
| `app/admin/markets/new/page.tsx` | Add market page |
| `app/admin/markets/[id]/page.tsx` | Market detail + resolve page |

### Modified Files

| File | Change |
|------|--------|
| `lib/types.ts` | Add `AdminMarket`, `Resolution`, `MarketStatus`, `AlertLevel` types |
| `app/layout.tsx` | Wrap children with `RoleProvider` inside `ThemeProvider` |
| `app/playground/page.tsx` | Remove inline `callApi`/`toRunSummary`/etc., import from `lib/oracle-api.ts`. Use `useRole()` for access code instead of local state |
| `app/api/proxy/[...path]/route.ts` | Add `PUT` handler (mirrors POST) |
| `components/layout/sidebar.tsx` | Add conditional admin nav group via `useRole()` |
| `components/layout/topbar.tsx` | Replace placeholder user button with code entry + role badge |
| `.env.example` | Add `NEXT_PUBLIC_ENABLE_TEST_AUTH` |

---

## Chunk 1: Foundation — Types, API Layer, Role Context

### Task 1: Add Admin Types to `lib/types.ts`

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add admin types at the bottom of `lib/types.ts`**

Open `lib/types.ts` and append after the last line (after `getMatchStatus`):

```typescript
// ─── Admin Market Monitoring ───────────────────────────────────────────────

export type MarketStatus =
  | "ACTIVE"
  | "MONITORING"
  | "ALERTED"
  | "RESOLVING"
  | "RESOLVED"
  | "EXPIRED"
  | "CANCELLED";

export type AlertLevel = "none" | "low" | "medium" | "high" | "critical";

export interface Resolution {
  outcome: string;
  confidence: number;
  resolved_by: string;
  resolved_at: string;
  method: "por" | "manual" | "por_modified";
  por_root: string | null;
  admin_notes: string | null;
  evidence_summary: string | null;
}

export interface AdminMarket {
  id: string;
  title: string;
  platform: string;
  platform_url: string | null;
  description: string;
  question: string;
  start_time: string;
  end_time: string;
  resolve_time: string;
  status: MarketStatus;
  alert_level: AlertLevel;
  alert_reason: string | null;
  resolution: Resolution | null;
  por_result: RunSummary | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No new errors related to admin types.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add AdminMarket, Resolution, MarketStatus, AlertLevel types"
```

---

### Task 2: Extract Oracle API helpers from Playground into `lib/oracle-api.ts`

**Files:**
- Create: `lib/oracle-api.ts`
- Modify: `app/playground/page.tsx`

- [ ] **Step 1: Create `lib/oracle-api.ts`**

Extract the following functions from `app/playground/page.tsx` (lines 27–287) into a new shared module. The file should contain:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EvidenceItem, EvidenceBundle, RunSummary, ExecutionMode, DiscoveredSource } from "@/lib/types";

const LOCALHOST_MODE = process.env.NEXT_PUBLIC_ENABLE_PLAYGROUND_LOCALHOST_MODE === "true";

export class InvalidCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCodeError";
  }
}

/**
 * Localhost mode: call http://localhost:8000{path} directly.
 * Proxy mode: wrap in { code, post_data, path, method } and POST to /api/proxy/ai_data.
 */
export async function callApi(
  code: string,
  path: string,
  body: Record<string, any> = {},
  method: "GET" | "POST" = "POST"
): Promise<any> {
  if (LOCALHOST_MODE) {
    return callLocalhost(path, body, method);
  }
  return callProxy(code, path, body, method);
}

async function callLocalhost(
  path: string,
  body: Record<string, any>,
  method: "GET" | "POST"
): Promise<any> {
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

async function callProxy(
  code: string,
  path: string,
  body: Record<string, any>,
  method: "GET" | "POST"
): Promise<any> {
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

/** Map evidence bundle items to EvidenceItem[] */
export function mapEvidenceItems(bundle: any): EvidenceItem[] {
  // Copy the entire mapEvidenceItems function body from playground/page.tsx lines 129-186
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

/** Build RunSummary from individual step results */
export function buildRunSummary(
  evidenceBundles: any[],
  reasoningTrace: any,
  verdict: any,
  porBundle: any,
  outcome: string,
  confidence: number,
  porRoot: string
): RunSummary {
  // Copy the entire buildRunSummary body from playground/page.tsx lines 201-270
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

/** Map /step/resolve response to RunSummary (single-call mode) */
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
```

- [ ] **Step 2: Update playground to import from `lib/oracle-api.ts`**

In `app/playground/page.tsx`:

1. Delete lines 30–109 (from `const LOCALHOST_MODE = ...` through the closing brace of `callProxy`). This removes `LOCALHOST_MODE`, `InvalidCodeError`, `callApi`, `callLocalhost`, and `callProxy`. **Keep line 29 (`const STORAGE_KEY = "playground_code";`)** — it's still needed until Task 4 replaces it with `useRole()`.

2. Delete lines 126–287 (from `// ─── Evidence / RunSummary mapping helpers` through the end of `toRunSummary`). This removes `mapEvidenceItems`, `mapEvidenceBundles`, `buildRunSummary`, and `toRunSummary`. **Keep lines 111–124** (the `ProviderInfo`, `CollectorInfo`, and `Phase` type declarations — these are playground-local types, not part of the extraction).

3. Add this import near the top:

```typescript
import { callApi, InvalidCodeError, buildRunSummary, toRunSummary, mapEvidenceBundles } from "@/lib/oracle-api";
```

The result: `STORAGE_KEY` and the playground-local types remain in the file, while all oracle API helpers are imported from the shared module.

- [ ] **Step 3: Verify playground still works**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors. The playground page should compile because all extracted functions are now imported.

- [ ] **Step 4: Commit**

```bash
git add lib/oracle-api.ts app/playground/page.tsx
git commit -m "refactor: extract oracle API helpers from playground to lib/oracle-api.ts"
```

---

### Task 3: Create Role Context (`lib/role.ts` + `components/auth/role-provider.tsx`)

**Files:**
- Create: `lib/role.ts`
- Create: `components/auth/role-provider.tsx`
- Modify: `app/layout.tsx`
- Modify: `.env.example`

- [ ] **Step 1: Create `lib/role.ts`**

```typescript
"use client";

import { createContext, useContext } from "react";

export interface RoleState {
  isAuthenticated: boolean;
  role: "admin" | "user" | null;
  accessCode: string | null;
  isLoading: boolean;
  login: (code: string) => Promise<void>;
  logout: () => void;
}

export const RoleContext = createContext<RoleState>({
  isAuthenticated: false,
  role: null,
  accessCode: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function useRole(): RoleState {
  return useContext(RoleContext);
}

export const STORAGE_KEY_CODE = "playground_code";
export const STORAGE_KEY_ROLE = "cournot_role";
```

- [ ] **Step 2: Create `components/auth/role-provider.tsx`**

```typescript
"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { RoleContext, STORAGE_KEY_CODE, STORAGE_KEY_ROLE } from "@/lib/role";

const TEST_AUTH = process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH === "true";
const TEST_CODE = "__test_admin_code__";

async function fetchRole(code: string): Promise<"admin" | "user"> {
  const res = await fetch(`/api/proxy/auth/role?code=${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.code === 4100) {
    throw new Error("Invalid access code");
  }
  if (json.code !== 0) {
    throw new Error(json.msg || "Failed to fetch role");
  }
  return json.data?.role ?? "user";
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore from localStorage on mount
  useEffect(() => {
    async function restore() {
      if (TEST_AUTH) {
        localStorage.setItem(STORAGE_KEY_CODE, TEST_CODE);
        localStorage.setItem(STORAGE_KEY_ROLE, "admin");
        setAccessCode(TEST_CODE);
        setRole("admin");
        setIsLoading(false);
        return;
      }
      const storedCode = localStorage.getItem(STORAGE_KEY_CODE);
      if (!storedCode) {
        setIsLoading(false);
        return;
      }
      try {
        const r = await fetchRole(storedCode);
        setAccessCode(storedCode);
        setRole(r);
        localStorage.setItem(STORAGE_KEY_ROLE, r);
      } catch {
        // Code is invalid or expired — clear it
        localStorage.removeItem(STORAGE_KEY_CODE);
        localStorage.removeItem(STORAGE_KEY_ROLE);
      }
      setIsLoading(false);
    }
    restore();
  }, []);

  const login = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const r = await fetchRole(code);
      localStorage.setItem(STORAGE_KEY_CODE, code);
      localStorage.setItem(STORAGE_KEY_ROLE, r);
      setAccessCode(code);
      setRole(r);
      toast.success(`Logged in as ${r}`);
    } catch (err) {
      toast.error("Invalid access code", {
        description: err instanceof Error ? err.message : "Please check your code.",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_CODE);
    localStorage.removeItem(STORAGE_KEY_ROLE);
    setAccessCode(null);
    setRole(null);
    toast("Logged out");
  }, []);

  return (
    <RoleContext.Provider
      value={{
        isAuthenticated: accessCode !== null && role !== null,
        role,
        accessCode,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}
```

- [ ] **Step 3: Wrap root layout with `RoleProvider`**

In `app/layout.tsx`, add the import:
```typescript
import { RoleProvider } from "@/components/auth/role-provider";
```

Then wrap children inside `ThemeProvider`:
```tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
  <RoleProvider>
    <RouteTracker />
    <Topbar />
    <div className="flex">
      <Sidebar />
      <main className="ml-52 flex-1 min-h-[calc(100vh-3.5rem)]">
        <div className="p-6 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
    <Toaster ... />
  </RoleProvider>
</ThemeProvider>
```

- [ ] **Step 4: Add `NEXT_PUBLIC_ENABLE_TEST_AUTH` to `.env.example`**

Append to `.env.example`:
```bash

# Auth: Set to "true" to auto-login with a test admin code (dev only)
NEXT_PUBLIC_ENABLE_TEST_AUTH=false
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Clean compile.

- [ ] **Step 6: Commit**

```bash
git add lib/role.ts components/auth/role-provider.tsx app/layout.tsx .env.example
git commit -m "feat: add RoleContext with code-based auth and RoleProvider"
```

---

### Task 4: Refactor Playground to Use `useRole()` for Access Code

**Files:**
- Modify: `app/playground/page.tsx`

- [ ] **Step 1: Replace playground's local access code state with `useRole()`**

In `app/playground/page.tsx`:

1. Add import: `import { useRole } from "@/lib/role";`
2. Remove the `STORAGE_KEY` constant (line ~29, if still there).
3. At the top of `PlaygroundPage()`, replace the access code state block:

**Remove:**
```typescript
const [accessCode, setAccessCode] = useState<string | null>(null);
const [codeLoaded, setCodeLoaded] = useState(false);
const [codeInput, setCodeInput] = useState("");

useEffect(() => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) setAccessCode(stored);
  setCodeLoaded(true);
}, []);

const handleInvalidCode = useCallback(() => {
  setAccessCode(null);
  localStorage.removeItem(STORAGE_KEY);
  toast.error("Invalid access code", { description: "Please re-enter your code." });
}, []);

function handleCodeSubmit(e: React.FormEvent) { ... }
```

**Replace with:**
```typescript
const { isAuthenticated, accessCode, login, logout, isLoading: codeLoading } = useRole();
const codeLoaded = !codeLoading;
const [codeInput, setCodeInput] = useState("");

const handleInvalidCode = useCallback(() => {
  logout();
  toast.error("Invalid access code", { description: "Please re-enter your code." });
}, [logout]);

function handleCodeSubmit(e: React.FormEvent) {
  e.preventDefault();
  const code = codeInput.trim();
  if (!code) return;
  login(code).then(() => {
    setCodeInput("");
    trackPlaygroundCodeEntered(code);
  }).catch(() => {});
}
```

4. Remove the "Change Code" and "Remove Code" handlers that directly manipulate localStorage — replace with calls to `logout()`.

5. Find any `handleChangeCode` / `handleRemoveCode` functions and simplify them to use `logout()`.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: Clean compile.

- [ ] **Step 3: Commit**

```bash
git add app/playground/page.tsx
git commit -m "refactor: playground uses useRole() for access code instead of local state"
```

---

### Task 5: Add PUT Handler to API Proxy

**Files:**
- Modify: `app/api/proxy/[...path]/route.ts`

- [ ] **Step 1: Add PUT export**

Append to `app/api/proxy/[...path]/route.ts` after the `POST` function:

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const search = request.nextUrl.search;
  const url = `${UPSTREAM}/${path}${search}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);

    const body = await request.text();
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Upstream request timed out" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upstream request failed" },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -10`
Expected: Clean.

- [ ] **Step 3: Commit**

```bash
git add app/api/proxy/[...path]/route.ts
git commit -m "feat: add PUT handler to API proxy route"
```

---

### Task 6: Create Admin API Client (`lib/admin-api.ts`)

**Files:**
- Create: `lib/admin-api.ts`

- [ ] **Step 1: Create the admin API client**

```typescript
import type { AdminMarket } from "@/lib/types";
import { toast } from "sonner";

const API_BASE = "/api/proxy";

interface AdminMarketsResponse {
  markets: AdminMarket[];
  total: number;
  page_num: number;
  page_size: number;
}

interface ResolveResponse {
  market: AdminMarket;
  notifications: {
    lark: boolean;
    telegram: boolean;
  };
}

class AdminApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.name = "AdminApiError";
    this.code = code;
  }
}

async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new AdminApiError(res.status, `HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.code === 4100) {
    toast.error("Invalid access code", { description: "Please re-enter your code." });
    throw new AdminApiError(4100, json.msg || "Invalid access code");
  }
  if (json.code === 4030) {
    toast.error("Admin access required");
    throw new AdminApiError(4030, json.msg || "Admin access required");
  }
  if (json.code !== 0) {
    toast.error(json.msg || "API error");
    throw new AdminApiError(json.code, json.msg || "API error");
  }
  return json.data as T;
}

export async function fetchMarkets(
  code: string,
  params: {
    status?: string;
    alert_level?: string;
    platform?: string;
    page_num?: number;
    page_size?: number;
    sort?: string;
    order?: "asc" | "desc";
  } = {}
): Promise<AdminMarketsResponse> {
  const qs = new URLSearchParams();
  qs.set("code", code);
  if (params.status) qs.set("status", params.status);
  if (params.alert_level) qs.set("alert_level", params.alert_level);
  if (params.platform) qs.set("platform", params.platform);
  qs.set("page_num", String(params.page_num ?? 1));
  qs.set("page_size", String(params.page_size ?? 20));
  if (params.sort) qs.set("sort", params.sort);
  if (params.order) qs.set("order", params.order);
  return adminFetch<AdminMarketsResponse>(`${API_BASE}/admin/markets?${qs.toString()}`);
}

export async function fetchMarket(code: string, id: string): Promise<{ market: AdminMarket }> {
  return adminFetch<{ market: AdminMarket }>(
    `${API_BASE}/admin/markets/${id}?code=${encodeURIComponent(code)}`
  );
}

export async function createMarket(
  code: string,
  data: {
    title: string;
    platform: string;
    platform_url?: string;
    description: string;
    question: string;
    start_time: string;
    end_time: string;
    resolve_time: string;
  }
): Promise<{ market: AdminMarket }> {
  return adminFetch<{ market: AdminMarket }>(`${API_BASE}/admin/markets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, ...data }),
  });
}

export async function updateMarket(
  code: string,
  id: string,
  data: Partial<AdminMarket>
): Promise<{ market: AdminMarket }> {
  return adminFetch<{ market: AdminMarket }>(`${API_BASE}/admin/markets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, ...data }),
  });
}

export async function resolveMarket(
  code: string,
  id: string,
  data: {
    outcome: string;
    confidence: number;
    method: "por" | "manual" | "por_modified";
    por_root?: string | null;
    admin_notes?: string | null;
    evidence_summary?: string | null;
  }
): Promise<ResolveResponse> {
  return adminFetch<ResolveResponse>(`${API_BASE}/admin/markets/${id}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, ...data }),
  });
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -10`
Expected: Clean.

- [ ] **Step 3: Commit**

```bash
git add lib/admin-api.ts
git commit -m "feat: add admin API client for market CRUD and resolution"
```

---

## Chunk 2: UI Shell — Topbar Auth, Sidebar Nav, Admin Layout Gate

### Task 7: Add Code Entry Dialog + Topbar Auth Controls

**Files:**
- Create: `components/auth/code-entry-dialog.tsx`
- Modify: `components/layout/topbar.tsx`

- [ ] **Step 1: Create `components/auth/code-entry-dialog.tsx`**

```typescript
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CodeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (code: string) => Promise<void>;
}

export function CodeEntryDialog({ open, onOpenChange, onSubmit }: CodeEntryDialogProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await onSubmit(trimmed);
      setCode("");
      onOpenChange(false);
    } catch {
      // Error toast handled by RoleProvider
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Enter Access Code</DialogTitle>
          <DialogDescription>
            Enter your access code to unlock features.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            type="password"
            placeholder="Access code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Validating…" : "Submit"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Update `components/layout/topbar.tsx`**

Replace the entire file content:

```typescript
"use client";

import { useState } from "react";
import { Search, Bell, LogIn, LogOut } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useRole } from "@/lib/role";
import { CodeEntryDialog } from "@/components/auth/code-entry-dialog";
import { Badge } from "@/components/ui/badge";

export function Topbar() {
  const { isAuthenticated, role, login, logout } = useRole();
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
      {/* Left: Logo */}
      <div className="h-10 w-36 overflow-hidden flex items-center justify-center">
        <img
          src="/Cournot_Black_Horizontal-01.png"
          alt="Cournot"
          className="h-[7rem] w-auto max-w-none dark:hidden"
        />
        <img
          src="/Cournot_Logo_White_Horizontal-01.png"
          alt="Cournot"
          className="h-[7rem] w-auto max-w-none hidden dark:block"
        />
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex max-w-md flex-1 mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search markets, IDs, hashes…"
            className="h-8 w-full rounded-lg border border-border bg-muted/30 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Bell className="h-4 w-4" />
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {role === "admin" ? (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  ADMIN
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  USER
                </Badge>
              )}
            </div>
            <button
              onClick={logout}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCodeDialogOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <LogIn className="h-3.5 w-3.5" />
            Enter Code
          </button>
        )}
      </div>

      <CodeEntryDialog
        open={codeDialogOpen}
        onOpenChange={setCodeDialogOpen}
        onSubmit={login}
      />
    </header>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Clean.

- [ ] **Step 4: Commit**

```bash
git add components/auth/code-entry-dialog.tsx components/layout/topbar.tsx
git commit -m "feat: add code entry dialog and auth controls in topbar"
```

---

### Task 8: Add Conditional Admin Section to Sidebar

**Files:**
- Modify: `components/layout/sidebar.tsx`

- [ ] **Step 1: Update sidebar to show admin nav group conditionally**

In `components/layout/sidebar.tsx`:

1. Add import: `import { useRole } from "@/lib/role";`
2. Add icon import: `import { Shield, PlusCircle } from "lucide-react";`
3. Inside `Sidebar()`, add after `const [collapsed, setCollapsed] = useState(false);`:

```typescript
const { isAuthenticated, role } = useRole();
```

4. Change `navGroups` from a module-level constant to a computed value inside the component. Replace the static `navGroups` constant and the render with:

```typescript
const baseGroups = [
  {
    label: "Main",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/cases", label: "Cases", icon: FileText },
      { href: "/monitoring", label: "Monitoring", icon: Radar },
      { href: "/playground", label: "Playground", icon: FlaskConical },
    ],
  },
];

const adminGroup = {
  label: "Admin",
  items: [
    { href: "/admin/markets", label: "Market Monitor", icon: Shield },
    { href: "/admin/markets/new", label: "Add Market", icon: PlusCircle },
  ],
};

const devGroup = {
  label: "Developer",
  items: [
    { href: "/developer", label: "API Reference", icon: Code2 },
  ],
};

const groups = [
  ...baseGroups,
  ...(isAuthenticated && role === "admin" ? [adminGroup] : []),
  devGroup,
];
```

5. Replace the entire `{navGroups.map(...)` render block (the `<div className="flex-1 space-y-4">` contents) with:

```tsx
<div className="flex-1 space-y-4">
  {groups.map((group) => {
    const isAdminGroup = group.label === "Admin";
    return (
      <div key={group.label}>
        {!collapsed && (
          <p className={cn(
            "mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider",
            isAdminGroup ? "text-red-400/60" : "text-muted-foreground/60"
          )}>
            {group.label}
          </p>
        )}
        <div className="space-y-0.5">
          {group.items.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? isAdminGroup
                      ? "bg-red-500/10 text-red-400 font-medium"
                      : "bg-accent text-foreground font-medium"
                    : isAdminGroup
                      ? "text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    );
  })}
</div>
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -10`
Expected: Clean.

- [ ] **Step 3: Commit**

```bash
git add components/layout/sidebar.tsx
git commit -m "feat: add conditional admin nav section in sidebar for admin role"
```

---

### Task 9: Create Admin Layout Gate

**Files:**
- Create: `app/admin/layout.tsx`

- [ ] **Step 1: Create `app/admin/layout.tsx`**

```typescript
"use client";

import { useRole } from "@/lib/role";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, isLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error("Please enter your access code first");
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirecting
  }

  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          You need admin access to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -10`
Expected: Clean.

- [ ] **Step 3: Commit**

```bash
git add app/admin/layout.tsx
git commit -m "feat: add admin layout with role-based access gate"
```

---

## Chunk 3: Admin Pages — Market List, Add Market, Market Detail + Resolution

### Task 10: Create Market List Page (`/admin/markets`)

**Files:**
- Create: `components/admin/market-table.tsx`
- Create: `app/admin/markets/page.tsx`

- [ ] **Step 1: Create `components/admin/market-table.tsx`**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role";
import { fetchMarkets } from "@/lib/admin-api";
import type { AdminMarket, MarketStatus, AlertLevel } from "@/lib/types";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "Alerted", value: "ALERTED" },
  { label: "Monitoring", value: "MONITORING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "All", value: "" },
];

function statusColor(s: MarketStatus): string {
  switch (s) {
    case "ALERTED": return "text-amber-400";
    case "MONITORING": return "text-green-400";
    case "ACTIVE": return "text-blue-400";
    case "RESOLVING": return "text-purple-400";
    case "RESOLVED": return "text-muted-foreground";
    case "EXPIRED": return "text-muted-foreground/60";
    case "CANCELLED": return "text-muted-foreground/60";
    default: return "";
  }
}

function alertBadge(level: AlertLevel) {
  if (level === "none") return <span className="text-muted-foreground">—</span>;
  const colors: Record<string, string> = {
    low: "bg-yellow-500/10 text-yellow-500",
    medium: "bg-orange-500/10 text-orange-500",
    high: "bg-red-500/10 text-red-500",
    critical: "bg-red-600/20 text-red-400",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px]", colors[level])}>
      {level.toUpperCase()}
    </Badge>
  );
}

function platformBadge(platform: string) {
  const colors: Record<string, string> = {
    polymarket: "bg-blue-500/10 text-blue-400",
    kalshi: "bg-green-500/10 text-green-400",
    limitless: "bg-purple-500/10 text-purple-400",
    custom: "bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px]", colors[platform] ?? colors.custom)}>
      {platform}
    </Badge>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function MarketTable() {
  const { accessCode } = useRole();
  const router = useRouter();
  const [markets, setMarkets] = useState<AdminMarket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALERTED");
  const pageSize = 20;

  const load = useCallback(async () => {
    if (!accessCode) return;
    setLoading(true);
    try {
      const data = await fetchMarkets(accessCode, {
        status: statusFilter || undefined,
        page_num: page,
        page_size: pageSize,
        sort: "resolve_time",
        order: "asc",
      });
      setMarkets(data.markets);
      setTotal(data.total);
    } catch {
      // Error handled by admin-api
    } finally {
      setLoading(false);
    }
  }, [accessCode, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex gap-1 rounded-lg bg-muted/30 p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors",
              statusFilter === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Alert</TableHead>
                <TableHead>Resolve By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : markets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No markets found
                  </TableCell>
                </TableRow>
              ) : (
                markets.map((m) => (
                  <TableRow
                    key={m.id}
                    className={cn(
                      "cursor-pointer",
                      m.status === "ALERTED" && "bg-red-500/5"
                    )}
                    onClick={() => router.push(`/admin/markets/${m.id}`)}
                  >
                    <TableCell className="font-medium max-w-[300px] truncate">
                      {m.title}
                    </TableCell>
                    <TableCell>{platformBadge(m.platform)}</TableCell>
                    <TableCell>
                      <span className={statusColor(m.status)}>{m.status}</span>
                    </TableCell>
                    <TableCell>{alertBadge(m.alert_level)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(m.resolve_time)}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/admin/markets/${m.id}`); }}
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} markets total</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `app/admin/markets/page.tsx`**

```typescript
"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { MarketTable } from "@/components/admin/market-table";

export default function AdminMarketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Market Monitor</h1>
          <p className="text-sm text-muted-foreground">
            Manage monitored markets and resolve alerts
          </p>
        </div>
        <Link
          href="/admin/markets/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4" />
          Add Market
        </Link>
      </div>
      <MarketTable />
    </div>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Clean.

- [ ] **Step 4: Commit**

```bash
git add components/admin/market-table.tsx app/admin/markets/page.tsx
git commit -m "feat: add admin market list page with filters and pagination"
```

---

### Task 11: Create Add Market Page (`/admin/markets/new`)

**Files:**
- Create: `components/admin/market-form.tsx`
- Create: `app/admin/markets/new/page.tsx`

- [ ] **Step 1: Create `components/admin/market-form.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role";
import { createMarket } from "@/lib/admin-api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PLATFORMS = ["polymarket", "kalshi", "limitless", "custom"];

export function MarketForm() {
  const { accessCode } = useRole();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("polymarket");
  const [platformUrl, setPlatformUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [resolveTime, setResolveTime] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessCode) return;
    if (!title.trim() || !question.trim() || !startTime || !endTime || !resolveTime) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      await createMarket(accessCode, {
        title: title.trim(),
        platform,
        platform_url: platformUrl.trim() || undefined,
        description: description.trim(),
        question: question.trim(),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        resolve_time: new Date(resolveTime).toISOString(),
      });
      toast.success("Market added");
      router.push("/admin/markets");
    } catch {
      // Error handled by admin-api
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Will BTC hit $100k by June 2026?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Platform *</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Platform URL</label>
              <Input value={platformUrl} onChange={(e) => setPlatformUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Question (for PoR resolution) *</label>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="The exact resolvable question..." />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed resolution criteria..." rows={3} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Time *</label>
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Time *</label>
              <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Resolve Time *</label>
              <Input type="datetime-local" value={resolveTime} onChange={(e) => setResolveTime(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add Market
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="h-9 rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create `app/admin/markets/new/page.tsx`**

```typescript
"use client";

import { MarketForm } from "@/components/admin/market-form";

export default function NewMarketPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Add Market</h1>
        <p className="text-sm text-muted-foreground">
          Add a new market to be monitored for resolution signals
        </p>
      </div>
      <MarketForm />
    </div>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -10`
Expected: Clean.

- [ ] **Step 4: Commit**

```bash
git add components/admin/market-form.tsx app/admin/markets/new/page.tsx
git commit -m "feat: add market creation form and /admin/markets/new page"
```

---

### Task 12: Create Market Detail Page with PoR Trigger and Resolution Form

**Files:**
- Create: `components/admin/market-detail.tsx`
- Create: `components/admin/por-trigger.tsx`
- Create: `components/admin/resolve-form.tsx`
- Create: `app/admin/markets/[id]/page.tsx`

- [ ] **Step 1: Create `components/admin/market-detail.tsx`**

```typescript
"use client";

import type { AdminMarket } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function MarketDetail({ market }: { market: AdminMarket }) {
  return (
    <div className="space-y-4">
      {/* Info card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{market.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{market.description}</p>
              {market.platform_url && (
                <a
                  href={market.platform_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                >
                  View on {market.platform} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Badge variant="outline" className={cn(
                "text-xs",
                market.status === "ALERTED" && "bg-red-500/10 text-red-400 border-red-500/30",
              )}>
                {market.status}
              </Badge>
              <Badge variant="outline" className="text-xs">{market.platform}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Start</span>
              <p>{formatDate(market.start_time)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">End</span>
              <p>{formatDate(market.end_time)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Resolve By</span>
              <p className="text-amber-400">{formatDate(market.resolve_time)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Added By</span>
              <p className="font-mono text-xs">{market.created_by}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert reason */}
      {market.alert_reason && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">Alert Reason</p>
                <p className="text-sm text-muted-foreground mt-1">{market.alert_reason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `components/admin/por-trigger.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRole } from "@/lib/role";
import { callApi, toRunSummary } from "@/lib/oracle-api";
import type { RunSummary } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface PorTriggerProps {
  question: string;
  onResult: (result: RunSummary) => void;
  newsUrl?: string;
}

export function PorTrigger({ question, onResult, newsUrl }: PorTriggerProps) {
  const { accessCode } = useRole();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunSummary | null>(null);

  async function handleRun() {
    if (!accessCode) return;
    setLoading(true);
    try {
      const raw = await callApi(accessCode, "/step/resolve", { question });
      const summary = toRunSummary(raw);
      setResult(summary);
      onResult(summary);
      toast.success("PoR complete");
    } catch (err) {
      toast.error("PoR failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={handleRun}
          disabled={loading}
          className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {loading ? "Running PoR…" : "Run Proof of Reasoning"}
        </button>
        {newsUrl && (
          <a
            href={newsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-accent inline-flex items-center gap-2"
          >
            Check News Manually
          </a>
        )}
      </div>

      {result && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-primary mb-3">Proof of Reasoning Result</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Outcome</span>
                <p className="text-lg font-bold">{result.outcome}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Confidence</span>
                <p className="text-lg font-bold">{(result.confidence * 100).toFixed(0)}%</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">PoR Root</span>
                <p className="font-mono text-xs truncate">{result.por_root}</p>
              </div>
            </div>
            {result.evidence_bundles && result.evidence_bundles.length > 0 && (
              <details className="mt-3">
                <summary className="text-xs text-primary cursor-pointer">
                  View evidence ({result.evidence_bundles.reduce((n, b) => n + b.items.length, 0)} items)
                </summary>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {result.evidence_bundles.map((b) => (
                    <p key={b.bundle_id}>
                      <Badge variant="outline" className="text-[10px] mr-1">{b.collector_name}</Badge>
                      {b.items.length} items
                    </p>
                  ))}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `components/admin/resolve-form.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role";
import { resolveMarket } from "@/lib/admin-api";
import type { RunSummary } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

interface ResolveFormProps {
  marketId: string;
  porResult: RunSummary | null;
}

export function ResolveForm({ marketId, porResult }: ResolveFormProps) {
  const { accessCode } = useRole();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [outcome, setOutcome] = useState(porResult?.outcome ?? "");
  const [confidence, setConfidence] = useState(String(porResult?.confidence ?? ""));
  const [adminNotes, setAdminNotes] = useState("");
  const [evidenceSummary, setEvidenceSummary] = useState("");

  // Update when PoR result arrives
  useEffect(() => {
    if (porResult) {
      setOutcome(porResult.outcome);
      setConfidence(String(porResult.confidence));
    }
  }, [porResult]);

  const isModified = porResult && (
    outcome !== porResult.outcome ||
    parseFloat(confidence) !== porResult.confidence
  );
  const method = !porResult ? "manual" : isModified ? "por_modified" : "por";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessCode || !outcome.trim()) return;
    setLoading(true);
    try {
      const res = await resolveMarket(accessCode, marketId, {
        outcome: outcome.trim(),
        confidence: parseFloat(confidence) || 0,
        method,
        por_root: porResult?.por_root ?? null,
        admin_notes: adminNotes.trim() || null,
        evidence_summary: evidenceSummary.trim() || null,
      });
      const notif = res.notifications;
      toast.success("Market resolved", {
        description: `Lark: ${notif.lark ? "sent" : "failed"}, Telegram: ${notif.telegram ? "sent" : "failed"}`,
      });
      router.push("/admin/markets");
    } catch {
      // Error handled by admin-api
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardContent className="p-6">
        <p className="text-sm font-medium text-green-400 mb-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Confirm Resolution
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Outcome *</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">Select...</option>
                <option value="YES">YES</option>
                <option value="NO">NO</option>
                <option value="INVALID">INVALID</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Confidence (0-1)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={confidence}
                onChange={(e) => setConfidence(e.target.value)}
              />
            </div>
          </div>

          {method !== "por" && (
            <p className="text-xs text-amber-400">
              Method: {method === "por_modified" ? "PoR Modified (you changed the outcome/confidence)" : "Manual (no PoR result)"}
            </p>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Admin Notes {isModified && "(required — explain override)"}
            </label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Reasoning for this resolution..."
              rows={2}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Evidence Summary</label>
            <Textarea
              value={evidenceSummary}
              onChange={(e) => setEvidenceSummary(e.target.value)}
              placeholder="Brief summary of key evidence..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading || !outcome.trim()}
              className="h-9 rounded-lg bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-600/90 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm & Notify
            </button>
            <span className="text-[10px] text-muted-foreground">
              Will notify Lark + Telegram
            </span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create `app/admin/markets/[id]/page.tsx`**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRole } from "@/lib/role";
import { fetchMarket } from "@/lib/admin-api";
import type { AdminMarket, RunSummary } from "@/lib/types";
import { MarketDetail } from "@/components/admin/market-detail";
import { PorTrigger } from "@/components/admin/por-trigger";
import { ResolveForm } from "@/components/admin/resolve-form";
import { Loader2 } from "lucide-react";

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessCode } = useRole();
  const [market, setMarket] = useState<AdminMarket | null>(null);
  const [loading, setLoading] = useState(true);
  const [porResult, setPorResult] = useState<RunSummary | null>(null);

  const load = useCallback(async () => {
    if (!accessCode || !params.id) return;
    setLoading(true);
    try {
      const data = await fetchMarket(accessCode, params.id);
      setMarket(data.market);
      if (data.market.por_result) {
        setPorResult(data.market.por_result);
      }
    } catch {
      // Error handled by admin-api
    } finally {
      setLoading(false);
    }
  }, [accessCode, params.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Market not found
      </div>
    );
  }

  const isResolvable = ["ALERTED", "MONITORING", "ACTIVE"].includes(market.status);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground">
        Admin → Market Monitor → <span className="text-foreground">{market.title}</span>
      </div>

      <MarketDetail market={market} />

      {isResolvable && (
        <>
          <PorTrigger
            question={market.question}
            onResult={setPorResult}
            newsUrl={`https://news.google.com/search?q=${encodeURIComponent(market.question)}`}
          />
          <ResolveForm marketId={market.id} porResult={porResult} />
        </>
      )}

      {market.status === "RESOLVED" && market.resolution && (
        <div className="rounded-lg border border-border bg-muted/30 p-6">
          <p className="text-sm font-medium mb-3">Resolution</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Outcome</span>
              <p className="font-bold">{market.resolution.outcome}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Confidence</span>
              <p>{(market.resolution.confidence * 100).toFixed(0)}%</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Method</span>
              <p>{market.resolution.method}</p>
            </div>
          </div>
          {market.resolution.admin_notes && (
            <p className="text-sm text-muted-foreground mt-3">{market.resolution.admin_notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Clean.

- [ ] **Step 6: Commit**

```bash
git add components/admin/market-detail.tsx components/admin/por-trigger.tsx components/admin/resolve-form.tsx app/admin/markets/[id]/page.tsx
git commit -m "feat: add market detail page with PoR trigger and resolution form"
```

---

## Chunk 4: Final Verification

### Task 13: Full Build Verification

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit --pretty`
Expected: Clean compile with no errors.

- [ ] **Step 2: Run Next.js build**

Run: `npx next build 2>&1 | tail -30`
Expected: Build succeeds. All routes compile:
- `/admin/markets`
- `/admin/markets/new`
- `/admin/markets/[id]`

- [ ] **Step 3: Run dev server and smoke test**

Run: `npx next dev` and check:
1. `/` loads — existing pages work
2. Topbar shows "Enter Code" button
3. After entering a code, role badge appears
4. If admin, sidebar shows "Admin" section
5. `/admin/markets` loads the market list page
6. `/admin/markets/new` shows the add market form
7. With `NEXT_PUBLIC_ENABLE_TEST_AUTH=true`, auto-login works

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address build issues from integration testing"
```

---

## Summary

| Chunk | Tasks | What it delivers |
|-------|-------|-----------------|
| 1 (Foundation) | Tasks 1–6 | Types, oracle-api extraction, RoleContext, proxy PUT, admin-api client |
| 2 (UI Shell) | Tasks 7–9 | Topbar auth, sidebar admin nav, admin layout gate |
| 3 (Admin Pages) | Tasks 10–12 | Market list, add market form, market detail + PoR + resolve |
| 4 (Verification) | Task 13 | Full build + smoke test |

Total: **13 tasks**, each with explicit files, code, and commands.
