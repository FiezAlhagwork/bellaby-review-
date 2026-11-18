"use client";

import { DateCell, MoneyCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { itemTypeLabels } from "@/components/data/item-types";
import { portfolioLabels } from "@/components/data/portfolio";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Skeleton } from "@/components/ui/Skeleton";
import { errorMessage } from "@/lib/api/error-messages";
import type { Item, PricePeriod } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { formatDateTime, formatQuantity } from "@/lib/format";
import { Coins } from "@phosphor-icons/react";
import type { Loadable } from "@/lib/loadable";

/** نافذة الفترة الجديدة: `POST /items/{id}/prices` للمنتج أو `/unit-costs` للعينة والمادة (`amount` و`starts_on`). */
export type PriceForm = { amount: string; startsOn: IsoDate | null };

type ItemDetailsViewProps = {
  item: Loadable<Item>;
  /** سجل الأسعار (المنتج) أو تكلفة الوحدة (العينة والمادة)، الأحدث أولاً. */
  periods: Loadable<readonly PricePeriod[]>;
  /** `prices.manage`. */
  canPrice: boolean;
  /** `items.manage`: تعطيل الصنف وتفعيله. */
  canManage: boolean;
  priceForm: PriceForm | null;
  onPriceFormChange: (form: PriceForm | null) => void;
  onSubmitPrice?: () => void;
  /** `errors` من `validation_failed` (`amount`، `starts_on`). */
  priceErrors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل، مثل `price_in_past`. */
  priceError?: string;
  confirmingToggle: boolean;
  onConfirmingToggleChange: (open: boolean) => void;
  onToggleActive?: () => void;
  submitting?: boolean;
  today: IsoDate;
  onBack?: () => void;
  onRetry?: () => void;
};

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * صفحة الصنف (E12): بياناته، وبيانات الموقع للمنتج، وسجل الأسعار (للمنتج) أو تكلفة الوحدة (للعينة والمادة). «سعر جديد» أو «تكلفة جديدة» فترةٌ تبدأ اليوم أو بعده،
 * وتُغلق السابقة آلياً قبلها بيوم (القرار 13). «تعطيل الصنف» يوقفه في الصرف والتسليم ولا يحذفه.
 */
export function ItemDetailsView({
  item,
  periods,
  canPrice,
  canManage,
  priceForm,
  onPriceFormChange,
  onSubmitPrice,
  priceErrors = {},
  priceError,
  confirmingToggle,
  onConfirmingToggleChange,
  onToggleActive,
  submitting = false,
  today,
  onBack,
  onRetry,
}: ItemDetailsViewProps) {
  if (item.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (item.status === "error") return item.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={item.code} onRetry={onRetry} />;

  const data = item.data;
  const product = data.type === "PRODUCT";
  const noun = product ? "السعر" : "تكلفة الوحدة";
  const newLabel = product ? "سعر جديد" : "تكلفة جديدة";
  const current = product ? data.current_price : data.current_unit_cost;

  const actions = [
    ...(canPrice && data.is_active ? [{ id: "price", label: newLabel, primary: true, onSelect: () => onPriceFormChange({ amount: "", startsOn: today }) }] : []),
    ...(canManage ? [{ id: "toggle", label: data.is_active ? "تعطيل الصنف" : "تفعيل الصنف", danger: data.is_active, onSelect: () => onConfirmingToggleChange(true) }] : []),
  ];

  const columns: DataTableColumn<PricePeriod>[] = [
    { key: "amount", header: noun, cell: (row) => <MoneyCell value={row.amount} />, align: "end", width: "w-32", priority: "high", role: "primary" },
    { key: "starts_on", header: "من", cell: (row) => <DateCell value={row.starts_on} />, width: "w-44", priority: "high" },
    {
      key: "ends_on",
      header: "إلى",
      cell: (row) => {
        if (row.ends_on) return <DateCell value={row.ends_on} />;
        return (row.starts_on ?? "") > today ? <Badge color="info">يبدأ لاحقاً</Badge> : <Badge color="success">ساري</Badge>;
      },
      width: "w-44",
      priority: "high",
      role: "status",
    },
    { key: "created_by", header: "أدخله", cell: (row) => <TextCell value={row.created_by?.name} /> },
  ];

  const formReason = priceForm === null ? null : !MONEY_PATTERN.test(priceForm.amount.trim()) ? "اكتب المبلغ بالدولار." : priceForm.startsOn === null ? "اختر تاريخ البدء." : null;

  return (
    <>
      <PageHeader
        title={data.name ?? "صنف"}
        badge={<Badge color={data.is_active ? "success" : "neutral"}>{data.is_active ? "مفعّل" : "معطّل"}</Badge>}
        description={`${data.type ? itemTypeLabels[data.type] : ""} · ${data.sku ?? ""}`}
        actions={actions}
      />

      <div className="flex flex-col gap-4">
        {!data.is_active ? (
          <Banner kind="warning" title="الصنف معطّل">
            لا يُصرف ولا يُسلَّم ولا يُعرض في الموقع، ويبقى سجله. فعّله ليعود.
          </Banner>
        ) : null}

        <Grid cols={{ base: 1, desktop: 2 }} gap={4}>
          <Card title="بيانات الصنف">
            <DescriptionList
              items={[
                { label: "النوع", value: data.type ? itemTypeLabels[data.type] : null },
                { label: "الرمز", value: data.sku ? <span dir="ltr">{data.sku}</span> : null },
                { label: "المحفظة", value: data.portfolio ? portfolioLabels[data.portfolio] : null },
                { label: "الحد الأدنى للمخزون", value: data.min_stock !== null && data.min_stock !== undefined ? formatQuantity(data.min_stock, "علبة") : null },
                { label: product ? "السعر الساري" : "تكلفة الوحدة الحالية", value: current ? <MoneyCell value={current} /> : "لم يُحدَّد بعد" },
                { label: "أُضيف في", value: data.created_at ? formatDateTime(data.created_at) : null },
              ]}
            />
          </Card>

          {product ? (
            <Card title="بيانات الموقع">
              <DescriptionList
                items={[
                  { label: "يظهر في الموقع", value: data.show_on_site ? "نعم" : "لا" },
                  { label: "الرابط", value: data.site?.slug ? <span dir="ltr">{data.site.slug}</span> : null },
                  { label: "العمر المناسب", value: data.site?.age_range },
                  { label: "الوصف", value: data.site?.description },
                  { label: "المكوّنات", value: data.site?.ingredients },
                ]}
              />
            </Card>
          ) : null}
        </Grid>

        <Section title={product ? "سجل الأسعار" : "سجل تكلفة الوحدة"} description="فترات لا تتداخل: الجديدة تبدأ اليوم أو بعده، وتُغلق السابقة قبلها بيوم. لا يُعدَّل سعر مضى.">
          <DataTable
            label={product ? "سجل الأسعار" : "سجل تكلفة الوحدة"}
            columns={columns}
            rows={periods.status === "ready" ? periods.data : []}
            getRowKey={(row) => row.id ?? ""}
            loading={periods.status === "loading"}
            error={periods.status === "error" ? { code: periods.code, onRetry } : undefined}
            empty={<EmptyState icon={Coins} title={product ? "لا سعر بعد" : "لا تكلفة بعد"} description={`أضف «${newLabel}» ليُستعمل الصنف في ${product ? "التسليم" : "حساب المصروف"}.`} />}
          />
        </Section>
      </div>

      <Dialog
        open={priceForm !== null}
        onOpenChange={(open) => {
          if (!open) onPriceFormChange(null);
        }}
        dismissible={!submitting}
        size="sm"
        title={newLabel}
        description={`فترة جديدة لـ«${data.name ?? ""}» تبدأ اليوم أو بعده. تُغلق الفترة الحالية قبلها بيوم.`}
        actions={[
          <Button key="cancel" variant="secondary" disabled={submitting} onClick={() => onPriceFormChange(null)}>
            إلغاء
          </Button>,
          <Button key="save" variant="primary" loading={submitting} disabled={formReason !== null} onClick={onSubmitPrice}>
            حفظ
          </Button>,
        ]}
      >
        {priceForm ? (
          <div className="flex flex-col gap-4">
            {priceError ? (
              <Banner kind="danger" title="لا سعر بتاريخ مضى">
                {errorMessage(priceError)}
              </Banner>
            ) : null}
            <Field label="المبلغ" required error={priceErrors.amount}>
              <MoneyInput aria-label="المبلغ" value={priceForm.amount} onChange={(event) => onPriceFormChange({ ...priceForm, amount: event.target.value })} />
            </Field>
            <Field label="تاريخ البدء" required error={priceErrors.starts_on} hint="اليوم أو بعده.">
              <DatePicker aria-label="تاريخ البدء" value={priceForm.startsOn} onValueChange={(startsOn) => onPriceFormChange({ ...priceForm, startsOn })} min={today} today={today} />
            </Field>
            {formReason ? <p className="text-label text-fg-muted">{formReason}</p> : null}
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={confirmingToggle}
        onOpenChange={onConfirmingToggleChange}
        title={data.is_active ? "تعطيل الصنف؟" : "تفعيل الصنف؟"}
        description={data.is_active ? "يتوقف صرفه وتسليمه وعرضه في الموقع. لا يُحذف، ويبقى سجله وأرصدته، ويمكن تفعيله لاحقاً." : "يعود الصنف متاحاً للصرف والتسليم."}
        confirmLabel={data.is_active ? "تعطيل الصنف" : "تفعيل الصنف"}
        danger={data.is_active}
        loading={submitting}
        onConfirm={() => onToggleActive?.()}
      />
    </>
  );
}
