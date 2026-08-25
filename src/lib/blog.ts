import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { authorLink } from "@/lib/authors";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
export const POSTS_PER_PAGE = 6;

export interface TocItem {
  text: string;
  slug: string;
  level: number;
  children: TocItem[];
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  authorUrl: string | null;
  tags: string[];
  image: string | null;
  canonicalUrl: string | null;
  draft: boolean;
  readingTime: string;
  content: string;
  toc: TocItem[];
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  image: string | null;
}

export function generateToc(content: string): TocItem[] {
  // Only the two heading levels used in posts: ## (top) and ### (nested under it).
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const flat: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[2].replace(/\*\*/g, "").replace(/`/g, "").trim();
    const slug = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
    flat.push({ text, slug, level: match[1].length, children: [] });
  }

  // Nest level-3 headings under the most recent level-2 heading.
  const tree: TocItem[] = [];
  let lastTop: TocItem | null = null;
  for (const item of flat) {
    if (item.level === 2) {
      lastTop = item;
      tree.push(item);
    } else if (lastTop) {
      lastTop.children.push(item);
    } else {
      // an H3 before any H2 - treat as top-level
      tree.push(item);
    }
  }
  return tree;
}

export function parsePost(filename: string, dir: string = BLOG_DIR): BlogPost {
  const filePath = path.join(dir, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const stats = readingTime(content);

  return {
    slug: filename.replace(/\.md$/, ""),
    title: data.title || filename,
    description: data.description || "",
    date: data.date || "1970-01-01",
    author: data.author || "BlancoByte",
    authorUrl: data.authorUrl || data.authorLink || authorLink(data.author || "BlancoByte"),
    tags: (data.tags || []).map((t: string) => t.toLowerCase()),
    image: data.image || null,
    canonicalUrl: data.canonicalUrl || data.canonical || null,
    draft: data.draft === true,
    readingTime: stats.text,
    content,
    toc: generateToc(content),
  };
}

export function isPublished(post: BlogPost): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return !post.draft;
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parsePost(f))
    .filter(isPublished)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPaginatedPosts(page: number): { posts: BlogPost[]; totalPages: number } {
  const all = getAllPosts();
  const totalPages = Math.max(1, Math.ceil(all.length / POSTS_PER_PAGE));
  const start = (page - 1) * POSTS_PER_PAGE;
  return { posts: all.slice(start, start + POSTS_PER_PAGE), totalPages };
}

export function getTotalPages(): number {
  return Math.max(1, Math.ceil(getAllPosts().length / POSTS_PER_PAGE));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const post = parsePost(`${slug}.md`);
  return isPublished(post) ? post : null;
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

export function getAllTags(): { tag: string; count: number }[] {
  const tagMap = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }
  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter((p) => p.tags.includes(tag.toLowerCase()));
}

export function getAdjacentPosts(slug: string): { prev: BlogPost | null; next: BlogPost | null } {
  const posts = getAllPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  return {
    prev: index < posts.length - 1 ? posts[index + 1] : null,
    next: index > 0 ? posts[index - 1] : null,
  };
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getPostBySlug(slug);
  if (!current) return [];

  const posts = getAllPosts().filter((p) => p.slug !== slug);

  const scored = posts.map((post) => {
    const sharedTags = post.tags.filter((t) => current.tags.includes(t)).length;
    return { post, score: sharedTags };
  });

  scored.sort((a, b) => b.score - a.score || new Date(b.post.date).getTime() - new Date(a.post.date).getTime());

  return scored.slice(0, limit).map((s) => s.post);
}

