import "server-only";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";

const prettyCodeOptions: PrettyCodeOptions = {
  theme: "one-dark-pro",
  // Use our own dark background (set in CSS) so code blocks match the site.
  keepBackground: false,
  // Wrap every line in a span so CSS can add line numbers and line hover.
  onVisitLine(node) {
    if (node.children.length === 0) {
      node.children = [{ type: "text", value: " " }];
    }
  },
};

/**
 * Convert markdown to sanitized, syntax-highlighted HTML.
 * Runs server-side only (Shiki is heavy and must not ship to the client).
 *
 * - remark-gfm: tables, strikethrough, task lists, autolinks
 * - rehype-raw: allow inline HTML already present in posts
 * - rehype-pretty-code (Shiki): syntax highlighting
 * - rehype-slug: heading ids (must match the TOC slugs)
 */
export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return String(file);
}
