"use client";

import { Bell, List, SignOut, UserCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/cn";
import { CaptureRow, useCaptureClass } from "@/lib/design/CaptureMode";
import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";

export type TopbarUser = {
  name: string;
  /** اسم الدور تحت الاسم (على التابلت وما فوقه). */
  roleName: string;
};

type TopbarProps = {
  breadcrumbs: readonly BreadcrumbItem[];
  user: TopbarUser;
  /** عدد الإشعارات غير المقروءة. 0 أو بلا = لا عدّاد. */
  unreadCount?: number;
  /** عدد ما ينتظر قراري (من /me/pending-decisions). بلا = المستخدم لا يقرر فلا يظهر الزر. */
  pendingCount?: number;
  /** قائمة الإشعارات داخل popover من الجرس (NotificationList). بدونها يستدعي الجرس onBellClick. */
  notificationsPanel?: ReactNode;
  onBellClick?: () => void;
  onPendingClick?: () => void;
  /** زر القائمة (تابلت وموبايل). */
  onMenuClick: () => void;
  onProfile: () => void;
  onSignOut: () => void;
};

/**
 * الشريط العلوي (DESIGN.md 10.3): في البداية زر القائمة (موبايل وتابلت) ثم مسار التنقل (مكتب)،
 * وفي النهاية الجرس بعدد غير المقروء، ثم «بانتظار قراري» بعدده، ثم أفاتار المستخدم وقائمته (الملف الشخصي وتسجيل الخروج).
 * الارتفاع 56 على الموبايل و64 من التابلت.
 */
export function Topbar({
  breadcrumbs,
  user,
  unreadCount,
  pendingCount,
  notificationsPanel,
  onBellClick,
  onPendingClick,
  onMenuClick,
  onProfile,
  onSignOut,
}: TopbarProps) {
  const dotEdge = useCaptureClass("end-1", "start-1");

  const userItems: readonly MenuItem[] = [
    { id: "profile", label: "الملف الشخصي", icon: UserCircle, onSelect: onProfile },
    { id: "sign-out", label: "تسجيل الخروج", icon: SignOut, onSelect: onSignOut },
  ];

  const bell = <IconButton variant="ghost" icon={Bell} aria-label={unreadCount ? `الإشعارات، ${unreadCount} غير مقروء` : "الإشعارات"} onClick={notificationsPanel ? undefined : onBellClick} />;

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-surface px-4 @tablet:h-16 @tablet:px-6 @desktop:px-8">
      <CaptureRow className="w-full items-center gap-2">
        <IconButton variant="ghost" icon={List} aria-label="القائمة" className="@desktop:hidden" onClick={onMenuClick} />
        <div className="min-w-0 flex-1">
          <div className="hidden @desktop:block">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>

        <span className="relative flex">
          {notificationsPanel ? <Popover trigger={bell}>{notificationsPanel}</Popover> : bell}
          {unreadCount ? (
            <span
              aria-hidden="true"
              className={cn("pointer-events-none absolute top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-caption text-fg-inverse tabular-nums", dotEdge)}
            >
              {unreadCount > 99 ? "99+" : String(unreadCount)}
            </span>
          ) : null}
        </span>

        {pendingCount !== undefined ? (
          <button
            type="button"
            onClick={onPendingClick}
            className="flex h-8 shrink-0 items-center rounded-md px-2 text-label font-medium text-fg outline-none transition-colors duration-120 ease-out hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-focus"
          >
            <CaptureRow className="items-center gap-2">
              <span>بانتظار قراري</span>
              <Badge color={pendingCount > 0 ? "warning" : "neutral"}>{String(pendingCount)}</Badge>
            </CaptureRow>
          </button>
        ) : null}

        <Menu
          items={userItems}
          trigger={
            <button
              type="button"
              aria-label={`${user.name}، قائمة الحساب`}
              className="flex shrink-0 items-center rounded-md px-1 py-1 outline-none hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-focus"
            >
              <CaptureRow className="items-center gap-3">
                <Avatar name={user.name} size={32} decorative />
                <span className="hidden flex-col @tablet:flex">
                  <span className="text-start text-label font-medium text-fg">{user.name}</span>
                  <span className="text-start text-caption text-fg-muted">{user.roleName}</span>
                </span>
              </CaptureRow>
            </button>
          }
        />
      </CaptureRow>
    </header>
  );
}
