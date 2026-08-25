"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-border-default">
      {faqs.map((faq, i) => (
        <div key={i} className="transition-colors hover:bg-bg-hover/30" style={{ borderRadius: "var(--radius-sm)" }}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
            className="flex w-full items-center justify-between gap-4 px-4 py-5 text-left transition"
          >
            <h3 className={`text-lg font-semibold transition-colors duration-200 ${openIndex === i ? "text-accent" : "text-text-primary"}`}>
              {faq.q}
            </h3>
            <Icon name="arrow-down-s-line"
              size={20}
              className={`shrink-0 transition-all duration-300 ${
                openIndex === i ? "rotate-180 text-accent" : "text-text-muted"
              }`}
            />
          </button>
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ gridTemplateRows: openIndex === i ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <p className="px-4 pb-5 leading-relaxed text-text-secondary" style={{ animation: openIndex === i ? "fadeIn 0.3s ease" : "none" }}>
                {faq.a}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
