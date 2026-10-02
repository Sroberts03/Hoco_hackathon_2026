import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function ProjectNotFound() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-20 text-center">
      <h1 className="text-xl font-semibold">Project not found</h1>
      <p className="mt-2 text-sm text-muted">It may have been removed, or the link is wrong.</p>
      <Link href="/discover" className={buttonClass("secondary", "md", "mt-6")}>
        Browse projects
      </Link>
    </main>
  );
}
