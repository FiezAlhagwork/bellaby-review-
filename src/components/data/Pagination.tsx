"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { isolate } from "@/lib/format";

/** `meta` بأسلوب Laravel في العقد. */
export type PaginationMeta = { current_page: number; last_page: number; per_page: number; total: number };

type PaginationProps = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  /** بدونه لا يظهر اختيار «لكل صفحة». */
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: readonly number[];
  className?: string;
};

const ELLIPSIS = "…";

/** الصفحة الأولى والأخيرة والحالية وجارتاها، و«…» حيث الانقطاع. */
function pageItems(current: number, last: number): (number | typeof ELLIPSIS)[] {
  const pages = [...new Set([1, current - 1, current, current + 1, last])].filter((page) => page >= 1 && page <= last).sort((a, b) => a - b);
  const items: (number | typeof ELLIPSIS)[] = [];
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) items.push(ELLIPSIS);
    items.push(page);
  });
  return items;
}

/**
 * الترقيم تحت كل جدول (DESIGN.md 10.7): «عرض 21–40 من 73» في البداية، وأرقام الصفحات (السابق · 1 · 2 · 3 · … · 8 · التالي)،
 * و«لكل صفحة». على الموبايل «السابق · 2 من 8 · التالي» فقط. من `meta` العقد.
 */
export function Pagination({ meta, onPageChange, onPerPageChange, perPageOptions = [20, 50, 100], className }: PaginationProps) {
  const { current_page: current, last_page: last, per_page: perPage, total } = meta;
  if (total === 0) return null;

  const from = (current - 1) * perPage + 1;
  const to = Math.min(current * perPage, total);
  const hasPrev = current > 1;
  const hasNext = current < last;

  const prev = (
    <Button key="prev" variant="ghost" size="sm" icon={CaretRight} disabled={!hasPrev} onClick={() => onPageChange(current - 1)}>
      السابق
    </Button>
  );
  const next = (
    <Button key="next" variant="ghost" size="sm" iconEnd={CaretLeft} disabled={!hasNext} onClick={() => onPageChange(current + 1)}>
      التالي
    </Button>
  );

  return (
    <nav aria-label="الترقيم" className={className}>
      {/* مكتب وتابلت */}
      <CaptureRow className="hidden items-center gap-4 @tablet:flex">
        <p className="min-w-0 flex-1 text-label text-fg-muted">{`عرض ${isolate(`${from}–${to}`)} من ${isolate(total)}`}</p>
        <CaptureRow className="items-center gap-1">
          {[
            prev,
            ...pageItems(current, last).map((item, index) =>
              item === ELLIPSIS ? (
                <span key={`gap-${index}`} aria-hidden="true" className="flex size-8 items-center justify-center text-label text-fg-muted">
                  {ELLIPSIS}
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  aria-label={`صفحة ${item}`}
                  aria-current={item === current ? "page" : undefined}
                  onClick={() => onPageChange(item)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md text-label tabular-nums outline-none transition-colors duration-120 ease-out focus-visible:ring-2 focus-visible:ring-focus",
                    item === current ? "cursor-default bg-primary-soft font-semibold text-fg" : "text-fg hover:bg-surface-sunken",
                  )}
                >
                  {item}
                </button>
              ),
            ),
            next,
          ]}
        </CaptureRow>
        {onPerPageChange ? (
          <CaptureRow className="items-center gap-2">
            <span className="text-label text-fg-muted">لكل صفحة</span>
            <div className="w-24">
              <Select
                aria-label="عدد الصفوف في الصفحة"
                value={String(perPage)}
                onValueChange={(value) => onPerPageChange(Number(value))}
                options={perPageOptions.map((option) => ({ value: String(option), label: String(option) }))}
              />
            </div>
          </CaptureRow>
        ) : null}
      </CaptureRow>

      {/* موبايل */}
      <CaptureRow className="items-center gap-2 @tablet:hidden">
        {prev}
        <p className="min-w-0 flex-1 text-center text-label text-fg-muted">{`${isolate(current)} من ${isolate(last)}`}</p>
        {next}
      </CaptureRow>
    </nav>
  );
}
