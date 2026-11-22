"use client";

import type { ReactNode } from "react";
import { DateCell, DateTimeCell, MoneyCell, NumberCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { Card } from "@/components/ui/Card";
import type { ReportResult } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";

type ReportColumn = NonNullable<ReportResult["columns"]>[number];
type ReportRow = NonNullable<ReportResult["rows"]>[number];

type ReportTableProps = {
  report: ReportResult | null;
  loading: boolean;
  /** يحل مكان الصفوف حين يكون التقرير بلا أسطر. */
  empty?: ReactNode;
};

const MONEY = /^-?\d+(\.\d+)?$/;
const text = (value: unknown) => (typeof value === "string" ? value : typeof value === "number" ? String(value) : null);

/** خلية حسب `type` العمود في العقد. المبالغ نص عشري تُعرض كما هي بلا حساب، والسالب (القيد المعاكس) يبقى بإشارته. */
function ReportCell({ type, value }: { type: ReportColumn["type"]; value: unknown }) {
  const raw = text(value);
  switch (type) {
    case "money":
      return <MoneyCell value={raw !== null && MONEY.test(raw) ? raw : null} />;
    case "integer":
    case "number":
      return <NumberCell value={typeof value === "number" ? value : null} />;
    case "date":
      return <DateCell value={raw} />;
    case "datetime":
      return <DateTimeCell value={raw} />;
    default:
      return <TextCell value={raw} />;
  }
}

/** قيمة الإجمالي كنص: المبلغ بصيغة الدولار، والعدد كما هو. */
function totalText(type: ReportColumn["type"], value: unknown): string | null {
  const raw = text(value);
  if (raw === null) return null;
  return type === "money" && MONEY.test(raw) ? formatMoney(raw) : raw;
}

/**
 * جدول `ReportResult` العام (I13 · I14): الأعمدة كما يرسلها الخادم بتسمياتها وأنواعها، والصفوف كما هي، والإجماليات من `totals` بمفتاح العمود.
 * العمود الأول أساسي في بطاقة الموبايل، والأعمدة الرقمية إلى النهاية.
 */
export function ReportTable({ report, loading, empty }: ReportTableProps) {
  const reportColumns = report?.columns ?? [];
  // قبل وصول التقرير لا أعمدة: أربعة أعمدة بلا عناوين لشكل الـ Skeleton فقط.
  const placeholders: DataTableColumn<ReportRow>[] = ["a", "b", "c", "d"].map((key) => ({ key, header: "", cell: () => null, priority: "high" }));
  const columns: DataTableColumn<ReportRow>[] = !report ? placeholders : reportColumns.map((column, index) => {
    const numeric = column.type === "money" || column.type === "integer" || column.type === "number";
    return {
      key: column.key ?? String(index),
      header: column.label ?? "",
      cell: (row) => <ReportCell type={column.type} value={row[column.key ?? ""]} />,
      align: numeric ? "end" : "start",
      priority: index < 2 || numeric ? "high" : "normal",
      ...(index === 0 ? { role: "primary" as const } : {}),
    };
  });

  const totals = report?.totals ?? {};
  const totalItems = reportColumns.flatMap((column) => {
    const value = totalText(column.type, totals[column.key ?? ""]);
    return value === null ? [] : [{ label: column.label ?? "", value: <span dir="ltr">{value}</span> }];
  });

  return (
    <div className="flex flex-col gap-4">
      <DataTable label={report?.title ?? "التقرير"} columns={columns} rows={report?.rows ?? []} getRowKey={(row) => (report?.rows ?? []).indexOf(row)} loading={loading} empty={empty} density="compact" />
      {totalItems.length > 0 ? (
        <Card title="الإجمالي">
          <DescriptionList items={totalItems} />
        </Card>
      ) : null}
    </div>
  );
}
