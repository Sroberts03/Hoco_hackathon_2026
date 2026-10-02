import { COMPANY_POINTS, CREATOR_POINTS } from "../lib/content";
import { AudienceColumn } from "./audience-column";

export function AudienceSection({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="mx-auto grid max-w-6xl px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24">
      <AudienceColumn
        id="creators"
        eyebrow="For creators"
        title="Students, freelancers, and professionals"
        points={CREATOR_POINTS}
        cta={signedIn ? undefined : { href: "/signup?role=creator", label: "Create a creator profile" }}
      />
      <AudienceColumn
        id="companies"
        eyebrow="For companies"
        title="Teams who'd rather see the work"
        points={COMPANY_POINTS}
        cta={signedIn ? undefined : { href: "/signup?role=company", label: "Create a company account" }}
      />
    </section>
  );
}
