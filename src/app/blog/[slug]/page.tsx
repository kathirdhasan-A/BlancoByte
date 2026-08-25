import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getAllSlugs, getAdjacentPosts, getRelatedPosts } from "@/lib/blog";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { ShareButtons } from "@/components/ShareButtons";
import { ServicesCTA } from "@/components/ServicesCTA";
import type { TocItem } from "@/lib/blog";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

/** Total number of TOC entries (top-level + nested children). */
function tocCount(toc: TocItem[]): number {
  return toc.reduce((n, item) => n + 1 + item.children.length, 0);
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title}`,
    description: post.description,
    alternates: { canonical: `https://blancobyte.com/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      ...(post.image ? { images: [{ url: post.image, width: 1200, height: 630 }] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(slug);
  const related = getRelatedPosts(slug, 3);
  const postUrl = `https://blancobyte.com/blog/${slug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    ...(post.image ? { image: `https://blancobyte.com${post.image}` } : {}),
    author: { "@type": "Person", name: post.author, url: post.authorUrl || "https://blancobyte.com" },
    publisher: { "@type": "Organization", name: "BlancoByte", url: "https://blancobyte.com" },
    mainEntityOfPage: postUrl,
    keywords: post.tags.join(", "),
    wordCount: post.content.split(/\s+/).length,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <section className="section-padding">
        <div className="section-container">
          <div className="mx-auto max-w-3xl">
            <Link href="/blog" className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted transition hover:text-accent">
              <Icon name="arrow-left-line" size={14} /> All posts
            </Link>

            {/* Featured image */}
            {post.image && (
              <div className="mb-8 overflow-hidden rounded-xl border border-border-default">
                <img src={post.image} alt={post.title} className="w-full h-auto object-cover" style={{ maxHeight: "400px" }} />
              </div>
            )}

            {post.draft && <span className="mb-3 inline-block rounded bg-yellow-500/20 px-3 py-1 text-sm font-semibold text-yellow-400">DRAFT</span>}

            <h1 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">{post.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1.5"><Icon name="calendar-line" size={14} />{new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              <span className="flex items-center gap-1.5"><Icon name="time-fill" size={14} />{post.readingTime}</span>
              <span className="flex items-center gap-1.5">
                <Icon name="user-line" size={14} />
                {post.authorUrl ? (
                  <a href={post.authorUrl} target="_blank" rel="noopener noreferrer" className="text-accent transition hover:underline underline-offset-2">
                    {post.author}
                  </a>
                ) : (
                  <span>{post.author}</span>
                )}
              </span>
            </div>

            {post.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link key={tag} href={`/blog/tag/${tag}`} className="rounded-full border border-border-default bg-bg-elevated px-3 py-0.5 text-xs text-text-muted transition hover:border-accent hover:text-accent">
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Share buttons */}
            <div className="mt-5">
              <ShareButtons title={post.title} url={postUrl} />
            </div>

            {/* Table of Contents */}
            {tocCount(post.toc) > 2 && (
              <nav className="mt-8 glass-card p-5" aria-label="Table of contents">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-muted mb-3">
                  <Icon name="list-unordered" size={16} /> In this article
                </div>
                <ul className="space-y-1.5">
                  {post.toc.map((item) => (
                    <li key={item.slug}>
                      <a href={`#${item.slug}`} className="text-sm font-medium text-text-secondary transition hover:text-accent">{item.text}</a>
                      {item.children.length > 0 && (
                        <ul className="mt-1.5 space-y-1.5 border-l border-border-default pl-4">
                          {item.children.map((child) => (
                            <li key={child.slug}>
                              <a href={`#${child.slug}`} className="text-sm text-text-muted transition hover:text-accent">{child.text}</a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <div className="gradient-divider my-8" />

            <article className="prose-custom">
              <MarkdownRenderer content={post.content} />
            </article>

            <ServicesCTA />

            <div className="gradient-divider my-8" />

            {/* Share again at bottom */}
            <ShareButtons title={post.title} url={postUrl} />

            {/* Related posts */}
            {related.length > 0 && (
              <div className="mt-10">
                <h2 className="text-lg font-bold text-text-primary mb-4">Related articles</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  {related.map((r) => (
                    <Link key={r.slug} href={`/blog/${r.slug}`} className="glass-card overflow-hidden transition hover:border-accent group">
                      {r.image && <img src={r.image} alt="" className="h-28 w-full object-cover" loading="lazy" />}
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition line-clamp-2">{r.title}</h3>
                        <p className="mt-1 text-xs text-text-muted">{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Prev / Next */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {prev ? (
                <Link href={`/blog/${prev.slug}`} className="glass-card p-5 transition hover:border-accent group">
                  <span className="flex items-center gap-1 text-xs text-text-muted"><Icon name="arrow-left-line" size={12} /> Older</span>
                  <span className="mt-1 block font-semibold text-text-primary group-hover:text-accent transition">{prev.title}</span>
                </Link>
              ) : <div />}
              {next ? (
                <Link href={`/blog/${next.slug}`} className="glass-card p-5 text-right transition hover:border-accent group">
                  <span className="flex items-center justify-end gap-1 text-xs text-text-muted">Newer <Icon name="arrow-right-line" size={12} /></span>
                  <span className="mt-1 block font-semibold text-text-primary group-hover:text-accent transition">{next.title}</span>
                </Link>
              ) : <div />}
            </div>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="/contact" className="rounded-xl bg-cta px-6 py-2.5 font-semibold text-[#0A1735] transition hover:bg-cta-hover">Get in touch</a>
              <Link href="/consulting" className="rounded-xl border border-border-default px-6 py-2.5 font-semibold text-text-secondary transition hover:border-accent hover:text-accent">Explore consulting</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
