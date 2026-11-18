"use client";

import { useState } from "react";
import { ListsView, type ListEntryForm } from "@/features/settings/views/ListsView";
import type { ListEntry, ListKey } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { lists as initialLists } from "@/mocks/settings";

// غلاف تفاعلي لصفحة الرسم (E14): يملك القوائم والنافذة. الإضافة والتعديل والتعطيل محلياً كما تفعل POST وPATCH /lists/{key}.
// تعطيل قيمة نظامية يرجع 409 system_entry_locked (القائمة تمنعه أصلاً؛ الحالة المرسومة تُظهر الشريط). لا يُنقل للإنتاج.

type ListsDemoProps = { initialForm?: ListEntryForm | null; initialError?: string; mode?: "ready" | "loading" | "error" | "empty" };

export function ListsDemo({ initialForm = null, initialError, mode = "ready" }: ListsDemoProps) {
  const [listKey, setListKey] = useState<ListKey>("return_reasons");
  const [all, setAll] = useState<Record<ListKey, readonly ListEntry[]>>(initialLists);
  const [form, setForm] = useState<ListEntryForm | null>(initialForm);
  const [error, setError] = useState(initialError);

  const rows = all[listKey];
  const entries: Loadable<readonly ListEntry[]> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: mode === "empty" ? [] : rows };
  const update = (next: readonly ListEntry[]) => setAll({ ...all, [listKey]: [...next].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) });

  return (
    <ListsView
      listKey={listKey}
      onListKeyChange={(key) => {
        setListKey(key);
        setError(undefined);
      }}
      entries={entries}
      canManage
      form={form}
      onFormChange={setForm}
      onSubmit={() => {
        if (!form) return;
        const name = form.name.trim();
        if (form.mode === "edit") update(rows.map((row) => (row.id === form.entry.id ? { ...row, name, order: form.order ?? row.order } : row)));
        else update([...rows, { id: Math.max(0, ...rows.map((row) => row.id ?? 0)) + 1, name, order: form.order ?? rows.length + 1, is_active: true, is_system: false }]);
        setForm(null);
      }}
      onToggleActive={(entry) => {
        if (entry.is_system) {
          setError("system_entry_locked");
          return;
        }
        update(rows.map((row) => (row.id === entry.id ? { ...row, is_active: !row.is_active } : row)));
      }}
      actionError={error}
      onDismissError={() => setError(undefined)}
    />
  );
}
