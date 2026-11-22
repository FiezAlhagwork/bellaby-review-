"use client";

import { Key } from "@phosphor-icons/react";
import { NumberCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { userTypeLabels } from "@/components/data/departments";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { RadioCard, RadioGroup } from "@/components/ui/Radio";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { PermissionGroup, Role } from "@/lib/api/types";
import { countPhrase } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { Grid } from "@/components/layout/Grid";

type Platform = "WEB" | "REP";

/** مسودة الدور كما تُرسل إلى `POST /roles` أو `PUT /roles/{id}` (`RoleInput`). `role` null = دور جديد. */
export type RoleDraft = { role: Role | null; name: string; platform: Platform | null; jobDescription: string; permissions: readonly string[] };

export const draftOfRole = (role: Role): RoleDraft => ({ role, name: role.name ?? "", platform: role.platform ?? null, jobDescription: role.job_description ?? "", permissions: role.permissions ?? [] });
export const newRoleDraft: RoleDraft = { role: null, name: "", platform: null, jobDescription: "", permissions: [] };

type RolesViewProps = {
  roles: Loadable<readonly Role[]>;
  /** `GET /permissions`: الصلاحيات مجمّعة بالوحدة. */
  permissionGroups: Loadable<readonly PermissionGroup[]>;
  /** `roles.manage`. */
  canManage: boolean;
  draft: RoleDraft | null;
  onDraftChange: (draft: RoleDraft | null) => void;
  onSave?: () => void;
  saving?: boolean;
  /** `errors` من `validation_failed` (`name`، `permissions`). */
  draftErrors?: Readonly<Record<string, string>>;
  /** رمز خطأ الحفظ بلا حقل (409 `system_role_locked`). */
  draftError?: string;
  deleting: Role | null;
  onDeletingChange: (role: Role | null) => void;
  onDelete?: () => void;
  /** رمز خطأ الحذف (409 `role_in_use` أو `system_role_locked`). */
  actionError?: string;
  onDismissError?: () => void;
  onRetry?: () => void;
};

const SYSTEM_REASON = "دور نظامي: لا يُعدَّل ولا يُحذف.";

/**
 * الأدوار والصلاحيات (I04): الأدوار بمنصتها وعدد مستخدميها، و«نظامي» للمقفل. صفحة الدور في درج: وصف المهام، والصلاحيات مجمّعة بالوحدة،
 * وشارة «يشمله التفويض» لما يشمله التفويض المؤقت. الدور النظامي للقراءة، والمستعمل لا يُحذف.
 */
export function RolesView({
  roles,
  permissionGroups,
  canManage,
  draft,
  onDraftChange,
  onSave,
  saving = false,
  draftErrors = {},
  draftError,
  deleting,
  onDeletingChange,
  onDelete,
  actionError,
  onDismissError,
  onRetry,
}: RolesViewProps) {
  const columns: DataTableColumn<Role>[] = [
    {
      key: "name",
      header: "الدور",
      cell: (row) => (
        <span className="flex items-center gap-2">
          <span className="truncate text-body text-fg">{row.name}</span>
          {row.is_system ? <Badge color="neutral">نظامي</Badge> : null}
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "platform", header: "المنصة", cell: (row) => <TextCell value={row.platform === "REP" ? "تطبيق المندوب" : row.platform ? "لوحة الويب" : null} />, width: "w-36", priority: "high" },
    { key: "users", header: "المستخدمون", cell: (row) => <NumberCell value={row.users_count} />, align: "end", width: "w-28", priority: "high" },
    { key: "permissions", header: "الصلاحيات", cell: (row) => <TextCell value={countPhrase(row.permissions?.length ?? 0, ["صلاحية", "صلاحيتان", "صلاحيات"])} />, width: "w-32" },
  ];

  const readOnly = draft?.role?.is_system === true || !canManage;
  const toggle = (key: string, checked: boolean) => {
    if (!draft) return;
    onDraftChange({ ...draft, permissions: checked ? [...draft.permissions, key] : draft.permissions.filter((item) => item !== key) });
  };
  const draftReason = draft === null || readOnly ? null : draft.name.trim() === "" ? "اكتب اسم الدور." : draft.platform === null ? "اختر المنصة." : draft.permissions.length === 0 ? "اختر صلاحية واحدة على الأقل." : null;

  return (
    <>
      <PageHeader
        title="الأدوار والصلاحيات"
        description="الصلاحيات تُمنح بالدور لا بالشخص. الدور النظامي مقفل، والدور المستعمل لا يُحذف."
        actions={canManage ? [{ id: "new", label: "دور جديد", primary: true, onSelect: () => onDraftChange(newRoleDraft) }] : []}
      />

      <div className="flex flex-col gap-4">
        {actionError ? (
          <Banner kind="danger" title="تعذّر حذف الدور" onClose={onDismissError}>
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        <DataTable
          label="الأدوار"
          columns={columns}
          rows={roles.status === "ready" ? roles.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={roles.status === "loading"}
          error={roles.status === "error" ? { code: roles.code, onRetry } : undefined}
          empty={<EmptyState icon={Key} title="لا أدوار بعد" description="أنشئ أول دور وحدّد صلاحياته." />}
          onRowOpen={(row) => onDraftChange(draftOfRole(row))}
          rowActions={
            canManage
              ? (row) => [
                  { id: "edit", label: row.is_system ? "عرض" : "تعديل", onSelect: () => onDraftChange(draftOfRole(row)) },
                  row.is_system
                    ? { id: "delete", label: "حذف", danger: true, disabled: true, reason: SYSTEM_REASON, onSelect: () => {} }
                    : (row.users_count ?? 0) > 0
                      ? { id: "delete", label: "حذف", danger: true, disabled: true, reason: `مستعمل في ${countPhrase(row.users_count ?? 0, ["حساب", "حسابين", "حسابات"])}: انقلهم إلى دور آخر أولاً.`, onSelect: () => {} }
                      : { id: "delete", label: "حذف", danger: true, onSelect: () => onDeletingChange(row) },
                ]
              : undefined
          }
        />
      </div>

      <Drawer
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open) onDraftChange(null);
        }}
        size="md"
        title={draft?.role ? (draft.role.name ?? "الدور") : "دور جديد"}
        description={draft?.role?.is_system ? "دور نظامي: للقراءة." : "الاسم والمنصة ووصف المهام والصلاحيات."}
        actions={
          readOnly
            ? [
                <Button key="close" variant="secondary" onClick={() => onDraftChange(null)}>
                  إغلاق
                </Button>,
              ]
            : [
                <Button key="cancel" variant="secondary" disabled={saving} onClick={() => onDraftChange(null)}>
                  إلغاء
                </Button>,
                <Button key="save" variant="primary" loading={saving} disabled={draftReason !== null} onClick={onSave}>
                  {draft?.role ? "حفظ" : "إنشاء الدور"}
                </Button>,
              ]
        }
      >
        {draft ? (
          <div className="flex flex-col gap-4">
            {draft.role?.is_system ? (
              <Banner kind="info" title="دور نظامي">
                {errorMessage("system_role_locked")}
              </Banner>
            ) : null}
            {draftError ? (
              <Banner kind="danger" title="تعذّر حفظ الدور">
                {errorMessage(draftError)}
              </Banner>
            ) : null}

            <Field label="اسم الدور" required error={draftErrors.name}>
              <Input value={draft.name} maxLength={60} readOnly={readOnly} onChange={(event) => onDraftChange({ ...draft, name: event.target.value })} />
            </Field>
            <Field label="المنصة" required error={draftErrors.platform}>
              <RadioGroup aria-label="المنصة" value={draft.platform} onValueChange={(platform) => onDraftChange({ ...draft, platform: platform as Platform })} readOnly={readOnly}>
                <Grid cols={{ base: 1, tablet: 2 }} gap={3}>
                  <RadioCard value="WEB" title={`${userTypeLabels.WEB} · لوحة التحكم`} description="يدخل ببريد Google." />
                  <RadioCard value="REP" title={`${userTypeLabels.REP} · التطبيق`} description="يدخل برقم الهاتف وجهاز مربوط." />
                </Grid>
              </RadioGroup>
            </Field>
            <Field label="وصف المهام" optional error={draftErrors.job_description} hint="يظهر في ملف كل من يحمل الدور.">
              <Textarea value={draft.jobDescription} readOnly={readOnly} onChange={(event) => onDraftChange({ ...draft, jobDescription: event.target.value })} />
            </Field>

            <div className="flex flex-col gap-2">
              <p className="text-body text-fg">{`الصلاحيات · ${countPhrase(draft.permissions.length, ["صلاحية", "صلاحيتان", "صلاحيات"])}`}</p>
              {draftErrors.permissions ? <p className="text-label text-danger">{draftErrors.permissions}</p> : null}
              {permissionGroups.status === "loading" ? (
                <Skeleton className="h-48 w-full" />
              ) : permissionGroups.status === "error" ? (
                <ErrorState code={permissionGroups.code} onRetry={onRetry} />
              ) : (
                permissionGroups.data.map((group) => (
                  <fieldset key={group.module} className="flex flex-col gap-2 border-t border-border pt-3">
                    <legend className="text-label text-fg-muted">{group.module_label}</legend>
                    {(group.permissions ?? []).map((permission) => (
                      <span key={permission.key} className="flex items-center justify-between gap-2">
                        <Checkbox
                          label={permission.label ?? permission.key ?? ""}
                          checked={draft.permissions.includes(permission.key ?? "")}
                          onCheckedChange={(checked) => toggle(permission.key ?? "", checked)}
                          readOnly={readOnly}
                        />
                        {permission.delegable ? <Badge color="info">يشمله التفويض</Badge> : null}
                      </span>
                    ))}
                  </fieldset>
                ))
              )}
            </div>
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) onDeletingChange(null);
        }}
        title="حذف الدور؟"
        description={deleting ? `«${deleting.name ?? ""}» لا يحمله أي حساب. يُحذف نهائياً.` : ""}
        confirmLabel="حذف الدور"
        danger
        loading={saving}
        onConfirm={() => onDelete?.()}
      />
    </>
  );
}
