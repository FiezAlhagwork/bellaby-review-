import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { reviewHref } from "./ReviewShell";
import { screenCatalog, screenHref, type CatalogGroup, type CatalogSection } from "./screen-catalog";

// فهرس الزبون (وضع المراجعة): الشاشات المبنيّة فقط، مجمّعة بالمجموعات والأقسام، كل شاشة بطاقة بشرحها.
// الأدوات الداخلية (المكوّنات والأساسيات والاختبار) لا تظهر هنا ولا تُخدَم في هذا الوضع. لا يُنقل للإنتاج.

type BuiltGroup = { group: CatalogGroup; sections: { section: CatalogSection; screens: CatalogSection["screens"] }[] };

const builtGroups: BuiltGroup[] = screenCatalog
  .map((group) => ({
    group,
    sections: group.sections
      .map((section) => ({ section, screens: section.screens.filter((screen) => screen.slug) }))
      .filter((entry) => entry.screens.length > 0),
  }))
  .filter((entry) => entry.sections.length > 0);

const builtCount = builtGroups.reduce((sum, entry) => sum + entry.sections.reduce((inner, s) => inner + s.screens.length, 0), 0);

/** عدد الحالات بصيغة العدد العربية. */
function statesLabel(count: number) {
  if (count === 1) return "حالة واحدة";
  if (count === 2) return "حالتان";
  return count <= 10 ? `${count} حالات` : `${count} حالة`;
}

export function ReviewHub({ keepReviewParam }: { keepReviewParam: boolean }) {
  const review = keepReviewParam ? "1" : undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-display font-bold text-fg">Bellaby</h1>
          <Badge color="neutral">نسخة مراجعة · Wireframe</Badge>
        </div>
        <p className="max-w-3xl text-body-lg text-fg">
          هذه نسخة لمراجعة شاشات لوحة التحكم قبل اعتماد الألوان والهوية. اختر شاشة لتراها بحالاتها المختلفة (جارٍ التحميل، فارغة، خطأ…) وجرّب
          عناصرها، وتجد مع كل شاشة شرحاً لما تفعله ومن يستعملها. الشاشات تتجاوب مع حجم النافذة: صغّرها أو استعمل أزرار المقاس لترى التابلت والموبايل.
        </p>
        <p className="max-w-3xl text-body text-fg-muted">
          البيانات المعروضة تجريبية. الرمادي مؤقت، فالألوان والخط النهائي بعد الاعتماد.
        </p>
      </header>

      {builtCount === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-body text-fg-muted">لا توجد شاشات للعرض بعد.</p>
      ) : null}

      {builtGroups.map(({ group, sections }) => (
        <section key={group.prefix} aria-labelledby={`group-${group.prefix}`} className="flex flex-col gap-6">
          <h2 id={`group-${group.prefix}`} className="border-b border-border pb-3 text-h1 font-bold text-fg">
            {group.title}
          </h2>
          {sections.map(({ section, screens }) => (
            <div key={section.number} className="flex flex-col gap-3">
              <h3 className="text-h3 font-semibold text-fg-muted">{section.title}</h3>
              <ul className="flex flex-wrap gap-4">
                {screens.map((screen) => {
                  const href = screenHref({ group, section, screen });
                  if (!href) return null;
                  return (
                    <li key={screen.id} className="flex w-80 max-w-full">
                      <Link
                        href={reviewHref(href, { review })}
                        className="group flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-colors duration-120 ease-out hover:border-border-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex-1 text-h3 font-semibold text-fg">{screen.name}</span>
                        </span>
                        {screen.summary ? <span className="text-body text-fg-muted">{screen.summary}</span> : null}
                        <span className="mt-auto flex items-center gap-2 pt-1 text-label text-fg-muted">
                          <span className="flex-1">
                            {screen.audience ? `${screen.audience} · ` : null}
                            {statesLabel(screen.states.length)}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-fg">
                            افتح
                            <ArrowRight size={14} aria-hidden="true" className="rtl:-scale-x-100" />
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
