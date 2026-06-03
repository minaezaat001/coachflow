"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Layout>{children}</Layout>
    </AuthGuard>
  );
}
