"use client";

import { LockSimple } from "@phosphor-icons/react";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

type ForbiddenStateProps = {
  /** بدونه لا يظهر زر «العودة للرئيسية». */
  onGoHome?: () => void;
  className?: string;
};

/** لا صلاحية لهذه الصفحة (DESIGN.md 9.18). للكيان خارج النطاق تُستعمل NotFoundState. */
export function ForbiddenState({ onGoHome, className }: ForbiddenStateProps) {
  return (
    <EmptyState
      icon={LockSimple}
      title="لا تملك صلاحية لهذه الصفحة"
      className={className}
      action={
        onGoHome ? (
          <Button variant="secondary" onClick={onGoHome}>
            العودة للرئيسية
          </Button>
        ) : undefined
      }
    />
  );
}
