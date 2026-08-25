import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { SectionHeading } from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "Consulting",
  description:
    "BlancoByte database consulting across ClickHouse, MongoDB, Couchbase, Kafka, and the cloud. Architecture, performance tuning, high availability, and migrations.",
  alternates: { canonical: "https://blancobyte.com/consulting" },
};

const partners = [
  { name: "Solanica", href: "https://solanica.io/", logo: "/logos/solanica.png" },
  { name: "OpenEverest", href: "https://openeverest.io/", logo: "/logos/openeverest.png" },
];

const trustedBy = [
  { alt: "Adscore", src: "/logos/adscore.png" },
  { alt: "Samet", src: "/logos/samet.png" },
  { alt: "GlassFlow", src: "/logos/glassflow.png" },
  { alt: "QONE", src: "/logos/qone.png" },
  { alt: "BareMetal", src: "/logos/baremetal.png" },
  { alt: "Quantrail Data", src: "/logos/quantrail.png" },
];

const stack = [
  { name: "Google Cloud", tag: "Cloud", icon: "cloud-fill", body: "Scalable cloud infrastructure powering modern data solutions." },
  { name: "StarRocks", tag: "Relational", icon: "table-2", body: "SQL engines for enterprise-scale analytics." },
  { name: "Amazon AWS", tag: "Cloud", icon: "cloud-line", body: "Scalable cloud infrastructure for data workloads of any size." },
  { name: "Kafka", tag: "Streaming", icon: "broadcast-fill", body: "Distributed event streaming for high-throughput, real-time pipelines." },
  { name: "Elasticsearch", tag: "Search", icon: "search-eye-fill", body: "Full-text search and analytics at any scale." },
  { name: "ClickHouse", tag: "Analytics", icon: "flashlight-fill", body: "Blazing-fast OLAP queries on billions of rows." },
  { name: "MongoDB", tag: "NoSQL", icon: "braces-fill", body: "Flexible documents for rapidly evolving schemas." },
  { name: "Couchbase", tag: "NoSQL", icon: "hard-drive-2-fill", body: "Distributed NoSQL built for low-latency apps." },
];

const expertise = [
  {
    name: "MongoDB",
    icon: "braces-fill",
    body: "End-to-end consulting for the leading NoSQL database. We design scalable data architectures, tune query performance, set up high-availability clusters, and plan migrations. From a first deployment to improving an existing one, we build for reliability, security, and long-term scale.",
  },
  {
    name: "Couchbase",
    icon: "hard-drive-2-fill",
    body: "Help getting the most from Couchbase for modern, data-heavy apps. We cover cluster design and deployment, data modeling, replication, and performance tuning, across cloud and on-premise, so you can scale with low latency and confidence.",
  },
  {
    name: "ClickHouse",
    icon: "flashlight-fill",
    body: "Real-time analytics with the leading columnar database. We design optimised pipelines, write high-performance queries, and build scalable analytics. Whether you are migrating, handling large event streams, or powering interactive dashboards, we keep it fast, reliable, and cost-effective.",
  },
];

export default function ConsultingPage() {
  return (
    <section className="section-padding">
      <div className="section-container">
        <div className="mx-auto max-w-3xl">
          <p className="halo font-mono text-sm uppercase tracking-wider text-accent">Technologies we master</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-text-primary md:text-5xl">
            Our tech stack
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-text-secondary">
            The databases and tools we work with every single day. We work alongside your team to
            design, build, and run data systems that fit your needs.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stack.map((s) => (
            <div key={s.name} className="glass-card p-6 transition hover:border-accent">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl text-cta"
                style={{ background: "var(--color-cta-soft)", border: "1px solid var(--color-cta-border)", boxShadow: "0 0 26px rgba(245, 166, 35, 0.18)" }}>
                <Icon name={s.icon} size={22} />
              </span>
              <p className="mt-4 font-mono text-xs uppercase tracking-wider text-accent">{s.tag}</p>
              <h2 className="mt-1 font-display text-lg text-text-primary">{s.name}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-20 max-w-4xl">
          <SectionHeading tag="Deep expertise" title="Where we go furthest" />
          <div className="mt-10 space-y-5">
            {expertise.map((e) => (
              <div key={e.name} className="glass-card p-8">
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-cta"
                    style={{ background: "var(--color-cta-soft)", border: "1px solid var(--color-cta-border)", boxShadow: "0 0 26px rgba(245, 166, 35, 0.18)" }}>
                    <Icon name={e.icon} size={22} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl text-text-primary">{e.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">{e.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-muted">
            <Icon name="group-fill" size={18} className="text-cta" /> Our partners
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {partners.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={p.name}
                className="flex h-24 items-center justify-center rounded-xl bg-white p-6 transition hover:opacity-90"
              >
                <img src={p.logo} alt={p.name} className="max-h-12 w-auto object-contain" loading="lazy" />
              </a>
            ))}
          </div>

          <h3 className="mt-12 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-muted">
            <Icon name="verified-badge-fill" size={18} className="text-cta" /> Trusted by
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {trustedBy.map((t) => (
              <div key={t.src} className="flex h-20 items-center justify-center rounded-lg bg-white p-4">
                <img src={t.src} alt={t.alt} className="max-h-10 w-auto max-w-full object-contain" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl glass-card p-8 text-center" style={{ borderColor: "var(--color-accent-border)" }}>
          <h2 className="font-display text-2xl text-text-primary">Have a project in mind?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-text-secondary">
            Tell us the shape of the problem and we will come back with how we would approach it.
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
