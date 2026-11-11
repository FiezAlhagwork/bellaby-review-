import { ArrowLeft, CaretDown, Desktop, DeviceMobile, DeviceTablet } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { ReviewStage, type ReviewSize } from "./ReviewStage";
import { screenHref, type CatalogMatch } from "./screen-catalog";
import type { ScreenDefinition, ScreenState } from "./ScreenStates";
import { StateStepper } from "./StateStepper";

// غلاف الشاشة للزبون (وضع المراجعة): شريط علوي، أزرار الحالات (حالات الشاشة ثم حالات النظام) مع السابق والتالي،
// مبدّل المقاس، شرح الشاشة، ثم الشاشة نفسها بعرض حقيقي متجاوب داخل ReviewStage. الشاشة لا تعرف أنها داخل غلاف.
// لا يظهر في وضع الالتقاط ولا يُنقل للإنتاج. لا media queries هنا: الالتفاف بـ flex-wrap، والمقاس يقيسه ReviewStage.

type ReviewShellProps = {
  screen: ScreenDefinition;
  state: ScreenState;
  size: ReviewSize;
  match: CatalogMatch;
  /** الرابط يحمل review=1 (معاينة محلية)، فيُبقى في كل الروابط. */
  keepReviewParam: boolean;
  /** الإطار نفسه (ScreenFrame fluid). */
  children: ReactNode;
};

export function reviewHref(path: string, params: Record<string, string | undefined>) {
  const query = Object.entries(params)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  return query ? `${path}?${query}` : path;
}

const chipBase =
  "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-label font-medium whitespace-nowrap transition-colors duration-120 ease-out focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:outline-none";

function chipClass(active: boolean) {
  return cn(
    chipBase,
    active ? "bg-primary text-on-primary" : "border border-border-strong bg-surface text-fg hover:border-border-hover hover:bg-surface-muted",
  );
}

const sizeOptions: { size: ReviewSize; label: string; Icon: typeof Desktop }[] = [
  { size: "auto", label: "ملء النافذة", Icon: Desktop },
  { size: "tablet", label: "تابلت", Icon: DeviceTablet },
  { size: "mobile", label: "موبايل", Icon: DeviceMobile },
];

export function ReviewShell({ screen, state, size, match, keepReviewParam, children }: ReviewShellProps) {
  const base = screenHref(match) ?? "/";
  const review = keepReviewParam ? "1" : undefined;
  const hubHref = reviewHref("/", { review });
  const { summary, audience } = match.screen;

  const shown = screen.states.filter((candidate) => !candidate.reviewHidden || candidate.key === state.key);
  const screenStates = shown.filter((candidate) => !candidate.system);
  const systemStates = shown.filter((candidate) => candidate.system);
  const ordered = [...screenStates, ...systemStates];
  const index = ordered.findIndex((candidate) => candidate.key === state.key);

  const stateHref = (key: string, nextSize: ReviewSize = size) =>
    reviewHref(base, { state: key, size: nextSize === "auto" ? undefined : nextSize, review });

  const groups = [
    { label: "حالات الشاشة", states: screenStates },
    { label: "حالات النظام", states: systemStates },
  ].filter((group) => group.states.length > 0);

  return (
    <div className="flex min-h-screen flex-col bg-surface-sunken">
      <header className="flex flex-col border-b border-border bg-surface">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link
            href={hubHref}
            className="inline-flex items-center gap-2 rounded-md text-label font-medium text-fg-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
          >
            <ArrowLeft size={16} aria-hidden="true" className="rtl:-scale-x-100" />
            <span>كل الشاشات</span>
          </Link>
          <span aria-hidden="true" className="h-5 w-px bg-border" />
          <h1 className="min-w-40 flex-1 truncate text-h3 font-semibold text-fg">{screen.name}</h1>
          <span className="shrink-0">
            <Badge color="neutral">نسخة مراجعة · Wireframe</Badge>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border px-4 py-3">
          <StateStepper
            prevHref={index > 0 ? stateHref(ordered[index - 1].key) : null}
            nextHref={index >= 0 && index < ordered.length - 1 ? stateHref(ordered[index + 1].key) : null}
          />

          {groups.map((group) => (
            <nav key={group.label} aria-label={group.label} className="flex flex-wrap items-center gap-2">
              <span className="me-1 text-label text-fg-muted">{group.label}</span>
              {group.states.map((candidate) => (
                <Link
                  key={candidate.key}
                  href={stateHref(candidate.key)}
                  aria-current={candidate.key === state.key ? "page" : undefined}
                  className={chipClass(candidate.key === state.key)}
                >
                  {candidate.label}
                </Link>
              ))}
            </nav>
          ))}

          <nav aria-label="مقاس العرض" className="ms-auto flex flex-wrap items-center gap-2">
            <span className="me-1 text-label text-fg-muted">المقاس</span>
            {sizeOptions.map(({ size: option, label, Icon }) => (
              <Link
                key={option}
                href={stateHref(state.key, option)}
                aria-current={size === option ? "page" : undefined}
                className={chipClass(size === option)}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex flex-col gap-3 px-4 pt-4">
        <details open className="group w-full max-w-3xl rounded-lg border border-border bg-surface">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-body font-semibold text-fg focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none">
            <span className="flex-1">ما هذه الشاشة؟</span>
            <CaretDown size={16} aria-hidden="true" className="text-fg-muted transition-transform duration-120 group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-2 border-t border-border px-4 py-3">
            {summary ? <p className="text-body-lg text-fg">{summary}</p> : null}
            {audience ? (
              <p className="text-body text-fg-muted">
                <span className="font-medium text-fg">من يستعملها: </span>
                {audience}
              </p>
            ) : null}
          </div>
        </details>

        <p className="max-w-3xl text-body text-fg-muted">
          <span className="font-semibold text-fg">{state.label}</span>
          {state.when ? ` · ${state.when}` : null}
        </p>
      </div>

      <main className="flex flex-1 flex-col px-4 py-4">
        <ReviewStage size={size} title={`${screen.name} · ${state.label}`}>
          {children}
        </ReviewStage>
      </main>
    </div>
  );
}
