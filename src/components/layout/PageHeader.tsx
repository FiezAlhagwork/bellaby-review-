"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";

export type PageAction = {
  id: string;
  label: string;
  onSelect: () => void;
  /** الأساسي واحد فقط في الرأس. */
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  /** سبب التعطيل: يظهر في القائمة. الزر المعطّل الظاهر يحتاج سبباً ظاهراً في الشاشة. */
  reason?: string;
};

type PageHeaderProps = {
  title: string;
  /** شارة الحالة بجانب العنوان (StatusBadge) إن كان كياناً. */
  badge?: ReactNode;
  /** سطر وصفي: «للمندوب سامر الحلبي · أنشأه رامي السيد · 9 تشرين الثاني 2026». */
  description?: string;
  /** الإجراءات: أول اثنين ظاهران (الأخير في الترتيب هو الأساسي)، والباقي في Menu. */
  actions?: readonly PageAction[];
  className?: string;
};

const MAX_VISIBLE = 2;

/**
 * رأس الصفحة (DESIGN.md 10.4): العنوان text-h1 وشارة الحالة، وسطر وصفي، والإجراءات في النهاية: حتى 2 ظاهرة والباقي في Menu.
 * على الموبايل الإجراءات تحت العنوان بعرض كامل، والثانوية في Menu. مسار التنقل في Topbar.
 */
export function PageHeader({ title, badge, description, actions = [], className }: PageHeaderProps) {
  // الأساسي أولاً ثم الثانوي ظاهرين، وما زاد في القائمة. الترتيب البصري: الثانوي ثم الأساسي في النهاية.
  const primary = actions.find((action) => action.primary);
  const secondary = actions.filter((action) => action !== primary);
  const visible = [...secondary.slice(0, primary ? MAX_VISIBLE - 1 : MAX_VISIBLE), ...(primary ? [primary] : [])];
  const overflow = actions.filter((action) => !visible.includes(action));

  const toItem = ({ id, label, onSelect, danger, disabled, reason }: PageAction): MenuItem => ({ id, label, onSelect, danger, disabled, reason });
  // الموبايل: الأساسي وحده ظاهر، والثانوية مع الفائض في Menu. من التابلت: الظاهر ظاهر، والفائض وحده في Menu.
  const hiddenOnMobile = visible.filter((action) => !action.primary);
  const mobileItems = [...hiddenOnMobile, ...overflow].map(toItem);
  const overflowItems = overflow.map(toItem);

  const button = (action: PageAction) => (
    <Button
      key={action.id}
      variant={action.primary ? "primary" : action.danger ? "danger" : "secondary"}
      disabled={action.disabled}
      className={cn(action.primary ? "flex-1 @tablet:flex-none" : "hidden @tablet:inline-flex")}
      onClick={action.onSelect}
    >
      {action.label}
    </Button>
  );

  // الصف نفسه يُرسم مرتين (بجانب العنوان من التابلت، وتحته على الموبايل) لأن CaptureRow لا يبدّل بين عمود وصف بالمقاس. العنصر الآخر display:none.
  const row = (key: string) => [
    mobileItems.length > 0 ? (
      <span key={`${key}-menu-mobile`} className="flex @tablet:hidden">
        <Menu items={mobileItems} aria-label="المزيد من الإجراءات" />
      </span>
    ) : null,
    overflowItems.length > 0 ? (
      <span key={`${key}-menu-overflow`} className="hidden @tablet:flex">
        <Menu items={overflowItems} aria-label="المزيد من الإجراءات" />
      </span>
    ) : null,
    ...visible.map(button),
  ];

  const titleBlock = (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <CaptureRow className="items-center gap-3">
        <h1 className="min-w-0 text-h1 font-bold text-fg">{title}</h1>
        {badge ? <span className="flex shrink-0 items-center">{badge}</span> : null}
      </CaptureRow>
      {description ? <p className="text-body text-fg-muted">{description}</p> : null}
    </div>
  );

  return (
    <header className={cn("flex flex-col gap-4 pb-6", className)}>
      <CaptureRow className="items-start gap-4">
        {titleBlock}
        {actions.length > 0 ? <CaptureRow className="hidden shrink-0 items-center gap-2 @tablet:flex">{row("end")}</CaptureRow> : null}
      </CaptureRow>
      {actions.length > 0 ? <CaptureRow className="items-center gap-2 @tablet:hidden">{row("below")}</CaptureRow> : null}
    </header>
  );
}
