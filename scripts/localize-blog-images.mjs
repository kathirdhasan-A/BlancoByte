#!/usr/bin/env node
/**
 * Localize blog images.
 *
 * Scans content/blog/*.md, downloads every https://blancobyte.com image into
 * public/blog-images/, then rewrites the markdown (frontmatter `image:` and
 * inline `![](...)` / `<img src>`) to point at the local /blog-images/ path.
 *
 * Safe to re-run: already-downloaded files are skipped, already-local URLs
 * are ignored. Requires internet access to blancobyte.com (Node 18+ for fetch).
 *
 *   node scripts/localize-blog-images.mjs
 */
import { readFile, writeFile, readdir, mkdir, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BLOG_DIR = join(ROOT, "content", "blog");
const OUT_DIR = join(ROOT, "public", "blog-images");
const HOST = "https://blancobyte.com";
// Any blancobyte.com URL that ends in an image extension.
const URL_RE = /https?:\/\/blancobyte\.com\/[^\s)"'<>]+?\.(?:png|jpe?g|gif|webp|svg|avif)/gi;

const exists = (p) => access(p).then(() => true).catch(() => false);

// URL -> stable, collision-free local filename derived from its upload path.
function localName(url) {
  const path = new URL(url).pathname.replace(/^\/wp-content\/uploads\//, "");
  return path.replace(/[/\\]/g, "-").replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(BLOG_DIR)).filter((f) => f.endsWith(".md"));

  // Collect unique URLs across all posts.
  const urls = new Set();
  const perFile = new Map();
  for (const f of files) {
    const text = await readFile(join(BLOG_DIR, f), "utf8");
    const found = text.match(URL_RE) || [];
    perFile.set(f, text);
    found.forEach((u) => urls.add(u));
  }
  console.log(`Found ${urls.size} unique images across ${files.length} posts.`);

  // Download each once.
  const map = new Map(); // url -> /blog-images/<name>
  let ok = 0, failed = 0, skipped = 0;
  for (const url of urls) {
    const name = localName(url);
    const dest = join(OUT_DIR, name);
    map.set(url, `/blog-images/${name}`);
    if (await exists(dest)) { skipped++; continue; }
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Referer: "https://blancobyte.com/",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(dest, buf);
      ok++;
      console.log(`  downloaded ${name} (${buf.length} bytes)`);
    } catch (e) {
      failed++;
      map.delete(url); // don't rewrite what we couldn't fetch
      console.warn(`  FAILED ${url} -> ${e.message}`);
    }
  }
  console.log(`Downloaded ${ok}, skipped ${skipped} (already local), failed ${failed}.`);

  // Rewrite markdown for every URL we have locally.
  let rewritten = 0;
  for (const f of files) {
    let text = perFile.get(f);
    let changed = false;
    for (const [url, local] of map) {
      if (text.includes(url)) { text = text.split(url).join(local); changed = true; }
    }
    if (changed) { await writeFile(join(BLOG_DIR, f), text); rewritten++; }
  }
  console.log(`Rewrote ${rewritten} markdown files.`);
  if (failed) {
    console.log(`\n${failed} image(s) could not be downloaded and were left as remote links.`);
    process.exitCode = 1;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
