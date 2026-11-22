"use client";

import { useState } from "react";
import { ReportVersionsView } from "@/features/periodic-reports/views/ReportVersionsView";
import { departmentMembers, describeTarget, reportVersions } from "@/mocks/periodic-reports";

// غلاف تفاعلي لصفحة الرسم (G15): يملك النسخة المختارة. GET /versions بعد تحويل snapshot. لا يُنقل للإنتاج.

const people = departmentMembers.LOGISTICS ?? [];
const memberName = (id: number) => people.find((user) => user.id === id)?.name ?? `#${id}`;

export function ReportVersionsDemo({ mode = "ready" }: { mode?: "ready" | "loading" | "error" }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <ReportVersionsView
      versions={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: reportVersions }}
      selected={selected}
      onSelect={setSelected}
      targetLabel={describeTarget}
      memberName={memberName}
      onBack={() => {}}
    />
  );
}
