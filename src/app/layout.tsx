import type { Metadata } from "next";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/geist-mono";
import "remixicon/fonts/remixicon.css";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ReadingProgress } from "@/components/ReadingProgress";
import { VantaBackground } from "@/components/VantaBackground";
import siteConfig from "@/lib/site.config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.domain),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  title: {
    default: "BlancoByte - Real-time data infrastructure and database consulting",
    template: "%s | BlancoByte",
  },
  description:
    "BlancoByte is a database engineering consultancy in the Netherlands. We design and run real-time pipelines and modern data infrastructure with ClickHouse, MongoDB, Couchbase, and Kafka.",
  keywords: [
    "database consultancy",
    "clickhouse consulting",
    "mongodb consulting",
    "couchbase consulting",
    "real-time data pipelines",
    "change data capture",
    "kafka",
    "private dbaas",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.domain,
    siteName: "BlancoByte",
    title: "BlancoByte, Private, secure database solutions",
    description:
      "A database engineering consultancy. Real-time pipelines and modern data infrastructure with ClickHouse, MongoDB, Couchbase, and Kafka.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlancoByte, Private, secure database solutions",
    description:
      "Real-time pipelines and modern data infrastructure with ClickHouse, MongoDB, Couchbase, and Kafka.",
  },
  alternates: { canonical: siteConfig.domain },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BlancoByte",
  url: siteConfig.domain,
  email: siteConfig.email,
  description:
    "Database engineering consultancy. Real-time pipelines and modern data infrastructure with ClickHouse, MongoDB, Couchbase, and Kafka.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Santpoort-Noord",
    addressCountry: "NL",
  },
  sameAs: [siteConfig.linkedin],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="alternate" type="application/rss+xml" title="BlancoByte Blog" href="/feed.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-bg-page text-text-primary">
        <VantaBackground />
        <ReadingProgress />
        <Header />
        <Breadcrumbs />
        <main data-pagefind-body className="relative z-[1]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
