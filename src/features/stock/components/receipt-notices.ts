import { batchChipState } from "@/components/data/BatchChip";
import type { BatchEntryLine, BatchEntryNotice } from "@/components/data/BatchEntryEditor";
import { errorMessage } from "@/lib/api/error-messages";
import type { BatchRef } from "@/lib/api/types";
import { dayLabel, type IsoDate } from "@/lib/calendar";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

// قواعد إدخال البضاعة كما في العقد (`POST /stock-receipts`) و SCREENS.md W04، مطبّقة فوراً قبل الإرسال:
//   - تاريخ الانتهاء مضى: لا يُدخل (`batch_expired`).
//   - ضمن مهلة التنبيه (60 يوماً من الإعدادات): تحذير يحتاج تأكيداً (`near_expiry_confirmation_required`).
//   - الرقم موجود لهذا الصنف بالتاريخ نفسه: تُضاف الكمية للدفعة.
//   - الرقم مسجّل بتاريخ مختلف: لا يُدخل (`batch_expiry_mismatch`).
// الخادم يتحقق من كلها عند الإدخال، وهذا لإظهارها قبل الضغط. دالة نقية: اليوم والدفعات المعروفة تُمرَّر.

export type ReceiptLineAnalysis = {
  /** ملاحظة واحدة لكل سطر مملوء ولها ما يُقال. */
  notices: Record<string, BatchEntryNotice>;
  /** كل الحقول الأربعة مملوءة وكمية 1 فأكثر. */
  complete: boolean;
  /** سطر منتهٍ أو بتعارض تاريخ: يمنع الإدخال. */
  blocked: boolean;
  /** عدد الأسطر القريبة الانتهاء: يحتاج تأكيداً واحداً. */
  nearExpiryCount: number;
};

/** دفعات كل صنف المعروفة بمفتاح `String(itemId)`: من `GET /batches?item_id=`. */
export type KnownBatches = Readonly<Record<string, Loadable<readonly BatchRef[]>>>;

export function isLineComplete(line: BatchEntryLine): boolean {
  return line.itemId !== null && line.batchNo.trim() !== "" && line.expiryDate !== null && line.quantity !== null && line.quantity >= 1;
}

export function analyzeReceiptLines(lines: readonly BatchEntryLine[], known: KnownBatches, today: IsoDate, expiryAlertDays: number): ReceiptLineAnalysis {
  const notices: Record<string, BatchEntryNotice> = {};
  let blocked = false;
  let nearExpiryCount = 0;

  for (const line of lines) {
    const batchNo = line.batchNo.trim();
    if (line.itemId === null || batchNo === "" || line.expiryDate === null) continue;

    const knownForItem = known[line.itemId];
    const match = knownForItem?.status === "ready" ? knownForItem.data.find((batch) => batch.batch_no === batchNo) : undefined;
    const { state, daysToExpiry } = batchChipState({ expiry_date: line.expiryDate, status: "ACTIVE" }, today, expiryAlertDays);

    if (state === "expired") {
      blocked = true;
      notices[line.id] = { kind: "danger", text: "لا يُدخل منتهٍ" };
    } else if (match && match.expiry_date !== line.expiryDate) {
      blocked = true;
      notices[line.id] = { kind: "danger", text: `${errorMessage("batch_expiry_mismatch")} المسجّل: ${match.expiry_date ? isolate(dayLabel(match.expiry_date)) : "—"}.` };
    } else {
      const exists = match ? "الدفعة موجودة بالتاريخ نفسه: تُضاف الكمية للدفعة" : null;
      if (state === "near-expiry") {
        nearExpiryCount += 1;
        const warning = `ينتهي بعد ${isolate(daysToExpiry ?? 0)} يوماً: يحتاج تأكيداً`;
        notices[line.id] = { kind: "warning", text: exists ? `${warning}. ${exists}` : warning };
      } else if (exists) {
        notices[line.id] = { kind: "info", text: exists };
      } else if (knownForItem?.status === "error") {
        notices[line.id] = { kind: "info", text: "تعذّر التحقق من الدفعات المسجّلة، وسيتحقق الخادم عند الإدخال." };
      }
    }
  }

  return { notices, complete: lines.length > 0 && lines.every(isLineComplete), blocked, nearExpiryCount };
}
