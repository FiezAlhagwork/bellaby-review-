"use client";

import { NotificationList, type NotificationGroup } from "@/components/data/NotificationList";
import { notificationIcon } from "@/components/data/notification-types";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { Notification } from "@/lib/api/types";
import { countPhrase } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** صفحة من `GET /notifications` (`Paginated`) ومعها `unread_count`. */
export type NotificationsPage = { data: readonly Notification[]; meta: PaginationMeta; unreadCount: number };

/** `unread=true` أو الكل. */
export type NotificationsTab = "all" | "unread";

type NotificationsViewProps = {
  notifications: Loadable<NotificationsPage>;
  tab: NotificationsTab;
  onTabChange: (tab: NotificationsTab) => void;
  /** الآن (UTC): يجمّع «اليوم · هذا الأسبوع · أقدم» ويحسب الوقت النسبي. يُمرَّر فيبقى الـ view نقياً. */
  now: string;
  /** يعلّم الإشعار مقروءاً (`POST /notifications/{id}/read`) ويفتح وجهته من `ref_type`/`ref_id`. */
  onOpen: (notification: Notification) => void;
  /** `POST /notifications/read-all`. */
  onMarkAllRead: () => void;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
};

const DAY = 86_400_000;

/** اليوم (بتوقيت دمشق) وآخر سبعة أيام وما قبلها. */
function groupOf(at: string, now: string): NotificationGroup["key"] {
  const day = (value: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Damascus" }).format(new Date(value));
  if (day(at) === day(now)) return "today";
  return new Date(now).getTime() - new Date(at).getTime() < 7 * DAY ? "week" : "older";
}

/**
 * الإشعارات (G03): الصفحة الكاملة (الموبايل، ومن «عرض الكل» في نافذة الجرس). مجموعات اليوم وهذا الأسبوع وأقدم، وغير المقروء بخلفية ونقطة،
 * و«تعليم الكل كمقروء»، ومبدّل «الكل / غير المقروءة»، وترقيم. النقر يعلّم الإشعار مقروءاً ويفتح وجهته.
 */
export function NotificationsView({ notifications, tab, onTabChange, now, onOpen, onMarkAllRead, onPageChange, onRetry }: NotificationsViewProps) {
  const ready = notifications.status === "ready" ? notifications.data : null;
  const items = ready?.data ?? [];
  const groups: NotificationGroup[] = (["today", "week", "older"] as const).map((key) => ({
    key,
    items: items
      .filter((item) => groupOf(item.created_at ?? now, now) === key)
      .map((item) => ({ id: item.id ?? "", icon: notificationIcon(item.type), title: item.title ?? "", body: item.body ?? "", at: item.created_at ?? now, unread: !item.read_at })),
  }));

  return (
    <>
      <PageHeader title="الإشعارات" description={ready ? (ready.unreadCount > 0 ? `${countPhrase(ready.unreadCount, ["إشعار غير مقروء", "إشعاران غير مقروءين", "إشعارات غير مقروءة"])}.` : "كل إشعاراتك مقروءة.") : undefined} />

      <div className="flex flex-col gap-4">
        <SegmentedControl
          aria-label="الإشعارات"
          options={[
            { value: "all", label: "الكل" },
            { value: "unread", label: "غير المقروءة" },
          ]}
          value={tab}
          onValueChange={onTabChange}
        />

        {notifications.status === "error" ? (
          <ErrorState code={notifications.code} onRetry={onRetry} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <NotificationList
              groups={groups}
              loading={notifications.status === "loading"}
              now={now}
              onOpen={(id) => {
                const item = items.find((entry) => entry.id === id);
                if (item) onOpen(item);
              }}
              onMarkAllRead={onMarkAllRead}
            />
          </div>
        )}

        {ready && ready.meta.last_page > 1 ? <Pagination meta={ready.meta} onPageChange={onPageChange} /> : null}
      </div>
    </>
  );
}
