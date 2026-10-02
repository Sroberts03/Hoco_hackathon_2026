import Link from "next/link";
import { getViewer } from "@/features/auth/server/viewer";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { Logo } from "./logo";
import { buttonClass } from "@/components/ui";

export async function SiteHeader() {
  const viewer = await getViewer();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            <Link href="/#creators" className="hover:text-ink">
              For creators
            </Link>
            <Link href="/#companies" className="hover:text-ink">
              For companies
            </Link>
            <Link href="/#principles" className="hover:text-ink">
              How it works
            </Link>
          </nav>
        </div>

        {viewer ? (
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className={buttonClass("ghost", "sm")}>
              Dashboard
            </Link>
            <span className="hidden text-sm text-muted sm:inline" title={viewer.email}>
              {viewer.displayName}
            </span>
            <SignOutButton />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonClass("ghost", "sm")}>
              Log in
            </Link>
            <Link href="/signup" className={buttonClass("primary", "sm")}>
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
