"use client";

import { FileDashed } from "@phosphor-icons/react";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

type NotFoundStateProps = {
  /** بدونه لا يظهر زر «رجوع». */
  onBack?: () => void;
  className?: string;
};

/** `not_found` في العقد يشمل «غير موجود» و«خارج نطاقك» معاً (DESIGN.md 9.18)، فالرسالة تقولهما معاً. */
export function NotFoundState({ onBack, className }: NotFoundStateProps) {
  return (
    <EmptyState
      icon={FileDashed}
      title="العنصر غير موجود أو خارج نطاقك"
      className={className}
      action={
        onBack ? (
          <Button variant="secondary" onClick={onBack}>
            رجوع
          </Button>
        ) : undefined
      }
    />
  );
}
