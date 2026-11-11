"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { X } from "@phosphor-icons/react";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { IconButton } from "./IconButton";
import { useOverlay } from "./OverlayHost";

// النافذة (DESIGN.md 9.12): في الوسط بعرض 480 (sm) أو 640 (md) أو 880 (lg) على التابلت وما فوقه، وعلى الموبايل ورقة سفلية بعرض الإطار.
// القياس من @container الطبقة نفسها: عرض OverlayHost الذي تُرسم فيه، أو عرض النافذة إن لم يوجد مضيف.

export type DialogSize = "sm" | "md" | "lg";

const sizeClass: Record<DialogSize, string> = {
  sm: "@tablet:w-120",
  md: "@tablet:w-160",
  lg: "@tablet:w-220",
};

// الظهور 240ms (DESIGN.md 7): الورقة تصعد من الأسفل، والنافذة تتلاشى مع تكبير من 96% إلى 100%. تحت reduced-motion: تلاشٍ فقط.
const sheetMotion =
  "transition-[opacity,translate,scale] duration-240 ease-out data-starting-style:translate-y-full data-ending-style:translate-y-full " +
  "motion-reduce:data-starting-style:translate-y-0 motion-reduce:data-ending-style:translate-y-0 motion-reduce:data-starting-style:opacity-0 motion-reduce:data-ending-style:opacity-0";

const dialogMotion =
  "@tablet:data-starting-style:translate-y-0 @tablet:data-ending-style:translate-y-0 @tablet:data-starting-style:scale-96 @tablet:data-ending-style:scale-96 " +
  "@tablet:data-starting-style:opacity-0 @tablet:data-ending-style:opacity-0";

const layerClass = "fixed inset-0 z-50 @container";

function layerRowClass(sheet: boolean) {
  return cn("flex h-full justify-center", sheet ? "items-end" : "items-end @tablet:items-center @tablet:px-4");
}

type DialogLayerProps = { sheet?: boolean; children: ReactNode };

/** طبقة موضع النافذة (تحتها الخلفية). تُستعمل في المعرض لعرض نافذة ثابتة داخل إطار، ويستعمل Dialog مثلها. */
export function DialogLayer({ sheet = false, children }: DialogLayerProps) {
  return (
    <div className={layerClass}>
      <div className={layerRowClass(sheet)}>{children}</div>
    </div>
  );
}

type DialogSurfaceProps = {
  title: string;
  description?: string;
  /** أزرار الإجراءات في التذييل، في النهاية: الإلغاء ثم الأساسي. مصفوفة بمفاتيح (لا Fragment) فيعكسها وضع الالتقاط. */
  actions?: readonly ReactElement[];
  children?: ReactNode;
  size?: DialogSize;
  /** ورقة سفلية في كل المقاسات (BottomSheet). الافتراضي: ورقة على الموبايل ونافذة من التابلت. */
  sheet?: boolean;
  closeLabel?: string;
  /** زر الإغلاق في الرأس. بدونه (والنافذة ثابتة) لا يظهر. */
  onClose?: () => void;
  /** داخل Dialog حقيقي: العنوان والوصف والإغلاق بأجزاء Base UI (ربط aria). خارجه شكل ثابت. */
  live?: boolean;
  className?: string;
};

/** وجه النافذة: مقبض (ورقة)، رأس بعنوان وإغلاق، جسم يمرّر، تذييل إجراءات. شكل فقط، والسلوك في Dialog. */
export function DialogSurface({
  title,
  description,
  actions,
  children,
  size = "sm",
  sheet = false,
  closeLabel = "إغلاق",
  onClose,
  live = false,
  className,
}: DialogSurfaceProps) {
  // الوجه نفسه هو Popup في الحالة الحية، فينسب max-h-9/10 إلى طبقة ارتفاعها محدّد (h-full) فيعمل التمرير داخل الجسم.
  const Root = live ? BaseDialog.Popup : "div";
  const Title = live ? BaseDialog.Title : "h2";
  const Description = live ? BaseDialog.Description : "p";
  const closeButton = <IconButton variant="ghost" icon={X} aria-label={closeLabel} onClick={live ? undefined : onClose} />;

  return (
    <Root
      className={cn(
        "flex max-h-9/10 w-full flex-col overflow-hidden bg-surface shadow-overlay outline-none",
        sheet ? "rounded-t-xl" : cn("rounded-t-xl @tablet:rounded-xl", sizeClass[size]),
        live && (sheet ? sheetMotion : cn(sheetMotion, dialogMotion)),
        className,
      )}
    >
      <div aria-hidden="true" className={cn("mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong", !sheet && "@tablet:hidden")} />
      <CaptureRow className="shrink-0 items-start gap-4 px-4 pt-4 pb-3 @tablet:px-6 @tablet:pt-5">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Title className="text-h2 font-semibold text-fg">{title}</Title>
          {description ? <Description className="text-body text-fg-muted">{description}</Description> : null}
        </div>
        {live ? <BaseDialog.Close render={closeButton} /> : onClose ? closeButton : null}
      </CaptureRow>
      {children ? <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 @tablet:px-6">{children}</div> : null}
      {actions ? (
        <CaptureRow className="shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-3 @tablet:px-6 @tablet:py-4">{actions}</CaptureRow>
      ) : null}
    </Root>
  );
}

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: DialogSize;
  actions?: readonly ReactElement[];
  children?: ReactNode;
  /** false: لا يُغلق بالضغط خارجها ولا بـ Esc (أثناء تنفيذ إجراء). زر الإغلاق يبقى لمن يمرّر onOpenChange يقبله. */
  dismissible?: boolean;
  closeLabel?: string;
  /**
   * للمعرض: يرسم النافذة ثابتة في مكانها (خلفية ووجه) بلا Base UI، فلا تحبس تركيزاً ولا تقفل تمرير الصفحة،
   * ويمكن عرض عدة نوافذ مفتوحة معاً داخل OverlayHost. `open` يُهمل.
   */
  preview?: boolean;
  className?: string;
};

type DialogInternalProps = DialogProps & { sheet?: boolean };

/**
 * النافذة المنبثقة. controlled بـ `open` و`onOpenChange`. تحبس التركيز وتقفل تمرير الصفحة وتغلق بـ Esc (Base UI).
 * ترسم نفسها في OverlayHost الأقرب (فتبقى داخل إطارها)، وإلا في body. للإجراءات التي تحتاج تأكيداً: ConfirmDialog وReasonDialog.
 */
export function Dialog({ open, onOpenChange, dismissible = true, sheet = false, preview = false, ...surface }: DialogInternalProps) {
  const { container } = useOverlay();

  if (preview) {
    return (
      <>
        <div aria-hidden="true" className="fixed inset-0 z-50 bg-overlay" />
        <DialogLayer sheet={sheet}>
          <DialogSurface sheet={sheet} {...surface} onClose={() => onOpenChange(false)} />
        </DialogLayer>
      </>
    );
  }

  return (
    <DirectionProvider direction="rtl">
      <BaseDialog.Root
        open={open}
        onOpenChange={(next, details) => {
          if (!next && !dismissible && (details.reason === "outside-press" || details.reason === "escape-key")) return;
          onOpenChange(next);
        }}
      >
        <BaseDialog.Portal container={container ?? undefined}>
          <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-overlay transition-opacity duration-240 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0" />
          <BaseDialog.Viewport className={layerClass}>
            <div className={layerRowClass(sheet)}>
              <DialogSurface live sheet={sheet} {...surface} />
            </div>
          </BaseDialog.Viewport>
        </BaseDialog.Portal>
      </BaseDialog.Root>
    </DirectionProvider>
  );
}

/** ورقة سفلية بعرض الإطار في كل المقاسات: منتقيات الموبايل، وفلاتر «فلاتر (3)». نفس Dialog بشكل الورقة. */
export function BottomSheet(props: Omit<DialogProps, "size">) {
  return <Dialog {...props} sheet />;
}
