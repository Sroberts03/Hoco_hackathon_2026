const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-11 w-11 text-[15px]",
} as const;

/** Round profile photo, falling back to initials. */
export function Avatar({ name, src, size = "md" }: { name: string; src: string | null; size?: keyof typeof SIZES }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`${SIZES[size]} shrink-0 rounded-full border border-line object-cover`} />;
  }
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <span aria-hidden className={`${SIZES[size]} flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent`}>
      {initials || "?"}
    </span>
  );
}
