import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isReviewEnv } from "@/lib/design/review";
import type { ReactNode } from "react";
import { ButtonSection, IconButtonSection } from "./ButtonSections";
import { CheckboxSection, RadioSection, SegmentedSection, SwitchSection } from "./ChoiceSections";
import { BannerSection, DialogSection, ToastSection } from "./OverlaySections";
import { CardSection, DrawerSection, FloatingSection, PersonSection, TabsSection } from "./SurfaceSections";
import { LayoutPrimitivesSection, ShellSection } from "./LayoutSections";
import { ChartSection, DataTableSection, FilterBarSection, KpiSection, PaginationSection } from "./DataSections";
import { BatchSection, LineItemsSection } from "./StockSections";
import { ActivitySection, DecisionSection, NotificationSection, StageSection } from "./ProcessSections";
import { BadgeSection, SkeletonSection, SpinnerSection, StatusBadgeSection } from "./DisplaySections";
import { DatePickerSection, DateRangePickerSection, MonthPickerSection } from "./DateSections";
import { FieldSection } from "./FieldSections";
import { ComboboxSection, SelectSection } from "./PickerSections";
import { EmptyStatesSection, ErrorMessagesSection } from "./StateSections";
import { AttachmentListSection, FileUploadSection } from "./UploadSections";
import { GalleryMode } from "./gallery-kit";

export const metadata: Metadata = { title: "المكوّنات" };

// معرض المكوّنات: كل مكوّن بكل حالاته (FIGMA.md 4.3). الدفعات 1 إلى 6 من الخطوة 3.
// @container بلا padding، والـ padding على ابنه (DESIGN.md 2.1).
//
// للالتقاط إلى Figma قسماً قسماً: `?section=<id>&capture=1&clean=1`
// - section: يعرض هذا القسم وحده، وجذره `#screen`. بلا section تُعرض الصفحة كلها للمراجعة.
// - clean: يحذف الملاحظات المكتوبة للفريق (للعرض على العميل).
const sections: readonly { id: string; node: ReactNode }[] = [
  { id: "button", node: <ButtonSection /> },
  { id: "icon-button", node: <IconButtonSection /> },
  { id: "field", node: <FieldSection /> },
  { id: "select", node: <SelectSection /> },
  { id: "combobox", node: <ComboboxSection /> },
  { id: "checkbox", node: <CheckboxSection /> },
  { id: "radio", node: <RadioSection /> },
  { id: "switch", node: <SwitchSection /> },
  { id: "segmented", node: <SegmentedSection /> },
  { id: "date-picker", node: <DatePickerSection /> },
  { id: "date-range-picker", node: <DateRangePickerSection /> },
  { id: "month-picker", node: <MonthPickerSection /> },
  { id: "file-upload", node: <FileUploadSection /> },
  { id: "attachment-list", node: <AttachmentListSection /> },
  { id: "banner", node: <BannerSection /> },
  { id: "toast", node: <ToastSection /> },
  { id: "dialog", node: <DialogSection /> },
  { id: "drawer", node: <DrawerSection /> },
  { id: "floating", node: <FloatingSection /> },
  { id: "tabs", node: <TabsSection /> },
  { id: "card", node: <CardSection /> },
  { id: "person", node: <PersonSection /> },
  { id: "shell", node: <ShellSection /> },
  { id: "layout", node: <LayoutPrimitivesSection /> },
  { id: "data-table", node: <DataTableSection /> },
  { id: "pagination", node: <PaginationSection /> },
  { id: "filter-bar", node: <FilterBarSection /> },
  { id: "kpi", node: <KpiSection /> },
  { id: "chart", node: <ChartSection /> },
  { id: "batch", node: <BatchSection /> },
  { id: "line-items", node: <LineItemsSection /> },
  { id: "stage", node: <StageSection /> },
  { id: "activity", node: <ActivitySection /> },
  { id: "decision", node: <DecisionSection /> },
  { id: "notification", node: <NotificationSection /> },
  { id: "badge", node: <BadgeSection /> },
  { id: "status-badge", node: <StatusBadgeSection /> },
  { id: "skeleton", node: <SkeletonSection /> },
  { id: "spinner", node: <SpinnerSection /> },
  { id: "empty-states", node: <EmptyStatesSection /> },
  { id: "error-messages", node: <ErrorMessagesSection /> },
];

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ComponentsPage({ searchParams }: PageProps) {
  // نسخة الزبون (REVIEW_MODE=1) لا تعرض الأدوات الداخلية.
  if (isReviewEnv()) notFound();

  const query = await searchParams;
  const clean = query.clean === "1";
  const only = typeof query.section === "string" ? sections.find((entry) => entry.id === query.section) : undefined;
  const group = typeof query.sections === "string" ? query.sections.split(",") : [];
  const picked = sections.filter((entry) => group.includes(entry.id));

  // `?sections=a,b,c`: عدة أقسام في إطار واحد (للالتقاط دفعة واحدة)، كل قسم في ابن مباشر مسمّى بمعرّفه.
  if (picked.length > 0) {
    return (
      <GalleryMode clean={clean}>
        <main className="@container bg-bg">
          <div id="screen" className="flex flex-col gap-16 bg-bg p-8">
            {picked.map((entry) => (
              <div key={entry.id} data-section={entry.id}>
                {entry.node}
              </div>
            ))}
          </div>
        </main>
      </GalleryMode>
    );
  }

  if (only) {
    return (
      <GalleryMode clean={clean}>
        <main className="@container bg-bg">
          <div id="screen" className="flex flex-col bg-bg p-8">
            {only.node}
          </div>
        </main>
      </GalleryMode>
    );
  }

  return (
    <GalleryMode clean={clean}>
      <main className="@container bg-bg">
        <div className="flex flex-col gap-16 p-8">
          <header className="flex flex-col gap-2">
            <h1 className="text-display font-bold text-fg">المكوّنات</h1>
            <p className="text-body-lg text-fg-muted">
              مكوّنات الأساس بكل حالاتها. الدفعات 1 إلى 6: الأزرار والحقول والقوائم المنسدلة والاختيار والتاريخ ورفع الملفات والتنبيهات والإشعارات والنوافذ والدرج والقوائم والتبويبات والبطاقة والأفاتار والشارات وحالات الانتظار والفراغ والخطأ. المرحلة 1 · Wireframe.
            </p>
          </header>
          {sections.map((entry) => (
            <div key={entry.id}>{entry.node}</div>
          ))}
        </div>
      </main>
    </GalleryMode>
  );
}
