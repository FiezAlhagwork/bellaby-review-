"use client";

import { useState } from "react";
import { emptyTaskForm, TaskFormView, type TaskForm } from "@/features/tasks/views/TaskFormView";
import { ramiAssignees, tasksNow } from "@/mocks/tasks";

// غلاف تفاعلي لصفحة الرسم (G08): يملك النموذج. GET /me/assignees ثم POST /uploads وPOST /tasks، محلياً. لا يُنقل للإنتاج.

type NewTaskDemoProps = { initialForm?: TaskForm; errors?: Readonly<Record<string, string>>; noAssignees?: boolean };

export function NewTaskDemo({ initialForm = emptyTaskForm, errors, noAssignees = false }: NewTaskDemoProps) {
  const [form, setForm] = useState<TaskForm>(initialForm);

  return (
    <TaskFormView
      assignees={{ status: "ready", data: noAssignees ? [] : ramiAssignees }}
      form={form}
      onFormChange={setForm}
      onFilesSelect={(files) => setForm({ ...form, attachments: [...form.attachments, ...files.map((file, index) => ({ id: `up-${form.attachments.length + index}`, name: file.name, size: file.size, status: "done" as const }))] })}
      today={tasksNow.slice(0, 10)}
      errors={errors}
      onSubmit={() => {}}
      onCancel={() => {}}
    />
  );
}
