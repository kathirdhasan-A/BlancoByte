"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const isBlogPost = pathname.startsWith("/blog/") && !pathname.startsWith("/blog/tag") && !pathname.startsWith("/blog/page");

  useEffect(() => {
    if (!isBlogPost) return;

    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isBlogPost]);

  if (!isBlogPost || progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 z-[60] h-[3px] w-full">
      <div
        className="h-full transition-[width] duration-100"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, var(--color-accent), #a78bfa)",
        }}
      />
    </div>
  );
}
