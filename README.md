# Concepts

A gallery of concept websites we send to prospective clients.

- `/` — internal gallery listing every concept. Team-only, `noindex`.
- `/<slug>` — one concept: a standalone site with its own branding and SEO.

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_SITE_URL` in `.env.local` (see `.env.example`) so canonical URLs,
OG tags, and sitemaps resolve correctly outside local development.

See [AGENTS.md](./AGENTS.md) for architecture and the workflow for adding a concept.
