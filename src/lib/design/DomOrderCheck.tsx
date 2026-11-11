"use client";

import { useEffect, useRef, type ReactNode } from "react";

// فحص آلي لـ /capture-test: في وضع الالتقاط يجب أن يكون ترتيب أبناء كل صف flex مطابقاً لترتيبهم البصري من اليسار،
// لأن أداة الالتقاط تقرأ الـ DOM هكذا. في الوضع العادي (RTL) يُعرض العدد للمقارنة فقط.

function countRows(root: HTMLElement) {
  let rows = 0;
  let reversed = 0;

  for (const element of root.querySelectorAll<HTMLElement>("*")) {
    const style = getComputedStyle(element);
    if (!style.display.endsWith("flex") || !style.flexDirection.startsWith("row")) continue;

    const lefts = [...element.children]
      .filter((child) => getComputedStyle(child).position !== "absolute")
      .map((child) => child.getBoundingClientRect())
      .filter((rect) => rect.width > 0)
      .map((rect) => rect.left);
    if (lefts.length < 2) continue;

    rows += 1;
    if (!lefts.every((left, index) => index === 0 || left >= lefts[index - 1] - 0.5)) reversed += 1;
  }

  return { rows, reversed };
}

export function DomOrderCheck({ expectOrdered, children }: { expectOrdered: boolean; children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    const report = reportRef.current;
    if (!content || !report) return;

    const { rows, reversed } = countRows(content);
    const ok = reversed === 0;
    report.dataset.ok = expectOrdered ? String(ok) : "info";
    report.textContent = expectOrdered
      ? `${ok ? "✓" : "✗"} ترتيب الـ DOM ${ok ? "مطابق" : "مخالف"} للترتيب البصري من اليسار · ${rows} صفاً فُحص · ${reversed} معكوس`
      : `الوضع العادي (RTL): ${reversed} من ${rows} صفاً بترتيب DOM معكوس بصرياً، وهذا المتوقع`;
  }, [expectOrdered]);

  return (
    <div className="flex flex-col gap-3">
      <div ref={contentRef}>{children}</div>
      <p
        ref={reportRef}
        className="text-label text-fg-muted data-[ok=false]:text-danger data-[ok=true]:text-success"
      />
    </div>
  );
}
