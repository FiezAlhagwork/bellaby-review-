"use client";

import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Field } from "./Field";
import { Textarea } from "./Textarea";

type ReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** سؤال: «رفض الطلب؟». */
  title: string;
  /** جملة تشرح الأثر. */
  description: string;
  /** اسم الإجراء بصيغة المصدر: «رفض»، «إيقاف الدفعة»، «إرجاع الجرد». */
  confirmLabel: string;
  cancelLabel?: string;
  /** نص السبب. controlled: يُصفَّر من الأب عند الفتح. */
  reason: string;
  onReasonChange: (reason: string) => void;
  reasonLabel?: string;
  placeholder?: string;
  /** رسالة خطأ السبب من الخادم (`validation_failed` في `errors.reason`) كما هي. */
  error?: string;
  danger?: boolean;
  loading?: boolean;
  /** يُستدعى والسبب غير فارغ فقط. */
  onConfirm: () => void;
  /** للمعرض: نافذة ثابتة بلا Base UI (انظر Dialog). */
  preview?: boolean;
};

/**
 * نافذة السبب (DESIGN.md 9.12): كنافذة التأكيد مع Textarea إلزامي «السبب». الزر معطّل حتى يُكتب السبب، ومعه سببه ظاهر (نص مساعد).
 * نافذة واحدة لكل إجراء يحتاج سبباً في العقد: الرفض، الإيقاف وفكّه، الإلغاء، الإغلاق بقرار، إرجاع الجرد، التعطيل، رفع الحظر.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "إلغاء",
  reason,
  onReasonChange,
  reasonLabel = "السبب",
  placeholder = "اكتب السبب",
  error,
  danger = false,
  loading = false,
  onConfirm,
  preview = false,
}: ReasonDialogProps) {
  const empty = reason.trim() === "";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next);
      }}
      dismissible={!loading}
      size="sm"
      preview={preview}
      title={title}
      description={description}
      actions={[
        <Button key="cancel" variant="secondary" disabled={loading} className="flex-1 @tablet:flex-none" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>,
        <Button
          key="confirm"
          variant={danger ? "danger" : "primary"}
          loading={loading}
          disabled={empty}
          className="flex-1 @tablet:flex-none"
          onClick={() => {
            if (!empty) onConfirm();
          }}
        >
          {confirmLabel}
        </Button>,
      ]}
    >
      <Field label={reasonLabel} required error={error} hint={empty ? `اكتب ${reasonLabel} ليُفعَّل زر «${confirmLabel}».` : undefined} disabled={loading}>
        <Textarea value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder={placeholder} />
      </Field>
    </Dialog>
  );
}
