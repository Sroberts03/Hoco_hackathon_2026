import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getViewer } from "@/features/auth/server/viewer";
import { ProfilePage } from "@/features/profiles/components/profile-page";
import { getPublicProfile } from "@/features/profiles/server/queries";

export async function generateMetadata({ params }: PageProps<"/companies/[id]">): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  return { title: profile?.displayName ?? "Company profile" };
}

export default async function CompanyProfilePage({ params }: PageProps<"/companies/[id]">) {
  const { id } = await params;
  const [profile, viewer] = await Promise.all([getPublicProfile(id), getViewer()]);
  if (!profile || profile.role !== "company") notFound();
  return <ProfilePage profile={profile} viewer={viewer} />;
}
