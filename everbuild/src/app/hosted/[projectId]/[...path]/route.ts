import { serveHostedFile } from "@/features/media/server/serve";

export async function GET(_request: Request, { params }: RouteContext<"/hosted/[projectId]/[...path]">) {
  const { projectId, path } = await params;
  return serveHostedFile(projectId, path);
}
