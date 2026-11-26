import BrandLogo from "./BrandLogo";
import { config } from "@/lib/config";
import styles from "./branding.module.css";

/** Optional host logo on the guest wish form (config.json → hostLogo). */
export default function HostedBy({ compact = false }: { compact?: boolean }) {
  const host = config.hostLogo;
  if (!host) return null;
  const alt = host.alt || "Event host";
  return (
    <div className={`${styles.hosted} ${compact ? styles.hostedCompact : ""}`}>
      {host.label !== "" && <span className={styles.hostedLabel}>{host.label ?? "Hosted by"}</span>}
      <span className={styles.hostChip}>
        <BrandLogo src={host.src} alt={`${alt} logo`} fallback={alt} className={styles.hostLogo} fallbackClassName={styles.hostFallback} />
      </span>
    </div>
  );
}
