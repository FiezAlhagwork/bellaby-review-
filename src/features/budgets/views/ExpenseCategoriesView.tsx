"use client";

import { Wallet } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { errorMessage } from "@/lib/api/error-messages";
import type { ExpenseCategory } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";

/** نافذة البند: إضافة (`POST`) أو تعديل الاسم (`PATCH` على بند غير نظامي). */
export type CategoryForm = { mode: "create" } | { mode: "rename"; category: ExpenseCategory };

type ExpenseCategoriesViewProps = {
  categories: Loadable<readonly ExpenseCategory[]>;
  /** `budgets.manage`. */
  canManage: boolean;
  form: CategoryForm | null;
  name: string;
  onNameChange: (name: string) => void;
  onOpenForm: (form: CategoryForm | null) => void;
  onSubmit?: () => void;
  /** تفعيل البند أو تعطيله (`PATCH { is_active }`). البند النظامي لا يُعطَّل (409). */
  onToggleActive?: (category: ExpenseCategory) => void;
  submitting?: boolean;
  /** نص الخادم تحت حقل الاسم (`errors.name`). */
  nameError?: string;
  /** رمز خطأ بلا حقل (409 بند نظامي). */
  actionError?: string;
  onBack?: () => void;
  onRetry?: () => void;
};

/**
 * بنود المصاريف (E04): الاسم والنوع (محسوب أو يدخله المحاسب) ومفعّل. «إضافة بند» يضيف بنداً يدخل المحاسب فعليه.
 * البند النظامي (العينات والمواد المحسوب) لا يُعدَّل ولا يُعطَّل، ومعه سببه.
 */
export function ExpenseCategoriesView({ categories, canManage, form, name, onNameChange, onOpenForm, onSubmit, onToggleActive, submitting = false, nameError, actionError, onBack, onRetry }: ExpenseCategoriesViewProps) {
  const columns: DataTableColumn<ExpenseCategory>[] = [
    {
      key: "name",
      header: "البند",
      cell: (row) => (
        <span className="flex items-center gap-2">
          <span className="truncate text-body text-fg">{row.name}</span>
          {row.is_system ? <Badge color="neutral">نظامي</Badge> : null}
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "kind", header: "النوع", cell: (row) => <TextCell value={row.kind === "COMPUTED" ? "محسوب من النظام" : "يدخله المحاسب"} />, width: "w-44", priority: "high" },
    { key: "active", header: "الحالة", cell: (row) => <Badge color={row.is_active ? "success" : "neutral"}>{row.is_active ? "مفعّل" : "معطّل"}</Badge>, width: "w-28", priority: "high", role: "status" },
  ];

  const systemReason = "بند نظامي: يُحسب من النظام ولا يُعدَّل ولا يُعطَّل.";
  const empty = name.trim() === "";

  return (
    <>
      <PageHeader
        title="بنود المصاريف"
        description="البنود التي تُحدَّد لها ميزانية شهرية. بند العينات والمواد يُحسب من الزيارات، والباقي يدخل المحاسب فعليه."
        actions={[...(onBack ? [{ id: "back", label: "العودة للميزانية", onSelect: onBack }] : []), ...(canManage ? [{ id: "new", label: "إضافة بند", primary: true, onSelect: () => onOpenForm({ mode: "create" }) }] : [])]}
      />

      <div className="flex flex-col gap-4">
        {actionError ? (
          <Banner kind="danger" title="تعذّر تعديل البند">
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        <DataTable
          label="بنود المصاريف"
          columns={columns}
          rows={categories.status === "ready" ? categories.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={categories.status === "loading"}
          error={categories.status === "error" ? { code: categories.code, onRetry } : undefined}
          empty={<EmptyState icon={Wallet} title="لا بنود بعد" description="أضف بنداً لتحدّد له ميزانية شهرية." />}
          rowActions={
            canManage
              ? (row) =>
                  row.is_system
                    ? [
                        { id: "rename", label: "تعديل الاسم", disabled: true, reason: systemReason, onSelect: () => {} },
                        { id: "toggle", label: row.is_active ? "تعطيل" : "تفعيل", disabled: true, reason: systemReason, onSelect: () => {} },
                      ]
                    : [
                        { id: "rename", label: "تعديل الاسم", onSelect: () => onOpenForm({ mode: "rename", category: row }) },
                        { id: "toggle", label: row.is_active ? "تعطيل" : "تفعيل", danger: row.is_active, onSelect: () => onToggleActive?.(row) },
                      ]
              : undefined
          }
        />
      </div>

      <Dialog
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) onOpenForm(null);
        }}
        dismissible={!submitting}
        size="sm"
        title={form?.mode === "rename" ? "تعديل اسم البند" : "إضافة بند"}
        description={form?.mode === "rename" ? "يتغيّر الاسم في كل الأشهر." : "بند جديد يدخل المحاسب مصروفه الفعلي كل شهر."}
        actions={[
          <Button key="cancel" variant="secondary" disabled={submitting} onClick={() => onOpenForm(null)}>
            إلغاء
          </Button>,
          <Button key="save" variant="primary" loading={submitting} disabled={empty} onClick={onSubmit}>
            {form?.mode === "rename" ? "حفظ" : "إضافة البند"}
          </Button>,
        ]}
      >
        <Field label="اسم البند" required error={nameError} hint={empty ? "اكتب اسم البند." : undefined}>
          <Input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="مثل: ضيافة ومؤتمرات" />
        </Field>
      </Dialog>
    </>
  );
}
