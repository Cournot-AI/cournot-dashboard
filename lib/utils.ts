import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Safely render a value that might be an object as a string. */
export function renderText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

/**
 * Normalize `resolution_rules` which may come from the backend as
 * `{ rules: ResolutionRule[] }` instead of `ResolutionRule[]`.
 */
export function normalizeRules(
  rules: unknown
): { rule_id: string; description: string; priority: number }[] {
  if (Array.isArray(rules)) return rules;
  if (rules && typeof rules === "object" && "rules" in rules && Array.isArray((rules as Record<string, unknown>).rules)) {
    return (rules as Record<string, unknown>).rules as { rule_id: string; description: string; priority: number }[];
  }
  return [];
}

/**
 * Normalize `allowed_sources` which may come from the backend as
 * `{ source_id: string; ... }[]` instead of `string[]`.
 */
export function normalizeSources(sources: unknown): string[] {
  if (!Array.isArray(sources)) return [];
  return sources.map((s) => {
    if (typeof s === "string") return s;
    if (s && typeof s === "object" && "source_id" in s) return String((s as Record<string, unknown>).source_id);
    return renderText(s);
  });
}
