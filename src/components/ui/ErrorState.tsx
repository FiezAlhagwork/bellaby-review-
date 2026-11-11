"use client";

import { ArrowsClockwise, WarningCircle } from "@phosphor-icons/react";
import { errorMessage } from "@/lib/api/error-messages";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

type ErrorStateProps = {
  /** رمز الخطأ من العقد (`code`). النص المعروض من error-messages.ts. */
  code: string;
  /** بدونه لا يظهر زر «إعادة المحاولة». */
  onRetry?: () => void;
  /** الطلب يُعاد الآن: الزر يحمّل. */
  retrying?: boolean;
  className?: string;
};

/** خطأ تحميل المكان الذي كان فيه المحتوى (DESIGN.md 9.18، 11.4): «تعذّر تحميل البيانات» وسببه وإعادة المحاولة. */
export function ErrorState({ code, onRetry, retrying = false, className }: ErrorStateProps) {
  return (
    <EmptyState
      role="alert"
      tone="danger"
      icon={WarningCircle}
      title="تعذّر تحميل البيانات"
      description={errorMessage(code)}
      className={className}
      action={
        onRetry ? (
          <Button variant="secondary" icon={ArrowsClockwise} loading={retrying} onClick={onRetry}>
            إعادة المحاولة
          </Button>
        ) : undefined
      }
    />
  );
}
