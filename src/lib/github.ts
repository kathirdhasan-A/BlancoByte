import docsConfig, { type DocsVersion } from "./docs.config";

/**
 * A node in the docs navigation, parsed from a docsify-style _sidebar.md.
 *
 * - A "section" is a plain text bullet with no link; it groups children.
 * - A "link" is a bullet with a markdown link; it points to a doc page,
 *   optionally with an anchor (e.g. "guide/dashboards#chart-builder").
 */
export interface NavNode {
  title: string;
  /** Slug used for routing, relative to docs root, e.g. "guide/sql-editor".
   *  Anchor (if any) is stored separately. Null for section headers. */
  slug: string | null;
  /** Optional heading anchor within the page, e.g. "chart-builder". */
  anchor: string | null;
  children: NavNode[];
}

function getHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

/**
 * Convert a docsify sidebar link target into a routing slug + anchor.
 *
 * Examples:
 *   "getting-started/overview.md"          -> { slug: "getting-started/overview", anchor: null }
 *   "guide/dashboards.md#chart-builder"    -> { slug: "guide/dashboards", anchor: "chart-builder" }
 *   "https://github.com/.../guide/x.md#y"  -> { slug: "guide/x", anchor: "y" }
 *   "guide/getting-started.md"                   -> { slug: "guide/getting-started", anchor: null }
 */
function parseTarget(rawHref: string, rootPath: string): { slug: string; anchor: string | null } {
  let href = rawHref.trim();

  // If it's a full GitHub URL, reduce it to the path within the docs root.
  // e.g. https://github.com/owner/repo/blob/main/docs/guide/x.md#y
  const blobMatch = href.match(/\/blob\/[^/]+\/(.+)$/);
  if (blobMatch) {
    href = blobMatch[1]; // e.g. "docs/guide/x.md#y"
  }

  // Strip the docs root prefix if present (e.g. "docs/")
  const prefix = rootPath.endsWith("/") ? rootPath : rootPath + "/";
  if (href.startsWith(prefix)) {
    href = href.slice(prefix.length);
  }

  // Split anchor
  let anchor: string | null = null;
  const hashIndex = href.indexOf("#");
  if (hashIndex !== -1) {
    anchor = href.slice(hashIndex + 1) || null;
    href = href.slice(0, hashIndex);
  }

  // Strip .md extension
  const slug = href.replace(/\.md$/, "");

  return { slug, anchor };
}

/**
 * Parse a docsify _sidebar.md into a nested NavNode tree.
 *
 * Indentation (2 spaces per level) defines nesting. Lines are bullets:
 *   - Section Header            (no link)
 *   - [Title](path/to/page.md)  (link)
 *   - [Title](page.md#anchor)   (link with anchor)
 */
export function parseSidebar(markdown: string, rootPath: string): NavNode[] {
  const lines = markdown.split("\n");
  const root: NavNode[] = [];
  // Stack of { indent, node } to track nesting.
  const stack: { indent: number; children: NavNode[] }[] = [{ indent: -1, children: root }];

  const linkRe = /^\s*[-*]\s+\[([^\]]+)\]\(([^)]+)\)\s*$/;
  const sectionRe = /^\s*[-*]\s+(.+?)\s*$/;

  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;
    // Skip non-bullet lines (e.g. stray headings) defensively.
    if (!/^\s*[-*]\s+/.test(rawLine)) continue;

    // Indentation = leading spaces before the bullet marker.
    const indentMatch = rawLine.match(/^(\s*)[-*]\s+/);
    const indent = indentMatch ? indentMatch[1].length : 0;

    let node: NavNode;
    const linkMatch = rawLine.match(linkRe);
    if (linkMatch) {
      const title = linkMatch[1].trim();
      const { slug, anchor } = parseTarget(linkMatch[2], rootPath);
      node = { title, slug, anchor, children: [] };
    } else {
      const secMatch = rawLine.match(sectionRe);
      if (!secMatch) continue;
      // A bracketed link that didn't match (defensive) or a plain section header.
      const title = secMatch[1].replace(/\[([^\]]+)\]\([^)]*\)/, "$1").trim();
      node = { title, slug: null, anchor: null, children: [] };
    }

    // Pop the stack until we find the parent (smaller indent).
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(node);
    stack.push({ indent, children: node.children });
  }

  return root;
}

/**
 * Fetch and parse the docsify _sidebar.md into a NavNode tree.
 * Returns an empty array if the sidebar cannot be loaded.
 */
export async function fetchSidebar(version: DocsVersion): Promise<NavNode[]> {
  const { owner, repo, sidebarFile } = docsConfig;
  const fullPath = `${version.path}/${sidebarFile}`;
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${version.branch}/${fullPath}`;

  const res = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    console.warn(`Docs sidebar not found (${res.status}) at ${fullPath}`);
    return [];
  }

  const markdown = await res.text();
  return parseSidebar(markdown, version.path);
}

/**
 * Fetch raw markdown content for a doc page.
 * relativePath is relative to version.path (e.g. "guide/sql-editor.md").
 */
export async function fetchMarkdown(
  version: DocsVersion,
  relativePath: string
): Promise<string> {
  const { owner, repo } = docsConfig;
  const fullPath = `${version.path}/${relativePath}`;
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${version.branch}/${fullPath}`;

  const res = await fetch(url, {
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    return `# Not Found\n\nCould not load \`${relativePath}\` from the documentation repository.`;
  }

  let content = await res.text();

  // Strip {#permalink-id} heading anchors (docsify custom IDs)
  content = content.replace(/\s*\{#[^}]+\}/g, "");

  // Strip YAML frontmatter
  if (content.startsWith("---")) {
    const endIndex = content.indexOf("---", 3);
    if (endIndex !== -1) {
      content = content.slice(endIndex + 3).trim();
    }
  }

  return content;
}

/**
 * Find the first linkable slug in the nav tree (used for the docs landing redirect target).
 */
export function firstSlug(nodes: NavNode[]): string | null {
  for (const node of nodes) {
    if (node.slug) return node.slug;
    const childSlug = firstSlug(node.children);
    if (childSlug) return childSlug;
  }
  return null;
}

export function resolveVersion(label?: string): DocsVersion {
  if (!label) return docsConfig.versions[0];
  return (
    docsConfig.versions.find((v) => v.label === label) ||
    docsConfig.versions[0]
  );
}
