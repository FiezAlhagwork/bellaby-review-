"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";

// غلاف كل حقل (DESIGN.md 9.3): التسمية فوق، ثم الإدخال، ثم سطر واحد تحته (مساعد أو خطأ).

type FieldControl = {
  id: string;
  /** معرّف التسمية: لمجموعات الخيارات (RadioGroup) التي لا يشير إليها htmlFor. */
  labelId: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
};

const FieldControlContext = createContext<FieldControl | null>(null);

/** يقرؤه الإدخال داخل Field: المعرّف وربط الرسالة وحالة الخطأ. خارج Field يرجع null. */
export const useFieldControl = () => useContext(FieldControlContext);

type FieldProps = {
  label: string;
  /** نجمة `*` بلون danger. الأكثر في الشاشة لا يُعلَّم. */
  required?: boolean;
  /** كلمة «(اختياري)» بلون fg-muted. */
  optional?: boolean;
  /** سطر مساعد تحت الإدخال. */
  hint?: string;
  /** رسالة الخطأ تحل محل المساعد، من الخادم كما هي أو من error-messages.ts. */
  error?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export function Field({ label, required = false, optional = false, hint, error, disabled = false, className, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const labelId = `${id}-label`;
  const message = error ?? hint;

  const control: FieldControl = {
    id,
    labelId,
    describedBy: message ? messageId : undefined,
    invalid: Boolean(error),
    required,
    disabled,
  };

  return (
    <FieldControlContext.Provider value={control}>
      <div className={cn("flex flex-col gap-2", className)}>
        {/* flex-1 لا justify-between: مع عنصر واحد (بلا «اختياري») يلتصق justify-between بالبداية في LTR. */}
        <CaptureRow className="items-center gap-2">
          <CaptureRow className="flex-1 items-center gap-1">
            <label id={labelId} htmlFor={id} className="text-label font-medium text-fg">
              {label}
            </label>
            {required ? (
              <span aria-hidden="true" className="text-label font-medium text-danger">
                *
              </span>
            ) : null}
          </CaptureRow>
          {optional ? <span className="text-label text-fg-muted">(اختياري)</span> : null}
        </CaptureRow>
        {children}
        {message ? (
          <p id={messageId} className={cn("text-label", error ? "text-danger" : "text-fg-muted")}>
            {message}
          </p>
        ) : null}
      </div>
    </FieldControlContext.Provider>
  );
}
