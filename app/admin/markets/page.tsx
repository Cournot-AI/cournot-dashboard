"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { MarketTable } from "@/components/admin/market-table";

export default function AdminMarketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Market Monitor</h1>
          <p className="text-sm text-muted-foreground">
            Manage monitored markets and resolve alerts
          </p>
        </div>
        <Link
          href="/admin/markets/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4" />
          Add Market
        </Link>
      </div>
      <MarketTable />
    </div>
  );
}
