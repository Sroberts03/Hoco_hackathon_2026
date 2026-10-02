import Link from "next/link";
import { buttonClass } from "@/components/ui";

export function ClosingCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:py-24">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Show what you can build.</h2>
      <p className="mx-auto mt-3 max-w-lg text-muted">
        Everbuild helps companies find people by seeing what they&apos;ve built, not by reading what they claim on a resume.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/signup" className={buttonClass("primary", "lg")}>
          Get started
        </Link>
        <Link href="/login" className={buttonClass("ghost", "lg")}>
          I already have an account
        </Link>
      </div>
    </section>
  );
}
