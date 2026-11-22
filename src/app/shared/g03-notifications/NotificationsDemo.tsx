"use client";

import { useState } from "react";
import { NotificationsView, type NotificationsTab } from "@/features/notifications/views/NotificationsView";
import type { Notification } from "@/lib/api/types";
import { meNow, notificationsList } from "@/mocks/me";

// غلاف تفاعلي لصفحة الرسم (G03): يملك التبويب والإشعارات. القراءة POST /notifications/{id}/read، و«تعليم الكل» POST /notifications/read-all، محلياً. لا يُنقل للإنتاج.

type NotificationsDemoProps = { mode?: "ready" | "loading" | "error" | "empty" };

export function NotificationsDemo({ mode = "ready" }: NotificationsDemoProps) {
  const [items, setItems] = useState<readonly Notification[]>(mode === "empty" ? [] : notificationsList);
  const [tab, setTab] = useState<NotificationsTab>("all");
  const shown = tab === "unread" ? items.filter((item) => !item.read_at) : items;
  const unreadCount = items.filter((item) => !item.read_at).length;

  return (
    <NotificationsView
      notifications={
        mode === "loading"
          ? { status: "loading" }
          : mode === "error"
            ? { status: "error", code: "too_many_requests" }
            : { status: "ready", data: { data: shown, meta: { current_page: 1, last_page: 1, per_page: 20, total: shown.length }, unreadCount } }
      }
      tab={tab}
      onTabChange={setTab}
      now={meNow}
      onOpen={(item) => setItems(items.map((entry) => (entry.id === item.id ? { ...entry, read_at: entry.read_at ?? meNow } : entry)))}
      onMarkAllRead={() => setItems(items.map((entry) => ({ ...entry, read_at: entry.read_at ?? meNow })))}
      onPageChange={() => {}}
    />
  );
}
