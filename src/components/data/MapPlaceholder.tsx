"use client";

import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";

/** نقطة على الخريطة: موقع بدء أو إنهاء. `tone` يلوّن النقطة (مشكوك فيها warning، مرفوضة danger). */
export type MapPoint = {
  id: string;
  /** نقاط الزيارة الواحدة (بدء وإنهاء) تشترك في المجموعة: اختيار إحداها يحدّد الكل ويُبلَّغ `onSelect` بالمجموعة. */
  group?: string;
  lat: number;
  lng: number;
  /** بدء (دائرة) أو إنهاء (مربّع): الشكل يميّزهما فلا يعتمد المعنى على اللون وحده. */
  kind: "start" | "end";
  tone?: "default" | "warning" | "danger";
  /** يُقرأ للنقطة: «بدء زيارة عيادة د. ريم حداد». */
  label: string;
};

type MapPlaceholderProps = {
  points: readonly MapPoint[];
  /** النقطة (أو مجموعة النقاط) المحددة: حلقة تركيز. */
  selectedId?: string | null;
  /** بدونه تكون النقاط للعرض فقط (خريطة التفاصيل). */
  onSelect?: (id: string) => void;
  /** وصف الخريطة لقارئ الشاشة: «مواقع بدء الزيارات وإنهائها». */
  "aria-label": string;
  /** نسخة مصغّرة لبطاقة التفاصيل. */
  compact?: boolean;
  /** مفتاح الألوان تحت الخريطة. */
  legend?: boolean;
  className?: string;
};

const toneClass = { default: "bg-info", warning: "bg-warning", danger: "bg-danger" } satisfies Record<NonNullable<MapPoint["tone"]>, string>;

/** أصغر مدى يُعرض بالدرجات (نحو 500 م): نقطتان متقاربتان لا تُباعَدان حتى زاويتي المستطيل. */
const MIN_SPAN = 0.005;

/** يحوّل الإحداثيات إلى نسبة مئوية داخل المستطيل بهامش 12%. نقطة واحدة أو تطابق المدى تقع في الوسط. */
function project(points: readonly MapPoint[]) {
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const bounds = (values: number[]) => {
    const [low, high] = [Math.min(...values), Math.max(...values)];
    const pad = Math.max(0, MIN_SPAN - (high - low)) / 2;
    return [low - pad, high + pad] as const;
  };
  const [minLat, maxLat] = bounds(lats);
  const [minLng, maxLng] = bounds(lngs);
  const scale = (value: number, min: number, max: number) => 12 + ((value - min) / (max - min)) * 76;
  return (point: MapPoint) => ({ x: scale(point.lng, minLng, maxLng), y: 100 - scale(point.lat, minLat, maxLat) });
}

function Mark({ kind, tone, className }: { kind: MapPoint["kind"]; tone: NonNullable<MapPoint["tone"]>; className?: string }) {
  return <span aria-hidden="true" className={cn("block size-4 border-2 border-surface", kind === "start" ? "rounded-full" : "rounded-sm", toneClass[tone], className)} />;
}

/**
 * الخريطة الوهمية (DESIGN.md 13.4): مستطيل `surface-sunken` بحد متقطع واسمه «الخريطة» في الوسط، وفوقه نقاط البدء والإنهاء بإزاحات
 * من الإحداثيات. لا مكتبة خرائط في المرحلة 1 ولا مسار بين النقاط (لا تتبّع مستمر: العقد يلتقط نقطتي البدء والإنهاء فقط). خريطة الإنتاج تحلّ محلها بالواجهة نفسها.
 */
export function MapPlaceholder({ points, selectedId = null, onSelect, "aria-label": ariaLabel, compact = false, legend = true, className }: MapPlaceholderProps) {
  const place = points.length > 0 ? project(points) : null;
  const tones = new Set(points.map((point) => point.tone ?? "default"));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div role="group" aria-label={ariaLabel} className={cn("relative overflow-hidden rounded-lg border border-dashed border-border-strong bg-surface-sunken", compact ? "h-44" : "h-72 @tablet:h-96")}>
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-caption text-fg-subtle">
          الخريطة
        </span>
        {place
          ? points.map((point) => {
              const { x, y } = place(point);
              const selected = selectedId !== null && (point.id === selectedId || point.group === selectedId);
              const style = { insetInlineStart: `${x}%`, top: `${y}%` };
              const mark = <Mark kind={point.kind} tone={point.tone ?? "default"} className={cn(selected && "size-5 ring-2 ring-focus ring-offset-2")} />;
              return onSelect ? (
                <button
                  key={point.id}
                  type="button"
                  aria-label={point.label}
                  aria-pressed={selected}
                  onClick={() => onSelect(point.group ?? point.id)}
                  style={style}
                  className="absolute -ms-3 -mt-3 flex size-6 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  {mark}
                </button>
              ) : (
                <span key={point.id} role="img" aria-label={point.label} style={style} className="absolute -ms-3 -mt-3 flex size-6 items-center justify-center">
                  {mark}
                </span>
              );
            })
          : null}
      </div>

      {legend ? (
        <CaptureRow className="flex-wrap items-center gap-x-4 gap-y-1 text-caption text-fg-muted">
          <span className="flex items-center gap-1">
            <Mark kind="start" tone="default" />
            بدء
          </span>
          <span className="flex items-center gap-1">
            <Mark kind="end" tone="default" />
            إنهاء
          </span>
          {tones.has("warning") ? (
            <span className="flex items-center gap-1">
              <Mark kind="start" tone="warning" />
              مشكوك فيها
            </span>
          ) : null}
          {tones.has("danger") ? (
            <span className="flex items-center gap-1">
              <Mark kind="start" tone="danger" />
              مرفوضة
            </span>
          ) : null}
        </CaptureRow>
      ) : null}
    </div>
  );
}
