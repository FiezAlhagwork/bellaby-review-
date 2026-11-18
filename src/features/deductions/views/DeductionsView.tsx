"use client";

import { Coins, MagnifyingGlass } from "@phosphor-icons/react";
import { DateTimeStackCell, MoneyCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { MonthPicker } from "@/components/ui/MonthPicker";
import type { Option } from "@/components/ui/OptionList";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { Deduction, UserRef } from "@/lib/api/types";
import { monthLabel, type IsoDate, type IsoMonth } from "@/lib/calendar";
import { formatMoney, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type Source = NonNullable<Deduction["source"]>;
/** المصادر التي يُنشئ بها المدير خصماً يدوياً (`POST /deductions`). خصم التحقيق يأتي من قرار التحقيق (S15). */
export type ManualSource = Exclude<Source, "INVESTIGATION">;

export const deductionSourceLabels = { TASK: "مهمة", ATTENDANCE: "دوام", INVESTIGATION: "تحقيق", OTHER: "آخر" } as const satisfies Record<Source, string>;

export type DeductionFilters = { userId: string | null; month: IsoMonth | null };
export const noDeductionFilters: DeductionFilters = { userId: null, month: null };

export type DeductionsPage = { data: readonly Deduction[]; meta: PaginationMeta };

/** نموذج «خصم جديد» كما يُرسل: `user_id` و`amount` و`reason` و`source` و`month`. */
export type DeductionForm = { userId: string | null; amount: string; reason: string; source: ManualSource | null; month: IsoMonth | null };
export const emptyDeductionForm = (month: IsoMonth): DeductionForm => ({ userId: null, amount: "", reason: "", source: null, month });

type DeductionsViewProps = {
  deductions: Loadable<DeductionsPage>;
  users: readonly UserRef[];
  filters: DeductionFilters;
  onFiltersChange: (filters: DeductionFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** `deductions.create`: «خصم جديد» و«قيد معاكس». للمدير التنفيذي وحده. */
  canCreate: boolean;
  closedMonths: readonly IsoMonth[];
  /** null = النافذة مغلقة. */
  form: DeductionForm | null;
  onFormChange: (form: DeductionForm | null) => void;
  onSubmit?: () => void;
  /** الخصم الذي يُعكس (نافذة السبب). */
  reversing: Deduction | null;
  onReversingChange: (deduction: Deduction | null) => void;
  reverseReason: string;
  onReverseReasonChange: (reason: string) => void;
  onReverse?: () => void;
  submitting?: boolean;
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل: `month_closed` (409). */
  submitError?: string;
  today: IsoDate;
  onRetry?: () => void;
};

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;
const sourceOptions: Option<ManualSource>[] = (["TASK", "ATTENDANCE", "OTHER"] as const).map((value) => ({ value, label: deductionSourceLabels[value] }));

/**
 * الخصومات (E05): الموظف والمبلغ والسبب والمصدر والشهر والقيد المعاكس. «خصم جديد» في نافذة، و«قيد معاكس» بسبب يشير للأصلي قبل إغلاق الشهر.
 * الخصم لا يُنقص النقاط، لكنه يمنع الترشيح لموظف الشهر (القرار 13). للمدير التنفيذي وحده.
 */
export function DeductionsView({
  deductions,
  users,
  filters,
  onFiltersChange,
  onPageChange,
  onPerPageChange,
  canCreate,
  closedMonths,
  form,
  onFormChange,
  onSubmit,
  reversing,
  onReversingChange,
  reverseReason,
  onReverseReasonChange,
  onReverse,
  submitting = false,
  errors = {},
  submitError,
  today,
  onRetry,
}: DeductionsViewProps) {
  const userOptions: Option[] = users.flatMap((user) => (user.id !== undefined && user.name ? [{ value: String(user.id), label: user.name }] : []));
  const set = (patch: Partial<DeductionFilters>) => onFiltersChange({ ...filters, ...patch });
  const active: ActiveFilter[] = [
    ...(filters.userId ? [{ key: "user", label: `الموظف: ${userOptions.find((o) => o.value === filters.userId)?.label ?? ""}`, onRemove: () => set({ userId: null }) }] : []),
    ...(filters.month ? [{ key: "month", label: `الشهر: ${monthLabel(filters.month)}`, onRemove: () => set({ month: null }) }] : []),
  ];

  const columns: DataTableColumn<Deduction>[] = [
    { key: "user", header: "الموظف", cell: (row) => <TextCell value={row.user?.name} />, width: "w-40", priority: "high", role: "primary" },
    { key: "amount", header: "المبلغ", cell: (row) => <MoneyCell value={row.amount} />, align: "end", width: "w-28", priority: "high" },
    { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason} /> },
    { key: "source", header: "المصدر", cell: (row) => <TextCell value={row.source ? deductionSourceLabels[row.source] : null} />, width: "w-24", priority: "high" },
    { key: "month", header: "الشهر", cell: (row) => <TextCell value={row.month ? monthLabel(row.month) : null} />, width: "w-32" },
    {
      key: "reverse",
      header: "القيد المعاكس",
      cell: (row) =>
        row.reverses_id ? (
          <Badge color="info">{`يعكس ${isolate(`#${row.reverses_id}`)}`}</Badge>
        ) : row.reversed_by_id ? (
          <Badge color="neutral">{`معكوس بـ ${isolate(`#${row.reversed_by_id}`)}`}</Badge>
        ) : (
          <TextCell value={null} />
        ),
      width: "w-36",
      role: "status",
    },
    { key: "created_at", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28" },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد خصومات تطابق ما اخترته."
        action={
          <Button variant="secondary" onClick={() => onFiltersChange(noDeductionFilters)}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={Coins} title="لا خصومات" description="تظهر هنا الخصومات اليدوية وخصومات التحقيقات." />
    );

  const formReason =
    form === null
      ? null
      : form.userId === null
        ? "اختر الموظف."
        : !MONEY_PATTERN.test(form.amount.trim())
          ? "اكتب المبلغ بالدولار."
          : form.source === null
            ? "اختر المصدر."
            : form.month === null
              ? "اختر الشهر."
              : form.reason.trim() === ""
                ? "اكتب سبب الخصم."
                : null;

  return (
    <>
      <PageHeader
        title="الخصومات"
        description="خصومات مالية لا تُنقص النقاط، لكنها تمنع الترشيح لموظف الشهر. تُصحَّح بقيد معاكس قبل إغلاق الشهر."
        actions={canCreate && form === null ? [{ id: "new", label: "خصم جديد", primary: true, onSelect: () => onFormChange(emptyDeductionForm(today.slice(0, 7))) }] : undefined}
      />

      <div className="flex flex-col gap-4">
        {submitError && form === null && reversing === null ? (
          <Banner kind="danger" title="تعذّر الإجراء">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <FilterBar
          quickFilters={[
            <Combobox key="user" aria-label="الموظف" placeholder="كل الموظفين" options={userOptions} value={filters.userId} onValueChange={(userId) => set({ userId })} clearable />,
            <MonthPicker key="month" aria-label="الشهر" placeholder="كل الأشهر" value={filters.month} onValueChange={(month) => set({ month })} closedMonths={closedMonths} today={today} />,
          ]}
          active={active}
          onClearAll={() => onFiltersChange(noDeductionFilters)}
        />

        <DataTable
          label="الخصومات"
          columns={columns}
          rows={deductions.status === "ready" ? deductions.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={deductions.status === "loading"}
          error={deductions.status === "error" ? { code: deductions.code, onRetry } : undefined}
          empty={empty}
          rowActions={
            canCreate
              ? (row) => {
                  const closed = row.month !== undefined && closedMonths.includes(row.month);
                  const blocked = row.reverses_id ? "قيد معاكس لا يُعكس." : row.reversed_by_id ? "عُكس هذا الخصم من قبل." : closed ? "الشهر مغلق." : null;
                  return [blocked ? { id: "reverse", label: "قيد معاكس", disabled: true, reason: blocked, onSelect: () => {} } : { id: "reverse", label: "قيد معاكس", onSelect: () => onReversingChange(row) }];
                }
              : undefined
          }
        />

        {deductions.status === "ready" ? <Pagination meta={deductions.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>

      <Dialog
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) onFormChange(null);
        }}
        dismissible={!submitting}
        title="خصم جديد"
        description="يُسجَّل الخصم على الموظف في الشهر المختار. لا يُنقص النقاط."
        actions={[
          <Button key="cancel" variant="secondary" disabled={submitting} onClick={() => onFormChange(null)}>
            إلغاء
          </Button>,
          <Button key="save" variant="primary" loading={submitting} disabled={formReason !== null} onClick={onSubmit}>
            تسجيل الخصم
          </Button>,
        ]}
      >
        {form ? (
          <div className="flex flex-col gap-4">
            {submitError ? (
              <Banner kind="danger" title="تعذّر تسجيل الخصم">
                {errorMessage(submitError)}
              </Banner>
            ) : null}
            <Field label="الموظف" required error={errors.user_id}>
              <Combobox aria-label="الموظف" placeholder="اختر الموظف" options={userOptions} value={form.userId} onValueChange={(userId) => onFormChange({ ...form, userId })} />
            </Field>
            <Grid cols={{ base: 1, tablet: 3 }} gap={4}>
              <Field label="المبلغ" required error={errors.amount}>
                <MoneyInput aria-label="المبلغ" value={form.amount} onChange={(event) => onFormChange({ ...form, amount: event.target.value })} />
              </Field>
              <Field label="المصدر" required error={errors.source}>
                <Select aria-label="المصدر" placeholder="اختر المصدر" options={sourceOptions} value={form.source} onValueChange={(source) => onFormChange({ ...form, source })} />
              </Field>
              <Field label="الشهر" required error={errors.month}>
                <MonthPicker aria-label="شهر الخصم" value={form.month} onValueChange={(month) => onFormChange({ ...form, month })} closedMonths={closedMonths} today={today} />
              </Field>
            </Grid>
            <Field label="السبب" required error={errors.reason}>
              <Textarea aria-label="السبب" placeholder="اكتب سبب الخصم" value={form.reason} onChange={(event) => onFormChange({ ...form, reason: event.target.value })} />
            </Field>
            {formReason ? <p className="text-label text-fg-muted">{formReason}</p> : null}
          </div>
        ) : null}
      </Dialog>

      <ReasonDialog
        open={reversing !== null}
        onOpenChange={(open) => {
          if (!open) onReversingChange(null);
        }}
        title="قيد معاكس؟"
        description={reversing ? `يُلغي خصم ${reversing.user?.name ?? ""} (${isolate(formatMoney(reversing.amount ?? "0.00"))}) بقيد جديد يشير إليه. الأصلي يبقى في السجل.` : ""}
        confirmLabel="تسجيل القيد المعاكس"
        reason={reverseReason}
        onReasonChange={onReverseReasonChange}
        error={errors.reason}
        loading={submitting}
        onConfirm={() => onReverse?.()}
      />
    </>
  );
}
