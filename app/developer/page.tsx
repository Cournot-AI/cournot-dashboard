"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Copy,
  Check,
  Terminal,
  Braces,
  GitBranch,
  Server,
  Search,
  Scale,
  Gavel,
  PackageCheck,
  BookOpen,
  AlertTriangle,
  Hash,
  ChevronRight,
  ShieldCheck,
  FileCheck,
  MessageSquareWarning,
  Zap,
  Info,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  function copy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }
  return { copiedId, copy };
}

function CodeBlock({ id, code, language }: { id: string; code: string; language?: string }) {
  const { copiedId, copy } = useCopyToClipboard();
  return (
    <div className="group relative">
      {language && (
        <div className="absolute left-3 top-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 select-none">
          {language}
        </div>
      )}
      <pre
        className={cn(
          "rounded-lg border border-border/60 bg-background p-4 text-[13px] leading-relaxed overflow-x-auto font-[family-name:var(--font-geist-mono)]",
          language && "pt-8"
        )}
      >
        <code className="text-muted-foreground">{code}</code>
      </pre>
      <button
        onClick={() => copy(id, code)}
        className="absolute right-2 top-2 rounded-md border border-border bg-card p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
        title="Copy to clipboard"
      >
        {copiedId === id ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colorMap: Record<string, string> = {
    POST: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    GET: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  };
  return (
    <Badge className={cn("text-[10px] font-bold uppercase tracking-wider", colorMap[method] ?? "")}>
      {method}
    </Badge>
  );
}

function SectionAnchor({ id }: { id: string }) {
  return <div id={id} className="scroll-mt-20" />;
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground font-[family-name:var(--font-geist-mono)]">
      {children}
    </code>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
      {children}
    </p>
  );
}

function ParamBadge({ required }: { required?: boolean }) {
  return required ? (
    <Badge className="text-[9px] font-medium uppercase tracking-wider text-rose-400 border-rose-500/20 bg-rose-500/10 ml-1.5">
      required
    </Badge>
  ) : (
    <Badge className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground border-border bg-transparent ml-1.5">
      optional
    </Badge>
  );
}

// ─── Field table component ──────────────────────────────────────────────────

interface FieldRow {
  key: string;
  type: string;
  description: string;
  required?: boolean;
}

function FieldTable({ fields, label }: { fields: FieldRow[]; label?: string }) {
  return (
    <div>
      {label && <SectionLabel>{label}</SectionLabel>}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Field
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Type
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {fields.map((field) => (
              <tr key={field.key} className="hover:bg-accent/20">
                <td className="px-3 py-2 whitespace-nowrap">
                  <code className="text-[12px] font-[family-name:var(--font-geist-mono)] text-violet-400">
                    {field.key}
                  </code>
                  {field.required !== undefined && <ParamBadge required={field.required} />}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <code className="text-[12px] font-[family-name:var(--font-geist-mono)] text-muted-foreground">
                    {field.type}
                  </code>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{field.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Endpoint section component ─────────────────────────────────────────────

interface EndpointProps {
  id: string;
  method: string;
  path: string;
  title: string;
  description: string;
  icon: typeof Terminal;
  stepNumber?: number;
  requestFields?: FieldRow[];
  requestExample: string;
  responseFields: FieldRow[];
  responseExample: string;
  schemaDetail?: string;
  curlExample?: string;
  notes?: string[];
}

function EndpointSection({
  id,
  method,
  path,
  title,
  description,
  icon: Icon,
  stepNumber,
  requestFields,
  requestExample,
  responseFields,
  responseExample,
  schemaDetail,
  curlExample,
  notes,
}: EndpointProps) {
  const borderColor = method === "GET" ? "from-emerald-500" : "from-amber-500";
  const iconBg = method === "GET" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-violet-500/10 border-violet-500/20";
  const iconColor = method === "GET" ? "text-emerald-400" : "text-violet-400";

  return (
    <>
      <SectionAnchor id={id} />
      <Card className="border-border/50 overflow-hidden">
        <div className={cn("h-1 bg-gradient-to-r to-transparent", borderColor)} />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {stepNumber !== undefined && (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 text-[12px] font-bold text-violet-400 border border-violet-500/20 shrink-0">
                {stepNumber}
              </div>
            )}
            <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg border shrink-0", iconBg)}>
              <Icon className={cn("h-4 w-4", iconColor)} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 ml-0">
            <MethodBadge method={method} />
            <code className="text-sm font-[family-name:var(--font-geist-mono)] text-foreground">
              {path}
            </code>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

          {/* Request Parameters */}
          {requestFields && requestFields.length > 0 && (
            <FieldTable fields={requestFields} label="Request Parameters" />
          )}

          {/* Request Body */}
          <div>
            <SectionLabel>Request Body</SectionLabel>
            <CodeBlock id={`${id}-req`} code={requestExample} language="json" />
          </div>

          {/* cURL Example */}
          {curlExample && (
            <div>
              <SectionLabel>cURL Example</SectionLabel>
              <CodeBlock id={`${id}-curl`} code={curlExample} language="bash" />
            </div>
          )}

          {/* Response Fields */}
          <FieldTable fields={responseFields} label="Response Fields" />

          {/* Response Example */}
          <div>
            <SectionLabel>Response Example</SectionLabel>
            <CodeBlock id={`${id}-res`} code={responseExample} language="json" />
          </div>

          {/* Schema Detail */}
          {schemaDetail && (
            <div>
              <SectionLabel>Schema Detail</SectionLabel>
              <CodeBlock id={`${id}-schema`} code={schemaDetail} />
            </div>
          )}

          {/* Notes */}
          {notes && notes.length > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                  Notes
                </span>
              </div>
              <ul className="space-y-1">
                {notes.map((note, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-amber-400/60 shrink-0">&bull;</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Data ───────────────────────────────────────────────────────────────────

const COLLECTORS = [
  { name: "CollectorOpenSearch", priority: 200, description: "Open web search collector" },
  { name: "CollectorCRP", priority: 195, description: "CRP (Contextual Retrieval Pipeline) collector" },
  { name: "CollectorHyDE", priority: 190, description: "HyDE (Hypothetical Document Embeddings) collector" },
  { name: "CollectorWebPageReader", priority: 180, description: "Fetches and reads specific web pages for evidence" },
  { name: "CollectorSitePinned", priority: 175, description: "Targets pinned/known source URLs from the prompt spec" },
  { name: "CollectorPAN", priority: 170, description: "PAN (Parallel Augmented Navigation) collector" },
  { name: "CollectorAgenticRAG", priority: 160, description: "Agentic RAG collector with autonomous retrieval" },
  { name: "CollectorGraphRAG", priority: 150, description: "Graph-based RAG collector" },
  { name: "CollectorHTTP", priority: 100, description: "Direct HTTP fetch collector" },
];

const PROVIDERS = [
  { provider: "openai", model: "gpt-4o" },
  { provider: "google", model: "gemini-2.5-flash" },
  { provider: "grok", model: "grok-4-fast" },
];

interface TocItem {
  id: string;
  label: string;
  indent?: boolean;
  heading?: boolean;
}

const TOC_ITEMS: TocItem[] = [
  { id: "public-data-api", label: "Public Data API", heading: true },
  { id: "market-info", label: "Market Info", indent: true },
  { id: "por-pipeline-api", label: "PoR Pipeline API", heading: true },
  { id: "gateway", label: "Backend Gateway", indent: true },
  { id: "authentication", label: "Authentication", indent: true },
  { id: "step-prompt", label: "Step 1 - Prompt", indent: true },
  { id: "step-collect", label: "Step 2 - Collect", indent: true },
  { id: "step-quality-check", label: "Step 2.5 - Quality Check", indent: true },
  { id: "step-audit", label: "Step 3 - Audit", indent: true },
  { id: "step-judge", label: "Step 4 - Judge", indent: true },
  { id: "step-bundle", label: "Step 5 - Bundle", indent: true },
  { id: "step-resolve", label: "Resolve (all-in-one)", indent: true },
  { id: "validate", label: "Validate Market", indent: true },
  { id: "dispute", label: "Dispute", indent: true },
  { id: "dispute-llm", label: "Dispute (LLM)", indent: true },
  { id: "capabilities", label: "Capabilities", indent: true },
  { id: "collectors", label: "Collectors & Providers", indent: true },
  { id: "errors", label: "Error Handling", indent: true },
  { id: "quickstart", label: "Quick Start", indent: true },
];

// ─── Page Component ─────────────────────────────────────────────────────────

export default function DeveloperPage() {
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    const ids = TOC_ITEMS.map((item) => item.id);
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex gap-8">
      {/* Sticky sidebar TOC */}
      <nav className="hidden xl:block w-52 shrink-0">
        <div className="sticky top-20 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3 px-2">
            On this page
          </p>
          {TOC_ITEMS.map((item) =>
            item.heading ? (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mt-4 mb-1 px-2 first:mt-0 hover:text-muted-foreground transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "block text-xs py-1 px-2 rounded-md transition-colors",
                  item.indent && "ml-3",
                  activeSection === item.id
                    ? "text-foreground bg-accent/50 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                )}
              >
                {item.label}
              </a>
            )
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-8 pb-20">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Reference</h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl">
            Complete reference for the Cournot API. This page covers two categories of endpoints:
            the <strong className="text-foreground">Public Data API</strong> for querying stored market
            data (no authentication required), and the <strong className="text-foreground">Proof-of-Reasoning
            Pipeline API</strong> for resolving prediction markets through AI-driven evidence
            collection and cryptographic verification.
          </p>
        </div>

        {/* ━━━ PUBLIC DATA API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <SectionAnchor id="public-data-api" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">Public Data API</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            These endpoints serve stored market data directly from the Cournot platform. They
            require no authentication and are designed for third-party integrations &mdash; partners
            can use them to fetch market details, track resolution status, and display market
            information in their own applications.
          </p>
        </div>

        {/* ─── Market Info ──────────────────────────────────────────────── */}
        <EndpointSection
          id="market-info"
          method="GET"
          path="/markets/info?id={market_id}"
          title="Market Info"
          icon={Info}
          description="Returns full details for a given market stored on the Cournot platform, including current status, classification, external data, and AI resolution results (if resolved). This is a direct data endpoint — it reads from Cournot's database, not the AI Oracle."
          requestFields={[
            { key: "id", type: "integer", description: "The market ID to look up", required: true },
          ]}
          requestExample={`# No request body — pass id as a query parameter
GET https://interface.cournot.ai/play/polymarket/markets/info?id=185557`}
          curlExample={`curl "https://interface.cournot.ai/play/polymarket/markets/info?id=185557"`}
          responseFields={[
            { key: "code", type: "integer", description: "Response status code. 0 = success." },
            { key: "msg", type: "string", description: "Status message, e.g. \"Success\"" },
            { key: "data.market", type: "Market", description: "Full market object with all fields" },
            { key: "data.market.id", type: "integer", description: "Unique market identifier" },
            { key: "data.market.title", type: "string", description: "Market question title" },
            { key: "data.market.description", type: "string", description: "Resolution criteria (may contain HTML)" },
            { key: "data.market.platform_url", type: "string", description: "Link to the market on the source platform" },
            { key: "data.market.source", type: "string", description: "Source platform: \"polymarket\", \"kalshi\", \"limitless\", \"myriad\", \"predictfun\"" },
            { key: "data.market.status", type: "string", description: "Market status: \"monitoring\", \"pending_verification\", or \"resolved\"" },
            { key: "data.market.market_timing_type", type: "string", description: "\"event_based\" or \"time_based\"" },
            { key: "data.market.start_time", type: "string", description: "Market start time (ISO 8601)" },
            { key: "data.market.end_time", type: "string", description: "Market end time (ISO 8601)" },
            { key: "data.market.ai_prompt", type: "object", description: "Compiled AI prompt specification used for resolution" },
            { key: "data.market.ai_result", type: "string", description: "AI resolution result text (empty if not yet resolved)" },
            { key: "data.market.ai_outcome", type: "string", description: "AI outcome: \"YES\", \"NO\", \"INVALID\", or empty" },
            { key: "data.external_data", type: "ExternalData[]", description: "Array of external data sources collected for this market" },
            { key: "data.classification", type: "Classification", description: "Market category, subcategory, and competition" },
          ]}
          responseExample={`{
  "code": 0,
  "msg": "Success",
  "data": {
    "market": {
      "id": 185557,
      "title": "Will Denmark use a 4-3-3 starting lineup?",
      "description": "<resolution criteria...>",
      "platform_url": "https://polymarket.com/event/...",
      "source": "polymarket",
      "status": "monitoring",
      "market_timing_type": "time_based",
      "start_time": "2025-03-20T00:00:00Z",
      "end_time": "2026-03-26T21:00:00Z",
      "ai_prompt": { "..." : "..." },
      "ai_result": "",
      "ai_outcome": ""
    },
    "external_data": [
      {
        "collector": "espn_soccer",
        "data": {
          "event": "Denmark vs North Macedonia",
          "status": "pre",
          "venue": "Parken Stadium"
        }
      }
    ],
    "classification": {
      "category": "sports",
      "subcategory": "football",
      "competition": "FIFA World Cup Qualifiers"
    }
  }
}`}
          notes={[
            "No authentication required — this is a public endpoint for third-party integrations.",
            "This endpoint returns stored data from the Cournot platform, not live AI Oracle results.",
            "The ai_result and ai_outcome fields are empty strings until the market is resolved.",
            "The description field may contain HTML markup for resolution criteria.",
          ]}
        />

        {/* ━━━ POR PIPELINE API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <SectionAnchor id="por-pipeline-api" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">PoR Pipeline API</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            The Proof-of-Reasoning pipeline resolves prediction market questions in five sequential
            steps, producing a cryptographically verifiable PoR bundle. These endpoints call the
            AI Oracle directly and require authentication via an access code. All requests use
            a gateway envelope format.
          </p>
        </div>

        {/* Base URL & Gateway */}
        <SectionAnchor id="gateway" />
        <Card className="border-border/50 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                <Server className="h-4 w-4 text-violet-400" />
              </div>
              <CardTitle className="text-base">Backend Gateway</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              All API requests are made to a single gateway endpoint. The gateway accepts a
              standardized envelope and routes to internal pipeline paths. Responses are also wrapped
              in a gateway envelope.
            </p>

            <div>
              <SectionLabel>Base Endpoint</SectionLabel>
              <div className="flex items-center gap-2">
                <MethodBadge method="POST" />
                <code className="text-sm font-[family-name:var(--font-geist-mono)] text-foreground">
                  https://interface.cournot.ai/play/polymarket/ai_data
                </code>
              </div>
            </div>

            <div>
              <SectionLabel>Request Envelope</SectionLabel>
              <p className="text-xs text-muted-foreground mb-3">
                Every request must be wrapped in this envelope. The actual payload goes inside{" "}
                <InlineCode>post_data</InlineCode> as a JSON-stringified string.
              </p>
              <CodeBlock
                id="envelope"
                code={`{
  "code":      "<YOUR_ACCESS_CODE>",
  "post_data": "<STRINGIFIED_JSON_PAYLOAD>",
  "path":      "<INTERNAL_PATH>",
  "method":    "<HTTP_METHOD>"
}`}
                language="json"
              />
            </div>

            <FieldTable
              label="Envelope Fields"
              fields={[
                { key: "code", type: "string", description: "Your API access code for authentication", required: true },
                { key: "post_data", type: "string", description: "JSON-stringified request payload. Use \"{}\" for GET requests with no body.", required: true },
                { key: "path", type: "string", description: "Internal pipeline path, e.g. \"/step/prompt\" or \"/capabilities\"", required: true },
                { key: "method", type: "string", description: "HTTP method for the internal route: \"POST\" or \"GET\"", required: true },
              ]}
            />

            <div>
              <SectionLabel>Gateway Response Envelope</SectionLabel>
              <p className="text-xs text-muted-foreground mb-3">
                All responses are wrapped in this envelope. A successful call returns{" "}
                <InlineCode>code: 0</InlineCode>. The step-level response is JSON-stringified
                inside <InlineCode>data.result</InlineCode> and must be parsed separately.
              </p>
              <CodeBlock
                id="response-envelope"
                code={`{
  "code": 0,
  "msg":  "Success",
  "data": {
    "result": "<STRINGIFIED_STEP_RESPONSE>"
  }
}`}
                language="json"
              />
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <SectionAnchor id="authentication" />
        <Card className="border-border/50 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-transparent" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Hash className="h-4 w-4 text-blue-400" />
              </div>
              <CardTitle className="text-base">Authentication</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              All requests require a valid access code passed in the <InlineCode>code</InlineCode> field
              of the gateway envelope. If the code is invalid or missing, the gateway returns error
              code <InlineCode>4100</InlineCode>.
            </p>
            <CodeBlock
              id="auth-example"
              code={`// Valid request
{
  "code": "YOUR_ACCESS_CODE",  // Required in every request
  "post_data": "{}",
  "path": "/capabilities",
  "method": "GET"
}

// Error response for invalid code
{
  "code": 4100,
  "msg": "Invalid access code",
  "data": null
}`}
              language="json"
            />
          </CardContent>
        </Card>

        {/* Pipeline overview */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                <GitBranch className="h-4 w-4 text-violet-400" />
              </div>
              <CardTitle className="text-base">Pipeline Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The PoR pipeline consists of five sequential steps. Each step produces artifacts consumed
              by subsequent steps. Steps must be called in order.
            </p>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {[
                { num: 1, name: "Prompt", icon: Terminal, id: "step-prompt" },
                { num: 2, name: "Collect", icon: Search, id: "step-collect" },
                { num: "2.5", name: "Quality", icon: ShieldCheck, id: "step-quality-check" },
                { num: 3, name: "Audit", icon: Scale, id: "step-audit" },
                { num: 4, name: "Judge", icon: Gavel, id: "step-judge" },
                { num: 5, name: "Bundle", icon: PackageCheck, id: "step-bundle" },
              ].map((step, i, arr) => (
                <div key={step.num} className="flex items-center gap-1 shrink-0">
                  <a
                    href={`#${step.id}`}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                  >
                    <step.icon className="h-3.5 w-3.5" />
                    <span>
                      {step.num}. {step.name}
                    </span>
                  </a>
                  {i < arr.length - 1 && (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Supported paths summary table */}
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Method
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Path
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Description
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {[
                    { method: "POST", path: "/step/prompt", desc: "Compile question into prompt spec + tool plan", anchor: "step-prompt" },
                    { method: "POST", path: "/step/collect", desc: "Gather evidence from external sources", anchor: "step-collect" },
                    { method: "POST", path: "/step/quality_check", desc: "Evaluate evidence quality, produce retry hints", anchor: "step-quality-check" },
                    { method: "POST", path: "/step/audit", desc: "Produce reasoning trace from evidence", anchor: "step-audit" },
                    { method: "POST", path: "/step/judge", desc: "Determine outcome and confidence", anchor: "step-judge" },
                    { method: "POST", path: "/step/bundle", desc: "Build cryptographic PoR bundle", anchor: "step-bundle" },
                    { method: "POST", path: "/step/resolve", desc: "Run full pipeline in a single call", anchor: "step-resolve" },
                    { method: "POST", path: "/validate", desc: "Validate and compile a market query", anchor: "validate" },
                    { method: "POST", path: "/dispute", desc: "Structured dispute-driven rerun", anchor: "dispute" },
                    { method: "POST", path: "/dispute/llm", desc: "LLM-assisted dispute from 3 user inputs", anchor: "dispute-llm" },
                    { method: "GET", path: "/capabilities", desc: "List available providers, collectors, and steps", anchor: "capabilities" },
                  ].map((row) => (
                    <tr key={row.path} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <MethodBadge method={row.method} />
                      </td>
                      <td className="px-4 py-2.5">
                        <a href={`#${row.anchor}`} className="group/link flex items-center gap-1.5">
                          <code className="text-[13px] font-[family-name:var(--font-geist-mono)] text-foreground group-hover/link:text-violet-400 transition-colors">
                            {row.path}
                          </code>
                        </a>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{row.desc}</td>
                      <td className="px-4 py-2.5">
                        <a href={`#${row.anchor}`}>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              For <InlineCode>GET</InlineCode> requests, set <InlineCode>post_data</InlineCode> to{" "}
              <InlineCode>{`"{}"`}</InlineCode> in the envelope.
            </p>
          </CardContent>
        </Card>

        {/* ─── Step 1: Prompt ─────────────────────────────────────────────── */}
        <EndpointSection
          id="step-prompt"
          method="POST"
          path="/step/prompt"
          title="Prompt Compilation"
          stepNumber={1}
          icon={Terminal}
          description="Compiles a natural-language market question into a structured prompt specification and tool plan. This is the entry point of the pipeline. The prompt spec defines the resolution rules, allowed sources, and prediction semantics. The tool plan specifies which data requirements need to be fulfilled and from which sources. When the query involves a scheduled event, the LLM compiler auto-detects a temporal constraint and includes it in prompt_spec.extra.temporal_constraint — extract and pass this to /step/audit and /step/judge."
          requestFields={[
            { key: "user_input", type: "string", description: "The natural-language market question to resolve", required: true },
            { key: "strict_mode", type: "boolean", description: "When true, only official sources are allowed. Defaults to false.", required: false },
            { key: "llm_provider", type: "string", description: "LLM provider override (e.g. \"openai\", \"anthropic\", \"google\")", required: false },
            { key: "llm_model", type: "string", description: "LLM model override (e.g. \"gpt-4o\")", required: false },
          ]}
          requestExample={`{
  "user_input": "Will Bitcoin exceed 100k by March 2025?",
  "strict_mode": false
}`}
          curlExample={`curl -X POST 'https://interface.cournot.ai/play/polymarket/ai_data' \\
  -H 'Content-Type: application/json' \\
  --max-time 300 \\
  -d '{
    "code": "YOUR_CODE",
    "post_data": "{\\"user_input\\": \\"Will Bitcoin exceed 100k by March 2025?\\", \\"strict_mode\\": false}",
    "path": "/step/prompt",
    "method": "POST"
  }'`}
          responseFields={[
            { key: "ok", type: "boolean", description: "Whether the step succeeded" },
            { key: "market_id", type: "string", description: "Generated market identifier, e.g. \"mk_3f5b9c7e\"" },
            { key: "prompt_spec", type: "PromptSpec", description: "Structured specification including market definition, resolution rules, and data requirements" },
            { key: "prompt_spec.extra.temporal_constraint", type: "object | null", description: "Auto-detected temporal constraint with { enabled, event_time, reason }. Extract and pass to /step/audit and /step/judge." },
            { key: "tool_plan", type: "ToolPlan", description: "Execution plan referencing requirements and sources to query" },
            { key: "metadata", type: "object", description: "Compiler info, strict_mode flag, requirement count" },
            { key: "error", type: "string | null", description: "Error message if compilation failed" },
          ]}
          responseExample={`{
  "ok": true,
  "market_id": "mk_3f5b9c7e",
  "prompt_spec": {
    "schema_version": "v1",
    "task_type": "prediction_resolution",
    "market": {
      "market_id": "mk_3f5b9c7e",
      "question": "Will Bitcoin exceed 100k by March 2025?",
      "market_type": "binary",
      "possible_outcomes": ["YES", "NO"],
      "resolution_rules": {
        "rules": [
          { "rule_id": "r1", "description": "...", "priority": 1 }
        ]
      }
    },
    "prediction_semantics": {
      "target_entity": "Bitcoin",
      "predicate": "exceeds",
      "threshold": "100000 USD",
      "timeframe": "by March 2025"
    },
    "data_requirements": [
      {
        "requirement_id": "req_01",
        "description": "Current BTC price data",
        "source_targets": [...]
      }
    ]
  },
  "tool_plan": {
    "plan_id": "plan_abc123",
    "requirements": ["req_01"],
    "sources": ["source_coinmarketcap"],
    "min_provenance_tier": 1,
    "allow_fallbacks": true
  },
  "metadata": {
    "compiler": "prompt-compiler-v2",
    "strict_mode": false,
    "requirement_count": 3
  },
  "error": null
}`}
          schemaDetail={`PromptSpec {
  schema_version      "v1"
  task_type           "prediction_resolution"
  market {
    market_id, question, event_definition, timezone
    resolution_deadline, resolution_window { start, end }
    resolution_rules.rules[] { rule_id, description, priority }
    allowed_sources[]  { source_id, kind, allow, min_provenance_tier }
    market_type        "binary"
    possible_outcomes  ["YES", "NO"]
  }
  prediction_semantics { target_entity, predicate, threshold, timeframe }
  data_requirements[] {
    requirement_id, description
    source_targets[] { source_id, uri, method, expected_content_type }
    selection_policy  { strategy, min_sources, max_sources, quorum }
  }
  extra {
    strict_mode, compiler, assumptions[]
    confidence_policy { min_confidence_for_yesno, default_confidence }
    temporal_constraint? {       // auto-detected for scheduled events
      enabled        true
      event_time     ISO 8601 UTC
      reason         string
    }
  }
}

ToolPlan {
  plan_id, requirements[], sources[]
  min_provenance_tier, allow_fallbacks
}`}
          notes={[
            "This step has no dependencies and can be called directly with just user_input.",
            "The generated prompt_spec and tool_plan are passed to all subsequent steps.",
            "strict_mode constrains the pipeline to only use official/authoritative sources.",
          ]}
        />

        {/* ─── Step 2: Collect ────────────────────────────────────────────── */}
        <EndpointSection
          id="step-collect"
          method="POST"
          path="/step/collect"
          title="Evidence Collection"
          stepNumber={2}
          icon={Search}
          description="Runs the configured collector agents to gather evidence bundles from external sources. Each collector queries different source types (web search, APIs, databases) and returns structured evidence items with provenance metadata. Multiple collectors can run in parallel. When retrying after a quality check failure, pass the quality_feedback field with retry hints to adjust search strategy."
          requestFields={[
            { key: "prompt_spec", type: "PromptSpec", description: "Structured prompt specification from Step 1", required: true },
            { key: "tool_plan", type: "ToolPlan", description: "Execution plan from Step 1", required: true },
            { key: "collectors", type: "string[]", description: "List of collector names to run. See /capabilities for available collectors.", required: false },
            { key: "include_raw_content", type: "boolean", description: "Whether to include raw fetched content in the response. Defaults to false.", required: false },
            { key: "quality_feedback", type: "object", description: "Retry hints from /step/quality_check scorecard.retry_hints. Adjusts search queries, domains, and focus areas.", required: false },
            { key: "llm_provider", type: "string", description: "LLM provider override", required: false },
            { key: "llm_model", type: "string", description: "LLM model override", required: false },
          ]}
          requestExample={`{
  "prompt_spec": { ... },
  "tool_plan":   { ... },
  "collectors":  ["CollectorWebPageReader", "CollectorOpenSearch"],
  "include_raw_content": false
}`}
          responseFields={[
            { key: "ok", type: "boolean", description: "Whether collection completed successfully" },
            { key: "collectors_used", type: "string[]", description: "Names of collectors that actually ran" },
            { key: "evidence_bundles", type: "EvidenceBundle[]", description: "Array of evidence bundles, one per collector" },
            { key: "execution_logs", type: "ExecutionLog[]", description: "Per-call timing, tool name, input/output, and errors" },
            { key: "errors", type: "string[]", description: "Non-fatal errors encountered during collection" },
          ]}
          responseExample={`{
  "ok": true,
  "collectors_used": ["CollectorWebPageReader", "CollectorOpenSearch"],
  "evidence_bundles": [
    {
      "bundle_id": "eb_a1b2c3",
      "market_id": "mk_3f5b9c7e",
      "collector_name": "CollectorWebPageReader",
      "weight": 1.0,
      "items": [
        {
          "evidence_id": "ev_abc123",
          "source_uri": "https://...",
          "source_name": "CoinMarketCap",
          "tier": 1,
          "fetched_at": "2025-01-15T10:30:00Z",
          "content_hash": "sha256:a1b2c3...",
          "parsed_excerpt": "Bitcoin is currently trading at ...",
          "success": true,
          "extracted_fields": {
            "confidence": 0.85,
            "resolution_status": "OPEN"
          }
        }
      ],
      "collected_at": "2025-01-15T10:30:05Z",
      "execution_time_ms": 4523
    }
  ],
  "execution_logs": [
    {
      "plan_id": "plan_abc123",
      "calls": [
        {
          "tool": "CollectorWebPageReader",
          "started_at": "...",
          "ended_at": "...",
          "error": null
        }
      ]
    }
  ],
  "errors": []
}`}
          schemaDetail={`EvidenceBundle {
  bundle_id, market_id, plan_id, collector_name
  weight             number (default 1.0)
  items[] {
    evidence_id      hex hash
    requirement_id   links back to data_requirements
    provenance {
      source_id, source_uri, tier, fetched_at
      content_hash   SHA-256 of raw content
      cache_hit      boolean
    }
    content_type, parsed_value, success, error
    extracted_fields { ... }
  }
  collected_at, execution_time_ms
  requirements_fulfilled[], requirements_unfulfilled[]
}

ExecutionLog {
  plan_id
  calls[] { tool, input, output, started_at, ended_at, error }
  started_at, ended_at
}`}
          notes={[
            "If collectors is omitted, the pipeline uses a default set based on the tool plan.",
            "Collectors run in priority order (highest first). Higher priority collectors are considered more reliable.",
            "Evidence items include provenance metadata (source_uri, tier, content_hash) for auditability.",
            "Set include_raw_content: true to receive the full fetched content (increases response size significantly).",
          ]}
        />

        {/* ─── Step 2.5: Quality Check ──────────────────────────────────── */}
        <EndpointSection
          id="step-quality-check"
          method="POST"
          path="/step/quality_check"
          title="Evidence Quality Check"
          icon={ShieldCheck}
          description="Evaluates collected evidence quality before proceeding to audit. Returns a scorecard with quality signals and machine-readable retry hints. If quality is below threshold, retry /step/collect with the retry_hints as quality_feedback. This step is optional but recommended — if you skip it, audit and judge still work."
          requestFields={[
            { key: "prompt_spec", type: "PromptSpec", description: "Compiled prompt specification from Step 1", required: true },
            { key: "evidence_bundles", type: "EvidenceBundle[]", description: "Evidence bundles from Step 2", required: true },
          ]}
          requestExample={`{
  "prompt_spec":      { ... },
  "evidence_bundles": [ ... ]
}`}
          responseFields={[
            { key: "ok", type: "boolean", description: "Whether the quality check ran successfully" },
            { key: "scorecard", type: "QualityScorecard | null", description: "Quality scorecard with metrics, flags, and retry hints" },
            { key: "scorecard.source_match", type: "\"FULL\" | \"PARTIAL\" | \"NONE\"", description: "How well evidence sources match required domains" },
            { key: "scorecard.data_type_match", type: "boolean", description: "Whether evidence data types match what was requested" },
            { key: "scorecard.collector_agreement", type: "\"AGREE\" | \"DISAGREE\" | \"SINGLE\"", description: "Whether multiple collectors agree on the outcome" },
            { key: "scorecard.requirements_coverage", type: "number (0-1)", description: "Fraction of data requirements covered by evidence" },
            { key: "scorecard.quality_level", type: "\"HIGH\" | \"MEDIUM\" | \"LOW\"", description: "Overall quality assessment" },
            { key: "scorecard.quality_flags", type: "string[]", description: "Issue flags like \"source_mismatch\", \"requirements_gap\"" },
            { key: "scorecard.meets_threshold", type: "boolean", description: "true = proceed to audit, false = consider retrying" },
            { key: "scorecard.recommendations", type: "string[]", description: "Human-readable improvement suggestions" },
            { key: "scorecard.retry_hints", type: "object", description: "Machine-readable hints to pass as quality_feedback to /step/collect" },
            { key: "meets_threshold", type: "boolean", description: "Top-level convenience duplicate of scorecard.meets_threshold" },
            { key: "errors", type: "string[]", description: "Non-fatal errors" },
          ]}
          responseExample={`{
  "ok": true,
  "scorecard": {
    "source_match": "PARTIAL",
    "data_type_match": true,
    "collector_agreement": "AGREE",
    "requirements_coverage": 0.65,
    "quality_level": "MEDIUM",
    "quality_flags": ["source_mismatch"],
    "meets_threshold": false,
    "recommendations": [
      "Try broader search terms for requirement req_001"
    ],
    "retry_hints": {
      "search_queries": ["bitcoin price 2025 prediction"],
      "required_domains": ["coinmarketcap.com"],
      "skip_domains": [],
      "data_type_hint": null,
      "focus_requirements": ["req_001"],
      "collector_guidance": "Focus on price data sources"
    }
  },
  "meets_threshold": false,
  "errors": []
}`}
          notes={[
            "Call after /step/collect. If meets_threshold is false and retry_hints is non-empty, retry /step/collect with quality_feedback set to retry_hints.",
            "Retry up to 2 times. Merge new evidence bundles with existing ones.",
            "Pass the scorecard to /step/audit and /step/judge as quality_scorecard so they are aware of evidence quality issues.",
            "This step is optional — audit and judge work without it, you just lose the quality feedback loop.",
          ]}
        />

        {/* ─── Step 3: Audit ──────────────────────────────────────────────── */}
        <EndpointSection
          id="step-audit"
          method="POST"
          path="/step/audit"
          title="Evidence Audit"
          stepNumber={3}
          icon={Scale}
          description="Analyzes collected evidence against the prompt specification to produce a structured reasoning trace. The audit step evaluates each piece of evidence, identifies conflicts, builds reasoning chains, and produces a preliminary outcome assessment with confidence score. When temporal_constraint is provided, the auditor computes temporal status (FUTURE/ACTIVE/PAST) and may force INVALID for future events."
          requestFields={[
            { key: "prompt_spec", type: "PromptSpec", description: "Structured prompt specification from Step 1", required: true },
            { key: "evidence_bundles", type: "EvidenceBundle[]", description: "Evidence bundles from Step 2", required: true },
            { key: "quality_scorecard", type: "object | null", description: "Quality scorecard from /step/quality_check. Informs auditor about evidence quality issues.", required: false },
            { key: "temporal_constraint", type: "object | null", description: "From prompt_spec.extra.temporal_constraint. Enables temporal guard (FUTURE/ACTIVE/PAST status).", required: false },
            { key: "llm_provider", type: "string", description: "LLM provider override", required: false },
            { key: "llm_model", type: "string", description: "LLM model override", required: false },
          ]}
          requestExample={`{
  "prompt_spec":          { ... },
  "evidence_bundles":     [ ... ],
  "quality_scorecard":    { ... },
  "temporal_constraint":  {
    "enabled": true,
    "event_time": "2027-05-31T00:00:00Z",
    "reason": "Champions League final"
  }
}`}
          responseFields={[
            { key: "ok", type: "boolean", description: "Whether audit succeeded" },
            { key: "reasoning_trace", type: "ReasoningTrace", description: "Structured trace with reasoning steps, conflict detection, and preliminary outcome" },
            { key: "errors", type: "string[]", description: "Errors encountered during reasoning" },
          ]}
          responseExample={`{
  "ok": true,
  "reasoning_trace": {
    "trace_id": "tr_xyz789",
    "market_id": "mk_3f5b9c7e",
    "steps": [
      {
        "step_id": "s1",
        "step_type": "evidence_evaluation",
        "description": "Evaluate BTC price data from CoinMarketCap",
        "evidence_refs": [
          {
            "evidence_id": "ev_abc123",
            "source_id": "source_coinmarketcap",
            "field_used": "current_price",
            "value_at_reference": "97500"
          }
        ],
        "conclusion": "BTC is currently at $97,500, close to but below the $100k threshold",
        "confidence_delta": 0.1
      }
    ],
    "conflicts": [],
    "evidence_summary": "Multiple sources confirm BTC near $97.5k ...",
    "reasoning_summary": "Based on current price trajectory ...",
    "preliminary_outcome": "YES",
    "preliminary_confidence": 0.72,
    "recommended_rule_id": "r1"
  },
  "errors": []
}`}
          schemaDetail={`ReasoningTrace {
  trace_id, market_id, bundle_id
  steps[] {
    step_id, step_type, description
    evidence_refs[] {
      evidence_id, requirement_id, source_id
      field_used, value_at_reference
    }
    rule_id, input_summary, output_summary
    conclusion, confidence_delta
    depends_on[], metadata
  }
  conflicts[]
  evidence_summary       human-readable text
  reasoning_summary      human-readable text
  preliminary_outcome    "YES" | "NO" | "INVALID"
  preliminary_confidence number (0-1)
  recommended_rule_id
}`}
          notes={[
            "The preliminary_outcome here is advisory. The final outcome is determined by the Judge step.",
            "The reasoning trace captures step-by-step logic that can be independently verified.",
            "Conflicts between evidence sources are explicitly identified and recorded.",
          ]}
        />

        {/* ─── Step 4: Judge ──────────────────────────────────────────────── */}
        <EndpointSection
          id="step-judge"
          method="POST"
          path="/step/judge"
          title="Judgment"
          stepNumber={4}
          icon={Gavel}
          description="Applies resolution rules to the evidence and reasoning trace to produce a final verdict. The judge evaluates the reasoning validity, applies confidence adjustments, and determines the definitive outcome. Includes an independent LLM review of the reasoning process. When temporal_constraint is provided, computes temporal status and may force INVALID for future or active events."
          requestFields={[
            { key: "prompt_spec", type: "PromptSpec", description: "Structured prompt specification from Step 1", required: true },
            { key: "evidence_bundles", type: "EvidenceBundle[]", description: "Evidence bundles from Step 2", required: true },
            { key: "reasoning_trace", type: "ReasoningTrace", description: "Reasoning trace from Step 3", required: true },
            { key: "quality_scorecard", type: "object | null", description: "Quality scorecard from /step/quality_check. Informs judge about evidence quality issues.", required: false },
            { key: "temporal_constraint", type: "object | null", description: "From prompt_spec.extra.temporal_constraint. Enables temporal guard (FUTURE/ACTIVE/PAST status).", required: false },
            { key: "llm_provider", type: "string", description: "LLM provider override", required: false },
            { key: "llm_model", type: "string", description: "LLM model override", required: false },
          ]}
          requestExample={`{
  "prompt_spec":         { ... },
  "evidence_bundles":    [ ... ],
  "reasoning_trace":     { ... },
  "quality_scorecard":   { ... },
  "temporal_constraint": {
    "enabled": true,
    "event_time": "2027-05-31T00:00:00Z",
    "reason": "Champions League final"
  }
}`}
          responseFields={[
            { key: "ok", type: "boolean", description: "Whether judgment succeeded" },
            { key: "verdict", type: "Verdict", description: "Full verdict object with cryptographic hashes and LLM review" },
            { key: "outcome", type: "string", description: "Final outcome: \"YES\", \"NO\", or \"INVALID\"" },
            { key: "confidence", type: "number", description: "Final confidence score between 0 and 1" },
            { key: "errors", type: "string[]", description: "Errors encountered during judgment" },
          ]}
          responseExample={`{
  "ok": true,
  "outcome": "YES",
  "confidence": 0.78,
  "verdict": {
    "market_id": "mk_3f5b9c7e",
    "outcome": "YES",
    "confidence": 0.78,
    "resolution_time": "2025-01-15T10:31:00Z",
    "resolution_rule_id": "r1",
    "prompt_spec_hash": "0xabc123...",
    "evidence_root": "0xdef456...",
    "reasoning_root": "0x789ghi...",
    "justification_hash": "0xjkl012...",
    "selected_leaf_refs": ["ev_abc123", "ev_def456"],
    "metadata": {
      "strict_mode": false,
      "trace_id": "tr_xyz789",
      "justification": "Evidence strongly suggests BTC will exceed $100k ...",
      "llm_review": {
        "outcome": "YES",
        "confidence": 0.78,
        "reasoning_valid": true,
        "reasoning_issues": [],
        "confidence_adjustments": [],
        "final_justification": "The reasoning chain is sound ..."
      }
    }
  },
  "errors": []
}`}
          schemaDetail={`Verdict {
  market_id, outcome, confidence
  resolution_time, resolution_rule_id
  prompt_spec_hash     hex hash
  evidence_root        hex Merkle root
  reasoning_root       hex Merkle root
  justification_hash   hex hash
  selected_leaf_refs[] evidence_id references
  metadata {
    strict_mode, trace_id, bundle_id
    bundle_count, step_count, conflict_count
    justification        human-readable string
    llm_review {
      outcome, confidence, resolution_rule_id
      reasoning_valid    boolean
      reasoning_issues[], confidence_adjustments[]
      final_justification
    }
  }
}`}
          notes={[
            "The outcome is one of: \"YES\", \"NO\", or \"INVALID\" (when evidence is insufficient or temporal guard triggers).",
            "Confidence ranges from 0 to 1. Values below the configured min_confidence_for_yesno threshold result in \"INVALID\".",
            "The verdict includes Merkle root hashes for cryptographic verification of the full reasoning chain.",
            "The llm_review provides an independent assessment of whether the reasoning is sound.",
            "Temporal status: FUTURE (event_time > now) → INVALID; ACTIVE (now - event_time < 24h) → INVALID unless concluded; PAST (≥24h) → normal resolution.",
          ]}
        />

        {/* ─── Step 5: Bundle ─────────────────────────────────────────────── */}
        <EndpointSection
          id="step-bundle"
          method="POST"
          path="/step/bundle"
          title="Proof-of-Reasoning Bundle"
          stepNumber={5}
          icon={PackageCheck}
          description="Hashes all pipeline artifacts into a cryptographic Proof-of-Reasoning (PoR) bundle with Merkle roots. This is the final step that produces a tamper-evident, verifiable record of the entire resolution process. The PoR root hash can be used to independently verify that no artifacts were modified after resolution."
          requestFields={[
            { key: "prompt_spec", type: "PromptSpec", description: "Structured prompt specification from Step 1", required: true },
            { key: "evidence_bundles", type: "EvidenceBundle[]", description: "Evidence bundles from Step 2", required: true },
            { key: "reasoning_trace", type: "ReasoningTrace", description: "Reasoning trace from Step 3", required: true },
            { key: "verdict", type: "Verdict", description: "Verdict object from Step 4", required: true },
          ]}
          requestExample={`{
  "prompt_spec":      { ... },
  "evidence_bundles": [ ... ],
  "reasoning_trace":  { ... },
  "verdict":          { ... }
}`}
          responseFields={[
            { key: "ok", type: "boolean", description: "Whether bundling succeeded" },
            { key: "por_bundle", type: "PoRBundle", description: "Complete Proof-of-Reasoning bundle with all hashes and the full verdict" },
            { key: "por_root", type: "string", description: "Top-level Merkle root hash, e.g. \"0xba9ec9c2...\"" },
            { key: "roots", type: "object", description: "Individual root hashes for each pipeline artifact" },
            { key: "errors", type: "string[]", description: "Errors encountered during bundling" },
          ]}
          responseExample={`{
  "ok": true,
  "por_root": "0xba9ec9c2d4e6f8a0b1c3d5e7f9a2b4c6d8e0f1a3",
  "roots": {
    "prompt_spec_hash": "0xabc123...",
    "evidence_root":    "0xdef456...",
    "reasoning_root":   "0x789ghi...",
    "por_root":         "0xba9ec9c2..."
  },
  "por_bundle": {
    "schema_version": "1.0",
    "protocol_version": "1.0",
    "market_id": "mk_3f5b9c7e",
    "prompt_spec_hash": "0xabc123...",
    "evidence_root": "0xdef456...",
    "reasoning_root": "0x789ghi...",
    "verdict_hash": "0xjkl012...",
    "por_root": "0xba9ec9c2...",
    "verdict": { ... },
    "tee_attestation": null,
    "signatures": {},
    "created_at": "2025-01-15T10:31:05Z",
    "metadata": {
      "pipeline_version": "2.1.0",
      "mode": "live"
    }
  },
  "errors": []
}`}
          schemaDetail={`PoRBundle {
  schema_version, protocol_version, market_id
  prompt_spec_hash   hex
  evidence_root      hex
  reasoning_root     hex
  verdict_hash       hex
  por_root           hex (master Merkle root)
  verdict            full Verdict object
  tee_attestation    null | object
  signatures         {}
  created_at, metadata { pipeline_version, mode }
}

roots {
  prompt_spec_hash   hex
  evidence_root      hex
  reasoning_root     hex
  por_root           hex
}`}
          notes={[
            "The por_root is the master Merkle root that covers all other roots. Use it for single-hash verification.",
            "Individual roots (prompt_spec_hash, evidence_root, reasoning_root) enable partial verification of specific pipeline stages.",
            "tee_attestation and signatures are reserved for future TEE (Trusted Execution Environment) support.",
          ]}
        />

        {/* ─── Resolve (all-in-one) ──────────────────────────────────────── */}
        <EndpointSection
          id="step-resolve"
          method="POST"
          path="/step/resolve"
          title="Resolve (All-in-One)"
          icon={Zap}
          description="Run the full resolution pipeline (collect → quality check → audit → judge → PoR bundle) in a single call. Quality check and temporal constraint are handled automatically — temporal_constraint is extracted from prompt_spec.extra and quality check runs with a retry loop by default."
          requestFields={[
            { key: "prompt_spec", type: "PromptSpec", description: "Compiled prompt specification from /step/prompt", required: true },
            { key: "tool_plan", type: "ToolPlan", description: "Tool execution plan from /step/prompt", required: true },
            { key: "collectors", type: "string[]", description: "Which collectors to use (default: [\"CollectorWebPageReader\"])", required: false },
            { key: "execution_mode", type: "string", description: "\"production\", \"development\" (default), or \"test\"", required: false },
            { key: "enable_quality_check", type: "boolean", description: "Run quality check with retry loop after collection (default: true)", required: false },
            { key: "max_quality_retries", type: "integer", description: "Max quality check retry iterations, 0–5 (default: 2)", required: false },
            { key: "llm_provider", type: "string", description: "LLM provider override", required: false },
            { key: "llm_model", type: "string", description: "LLM model override", required: false },
          ]}
          requestExample={`{
  "prompt_spec": { ... },
  "tool_plan":   { ... },
  "collectors":  ["CollectorOpenSearch"],
  "execution_mode": "development",
  "enable_quality_check": true,
  "max_quality_retries": 2
}`}
          responseFields={[
            { key: "ok", type: "boolean", description: "Whether the full pipeline succeeded" },
            { key: "outcome", type: "string", description: "\"YES\", \"NO\", or \"INVALID\"" },
            { key: "confidence", type: "number", description: "Final confidence score 0–1" },
            { key: "por_root", type: "string", description: "PoR Merkle root hash" },
            { key: "artifacts", type: "object", description: "All pipeline artifacts (evidence_bundles, reasoning_trace, verdict, por_bundle)" },
            { key: "errors", type: "string[]", description: "Non-fatal errors" },
          ]}
          responseExample={`{
  "ok": true,
  "outcome": "YES",
  "confidence": 0.85,
  "por_root": "0xba9ec9c2...",
  "artifacts": {
    "evidence_bundles": [ ... ],
    "reasoning_trace": { ... },
    "verdict": { ... },
    "por_bundle": { ... }
  },
  "errors": []
}`}
          notes={[
            "No extra fields needed for quality check or temporal constraint — both are fully automatic.",
            "Set enable_quality_check: false to skip the quality check loop and go directly to audit.",
            "This is equivalent to calling prompt → collect → quality_check → audit → judge → bundle individually.",
          ]}
        />

        {/* ─── Validate ────────────────────────────────────────────────────── */}
        <EndpointSection
          id="validate"
          method="POST"
          path="/validate"
          title="Validate Market"
          icon={FileCheck}
          description="Validate and compile a market query in a single call. Runs LLM validation (classify market type, validate fields, assess resolvability), prompt compilation (PromptSpec + ToolPlan), and source reachability probes in parallel. The response includes both the validation result and the compiled prompt_spec/tool_plan ready for /step/collect."
          requestFields={[
            { key: "user_input", type: "string", description: "The prediction market query to validate and compile (1–8000 chars)", required: true },
            { key: "strict_mode", type: "boolean", description: "Enable strict mode for deterministic hashing (default: true)", required: false },
            { key: "llm_provider", type: "string", description: "LLM provider override", required: false },
            { key: "llm_model", type: "string", description: "LLM model override", required: false },
          ]}
          requestExample={`{
  "user_input": "Highest temperature in Buenos Aires on March 1?",
  "strict_mode": true
}`}
          responseFields={[
            { key: "ok", type: "boolean", description: "Whether validation and compilation succeeded" },
            { key: "classification", type: "object", description: "Market type classification with confidence and rationale" },
            { key: "classification.market_type", type: "string", description: "Detected type: FINANCIAL_PRICE, TEMPERATURE, SPORTS_MATCH, BINARY_EVENT, etc." },
            { key: "validation", type: "object", description: "Checks passed/failed with severity and suggestions" },
            { key: "resolvability", type: "object", description: "Score (0–100), level (LOW/MEDIUM/HIGH/VERY_HIGH), risk factors" },
            { key: "source_reachability", type: "array", description: "URL probe results — reachable, status_code, errors" },
            { key: "prompt_spec", type: "PromptSpec", description: "Compiled prompt specification (pass to /step/collect)" },
            { key: "tool_plan", type: "ToolPlan", description: "Tool execution plan (pass to /step/collect)" },
            { key: "errors", type: "string[]", description: "Non-fatal errors" },
          ]}
          responseExample={`{
  "ok": true,
  "classification": {
    "market_type": "TEMPERATURE",
    "confidence": 0.95,
    "detection_rationale": "Contains 'temperature', city name, and date"
  },
  "validation": {
    "checks_passed": ["U-02", "U-03", "TEMP-01"],
    "checks_failed": [
      {
        "check_id": "TEMP-04",
        "severity": "warning",
        "message": "No fallback data source specified.",
        "suggestion": "Add an alternative source if Wunderground is unavailable."
      }
    ]
  },
  "resolvability": {
    "score": 35,
    "level": "MEDIUM",
    "risk_factors": [
      { "factor": "Single data source with no fallback", "points": 30 }
    ]
  },
  "source_reachability": [
    { "url": "https://www.wunderground.com", "reachable": true, "status_code": 200, "error": null }
  ],
  "prompt_spec": { "..." : "..." },
  "tool_plan": { "..." : "..." },
  "errors": []
}`}
          notes={[
            "Risk levels: LOW (0–15) = auto-resolution OK, MEDIUM (16–35) = may have difficulty, HIGH (36–55) = high failure risk, VERY_HIGH (56+) = unlikely to resolve.",
            "The prompt_spec and tool_plan can be passed directly to /step/collect or /step/resolve.",
            "Source reachability detects Cloudflare blocks, paywalls, and timeouts on data source URLs.",
          ]}
        />

        {/* ─── Dispute ─────────────────────────────────────────────────────── */}
        <EndpointSection
          id="dispute"
          method="POST"
          path="/dispute"
          title="Dispute (Structured)"
          icon={MessageSquareWarning}
          description="Stateless dispute-driven rerun of audit/judge steps. Provide all context artifacts and a structured dispute request. In reasoning_only mode, reruns audit and judge with existing evidence. In full_rerun mode, re-collects evidence first. Returns updated artifacts with a before/after diff."
          requestFields={[
            { key: "mode", type: "\"reasoning_only\" | \"full_rerun\"", description: "reasoning_only reruns audit/judge only. full_rerun re-collects evidence first.", required: false },
            { key: "reason_code", type: "enum", description: "REASONING_ERROR, LOGIC_GAP, EVIDENCE_MISREAD, EVIDENCE_INSUFFICIENT, OTHER", required: true },
            { key: "message", type: "string", description: "Dispute message describing the issue (1–8000 chars)", required: true },
            { key: "target", type: "object", description: "{ artifact: \"evidence_bundle\" | \"reasoning_trace\" | \"verdict\" | \"prompt_spec\", leaf_path?: string }", required: false },
            { key: "prompt_spec", type: "PromptSpec", description: "Full PromptSpec from the previous run", required: true },
            { key: "evidence_bundle", type: "object", description: "EvidenceBundle from the previous run (for reasoning_only mode)", required: false },
            { key: "reasoning_trace", type: "object", description: "ReasoningTrace from the previous run", required: false },
            { key: "tool_plan", type: "object", description: "Required for full_rerun mode", required: false },
            { key: "collectors", type: "string[]", description: "Required for full_rerun mode", required: false },
            { key: "patch", type: "object", description: "{ evidence_items_append?: array, prompt_spec_override?: object }", required: false },
          ]}
          requestExample={`{
  "mode": "reasoning_only",
  "reason_code": "EVIDENCE_MISREAD",
  "message": "The evidence was misinterpreted",
  "target": {
    "artifact": "evidence_bundle",
    "leaf_path": "items[0].extracted_fields.outcome"
  },
  "prompt_spec": { ... },
  "evidence_bundle": { ... },
  "reasoning_trace": { ... }
}`}
          responseFields={[
            { key: "ok", type: "boolean", description: "Whether the dispute rerun succeeded" },
            { key: "case_id", type: "string | null", description: "Optional correlation ID" },
            { key: "rerun_plan", type: "string[]", description: "Steps that were rerun, e.g. [\"audit\", \"judge\"]" },
            { key: "artifacts", type: "object", description: "Updated artifacts: prompt_spec, evidence_bundle, evidence_bundles, reasoning_trace, verdict" },
            { key: "diff", type: "object", description: "{ steps_rerun, verdict_changed }" },
          ]}
          responseExample={`{
  "ok": true,
  "case_id": null,
  "rerun_plan": ["audit", "judge"],
  "artifacts": {
    "prompt_spec": { ... },
    "evidence_bundle": { ... },
    "evidence_bundles": [ ... ],
    "reasoning_trace": { ... },
    "verdict": { ... }
  },
  "diff": {
    "steps_rerun": ["audit", "judge"],
    "verdict_changed": null
  }
}`}
        />

        {/* ─── Dispute LLM ─────────────────────────────────────────────────── */}
        <EndpointSection
          id="dispute-llm"
          method="POST"
          path="/dispute/llm"
          title="Dispute (LLM-Assisted)"
          icon={MessageSquareWarning}
          description="Simplified dispute endpoint that accepts 3 user inputs (reason, message, optional URLs) and uses an LLM to translate them into a structured DisputeRequest, then delegates to the existing dispute logic. Returns the same response as POST /dispute. Context artifacts (prompt_spec, evidence_bundle, reasoning_trace) are attached automatically from the current case."
          requestFields={[
            { key: "reason_code", type: "enum", description: "EVIDENCE_MISREAD, EVIDENCE_INSUFFICIENT, REASONING_ERROR, LOGIC_GAP, OTHER", required: true },
            { key: "message", type: "string", description: "Free-text dispute message (1–4000 chars)", required: true },
            { key: "evidence_urls", type: "string[]", description: "Up to 5 URLs to fetch as supporting evidence", required: false },
            { key: "prompt_spec", type: "PromptSpec", description: "Full PromptSpec from the previous run (auto-attached by frontend)", required: true },
            { key: "evidence_bundle", type: "object", description: "EvidenceBundle from the previous run (auto-attached)", required: false },
            { key: "reasoning_trace", type: "object", description: "ReasoningTrace from the previous run (auto-attached)", required: false },
            { key: "tool_plan", type: "object", description: "Only needed if LLM decides full_rerun (auto-attached)", required: false },
            { key: "collectors", type: "string[]", description: "Only needed if LLM decides full_rerun (auto-attached)", required: false },
          ]}
          requestExample={`{
  "reason_code": "EVIDENCE_MISREAD",
  "message": "Wikipedia shows PM Shmyhal announced a preliminary agreement on Feb 25 2025",
  "evidence_urls": [
    "https://en.wikipedia.org/wiki/Ukraine_US_Mineral_Agreement"
  ],
  "prompt_spec": { ... },
  "evidence_bundle": { ... },
  "reasoning_trace": { ... }
}`}
          responseFields={[
            { key: "ok", type: "boolean", description: "Whether the dispute rerun succeeded" },
            { key: "case_id", type: "string | null", description: "Optional correlation ID" },
            { key: "rerun_plan", type: "string[]", description: "Steps that were rerun" },
            { key: "artifacts", type: "object", description: "Updated artifacts with new verdict" },
            { key: "diff", type: "object", description: "Before/after comparison" },
          ]}
          responseExample={`{
  "ok": true,
  "case_id": null,
  "rerun_plan": ["audit", "judge"],
  "artifacts": {
    "prompt_spec": { ... },
    "evidence_bundles": [ ... ],
    "reasoning_trace": { ... },
    "verdict": { "outcome": "YES", "confidence": 0.92, "..." : "..." }
  },
  "diff": {
    "steps_rerun": ["audit", "judge"],
    "verdict_changed": null
  }
}`}
          notes={[
            "The user only provides reason_code, message, and optional evidence_urls. All other context is auto-attached.",
            "The LLM decides whether to run reasoning_only or full_rerun based on the dispute content.",
            "Returns the same response shape as POST /dispute.",
          ]}
        />

        {/* ─── Capabilities ──────────────────────────────────────────────── */}
        <SectionAnchor id="capabilities" />
        <Card className="border-border/50 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-transparent" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Search className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base">Capabilities Discovery</CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <MethodBadge method="GET" />
              <code className="text-sm font-[family-name:var(--font-geist-mono)] text-foreground">
                /capabilities
              </code>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Returns available LLM providers, collector agents, and pipeline step definitions.
              Use this endpoint to discover which collectors and models are available before running
              the pipeline. No request body is required.
            </p>

            <div>
              <SectionLabel>Request</SectionLabel>
              <CodeBlock
                id="capabilities-req"
                code={`curl -X POST 'https://interface.cournot.ai/play/polymarket/ai_data' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "code": "YOUR_CODE",
    "post_data": "{}",
    "path": "/capabilities",
    "method": "GET"
  }'`}
                language="bash"
              />
            </div>

            <FieldTable
              label="Response Fields"
              fields={[
                { key: "providers", type: "Provider[]", description: "Array of available LLM backends with their default models" },
                { key: "steps", type: "StepDef[]", description: "Array of pipeline step definitions with available agents and capabilities" },
              ]}
            />

            <div>
              <SectionLabel>Response Example</SectionLabel>
              <CodeBlock
                id="capabilities-res"
                code={`{
  "providers": [
    { "provider": "openai", "default_model": "gpt-4o" },
    { "provider": "google", "default_model": "gemini-2.5-flash" },
    { "provider": "grok", "default_model": "grok-4-fast" }
  ],
  "steps": [
    {
      "name": "prompt",
      "agents": ["prompt-compiler-v2"],
      "description": "Compile market question into structured specification"
    },
    ...
  ]
}`}
                language="json"
              />
            </div>
          </CardContent>
        </Card>

        {/* ─── Collectors & Providers reference ──────────────────────────── */}
        <SectionAnchor id="collectors" />
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                <Braces className="h-4 w-4 text-violet-400" />
              </div>
              <CardTitle className="text-base">Collectors & Providers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Collectors are evidence-gathering agents that can be specified in the{" "}
              <InlineCode>collectors</InlineCode> parameter of{" "}
              <a href="#step-collect" className="text-violet-400 hover:underline">/step/collect</a>.
              They run in priority order (highest first).
            </p>

            <div>
              <SectionLabel>Available Collectors</SectionLabel>
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Priority
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {COLLECTORS.map((c) => (
                      <tr key={c.name} className="hover:bg-accent/20">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <code className="text-[12px] font-[family-name:var(--font-geist-mono)] text-foreground">
                            {c.name}
                          </code>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-muted-foreground">{c.priority}</span>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {c.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <SectionLabel>Available LLM Providers</SectionLabel>
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Provider
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Default Model
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {PROVIDERS.map((p) => (
                      <tr key={p.provider} className="hover:bg-accent/20">
                        <td className="px-3 py-2">
                          <code className="text-[12px] font-[family-name:var(--font-geist-mono)] text-foreground">
                            {p.provider}
                          </code>
                        </td>
                        <td className="px-3 py-2">
                          <code className="text-[12px] font-[family-name:var(--font-geist-mono)] text-muted-foreground">
                            {p.model}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Error Handling ─────────────────────────────────────────────── */}
        <SectionAnchor id="errors" />
        <Card className="border-border/50 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-500 to-transparent" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <CardTitle className="text-base">Error Handling</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Errors can occur at two levels: the gateway envelope and the step response. Always check both.
            </p>

            <div>
              <SectionLabel>Gateway Error Codes</SectionLabel>
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Code
                      </th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Meaning
                      </th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr className="hover:bg-accent/20">
                      <td className="px-4 py-2.5">
                        <code className="text-[12px] font-[family-name:var(--font-geist-mono)] text-emerald-400">0</code>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">Success</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        Parse <InlineCode>data.result</InlineCode> as JSON
                      </td>
                    </tr>
                    <tr className="hover:bg-accent/20">
                      <td className="px-4 py-2.5">
                        <code className="text-[12px] font-[family-name:var(--font-geist-mono)] text-red-400">4100</code>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        Invalid access code
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        Verify your access code is correct and active
                      </td>
                    </tr>
                    <tr className="hover:bg-accent/20">
                      <td className="px-4 py-2.5">
                        <code className="text-[12px] font-[family-name:var(--font-geist-mono)] text-amber-400">!= 0</code>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">Other API error</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        Read <InlineCode>msg</InlineCode> for error details
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <SectionLabel>Step-Level Errors</SectionLabel>
              <p className="text-xs text-muted-foreground mb-3">
                Each step response contains an <InlineCode>ok</InlineCode> boolean and an{" "}
                <InlineCode>errors[]</InlineCode> array. Even when the gateway returns{" "}
                <InlineCode>code: 0</InlineCode>, the step itself may have partially failed.
              </p>
              <CodeBlock
                id="error-example"
                code={`// Gateway succeeds but step reports errors
{
  "code": 0,
  "msg": "Success",
  "data": {
    "result": "{
      \\"ok\\": false,
      \\"errors\\": [\\"Timeout fetching source_coinmarketcap\\"],
      \\"evidence_bundles\\": []
    }"
  }
}

// Recommended error handling pattern:
const gateway = await response.json();
if (gateway.code !== 0) {
  throw new Error(\`Gateway error: \${gateway.msg}\`);
}
const step = JSON.parse(gateway.data.result);
if (!step.ok) {
  console.warn("Step errors:", step.errors);
}`}
                language="json"
              />
            </div>

            <div>
              <SectionLabel>HTTP-Level Errors (Proxy)</SectionLabel>
              <p className="text-xs text-muted-foreground mb-3">
                When using the dashboard proxy (<InlineCode>/api/proxy/...</InlineCode>), additional HTTP errors may occur.
              </p>
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        HTTP Status
                      </th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Meaning
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr className="hover:bg-accent/20">
                      <td className="px-4 py-2.5">
                        <code className="text-[12px] font-[family-name:var(--font-geist-mono)] text-amber-400">502</code>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        Upstream request failed (connection error)
                      </td>
                    </tr>
                    <tr className="hover:bg-accent/20">
                      <td className="px-4 py-2.5">
                        <code className="text-[12px] font-[family-name:var(--font-geist-mono)] text-amber-400">504</code>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        Upstream request timed out (GET: 30s, POST: 300s)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Quick Start ────────────────────────────────────────────────── */}
        <SectionAnchor id="quickstart" />
        <Card className="border-border/50 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                <BookOpen className="h-4 w-4 text-violet-400" />
              </div>
              <CardTitle className="text-base">Quick Start &mdash; Full Pipeline</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Run all five steps sequentially to produce a complete Proof-of-Reasoning bundle.
              Copy this script and replace <InlineCode>YOUR_CODE</InlineCode> with your access code.
            </p>
          </CardHeader>
          <CardContent>
            <CodeBlock
              id="full-pipeline"
              code={`import json, requests

BASE = "https://interface.cournot.ai/play/polymarket/ai_data"
CODE = "YOUR_CODE"

def call(path: str, payload: dict, method: str = "POST") -> dict:
    """Wrap payload in the gateway envelope and call the API."""
    resp = requests.post(BASE, json={
        "code":      CODE,
        "post_data": json.dumps(payload),
        "path":      path,
        "method":    method,
    }, timeout=300)
    resp.raise_for_status()
    body = resp.json()
    if body["code"] != 0:
        raise RuntimeError(body.get("msg", "API error"))
    return json.loads(body["data"]["result"])

# ── Step 1: Prompt ──────────────────────────────────────────
prompt = call("/step/prompt", {
    "user_input":  "Will Bitcoin exceed 100k by March 2025?",
    "strict_mode": False,
})
spec = prompt["prompt_spec"]
plan = prompt["tool_plan"]
temporal = (spec.get("extra") or {}).get("temporal_constraint")
print(f"[1/6] Prompt compiled: {prompt['market_id']}")
if temporal:
    print(f"       Temporal guard: {temporal['reason']}")

# ── Step 2: Collect ─────────────────────────────────────────
collect = call("/step/collect", {
    "prompt_spec": spec,
    "tool_plan":   plan,
    "collectors":  ["CollectorWebPageReader"],
    "include_raw_content": False,
})
bundles = collect["evidence_bundles"]
print(f"[2/6] Collected {len(bundles)} evidence bundle(s)")

# ── Step 2.5: Quality Check + Retry ─────────────────────────
quality_scorecard = None
MAX_RETRIES = 2
for i in range(MAX_RETRIES):
    qc = call("/step/quality_check", {
        "prompt_spec":      spec,
        "evidence_bundles": bundles,
    })
    if not qc.get("ok"):
        break
    quality_scorecard = qc.get("scorecard")
    if qc.get("meets_threshold"):
        break
    hints = (quality_scorecard or {}).get("retry_hints", {})
    if not hints:
        break
    retry = call("/step/collect", {
        "prompt_spec":      spec,
        "tool_plan":        plan,
        "collectors":       ["CollectorOpenSearch"],
        "quality_feedback": hints,
    })
    if retry.get("ok") is not False:
        bundles += retry.get("evidence_bundles", [])
level = (quality_scorecard or {}).get("quality_level", "N/A")
print(f"[2.5/6] Quality: {level}")

# ── Step 3: Audit ───────────────────────────────────────────
audit_payload = {
    "prompt_spec":      spec,
    "evidence_bundles": bundles,
}
if quality_scorecard:
    audit_payload["quality_scorecard"] = quality_scorecard
if temporal:
    audit_payload["temporal_constraint"] = temporal

audit = call("/step/audit", audit_payload)
trace = audit["reasoning_trace"]
print(f"[3/6] Audit: {trace['preliminary_outcome']} "
      f"({trace['preliminary_confidence']:.0%})")

# ── Step 4: Judge ───────────────────────────────────────────
judge_payload = {
    "prompt_spec":      spec,
    "evidence_bundles": bundles,
    "reasoning_trace":  trace,
}
if quality_scorecard:
    judge_payload["quality_scorecard"] = quality_scorecard
if temporal:
    judge_payload["temporal_constraint"] = temporal

judge = call("/step/judge", judge_payload)
verdict = judge["verdict"]
print(f"[4/6] Verdict: {judge['outcome']} ({judge['confidence']:.0%})")

# ── Step 5: Bundle ──────────────────────────────────────────
bundle = call("/step/bundle", {
    "prompt_spec":      spec,
    "evidence_bundles": bundles,
    "reasoning_trace":  trace,
    "verdict":          verdict,
})
print(f"[5/6] PoR Root: {bundle['por_root']}")

# ── Summary ─────────────────────────────────────────────────
print(f"\\nOutcome:    {judge['outcome']}")
print(f"Confidence: {judge['confidence']:.0%}")
print(f"PoR Root:   {bundle['por_root']}")`}
              language="python"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
