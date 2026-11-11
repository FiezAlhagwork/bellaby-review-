import type { EditorBatch } from "@/components/data/LineItemsEditor";
import { errorMessage } from "@/lib/api/error-messages";
import type { Location, SampleRequest, Transfer } from "@/lib/api/types";
import type { TransferForm, TransferOptions } from "@/features/stock/views/TransferFormView";
import type { Loadable } from "@/lib/loadable";
import { balanceItems, batchA, batchB, batchBooklet, batchC, batchCereal, batchInf2A, batchInf2B, batchSample, damascus, warehouseLocations } from "./stock-balances";
import { stockItems } from "./stock";

// بيانات صرف جديد (W06): مستودعات ووكلاء ومندوبون بأنواع العقد، دفعات المستودع بمتاحها، ونماذج لكل حالة. اليوم الثابت 10 تشرين الثاني 2026. لا يُنقل للإنتاج.

export const transferToday = "2026-11-10";

const agents = [
  { id: 7, type: "AGENT", name: "وكالة الياسمين للتوزيع", is_active: true, agent: { id: 7, name: "وكالة الياسمين للتوزيع" } },
  { id: 9, type: "AGENT", name: "مؤسسة النور للتوزيع", is_active: true, agent: { id: 9, name: "مؤسسة النور للتوزيع" } },
  { id: 8, type: "AGENT", name: "وكالة الساحل للتوزيع", is_active: true, agent: { id: 8, name: "وكالة الساحل للتوزيع" } },
] satisfies Location[];

const reps = [
  { id: 14, type: "REP", name: "سامر الحلبي", is_active: true, user: { id: 31, name: "سامر الحلبي" } },
  { id: 15, type: "REP", name: "عمر الخطيب", is_active: true, user: { id: 32, name: "عمر الخطيب" } },
] satisfies Location[];

export const transferOptions: TransferOptions = { sources: warehouseLocations, agents, reps, items: stockItems };

/** دفعات كل صنف ومتاحها في «مستودع دمشق الرئيسي» (من أرصدة W02). الموقوفة تظهر معطّلة. */
export const transferBatches: Record<string, Loadable<readonly EditorBatch[]>> = {
  "1": {
    status: "ready",
    data: [
      { ...batchA, available: 240 },
      { ...batchB, available: 600 },
      { ...batchC, available: 120 },
    ],
  },
  "2": {
    status: "ready",
    data: [
      { ...batchInf2A, available: 480 },
      { ...batchInf2B, available: 960 },
    ],
  },
  "3": { status: "ready", data: [{ ...batchCereal, available: 300 }] },
  "4": { status: "ready", data: [{ ...batchSample, available: 80 }] },
  "5": { status: "ready", data: [{ ...batchBooklet, available: 400 }] },
};

const base = { fromLocationId: "1", note: "" } as const;

/** وكيل ومنتجات: الدفعة المقترحة الأقرب انتهاءً (LOT-2611-A) والثاني LOT-2612-A. */
export const agentForm: TransferForm = {
  ...base,
  recipientKind: "AGENT",
  toLocationId: "7",
  note: "طلبية الأسبوع.",
  lines: [
    { id: "a", itemId: 1, batchId: 31, quantity: 120 },
    { id: "b", itemId: 2, batchId: 41, quantity: 60 },
  ],
};

/** مندوب وعينات ومواد. */
export const repForm: TransferForm = {
  ...base,
  recipientKind: "REP",
  toLocationId: "14",
  lines: [
    { id: "a", itemId: 4, batchId: 61, quantity: 10 },
    { id: "b", itemId: 5, batchId: 71, quantity: 20 },
  ],
};

/** المستلم مندوب وفي الأسطر منتج: لا يناسبه. */
export const mismatchForm: TransferForm = {
  ...base,
  recipientKind: "REP",
  toLocationId: "14",
  lines: [
    { id: "a", itemId: 1, batchId: 32, quantity: 24 },
    { id: "b", itemId: 4, batchId: 61, quantity: 5 },
  ],
};

/** دفعة موقوفة (LOT-2609-C) صارت موقوفة بعد اختيارها: الخادم يرفض. */
export const suspendedForm: TransferForm = {
  ...base,
  recipientKind: "AGENT",
  toLocationId: "7",
  lines: [{ id: "a", itemId: 1, batchId: 33, quantity: 12 }],
};
export const suspendedErrors = { "lines.0.batch_id": errorMessage("batch_suspended") };

/** كميات أكبر من المتاح (300 > 240 و400 > 300). */
export const insufficientForm: TransferForm = {
  ...base,
  recipientKind: "AGENT",
  toLocationId: "9",
  lines: [
    { id: "a", itemId: 1, batchId: 31, quantity: 300 },
    { id: "b", itemId: 3, batchId: 51, quantity: 400 },
  ],
};
export const insufficientErrors = { "lines.1.quantity": errorMessage("insufficient_stock") };

/** طلب عينات جديد للمندوب سامر الحلبي (W10 ← W06). */
export const sampleRequest: SampleRequest = {
  id: 21,
  rep: { id: 31, name: "سامر الحلبي" },
  requested_by: { id: 40, name: "د. هبة الأحمد" },
  status: "NEW",
  reason: "عينات لزيارة مستشفى الأطفال",
  lines: [
    { item: balanceItems[3], requested_quantity: 40, dispatched_quantity: null },
    { item: balanceItems[4], requested_quantity: 30, dispatched_quantity: null },
  ],
  transfer_id: null,
  created_at: "2026-11-09T11:00:00Z",
};

/** المعبّأ من الطلب: العينات كما طُلبت، والمواد أقل من المطلوب (20 من 30). */
export const fromSampleRequestForm: TransferForm = {
  ...base,
  recipientKind: "REP",
  toLocationId: "14",
  lines: [
    { id: "a", itemId: 4, batchId: 61, quantity: 40 },
    { id: "b", itemId: 5, batchId: 71, quantity: 20 },
  ],
};

/** رد `POST /transfers` 201. */
export const savedTransfer: Transfer = {
  id: 162,
  reference: "TRF-000162",
  from_location: damascus,
  to_location: agents[0],
  status: "IN_TRANSIT",
  lines: [
    { item: balanceItems[0], batch: batchA, quantity: 120 },
    { item: balanceItems[1], batch: batchInf2A, quantity: 60 },
  ],
  total_quantity: 180,
  sample_request_id: null,
  note: "طلبية الأسبوع.",
  created_by: { id: 3, name: "رامي السيد" },
  created_at: "2026-11-10T09:30:00Z",
  hours_in_transit: 0,
};
