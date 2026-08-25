"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { usePathname, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import type { NavNode } from "@/lib/github";
import docsConfig from "@/lib/docs.config";

function hrefFor(node: NavNode, version: string): string {
  const base = `/docs/${node.slug}`;
  const query = `?v=${version}`;
  return node.anchor ? `${base}${query}#${node.anchor}` : `${base}${query}`;
}

/** A leaf link in the sidebar. */
function LinkNode({ node, version, depth, onNavigate }: { node: NavNode; version: string; depth: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = node.slug ? pathname === `/docs/${node.slug}` : false;

  return (
    <Link
      href={hrefFor(node, version)}
      onClick={onNavigate}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${
        isActive
          ? "bg-accent-soft text-accent font-semibold"
          : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
      }`}
      style={{ paddingLeft: `${12 + depth * 12}px` }}
    >
      <Icon name="file-text-line" size={15} className="shrink-0 text-text-muted" />
      <span className="truncate">{node.title}</span>
    </Link>
  );
}

/** A collapsible section (header with children, no link of its own). */
function SectionNode({ node, version, depth, onNavigate }: { node: NavNode; version: string; depth: number; onNavigate?: () => void }) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        aria-label={`${open ? "Collapse" : "Expand"} ${node.title}`}
        className="flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5 text-left text-sm font-semibold text-text-primary transition hover:bg-bg-hover"
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {open ? (
          <Icon name="arrow-down-s-line" size={14} className="shrink-0 text-text-muted" />
        ) : (
          <Icon name="arrow-right-s-line" size={14} className="shrink-0 text-text-muted" />
        )}
        <span className="truncate">{node.title}</span>
      </button>
      {open && node.children.length > 0 && (
        <div className="mt-0.5 space-y-0.5">
          {node.children.map((child, i) => (
            <TreeNode key={`${child.title}-${i}`} node={child} version={version} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeNode({ node, version, depth, onNavigate }: { node: NavNode; version: string; depth: number; onNavigate?: () => void }) {
  if (node.children.length > 0) {
    return <SectionNode node={node} version={version} depth={depth} onNavigate={onNavigate} />;
  }
  if (node.slug) {
    return <LinkNode node={node} version={version} depth={depth} onNavigate={onNavigate} />;
  }
  return (
    <div
      className="px-3 py-1.5 text-sm font-semibold text-text-primary"
      style={{ paddingLeft: `${8 + depth * 12}px` }}
    >
      {node.title}
    </div>
  );
}

/** The sidebar panel contents, shared between desktop and the mobile drawer. */
function SidebarContent({
  tree,
  currentVersion,
  onNavigate,
}: {
  tree: NavNode[];
  currentVersion: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  return (
    <>
      <div className="border-b border-border-default px-4 py-4">
        <Link href="/docs" onClick={onNavigate} className="text-base font-bold text-text-primary">
          {docsConfig.title}
        </Link>

        {docsConfig.versions.length > 1 && (
          <div className="mt-3">
            <select
              value={currentVersion}
              onChange={(e) => router.push(`/docs?v=${e.target.value}`)}
              className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 appearance-none text-sm text-text-primary outline-none transition focus:border-accent"
              style={{ background: "rgba(14, 20, 40, 0.9)" }}
            >
              {docsConfig.versions.map((v) => (
                <option key={v.label} value={v.label}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          {tree.map((node, i) => (
            <TreeNode key={`${node.title}-${i}`} node={node} version={currentVersion} depth={0} onNavigate={onNavigate} />
          ))}
          {tree.length === 0 && (
            <p className="px-3 py-4 text-sm text-text-muted">No documents found.</p>
          )}
        </div>
      </nav>
    </>
  );
}

function DocsSidebarInner({ tree, currentVersion }: { tree: NavNode[]; currentVersion: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle bar (hidden on lg+) */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="flex items-center gap-2 border-b border-border-default px-4 py-3 text-sm font-semibold text-text-primary lg:hidden"
        aria-label="Open documentation menu"
      >
        <Icon name="menu-line" size={18} />
        Docs menu
      </button>

      {/* Desktop sidebar (inline, lg+) */}
      <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-border-default bg-bg-sunken lg:flex">
        <SidebarContent tree={tree} currentVersion={currentVersion} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <div className="absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-bg-sunken shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
              <span className="text-sm font-bold text-text-primary">Documentation</span>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="text-text-secondary">
                <Icon name="close-line" size={20} />
              </button>
            </div>
            <SidebarContent
              tree={tree}
              currentVersion={currentVersion}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function DocsSidebar({
  tree,
  currentVersion,
}: {
  tree: NavNode[];
  currentVersion: string;
}) {
  return (
    <Suspense fallback={<div className="hidden w-72 shrink-0 border-r border-border-default bg-bg-sunken lg:block" />}>
      <DocsSidebarInner tree={tree} currentVersion={currentVersion} />
    </Suspense>
  );
}
