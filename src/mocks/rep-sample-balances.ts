import type { BalanceLine } from "@/lib/api/types";
import { batchBooklet, batchSample } from "./stock-balances";
import { bag, cerealSample, flyer, sampleRequestReps } from "./sample-requests";
import { balanceItems } from "./stock-balances";
import { distributedKey } from "@/features/stock/views/RepSampleBalancesView";

// أرصدة عينات المندوبين (M17): ثلاثة مندوبين بعينات ومواد دعائية، وما وزّعوه في تشرين الثاني 2026. اليوم الثابت 10 تشرين الثاني. لا يُنقل للإنتاج.

export const repBalancesToday = "2026-11-10";

/** الحدّ التجريبي للرصيد المنخفض في المعرض فقط: العقد لا يحدّده بعد (docs/backend-requests.md §55). */
export const repLowBelow = 10;

const [samer, omar, huda] = sampleRequestReps;
const [, , , sample, booklet] = balanceItems;

const batchCerealSample = { id: 62, batch_no: "LOT-2610-S", expiry_date: "2027-01-15", status: "ACTIVE" } as const;
const batchFlyer = { id: 72, batch_no: "LOT-2611-F", expiry_date: "2028-06-30", status: "ACTIVE" } as const;
const batchBag = { id: 73, batch_no: "LOT-2609-B", expiry_date: "2028-03-31", status: "ACTIVE" } as const;

const loc = (rep: (typeof sampleRequestReps)[number]) => ({ id: rep.id, type: rep.type, name: rep.name });

/** الحالة الافتراضية: كل الأرصدة كافية. */
export const repBalancesHealthy = [
  { location: loc(samer), item: sample, batch: batchSample, quantity: 28, in_transit_out: 0 },
  { location: loc(samer), item: booklet, batch: batchBooklet, quantity: 36, in_transit_out: 0 },
  { location: loc(samer), item: flyer, batch: batchFlyer, quantity: 40, in_transit_out: 0 },
  { location: loc(omar), item: sample, batch: batchSample, quantity: 24, in_transit_out: 0 },
  { location: loc(omar), item: cerealSample, batch: batchCerealSample, quantity: 24, in_transit_out: 0 },
  { location: loc(omar), item: bag, batch: batchBag, quantity: 30, in_transit_out: 0 },
  { location: loc(huda), item: booklet, batch: batchBooklet, quantity: 18, in_transit_out: 0 },
  { location: loc(huda), item: flyer, batch: batchFlyer, quantity: 22, in_transit_out: 0 },
] satisfies BalanceLine[];

/** حالة `low`: رصيدان منخفضان وواحد سالب (بعد تعارض في المزامنة). */
export const repBalancesLow = [
  { location: loc(samer), item: sample, batch: batchSample, quantity: 28, in_transit_out: 0 },
  { location: loc(samer), item: booklet, batch: batchBooklet, quantity: 36, in_transit_out: 0 },
  { location: loc(omar), item: sample, batch: batchSample, quantity: 6, in_transit_out: 0 },
  { location: loc(omar), item: cerealSample, batch: batchCerealSample, quantity: 24, in_transit_out: 0 },
  { location: loc(huda), item: sample, batch: batchSample, quantity: -3, in_transit_out: 0 },
  { location: loc(huda), item: booklet, batch: batchBooklet, quantity: 4, in_transit_out: 0 },
  { location: loc(huda), item: flyer, batch: batchFlyer, quantity: 22, in_transit_out: 0 },
] satisfies BalanceLine[];

/** ما وزّعه كل مندوب هذا الشهر (مجموع زياراته): من الأرصدة نفسها بمفتاح الموقع والصنف. */
const distributedByRep: Record<string, number> = { "14-4": 52, "14-5": 14, "14-7": 36, "15-4": 40, "15-6": 12, "15-8": 20, "16-4": 28, "16-5": 21, "16-7": 18 };

export const repDistributed: Readonly<Record<string, number>> = Object.fromEntries([...repBalancesHealthy, ...repBalancesLow].map((line) => [distributedKey(line), distributedByRep[distributedKey(line)] ?? 0]));

export const repLocations = sampleRequestReps.map(loc);
export const repBalanceItems = [sample, cerealSample, booklet, flyer, bag];
