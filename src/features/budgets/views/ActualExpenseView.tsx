"use client";

import { MoneyCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
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
import { formatDateTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type BudgetLine = NonNullable<Budget["lines"]>[number];

/** المصروف المكتوب لكل بند ENTERED بمفتاح `String(category.id)`، كما يُرسل في `PUT /expenses/{month}`. الفارغ لا يُرسل. */
export type ExpenseDraft = Readonly<Record<string, string>>;

type ActualExpenseViewProps = {
  month: IsoMonth;
  onMonthChange: (month: IsoMonth) => void;
  closedMonths: readonly IsoMonth[];
  today: IsoDate;
  /** `GET /budgets/{month}`: تُعرض البنود والفعلي فقط، لا الميزانية ولا النسبة (§84). */
  budget: Loadable<Budget>;
  /** `expenses.enter`. */
  canEnter: boolean;
  draft: ExpenseDraft;
  onDraftChange: (draft: ExpenseDraft) => void;
  onSave: () => void;
  saving?: boolean;
  /** `errors` من `validation_failed`: `{ "lines.0.actual": "نص" }`، والفهرس بترتيب البنود المرسلة. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل (`month_closed` عند 409). */
  saveError?: string;
  savedMessage?: string;
  onRetry?: () => void;
};

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * المصروف الفعلي (I12): لكل بند يدخله المحاسب مبلغ الشهر، وبند العينات محسوب من النظام للقراءة. البند الناقص معلَّم، ولا يُغلق الشهر حتى يكتمل.
 * بعد إغلاق الشهر للقراءة فقط.
 */
export function ActualExpenseView({ month, onMonthChange, closedMonths, today, budget, canEnter, draft, onDraftChange, onSave, saving = false, errors = {}, saveError, savedMessage, onRetry }: ActualExpenseViewProps) {
  const ready = budget.status === "ready" ? budget.data : null;
  const locked = ready?.locked ?? false;
  const editable = canEnter && ready !== null && !locked;
  const lines = ready?.lines ?? [];
  const entered = lines.filter((line) => line.category?.kind === "ENTERED");
  const missing = entered.filter((line) => line.actual === null || line.actual === undefined);
  const values = entered.map((line) => (draft[String(line.category?.id ?? "")] ?? "").trim());
  const invalid = values.some((value) => value !== "" && !MONEY_PATTERN.test(value));
  const nothing = values.every((value) => value === "");
  const sentIndex = (row: BudgetLine) => entered.filter((line) => (draft[String(line.category?.id ?? "")] ?? "").trim() !== "").indexOf(row);

  // أخطاء الخادم تحت الجدول باسم بندها، لأن ارتفاع الصف ثابت فلا تتسع الخلية لسطر تحت الحقل.
  const serverErrors = entered.flatMap((line) => {
    const message = errors[`lines.${sentIndex(line)}.actual`];
    return message ? [{ name: line.category?.name ?? "", message }] : [];
  });

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
      key: "actual",
      header: "المصروف الفعلي",
      cell: (row) => {
        const key = String(row.category?.id ?? "");
        if (row.category?.kind === "ENTERED" && editable) {
          const value = draft[key] ?? "";
          const serverError = errors[`lines.${sentIndex(row)}.actual`];
          return <MoneyInput aria-label={`المصروف الفعلي لـ${row.category?.name ?? ""}`} value={value} invalid={Boolean(serverError) || (value.trim() !== "" && !MONEY_PATTERN.test(value.trim()))} onChange={(event) => onDraftChange({ ...draft, [key]: event.target.value })} disabled={saving} />;
        }
        if (row.actual === null || row.actual === undefined) return row.category?.kind === "ENTERED" ? <Badge color="warning">لم يُدخل بعد</Badge> : <TextCell value={null} />;
        return <MoneyCell value={row.actual} />;
      },
      align: "end",
      width: "w-52",
      priority: "high",
    },
    {
      key: "status",
      header: "الحالة",
      cell: (row) => (row.category?.kind === "COMPUTED" ? <Badge color="neutral">محسوب</Badge> : row.actual === null || row.actual === undefined ? <Badge color="warning">ناقص</Badge> : <Badge color="success">مُدخل</Badge>),
      width: "w-28",
      role: "status",
    },
    {
      key: "entered",
      header: "أدخله",
      cell: (row) => <TextCell value={row.actual_entered_by ? `${row.actual_entered_by.name ?? ""} · ${row.actual_entered_at ? formatDateTime(row.actual_entered_at) : ""}` : null} />,
      width: "w-56",
    },
  ];

  return (
    <>
      <PageHeader title="المصروف الفعلي" description="مصروف كل بند في الشهر. بند العينات يُحسب من الزيارات وحده." />

      <div className="flex flex-col gap-4">
        <div className="w-full max-w-64">
          <MonthPicker aria-label="الشهر" value={month} onValueChange={onMonthChange} closedMonths={closedMonths} today={today} disabled={saving} />
        </div>

        {budget.status === "error" ? <ErrorState code={budget.code} onRetry={onRetry} /> : null}

        {locked ? (
          <Banner kind="info" title={`${monthLabel(month)} مغلق`}>
            المصروف الفعلي للقراءة فقط بعد إغلاق الشهر.
          </Banner>
        ) : null}

        {!locked && missing.length > 0 ? (
          <Banner kind="warning" title="مصروف فعلي ناقص">
            {`لم يُدخل الفعلي لـ${missing.map((line) => `«${line.category?.name ?? ""}»`).join(" و")} بعد. لا يُغلق الشهر حتى يكتمل.`}
          </Banner>
        ) : null}

        {saveError ? (
          <Banner kind="danger" title="تعذّر حفظ المصروف">
            {errorMessage(saveError)}
          </Banner>
        ) : null}

        {savedMessage ? (
          <Banner kind="success" title={savedMessage}>
            {`حُفظ مصروف ${monthLabel(month)}.`}
          </Banner>
        ) : null}

        {budget.status !== "error" ? <DataTable label="بنود المصاريف" columns={columns} rows={lines} getRowKey={(row) => row.category?.id ?? ""} loading={budget.status === "loading"} /> : null}

        {editable ? (
          <div className="flex flex-col gap-2">
            {serverErrors.map((item) => (
              <p key={item.name} className="text-label text-danger">{`«${item.name}»: ${item.message}`}</p>
            ))}
            {invalid ? <p className="text-label text-fg-muted">{`اكتب المصروف مبلغاً بالدولار، مثل ${isolate("210.00")}.`}</p> : nothing ? <p className="text-label text-fg-muted">اكتب مصروف بند واحد على الأقل.</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" loading={saving} disabled={invalid || nothing} onClick={onSave}>
                حفظ المصروف
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
