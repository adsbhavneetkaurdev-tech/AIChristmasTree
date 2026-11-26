import type { Metadata, Viewport } from "next";
import { config, theme, themeCssVars } from "@/lib/config";
import { serif, sans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: config.eventName,
  description: config.greeting,
};

export const viewport: Viewport = {
  themeColor: theme.bg900,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} style={themeCssVars() as React.CSSProperties}>
      <body>{children}</body>
    </html>
  );
}
