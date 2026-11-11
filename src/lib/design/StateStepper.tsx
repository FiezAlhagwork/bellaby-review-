"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/cn";

// أسهم «السابق» و«التالي» بين حالات الشاشة، مع السهمين في لوحة المفاتيح. الصفحة RTL: السابق يميناً والتالي يساراً.
// الاختصار لا يعمل إلا والتركيز على الصفحة نفسها أو على الأسهم، فلا يتعارض مع حقل أو قائمة داخل الشاشة. لا يُنقل للإنتاج.

type StateStepperProps = {
  /** رابط الحالة السابقة، أو null عند الأولى. */
  prevHref: string | null;
  /** رابط الحالة التالية، أو null عند الأخيرة. */
  nextHref: string | null;
};

const buttonClass =
  "inline-flex size-8 items-center justify-center rounded-md border border-border-strong bg-surface text-fg transition-colors duration-120 ease-out hover:border-border-hover hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:outline-none";
const disabledClass = "pointer-events-none border-border text-fg-disabled";

export function StateStepper({ prevHref, nextHref }: StateStepperProps) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const active = document.activeElement;
      const onPage = !active || active === document.body || active.hasAttribute("data-stepper");
      if (!onPage) return;
      // RTL: السهم الأيمن للسابق، والأيسر للتالي.
      const href = event.key === "ArrowRight" ? prevHref : event.key === "ArrowLeft" ? nextHref : null;
      if (!href) return;
      event.preventDefault();
      router.push(href);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prevHref, nextHref, router]);

  return (
    <div className="flex items-center gap-1" role="group" aria-label="التنقل بين الحالات">
      {prevHref ? (
        <Link href={prevHref} data-stepper aria-label="الحالة السابقة" title="الحالة السابقة (السهم الأيمن)" className={buttonClass}>
          <CaretRight size={16} aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(buttonClass, disabledClass)}>
          <CaretRight size={16} />
        </span>
      )}
      {nextHref ? (
        <Link href={nextHref} data-stepper aria-label="الحالة التالية" title="الحالة التالية (السهم الأيسر)" className={buttonClass}>
          <CaretLeft size={16} aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(buttonClass, disabledClass)}>
          <CaretLeft size={16} />
        </span>
      )}
    </div>
  );
}
