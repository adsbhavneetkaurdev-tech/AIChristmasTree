import "server-only";
import { EventEmitter } from "node:events";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomInt, randomUUID } from "node:crypto";
import type { TreeState, Wish, WishCounts, WishStatus } from "@/lib/types";
import { config } from "@/lib/config";
import { toPublic, type WishStore } from "./store";

/**
 * Zero-config store used when Supabase isn't configured. Persists to
 * .data/wish-tree.json and pushes change events over Server-Sent Events.
 * Intended for local development and single-server demos only.
 * Wishes and settings are kept per event ID, like the Supabase store.
 */
type StoredWish = Wish & { event_id: string };
interface FileShape {
  wishes: StoredWish[];
  states: Record<string, TreeState>;
}

const DATA_DIR = process.env.LOCAL_DATA_DIR || path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "wish-tree.json");
const EVENT = config.eventId;

class LocalStore implements WishStore {
  readonly kind = "local" as const;
  readonly events = new EventEmitter();
  private data: FileShape | null = null;
  private chain: Promise<unknown> = Promise.resolve();

  constructor() {
    this.events.setMaxListeners(1000);
  }

  private async load(): Promise<FileShape> {
    if (this.data) return this.data;
    try {
      const d = JSON.parse(await fs.readFile(FILE, "utf8")) as Partial<FileShape>;
      this.data = { wishes: d.wishes ?? [], states: d.states ?? {} };
    } catch {
      this.data = { wishes: [], states: {} };
    }
    return this.data;
  }

  private state(d: FileShape): TreeState {
    return (d.states[EVENT] ??= { version: 0, auto_approve: !config.moderation.requireApproval, reset_at: null });
  }

  private mine(d: FileShape) {
    return d.wishes.filter((w) => w.event_id === EVENT);
  }

  /** Serialise every mutation so simultaneous submissions never clobber each other. */
  private mutate<T>(fn: (d: FileShape) => T): Promise<T> {
    const run = this.chain.then(async () => {
      const d = await this.load();
      const result = fn(d);
      const st = this.state(d);
      st.version += 1;
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${FILE}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(d));
      await fs.rename(tmp, FILE);
      this.events.emit("change", st.version);
      return result;
    });
    this.chain = run.catch(() => undefined);
    return run;
  }

  async listApproved() {
    const d = await this.load();
    return this.mine(d)
      .filter((w) => w.status === "approved")
      .sort((a, b) => (a.approved_at ?? "").localeCompare(b.approved_at ?? ""))
      .map(toPublic);
  }

  async listAll(status: WishStatus | "all" = "all") {
    const d = await this.load();
    return this.mine(d)
      .filter((w) => status === "all" || w.status === status)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 1000);
  }

  async counts(): Promise<WishCounts> {
    const d = await this.load();
    const c: WishCounts = { total: 0, pending: 0, approved: 0, rejected: 0, archived: 0 };
    for (const w of this.mine(d)) { c[w.status]++; c.total++; }
    return c;
  }

  create(message: string, name: string | null) {
    return this.mutate((d) => {
      const now = new Date().toISOString();
      const approved = this.state(d).auto_approve;
      const wish: StoredWish = {
        id: randomUUID(),
        event_id: EVENT,
        message,
        name,
        status: approved ? "approved" : "pending",
        seed: randomInt(0, 2147483647),
        created_at: now,
        approved_at: approved ? now : null,
      };
      d.wishes.push(wish);
      return wish;
    });
  }

  setStatus(id: string, status: WishStatus) {
    return this.mutate((d) => {
      const w = this.mine(d).find((x) => x.id === id);
      if (!w) return null;
      if (status === "approved" && w.status !== "approved") w.approved_at = new Date().toISOString();
      w.status = status;
      return { ...w };
    });
  }

  remove(id: string) {
    return this.mutate((d) => {
      const before = d.wishes.length;
      d.wishes = d.wishes.filter((w) => !(w.id === id && w.event_id === EVENT));
      return d.wishes.length !== before;
    });
  }

  resetDisplay() {
    return this.mutate((d) => {
      let n = 0;
      for (const w of this.mine(d)) if (w.status === "approved") { w.status = "archived"; n++; }
      this.state(d).reset_at = new Date().toISOString();
      return n;
    });
  }

  resetWishes() {
    return this.mutate((d) => {
      const before = d.wishes.length;
      d.wishes = d.wishes.filter((w) => w.event_id !== EVENT);
      this.state(d).reset_at = new Date().toISOString();
      return before - d.wishes.length;
    });
  }

  async getState() {
    return { ...this.state(await this.load()) };
  }

  setAutoApprove(value: boolean) {
    return this.mutate((d) => {
      const st = this.state(d);
      st.auto_approve = value;
      return { ...st, version: st.version + 1 };
    });
  }
}

const g = globalThis as unknown as { __wishTreeLocalStore?: LocalStore };
export function getLocalStore(): LocalStore {
  return (g.__wishTreeLocalStore ??= new LocalStore());
}
