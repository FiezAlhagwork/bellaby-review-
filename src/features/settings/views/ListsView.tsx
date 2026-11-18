"use client";

import { ListBullets } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { listKeyLabels, listKeyOrder } from "@/components/data/list-keys";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { errorMessage } from "@/lib/api/error-messages";
import type { ListEntry, ListKey } from "@/lib/api/types";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { SettingsTabs, type SettingsSection } from "../components/SettingsTabs";

/** نافذة القيمة: إضافة (`POST /lists/{key}`) أو تعديل الاسم والترتيب (`PATCH /lists/{key}/{id}`). */
export type ListEntryForm = { mode: "create"; name: string; order: number | null } | { mode: "edit"; entry: ListEntry; name: string; order: number | null };

type ListsViewProps = {
  listKey: ListKey;
  onListKeyChange: (key: ListKey) => void;
  /** `GET /lists/{key}?include_inactive=true`، مرتّبة بـ `order`. */
  entries: Loadable<readonly ListEntry[]>;
  /** `lists.manage`. */
  canManage: boolean;
  form: ListEntryForm | null;
  onFormChange: (form: ListEntryForm | null) => void;
  onSubmit?: () => void;
  /** `PATCH { is_active }`. القيمة النظامية لا تُعطَّل (409 `system_entry_locked`). */
  onToggleActive?: (entry: ListEntry) => void;
  submitting?: boolean;
  /** `errors` من `validation_failed` (`name`، `order`). */
  formErrors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل، مثل `system_entry_locked`. */
  actionError?: string;
  onDismissError?: () => void;
  onSectionChange?: (section: SettingsSection) => void;
  onRetry?: () => void;
};

const SYSTEM_REASON = "قيمة نظامية: يستعملها النظام ولا تُعطَّل.";

/**
 * القوائم (E14): القوائم المرجعية السبع، ولكل قائمة قيمها بترتيبها وحالتها. إضافة وتعديل وتعطيل، ولا حذف.
 * القيمة النظامية (`is_system`، مثل «سحب دفعة») عليها شارة، وتعطيلها معطّل مع سببه.
 */
export function ListsView({ listKey, onListKeyChange, entries, canManage, form, onFormChange, onSubmit, onToggleActive, submitting = false, formErrors = {}, actionError, onDismissError, onSectionChange, onRetry }: ListsViewProps) {
  const columns: DataTableColumn<ListEntry>[] = [
    { key: "order", header: "الترتيب", cell: (row) => <TextCell value={row.order !== undefined ? isolate(row.order) : null} />, width: "w-24", priority: "high" },
    {
      key: "name",
      header: "القيمة",
      cell: (row) => (
        <span className="flex items-center gap-2">
          <span className="truncate text-body text-fg">{row.name}</span>
          {row.is_system ? <Badge color="neutral">نظامية</Badge> : null}
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "active", header: "الحالة", cell: (row) => <Badge color={row.is_active ? "success" : "neutral"}>{row.is_active ? "مفعّلة" : "معطّلة"}</Badge>, width: "w-28", priority: "high", role: "status" },
  ];

  const listName = listKeyLabels[listKey];
  const formReason = form === null ? null : form.name.trim() === "" ? "اكتب القيمة." : null;

  return (
    <>
      <PageHeader
        title="الإعدادات"
        description="القوائم التي يختار منها المندوبون والموظفون: أسباب المرتجع والتالف، وأهداف الزيارة ونتائجها، والاختصاصات وأنواع الجهات."
        actions={canManage ? [{ id: "new", label: "إضافة قيمة", primary: true, onSelect: () => onFormChange({ mode: "create", name: "", order: null }) }] : []}
      />

      <div className="flex flex-col gap-4">
        <SettingsTabs active="lists" onSelect={onSectionChange} />

        <div className="w-full max-w-72">
          <Field label="القائمة">
            <Select aria-label="القائمة" options={listKeyOrder.map((key) => ({ value: key, label: listKeyLabels[key] }))} value={listKey} onValueChange={onListKeyChange} />
          </Field>
        </div>

        {actionError ? (
          <Banner kind="danger" title="تعذّر تعديل القيمة" onClose={onDismissError}>
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        <DataTable
          label={listName}
          columns={columns}
          rows={entries.status === "ready" ? entries.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={entries.status === "loading"}
          error={entries.status === "error" ? { code: entries.code, onRetry } : undefined}
          empty={<EmptyState icon={ListBullets} title="لا قيم بعد" description={`أضف أول قيمة إلى «${listName}».`} />}
          rowActions={
            canManage
              ? (row) => [
                  { id: "edit", label: "تعديل", onSelect: () => onFormChange({ mode: "edit", entry: row, name: row.name ?? "", order: row.order ?? null }) },
                  row.is_system
                    ? { id: "toggle", label: "تعطيل", disabled: true, reason: SYSTEM_REASON, onSelect: () => {} }
                    : { id: "toggle", label: row.is_active ? "تعطيل" : "تفعيل", danger: row.is_active, onSelect: () => onToggleActive?.(row) },
                ]
              : undefined
          }
        />
        <p className="text-label text-fg-muted">القيمة المعطّلة تختفي من الاختيار في التطبيق والويب، وتبقى في السجلات القديمة.</p>
      </div>

      <Dialog
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) onFormChange(null);
        }}
        dismissible={!submitting}
        size="sm"
        title={form?.mode === "edit" ? "تعديل القيمة" : "إضافة قيمة"}
        description={`في قائمة «${listName}».${form?.mode === "edit" ? " يتغيّر الاسم في السجلات القديمة أيضاً." : ""}`}
        actions={[
          <Button key="cancel" variant="secondary" disabled={submitting} onClick={() => onFormChange(null)}>
            إلغاء
          </Button>,
          <Button key="save" variant="primary" loading={submitting} disabled={formReason !== null} onClick={onSubmit}>
            {form?.mode === "edit" ? "حفظ" : "إضافة القيمة"}
          </Button>,
        ]}
      >
        {form ? (
          <div className="flex flex-col gap-4">
            <Field label="القيمة" required error={formErrors.name} hint={formReason ?? undefined}>
              <Input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} placeholder="مثل: قرب انتهاء الصلاحية" />
            </Field>
            <Field label="الترتيب" optional error={formErrors.order} hint="مكانها في قائمة الاختيار. فارغ = في الآخر.">
              <NumberInput aria-label="الترتيب" value={form.order} onValueChange={(order) => onFormChange({ ...form, order })} min={1} />
            </Field>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
