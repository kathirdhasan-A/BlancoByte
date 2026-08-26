"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@/components/Icon";
import Link from "next/link";

interface PagefindResultData {
  url: string;
  meta: { title?: string; image?: string };
  excerpt: string;
}
interface PagefindResult {
  id: string;
  data: () => Promise<PagefindResultData>;
}

// Pagefind is loaded at runtime from the static bundle, so it isn't part of the JS build.
type PagefindAPI = {
  search: (q: string) => Promise<{ results: PagefindResult[] }>;
  preload: (q: string) => void;
};

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PagefindResultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const pagefindRef = useRef<PagefindAPI | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Lazy-load Pagefind the first time the modal opens
  const ensurePagefind = useCallback(async () => {
    if (pagefindRef.current) return pagefindRef.current;
    try {
      // @ts-expect-error - runtime import of the static Pagefind bundle
      const pf = await import(/* webpackIgnore: true */ "/_pagefind/pagefind.js");
      await pf.options?.({ excerptLength: 20 });
      pagefindRef.current = pf;
      setReady(true);
      return pf;
    } catch {
      setReady(false);
      return null;
    }
  }, []);

  // Open via the button, or Cmd/Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      ensurePagefind();
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open, ensurePagefind]);

  // Close when a click (or tap) lands outside the panel
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const pf = await ensurePagefind();
      if (!pf) {
        setLoading(false);
        return;
      }
      const search = await pf.search(q);
      const data = await Promise.all(
        search.results.slice(0, 8).map((r: PagefindResult) => r.data())
      );
      setResults(data);
      setLoading(false);
    }, 180);
    return () => clearTimeout(t);
  }, [query, ensurePagefind]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Search the site"
        className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-muted transition hover:border-accent hover:text-text-secondary"
      >
        <Icon name="search-line" size={16} />
        <span className="hidden lg:inline">Search</span>
        <kbd className="hidden lg:inline rounded border border-border-default px-1.5 py-0.5 text-[10px] font-mono text-text-muted">⌘K</kbd>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[10%]"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm h-screen" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border-default shadow-2xl"
            style={{
              borderColor: "rgba(46, 107, 245,0.25)",
              background: "rgba(10, 9, 22, 0.95)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            {/* Input */}
            <div className="flex items-center gap-3 border-b border-border-default px-4">
              <Icon name="search-line" size={18} className="shrink-0 text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles, docs, and pages..."
                className="w-full bg-transparent py-4 text-text-primary outline-none placeholder:text-text-muted"
              />
              {loading && <Icon name="loader-4-line" size={16} className="shrink-0 animate-spin text-text-muted" />}
              <button onClick={() => setOpen(false)} aria-label="Close search" className="shrink-0 text-text-muted hover:text-text-primary">
                <Icon name="close-line" size={18} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {query.trim().length >= 2 && !loading && results.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-text-muted">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}

              {results.map((r) => (
                <Link
                  key={r.url}
                  href={r.url.replace(/\.html$/, "")}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-bg-hover"
                >
                  <Icon name="file-text-line" size={17} className="mt-0.5 shrink-0 text-accent" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-text-primary">
                      {r.meta.title || r.url}
                    </span>
                    <span
                      className="mt-0.5 block text-xs leading-relaxed text-text-muted [&_mark]:bg-accent-soft [&_mark]:text-accent [&_mark]:rounded [&_mark]:px-0.5"
                      dangerouslySetInnerHTML={{ __html: r.excerpt }}
                    />
                  </span>
                </Link>
              ))}

              {query.trim().length < 2 && (
                <div className="px-3 py-8 text-center text-sm text-text-muted">
                  {ready ? "Type to search across the site." : "Start typing to search."}
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-xs">
                    <Icon name="corner-down-left-line" size={12} /> to open · <kbd className="rounded border border-border-default px-1 font-mono">Esc</kbd> to close
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
