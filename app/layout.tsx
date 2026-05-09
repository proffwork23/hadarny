import type { Metadata } from "next";
import "./globals.css";
import { Tajawal, Amiri } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";

const tajawal = Tajawal({
  variable: "--font-sans",
  subsets: ["arabic"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "منصة حضّرني | Hadarni",
  description: "نظام إلكتروني ذكي ومحكم لإدارة حضور وانصراف الطلاب",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${tajawal.variable} ${amiri.variable} h-full antialiased`}
    >
      <body 
        className="min-h-full flex flex-col font-sans relative transition-colors duration-500 bg-background text-foreground"
        suppressHydrationWarning
      >
        {/* Full-page background layer */}
        <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_60%_-5%,rgba(56,189,248,0.14),transparent_55%),radial-gradient(900px_500px_at_90%_10%,rgba(37,99,235,0.12),transparent_60%),radial-gradient(800px_400px_at_10%_80%,rgba(245,158,11,0.07),transparent_55%)]" />
        </div>
        
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}