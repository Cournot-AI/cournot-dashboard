"use client";

import { useState } from "react";
import { MarketList } from "@/components/home/market-list";
import { cn } from "@/lib/utils";

type Tab = "resolved" | "monitoring";

const TABS: { label: string; value: Tab }[] = [
  { label: "Resolved Markets", value: "resolved" },
  { label: "Monitoring Markets", value: "monitoring" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("resolved");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted/30 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "px-3 py-1 rounded-md text-sm font-medium transition-colors",
              tab === t.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <MarketList key={tab} status={tab} />
    </div>
  );
}
