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

  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      console.error("[contact] RESEND_API_KEY is not set; lead not delivered");
      return { status: "error", message: "Something went wrong — please email us directly." };
    }
    console.warn("[contact] RESEND_API_KEY not set; skipping email", lead);
    return { status: "success", message: "Thanks — we'll be in touch shortly." };
  }

  const { error } = await resend.emails.send({
    from: CONTACT_FROM,
    to: [CONTACT_TO],
    replyTo: lead.email,
    subject: `Discovery call request: ${lead.name.replace(/\s+/g, " ").slice(0, 100)}`,
    text: `Name: ${lead.name}\nEmail: ${lead.email}\nEngagement: ${lead.engagement}\n\n${lead.message || "(no message)"}`,
  });

  if (error) {
    console.error("[contact] Resend send failed", error);
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
