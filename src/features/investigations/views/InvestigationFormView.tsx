"use client";

import { ConfidentialBanner } from "@/components/data/ConfidentialBanner";
import { DescriptionList } from "@/components/data/DescriptionList";
import { flagRefLabels, flagTypeLabels } from "@/components/data/flag-types";
import { StatusBadge } from "@/components/data/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { Option } from "@/components/ui/OptionList";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { Flag, UserRef } from "@/lib/api/types";
import { formatDateTime, isolate } from "@/lib/format";

/** حالة النموذج كما تُرسل إلى `POST /investigations` (`subject_user_id` و`title` و`description`). */
export type InvestigationForm = { subjectId: string | null; title: string; description: string };

export const emptyInvestigationForm: InvestigationForm = { subjectId: null, title: "", description: "" };

/** العلامة التي يُفتح منها الملف (`opened_from_flag_id`): نوعها وصاحبها وسجلها. تأتي من `GET /qa-flags` (§37.3). */
export type SourceFlag = Pick<Flag, "id" | "type" | "status" | "subject_user" | "ref_type" | "ref_id" | "created_at">;

type InvestigationFormViewProps = {
  form: InvestigationForm;
  onFormChange: (form: InvestigationForm) => void;
  /** الموظفون المتاحون (§37.4). */
  employees: readonly UserRef[];
  /** مع علامة: يُقفل الموظف على صاحبها ويُنقل `opened_from_flag_id`. */
  sourceFlag?: SourceFlag | null;
  /** `errors` من `validation_failed` كما هي: `{ title: "نص عربي" }`. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ آخر (forbidden وغيره) بلا حقل. */
  submitError?: string;
  submitting?: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
};

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 2000;

/**
 * فتح ملف تحقيق (S14): الموظف والعنوان والوصف، مباشرةً أو من علامة (فيُقفل الموظف على صاحبها وتظهر العلامة المصدر). «فتح الملف» ينشئ ملفاً في المرحلة الأولى.
 * ملف سري: الشريط في الأعلى. الحقول الإلزامية الموظف والعنوان (العقد).
 */
export function InvestigationFormView({ form, onFormChange, employees, sourceFlag = null, errors = {}, submitError, submitting = false, onSubmit, onCancel }: InvestigationFormViewProps) {
  const set = (patch: Partial<InvestigationForm>) => onFormChange({ ...form, ...patch });
  const employeeOptions: Option[] = employees.flatMap((employee) => (employee.id !== undefined && employee.name ? [{ value: String(employee.id), label: employee.name }] : []));
  const ready = form.subjectId !== null && form.title.trim() !== "";
  const reason = form.subjectId === null ? "اختر الموظف لتفعيل «فتح الملف»." : form.title.trim() === "" ? "اكتب عنوان الملف لتفعيل «فتح الملف»." : null;

  return (
    <>
      <PageHeader title="فتح ملف تحقيق" description={sourceFlag ? "ملف يُفتح من علامة: الموظف هو صاحبها." : "ملف يُفتح مباشرة على موظف."} />

      <div className="flex flex-col gap-4">
        <ConfidentialBanner />

        {submitError ? (
          <Banner kind="danger" title="تعذّر فتح الملف">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        {sourceFlag ? (
          <Card title="العلامة المصدر">
            <DescriptionList
              items={[
                { label: "النوع", value: sourceFlag.type ? flagTypeLabels[sourceFlag.type] : null },
                { label: "الشخص", value: sourceFlag.subject_user?.name },
                { label: "السجل المرتبط", value: sourceFlag.ref_type ? `${flagRefLabels[sourceFlag.ref_type]} ${isolate(`#${sourceFlag.ref_id}`)}` : null },
                { label: "أُنشئت", value: sourceFlag.created_at ? formatDateTime(sourceFlag.created_at) : null },
                { label: "الحالة", value: sourceFlag.status ? <StatusBadge entity="flag" status={sourceFlag.status} /> : null },
              ]}
            />
          </Card>
        ) : null}

        <Card title="بيانات الملف">
          <div className="flex flex-col gap-6">
            <Field label="الموظف" required error={errors.subject_user_id} hint={sourceFlag ? "مقفل: صاحب العلامة المصدر." : undefined}>
              <Combobox
                aria-label="الموظف"
                placeholder="اختر الموظف"
                options={employeeOptions}
                value={form.subjectId}
                onValueChange={(subjectId) => set({ subjectId })}
                locked={sourceFlag !== null}
                disabled={submitting}
              />
            </Field>
            <Field label="العنوان" required error={errors.title}>
              <Input aria-label="عنوان الملف" maxLength={TITLE_MAX} value={form.title} onChange={(event) => set({ title: event.target.value })} disabled={submitting} />
            </Field>
            <Field label="الوصف" optional hint={`ما تعرفه عن الواقعة. حتى ${isolate(DESCRIPTION_MAX)} حرفاً.`} error={errors.description}>
              <Textarea aria-label="وصف الملف" maxLength={DESCRIPTION_MAX} value={form.description} onChange={(event) => set({ description: event.target.value })} disabled={submitting} />
            </Field>
          </div>
        </Card>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="lg" loading={submitting} disabled={!ready} onClick={onSubmit}>
              فتح الملف
            </Button>
            <Button variant="secondary" size="lg" disabled={submitting} onClick={onCancel}>
              إلغاء
            </Button>
          </div>
          {reason ? <p className="text-label text-fg-muted">{reason}</p> : null}
        </div>
      </div>
    </>
  );
}
