"use client";

import { useState } from "react";
import { ExpenseCategoriesView, type CategoryForm } from "@/features/budgets/views/ExpenseCategoriesView";
import type { ExpenseCategory } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { expenseCategories } from "@/mocks/finance";

// غلاف تفاعلي لصفحة الرسم (E04): يملك القائمة والنافذة. الإضافة والتعديل والتعطيل محلياً كما تفعل POST وPATCH /expense-categories. لا يُنقل للإنتاج.

type CategoriesDemoProps = { initialForm?: CategoryForm | null; mode?: "ready" | "loading" | "error" | "empty" };

export function CategoriesDemo({ initialForm = null, mode = "ready" }: CategoriesDemoProps) {
  const [rows, setRows] = useState<readonly ExpenseCategory[]>(expenseCategories);
  const [form, setForm] = useState<CategoryForm | null>(initialForm);
  const [name, setName] = useState(initialForm?.mode === "rename" ? (initialForm.category.name ?? "") : "");

  const categories: Loadable<readonly ExpenseCategory[]> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: mode === "empty" ? [] : rows };

  return (
    <ExpenseCategoriesView
      categories={categories}
      canManage
      form={form}
      name={name}
      onNameChange={setName}
      onOpenForm={(next) => {
        setForm(next);
        setName(next?.mode === "rename" ? (next.category.name ?? "") : "");
      }}
      onSubmit={() => {
        const trimmed = name.trim();
        if (form?.mode === "rename") setRows(rows.map((row) => (row.id === form.category.id ? { ...row, name: trimmed } : row)));
        else setRows([...rows, { id: Math.max(0, ...rows.map((row) => row.id ?? 0)) + 1, name: trimmed, kind: "ENTERED", is_active: true, is_system: false }]);
        setForm(null);
      }}
      onToggleActive={(category) => setRows(rows.map((row) => (row.id === category.id ? { ...row, is_active: !row.is_active } : row)))}
      onBack={() => {}}
    />
  );
}
