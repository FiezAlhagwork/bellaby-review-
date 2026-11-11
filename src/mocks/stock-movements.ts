import type { LocationRef, StockMovement, UserRef } from "@/lib/api/types";
import {
  aleppo,
  balanceItems,
  batchA,
  batchB,
  batchBooklet,
  batchC,
  batchCereal,
  batchInf2A,
  batchInf2B,
  batchSample,
  damascus,
  otherLocations,
} from "./stock-balances";

// حركات المخزون (W03): 44 حركة بين 27 تشرين الأول و10 تشرين الثاني 2026 بأنواع العقد كلها، ومنها حركة عكس. لا يُنقل للإنتاج.
// الأوقات UTC بين 07:00 و14:00 فيقع كل منها في اليوم نفسه بتوقيت دمشق. الكتابة من الأقدم إلى الأحدث، ويُقلب الترتيب في النهاية.

type Kind = NonNullable<StockMovement["kind"]>;

const [infant1, infant2, cereal, sample, booklet] = balanceItems;
const [agentYasmeen, agentNour, agentSahel, repSamer, repOmar] = otherLocations;

const ramy: UserRef = { id: 3, name: "رامي السيد" };
const salim: UserRef = { id: 5, name: "سليم القاسم" };
const yaser: UserRef = { id: 22, name: "ياسر الحمصي" };
const fadi: UserRef = { id: 21, name: "فادي العلي" };
const hala: UserRef = { id: 23, name: "هالة النجار" };
const rima: UserRef = { id: 25, name: "ريما الدباغ" };
const samer: UserRef = { id: 31, name: "سامر الحلبي" };
const omar: UserRef = { id: 32, name: "عمر الخطيب" };

type Item = (typeof balanceItems)[number];
type Batch = typeof batchA | typeof batchB | typeof batchC | typeof batchInf2A | typeof batchInf2B | typeof batchCereal | typeof batchSample | typeof batchBooklet;

function movement(
  id: number,
  at: string,
  kind: Kind,
  item: Item,
  batch: Batch,
  quantity: number,
  from: LocationRef | null,
  to: LocationRef | null,
  by: UserRef,
  ref: readonly [string, number],
  reversesId: number | null = null,
): StockMovement {
  const occurred = `2026-${at}:00Z`;
  const received = new Date(Date.parse(occurred) + 90_000).toISOString();
  return { id, item, batch, from_location: from, to_location: to, quantity, kind, ref_type: ref[0], ref_id: ref[1], reverses_id: reversesId, by, occurred_at: occurred, received_at: received };
}

const oldestFirst: StockMovement[] = [
  movement(201, "10-27T09:00", "RECEIPT", infant1, batchA, 300, null, damascus, ramy, ["stock_receipt", 60]),
  movement(202, "10-27T09:20", "RECEIPT", infant1, batchC, 120, null, damascus, ramy, ["stock_receipt", 60]),
  movement(203, "10-28T10:00", "RECEIPT", infant2, batchInf2A, 480, null, damascus, ramy, ["stock_receipt", 61]),
  movement(204, "10-28T11:10", "RECEIPT", booklet, batchBooklet, 400, null, damascus, ramy, ["stock_receipt", 62]),
  movement(205, "10-28T12:30", "RECEIPT", sample, batchSample, 80, null, damascus, ramy, ["stock_receipt", 62]),
  movement(206, "10-29T09:40", "TRANSFER", infant1, batchB, 360, damascus, aleppo, ramy, ["transfer", 150]),
  movement(207, "10-29T12:00", "TRANSFER", cereal, batchCereal, 150, damascus, aleppo, ramy, ["transfer", 151]),
  movement(208, "10-30T09:05", "RECEIPT", infant1, batchB, 840, null, damascus, ramy, ["stock_receipt", 63]),
  movement(209, "10-30T10:30", "TRANSFER", infant2, batchInf2B, 480, damascus, aleppo, ramy, ["transfer", 152]),
  movement(210, "10-30T13:15", "RECEIPT", cereal, batchCereal, 372, null, damascus, ramy, ["stock_receipt", 64]),
  movement(211, "10-31T09:50", "TRANSFER", infant1, batchB, 60, damascus, agentYasmeen, ramy, ["transfer", 153]),
  movement(212, "10-31T11:20", "TRANSFER", infant2, batchInf2A, 120, damascus, agentYasmeen, ramy, ["transfer", 153]),
  movement(213, "11-01T10:00", "WITHDRAW", sample, batchSample, 12, damascus, repSamer, ramy, ["withdraw_request", 41]),
  movement(214, "11-01T10:30", "WITHDRAW", booklet, batchBooklet, 40, damascus, repSamer, ramy, ["withdraw_request", 42]),
  movement(215, "11-02T09:10", "DELIVERY", infant1, batchB, 18, agentYasmeen, null, fadi, ["delivery", 501]),
  movement(216, "11-02T11:40", "DELIVERY", infant2, batchInf2A, 24, agentYasmeen, null, fadi, ["delivery", 502]),
  movement(217, "11-03T09:30", "TRANSFER", cereal, batchCereal, 96, damascus, agentSahel, ramy, ["transfer", 154]),
  movement(218, "11-03T12:00", "CUSTOMER_RETURN", infant1, batchA, 6, null, agentNour, hala, ["customer_return", 204]),
  movement(219, "11-04T10:20", "TRANSFER", infant1, batchA, 180, damascus, agentNour, ramy, ["transfer", 155]),
  movement(220, "11-04T11:05", "VISIT_DISTRIBUTION", sample, batchSample, 4, repSamer, null, samer, ["visit", 880]),
  movement(221, "11-05T09:45", "VISIT_DISTRIBUTION", sample, batchSample, 3, repOmar, null, omar, ["visit", 886]),
  movement(222, "11-05T13:00", "DELIVERY", cereal, batchCereal, 30, agentSahel, null, rima, ["delivery", 505]),
  // إدخال خاطئ ثم عكسه ثم إدخال صحيح.
  movement(223, "11-06T09:10", "RECEIPT", cereal, batchCereal, 300, null, damascus, ramy, ["stock_receipt", 75]),
  movement(224, "11-06T10:40", "REVERSAL", cereal, batchCereal, -300, damascus, null, ramy, ["stock_receipt", 75], 223),
  movement(225, "11-06T10:55", "RECEIPT", cereal, batchCereal, 300, null, damascus, ramy, ["stock_receipt", 78]),
  movement(226, "11-06T13:10", "TRANSFER", infant1, batchB, 120, damascus, agentYasmeen, ramy, ["transfer", 158]),
  movement(227, "11-07T09:00", "WITHDRAW", booklet, batchBooklet, 20, damascus, repSamer, ramy, ["withdraw_request", 43]),
  movement(228, "11-07T10:20", "DISCREPANCY", sample, batchSample, -3, repOmar, null, ramy, ["stock_discrepancy", 9]),
  movement(229, "11-07T11:00", "VISIT_DISTRIBUTION", booklet, batchBooklet, 20, repSamer, null, samer, ["visit", 897]),
  movement(230, "11-07T12:40", "DELIVERY", infant2, batchInf2A, 30, agentNour, null, rima, ["delivery", 508]),
  movement(231, "11-08T09:15", "TRANSFER", cereal, batchCereal, 96, damascus, agentSahel, ramy, ["transfer", 159]),
  movement(232, "11-08T10:05", "DAMAGE", infant1, batchC, 12, damascus, null, salim, ["damage_report", 17]),
  movement(233, "11-08T11:30", "CUSTOMER_RETURN", cereal, batchCereal, 6, null, agentSahel, hala, ["customer_return", 205]),
  movement(234, "11-08T13:00", "AGENT_RETURN", infant1, batchB, 60, agentYasmeen, damascus, yaser, ["agent_return", 31]),
  movement(235, "11-09T08:20", "TRANSFER", infant1, batchA, 180, damascus, agentNour, ramy, ["transfer", 160]),
  movement(236, "11-09T09:30", "RECEIPT", infant1, batchB, 600, null, damascus, ramy, ["stock_receipt", 77]),
  // تسوية الجرد موقّعة: السالب نقص والموجب زيادة.
  movement(237, "11-09T10:10", "COUNT_ADJUSTMENT", cereal, batchCereal, -4, damascus, null, salim, ["stock_count", 12]),
  movement(238, "11-09T10:12", "COUNT_ADJUSTMENT", infant1, batchA, 6, null, damascus, salim, ["stock_count", 12]),
  movement(239, "11-09T11:45", "WITHDRAW", sample, batchSample, 5, damascus, repOmar, ramy, ["withdraw_request", 44]),
  movement(240, "11-09T13:20", "DELIVERY", infant1, batchB, 24, agentYasmeen, null, fadi, ["delivery", 512]),
  movement(241, "11-10T07:30", "DAMAGE", booklet, batchBooklet, 10, damascus, null, salim, ["damage_report", 18]),
  movement(242, "11-10T08:05", "VISIT_DISTRIBUTION", sample, batchSample, 2, repSamer, null, samer, ["visit", 902]),
  movement(243, "11-10T08:40", "AGENT_RETURN", infant2, batchInf2B, 36, agentYasmeen, damascus, yaser, ["agent_return", 33]),
  movement(244, "11-10T09:12", "TRANSFER", infant2, batchInf2B, 240, damascus, agentNour, ramy, ["transfer", 161]),
];

/** الأحدث أولاً، كما يرجعها `GET /stock/movements`. */
export const stockMovements: readonly StockMovement[] = [...oldestFirst].reverse();

export const movementsToday = "2026-11-10";
