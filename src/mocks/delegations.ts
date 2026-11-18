import type { Delegation, UserRef } from "@/lib/api/types";

// E18: GET /delegations (الأحدث أولاً). المرشّحون للتفويض بلا endpoint في العقد (docs/backend-requests.md §72). لا تُنقل للإنتاج.

export const delegationsToday = "2026-11-18";

const ziad: UserRef = { id: 1, name: "زياد المصري" };

export const delegationCandidates = [
  { id: 6, name: "رنا الشامي" },
  { id: 5, name: "باسل الخطيب" },
  { id: 3, name: "رامي السيد" },
  { id: 7, name: "هالة يوسف" },
] satisfies UserRef[];

export const pastDelegations = [
  { id: 3, delegate: { id: 6, name: "رنا الشامي" }, from: "2026-11-10", to: "2026-11-15", ended_at: null, created_by: ziad, is_current: false },
  { id: 2, delegate: { id: 5, name: "باسل الخطيب" }, from: "2026-08-02", to: "2026-08-12", ended_at: "2026-08-09T14:20:00Z", created_by: ziad, is_current: false },
  { id: 1, delegate: { id: 6, name: "رنا الشامي" }, from: "2026-04-14", to: "2026-04-20", ended_at: null, created_by: ziad, is_current: false },
] satisfies Delegation[];

export const currentDelegation = { id: 4, delegate: { id: 5, name: "باسل الخطيب" }, from: "2026-11-17", to: "2026-11-24", ended_at: null, created_by: ziad, is_current: true } satisfies Delegation;
