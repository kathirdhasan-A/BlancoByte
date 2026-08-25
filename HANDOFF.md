# BlancoByte website handoff

Rebranded from an existing Next.js codebase. All old branding has been removed.

## Run (Bun)

```bash
bun install
bun run dev          # http://localhost:3000
bun run build        # production build plus Pagefind search index
bun run start        # serve the production build
bun run blog-editor  # local editor for writing posts
```

Next.js 16, Tailwind v4, TypeScript. Tested with Bun 1.3.x and 1.4.x.
The committed bun.lock makes Vercel install with Bun. The build script calls the
pagefind binary directly, so it does not depend on npm.

## Deploy (Vercel)

Push to GitHub, import at vercel.com/new (Next.js preset is auto detected), add
the env vars below, deploy, then add your domain.

## Design

- Palette: Cobalt Sky. Navy #0A1735 base, cobalt #2E6BF5 primary, sky #7FB0FF highlight, amber #F5A623 for calls to action. Text #EAF1FF, #BCC9E8, #8697BE.
- Fonts: Space Grotesk (headings, .font-display), Hanken Grotesk (body), Geist Mono (code).
- Icons: Material Symbols everywhere, through src/components/Icon.tsx. Tabler was removed.
- Background: cursor following aurora in src/components/AuroraBackground.tsx.

## Blog

- Posts live in content/blog as Markdown. See content/BLOG-WRITING-GUIDE.md.
- The HTML editor is in tools/. Run it with `bun run blog-editor`. It matches the new theme.
- Three starter posts match the live site titles and URL slugs.

## Env vars (Vercel Settings, Environment Variables)

| Variable | Purpose |
|---|---|
| SMTP_EMAIL, SMTP_PASSWORD | Contact form email (Google app password). Without them, submissions are logged, not emailed. |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY | Optional Cloudflare Turnstile anti spam. |
| GITHUB_TOKEN | Optional. Raises the GitHub rate limit for the Docs loader. |

## Design updates in this pass

- Logo and favicon now use your real logo (public/logo.png). The favicon set and .ico were generated from it. Swap public/logo.png for a higher resolution file any time and the header, footer, and favicon follow.
- Material icons are used generously (header, footer links and headings, all page sections, privacy sections). Icon accents are amber for contrast on the navy background, with cobalt reserved for text labels and links.
- Added glass and halo effects: stronger glass cards with an inner highlight and a soft glow on hover, amber glow on calls to action, and a halo behind the hero label. Helpers: .glass-card, .halo, .halo-amber, .glow-amber, .glow-cobalt, .icon-chip.

## Blog articles

All 24 published articles were migrated from your WordPress export into content/blog as Markdown, with their real titles, slugs, dates, author (Can Sayin), tags, and featured images. The article text is reproduced faithfully; only the plugin generated table of contents widget was dropped, because the site builds its own from the headings.

Note: article and featured images currently point to absolute URLs on blancobyte.com (your WordPress uploads). They work as is. If you move off WordPress, download the images into public/blog and update the paths.

## Also good to do

- Docs: src/lib/docs.config.ts points to a placeholder repo. Point it at a real docs repo, or the Docs page shows a simple empty state.
- Add a social share image at public/og.png and reference it in src/app/layout.tsx.
