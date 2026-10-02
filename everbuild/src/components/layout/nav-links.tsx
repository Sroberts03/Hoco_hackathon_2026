"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

/** Header links with an active state for the current route. */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-6 text-sm md:flex">
      {items.map((item) => {
        // Hash links (landing sections) are never "active".
        const active = !item.href.includes("#") && (pathname === item.href || pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={active ? "font-medium text-ink" : "text-muted hover:text-ink"}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
