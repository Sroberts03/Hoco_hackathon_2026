import Link from "next/link";
import { getViewer } from "@/features/auth/server/viewer";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { buttonClass } from "@/components/ui";
import { Logo } from "./logo";
import { NavLinks, type NavItem } from "./nav-links";

/** Marketing links for visitors. These point at sections of the landing page. */
const PUBLIC_NAV: NavItem[] = [
  { href: "/discover", label: "Discover" },
  { href: "/#creators", label: "For creators" },
  { href: "/#companies", label: "For companies" },
  { href: "/#principles", label: "How it works" },
];

/** App links for signed-in users. Add routes here as features ship (Settings…). */
const APP_NAV: NavItem[] = [
  { href: "/discover", label: "Discover" },
  { href: "/messages", label: "Messages" },
  { href: "/dashboard", label: "Dashboard" },
];

export async function SiteHeader() {
  const viewer = await getViewer();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo href={viewer ? "/dashboard" : "/"} />
          <NavLinks items={viewer ? APP_NAV : PUBLIC_NAV} />
        </div>

        {viewer ? (
          <div className="flex items-center gap-3">
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
