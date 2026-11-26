import type { PublicWish } from "@/lib/types";

/** Sample wishes for ?demo=true — warm, generic and suitable for any audience. */
const MESSAGES = [
  "Health and happiness for my whole family",
  "Snow on Christmas morning",
  "More time with the people I love",
  "A peaceful and gentle new year",
  "That Grandma feels better soon",
  "To finally learn to ski",
  "Laughter around a full table",
  "A puppy, please!",
  "Kindness, everywhere, always",
  "Safe travels for everyone going home",
  "To see the northern lights",
  "Courage to start something new",
  "A cosy winter by the fire",
  "That my kids stay curious forever",
  "Joy for everyone who is alone this season",
  "To run my first marathon",
  "A home of our own",
  "Peace on earth",
  "More music and dancing",
  "That our new baby sleeps through the night",
  "Hot chocolate and good books",
  "To make my parents proud",
  "A year full of adventures",
  "Good friends and long walks",
  "That everyone here finds what they're hoping for",
  "A garden full of roses next summer",
  "To forgive and be forgiven",
  "Patience, and a little more sleep",
];
const NAMES = ["Emma", "Liam", "", "Olivia", "Noah", "Sophia", "", "Lucas", "Mia", "Arjun", "Chloé", "", "Kenji", "Amara", "Daniel", "Priya", ""];

let counter = 0;

/** A new sample wish. Cycles through the list, then repeats it. */
export function demoWish(): PublicWish {
  const i = counter++;
  return {
    id: `demo-${i}`,
    message: MESSAGES[i % MESSAGES.length],
    name: NAMES[i % NAMES.length] || null,
    seed: (Math.imul(i + 1, 2654435761) >>> 0) % 2147483647,
    approved_at: new Date().toISOString(),
  };
}

/** Initial wishes so the tree looks full the moment the demo opens. */
export function demoStart(n = 16): PublicWish[] {
  return Array.from({ length: n }, demoWish);
}

/** Keep the demo tree at a pleasant size: oldest sample wishes fade away. */
export const DEMO_MAX = 40;
export const DEMO_EVERY_MS = 7000;
