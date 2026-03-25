"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function safeJson(obj: any) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export function DisputeDiff({
  beforeVerdict,
  afterVerdict,
  beforeReasoning,
  afterReasoning,
}: {
  beforeVerdict: any;
  afterVerdict: any;
  beforeReasoning: any;
  afterReasoning: any;
}) {
  const outcomeBefore = beforeVerdict?.outcome ?? null;
  const outcomeAfter = afterVerdict?.outcome ?? null;
  const confBefore = beforeVerdict?.confidence ?? null;
  const confAfter = afterVerdict?.confidence ?? null;

  const reasoningSummaryBefore = beforeReasoning?.reasoning_summary ?? "";
  const reasoningSummaryAfter = afterReasoning?.reasoning_summary ?? "";

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm">Dispute Result (Diff)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground">Before</div>
            <div className="text-sm">Outcome: {String(outcomeBefore)}</div>
            <div className="text-sm">Confidence: {confBefore != null ? String(confBefore) : ""}</div>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground">After</div>
            <div className="text-sm">Outcome: {String(outcomeAfter)}</div>
            <div className="text-sm">Confidence: {confAfter != null ? String(confAfter) : ""}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground">Reasoning summary (before)</div>
            <pre className="text-xs whitespace-pre-wrap mt-2">{reasoningSummaryBefore}</pre>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground">Reasoning summary (after)</div>
            <pre className="text-xs whitespace-pre-wrap mt-2">{reasoningSummaryAfter}</pre>
          </div>
        </div>

        <details className="rounded-lg border border-border/50 p-3">
          <summary className="text-xs text-muted-foreground cursor-pointer">Raw verdict JSON</summary>
          <pre className="text-xs whitespace-pre-wrap mt-2">{safeJson({ beforeVerdict, afterVerdict })}</pre>
        </details>

        <details className="rounded-lg border border-border/50 p-3">
          <summary className="text-xs text-muted-foreground cursor-pointer">Raw reasoning_trace JSON</summary>
          <pre className="text-xs whitespace-pre-wrap mt-2">{safeJson({ beforeReasoning, afterReasoning })}</pre>
        </details>
      </CardContent>
    </Card>
  );
}
