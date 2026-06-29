"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NotificationsHub } from "@/components/shared/notifications-hub";

export default function AdminNotificationsPage() {
  return (
    <DashboardLayout role="admin">
      <NotificationsHub role="admin" />
    </DashboardLayout>
  );
}
