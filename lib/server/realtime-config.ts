import "server-only";
import type { RealtimeConfig } from "@/lib/types";
import { isSupabaseConfigured, supabaseUrl } from "./store";
import { config } from "@/lib/config";

export function realtimeConfig(): RealtimeConfig {
  if (isSupabaseConfigured() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      mode: "supabase",
      url: supabaseUrl(),
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim(),
      eventId: config.eventId,
    };
  }
  return { mode: "local" };
}
