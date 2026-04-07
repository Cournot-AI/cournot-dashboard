"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";

export function PremiumCodeInput({
  onSubmit,
  isLoading,
  error,
}: {
  onSubmit: (code: string) => void;
  isLoading?: boolean;
  error?: string | null;
}) {
  const [code, setCode] = useState("");

  return (
    <div className="rounded-lg border border-border bg-card p-6 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <KeyRound className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Premium Access</h3>
          <p className="text-[11px] text-muted-foreground">Enter your access code for real-time intelligence</p>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="password"
          placeholder="Access code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && code.trim() && onSubmit(code.trim())}
          className="flex-1 h-8 rounded-lg border border-border bg-muted/30 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        />
        <button
          onClick={() => code.trim() && onSubmit(code.trim())}
          disabled={!code.trim() || isLoading}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Unlock"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-[11px] text-red-400">{error}</p>
      )}
    </div>
  );
}
