import { readFileSync } from "node:fs";
import path from "node:path";

// يقرأ قيم @theme من src/styles/globals.css لصفحة /foundations، فتعرض ما في الملف فعلاً لا نسخة عنه.
// للخادم فقط (يستعمل fs)، ولا يُنقل للإنتاج.

const GLOBALS_CSS = path.join(process.cwd(), "src/styles/globals.css");

export type ThemeTokens = ReadonlyMap<string, string>;

/** `--color-neutral-0: #FFFFFF;` ← "color-neutral-0" → "#FFFFFF". */
export function readThemeTokens(): ThemeTokens {
  const css = readFileSync(GLOBALS_CSS, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const start = css.indexOf("@theme");
  if (start === -1) throw new Error("لا يوجد @theme في globals.css");
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("\n}", start));

  const tokens = new Map<string, string>();
  for (const match of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

/** يتبع var(--x) حتى القيمة الحرفية. غياب التوكن يرجع «—» ليظهر في الصفحة. */
export function resolveToken(tokens: ThemeTokens, name: string): string {
  let value = tokens.get(name);
  for (let depth = 0; value !== undefined && depth < 5; depth += 1) {
    const reference = /^var\(--([\w-]+)\)$/.exec(value);
    if (!reference) return value;
    value = tokens.get(reference[1]);
  }
  return value ?? "—";
}

/** `2rem` ← `32px` (الأساس 16). غير rem تبقى كما هي. */
export function remToPx(value: string): string {
  const match = /^([\d.]+)rem$/.exec(value);
  return match ? `${Number(match[1]) * 16}px` : value;
}
