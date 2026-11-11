import { BatchChip } from "@/components/data/BatchChip";
import { Badge } from "@/components/ui/Badge";
import type { StockReceipt } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatQuantity } from "@/lib/format";

type ReceiptLinesListProps = {
  lines: NonNullable<StockReceipt["lines"]>;
  today: IsoDate;
  /** `expiry_alert_days` من الإعدادات. */
  expiryAlertDays?: number;
};

/** مجموع كميات أسطر الإدخال (أعداد صحيحة، بلا مبالغ). */
export function receiptTotal(lines: NonNullable<StockReceipt["lines"]>): number {
  return lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0);
}

/**
 * أسطر الإدخال كما رجعت من الخادم: الصنف والدفعة والكمية، وشارة «دفعة جديدة» أو «أُضيفت لدفعة موجودة» من `batch_created`، ثم المجموع.
 * يُستعمل في ملخص نتيجة الإدخال (W04) وفي درج تفاصيل السجل (W05).
 */
export function ReceiptLinesList({ lines, today, expiryAlertDays = 60 }: ReceiptLinesListProps) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-border">
        {lines.map((line, index) => (
          <li key={`${line.batch?.id}-${index}`} className="py-3 first:pt-0 last:pb-0">
            <CaptureRow className="flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex min-w-48 flex-1 flex-col">
                <span className="text-body text-fg">{line.item?.name}</span>
                <span dir="ltr" className="block text-end text-caption text-fg-muted">
                  {line.item?.sku}
                </span>
              </div>
              {line.batch ? <BatchChip batch={line.batch} today={today} expiryAlertDays={expiryAlertDays} /> : null}
              <span dir="ltr" className="shrink-0 text-body tabular-nums text-fg">
                {formatQuantity(line.quantity ?? 0, "علبة")}
              </span>
              <Badge color={line.batch_created ? "success" : "info"}>{line.batch_created ? "دفعة جديدة" : "أُضيفت لدفعة موجودة"}</Badge>
            </CaptureRow>
          </li>
        ))}
      </ul>
      <p className="border-t border-border pt-4 text-body text-fg-muted">{`المجموع: ${formatQuantity(receiptTotal(lines), "علبة")}`}</p>
    </div>
  );
}
