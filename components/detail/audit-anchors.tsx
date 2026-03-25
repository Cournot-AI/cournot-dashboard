import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyField } from "@/components/shared/copy-field";
import { EmptyState } from "@/components/shared/empty-state";
import type { RunSummary } from "@/lib/types";
import { Shield } from "lucide-react";

export function AuditAnchors({ result }: { result: RunSummary | null }) {
  if (!result) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Deterministic Audit Anchors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState type="pending" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-violet-400" />
          Deterministic Audit Anchors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CopyField label="Prompt Spec Hash" value={result.prompt_spec_hash} />
          <CopyField label="PoR Root" value={result.por_root} />
          <CopyField label="Evidence Root" value={result.evidence_root} />
          <CopyField label="Reasoning Root" value={result.reasoning_root} />
        </div>
      </CardContent>
    </Card>
  );
}
