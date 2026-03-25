"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Fingerprint } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Visual tokens (dark mode) ──────────────────────────────────────────────
//
//  ┌─ outer: rounded-xl border-violet-500/10 bg-violet-500/[0.03] ─────────┐
//  │                                                                         │
//  │  ┌─ icon ─┐                                                            │
//  │  │   🔏   │  EVIDENCE ROOT                                              │
//  │  │ violet │  0x7f6e5d…29180    [copy]                                   │
//  │  └────────┘                                                            │
//  │                                                                         │
//  └─────────────────────────────────────────────────────────────────────────┘
//
//  Resting:   border-violet-500/10  bg-violet-500/[0.03]
//  Hover:     border-violet-500/25  bg-violet-500/[0.06]
//  Copied:    border-emerald-500/20 bg-emerald-500/[0.04]  (300ms flash)
//  Focus:     ring-2 ring-ring
//
//  Icon:      Fingerprint · h-4 w-4 · text-violet-400/60
//  Label:     text-[10px] uppercase tracking-wider font-semibold text-muted-foreground
//  Hash:      font-mono text-[11px] text-foreground/60, first 10 + … + last 6
//  Copy btn:  h-3 w-3 · opacity-0 → group-hover:opacity-100
//  Tooltip:   1-sentence explanation, max-w-xs, side="top"
//

function truncateHash(hash: string): string {
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

export function ProofArtifactChip({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard", {
      description: `${label} copied`,
      duration: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  }, [value, label]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className={cn(
              "group flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-150 w-full",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              copied
                ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                : "border-violet-500/10 bg-violet-500/[0.03] hover:border-violet-500/25 hover:bg-violet-500/[0.06]"
            )}
          >
            {/* Cryptographic icon */}
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                copied
                  ? "bg-emerald-500/10"
                  : "bg-violet-500/10 group-hover:bg-violet-500/15"
              )}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Fingerprint className="h-3.5 w-3.5 text-violet-400/70 group-hover:text-violet-400" />
              )}
            </div>

            {/* Label + hash */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">
                {label}
              </p>
              <p
                className={cn(
                  "font-mono text-[11px] truncate leading-none transition-colors",
                  copied
                    ? "text-emerald-400/80"
                    : "text-foreground/50 group-hover:text-foreground/70"
                )}
              >
                {truncateHash(value)}
              </p>
            </div>

            {/* Copy icon */}
            <div className="shrink-0">
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs leading-relaxed">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
