import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import siteConfig from "@/lib/site.config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How BlancoByte handles personal data collected through this website.",
  alternates: { canonical: "https://blancobyte.com/privacy-policy" },
};

const sections = [
  {
    icon: "information-fill",
    h: "Who we are",
    p: `BlancoByte is a database consultancy based in ${siteConfig.location}. This policy explains how we handle personal data collected through this website. Questions can be sent to ${siteConfig.email}.`,
  },
  {
    icon: "file-list-2-fill",
    h: "What we collect",
    p: "When you use the contact form we collect the name, email address, company, and message you provide. We may also collect basic technical data such as your IP address and browser type for security and to keep the site running.",
  },
  {
    icon: "settings-3-fill",
    h: "How we use it",
    p: "We use your details only to respond to your enquiry and to provide the services you ask about. We do not sell your data. We do not share it with third parties except service providers who help us operate the site, and only as needed.",
  },
  {
    icon: "auction-fill",
    h: "Legal basis",
    p: "We process contact data on the basis of your consent and our legitimate interest in responding to enquiries. You can withdraw consent at any time by contacting us.",
  },
  {
    icon: "time-fill",
    h: "Data retention",
    p: "We keep enquiry data only as long as needed to handle your request and any follow-up, then delete it unless a business relationship requires us to keep it longer.",
  },
  {
    icon: "shield-check-fill",
    h: "Your rights",
    p: "Under the GDPR you can request access to, correction of, or deletion of your personal data, and object to or restrict its processing. To exercise these rights, contact us at the address below.",
  },
  {
    icon: "window-2-fill",
    h: "Cookies",
    p: "This site uses only the cookies needed to function and, where enabled, privacy-respecting analytics. You can block cookies in your browser settings.",
  },
  {
    icon: "mail-fill",
    h: "Contact",
    p: `For any privacy question or request, email ${siteConfig.email}.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <section className="section-padding">
      <div className="section-container">
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-sm uppercase tracking-wider text-accent">Legal</p>
          <h1 className="mt-3 font-display text-4xl text-text-primary md:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-sm text-text-muted">Last updated: {new Date().getFullYear()}</p>

          <div className="mt-10 space-y-8">
            {sections.map((s) => (
              <div key={s.h}>
                <h2 className="flex items-center gap-2.5 font-display text-xl text-text-primary">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg text-cta"
                    style={{ background: "var(--color-cta-soft)", border: "1px solid var(--color-cta-border)" }}>
                    <Icon name={s.icon} size={18} />
                  </span>
                  {s.h}
                </h2>
                <p className="mt-2 leading-relaxed text-text-secondary">{s.p}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
