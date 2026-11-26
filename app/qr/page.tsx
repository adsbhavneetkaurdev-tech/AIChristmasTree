import type { Metadata } from "next";
import QRCode from "qrcode";
import { guestUrl } from "@/lib/guest-url";
import MorusCredit from "@/components/MorusCredit";
import { config } from "@/lib/config";
import styles from "./qr.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Scan to make a wish · ${config.eventName}` };

/** Printable table card / poster with the guest QR code. */
export default async function QrPage() {
  const url = await guestUrl();
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#00000000" },
  });
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        {config.eyebrow && <p className={styles.eyebrow}>{config.eyebrow}</p>}
        <h1 className={styles.title}>{config.eventName}</h1>
        <p className={styles.subtitle}>{config.greeting}</p>
        <div className={styles.qr} dangerouslySetInnerHTML={{ __html: svg }} />
        <p className={styles.cta}>Scan with your phone camera to add your wish</p>
        <p className={styles.url}>{url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p>
      </div>
      <MorusCredit />
    </main>
  );
}
