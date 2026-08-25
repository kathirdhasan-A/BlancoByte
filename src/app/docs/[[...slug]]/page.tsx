import { fetchSidebar, fetchMarkdown, resolveVersion, firstSlug } from "@/lib/github";
import DocsSidebar from "@/components/DocsSidebar";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Icon } from "@/components/Icon";
import docsConfig from "@/lib/docs.config";

export const dynamic = "force-dynamic";

interface DocsPageProps {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ v?: string }>;
}

function DocsComingSoon() {
  return (
    <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto">
      <div className="mx-auto max-w-md px-8 py-20 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-cta"
          style={{ background: "var(--color-cta-soft)", border: "1px solid var(--color-cta-border)", boxShadow: "0 0 26px rgba(245, 166, 35, 0.18)" }}>
          <Icon name="book-open-fill" size={28} />
        </span>
        <h1 className="mt-6 font-display text-3xl text-text-primary">Documentation is on the way</h1>
        <p className="mt-3 text-text-secondary">
          Guides for deploying and running BlancoByte are being written. In the meantime, reach out
          and we will help you get set up.
        </p>
        <a href="/contact"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cta px-6 py-3 text-sm font-semibold text-[#0A1735] transition hover:bg-cta-hover glow-amber">
          Contact us <Icon name="arrow-right-line" size={18} />
        </a>
      </div>
    </main>
  );
}

export default async function DocsPage({ params, searchParams }: DocsPageProps) {
  if (!docsConfig.enabled) {
    return <DocsComingSoon />;
  }

  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

  const versionLabel = resolvedSearch.v || docsConfig.versions[0].label;
  const version = resolveVersion(versionLabel);
  const slug = resolvedParams.slug;

  const tree = await fetchSidebar(version);
  const treeEmpty = tree.length === 0;

  let content: string;

  if (slug && slug.length > 0) {
    const filePath = slug.join("/") + ".md";
    content = await fetchMarkdown(version, filePath);
  } else {
    // Landing: prefer the first linkable page from the sidebar, else index/README.
    const landingSlug = firstSlug(tree);
    let indexContent = "";

    if (landingSlug) {
      indexContent = await fetchMarkdown(version, `${landingSlug}.md`);
    }
    if (!landingSlug || indexContent.startsWith("# Not Found")) {
      indexContent = await fetchMarkdown(version, "index.md");
    }
    if (indexContent.startsWith("# Not Found")) {
      indexContent = await fetchMarkdown(version, "README.md");
    }

    if (indexContent.startsWith("# Not Found")) {
      if (treeEmpty) {
        content = `# ${docsConfig.title}

Documentation is loading from GitHub. If the sidebar is empty, a **GITHUB_TOKEN** environment variable may be needed to avoid API rate limits.

**Source:** [${docsConfig.owner}/${docsConfig.repo}](https://github.com/${docsConfig.owner}/${docsConfig.repo}/tree/${version.branch}/${version.path})`;
      } else {
        content = `# ${docsConfig.title}\n\nSelect a document from the sidebar to get started.`;
      }
    } else {
      content = indexContent;
    }
  }

  return (
    <>
      <DocsSidebar tree={tree} currentVersion={versionLabel} />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-10 md:px-12">
          <MarkdownRenderer content={content} />
        </div>
      </main>
    </>
  );
}
