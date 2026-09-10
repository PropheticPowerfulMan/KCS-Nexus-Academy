import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./schedule-legibility.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "KCS Nexus Academy",
  description: "The intelligent learning ecosystem of Kinshasa Christian School",
  manifest: `${basePath}/manifest.webmanifest`,
  icons: { icon: `${basePath}/nexus-app-icon.svg`, apple: `${basePath}/apple-touch-icon.png` },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "KCS Nexus" },
};

export const viewport: Viewport = {
  themeColor: "#071a2e",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}