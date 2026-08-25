"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
  overview: "Overview",
  consulting: "Consulting",
  docs: "Docs",
  blog: "Blog & Knowledge Base",
  contact: "Contact",
  "privacy-policy": "Privacy Policy",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  // Some path segments are not real pages and must not be linked (would 404).
  // e.g. /blog/tag/<x> - "/blog/tag" has no page of its own.
  const nonNavigable = new Set(["tag", "page"]);

  const crumbs = segments.map((seg, i) => ({
    label: labels[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    href: "/" + segments.slice(0, i + 1).join("/"),
    navigable: !nonNavigable.has(seg),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://blancobyte.com" },
      ...crumbs
        .filter((c) => c.navigable)
        .map((c, i) => ({
          "@type": "ListItem",
          position: i + 2,
          name: c.label,
          item: `https://blancobyte.com${c.href}`,
        })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="section-container pb-0 pt-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-text-muted">
          <li>
            <Link href="/" className="transition hover:text-accent">Home</Link>
          </li>
          {crumbs.map((crumb, i) => (
            <li key={crumb.href} className="flex items-center gap-1">
              <Icon name="arrow-right-s-line" size={14} />
              {i === crumbs.length - 1 || !crumb.navigable ? (
                <span className="text-text-secondary">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="transition hover:text-accent">{crumb.label}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
