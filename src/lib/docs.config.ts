/**
 * BlancoByte Documentation Configuration
 *
 * The docs are sourced from a docsify-style repository where a `_sidebar.md`
 * file defines the navigation structure. The sidebar markdown is parsed to
 * build the navigation tree; individual pages are fetched as raw markdown.
 */

export interface DocsVersion {
  /** Display label in the version dropdown */
  label: string;
  /** GitHub branch or tag name */
  branch: string;
  /** Path within the repository to the docs root (no leading/trailing slash) */
  path: string;
}

export interface DocsConfig {
  /** GitHub owner (user or org) */
  owner: string;
  /** GitHub repository name */
  repo: string;
  /** Ordered list of versions. First entry is the default. */
  versions: DocsVersion[];
  /** Title shown in the docs sidebar header */
  title: string;
  /** Sidebar definition file within the docs path */
  sidebarFile: string;
  /** When false, the Docs page shows a placeholder and does not call GitHub */
  enabled: boolean;
}

const docsConfig: DocsConfig = {
  owner: "kathirdhasan-A",
  repo: "docs",
  title: "BlancoByte Docs",
  sidebarFile: "_sidebar.md",
  enabled: true,
  versions: [
    {
      label: "latest",
      branch: "main",
      path: "docs",
    },
  ],
};

export default docsConfig;
