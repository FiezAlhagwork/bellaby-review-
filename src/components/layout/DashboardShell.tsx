"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { NavDrawer } from "@/components/ui/Drawer";
import { OverlayHost, useOverlay } from "@/components/ui/OverlayHost";
import { dayMonthLabel, type IsoDate } from "@/lib/calendar";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { isolate } from "@/lib/format";
import type { BreadcrumbItem } from "./Breadcrumbs";
import { Sidebar, type SidebarGroup } from "./Sidebar";
import { Topbar, type TopbarUser } from "./Topbar";

/** التفويض النشط (`active_delegation` في /me، وDelegation للمدير التنفيذي). */
export type ShellDelegation =
  | { kind: "delegate"; to: IsoDate }
  | { kind: "delegator"; delegateName: string; to: IsoDate; onEnd: () => void };

type DashboardShellProps = {
  /** العناصر بعد تصفيتها بصلاحيات المستخدم (من config/navigation.ts). */
  navigation: { roleName: string; groups: readonly SidebarGroup[]; profileHref: string };
  user: TopbarUser;
  activeKey: string;
  breadcrumbs: readonly BreadcrumbItem[];
  delegation?: ShellDelegation;
  unreadCount?: number;
  pendingCount?: number;
  notificationsPanel?: ReactNode;
  onBellClick?: () => void;
  onPendingClick?: () => void;
  onProfile: () => void;
  onSignOut: () => void;
  /** القائمة مفتوحة عند أول رسم (درج الموبايل أو القائمة الموسّعة على التابلت). للمعرض ولحالة «القائمة مفتوحة» فقط. */
  defaultMenuOpen?: boolean;
  children: ReactNode;
};

/**
 * إطار اللوحة (DESIGN.md 10.1): قائمة جانبية وشريط علوي ومحتوى.
 * مكتب (≥1280): قائمة ثابتة 264، شريط 64، padding 32. تابلت: قائمة مصغّرة 72 تتوسع فوق المحتوى بزر القائمة، شريط 64، padding 24.
 * موبايل: القائمة مخفية وتفتح درجاً بعرض 300 من البداية، شريط 56، padding 16.
 * الجذر OverlayHost بـ @container بلا padding ولا border، فكل ما بداخله (والنوافذ) يقيس عرضه هو لا عرض النافذة.
 * يملأ ارتفاع أبيه: الأب (ScreenFrame أو جذر التطبيق) عمود flex.
 */
export function DashboardShell(props: DashboardShellProps) {
  return (
    <OverlayHost className="flex min-h-0 flex-1 bg-bg">
      <ShellBody {...props} />
    </OverlayHost>
  );
}

function DelegationBar({ delegation }: { delegation: ShellDelegation }) {
  const until = isolate(dayMonthLabel(delegation.to));
  return delegation.kind === "delegate" ? (
    <Banner kind="info" className="rounded-none">
      {`أنت مفوَّض عن المدير التنفيذي حتى ${until}. قراراتك تُسجَّل بالتفويض.`}
    </Banner>
  ) : (
    <Banner
      kind="info"
      className="rounded-none"
      action={
        <Button variant="ghost" size="sm" onClick={delegation.onEnd}>
          إنهاء التفويض
        </Button>
      }
    >
      {`فوّضت ${delegation.delegateName} حتى ${until}.`}
    </Banner>
  );
}

function ShellBody({ navigation, user, activeKey, breadcrumbs, delegation, unreadCount, pendingCount, notificationsPanel, onBellClick, onPendingClick, onProfile, onSignOut, defaultMenuOpen = false, children }: DashboardShellProps) {
  const { breakpoint, container } = useOverlay();
  // زر القائمة: درج على الموبايل، وقائمة موسّعة فوق المحتوى على التابلت. على المكتب لا زر.
  const [navOpen, setNavOpen] = useState(defaultMenuOpen);
  const close = () => setNavOpen(false);
  const expanded = navOpen && breakpoint === "tablet";

  // القائمة الموسّعة على التابلت تُغلق بـ Esc أينما كان التركيز (الدرج على الموبايل يغلقه Base UI).
  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded]);

  const sidebar = (mode: "auto" | "full", className?: string) => (
    <Sidebar
      mode={mode}
      roleName={navigation.roleName}
      groups={navigation.groups}
      activeKey={activeKey}
      profileHref={navigation.profileHref}
      onSignOut={onSignOut}
      onNavigate={close}
      className={className}
    />
  );

  // القائمة الموسّعة على التابلت: تُرسم في حاوية الطبقات (المضيف، أو عنصر نسخة المراجعة الثابت بالنافذة).
  const expandedMenu = (
    <div role="dialog" aria-modal="true" aria-label="القائمة الرئيسية" className="fixed inset-0 z-40">
      <button type="button" aria-label="إغلاق القائمة" onClick={close} className="absolute inset-0 bg-overlay" />
      <CaptureRow className="pointer-events-none relative h-full justify-start">{sidebar("full", "pointer-events-auto shadow-overlay")}</CaptureRow>
    </div>
  );

  return (
    <>
      <CaptureRow className="min-h-0 min-w-0 flex-1 items-stretch">
        <div className="hidden shrink-0 @tablet:flex">{sidebar("auto", "h-auto")}</div>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            breadcrumbs={breadcrumbs}
            user={user}
            unreadCount={unreadCount}
            pendingCount={pendingCount}
            notificationsPanel={notificationsPanel}
            onBellClick={onBellClick}
            onPendingClick={onPendingClick}
            onMenuClick={() => setNavOpen((open) => !open)}
            onProfile={onProfile}
            onSignOut={onSignOut}
          />
          {delegation ? <DelegationBar delegation={delegation} /> : null}
          <main className="flex min-w-0 flex-1 flex-col p-4 @tablet:p-6 @desktop:p-8">{children}</main>
        </div>
      </CaptureRow>

      <NavDrawer open={navOpen && breakpoint === "mobile"} onOpenChange={setNavOpen} aria-label="القائمة الرئيسية">
        {sidebar("full", "w-full")}
      </NavDrawer>

      {expanded ? (container ? createPortal(expandedMenu, container) : expandedMenu) : null}
    </>
  );
}
