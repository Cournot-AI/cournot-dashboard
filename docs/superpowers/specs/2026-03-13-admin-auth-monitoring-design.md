# Admin Auth & Market Monitoring — Design Spec

## Overview

Add code-based role checking and an admin market monitoring dashboard to the Cournot Dashboard. The existing access code pattern is extended: the backend exposes an endpoint that accepts a code and returns the user's role. Admin-role users gain access to a market monitoring dashboard where they can add markets, view alerts, trigger Proof of Reasoning, and confirm resolutions that get broadcast to Lark and Telegram.

**Scope:** Frontend changes only in this repo. Backend receives an API spec to implement on the existing `interface.cournot.ai` service.

## Architecture

```
Browser (Next.js 14)
├── Access code (existing pattern, stored in localStorage)
├── RoleContext (role from /auth/role, cached in localStorage)
├── Existing pages: /cases, /playground, /monitoring, /developer
└── NEW: /admin/markets (role-gated, admin only)
        ├── List view with filters
        ├── Add market form
        └── Detail + resolution workflow

Next.js API Proxy (/api/proxy/[...path])
├── Supports GET, POST, PUT methods
├── Proxies to UPSTREAM_API_BASE (= .../play/polymarket)
└── Admin endpoints hosted under this same prefix on the backend
    (e.g., /play/polymarket/admin/markets, /play/polymarket/auth/role)

Cournot Backend (interface.cournot.ai)
├── NEW: GET /auth/role (accepts code, returns role)
├── NEW: /admin/markets/* endpoints (CRUD + resolve, all code-guarded)
├── EXISTING: /step/* oracle pipeline (reused for PoR)
├── Market monitor loop (existing mechanism)
├── Lark integration (alerts + resolution notices)
└── Telegram integration (resolution broadcast with evidence)
```

## 1. Authentication via Access Code

### Flow

1. User enters access code (reuses existing playground code entry pattern)
2. Frontend calls `GET /auth/role?code={code}` via proxy
3. Backend validates code, returns role (`"admin"` or `"user"`)
4. Frontend stores code + role in `RoleContext` + localStorage
5. If role is `"admin"`, sidebar shows admin section, admin routes become accessible
6. All subsequent API calls include the `code` as a query parameter or in the request body (matching existing playground pattern)
7. Logout clears code + role from localStorage and resets `RoleContext`

### Auth API

#### GET /auth/role

Validate an access code and return the associated role.

**Query params:**
- `code` — the access code string

**Response (success):**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "role": "admin"
  }
}
```

**Response (invalid code):**
```json
{
  "code": 4100,
  "msg": "Invalid access code",
  "data": null
}
```

This reuses the existing error code `4100` that the playground already handles for invalid codes.

### Frontend Role State

```typescript
// RoleContext provides:
interface RoleState {
  isAuthenticated: boolean;  // code validated successfully
  role: "admin" | "user" | null;
  accessCode: string | null;
  isLoading: boolean;
  login: (code: string) => Promise<void>;   // validate code, store role
  logout: () => void;                        // clear code + role
}

// localStorage keys (extends existing pattern):
// "playground_code"     — access code (EXISTING, reused)
// "cournot_role"        — role for quick UI checks
```

**Page load restoration:** Check localStorage for `playground_code` → if found, call `GET /auth/role?code={code}` to validate and get role → restore or clear.

**RoleProvider** is a `"use client"` component nested inside the existing `ThemeProvider` in the root layout (same pattern as how `ThemeProvider` is already used).

**Playground integration:** The existing playground page manages its own `accessCode` state and reads/writes `playground_code` in localStorage directly. To avoid state desynchronization, the playground must be refactored to use the `useRole()` hook for its access code instead of managing its own local state. The `callApi` helper should read the code from `RoleContext`.

### Code Guard Pattern for Admin Endpoints

All admin API calls include the code. Two patterns depending on HTTP method:

- **GET requests:** `?code={code}` as query parameter
- **POST/PUT requests:** `"code": "{code}"` in the request body

The backend validates the code on every request and checks that the associated role is `"admin"`. This is stateless — no sessions or tokens.

### Test Mode

When `NEXT_PUBLIC_ENABLE_TEST_AUTH=true`:
- Auto-sets a hardcoded test code in localStorage
- Skips the code entry prompt
- `GET /auth/role` returns `"admin"` for the test code
- All subsequent API calls work normally with the test code

## 2. Admin Market Management

### Data Model

```typescript
interface AdminMarket {
  id: string;                    // server-generated UUID
  title: string;                 // "Will BTC hit $100k by June 2026?"
  platform: string;              // "polymarket" | "kalshi" | "limitless" | "custom"
  platform_url: string | null;   // link to market on platform
  description: string;           // detailed market description
  question: string;              // resolvable question (fed to PoR)

  start_time: string;            // ISO 8601
  end_time: string;              // ISO 8601
  resolve_time: string;          // ISO 8601

  status: MarketStatus;
  alert_level: AlertLevel;
  alert_reason: string | null;

  resolution: Resolution | null; // null until resolved
  por_result: RunSummary | null; // raw PoR result if triggered

  created_by: string;            // code identifier or label
  created_at: string;            // ISO 8601
  updated_at: string;            // ISO 8601
}

type MarketStatus = "ACTIVE" | "MONITORING" | "ALERTED" | "RESOLVING" | "RESOLVED" | "EXPIRED" | "CANCELLED";
type AlertLevel = "none" | "low" | "medium" | "high" | "critical";

interface Resolution {
  outcome: string;               // "YES" | "NO" | "INVALID" | custom
  confidence: number;            // 0-1
  resolved_by: string;           // code identifier or label
  resolved_at: string;           // ISO 8601
  method: "por" | "manual" | "por_modified";
  por_root: string | null;
  admin_notes: string | null;
  evidence_summary: string | null;
}
```

### Status Lifecycle

```
ACTIVE → MONITORING → ALERTED → RESOLVING → RESOLVED
  (added)   (after       (signal    (admin      (confirmed)
             start_time)  detected)  reviewing)

Any non-terminal status → CANCELLED  (via PUT with {status: "CANCELLED"}, no DELETE endpoint)
                        → EXPIRED    (past resolve_time, no resolution)
```

### Admin API

All admin endpoints require a valid access code with admin role.

- **GET requests:** code passed as `?code={code}` query param
- **POST/PUT requests:** code included as `"code"` field in request body

#### GET /admin/markets

List markets with filtering and pagination.

**Query params:**
- `code` — access code (required)
- `status` — comma-separated: `ALERTED,MONITORING`
- `alert_level` — comma-separated: `high,critical`
- `platform` — single value: `polymarket`
- `page_num` — default 1 (matches existing codebase convention)
- `page_size` — default 20
- `sort` — field name: `resolve_time`
- `order` — `asc` | `desc`

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "markets": [AdminMarket],
    "total": 42,
    "page_num": 1,
    "page_size": 20
  }
}
```

#### POST /admin/markets

Add a new market to be monitored.

**Request:**
```json
{
  "code": "access-code-here",
  "title": "Will BTC hit $100k by June 2026?",
  "platform": "polymarket",
  "platform_url": "https://polymarket.com/...",
  "description": "Bitcoin must reach or exceed...",
  "question": "Will Bitcoin reach $100,000...",
  "start_time": "2026-03-13T00:00:00Z",
  "end_time": "2026-06-30T23:59:59Z",
  "resolve_time": "2026-07-01T00:00:00Z"
}
```

**Response (201):**
```json
{
  "code": 0,
  "msg": "success",
  "data": { "market": AdminMarket }
}
```

#### GET /admin/markets/:id

Get full market detail including alert info and PoR result.

**Query params:** `?code={code}`

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": { "market": AdminMarket }
}
```

#### PUT /admin/markets/:id

Update market metadata. Cannot update once status is RESOLVED.

**Request:**
```json
{
  "code": "access-code-here",
  ...partial AdminMarket fields
}
```

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": { "market": AdminMarket }
}
```

#### POST /admin/markets/:id/resolve

Submit final resolution. Triggers Lark notification + Telegram broadcast.

**Request:**
```json
{
  "code": "access-code-here",
  "outcome": "YES",
  "confidence": 0.95,
  "method": "por_modified",
  "por_root": "abc123...",
  "admin_notes": "PoR said NO but official source confirms YES",
  "evidence_summary": "Reuters reported on 2026-03-13..."
}
```

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "market": AdminMarket,
    "notifications": {
      "lark": true,
      "telegram": true
    }
  }
}
```

**Backend side-effects:**
- Sets market status to RESOLVED
- Sends Lark message: "Market [title] resolved as [outcome] by [resolved_by]"
- Sends Telegram message to designated group with full evidence + proofs

### Error Responses

Standard error envelope matching existing pattern (`code: 0` = success, non-zero = error):

```json
{
  "code": 0,
  "msg": "success",
  "data": { ... }
}
```

Error codes (non-zero `code` field in response body; HTTP status also set accordingly):

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| 4000 | 400 | Bad request (validation error) |
| 4030 | 403 | Forbidden (valid code but not admin role) |
| 4040 | 404 | Not found |
| 4090 | 409 | Conflict (market already resolved) |
| 4100 | 401 | Invalid access code (matches existing) |
| 5000 | 500 | Internal server error |

**Error handling in admin-api.ts:**
- `4100` → clear code from localStorage, prompt re-entry ("Invalid code, please re-enter")
- `4030` → show "Admin access required" without clearing the code (code is valid but not admin)
- Other errors → show generic error toast

## 3. UI Design

### Topbar Changes

- Replace placeholder user menu with auth controls
- **Not authenticated:** Purple "Enter Code" button (opens code entry dialog, reuses playground pattern)
- **Authenticated:** Green dot + role badge (ADMIN in red or USER in gray) + "Logout" button
- Code entry can be shared with the existing playground code — entering a code once authenticates everywhere

### Sidebar Changes

- Admin section appears conditionally when `role === "admin"`
- New items under "Admin" heading: "Market Monitor" (`/admin/markets`), "+ Add Market" (`/admin/markets/new`)
- Admin items styled in red/accent color to distinguish from regular nav
- Sidebar must import `useRole()` and conditionally append the admin nav group

### Admin Pages

#### Market List (`/admin/markets`)
- Header with title + "Add Market" button
- Status filter tabs: Alerted (count) | Monitoring | Active | Resolved | All
- Platform dropdown filter
- Table columns: Title, Platform (badge), Status, Alert Level, Resolve By, Actions (View / Resolve)
- Alerted rows highlighted with subtle red background
- Pagination at bottom

#### Add Market (`/admin/markets/new`)
- Form with fields: Title, Platform (dropdown), Platform URL, Question, Description, Start Time, End Time, Resolve Time
- All times in ISO 8601 format
- Submit → `POST /admin/markets` → redirect to list

#### Market Detail (`/admin/markets/:id`)
- Breadcrumb: Admin → Market Monitor → [title]
- Market info card (title, description, platform badge, time grid)
- Alert reason box (red border, shown when ALERTED)
- Action buttons: "Run Proof of Reasoning" + "Check News Manually"
- PoR result section (appears after running): outcome, confidence, PoR root, collapsible evidence/reasoning (reuses existing playground detail components)
- Resolution confirmation form: outcome dropdown (pre-filled from PoR), confidence input, admin notes textarea, "Confirm & Notify" button

### Admin Layout Gate

`/admin/layout.tsx` checks role state:
- Not authenticated (no code) → redirect to home with toast prompting code entry
- Authenticated but not admin → show "Access Denied" message
- Admin → render children

## 4. PoR Integration

When admin clicks "Run Proof of Reasoning":

1. Frontend calls the existing oracle pipeline via the same `ai_data` gateway pattern used by the playground, using the stored access code from `RoleContext`. The `callApi` helper is extracted from the playground into a shared `lib/oracle-api.ts` module and reused by both the playground and the admin PoR trigger.
2. Shows loading state (reuse `pipeline-progress` component)
3. On success, maps the raw response through the same transform logic used in the playground to produce a `RunSummary`, then displays it (reuse playground result components)
4. Pre-fills resolution form: outcome, confidence, por_root from `RunSummary`
5. If admin modifies outcome or confidence, method auto-changes from `"por"` to `"por_modified"`
6. Admin clicks "Confirm & Notify" → `POST /admin/markets/:id/resolve`

No new oracle API endpoints needed. The existing access code already grants access to `/step/*` endpoints.

## 5. Notification Pipeline (Backend-Side)

### Lark Alert (on signal detection)
```
Market [title] may be resolvable.
Signal: [alert_reason]
Alert level: [HIGH/CRITICAL]
Dashboard: [url to /admin/markets/:id]
```

### Lark Resolution Notice
```
Market RESOLVED
Title: [title]
Outcome: [YES/NO/INVALID]
Confidence: [0.94]
Method: [por/manual/por_modified]
Resolved by: [resolved_by]
Time: [2026-03-13 15:00 UTC]
```

### Telegram Resolution Broadcast
```
Cournot Market Resolution
═══════════════════════
Market: [title]
Platform: [Polymarket]
Outcome: YES
Confidence: 94%

Evidence:
• [source 1] - [excerpt]
• [source 2] - [excerpt]

Reasoning:
[brief reasoning summary]

PoR Root: abc123...
Resolved by: [resolved_by]
Method: por_modified
Admin notes: [if any]
```

Note: Lark and Telegram integrations are backend-only. Frontend only triggers via the `/admin/markets/:id/resolve` endpoint.

## 6. File Structure

### New Files

```
lib/
├── role.ts                    # RoleContext, useRole hook, login/logout logic
├── oracle-api.ts              # Extracted from playground: callApi, callProxy, InvalidCodeError, toRunSummary
└── admin-api.ts               # Admin API client (markets CRUD, resolve)

app/
├── admin/
│   ├── layout.tsx             # Admin role gate
│   └── markets/
│       ├── page.tsx           # Market list view
│       ├── new/
│       │   └── page.tsx       # Add market form
│       └── [id]/
│           └── page.tsx       # Market detail + resolve

components/
├── auth/
│   ├── code-entry-button.tsx  # Code entry trigger in topbar (opens dialog)
│   ├── code-entry-dialog.tsx  # Code entry modal (reuses playground pattern)
│   └── role-provider.tsx      # RoleContext provider (wraps app)
└── admin/
    ├── market-table.tsx       # Market list table with filters
    ├── market-form.tsx        # Add/edit market form
    ├── market-detail.tsx      # Market info + alert display
    ├── por-trigger.tsx        # PoR run button + result display
    └── resolve-form.tsx       # Resolution confirmation form
```

### Modified Files

```
lib/types.ts                         # + AdminMarket, Resolution, AlertLevel types (under "// --- Admin Market Monitoring ---" section)
app/layout.tsx                       # + wrap with RoleProvider (inside ThemeProvider)
app/playground/page.tsx              # Refactor to use useRole() for access code instead of local state; extract callApi/toRunSummary to lib/oracle-api.ts
app/api/proxy/[...path]/route.ts     # + add PUT handler (mirrors POST: same timeout, body passthrough)
components/layout/sidebar.tsx        # + admin nav items (conditional on role via useRole())
components/layout/topbar.tsx         # + code entry button (replace placeholder user menu)
.env.example                         # + NEXT_PUBLIC_ENABLE_TEST_AUTH
```

## 7. Environment Variables

```bash
# Existing
UPSTREAM_API_BASE=https://dev-interface.cournot.ai/play/polymarket
NEXT_PUBLIC_ENABLE_PLAYGROUND_LOCALHOST_MODE=false

# New
NEXT_PUBLIC_ENABLE_TEST_AUTH=false     # true → auto-set test code, skip code entry
```

## 8. Dependencies

No new npm dependencies required. The existing codebase has everything needed.
