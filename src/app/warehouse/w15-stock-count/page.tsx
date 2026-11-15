import type { ComponentProps, ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import type { StockCount } from "@/lib/api/types";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { findStockCount, rami, salim, ziad } from "@/mocks/stock-counts";
import { StockCountDetailsDemo } from "./StockCountDetailsDemo";

// W15 · العدّ. الحالات في SCREENS.md (in-progress وline-saved وwith-diff وsubmitted وreturned وcancel وworker)، ومعها نافذة الإرسال والجرد الملغى والحالات العامة.
// تفاعلية: حفظ سطر يضيفه بمتوقعه وفرقه، والإرسال يقفل الأسطر، والإلغاء يحوّله إلى «ملغى». اللوجستي يعدّ ويرسل ويلغي، وعامل المستودع يعدّ ويرسل (stock_counts.count).

const breadcrumbsFor = (label: string) => [{ label: "الرئيسية", href: "#" }, { label: "الجرد", href: "#" }, { label }];

const logistics = (label: string, node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="stock-counts" breadcrumbs={breadcrumbsFor(label)}>
    {node}
  </ShellScreen>
);

const logisticsActor = { counter: rami, decider: { by: ziad } };
const inProgress = findStockCount(31); // سليم القاسم: 3 أسطر مطابقة
const withDiff = findStockCount(32); // 6 أسطر فيها 3 فروق
const submitted = findStockCount(33);
const returned = findStockCount(34);
const cancelled = findStockCount(28);

const demo = (count: StockCount, props: Partial<ComponentProps<typeof StockCountDetailsDemo>> = {}) => (
  <StockCountDetailsDemo initialCount={count} actor={logisticsActor} canCount canCancel canDecide={false} {...props} />
);

const screen: ScreenDefinition = {
  id: "W15",
  name: "العدّ",
  states: [
    {
      key: "in-progress",
      label: "قيد العدّ",
      when: "جرد قيد العدّ: يختار الصنف والدفعة (الموقوفة قابلة للعدّ) ويدخل الكمية الفعلية، فيُحفظ السطر فور إدخاله بمتوقعه. «إرسال للاعتماد» و«إلغاء الجرد» للوجستي.",
      node: logistics("جرد #31", demo(inProgress)),
    },
    {
      key: "line-saved",
      label: "سطر حُفظ للتو",
      when: "بعد حفظ سطر: شريط بما حُفظ ومتوقعه وفرقه، والسطر في الجدول. عدّ الصنف والدفعة نفسيهما يستبدل السطر. (هنا حُفظت 77 من 80 عينة: نقص 3.)",
      node: logistics("جرد #31", demo(inProgress, { initialSave: { itemId: 4, batchId: 61, quantity: 77 } })),
    },
    {
      key: "with-diff",
      label: "أسطر فيها فرق",
      when: "ما بعد العدّ: ملخص بعدد الأسطر التي فيها فرق ونقصها وزيادتها، وشارة فرق لكل سطر (مطابق · نقص · زيادة). الفرق لا يمنع الإرسال.",
      node: logistics("جرد #32", demo(withDiff)),
    },
    {
      key: "submit",
      label: "نافذة الإرسال",
      when: "«إرسال للاعتماد» يفتح نافذة تذكّر أن الأسطر تُقفل بعده، وكم منها فيه فرق. التأكيد يحوّل الجرد إلى «بانتظار الاعتماد».",
      node: logistics("جرد #32", demo(withDiff, { initialSubmitOpen: true })),
    },
    {
      key: "submitted",
      label: "مرسل",
      when: "أُرسل الجرد: الأسطر مقفلة (لا إدخال ولا إلغاء) وشريط «بانتظار قرار المدير التنفيذي». السجل يذكر الإرسال.",
      node: logistics("جرد #33", demo(submitted)),
    },
    {
      key: "returned",
      label: "أُرجع لإعادة العدّ",
      when: "أرجعه المدير التنفيذي بسبب: شريط بالسبب، والجرد قيد العدّ من جديد. الأسطر القديمة تبقى في بطاقة «أسطر سابقة» وفي السجل، وتُعدّ أسطر جديدة.",
      node: logistics("جرد #34", demo(returned)),
    },
    {
      key: "cancel",
      label: "نافذة الإلغاء",
      when: "«إلغاء الجرد» يفتح نافذة تطلب السبب (إلزامي) والزر معطّل حتى يُكتب. الإلغاء قبل الإرسال فقط، ولا تتولّد تسويات.",
      node: logistics("جرد #32", demo(withDiff, { initialCancelOpen: true })),
    },
    {
      key: "cancelled",
      label: "ملغى",
      when: "جرد أُلغي قبل إرساله: الشريط بسببه، ولا أزرار.",
      node: logistics("جرد #28", demo(cancelled)),
    },
    {
      key: "worker",
      label: "عامل المستودع",
      when: "عامل المستودع يدخل الأسطر ويرسل جرده المسنَد إليه، ولا يلغي (الإلغاء بـ stock_counts.create للوجستي).",
      node: (
        <ShellScreen user="warehouse_worker" activeKey="stock-counts" breadcrumbs={breadcrumbsFor("جرد #31")}>
          <StockCountDetailsDemo initialCount={inProgress} actor={{ counter: salim, decider: { by: ziad } }} canCount canCancel={false} canDecide={false} />
        </ShellScreen>
      ),
    },
    {
      key: "not-found",
      label: "غير موجود",
      when: "رابط جرد غير موجود أو خارج نطاق المستخدم (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: logistics("جرد", demo(inProgress, { mode: "not-found" })),
    },
    ...systemStates({
      loading: logistics("جرد #31", demo(inProgress, { mode: "loading" })),
      error: logistics("جرد #31", demo(inProgress, { mode: "error" })),
      // الوكيل لا يملك صلاحيات الجرد: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="agent" activeKey="home-agent" breadcrumbs={breadcrumbsFor("جرد")}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function StockCountPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
