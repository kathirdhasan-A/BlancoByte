#!/usr/bin/env node
/**
 * BlancoByte Blog Editor local server
 *
 * Serves the WYSIWYG editor and saves posts straight into content/blog/
 * so you don't have to move files out of your Downloads folder.
 *
 * Usage (from the repo root or the tools/ folder):
 *   node tools/blog-editor-server.mjs
 * then open http://localhost:4477
 *
 * Zero dependencies - uses only Node's built-in http/fs/path.
 */
import { createServer } from "node:http";
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// tools/ -> repo root -> content/blog
const REPO_ROOT = resolve(__dirname, "..");
const BLOG_DIR = join(REPO_ROOT, "content", "blog");
const PUBLIC_DIR = join(REPO_ROOT, "public");
const BLOG_IMAGES_DIR = join(PUBLIC_DIR, "blog", "images");
const EDITOR_HTML = join(__dirname, "blog-editor.html");
const PORT = process.env.PORT || 4477;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".avif": "image/avif", ".ico": "image/x-icon",
};

function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // Serve the editor
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      const html = await readFile(EDITOR_HTML, "utf8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    // List existing posts
    if (req.method === "GET" && url.pathname === "/api/list") {
      if (!existsSync(BLOG_DIR)) return json(res, 200, { posts: [] });
      const files = (await readdir(BLOG_DIR)).filter((f) => f.endsWith(".md") && !f.startsWith("_") && f !== "BLOG-WRITING-GUIDE.md");
      return json(res, 200, { posts: files.sort() });
    }

    // Load a post for editing
    if (req.method === "GET" && url.pathname === "/api/load") {
      const slug = url.searchParams.get("slug") || "";
      if (!SLUG_RE.test(slug)) return json(res, 400, { error: "Invalid slug" });
      const file = join(BLOG_DIR, slug + ".md");
      if (!existsSync(file)) return json(res, 404, { error: "Not found" });
      const content = await readFile(file, "utf8");
      return json(res, 200, { slug, content });
    }

    // Save a post into content/blog/
    if (req.method === "POST" && url.pathname === "/api/save") {
      const body = JSON.parse(await readBody(req));
      const { slug, content, overwrite } = body;
      if (!SLUG_RE.test(slug || "")) {
        return json(res, 400, { error: "Invalid filename slug. Use lowercase words separated by hyphens." });
      }
      if (!content || typeof content !== "string") {
        return json(res, 400, { error: "Empty content." });
      }
      await mkdir(BLOG_DIR, { recursive: true });
      const file = join(BLOG_DIR, slug + ".md");
      const exists = existsSync(file);
      if (exists && !overwrite) {
        return json(res, 409, { error: "exists", message: `${slug}.md already exists.` });
      }
      await writeFile(file, content, "utf8");
      return json(res, 200, {
        saved: true,
        overwritten: exists,
        path: `content/blog/${slug}.md`,
      });
    }

    // List local blog images (so the editor can offer them and render them)
    if (req.method === "GET" && url.pathname === "/api/images") {
      if (!existsSync(BLOG_IMAGES_DIR)) return json(res, 200, { images: [] });
      const files = (await readdir(BLOG_IMAGES_DIR))
        .filter((f) => /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(f))
        .sort();
      // Return the public web paths the site uses
      return json(res, 200, { images: files.map((f) => `/blog/images/${f}`) });
    }

    // Serve files from public/ so local image paths (/blog/images/..) render in preview
    if (req.method === "GET" && url.pathname.startsWith("/blog/images/")) {
      const rel = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
      const filePath = join(PUBLIC_DIR, rel);
      // prevent path traversal
      if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath)) {
        res.writeHead(404); res.end("Not found"); return;
      }
      const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
      const buf = await readFile(filePath);
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "no-cache" });
      res.end(buf);
      return;
    }

    json(res, 404, { error: "Not found" });
  } catch (err) {
    json(res, 500, { error: String(err && err.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`\n  BlancoByte Blog Editor running`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  Saving posts to: ${BLOG_DIR}\n`);
});
