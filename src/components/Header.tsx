"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { SiteSearch } from "@/components/SiteSearch";

const nav = [
  { name: "Overview", href: "/overview" },
  { name: "Consulting", href: "/consulting" },
  { name: "Docs", href: "/docs" },
  { name: "Blog & Knowledge Base", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(19, 19, 54, 0.72)",
        borderBottom: "1px solid var(--color-border-default)",
        backdropFilter: "blur(40px) saturate(1.6)",
        WebkitBackdropFilter: "blur(40px) saturate(1.6)",
      }}
    >
      <nav className="section-container flex h-16 items-center justify-between">
        <Logo />

        <div className="hidden items-center gap-6 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 lg:flex">
          <SiteSearch />
          <a
            href="https://www.linkedin.com/company/blancobyte"
            target="_blank"
            rel="noopener"
            aria-label="BlancoByte on LinkedIn"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition hover:bg-accent-soft hover:text-accent"
            style={{ border: "1px solid var(--color-border-default)" }}
          >
            <Icon name="linkedin-fill" size={18} />
          </a>
          <Link
            href="/contact"
            className="rounded-lg bg-cta px-4 py-2 text-sm font-semibold text-[#0A1735] transition hover:bg-cta-hover glow-amber"
            style={{ boxShadow: "0 6px 20px rgba(245, 166, 35, 0.32)" }}
          >
            Get started
          </Link>
        </div>

        <button
          className="text-text-secondary lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <Icon name={open ? "close-line" : "menu-line"} size={26} />
        </button>
      </nav>

      {open && (
        <div
          className="px-6 pb-6 pt-4 lg:hidden"
          style={{
            background: "rgba(6, 14, 34, 0.97)",
            borderTop: "1px solid var(--color-border-default)",
          }}
        >
          <div className="flex flex-col gap-3">
            <div onClick={() => setOpen(false)}>
              <SiteSearch />
            </div>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-1 font-medium text-text-secondary"
                onClick={() => setOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-1 rounded-lg bg-cta px-4 py-2.5 text-center font-semibold text-[#0A1735] glow-amber"
              onClick={() => setOpen(false)}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
