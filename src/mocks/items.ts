import type { Item, PricePeriod, UserRef } from "@/lib/api/types";

// الأصناف وسجلات أسعارها وتكاليفها (E10 · E11 · E12). اليوم الثابت 10 تشرين الثاني 2026. لا يُنقل للإنتاج.

export const itemsToday = "2026-11-10";

const ziad: UserRef = { id: 1, name: "زياد المصري" };

function item(id: number, name: string, sku: string, type: Item["type"], extra: Partial<Item> = {}): Item {
  return { id, name, sku, type, portfolio: null, min_stock: null, is_active: true, current_price: null, current_unit_cost: null, show_on_site: false, site: null, created_at: "2026-01-15T08:00:00Z", ...extra };
}

export const itemsList: readonly Item[] = [
  item(1, "حليب أطفال المرحلة الأولى 400غ", "BL-INF1-400", "PRODUCT", {
    portfolio: "CORE",
    min_stock: 300,
    current_price: "12.50",
    show_on_site: true,
    site: { slug: "infant-formula-stage-1", description: "حليب أطفال متكامل للرضّع من الولادة، غني بالحديد والفيتامينات وأوميغا 3.", ingredients: "حليب خالي الدسم، زيوت نباتية، لاكتوز، فيتامينات ومعادن.", age_range: "من الولادة حتى 6 أشهر", image_url: null },
  }),
  item(2, "حليب أطفال المرحلة الثانية 800غ", "BL-INF2-800", "PRODUCT", {
    portfolio: "CORE",
    min_stock: 200,
    current_price: "21.00",
    show_on_site: true,
    site: { slug: "follow-on-formula-stage-2", description: "حليب متابعة للأطفال من 6 إلى 12 شهراً.", ingredients: "حليب، زيوت نباتية، فيتامينات ومعادن.", age_range: "6–12 شهراً", image_url: null },
  }),
  item(3, "سيريلاك أرز 250غ", "CR-RICE-250", "PRODUCT", { portfolio: "GROWTH", min_stock: 150, current_price: "6.75", show_on_site: false }),
  item(9, "حليب أطفال خالٍ من اللاكتوز 400غ", "BL-LF-400", "PRODUCT", { portfolio: "TRIAL", min_stock: 50, current_price: null, created_at: "2026-11-08T09:00:00Z" }),
  item(4, "عينة حليب أطفال 50غ", "SM-INF1-50", "SAMPLE", { min_stock: 100, current_unit_cost: "1.20" }),
  item(6, "عينة سيريلاك أرز 30غ", "SM-RICE-30", "SAMPLE", { min_stock: 60, current_unit_cost: "0.65" }),
  item(5, "كتيّب توعية الرضاعة", "PR-BKL-01", "PROMO", { min_stock: 200, current_unit_cost: "0.40" }),
  item(7, "فلاير تعريفي بالمنتجات", "PR-FLY-01", "PROMO", { current_unit_cost: "0.08" }),
  item(10, "حليب أطفال المرحلة الأولى 900غ (قديم)", "BL-INF1-900", "PRODUCT", { portfolio: "CORE", is_active: false, current_price: "24.00", created_at: "2025-06-01T08:00:00Z" }),
];

export const findItem = (id: number): Item => itemsList.find((entry) => entry.id === id) ?? itemsList[0];

/** سجل الأسعار أو التكلفة: الأحدث أولاً. منتج 1 بسعر مستقبلي يبدأ بداية كانون الأول. */
export const periodsByItem: Readonly<Record<number, readonly PricePeriod[]>> = {
  1: [
    { id: 105, amount: "13.00", starts_on: "2026-12-01", ends_on: null, created_by: ziad },
    { id: 104, amount: "12.50", starts_on: "2026-07-01", ends_on: "2026-11-30", created_by: ziad },
    { id: 103, amount: "11.75", starts_on: "2026-02-01", ends_on: "2026-06-30", created_by: ziad },
    { id: 102, amount: "11.00", starts_on: "2026-01-15", ends_on: "2026-01-31", created_by: ziad },
  ],
  4: [
    { id: 402, amount: "1.20", starts_on: "2026-09-01", ends_on: null, created_by: ziad },
    { id: 401, amount: "1.05", starts_on: "2026-01-15", ends_on: "2026-08-31", created_by: ziad },
  ],
  9: [],
};

export const periodsOf = (id: number): readonly PricePeriod[] => periodsByItem[id] ?? [];
