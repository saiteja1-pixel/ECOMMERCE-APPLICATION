import type { ReactNode } from "react";
import { CustomerDashboardLayout } from "@/components/layout/customer-dashboard-layout";

export default function CustomerLayoutWrapper({ children }: { children: ReactNode }) {
  return <CustomerDashboardLayout>{children}</CustomerDashboardLayout>;
}
