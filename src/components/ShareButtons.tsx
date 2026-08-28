"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { Icon } from "@/components/Icon";

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const t = encodeURIComponent(title);
  const u = encodeURIComponent(url);

  const networks = [
    { name: "Facebook", icon: "facebook-fill", color: "#1877F2", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "X", icon: "twitter-x-fill", color: "#000000", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { name: "Reddit", icon: "reddit-fill", color: "#FF4500", href: `https://www.reddit.com/submit?url=${u}&title=${t}` },
    { name: "LinkedIn", icon: "linkedin-fill", color: "#0A66C2", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: "WhatsApp", icon: "whatsapp-fill", color: "#25D366", href: `https://wa.me/?text=${t}%20${u}` },
    { name: "Gmail", icon: "google-fill", color: "#EA4335", href: `https://mail.google.com/mail/?view=cm&fs=1&su=${t}&body=${u}` },
    { name: "Outlook", icon: "microsoft-fill", color: "#0078D4", href: `https://outlook.office.com/mail/deeplink/compose?subject=${t}&body=${u}` },
  ];

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareMore() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled */
      }
    } else {
      copyLink();
    }
  }

  return (
    <div className="flex flex-col items-center gap-2.5">
      <span className="text-sm text-text-muted">Share on social:</span>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
      {networks.map((n) => (
        <a
          key={n.name}
          href={n.href}
          // target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${n.name}`}
          className="share-btn flex h-9 w-9 items-center justify-center rounded-full"
          style={{ "--brand": n.color } as CSSProperties}
        >
          <Icon name={n.icon} size={16} />
        </a>
      ))}
      <button
        onClick={shareMore}
        aria-label="More sharing options"
        className="share-btn flex h-9 w-9 items-center justify-center rounded-full"
        style={{ "--brand": "#F5A623" } as CSSProperties}
      >
        <Icon name="more-fill" size={16} />
      </button>
      <button
        onClick={copyLink}
        aria-label="Copy link"
        className="share-btn flex h-9 w-9 items-center justify-center rounded-full"
        style={{ "--brand": "#2E6BF5" } as CSSProperties}
      >
        <Icon name={copied ? "check-line" : "link"} size={16} />
      </button>
      </div>
    </div>
  );
}
