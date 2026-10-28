# TODO

Launch checklist for the Frontier Engineering site.

## Must fix before launch

### 1. Make the forms deliver leads
Both forms show a success message but only log to the server console.

- [ ] Choose a destination: email (e.g. Resend), Slack webhook, or CRM
- [ ] Wire up `submitContact` (discovery-call form) — `app/actions.ts`
- [ ] Wire up `subscribePlaybook` (playbook signup) — `app/actions.ts`
- [ ] Add any API keys / webhook URLs as env vars (locally and on the host)
- [ ] Send a test submission end to end

### 2. Replace placeholder content
Decide for each: real content, or hide the section until it exists.

**Home page** — `app/page.tsx`
- [ ] Client logos strip (`[CLIENT LOGO]`, ~line 120)
- [ ] Case study: title, outcome metric, time to production, eval coverage, industry (~lines 209–223)

**Engineering** — `app/engineering/page.tsx` (~line 115)
- [ ] Duration
- [ ] Team (currently reads "[FRONTIER ENGINEERING ENGINEERS]")
- [ ] Price

**Forward-Deployed** — `app/forward-deployed/page.tsx` (~line 126)
- [ ] Duration
- [ ] FDE count on site
- [ ] Price

**Model Testing** — `app/model-testing/page.tsx`
- [x] Hero eval report filled with real DeepSWE results (source: github.com/bartr/wharf)
- [x] "From our own bench" findings section added
- [ ] Confirm OK to publish named-vendor comparisons and link the wharf repo publicly
- [ ] Re-check figures if the wharf results are updated (numbers are from the README / `docs/pass-at-1-vs-cost.csv`)
- [ ] Duration
- [ ] Scope / use cases
- [ ] Price

**Playbook offerings** — `content/playbook.ts` (~lines 43–56)
- [ ] Durations and prices for all three offerings

**Footer** — `components/Footer.tsx` (~line 20)
- [x] Real contact email — `info@frontier-engineering.ai`

## Worth doing

- [ ] **Favicon** — replace `app/favicon.ico` (likely the Next.js default) with the logo mark
- [x] **Site URL** — `siteUrl` in `lib/site.ts`, used as `metadataBase` in `app/layout.tsx`
- [ ] **Link previews** — add an Open Graph / social share image
- [x] **Search basics** — `app/sitemap.ts` and `app/robots.ts`
- [ ] **Mobile header** — check that "Frontier Engineering" plus nav and button fit on small screens

## Info needed from Matt

- [x] Contact email address — `info@frontier-engineering.ai`
- [ ] Where leads should go (email / Slack / CRM)
- [ ] Prices and durations for each service and playbook offering
- [ ] Show or hide the logos and case study sections for now
- [x] Production domain — `https://frontier-engineering.ai`
