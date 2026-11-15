"use client";

import { useState } from "react";
import { RecallTraceView, type RecallTraceExportFormat } from "@/features/batches/views/RecallTraceView";
import type { RecallTrace } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";

// غلاف تفاعلي لصفحة الرسم: التصدير يعطّل الأزرار لحظة (في الإنتاج: GET /batches/{id}/recall-trace?format=pdf|xlsx وتنزيل الملف).
// لا يُنقل للإنتاج.

type RecallTraceDemoProps = {
  trace: RecallTrace;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو غير موجودة. */
  mode?: "ready" | "loading" | "error" | "not-found";
  /** صيغة قيد التصدير عند العرض (حالة «exporting»). */
  initialExporting?: RecallTraceExportFormat | null;
};

export function RecallTraceDemo({ trace, mode = "ready", initialExporting = null }: RecallTraceDemoProps) {
  const [exporting, setExporting] = useState<RecallTraceExportFormat | null>(initialExporting);

  const loadable: Loadable<RecallTrace> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data: trace };

  return (
    <RecallTraceView
      trace={loadable}
      exporting={exporting}
      onExport={(format) => {
        setExporting(format);
        window.setTimeout(() => setExporting(null), 1500);
      }}
      onBack={() => {}}
    />
  );
}
