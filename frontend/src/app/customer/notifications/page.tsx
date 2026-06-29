"use client";

import { CustomerDashboardLayout } from "@/components/layout/customer-dashboard-layout";
import { NotificationsHub } from "@/components/shared/notifications-hub";

export default function CustomerNotificationsPage() {
  return (
    <CustomerDashboardLayout>
      <NotificationsHub role="customer" />
    </CustomerDashboardLayout>
  );
}
