"use client";

import { itemTypeLabels } from "@/components/data/item-types";
import { portfolioLabels, portfolioOrder } from "@/components/data/portfolio";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { FileUpload, type FileRejection, type UploadFile } from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import type { Option } from "@/components/ui/OptionList";
import { RadioCard, RadioGroup } from "@/components/ui/Radio";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { ItemType, Portfolio } from "@/lib/api/types";

/** حالة النموذج كما تُرسل إلى `POST /items` (`ItemInput`). بيانات الموقع للمنتج وحده، والصورة `image_upload_id` من `POST /uploads`. */
export type ItemForm = {
  name: string;
  sku: string;
  type: ItemType | null;
  portfolio: Portfolio | null;
  minStock: number | null;
  showOnSite: boolean;
  slug: string;
  description: string;
  ingredients: string;
  ageRange: string;
  image: readonly UploadFile[];
};

export const emptyItemForm: ItemForm = { name: "", sku: "", type: null, portfolio: null, minStock: null, showOnSite: false, slug: "", description: "", ingredients: "", ageRange: "", image: [] };

type ItemFormViewProps = {
  form: ItemForm;
  onFormChange: (form: ItemForm) => void;
  /** `errors` من `validation_failed`: `{ sku: "نص", "site.slug": "نص" }`. */
  errors?: Readonly<Record<string, string>>;
  submitError?: string;
  submitting?: boolean;
  onImageSelect?: (files: File[]) => void;
  onImageReject?: (rejections: FileRejection[]) => void;
  onImageRemove?: (id: string) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
};

const typeDescriptions: Record<ItemType, string> = {
  PRODUCT: "يُباع للوكلاء بسعر ساري، ويمكن عرضه في الموقع.",
  SAMPLE: "يُوزَّع مجاناً في الزيارات، بتكلفة وحدة.",
  PROMO: "مطبوعات وهدايا دعائية، بتكلفة وحدة.",
};

const portfolioOptions: Option<Portfolio>[] = portfolioOrder.map((value) => ({ value, label: portfolioLabels[value] }));

/**
 * صنف جديد (E11): الاسم والرمز والنوع والمحفظة والحد الأدنى للمخزون، وللمنتج بيانات الموقع (الظهور، والصورة، والوصف، والمكوّنات، والعمر المناسب).
 * السعر أو التكلفة الأولى تُضاف من صفحة الصنف بعد الحفظ. «حفظ الصنف» معطّل وسببه ظاهر حتى تكتمل الحقول الإلزامية.
 */
export function ItemFormView({ form, onFormChange, errors = {}, submitError, submitting = false, onImageSelect, onImageReject, onImageRemove, onSubmit, onCancel }: ItemFormViewProps) {
  const set = (patch: Partial<ItemForm>) => onFormChange({ ...form, ...patch });
  const product = form.type === "PRODUCT";
  const uploading = form.image.some((file) => file.status === "uploading");

  const disabledReason =
    form.name.trim() === ""
      ? "اكتب اسم الصنف."
      : form.sku.trim() === ""
        ? "اكتب رمز الصنف."
        : form.type === null
          ? "اختر نوع الصنف."
          : product && form.showOnSite && (form.slug.trim() === "" || form.description.trim() === "")
            ? "المنتج الظاهر في الموقع يحتاج رابطاً ووصفاً."
            : uploading
              ? "انتظر انتهاء رفع الصورة."
              : null;

  return (
    <>
      <PageHeader title="صنف جديد" description="يُضاف الصنف مفعّلاً. السعر أو تكلفة الوحدة تُحدَّد من صفحته بعد الحفظ." />

      <div className="flex flex-col gap-4">
        {submitError ? (
          <Banner kind="danger" title="تعذّر حفظ الصنف">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Card title="بيانات الصنف">
          <div className="flex flex-col gap-4">
            <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
              <Field label="الاسم" required error={errors.name}>
                <Input value={form.name} maxLength={150} onChange={(event) => set({ name: event.target.value })} placeholder="حليب أطفال المرحلة الأولى 400غ" />
              </Field>
              <Field label="الرمز (SKU)" required error={errors.sku}>
                <Input value={form.sku} maxLength={50} dir="ltr" onChange={(event) => set({ sku: event.target.value })} placeholder="BL-INF1-400" />
              </Field>
            </Grid>

            <Field label="النوع" required error={errors.type}>
              <RadioGroup aria-label="النوع" value={form.type} onValueChange={(type) => set({ type: type as ItemType })} >
                <Grid cols={{ base: 1, tablet: 3 }} gap={3}>
                  {(Object.keys(itemTypeLabels) as ItemType[]).map((type) => (
                    <RadioCard key={type} value={type} title={itemTypeLabels[type]} description={typeDescriptions[type]} />
                  ))}
                </Grid>
              </RadioGroup>
            </Field>

            <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
              <Field label="المحفظة" optional error={errors.portfolio}>
                <Select aria-label="المحفظة" placeholder="اختر المحفظة" options={portfolioOptions} value={form.portfolio} onValueChange={(portfolio) => set({ portfolio })} />
              </Field>
              <Field label="الحد الأدنى للمخزون" optional error={errors.min_stock} hint="ينبّه المستودع حين يقلّ الرصيد عنه.">
                <NumberInput aria-label="الحد الأدنى للمخزون" value={form.minStock} onValueChange={(minStock) => set({ minStock })} min={0} unit="علبة" />
              </Field>
            </Grid>
          </div>
        </Card>

        {product ? (
          <Section title="بيانات الموقع" description="تظهر في صفحة المنتجات على موقع الشركة.">
            <Card>
              <div className="flex flex-col gap-4">
                <Switch label="يظهر في الموقع" description="المنتج المعطّل لا يظهر ولو فُعّل هذا." checked={form.showOnSite} onCheckedChange={(showOnSite) => set({ showOnSite })} />
                <Field label="الصورة" optional error={errors["site.image_upload_id"]}>
                  <FileUpload files={form.image} onSelect={(files) => onImageSelect?.(files)} onReject={onImageReject} onRemove={(id) => onImageRemove?.(id)} accept="image/*" acceptLabel="صورة" maxSize={5 * 1024 * 1024} disabled={submitting} />
                </Field>
                <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
                  <Field label="الرابط في الموقع" required={form.showOnSite} optional={!form.showOnSite} error={errors["site.slug"]}>
                    <Input value={form.slug} dir="ltr" onChange={(event) => set({ slug: event.target.value })} placeholder="infant-formula-stage-1" />
                  </Field>
                  <Field label="العمر المناسب" optional error={errors["site.age_range"]}>
                    <Input value={form.ageRange} onChange={(event) => set({ ageRange: event.target.value })} placeholder="من الولادة حتى 6 أشهر" />
                  </Field>
                </Grid>
                <Field label="الوصف" required={form.showOnSite} optional={!form.showOnSite} error={errors["site.description"]}>
                  <Textarea value={form.description} onChange={(event) => set({ description: event.target.value })} />
                </Field>
                <Field label="المكوّنات" optional error={errors["site.ingredients"]}>
                  <Textarea value={form.ingredients} onChange={(event) => set({ ingredients: event.target.value })} />
                </Field>
              </div>
            </Card>
          </Section>
        ) : null}

        <div className="flex flex-col gap-2">
          {disabledReason ? <p className="text-label text-fg-muted">{disabledReason}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" loading={submitting} disabled={disabledReason !== null} onClick={onSubmit}>
              حفظ الصنف
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
