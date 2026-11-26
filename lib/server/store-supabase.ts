import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PublicWish, TreeState, Wish, WishCounts, WishStatus } from "@/lib/types";
import { config } from "@/lib/config";
import { PUBLIC_FIELDS, supabaseUrl, type WishStore } from "./store";

/** Every query is scoped to this deployment's event, so different events never mix. */
const EVENT = config.eventId;
const STATE_FIELDS = "version,auto_approve,reset_at";

class SupabaseStore implements WishStore {
  readonly kind = "supabase" as const;
  constructor(private db: SupabaseClient) {}

  private wishes() {
    return this.db.from("wishes");
  }

  async listApproved() {
    const { data, error } = await this.wishes()
      .select(PUBLIC_FIELDS.join(","))
      .eq("event_id", EVENT)
      .eq("status", "approved")
      .order("approved_at", { ascending: true })
      .limit(2000);
    if (error) throw error;
    return (data ?? []) as unknown as PublicWish[];
  }

  async listAll(status: WishStatus | "all" = "all") {
    let q = this.wishes().select("*").eq("event_id", EVENT).order("created_at", { ascending: false }).limit(1000);
    if (status !== "all") q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Wish[];
  }

  async counts(): Promise<WishCounts> {
    const statuses: WishStatus[] = ["pending", "approved", "rejected", "archived"];
    const results = await Promise.all(
      statuses.map((s) => this.wishes().select("id", { count: "exact", head: true }).eq("event_id", EVENT).eq("status", s)),
    );
    const c: WishCounts = { total: 0, pending: 0, approved: 0, rejected: 0, archived: 0 };
    results.forEach((r, i) => {
      if (r.error) throw r.error;
      c[statuses[i]] = r.count ?? 0;
      c.total += r.count ?? 0;
    });
    return c;
  }

  async create(message: string, name: string | null) {
    const state = await this.getState();
    const { data, error } = await this.wishes()
      .insert({ event_id: EVENT, message, name, status: state.auto_approve ? "approved" : "pending" })
      .select("*")
      .single();
    if (error) throw error;
    return data as Wish;
  }

  async setStatus(id: string, status: WishStatus) {
    const { data, error } = await this.wishes().update({ status }).eq("event_id", EVENT).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return (data as Wish) ?? null;
  }

  async remove(id: string) {
    const { data, error } = await this.wishes().delete().eq("event_id", EVENT).eq("id", id).select("id");
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  }

  async resetDisplay() {
    const { data, error } = await this.wishes()
      .update({ status: "archived" })
      .eq("event_id", EVENT)
      .eq("status", "approved")
      .select("id");
    if (error) throw error;
    await this.touch({ reset_at: new Date().toISOString() });
    return data?.length ?? 0;
  }

  async resetWishes() {
    const { data, error } = await this.wishes().delete().eq("event_id", EVENT).select("id");
    if (error) throw error;
    await this.touch({ reset_at: new Date().toISOString() });
    return data?.length ?? 0;
  }

  /** Read this event's settings row, creating it (with the config.json moderation default) on first use. */
  async getState(): Promise<TreeState> {
    const { data, error } = await this.db.from("event_state").select(STATE_FIELDS).eq("event_id", EVENT).maybeSingle();
    if (error) throw error;
    if (data) return data as TreeState;
    const created = await this.db
      .from("event_state")
      .upsert({ event_id: EVENT, auto_approve: !config.moderation.requireApproval }, { onConflict: "event_id", ignoreDuplicates: true })
      .select(STATE_FIELDS)
      .maybeSingle();
    if (created.error) throw created.error;
    if (created.data) return created.data as TreeState;
    const again = await this.db.from("event_state").select(STATE_FIELDS).eq("event_id", EVENT).single();
    if (again.error) throw again.error;
    return again.data as TreeState;
  }

  private async touch(fields: Record<string, unknown>) {
    await this.getState();
    const { error } = await this.db.from("event_state").update({ ...fields, updated_at: new Date().toISOString() }).eq("event_id", EVENT);
    if (error) throw error;
  }

  async setAutoApprove(value: boolean) {
    await this.getState();
    const { data, error } = await this.db
      .from("event_state")
      .update({ auto_approve: value, updated_at: new Date().toISOString() })
      .eq("event_id", EVENT)
      .select(STATE_FIELDS)
      .single();
    if (error) throw error;
    return data as TreeState;
  }
}

const g = globalThis as unknown as { __wishTreeSupabaseStore?: SupabaseStore };
export function getSupabaseStore(): SupabaseStore {
  return (g.__wishTreeSupabaseStore ??= new SupabaseStore(
    createClient(supabaseUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(), {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  ));
}
