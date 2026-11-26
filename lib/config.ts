import raw from "@/config.json";
import { resolveTheme, type CustomColors, type Theme } from "@/engine/theme";

/**
 * The single source of truth for an event. Edit config.json (see README),
 * redeploy, done. Everything here has a safe default.
 */
export interface LogoConfig {
  src: string;
  alt?: string;
  /** Text shown above the host logo, e.g. "Hosted by". */
  label?: string;
}
export interface GiftConfig {
  logo?: string;
  name?: string;
}
export interface AppConfig {
  eventId: string;
  eventName: string;
  greeting: string;
  eyebrow: string;
  hostLogo: LogoConfig | null;
  gifts: GiftConfig[];
  theme: { preset: "classic" | "elegant" | "winter" | "custom"; custom?: CustomColors };
  form: { prompt: string; placeholder: string; namePrompt: string; buttonText: string; maxLength: number };
  moderation: { requireApproval: boolean; profanityFilter: boolean };
  display: { showQr: boolean; qrLabel: string[] };
  guestUrl: string;
  showPoweredBy: boolean;
}

type Raw = Partial<Omit<AppConfig, "form" | "moderation" | "display" | "theme">> & {
  form?: Partial<AppConfig["form"]>;
  moderation?: Partial<AppConfig["moderation"]>;
  display?: Partial<AppConfig["display"]>;
  theme?: Partial<AppConfig["theme"]>;
};
const r = raw as Raw;
const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);

/** Event IDs are lowercase letters, digits and dashes; NEXT_PUBLIC_EVENT_ID overrides config.json. */
function eventId(): string {
  const v = (process.env.NEXT_PUBLIC_EVENT_ID || str(r.eventId, "default")).toLowerCase();
  const clean = v.replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
  return clean || "default";
}

export const config: AppConfig = {
  eventId: eventId(),
  eventName: str(r.eventName, "The Christmas Wish Tree"),
  greeting: str(r.greeting, "Every wish makes the tree shine brighter."),
  eyebrow: str(r.eyebrow, ""),
  hostLogo: r.hostLogo && typeof r.hostLogo.src === "string" && r.hostLogo.src ? r.hostLogo : null,
  gifts: (Array.isArray(r.gifts) ? r.gifts : []).slice(0, 6),
  theme: { preset: (r.theme?.preset as AppConfig["theme"]["preset"]) ?? "classic", custom: r.theme?.custom },
  form: {
    prompt: str(r.form?.prompt, "What is your Christmas wish?"),
    placeholder: str(r.form?.placeholder, "I wish for…"),
    namePrompt: str(r.form?.namePrompt, "Your name"),
    buttonText: str(r.form?.buttonText, "Add My Wish"),
    maxLength: Math.max(20, Math.min(500, Math.round(Number(r.form?.maxLength) || 140))),
  },
  moderation: {
    requireApproval: bool(r.moderation?.requireApproval, true),
    profanityFilter: bool(r.moderation?.profanityFilter, true),
  },
  display: {
    showQr: bool(r.display?.showQr, true),
    qrLabel: Array.isArray(r.display?.qrLabel) ? r.display!.qrLabel!.map(String).slice(0, 3) : ["Scan to add", "your Christmas wish"],
  },
  guestUrl: str(r.guestUrl, ""),
  showPoweredBy: bool(r.showPoweredBy, false),
};

export const theme: Theme = resolveTheme(config.theme.preset, config.theme.custom);

/** CSS custom properties for the active theme (applied on <html>). */
export function themeCssVars(): Record<string, string> {
  return {
    "--gold": theme.accent,
    "--gold-bright": theme.accentBright,
    "--gold-dark": theme.accentDark,
    "--champagne": theme.champagne,
    "--ivory": theme.text,
    "--red": theme.secondary,
    "--evergreen-950": theme.bg950,
    "--evergreen-900": theme.bg900,
    "--evergreen-800": theme.bg800,
    "--evergreen-700": theme.bg700,
    "--evergreen-600": theme.bg700,
  };
}
