import { serveAvatar } from "@/features/media/server/avatar";

export async function GET(_request: Request, { params }: RouteContext<"/avatars/[userId]">) {
  const { userId } = await params;
  return serveAvatar(userId);
}
