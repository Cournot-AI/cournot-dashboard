"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function CopyField({
  label,
  value,
  truncate = true,
  mono = true,
}: {
  label: string;
  value: string;
  truncate?: boolean;
  mono?: boolean;
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

  const displayValue = truncate && value.length > 20
    ? `${value.slice(0, 10)}…${value.slice(-8)}`
    : value;

  return (
    <div className="group flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <button
        onClick={handleCopy}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          mono ? "font-mono text-xs" : "text-sm"
        )}
      >
        <span className="flex-1 truncate text-foreground/80">{displayValue}</span>
        {copied ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
    </div>
  );
}

export function InlineCopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied", { duration: 1500 });
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
      className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={`Copy ${label || value}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}
