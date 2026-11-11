import Link from "next/link";
import type { ReactNode } from "react";
import type { BatchRef, Money } from "@/lib/api/types";
import { formatDate, formatDateTime, formatMoney, formatQuantity } from "@/lib/format";
import { BatchChip } from "./BatchChip";
import { StatusBadge } from "./StatusBadge";
import type { StatusEntity, StatusOf } from "./status-map";

// الخلايا الجاهزة (DESIGN.md 10.6). تُرجع المحتوى وحده؛ المحاذاة (align) والأرقام المتساوية العرض من عمود DataTable.
// القيمة الفارغة «—» لا خانة فارغة (10.14).

const EMPTY = "—";

/** نص عادي يقتطع بنقاط إن ضاق العمود. */
export function TextCell({ value }: { value: string | null | undefined }) {
  return value ? <span className="block truncate">{value}</span> : <span className="text-fg-muted">{EMPTY}</span>;
}

/** عدد عادي لاتيني (`NumberCell`): للأرقام بلا وحدة. مع `align: "end"`. */
export function NumberCell({ value }: { value: number | null | undefined }) {
  return value === null || value === undefined ? <span className="text-fg-muted">{EMPTY}</span> : <span dir="ltr">{value}</span>;
}

/** مبلغ بالدولار من نص العقد (`"1250.50"` ← `$1,250.50`): عرض فقط، بلا حساب. */
export function MoneyCell({ value }: { value: Money | null | undefined }) {
  return value ? <span dir="ltr">{formatMoney(value)}</span> : <span className="text-fg-muted">{EMPTY}</span>;
}

/** كمية صحيحة بفاصل آلاف ووحدة اختيارية (`1,200 علبة`). الكمية السالبة بلون danger. */
export function QuantityCell({ value, unit }: { value: number | null | undefined; unit?: string }) {
  if (value === null || value === undefined) return <span className="text-fg-muted">{EMPTY}</span>;
  return (
    <span dir="ltr" className={value < 0 ? "text-danger" : undefined}>
      {formatQuantity(value, unit)}
    </span>
  );
}

/** تاريخ `9 تشرين الثاني 2026` بتوقيت دمشق. يقبل نص UTC من العقد. */
export function DateCell({ value }: { value: string | null | undefined }) {
  return value ? <span className="whitespace-nowrap">{formatDate(value)}</span> : <span className="text-fg-muted">{EMPTY}</span>;
}

/** تاريخ ووقت `9 تشرين الثاني 2026 · 14:05` بتوقيت دمشق. */
export function DateTimeCell({ value }: { value: string | null | undefined }) {
  return value ? <span className="whitespace-nowrap">{formatDateTime(value)}</span> : <span className="text-fg-muted">{EMPTY}</span>;
}

type StatusCellProps<Entity extends StatusEntity> = { entity: Entity; status: StatusOf<Entity> };

/** شارة الحالة من status-map.ts. */
export function StatusCell<Entity extends StatusEntity>({ entity, status }: StatusCellProps<Entity>) {
  return <StatusBadge entity={entity} status={status} />;
}

/** نص رابط (رقم الصرف، اسم الوكيل). `href` رابط عادي؛ الصف نفسه قد يكون قابلاً للفتح أيضاً. */
export function LinkCell({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} onClick={(event) => event.stopPropagation()} className="block truncate text-link hover:underline">
      {children}
    </Link>
  );
}

/** الدفعة: BatchChip (الرقم والانتهاء والحالة). */
export function BatchCell({ batch }: { batch: BatchRef | null | undefined }) {
  return batch ? <BatchChip batch={batch} /> : <span className="text-fg-muted">{EMPTY}</span>;
}
