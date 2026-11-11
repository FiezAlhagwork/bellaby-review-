"use client";

import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import type { BreadcrumbItem } from "@/components/layout/Breadcrumbs";
import { navigationFor } from "@/config/navigation";
import { shellUsers, type ShellUserKey } from "@/mocks/shell-users";

// إطار اللوحة لصفحات الرسم: قائمة الدور وشريطه العلوي (من config/navigation.ts بصلاحيات المستخدم الوهمي) حول الـ view.
// صفحة الرسم (خادم) لا تمرّر دوالاً، فالـ callbacks الفارغة هنا. في الإنتاج يغلّف DashboardShell كل صفحات اللوحة. لا يُنقل للإنتاج.

const noop = () => {};

type ShellScreenProps = {
  user: ShellUserKey;
  /** عنصر القائمة النشط (key في config/navigation.ts). */
  activeKey: string;
  breadcrumbs: readonly BreadcrumbItem[];
  children: ReactNode;
};

export function ShellScreen({ user, activeKey, breadcrumbs, children }: ShellScreenProps) {
  const { me, unreadCount, pendingCount } = shellUsers[user];
  const roleName = me.role?.name ?? "";

  return (
    <DashboardShell
      navigation={{ roleName, groups: navigationFor(me.permissions ?? [], { pending: pendingCount }), profileHref: "#g05" }}
      user={{ name: me.name ?? "", roleName }}
      activeKey={activeKey}
      breadcrumbs={breadcrumbs}
      unreadCount={unreadCount}
      pendingCount={pendingCount}
      onProfile={noop}
      onSignOut={noop}
    >
      {children}
    </DashboardShell>
  );
}
