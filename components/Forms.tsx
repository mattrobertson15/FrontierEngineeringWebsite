"use client";

import { useActionState, useEffect, useState } from "react";
import { submitCareers, submitContact, subscribePlaybook, type ContactState } from "@/app/actions";

const initial: ContactState = { status: "idle" };

const engagementOptions = ["Done for You", "Hands-on Team Enablement", "Not sure yet"];

/** Careers roles. Role cards link to `#apply-<slug>` to preselect one. */
export const careerRoles = [
  { slug: "forward-deployed-engineer", label: "Forward-Deployed Engineer" },
  { slug: "research-intern", label: "Research Intern" },
  { slug: "general", label: "Something else" },
] as const;

const field =
  "min-h-12 border border-field bg-surface px-3.5 text-base font-normal text-ink";

function Status({ state }: { state: ContactState }) {
  if (state.status === "idle") return null;
  return (
    <p
      role="status"
      className={`m-0 text-[15px] ${state.status === "success" ? "text-accent-ink" : "text-[#B42318]"}`}
    >
      {state.message}
    </p>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Name
        <input type="text" name="name" required autoComplete="name" className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Work email
        <input type="email" name="email" required autoComplete="email" className={field} />
      </label>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1.5 text-sm font-medium">How would you like to work?</legend>
        {engagementOptions.map((option) => (
          <label key={option} className="flex min-h-11 items-center gap-3 text-base">
            <input
              type="radio"
              name="engagement"
              value={option}
              defaultChecked={option === "Not sure yet"}
              className="size-4 accent-accent"
            />
            {option}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        What are you trying to solve?
        <textarea name="message" rows={4} className={`${field} resize-y py-3`} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="min-h-13 cursor-pointer bg-accent font-medium text-white hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Sending…" : "Request a discovery call"}
      </button>
      <Status state={state} />
    </form>
  );
}

export function CareersForm() {
  const [state, action, pending] = useActionState(submitCareers, initial);
  const [role, setRole] = useState<string>("general");

  // A role card's "Get in touch" link sets #apply-<slug>: select that role and scroll to the form.
  useEffect(() => {
    function selectFromHash() {
      const slug = window.location.hash.replace(/^#apply-/, "");
      if (slug === window.location.hash) return;
      if (careerRoles.some((r) => r.slug === slug)) setRole(slug);
      document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" });
    }
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, []);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Name
        <input type="text" name="name" required autoComplete="name" className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <input type="email" name="email" required autoComplete="email" className={field} />
      </label>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1.5 text-sm font-medium">Which role interests you?</legend>
        {careerRoles.map((r) => (
          <label key={r.slug} className="flex min-h-11 items-center gap-3 text-base">
            <input
              type="radio"
              name="role"
              value={r.label}
              checked={role === r.slug}
              onChange={() => setRole(r.slug)}
              className="size-4 accent-accent"
            />
            {r.label}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        LinkedIn, GitHub, CV or portfolio link
        <input type="url" name="link" placeholder="https://" className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        What have you built, and what draws you to this work?
        <textarea name="message" rows={5} className={`${field} resize-y py-3`} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="min-h-13 cursor-pointer bg-accent font-medium text-white hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send"}
      </button>
      <Status state={state} />
    </form>
  );
}

export function PlaybookSignup() {
  const [state, action, pending] = useActionState(subscribePlaybook, initial);

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Work email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className={`${field} min-h-13 min-w-[260px]`}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="min-h-13 cursor-pointer bg-accent px-6 font-medium text-white hover:bg-ink disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send it"}
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}
