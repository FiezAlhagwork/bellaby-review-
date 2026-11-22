"use client";

import { useState } from "react";
import { AccountingReportView } from "@/features/accounting/views/AccountingReportView";
import type { ReportResult } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { accountingToday, attendanceFinal, attendanceProvisional, deductionsFinal, deductionsProvisional, deductionsWithReversal, emptyReport } from "@/mocks/accounting";
import { closedMonths } from "@/mocks/finance";

// غلاف تفاعلي لصفحتي الرسم (I13 · I14): يملك الشهر وحالة التصدير. تشرين الأول مغلق فتقريره نهائي، وتشرين الثاني مبدئي.
// في الإنتاج حاوية تطلب GET /accounting/<report>?month، والتصدير بـ format=xlsx. لا يُنقل للإنتاج.

type AccountingReportDemoProps = {
  report: "attendance" | "deductions";
  initialMonth?: string;
  /** with-reversal: تشرين الثاني وفيه قيد معاكس. */
  dataset?: "default" | "with-reversal" | "empty";
  mode?: "ready" | "loading" | "error";
};

const texts = {
  attendance: { title: "تقرير الدوام", description: "لكل موظف في الشهر: أيام العمل والغياب والدوام الناقص والإجازات" },
  deductions: { title: "تقرير الخصومات", description: "لكل موظف خصوماته في الشهر، والقيد المعاكس سطران متقابلان" },
};

export function AccountingReportDemo({ report, initialMonth = "2026-11", dataset = "default", mode = "ready" }: AccountingReportDemoProps) {
  const [month, setMonth] = useState(initialMonth);
  const [exporting, setExporting] = useState(false);

  const final = month !== "2026-11";
  const data: ReportResult =
    dataset === "empty"
      ? emptyReport
      : report === "attendance"
        ? final
          ? attendanceFinal
          : attendanceProvisional
        : final
          ? deductionsFinal
          : dataset === "with-reversal"
            ? deductionsWithReversal
            : deductionsProvisional;

  const loadable: Loadable<ReportResult> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data };

  return (
    <AccountingReportView
      title={texts[report].title}
      description={texts[report].description}
      month={month}
      onMonthChange={setMonth}
      closedMonths={closedMonths}
      today={accountingToday}
      report={loadable}
      onExport={() => {
        setExporting(true);
        window.setTimeout(() => setExporting(false), 1200);
      }}
      exporting={exporting}
    />
  );
}
