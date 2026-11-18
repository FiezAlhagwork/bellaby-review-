import type { AccessLog, AuditLog, UserRef } from "@/lib/api/types";

// سجل التدقيق وسجل الاطلاع على السري (E02): 24 إجراءً و10 اطلاعات بين 3 و10 تشرين الثاني 2026، الأحدث أولاً. الأوقات UTC. لا يُنقل للإنتاج.

export const auditToday = "2026-11-10";

const ziad: UserRef = { id: 1, name: "زياد المصري" };
const rami: UserRef = { id: 3, name: "رامي السيد" };
const rana: UserRef = { id: 6, name: "رنا الشامي" };
const heba: UserRef = { id: 40, name: "د. هبة الأحمد" };
const nour: UserRef = { id: 10, name: "نور الحسيني" };
const fadi: UserRef = { id: 60, name: "فادي حداد" };
const lawyer: UserRef = { id: 70, name: "أ. سامي الخوري" };

export const auditUsers: readonly UserRef[] = [ziad, rami, rana, heba, nour, fadi, lawyer];

type Changes = { before?: Record<string, unknown>; after?: Record<string, unknown> };

let next = 5000;
function log(at: string, user: UserRef | null, action: string, entityType: string, entityId: number, changes: Changes = {}, onBehalfOf: UserRef | null = null): AuditLog {
  next += 1;
  return { id: next, user, on_behalf_of: onBehalfOf, action, entity_type: entityType, entity_id: entityId, changes: { before: changes.before ?? {}, after: changes.after ?? {} }, ip: user ? `10.0.4.${(next % 50) + 10}` : null, created_at: `2026-11-${at}:00Z` };
}

const oldestFirst: AuditLog[] = [
  log("03T07:10", rami, "created", "transfer", 151, { after: { status: "IN_TRANSIT", to_location_id: 7 } }),
  log("03T08:40", ziad, "approved", "stock_count", 44, { before: { status: "SUBMITTED" }, after: { status: "APPROVED" } }),
  log("03T11:05", rana, "approved", "customer_return", 302, { before: { status: "PENDING" }, after: { status: "RESTOCKED" } }, ziad),
  log("04T06:55", fadi, "updated", "user", 33, { before: { governorate_ids: [4] }, after: { governorate_ids: [4, 5] } }),
  log("04T09:30", nour, "updated", "visit", 31092, { before: { verification_status: "FLAGGED" }, after: { verification_status: "CONFIRMED" } }),
  log("04T12:15", ziad, "suspended", "batch", 33, { before: { status: "ACTIVE" }, after: { status: "SUSPENDED", reason: "شكوى جودة من صيدلية" } }),
  log("05T07:45", heba, "created", "plan", 211, { after: { month: "2026-12", status: "DRAFT" } }),
  log("05T10:20", rana, "rejected", "delivery", 2121, { before: { status: "APPROVAL_PENDING" }, after: { status: "UNPAID", decision: "REJECTED" } }, ziad),
  log("05T13:00", null, "updated", "visit", 33100, { before: { status: "IN_PROGRESS" }, after: { status: "COMPLETED", close_source: "AUTO" } }),
  log("06T08:10", ziad, "created", "delegation", 9, { after: { delegate_id: 6, from: "2026-11-06", to: "2026-11-12" } }),
  log("06T09:25", fadi, "deactivated", "user", 21, { before: { is_active: true }, after: { is_active: false } }),
  log("06T11:40", nour, "merged", "visit_point", 115, { before: { status: "ACTIVE" }, after: { status: "DISABLED", merged_into_id: 106 } }),
  log("07T07:30", rami, "cancelled", "transfer", 154, { before: { status: "IN_TRANSIT" }, after: { status: "CANCELLED" } }),
  log("07T10:05", ziad, "updated", "setting", 3, { before: { visit_range_m: 150 }, after: { visit_range_m: 200 } }),
  log("07T14:20", lawyer, "updated", "dispute", 12, { before: { stage: "NOTICE" }, after: { stage: "NEGOTIATION" } }),
  log("08T08:00", rana, "approved", "agent_return", 88, { before: { status: "PENDING" }, after: { status: "IN_TRANSIT" } }, ziad),
  log("08T09:50", heba, "updated", "visit_point", 101, { before: { phone: "+963944771122" }, after: { phone: "+963944771133" } }),
  log("08T12:30", ziad, "unsuspended", "batch", 33, { before: { status: "SUSPENDED" }, after: { status: "ACTIVE" } }),
  log("09T07:15", rami, "approved", "damage_report", 71, { before: { status: "PENDING" }, after: { status: "DAMAGED", responsibility: "MANUFACTURER" } }),
  log("09T10:45", ziad, "approved", "budget", 26, { before: { "lines.2.budget": "2000.00" }, after: { "lines.2.budget": "2500.00" } }),
  log("09T13:10", nour, "created", "investigation", 18, { after: { subject_user_id: 32, stage: "OPEN" } }),
  log("10T06:40", fadi, "activated", "user", 37, { before: { is_active: false }, after: { is_active: true } }),
  log("10T07:55", rana, "approved", "delivery", 2122, { before: { status: "APPROVAL_PENDING" }, after: { status: "WRITTEN_OFF", decision: "APPROVED" } }, ziad),
  log("10T08:30", ziad, "updated", "delegation", 9, { before: { to: "2026-11-12" }, after: { to: "2026-11-14" } }),
];

/** الأحدث أولاً، كما يرجعها `GET /audit-logs`. */
export const auditLogs: readonly AuditLog[] = [...oldestFirst].reverse();

/** سجلات فيها تفويض: لحالة التفاصيل. */
export const delegatedLog = auditLogs.find((entry) => entry.on_behalf_of) ?? auditLogs[0];

function view(at: string, user: UserRef, entityType: NonNullable<AccessLog["entity_type"]>, entityId: number): AccessLog {
  return { user, entity_type: entityType, entity_id: entityId, viewed_at: `2026-11-${at}:00Z` };
}

/** `GET /access-logs`: الأحدث أولاً. */
export const accessLogs: readonly AccessLog[] = [
  view("10T08:05", ziad, "investigation", 18),
  view("10T07:40", nour, "investigation", 18),
  view("09T15:10", lawyer, "dispute", 12),
  view("09T11:20", ziad, "contract", 4),
  view("08T13:45", lawyer, "legal_document", 31),
  view("08T09:00", ziad, "dispute", 12),
  view("07T14:30", lawyer, "dispute", 12),
  view("06T10:15", nour, "investigation", 17),
  view("05T12:00", ziad, "legal_document", 31),
  view("04T08:50", fadi, "contract", 4),
];
