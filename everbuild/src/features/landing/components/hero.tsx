import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { ExampleGallery } from "./example-gallery";

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        <div>
          <p className="text-sm font-medium text-accent">A reverse job board for projects</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
            Projects are what matter, so let&apos;s skip the resume.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Creators publish what they&apos;ve built. Companies browse a project-first feed, run the work right in their
            browser, and contact the people behind it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {signedIn ? (
              <Link href="/dashboard" className={buttonClass("primary", "lg")}>
                Go to your dashboard
              </Link>
            ) : (
              <>
                <Link href="/signup?role=creator" className={buttonClass("primary", "lg")}>
                  Publish your work
                </Link>
                <Link href="/signup?role=company" className={buttonClass("secondary", "lg")}>
                  Find builders
                </Link>
              </>
            )}
          </div>
          <p className="mt-5 text-sm text-muted">
            Free for creators. No resumes, ever.{" "}
            <Link href="/discover" className="font-medium text-accent hover:underline">
              Browse projects without an account →
            </Link>
          </p>
        </div>
        <ExampleGallery />
      </div>
    </section>
  );
}
