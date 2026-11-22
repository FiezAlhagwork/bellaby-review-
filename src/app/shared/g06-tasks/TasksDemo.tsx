"use client";

import { useState } from "react";
import { noTaskFilters, TasksListView, type TaskScope } from "@/features/tasks/views/TasksListView";
import { assignedByRami, assignedToRami } from "@/mocks/tasks";

// غلاف تفاعلي لصفحة الرسم (G06): يملك التبويب والفلاتر، ويصفّي كما يفعل GET /tasks?scope&status&overdue&source. المستخدم رامي السيد (اللوجستي). لا يُنقل للإنتاج.

type TasksDemoProps = { initialScope?: TaskScope; overdueOnly?: boolean; mode?: "ready" | "loading" | "error" | "empty" };

export function TasksDemo({ initialScope = "assigned_to_me", overdueOnly = false, mode = "ready" }: TasksDemoProps) {
  const [scope, setScope] = useState<TaskScope>(initialScope);
  const [filters, setFilters] = useState({ ...noTaskFilters, overdueOnly });
  const source = mode === "empty" ? [] : scope === "assigned_to_me" ? assignedToRami : assignedByRami;
  const rows = source.filter((task) => (filters.status === null || task.status === filters.status) && (!filters.overdueOnly || task.is_overdue) && (filters.source === null || task.source === filters.source));

  return (
    <TasksListView
      tasks={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 15, total: rows.length } } }}
      scope={scope}
      onScopeChange={(next) => {
        setScope(next);
        setFilters(noTaskFilters);
      }}
      filters={filters}
      onFiltersChange={setFilters}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      canAssign
      onNewTask={() => {}}
      onOpenTask={() => {}}
    />
  );
}
