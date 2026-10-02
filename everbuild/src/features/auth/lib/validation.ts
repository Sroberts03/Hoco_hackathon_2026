import type { Role } from "./types";

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_NAME_LENGTH = 80;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignUpInput = { role: Role; name: string; email: string; password: string };
export type SignInInput = { email: string; password: string };

export function readSignUp(formData: FormData): SignUpInput {
  return {
    role: formData.get("role") === "company" ? "company" : "creator",
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

/** Returns a user-facing error message, or null when the input is valid. */
export function validateSignUp({ role, name, email, password }: SignUpInput): string | null {
  if (name.length < 2) return role === "company" ? "Enter your company name." : "Enter your name.";
  if (name.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  if (!EMAIL_RE.test(email)) return "Enter a valid email address.";
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}

export function readSignIn(formData: FormData): SignInInput {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

export function validateSignIn({ email, password }: SignInInput): string | null {
  return EMAIL_RE.test(email) && password ? null : "Enter your email and password.";
}
