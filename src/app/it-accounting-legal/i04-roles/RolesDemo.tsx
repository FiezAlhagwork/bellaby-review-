"use client";

import { useState } from "react";
import { RolesView, draftOfRole, type RoleDraft } from "@/features/roles/views/RolesView";
import type { Role } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { permissionModules, rolesWithPermissions } from "@/mocks/roles";

// غلاف تفاعلي لصفحة الرسم (I04): يملك الأدوار والدرج ونافذة الحذف. الحفظ كما تفعل POST وPUT /roles، والحذف DELETE /roles/{id}. لا يُنقل للإنتاج.

type RolesDemoProps = { initialRoleId?: number; initialDeleting?: number; initialError?: string; mode?: "ready" | "loading" | "error" | "empty" };

export function RolesDemo({ initialRoleId, initialDeleting, initialError, mode = "ready" }: RolesDemoProps) {
  const [rows, setRows] = useState<readonly Role[]>(rolesWithPermissions);
  const [draft, setDraft] = useState<RoleDraft | null>(() => {
    const role = rolesWithPermissions.find((item) => item.id === initialRoleId);
    return role ? draftOfRole(role) : null;
  });
  const [deleting, setDeleting] = useState<Role | null>(() => rows.find((role) => role.id === initialDeleting) ?? null);
  const [error, setError] = useState(initialError);

  const roles: Loadable<readonly Role[]> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: mode === "empty" ? [] : rows };

  return (
    <RolesView
      roles={roles}
      permissionGroups={{ status: "ready", data: permissionModules }}
      canManage
      draft={draft}
      onDraftChange={setDraft}
      onSave={() => {
        if (!draft?.platform) return;
        const input = { name: draft.name.trim(), platform: draft.platform, job_description: draft.jobDescription.trim() || null, permissions: [...draft.permissions] };
        if (draft.role) setRows(rows.map((role) => (role.id === draft.role?.id ? { ...role, ...input } : role)));
        else setRows([...rows, { id: Math.max(0, ...rows.map((role) => role.id ?? 0)) + 1, key: `custom_${rows.length + 1}`, is_system: false, users_count: 0, ...input }]);
        setDraft(null);
      }}
      deleting={deleting}
      onDeletingChange={setDeleting}
      onDelete={() => {
        setRows(rows.filter((role) => role.id !== deleting?.id));
        setDeleting(null);
      }}
      actionError={error}
      onDismissError={() => setError(undefined)}
    />
  );
}
