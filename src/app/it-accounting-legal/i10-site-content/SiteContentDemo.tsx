"use client";

import { useState } from "react";
import type { UploadFile } from "@/components/ui/FileUpload";
import { SiteContentView, draftOfPage, type NoticeDraft, type PageDraft, type PageSlug, type SiteTab } from "@/features/site-content/views/SiteContentView";
import type { Agent, Item, SitePage } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { itemsList } from "@/mocks/items";
import { salesAgents } from "@/mocks/sales";
import { sitePages, siteSettings } from "@/mocks/site-content";

// غلاف تفاعلي لصفحة الرسم (I10): يملك التبويب والمسودات. الحفظ كما تفعل PUT /site/pages/{slug} وPATCH /items/{id} وPATCH /agents/{id} وPUT /settings/site. لا يُنقل للإنتاج.

type SiteContentDemoProps = { initialTab?: SiteTab; mode?: "ready" | "loading" | "error" };

const imagesOf = (page: SitePage): UploadFile[] => (page.images ?? []).map((image, index) => ({ id: image.upload_id ?? `img-${index}`, name: image.name ?? "", size: 412000, status: "done" }));

export function SiteContentDemo({ initialTab = "pages", mode = "ready" }: SiteContentDemoProps) {
  const [tab, setTab] = useState<SiteTab>(initialTab);
  const [slug, setSlug] = useState<PageSlug>("home");
  const [pages, setPages] = useState<Record<PageSlug, SitePage>>(sitePages);
  const [draft, setDraft] = useState<PageDraft>(() => draftOfPage(sitePages.home));
  const [images, setImages] = useState<readonly UploadFile[]>(() => imagesOf(sitePages.home));
  const [products, setProducts] = useState<readonly Item[]>(() => itemsList.filter((item) => item.type === "PRODUCT"));
  const [agents, setAgents] = useState<readonly Agent[]>(salesAgents);
  const [notice, setNotice] = useState<NoticeDraft>({ notice: siteSettings.breastfeeding_notice, companyName: siteSettings.company_name });
  const [saved, setSaved] = useState<string | undefined>();

  const state = <T,>(data: T): Loadable<T> => (mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data });

  return (
    <SiteContentView
      tab={tab}
      onTabChange={(next) => {
        setTab(next);
        setSaved(undefined);
      }}
      canManage
      savedMessage={saved}
      pageSlug={slug}
      onPageSlugChange={(next) => {
        setSlug(next);
        setDraft(draftOfPage(pages[next]));
        setImages(imagesOf(pages[next]));
        setSaved(undefined);
      }}
      page={state(pages[slug])}
      pageDraft={draft}
      onPageDraftChange={setDraft}
      images={images}
      onImageSelect={(files) => setImages([...images, ...files.map((file, index) => ({ id: `new-${images.length + index}`, name: file.name, size: file.size, status: "done" as const }))])}
      onImageRemove={(id) => setImages(images.filter((file) => file.id !== id))}
      onSavePage={() => {
        setPages({ ...pages, [slug]: { ...pages[slug], title: draft.title, sections: draft.sections.map((section) => ({ type: section.type, content: { text: section.text } })), seo_title: draft.seoTitle || null, seo_description: draft.seoDescription || null, updated_at: "2026-11-18T10:00:00Z" } });
        setSaved("حُفظت الصفحة.");
      }}
      products={state(products)}
      onToggleProduct={(item, show) => setProducts(products.map((row) => (row.id === item.id ? { ...row, show_on_site: show } : row)))}
      onOpenProduct={() => {}}
      agents={state(agents)}
      onToggleAgent={(agent, show) => setAgents(agents.map((row) => (row.id === agent.id ? { ...row, show_on_site: show } : row)))}
      notice={notice}
      onNoticeChange={setNotice}
      onSaveNotice={() => setSaved("حُفظت العبارة.")}
    />
  );
}
