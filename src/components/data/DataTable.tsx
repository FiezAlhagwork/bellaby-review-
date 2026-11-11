"use client";

import { ArrowDown, ArrowUp, CaretUpDown, Tray } from "@phosphor-icons/react";
import type { ReactElement, ReactNode } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { BulkBar } from "./BulkBar";

// الجدول (DESIGN.md 10.6). الأعمدة تُعرَّف مرة واحدة ومنها تُبنى الأشكال الثلاثة بحسب عرض المضيف (@container):
//  مكتب (من 1280): كل الأعمدة، رأس ثابت · تابلت (768–1279): أعمدة priority "high" فقط · موبايل: بطاقات، لكل صف بطاقة.
// الصفوف divs بـ CaptureRow لا <table>، فيعكسها وضع الالتقاط. الأدوار (role) تحفظ دلالة الجدول لقارئ الشاشة.

type RowKey = string | number;

export type DataTableColumn<Row> = {
  key: string;
  header: string;
  cell: (row: Row) => ReactNode;
  /** النص إلى البداية (الافتراضي). الأرقام والمبالغ إلى النهاية بـ tabular-nums. */
  align?: "start" | "end";
  /** class عرض ثابت (مثل `w-40`). بدونه يتقاسم العمود المساحة الباقية. */
  width?: string;
  /** high يبقى على التابلت وفي بطاقة الموبايل. normal (الافتراضي) للمكتب فقط. */
  priority?: "high" | "normal";
  sortable?: boolean;
  /** في بطاقة الموبايل: primary سطرها الأول (الأول افتراضياً)، وstatus شارتها بجانبه. */
  role?: "primary" | "status";
};

export type SortState = { key: string; direction: "asc" | "desc" };

type DataTableProps<Row> = {
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => RowKey;
  /** اسم الجدول لقارئ الشاشة: «الصرفيات». */
  label: string;
  /** تحميل: 6 أسطر Skeleton بشكل الأعمدة. */
  loading?: boolean;
  /** خطأ التحميل: ErrorState داخل الجدول مع «إعادة المحاولة». */
  error?: { code: string; onRetry?: () => void };
  /** يحل مكان الصفوف حين تكون فارغة: «لا شيء بعد» أو «لا نتائج للفلتر» (الأب يعرف أيهما). */
  empty?: ReactNode;
  /** ارتفاع الصف 52 (الافتراضي) أو 44. */
  density?: "comfortable" | "compact";
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  /** عمود Checkbox أول وشريط BulkBar. فقط حين يدعم العقد إجراءً جماعياً. */
  selection?: { selected: readonly RowKey[]; onChange: (keys: RowKey[]) => void };
  bulkActions?: readonly ReactElement[];
  /** عمود الإجراءات الأخير (يسار): Menu لكل صف. */
  rowActions?: (row: Row) => readonly MenuItem[];
  /** الصف قابل للفتح (الصف كله): يُستدعى بالنقر وبـ Enter. */
  onRowOpen?: (row: Row) => void;
};

const SKELETON_ROWS = 6;
const SELECT_CELL = "flex w-12 shrink-0 items-center justify-center";
const ACTIONS_CELL = "flex w-14 shrink-0 items-center justify-center";

export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  label,
  loading = false,
  error,
  empty,
  density = "comfortable",
  sort,
  onSortChange,
  selection,
  bulkActions = [],
  rowActions,
  onRowOpen,
}: DataTableProps<Row>) {
  const primary = columns.find((column) => column.role === "primary") ?? columns[0];
  const status = columns.find((column) => column.role === "status");
  // أزواج «تسمية: قيمة» في البطاقة: أعمدة high غير الأساسي والحالة، حتى 3.
  const pairs = columns.filter((column) => column !== primary && column !== status && column.priority === "high").slice(0, 3);

  const keys = rows.map(getRowKey);
  const selected = selection?.selected ?? [];
  const allSelected = keys.length > 0 && keys.every((key) => selected.includes(key));
  const someSelected = keys.some((key) => selected.includes(key));
  const toggleAll = () => selection?.onChange(allSelected ? selected.filter((key) => !keys.includes(key)) : [...new Set([...selected, ...keys])]);
  const toggleRow = (key: RowKey) => selection?.onChange(selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key]);

  const showState = loading || error !== undefined || rows.length === 0;
  const rowHeight = density === "compact" ? "h-11" : "h-13";

  const colClass = (column: DataTableColumn<Row>) =>
    cn(
      "min-w-0 px-4",
      column.width ? cn(column.width, "shrink-0") : "flex-1",
      column.priority !== "high" && "hidden @desktop:block",
      column.align === "end" ? "text-end tabular-nums" : "text-start",
    );

  const stateBody = loading ? null : error ? (
    <ErrorState className="min-h-80" code={error.code} onRetry={error.onRetry} />
  ) : (
    (empty ?? <EmptyState className="min-h-80" icon={Tray} title="لا توجد بيانات" />)
  );

  const bulk =
    selection && selected.length > 0 ? <BulkBar count={selected.length} actions={bulkActions} onClear={() => selection.onChange([])} /> : null;

  const sortIcon = (column: DataTableColumn<Row>) => {
    if (sort?.key !== column.key) return <CaretUpDown size={14} aria-hidden="true" className="text-fg-subtle" />;
    return sort.direction === "asc" ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />;
  };

  return (
    <div className="flex flex-col gap-3">
      {bulk}

      {/* مكتب وتابلت */}
      <div role="table" aria-label={label} aria-rowcount={rows.length + 1} className="hidden overflow-clip rounded-lg border border-border bg-surface @tablet:block">
        <div role="rowgroup" className="sticky top-0 z-10">
          <CaptureRow role="row" className="h-11 items-center border-b border-border bg-surface-muted">
            {selection ? (
              <div role="columnheader" className={SELECT_CELL}>
                <Checkbox aria-label="تحديد كل الصفوف" checked={allSelected} indeterminate={!allSelected && someSelected} onCheckedChange={toggleAll} disabled={showState} />
              </div>
            ) : null}
            {columns.map((column) => (
              <div
                key={column.key}
                role="columnheader"
                aria-sort={sort?.key === column.key ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
                className={cn(colClass(column), "text-label font-medium text-fg-muted")}
              >
                {column.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSortChange?.({ key: column.key, direction: sort?.key === column.key && sort.direction === "asc" ? "desc" : "asc" })}
                    className="inline-flex max-w-full items-center rounded-sm outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <CaptureRow className="items-center gap-1">
                      <span className="truncate">{column.header}</span>
                      {sortIcon(column)}
                    </CaptureRow>
                  </button>
                ) : (
                  column.header
                )}
              </div>
            ))}
            {rowActions ? <div role="columnheader" aria-label="الإجراءات" className={ACTIONS_CELL} /> : null}
          </CaptureRow>
        </div>

        <div role="rowgroup">
          {loading
            ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <CaptureRow key={index} role="row" aria-hidden="true" className={cn("items-center border-b border-border last:border-b-0", rowHeight)}>
                  {selection ? <div className={SELECT_CELL} /> : null}
                  {columns.map((column) => (
                    <div key={column.key} className={colClass(column)}>
                      <Skeleton className={cn("h-4", column.align === "end" ? "ms-auto w-1/2" : "w-3/4")} />
                    </div>
                  ))}
                  {rowActions ? <div className={ACTIONS_CELL} /> : null}
                </CaptureRow>
              ))
            : showState
              ? stateBody
              : rows.map((row) => {
                  const key = getRowKey(row);
                  const isSelected = selected.includes(key);
                  return (
                    <CaptureRow
                      key={key}
                      role="row"
                      aria-selected={selection ? isSelected : undefined}
                      tabIndex={onRowOpen ? 0 : undefined}
                      onClick={onRowOpen ? () => onRowOpen(row) : undefined}
                      onKeyDown={
                        onRowOpen
                          ? (event: React.KeyboardEvent) => {
                              if (event.target === event.currentTarget && event.key === "Enter") onRowOpen(row);
                            }
                          : undefined
                      }
                      className={cn(
                        "items-center border-b border-border text-body text-fg outline-none last:border-b-0 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset",
                        rowHeight,
                        isSelected ? "bg-primary-soft" : "hover:bg-surface-muted",
                        onRowOpen && "cursor-pointer",
                      )}
                    >
                      {selection ? (
                        <div role="cell" className={SELECT_CELL} onClick={(event) => event.stopPropagation()}>
                          <Checkbox aria-label="تحديد الصف" checked={isSelected} onCheckedChange={() => toggleRow(key)} />
                        </div>
                      ) : null}
                      {columns.map((column) => (
                        <div key={column.key} role="cell" className={colClass(column)}>
                          {column.cell(row)}
                        </div>
                      ))}
                      {rowActions ? (
                        <div role="cell" className={ACTIONS_CELL} onClick={(event) => event.stopPropagation()}>
                          <Menu items={rowActions(row)} aria-label="إجراءات الصف" />
                        </div>
                      ) : null}
                    </CaptureRow>
                  );
                })}
        </div>
      </div>

      {/* موبايل: بطاقات */}
      <div className="flex flex-col gap-3 @tablet:hidden">
        {loading ? (
          Array.from({ length: 3 }, (_, index) => (
            <div key={index} aria-hidden="true" className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))
        ) : showState ? (
          <div className="overflow-hidden rounded-lg border border-border bg-surface">{stateBody}</div>
        ) : (
          rows.map((row) => {
            const key = getRowKey(row);
            const isSelected = selected.includes(key);
            return (
              <div
                key={key}
                tabIndex={onRowOpen ? 0 : undefined}
                onClick={onRowOpen ? () => onRowOpen(row) : undefined}
                onKeyDown={
                  onRowOpen
                    ? (event) => {
                        if (event.target === event.currentTarget && event.key === "Enter") onRowOpen(row);
                      }
                    : undefined
                }
                className={cn(
                  "flex flex-col gap-3 rounded-lg border border-border p-4 text-body text-fg outline-none focus-visible:ring-2 focus-visible:ring-focus",
                  isSelected ? "bg-primary-soft" : "bg-surface",
                  onRowOpen && "cursor-pointer",
                )}
              >
                <CaptureRow className="items-center gap-3">
                  {selection ? (
                    <span onClick={(event) => event.stopPropagation()} className="flex shrink-0">
                      <Checkbox aria-label="تحديد الصف" checked={isSelected} onCheckedChange={() => toggleRow(key)} />
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1 font-medium">{primary.cell(row)}</div>
                  {status ? <div className="shrink-0">{status.cell(row)}</div> : null}
                  {rowActions ? (
                    <span onClick={(event) => event.stopPropagation()} className="flex shrink-0">
                      <Menu items={rowActions(row)} aria-label="إجراءات الصف" />
                    </span>
                  ) : null}
                </CaptureRow>
                {pairs.map((column) => (
                  <CaptureRow key={column.key} className="items-baseline gap-2 text-label">
                    <span className="w-28 shrink-0 text-fg-muted">{column.header}</span>
                    <div className="min-w-0 flex-1 text-start text-body text-fg">{column.cell(row)}</div>
                  </CaptureRow>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
