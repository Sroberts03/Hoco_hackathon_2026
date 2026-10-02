import type { Metadata } from "next";
import { getViewer } from "@/features/auth/server/viewer";
import { getFeed } from "@/features/feed/server/feed";
import { DiscoverView } from "@/features/feed/components/discover-view";

export const metadata: Metadata = { title: "Discover projects" };

export default async function DiscoverPage({ searchParams }: PageProps<"/discover">) {
  const params = await searchParams;
  const viewer = await getViewer();
  const feed = await getFeed(params, viewer);

  return <DiscoverView feed={feed} viewer={viewer} explain={params.explain === "1"} />;
}
