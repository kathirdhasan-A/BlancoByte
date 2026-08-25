import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { SectionHeading } from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "BlancoByte is a database engineering consultancy in the Netherlands. We build real-time data pipelines and modern data infrastructure with ClickHouse, MongoDB, and Couchbase.",
  alternates: { canonical: "https://blancobyte.com/overview" },
};

const values = [
  { icon: "flashlight-fill", title: "Speed", body: "We build for millisecond latency, not batch windows." },
  { icon: "eye-fill", title: "Transparency", body: "Open tooling, honest advice, and no vendor lock in." },
  { icon: "tools-fill", title: "Craftsmanship", body: "Every pipeline we build is production grade from day one." },
  { icon: "shake-hands-fill", title: "Partnership", body: "We work alongside your team, not just for you." },
];

const stack = ["ClickHouse", "Apache Kafka", "Debezium", "CDC pipelines", "Data architecture"];

export default function OverviewPage() {
  return (
    <section className="section-padding">
      <div className="section-container">
        <div className="mx-auto max-w-3xl">
          <p className="halo font-mono text-sm uppercase tracking-wider text-accent">About us</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-text-primary md:text-5xl">
            We help companies unlock their data
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-text-secondary">
            BlancoByte is a database engineering consultancy based in the Netherlands. We specialise
            in ClickHouse, MongoDB, and Couchbase, and in real-time pipelines and modern data
            infrastructure.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="glass-card p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl text-cta"
              style={{ background: "var(--color-cta-soft)", border: "1px solid var(--color-cta-border)", boxShadow: "0 0 26px rgba(245, 166, 35, 0.18)" }}>
              <Icon name="flag-fill" size={22} />
            </span>
            <h2 className="mt-5 font-display text-xl text-text-primary">Our mission</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Make real-time data infrastructure accessible to every engineering team, without the
              complexity.
            </p>
          </div>
          <div className="glass-card p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl text-cta"
              style={{ background: "var(--color-cta-soft)", border: "1px solid var(--color-cta-border)", boxShadow: "0 0 26px rgba(245, 166, 35, 0.18)" }}>
              <Icon name="eye-fill" size={22} />
            </span>
            <h2 className="mt-5 font-display text-xl text-text-primary">Our vision</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              A world where every company can act on their data the moment it is created, not hours
              later.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <SectionHeading tag="What we value" title="How we work" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="glass-card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-cta"
                  style={{ background: "var(--color-cta-soft)", border: "1px solid var(--color-cta-border)", boxShadow: "0 0 26px rgba(245, 166, 35, 0.18)" }}>
                  <Icon name={v.icon} size={22} />
                </span>
                <h3 className="mt-4 font-display text-lg text-text-primary">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{v.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl glass-card p-8">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 text-cta"><Icon name="settings-3-fill" size={26} /></span>
            <div>
              <h2 className="font-display text-2xl text-text-primary">
                Built by database engineers, for database engineers
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Our team has designed and run large-scale data pipelines across e-commerce, fintech,
                and SaaS. We know the sharp edges, and we build to avoid them.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {stack.map((t) => (
                  <span key={t} className="rounded-full px-3 py-1 font-mono text-xs text-text-secondary"
                    style={{ border: "1px solid var(--color-border-default)", background: "var(--color-bg-elevated)" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl glass-card p-8 text-center" style={{ borderColor: "var(--color-accent-border)" }}>
          <h2 className="font-display text-2xl text-text-primary">Let's talk about your data</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-text-secondary">
            Whether you are starting fresh or optimising an existing pipeline, we are happy to help.
          </p>
          <Link href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cta px-6 py-3 text-sm font-semibold text-[#0A1735] transition hover:bg-cta-hover glow-amber">
            Contact us <Icon name="arrow-right-line" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
