import type { ReactNode } from "react";
import type { ScreenState } from "./ScreenStates";

// الحالات العامة لكل شاشة فيها داتا من الخادم (SCREENS.md 0.2): التحميل والفراغ والخطأ ولا صلاحية.
// تُضاف للشاشة بسطر واحد، وتظهر في نسخة المراجعة تحت «حالات النظام». لا يُنقل للإنتاج.

/** مفاتيح الحالات العامة. تُجمَّع في غلاف المراجعة تحت «حالات النظام». */
export const SYSTEM_STATE_KEYS = ["loading", "empty", "error", "forbidden"] as const;

export const isSystemState = (key: string) => (SYSTEM_STATE_KEYS as readonly string[]).includes(key);

type SystemStateNodes = {
  loading: ReactNode;
  /** قائمة أو لوحة يمكن أن تفرغ. بدونه لا تُضاف حالة الفراغ. */
  empty?: ReactNode;
  error: ReactNode;
  /** بدونه لا تُضاف حالة «لا صلاحية». */
  forbidden?: ReactNode;
};

/** حالات النظام الجاهزة بتسمياتها وشرحها العربي، بالترتيب المعتمد. */
export function systemStates({ loading, empty, error, forbidden }: SystemStateNodes): ScreenState[] {
  const states: ScreenState[] = [
    { key: "loading", label: "جارٍ التحميل", when: "أثناء جلب البيانات من الخادم: تظهر هياكل رمادية بشكل المحتوى.", node: loading },
  ];
  if (empty) states.push({ key: "empty", label: "لا توجد بيانات", when: "لا يوجد ما يُعرض بعد. تظهر رسالة تشرح السبب وما يمكن فعله.", node: empty });
  states.push({
    key: "error",
    label: "تعذّر التحميل",
    when: "فشل الطلب أو انقطع الاتصال بالخادم. يظهر السبب وزر «إعادة المحاولة».",
    node: error,
  });
  if (forbidden) states.push({ key: "forbidden", label: "لا صلاحية", when: "الشاشة خارج صلاحيات المستخدم أو نطاقه.", node: forbidden });
  return states;
}
