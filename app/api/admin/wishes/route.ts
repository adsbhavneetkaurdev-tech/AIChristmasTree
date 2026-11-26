import { getStore, VALID_STATUSES } from "@/lib/server/store";
import { json, requireAdmin, serverError } from "@/lib/server/http";
import type { WishStatus } from "@/lib/types";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const param = new URL(req.url).searchParams.get("status") ?? "all";
  const status = (VALID_STATUSES as string[]).includes(param) ? (param as WishStatus) : "all";
  try {
    const store = await getStore();
    const [wishes, counts, state] = await Promise.all([store.listAll(status), store.counts(), store.getState()]);
    return json({ wishes, counts, state, storage: store.kind, event: { id: config.eventId, name: config.eventName } });
  } catch (err) {
    return serverError(err);
  }
}
