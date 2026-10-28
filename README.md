# Frontier Engineering — website

Marketing site for Frontier Engineering, an AI-native engineering consultancy. Built with **Next.js 16 (App Router)**, **Tailwind CSS v4** and self-hosted **Geist** fonts. Every page is statically prerendered.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Structure

```
app/
  layout.tsx              fonts, header, footer, default metadata
  globals.css             design tokens (colors, fonts) — edit here
  page.tsx                Home
  engineering/            Practice 01 — AI-Native Engineering
  forward-deployed/       Practice 02 — Forward-Deployed Engineers
  model-testing/          Practice 03 — Model Testing & Evals
  playbook/               Practice 04 — AI-Native Playbook
  actions.ts              server actions for the contact + playbook forms
components/
  ui.tsx                  layout & block primitives (HairlineGrid, DarkBand, StatGrid, CtaStrip…)
  Header.tsx, Footer.tsx, Forms.tsx, Logo.tsx
content/
  playbook.ts             playbook rules + adoption options (edit copy here)
lib/site.ts               nav items, contact link
```

## Design tokens

Defined once in `app/globals.css` under `@theme` and used as Tailwind classes:

| Token | Value | Class examples |
|---|---|---|
| paper | `#F4F4F1` | `bg-paper` |
| ink | `#0F1214` | `text-ink`, `bg-ink` |
| ink-2 | `#3D4245` | `text-ink-2` (body copy) |
| muted | `#5A5F62` | mono labels |
| line | `#D6D6D0` | hairlines |
| accent | `#2B4BFF` | `text-accent`, `bg-accent` |
| accent-soft | `#9DAEFF` | accent on dark bands |

## Before launch

- [ ] Replace bracketed placeholders: `grep -rn "\[" app components content`
- [ ] Wire `submitContact` / `subscribePlaybook` in `app/actions.ts` to Resend, a CRM or a webhook
- [ ] Real email in `components/Footer.tsx`
- [ ] Client logos (use `next/image`) on the home page
- [ ] Favicon + Open Graph image (`app/opengraph-image.tsx`)
- [ ] Deploy: import the repo on Vercel — no config needed
