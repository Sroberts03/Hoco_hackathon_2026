import type { Metadata } from "next";
import { getViewer } from "@/features/auth/server/viewer";
import { getFeed } from "@/features/feed/server/feed";
import { DiscoverView } from "@/features/feed/components/discover-view";
import { getPublicationAllowance } from "@/features/projects/server/publishing";

export const metadata: Metadata = { title: "Discover projects" };

export default async function DiscoverPage({ searchParams }: PageProps<"/discover">) {
  const params = await searchParams;
  const viewer = await getViewer();
  const [feed, allowance] = await Promise.all([
    getFeed(params, viewer),
    viewer?.role === "creator" ? getPublicationAllowance(viewer.id) : null,
  ]);

  return <DiscoverView feed={feed} viewer={viewer} allowance={allowance} explain={params.explain === "1"} />;
}
