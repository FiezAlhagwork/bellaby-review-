"use client";

import { MapPinArea } from "@phosphor-icons/react";
import { DescriptionList } from "@/components/data/DescriptionList";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { Field } from "@/components/ui/Field";
import type { Option } from "@/components/ui/OptionList";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { GeoPoint, ListEntry, ManagerVisit } from "@/lib/api/types";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatDateTime, isolate } from "@/lib/format";

/** جهة الزيارة المختارة: عميل (`customer_id`) أو جهة من جهات الزيارة لم تصر عميلاً (`visit_point_id`). واحدة منهما إلزامية في العقد. */
export type VisitTarget = { key: string; kind: "customer" | "visit-point"; id: number; name: string };

export type ManagerVisitForm = { targetKey: string | null; purposeId: string | null; outcomeId: string | null; notes: string };

export const emptyManagerVisitForm: ManagerVisitForm = { targetKey: null, purposeId: null, outcomeId: null, notes: "" };

/**
 * حالة موقع المتصفح كما تلتقطها الحاوية من `navigator.geolocation` (الـ view لا يستدعيه): `idle` لم يُطلب بعد · `locating` ينتظر إذن المتصفح ·
 * `denied` رُفض الإذن أو تعذّر · `ready` التُقط الموقع بدقته. لا زيارة بلا موقع (العقد): «فعّل الموقع».
 */
export type ManagerVisitLocation = { status: "idle" } | { status: "locating" } | { status: "denied" } | { status: "ready"; point: GeoPoint };

type NewManagerVisitViewProps = {
  /** الجهات المتاحة للبحث: العملاء (`GET /customers?q=`) وجهات الزيارة التي لم تصر عملاء (`GET /visit-points`: §48.1). */
  targets: readonly VisitTarget[];
  onTargetQueryChange?: (query: string) => void;
  /** قائمتا الهدف والنتيجة من `GET /lists` (مفتاحاهما غير معروفين: §48.2). */
  purposes: readonly ListEntry[];
  outcomes: readonly ListEntry[];
  form: ManagerVisitForm;
  onFormChange: (form: ManagerVisitForm) => void;
  location: ManagerVisitLocation;
  onRequestLocation?: () => void;
  /** `errors` من `validation_failed` كما هي. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل (forbidden…): شريط. */
  submitError?: string;
  submitting?: boolean;
  /** بعد الحفظ (201): ملخص الزيارة بدل النموذج. */
  saved?: ManagerVisit | null;
  onSubmit?: () => void;
  onNewVisit?: () => void;
  onOpenVisits?: () => void;
};

const NOTES_MAX = 2000;

const activeOptions = (list: readonly ListEntry[]): Option[] =>
  [...list]
    .filter((entry) => entry.is_active !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .flatMap((entry) => (entry.id !== undefined && entry.name ? [{ value: String(entry.id), label: entry.name }] : []));

/**
 * زيارة جديدة (M09، موبايل): زيارة مدير المبيعات لعميل أو لصيدلية من جهات الزيارة لم تصر عميلاً، بهدف ونتيجة وملاحظات وموقع المتصفح.
 * لا تُحفظ زيارة بلا موقع: يُطلب إذن الموقع، وإن رُفض ظهر «فعّل الموقع». الوقت وقت الخادم، والزيارة لا تضيف عميلاً (القرار 12).
 */
export function NewManagerVisitView({ targets, onTargetQueryChange, purposes, outcomes, form, onFormChange, location, onRequestLocation, errors = {}, submitError, submitting = false, saved = null, onSubmit, onNewVisit, onOpenVisits }: NewManagerVisitViewProps) {
  const header = <PageHeader title="زيارة جديدة" description="سجّل زيارتك لعميل أو لصيدلية. لا تُحفظ الزيارة بلا موقعك." />;

  if (saved) {
    return (
      <>
        {header}
        <div className="flex flex-col gap-4">
          <Banner kind="success" title="سُجّلت الزيارة">
            {`زيارة ${saved.target_name ?? ""} بوقت الخادم${saved.visited_at ? ` ${formatDateTime(saved.visited_at)}` : ""}.`}
          </Banner>
          <Card title="ما سُجّل">
            <DescriptionList
              items={[
                { label: "الجهة", value: saved.target_name },
                { label: "الهدف", value: saved.purpose?.name },
                { label: "النتيجة", value: saved.outcome?.name },
                { label: "الملاحظات", value: saved.notes },
                { label: "الدقة", value: saved.location?.accuracy_m !== undefined ? `${isolate(Math.round(saved.location.accuracy_m))} متراً` : null },
              ]}
            />
          </Card>
          <CaptureRow className="flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" className="flex-1 @tablet:flex-none" onClick={onNewVisit}>
              زيارة أخرى
            </Button>
            <Button variant="secondary" size="lg" className="flex-1 @tablet:flex-none" onClick={onOpenVisits}>
              زياراتي
            </Button>
          </CaptureRow>
        </div>
      </>
    );
  }

  const targetOptions: Option[] = targets.map((target) => ({ value: target.key, label: target.name }));
  const chosen = targets.find((target) => target.key === form.targetKey);
  const set = (patch: Partial<ManagerVisitForm>) => onFormChange({ ...form, ...patch });

  const disabledReason =
    form.targetKey === null ? "اختر الجهة التي زرتها." : form.purposeId === null ? "اختر هدف الزيارة." : location.status !== "ready" ? "فعّل الموقع وحدّده ليُحفظ تسجيل الزيارة." : null;

  return (
    <>
      {header}

      <div className="flex flex-col gap-4">
        {submitError ? (
          <Banner kind="danger" title="تعذّر حفظ الزيارة">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Card title="الجهة">
          <Field label="الجهة المزورة" required error={errors.customer_id ?? errors.visit_point_id} hint="عميل، أو صيدلية من جهات الزيارة لم تصر عميلاً.">
            <Combobox aria-label="الجهة المزورة" placeholder="ابحث باسم العميل أو الصيدلية" options={targetOptions} value={form.targetKey} onValueChange={(targetKey) => set({ targetKey })} onQueryChange={onTargetQueryChange} />
          </Field>
          {chosen ? <span className="flex"><Badge color={chosen.kind === "customer" ? "success" : "neutral"}>{chosen.kind === "customer" ? "عميل" : "جهة زيارة (ليست عميلاً)"}</Badge></span> : null}
        </Card>

        <Card title="الزيارة">
          <Field label="الهدف" required error={errors.purpose_id}>
            <Select aria-label="الهدف" placeholder="اختر هدف الزيارة" options={activeOptions(purposes)} value={form.purposeId} onValueChange={(purposeId) => set({ purposeId })} />
          </Field>
          <Field label="النتيجة" optional error={errors.outcome_id}>
            <Select aria-label="النتيجة" placeholder="اختر النتيجة" options={activeOptions(outcomes)} value={form.outcomeId} onValueChange={(outcomeId) => set({ outcomeId })} />
          </Field>
          <Field label="ملاحظات" optional hint={`حتى ${isolate(NOTES_MAX)} حرفاً.`} error={errors.notes}>
            <Textarea aria-label="ملاحظات" maxLength={NOTES_MAX} value={form.notes} onChange={(event) => set({ notes: event.target.value })} />
          </Field>
        </Card>

        <Card title="الموقع">
          {location.status === "idle" ? (
            <div className="flex flex-col gap-3">
              <p className="text-body text-fg-muted">يلتقط المتصفح موقعك لحظة الحفظ. اسمح له بالوصول حين يطلب ذلك.</p>
              <Button variant="secondary" icon={MapPinArea} onClick={onRequestLocation}>
                تحديد موقعي
              </Button>
            </div>
          ) : null}
          {location.status === "locating" ? (
            <CaptureRow className="items-center gap-3 text-body text-fg-muted">
              <Spinner label="جارٍ تحديد الموقع" />
              <span>جارٍ تحديد موقعك. اسمح للمتصفح بالوصول إلى الموقع إن طلب ذلك.</span>
            </CaptureRow>
          ) : null}
          {location.status === "denied" ? (
            <div className="flex flex-col gap-3">
              <Banner kind="warning" title="فعّل الموقع">
                رُفض الوصول إلى موقعك. فعّل الموقع من إعدادات المتصفح ثم أعد المحاولة، فلا تُحفظ زيارة بلا موقع.
              </Banner>
              <Button variant="secondary" icon={MapPinArea} onClick={onRequestLocation}>
                إعادة المحاولة
              </Button>
            </div>
          ) : null}
          {location.status === "ready" ? (
            <div className="flex flex-col gap-2">
              <Badge color="success">تم تحديد موقعك</Badge>
              <p className="text-body text-fg-muted">
                {`الدقة نحو ${isolate(Math.round(location.point.accuracy_m))} متراً · `}
                <span dir="ltr" className="tabular-nums">{`${location.point.lat.toFixed(4)}, ${location.point.lng.toFixed(4)}`}</span>
              </p>
            </div>
          ) : null}
        </Card>

        <div className="flex flex-col gap-2">
          <Button variant="primary" size="lg" loading={submitting} disabled={disabledReason !== null} className="w-full @tablet:w-auto" onClick={onSubmit}>
            حفظ الزيارة
          </Button>
          {disabledReason ? <p className="text-label text-fg-muted">{disabledReason}</p> : null}
          <p className="text-caption text-fg-muted">الزيارة لا تضيف عميلاً جديداً: العملاء يضيفهم الوكلاء.</p>
        </div>
      </div>
    </>
  );
}
