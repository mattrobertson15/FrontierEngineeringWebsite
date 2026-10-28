"use server";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Handles the discovery-call form.
 *
 * TODO: deliver the lead somewhere real. Simplest options:
 *  - Resend:  npm i resend → await new Resend(process.env.RESEND_API_KEY).emails.send({...})
 *  - A CRM / Slack webhook: await fetch(process.env.LEADS_WEBHOOK_URL!, { method: "POST", body: JSON.stringify(lead) })
 */
export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const lead = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
  };

  if (!lead.name || !EMAIL_RE.test(lead.email)) {
    return { status: "error", message: "Please add your name and a valid work email." };
  }
  if (lead.message.length > 5000) {
    return { status: "error", message: "That message is a bit long — could you trim it?" };
  }

  console.log("[contact] new lead", { name: lead.name, email: lead.email });

  return { status: "success", message: "Thanks — we'll be in touch shortly." };
}

/** Playbook email capture. Same TODO as above. */
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
