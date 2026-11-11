import type { BalanceLine, Location } from "@/lib/api/types";

// بيانات الأرصدة (W02): مواقع وأسطر رصيد بأنواع العقد. اليوم الثابت في المعرض 10 تشرين الثاني 2026. لا يُنقل للإنتاج.

export const balancesToday = "2026-11-10";

export const warehouseLocations = [
  { id: 1, type: "WAREHOUSE", name: "مستودع دمشق الرئيسي", is_active: true },
  { id: 2, type: "WAREHOUSE", name: "مستودع حلب", is_active: true },
] satisfies Location[];

export const otherLocations = [
  { id: 7, type: "AGENT", name: "وكالة الياسمين للتوزيع", is_active: true },
  { id: 9, type: "AGENT", name: "مؤسسة النور للتوزيع", is_active: true },
  { id: 8, type: "AGENT", name: "وكالة الساحل للتوزيع", is_active: true },
  { id: 14, type: "REP", name: "سامر الحلبي", is_active: true },
  { id: 15, type: "REP", name: "عمر الخطيب", is_active: true },
] satisfies Location[];

export const allLocations: Location[] = [...warehouseLocations, ...otherLocations];

export const balanceItems = [
  { id: 1, name: "حليب أطفال المرحلة الأولى 400غ", sku: "BL-INF1-400", type: "PRODUCT" },
  { id: 2, name: "حليب أطفال المرحلة الثانية 800غ", sku: "BL-INF2-800", type: "PRODUCT" },
  { id: 3, name: "سيريلاك أرز 250غ", sku: "CR-RICE-250", type: "PRODUCT" },
  { id: 4, name: "عينة حليب أطفال 50غ", sku: "SM-INF1-50", type: "SAMPLE" },
  { id: 5, name: "كتيّب توعية الرضاعة", sku: "PR-BKL-01", type: "PROMO" },
] as const;

const [infant1, infant2, cereal, sample, booklet] = balanceItems;

export const damascus = warehouseLocations[0];
export const aleppo = warehouseLocations[1];

export const batchA = { id: 31, batch_no: "LOT-2611-A", expiry_date: "2026-12-14", status: "ACTIVE" } as const;
export const batchB = { id: 32, batch_no: "LOT-2701-B", expiry_date: "2027-03-01", status: "ACTIVE" } as const;
export const batchC = { id: 33, batch_no: "LOT-2609-C", expiry_date: "2027-06-10", status: "SUSPENDED" } as const;
export const batchInf2A = { id: 41, batch_no: "LOT-2612-A", expiry_date: "2027-01-20", status: "ACTIVE" } as const;
export const batchInf2B = { id: 42, batch_no: "LOT-2703-B", expiry_date: "2027-05-02", status: "ACTIVE" } as const;
export const batchCereal = { id: 51, batch_no: "LOT-2611-S", expiry_date: "2027-02-11", status: "ACTIVE" } as const;
export const batchSample = { id: 61, batch_no: "LOT-2610-X", expiry_date: "2026-11-24", status: "ACTIVE" } as const;
export const batchBooklet = { id: 71, batch_no: "LOT-2612-P", expiry_date: "2027-06-30", status: "ACTIVE" } as const;

/** أرصدة مواقع المستودع (الحالة الافتراضية). */
export const warehouseBalances = [
  { location: damascus, item: infant1, batch: batchA, quantity: 240, in_transit_out: 0 },
  { location: damascus, item: infant1, batch: batchB, quantity: 600, in_transit_out: 120 },
  { location: damascus, item: infant1, batch: batchC, quantity: 120, in_transit_out: 0 },
  { location: damascus, item: infant2, batch: batchInf2A, quantity: 480, in_transit_out: 0 },
  { location: damascus, item: infant2, batch: batchInf2B, quantity: 960, in_transit_out: 240 },
  { location: damascus, item: cereal, batch: batchCereal, quantity: 300, in_transit_out: 0 },
  { location: damascus, item: sample, batch: batchSample, quantity: 80, in_transit_out: 0 },
  { location: damascus, item: booklet, batch: batchBooklet, quantity: 400, in_transit_out: 0 },
  { location: aleppo, item: infant1, batch: batchB, quantity: 360, in_transit_out: 0 },
  { location: aleppo, item: infant2, batch: batchInf2B, quantity: 420, in_transit_out: 60 },
  { location: aleppo, item: cereal, batch: batchCereal, quantity: 150, in_transit_out: 0 },
] satisfies BalanceLine[];

/** كل المواقع: مع الوكلاء والمندوبين. رصيد المندوب السالب جائز له وحده. */
export const allBalances = [
  ...warehouseBalances,
  { location: otherLocations[0], item: infant1, batch: batchB, quantity: 60, in_transit_out: 0 },
  { location: otherLocations[0], item: infant2, batch: batchInf2A, quantity: 120, in_transit_out: 0 },
  { location: otherLocations[1], item: infant1, batch: batchA, quantity: 180, in_transit_out: 48 },
  { location: otherLocations[2], item: cereal, batch: batchCereal, quantity: 96, in_transit_out: 0 },
  { location: otherLocations[3], item: sample, batch: batchSample, quantity: 12, in_transit_out: 0 },
  { location: otherLocations[3], item: booklet, batch: batchBooklet, quantity: 40, in_transit_out: 0 },
  { location: otherLocations[4], item: sample, batch: batchSample, quantity: -3, in_transit_out: 0 },
] satisfies BalanceLine[];

/** مواقع المستودع كما كانت في لحظة سابقة (قبل صرفيات الأسبوع): أرقام مختلفة. */
export const pastWarehouseBalances = [
  { location: damascus, item: infant1, batch: batchA, quantity: 300, in_transit_out: 0 },
  { location: damascus, item: infant1, batch: batchB, quantity: 840, in_transit_out: 0 },
  { location: damascus, item: infant1, batch: batchC, quantity: 120, in_transit_out: 0 },
  { location: damascus, item: infant2, batch: batchInf2A, quantity: 480, in_transit_out: 0 },
  { location: damascus, item: infant2, batch: batchInf2B, quantity: 1200, in_transit_out: 0 },
  { location: damascus, item: cereal, batch: batchCereal, quantity: 372, in_transit_out: 0 },
  { location: damascus, item: sample, batch: batchSample, quantity: 80, in_transit_out: 0 },
  { location: damascus, item: booklet, batch: batchBooklet, quantity: 400, in_transit_out: 0 },
  { location: aleppo, item: infant1, batch: batchB, quantity: 360, in_transit_out: 0 },
  { location: aleppo, item: infant2, batch: batchInf2B, quantity: 480, in_transit_out: 0 },
  { location: aleppo, item: cereal, batch: batchCereal, quantity: 150, in_transit_out: 0 },
] satisfies BalanceLine[];
