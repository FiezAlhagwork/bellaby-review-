import { MONTHS } from "./format";

// حساب التقويم على نصوص ISO (`2026-11-09` و`2026-11`) كما في العقد (Month وformat: date). بلا Date محلي ولا مناطق زمنية:
// كل العمليات بتوقيت UTC على تاريخ مجرّد، فلا ينزلق يوم بين جهاز وآخر. العرض فقط من هذا الملف و format.ts.

/** `2026-11-09`، تاريخ بتوقيت دمشق. */
export type IsoDate = string;
/** `2026-11`، شهر بتوقيت دمشق (Month في العقد). */
export type IsoMonth = string;

const TIME_ZONE = "Asia/Damascus";

const pad = (n: number) => String(n).padStart(2, "0");

export function parseDate(date: IsoDate) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

export function parseMonth(month: IsoMonth) {
  const [year, m] = month.split("-").map(Number);
  return { year, month: m };
}

export const toIsoDate = (year: number, month: number, day: number): IsoDate => `${year}-${pad(month)}-${pad(day)}`;
export const toIsoMonth = (year: number, month: number): IsoMonth => `${year}-${pad(month)}`;
export const monthOf = (date: IsoDate): IsoMonth => date.slice(0, 7);

function fromUtc(ms: number): IsoDate {
  const d = new Date(ms);
  return toIsoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

const toUtc = (date: IsoDate) => {
  const { year, month, day } = parseDate(date);
  return Date.UTC(year, month - 1, day);
};

export const addDays = (date: IsoDate, days: number): IsoDate => fromUtc(toUtc(date) + days * 86_400_000);

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** يضيف أشهراً ويقصّ اليوم إلى آخر الشهر الهدف (31 آذار + شهر = 30 نيسان). */
export function addMonths(date: IsoDate, months: number): IsoDate {
  const { year, month, day } = parseDate(date);
  const index = year * 12 + (month - 1) + months;
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return toIsoDate(y, m, Math.min(day, daysInMonth(y, m)));
}

export function addMonthsToMonth(month: IsoMonth, months: number): IsoMonth {
  return monthOf(addMonths(`${month}-01`, months));
}

/** ترتيب اليوم في الأسبوع الذي يبدأ بالسبت: 0 سبت … 6 جمعة (DESIGN.md 9.6). */
export function weekdayIndex(date: IsoDate): number {
  return (new Date(toUtc(date)).getUTCDay() + 1) % 7;
}

export const isFriday = (date: IsoDate) => weekdayIndex(date) === 6;

export const startOfWeek = (date: IsoDate): IsoDate => addDays(date, -weekdayIndex(date));

export const compareDates = (a: IsoDate, b: IsoDate) => (a < b ? -1 : a > b ? 1 : 0);

/** ستة أسابيع ثابتة لشهر (أيام الشهر وحدها، والباقي null) فلا يتغير ارتفاع التقويم بين الأشهر. */
export function monthWeeks(month: IsoMonth): (IsoDate | null)[][] {
  const { year, month: m } = parseMonth(month);
  const lead = weekdayIndex(`${month}-01`);
  const total = daysInMonth(year, m);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const dayOfMonth = week * 7 + day - lead + 1;
      return dayOfMonth >= 1 && dayOfMonth <= total ? toIsoDate(year, m, dayOfMonth) : null;
    }),
  );
}

/** تاريخ اليوم بتوقيت دمشق. لا يُستدعى أثناء العرض: يُؤخذ مرة في useState. */
export function damascusToday(): IsoDate {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** اختصارات الأيام من السبت (الأسبوع يبدأ بالسبت). */
export const WEEKDAY_SHORT = ["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"] as const;
export const WEEKDAY_LONG = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"] as const;

/** `تشرين الثاني 2026` */
export function monthLabel(month: IsoMonth): string {
  const { year, month: m } = parseMonth(month);
  return `${MONTHS[m - 1]} ${year}`;
}

export function monthName(month: number): string {
  return MONTHS[month - 1];
}

/** `9 تشرين الثاني 2026` من نص ISO مباشرة. */
export function dayLabel(date: IsoDate): string {
  const { year, month, day } = parseDate(date);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** `الاثنين 9 تشرين الثاني 2026` لقارئ الشاشة. */
export function fullDayLabel(date: IsoDate): string {
  return `${WEEKDAY_LONG[weekdayIndex(date)]} ${dayLabel(date)}`;
}

/** `09/11/2026` */
export function shortDayLabel(date: IsoDate): string {
  const { year, month, day } = parseDate(date);
  return `${pad(day)}/${pad(month)}/${year}`;
}

/** `15 تشرين الثاني` بلا سنة (جمل التفويض). */
export function dayMonthLabel(date: IsoDate): string {
  const { month, day } = parseDate(date);
  return `${day} ${MONTHS[month - 1]}`;
}

/** عدد الأيام من `from` إلى `to` (سالب إن كان `to` قبل `from`). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}
