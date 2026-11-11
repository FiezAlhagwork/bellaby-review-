import type { AgentReturn, ExpiryAlert, LowStockAlert, StockCount, Task, Transfer } from "@/lib/api/types";
import { transfers } from "./transfers";

// بيانات لوحة المستودع (W01): أصناف ودفعات وصرفيات وإرجاعات وجرد ومهام بأنواع العقد. الوقت الثابت في المعرض 10 تشرين الثاني 2026 ظهراً.
// لا يُنقل للإنتاج.

export const dashboardNow = "2026-11-10T09:00:00Z";
export const dashboardToday = "2026-11-10";

const warehouse = { id: 1, type: "WAREHOUSE", name: "مستودع دمشق الرئيسي" } as const;

const infant1 = { id: 1, name: "حليب أطفال المرحلة الأولى 400غ", sku: "BL-INF1-400", type: "PRODUCT" } as const;
const infant2 = { id: 2, name: "حليب أطفال المرحلة الثانية 800غ", sku: "BL-INF2-800", type: "PRODUCT" } as const;
const cereal = { id: 3, name: "سيريلاك أرز 250غ", sku: "CR-RICE-250", type: "PRODUCT" } as const;
const sample = { id: 4, name: "عينة حليب أطفال 50غ", sku: "SM-INF1-50", type: "SAMPLE" } as const;
const booklet = { id: 5, name: "كتيّب توعية الرضاعة", sku: "PR-BKL-01", type: "PROMO" } as const;

const lowStockFew = [
  { item: infant1, warehouse_quantity: 180, min_stock: 300, since: "2026-11-04" },
  { item: cereal, warehouse_quantity: 40, min_stock: 100, since: "2026-11-08" },
] satisfies LowStockAlert[];

const lowStockMany = [
  ...lowStockFew,
  { item: infant2, warehouse_quantity: 90, min_stock: 240, since: "2026-11-02" },
  { item: sample, warehouse_quantity: 25, min_stock: 120, since: "2026-11-07" },
  { item: booklet, warehouse_quantity: 60, min_stock: 200, since: "2026-11-09" },
] satisfies LowStockAlert[];

const expiryFew = [
  { location: warehouse, item: infant1, batch: { id: 31, batch_no: "LOT-2611-A", expiry_date: "2026-12-14", status: "ACTIVE" }, quantity: 240, days_to_expiry: 34 },
  { location: warehouse, item: cereal, batch: { id: 51, batch_no: "LOT-2611-S", expiry_date: "2026-12-28", status: "ACTIVE" }, quantity: 300, days_to_expiry: 48 },
  { location: warehouse, item: infant2, batch: { id: 41, batch_no: "LOT-2612-A", expiry_date: "2027-01-08", status: "ACTIVE" }, quantity: 120, days_to_expiry: 59 },
] satisfies ExpiryAlert[];

const expiryMany = [
  { location: warehouse, item: sample, batch: { id: 61, batch_no: "LOT-2610-X", expiry_date: "2026-11-24", status: "ACTIVE" }, quantity: 80, days_to_expiry: 14 },
  ...expiryFew,
  { location: { id: 7, type: "AGENT", name: "وكالة الياسمين للتوزيع" }, item: infant1, batch: { id: 32, batch_no: "LOT-2701-B", expiry_date: "2027-01-05", status: "SUSPENDED" }, quantity: 60, days_to_expiry: 56 },
  { location: warehouse, item: booklet, batch: { id: 71, batch_no: "LOT-2612-P", expiry_date: "2027-01-02", status: "ACTIVE" }, quantity: 400, days_to_expiry: 53 },
] satisfies ExpiryAlert[];

/** صرف بالطريق ومضى عليه أكثر من 48 ساعة (الحاوية تصفّي GET /transfers?status=IN_TRANSIT بالعمر). */
const staleOne = transfers.filter((transfer) => transfer.id === 158);
const staleMany = [
  ...transfers.filter((transfer) => transfer.id === 158 || transfer.id === 161),
  { id: 152, reference: "TRF-000152", from_location: warehouse, to_location: { id: 18, type: "AGENT", name: "مؤسسة الجزيرة للتوزيع" }, status: "IN_TRANSIT", total_quantity: 1800, created_by: { id: 3, name: "رامي السيد" }, created_at: "2026-11-04T10:30:00Z" },
] satisfies Transfer[];

const agentReturnLine = (item: typeof infant1 | typeof infant2, quantity: number, batchNo: string, batchId: number) => ({
  item,
  batch: { id: batchId, batch_no: batchNo, expiry_date: "2027-03-01", status: "ACTIVE" as const },
  quantity,
});

const returnsMany = [
  { id: 31, agent: { id: 7, name: "وكالة الياسمين للتوزيع" }, to_location: warehouse, status: "IN_TRANSIT", reason: { id: 2, name: "إلغاء طلبية" }, lines: [agentReturnLine(infant1, 60, "LOT-2701-B", 32)], created_by: { id: 22, name: "ياسر الحمصي" }, created_at: "2026-11-08T13:00:00Z" },
  { id: 32, agent: { id: 9, name: "مؤسسة النور للتوزيع" }, to_location: warehouse, status: "IN_TRANSIT", reason: { id: 3, name: "منتج قريب الانتهاء" }, lines: [agentReturnLine(infant2, 120, "LOT-2612-A", 41), agentReturnLine(infant1, 48, "LOT-2611-A", 31)], created_by: { id: 24, name: "وليد الشامي" }, created_at: "2026-11-09T08:20:00Z" },
  { id: 33, agent: { id: 12, name: "مؤسسة الشام للتجارة" }, to_location: warehouse, status: "IN_TRANSIT", reason: { id: 2, name: "إلغاء طلبية" }, lines: [agentReturnLine(infant2, 36, "LOT-2703-B", 42)], created_by: { id: 26, name: "غدير المصري" }, created_at: "2026-11-10T06:45:00Z" },
] satisfies AgentReturn[];

const countsOne = [
  { id: 12, location: warehouse, status: "IN_PROGRESS", assigned_to: { id: 5, name: "سليم القاسم" }, created_by: { id: 3, name: "رامي السيد" }, created_at: "2026-11-09T09:30:00Z", submitted_at: null },
] satisfies StockCount[];

const countsMany = [
  ...countsOne,
  { id: 13, location: { id: 7, type: "AGENT", name: "وكالة الياسمين للتوزيع" }, status: "IN_PROGRESS", assigned_to: null, created_by: { id: 3, name: "رامي السيد" }, created_at: "2026-11-10T07:10:00Z", submitted_at: null },
] satisfies StockCount[];

export type WarehouseOverviewData = {
  lowStock: LowStockAlert[];
  expiryAlerts: ExpiryAlert[];
  staleTransfers: Transfer[];
  pendingReturns: AgentReturn[];
  activeCounts: StockCount[];
};

/** الحالة الافتراضية: يوم عادي، بعض التنبيهات. */
export const overviewDefault: WarehouseOverviewData = {
  lowStock: lowStockFew,
  expiryAlerts: expiryFew,
  staleTransfers: staleOne,
  pendingReturns: [],
  activeCounts: countsOne,
};

/** كل التنبيهات قائمة. */
export const overviewAlerts: WarehouseOverviewData = {
  lowStock: lowStockMany,
  expiryAlerts: expiryMany,
  staleTransfers: staleMany,
  pendingReturns: returnsMany,
  activeCounts: countsMany,
};

/** لا شيء ينتظر. */
export const overviewClear: WarehouseOverviewData = { lowStock: [], expiryAlerts: [], staleTransfers: [], pendingReturns: [], activeCounts: [] };

export const workerWork = {
  tasks: [
    { id: 410, title: "عدّ رفّ حليب المرحلة الأولى وتسجيل الفروقات", priority: "HIGH", source: "MANUAL", status: "IN_PROGRESS", is_overdue: false, assigned_by: { id: 3, name: "رامي السيد" }, assignee: { id: 5, name: "سليم القاسم" }, due_at: "2026-11-10T15:00:00Z" },
    { id: 407, title: "ترتيب دفعات الأسبوع حسب تاريخ الانتهاء", priority: "NORMAL", source: "MANUAL", status: "NEW", is_overdue: true, assigned_by: { id: 3, name: "رامي السيد" }, assignee: { id: 5, name: "سليم القاسم" }, due_at: "2026-11-09T15:00:00Z" },
    { id: 415, title: "تجهيز الصرفية TRF-000162 للتسليم", priority: "NORMAL", source: "MANUAL", status: "NEW", is_overdue: false, assigned_by: { id: 3, name: "رامي السيد" }, assignee: { id: 5, name: "سليم القاسم" }, due_at: "2026-11-11T09:00:00Z" },
  ] satisfies Task[],
  counts: countsOne,
};
