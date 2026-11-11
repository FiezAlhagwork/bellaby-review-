"use client";

import { ChartBar } from "@phosphor-icons/react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/ui/EmptyState";
import { useOverlay } from "@/components/ui/OverlayHost";
import { Skeleton } from "@/components/ui/Skeleton";
import { tooltipClass } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";

// الرسم البياني (DESIGN.md 10.10). Recharts هنا وحده. ثلاثة أنواع: bar (مقارنة) وline (اتجاه زمني) وbar-target (أعمدة مع خط الهدف).
// لا دوائر ولا رسوماً مكدّسة في المرحلة 1. الألوان chart-1… بالترتيب، والهدف chart-target متقطع. محور الزمن من اليمين (الأقدم يمين).
// الألوان متغيّرات الثيم (var) لا قيم خام، فتتبدل مع المرحلة 2. بلا حركة: الحالة النهائية دائماً (الالتقاط).

export type ChartSeries = { key: string; label: string };
export type ChartRow = { label: string } & Record<string, string | number>;

type ChartProps = {
  type: "bar" | "line" | "bar-target";
  /** كل صف نقطة على محور الزمن/الفئة: `{ label: "تشرين الأول", sales: 1200 }`. الصف الأول (الأقدم) يظهر يميناً. */
  data: readonly ChartRow[];
  series: readonly ChartSeries[];
  /** قيمة الهدف لـ bar-target. */
  target?: number;
  targetLabel?: string;
  /** تنسيق القيمة في المحور والتلميح: `formatQuantity` أو `formatMoney`. */
  formatValue: (value: number) => string;
  /** اسم الرسم لقارئ الشاشة. */
  label: string;
  state?: "ready" | "loading";
  className?: string;
};

const SERIES_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];
const AXIS_TICK = { fill: "var(--color-fg-muted)", fontSize: 12 };

type TooltipPayload = { dataKey?: string | number; value?: number | string; name?: string | number };

function ChartTooltip({ active, payload, label, formatValue, series }: { active?: boolean; payload?: TooltipPayload[]; label?: string | number; formatValue: (value: number) => string; series: readonly ChartSeries[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={cn(tooltipClass, "flex flex-col gap-1 opacity-100")}>
      <span className="font-medium">{label}</span>
      {payload.map((entry) => (
        <span key={String(entry.dataKey)} dir="rtl" className="flex items-center gap-2">
          <span>{series.find((item) => item.key === entry.dataKey)?.label ?? entry.name}:</span>
          <span dir="ltr" className="tabular-nums">
            {formatValue(Number(entry.value))}
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * الرسم البياني. الارتفاع 200 على الموبايل (بعرض كامل ومحاور مختصرة) و288 من التابلت.
 * وسيلة الإيضاح فوق الرسم في البداية. الحالات: تحميل (مستطيل Skeleton بارتفاع الرسم)، وبلا بيانات.
 */
export function Chart({ type, data, series, target, targetLabel = "الهدف", formatValue, label, state = "ready", className }: ChartProps) {
  const { breakpoint } = useOverlay();
  const compact = breakpoint === "mobile";
  const height = "h-50 @tablet:h-72";

  if (state === "loading") return <Skeleton className={cn("w-full", height, className)} />;
  if (data.length === 0) return <EmptyState className={cn("justify-center py-0", height, className)} icon={ChartBar} title="لا بيانات" description="لم تُسجَّل بيانات لهذه الفترة." />;

  const legend = [...series.map((item, index) => ({ key: item.key, label: item.label, color: SERIES_COLORS[index % SERIES_COLORS.length], dashed: false })), ...(type === "bar-target" && target !== undefined ? [{ key: "target", label: targetLabel, color: "var(--color-chart-target)", dashed: true }] : [])];

  const margin = { top: 8, right: 0, bottom: 0, left: 0 };
  // الأقدم يميناً: XAxis معكوس. وبما أن اتجاه الصفحة RTL، محور القيم يميناً (البداية).
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--color-border)" />
      <XAxis dataKey="label" reversed tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "var(--color-border-strong)" }} interval={compact ? "preserveStartEnd" : 0} />
      <YAxis orientation="right" width={compact ? 40 : 64} tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={formatValue} />
      <Tooltip cursor={{ fill: "var(--color-surface-sunken)" }} content={<ChartTooltip formatValue={formatValue} series={series} />} />
    </>
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <CaptureRow aria-label="وسيلة الإيضاح" className="items-center gap-4 text-caption text-fg-muted">
        {legend.map((item) => (
          <CaptureRow key={item.key} className="items-center gap-1">
            <span aria-hidden="true" style={{ backgroundColor: item.dashed ? undefined : item.color, borderColor: item.color }} className={cn("size-2.5 rounded-sm", item.dashed && "h-0 w-4 border-t-2 border-dashed")} />
            <span>{item.label}</span>
          </CaptureRow>
        ))}
      </CaptureRow>
      <div role="img" aria-label={label} dir="ltr" className={cn("w-full", height)}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 288 }}>
          {type === "line" ? (
            <LineChart data={data as ChartRow[]} margin={margin}>
              {axes}
              {series.map((item, index) => (
                <Line key={item.key} dataKey={item.key} type="monotone" stroke={SERIES_COLORS[index % SERIES_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
              ))}
            </LineChart>
          ) : (
            <BarChart data={data as ChartRow[]} margin={margin}>
              {axes}
              {series.map((item, index) => (
                <Bar key={item.key} dataKey={item.key} fill={SERIES_COLORS[index % SERIES_COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false} />
              ))}
              {type === "bar-target" && target !== undefined ? <ReferenceLine y={target} stroke="var(--color-chart-target)" strokeDasharray="6 4" strokeWidth={2} /> : null}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
