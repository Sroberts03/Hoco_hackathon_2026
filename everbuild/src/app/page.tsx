import { getViewer } from "@/features/auth/server/viewer";
import { Hero } from "@/features/landing/components/hero";
import { AudienceSection } from "@/features/landing/components/audience-section";
import { PrinciplesSection } from "@/features/landing/components/principles-section";
import { ClosingCta } from "@/features/landing/components/closing-cta";

export default async function Home() {
  const signedIn = Boolean(await getViewer());

  return (
    <main>
      <Hero signedIn={signedIn} />
      <AudienceSection signedIn={signedIn} />
      <PrinciplesSection />
      {signedIn ? null : <ClosingCta />}
    </main>
  );
}
