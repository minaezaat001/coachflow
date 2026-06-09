import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CoachFlow - نظام إدارة النوادي الرياضية",
  description: "منصة متكاملة لإدارة النوادي الرياضية والمدربين الشخصيين: متابعة العملاء، الاشتراكات، المدفوعات، والتمارين",
  icons: { icon: "/assets/logo.png", apple: "/assets/logo.png" },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "CoachFlow", statusBarStyle: "black-translucent" },
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
