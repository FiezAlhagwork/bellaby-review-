import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isReviewEnv } from "@/lib/design/review";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { readThemeTokens, remToPx, resolveToken, type ThemeTokens } from "@/lib/design/theme";
import { formatDateTime, isolate } from "@/lib/format";

export const metadata: Metadata = { title: "الأساسيات" };

// صفحة عرض: تقرأ القيم من @theme في globals.css (DESIGN.md 16.1).
// الأصناف مكتوبة حرفياً لأن Tailwind لا يولّد صنفاً من اسم مركّب. وهي الصفحة الوحيدة المسموح فيها
// بالدرجات الخام (bg-neutral-*) لأنها تعرض السلّم نفسه. المكوّنات والشاشات بالأسماء الدلالية فقط.

type Swatch = { name: string; className: string; usage?: string };

const neutrals: Swatch[] = [
  { name: "neutral-0", className: "bg-neutral-0", usage: "السطوح: البطاقات، الجداول، النوافذ" },
  { name: "neutral-25", className: "bg-neutral-25", usage: "رأس الجدول، تمرير الصف" },
  { name: "neutral-50", className: "bg-neutral-50", usage: "خلفية التطبيق" },
  { name: "neutral-100", className: "bg-neutral-100", usage: "العنصر النشط، الشارة المحايدة" },
  { name: "neutral-200", className: "bg-neutral-200", usage: "الحدود الافتراضية والفواصل" },
  { name: "neutral-300", className: "bg-neutral-300", usage: "حدود الحقول" },
  { name: "neutral-400", className: "bg-neutral-400", usage: "المعطّل، placeholder" },
  { name: "neutral-500", className: "bg-neutral-500", usage: "الأيقونات الثانوية، لا نص مقروء" },
  { name: "neutral-600", className: "bg-neutral-600", usage: "النص الثانوي" },
  { name: "neutral-700", className: "bg-neutral-700", usage: "نص التسميات القوية" },
  { name: "neutral-800", className: "bg-neutral-800", usage: "تمرير الزر الأساسي" },
  { name: "neutral-900", className: "bg-neutral-900", usage: "النص الأساسي، الزر الأساسي" },
  { name: "neutral-950", className: "bg-neutral-950", usage: "ضغط الزر الأساسي" },
];

type StatusPair = { name: string; text: string; soft: string; meaning: string };

const statuses: StatusPair[] = [
  { name: "success", text: "text-success", soft: "bg-success-soft", meaning: "معتمد، مستلم، مكتمل، ضمن الهدف" },
  { name: "warning", text: "text-warning", soft: "bg-warning-soft", meaning: "ينتظر قراراً، متأخر، قريب الانتهاء" },
  { name: "danger", text: "text-danger", soft: "bg-danger-soft", meaning: "مرفوض، موقوف، منتهٍ، خطأ" },
  { name: "info", text: "text-info", soft: "bg-info-soft", meaning: "معلومة، قيد التنفيذ، بالتفويض" },
];

const brand: Swatch[] = [
  { name: "brand-rose", className: "bg-brand-rose", usage: "وردي ترابي · مقدّر من CMYK" },
  { name: "brand-teal", className: "bg-brand-teal", usage: "تركوازي · مقدّر من CMYK" },
];

const semantic: { group: string; items: Swatch[] }[] = [
  {
    group: "الخلفيات",
    items: [
      { name: "bg", className: "bg-bg", usage: "خلفية التطبيق" },
      { name: "surface", className: "bg-surface", usage: "البطاقات، الجداول، النوافذ، الحقول" },
      { name: "surface-muted", className: "bg-surface-muted", usage: "رأس الجدول، تمرير الصف" },
      { name: "surface-sunken", className: "bg-surface-sunken", usage: "العنصر النشط، الشارة المحايدة، Skeleton" },
      { name: "overlay", className: "bg-overlay", usage: "خلفية النافذة والدرج" },
    ],
  },
  {
    group: "النص",
    items: [
      { name: "fg", className: "bg-fg", usage: "النص الأساسي" },
      { name: "fg-muted", className: "bg-fg-muted", usage: "النص الثانوي" },
      { name: "fg-subtle", className: "bg-fg-subtle", usage: "الأيقونات الثانوية فقط" },
      { name: "fg-disabled", className: "bg-fg-disabled", usage: "المعطّل وplaceholder" },
      { name: "fg-inverse", className: "bg-fg-inverse", usage: "النص على primary وoverlay" },
    ],
  },
  {
    group: "الحدود",
    items: [
      { name: "border", className: "bg-border", usage: "البطاقات، الجداول، الفواصل" },
      { name: "border-strong", className: "bg-border-strong", usage: "الحقول" },
      { name: "border-hover", className: "bg-border-hover", usage: "حد الحقل عند التمرير" },
      { name: "focus", className: "bg-focus", usage: "حلقة التركيز" },
    ],
  },
  {
    group: "الإبراز (يتغيّر في المرحلة 2)",
    items: [
      { name: "primary", className: "bg-primary", usage: "الزر الأساسي، المؤشر النشط" },
      { name: "primary-hover", className: "bg-primary-hover" },
      { name: "primary-pressed", className: "bg-primary-pressed" },
      { name: "primary-soft", className: "bg-primary-soft", usage: "خلفية العنصر المختار" },
      { name: "on-primary", className: "bg-on-primary", usage: "النص على primary" },
      { name: "link", className: "bg-link", usage: "الروابط داخل النص" },
      { name: "accent", className: "bg-accent", usage: "الإبراز الثانوي" },
      { name: "accent-soft", className: "bg-accent-soft" },
    ],
  },
  {
    group: "حالات زر danger",
    items: [
      { name: "danger-hover", className: "bg-danger-hover", usage: "تمرير زر danger" },
      { name: "danger-pressed", className: "bg-danger-pressed", usage: "ضغط زر danger" },
    ],
  },
  {
    group: "الرسوم",
    items: [
      { name: "chart-1", className: "bg-chart-1" },
      { name: "chart-2", className: "bg-chart-2" },
      { name: "chart-3", className: "bg-chart-3" },
      { name: "chart-4", className: "bg-chart-4" },
      { name: "chart-5", className: "bg-chart-5" },
      { name: "chart-target", className: "bg-chart-target", usage: "خط الهدف" },
    ],
  },
];

type TypeStep = { name: string; className: string; weight: number; sample: string };

const typeScale: TypeStep[] = [
  { name: "display", className: "text-display font-bold", weight: 700, sample: "$48,250.00" },
  { name: "h1", className: "text-h1 font-bold", weight: 700, sample: `صرف رقم ${isolate("TR-0142")}` },
  { name: "h2", className: "text-h2 font-semibold", weight: 600, sample: "الأصناف المصروفة" },
  { name: "h3", className: "text-h3 font-semibold", weight: 600, sample: "بيانات الدفعة" },
  { name: "body-lg", className: "text-body-lg", weight: 400, sample: "تعود الكمية للمستودع. للإلغاء لخطأ في الإدخال فقط." },
  { name: "body", className: "text-body", weight: 400, sample: "وكالة الياسمين للتوزيع · دمشق" },
  { name: "label", className: "text-label font-medium", weight: 500, sample: "رقم الدفعة" },
  { name: "caption", className: "text-caption", weight: 400, sample: formatDateTime("2026-11-09T11:05:00Z") },
];

const weights = [
  { className: "font-normal", label: "400" },
  { className: "font-medium", label: "500" },
  { className: "font-semibold", label: "600" },
  { className: "font-bold", label: "700" },
];

const spacing = [
  { step: "1", px: 4, className: "w-1" },
  { step: "2", px: 8, className: "w-2" },
  { step: "3", px: 12, className: "w-3" },
  { step: "4", px: 16, className: "w-4" },
  { step: "5", px: 20, className: "w-5" },
  { step: "6", px: 24, className: "w-6" },
  { step: "8", px: 32, className: "w-8" },
  { step: "10", px: 40, className: "w-10" },
  { step: "12", px: 48, className: "w-12" },
];

const radii = [
  { name: "sm", className: "rounded-sm", usage: "الشارة، checkbox" },
  { name: "md", className: "rounded-md", usage: "الزر، الحقل، القائمة" },
  { name: "lg", className: "rounded-lg", usage: "البطاقة، الجدول، التنبيه" },
  { name: "xl", className: "rounded-xl", usage: "النافذة، الدرج" },
];

const shadows = [
  { name: "raised", className: "shadow-raised", usage: "القائمة المنسدلة، popover، tooltip" },
  { name: "overlay", className: "shadow-overlay", usage: "النافذة، الدرج، toast" },
];

function Section({ title, note, clean, children }: { title: string; note?: string; clean: boolean; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <h2 className="text-h1 font-bold text-fg">{title}</h2>
        {note && !clean ? <p className="text-body text-fg-muted">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function SwatchCard({ swatch, value }: { swatch: Swatch; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("h-20 rounded-md border border-border", swatch.className)} />
      <div className="flex flex-col">
        <span dir="ltr" className="text-start text-label font-medium text-fg">
          {swatch.name}
        </span>
        <span dir="ltr" className="text-start text-caption tabular-nums text-fg-muted">
          {value}
        </span>
        {swatch.usage ? <span className="text-caption text-fg-muted">{swatch.usage}</span> : null}
      </div>
    </div>
  );
}

function swatches(items: Swatch[], tokens: ThemeTokens) {
  return (
    <div className="grid grid-cols-5 gap-6">
      {items.map((swatch) => (
        <SwatchCard key={swatch.name} swatch={swatch} value={resolveToken(tokens, `color-${swatch.name}`)} />
      ))}
    </div>
  );
}

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// للالتقاط إلى Figma قسماً قسماً: `?section=<id>&capture=1&clean=1` (الجذر #screen، وclean يحذف الملاحظات المكتوبة للفريق).
const sectionIds = ["neutrals", "status", "brand", "semantic", "type", "spacing", "radii", "shadows"] as const;

export default async function FoundationsPage({ searchParams }: PageProps) {
  // نسخة الزبون (REVIEW_MODE=1) لا تعرض الأدوات الداخلية.
  if (isReviewEnv()) notFound();

  const query = await searchParams;
  const clean = query.clean === "1";
  const only = sectionIds.find((id) => id === query.section);
  const all = query.section === "all";
  const tokens = readThemeTokens();
  const show = (id: (typeof sectionIds)[number]) => only === undefined || only === id;

  return (
    <main className={only || all ? "mx-auto flex max-w-6xl flex-col" : "mx-auto flex max-w-6xl flex-col gap-16 p-8"}>
      {only || all ? null : (
        <header className="flex flex-col gap-2">
          <h1 className="text-display font-bold text-fg">الأساسيات</h1>
          <p className="text-body-lg text-fg-muted">
            الألوان والخط والمسافات والزوايا كما في @theme داخل globals.css. المرحلة 1 · Wireframe.
          </p>
        </header>
      )}
      <div id={only || all ? "screen" : undefined} className={only ? "flex flex-col bg-bg p-8" : all ? "flex flex-col gap-16 bg-bg p-8" : "flex flex-col gap-16"}>

      {show("neutrals") ? (
      <Section clean={clean} title="الرماديات" note="الدرجات الخام. تُستعمل داخل @theme لتعريف الأسماء الدلالية، لا في المكوّنات.">
        {swatches(neutrals, tokens)}
      </Section>
      ) : null}

      {show("status") ? (
      <Section clean={clean} title="ألوان الحالة" note="كل لون بدرجتين: النص والأيقونة، والخلفية -soft. كل زوج بتباين 4.5:1 على الأقل.">
        <div className="grid grid-cols-4 gap-6">
          {statuses.map((status) => (
            <div key={status.name} className="flex flex-col gap-2">
              <div className={cn("flex h-20 items-center justify-center rounded-md border border-border text-label font-medium", status.soft, status.text)}>
                {status.name}
              </div>
              <div className="flex flex-col">
                <span dir="ltr" className="text-start text-caption tabular-nums text-fg-muted">
                  {resolveToken(tokens, `color-${status.name}`)} على {resolveToken(tokens, `color-${status.name}-soft`)}
                </span>
                <span className="text-caption text-fg-muted">{status.meaning}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
      ) : null}

      {show("brand") ? (
      <Section clean={clean} title="الهوية" note="للمرحلة 2، لا تُستعمل الآن. بانتظار HEX الرسمي، وكلاهما دون 4.5:1 مع نص أبيض.">
        {swatches(brand, tokens)}
      </Section>
      ) : null}

      {show("semantic") ? (
      <Section clean={clean} title="الأسماء الدلالية" note="هذه ما تستعمله المكوّنات. في المرحلة 2 تتغيّر قيم مجموعة الإبراز وحدها.">
        <div className="flex flex-col gap-10">
          {semantic.map((group) => (
            <div key={group.group} className="flex flex-col gap-4">
              <h3 className="text-h3 font-semibold text-fg">{group.group}</h3>
              {swatches(group.items, tokens)}
            </div>
          ))}
        </div>
      </Section>
      ) : null}

      {show("type") ? (
      <Section clean={clean} title="الخط" note="IBM Plex Sans Arabic (مؤقت) · الأرقام لاتينية · الوزن مع الحجم في المكوّن.">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6">
            {weights.map((weight) => (
              <p key={weight.label} className={cn("text-h2", weight.className)}>
                {weight.label} · حليب أطفال من الولادة {isolate("0123456789")}
              </p>
            ))}
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            {typeScale.map((step) => (
              <div key={step.name} className="flex items-center gap-6 border-b border-border px-6 py-4 last:border-b-0">
                <div className="flex w-40 shrink-0 flex-col">
                  <span dir="ltr" className="text-start text-label font-medium text-fg">
                    text-{step.name}
                  </span>
                  <span dir="ltr" className="text-start text-caption tabular-nums text-fg-muted">
                    {remToPx(resolveToken(tokens, `text-${step.name}`))} /{" "}
                    {remToPx(resolveToken(tokens, `text-${step.name}--line-height`))} · {step.weight}
                  </span>
                </div>
                <p className={cn("flex-1 text-fg", step.className)}>{step.sample}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6">
            {clean ? null : <p className="text-label text-fg-muted">خطا الهوية (المرحلة 2، لاتينيان فقط): الأسماء والملفات في public/fonts، ولا يدعمان العربية. لا يُستعملان في أي مكوّن الآن.</p>}
            <p dir="ltr" className="text-start font-brand text-display font-bold text-fg">
              Bellaby · Fraunces 700 (Soft / Chunky Serif)
            </p>
            <p dir="ltr" className="text-start font-brand text-h1 font-semibold text-fg">
              Beautiful Start for Every Babe · Fraunces 600
            </p>
            <p dir="ltr" className="text-start font-brand-accent text-h1 text-fg">
              Beautiful Start for Every Babe · Young Serif 400 (Retro / Friendly Serif)
            </p>
          </div>
        </div>
      </Section>
      ) : null}

      {show("spacing") ? (
      <Section clean={clean} title="المسافات" note="وحدة الأساس 4. سلّم Tailwind الافتراضي، ولا قيم خارج هذا السلّم.">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6">
          {spacing.map((item) => (
            <div key={item.step} className="flex items-center gap-4">
              <span dir="ltr" className="w-24 shrink-0 text-start text-label tabular-nums text-fg-muted">
                {item.step} · {item.px}px
              </span>
              <div className={cn("h-4 rounded-sm bg-primary", item.className)} />
            </div>
          ))}
        </div>
      </Section>
      ) : null}

      {show("radii") ? (
      <Section clean={clean} title="الزوايا">
        <div className="grid grid-cols-5 gap-6">
          {radii.map((radius) => (
            <div key={radius.name} className="flex flex-col gap-2">
              <div className={cn("h-20 border border-border-strong bg-surface", radius.className)} />
              <div className="flex flex-col">
                <span dir="ltr" className="text-start text-label font-medium text-fg">
                  rounded-{radius.name} · {remToPx(resolveToken(tokens, `radius-${radius.name}`))}
                </span>
                <span className="text-caption text-fg-muted">{radius.usage}</span>
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <div className="size-20 rounded-full border border-border-strong bg-surface" />
            <div className="flex flex-col">
              <span dir="ltr" className="text-start text-label font-medium text-fg">
                rounded-full
              </span>
              <span className="text-caption text-fg-muted">الأفاتار، المؤشر</span>
            </div>
          </div>
        </div>
      </Section>
      ) : null}

      {show("shadows") ? (
      <Section clean={clean} title="الظلال" note="البطاقات والجداول بحدود لا بظلال. الظل للعناصر الطافية فقط.">
        <div className="grid grid-cols-5 gap-6">
          {shadows.map((shadow) => (
            <div key={shadow.name} className="flex flex-col gap-3">
              <div className={cn("h-20 rounded-lg bg-surface", shadow.className)} />
              <div className="flex flex-col">
                <span dir="ltr" className="text-start text-label font-medium text-fg">
                  shadow-{shadow.name}
                </span>
                <span className="text-caption text-fg-muted">{shadow.usage}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
      ) : null}
      </div>
    </main>
  );
}
