"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  isLoading,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  isLoading?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>
        {total > 0
          ? `Showing ${from}-${to} of ${total.toLocaleString()}`
          : "No results"}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border transition-colors",
            page <= 1 || isLoading
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-accent hover:text-foreground"
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="px-2 tabular-nums font-medium">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border transition-colors",
            page >= totalPages || isLoading
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-accent hover:text-foreground"
          )}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
