"use client";

import { Loader2, AlertCircle, Inbox } from "lucide-react";

export function PageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function PageError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-red-400">Something went wrong</p>
        <p className="text-xs text-red-400/70 mt-1">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function PageEmpty({
  title = "No data",
  message = "Nothing to display.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
