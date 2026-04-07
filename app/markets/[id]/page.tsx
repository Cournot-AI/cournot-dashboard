"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRole } from "@/lib/role";
import { fetchPublicMarket } from "@/lib/admin-api";
import type { AdminMarket, MarketExternalData, MarketClassification, MarketImpact } from "@/lib/types";
import { MarketDetail, ExternalDataSection, ImpactsSection } from "@/components/admin/market-detail";
import { AiResultDetail } from "@/components/admin/ai-result-detail";
import { MarketDisputes } from "@/components/admin/market-disputes";
import { CodeEntryDialog } from "@/components/auth/code-entry-dialog";
import { Loader2 } from "lucide-react";

export default function PublicMarketDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessCode, login } = useRole();
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [market, setMarket] = useState<AdminMarket | null>(null);
  const [externalData, setExternalData] = useState<MarketExternalData[]>([]);
  const [classification, setClassification] = useState<MarketClassification | null>(null);
  const [impacts, setImpacts] = useState<MarketImpact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError(null);
    try {
      const info = await fetchPublicMarket(Number(params.id));
      if (!info) {
        setError("Market not found");
      } else {
        setMarket(info.market);
        setExternalData(info.external_data ?? []);
        setClassification(info.classification ?? null);
        setImpacts(info.impacts ?? []);
      }
    } catch {
      setError("Failed to load market");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {error || "Market not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground">
        Markets &rarr; <span className="text-foreground">{market.title}</span>
      </div>

      <MarketDetail market={market} classification={classification} />

      {externalData.length > 0 && (
        <ExternalDataSection data={externalData} />
      )}

      {impacts.length > 0 && (
        <ImpactsSection impacts={impacts} />
      )}

      {market.status === "resolved" && market.ai_result && (
        <AiResultDetail
          aiResult={market.ai_result}
          aiPrompt={market.ai_prompt || undefined}
          resolveReasoning={market.resolve_reasoning || undefined}
        />
      )}

      {market.status === "resolved" && market.ai_result && (
        <MarketDisputes
          marketId={market.id}
          currentAiResult={market.ai_result}
          currentAiOutcome={market.ai_outcome}
          aiPrompt={market.ai_prompt || undefined}
          isAdmin={false}
          accessCode={accessCode}
          onMarketUpdated={load}
          onRequestCode={() => setCodeDialogOpen(true)}
        />
      )}

      <CodeEntryDialog
        open={codeDialogOpen}
        onOpenChange={setCodeDialogOpen}
        onSubmit={login}
      />
    </div>
  );
}
