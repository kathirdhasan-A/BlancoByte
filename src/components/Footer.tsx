import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import Link from "next/link";
import siteConfig from "@/lib/site.config";

const companyLinks = [
  { name: "Overview", href: "/overview", icon: "dashboard-fill" },
  { name: "Consulting", href: "/consulting", icon: "shake-hands-fill" },
  { name: "Docs", href: "/docs", icon: "book-open-fill" },
  { name: "Blog & Knowledge Base", href: "/blog", icon: "article-line" },
  { name: "Contact", href: "/contact", icon: "mail-fill" },
];

const legalLinks = [{ name: "Privacy Policy", href: "/privacy-policy", icon: "shield-fill" }];

function LinkList({ heading, headingIcon, links }: {
  heading: string; headingIcon: string; links: { name: string; href: string; icon: string }[];
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Icon name={headingIcon} size={18} className="text-cta" />
        {heading}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="group flex items-center gap-2 text-sm text-text-muted transition hover:text-cta">
              <Icon name={link.icon} size={16} className="text-text-muted transition group-hover:text-cta" />
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative z-[1] border-t border-border-default bg-bg-sunken">
      <div className="section-container py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo size="small" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-muted">
              Private, secure database solutions. Your analytics run inside your own network,
              scaled to your needs.
            </p>
            <div className="mt-5 flex flex-col gap-2 text-sm text-text-muted">
              <span className="flex items-center gap-2">
                <Icon name="map-pin-fill" size={17} className="text-cta" />
                {siteConfig.location}
              </span>
              <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-2 transition hover:text-cta">
                <Icon name="mail-fill" size={17} className="text-cta" />
                {siteConfig.email}
              </a>
              <a href={siteConfig.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition hover:text-cta">
                <Icon name="linkedin-fill" size={17} className="text-cta" />
                LinkedIn
              </a>
            </div>
          </div>

          <LinkList heading="Company" headingIcon="apartment" links={companyLinks} />
          <LinkList heading="Legal" headingIcon="gavel" links={legalLinks} />
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-border-default pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} {siteConfig.company}. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-text-muted">
            <Icon name="lock-fill" size={14} className="text-cta" />
            Private. Secure. Insightful.
          </p>
        </div>
      </div>
    </footer>
  );
}
