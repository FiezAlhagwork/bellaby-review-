"use client";

import type { Icon } from "@phosphor-icons/react";
import { ClockCounterClockwise } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatDateTime } from "@/lib/format";

export type ActivityEvent = {
  id: string | number;
  /** أيقونة النوع من قاموس DESIGN.md 6. */
  icon: Icon;
  /** جملة الحدث: «رفض رامي السيد الجرد». */
  sentence: string;
  /** السبب إن وُجد: يظهر في اقتباس. */
  reason?: string;
  /** UTC من العقد. */
  at: string;
  /** القرار بالتفويض: شارة «بالتفويض عن المدير التنفيذي». */
  onBehalf?: boolean;
};

type ActivityLogProps = {
  /** الأحدث في الأعلى (ترتيب الأب). */
  events: readonly ActivityEvent[];
  loading?: boolean;
  className?: string;
};

/**
 * السجل (DESIGN.md 10.13): قائمة عمودية بخط زمني على البداية. لكل حدث أيقونة النوع وجملة، وسبب في اقتباس surface-muted إن وُجد،
 * والوقت بتوقيت دمشق. القرار بالتفويض بشارة info. في كل صفحة تفاصيل لكيان له قرارات، والأحدث في الأعلى.
 */
export function ActivityLog({ events, loading = false, className }: ActivityLogProps) {
  if (loading) {
    return (
      <div aria-hidden="true" className={cn("flex flex-col gap-4", className)}>
        {[0, 1, 2].map((index) => (
          <CaptureRow key={index} className="items-start gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </CaptureRow>
        ))}
      </div>
    );
  }

  if (events.length === 0) return <EmptyState className={cn("py-6", className)} icon={ClockCounterClockwise} title="لا أحداث بعد" description="تظهر هنا القرارات والتغييرات على هذا العنصر." />;

  return (
    <ol className={cn("flex flex-col", className)}>
      {events.map((event, index) => {
        const EventIcon = event.icon;
        const last = index === events.length - 1;
        return (
          <li key={event.id}>
            <CaptureRow className="items-stretch gap-3">
              <div className="flex w-8 shrink-0 flex-col items-center">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-fg">
                  <EventIcon size={16} aria-hidden="true" />
                </span>
                {last ? null : <span className="min-h-4 w-px flex-1 bg-border" />}
              </div>
              <div className={cn("flex min-w-0 flex-1 flex-col gap-2", last ? "pb-0" : "pb-5")}>
                <CaptureRow className="items-center gap-2">
                  <p className="min-w-0 text-start text-body text-fg">{event.sentence}</p>
                  {event.onBehalf ? <Badge color="info">بالتفويض عن المدير التنفيذي</Badge> : null}
                </CaptureRow>
                {event.reason ? <blockquote className="rounded-md bg-surface-muted px-3 py-2 text-start text-body text-fg">{event.reason}</blockquote> : null}
                <time dateTime={event.at} className="text-start text-caption text-fg-muted">
                  {formatDateTime(event.at)}
                </time>
              </div>
            </CaptureRow>
          </li>
        );
      })}
    </ol>
  );
}
