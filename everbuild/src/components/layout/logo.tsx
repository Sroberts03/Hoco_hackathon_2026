import Link from "next/link";

export function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  // Three stacked blocks: projects building on each other.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="14" width="18" height="6" rx="1.5" fill="currentColor" />
      <rect x="6" y="8.5" width="12" height="4.5" rx="1.25" fill="currentColor" opacity="0.7" />
      <rect x="9" y="4" width="6" height="3.5" rx="1" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-ink" aria-label="Everbuild home">
      <span className="text-accent">
        <LogoMark />
      </span>
      <span className="text-[17px] font-semibold tracking-tight">Everbuild</span>
    </Link>
  );
}
