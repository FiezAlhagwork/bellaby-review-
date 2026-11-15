import type { LocationRef, Transfer, UserRef } from "@/lib/api/types";
import { transfers as dashboardTransfers } from "./transfers";

// قائمة الصرفيات (W07): 26 صرفاً بين 27 تشرين الأول و10 تشرين الثاني 2026، متسقة مع لوحة المستودع (152 و154–161) ومع صرف جديد (162).
// الوقت الثابت في المعرض 10 تشرين الثاني 2026 09:00 UTC، ومنه تُحسب `hours_in_transit` لما هو بالطريق. لا يُنقل للإنتاج.

export const transfersNow = "2026-11-10T09:00:00Z";
export const transfersToday = "2026-11-10";

const warehouse: LocationRef = { id: 1, type: "WAREHOUSE", name: "مستودع دمشق الرئيسي" };
const agent = (id: number, name: string): LocationRef => ({ id, type: "AGENT", name });
const rep = (id: number, name: string): LocationRef => ({ id, type: "REP", name });

export const transferRecipients = [
  agent(7, "وكالة الياسمين للتوزيع"),
  agent(9, "مؤسسة النور للتوزيع"),
  agent(8, "وكالة الساحل للتوزيع"),
  agent(12, "مؤسسة الشام للتجارة"),
  agent(18, "مؤسسة الجزيرة للتوزيع"),
  agent(21, "شركة الفرات للأغذية"),
  rep(14, "سامر الحلبي"),
  rep(15, "عمر الخطيب"),
  rep(16, "هدى العلي"),
] satisfies LocationRef[];

const [yasmeen, nour, sahel, sham, jazira, furat, samer, omar] = transferRecipients;

const ramy: UserRef = { id: 3, name: "رامي السيد" };
const laila: UserRef = { id: 4, name: "ليلى الأحمد" };

type Status = NonNullable<Transfer["status"]>;

/** الساعات الكاملة منذ الإنشاء حتى «الآن»: للصرف بالطريق وحده، وغيره `null`. */
const hoursInTransit = (createdAt: string, status: Status): number | null => (status === "IN_TRANSIT" ? Math.floor((Date.parse(transfersNow) - Date.parse(createdAt)) / 3_600_000) : null);

function transfer(id: number, createdAt: string, to: LocationRef, status: Status, totalQuantity: number, by: UserRef): Transfer {
  return {
    id,
    reference: `TRF-${String(id).padStart(6, "0")}`,
    from_location: warehouse,
    to_location: to,
    status,
    total_quantity: totalQuantity,
    created_by: by,
    created_at: createdAt,
    hours_in_transit: hoursInTransit(createdAt, status),
  };
}

const earlier: Transfer[] = [
  transfer(137, "2026-10-27T09:10:00Z", yasmeen, "RECEIVED", 480, ramy),
  transfer(138, "2026-10-27T11:40:00Z", nour, "RECEIVED", 960, ramy),
  transfer(139, "2026-10-28T08:30:00Z", samer, "RECEIVED", 36, laila),
  transfer(140, "2026-10-28T10:15:00Z", sham, "RECEIVED", 720, ramy),
  transfer(141, "2026-10-28T13:00:00Z", furat, "CANCELLED", 240, laila),
  transfer(142, "2026-10-29T09:00:00Z", sahel, "RECEIVED", 1200, ramy),
  transfer(143, "2026-10-29T12:20:00Z", omar, "RECEIVED", 60, laila),
  transfer(144, "2026-10-30T09:40:00Z", yasmeen, "RECEIVED", 600, ramy),
  transfer(145, "2026-10-30T11:10:00Z", jazira, "RECEIVED", 1500, ramy),
  transfer(146, "2026-10-31T08:50:00Z", rep(16, "هدى العلي"), "RECEIVED", 24, laila),
  transfer(147, "2026-10-31T10:30:00Z", nour, "RECEIVED", 480, ramy),
  transfer(148, "2026-11-01T09:20:00Z", sham, "RECEIVED", 300, laila),
  transfer(149, "2026-11-01T12:00:00Z", samer, "CANCELLED", 12, laila),
  transfer(150, "2026-11-02T09:05:00Z", furat, "RECEIVED", 840, ramy),
  transfer(151, "2026-11-03T10:00:00Z", sahel, "RECEIVED", 360, ramy),
  transfer(152, "2026-11-04T10:30:00Z", jazira, "IN_TRANSIT", 1800, ramy),
  transfer(153, "2026-11-04T13:15:00Z", omar, "RECEIVED", 48, laila),
];

/** 154–161 كما في لوحة المستودع، ومعها الساعات. */
const fromDashboard: Transfer[] = dashboardTransfers.map((row) => ({ ...row, hours_in_transit: hoursInTransit(row.created_at, row.status) }));

const newest: Transfer[] = [transfer(162, "2026-11-10T07:50:00Z", yasmeen, "IN_TRANSIT", 180, ramy)];

/** الأحدث أولاً (بالإنشاء)، كما يرجعها `GET /transfers`. */
export const transfersList: readonly Transfer[] = [...earlier, ...fromDashboard, ...newest].sort((a, b) => Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? ""));
