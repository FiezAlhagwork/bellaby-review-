"use client";

import { CalendarBlank } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { errorMessage } from "@/lib/api/error-messages";
import type { Holiday } from "@/lib/api/types";
import { fullDayLabel, type IsoDate } from "@/lib/calendar";
import type { Loadable } from "@/lib/loadable";
import { SettingsTabs, type SettingsSection } from "../components/SettingsTabs";

/** نافذة العطلة: `POST /holidays { date, name }`. */
export type HolidayForm = { date: IsoDate | null; name: string };

type HolidaysViewProps = {
  year: string;
  years: readonly string[];
  onYearChange: (year: string) => void;
  /** `GET /holidays?year`، مرتّبة بالتاريخ. */
  holidays: Loadable<readonly Holiday[]>;
  /** `holidays.manage`. */
  canManage: boolean;
  today: IsoDate;
  form: HolidayForm | null;
  onFormChange: (form: HolidayForm | null) => void;
  onSubmit?: () => void;
  /** `errors` من `validation_failed` (`date`، `name`). */
  formErrors?: Readonly<Record<string, string>>;
  /** العطلة التي يُسأل عن حذفها. */
  deleting: Holiday | null;
  onDeletingChange: (holiday: Holiday | null) => void;
  onDelete?: () => void;
  /** رمز خطأ الحذف (409 يوم مضى؛ اسم الرمز غير محدّد في العقد). */
  actionError?: string;
  onDismissError?: () => void;
  submitting?: boolean;
  onSectionChange?: (section: SettingsSection) => void;
  onRetry?: () => void;
};

const PAST_REASON = "مضى يومها: تبقى في السجل لأن الدوام حُسب بها.";

/**
 * العطل الرسمية (E15): عطل السنة بتاريخها واسمها. «إضافة عطلة» فور إعلانها بتاريخ من اليوم فصاعداً (الجمعة عطلة ثابتة لا تُضاف).
 * «حذف» للعطلة التي لم يأتِ يومها فقط؛ الماضية واليوم بلا حذف ومعها السبب.
 */
export function HolidaysView({
  year,
  years,
  onYearChange,
  holidays,
  canManage,
  today,
  form,
  onFormChange,
  onSubmit,
  formErrors = {},
  deleting,
  onDeletingChange,
  onDelete,
  actionError,
  onDismissError,
  submitting = false,
  onSectionChange,
  onRetry,
}: HolidaysViewProps) {
  const upcoming = (holiday: Holiday) => (holiday.date ?? "") > today;

  const columns: DataTableColumn<Holiday>[] = [
    { key: "date", header: "اليوم", cell: (row) => <TextCell value={row.date ? fullDayLabel(row.date) : null} />, width: "w-56", priority: "high" },
    { key: "name", header: "العطلة", cell: (row) => <TextCell value={row.name} />, priority: "high", role: "primary" },
    {
      key: "state",
      header: "الحالة",
      cell: (row) => (row.date === today ? <Badge color="info">اليوم</Badge> : upcoming(row) ? <Badge color="success">قادمة</Badge> : <Badge color="neutral">مضت</Badge>),
      width: "w-28",
      priority: "high",
      role: "status",
    },
    { key: "created_by", header: "أضافها", cell: (row) => <TextCell value={row.created_by?.name} />, width: "w-40" },
  ];

  const formReason = form === null ? null : form.date === null ? "اختر اليوم." : form.name.trim() === "" ? "اكتب اسم العطلة." : null;

  return (
    <>
      <PageHeader
        title="الإعدادات"
        description="العطل الرسمية لا يُحسب فيها دوام ولا تُطلب فيها زيارات. الجمعة عطلة ثابتة ولا تُضاف هنا."
        actions={canManage ? [{ id: "new", label: "إضافة عطلة", primary: true, onSelect: () => onFormChange({ date: null, name: "" }) }] : []}
      />

      <div className="flex flex-col gap-4">
        <SettingsTabs active="holidays" onSelect={onSectionChange} />

        <div className="w-full max-w-48">
          <Field label="السنة">
            <Select aria-label="السنة" options={years.map((value) => ({ value, label: value }))} value={year} onValueChange={onYearChange} />
          </Field>
        </div>

        {actionError ? (
          <Banner kind="danger" title="تعذّر حذف العطلة" onClose={onDismissError}>
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        <DataTable
          label="العطل الرسمية"
          columns={columns}
          rows={holidays.status === "ready" ? holidays.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={holidays.status === "loading"}
          error={holidays.status === "error" ? { code: holidays.code, onRetry } : undefined}
          empty={<EmptyState icon={CalendarBlank} title={`لا عطل في ${year}`} description="أضف العطلة فور إعلانها." />}
          rowActions={
            canManage
              ? (row) => [
                  upcoming(row)
                    ? { id: "delete", label: "حذف", danger: true, onSelect: () => onDeletingChange(row) }
                    : { id: "delete", label: "حذف", danger: true, disabled: true, reason: row.date === today ? "يومها اليوم: لا تُحذف." : PAST_REASON, onSelect: () => {} },
                ]
              : undefined
          }
        />
      </div>

      <Dialog
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) onFormChange(null);
        }}
        dismissible={!submitting}
        size="sm"
        title="إضافة عطلة"
        description="تسري فوراً: لا يُحسب فيها دوام. لا تُضاف بتاريخ مضى."
        actions={[
          <Button key="cancel" variant="secondary" disabled={submitting} onClick={() => onFormChange(null)}>
            إلغاء
          </Button>,
          <Button key="save" variant="primary" loading={submitting} disabled={formReason !== null} onClick={onSubmit}>
            إضافة العطلة
          </Button>,
        ]}
      >
        {form ? (
          <div className="flex flex-col gap-4">
            <Field label="اليوم" required error={formErrors.date} hint="اليوم أو بعده. العطلة بأكثر من يوم تُضاف يوماً يوماً.">
              <DatePicker aria-label="اليوم" value={form.date} onValueChange={(date) => onFormChange({ ...form, date })} min={today} today={today} />
            </Field>
            <Field label="اسم العطلة" required error={formErrors.name}>
              <Input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} placeholder="مثل: عيد الأضحى" />
            </Field>
            {formReason ? <p className="text-label text-fg-muted">{formReason}</p> : null}
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) onDeletingChange(null);
        }}
        title="حذف العطلة؟"
        description={deleting ? `«${deleting.name ?? ""}» ${deleting.date ? fullDayLabel(deleting.date) : ""}. يعود يوم دوام عادياً.` : ""}
        confirmLabel="حذف العطلة"
        danger
        loading={submitting}
        onConfirm={() => onDelete?.()}
      />
    </>
  );
}
