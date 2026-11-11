"use client";

import { SignOut, UserCircle, type Icon } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactElement } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow, useCaptureClass } from "@/lib/design/CaptureMode";
import { Tooltip } from "@/components/ui/Tooltip";
import { useOverlay } from "@/components/ui/OverlayHost";

// القائمة الجانبية (DESIGN.md 10.2). العناصر تصل من config/navigation.ts بعد تصفيتها بالصلاحيات،
// فلا شيء مكتوب هنا عن الأدوار أو الصفحات.
// المقاسات (10.1): مكتب 264 بالأيقونات والنصوص، تابلت 72 أيقونات مع tooltip. على الموبايل لا تُرسم في الصفحة بل داخل درج (mode="full").

export type SidebarItem = {
  key: string;
  label: string;
  icon: Icon;
  href: string;
  /** عدد ما ينتظر قراري. */
  count?: number;
};

export type SidebarGroup = {
  title?: string;
  items: readonly SidebarItem[];
};

type SidebarProps = {
  /** اسم الدور تحت «Bellaby». */
  roleName: string;
  groups: readonly SidebarGroup[];
  activeKey: string;
  profileHref: string;
  onSignOut?: () => void;
  /**
   * auto: الشكل بحسب عرض المضيف (مصغّرة 72 على التابلت، كاملة 264 على المكتب).
   * full: كاملة دائماً (الدرج على الموبايل، والقائمة الموسّعة فوق المحتوى على التابلت).
   */
  mode?: "auto" | "full";
  /** عند الضغط على أي عنصر: لإغلاق الدرج أو القائمة الموسّعة. */
  onNavigate?: () => void;
  className?: string;
};

const rowClass = "h-10 items-center gap-3 px-3";

export function Sidebar({ roleName, groups, activeKey, profileHref, onSignOut, mode = "auto", onNavigate, className }: SidebarProps) {
  // الحد على الحافة المجاورة للمحتوى: النهاية (يسار) في RTL، وتصير البداية في LTR.
  const edge = useCaptureClass("border-e", "border-s");
  const { breakpoint } = useOverlay();
  const full = mode === "full";
  // النص: ظاهر دائماً في full، وفي auto من المكتب فقط (المصغّرة بأيقونات).
  const label = full ? "" : "hidden @desktop:block";
  const railTips = !full && breakpoint === "tablet";

  const withTip = (text: string, element: ReactElement) => (
    // الغلاف span هو المحفّز: Link من Next لا يمرّر أحداث المؤشر إلى Base UI، فتؤخذ من الغلاف.
    <Tooltip label={text} side="inline-end" disabled={!railTips}>
      <span className="block">{element}</span>
    </Tooltip>
  );

  return (
    <aside className={cn("flex h-full flex-col border-border bg-surface", full ? "w-66" : "w-18 @desktop:w-66", edge, className)}>
      <div className={cn("flex h-16 shrink-0 flex-col justify-center", full ? "px-6" : "items-center px-0 @desktop:items-stretch @desktop:px-6")}>
        <span className="text-h2 font-bold text-fg">
          <span className={cn(!full && "@desktop:hidden")}>{full ? "Bellaby" : "B"}</span>
          {!full ? <span className="hidden @desktop:inline">Bellaby</span> : null}
        </span>
        <span className={cn("text-caption text-fg-muted", label)}>{roleName}</span>
      </div>

      <nav aria-label="القائمة الرئيسية" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
        {groups.map((group, index) => (
          <div key={group.title ?? index} className="flex flex-col gap-1">
            {group.title ? <p className={cn("px-3 pb-1 text-caption text-fg-muted", label)}>{group.title}</p> : null}
            {index > 0 && !full ? <div aria-hidden="true" className="-mt-3 mb-1 h-px bg-border @desktop:hidden" /> : null}
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => (
                <li key={item.key}>
                  {withTip(item.label, <NavLink item={item} active={item.key === activeKey} labelClass={label} onNavigate={onNavigate} />)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex shrink-0 flex-col gap-1 border-t border-border p-3">
        {withTip(
          "الملف الشخصي",
          <Link href={profileHref} onClick={onNavigate} className="block rounded-md text-body text-fg hover:bg-surface-muted">
            <CaptureRow className={cn(rowClass, !full && "justify-center @desktop:justify-start")}>
              <UserCircle size={20} aria-hidden="true" />
              <span className={cn("flex-1 text-start", label)}>الملف الشخصي</span>
            </CaptureRow>
          </Link>,
        )}
        {withTip(
          "تسجيل الخروج",
          <button type="button" onClick={onSignOut} className="block w-full rounded-md text-body text-fg hover:bg-surface-muted">
            <CaptureRow className={cn(rowClass, !full && "justify-center @desktop:justify-start")}>
              <SignOut size={20} aria-hidden="true" />
              <span className={cn("flex-1 text-start", label)}>تسجيل الخروج</span>
            </CaptureRow>
          </button>,
        )}
      </div>
    </aside>
  );
}

function NavLink({ item, active, labelClass, onNavigate }: { item: SidebarItem; active: boolean; labelClass: string; onNavigate?: () => void }) {
  // خط بعرض 3 على حافة البداية (يمين). start تنقلب في LTR فتصير end.
  const indicator = useCaptureClass("border-s-3", "border-e-3");
  const ItemIcon = item.icon;
  const full = labelClass === "";

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className={cn(
        "relative block rounded-md text-body text-fg",
        indicator,
        active ? "border-primary bg-primary-soft font-semibold" : "border-transparent hover:bg-surface-muted",
      )}
    >
      <CaptureRow className={cn(rowClass, !full && "justify-center @desktop:justify-start")}>
        <ItemIcon size={20} weight={active ? "fill" : "regular"} aria-hidden="true" />
        <span className={cn("flex-1 truncate text-start", labelClass)}>{item.label}</span>
        {item.count !== undefined ? (
          <span className={cn("text-caption tabular-nums", active ? "text-fg" : "text-fg-muted", labelClass)}>{item.count}</span>
        ) : null}
      </CaptureRow>
      {/* في المصغّرة: العدد نقطة مرقّمة على الأيقونة. */}
      {item.count !== undefined && !full ? (
        <span aria-hidden="true" className="absolute top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-caption text-on-primary tabular-nums @desktop:hidden">
          {item.count}
        </span>
      ) : null}
    </Link>
  );
}
