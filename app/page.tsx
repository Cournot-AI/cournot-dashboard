"use client";

import { MarketList } from "@/components/home/market-list";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Markets</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Recently resolved prediction markets.
        </p>
      </div>
      <MarketList />
    </div>
  );
}
