import { Bell, CalendarCheck, FileText, Handshake, Scales, Stamp, Truck, Warning, type Icon } from "@phosphor-icons/react";

/**
 * أيقونة الإشعار من بادئة `Notification.type` (نص حر في العقد، مثاله `transfer_in_transit`). القائمة الكاملة للأنواع لم تصل (§94)،
 * فالبادئات هنا للأمثلة الواضحة، وما لا يطابق يأخذ الجرس.
 */
const prefixIcons: readonly (readonly [prefix: string, icon: Icon])[] = [
  ["transfer", Truck],
  ["delivery", Handshake],
  ["task", CalendarCheck],
  ["leave", CalendarCheck],
  ["report", FileText],
  ["periodic_report", FileText],
  ["pending_decision", Stamp],
  ["dispute", Scales],
  ["batch", Warning],
];

export function notificationIcon(type: string | undefined): Icon {
  return prefixIcons.find(([prefix]) => (type ?? "").startsWith(prefix))?.[1] ?? Bell;
}
