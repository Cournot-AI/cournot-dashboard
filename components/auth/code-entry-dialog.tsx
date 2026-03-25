"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CodeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (code: string) => Promise<void>;
}

export function CodeEntryDialog({ open, onOpenChange, onSubmit }: CodeEntryDialogProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await onSubmit(trimmed);
      setCode("");
      onOpenChange(false);
    } catch {
      // Error toast handled by RoleProvider
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Enter Access Code</DialogTitle>
          <DialogDescription>
            Enter your access code to unlock features.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            type="password"
            placeholder="Access code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Validating…" : "Submit"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
