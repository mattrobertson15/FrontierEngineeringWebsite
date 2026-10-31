"use server";

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const CONTACT_TO = process.env.CONTACT_TO_EMAIL ?? "info@frontier-engineering.ai";
const CONTACT_FROM =
  process.env.CONTACT_FROM_EMAIL ?? "Frontier Engineering <website@send.frontier-engineering.ai>";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Handles the discovery-call form: emails the lead to CONTACT_TO via Resend. */
export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const lead = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    engagement: String(formData.get("engagement") ?? "").trim().slice(0, 50) || "Not sure yet",
    message: String(formData.get("message") ?? "").trim(),
  };

  if (!lead.name || !EMAIL_RE.test(lead.email)) {
    return { status: "error", message: "Please add your name and a valid work email." };
  }
  if (lead.message.length > 5000) {
    return { status: "error", message: "That message is a bit long — could you trim it?" };
  }

  return sendLead("contact", {
    replyTo: lead.email,
    subject: `Discovery call request: ${oneLine(lead.name)}`,
    text: `Name: ${lead.name}\nEmail: ${lead.email}\nEngagement: ${lead.engagement}\n\n${lead.message || "(no message)"}`,
  });
}

/** Handles the careers form: emails the candidate's note to CONTACT_TO via Resend. */
export async function submitCareers(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const candidate = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim().slice(0, 50) || "Something else",
    link: String(formData.get("link") ?? "").trim().slice(0, 500),
    message: String(formData.get("message") ?? "").trim(),
  };

  if (!candidate.name || !EMAIL_RE.test(candidate.email)) {
    return { status: "error", message: "Please add your name and a valid email." };
  }
  if (candidate.message.length > 5000) {
    return { status: "error", message: "That message is a bit long — could you trim it?" };
  }

  return sendLead("careers", {
    replyTo: candidate.email,
    subject: `Careers: ${oneLine(candidate.role)} — ${oneLine(candidate.name)}`,
    text: `Name: ${candidate.name}\nEmail: ${candidate.email}\nRole: ${candidate.role}\nLink: ${candidate.link || "(none)"}\n\n${candidate.message || "(no message)"}`,
  });
}

function oneLine(value: string) {
  return value.replace(/\s+/g, " ").slice(0, 100);
}

async function sendLead(
  tag: string,
  email: { replyTo: string; subject: string; text: string },
): Promise<ContactState> {
  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      console.error(`[${tag}] RESEND_API_KEY is not set; message not delivered`);
      return { status: "error", message: "Something went wrong — please email us directly." };
    }
    console.warn(`[${tag}] RESEND_API_KEY not set; skipping email`, email);
    return { status: "success", message: "Thanks — we'll be in touch shortly." };
  }

  const { error } = await resend.emails.send({ from: CONTACT_FROM, to: [CONTACT_TO], ...email });

  if (error) {
    console.error(`[${tag}] Resend send failed`, error);
    return { status: "error", message: "Something went wrong — please email us directly." };
  }

  return { status: "success", message: "Thanks — we'll be in touch shortly." };
}

/**
 * Playbook email capture. Parked: not rendered anywhere until there is a newsletter.
 * Before re-enabling <PlaybookSignup />, deliver signups somewhere real.
 */
export async function subscribePlaybook(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Please enter a valid email." };
  }
  console.log("[playbook] signup");
  return { status: "success", message: "On its way — check your inbox." };
}
