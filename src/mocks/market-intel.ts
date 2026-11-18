import type { MarketIntel, UserRef } from "@/lib/api/types";
import { salesGovernorates } from "./sales";

// تقارير معلومات السوق (M16): 17 تقريراً من ثلاثة مندوبين بين 22 تشرين الأول و10 تشرين الثاني 2026، بحقول كل نوع. اليوم الثابت 10 تشرين الثاني. لا يُنقل للإنتاج.

export const marketIntelToday = "2026-11-10";

const samer: UserRef = { id: 31, name: "سامر الحلبي" };
const omar: UserRef = { id: 32, name: "عمر الخطيب" };
const huda: UserRef = { id: 33, name: "هدى العلي" };
const [damascus, rural, aleppo, homs] = salesGovernorates;

type Fields = Record<string, string | number | null>;

function report(id: number, reportedAt: string, rep: UserRef, governorate: (typeof salesGovernorates)[number], type: NonNullable<MarketIntel["type"]>, fields: Fields): MarketIntel {
  return { id, client_uuid: `6f1c0d52-7a3e-4c1b-9e0a-0000000000${String(id).padStart(2, "0")}`, rep, type, fields, governorate, reported_at: `2026-${reportedAt}:00Z` };
}

const oldestFirst: MarketIntel[] = [
  report(1, "10-22T07:40", samer, damascus, "COMPETITOR_PRICE", { competitor_brand: "نوتريكا", product_name: "حليب أطفال مرحلة أولى 400غ", price_syp: 118000, place: "صيدلية الشفاء، المزة" }),
  report(2, "10-24T08:15", omar, aleppo, "COMPETITOR_PRICE", { competitor_brand: "بيبي لاك", product_name: "حليب أطفال مرحلة ثانية 800غ", price_syp: 215000, place: "صيدلية الأمل، العزيزية" }),
  report(3, "10-25T09:05", huda, homs, "REQUESTED_PRODUCT", { product_name: "حليب خالٍ من اللاكتوز 400غ", requested_by: "أطباء أطفال", frequency: "متكرر" }),
  report(4, "10-27T10:30", samer, rural, "NEW_PRODUCT", { brand: "نوتريكا", product_name: "سيريلاك بالموز 200غ", details: "عبوة جديدة بسعر أقل من سيريلاكنا بـ8%" }),
  report(5, "10-28T07:50", omar, aleppo, "COMPETITOR_OFFER", { competitor_brand: "بيبي لاك", offer: "علبة مجانية مع كل خمس علب", valid_until: "2026-11-30" }),
  report(6, "10-29T11:10", huda, homs, "COMPETITOR_PRICE", { competitor_brand: "نوتريكا", product_name: "حليب أطفال مرحلة أولى 400غ", price_syp: 121000, place: "صيدلية النور، الحمراء" }),
  report(7, "10-30T08:25", samer, damascus, "REQUESTED_PRODUCT", { product_name: "عبوات 200غ للتجربة", requested_by: "صيادلة", frequency: "مرة واحدة" }),
  report(8, "11-01T09:40", omar, aleppo, "STAGNANT_PRODUCT", { item_id: 3, product_name: "سيريلاك أرز 250غ", place: "صيدليات حي الجميلية", details: "لا مبيع منذ ثلاثة أسابيع بسبب منافس أرخص" }),
  report(9, "11-02T07:55", samer, rural, "COMPETITOR_PRICE", { competitor_brand: "جونيور", product_name: "حليب أطفال مرحلة أولى 400غ", price_syp: 112000, place: "صيدلية الحياة، جرمانا" }),
  report(10, "11-03T10:00", huda, homs, "REQUESTED_PRODUCT", { product_name: "حليب مرحلة ثالثة 800غ", requested_by: "أمهات", frequency: "متكرر" }),
  report(11, "11-04T08:35", samer, damascus, "COMPETITOR_PRICE", { competitor_brand: "بيبي لاك", product_name: "حليب أطفال مرحلة أولى 400غ", price_syp: 124000, place: "صيدلية الرحمة، المهاجرين" }),
  report(12, "11-05T09:20", omar, aleppo, "NEW_PRODUCT", { brand: "جونيور", product_name: "حليب أطفال بالبروبيوتيك 400غ", details: "يُروَّج للأطباء بعينات مجانية" }),
  report(13, "11-06T07:45", huda, homs, "COMPETITOR_OFFER", { competitor_brand: "نوتريكا", offer: "خصم 10% للصيدليات عند شراء 10 علب", valid_until: null }),
  report(14, "11-07T11:30", omar, aleppo, "REQUESTED_PRODUCT", { product_name: "حليب أطفال عضوي", requested_by: "أطباء أطفال", frequency: "نادر" }),
  report(15, "11-08T08:10", samer, damascus, "COMPETITOR_PRICE", { competitor_brand: "جونيور", product_name: "حليب أطفال مرحلة ثانية 800غ", price_syp: 205000, place: "صيدلية الشفاء، المزة" }),
  report(16, "11-09T09:00", huda, homs, "STAGNANT_PRODUCT", { item_id: null, product_name: "فلاير تعريفي بالمنتجات", place: "عيادات الأطفال في حمص", details: "الأطباء لا يقرؤونه، يفضّلون العينات" }),
  report(17, "11-10T07:35", omar, aleppo, "COMPETITOR_PRICE", { competitor_brand: "نوتريكا", product_name: "سيريلاك أرز 250غ", price_syp: 64000, place: "صيدلية الأمل، العزيزية" }),
];

/** الأحدث أولاً، كما يرجعها `GET /market-intel`. */
export const marketIntelList: readonly MarketIntel[] = [...oldestFirst].sort((a, b) => Date.parse(b.reported_at ?? "") - Date.parse(a.reported_at ?? ""));
export const marketIntelGovernorates = [damascus, rural, aleppo, homs];
