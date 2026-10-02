import type { NextRequest } from "next/server";
import { handleEmailConfirmation } from "@/features/auth/server/confirm";

export async function GET(request: NextRequest) {
  return handleEmailConfirmation(request);
}
