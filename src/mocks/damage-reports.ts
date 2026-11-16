import type { EditorBatch } from "@/components/data/LineItemsEditor";
import type { DamageReportForm } from "@/features/damage/views/DamageReportFormView";
import { errorMessage } from "@/lib/api/error-messages";
import type { BatchRef, DamageReport, ItemRef, ListEntry, LocationRef, Responsibility, UserRef } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { aleppo, balanceItems, batchA, batchB, batchBooklet, batchC, batchCereal, batchInf2B, batchSample, damascus, warehouseLocations } from "./stock-balances";
import { stockItems } from "./stock";
import { transferBatches } from "./transfer-form";

// تقارير تالف المستودع (W20 وW21): 14 تقريراً بين 20 تشرين الأول و10 تشرين الثاني 2026 رفعها اللوجستي، و4 منها بانتظار قرار مدير المبيعات.
// #17 و#18 هما تقريرا التالف في حركات W03. الأوقات UTC. لا يُنقل للإنتاج.

export const damageToday = "2026-11-10";

const [infant1, infant2, cereal, sample, booklet] = balanceItems;

const rami: UserRef = { id: 3, name: "رامي السيد" };
const salesManager: UserRef = { id: 21, name: "طارق الدباغ" };

/** `GET /lists` ← `damage_reasons`. */
export const damageReasons = [
  { id: 1, name: "عبوة مثقوبة أو منبعجة", order: 1, is_active: true },
  { id: 2, name: "تلف بالتخزين (رطوبة أو حرارة)", order: 2, is_active: true },
  { id: 3, name: "انتهاء الصلاحية قبل البيع", order: 3, is_active: true },
  { id: 4, name: "تلف أثناء النقل", order: 4, is_active: true },
  { id: 5, name: "عيب تصنيع ظاهر", order: 5, is_active: true },
] satisfies ListEntry[];

const [punctured, storage, expired, transit, defect] = damageReasons;

/** مواقع المستودع: `GET /locations?type=WAREHOUSE`. */
export const damageLocations = warehouseLocations;

/** الأصناف الفعّالة كلها (التالف يشمل المنتجات والعينات والمواد). */
export const damageItems = stockItems;

const attachment = (id: string, name: string, mime = "image/jpeg") => ({ upload_id: id, url: `https://files.example.test/damage/${name}`, name, mime });

type Status = NonNullable<DamageReport["status"]>;
type Line = [item: ItemRef, batch: BatchRef, quantity: number];

function report(
  id: number,
  createdAt: string,
  location: LocationRef,
  status: Status,
  reason: ListEntry,
  lines: Line[],
  extra: { decidedAt?: string; responsibility?: Responsibility; decisionReason?: string; note?: string; attachments?: DamageReport["attachments"] } = {},
): DamageReport {
  const decided = status !== "PENDING";
  return {
    id,
    location,
    status,
    reason,
    lines: lines.map(([item, batch, quantity]) => ({ item, batch, quantity })),
    note: extra.note ?? null,
    attachments: extra.attachments ?? [],
    responsibility: status === "DAMAGED" ? (extra.responsibility ?? null) : null,
    created_by: rami,
    created_at: `2026-${createdAt}:00Z`,
    decided_by: decided ? salesManager : null,
    decided_at: decided && extra.decidedAt ? `2026-${extra.decidedAt}:00Z` : null,
    decision_reason: status === "REJECTED" ? (extra.decisionReason ?? null) : null,
    on_behalf_of: null,
  };
}

/** الأحدث أولاً (بتاريخ الرفع). */
export const damageReportsList: readonly DamageReport[] = [
  report(25, "11-10T08:45", damascus, "PENDING", punctured, [[infant1, batchA, 6]], {
    note: "ست علب مثقوبة من الجانب عُثر عليها عند ترتيب الرف.",
    attachments: [attachment("a1f0c0de-0001-4000-8000-000000000001", "damage-0001.jpg"), attachment("a1f0c0de-0002-4000-8000-000000000002", "damage-0002.jpg")],
  }),
  report(24, "11-10T07:50", aleppo, "PENDING", transit, [[infant2, batchInf2B, 12], [cereal, batchCereal, 4]], { note: "انقلب صندوقان في شاحنة التحويل من دمشق." }),
  report(23, "11-09T13:10", damascus, "PENDING", storage, [[booklet, batchBooklet, 30]], { attachments: [attachment("a1f0c0de-0003-4000-8000-000000000003", "damage-0003.jpg")] }),
  report(22, "11-09T09:05", damascus, "PENDING", expired, [[sample, batchSample, 8]]),
  report(21, "11-05T10:30", damascus, "DAMAGED", punctured, [[infant1, batchB, 9]], { decidedAt: "11-06T08:20", responsibility: "WAREHOUSE" }),
  report(20, "11-04T12:15", aleppo, "REJECTED", transit, [[infant2, batchInf2B, 40]], { decidedAt: "11-05T09:10", decisionReason: "الكمية المصرَّح بها أكبر من المتاح في الدفعة. أعد الجرد ثم ارفع تقريراً جديداً." }),
  report(19, "11-03T09:40", damascus, "DAMAGED", defect, [[infant1, batchC, 24]], { decidedAt: "11-04T07:55", responsibility: "MANUFACTURER", note: "عيب في اللحام ظاهر في العبوات." }),
  report(18, "11-09T14:00", damascus, "DAMAGED", storage, [[booklet, batchBooklet, 10]], { decidedAt: "11-10T07:30", responsibility: "OTHER", note: "تسرّب ماء من سقف الرف الأخير." }),
  report(17, "11-07T11:20", damascus, "DAMAGED", punctured, [[infant1, batchC, 12]], { decidedAt: "11-08T10:05", responsibility: "WAREHOUSE" }),
  report(16, "11-02T08:30", damascus, "REJECTED", expired, [[cereal, batchCereal, 20]], { decidedAt: "11-02T15:00", decisionReason: "الدفعة لم تنتهِ صلاحيتها بعد." }),
  report(15, "10-30T10:10", damascus, "DAMAGED", transit, [[infant1, batchA, 14]], { decidedAt: "10-31T09:00", responsibility: "AGENT", note: "عادت من الوكيل بعبوات منبعجة." }),
  report(14, "10-27T13:45", aleppo, "REJECTED", punctured, [[cereal, batchCereal, 6]], { decidedAt: "10-28T08:40", decisionReason: "لا مرفقات تثبت التلف." }),
  report(13, "10-24T09:25", aleppo, "DAMAGED", defect, [[infant2, batchInf2B, 18]], { decidedAt: "10-25T10:30", responsibility: "MANUFACTURER" }),
  report(12, "10-20T11:00", damascus, "DAMAGED", storage, [[infant1, batchB, 7], [sample, batchSample, 5]], { decidedAt: "10-21T08:15", responsibility: "WAREHOUSE" }),
].sort((a, b) => Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? ""));

/** دفعات كل صنف ومتاحها في كل مستودع (من أرصدة W02). الموقوفة قابلة للاختيار في التالف (القرار 2: يوثّق ما لا يُبعد الكمية). */
const aleppoBatches: Record<string, Loadable<readonly EditorBatch[]>> = {
  "1": { status: "ready", data: [{ ...batchB, available: 360 }] },
  "2": { status: "ready", data: [{ ...batchInf2B, available: 420 }] },
  "3": { status: "ready", data: [{ ...batchCereal, available: 150 }] },
  "4": { status: "ready", data: [] },
  "5": { status: "ready", data: [] },
};

export const damageBatchesFor = (locationId: string | null): Record<string, Loadable<readonly EditorBatch[]>> => (locationId === String(aleppo.id) ? aleppoBatches : transferBatches);

// لا تُستدعى دالة من ملف view هنا: صفحة الرسم خادم وملف الـ view عميل.
const base: DamageReportForm = { locationId: String(damascus.id), reasonId: null, note: "", lines: [{ id: "line-1", itemId: null, batchId: null, quantity: null }], attachments: [] };

/** نموذج معبّأ: عبوات مثقوبة، وسطران من دفعتين. */
export const filledDamageForm: DamageReportForm = {
  ...base,
  reasonId: String(punctured.id),
  note: "ست علب مثقوبة من الجانب عُثر عليها عند ترتيب الرف.",
  lines: [
    { id: "line-1", itemId: 1, batchId: batchA.id, quantity: 6 },
    { id: "line-2", itemId: 2, batchId: 41, quantity: 12 },
  ],
  attachments: [
    { id: "file-1", name: "damage-0001.jpg", size: 1_240_000, status: "done" },
    { id: "file-2", name: "damage-0002.jpg", size: 980_000, status: "done" },
  ],
};

/** رفع مرفق قيد التنفيذ: الزر معطّل وسببه ظاهر. */
export const uploadingDamageForm: DamageReportForm = {
  ...filledDamageForm,
  attachments: [
    { id: "file-1", name: "damage-0001.jpg", size: 1_240_000, status: "done" },
    { id: "file-3", name: "damage-0003.jpg", size: 2_310_000, status: "uploading", progress: 55 },
  ],
};

/** دفعة موقوفة: مسموحة في التالف، معلَّمة. */
export const suspendedDamageForm: DamageReportForm = {
  ...base,
  reasonId: String(defect.id),
  lines: [{ id: "line-1", itemId: 1, batchId: batchC.id, quantity: 24 }],
};

/** كمية أكبر من المتاح في الدفعة (240). */
export const insufficientDamageForm: DamageReportForm = {
  ...base,
  reasonId: String(transit.id),
  lines: [{ id: "line-1", itemId: 1, batchId: batchA.id, quantity: 300 }],
};

/** رفض الخادم (422 `validation_failed`): السبب غير موجود في القائمة، والملاحظة. */
export const invalidDamageForm: DamageReportForm = {
  ...filledDamageForm,
  reasonId: "5",
};

export const invalidDamageErrors = { reason_id: "السبب المختار غير فعّال. اختر سبباً آخر.", "lines.1.quantity": errorMessage("insufficient_stock") };

export const savedDamageReport: DamageReport = damageReportsList[0];
