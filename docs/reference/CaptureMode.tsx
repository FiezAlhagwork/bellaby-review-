import { Children, createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Platform, View, type ViewProps } from "react-native";

// وضع الالتقاط (FIGMA.md القسم 1.2): يُفعَّل بـ ?capture=1 على الويب فقط.
// أداة الالتقاط إلى Figma تتجاهل RTL: ترتّب العناصر بترتيب الـ DOM من اليسار، وتقرأ "start" يساراً.
// لذلك يقلب هذا الوضع الصفحة كلها إلى LTR، ثم يعكس كل صف ومحاذاته يدوياً، فيبقى الشكل في المتصفح كما هو
// وتصل إلى Figma قيم فيزيائية صريحة (يمين/يسار). الوضع العادي لا يتغيّر.

const CaptureContext = createContext(false);

/** يُقرأ بعد التحميل حتى لا يختلف عن الصفحة المولّدة على الخادم. */
export function CaptureModeProvider({ children }: { children: ReactNode }) {
  const [capture, setCapture] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const on = new URLSearchParams(window.location.search).get("capture") === "1";
    if (on) document.documentElement.dir = "ltr";
    setCapture(on);
  }, []);

  return <CaptureContext.Provider value={capture}>{children}</CaptureContext.Provider>;
}

export const useCaptureMode = () => useContext(CaptureContext);

/**
 * يختار class المحاذاة على المحور العرضي: في RTL "start" يمين، وفي وضع الالتقاط (LTR) اليمين هو "end".
 * مثال: useStartClass("self") ← "self-start" عادةً و"self-end" عند الالتقاط.
 */
export function useStartClass(kind: "self" | "items") {
  const capture = useCaptureMode();
  if (kind === "self") return capture ? "self-end" : "self-start";
  return capture ? "items-end" : "items-start";
}

/** عمود عناصره بعرضها الطبيعي من البداية (يمين)، في الوضعين. */
export function StartColumn({ className, children }: { className?: string; children: ReactNode }) {
  const items = useStartClass("items");
  return <View className={`${items} ${className ?? ""}`}>{children}</View>;
}

/**
 * للصفوف التي لا تكون View عادية (Pressable): يعيد العناصر والـ class جاهزة لوضع الالتقاط.
 * مثال: const row = useCaptureRowParts(); <Pressable className={row.className("flex-row ...")}>{row.children([a, b])}</Pressable>
 */
export function useCaptureRowParts() {
  const capture = useCaptureMode();
  return {
    className: (className: string) => (capture ? flipJustify(className) : className),
    // toArray يعطي كل عنصر مفتاحاً، في الوضعين.
    children: (nodes: ReactNode[]) => (capture ? Children.toArray(nodes).reverse() : Children.toArray(nodes)),
  };
}

/** يختار بين class للوضع العادي وآخر لوضع الالتقاط، للمواضع المنطقية (start/end) التي تنقلب في LTR. */
export function useCaptureClass(normal: string, capture: string) {
  return useCaptureMode() ? capture : normal;
}

// التوزيع على المحور الرئيسي يُقلب مع عكس العناصر: البداية (يمين) تصير "end" في LTR.
function flipJustify(className: string) {
  if (/\bjustify-(between|center|around|evenly)\b/.test(className)) return className;
  if (/\bjustify-end\b/.test(className)) return className.replace(/\bjustify-end\b/, "justify-start");
  return `${className.replace(/\bjustify-start\b/, "")} justify-end`;
}

/**
 * صف أفقي: في الوضع العادي flex-row عادي (RTL يضع أول عنصر يميناً).
 * في وضع الالتقاط تُعكس العناصر ويُقلب التوزيع، فيبقى الشكل نفسه ويصير ترتيب الـ DOM من اليسار كما يُرى.
 */
export function CaptureRow({ className, children, ...rest }: ViewProps & { className: string; children: ReactNode }) {
  const capture = useCaptureMode();
  if (!capture) {
    return (
      <View {...rest} className={className}>
        {children}
      </View>
    );
  }
  return (
    <View {...rest} className={flipJustify(className)}>
      {Children.toArray(children).reverse()}
    </View>
  );
}
