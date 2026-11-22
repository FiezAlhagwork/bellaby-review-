import type { Block, SecurityEvent, UserRef } from "@/lib/api/types";

// المحاولات غير المصرّح بها (I07) والحظر (I08): GET /security-events وGET /blocks. لا تُنقل للإنتاج.

export const securityNow = "2026-11-18T10:00:00Z";

const tarek: UserRef = { id: 9, name: "طارق النحاس" };

export const securityEvents = [
  { id: 41, kind: "UNBOUND_DEVICE", email: null, phone: "+963944123456", device_id: "77ab-0c1d-e2f3", ip: "5.155.12.40", occurred_at: "2026-11-18T07:12:00Z", action: null, note: null, handled_by: null, handled_at: null },
  { id: 40, kind: "UNKNOWN_EMAIL", email: "m.haddad@gmail.com", phone: null, device_id: null, ip: "31.9.44.120", occurred_at: "2026-11-17T19:40:00Z", action: null, note: null, handled_by: null, handled_at: null },
  { id: 39, kind: "BLOCKED_ATTEMPT", email: "spam.sender@mail.example", phone: null, device_id: null, ip: "178.52.9.3", occurred_at: "2026-11-17T08:05:00Z", action: null, note: null, handled_by: null, handled_at: null },
  { id: 38, kind: "UNKNOWN_EMAIL", email: "lama.hasan@gmail.com", phone: null, device_id: null, ip: "31.9.40.17", occurred_at: "2026-11-16T09:30:00Z", action: "IGNORED", note: "موظفة جديدة دخلت ببريدها الشخصي قبل إضافة بريد العمل. أُضيف حسابها.", handled_by: tarek, handled_at: "2026-11-16T10:05:00Z" },
  { id: 37, kind: "UNBOUND_DEVICE", email: null, phone: "+963933765432", device_id: "c0de-9911-aa55", ip: "5.155.30.8", occurred_at: "2026-11-14T06:50:00Z", action: "BLOCKED", note: "جهاز غير معروف حاول الدخول برقم مندوب. تأكدنا مع السوبرفايزر أنه ليس جهازه.", handled_by: tarek, handled_at: "2026-11-14T08:20:00Z" },
] satisfies SecurityEvent[];

export const blocks = [
  { id: 7, type: "DEVICE", value: "c0de-9911-aa55", reason: "جهاز غير معروف حاول الدخول برقم مندوب.", created_by: tarek, created_at: "2026-11-14T08:20:00Z", lifted_at: null, lift_reason: null, lifted_by: null },
  { id: 6, type: "EMAIL", value: "spam.sender@mail.example", reason: "محاولات دخول متكررة ببريد خارجي.", created_by: tarek, created_at: "2026-10-30T11:00:00Z", lifted_at: null, lift_reason: null, lifted_by: null },
  { id: 5, type: "EMAIL", value: "old.employee@trust.example", reason: "انتهاء عمل الموظف قبل تعطيل حسابه.", created_by: tarek, created_at: "2026-08-12T09:00:00Z", lifted_at: "2026-09-01T07:30:00Z", lift_reason: "عاد للعمل بعقد جديد.", lifted_by: tarek },
] satisfies Block[];

export const securityActor = tarek;
