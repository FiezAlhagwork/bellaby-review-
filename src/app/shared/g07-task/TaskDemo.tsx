"use client";

import { useState } from "react";
import { emptyResolveForm, TaskDetailsView, type ReassignForm, type ResolveForm, type SubmitForm } from "@/features/tasks/views/TaskDetailsView";
import type { Task } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { ramiAssignees, rami, taskAt, tasksNow, ziad } from "@/mocks/tasks";

// غلاف تفاعلي لصفحة الرسم (G07): يملك المهمة ونوافذها. start وsubmissions وdecision وreassign وresolve محلياً. لا يُنقل للإنتاج.

type TaskDemoProps = {
  state: Parameters<typeof taskAt>[0];
  role: "assignee" | "assigner" | "executive" | "delegate";
  initialSubmit?: boolean;
  initialReassign?: boolean;
  initialActionError?: string;
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function TaskDemo({ state, role, initialSubmit = false, initialReassign = false, initialActionError, mode = "ready" }: TaskDemoProps) {
  const [data, setData] = useState<Task>(() => taskAt(state));
  const [submit, setSubmit] = useState<SubmitForm | null>(initialSubmit ? { note: "", attachments: [] } : null);
  const [reject, setReject] = useState<string | null>(null);
  const [reassign, setReassign] = useState<ReassignForm | null>(initialReassign ? { assigneeId: null, reason: "" } : null);
  const [resolve, setResolve] = useState<ResolveForm>(emptyResolveForm);
  const blocked = initialActionError !== undefined;

  const loadable: Loadable<Task> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data };
  const submissions = data.submissions ?? [];

  return (
    <TaskDetailsView
      task={loadable}
      isAssignee={role === "assignee"}
      isAssigner={role === "assigner"}
      canResolveOverdue={role === "executive" || role === "delegate"}
      canDeduct={role === "executive"}
      onStart={() => !blocked && setData({ ...data, status: "IN_PROGRESS" })}
      submit={submit}
      onSubmitChange={setSubmit}
      onSubmitFiles={(files) => submit && setSubmit({ ...submit, attachments: [...submit.attachments, ...files.map((file, index) => ({ id: `up-${submit.attachments.length + index}`, name: file.name, size: file.size, status: "done" as const }))] })}
      onConfirmSubmit={() => {
        if (!submit || blocked) return;
        const attachments = submit.attachments.map((file) => ({ upload_id: file.id, url: "#", name: file.name, mime: "application/pdf" }));
        setData({ ...data, status: "SUBMITTED", submissions: [...submissions, { id: 90 + submissions.length, note: submit.note.trim() || null, attachments, submitted_at: tasksNow, decision: null, reject_reason: null, decided_by: null, decided_at: null }] });
        setSubmit(null);
      }}
      onAccept={(entry) => {
        if (blocked) return;
        setData({ ...data, status: "APPROVED", on_time: true, submissions: submissions.map((item) => (item.id === entry.id ? { ...item, decision: "ACCEPTED", decided_by: rami, decided_at: tasksNow } : item)) });
      }}
      rejectReason={reject}
      onRejectReasonChange={setReject}
      onConfirmReject={() => {
        if (blocked || !reject?.trim()) return;
        setData({ ...data, status: "IN_PROGRESS", submissions: submissions.map((item) => (item.decision === null ? { ...item, decision: "REJECTED", reject_reason: reject.trim(), decided_by: rami, decided_at: tasksNow } : item)) });
        setReject(null);
      }}
      reassign={reassign}
      onReassignChange={setReassign}
      assignees={ramiAssignees}
      onConfirmReassign={() => {
        if (!reassign || blocked) return;
        const to = ramiAssignees.find((user) => String(user.id) === reassign.assigneeId);
        setData({ ...data, status: "NEW", assignee: to, reassignments: [...(data.reassignments ?? []), { from: data.assignee, to, reason: reassign.reason.trim(), by: rami, at: tasksNow }] });
        setReassign(null);
      }}
      resolve={resolve}
      onResolveChange={setResolve}
      onConfirmResolve={() => {
        if (blocked || resolve.action === null || resolve.action === "NONE") return;
        const deduct = resolve.action !== "CLOSE";
        setData({
          ...data,
          status: resolve.action === "DEDUCT" ? data.status : "RESOLVED",
          is_overdue: resolve.action === "DEDUCT",
          resolution: { reason: resolve.reason.trim(), by: role === "delegate" ? { id: 6, name: "رنا الشامي" } : ziad, at: tasksNow, deduction_id: deduct ? 420 : null, on_behalf_of: role === "delegate" ? ziad : null },
        });
        setResolve(emptyResolveForm);
      }}
      actionError={initialActionError}
      onOpenRequest={() => {}}
      onOpenReport={() => {}}
      onDownload={() => {}}
      onBack={() => {}}
    />
  );
}
