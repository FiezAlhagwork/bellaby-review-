"use client";

import { SlidersHorizontal, X } from "@phosphor-icons/react";
import { useState, type ReactElement, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/Dialog";
import { Popover } from "@/components/ui/Popover";
import { SearchInput } from "@/components/ui/SearchInput";
import { CaptureRow, useCaptureClass } from "@/lib/design/CaptureMode";

/** فلتر مفعّل يظهر شارة تحت الشريط بزر إزالة: «الحالة: معلّق». */
export type ActiveFilter = { key: string; label: string; onRemove: () => void };

type FilterBarProps = {
  search: { value: string; onChange: (value: string) => void; placeholder?: string };
  /** فلاتر سريعة (Select أو DateRangePicker). كل عنصر بمفتاح، ويأخذ عرضه من الشريط. */
  quickFilters?: readonly ReactElement[];
  /** محتوى «فلاتر أخرى» (popover على المكتب، وفي الورقة السفلية على الموبايل). */
  moreFilters?: ReactNode;
  active?: readonly ActiveFilter[];
  onClearAll?: () => void;
};

/**
 * شريط الفلاتر فوق الجدول (DESIGN.md 10.8): SearchInput في البداية، ثم فلاتر سريعة، ثم «فلاتر أخرى» تفتح popover.
 * الفلاتر المفعّلة شارات تحت الشريط بزر إزالة ومعها «مسح الكل». على الموبايل: بحث بعرض كامل، وزر «فلاتر (3)» يفتح ورقة سفلية.
 * كل القيم props للـ view (لا من الرابط): الأب يملكها ويمرّرها لحقول الفلاتر.
 */
export function FilterBar({ search, quickFilters = [], moreFilters, active = [], onClearAll }: FilterBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const count = active.length;
  const hasFilters = quickFilters.length > 0 || moreFilters !== undefined;

  const searchField = (
    <SearchInput
      aria-label="بحث"
      placeholder={search.placeholder ?? "ابحث"}
      value={search.value}
      onChange={(event) => search.onChange(event.target.value)}
      onClear={() => search.onChange("")}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      {/* مكتب وتابلت */}
      <CaptureRow className="hidden items-center gap-3 @tablet:flex">
        <div className="min-w-0 max-w-sm flex-1">{searchField}</div>
        {quickFilters.map((filter, index) => (
          <div key={filter.key ?? index} className="w-48 shrink-0">
            {filter}
          </div>
        ))}
        {moreFilters !== undefined ? (
          <Popover
            trigger={
              <Button variant="secondary" icon={SlidersHorizontal}>
                فلاتر أخرى
              </Button>
            }
          >
            <div className="flex w-72 flex-col gap-4">{moreFilters}</div>
          </Popover>
        ) : null}
      </CaptureRow>

      {/* موبايل */}
      <CaptureRow className="items-center gap-2 @tablet:hidden">
        <div className="min-w-0 flex-1">{searchField}</div>
        {hasFilters ? (
          <Button variant="secondary" icon={SlidersHorizontal} onClick={() => setSheetOpen(true)}>
            {count > 0 ? `فلاتر (${count})` : "فلاتر"}
          </Button>
        ) : null}
      </CaptureRow>
      {hasFilters ? (
        <BottomSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={count > 0 ? `فلاتر (${count})` : "فلاتر"}
          actions={[
            <Button key="done" onClick={() => setSheetOpen(false)}>
              تم
            </Button>,
          ]}
        >
          <div className="flex flex-col gap-4">
            {quickFilters.map((filter, index) => (
              <div key={filter.key ?? index}>{filter}</div>
            ))}
            {moreFilters}
          </div>
        </BottomSheet>
      ) : null}

      {count > 0 ? (
        <CaptureRow className="items-center gap-2">
          <CaptureRow role="list" aria-label="الفلاتر المفعّلة" className="min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            {active.map((filter) => (
              <FilterChip key={filter.key} filter={filter} />
            ))}
          </CaptureRow>
          {onClearAll ? (
            <Button variant="ghost" size="sm" className="shrink-0" onClick={onClearAll}>
              مسح الكل
            </Button>
          ) : null}
        </CaptureRow>
      ) : null}
    </div>
  );
}

function FilterChip({ filter }: { filter: ActiveFilter }) {
  // ps/pe منطقيان فيُقلبان في LTR: يُختاران بحسب وضع الالتقاط.
  const padding = useCaptureClass("ps-2 pe-1", "pe-2 ps-1");
  return (
    <CaptureRow role="listitem" className={`h-7 shrink-0 items-center gap-1 rounded-sm bg-surface-sunken text-label text-fg ${padding}`}>
      <span className="whitespace-nowrap">{filter.label}</span>
      <button
        type="button"
        aria-label={`إزالة ${filter.label}`}
        onClick={filter.onRemove}
        className="flex size-5 items-center justify-center rounded-sm text-fg-muted outline-none hover:bg-border focus-visible:ring-2 focus-visible:ring-focus"
      >
        <X size={12} aria-hidden="true" />
      </button>
    </CaptureRow>
  );
}
