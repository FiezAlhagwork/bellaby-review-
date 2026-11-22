"use client";

import { Table } from "@phosphor-icons/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { MonthPicker } from "@/components/ui/MonthPicker";
import type { ReportResult } from "@/lib/api/types";
import { monthLabel, type IsoDate, type IsoMonth } from "@/lib/calendar";
import { formatDateTime } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { ReportTable } from "../components/ReportTable";

type AccountingReportViewProps = {
  /** «تقرير الدوام» أو «تقرير الخصومات». */
  title: string;
  description: string;
  month: IsoMonth;
  onMonthChange: (month: IsoMonth) => void;
  closedMonths: readonly IsoMonth[];
  today: IsoDate;
  /** `GET /accounting/<report>?month&format=json`. */
  report: Loadable<ReportResult>;
  /** `format=xlsx`: يُنزّل الملف. */
  onExport: () => void;
  exporting?: boolean;
  onRetry?: () => void;
};

/**
 * تقرير محاسبي شهري (I13 تقرير الدوام · I14 تقرير الخصومات): منتقي الشهر، وشارة «مبدئي» أو «نهائي» من `is_final`، والجدول بأعمدة الخادم، والإجمالي، و«تصدير Excel».
 * المبدئي يتغيّر حتى إغلاق الشهر، والنهائي بعده. القيد المعاكس في تقرير الخصومات سطران متقابلان كما يرسلهما الخادم.
 */
export function AccountingReportView({ title, description, month, onMonthChange, closedMonths, today, report, onExport, exporting = false, onRetry }: AccountingReportViewProps) {
  const ready = report.status === "ready" ? report.data : null;
  const empty = ready !== null && (ready.rows ?? []).length === 0;
  const badge = ready && ready.is_final !== null && ready.is_final !== undefined ? <Badge color={ready.is_final ? "success" : "warning"}>{ready.is_final ? "نهائي" : "مبدئي"}</Badge> : undefined;

  return (
    <>
      <PageHeader
        title={title}
        badge={badge}
        description={ready?.generated_at ? `${description} · وُلّد في ${formatDateTime(ready.generated_at)}` : description}
        actions={[{ id: "export", label: exporting ? "جارٍ التصدير…" : "تصدير Excel", primary: true, disabled: !ready || empty || exporting, onSelect: onExport }]}
      />

      <div className="flex flex-col gap-4">
        <div className="w-full max-w-64">
          <MonthPicker aria-label="الشهر" value={month} onValueChange={onMonthChange} closedMonths={closedMonths} today={today} />
        </div>

        {ready && ready.is_final === false ? (
          <Banner kind="warning" title={`أرقام ${monthLabel(month)} مبدئية`}>
            يتغيّر التقرير حتى إغلاق الشهر، ويصير نهائياً بعده.
          </Banner>
        ) : null}

        {report.status === "error" ? (
          <ErrorState code={report.code} onRetry={onRetry} />
        ) : (
          <ReportTable report={ready} loading={report.status === "loading"} empty={<EmptyState icon={Table} title="لا أسطر في هذا الشهر" description={`لا بيانات في ${monthLabel(month)} بعد.`} />} />
        )}
      </div>
    </>
  );
}
