import type { EditorBatch, EditorItem } from "@/components/data/LineItemsEditor";
import type { BatchRef, ItemRef, StockCount, StockCountLine, UserRef } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { aleppo, balanceItems, batchA, batchB, batchBooklet, batchC, batchCereal, batchInf2A, batchInf2B, batchSample, damascus } from "./stock-balances";

// الجرد (W14 وW15 وW16): 15 جرداً في مستودعَي دمشق وحلب بين 20 تشرين الأول و10 تشرين الثاني 2026، بكل حالاته: قيد العدّ، ومرسل، ومُرجَع لإعادة العدّ،
// ومعتمد (ومنه بالتفويض)، وملغى. الأوقات UTC. لا يُنقل للإنتاج.

export const stockCountsToday = "2026-11-10";

export const rami: UserRef = { id: 3, name: "رامي السيد" };
export const salim: UserRef = { id: 5, name: "سليم القاسم" };
const layth: UserRef = { id: 52, name: "ليث العمر" };
export const ziad: UserRef = { id: 1, name: "زياد المصري" };
export const rana: UserRef = { id: 6, name: "رنا الشامي" };

/** عمال المستودع: خيارات «إسناد لعامل» وفلتر المكلَّف. */
export const stockCountWorkers: readonly UserRef[] = [salim, layth];

/** مواقع المستودع (`GET /locations?type=WAREHOUSE`). */
export const stockCountLocations = [damascus, aleppo];

const [infant1, infant2, cereal, sample, booklet] = balanceItems;

// ---- الأصناف والدفعات التي يُختار منها في العدّ، والمتوقع (رصيد النظام) لكل دفعة لحظة العدّ.

export const countItems: EditorItem[] = balanceItems.map((item) => ({ id: item.id, name: item.name, type: item.type }));

const entryBatch = (batch: BatchRef & { id: number; batch_no: string; expiry_date: string; status: "ACTIVE" | "SUSPENDED" }, available: number): EditorBatch => ({
  id: batch.id,
  batch_no: batch.batch_no,
  expiry_date: batch.expiry_date,
  status: batch.status,
  available,
});

/** دفعات كل صنف: الموقوفة قابلة للاختيار في الجرد (القرار 2). `available` هنا المتوقع لحظة العدّ. */
export const countBatches: Record<string, Loadable<readonly EditorBatch[]>> = {
  "1": { status: "ready", data: [entryBatch(batchA, 240), entryBatch(batchB, 600), entryBatch(batchC, 120)] },
  "2": { status: "ready", data: [entryBatch(batchInf2A, 480), entryBatch(batchInf2B, 960)] },
  "3": { status: "ready", data: [entryBatch(batchCereal, 300)] },
  "4": { status: "ready", data: [entryBatch(batchSample, 80)] },
  "5": { status: "ready", data: [entryBatch(batchBooklet, 400)] },
};

const expectedByBatch: Record<number, number> = { 31: 240, 32: 600, 33: 120, 41: 480, 42: 960, 51: 300, 61: 80, 71: 400 };

/** المتوقع لحظة حفظ السطر (رصيد النظام في المستودع، القرار 3). في الإنتاج يحسبه الخادم ويعيده في `StockCountLine.expected_qty`. */
export const expectedFor = (batchId: number): number => expectedByBatch[batchId] ?? 0;

// ---- الأسطر

type Spec = [item: ItemRef, batch: BatchRef, actual: number, at: string, superseded?: boolean];

let lineId = 100;
function line(by: UserRef, [item, batch, actual, at, superseded]: Spec): StockCountLine {
  const expected = expectedFor(batch.id ?? 0);
  return {
    id: ++lineId,
    item,
    batch,
    actual_qty: actual,
    expected_qty: expected,
    difference: actual - expected,
    counted_at: `2026-${at}:00Z`,
    counted_by: by,
    superseded: superseded ?? false,
  };
}

const withBatch = <T extends { id: number }>(batch: T) => batch as unknown as BatchRef;

type CountExtra = {
  assignedTo?: UserRef | null;
  createdBy?: UserRef;
  submittedAt?: string;
  approvedBy?: UserRef;
  approvedAt?: string;
  onBehalfOf?: UserRef;
  returnHistory?: NonNullable<StockCount["return_history"]>;
  cancelReason?: string;
};

function count(id: number, location: StockCount["location"], createdAt: string, status: NonNullable<StockCount["status"]>, lines: StockCountLine[], extra: CountExtra = {}): StockCount {
  return {
    id,
    location,
    status,
    assigned_to: extra.assignedTo ?? null,
    created_by: extra.createdBy ?? rami,
    created_at: `2026-${createdAt}:00Z`,
    submitted_at: extra.submittedAt ? `2026-${extra.submittedAt}:00Z` : null,
    approved_by: extra.approvedBy ?? null,
    approved_at: extra.approvedAt ? `2026-${extra.approvedAt}:00Z` : null,
    on_behalf_of: extra.onBehalfOf ?? null,
    return_history: extra.returnHistory ?? [],
    cancel_reason: extra.cancelReason ?? null,
    lines,
  };
}

const a = (item: ItemRef, batch: BatchRef, actual: number, at: string, superseded?: boolean): Spec => [item, batch, actual, at, superseded];

const oldestFirst: StockCount[] = [
  count(26, damascus, "10-20T07:30", "APPROVED", [
    line(rami, a(infant1, withBatch(batchA), 244, "10-20T09:10")),
    line(rami, a(infant1, withBatch(batchB), 600, "10-20T09:25")),
    line(rami, a(infant2, withBatch(batchInf2A), 480, "10-20T09:40")),
    line(rami, a(sample, withBatch(batchSample), 80, "10-20T10:05")),
  ], { submittedAt: "10-20T11:00", approvedBy: ziad, approvedAt: "10-21T08:20" }),
  count(27, aleppo, "10-22T08:00", "APPROVED", [
    line(layth, a(infant1, withBatch(batchB), 118, "10-22T10:00")),
    line(layth, a(cereal, withBatch(batchCereal), 300, "10-22T10:20")),
  ], { assignedTo: layth, submittedAt: "10-22T12:00", approvedBy: ziad, approvedAt: "10-23T09:00" }),
  count(28, damascus, "10-25T07:45", "CANCELLED", [], { cancelReason: "فُتح الجرد للموقع الخطأ، أُنشئ جرد جديد." }),
  count(29, damascus, "10-27T08:10", "APPROVED", [
    line(salim, a(infant1, withBatch(batchA), 240, "10-27T09:30")),
    line(salim, a(infant2, withBatch(batchInf2B), 955, "10-27T09:50")),
    line(salim, a(booklet, withBatch(batchBooklet), 400, "10-27T10:15")),
  ], { assignedTo: salim, submittedAt: "10-27T11:00", approvedBy: rana, approvedAt: "10-28T09:30", onBehalfOf: ziad }),
  count(30, aleppo, "11-02T09:00", "CANCELLED", [line(layth, a(infant1, withBatch(batchB), 600, "11-02T10:00"))], { assignedTo: layth, cancelReason: "تأجّل الجرد بسبب وصول شحنة جديدة." }),

  // قيد العدّ، بلا فروق (حالة in-progress).
  count(31, damascus, "11-05T07:30", "IN_PROGRESS", [
    line(salim, a(infant1, withBatch(batchA), 240, "11-05T09:05")),
    line(salim, a(infant2, withBatch(batchInf2A), 480, "11-05T09:20")),
    line(salim, a(cereal, withBatch(batchCereal), 300, "11-05T09:35")),
  ], { assignedTo: salim }),
  // قيد العدّ، فيه فروق (حالة with-diff).
  count(32, damascus, "11-06T07:40", "IN_PROGRESS", [
    line(rami, a(infant1, withBatch(batchA), 238, "11-06T09:00")),
    line(rami, a(infant1, withBatch(batchB), 600, "11-06T09:12")),
    line(rami, a(infant1, withBatch(batchC), 120, "11-06T09:25")),
    line(rami, a(infant2, withBatch(batchInf2B), 965, "11-06T09:40")),
    line(rami, a(sample, withBatch(batchSample), 80, "11-06T09:55")),
    line(rami, a(booklet, withBatch(batchBooklet), 392, "11-06T10:10")),
  ]),
  // مرسل بانتظار المدير التنفيذي (حالة submitted).
  count(33, damascus, "11-07T07:50", "SUBMITTED", [
    line(salim, a(infant1, withBatch(batchA), 240, "11-07T09:00")),
    line(salim, a(infant1, withBatch(batchB), 596, "11-07T09:15")),
    line(salim, a(infant2, withBatch(batchInf2A), 480, "11-07T09:30")),
    line(salim, a(sample, withBatch(batchSample), 77, "11-07T09:50")),
    line(salim, a(booklet, withBatch(batchBooklet), 400, "11-07T10:05")),
  ], { assignedTo: salim, submittedAt: "11-07T10:30" }),
  // أُرجع لإعادة العدّ: الأسطر القديمة في السجل وأسطر جديدة (حالة returned).
  count(34, damascus, "11-04T08:00", "IN_PROGRESS", [
    line(salim, a(infant1, withBatch(batchB), 560, "11-04T09:20", true)),
    line(salim, a(infant2, withBatch(batchInf2B), 960, "11-04T09:40", true)),
    line(salim, a(cereal, withBatch(batchCereal), 296, "11-04T10:00", true)),
    line(salim, a(infant1, withBatch(batchB), 598, "11-08T09:10")),
    line(salim, a(cereal, withBatch(batchCereal), 300, "11-08T09:30")),
  ], {
    assignedTo: salim,
    submittedAt: "11-04T10:40",
    returnHistory: [{ reason: "فرق 40 علبة في الدفعة LOT-2701-B كبير: أعد عدّها وراجع رفّ التخزين الثاني.", by: ziad, at: "2026-11-07T08:15:00Z" }],
  }),
  count(35, aleppo, "11-03T08:20", "APPROVED", [
    line(layth, a(infant1, withBatch(batchB), 600, "11-03T10:10")),
    line(layth, a(infant2, withBatch(batchInf2A), 474, "11-03T10:30")),
  ], { assignedTo: layth, submittedAt: "11-03T11:30", approvedBy: ziad, approvedAt: "11-04T08:40" }),
  count(36, damascus, "11-08T08:30", "CANCELLED", [], { assignedTo: salim, cancelReason: "أُلغي لتكليف جرد شامل بدلاً منه." }),
  // جرد أنشأه المفوَّض نفسه: لا يقرر فيما يخصّه (حالة self-decision-forbidden في W16).
  count(37, aleppo, "11-08T09:00", "SUBMITTED", [
    line(rana, a(infant1, withBatch(batchB), 590, "11-08T10:15")),
    line(rana, a(infant2, withBatch(batchInf2A), 480, "11-08T10:30")),
  ], { createdBy: rana, submittedAt: "11-08T11:00" }),
  count(38, damascus, "11-09T07:30", "IN_PROGRESS", [], { assignedTo: layth }),
  count(39, aleppo, "11-09T08:40", "SUBMITTED", [
    line(layth, a(infant1, withBatch(batchB), 600, "11-09T09:50")),
    line(layth, a(cereal, withBatch(batchCereal), 300, "11-09T10:10")),
  ], { assignedTo: layth, submittedAt: "11-09T11:00" }),
  count(40, damascus, "11-10T07:20", "IN_PROGRESS", [line(rami, a(sample, withBatch(batchSample), 80, "11-10T08:40"))]),
];

/** الأحدث أولاً (بالإنشاء)، كما يرجعها `GET /stock-counts`. */
export const stockCountsList: readonly StockCount[] = [...oldestFirst].sort((x, y) => Date.parse(y.created_at ?? "") - Date.parse(x.created_at ?? ""));

export function findStockCount(id: number): StockCount {
  const found = stockCountsList.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`جرد غير موجود في المعرض: ${id}`);
  return found;
}

/** رد `POST /stock-counts/{id}/lines` 201: السطر محفوظاً بالمتوقع لحظة الحفظ. */
export function savedLine(item: ItemRef, batch: BatchRef, actual: number, by: UserRef): StockCountLine {
  const expected = expectedFor(batch.id ?? 0);
  return { id: Date.now(), item, batch, actual_qty: actual, expected_qty: expected, difference: actual - expected, counted_at: "2026-11-10T10:00:00Z", counted_by: by, superseded: false };
}
