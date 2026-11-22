import type { AppVersionSettings, SitePage, SiteSettings } from "@/lib/api/types";

// إصدارات التطبيق (I09) ومحتوى الموقع (I10): GET /settings/app-version وGET /site/pages/{slug}. الأصناف والوكلاء من mocks/items.ts وmocks/sales.ts. لا تُنقل للإنتاج.

export const appVersion = {
  min_app_version: "1.3.0",
  latest_app_version: "1.4.2",
  apk_url: "https://downloads.trust.example/bellaby/bellaby-1.4.2.apk",
} satisfies AppVersionSettings;

export const sitePages = {
  home: {
    slug: "home",
    title: "بداية جميلة لكل طفل",
    sections: [
      { type: "hero", content: { text: "حليب أطفال بمعايير عالمية، بين يديكِ في كل صيدلية." } },
      { type: "intro", content: { text: "Bellaby من Trust: تغذية متوازنة لكل مرحلة من عمر طفلك." } },
      { type: "featured", content: { text: "منتجاتنا الأكثر طلباً." } },
    ],
    featured_item_ids: [1, 2],
    images: [{ upload_id: "8f0c0e2a-0000-4000-8000-000000000001", name: "hero-mother-baby.jpg", mime: "image/jpeg", url: "https://files.trust.example/site/hero.jpg" }],
    seo_title: "Bellaby · حليب أطفال",
    seo_description: "حليب أطفال بمراحل النمو، متوفر في صيدليات سوريا.",
    updated_at: "2026-11-02T10:00:00Z",
  },
  about: {
    slug: "about",
    title: "من نحن",
    sections: [
      { type: "story", content: { text: "Trust شركة سورية لتوزيع حليب الأطفال منذ 2015." } },
      { type: "values", content: { text: "الجودة، والأمان، والقرب من الأم." } },
    ],
    featured_item_ids: [],
    images: [],
    seo_title: "من نحن · Bellaby",
    seo_description: null,
    updated_at: "2026-10-20T08:00:00Z",
  },
} satisfies Record<"home" | "about", SitePage>;

export const siteSettings = {
  breastfeeding_notice: "الرضاعة الطبيعية هي الغذاء الأمثل للرضيع. استشيري الطبيب قبل استعمال أي بديل لحليب الأم.",
  company_name: "Trust",
} satisfies SiteSettings;
