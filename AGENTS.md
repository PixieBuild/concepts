<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

A gallery of concept websites we send to prospective clients.

`app/(gallery)/` is the internal home page listing every concept — team-only, `noindex`, no SEO work. `app/(concepts)/<slug>/` is one concept: a real standalone website with its own branding and full SEO.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
```

Run `lint` and `typecheck` before saying a task is done. **Do not run `npm run build` unless asked.**

## Layout

```
app/
├── globals.css        shared design tokens
├── robots.ts
├── (gallery)/         root layout #1 — the internal gallery
└── (concepts)/
    └── casa-lume/      root layout #2 — reference concept, copy this
lib/concepts.ts        the registry the gallery reads
components/ui/         shadcn
```

There is deliberately no `app/layout.tsx`, so each route group is its own root layout and owns its `<html>`. Never create `app/layout.tsx` or `app/(concepts)/layout.tsx` — that would collapse every concept into one shared document. Gallery ↔ concept is a full page load, which is intended.

## Adding a concept

**Step 1 — ask the user.** The registry entry is how the team finds a concept with a client on the phone, so never guess it:

1. Brand name and slug (kebab-case; folder name *and* URL)
2. Category — must be a key in `CONCEPT_CATEGORIES`; offer the list, and ask before adding a new one
3. Industry (e.g. "Dental clinic")
4. Tagline — one line, ~70 chars
5. Description — 1–3 sentences on what makes this direction distinct
6. Pages to build
7. Look and feel — palette, font pairing, sharp vs rounded
8. Dark mode? (opt-in per concept)
9. Status — `draft` or `ready`

**Step 2 — copy `app/(concepts)/casa-lume/`** and adapt it. It has every piece a concept needs: `layout.tsx`, `theme.css`, `site.ts`, `page.tsx`, `sitemap.ts`, `opengraph-image.tsx`, `_lib/`, `_components/`.

**Step 3 — add an entry to `CONCEPTS` in `lib/concepts.ts`.** A concept that isn't registered does not appear on the home page. `slug` must equal the folder name.

## Theming

Each concept re-themes by overriding the raw tokens from `globals.css` in its own `theme.css`.

- Scope them to `:root.theme-<slug>`, and put that class on `<html>` in the concept's layout. This is not optional — the concept's stylesheet loads *before* `globals.css`, so a plain `:root` block would lose to the defaults.
- Dark tokens go in `:root.theme-<slug>.dark`. Dark mode is driven by `next-themes` with `attribute="class"`, so wrap the concept's `<body>` in `ThemeProvider` and give it a `storageKey` of `theme:<slug>` — otherwise concepts share one preference. `<html>` needs `suppressHydrationWarning`.
- Override raw tokens (`--background`), never theme keys (`--color-background`). Never add a second `@theme` block.
- Fonts: pass the target variable to `next/font` — `Inter({ variable: "--font-sans" })`. Available are `--font-sans`, `--font-heading`, `--font-mono`.
- Concepts must not edit `globals.css`. Needing a new shared token is a change worth flagging.

## SEO

**SEO is the one thing concepts never share.** Every concept is a different fictional brand, so shared titles, descriptions, or metadata helpers would be wrong for all of them. Sharing anything else — shadcn components, `ThemeProvider`, utilities — is fine and expected.

- Write `metadata` inline in the concept's own `layout.tsx` and pages. No shared metadata helpers, and no concept SEO in a root layout or the gallery.
- Each concept has its own `site.ts` holding `BASE_PATH` and `SITE_URL`.
- Each concept ships its own `sitemap.ts` (`/<slug>/sitemap.xml`) and `opengraph-image.tsx`.
- `ImageResponse` supports flexbox only — no grid, no Tailwind classes, explicit `display: flex` on multi-child elements.
- Child pages set just `title: "Services"`; the layout's `template` completes it.
- The gallery is the opposite: `robots: { index: false, follow: false }` and nothing else.
- The agency logo is scoped to `app/(gallery)/icon.png` so concepts never inherit our branding. A concept needing a favicon adds its own `icon.png` in its folder.

`app/robots.ts` is the one shared SEO file, since robots.txt is root-only by convention. It derives from the registry and needs no edit per concept.

## Code style

**Comments are the exception, not the habit.** Write code that reads without them: clear names, small functions, obvious structure. Do not narrate what the code already says.

- Add one only when the code cannot carry the information — a non-obvious constraint, a subtle cascade rule, or a decision that looks wrong until you know why.
- **Maximum 1–2 lines.** No file-header blocks, no JSDoc on self-explanatory functions, no section-divider banners.
- Never restate the signature, label the obvious (`// Handle click`), or leave commented-out code behind.
- Architectural explanation belongs in this file, not scattered across source files.

## UI

shadcn with **Base UI** (`@base-ui/react`), Nova preset, `lucide-react` icons — see `components.json`.

- Add components with `npx shadcn@latest add <component>`. Don't hand-write what shadcn ships.
- Base UI uses a `render` prop, not Radix's `asChild`. Rendering anything other than a `<button>` also needs `nativeButton={false}`, or Base UI warns at runtime:
  `<Button nativeButton={false} render={<Link href="/x" />}>Open</Button>`
- `components/ui/` is shared and themed entirely through tokens, so it re-themes automatically. Never fork a ui component per concept — change the concept's tokens, or build a local component in its `_components/`.
- Dark mode is `next-themes`. Use `<ThemeToggle />`; never hand-roll a theme script.
- `_`-prefixed folders never become routes. Put a component in the `_components/` of the deepest
  route that uses it: `booking/_components/` for booking-only. The concept's root `_components/`
  is for shared components and for the home page, since home is the root route.
- Server Components by default; push `"use client"` to the leaf.
