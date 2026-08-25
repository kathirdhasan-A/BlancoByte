import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { ContactForm } from "@/components/ContactForm";
import siteConfig from "@/lib/site.config";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with BlancoByte about private database solutions and consulting. We usually reply within one business day.",
  alternates: { canonical: "https://blancobyte.com/contact" },
};

export default function ContactPage() {
  return (
    <section className="section-padding">
      <div className="section-container">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
          <div>
            <p className="font-mono text-sm uppercase tracking-wider text-accent">Contact</p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-text-primary md:text-5xl">
              Let's talk about your data
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-text-secondary">
              Tell us what you're building or the problem you're facing. We usually reply within one
              business day.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <a
                href={`mailto:${siteConfig.email}`}
                className="glass-card flex items-center gap-4 p-5 transition hover:border-accent"
              >
                <span className="text-cta"><Icon name="mail-fill" size={24} /></span>
                <span>
                  <span className="block text-sm text-text-muted">Email</span>
                  <span className="block font-medium text-text-primary">{siteConfig.email}</span>
                </span>
              </a>
              <a
                href={siteConfig.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card flex items-center gap-4 p-5 transition hover:border-accent"
              >
                <span className="text-cta"><Icon name="linkedin-fill" size={24} /></span>
                <span>
                  <span className="block text-sm text-text-muted">LinkedIn</span>
                  <span className="block font-medium text-text-primary">/company/blancobyte</span>
                </span>
              </a>
              <div className="glass-card flex items-center gap-4 p-5">
                <span className="text-cta"><Icon name="map-pin-fill" size={24} /></span>
                <span>
                  <span className="block text-sm text-text-muted">Location</span>
                  <span className="block font-medium text-text-primary">{siteConfig.location}</span>
                </span>
              </div>
            </div>
          </div>

          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
