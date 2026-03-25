/* eslint-disable @typescript-eslint/no-explicit-any */

export const GA_ID = "G-JXD9XDC9QW";

// ─── Core gtag wrappers ─────────────────────────────────────────────────────

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

function gtag(...args: any[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

/** Track a page view */
export function pageView(url: string) {
  gtag("config", GA_ID, { page_path: url });
}

/** Track a custom event */
export function trackEvent(
  action: string,
  params: Record<string, any> = {}
) {
  gtag("event", action, params);
}

// ─── Playground events ──────────────────────────────────────────────────────

export function trackPlaygroundCodeEntered(code: string) {
  trackEvent("playground_code_entered", { code });
}

export function trackPlaygroundPrompt(code: string, inputLength: number) {
  trackEvent("playground_prompt", { code, input_length: inputLength });
}

export function trackPlaygroundResolve(code: string, mode: "multi_step" | "single_call", collectors: string[]) {
  trackEvent("playground_resolve", {
    code,
    mode,
    collectors: collectors.join(","),
    collector_count: collectors.length,
  });
}

export function trackPlaygroundProviderChange(code: string, provider: string | null, model: string) {
  trackEvent("playground_provider_change", { code, provider: provider ?? "default", model });
}

export function trackPlaygroundCollectorToggle(code: string, collectorId: string, selected: boolean) {
  trackEvent("playground_collector_toggle", { code, collector: collectorId, selected });
}

export function trackPlaygroundReset(code: string) {
  trackEvent("playground_reset", { code });
}

export function trackPlaygroundStepComplete(code: string, step: string, success: boolean) {
  trackEvent("playground_step_complete", { code, step, success });
}

// ─── Cases events ───────────────────────────────────────────────────────────

export function trackCasesPageView(page: number, pageSize: number, source: string, matchResult: string) {
  trackEvent("cases_page_view", { page, page_size: pageSize, source, match_result: matchResult });
}

export function trackCaseClick(caseId: string) {
  trackEvent("case_click", { case_id: caseId });
}

export function trackCaseDetailView(caseId: string) {
  trackEvent("case_detail_view", { case_id: caseId });
}

export function trackCasesFilterChange(filterType: string, value: string) {
  trackEvent("cases_filter_change", { filter_type: filterType, value });
}
