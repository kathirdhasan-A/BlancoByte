import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import Link from "next/link";
import { getPaginatedPosts, getTotalPages, getAllTags } from "@/lib/blog";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/SectionHeading";
import { SiteSearch } from "@/components/SiteSearch";
import { BlogPagination } from "@/components/BlogPagination";

interface PageProps {
  params: Promise<{ num: string }>;
}

export async function generateStaticParams() {
  const total = getTotalPages();
  return Array.from({ length: total }, (_, i) => ({ num: String(i + 1) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { num } = await params;
  return {
    title: `Blog - Page ${num}`,
    alternates: { canonical: `https://blancobyte.com/blog/page/${num}` },
  };
}

export default async function BlogPaginatedPage({ params }: PageProps) {
  const { num } = await params;
  const page = parseInt(num, 10);
  if (isNaN(page) || page < 1) notFound();

  const { posts, totalPages } = getPaginatedPosts(page);
  if (page > totalPages) notFound();

  const tags = getAllTags();

  return (
    <section className="section-padding">
      <div className="section-container">
        <SectionHeading as="h1" tag="Blog" title="Articles and updates" />

        <div className="mx-auto mt-8 max-w-5xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 8).map(({ tag, count }) => (
              <Link key={tag} href={`/blog/tag/${tag}`} className="rounded-full border border-border-default bg-bg-elevated px-3 py-1 text-xs text-text-muted transition hover:border-accent hover:text-accent">
                {tag} ({count})
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <SiteSearch />
            <a href="/feed.xml" className="flex items-center gap-1.5 text-sm text-text-muted transition hover:text-accent" title="RSS"><Icon name="rss-line" size={16} /></a>
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <article key={post.slug} className="glass-card flex flex-col overflow-hidden transition hover:border-accent">
              <Link href={`/blog/${post.slug}`} className="block">
                {post.image && (
                  <img src={post.image} alt="" className="aspect-video w-full object-cover" />
                )}
              </Link>
              <div className="flex flex-1 flex-col p-7">
                {post.draft && <span className="mb-2 inline-block rounded bg-yellow-500/20 px-2 py-0.5 text-xs font-semibold text-yellow-400">DRAFT</span>}
                <Link href={`/blog/${post.slug}`} className="block">
                  <h2 className="text-xl font-bold text-text-primary transition hover:text-accent">{post.title}</h2>
                  <p className="mt-2 leading-relaxed text-text-secondary">{post.description}</p>
                </Link>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <Icon name="user-line" size={14} />
                    {post.authorUrl ? (
                      <a href={post.authorUrl} target="_blank" rel="noopener noreferrer" className="text-accent transition hover:underline underline-offset-2">{post.author}</a>
                    ) : (
                      <span>{post.author}</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5"><Icon name="calendar-line" size={14} />{new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                  <span className="flex items-center gap-1.5"><Icon name="time-fill" size={14} />{post.readingTime}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.map((t) => (<Link key={t} href={`/blog/tag/${t}`} className="rounded bg-bg-elevated px-1.5 py-0.5 text-xs text-text-muted transition hover:text-accent">{t}</Link>))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <BlogPagination currentPage={page} totalPages={totalPages} />
      </div>
    </section>
  );
}
