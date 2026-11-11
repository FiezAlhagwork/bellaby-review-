"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { DotsThreeVertical, type Icon } from "@phosphor-icons/react";
import type { ReactElement } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { IconButton } from "./IconButton";
import { floatingPanelClass } from "./OptionList";

export type MenuItem = {
  id: string;
  label: string;
  icon?: Icon;
  /** إجراء خطر: يُوضع في آخر القائمة بعد فاصل ويأخذ danger. */
  danger?: boolean;
  disabled?: boolean;
  /** سبب التعطيل: سطر text-caption (الخيار المعطّل يظهر ولا يُنفَّذ ومعه سببه). */
  reason?: string;
  onSelect: () => void;
};

type MenuProps = {
  items: readonly MenuItem[];
  /** مفتاح الزر المحفّز. الافتراضي IconButton بـ DotsThreeVertical. */
  trigger?: ReactElement;
  /** تسمية الزر الافتراضي (إلزامية حين لا يُمرَّر trigger). */
  "aria-label"?: string;
};

const itemClass =
  "flex min-h-10 cursor-pointer select-none items-center gap-2 px-3 py-2 text-body text-fg outline-none data-highlighted:bg-surface-sunken " +
  "data-disabled:cursor-not-allowed data-disabled:bg-transparent data-disabled:text-fg-disabled";

/** محتوى القائمة: العناصر العادية ثم فاصل ثم الخطر. `live` داخل Menu حقيقي، وخارجه شكل ثابت للمعرض. */
export function MenuContent({ items, live = false }: { items: readonly MenuItem[]; live?: boolean }) {
  const Item = live ? BaseMenu.Item : "div";
  const Separator = live ? BaseMenu.Separator : "div";
  const regular = items.filter((item) => !item.danger);
  const dangerous = items.filter((item) => item.danger);

  const renderItem = (item: MenuItem) => {
    const ItemIcon = item.icon;
    return (
      <Item
        key={item.id}
        {...(live ? { disabled: item.disabled, onClick: item.onSelect } : { "data-disabled": item.disabled ? "" : undefined })}
        className={cn(itemClass, item.danger && !item.disabled && "text-danger")}
      >
        <CaptureRow className="min-w-0 flex-1 items-center gap-2">
          {ItemIcon ? <ItemIcon size={20} aria-hidden="true" className="shrink-0" /> : null}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-start">{item.label}</span>
            {item.reason ? <span className="text-caption text-fg-muted">{item.reason}</span> : null}
          </span>
        </CaptureRow>
      </Item>
    );
  };

  return (
    <>
      {regular.map(renderItem)}
      {dangerous.length > 0 && regular.length > 0 ? <Separator className="my-1 h-px bg-border" /> : null}
      {dangerous.map(renderItem)}
    </>
  );
}

/** لوحة القائمة بإطارها (للمعرض الثابت). */
export const menuPanelClass = cn(floatingPanelClass, "min-w-48 py-1");

/**
 * قائمة الإجراءات (DESIGN.md 9.14) من زر (DotsThreeVertical في الجداول): كل عنصر بأيقونة ونص، والخطر في آخرها بـ danger بعد فاصل.
 * الأسهم وEnter وEsc والكتابة السريعة من Base UI.
 */
export function Menu({ items, trigger, "aria-label": ariaLabel = "المزيد" }: MenuProps) {
  return (
    <DirectionProvider direction="rtl">
      <BaseMenu.Root>
        <BaseMenu.Trigger render={trigger ?? <IconButton variant="ghost" icon={DotsThreeVertical} aria-label={ariaLabel} />} />
        <BaseMenu.Portal>
          <BaseMenu.Positioner sideOffset={4} align="start" className="z-50 outline-none">
            <BaseMenu.Popup className={menuPanelClass}>
              <MenuContent live items={items} />
            </BaseMenu.Popup>
          </BaseMenu.Positioner>
        </BaseMenu.Portal>
      </BaseMenu.Root>
    </DirectionProvider>
  );
}
