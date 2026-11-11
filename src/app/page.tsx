import Link from "next/link";
import { ReviewHub } from "@/lib/design/ReviewHub";
import { isReviewEnv, isReviewRequest } from "@/lib/design/review";
import { screenCatalog, type CatalogGroup, type CatalogScreen } from "@/lib/design/screen-catalog";

// فهرس صفحات الرسم. الروابط تُفعَّل حين تُبنى الشاشة (يُضاف `slug` لها في screen-catalog.ts).
// في وضع المراجعة (REVIEW_MODE=1 أو ?review=1) يُعرض فهرس الزبون بدله (ReviewHub).

const total = screenCatalog.reduce((sum, g) => sum + g.sections.reduce((s, sec) => s + sec.screens.length, 0), 0);
const built = screenCatalog.reduce(
  (sum, g) => sum + g.sections.reduce((s, sec) => s + sec.screens.filter((x) => x.slug).length, 0),
  0,
);

export default async function IndexPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  if (isReviewRequest(params)) return <ReviewHub keepReviewParam={!isReviewEnv()} />;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-display font-bold text-fg">Bellaby · رسم الواجهات</h1>
        <p className="text-body-lg text-fg-muted">
          المرحلة 1 · Wireframe · {total} شاشة للويب · بُني منها {built}
        </p>
        <p className="text-body text-fg-muted">الرقم بجانب كل شاشة هو عدد حالاتها المحددة في SCREENS.md، غير الحالات العامة.</p>
      </header>

      <nav aria-label="صفحات الأساس" className="flex flex-wrap gap-3">
        <Link href="/foundations" className="rounded-md border border-border-strong bg-surface px-4 py-2 text-body font-medium text-fg hover:border-border-hover">
          الأساسيات
        </Link>
        <Link href="/capture-test" className="rounded-md border border-border-strong bg-surface px-4 py-2 text-body font-medium text-fg hover:border-border-hover">
          اختبار الالتقاط
        </Link>
      </nav>

      {screenCatalog.map((group) => (
        <GroupBlock key={group.prefix} group={group} />
      ))}
    </main>
  );
}

function GroupBlock({ group }: { group: CatalogGroup }) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="border-b border-border pb-3 text-h1 font-bold text-fg">
        {group.title} <span className="text-fg-muted">· {group.prefix}</span>
      </h2>
      <div className="grid grid-cols-3 gap-6">
        {group.sections.map((section) => {
          const first = section.screens[0].id;
          const last = section.screens[section.screens.length - 1].id;
          return (
            <div key={section.number} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
              <h3 className="text-h3 font-semibold text-fg">
                {section.number} · {section.title}
              </h3>
              <p className="text-caption text-fg-muted">
                {first === last ? first : `${first} إلى ${last}`}
              </p>
              <ul className="flex flex-col">
                {section.screens.map((screen) => (
                  <ScreenRow key={screen.id} group={group} screen={screen} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ScreenRow({ group, screen }: { group: CatalogGroup; screen: CatalogScreen }) {
  const content = (
    <>
      <span dir="ltr" className="w-10 shrink-0 text-start text-label font-medium tabular-nums">
        {screen.id}
      </span>
      <span className="flex-1 text-body">{screen.name}</span>
      {screen.mobile ? <span className="text-caption text-fg-muted">موبايل</span> : null}
      <span title="عدد الحالات" className="w-6 shrink-0 text-end text-caption tabular-nums text-fg-muted">
        {screen.states.length}
      </span>
    </>
  );

  const rowClass = "flex items-center gap-3 border-t border-border py-2 first:border-t-0";

  return (
    <li>
      {screen.slug ? (
        <Link href={`${group.path}/${screen.id.toLowerCase()}-${screen.slug}`} className={`${rowClass} text-link hover:underline`}>
          {content}
        </Link>
      ) : (
        <a role="link" aria-disabled="true" className={`${rowClass} cursor-not-allowed text-fg-muted`}>
          {content}
        </a>
      )}
    </li>
  );
}
