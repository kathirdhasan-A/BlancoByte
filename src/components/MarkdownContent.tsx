"use client";

import { useEffect, useRef } from "react";

/**
 * Renders server-highlighted markdown HTML and progressively enhances each
 * code block with a copy button. No Shiki ships to the client - only this
 * small enhancer hydrates over the already-rendered HTML.
 */
export function MarkdownContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    // rehype-pretty-code wraps code in <figure data-rehype-pretty-code-figure><pre>…</pre></figure>
    const figures = root.querySelectorAll<HTMLElement>("figure[data-rehype-pretty-code-figure]");

    const cleanups: Array<() => void> = [];

    figures.forEach((figure) => {
      const pre = figure.querySelector("pre");
      if (!pre || figure.querySelector(".code-copy-btn")) return;

      figure.classList.add("code-block");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy-btn";
      btn.setAttribute("aria-label", "Copy code");
      btn.innerHTML = COPY_ICON;

      const onClick = async () => {
        const code = pre.querySelector("code");
        const text = code ? code.textContent || "" : pre.textContent || "";
        try {
          await navigator.clipboard.writeText(text);
          btn.innerHTML = CHECK_ICON;
          btn.classList.add("copied");
          setTimeout(() => {
            btn.innerHTML = COPY_ICON;
            btn.classList.remove("copied");
          }, 1600);
        } catch {
          /* clipboard unavailable; ignore */
        }
      };

      btn.addEventListener("click", onClick);
      figure.appendChild(btn);
      cleanups.push(() => btn.removeEventListener("click", onClick));
    });

    return () => cleanups.forEach((fn) => fn());
  }, [html]);

  return (
    <div
      ref={ref}
      className="md-content max-w-none"
      // HTML is produced server-side by our own pipeline (rehype-raw sanitizes structure;
      // content comes from our own markdown files / docs repo).
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z"/><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"/></svg>';

const CHECK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5l10 -10"/></svg>';
