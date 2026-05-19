import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BadgeUnlockToast } from "@/components/BadgeUnlockToast";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { NotificationManager } from "@/components/NotificationManager";

export const metadata: Metadata = {
  title: "原子习惯 · Atomic Habits",
  description: "基于《原子习惯》方法论的极简习惯打卡工具",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "原子习惯",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen pb-20">
        <ThemeProvider>
          <main className="max-w-3xl mx-auto px-4 pt-6">{children}</main>
          <BottomNav />
          <BadgeUnlockToast />
          <KeyboardShortcuts />
          <NotificationManager />
        </ThemeProvider>
      </body>
    </html>
  );
}
