import type { FlagRow } from "@/features/flags/deadline";
import type { FlagLinkedRecord } from "@/features/flags/views/FlagDrawerView";
import type { Flag, FlagStatus, FlagType, UserRef } from "@/lib/api/types";
import { formatDateTime, isolate } from "@/lib/format";
import { attendanceSessions } from "./attendance";
import { huda, monitoringUser, omar, samer } from "./supervision";
import { allVisits } from "./visits";

// العلامات (S08 وS09): علامات الزيارات والدوام من بقية المعرض، ومعها فرق المخزون وانحراف الساعة والجهات الجديدة والمكررة. مفتوحة ومغلقة.
// `due_at` موعد انتهاء مهلة المعالجة (72 ساعة عمل) مضاف في الواجهة (docs/backend-requests.md §31.2)، وأوقات الإنشاء UTC. «الآن» 10 تشرين الثاني 2026 14:30 دمشق.
// مفاتيح `details` لكل نوع مفترضة (العقد يعرّفها كائناً حراً): §32.1. لا يُنقل للإنتاج.

export const rami: UserRef = { id: 3, name: "رامي السيد" };
export const escalatedInvestigationId = 31;

/** الأشخاص المتاحون لفلتر «الشخص»: من تقع عليهم العلامات. مصدرهم مطلوب (§31.3). */
export const flagPeople: readonly UserRef[] = [samer, omar, huda, rami];

function make(
  id: number,
  type: FlagType,
  status: FlagStatus,
  subject: UserRef,
  ref: [Flag["ref_type"], number],
  createdAt: string,
  details: Record<string, unknown>,
  dueAt: string | null,
  extra: Partial<Flag> = {},
): FlagRow {
  return {
    id,
    type,
    status,
    subject_user: subject,
    ref_type: ref[0],
    ref_id: ref[1],
    details,
    created_at: createdAt,
    closed_by: null,
    closed_at: null,
    note: null,
    investigation_id: null,
    handling_work_hours: null,
    due_at: dueAt,
    ...extra,
  };
}

/** موعد مهلة العلامات المرتبطة بزيارات المعرض والدوام (72 ساعة عمل من الإنشاء، الجمعة عطلة). */
const dueById: Record<number, string> = {
  9001: "2026-11-12T08:00:00Z",
  9002: "2026-11-12T14:00:00Z",
  9003: "2026-11-12T08:30:00Z",
  9004: "2026-11-11T17:00:00Z",
  1882: "2026-11-10T16:00:00Z",
};

const visitFlags: FlagRow[] = allVisits.flatMap((visit) => (visit.flags ?? []).map((flag): FlagRow => ({ ...flag, due_at: flag.status === "OPEN" ? (dueById[flag.id ?? 0] ?? null) : null })));
const attendanceFlags: FlagRow[] = attendanceSessions.flatMap((session) => (session.flags ?? []).map((flag): FlagRow => ({ ...flag, due_at: flag.status === "OPEN" ? (dueById[flag.id ?? 0] ?? null) : null })));

const extraFlags: FlagRow[] = [
  // مفتوحة
  make(8001, "STOCK_DISCREPANCY", "OPEN", samer, ["stock_discrepancy", 41], "2026-11-09T07:10:00Z", { item: "عينة حليب أطفال 50غ", batch_no: "LOT-2610-X", expected: 15, actual: 12, difference: -3, transfer_reference: "TR-2611-0042" }, "2026-11-11T14:00:00Z"),
  make(8002, "STOCK_DISCREPANCY", "OPEN", rami, ["stock_discrepancy", 42], "2026-11-05T09:00:00Z", { item: "حليب أطفال المرحلة الأولى 400غ", batch_no: "LOT-2611-A", expected: 240, actual: 228, difference: -12, count_id: 17 }, "2026-11-10T14:00:00Z"),
  make(8003, "CLOCK_SKEW", "OPEN", huda, ["sync_batch", 77], "2026-11-10T08:00:00Z", { skew_minutes: 12, device_time: "2026-11-10T08:12:00Z", server_time: "2026-11-10T08:00:00Z" }, "2026-11-14T05:00:00Z"),
  make(8004, "ATTENDANCE", "OPEN", huda, ["attendance_session", 973], "2026-11-04T13:05:00Z", { work_date: "2026-11-04", duration_minutes: 410, required_minutes: 480 }, "2026-11-09T14:00:00Z"),
  make(8006, "NEW_VISIT_POINT", "OPEN", samer, ["visit_point", 201], "2026-11-09T09:40:00Z", {}, "2026-11-12T11:00:00Z"),
  make(8007, "NEW_VISIT_POINT", "OPEN", omar, ["visit_point", 202], "2026-11-09T10:20:00Z", {}, "2026-11-12T12:00:00Z"),
  make(8008, "NEW_VISIT_POINT", "OPEN", huda, ["visit_point", 203], "2026-11-10T07:30:00Z", {}, "2026-11-13T07:00:00Z"),
  make(8009, "DUPLICATE_POINT", "OPEN", omar, ["visit_point", 204], "2026-11-10T08:15:00Z", { other_point_id: 205 }, "2026-11-13T08:00:00Z"),
  // مغلقة
  make(8010, "CLOCK_SKEW", "CLEARED", samer, ["sync_batch", 61], "2026-11-03T08:00:00Z", { skew_minutes: 7 }, null, {
    closed_by: monitoringUser,
    closed_at: "2026-11-04T07:30:00Z",
    note: "الساعة ضُبطت على الجهاز.",
    handling_work_hours: 11.5,
  }),
  make(8011, "STOCK_DISCREPANCY", "CONFIRMED", omar, ["stock_discrepancy", 38], "2026-11-02T09:00:00Z", { item: "عينة حليب أطفال 50غ", expected: 20, actual: 14, difference: -6 }, null, {
    closed_by: monitoringUser,
    closed_at: "2026-11-04T10:00:00Z",
    note: "فرق غير مبرَّر وسُجّل على المندوب.",
    handling_work_hours: 17,
  }),
  make(8012, "ATTENDANCE", "AUTO_CLEARED", huda, ["attendance_session", 963], "2026-11-03T13:00:00Z", { work_date: "2026-11-03" }, null, { closed_at: "2026-11-03T15:00:00Z", handling_work_hours: 0 }),
  make(8013, "STOCK_DISCREPANCY", "ESCALATED", samer, ["stock_discrepancy", 36], "2026-11-01T09:00:00Z", { item: "كتيّب توعية الرضاعة", expected: 60, actual: 41, difference: -19 }, null, {
    closed_by: monitoringUser,
    closed_at: "2026-11-03T11:00:00Z",
    note: "الفرق كبير ومتكرر، فحُوّلت لتحقيق.",
    investigation_id: escalatedInvestigationId,
    handling_work_hours: 14,
  }),
];

/** كل العلامات: الأحدث إنشاءً أولاً. */
export const flagsList: readonly FlagRow[] = [...visitFlags, ...attendanceFlags, ...extraFlags].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

export const findFlag = (id: number): FlagRow => {
  const found = flagsList.find((flag) => flag.id === id);
  if (!found) throw new Error(`علامة غير معرّفة في المعرض: ${id}`);
  return found;
};

/** معرّفات العلامات بالاسم: لصفحة S09. */
export const flagIds = { stock: 8001, clock: 8003, attendance: 8004, autoClosed: 1882, autoCleared: 8012, escalated: 8013, visit: 9001, newPoint: 8006, duplicate: 8009 } as const;

/** السجل المرتبط بالعلامة وصاحبه: تجلبه الحاوية بحسب `ref_type` (لا endpoint موحّد في العقد: §32.2). */
export function linkedRecordOf(flag: FlagRow): FlagLinkedRecord | null {
  const record = linkedRecordWithEmpties(flag);
  return record ? { ...record, items: record.items.filter((item) => item.value !== null) } : null;
}

function linkedRecordWithEmpties(flag: FlagRow): FlagLinkedRecord | null {
  const details = flag.details as Record<string, number | string | undefined>;
  switch (flag.type) {
    case "STOCK_DISCREPANCY":
      return {
        title: `فرق مخزون #${flag.ref_id}`,
        owner: flag.subject_user?.name ?? null,
        items: [
          { label: "الصنف", value: String(details.item ?? "—") },
          { label: "الدفعة", value: details.batch_no ? String(details.batch_no) : null },
          { label: "المتوقع", value: details.expected === undefined ? null : isolate(details.expected) },
          { label: "الفعلي", value: details.actual === undefined ? null : isolate(details.actual) },
          { label: "الفرق", value: details.difference === undefined ? null : isolate(details.difference) },
          { label: "الصرف المرتبط", value: details.transfer_reference ? String(details.transfer_reference) : null },
          { label: "الجرد المرتبط", value: details.count_id ? `جرد #${details.count_id}` : null },
        ],
      };
    case "CLOCK_SKEW":
      return {
        title: `دفعة مزامنة #${flag.ref_id}`,
        owner: flag.subject_user?.name ?? null,
        items: [
          { label: "فرق الساعة", value: details.skew_minutes === undefined ? null : `${details.skew_minutes} دقيقة` },
          { label: "ساعة الجهاز", value: details.device_time ? formatDateTime(String(details.device_time)) : null },
          { label: "ساعة الخادم", value: details.server_time ? formatDateTime(String(details.server_time)) : null },
        ],
      };
    case "ATTENDANCE":
      return {
        title: `جلسة دوام #${flag.ref_id}`,
        owner: flag.subject_user?.name ?? null,
        items: [
          { label: "يوم العمل", value: details.work_date ? String(details.work_date) : null },
          { label: "مدة الدوام", value: details.duration_minutes === undefined ? null : `${Math.floor(Number(details.duration_minutes) / 60)} س ${Number(details.duration_minutes) % 60} د` },
          { label: "المطلوب", value: details.required_minutes === undefined ? null : `${Number(details.required_minutes) / 60} ساعات` },
        ],
      };
    case "AUTO_CLOSED": {
      const session = attendanceSessions.find((entry) => entry.id === flag.ref_id);
      return {
        title: `جلسة دوام #${flag.ref_id}`,
        owner: flag.subject_user?.name ?? null,
        items: [
          { label: "يوم العمل", value: session?.work_date ?? null },
          { label: "بدأ", value: session?.started_at ? formatDateTime(session.started_at) : null },
          { label: "أُغلق آلياً", value: session?.ended_at ? formatDateTime(session.ended_at) : null },
        ],
      };
    }
    default:
      return null;
  }
}
