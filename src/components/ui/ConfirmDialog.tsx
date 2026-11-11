"use client";

import { Button } from "./Button";
import { Dialog } from "./Dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** سؤال: «إيقاف الدفعة؟». */
  title: string;
  /** جملة تشرح الأثر: ما الذي سيحدث ولمن. */
  description: string;
  /** اسم الإجراء بصيغة المصدر: «تأكيد» (الافتراضي) أو «إيقاف الدفعة». */
  confirmLabel?: string;
  cancelLabel?: string;
  /** إجراء لا رجعة فيه أو قرار سلبي: زر danger. */
  danger?: boolean;
  /** الطلب يُنفَّذ: الزر يحمّل، والإلغاء والإغلاق معطّلان فلا تُغلق النافذة قبل النتيجة. */
  loading?: boolean;
  onConfirm: () => void;
  /** للمعرض: نافذة ثابتة بلا Base UI (انظر Dialog). */
  preview?: boolean;
};

/**
 * نافذة التأكيد (DESIGN.md 9.12): عنوان سؤال، وجملة تشرح الأثر، وزرّان: «إلغاء» و«تأكيد» (أو danger بنص الإجراء).
 * الإغلاق بالنجاح من الأب: يضبط `open` على false بعد نجاح الطلب.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  danger = false,
  loading = false,
  onConfirm,
  preview = false,
}: ConfirmDialogProps) {
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
        <Button key="confirm" variant={danger ? "danger" : "primary"} loading={loading} className="flex-1 @tablet:flex-none" onClick={onConfirm}>
          {confirmLabel}
        </Button>,
      ]}
    />
  );
}
