import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostsByTag, getAllTags } from "@/lib/blog";
import { SectionHeading } from "@/components/SectionHeading";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `Posts tagged "${tag}" `,
    description: `Articles tagged ${tag}, databases, analytics, and running data privately.`,
    alternates: { canonical: `https://blancobyte.com/blog/tag/${tag}` },
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const posts = getPostsByTag(tag);
  if (posts.length === 0) notFound();

  return (
    <section className="section-padding">
      <div className="section-container">
        <SectionHeading as="h1" tag={`Tag: ${tag}`} title={`Posts tagged "${tag}"`} />

        <div className="mx-auto mt-8 max-w-3xl">
          <Link href="/blog" className="text-sm text-accent underline underline-offset-4">&larr; All posts</Link>
        </div>

        <div className="mx-auto mt-6 max-w-3xl space-y-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
              <article className="glass-card p-7 transition hover:border-accent">
                <h2 className="text-xl font-bold text-text-primary">{post.title}</h2>
                <p className="mt-2 leading-relaxed text-text-secondary">{post.description}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <Icon name="calendar-line" size={14} />
                    {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="time-fill" size={14} />
                    {post.readingTime}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
