"use client";

import { MarketForm } from "@/components/admin/market-form";

export default function NewMarketPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Add Market</h1>
        <p className="text-sm text-muted-foreground">
          Add a new market to be monitored for resolution signals
        </p>
      </div>
      <MarketForm />
    </div>
  );
}
