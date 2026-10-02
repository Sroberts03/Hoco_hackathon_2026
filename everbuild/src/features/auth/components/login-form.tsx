"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, Field, buttonClass, inputClass } from "@/components/ui";
import { signIn } from "../server/actions";
import type { AuthFormState } from "../lib/types";

const initial: AuthFormState = {};

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState(signIn, initial);
  const error = state.error ?? (state === initial ? initialError : undefined);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Field label="Email" htmlFor="email">
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
      <Field label="Password" htmlFor="password">
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      <button type="submit" disabled={pending} className={buttonClass("primary", "lg", "w-full")}>
        {pending ? "Logging in…" : "Log in"}
      </button>
      <p className="text-center text-sm text-muted">
        New to Everbuild?{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
