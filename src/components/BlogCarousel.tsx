"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/Icon";
import Link from "next/link";

export interface CarouselPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  image: string | null;
  readingTime: string;
  tags: string[];
}

export function BlogCarousel({ posts }: { posts: CarouselPost[] }) {
  const [perView, setPerView] = useState(3);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    function update() {
      if (window.innerWidth < 640) setPerView(1);
      else if (window.innerWidth < 1024) setPerView(2);
      else setPerView(3);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = Math.max(0, posts.length - perView);

  // Gentle auto-advance, pauses on hover
  useEffect(() => {
    if (paused || posts.length <= perView) return;
    const id = setInterval(() => setIndex((i) => (i >= maxIndex ? 0 : i + 1)), 7000);
    return () => clearInterval(id);
  }, [paused, maxIndex, perView, posts.length]);

  if (posts.length === 0) return null;

  const clampedIndex = Math.min(index, maxIndex);
  const showControls = posts.length > perView;

  return (
    <div
      className="mx-auto mt-12 max-w-6xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ transform: `translateX(-${clampedIndex * (100 / perView)}%)` }}
        >
          {posts.map((post) => (
            <div key={post.slug} className="shrink-0 px-3" style={{ width: `${100 / perView}%` }}>
              <Link href={`/blog/${post.slug}`} className="group block h-full">
                <article className="glass-card flex h-full flex-col overflow-hidden transition group-hover:border-accent">
                  {post.image ? (
                    <img src={post.image} alt="" className="h-40 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-br from-accent-soft to-transparent" />
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-lg font-bold leading-snug text-text-primary">{post.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary line-clamp-3">{post.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1"><Icon name="calendar-line" size={13} />{new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                      <span className="flex items-center gap-1"><Icon name="time-fill" size={13} />{post.readingTime}</span>
                    </div>
                  </div>
                </article>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Link href="/blog" className="flex items-center gap-1.5 text-sm font-semibold text-accent transition hover:gap-2.5">
          View all articles <Icon name="arrow-right-line" size={15} />
        </Link>

        {mounted && showControls && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={clampedIndex === 0}
              aria-label="Previous"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-default text-text-secondary transition hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Icon name="arrow-left-s-line" size={17} />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: i === clampedIndex ? "22px" : "8px",
                    background: i === clampedIndex ? "var(--color-accent)" : "var(--color-border-default)",
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
              disabled={clampedIndex >= maxIndex}
              aria-label="Next"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-default text-text-secondary transition hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Icon name="arrow-right-s-line" size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
