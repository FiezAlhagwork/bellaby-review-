"use client";

import { Check, Clock, LockSimple, Prohibit, UserSwitch } from "@phosphor-icons/react";
import { StatusBadge } from "@/components/data/StatusBadge";
import { statusMap, type StatusEntity, type StatusOf } from "@/components/data/status-map";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { GalleryGroup, GallerySection, ShowcaseCard, ShowcaseRow, StateTable } from "./gallery-kit";

const badgeColors: { color: BadgeColor; text: string; icon?: typeof Check }[] = [
  { color: "neutral", text: "مسودة", icon: LockSimple },
  { color: "success", text: "معتمد", icon: Check },
  { color: "warning", text: "متأخرة", icon: Clock },
  { color: "danger", text: "موقوفة", icon: Prohibit },
  { color: "info", text: "بالتفويض", icon: UserSwitch },
  { color: "accent", text: "جديد" },
];

export function BadgeSection() {
  return (
    <GallerySection
      name="Badge"
      title="الشارة"
      usage="نص قصير بخلفية خفيفة. الحالة تُقرأ بالنص لا باللون وحده. الأيقونة 12 اختيارية."
    >
      <StateTable
        columns={badgeColors.map((b) => b.color)}
        rows={[
          {
            label: "نص فقط",
            cells: badgeColors.map((b) => (
              <Badge key={b.color} color={b.color}>
                {b.text}
              </Badge>
            )),
          },
          {
            label: "مع أيقونة",
            cells: badgeColors.map((b) => (
              <Badge key={b.color} color={b.color} icon={b.icon}>
                {b.text}
              </Badge>
            )),
          },
        ]}
      />
    </GallerySection>
  );
}

/** كل كيان بكل حالاته من status-map. الأيقونة القادمة من العقد: المفتاح بالإنجليزية. */
function entityRows() {
  return (Object.keys(statusMap) as StatusEntity[]).map((entity) => {
    const statuses = Object.keys(statusMap[entity]) as StatusOf<typeof entity>[];
    return (
      <ShowcaseRow key={entity} label={entity}>
        {statuses.map((status) => (
          <StatusBadge key={status} entity={entity} status={status} />
        ))}
      </ShowcaseRow>
    );
  });
}

export function StatusBadgeSection() {
  return (
    <GallerySection
      name="StatusBadge"
      title="شارة الحالة"
      usage="تأخذ قيمة الحالة من العقد حرفياً مع نوع الكيان، والنص واللون من status-map.ts وحده. لا تُكتب ترجمة حالة في أي شاشة."
    >
      <GalleryGroup title="كل الكيانات بكل حالاتها">
        <ShowcaseCard>{entityRows()}</ShowcaseCard>
      </GalleryGroup>
    </GallerySection>
  );
}

/** عنصر بعرض ثابت في عمود: يوضع في صف حتى يلتصق بالبداية (يمين) في الوضعين. */
function Line({ className }: { className: string }) {
  return (
    <CaptureRow>
      <Skeleton className={className} />
    </CaptureRow>
  );
}

export function SkeletonSection() {
  return (
    <GallerySection
      name="Skeleton"
      title="الهيكل"
      usage="مستطيلات بشكل المحتوى الحقيقي (أسطر جدول، بطاقات، أرقام) بنبض خفيف. لا مؤشر دوار لصفحة كاملة. النبض يتوقف في الالتقاط."
    >
      <ShowcaseCard>
        <ShowcaseRow label="أسطر نص">
          <div className="flex flex-1 flex-col gap-2">
            <Line className="h-4 w-full" />
            <Line className="h-4 w-4/5" />
            <Line className="h-4 w-3/5" />
          </div>
        </ShowcaseRow>
        <ShowcaseRow label="شخص (Avatar + اسم)">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2">
            <Line className="h-4 w-32" />
            <Line className="h-3 w-20" />
          </div>
        </ShowcaseRow>
        <ShowcaseRow label="خلية إحصاء">
          <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <Line className="h-4 w-32" />
            <Line className="h-8 w-48" />
            <Line className="h-3 w-24" />
          </div>
        </ShowcaseRow>
        <ShowcaseRow label="أسطر جدول (6 في الجدول الحقيقي)">
          <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border">
            {[0, 1, 2].map((row) => (
              <CaptureRow key={row} className="h-13 items-center gap-4 border-b border-border px-4 last:border-b-0">
                <Skeleton className="h-4 w-24 shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16 shrink-0" />
              </CaptureRow>
            ))}
          </div>
        </ShowcaseRow>
      </ShowcaseCard>
    </GallerySection>
  );
}

export function SpinnerSection() {
  return (
    <GallerySection
      name="Spinner"
      title="الدوار"
      usage="داخل الأزرار والقوائم الصغيرة فقط. لونه من النص. يتوقف في الالتقاط."
    >
      <StateTable
        columns={["16", "20"]}
        rows={[
          {
            label: "text-fg",
            cells: [<Spinner key="16" size={16} className="text-fg" />, <Spinner key="20" size={20} className="text-fg" />],
          },
          {
            label: "text-fg-muted",
            cells: [
              <Spinner key="16" size={16} className="text-fg-muted" />,
              <Spinner key="20" size={20} className="text-fg-muted" />,
            ],
          },
        ]}
      />
    </GallerySection>
  );
}
