"use client";

import { Bell, type Icon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatRelative } from "@/lib/format";

export type NotificationItem = {
  id: string | number;
  /** أيقونة النوع (القاموس الثابت). */
  icon: Icon;
  title: string;
  /** النص بسطرين. */
  body: string;
  /** UTC من العقد. */
  at: string;
  unread: boolean;
};

export type NotificationGroup = { key: "today" | "week" | "older"; items: readonly NotificationItem[] };

const groupTitles = { today: "اليوم", week: "هذا الأسبوع", older: "أقدم" } as const;

type NotificationListProps = {
  /** المجموعات الجاهزة (اليوم · هذا الأسبوع · أقدم). الأب يجمّعها. */
  groups: readonly NotificationGroup[];
  onOpen: (id: NotificationItem["id"]) => void;
  /** «تعليم الكل كمقروء» في الرأس. بدونه لا يظهر. */
  onMarkAllRead?: () => void;
  loading?: boolean;
  /** يُمرَّر في المعرض والاختبار لتثبيت الوقت النسبي. الافتراضي الآن. */
  now?: string;
  className?: string;
};

/**
 * قائمة الإشعارات (DESIGN.md 10.16): popover من الجرس على المكتب، وصفحة كاملة على الموبايل. لكل إشعار أيقونة النوع في دائرة surface-sunken،
 * والعنوان، والنص بسطرين، والوقت النسبي. غير المقروء بخلفية primary-soft ونقطة. مجموعات «اليوم · هذا الأسبوع · أقدم».
 * يملأ عرض حاويته: عرض الـ popover من الأب.
 */
export function NotificationList({ groups, onOpen, onMarkAllRead, loading = false, now: nowProp, className }: NotificationListProps) {
  const [clock] = useState(() => new Date().toISOString());
  const now = nowProp ?? clock;
  const hasUnread = groups.some((group) => group.items.some((item) => item.unread));
  const empty = groups.every((group) => group.items.length === 0);

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <CaptureRow className="items-center gap-2 border-b border-border px-4 py-3">
        <h3 className="min-w-0 flex-1 text-h3 font-semibold text-fg">الإشعارات</h3>
        {onMarkAllRead && hasUnread ? (
          <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
            تعليم الكل كمقروء
          </Button>
        ) : null}
      </CaptureRow>

      {loading ? (
        <div aria-hidden="true" className="flex flex-col gap-4 p-4">
          {[0, 1, 2].map((index) => (
            <CaptureRow key={index} className="items-start gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </CaptureRow>
          ))}
        </div>
      ) : empty ? (
        <EmptyState className="py-10" icon={Bell} title="لا إشعارات" description="تظهر هنا إشعاراتك الجديدة." />
      ) : (
        <div className="flex max-h-120 flex-col overflow-y-auto">
          {groups
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <section key={group.key} aria-label={groupTitles[group.key]}>
                <h4 className="bg-surface-muted px-4 py-2 text-start text-caption text-fg-muted">{groupTitles[group.key]}</h4>
                <ul>
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => onOpen(item.id)}
                          className={cn(
                            "block w-full border-b border-border text-start outline-none transition-colors duration-120 ease-out focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset",
                            item.unread ? "bg-primary-soft hover:bg-surface-sunken" : "bg-surface hover:bg-surface-muted",
                          )}
                        >
                          <CaptureRow className="items-start gap-3 px-4 py-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-fg">
                              <ItemIcon size={20} aria-hidden="true" />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-1">
                              <span className={cn("text-start text-body text-fg", item.unread && "font-semibold")}>{item.title}</span>
                              <span className="line-clamp-2 text-start text-label text-fg-muted">{item.body}</span>
                              <span className="text-start text-caption text-fg-muted">{formatRelative(item.at, now)}</span>
                            </span>
                            {item.unread ? (
                              <span className="flex h-10 shrink-0 items-center">
                                <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
                                <span className="sr-only">غير مقروء</span>
                              </span>
                            ) : null}
                          </CaptureRow>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
