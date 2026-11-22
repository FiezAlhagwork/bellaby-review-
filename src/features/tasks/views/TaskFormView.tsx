"use client";

import { UsersThree } from "@phosphor-icons/react";
import { statusMap } from "@/components/data/status-map";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { DatePicker } from "@/components/ui/DatePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { FileUpload, type FileRejection, type UploadFile } from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/Input";
import type { Option } from "@/components/ui/OptionList";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { Priority, UserRef } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** نموذج `POST /tasks` (`TaskInput`). الموعد يوم، ويُرسل `due_at` نهايته بتوقيت دمشق (§99). */
export type TaskForm = { assigneeId: string | null; title: string; description: string; dueOn: IsoDate | null; priority: Priority; attachments: UploadFile[] };
export const emptyTaskForm: TaskForm = { assigneeId: null, title: "", description: "", dueOn: null, priority: "NORMAL", attachments: [] };

type TaskFormViewProps = {
  /** `GET /me/assignees`: فارغة لمن لا فريق له. */
  assignees: Loadable<readonly UserRef[]>;
  form: TaskForm;
  onFormChange: (form: TaskForm) => void;
  onFilesSelect: (files: File[]) => void;
  onFilesReject?: (rejections: FileRejection[]) => void;
  today: IsoDate;
  /** `errors` من `validation_failed` (ومنها `assignee_not_allowed` تحت المكلَّف). */
  errors?: Readonly<Record<string, string>>;
  submitError?: string;
  submitting?: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

const TITLE_MAX = 200;
const attachmentLimits = { accept: "application/pdf,image/*,.xlsx,.docx", acceptLabel: "PDF أو صورة أو Word أو Excel", maxSize: 10 * 1024 * 1024 } as const;
const priorities: Priority[] = ["LOW", "NORMAL", "HIGH"];

/**
 * إسناد مهمة (G08): المكلَّف من التبعية المباشرة (`/me/assignees`)، والعنوان، والوصف، والموعد، والأولوية، والمرفقات.
 * من لا فريق له يرى «لا مكلَّفين لك حالياً» بدل النموذج (القرار 12).
 */
export function TaskFormView({ assignees, form, onFormChange, onFilesSelect, onFilesReject, today, errors = {}, submitError, submitting = false, onSubmit, onCancel }: TaskFormViewProps) {
  const set = (patch: Partial<TaskForm>) => onFormChange({ ...form, ...patch });
  const list = assignees.status === "ready" ? assignees.data : [];
  const options: Option[] = list.flatMap((user) => (user.id === undefined ? [] : [{ value: String(user.id), label: user.name ?? "" }]));

  const disabledReason =
    form.assigneeId === null
      ? "اختر المكلَّف."
      : form.title.trim() === ""
        ? "اكتب عنوان المهمة."
        : form.dueOn === null
          ? "اختر الموعد."
          : form.attachments.some((file) => file.status === "uploading")
            ? "انتظر انتهاء رفع المرفقات."
            : null;

  if (assignees.status === "ready" && list.length === 0) {
    return (
      <>
        <PageHeader title="إسناد مهمة" />
        <Card>
          <EmptyState
            icon={UsersThree}
            title="لا مكلَّفين لك حالياً"
            description="تُسند المهام إلى من يتبعك مباشرة، ولا أحد يتبعك الآن."
            action={
              <Button variant="secondary" onClick={onCancel}>
                رجوع إلى المهام
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="إسناد مهمة" description="تصل المهمة إلى المكلَّف «جديدة»، فيبدأها ثم يسلّمها لك." />

      <div className="flex flex-col gap-4">
        {submitError ? (
          <Banner kind="danger" title="تعذّر إسناد المهمة">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Card title="المهمة">
          <div className="flex flex-col gap-4">
            <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
              <Field label="المكلَّف" required error={errors.assignee_id} hint="من يتبعك مباشرة.">
                <Combobox aria-label="المكلَّف" placeholder="اختر المكلَّف" options={options} value={form.assigneeId} onValueChange={(assigneeId) => set({ assigneeId })} disabled={submitting || assignees.status !== "ready"} />
              </Field>
              <Field label="الموعد" required error={errors.due_at} hint="نهاية اليوم المختار.">
                <DatePicker aria-label="الموعد" value={form.dueOn} onValueChange={(dueOn) => set({ dueOn })} min={today} today={today} disabled={submitting} />
              </Field>
            </Grid>
            <Field label="العنوان" required error={errors.title} hint={`حتى ${isolate(TITLE_MAX)} حرف.`}>
              <Input value={form.title} maxLength={TITLE_MAX} onChange={(event) => set({ title: event.target.value })} placeholder="جرد رف العينات" disabled={submitting} />
            </Field>
            <Field label="الوصف" optional error={errors.description}>
              <Textarea value={form.description} onChange={(event) => set({ description: event.target.value })} placeholder="ما المطلوب بالضبط، وما يُسلَّم في النهاية." disabled={submitting} />
            </Field>
            <Field label="الأولوية" error={errors.priority}>
              <SegmentedControl aria-label="الأولوية" options={priorities.map((value) => ({ value, label: statusMap.priority[value].label }))} value={form.priority} onValueChange={(priority) => set({ priority })} disabled={submitting} />
            </Field>
            <Field label="المرفقات" optional hint={`${attachmentLimits.acceptLabel}.`} error={errors.attachments}>
              <FileUpload multiple files={form.attachments} accept={attachmentLimits.accept} acceptLabel={attachmentLimits.acceptLabel} maxSize={attachmentLimits.maxSize} onSelect={onFilesSelect} onReject={onFilesReject} onRemove={(id) => set({ attachments: form.attachments.filter((file) => file.id !== id) })} disabled={submitting} />
            </Field>
          </div>
        </Card>

        <div className="flex flex-col gap-2">
          {disabledReason ? <p className="text-label text-fg-muted">{disabledReason}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" loading={submitting} disabled={disabledReason !== null} onClick={onSubmit}>
              إسناد المهمة
            </Button>
            <Button variant="secondary" disabled={submitting} onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
