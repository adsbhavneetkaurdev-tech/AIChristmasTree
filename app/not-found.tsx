import Link from "next/link";
import MorusCredit from "@/components/MorusCredit";
import { config } from "@/lib/config";
import styles from "./status-page.module.css";

export const metadata = { title: `Page not found · ${config.eventName}` };

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>{config.eventName}</p>
        <h1 className={styles.title}>This page has wandered off into the snow</h1>
        <p className={styles.text}>The link may be mistyped, or the page has moved.</p>
        <Link className={styles.button} href="/">Make a wish</Link>
      </div>
      <MorusCredit />
    </main>
  );
}
