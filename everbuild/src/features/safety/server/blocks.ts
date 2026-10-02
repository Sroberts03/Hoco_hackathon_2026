import "server-only";
import { db } from "@/lib/supabase/admin";

/** True if `blocker` has blocked `blocked`. */
export async function hasBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const { data } = await db()
    .from("blocks")
    .select("blocker_id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();
  return Boolean(data);
}

/** True if either user has blocked the other. Used to stop messages between them. */
export async function isBlockedEitherWay(a: string, b: string): Promise<boolean> {
  const { data } = await db()
    .from("blocks")
    .select("blocker_id")
    .or(`and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`)
    .limit(1);
  return Boolean(data?.length);
}
