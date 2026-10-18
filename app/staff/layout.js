"use client";

import StaffShell from "@/components/staff/StaffShell";
import { StaffProvider } from "@/lib/staff/StaffStore";

export default function StaffLayout({ children }) {
  return (
    <StaffProvider>
      <StaffShell>{children}</StaffShell>
    </StaffProvider>
  );
}
