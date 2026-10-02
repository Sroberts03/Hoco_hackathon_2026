"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Alert, Field, buttonClass, inputClass } from "@/components/ui";
import { signUp } from "../server/actions";
import { MAX_NAME_LENGTH, MIN_PASSWORD_LENGTH } from "../lib/validation";
import type { AuthFormState, Role } from "../lib/types";

const initial: AuthFormState = {};

const ROLES = [
  {
    value: "creator",
    title: "I build things",
    body: "Students, freelancers, and professionals publishing projects.",
  },
  {
    value: "company",
    title: "I'm hiring",
    body: "Companies browsing projects and contacting creators.",
  },
] as const;

export function SignupForm({ next, defaultRole }: { next: string; defaultRole: Role }) {
  const [state, action, pending] = useActionState(signUp, initial);
  const [role, setRole] = useState<Role>((state.fields?.role as Role | undefined) ?? defaultRole);

  if (state.notice) {
    return (
      <div className="space-y-4">
        <Alert tone="notice">{state.notice}</Alert>
        <p className="text-sm text-muted">
          Once you&apos;ve confirmed, you can{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-accent hover:underline">
            log in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Account type</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`cursor-pointer rounded-lg border p-3.5 transition-colors ${
                role === r.value ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-2"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="sr-only"
              />
              <span className="block text-sm font-semibold text-ink">{r.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">{r.body}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={role === "company" ? "Company name" : "Your name"} htmlFor="name">
        <input
          id="name"
          name="name"
          autoComplete={role === "company" ? "organization" : "name"}
          required
          maxLength={MAX_NAME_LENGTH}
          defaultValue={state.fields?.name}
          className={inputClass}
        />
      </Field>
      <Field label={role === "company" ? "Work email" : "Email"} htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.fields?.email}
          className={inputClass}
        />
      </Field>
      <Field label="Password" htmlFor="password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          className={inputClass}
        />
      </Field>

      <button type="submit" disabled={pending} className={buttonClass("primary", "lg", "w-full")}>
        {pending ? "Creating account…" : "Create account"}
      </button>
      {role === "company" ? (
        <p className="text-xs leading-relaxed text-muted">
          New company accounts start unverified. Verified badges are assigned by the Everbuild team.
        </p>
      ) : null}
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-accent hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
