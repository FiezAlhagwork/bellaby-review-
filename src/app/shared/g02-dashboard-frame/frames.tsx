"use client";

import { DashboardShell, type ShellDelegation } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { navigationFor } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { executiveDelegate, shellUsers, type ShellUserKey } from "@/mocks/shell-users";

// إطار اللوحة لصفحة G02. الـ callbacks الفارغة هنا لأن الصفحة (خادم) لا تمرّر دوال. في الإنتاج يغلّف DashboardShell كل صفحات اللوحة.

const noop = () => {};

type ShellFrameProps = {
  user: ShellUserKey;
  /** عنصر القائمة النشط (key في config/navigation.ts). */
  activeKey: string;
  pageTitle: string;
  /** المدير التنفيذي فوّض غيره: يظهر الشريط المقابل. */
  delegator?: boolean;
  /** عرض ثابت للإطار الداخلي (حالة التابلت داخل إطار المكتب). */
  widthClass?: string;
  /** القائمة مفتوحة (الدرج على الموبايل). */
  menuOpen?: boolean;
};

export function ShellFrame({ user, activeKey, pageTitle, delegator = false, widthClass, menuOpen = false }: ShellFrameProps) {
  const { me, unreadCount, pendingCount } = shellUsers[user];
  const roleName = me.role?.name ?? "";

  let delegation: ShellDelegation | undefined;
  if (me.active_delegation?.to) delegation = { kind: "delegate", to: me.active_delegation.to };
  else if (delegator) delegation = { kind: "delegator", delegateName: executiveDelegate.name, to: executiveDelegate.to, onEnd: noop };

  const shell = (
    <DashboardShell
      navigation={{ roleName, groups: navigationFor(me.permissions ?? [], { pending: pendingCount }), profileHref: "#g05" }}
      user={{ name: me.name ?? "", roleName }}
      activeKey={activeKey}
      breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: pageTitle }]}
      delegation={delegation}
      unreadCount={unreadCount}
      pendingCount={pendingCount}
      defaultMenuOpen={menuOpen}
      onProfile={noop}
      onSignOut={noop}
    >
      <PageHeader title={pageTitle} description="الإطار نفسه تحيط به كل شاشات اللوحة." />
      <Card>
        <p className="text-body text-fg-muted">محتوى الشاشة التي تختارها من القائمة يظهر هنا.</p>
      </Card>
    </DashboardShell>
  );

  // الحالة المقيّدة العرض (التابلت): مضيف بعرضه يتوسط الإطار، فيقيسه الإطار الداخلي لا عرض الصفحة.
  return widthClass ? <div className={cn("mx-auto flex flex-1 flex-col", widthClass)}>{shell}</div> : shell;
}
