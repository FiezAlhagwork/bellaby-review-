"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { ArrowLeft, X } from "@phosphor-icons/react";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow, useCaptureClass } from "@/lib/design/CaptureMode";
import { IconButton } from "./IconButton";
import { useOverlay } from "./OverlayHost";

// الدرج (DESIGN.md 9.13): لوحة من البداية (يمين) بعرض 480 أو 640 وبارتفاع المضيف، لعرض تفاصيل عنصر دون مغادرة القائمة.
// على الموبايل شاشة كاملة بزر رجوع. اللوحة تلتصق بيمين المضيف في الوضعين (الالتقاط يعكس الصف ويبقيها يميناً)، فالإزاحة translate فيزيائية.

export type DrawerSize = "sm" | "md";

const sizeClass: Record<DrawerSize, string> = { sm: "@tablet:w-120", md: "@tablet:w-160" };

const motion =
  "transition-[opacity,translate] duration-240 ease-out data-starting-style:translate-x-full data-ending-style:translate-x-full " +
  "motion-reduce:data-starting-style:translate-x-0 motion-reduce:data-ending-style:translate-x-0 motion-reduce:data-starting-style:opacity-0 motion-reduce:data-ending-style:opacity-0";

const layerClass = "fixed inset-0 z-50 @container";

type DrawerSurfaceProps = {
  title: string;
  description?: string;
  actions?: readonly ReactElement[];
  children?: ReactNode;
  size?: DrawerSize;
  onClose?: () => void;
  live?: boolean;
  className?: string;
};

/** وجه الدرج: رأس (عنوان وإغلاق، وعلى الموبايل زر رجوع في البداية)، جسم يمرّر، تذييل إجراءات. */
export function DrawerSurface({ title, description, actions, children, size = "sm", onClose, live = false, className }: DrawerSurfaceProps) {
  const Root = live ? BaseDialog.Popup : "div";
  const Title = live ? BaseDialog.Title : "h2";
  const Description = live ? BaseDialog.Description : "p";
  // السهم اتجاهي: يشير إلى البداية (يمين) في RTL. في الالتقاط (LTR) يُقلب بصنف مختلف.
  const flip = useCaptureClass("rtl:-scale-x-100", "-scale-x-100");

  const back = <IconButton variant="ghost" icon={ArrowLeft} aria-label="رجوع" className={cn("@tablet:hidden", flip)} onClick={live ? undefined : onClose} />;
  const close = <IconButton variant="ghost" icon={X} aria-label="إغلاق" className="hidden @tablet:inline-flex" onClick={live ? undefined : onClose} />;

  return (
    <Root className={cn("flex h-full w-full flex-col bg-surface shadow-overlay outline-none", sizeClass[size], live && motion, className)}>
      <CaptureRow className="shrink-0 items-start gap-3 border-b border-border px-4 py-3 @tablet:px-6 @tablet:py-4">
        {live ? <BaseDialog.Close render={back} /> : back}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Title className="text-h2 font-semibold text-fg">{title}</Title>
          {description ? <Description className="text-body text-fg-muted">{description}</Description> : null}
        </div>
        {live ? <BaseDialog.Close render={close} /> : close}
      </CaptureRow>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 @tablet:px-6">{children}</div>
      {actions ? (
        <CaptureRow className="shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-3 @tablet:px-6 @tablet:py-4">{actions}</CaptureRow>
      ) : null}
    </Root>
  );
}

export type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: DrawerSize;
  /** أزرار التذييل: مصفوفة بمفاتيح (لا Fragment) فيعكسها وضع الالتقاط. */
  actions?: readonly ReactElement[];
  children?: ReactNode;
  /** false: لا يُغلق بالضغط خارجه ولا بـ Esc. */
  dismissible?: boolean;
  /** للمعرض: درج ثابت بلا Base UI داخل OverlayHost (يمكن عرض عدة أدرجة معاً). */
  preview?: boolean;
};

/**
 * الدرج. controlled بـ `open` و`onOpenChange`. يحبس التركيز ويقفل تمرير الصفحة ويغلق بـ Esc (Base UI).
 * يُرسم في OverlayHost الأقرب فيبقى داخل إطاره، وعلى الموبايل يملأ الإطار.
 */
export function Drawer({ open, onOpenChange, dismissible = true, preview = false, ...surface }: DrawerProps) {
  const { container } = useOverlay();

  if (preview) {
    return (
      <>
        <div aria-hidden="true" className="fixed inset-0 z-50 bg-overlay" />
        <div className={layerClass}>
          <CaptureRow className="h-full justify-start">
            <DrawerSurface {...surface} onClose={() => onOpenChange(false)} />
          </CaptureRow>
        </div>
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
            <CaptureRow className="h-full justify-start">
              <DrawerSurface live {...surface} />
            </CaptureRow>
          </BaseDialog.Viewport>
        </BaseDialog.Portal>
      </BaseDialog.Root>
    </DirectionProvider>
  );
}

type NavDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** تسمية اللوحة لقارئ الشاشة: «القائمة الرئيسية». */
  "aria-label": string;
  children: ReactNode;
  /** للمعرض: درج ثابت بلا Base UI. */
  preview?: boolean;
};

/**
 * درج التنقل (DESIGN.md 10.1): على الموبايل القائمة الجانبية تفتح من البداية بعرض 300 من زر List، بلا رأس.
 * ليست Drawer التفاصيل: عرضها ثابت 300 في كل المقاسات ولا تأخذ الشاشة كاملة.
 */
export function NavDrawer({ open, onOpenChange, "aria-label": ariaLabel, children, preview = false }: NavDrawerProps) {
  const { container } = useOverlay();
  const panel = "h-full w-75 bg-surface shadow-overlay outline-none";

  if (preview) {
    return (
      <>
        <div aria-hidden="true" className="fixed inset-0 z-50 bg-overlay" />
        <div className={layerClass}>
          <CaptureRow className="h-full justify-start">
            <div className={panel}>{children}</div>
          </CaptureRow>
        </div>
      </>
    );
  }

  return (
    <DirectionProvider direction="rtl">
      <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
        <BaseDialog.Portal container={container ?? undefined}>
          <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-overlay transition-opacity duration-240 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0" />
          <BaseDialog.Viewport className={layerClass}>
            <CaptureRow className="h-full justify-start">
              <BaseDialog.Popup aria-label={ariaLabel} className={cn(panel, motion)}>
                {children}
              </BaseDialog.Popup>
            </CaptureRow>
          </BaseDialog.Viewport>
        </BaseDialog.Portal>
      </BaseDialog.Root>
    </DirectionProvider>
  );
}
