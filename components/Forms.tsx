"use client";

import { useActionState } from "react";
import { submitContact, subscribePlaybook, type ContactState } from "@/app/actions";

const initial: ContactState = { status: "idle" };

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
