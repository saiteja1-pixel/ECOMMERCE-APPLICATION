import type { ReactNode } from "react";
import { PublicLayout } from "@/components/layout/public-layout";

export default function PublicLayoutWrapper({ children }: { children: ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
