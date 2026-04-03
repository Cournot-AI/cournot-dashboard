"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role";
import { createMarket } from "@/lib/admin-api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function MarketForm() {
  const { accessCode } = useRole();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [platformUrl, setPlatformUrl] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessCode) return;
    if (!title.trim() || !description.trim() || !startTime || !endTime) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      await createMarket(accessCode, {
        title: title.trim(),
        description: description.trim(),
        platform_url: platformUrl.trim() || undefined,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      });
      toast.success("Market added");
      router.push("/admin/markets");
    } catch {
      // Error handled by admin-api
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Will BTC hit $100k by June 2026?" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description *</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed resolution criteria..." rows={3} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Platform URL</label>
            <Input value={platformUrl} onChange={(e) => setPlatformUrl(e.target.value)} placeholder="https://polymarket.com/..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Time *</label>
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Time *</label>
              <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add Market
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="h-9 rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
