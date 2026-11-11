"use client";

import { type ReactNode } from "react";
import { errorMessage } from "@/lib/api/error-messages";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { isolate } from "@/lib/format";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";

// الأجزاء المرئية المشتركة بين Select وCombobox (DESIGN.md 9.5): خيار، لوحة القائمة، وحالاتها (تحميل، لا نتائج، خطأ).
// كل شيء هنا عرض فقط. السلوك (فتح، تنقل بالأسهم، تحديد) من Base UI داخل Select وCombobox.

/** خيار في قائمة. المعطّل يحمل سببه إلزامياً (DESIGN.md 9.5: «الخيار المعطّل يظهر ولا يُختار، ومعه سببه»). */
export type Option<V extends string = string> = { value: V; label: string } & (
  | { disabled?: false; reason?: never }
  | { disabled: true; reason: string }
);

/** حالة تحميل الخيارات: لا شيء = جاهزة. */
export type OptionsState =
  | { status: "ready" }
  | { status: "loading" }
  | { status: "error"; code: string; onRetry?: () => void };

/** مظهر ما يطفو (قائمة، تقويم): حد وخلفية وظل raised وحركة 200ms. يشترك به Select وCombobox وكل المنتقيات. */
export const floatingPanelClass =
  "overflow-hidden rounded-md border border-border bg-surface text-body text-fg shadow-raised outline-none " +
  "transition-[opacity,scale] duration-200 ease-out data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 " +
  "motion-reduce:transition-opacity motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:scale-100";

// لوحة القائمة: بعرض الحقل على الأقل (متغيّر الموضع من Base UI، وهو الاستثناء الوحيد عن القيم الجاهزة). ارتفاع القائمة الأقصى في optionListClass.
export const optionPopupClass = `min-w-(--anchor-width) ${floatingPanelClass}`;

export const optionListClass = "max-h-80 overflow-y-auto py-1 outline-none";

// الإبراز بالتمرير أو لوحة المفاتيح (data-highlighted) غير المختار. المختار بـ primary-soft وعلامة Check في النهاية.
export const optionClass =
  "flex min-h-10 cursor-pointer select-none items-center gap-2 px-3 py-2 outline-none " +
  "data-highlighted:bg-surface-sunken data-selected:not-data-highlighted:bg-primary-soft " +
  "data-disabled:cursor-not-allowed data-disabled:bg-transparent data-disabled:text-fg-disabled";

type OptionContentProps = {
  /** نص الخيار (Select يغلّفه بـ Select.ItemText). */
  label: ReactNode;
  /** سبب التعطيل: سطر text-caption تحت الاسم. */
  reason?: string;
  /** علامة Check للمختار (ItemIndicator). تُحجز مساحتها دائماً فلا يتحرك النص. */
  indicator?: ReactNode;
};

/** داخل الخيار: النص (وسببه إن كان معطّلاً) في البداية، وعلامة الاختيار في النهاية. */
export function OptionContent({ label, reason, indicator }: OptionContentProps) {
  return (
    <CaptureRow className="min-w-0 flex-1 items-center gap-2">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{label}</span>
        {reason ? <span className="text-caption text-fg-muted">{reason}</span> : null}
      </span>
      <span className="flex size-4 shrink-0 items-center justify-center">{indicator}</span>
    </CaptureRow>
  );
}

/** تحميل الخيارات: 3 أسطر Skeleton بشكل الخيارات. */
export function OptionsLoading() {
  return (
    <div role="status" aria-label="جارٍ تحميل الخيارات" className="flex flex-col gap-3 p-3">
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-2/3" />
    </div>
  );
}

/** لا نتائج: «لا نتائج لـ "حليب 3"»، أو «لا خيارات» حين لا بحث. النص المبحوث عنه معزول اتجاهياً. */
export function OptionsEmpty({ query }: { query?: string }) {
  return (
    <p className="px-3 py-4 text-center text-body text-fg-muted">
      {query ? `لا نتائج لـ ${isolate(`"${query}"`)}` : "لا خيارات متاحة."}
    </p>
  );
}

/** خطأ التحميل: سطر بالرسالة من error-messages.ts مع «إعادة المحاولة». */
export function OptionsError({ code, onRetry }: { code: string; onRetry?: () => void }) {
  return (
    <CaptureRow role="alert" className="items-center gap-2 px-3 py-2">
      <p className="min-w-0 flex-1 text-label text-danger">{errorMessage(code)}</p>
      {onRetry ? (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      ) : null}
    </CaptureRow>
  );
}

/** حالة التحميل أو الخطأ بدل الخيارات. null حين تكون الخيارات جاهزة. */
export function OptionsStatus({ state }: { state: OptionsState | undefined }) {
  if (state?.status === "loading") return <OptionsLoading />;
  if (state?.status === "error") return <OptionsError code={state.code} onRetry={state.onRetry} />;
  return null;
}
