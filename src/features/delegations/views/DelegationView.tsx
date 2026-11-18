"use client";

import { Handshake } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { errorMessage } from "@/lib/api/error-messages";
import type { Delegation, UserRef } from "@/lib/api/types";
import { dayLabel, fullDayLabel, type IsoDate } from "@/lib/calendar";
import { formatDateTime } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

export type DelegationPage = { data: readonly Delegation[]; meta: PaginationMeta };

/** نافذة «تفويض جديد»: `POST /delegations { delegate_id, from, to }`. */
export type DelegationForm = { delegateId: string | null; range: DateRange };

type DelegationViewProps = {
  /** `GET /delegations`، الأحدث أولاً. التفويض الحالي `is_current`. */
  delegations: Loadable<DelegationPage>;
  /** `delegations.manage`. */
  canManage: boolean;
  /** من يجوز تفويضه (لا endpoint في العقد: docs/backend-requests.md §72). */
  candidates: readonly UserRef[];
  today: IsoDate;
  form: DelegationForm | null;
  onFormChange: (form: DelegationForm | null) => void;
  onSubmit?: () => void;
  /** `errors` من `validation_failed` (`delegate_id`، `from`، `to`). */
  formErrors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل: 409 `delegation_overlap`. */
  formError?: string;
  confirmingEnd: boolean;
  onConfirmingEndChange: (open: boolean) => void;
  /** `POST /delegations/{id}/end`. */
  onEnd?: () => void;
  submitting?: boolean;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
};

// نطاق التفويض من القرار 13 وملاحظات SCREENS.md: الاعتمادات التشغيلية وحدها. نص ثابت حتى يُرجعه الخادم (§72).
const covers = ["قرارات «بانتظار قراري» التشغيلية: اعتماد الجرد، وقرارات المرتجع والتالف، والتقارير الدورية.", "طلبات الإجازة، عدا إجازة رئيس القسم.", "كل قرار يُسجَّل «بالتفويض عن المدير التنفيذي»."];
const excludes = ["ما يخصّ المفوَّض نفسه (طلبه أو تقريره أو إجازته).", "ملف التحقيق، والميزانية، وموظف الشهر، وقرار النزاع.", "الإعدادات، وتفويض شخص آخر."];

const rangeLabel = (row: Delegation) => (row.from && row.to ? `${dayLabel(row.from)} ← ${dayLabel(row.to)}` : null);

/**
 * التفويض (E18): التفويض الحالي مع «إنهاء التفويض»، ونطاقه، والسجل. «تفويض جديد» لشخص واحد بين تاريخين (القرار 13).
 * التداخل مع تفويض آخر يرجع 409 `delegation_overlap`.
 */
export function DelegationView({
  delegations,
  canManage,
  candidates,
  today,
  form,
  onFormChange,
  onSubmit,
  formErrors = {},
  formError,
  confirmingEnd,
  onConfirmingEndChange,
  onEnd,
  submitting = false,
  onPageChange,
  onRetry,
}: DelegationViewProps) {
  const rows = delegations.status === "ready" ? delegations.data.data : [];
  const current = rows.find((row) => row.is_current) ?? null;

  const columns: DataTableColumn<Delegation>[] = [
    { key: "delegate", header: "المفوَّض", cell: (row) => <TextCell value={row.delegate?.name} />, priority: "high", role: "primary" },
    { key: "range", header: "الفترة", cell: (row) => <TextCell value={rangeLabel(row)} />, priority: "high" },
    {
      key: "state",
      header: "الحالة",
      cell: (row) => (row.is_current ? <Badge color="success">ساري</Badge> : row.ended_at ? <Badge color="warning">أُنهي مبكراً</Badge> : (row.from ?? "") > today ? <Badge color="info">قادم</Badge> : <Badge color="neutral">انتهى</Badge>),
      width: "w-32",
      priority: "high",
      role: "status",
    },
    { key: "ended_at", header: "أُنهي في", cell: (row) => <TextCell value={row.ended_at ? formatDateTime(row.ended_at) : null} />, width: "w-44" },
  ];

  const formReason = form === null ? null : form.delegateId === null ? "اختر الشخص." : form.range.from === null || form.range.to === null ? "اختر الفترة: من وإلى." : null;

  return (
    <>
      <PageHeader
        title="التفويض"
        description="تفويض مؤقت لشخص واحد بالاعتمادات التشغيلية خلال غيابك. ينتهي تلقائياً في آخر يوم، ويمكن إنهاؤه مبكراً."
        actions={canManage ? [{ id: "new", label: "تفويض جديد", primary: true, onSelect: () => onFormChange({ delegateId: null, range: { from: null, to: null } }) }] : []}
      />

      <div className="flex flex-col gap-4">
        <Grid cols={{ base: 1, desktop: 2 }} gap={4}>
          <Card title="التفويض الحالي" action={current ? <Badge color="success">ساري</Badge> : undefined}>
            {delegations.status === "loading" ? (
              <Skeleton className="h-24 w-full" />
            ) : current ? (
              <div className="flex flex-col gap-4">
                <DescriptionList
                  items={[
                    { label: "المفوَّض", value: current.delegate?.name },
                    { label: "من", value: current.from ? fullDayLabel(current.from) : null },
                    { label: "إلى", value: current.to ? fullDayLabel(current.to) : null },
                    { label: "أنشأه", value: current.created_by?.name },
                  ]}
                />
                {canManage ? (
                  <div>
                    <Button variant="danger" onClick={() => onConfirmingEndChange(true)}>
                      إنهاء التفويض
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState icon={Handshake} title="لا تفويض حالي" description="القرارات كلها تصل إليك. أنشئ تفويضاً قبل غيابك." />
            )}
          </Card>

          <Card title="نطاق التفويض">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-label text-fg-muted">يشمل</p>
                <ul className="flex list-disc flex-col gap-1 ps-5 text-body text-fg">
                  {covers.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-label text-fg-muted">لا يشمل</p>
                <ul className="flex list-disc flex-col gap-1 ps-5 text-body text-fg">
                  {excludes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </Grid>

        <Section title="السجل">
          <DataTable
            label="سجل التفويضات"
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id ?? ""}
            loading={delegations.status === "loading"}
            error={delegations.status === "error" ? { code: delegations.code, onRetry } : undefined}
            empty={<EmptyState icon={Handshake} title="لا تفويضات سابقة" description="تظهر هنا كل التفويضات بعد إنشائها." />}
          />
          {delegations.status === "ready" && rows.length > 0 ? <Pagination meta={delegations.data.meta} onPageChange={onPageChange} /> : null}
        </Section>
      </div>

      <Dialog
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) onFormChange(null);
        }}
        dismissible={!submitting}
        size="sm"
        title="تفويض جديد"
        description="شخص واحد لفترة محدّدة. يرى المفوَّض «بانتظار قراري» ويقرّر بالتفويض عنك."
        actions={[
          <Button key="cancel" variant="secondary" disabled={submitting} onClick={() => onFormChange(null)}>
            إلغاء
          </Button>,
          <Button key="save" variant="primary" loading={submitting} disabled={formReason !== null} onClick={onSubmit}>
            تفويض
          </Button>,
        ]}
      >
        {form ? (
          <div className="flex flex-col gap-4">
            {formError ? (
              <Banner kind="danger" title="تفويض متداخل">
                {errorMessage(formError)}
              </Banner>
            ) : null}
            <Field label="الشخص" required error={formErrors.delegate_id}>
              <Combobox
                aria-label="الشخص"
                placeholder="ابحث بالاسم"
                options={candidates.map((user) => ({ value: String(user.id), label: user.name ?? "" }))}
                value={form.delegateId}
                onValueChange={(delegateId) => onFormChange({ ...form, delegateId })}
              />
            </Field>
            <Field label="الفترة" required error={formErrors.from ?? formErrors.to} hint="من اليوم فصاعداً. ينتهي في آخر يوم تلقائياً.">
              <DateRangePicker aria-label="الفترة" value={form.range} onValueChange={(range) => onFormChange({ ...form, range })} min={today} today={today} />
            </Field>
            {formReason ? <p className="text-label text-fg-muted">{formReason}</p> : null}
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={confirmingEnd}
        onOpenChange={onConfirmingEndChange}
        title="إنهاء التفويض؟"
        description={current ? `يتوقف تفويض ${current.delegate?.name ?? ""} الآن، وتعود القرارات إليك. ما قرّره قبل الإنهاء يبقى.` : ""}
        confirmLabel="إنهاء التفويض"
        danger
        loading={submitting}
        onConfirm={() => onEnd?.()}
      />
    </>
  );
}
