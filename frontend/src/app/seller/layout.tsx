import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function SellerLayoutWrapper({ children }: { children: ReactNode }) {
  return <DashboardLayout role="seller">{children}</DashboardLayout>;
}
