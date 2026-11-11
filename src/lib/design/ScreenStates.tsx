import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ReviewShell } from "./ReviewShell";
import type { ReviewSize } from "./ReviewStage";
import { isCaptureRequest, isReviewEnv, isReviewRequest } from "./review";
import { findCatalogScreen } from "./screen-catalog";
import { ScreenFrame, type ScreenFrameKind } from "./ScreenFrame";

// يغلّف كل صفحة رسم (CLAUDE.md «صفحات الرسم والالتقاط»):
//   ?state=<key>     الحالة وحدها بحجم الإطار (مفتاح قصير W03 ← suspended-batch، أو الكامل W03-suspended-batch)
//   ?state=all       كل الحالات تحت بعضها مع عناوينها، للمراجعة في المتصفح فقط
//   (بلا state)      الحالة الأولى، وهي الافتراضية
//   &frame=mobile    إطار 390 بدل 1440
//   وضع المراجعة (REVIEW_MODE=1 أو ?review=1): الشاشة داخل غلاف الزبون (ReviewShell) بعرض متجاوب، والمقاس من ?size=auto|tablet|mobile،
//   و?state=all يُحجب. لا غلاف مع ?capture=1.
// الجذر الذي يُلتقط يحمل id="screen". وضع الالتقاط ?capture=1 في CaptureMode.

export type ScreenSearchParams = Promise<Record<string, string | string[] | undefined>>;

export type ScreenState = {
  /** kebab-case بلا بادئة المعرّف. الأولى في القائمة هي الافتراضية. */
  key: string;
  /** يظهر في عنوان الإطار: «الافتراضي»، «دفعة موقوفة». */
  label: string;
  /** متى تظهر الحالة. يُعرض في وضع المراجعة وهو سطر الشرح تحت الإطار في Figma. */
  when?: string;
  /** نسخة المراجعة تخفيها من أزرار الزبون (مبدّل المقاس يغطيها)، وتبقى بالرابط والالتقاط. مثل tablet وmobile-drawer. */
  reviewHidden?: boolean;
  node: ReactNode;
};

export type ScreenDefinition = {
  /** حرف + رقمان، مثل W03. */
  id: string;
  name: string;
  states: readonly [ScreenState, ...ScreenState[]];
};

type ResolvedView =
  | { kind: "all"; frame: ScreenFrameKind }
  | { kind: "one"; state: ScreenState; frame: ScreenFrameKind }
  | { kind: "unknown"; frame: ScreenFrameKind };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function resolveView(screen: ScreenDefinition, searchParams: ScreenSearchParams): Promise<ResolvedView> {
  const params = await searchParams;
  const frame: ScreenFrameKind = first(params.frame) === "mobile" ? "mobile" : "desktop";
  const requested = first(params.state);

  if (requested === "all") return { kind: "all", frame };
  if (!requested) return { kind: "one", state: screen.states[0], frame };

  const key = requested.startsWith(`${screen.id}-`) ? requested.slice(screen.id.length + 1) : requested;
  const state = screen.states.find((s) => s.key === key);
  return state ? { kind: "one", state, frame } : { kind: "unknown", frame };
}

function reviewSize(params: Record<string, string | string[] | undefined>, frame: ScreenFrameKind): ReviewSize {
  const requested = first(params.size);
  if (requested === "tablet" || requested === "mobile") return requested;
  return frame === "mobile" ? "mobile" : "auto";
}

/** اسم الإطار في Figma: `W03 · الصرف · دفعة موقوفة` (و`· موبايل` للإطار الضيق). */
function frameName(screen: ScreenDefinition, label: string, frame: ScreenFrameKind) {
  const name = `${screen.id} · ${screen.name} · ${label}`;
  return frame === "mobile" ? `${name} · موبايل` : name;
}

/** عنوان الصفحة = اسم الإطار في Figma. يُصدَّر من الصفحة بـ generateMetadata. */
export async function screenMetadata(screen: ScreenDefinition, searchParams: ScreenSearchParams): Promise<Metadata> {
  const view = await resolveView(screen, searchParams);
  if (view.kind === "unknown") return { title: `${screen.id} · ${screen.name}` };
  const label = view.kind === "all" ? "كل الحالات" : view.state.label;
  return { title: frameName(screen, label, view.frame) };
}

export async function ScreenStates({
  screen,
  searchParams,
}: {
  screen: ScreenDefinition;
  searchParams: ScreenSearchParams;
}) {
  const view = await resolveView(screen, searchParams);
  if (view.kind === "unknown") notFound();

  const params = await searchParams;
  const review = isReviewRequest(params) && !isCaptureRequest(params);
  // نسخة الزبون لا تعرض صفحة المراجعة الداخلية لكل الحالات.
  if (review && view.kind === "all") notFound();

  if (view.kind === "one") {
    const match = review ? findCatalogScreen(screen.id) : undefined;
    if (match) {
      // كل الشاشات متجاوبة: المقاس من ?size= (والروابط القديمة frame=mobile = موبايل). الإطار بعرض الحاوية الحقيقي (fluid).
      const size = reviewSize(params, view.frame);
      return (
        <ReviewShell screen={screen} state={view.state} size={size} match={match} keepReviewParam={!isReviewEnv()}>
          <ScreenFrame id="screen" frame={size === "mobile" ? "mobile" : "desktop"} fluid>
            {view.state.node}
          </ScreenFrame>
        </ReviewShell>
      );
    }
    return (
      <ScreenFrame id="screen" frame={view.frame}>
        {view.state.node}
      </ScreenFrame>
    );
  }

  return (
    <div className="flex min-w-max flex-col gap-12 bg-surface-sunken p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 font-bold text-fg">
          {screen.id} · {screen.name}
        </h1>
        <p className="text-body text-fg-muted">كل الحالات للمراجعة. الالتقاط حالةً حالة من ?state=&lt;key&gt;.</p>
      </header>
      {screen.states.map((state) => (
        <section key={state.key} id={state.key} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-h3 font-semibold text-fg">{frameName(screen, state.label, view.frame)}</h2>
            <p className="text-body text-fg-muted">
              <code dir="ltr">
                {screen.id}-{state.key}
              </code>
              {state.when ? ` · ${state.when}` : null}
            </p>
          </div>
          <ScreenFrame frame={view.frame}>{state.node}</ScreenFrame>
        </section>
      ))}
    </div>
  );
}
