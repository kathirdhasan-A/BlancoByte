import Link from "next/link";
import { Icon } from "@/components/Icon";

export function ServicesCTA() {
  return (
    <div
      className="glass-card mt-12 p-8"
      style={{ borderColor: "var(--color-accent-border)" }}
    >
      <div className="flex items-start gap-4">
        <span className="mt-0.5 text-cta">
          <Icon name="node-tree" size={26} />
        </span>
        <div>
          <h3 className="font-display text-xl text-text-primary">
            Need help with your data platform?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            BlancoByte designs and runs real-time pipelines and modern data infrastructure.
            We work alongside your team, from architecture to production.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/consulting"
              className="rounded-lg bg-cta px-5 py-2.5 text-sm font-semibold text-[#0A1735] transition hover:bg-cta-hover glow-amber"
            >
              Explore consulting
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-border-strong px-5 py-2.5 text-sm font-semibold text-text-secondary transition hover:border-accent hover:text-accent"
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServicesCTA;
