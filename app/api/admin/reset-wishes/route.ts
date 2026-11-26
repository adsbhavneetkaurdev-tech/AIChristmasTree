import { getStore } from "@/lib/server/store";
import { json, requireAdmin, serverError } from "@/lib/server/http";
import { config } from "@/lib/config";

/**
 * Permanently deletes every wish for THIS event only (other events are untouched).
 * The request must repeat the event ID as a safety check.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as { confirm?: unknown };
  if (body.confirm !== config.eventId) return json({ error: "Confirmation did not match the event ID." }, 400);
  try {
    const deleted = await (await getStore()).resetWishes();
    return json({ ok: true, deleted });
  } catch (err) {
    return serverError(err);
  }
}
