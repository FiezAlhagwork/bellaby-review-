"use client";

import { MoneyCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { KpiTile } from "@/components/data/KpiTile";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { errorMessage } from "@/lib/api/error-messages";
import type { Budget } from "@/lib/api/types";
import { monthLabel, type IsoDate, type IsoMonth } from "@/lib/calendar";
import { formatDateTime, formatMoney, formatPercent, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type BudgetLine = NonNullable<Budget["lines"]>[number];

/** مسودة الميزانية أثناء التعديل: نص عشري لكل بند بمفتاح `String(category.id)` كما يُرسل في `PUT /budgets/{month}`. */
export type BudgetDraft = Readonly<Record<string, string>>;

type BudgetViewProps = {
  month: IsoMonth;
  onMonthChange: (month: IsoMonth) => void;
  /** الأشهر المغلقة: قفل في منتقي الشهر. */
  closedMonths: readonly IsoMonth[];
  budget: Loadable<Budget>;
  /** `budgets.manage`. التفويض لا يشمله (القرار 15)، فالمفوَّض بلا هذا العلم. */
  canEdit: boolean;
  /** null = عرض. غير ذلك: وضع التعديل بالقيم المكتوبة. */
  draft: BudgetDraft | null;
  onDraftChange: (draft: BudgetDraft) => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  saving?: boolean;
  /** `errors` من `validation_failed`: `{ "lines.0.budget": "نص" }`. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل (`month_closed` عند 409). */
  saveError?: string;
  onOpenCategories?: () => void;
  today: IsoDate;
  onRetry?: () => void;
};

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

/** النسبة: فوق 100% خطر، ومن 90% تحذير. من الخادم ولا تُحسب هنا. */
function RatioCell({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <TextCell value={null} />;
  return <Badge color={value > 100 ? "danger" : value >= 90 ? "warning" : "neutral"}>{formatPercent(value)}</Badge>;
}

/**
 * الميزانية والمصاريف (E03): لكل بند الميزانية (تُعدَّل حتى إغلاق الشهر) والفعلي والنسبة ونوعه (محسوب من النظام أو يدخله المحاسب)، والإجمالي.
 * البند الذي لم يُدخل المحاسب فعليه بعد يُعلَّم. بعد الإغلاق للقراءة. لا يشمله التفويض.
 */
export function BudgetView({ month, onMonthChange, closedMonths, budget, canEdit, draft, onDraftChange, onEdit, onCancel, onSave, saving = false, errors = {}, saveError, onOpenCategories, today, onRetry }: BudgetViewProps) {
  const ready = budget.status === "ready" ? budget.data : null;
  const locked = ready?.locked ?? false;
  const editing = draft !== null && !locked;
  const lines = ready?.lines ?? [];
  const missing = lines.filter((line) => line.category?.kind === "ENTERED" && (line.actual === null || line.actual === undefined));
  const invalidDraft = editing && Object.values(draft).some((value) => !MONEY_PATTERN.test(value.trim()));

  const actions = [
    ...(onOpenCategories ? [{ id: "categories", label: "بنود المصاريف", onSelect: onOpenCategories }] : []),
    ...(canEdit && !locked && !editing && onEdit ? [{ id: "edit", label: "تعديل الميزانية", primary: true, onSelect: onEdit }] : []),
  ];

  const columns: DataTableColumn<BudgetLine>[] = [
    {
      key: "category",
      header: "البند",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{row.category?.name}</span>
          <span className="text-caption text-fg-muted">{row.category?.kind === "COMPUTED" ? "محسوب من النظام" : "يدخله المحاسب"}</span>
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    {
      key: "budget",
      header: "الميزانية",
      cell: (row) => {
        const key = String(row.category?.id ?? "");
        const index = lines.indexOf(row);
        if (!editing) return <MoneyCell value={row.budget} />;
        return <MoneyInput aria-label={`ميزانية ${row.category?.name ?? ""}`} value={draft[key] ?? ""} invalid={Boolean(errors[`lines.${index}.budget`]) || !MONEY_PATTERN.test((draft[key] ?? "").trim())} onChange={(event) => onDraftChange({ ...draft, [key]: event.target.value })} disabled={saving} />;
      },
      align: "end",
      width: "w-44",
      priority: "high",
    },
    {
      key: "actual",
      header: "الفعلي",
      cell: (row) =>
        row.actual === null || row.actual === undefined ? (
          row.category?.kind === "ENTERED" ? <Badge color="warning">لم يُدخل بعد</Badge> : <TextCell value={null} />
        ) : (
          <MoneyCell value={row.actual} />
        ),
      align: "end",
      width: "w-36",
      priority: "high",
    },
    { key: "ratio", header: "من الميزانية", cell: (row) => <RatioCell value={row.ratio_pct} />, width: "w-28", role: "status" },
    {
      key: "entered",
      header: "أدخله",
      cell: (row) => <TextCell value={row.actual_entered_by ? `${row.actual_entered_by.name ?? ""} · ${row.actual_entered_at ? formatDateTime(row.actual_entered_at) : ""}` : null} />,
      width: "w-56",
    },
  ];

  return (
    <>
      <PageHeader title="الميزانية والمصاريف" description="ميزانية كل بند في الشهر مقابل مصروفه الفعلي. تُعدَّل الميزانية حتى إغلاق الشهر." actions={actions} />

      <div className="flex flex-col gap-4">
        <div className="w-full max-w-64">
          <MonthPicker aria-label="الشهر" value={month} onValueChange={onMonthChange} closedMonths={closedMonths} today={today} disabled={editing} />
        </div>

        {budget.status === "error" ? <ErrorState code={budget.code} onRetry={onRetry} /> : null}

        {locked ? (
          <Banner kind="info" title={`${monthLabel(month)} مغلق`}>
            الميزانية والمصروف الفعلي للقراءة فقط بعد إغلاق الشهر.
          </Banner>
        ) : null}

        {!locked && missing.length > 0 ? (
          <Banner kind="warning" title="مصروف فعلي ناقص">
            {`لم يُدخل المحاسب الفعلي لـ${missing.map((line) => `«${line.category?.name ?? ""}»`).join(" و")} بعد. لا يُغلق الشهر حتى يكتمل.`}
          </Banner>
        ) : null}

        {saveError ? (
          <Banner kind="danger" title="تعذّر حفظ الميزانية">
            {errorMessage(saveError)}
          </Banner>
        ) : null}

        {budget.status !== "error" ? (
          <>
            <Grid cols={{ base: 1, tablet: 3 }} gap={4}>
              <KpiTile label="إجمالي الميزانية" value={ready?.total_budget ? formatMoney(ready.total_budget) : ""} state={ready ? "ready" : "loading"} size="md" />
              <KpiTile label="إجمالي المصروف" value={ready?.total_actual ? formatMoney(ready.total_actual) : ""} provisional={!locked} state={ready ? "ready" : "loading"} size="md" />
              <KpiTile
                label="من الميزانية"
                value={ready?.total_ratio_pct !== null && ready?.total_ratio_pct !== undefined ? formatPercent(ready.total_ratio_pct, 1) : ""}
                progress={ready?.total_ratio_pct ?? undefined}
                state={ready ? (ready.total_ratio_pct === null || ready.total_ratio_pct === undefined ? "empty" : "ready") : "loading"}
                size="md"
              />
            </Grid>

            <DataTable label="بنود الميزانية" columns={columns} rows={lines} getRowKey={(row) => row.category?.id ?? ""} loading={budget.status === "loading"} />
          </>
        ) : null}

        {editing ? (
          <div className="flex flex-col gap-2">
            {invalidDraft ? <p className="text-label text-fg-muted">{`اكتب ميزانية كل بند مبلغاً بالدولار، مثل ${isolate("2500.00")}.`}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" loading={saving} disabled={invalidDraft} onClick={onSave}>
                حفظ الميزانية
              </Button>
              <Button variant="secondary" disabled={saving} onClick={onCancel}>
                إلغاء
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
