# TODO

Launch checklist for the Frontier Engineering site.

## Must fix before launch

### 1. Make the forms deliver leads
Both forms show a success message but only log to the server console.

- [x] Choose a destination: email via Resend
- [x] Wire up `submitContact` (discovery-call form) — `app/actions.ts`
- [ ] Wire up `subscribePlaybook` (playbook signup) — `app/actions.ts`
- [ ] Add `RESEND_API_KEY` (+ `CONTACT_FROM_EMAIL` / `CONTACT_TO_EMAIL` while on the sandbox sender) to Vercel env vars
- [x] Send a test submission end to end (locally, via sandbox sender to the Resend account Gmail)
- [ ] Verify `send.frontier-engineering.ai` in Resend: add its 4 DNS records in GoDaddy (DNS lives there, not Vercel), then verify and remove the `CONTACT_FROM_EMAIL=onboarding@resend.dev` override. Until then, mail can only go to the Resend account's own address.

### 2. Replace placeholder content
- [x] All placeholders removed (Oct 29, 2026). Pricing is never shown on the site. Durations,
  team size, FDE count and scope are hidden until there are real values; the home page client
  logos strip and case study section were deleted until there is real content to show. The
  home timeline uses "Step 1–4" in place of week ranges.
- [ ] Re-check figures if the wharf results are updated — all numbers live in `content/wharf.ts`

## Worth doing

- [ ] **Favicon** — replace `app/favicon.ico` (likely the Next.js default) with the logo mark
- [x] **Site URL** — `siteUrl` in `lib/site.ts`, used as `metadataBase` in `app/layout.tsx`
- [ ] **Link previews** — add an Open Graph / social share image
- [x] **Search basics** — `app/sitemap.ts` and `app/robots.ts`
- [ ] **Mobile header** — check that "Frontier Engineering" plus nav and button fit on small screens

## Info needed from Matt

- [x] Contact email address — `info@frontier-engineering.ai`
- [ ] Where leads should go (email / Slack / CRM)
- [ ] Durations / team sizes, if we want them back on the engagement sections (no prices — decided not to show pricing)
- [x] Show or hide the logos and case study sections for now — removed
- [x] Production domain — `https://frontier-engineering.ai`
