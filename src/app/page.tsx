import Link from "next/link";
import { Icon } from "@/components/Icon";
import { SectionHeading } from "@/components/SectionHeading";
import { FaqAccordion } from "@/components/FaqAccordion";
import { BlogCarousel } from "@/components/BlogCarousel";
import { ContactForm } from "@/components/ContactForm";
import { getAllPosts } from "@/lib/blog";

const chipStyle = {
  background: "var(--color-cta-soft)",
  border: "1px solid var(--color-cta-border)",
  boxShadow: "0 0 26px rgba(245, 166, 35, 0.18)",
};

const offerings = [
  {
    icon: "flashlight-fill",
    title: "Real-time pipelines",
    body: "Change data capture streams every write into ClickHouse as it happens. No overnight batch, no lag, just fresh data your team can act on.",
  },
  {
    icon: "equalizer-fill",
    title: "Database consulting",
    body: "Deep expertise in ClickHouse, MongoDB, and Couchbase. Architecture, performance tuning, high availability, and migrations that stay boring, in the best way.",
  },
  {
    icon: "server-fill",
    title: "Private DBaaS",
    body: "Managed-database convenience on your own Kubernetes. The same one-click automation, a fraction of the cost, and zero vendor lock-in.",
  },
  {
    icon: "hammer-fill",
    title: "Engineering-grade tooling",
    body: "We build the tools we wish existed: a ClickHouse console, a CDC connector, a query profiler, point-in-time backups, and database branching.",
  },
];

const values = [
  { icon: "speed-up-fill", title: "Speed", body: "Milliseconds, not batch windows." },
  { icon: "eye-fill", title: "Transparency", body: "Open tools, honest advice, zero lock-in." },
  { icon: "verified-badge-fill", title: "Craftsmanship", body: "Production grade from the first commit." },
  { icon: "shake-hands-fill", title: "Partnership", body: "We sit with your team, not above it." },
];

const technologies = [
  "MongoDB", "Couchbase", "ClickHouse", "StarRocks",
  "Kafka", "Elasticsearch", "Google Cloud", "AWS",
];

const faqs = [
  {
    q: "What does BlancoByte do?",
    a: "We are the database engineers you call when data needs to be fast and reliable. We design and run real-time pipelines and modern infrastructure, and we help teams get the most from ClickHouse, MongoDB, and Couchbase.",
  },
  {
    q: "Which databases and tools do you work with?",
    a: "ClickHouse, MongoDB, and Couchbase, with streaming through Kafka, search with Elasticsearch, and cloud on Google Cloud and AWS.",
  },
  {
    q: "Can you run a private DBaaS for us?",
    a: "Yes. With our partners we run a private database-as-a-service on your own Kubernetes, so your data stays yours, with predictable cost and no lock-in.",
  },
  {
    q: "How do we start?",
    a: "Tell us about your setup on the contact form below. We reply within one business day, often sooner.",
  },
];

export default function Home() {
  const posts = getAllPosts().slice(0, 6).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.date,
    image: p.image,
    readingTime: p.readingTime,
    tags: p.tags,
  }));

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="section-container py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span
              className="halo inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-accent"
              style={{ border: "1px solid var(--color-accent-border)", background: "var(--color-accent-soft)" }}
            >
              <Icon name="flashlight-fill" size={14} className="text-cta" /> Private. Secure. Insightful.
            </span>

            <h1 className="mt-6 font-display text-4xl leading-[1.08] text-text-primary md:text-6xl">
              Your data, the moment{" "}
              <span className="gradient-text">it happens</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
              We are the database engineers behind fast, reliable data platforms. Real-time pipelines
              and modern infrastructure on ClickHouse, MongoDB, Couchbase, StarRocks, and Kafka, built
              to keep pace with your business.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-cta px-6 py-3 text-sm font-semibold text-[#0A1735] transition hover:bg-cta-hover glow-amber"
              >
                Get started <Icon name="arrow-right-line" size={18} />
              </Link>
              <Link
                href="/consulting"
                className="inline-flex items-center gap-2 rounded-xl border border-border-strong px-6 py-3 text-sm font-semibold text-text-secondary transition hover:border-accent hover:text-accent"
              >
                See our consulting
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="section-container">
          <SectionHeading
            tag="What we do"
            title="Real-time data, minus the complexity"
            description="Fast, reliable data systems, without the overnight batch jobs or the operational drag."
          />
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2">
            {offerings.map((o) => (
              <div key={o.title} className="glass-card p-7 transition hover:border-accent">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl text-cta" style={chipStyle}>
                  <Icon name={o.icon} size={24} />
                </span>
                <h3 className="mt-5 font-display text-xl text-text-primary">{o.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{o.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="section-container">
          <SectionHeading tag="Our tech stack" title="Fluent in your stack" />
          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5">
            {technologies.map((t) => (
              <span
                key={t}
                className="rounded-full px-4 py-2 font-mono text-sm text-text-secondary"
                style={{ border: "1px solid var(--color-border-default)", background: "var(--color-bg-elevated)" }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/consulting" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition hover:gap-2.5">
              See how we use them <Icon name="arrow-right-line" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="section-container">
          <SectionHeading tag="How we work" title="Why teams choose us" />
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="glass-card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-cta" style={chipStyle}>
                  <Icon name={v.icon} size={22} />
                </span>
                <h3 className="mt-4 font-display text-lg text-text-primary">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="section-padding">
          <div className="section-container">
            <SectionHeading
              tag="Blog & knowledge base"
              title="Latest articles"
              description="Field notes from our engineers on ClickHouse, MongoDB, Kafka, and real-time data."
            />
            <BlogCarousel posts={posts} />
          </div>
        </section>
      )}

      <section className="section-padding">
        <div className="section-container">
          <SectionHeading tag="FAQ" title="Questions, answered" />
          <div className="mx-auto mt-10 max-w-2xl">
            <FaqAccordion faqs={faqs} />
          </div>
        </div>
      </section>

      <section id="contact" className="section-padding">
        <div className="section-container">
          <SectionHeading
            tag="Contact"
            title="Let's talk about your data"
            description="Tell us what you are building. We reply within one business day, often sooner."
          />
          <div className="mx-auto mt-10 max-w-2xl">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
