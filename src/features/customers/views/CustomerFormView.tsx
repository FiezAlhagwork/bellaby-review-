"use client";

import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { Option } from "@/components/ui/OptionList";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { RadioCard, RadioGroup } from "@/components/ui/Radio";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { Governorate } from "@/lib/api/types";
import { isolate } from "@/lib/format";

/** اقتراح من `GET /customers/link-suggestions`. */
export type LinkSuggestion = { visit_point_id?: number; name?: string; address?: string | null; similarity?: number };

/**
 * حالة النموذج. `phone` الأرقام الوطنية التسعة (يحوّلها الأب إلى E.164). `link`: «same» يرسل `link_visit_point_id` للاقتراح الأول،
 * و«new» يرسله null، وnull لم يُجب بعد.
 */
export type CustomerForm = { name: string; phone: string; address: string; governorateId: string | null; link: "same" | "new" | null };
export const emptyCustomerForm: CustomerForm = { name: "", phone: "", address: "", governorateId: null, link: null };

const NAME_MAX = 150;

type CustomerFormViewProps = {
  form: CustomerForm;
  onFormChange: (form: CustomerForm) => void;
  /** محافظاتي (العميل ضمنها). */
  governorates: readonly Governorate[];
  /** اقتراحات الربط للاسم والمحافظة الحاليين. فارغة = لا تشابه. */
  suggestions: readonly LinkSuggestion[];
  onSubmit?: () => void;
  onCancel?: () => void;
  submitting?: boolean;
  /** `validation_failed` بأسماء `CustomerInput`. */
  errors?: Readonly<Record<string, string>>;
  submitError?: string;
};

/**
 * عميل جديد (A06): الاسم والهاتف والعنوان والمحافظة (ضمن محافظاتي). إن شابه الاسم صيدلية في جهات الزيارة بالمحافظة نفسها
 * يُعرض الاقتراح: «هي نفسها» تربطه بها فيصيران سجلاً واحداً، أو «لا، عميل جديد» (القرار 7). بعد الحفظ: التسليم الأول (A08).
 */
export function CustomerFormView({ form, onFormChange, governorates, suggestions, onSubmit, onCancel, submitting = false, errors = {}, submitError }: CustomerFormViewProps) {
  const set = (patch: Partial<CustomerForm>) => onFormChange({ ...form, ...patch });
  const governorateOptions: Option[] = governorates.flatMap((governorate) => (governorate.id !== undefined && governorate.name ? [{ value: String(governorate.id), label: governorate.name }] : []));
  const suggestion = suggestions[0] ?? null;
  const awaitingLink = suggestion !== null && form.link === null;

  return (
    <>
      <PageHeader title="عميل جديد" description="صيدلية تسلّمها ضمن محافظاتك. بعد الحفظ تسجّل أول تسليم لها." />

      <div className="flex flex-col gap-4">
        {submitError ? (
          <Banner kind="danger" title="تعذّر حفظ العميل">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Card title="العميل">
          <div className="flex flex-col gap-4">
            <Field label="الاسم" required error={errors.name} hint={`حتى ${isolate(NAME_MAX)} حرف.`}>
              <Input value={form.name} maxLength={NAME_MAX} onChange={(event) => set({ name: event.target.value, link: null })} placeholder="صيدلية الشفاء" invalid={Boolean(errors.name)} disabled={submitting} />
            </Field>
            <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
              <Field label="الهاتف" required error={errors.phone}>
                <PhoneInput value={form.phone} onChange={(event) => set({ phone: event.target.value })} invalid={Boolean(errors.phone)} disabled={submitting} />
              </Field>
              <Field label="المحافظة" required error={errors.governorate_id}>
                <Select aria-label="المحافظة" options={governorateOptions} value={form.governorateId} onValueChange={(governorateId) => set({ governorateId, link: null })} invalid={Boolean(errors.governorate_id)} disabled={submitting} />
              </Field>
            </Grid>
            <Field label="العنوان" required error={errors.address}>
              <Textarea value={form.address} onChange={(event) => set({ address: event.target.value })} placeholder="المنطقة والشارع وعلامة قريبة" invalid={Boolean(errors.address)} disabled={submitting} />
            </Field>
          </div>
        </Card>

        {suggestion ? (
          <Card title="صيدلية مشابهة في جهات الزيارة">
            <div className="flex flex-col gap-4">
              <p className="text-body text-fg">
                {`«${suggestion.name ?? ""}»${suggestion.address ? ` · ${suggestion.address}` : ""}. يزورها مندوبو المكتب العلمي. إن كانت الصيدلية نفسها تُربط بها فيصير لها سجل واحد.`}
              </p>
              <RadioGroup aria-label="هل هي الصيدلية نفسها؟" value={form.link} onValueChange={(link) => set({ link })} invalid={Boolean(errors.link_visit_point_id)} disabled={submitting}>
                <RadioCard value="same" title="هي نفسها" description="تُربط بجهة الزيارة: سجل واحد للتسليمات والزيارات." />
                <RadioCard value="new" title="لا، عميل جديد" description="صيدلية أخرى بالاسم نفسه أو اسم قريب." />
              </RadioGroup>
              {errors.link_visit_point_id ? <p className="text-label text-danger">{errors.link_visit_point_id}</p> : null}
            </div>
          </Card>
        ) : null}

        {suggestion && form.link === "same" ? (
          <Banner kind="success" title="ستُربط بجهة الزيارة">
            {`«${form.name || suggestion.name || ""}» و«${suggestion.name ?? ""}» سجل واحد بعد الحفظ.`}
          </Banner>
        ) : null}

        <div className="flex flex-col gap-2">
          {awaitingLink ? <p className="text-label text-fg-muted">أجب عن الصيدلية المشابهة أولاً.</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" loading={submitting} disabled={awaitingLink} onClick={onSubmit}>
              حفظ ومتابعة للتسليم
            </Button>
            <Button variant="secondary" disabled={submitting} onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
