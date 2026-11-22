import { ArrowUUpLeft, Barcode, CalendarCheck, ClipboardText, Detective, FileText, Handshake, ListChecks, Scales, Star, Trophy, Warning, type Icon } from "@phosphor-icons/react";
import type { PendingDecision } from "@/lib/api/types";

export type PendingKind = NonNullable<PendingDecision["kind"]>;

/** أنواع «بانتظار قراري» (`PendingDecision.kind`) بالعربية، وأيقونة كل نوع، وترتيب عرض المجموعات. */
export const pendingKindLabels = {
  PERIODIC_REPORT: "تقرير دوري",
  PLAN_REVISION: "تعديل الخطة",
  STOCK_COUNT: "جرد",
  BATCH_UNSUSPEND: "فك إيقاف دفعة",
  DELIVERY_CANCEL: "إلغاء تسليم",
  DELIVERY_WRITE_OFF: "شطب تسليم",
  CUSTOMER_RETURN: "مرتجع صيدلية",
  DAMAGE_REPORT: "تقرير تالف",
  AGENT_RETURN: "إرجاع وكيل",
  OVERDUE_TASK: "مهمة متأخرة",
  INVESTIGATION: "ملف تحقيق",
  DISPUTE: "توصية نزاع",
  EMPLOYEE_OF_MONTH: "موظف الشهر",
  MANUAL_RATING: "تقييم يدوي",
  LEAVE: "إجازة",
} satisfies Record<PendingKind, string>;

export const pendingKindIcons = {
  PERIODIC_REPORT: FileText,
  PLAN_REVISION: ListChecks,
  STOCK_COUNT: ClipboardText,
  BATCH_UNSUSPEND: Barcode,
  DELIVERY_CANCEL: Handshake,
  DELIVERY_WRITE_OFF: Handshake,
  CUSTOMER_RETURN: ArrowUUpLeft,
  DAMAGE_REPORT: Warning,
  AGENT_RETURN: ArrowUUpLeft,
  OVERDUE_TASK: CalendarCheck,
  INVESTIGATION: Detective,
  DISPUTE: Scales,
  EMPLOYEE_OF_MONTH: Trophy,
  MANUAL_RATING: Star,
  LEAVE: CalendarCheck,
} satisfies Record<PendingKind, Icon>;

export const pendingKindOrder = Object.keys(pendingKindLabels) as PendingKind[];
