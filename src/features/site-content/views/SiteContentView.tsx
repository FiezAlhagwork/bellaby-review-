"use client";

import { Cube, Storefront } from "@phosphor-icons/react";
import { MoneyCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { FileUpload, type UploadFile } from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Skeleton } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import type { Agent, Item, SitePage } from "@/lib/api/types";
import { formatDateTime, formatPhone, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

export type SiteTab = "pages" | "products" | "agents" | "notice";
export type PageSlug = "home" | "about";

/** مسودة `PUT /site/pages/{slug}`. كل قسم نصّه في `content.text` (مخطط `content` حرّ في العقد §82). */
export type PageDraft = { title: string; sections: readonly { type: string; text: string }[]; seoTitle: string; seoDescription: string };
/** مسودة `PUT /settings/site`. */
export type NoticeDraft = { notice: string; companyName: string };

export const draftOfPage = (page: SitePage): PageDraft => ({
  title: page.title ?? "",
  sections: (page.sections ?? []).map((section) => ({ type: section.type ?? "", text: typeof section.content?.text === "string" ? section.content.text : "" })),
  seoTitle: page.seo_title ?? "",
  seoDescription: page.seo_description ?? "",
});

type SiteContentViewProps = {
  tab: SiteTab;
  onTabChange: (tab: SiteTab) => void;
  /** `site.manage`. */
  canManage: boolean;
  saving?: boolean;
  /** «حُفظ» بعد آخر حفظ ناجح. */
  savedMessage?: string;
  // الصفحات
  pageSlug: PageSlug;
  onPageSlugChange: (slug: PageSlug) => void;
  /** `GET /site/pages/{slug}`. */
  page: Loadable<SitePage>;
  pageDraft: PageDraft | null;
  onPageDraftChange: (draft: PageDraft) => void;
  images: readonly UploadFile[];
  onImageSelect?: (files: File[]) => void;
  onImageRemove?: (id: string) => void;
  onSavePage?: () => void;
  pageErrors?: Readonly<Record<string, string>>;
  // المنتجات والوكلاء
  /** أصناف `PRODUCT`. */
  products: Loadable<readonly Item[]>;
  /** `PATCH /items/{id} { show_on_site }`. */
  onToggleProduct?: (item: Item, show: boolean) => void;
  /** يفتح صفحة الصنف (E12) لحقول العرض. */
  onOpenProduct?: (item: Item) => void;
  agents: Loadable<readonly Agent[]>;
  /** `PATCH /agents/{id} { show_on_site }`. */
  onToggleAgent?: (agent: Agent, show: boolean) => void;
  // العبارة
  notice: NoticeDraft;
  onNoticeChange: (notice: NoticeDraft) => void;
  onSaveNotice?: () => void;
  noticeErrors?: Readonly<Record<string, string>>;
  onRetry?: () => void;
};

const tabs = [
  { value: "pages", label: "الصفحات" },
  { value: "products", label: "المنتجات" },
  { value: "agents", label: "الوكلاء" },
  { value: "notice", label: "عبارة الرضاعة" },
] as const satisfies readonly { value: SiteTab; label: string }[];

// أنواع الأقسام المعروفة في المعرض. النوع نص حرّ في العقد، فغير المعروف يُعرض كما هو.
const sectionLabels: Readonly<Record<string, string>> = { hero: "الواجهة", intro: "التعريف", featured: "منتجات مميّزة", story: "قصتنا", values: "قيمنا" };

/**
 * محتوى الموقع (I10): أربعة تبويبات: الصفحات (الرئيسية ومن نحن: العنوان والأقسام والصور وSEO)، والمنتجات والوكلاء بعلامة «يظهر في الموقع»،
 * وعبارة الرضاعة الطبيعية. حقول عرض المنتج تُعدَّل من صفحة الصنف.
 */
export function SiteContentView(props: SiteContentViewProps) {
  const { tab, onTabChange, canManage, saving = false, savedMessage } = props;

  return (
    <>
      <PageHeader title="محتوى الموقع" description="ما يظهر في موقع الشركة العام: الصفحات، والمنتجات، والوكلاء، وعبارة الرضاعة الطبيعية." />
      <div className="flex flex-col gap-4">
        <Tabs aria-label="أقسام المحتوى" tabs={tabs} value={tab} onValueChange={onTabChange} />
        {savedMessage ? (
          <Banner kind="success" title={savedMessage}>
            يظهر في الموقع العام فوراً.
          </Banner>
        ) : null}
        {tab === "pages" ? <PagesPanel {...props} saving={saving} canManage={canManage} /> : null}
        {tab === "products" ? <ProductsPanel {...props} canManage={canManage} /> : null}
        {tab === "agents" ? <AgentsPanel {...props} canManage={canManage} /> : null}
        {tab === "notice" ? <NoticePanel {...props} saving={saving} canManage={canManage} /> : null}
      </div>
    </>
  );
}

function PagesPanel({ pageSlug, onPageSlugChange, page, pageDraft, onPageDraftChange, images, onImageSelect, onImageRemove, onSavePage, pageErrors = {}, canManage, saving, onRetry }: SiteContentViewProps & { saving: boolean }) {
  const reason = pageDraft === null ? null : pageDraft.title.trim() === "" ? "اكتب عنوان الصفحة." : images.some((file) => file.status === "uploading") ? "انتظر انتهاء رفع الصور." : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full max-w-80">
        <SegmentedControl
          aria-label="الصفحة"
          fullWidth
          options={[
            { value: "home", label: "الرئيسية" },
            { value: "about", label: "من نحن" },
          ]}
          value={pageSlug}
          onValueChange={onPageSlugChange}
        />
      </div>

      {page.status === "loading" ? (
        <Skeleton className="h-96 w-full" />
      ) : page.status === "error" ? (
        <ErrorState code={page.code} onRetry={onRetry} />
      ) : pageDraft ? (
        <>
          <Card title="النصوص" action={page.data.updated_at ? <span className="text-label text-fg-muted">{`آخر تعديل ${formatDateTime(page.data.updated_at)}`}</span> : undefined}>
            <div className="flex flex-col gap-4">
              <Field label="عنوان الصفحة" required error={pageErrors.title}>
                <Input value={pageDraft.title} readOnly={!canManage} onChange={(event) => onPageDraftChange({ ...pageDraft, title: event.target.value })} />
              </Field>
              {pageDraft.sections.map((section, index) => (
                <Field key={`${section.type}-${index}`} label={`قسم: ${sectionLabels[section.type] ?? section.type}`} error={pageErrors[`sections.${index}.content`]}>
                  <Textarea
                    value={section.text}
                    readOnly={!canManage}
                    onChange={(event) => onPageDraftChange({ ...pageDraft, sections: pageDraft.sections.map((item, at) => (at === index ? { ...item, text: event.target.value } : item)) })}
                  />
                </Field>
              ))}
            </div>
          </Card>

          <Card title="الصور">
            <FileUpload files={images} onSelect={(files) => onImageSelect?.(files)} onRemove={(id) => onImageRemove?.(id)} accept="image/*" acceptLabel="صور" maxSize={5 * 1024 * 1024} multiple disabled={!canManage || saving} />
          </Card>

          <Card title="محرّكات البحث (SEO)">
            <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
              <Field label="عنوان البحث" optional error={pageErrors.seo_title}>
                <Input value={pageDraft.seoTitle} readOnly={!canManage} onChange={(event) => onPageDraftChange({ ...pageDraft, seoTitle: event.target.value })} />
              </Field>
              <Field label="وصف البحث" optional error={pageErrors.seo_description}>
                <Input value={pageDraft.seoDescription} readOnly={!canManage} onChange={(event) => onPageDraftChange({ ...pageDraft, seoDescription: event.target.value })} />
              </Field>
            </Grid>
          </Card>

          {canManage ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              {reason ? <p className="text-label text-fg-muted">{reason}</p> : null}
              <Button variant="primary" loading={saving} disabled={reason !== null} onClick={onSavePage}>
                حفظ الصفحة
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ProductsPanel({ products, onToggleProduct, onOpenProduct, canManage, onRetry }: SiteContentViewProps) {
  const columns: DataTableColumn<Item>[] = [
    { key: "name", header: "المنتج", cell: (row) => <TextCell value={row.name} />, priority: "high", role: "primary" },
    { key: "slug", header: "الرابط", cell: (row) => <TextCell value={row.site?.slug ? isolate(row.site.slug) : "لم يُحدَّد"} />, width: "w-56" },
    { key: "price", header: "السعر الساري", cell: (row) => <MoneyCell value={row.current_price} />, align: "end", width: "w-32" },
    {
      key: "show",
      header: "يظهر في الموقع",
      cell: (row) => <Switch aria-label={`${row.name ?? ""} يظهر في الموقع`} checked={row.show_on_site === true} onCheckedChange={(show) => onToggleProduct?.(row, show)} disabled={!canManage || !row.is_active} />,
      width: "w-32",
      priority: "high",
    },
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-label text-fg-muted">الصورة والوصف والمكوّنات تُعدَّل من صفحة الصنف. المنتج المعطّل لا يظهر.</p>
      <DataTable
        label="منتجات الموقع"
        columns={columns}
        rows={products.status === "ready" ? products.data : []}
        getRowKey={(row) => row.id ?? ""}
        loading={products.status === "loading"}
        error={products.status === "error" ? { code: products.code, onRetry } : undefined}
        empty={<EmptyState icon={Cube} title="لا منتجات" description="أضف المنتجات من «الأصناف»." />}
        rowActions={onOpenProduct ? (row) => [{ id: "open", label: "تعديل حقول العرض", onSelect: () => onOpenProduct(row) }] : undefined}
      />
    </div>
  );
}

function AgentsPanel({ agents, onToggleAgent, canManage, onRetry }: SiteContentViewProps) {
  const columns: DataTableColumn<Agent>[] = [
    { key: "name", header: "الوكيل", cell: (row) => <TextCell value={row.name} />, priority: "high", role: "primary" },
    { key: "governorates", header: "المحافظات", cell: (row) => <TextCell value={(row.governorates ?? []).map((item) => item.name).join("، ") || null} />, width: "w-48" },
    { key: "phone", header: "هاتف الموقع", cell: (row) => <TextCell value={row.site_phone ? isolate(formatPhone(row.site_phone)) : null} />, width: "w-44" },
    {
      key: "show",
      header: "يظهر في الموقع",
      cell: (row) => <Switch aria-label={`${row.name ?? ""} يظهر في الموقع`} checked={row.show_on_site === true} onCheckedChange={(show) => onToggleAgent?.(row, show)} disabled={!canManage || !row.is_active} />,
      width: "w-32",
      priority: "high",
    },
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-label text-fg-muted">الوكيل الظاهر يُعرض في صفحة «أين تجد منتجاتنا» بمحافظاته وهاتف الموقع.</p>
      <DataTable
        label="وكلاء الموقع"
        columns={columns}
        rows={agents.status === "ready" ? agents.data : []}
        getRowKey={(row) => row.id ?? ""}
        loading={agents.status === "loading"}
        error={agents.status === "error" ? { code: agents.code, onRetry } : undefined}
        empty={<EmptyState icon={Storefront} title="لا وكلاء" description="يُضاف الوكلاء من «الوكلاء»." />}
      />
    </div>
  );
}

function NoticePanel({ notice, onNoticeChange, onSaveNotice, noticeErrors = {}, canManage, saving }: SiteContentViewProps & { saving: boolean }) {
  const reason = notice.notice.trim() === "" ? "اكتب العبارة." : null;
  return (
    <Card title="عبارة الرضاعة الطبيعية">
      <div className="flex flex-col gap-4">
        <Banner kind="info" title="نصّها من الشركة بمراجعة قسمها القانوني">
          تظهر في الموقع العام كما تُكتب هنا.
        </Banner>
        <Field label="العبارة" required error={noticeErrors.breastfeeding_notice}>
          <Textarea value={notice.notice} readOnly={!canManage} onChange={(event) => onNoticeChange({ ...notice, notice: event.target.value })} />
        </Field>
        <Field label="اسم الشركة" optional error={noticeErrors.company_name}>
          <Input value={notice.companyName} readOnly={!canManage} onChange={(event) => onNoticeChange({ ...notice, companyName: event.target.value })} />
        </Field>
        {canManage ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {reason ? <p className="text-label text-fg-muted">{reason}</p> : null}
            <Button variant="primary" loading={saving} disabled={reason !== null} onClick={onSaveNotice}>
              حفظ العبارة
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
