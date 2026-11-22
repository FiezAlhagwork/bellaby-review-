"use client";

import { Prohibit } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { RadioCard, RadioGroup } from "@/components/ui/Radio";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { Block } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type BlockType = NonNullable<Block["type"]>;
export type BlocksPage = { data: readonly Block[]; meta: PaginationMeta };
/** `active=true` (الافتراضي) أو `active=false`. */
export type BlocksTab = "active" | "lifted";

/** نافذة «حظر جديد»: `POST /blocks { type, value, reason }`. */
export type BlockForm = { type: BlockType | null; value: string; reason: string };

type SecurityBlocksViewProps = {
  blocks: Loadable<BlocksPage>;
  tab: BlocksTab;
  onTabChange: (tab: BlocksTab) => void;
  /** `security.manage`. */
  canManage: boolean;
  form: BlockForm | null;
  onFormChange: (form: BlockForm | null) => void;
  onCreate?: () => void;
  /** `errors` من `validation_failed` (`type`، `value`، `reason`). */
  formErrors?: Readonly<Record<string, string>>;
  lifting: Block | null;
  onLiftingChange: (block: Block | null) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  reasonError?: string;
  /** `POST /blocks/{id}/lift { reason }`. */
  onLift?: () => void;
  submitting?: boolean;
  /** رمز خطأ (409 مرفوع مسبقاً؛ اسم الرمز غير محدّد §80). */
  actionError?: string;
  onDismissError?: () => void;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
};

const typeLabels = { DEVICE: "جهاز", EMAIL: "بريد" } as const satisfies Record<BlockType, string>;

/**
 * الحظر (I08): الأجهزة والبُرُد المحظورة بسببها ومن حظرها ومتى. «رفع الحظر» بسبب، و«حظر جديد» لجهاز أو بريد.
 * المرفوعة تبقى في السجل بسبب رفعها.
 */
export function SecurityBlocksView({
  blocks,
  tab,
  onTabChange,
  canManage,
  form,
  onFormChange,
  onCreate,
  formErrors = {},
  lifting,
  onLiftingChange,
  reason,
  onReasonChange,
  reasonError,
  onLift,
  submitting = false,
  actionError,
  onDismissError,
  onPageChange,
  onRetry,
}: SecurityBlocksViewProps) {
  const columns: DataTableColumn<Block>[] = [
    { key: "type", header: "النوع", cell: (row) => <TextCell value={row.type ? typeLabels[row.type] : null} />, width: "w-24", priority: "high" },
    {
      key: "value",
      header: "القيمة",
      cell: (row) => (
        <span dir="ltr" className="block truncate text-end text-body text-fg">
          {row.value}
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason} /> },
    { key: "created", header: "حُظر", cell: (row) => <TextCell value={`${row.created_by?.name ?? ""} · ${row.created_at ? formatDateTime(row.created_at) : ""}`} />, width: "w-56" },
    ...(tab === "lifted"
      ? [{ key: "lifted", header: "رُفع", cell: (row: Block) => <TextCell value={`${row.lift_reason ?? ""}${row.lifted_at ? ` · ${formatDateTime(row.lifted_at)}` : ""}`} />, width: "w-64" }]
      : [{ key: "state", header: "الحالة", cell: () => <Badge color="danger">محظور</Badge>, width: "w-24", role: "status" as const }]),
  ];

  const formReason = form === null ? null : form.type === null ? "اختر النوع." : form.value.trim() === "" ? "اكتب الجهاز أو البريد." : form.reason.trim() === "" ? "اكتب السبب." : null;

  return (
    <>
      <PageHeader
        title="الحظر"
        description="الأجهزة والبُرُد الممنوعة من الدخول. الحظر من محاولة أو يدوياً، ويُرفع بسبب."
        actions={canManage ? [{ id: "new", label: "حظر جديد", primary: true, onSelect: () => onFormChange({ type: null, value: "", reason: "" }) }] : []}
      />

      <div className="flex flex-col gap-4">
        <SegmentedControl
          aria-label="الحالة"
          options={[
            { value: "active", label: "محظور الآن" },
            { value: "lifted", label: "رُفع حظره" },
          ]}
          value={tab}
          onValueChange={onTabChange}
        />

        {actionError ? (
          <Banner kind="danger" title="تعذّر رفع الحظر" onClose={onDismissError}>
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        <DataTable
          label="الحظر"
          columns={columns}
          rows={blocks.status === "ready" ? blocks.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={blocks.status === "loading"}
          error={blocks.status === "error" ? { code: blocks.code, onRetry } : undefined}
          empty={<EmptyState icon={Prohibit} title={tab === "active" ? "لا حظر الآن" : "لا حظر مرفوع"} description="يظهر هنا كل جهاز أو بريد ممنوع من الدخول." />}
          rowActions={canManage && tab === "active" ? (row) => [{ id: "lift", label: "رفع الحظر", onSelect: () => onLiftingChange(row) }] : undefined}
        />

        {blocks.status === "ready" ? <Pagination meta={blocks.data.meta} onPageChange={onPageChange} /> : null}
      </div>

      <ReasonDialog
        open={lifting !== null}
        onOpenChange={(open) => {
          if (!open) onLiftingChange(null);
        }}
        title="رفع الحظر؟"
        description={lifting ? `يعود «${lifting.value ?? ""}» قادراً على المحاولة. الدخول يبقى لمن له حساب أو جهاز مربوط.` : ""}
        confirmLabel="رفع الحظر"
        reason={reason}
        onReasonChange={onReasonChange}
        error={reasonError}
        loading={submitting}
        onConfirm={() => onLift?.()}
      />

      <Dialog
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) onFormChange(null);
        }}
        dismissible={!submitting}
        size="sm"
        title="حظر جديد"
        description="يُمنع الجهاز أو البريد من الدخول فوراً."
        actions={[
          <Button key="cancel" variant="secondary" disabled={submitting} onClick={() => onFormChange(null)}>
            إلغاء
          </Button>,
          <Button key="save" variant="danger" loading={submitting} disabled={formReason !== null} onClick={onCreate}>
            حظر
          </Button>,
        ]}
      >
        {form ? (
          <div className="flex flex-col gap-4">
            <Field label="النوع" required error={formErrors.type}>
              <RadioGroup aria-label="النوع" value={form.type} onValueChange={(type) => onFormChange({ ...form, type: type as BlockType })}>
                <Grid cols={{ base: 2 }} gap={3}>
                  <RadioCard value="DEVICE" title="جهاز" description="بمعرّف الجهاز." />
                  <RadioCard value="EMAIL" title="بريد" description="ببريد Google." />
                </Grid>
              </RadioGroup>
            </Field>
            <Field label={form.type === "EMAIL" ? "البريد" : "معرّف الجهاز"} required error={formErrors.value}>
              <Input dir="ltr" value={form.value} onChange={(event) => onFormChange({ ...form, value: event.target.value })} />
            </Field>
            <Field label="السبب" required error={formErrors.reason}>
              <Textarea value={form.reason} onChange={(event) => onFormChange({ ...form, reason: event.target.value })} />
            </Field>
            {formReason ? <p className="text-label text-fg-muted">{formReason}</p> : null}
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
