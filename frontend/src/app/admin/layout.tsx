import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function AdminLayoutWrapper({ children }: { children: ReactNode }) {
  return <DashboardLayout role="admin">{children}</DashboardLayout>;
}
