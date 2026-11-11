"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { CheckCircle, Info, WarningCircle, type Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow, useCaptureClass } from "@/lib/design/CaptureMode";

// الإشعار العابر (DESIGN.md 9.11): أسفل البداية (أسفل يمين) على المكتب، وأعلى الشاشة على الموبايل. يختفي بعد 5 ثوانٍ ويبقى إن مرّ عليه المؤشر.
// للتأكيد بعد النجاح («اعتُمد الصرف») ولأخطاء الإجراء العامة (forbidden، too_many_requests). التوقيت والتوقف بالمرور من Base UI.

export type ToastKind = "success" | "danger" | "info";

const kindIcon: Record<ToastKind, Icon> = { success: CheckCircle, danger: WarningCircle, info: Info };
const kindColor: Record<ToastKind, string> = { success: "text-success", danger: "text-danger", info: "text-info" };

const actionClass =
  "flex h-8 shrink-0 items-center rounded-md px-3 text-label font-medium text-fg outline-none transition-colors duration-120 ease-out " +
  "hover:bg-surface-sunken active:bg-border focus-visible:ring-2 focus-visible:ring-focus";

type ToastViewProps = {
  kind: ToastKind;
  /** نص سطر واحد. */
  message: ReactNode;
  /** الإجراء («عرض»): زر بـ `actionClass`. */
  action?: ReactNode;
  className?: string;
};

/** شكل الإشعار وحده. يستعمله ToastProvider فعلاً، ويعرضه المعرض ثابتاً. */
export function ToastView({ kind, message, action, className }: ToastViewProps) {
  const KindIcon = kindIcon[kind];
  return (
    <CaptureRow className={cn("w-full items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-overlay", className)}>
      <KindIcon size={20} aria-hidden="true" className={cn("shrink-0", kindColor[kind])} />
      <div className="min-w-0 flex-1 text-body text-fg">{message}</div>
      {action}
    </CaptureRow>
  );
}

/** نص زر الإجراء الجاهز لمن يرسم ToastView يدوياً. */
export const toastActionClass = actionClass;

function ToastViewport() {
  const { toasts } = BaseToast.useToastManager();
  // أسفل البداية على المكتب: start يميناً في RTL، وفي الالتقاط (LTR) يُقلب.
  const edge = useCaptureClass("@tablet:start-6", "@tablet:end-6");

  return (
    // غلاف fixed بحجم المضيف (OverlayHost أو النافذة) ليحمل @container، فيعمل التابلت على عرضه لا عرض النافذة.
    <div className="pointer-events-none fixed inset-0 z-60 @container">
      <BaseToast.Viewport
        className={cn(
          "pointer-events-none absolute inset-x-4 top-4 flex flex-col gap-2 @tablet:inset-x-auto @tablet:top-auto @tablet:bottom-6 @tablet:w-96",
          edge,
        )}
      >
        {toasts.map((toast) => {
          const kind = (toast.type as ToastKind | undefined) ?? "info";
          return (
            <BaseToast.Root
              key={toast.id}
              toast={toast}
              className="pointer-events-auto transition-[opacity,scale] duration-200 ease-out data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:scale-100"
            >
              <ToastView
                kind={kind}
                message={<BaseToast.Title />}
                action={toast.actionProps ? <BaseToast.Action className={actionClass} /> : undefined}
              />
            </BaseToast.Root>
          );
        })}
      </BaseToast.Viewport>
    </div>
  );
}

/** في جذر التطبيق (داخل OverlayHost). يرسم منطقة الإشعارات بعد أبنائه. */
export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <DirectionProvider direction="rtl">
      <BaseToast.Provider limit={3}>
        {children}
        <ToastViewport />
      </BaseToast.Provider>
    </DirectionProvider>
  );
}

type ToastInput = {
  kind: ToastKind;
  message: string;
  /** إجراء اختياري: «عرض». */
  action?: { label: string; onClick: () => void };
};

/** `const toast = useToast(); toast.show({ kind: "success", message: "اعتُمد الصرف" })`. داخل ToastProvider. */
export function useToast() {
  const manager = BaseToast.useToastManager();
  return {
    show: ({ kind, message, action }: ToastInput) =>
      manager.add({
        title: message,
        type: kind,
        // الخطأ يُعلن فوراً لقارئ الشاشة، والنجاح بهدوء.
        priority: kind === "danger" ? "high" : "low",
        actionProps: action ? { children: action.label, onClick: action.onClick } : undefined,
      }),
  };
}
