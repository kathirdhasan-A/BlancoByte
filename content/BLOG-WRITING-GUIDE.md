# Writing blog posts

A short guide to writing and publishing articles on the BlancoByte site. No coding needed.

## Where posts live

Each post is one Markdown file in `content/blog/`. The file name becomes the URL.

| File | URL |
|---|---|
| `my-first-post.md` | blancobyte.com/blog/my-first-post |
| `mongodb-performance-tips.md` | blancobyte.com/blog/mongodb-performance-tips |

Use lowercase words separated by hyphens. No spaces.

## The editor

The easiest way to write a post is the built in editor. From the project folder run:

```bash
bun run blog-editor
```

Open the URL it prints. Fill in the fields, write your post, then export the Markdown file into `content/blog/`.

## Front matter

Every post starts with a small block of settings between two `---` lines.

```md
---
title: "How to Keep Your Analytics Private"
description: "A short summary shown on the blog list and in search results."
date: "2026-08-14"
author: "BlancoByte"
tags: ["privacy", "mongodb"]
---
```

- `title` is the headline.
- `description` is one or two sentences, used for previews and SEO.
- `date` uses the format YYYY-MM-DD.
- `author` defaults to "BlancoByte" if left out.
- `tags` are lowercase and help readers find related posts.

## Writing the body

Write in plain Markdown below the front matter.

- Use `## Heading` for sections and `### Heading` for sub sections.
- Use `-` for bullet lists.
- Wrap code in triple backticks.
- Use `> ` for a callout or note.
- Link to other pages like `[our consulting page](/consulting)`.

## Publishing

Save the file in `content/blog/`, commit, and push. The site rebuilds and the post goes live. To hide a draft, add `draft: true` to the front matter.
