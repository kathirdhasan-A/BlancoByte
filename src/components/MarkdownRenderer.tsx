import { renderMarkdown } from "@/lib/markdown";
import { MarkdownContent } from "@/components/MarkdownContent";

/**
 * Server component: renders markdown to syntax-highlighted HTML (Shiki, build/request
 * time) and hands it to a small client wrapper that adds copy buttons.
 *
 * Styling for all elements lives in globals.css under `.md-content` so the output
 * matches the previous react-markdown styling exactly, plus highlighted code blocks.
 */
export default async function MarkdownRenderer({ content }: { content: string }) {
  const html = await renderMarkdown(content);
  return <MarkdownContent html={html} />;
}
