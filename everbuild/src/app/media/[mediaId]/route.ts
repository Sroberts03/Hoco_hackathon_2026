import { serveMedia } from "@/features/media/server/serve";

export async function GET(_request: Request, { params }: RouteContext<"/media/[mediaId]">) {
  const { mediaId } = await params;
  return serveMedia(mediaId);
}
