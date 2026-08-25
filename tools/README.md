# Blog Editor

A self-contained editor for writing BlancoByte blog posts. It produces markdown
in the exact format the site expects (frontmatter + body) and includes a live SEO score.

## Two ways to use it

### 1. Save straight into content/blog/ (recommended)

Run the local server from the repo root:

```
npm run blog-editor
```

Then open http://localhost:4477

- **Save to blog** writes the post directly to `content/blog/<slug>.md` - no Downloads folder step.
- **Open existing** lists posts already in `content/blog/` and loads one for editing.
- Existing files are never overwritten without a confirmation prompt.

After saving, commit and push as usual:

```
git add content/blog/<slug>.md
git commit -m "New blog post: <title>"
git push origin preview
```

### 2. Standalone (no server)

Open `tools/blog-editor.html` directly in a browser. In this mode the Save button
becomes **Download .md** (browsers can't write to disk without the server). Move the
downloaded file into `content/blog/` yourself.

## Features

- Full-width post-details form: title, description, date, author, cover image, tags, draft
- Live character counters (title ≤60, description ≤160)
- Markdown toolbar (headings, bold/italic, code, lists, quote, link, image, code block, table, divider) with Ctrl+B / Ctrl+I / Ctrl+K shortcuts
- Live preview styled like the real blog
- SEO panel with a weighted score out of 10 (length, structure, headings, links, keyword placement, cover image, tag count)
- Import an existing `.md` to edit it
- Auto slug from title (strips ®/™), editable

The site handles technical SEO (meta tags, Open Graph, JSON-LD, sitemap, RSS) automatically
from the frontmatter. The SEO panel focuses on content quality, which is the part that needs a human.


## Local images

Blog images live in `public/blog/images/` and are referenced in posts as
`/blog/images/your-image.jpg` (this is the web path, which differs from the repo
folder path `public/blog/images/`).

When running via `npm run blog-editor`, the editor:
- serves those images so they render in the live preview, and
- the **Pick** button (cover image) and the toolbar **Img** button list the files
  already in `public/blog/images/` so you can insert them without typing the path.

To add a new image: drop the file into `public/blog/images/`, then pick it in the editor.
