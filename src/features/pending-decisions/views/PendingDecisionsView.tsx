"use client";

import { CaretRight, Stamp } from "@phosphor-icons/react";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { pendingKindIcons, pendingKindLabels, pendingKindOrder, type PendingKind } from "@/components/data/pending-kinds";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Option } from "@/components/ui/OptionList";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PendingDecision } from "@/lib/api/types";
import { CaptureRow, useCaptureClass } from "@/lib/design/CaptureMode";
import { countPhrase, formatRelative } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** صفحة من `GET /me/pending-decisions` (`Paginated`، الأقدم أولاً). */
export type PendingDecisionsPage = { data: readonly PendingDecision[]; meta: PaginationMeta };

type PendingDecisionsViewProps = {
  pending: Loadable<PendingDecisionsPage>;
  /** فلتر النوع (`kind`). */
  kind: PendingKind | null;
  onKindChange: (kind: PendingKind | null) => void;
  /** الأنواع التي تخص الدور (خيارات الفلتر). */
  kinds: readonly PendingKind[];
  /** المفوَّض: يرى ما يشمله التفويض بين تاريخيه، دون ما يخصّه. */
  delegation?: { from: string; to: string } | null;
  now: string;
  /** يفتح شاشة القرار بحسب النوع. */
  onOpen: (item: PendingDecision) => void;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
};

/**
 * بانتظار قراري (G04): صندوق واحد مجمّع حسب النوع، والأقدم أولاً. لكل عنصر نوعه وعنوانه وصاحبه وعمره، و«يشمله التفويض» حين يكون كذلك.
 * المدير التنفيذي يرى كل الأنواع، ومدير المبيعات المرتجع والتالف وإرجاع الوكيل، والمفوَّض ما يشمله التفويض. العنصر يفتح شاشة قراره.
 */
export function PendingDecisionsView({ pending, kind, onKindChange, kinds, delegation = null, now, onOpen, onPageChange, onRetry }: PendingDecisionsViewProps) {
  const flip = useCaptureClass("rtl:-scale-x-100", "-scale-x-100");
  const ready = pending.status === "ready" ? pending.data : null;
  const items = ready?.data ?? [];
  const options: Option[] = kinds.map((value) => ({ value, label: pendingKindLabels[value] }));
  const groups = pendingKindOrder.map((value) => ({ kind: value, items: items.filter((item) => item.kind === value) })).filter((group) => group.items.length > 0);

  return (
    <>
      <PageHeader title="بانتظار قراري" description={ready ? `${countPhrase(ready.meta.total, ["عنصر ينتظر", "عنصران ينتظران", "عناصر تنتظر"])} قرارك، الأقدم أولاً.` : undefined} />

      <div className="flex flex-col gap-4">
        {delegation ? (
          <Banner kind="info" title="بالتفويض عن المدير التنفيذي">
            {`تظهر هنا القرارات التي يشملها التفويض من ${delegation.from} إلى ${delegation.to}، دون ما يخصّك.`}
          </Banner>
        ) : null}

        {kinds.length > 1 ? (
          <div className="w-full max-w-72">
            <Combobox aria-label="النوع" placeholder="كل الأنواع" options={options} value={kind} onValueChange={(value) => onKindChange(value as PendingKind | null)} clearable />
          </div>
        ) : null}

        {pending.status === "error" ? <ErrorState code={pending.code} onRetry={onRetry} /> : null}
        {pending.status === "loading" ? (
          <div className="flex flex-col gap-4" aria-busy="true">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : null}

        {ready && items.length === 0 ? (
          <Card>
            <EmptyState icon={Stamp} title="لا شيء ينتظر قرارك" description={kind ? `لا عناصر من نوع «${pendingKindLabels[kind]}».` : "يظهر هنا كل ما يُرفع إليك للقرار."} />
          </Card>
        ) : null}

        {groups.map((group) => {
          const KindIcon = pendingKindIcons[group.kind];
          return (
            <Card key={group.kind} title={`${pendingKindLabels[group.kind]} · ${group.items.length}`}>
              <ul className="flex flex-col divide-y divide-border">
                {group.items.map((item) => (
                  <li key={`${item.kind}-${item.ref_id}`}>
                    <button type="button" onClick={() => onOpen(item)} className="block w-full rounded-md py-3 text-start outline-none transition-colors duration-120 ease-out hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-focus">
                      <CaptureRow className="items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-fg">
                          <KindIcon size={20} aria-hidden="true" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="truncate text-start text-body text-fg">{item.title}</span>
                          <span className="text-start text-caption text-fg-muted">{`${item.requested_by?.name ?? "النظام"} · ${item.waiting_since ? formatRelative(item.waiting_since, now) : ""}`}</span>
                        </span>
                        {item.delegable ? <Badge color="info">يشمله التفويض</Badge> : null}
                        <CaretRight size={16} className={`shrink-0 text-fg-muted ${flip}`} aria-hidden="true" />
                      </CaptureRow>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}

        {ready && ready.meta.last_page > 1 ? <Pagination meta={ready.meta} onPageChange={onPageChange} /> : null}
      </div>
    </>
  );
}
