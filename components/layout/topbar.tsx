"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogIn, LogOut, Menu, Loader2, Hash } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useSidebar } from "./sidebar-context";
import { useRole } from "@/lib/role";
import { CodeEntryDialog } from "@/components/auth/code-entry-dialog";
import { Badge } from "@/components/ui/badge";

// ── Search types ──

interface SearchMarket {
  id: number;
  title: string;
  status: string;
  ai_outcome: string;
  source: string;
}

interface SearchResponse {
  search_type: "id" | "hash" | "keyword";
  markets: SearchMarket[];
  total: number;
}

// ── Search bar component ──

function MarketSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMarket[]>([]);
  const [searchType, setSearchType] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setTotal(0);
      setSearchType("");
      setError(null);
      setSearched(false);
      setOpen(false);
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    setOpen(true);
    try {
      const qs = new URLSearchParams({ query: q.trim(), page_size: "10" });
      const res = await fetch(`/api/proxy/public/search?${qs}`);
      if (!res.ok) {
        setError(`HTTP ${res.status}`);
        setResults([]);
        setTotal(0);
        return;
      }
      const json = await res.json();
      if (json.code && json.code !== 0) {
        setError(json.msg || "API error");
        setResults([]);
        setTotal(0);
        return;
      }
      const data: SearchResponse = json.data ?? json;
      setResults(data.markets ?? []);
      setTotal(data.total ?? 0);
      setSearchType(data.search_type ?? "");
    } catch {
      setError("Search failed");
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setOpen(false);
      setResults([]);
      setSearched(false);
      setError(null);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  }

  function navigate(id: number) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/markets/${id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigate(results[activeIndex].id);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Global ⌘K shortcut
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleGlobalKey);
    return () => document.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Cleanup debounce
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case "resolved": return "text-green-400 border-green-500/30";
      case "monitoring": return "text-sky-400 border-sky-500/30";
      case "pending_verification": return "text-amber-400 border-amber-500/30";
      case "conflict": return "text-red-400 border-red-500/30";
      case "closed": return "text-muted-foreground border-border";
      default: return "text-muted-foreground border-border";
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder="Search markets, IDs, hashes…"
        className="h-8 w-full rounded-lg border border-border bg-muted/30 pl-9 pr-16 text-xs text-foreground placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
      />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      {/* Dropdown */}
      {open && searched && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-background shadow-lg overflow-hidden z-[100]">
          {loading ? (
            <div className="px-4 py-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </div>
          ) : error ? (
            <div className="px-4 py-3 text-xs text-red-400 text-center">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground text-center">
              No markets found
            </div>
          ) : (
            <>
              {searchType && (
                <div className="px-3 py-1.5 border-b border-border flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    {searchType === "hash" && <Hash className="h-2.5 w-2.5" />}
                    {searchType} search
                  </span>
                  {total > results.length && (
                    <span className="text-[10px] text-muted-foreground">
                      {total} total
                    </span>
                  )}
                </div>
              )}
              <div className="max-h-80 overflow-y-auto">
                {results.map((market, i) => (
                  <button
                    key={market.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); navigate(market.id); }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors ${
                      i === activeIndex ? "bg-accent" : "hover:bg-accent/50"
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5 w-12 text-right">
                      #{market.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{market.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`text-[9px] px-1 py-0 ${statusColor(market.status)}`}>
                          {market.status}
                        </Badge>
                        {market.ai_outcome && (
                          <span className="text-[10px] text-muted-foreground">{market.ai_outcome}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Topbar ──

export function Topbar() {
  const { isAuthenticated, role, login, logout } = useRole();
  const { toggleMobile } = useSidebar();
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 md:px-6">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMobile}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="h-10 w-36 overflow-hidden flex items-center justify-center">
        <img
          src="/Cournot_Black_Horizontal-01.png"
          alt="Cournot"
          className="h-[7rem] w-auto max-w-none dark:hidden"
        />
        <img
          src="/Cournot_Logo_White_Horizontal-01.png"
          alt="Cournot"
          className="h-[7rem] w-auto max-w-none hidden dark:block"
        />
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex max-w-md flex-1 mx-8">
        <MarketSearch />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Bell className="h-4 w-4" />
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {role === "admin" ? (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  ADMIN
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  USER
                </Badge>
              )}
            </div>
            <button
              onClick={logout}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCodeDialogOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <LogIn className="h-3.5 w-3.5" />
            Enter Code
          </button>
        )}
      </div>

      <CodeEntryDialog
        open={codeDialogOpen}
        onOpenChange={setCodeDialogOpen}
        onSubmit={login}
      />
    </header>
  );
}
