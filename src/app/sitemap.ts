import type { MetadataRoute } from "next";
import { getAllSlugs, getAllTags } from "@/lib/blog";
import siteConfig from "@/lib/site.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.domain;
  const now = new Date().toISOString();

  const routes = ["/", "/overview", "/consulting", "/docs", "/contact", "/privacy-policy"];

  const blogSlugs = getAllSlugs();
  const blogTags = getAllTags();

  const blogRoutes = [
    "/blog",
    ...blogSlugs.map((s) => `/blog/${s}`),
    ...blogTags.map((t) => `/blog/tag/${t.tag}`),
  ];

  return [...routes, ...blogRoutes].map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/blog" || route === "/consulting" ? 0.8 : 0.6,
  }));
}
