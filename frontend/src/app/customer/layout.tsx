"use client";

import type { ReactNode } from "react";
import { CustomerDashboardLayout } from "@/components/layout/customer-dashboard-layout";
import { LanguageProvider } from "@/context/language-context";

export default function CustomerLayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <CustomerDashboardLayout>{children}</CustomerDashboardLayout>
    </LanguageProvider>
  );
}
