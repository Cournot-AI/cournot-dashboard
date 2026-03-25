"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronRight, ChevronDown, Search, Copy, Download, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Keys that should be visually emphasized
const HIGHLIGHTED_KEYS = new Set([
  "question",
  "event_definition",
  "resolution_deadline",
  "resolution_window",
  "allowed_sources",
  "source_targets",
  "selection_policy",
  "forbidden_behaviors",
  "uri",
  "strategy",
  "quorum",
]);

// ─── Value Renderer ─────────────────────────────────────────────────────────

function JsonValue({
  value,
  depth,
  searchTerm,
  path,
}: {
  value: unknown;
  depth: number;
  searchTerm: string;
  path: string;
}) {
  if (value === null || value === undefined) {
    return <span className="text-slate-500 italic">null</span>;
  }
  if (typeof value === "string") {
    const highlighted = searchTerm && value.toLowerCase().includes(searchTerm.toLowerCase());
    return (
      <span className={cn("text-emerald-400", highlighted && "bg-yellow-500/20 rounded px-0.5")}>
        &quot;{value}&quot;
      </span>
    );
  }
  if (typeof value === "number") {
    return <span className="text-blue-400">{value}</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-amber-400">{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    return <JsonArrayNode items={value} depth={depth} searchTerm={searchTerm} path={path} />;
  }
  if (typeof value === "object") {
    return <JsonObjectNode obj={value as Record<string, unknown>} depth={depth} searchTerm={searchTerm} path={path} />;
  }
  return <span>{String(value)}</span>;
}

function JsonArrayNode({
  items,
  depth,
  searchTerm,
  path,
}: {
  items: unknown[];
  depth: number;
  searchTerm: string;
  path: string;
}) {
  const [open, setOpen] = useState(depth < 2);
  if (items.length === 0) return <span className="text-slate-500">[]</span>;

  return (
    <span>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-0.5 text-slate-500 hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="text-[11px]">[{items.length}]</span>
      </button>
      {open && (
        <div className="ml-4 border-l border-border/50 pl-3 mt-0.5 space-y-px">
          {items.map((item, i) => (
            <div key={i} className="flex">
              <span className="text-slate-600 text-[11px] mr-2 select-none w-4 text-right shrink-0">
                {i}
              </span>
              <JsonValue value={item} depth={depth + 1} searchTerm={searchTerm} path={`${path}[${i}]`} />
            </div>
          ))}
        </div>
      )}
    </span>
  );
}

function JsonObjectNode({
  obj,
  depth,
  searchTerm,
  path,
}: {
  obj: Record<string, unknown>;
  depth: number;
  searchTerm: string;
  path: string;
}) {
  const [open, setOpen] = useState(depth < 2);
  const keys = Object.keys(obj);
  if (keys.length === 0) return <span className="text-slate-500">{"{}"}</span>;

  return (
    <span>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-0.5 text-slate-500 hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="text-[11px]">{`{${keys.length}}`}</span>
      </button>
      {open && (
        <div className="ml-4 border-l border-border/50 pl-3 mt-0.5 space-y-px">
          {keys.map((key) => {
            const isHighlighted = HIGHLIGHTED_KEYS.has(key);
            const keyMatches = searchTerm && key.toLowerCase().includes(searchTerm.toLowerCase());
            return (
              <div key={key} className="flex flex-wrap">
                <span
                  className={cn(
                    "mr-1",
                    isHighlighted ? "text-violet-400 font-semibold" : "text-sky-300",
                    keyMatches && "bg-yellow-500/20 rounded px-0.5"
                  )}
                >
                  {key}
                </span>
                <span className="text-slate-600 mr-1">:</span>
                <JsonValue value={obj[key]} depth={depth + 1} searchTerm={searchTerm} path={`${path}.${key}`} />
              </div>
            );
          })}
        </div>
      )}
    </span>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function JsonViewerPro({
  data,
  title,
  className,
}: {
  data: unknown;
  title?: string;
  className?: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const jsonString = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    toast.success("JSON copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [jsonString]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title?.replace(/\s+/g, "_").toLowerCase() || "data"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON downloaded");
  }, [jsonString, title]);

  return (
    <div className={cn("rounded-xl border border-border bg-muted/20 overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          {title && (
            <span className="text-xs font-medium text-muted-foreground">{title}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search keys…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-6 w-32 rounded border border-border bg-background pl-7 pr-2 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all focus:w-44"
            />
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Copy JSON"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Download JSON"
          >
            <Download className="h-3 w-3" />
          </button>
        </div>
      </div>
      {/* Tree */}
      <div className="p-4 font-mono text-xs leading-relaxed overflow-auto max-h-[500px]">
        <JsonValue value={data} depth={0} searchTerm={searchTerm} path="" />
      </div>
    </div>
  );
}
