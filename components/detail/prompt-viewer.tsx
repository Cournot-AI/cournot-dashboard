"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonViewerPro } from "@/components/shared/json-viewer-pro";
import type { ParseResult, DataRequirement } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TabKey = "prompt_spec" | "tool_plan" | "data_reqs" | "raw" | "meta";

const tabs: { key: TabKey; label: string }[] = [
  { key: "prompt_spec", label: "PromptSpec" },
  { key: "tool_plan", label: "ToolPlan" },
  { key: "data_reqs", label: "Data Requirements" },
  { key: "raw", label: "Raw Parse Result" },
  { key: "meta", label: "Metadata & Determinism" },
];

function DataRequirementsTable({ reqs }: { reqs: DataRequirement[] }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Requirement</TableHead>
            <TableHead>Sources</TableHead>
            <TableHead>Expected Fields</TableHead>
            <TableHead>Strategy</TableHead>
            <TableHead>Quorum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reqs.map((req) => (
            <TableRow key={req.requirement_id}>
              <TableCell>
                <div>
                  <Badge variant="outline" className="text-[10px] font-mono mb-1">
                    {req.requirement_id}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{req.description}</p>
                </div>
              </TableCell>
              <TableCell>
                {req.source_targets.length > 0 ? (
                  <div className="space-y-1">
                    {req.source_targets.map((st) => (
                      <div key={st.uri} className="text-[11px]">
                        <span className="font-mono text-violet-400">{st.provider}</span>
                        <p className="text-muted-foreground truncate max-w-[200px] font-mono text-[10px]">
                          {st.uri}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : req.deferred_source_discovery ? (
                  <Badge variant="outline" className="text-[10px] text-sky-400 border-sky-500/20 bg-sky-500/10">
                    Deferred
                  </Badge>
                ) : (
                  <span className="text-[11px] text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {req.expected_fields.map((f) => (
                    <Badge key={f} variant="outline" className="text-[10px] font-mono">
                      {f}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {req.selection_policy.strategy}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {req.selection_policy.quorum}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MetadataPanel({ parseResult }: { parseResult: ParseResult }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Parse Metadata
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Compiler:</span>{" "}
            <span className="font-mono">{parseResult.metadata.compiler}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Strict Mode:</span>{" "}
            <span className={parseResult.metadata.strict_mode ? "text-blue-400" : "text-slate-400"}>
              {String(parseResult.metadata.strict_mode)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Question Type:</span>{" "}
            <span className="font-mono">{parseResult.metadata.question_type}</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Canonical Serialization
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          PromptSpec is serialized using deterministic JSON canonicalization (RFC 8785).
          Keys are sorted lexicographically, no trailing commas, no whitespace variations.
          The resulting byte sequence is hashed with SHA-256 to produce{" "}
          <code className="font-mono text-foreground/80">prompt_spec_hash</code>.
          If <code className="font-mono">created_at</code> is null, the field is excluded from
          serialization to ensure identical specs produce identical hashes regardless of when they
          were created.
        </p>
      </div>
    </div>
  );
}

export function PromptViewerTabs({ parseResult }: { parseResult: ParseResult }) {
  const [activeTab, setActiveTab] = useState<TabKey>("prompt_spec");

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">Prompt Engineer Output</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Tab bar */}
        <div className="flex gap-1 mb-4 overflow-x-auto border-b border-border pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2 -mb-px",
                activeTab === tab.key
                  ? "border-primary text-foreground bg-accent/30"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/20"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[200px]">
          {activeTab === "prompt_spec" && parseResult.prompt_spec && (
            <JsonViewerPro data={parseResult.prompt_spec} title="PromptSpec" />
          )}
          {activeTab === "tool_plan" && parseResult.tool_plan && (
            <JsonViewerPro data={parseResult.tool_plan} title="ToolPlan" />
          )}
          {activeTab === "data_reqs" && parseResult.prompt_spec && (
            <DataRequirementsTable reqs={parseResult.prompt_spec.data_requirements} />
          )}
          {activeTab === "raw" && (
            <JsonViewerPro data={parseResult} title="Full Parse Result" />
          )}
          {activeTab === "meta" && <MetadataPanel parseResult={parseResult} />}
          {!parseResult.prompt_spec && activeTab !== "raw" && activeTab !== "meta" && (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              No data available — parse failed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
