import type { Money, Phone } from "@/lib/api/types";

// كل التنسيق للعرض فقط (DESIGN.md 4.4): الأرقام لاتينية، والأوقات تصل UTC وتُعرض بتوقيت دمشق.

const TIME_ZONE = "Asia/Damascus";

/** الأشهر الشامية. */
export const MONTHS = [
  "كانون الثاني",
  "شباط",
  "آذار",
  "نيسان",
  "أيار",
  "حزيران",
  "تموز",
  "آب",
  "أيلول",
  "تشرين الأول",
  "تشرين الثاني",
  "كانون الأول",
] as const;

// en-GB لتجنّب أي أرقام غير لاتينية، وh23 لتجنّب «24:00».
const damascusParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

type DateInput = string | Date;

function toParts(value: DateInput) {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = Object.fromEntries(damascusParts.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: parts.year,
    month: Number(parts.month),
    day: Number(parts.day),
    hour: parts.hour.padStart(2, "0"),
    minute: parts.minute.padStart(2, "0"),
  };
}

/** `9 تشرين الثاني 2026` */
export function formatDate(value: DateInput): string {
  const { day, month, year } = toParts(value);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** `09/11/2026` (الجداول المختصرة) */
export function formatDateShort(value: DateInput): string {
  const { day, month, year } = toParts(value);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

/** `14:05` (24 ساعة) */
export function formatTime(value: DateInput): string {
  const { hour, minute } = toParts(value);
  return `${hour}:${minute}`;
}

/** `9 تشرين الثاني 2026 · 14:05` */
export function formatDateTime(value: DateInput): string {
  return `${formatDate(value)} · ${formatTime(value)}`;
}

const MONEY_PATTERN = /^(-?)(\d+)(?:\.(\d+))?$/;

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * المبلغ نص عشري من العقد (`"1250.50"`) ← `$1,250.50`.
 * يعمل على النص وحده: لا parseFloat ولا تقريب. الخانات الزائدة عن اثنتين تبقى كما وصلت.
 */
export function formatMoney(amount: Money): string {
  const match = MONEY_PATTERN.exec(amount);
  if (!match) throw new RangeError(`مبلغ غير صالح: "${amount}"`);
  const [, sign, whole, fraction = ""] = match;
  return `${sign}$${groupThousands(whole)}.${fraction.padEnd(2, "0")}`;
}

const PHONE_PATTERN = /^\+963(\d{3})(\d{3})(\d{3})$/;

/**
 * الهاتف E.164 (`+963944123456`) ← `+963 944 123 456` (DESIGN.md 8.6). نص فقط.
 * يُعرض دائماً في عنصر `dir="ltr"`. ما لا يطابق النمط السوري يُرجَع كما وصل ولا يكسر الصفحة.
 */
export function formatPhone(phone: Phone): string {
  const match = PHONE_PATTERN.exec(phone);
  return match ? `+963 ${match[1]} ${match[2]} ${match[3]}` : phone;
}

/** عدد صحيح مع وحدة اختيارية ← `1,200 علبة`. */
export function formatQuantity(quantity: number, unit?: string): string {
  if (!Number.isInteger(quantity)) throw new RangeError(`الكمية يجب أن تكون عدداً صحيحاً: ${quantity}`);
  const sign = quantity < 0 ? "-" : "";
  const number = `${sign}${groupThousands(String(Math.abs(quantity)))}`;
  return unit ? `${number} ${unit}` : number;
}

/** `87%` وفي المؤشرات `87.5%` (`fractionDigits = 1`). */
export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/**
 * يعزل رقماً أو نصاً لاتينياً داخل جملة عربية: «باقي ⁦3⁩ محاولات».
 * (LRI … PDI)
 */
export function isolate(value: string | number): string {
  return `⁦${value}⁩`;
}

/** حجم ملف ← `350 كيلوبايت` و`2.4 ميغابايت`. أرقام لاتينية، ومنزلة عشرية واحدة من الميغابايت. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} كيلوبايت`;
  const megabytes = Math.round((bytes / (1024 * 1024)) * 10) / 10;
  return `${megabytes} ميغابايت`;
}

// صيغ العدد في العربية: 1 مفرد، 2 مثنى، 3–10 جمع، 11 وأكثر مفرد مع العدد. [مفرد، مثنى، جمع].
function countPhrase(count: number, forms: readonly [string, string, string]): string {
  if (count === 1) return forms[0];
  if (count === 2) return forms[1];
  return count <= 10 ? `${isolate(count)} ${forms[2]}` : `${isolate(count)} ${forms[0]}`;
}

/**
 * الوقت النسبي للإشعارات: «الآن» · «قبل 5 دقائق» · «قبل ساعتين» · «أمس» · وبعد يومين تاريخ قصير.
 * `now` يُمرَّر فتبقى الدالة نقية.
 */
export function formatRelative(value: DateInput, now: DateInput): string {
  const then = (typeof value === "string" ? new Date(value) : value).getTime();
  const current = (typeof now === "string" ? new Date(now) : now).getTime();
  const minutes = Math.floor((current - then) / 60_000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${countPhrase(minutes, ["دقيقة", "دقيقتين", "دقائق"])}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${countPhrase(hours, ["ساعة", "ساعتين", "ساعات"])}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "أمس";
  if (days < 3) return `قبل ${countPhrase(days, ["يوم", "يومين", "أيام"])}`;
  return formatDateShort(value);
}
