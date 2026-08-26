import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"KCS Nexus Academy",description:"L’écosystème d’apprentissage intelligent de Kinshasa Christian School"};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="fr" suppressHydrationWarning><body>{children}</body></html>}