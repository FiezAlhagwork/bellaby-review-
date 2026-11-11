"use client";

import { ArrowsLeftRight, Barcode, ClipboardText, Package, Storefront, UsersThree } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/data/StatusBadge";
import { DashboardShell, type ShellDelegation } from "@/components/layout/DashboardShell";
import { Grid } from "@/components/layout/Grid";
import { PageHeader, type PageAction } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import type { SidebarGroup } from "@/components/layout/Sidebar";
import { Stack } from "@/components/layout/Stack";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Card } from "@/components/ui/Card";
import { OverlayHost } from "@/components/ui/OverlayHost";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { GalleryGroup, GallerySection } from "./gallery-kit";

const noop = () => {};

const groups: readonly SidebarGroup[] = [
  {
    title: "المخزون",
    items: [
      { key: "balances", label: "الأرصدة", icon: Package, href: "#balances" },
      { key: "transfers", label: "الصرف", icon: ArrowsLeftRight, href: "#transfers", count: 3 },
      { key: "counts", label: "الجرد", icon: ClipboardText, href: "#counts" },
      { key: "batches", label: "الدفعات", icon: Barcode, href: "#batches" },
    ],
  },
  {
    title: "الفريق",
    items: [
      { key: "agents", label: "الوكلاء", icon: Storefront, href: "#agents" },
      { key: "reps", label: "المناديب", icon: UsersThree, href: "#reps" },
    ],
  },
];

const navigation = { roleName: "اللوجستي", groups, profileHref: "#profile" };
const user = { name: "رامي السيد", roleName: "اللوجستي" };
const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "المستودع", href: "#" }, { label: "الصرف" }];

const actions: readonly PageAction[] = [
  { id: "cancel", label: "إلغاء الصرف", onSelect: noop, danger: true },
  { id: "print", label: "طباعة", onSelect: noop },
  { id: "confirm", label: "تأكيد الاستلام", onSelect: noop, primary: true },
  { id: "export", label: "تصدير", onSelect: noop, disabled: true, reason: "لا بيانات للتصدير." },
];

/** صفحة تفاصيل مصغّرة: رأس، وشبكة بطاقات 1·2·3، وقسم. المحتوى لا يعرف المقاس: Grid يحسمه. */
function DemoPage() {
  return (
    <>
      <PageHeader
        title="صرف رقم TR-0142"
        badge={<StatusBadge entity="transfer" status="IN_TRANSIT" />}
        description="للمندوب سامر الحلبي · أنشأه رامي السيد · 9 تشرين الثاني 2026"
        actions={actions}
      />
      <Section title="ملخص">
        <Grid cols={{ base: 1, tablet: 2, desktop: 3 }} gap={4}>
          {["الأصناف", "الكمية", "المستودع", "المندوب", "التاريخ", "الحالة"].map((label, index) => (
            <Card key={label}>
              <p className="text-label text-fg-muted">{label}</p>
              <p className="text-h2 font-semibold text-fg tabular-nums">{index + 1}</p>
            </Card>
          ))}
        </Grid>
      </Section>
    </>
  );
}

function ShellFrame({ label, widthClass, delegation, mobile = false }: { label: string; widthClass: string; delegation?: ShellDelegation; mobile?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", !mobile && "w-full")}>
      <p className="text-label font-medium text-fg-muted">{label}</p>
      <CaptureRow>
        <div className={cn("flex h-180 flex-col overflow-hidden rounded-lg ring-1 ring-border", widthClass)}>
          <DashboardShell
            navigation={navigation}
            user={user}
            activeKey="transfers"
            breadcrumbs={breadcrumbs}
            delegation={delegation}
            unreadCount={4}
            pendingCount={2}
            onProfile={noop}
            onSignOut={noop}
          >
            <DemoPage />
          </DashboardShell>
        </div>
      </CaptureRow>
    </div>
  );
}

export function ShellSection() {
  return (
    <GallerySection
      name="DashboardShell · Sidebar · Topbar · Breadcrumbs"
      title="إطار اللوحة"
      usage="مكتب (من 1280): قائمة 264، شريط 64، padding 32. تابلت: قائمة مصغّرة 72 بـ tooltip وتتوسع فوق المحتوى بزر القائمة، padding 24. موبايل: القائمة درج 300 من البداية، شريط 56، padding 16. كل إطار مضيفه OverlayHost فيقيس عرضه لا عرض النافذة."
    >
      <GalleryGroup title="الثلاثة مقاسات (حية: انقر زر القائمة على التابلت والموبايل)">
        <div className="flex flex-col gap-8">
          <ShellFrame label="مكتب: 1280" widthClass="w-320" />
          <ShellFrame label="تابلت: 1024" widthClass="w-256" />
          <ShellFrame label="موبايل: 390" widthClass="w-97.5" mobile />
        </div>
      </GalleryGroup>

      <GalleryGroup title="التفويض النشط (شريط info بعرض الإطار تحت الشريط العلوي)">
        <div className="flex flex-col gap-8">
          <ShellFrame label="المفوَّض" widthClass="w-320" delegation={{ kind: "delegate", to: "2026-11-15" }} />
          <ShellFrame label="المدير التنفيذي" widthClass="w-320" delegation={{ kind: "delegator", delegateName: "سامر الحلبي", to: "2026-11-15", onEnd: noop }} />
        </div>
      </GalleryGroup>

      <GalleryGroup title="Breadcrumbs">
        <Breadcrumbs items={breadcrumbs} />
      </GalleryGroup>
    </GallerySection>
  );
}

function Cell({ n }: { n: number }) {
  return (
    <Card>
      <p className="text-h2 font-semibold text-fg tabular-nums">{n}</p>
    </Card>
  );
}

function GridFrame({ label, widthClass }: { label: string; widthClass: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-label font-medium text-fg-muted">{label}</p>
      <CaptureRow>
        {/* الـ padding على ابن المضيف لا عليه (DESIGN.md 2.1). */}
        <OverlayHost className={cn("bg-bg ring-1 ring-border", widthClass)}>
          <div className="p-4">
            <GridInner />
          </div>
        </OverlayHost>
      </CaptureRow>
    </div>
  );
}

function GridInner() {
  return (
    <Grid cols={{ base: 1, tablet: 2, desktop: 3 }} gap={4}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Cell key={n} n={n} />
      ))}
    </Grid>
  );
}

export function LayoutPrimitivesSection() {
  return (
    <GallerySection
      name="PageHeader · Stack · Grid · Section"
      title="رأس الصفحة والتخطيط"
      usage="PageHeader: عنوان وشارة وسطر وصفي، وإجراءان ظاهران والباقي في Menu، وعلى الموبايل الأساسي وحده ظاهر. Grid بالـ props: cols={{ base: 1, tablet: 2, desktop: 3 }}، وهو المكان الوحيد لتخطيط @tablet و@desktop. Stack وSection بسلّم المسافات."
    >
      <GalleryGroup title="PageHeader">
        <div className="flex flex-col gap-6">
          <HeaderFrame label="مكتب: عنوان وشارة وصف وثلاثة إجراءات (الرابع في Menu)" widthClass="w-full" />
          <HeaderFrame label="موبايل: الأساسي وحده، والباقي في Menu" widthClass="w-97.5" mobile />
          <HeaderFrame label="عنوان فقط" widthClass="w-full" minimal />
        </div>
      </GalleryGroup>

      <GalleryGroup title="Grid: 1 · 2 · 3 أعمدة بحسب عرض الإطار (الخلية 1 يمين)">
        <div className="flex flex-col gap-6">
          <GridFrame label="مكتب 1280: 3 أعمدة" widthClass="w-320" />
          <GridFrame label="تابلت 1024: عمودان" widthClass="w-256" />
          <GridFrame label="موبايل 390: عمود"  widthClass="w-97.5" />
        </div>
      </GalleryGroup>

      <GalleryGroup title="Stack وSection">
        <Card>
          <Section title="عنوان القسم" description="وصف القسم تحت العنوان، ومسافة 32 بعده.">
            <Stack direction="row" gap={4} align="center">
              <Cell n={1} />
              <Cell n={2} />
              <Cell n={3} />
            </Stack>
          </Section>
        </Card>
      </GalleryGroup>
    </GallerySection>
  );
}

function HeaderFrame({ label, widthClass, mobile = false, minimal = false }: { label: string; widthClass: string; mobile?: boolean; minimal?: boolean }) {
  const frame: ReactNode = (
    <OverlayHost className={cn("bg-bg ring-1 ring-border", widthClass)}>
      <div className="p-4 @tablet:p-6">
        {minimal ? (
          <PageHeader title="الأرصدة" />
        ) : (
          <PageHeader
            title="صرف رقم TR-0142"
            badge={<StatusBadge entity="transfer" status="IN_TRANSIT" />}
            description="للمندوب سامر الحلبي · أنشأه رامي السيد · 9 تشرين الثاني 2026"
            actions={actions}
          />
        )}
      </div>
    </OverlayHost>
  );
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-label font-medium text-fg-muted">{label}</p>
      {mobile ? <CaptureRow>{frame}</CaptureRow> : frame}
    </div>
  );
}
