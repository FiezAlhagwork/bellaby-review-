"use client";

import {
  Children,
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

// وضع الالتقاط (FIGMA.md 1.2): يُفعَّل بـ ?capture=1.
// أداة الالتقاط إلى Figma تتجاهل RTL: ترتّب العناصر بترتيب الـ DOM من اليسار، وتقرأ start يساراً.
// لذلك يقلب هذا الوضع الصفحة إلى LTR، ويعكس ترتيب كل صف وتوزيعه يدوياً، فيبقى الشكل في المتصفح
// كما هو ويصير ترتيب الـ DOM مطابقاً للترتيب البصري من اليمين. الوضع العادي لا يتغيّر.
// المحاذاة (text-start / text-end) في capture.css. الفكرة من docs/reference/CaptureMode.tsx.
//
// قواعد لكل مكوّن يُبنى (اكتُشفت في /capture-test):
//  - كل صف أفقي بـ CaptureRow. و justify-between مع عنصر واحد يلتصق باليسار في LTR: استعمل flex-1 للعنصر الأول.
//  - كتلة بعرض ثابت داخل كتلة أعرض تلتصق بيسارها في LTR: تُوضع في CaptureRow (كما تفعل DashboardShell).
//  - الأصناف المنطقية (border-s/e، ms/me، ps/pe، start/end) تنقلب في LTR: useCaptureClass. وtext-start/text-end في capture.css.
//  - الأيقونة الاتجاهية: rtl:-scale-x-100 لا يعمل في LTR، فتحتاج useCaptureClass.
//  - نص بصندوق tight العرض (field-sizing-content) يلتف في Figma إن اختلف الخط عن المقيس: وسّع صندوقه بـ pe-6 مع -me-6 (يبقى الشكل كما هو). والنص اللاتيني بعلامة (+ $) في أول فقرة RTL يحتاج LRM قبله.
//  - grid يوزّع أول خلية يساراً في LTR: يحتاج Grid معالجة خاصة (تُعكس الخلايا في كل صف).
//
// الواجهة التي تستوردها المكوّنات عمداً صغيرة: useCaptureMode · useCaptureClass · CaptureRow.
// في الإنتاج يُكتب ملف بالأسماء نفسها لا يفعل شيئاً (CaptureRow = div عادي بـ flex).

const CaptureContext = createContext(false);

const subscribe = () => () => {};
const readFlag = () => new URLSearchParams(window.location.search).get("capture") === "1";
// على الخادم وأثناء الـ hydration: الوضع العادي، ثم يُقرأ الرابط بعد التحميل.
const readServerFlag = () => false;

/** في جذر التطبيق: يقرأ ?capture=1 ويقلب <html> إلى LTR. */
export function CaptureModeProvider({ children }: { children: ReactNode }) {
  const capture = useSyncExternalStore(subscribe, readFlag, readServerFlag);

  useEffect(() => {
    if (!capture) return;
    const root = document.documentElement;
    root.dir = "ltr";
    root.dataset.capture = "true";
    return () => {
      root.dir = "rtl";
      delete root.dataset.capture;
    };
  }, [capture]);

  return <CaptureContext.Provider value={capture}>{children}</CaptureContext.Provider>;
}

/** لصفحة /capture-test فقط: يفرض أحد الوضعين على جزء من الصفحة لعرض الوضعين جنباً إلى جنب. */
export function CaptureScope({
  capture,
  className,
  children,
}: {
  capture: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <CaptureContext.Provider value={capture}>
      <div dir={capture ? "ltr" : "rtl"} data-capture={capture ? "true" : undefined} className={className}>
        {children}
      </div>
    </CaptureContext.Provider>
  );
}

export const useCaptureMode = () => useContext(CaptureContext);

/**
 * يختار class للوضع العادي وآخر لوضع الالتقاط، للمواضع المنطقية (start/end) التي تنقلب في LTR.
 * مثال: useCaptureClass("border-s-3", "border-e-3").
 */
export function useCaptureClass(normal: string, capture: string) {
  return useCaptureMode() ? capture : normal;
}

// التوزيع على المحور الرئيسي يُقلب مع عكس العناصر: البداية (يمين) تصير end في LTR.
function flipJustify(className: string) {
  if (/\bjustify-(between|center|around|evenly)\b/.test(className)) return className;
  if (/\bjustify-end\b/.test(className)) return className.replace(/\bjustify-end\b/, "justify-start");
  return `${className.replace(/\bjustify-start\b/, "")} justify-end`;
}

type CaptureRowProps<T extends ElementType> = {
  /** العنصر المرسوم. الافتراضي div. مثال: as="button" لزر هو نفسه الصف. */
  as?: T;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/**
 * صف أفقي (flex-row). في الوضع العادي: RTL يضع أول عنصر يميناً.
 * في وضع الالتقاط: تُعكس العناصر ويُقلب التوزيع، فيبقى الشكل نفسه ويصير ترتيب الـ DOM كما يُرى من اليسار.
 * أول عنصر في الكود هو الأيمن بصرياً في الوضعين.
 */
export function CaptureRow<T extends ElementType = "div">({ as, className, children, ...rest }: CaptureRowProps<T>) {
  const capture = useCaptureMode();
  const Component: ElementType = as ?? "div";
  const merged = cn("flex", className);
  // toArray يعطي كل عنصر مفتاحاً، في الوضعين.
  const nodes = Children.toArray(children);
  return (
    <Component {...rest} className={capture ? flipJustify(merged) : merged}>
      {capture ? [...nodes].reverse() : nodes}
    </Component>
  );
}
