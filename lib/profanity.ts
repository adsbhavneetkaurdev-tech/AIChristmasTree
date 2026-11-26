/**
 * Lightweight family-friendly filter (config.json → moderation.profanityFilter).
 * Catches common English profanity, including simple disguises like "f*ck",
 * "sh1t" or "b i t c h". For full control, keep moderation.requireApproval on.
 */
const WORDS = [
  "fuck", "fucker", "fucking", "motherfucker", "shit", "shitty", "bullshit", "bitch", "bastard",
  "asshole", "arsehole", "dick", "dickhead", "cock", "cunt", "pussy", "twat", "wanker", "prick",
  "slut", "whore", "piss", "bollocks", "douche", "jackass", "dumbass", "retard", "nigger", "nigga",
  "faggot", "fag", "spic", "chink", "kike", "porn", "dildo", "tits", "boobs",
  "shithead", "shitface", "fuckface", "fuckwit", "asshat", "dipshit", "jerkoff", "skank",
];

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" };

function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[013457@$]/g, (c) => LEET[c] ?? c)
    .replace(/(.)\1{2,}/g, "$1$1"); // "fuuuuck" → "fuuck"
}

const PATTERNS = WORDS.map((w) => {
  // Allow masking characters/spaces between letters and stretched letters: f*ck, f u c k, fuuck
  const letters = w.split("").map((ch) => `${ch}+`).join("[\\s*._-]?");
  return new RegExp(`(^|[^a-z])${letters.replace(/u\+/g, "[u*]+")}(?=$|[^a-z]|s\\b|es\\b|ing\\b|ed\\b|er\\b)`, "i");
});

export function containsProfanity(...texts: (string | null | undefined)[]): boolean {
  return texts.some((t) => {
    if (!t) return false;
    const n = normalise(t);
    return PATTERNS.some((p) => p.test(n));
  });
}
