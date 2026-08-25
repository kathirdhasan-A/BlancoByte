# BlancoByte website

Marketing site for BlancoByte — private, secure database solutions.

Next.js 16 · Tailwind v4 · TypeScript · Bun · deployed on Vercel.

## Develop (Bun)

```bash
bun install
bun run dev          # http://localhost:3000
bun run build        # production build + Pagefind search index
bun run start        # serve the production build
```

Tested with Bun 1.3.x / 1.4.x. The build script calls the `pagefind` binary
directly, so it does not depend on npm.

## Deploy to Vercel

1. Push this repo to GitHub (the committed `bun.lock` makes Vercel install with Bun).
2. Import the repo at https://vercel.com/new — the Next.js preset is auto-detected.
3. Add environment variables (below), then deploy.
4. Add your domain under Settings → Domains.

## Environment variables

| Variable | Purpose |
|---|---|
| `SMTP_EMAIL`, `SMTP_PASSWORD` | Contact-form email (Google app password). Without them, submissions are logged, not emailed. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Optional Cloudflare Turnstile anti-spam on the contact form. |
| `GITHUB_TOKEN` | Optional. Raises GitHub API rate limit for the Docs loader. |

Redeploy after changing env vars.

## Where things live

- Brand config: `src/lib/site.config.ts`
- Theme (colors, fonts): `src/app/globals.css`
- Background: `src/components/AuroraBackground.tsx` (cursor following aurora)
- Icons: `src/components/Icon.tsx` (Material Symbols)
- Docs source repo: `src/lib/docs.config.ts`
- Blog posts: `content/blog/*.md`

See `HANDOFF.md` for the full change log and open follow-ups.
