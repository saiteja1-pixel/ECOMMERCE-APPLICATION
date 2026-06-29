"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NotificationsHub } from "@/components/shared/notifications-hub";

export default function SellerNotificationsPage() {
  return (
    <DashboardLayout role="seller">
      <NotificationsHub role="seller" />
    </DashboardLayout>
  );
}
