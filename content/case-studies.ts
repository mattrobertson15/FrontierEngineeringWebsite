/**
 * Case studies. Edit copy here — the index and detail pages render from this list.
 * List order is display order.
 */
export type CaseStudy = {
  /** URL segment: /case-studies/<slug> */
  slug: string;
  /** Client name, or an anonymized description ("A Series B fintech"). */
  client: string;
  industry: string;
  /** Which offering the engagement ran under. */
  offering: "Done for You" | "Team Enablement";
  /** Outcome-led headline. */
  title: string;
  /** One or two sentences for the index card and page lede. */
  summary: string;
  /** Headline results, 2–4 items. `small` suits text values rather than figures. */
  stats: { label: string; value: string; small?: boolean }[];
  challenge: string;
  approach: { title: string; body: string }[];
  outcome: string;
  quote?: { text: string; attribution: string };
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "used-truck-pricing",
    client: "Heavy-truck dealers",
    industry: "Automotive & freight",
    offering: "Done for You",
    title: "One view of a fragmented used-truck market.",
    summary:
      "We built pricing and analytics software that brings listings from across online marketplaces into one place, so heavy-truck dealers can see where a truck should be priced before they buy it or list it.",
    stats: [
      { label: "DATA", value: "Listings from multiple online marketplaces", small: true },
      { label: "BUILT FOR", value: "Non-technical dealer staff", small: true },
      { label: "CAPABILITIES", value: "Predictive pricing and trend analysis", small: true },
    ],
    challenge:
      "Used heavy trucks sell across many online marketplaces, and no two are identical: make, model, year, mileage, spec and region all move the price. Dealers had no single view of the market, so pricing a truck meant searching listing sites by hand. Mistakes are expensive. Buy the wrong truck, or price it badly, and it sits on the lot.",
    approach: [
      {
        title: "Unify the market data",
        body: "We sourced listings from a range of online marketplaces and normalized them into one dataset.",
      },
      {
        title: "Make it filterable",
        body: "Dealers narrow the market by region, make, model, mileage and more, down to the trucks that genuinely compare.",
      },
      {
        title: "Add predictive pricing and analytics",
        body: "Predictive pricing, trend analysis and availability views show what a truck is worth against the market, and which way that is moving.",
      },
      {
        title: "Design for non-technical users",
        body: "A simple interface lets dealer staff compare the whole market, or one slice of it, without an analyst.",
      },
    ],
    outcome:
      "Dealers know where their price needs to be before they buy or list a truck, and avoid stock that sits on the lot.",
  },
  {
    slug: "burrant-chemical",
    client: "Burrant Chemical",
    industry: "Chemical manufacturing",
    offering: "Done for You",
    title: "Lab results straight from the instrument, with no retyping.",
    summary:
      "We built custom software that connects to Burrant Chemical's legacy lab instruments, so daily test results flow straight into their records instead of being keyed in by hand.",
    stats: [
      { label: "INTEGRATION", value: "Works with existing legacy instruments", small: true },
      { label: "REMOVED", value: "Manual data entry from daily testing", small: true },
      { label: "RESULT", value: "Faster testing, fewer errors", small: true },
    ],
    challenge:
      "Burrant Chemical runs daily lab tests on instruments that predate modern integrations. Results were copied from each machine by hand. That was slow, every transcription was a chance for an error in data customers rely on, and skilled technicians spent hours on rote office work.",
    approach: [
      {
        title: "Work with the machines they have",
        body: "We built software compatible with their legacy instruments, so there was no costly equipment replacement.",
      },
      {
        title: "Capture results automatically",
        body: "Test data moves from the instrument into their records without anyone retyping it.",
      },
      {
        title: "Fit the daily routine",
        body: "The software slots into the lab's existing testing process, so technicians had nothing new to work around.",
      },
    ],
    outcome:
      "Customers can trust their data is accurate, and lab technicians spend their time on chemistry instead of data entry.",
  },
  {
    slug: "court-booking",
    client: "A pickleball franchise",
    industry: "Sports & leisure",
    offering: "Done for You",
    title: "Court booking software the franchise owns outright.",
    summary:
      "We worked alongside a pickleball franchise to build bespoke software for memberships and court reservations, in place of a licensed SaaS product.",
    stats: [
      { label: "SCOPE", value: "Memberships and court reservations", small: true },
      { label: "OWNERSHIP", value: "Franchise owns the software", small: true },
      { label: "RESULT", value: "Lower cost than licensing SaaS", small: true },
    ],
    challenge:
      "Off-the-shelf booking platforms charge ongoing license fees and are built for every club at once. The franchise was paying for software it couldn't shape around its own memberships, reservations and growth plans.",
    approach: [
      {
        title: "Build alongside the franchise",
        body: "We worked with their team to design membership and reservation flows around how their clubs actually run.",
      },
      {
        title: "Hand over ownership",
        body: "The franchise owns the software, so there is no per-seat or per-location license to pay.",
      },
      {
        title: "Keep it evolving",
        body: "Because the code is theirs, new features are built on their roadmap, not a vendor's.",
      },
    ],
    outcome:
      "Lower costs than a SaaS license, complete control over customization, and software that keeps growing with the business.",
  },
];

export const caseStudy = (slug: string) => caseStudies.find((c) => c.slug === slug);
