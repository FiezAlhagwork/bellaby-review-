"use client";

import { MapPin } from "@phosphor-icons/react";
import { DateTimeCell, DateTimeStackCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { MapPlaceholder } from "@/components/data/MapPlaceholder";
import { StatusBadge } from "@/components/data/StatusBadge";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { NotFoundState } from "@/components/ui/NotFoundState";
import type { Option } from "@/components/ui/OptionList";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ListEntry, UserRef, Visit, VisitPoint } from "@/lib/api/types";
import { countPhrase, formatDateTime, formatPhone, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { disabledReason, reviewStateLabels } from "../point-labels";

/** حالة نموذج التعديل كما تُرسل إلى `PATCH /visit-points/{id}` (`name`، `type_id`، `specialty_id`، `phone`، `address`). الموقع لا يُعدَّل. */
export type VisitPointForm = {
  name: string;
  typeId: string | null;
  specialtyId: string | null;
  /** الأرقام الوطنية وحدها (9 أرقام): `+963` ثابتة في الحقل. */
  phone: string;
  address: string;
};

/** نموذج التعديل المبدئي من الجهة. */
export const formFromPoint = (point: VisitPoint): VisitPointForm => ({
  name: point.name ?? "",
  typeId: point.type?.id !== undefined ? String(point.type.id) : null,
  specialtyId: point.specialty?.id !== undefined ? String(point.specialty.id) : null,
  phone: (point.phone ?? "").replace(/^\+963/, ""),
  address: point.address ?? "",
});

/** العميل المربوط بالجهة. `GET /visit-points/{id}` يعطي `customer_id` فقط، فالاسم يجلبه الأب من `GET /customers/{id}` (docs/backend-requests.md §53). */
export type LinkedCustomer = { id: number; name: string };

type VisitPointDetailsViewProps = {
  point: Loadable<VisitPoint>;
  /** `GET /visits?visit_point_id=`: الأحدث أولاً. مندوبو الجهة يُستخرجون منها (لا حقل لهم في العقد: §53). */
  visits: Loadable<readonly Visit[]>;
  linkedCustomer: LinkedCustomer | null;
  /** `visit_points.manage`: زر «تعديل البيانات». الجهة المعطّلة لا تُعدَّل ولو كان العلم true. */
  canEdit: boolean;
  types: readonly ListEntry[];
  specialties: readonly ListEntry[];
  /** نموذج التعديل. null = الدرج مغلق. */
  form: VisitPointForm | null;
  onFormChange: (form: VisitPointForm) => void;
  /** `errors` من `validation_failed` كما هي: `{ name: "نص عربي" }`. */
  errors?: Readonly<Record<string, string>>;
  saving?: boolean;
  onEdit?: () => void;
  onCloseForm?: () => void;
  onSave?: () => void;
  onOpenCustomer?: (customer: LinkedCustomer) => void;
  onBack?: () => void;
  onRetry?: () => void;
};

const entryOptions = (entries: readonly ListEntry[]): Option[] => entries.flatMap((entry) => (entry.id !== undefined && entry.name ? [{ value: String(entry.id), label: entry.name }] : []));

/** مندوبو الجهة: من زياراتها، بعدد زيارات كل واحد وآخرها. */
function repsOf(visits: readonly Visit[]): { rep: UserRef; count: number; last: string }[] {
  const byRep = new Map<number, { rep: UserRef; count: number; last: string }>();
  for (const visit of visits) {
    if (!visit.rep?.id) continue;
    const entry = byRep.get(visit.rep.id);
    const startedAt = visit.started_at ?? "";
    if (entry) {
      entry.count += 1;
      if (startedAt > entry.last) entry.last = startedAt;
    } else {
      byRep.set(visit.rep.id, { rep: visit.rep, count: 1, last: startedAt });
    }
  }
  return [...byRep.values()].sort((a, b) => (a.last < b.last ? 1 : -1));
}

/**
 * صفحة الجهة (M15): بياناتها وموقعها على خريطة، وآخر زيارة والإجراء القادم، ومندوبوها وزياراتها، والعميل المربوط.
 * التعديل (الاسم والنوع والاختصاص والهاتف والعنوان، لا الموقع) في درج بـ`visit_points.manage`. المعطّلة (مرفوضة أو مدمجة) للقراءة فقط.
 */
export function VisitPointDetailsView({ point, visits, linkedCustomer, canEdit, types, specialties, form, onFormChange, errors = {}, saving = false, onEdit, onCloseForm, onSave, onOpenCustomer, onBack, onRetry }: VisitPointDetailsViewProps) {
  if (point.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (point.status === "error") {
    return point.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={point.code} onRetry={onRetry} />;
  }

  const data = point.data;
  const reason = disabledReason(data);
  const editable = canEdit && data.status === "ACTIVE";
  const visitList = visits.status === "ready" ? visits.data : [];
  const reps = repsOf(visitList);

  const visitColumns: DataTableColumn<Visit>[] = [
    { key: "rep", header: "المندوب", cell: (row) => <TextCell value={row.rep?.name} />, priority: "high", role: "primary" },
    { key: "started_at", header: "الوقت", cell: (row) => <DateTimeStackCell value={row.started_at} />, width: "w-32", priority: "high" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="visit" status={row.status} /> : <TextCell value={null} />), width: "w-28", role: "status" },
  ];

  const typeOptions = entryOptions(types);
  const specialtyOptions = entryOptions(specialties);
  const formReady = form !== null && form.name.trim() !== "" && form.typeId !== null && form.phone.length === 9;

  return (
    <>
      <PageHeader
        title={data.name ?? "جهة"}
        badge={data.status ? <StatusBadge entity="visitPoint" status={data.status} /> : undefined}
        description={[data.type?.name, data.specialty?.name, data.governorate?.name].filter(Boolean).join(" · ")}
        actions={editable && onEdit ? [{ id: "edit", label: "تعديل البيانات", primary: true, onSelect: onEdit }] : undefined}
      />

      <div className="flex flex-col gap-4">
        {reason === "rejected" ? (
          <Banner kind="warning" title="جهة معطّلة: رفضتها المراقبة">
            لا يزورها المندوبون ولا تُعدَّل بياناتها. يبقى سجل زياراتها السابقة للقراءة.
          </Banner>
        ) : null}
        {reason === "merged" ? (
          <Banner kind="warning" title="جهة معطّلة: دُمجت في جهة أخرى">
            {`دُمجت في الجهة رقم ${isolate(data.merged_into_id ?? 0)}، ومنها تُتابَع زياراتها الجديدة. لا تُعدَّل بياناتها.`}
          </Banner>
        ) : null}

        <Grid cols={{ base: 1, desktop: 2 }} gap={4}>
          <Card title="بيانات الجهة">
            <DescriptionList
              items={[
                { label: "النوع", value: data.type?.name },
                { label: "الاختصاص", value: data.specialty?.name },
                { label: "المحافظة", value: data.governorate?.name },
                { label: "العنوان", value: data.address },
                { label: "الهاتف", value: data.phone ? <span dir="ltr">{formatPhone(data.phone)}</span> : null },
                { label: "أضافها", value: data.created_by?.name },
                { label: "تاريخ الإضافة", value: data.created_at ? formatDateTime(data.created_at) : null },
                { label: "مراجعة المراقبة", value: data.review_state ? reviewStateLabels[data.review_state] : null },
              ]}
            />
          </Card>

          <Card title="الموقع">
            {data.location ? <MapPlaceholder compact points={[{ id: String(data.id), lat: data.location.lat, lng: data.location.lng, kind: "start", label: data.name ?? "الجهة" }]} aria-label="موقع الجهة" /> : null}
            <p className="mt-3 text-label text-fg-muted">الموقع يحدّده المندوب عند إضافة الجهة ولا يُعدَّل من هنا.</p>
          </Card>
        </Grid>

        <Grid cols={{ base: 1, desktop: 2 }} gap={4}>
          <Card title="آخر زيارة والإجراء القادم">
            <DescriptionList
              items={[
                { label: "آخر زيارة", value: data.last_visit_at ? formatDateTime(data.last_visit_at) : "لم تُزَر بعد" },
                { label: "الإجراء المطلوب في الزيارة القادمة", value: data.next_action },
              ]}
            />
          </Card>

          <Card title="العميل المربوط">
            {linkedCustomer ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-body text-fg">{linkedCustomer.name}</span>
                {onOpenCustomer ? (
                  <Button variant="secondary" size="sm" onClick={() => onOpenCustomer(linkedCustomer)}>
                    فتح العميل
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="text-body text-fg-muted">غير مربوطة بعميل: لم تُسجَّل صيدلية عميلاً بعد.</p>
            )}
          </Card>
        </Grid>

        <Card title="مندوبوها">
          {visits.status === "loading" ? (
            <Skeleton className="h-16 w-full" />
          ) : visits.status === "error" ? (
            <ErrorState code={visits.code} onRetry={onRetry} />
          ) : reps.length === 0 ? (
            <p className="text-body text-fg-muted">لم يزرها أي مندوب بعد.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {reps.map(({ rep, count, last }) => (
                <li key={rep.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-body text-fg">{rep.name}</span>
                  <span className="flex items-center gap-1 text-caption text-fg-muted">
                    {countPhrase(count, ["زيارة", "زيارتان", "زيارات"])} · آخرها <DateTimeCell value={last} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="زياراتها">
          <DataTable
            label="زيارات الجهة"
            columns={visitColumns}
            rows={visitList}
            getRowKey={(row) => row.id ?? ""}
            loading={visits.status === "loading"}
            error={visits.status === "error" ? { code: visits.code, onRetry } : undefined}
            empty={<EmptyState icon={MapPin} title="لا زيارات بعد" description="تظهر هنا زيارات المندوبين لهذه الجهة." />}
          />
        </Card>
      </div>

      <Drawer
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) onCloseForm?.();
        }}
        dismissible={!saving}
        title="تعديل بيانات الجهة"
        description="الاسم والنوع والاختصاص والهاتف والعنوان. الموقع لا يُعدَّل."
        actions={[
          <Button key="cancel" variant="secondary" disabled={saving} onClick={onCloseForm}>
            إلغاء
          </Button>,
          <Button key="save" variant="primary" loading={saving} disabled={!formReady} onClick={onSave}>
            حفظ التعديل
          </Button>,
        ]}
      >
        {form ? (
          <div className="flex flex-col gap-4">
            <Field label="اسم الجهة" required error={errors.name}>
              <Input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} />
            </Field>
            <Field label="النوع" required error={errors.type_id}>
              <Select aria-label="النوع" placeholder="اختر النوع" options={typeOptions} value={form.typeId} onValueChange={(typeId) => onFormChange({ ...form, typeId })} />
            </Field>
            <Field label="الاختصاص" optional error={errors.specialty_id}>
              <Select aria-label="الاختصاص" placeholder="بلا اختصاص" options={specialtyOptions} value={form.specialtyId} onValueChange={(specialtyId) => onFormChange({ ...form, specialtyId })} />
            </Field>
            <Field label="الهاتف" required error={errors.phone}>
              <PhoneInput value={form.phone} onChange={(event) => onFormChange({ ...form, phone: event.target.value.replace(/\D/g, "").slice(0, 9) })} />
            </Field>
            <Field label="العنوان" optional error={errors.address}>
              <Input value={form.address} onChange={(event) => onFormChange({ ...form, address: event.target.value })} />
            </Field>
            {!formReady ? <p className="text-label text-fg-muted">أكمل الاسم والنوع والهاتف (تسعة أرقام) ليُفعَّل «حفظ التعديل».</p> : null}
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
