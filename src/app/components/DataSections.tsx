"use client";

import { MagnifyingGlass, Package, PencilSimple, Prohibit } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { BulkBar } from "@/components/data/BulkBar";
import { Chart } from "@/components/data/Chart";
import { DataTable, type DataTableColumn, type SortState } from "@/components/data/DataTable";
import { DateTimeCell, LinkCell, QuantityCell, StatusCell, TextCell } from "@/components/data/cells";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { KpiTile } from "@/components/data/KpiTile";
import { Pagination } from "@/components/data/Pagination";
import { Button } from "@/components/ui/Button";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { OverlayHost } from "@/components/ui/OverlayHost";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatMoney, formatQuantity } from "@/lib/format";
import type { Transfer } from "@/lib/api/types";
import { transfers } from "@/mocks/transfers";
import { Grid } from "@/components/layout/Grid";
import { GalleryGroup, GallerySection, useGalleryClean } from "./gallery-kit";

const noop = () => {};

/** إطار بمضيفه (OverlayHost): يقيس عرضه لا عرض النافذة. الـ padding على ابنه. */
export function HostFrame({ label, widthClass, children }: { label: string; widthClass: string; children: ReactNode }) {
  const shown = useGalleryClean() ? label.replace(/ حي:.*$/, "") : label;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-label font-medium text-fg-muted">{shown}</p>
      <CaptureRow>
        <OverlayHost className={cn("bg-bg ring-1 ring-border", widthClass)}>
          <div className="p-4 @tablet:p-6">{children}</div>
        </OverlayHost>
      </CaptureRow>
    </div>
  );
}

export const DESKTOP = "w-320";
export const TABLET = "w-256";
export const MOBILE = "w-97.5";

const columns: readonly DataTableColumn<Transfer>[] = [
  { key: "reference", header: "رقم الصرف", priority: "high", sortable: true, width: "w-40", cell: (row) => <LinkCell href="#">{row.reference}</LinkCell> },
  { key: "destination", header: "الوجهة", priority: "high", cell: (row) => <TextCell value={row.to_location?.name} /> },
  { key: "status", header: "الحالة", priority: "high", role: "status", width: "w-36", cell: (row) => (row.status ? <StatusCell entity="transfer" status={row.status} /> : null) },
  { key: "quantity", header: "الكمية", priority: "high", align: "end", sortable: true, width: "w-36", cell: (row) => <QuantityCell value={row.total_quantity} unit="علبة" /> },
  { key: "createdBy", header: "أنشأه", cell: (row) => <TextCell value={row.created_by?.name} /> },
  { key: "createdAt", header: "التاريخ", width: "w-60", cell: (row) => <DateTimeCell value={row.created_at} /> },
];

const rowActions = () => [
  { id: "edit", label: "تعديل", icon: PencilSimple, onSelect: noop },
  { id: "cancel", label: "إلغاء", icon: Prohibit, danger: true, onSelect: noop },
];

function LiveTable({ selectable = false, density = "comfortable" }: { selectable?: boolean; density?: "comfortable" | "compact" }) {
  const [sort, setSort] = useState<SortState>({ key: "reference", direction: "asc" });
  const [selected, setSelected] = useState<(string | number)[]>(selectable ? [155, 158] : []);
  const rows = [...transfers].sort((a, b) => {
    const left = sort.key === "quantity" ? (a.total_quantity ?? 0) : (a.reference ?? "");
    const right = sort.key === "quantity" ? (b.total_quantity ?? 0) : (b.reference ?? "");
    return (left < right ? -1 : left > right ? 1 : 0) * (sort.direction === "asc" ? 1 : -1);
  });
  return (
    <DataTable
      label="الصرفيات"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id ?? ""}
      density={density}
      sort={sort}
      onSortChange={setSort}
      selection={selectable ? { selected, onChange: setSelected } : undefined}
      bulkActions={[
        <Button key="cancel" variant="secondary" size="sm">
          إلغاء المحدد
        </Button>,
      ]}
      rowActions={rowActions}
      onRowOpen={noop}
    />
  );
}

export function DataTableSection() {
  return (
    <GallerySection
      name="DataTable"
      title="الجدول"
      usage="الأعمدة تُعرَّف مرة واحدة ومنها تُبنى الأشكال الثلاثة: مكتب كامل برأس ثابت، تابلت بأعمدة priority high فقط، موبايل بطاقات (السطر الأول الأساسي والحالة، ثم حتى 3 أزواج، والإجراءات في Menu). الصف القابل للفتح كله، والفرز بالنقر على الرأس."
    >
      <GalleryGroup title="الثلاثة مقاسات (حي: فرز، فتح بـ Enter، قائمة الصف)">
        <div className="flex flex-col gap-8">
          <HostFrame label="مكتب 1280: كل الأعمدة" widthClass={DESKTOP}>
            <LiveTable />
          </HostFrame>
          <HostFrame label="تابلت 1024: أعمدة high فقط" widthClass={TABLET}>
            <LiveTable />
          </HostFrame>
          <HostFrame label="موبايل 390: بطاقات" widthClass={MOBILE}>
            <LiveTable />
          </HostFrame>
        </div>
      </GalleryGroup>

      <GalleryGroup title="التحديد وشريط الإجراء الجماعي، والكثافة compact">
        <div className="flex flex-col gap-8">
          <HostFrame label="تحديد (صفان محدّدان)" widthClass={DESKTOP}>
            <LiveTable selectable />
          </HostFrame>
          <HostFrame label="compact: 44" widthClass={DESKTOP}>
            <LiveTable density="compact" />
          </HostFrame>
          <HostFrame label="BulkBar وحده" widthClass={DESKTOP}>
            <BulkBar count={12} actions={[<Button key="a" variant="secondary" size="sm">رفض</Button>]} onClear={noop} />
          </HostFrame>
        </div>
      </GalleryGroup>

      <GalleryGroup title="الحالات: تحميل · فارغ · لا نتائج · خطأ">
        <div className="flex flex-col gap-8">
          <HostFrame label="تحميل: 6 أسطر Skeleton بشكل الأعمدة" widthClass={DESKTOP}>
            <DataTable label="الصرفيات" columns={columns} rows={[]} getRowKey={noop as never} loading />
          </HostFrame>
          <HostFrame label="فارغ: لا شيء بعد (مع الإجراء)" widthClass={DESKTOP}>
            <DataTable
              label="الصرفيات"
              columns={columns}
              rows={[]}
              getRowKey={noop as never}
              empty={<EmptyState className="min-h-80" icon={Package} title="لا توجد صرفيات بعد" description="ابدأ بإنشاء أول صرف ليظهر هنا." action={<Button>صرف جديد</Button>} />}
            />
          </HostFrame>
          <HostFrame label="لا نتائج للفلتر (مع مسح الفلاتر)" widthClass={DESKTOP}>
            <DataTable
              label="الصرفيات"
              columns={columns}
              rows={[]}
              getRowKey={noop as never}
              empty={<EmptyState className="min-h-80" icon={MagnifyingGlass} title="لا نتائج" description="لا شيء يطابق الفلاتر الحالية." action={<Button variant="secondary">مسح الفلاتر</Button>} />}
            />
          </HostFrame>
          <HostFrame label="خطأ مع إعادة المحاولة" widthClass={DESKTOP}>
            <DataTable label="الصرفيات" columns={columns} rows={[]} getRowKey={noop as never} error={{ code: "too_many_requests", onRetry: noop }} />
          </HostFrame>
          <HostFrame label="موبايل: تحميل وفارغ وخطأ" widthClass={MOBILE}>
            <div className="flex flex-col gap-6">
              <DataTable label="الصرفيات" columns={columns} rows={[]} getRowKey={noop as never} loading />
              <DataTable label="الصرفيات" columns={columns} rows={[]} getRowKey={noop as never} error={{ code: "too_many_requests", onRetry: noop }} />
            </div>
          </HostFrame>
        </div>
      </GalleryGroup>
    </GallerySection>
  );
}

function LivePagination() {
  const [page, setPage] = useState(2);
  const [perPage, setPerPage] = useState(20);
  const total = 173;
  return (
    <Pagination
      meta={{ current_page: page, last_page: Math.ceil(total / perPage), per_page: perPage, total }}
      onPageChange={setPage}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
      }}
    />
  );
}

export function PaginationSection() {
  return (
    <GallerySection
      name="Pagination"
      title="الترقيم"
      usage="تحت كل جدول: «عرض 21–40 من 73» في البداية، وأرقام الصفحات في النهاية (السابق · 1 · 2 · 3 · … · 8 · التالي)، و«لكل صفحة». على الموبايل «السابق · 2 من 8 · التالي». من meta العقد."
    >
      <GalleryGroup title="الحالات">
        <div className="flex flex-col gap-6">
          <HostFrame label="مكتب حي: انقر الصفحات وغيّر «لكل صفحة»" widthClass={DESKTOP}>
            <LivePagination />
          </HostFrame>
          <HostFrame label="الصفحة الأولى (السابق معطّل)" widthClass={DESKTOP}>
            <Pagination meta={{ current_page: 1, last_page: 4, per_page: 20, total: 73 }} onPageChange={noop} onPerPageChange={noop} />
          </HostFrame>
          <HostFrame label="الأخيرة (التالي معطّل)" widthClass={DESKTOP}>
            <Pagination meta={{ current_page: 8, last_page: 8, per_page: 10, total: 73 }} onPageChange={noop} onPerPageChange={noop} />
          </HostFrame>
          <HostFrame label="صفحات كثيرة: «…» من الجهتين" widthClass={DESKTOP}>
            <Pagination meta={{ current_page: 10, last_page: 40, per_page: 20, total: 800 }} onPageChange={noop} />
          </HostFrame>
          <HostFrame label="موبايل" widthClass={MOBILE}>
            <Pagination meta={{ current_page: 2, last_page: 8, per_page: 20, total: 173 }} onPageChange={noop} />
          </HostFrame>
        </div>
      </GalleryGroup>
    </GallerySection>
  );
}

const statusOptions = [
  { value: "IN_TRANSIT", label: "بالطريق" },
  { value: "RECEIVED", label: "مستلم" },
  { value: "CANCELLED", label: "ملغى" },
] as const;

function LiveFilters({ initial = false, withSearch = true, many = false }: { initial?: boolean; withSearch?: boolean; many?: boolean }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]["value"] | null>(initial ? "IN_TRANSIT" : null);
  const [range, setRange] = useState<DateRange>(initial ? { from: "2026-11-01", to: "2026-11-09" } : { from: null, to: null });
  const [destination, setDestination] = useState(many ? "وكالة الياسمين للتوزيع" : "");

  const active: ActiveFilter[] = [
    ...(status ? [{ key: "status", label: `الحالة: ${statusOptions.find((option) => option.value === status)?.label}`, onRemove: () => setStatus(null) }] : []),
    ...(range.to ? [{ key: "range", label: "الفترة: 1–9 تشرين الثاني", onRemove: () => setRange({ from: null, to: null }) }] : []),
    ...(destination ? [{ key: "destination", label: `الوجهة: ${destination}`, onRemove: () => setDestination("") }] : []),
  ];

  return (
    <FilterBar
      search={withSearch ? { value: search, onChange: setSearch, placeholder: "ابحث برقم الصرف" } : undefined}
      quickFilters={[
        <Select key="status" aria-label="الحالة" placeholder="الحالة" options={statusOptions} value={status} onValueChange={setStatus} />,
        <DateRangePicker key="range" aria-label="الفترة" placeholder="الفترة" value={range} onValueChange={setRange} today="2026-11-10" />,
      ]}
      moreFilters={
        <Field label="الوجهة">
          <Input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="اسم الوكيل أو المندوب" />
        </Field>
      }
      active={active}
      onClearAll={() => {
        setStatus(null);
        setRange({ from: null, to: null });
        setDestination("");
      }}
    />
  );
}

export function FilterBarSection() {
  return (
    <GallerySection
      name="FilterBar"
      title="شريط الفلاتر"
      usage="فوق الجدول: بحث في البداية، ثم فلاتر سريعة (Select أو DateRangePicker)، ثم «فلاتر أخرى» في popover. المفعّلة شارات بزر إزالة ومعها «مسح الكل». على الموبايل: بحث بعرض كامل وزر «فلاتر (3)» يفتح ورقة سفلية. القيم props للـ view."
    >
      <GalleryGroup title="الحالات (حية)">
        <div className="flex flex-col gap-6">
          <HostFrame label="مكتب بلا فلاتر مفعّلة" widthClass={DESKTOP}>
            <LiveFilters />
          </HostFrame>
          <HostFrame label="مكتب بفلاتر مفعّلة" widthClass={DESKTOP}>
            <LiveFilters initial />
          </HostFrame>
          <HostFrame label="مكتب بلا بحث (حين لا يعرّف العقد بحثاً نصياً)" widthClass={DESKTOP}>
            <LiveFilters initial withSearch={false} />
          </HostFrame>
          <HostFrame label="تابلت" widthClass={TABLET}>
            <LiveFilters initial />
          </HostFrame>
          <HostFrame label="موبايل: «فلاتر (2)» تفتح ورقة سفلية" widthClass={MOBILE}>
            <LiveFilters initial />
          </HostFrame>
          <HostFrame label="موبايل بثلاثة فلاتر: الشارات تلتف على أسطر" widthClass={MOBILE}>
            <LiveFilters initial many />
          </HostFrame>
        </div>
      </GalleryGroup>
    </GallerySection>
  );
}

export function KpiSection() {
  return (
    <GallerySection
      name="KpiTile"
      title="خلية الإحصاء"
      usage="التسمية ثم القيمة (text-display الأهم أو text-h1) ثم السياق. اختيارياً: شريط تقدم، ومؤشر تغيّر بسهم وكلمة، وزر معلومات يشرح الحساب، وشارة «مبدئي». قابلة للضغط حين تقود لقائمة."
    >
      <GalleryGroup title="الحالات">
        <HostFrame label="مكتب: شبكة 3 أعمدة" widthClass={DESKTOP}>
          <Grid cols={{ base: 1, tablet: 2, desktop: 3 }} gap={4}>
            <KpiTile label="المبيعات هذا الشهر" value={formatMoney("48250.00")} context={`من هدف ${formatMoney("60000.00")} · 80%`} progress={80} change={{ percent: 12, direction: "up", comparedTo: "عن الشهر الماضي" }} info="مجموع قيم الصرفيات المستلمة من أول الشهر حتى اليوم." />
            <KpiTile label="المرتجعات" value={formatQuantity(1240, "علبة")} change={{ percent: 5, direction: "down", comparedTo: "عن الشهر الماضي" }} />
            <KpiTile label="بانتظار قراري" value="12" context="الأقدم قبل 3 أيام" onClick={noop} />
            <KpiTile label="الزيارات المنجزة" value="342" context="الإغلاق بعد 20 تشرين الثاني" provisional size="md" />
            <KpiTile label="المبيعات هذا الشهر" value="" state="loading" />
            <KpiTile label="المبيعات هذا الشهر" value="" state="empty" />
          </Grid>
        </HostFrame>
        <HostFrame label="موبايل: عمود" widthClass={MOBILE}>
          <Grid cols={{ base: 1, tablet: 2, desktop: 3 }} gap={4}>
            <KpiTile label="المبيعات هذا الشهر" value={formatMoney("48250.00")} context={`من هدف ${formatMoney("60000.00")} · 80%`} progress={80} change={{ percent: 12, direction: "up", comparedTo: "عن الشهر الماضي" }} />
            <KpiTile label="بانتظار قراري" value="12" onClick={noop} />
          </Grid>
        </HostFrame>
      </GalleryGroup>
    </GallerySection>
  );
}

const months = ["حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني"];
const monthly = months.map((label, index) => ({ label, sales: [420, 510, 380, 560, 610, 482][index] * 100, returns: [30, 42, 25, 38, 51, 33][index] * 10 }));

export function ChartSection() {
  const format = (value: number) => formatQuantity(value);
  return (
    <GallerySection
      name="Chart"
      title="الرسم البياني"
      usage="Recharts داخل components/data فقط، بأنواع bar وline وbar-target. لا دوائر ولا مكدّسة. الألوان chart-1… بالترتيب وخط الهدف chart-target متقطع، وسيلة الإيضاح فوق الرسم، ومحور الزمن من اليمين (الأقدم يمين). على الموبايل الارتفاع 200 ومحاور مختصرة."
    >
      <GalleryGroup title="الأنواع (مكتب)">
        <div className="flex flex-col gap-8">
          <HostFrame label="bar: مقارنة" widthClass={DESKTOP}>
            <Chart type="bar" label="المبيعات الشهرية" data={monthly} series={[{ key: "sales", label: "المبيعات (علبة)" }]} formatValue={format} />
          </HostFrame>
          <HostFrame label="line: اتجاه زمني بسلسلتين" widthClass={DESKTOP}>
            <Chart type="line" label="المبيعات والمرتجعات" data={monthly} series={[{ key: "sales", label: "المبيعات" }, { key: "returns", label: "المرتجعات" }]} formatValue={format} />
          </HostFrame>
          <HostFrame label="bar-target: أعمدة مع خط الهدف" widthClass={DESKTOP}>
            <Chart type="bar-target" label="المبيعات مقابل الهدف" data={monthly} series={[{ key: "sales", label: "المبيعات" }]} target={50000} targetLabel="الهدف الشهري" formatValue={format} />
          </HostFrame>
        </div>
      </GalleryGroup>

      <GalleryGroup title="الموبايل والحالات">
        <div className="flex flex-col gap-8">
          <HostFrame label="موبايل: عرض كامل وارتفاع 200" widthClass={MOBILE}>
            <Chart type="bar-target" label="المبيعات مقابل الهدف" data={monthly} series={[{ key: "sales", label: "المبيعات" }]} target={50000} formatValue={format} />
          </HostFrame>
          <HostFrame label="تحميل" widthClass={DESKTOP}>
            <Chart type="bar" label="المبيعات" data={[]} series={[{ key: "sales", label: "المبيعات" }]} formatValue={format} state="loading" />
          </HostFrame>
          <HostFrame label="بلا بيانات" widthClass={DESKTOP}>
            <Chart type="bar" label="المبيعات" data={[]} series={[{ key: "sales", label: "المبيعات" }]} formatValue={format} />
          </HostFrame>
        </div>
      </GalleryGroup>
    </GallerySection>
  );
}
