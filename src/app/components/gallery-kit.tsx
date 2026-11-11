"use client";

import { createContext, useContext, type ReactNode } from "react";
import { CaptureRow } from "@/lib/design/CaptureMode";

// أدوات المعرض /components: ترتيب FIGMA.md 4.3. كل مكوّن صف، وحالاته أعمدة من اليمين (الأولى يمين).
// كل الصفوف بـ CaptureRow، فتُلتقط بترتيب DOM مطابق للبصري. لا grid هنا لأنه ينقلب في LTR.

const CleanContext = createContext(false);

/** وضع العرض على العميل (`?clean=1`): تُحذف الملاحظات المكتوبة للفريق (سطر الاستعمال وملاحظات الأقسام) ويبقى المكوّن وحالاته. */
export function GalleryMode({ clean, children }: { clean: boolean; children: ReactNode }) {
  return <CleanContext.Provider value={clean}>{children}</CleanContext.Provider>;
}

export function useGalleryClean() {
  return useContext(CleanContext);
}

/** عنوان مجموعة للعميل: بلا تلميحات التفاعل («حي: انقر…») ولا شروحها بين قوسين. null = يُحذف العنوان كله. */
function cleanTitle(text: string): string | null {
  if (/^حي(:| \()/.test(text)) return null;
  return text
    .replace(/^حي /, "")
    .replace(/ \([^)]*(?:حي:|شريط info|min =)[^)]*\)/g, "")
    .replace(/ حي:.*$/, "")
    .trim();
}

/** تسمية صف للعميل: بلا بادئة «حي: ». */
export function trimLabel(label: string, clean: boolean) {
  return clean ? label.replace(/^حي: /, "") : label;
}

export function useCleanTitle(title: string) {
  return useGalleryClean() ? cleanTitle(title) : title;
}

export function GallerySection({
  name,
  title,
  usage,
  children,
}: {
  /** اسم المكوّن في الكود. */
  name: string;
  /** الاسم العربي. */
  title: string;
  /** سطر عن متى يُستعمل. */
  usage: string;
  children: ReactNode;
}) {
  const clean = useGalleryClean();
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {/* نص واحد بلا عناصر داخلية، فيبقى اتجاهه RTL في وضع الالتقاط. */}
        <h2 className="text-display font-bold text-fg">
          {name} — {title}
        </h2>
        {clean ? null : <p className="text-body-lg text-fg-muted">{usage}</p>}
      </div>
      <div className="flex flex-col gap-8">{children}</div>
    </section>
  );
}

export function GalleryGroup({ title, children }: { title: string; children: ReactNode }) {
  const shown = useCleanTitle(title);
  return (
    <div className="flex flex-col gap-3">
      {shown ? <h3 className="text-h3 font-semibold text-fg">{shown}</h3> : null}
      {children}
    </div>
  );
}

const labelCell = "w-44 shrink-0 px-4";

/** جدول: عمود التسمية يمين، ثم أعمدة متساوية. `columns` عناوين الأعمدة، وكل صف `cells` بالعدد نفسه. */
export function StateTable({
  columns,
  rows,
}: {
  columns: readonly string[];
  rows: readonly { label: string; cells: readonly ReactNode[] }[];
}) {
  const clean = useGalleryClean();
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <CaptureRow className="h-11 items-center border-b border-border bg-surface-muted">
        <div className={`${labelCell} text-label font-medium text-fg-muted`}>المتغيّر</div>
        {columns.map((column) => (
          <div key={column} className="min-w-0 flex-1 px-4 text-label font-medium text-fg-muted">
            {column}
          </div>
        ))}
      </CaptureRow>
      {rows.map((row) => (
        <CaptureRow key={row.label} className="min-h-16 items-center border-b border-border py-3 last:border-b-0">
          <div className={`${labelCell} text-label text-fg`}>{trimLabel(row.label, clean)}</div>
          {row.cells.map((cell, index) => (
            <CaptureRow key={columns[index]} className="min-w-0 flex-1 items-center px-4">
              {cell}
            </CaptureRow>
          ))}
        </CaptureRow>
      ))}
    </div>
  );
}

/**
 * حالات مكدّسة بحجمها الحقيقي: كل حالة في صف، التسمية عند البداية (يمين) والعنصر بعرض ثابت `w-96` بجانبها.
 * للحقول التي تضيق وتُقصّ قيمتها في أعمدة جدول متجاورة. الكتلة الثابتة داخل صف أعرض منها فهي في CaptureRow.
 */
export function StateStack({
  states,
  alignLabel = "field",
}: {
  states: readonly { label: string; node: ReactNode }[];
  /** field: التسمية بمحاذاة وسط حقل بارتفاع 40. top: بمحاذاة أول سطر (مربعات، دوائر، مفاتيح). */
  alignLabel?: "field" | "top";
}) {
  const clean = useGalleryClean();
  return (
    <ShowcaseCard>
      {states.map((state) => (
        <CaptureRow key={state.label} className="items-start border-b border-border py-4 last:border-b-0">
          <div className={`${labelCell} ${alignLabel === "field" ? "pt-3" : "pt-0.5"} text-label text-fg-muted`}>{trimLabel(state.label, clean)}</div>
          <div className="flex w-96 shrink-0 flex-col px-4 box-content">{state.node}</div>
          <div className="min-w-0 flex-1" />
        </CaptureRow>
      ))}
    </ShowcaseCard>
  );
}

/** صف تسمية ثم عناصر متجاورة بلا التفاف. للحالات التي لا تتساوى أعمدتها (الحالات حسب الكيان). */
export function ShowcaseRow({ label, children }: { label: string; children: ReactNode }) {
  const clean = useGalleryClean();
  return (
    <CaptureRow className="min-h-14 items-center border-b border-border py-3 last:border-b-0">
      <div className={`${labelCell} text-label text-fg`}>{trimLabel(label, clean)}</div>
      <CaptureRow className="min-w-0 flex-1 items-center gap-2 px-4">{children}</CaptureRow>
    </CaptureRow>
  );
}

export function ShowcaseCard({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-lg border border-border bg-surface">{children}</div>;
}

/** بطاقة حالة (فراغ، خطأ…) بعنوان صغير فوقها، متساوية العرض في صف. */
export function StateCard({ label, children }: { label: string; children: ReactNode }) {
  const clean = useGalleryClean();
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <p className="text-label font-medium text-fg-muted">{trimLabel(label, clean)}</p>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">{children}</div>
    </div>
  );
}
