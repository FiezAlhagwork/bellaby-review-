import type { ComponentProps, ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import type { StockCount } from "@/lib/api/types";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { findStockCount, rana, ziad } from "@/mocks/stock-counts";
import { StockCountDetailsDemo } from "../w15-stock-count/StockCountDetailsDemo";

// W16 · اعتماد الجرد: شاشة W15 نفسها للمدير التنفيذي (يصلها من «بانتظار قراري»). الحالات في SCREENS.md (awaiting-me وapproved وreturned)، ومعها نافذة الإرجاع
// واعتماد المفوَّض وجرد المفوَّض نفسه وفشل الاعتماد والحالات العامة. تفاعلية: «اعتماد» يعتمد الجرد، و«إرجاع لإعادة العدّ» بسبب يعيده قيد العدّ بأسطر قديمة.
// الاعتماد للمدير التنفيذي وحده (stock_counts.approve) ويشمله التفويض، لا لجرد المفوَّض نفسه.

const breadcrumbsFor = (label: string) => [{ label: "الرئيسية", href: "#" }, { label: "بانتظار قراري", href: "#" }, { label }];

const executive = (label: string, node: ReactNode) => (
  <ShellScreen user="executive" activeKey="pending" breadcrumbs={breadcrumbsFor(label)}>
    {node}
  </ShellScreen>
);

const execActor = { counter: ziad, decider: { by: ziad } };
const submitted = findStockCount(33); // 5 أسطر فيها فرقان
const returned = findStockCount(34); // أُرجع: أسطر قديمة وجديدة
const approved = findStockCount(35);
const approvedDelegated = findStockCount(29); // اعتمدته رنا الشامي بالتفويض عن زياد المصري
const delegateOwn = findStockCount(37); // أنشأته رنا الشامي نفسها

const demo = (count: StockCount, props: Partial<ComponentProps<typeof StockCountDetailsDemo>> = {}) => (
  <StockCountDetailsDemo initialCount={count} actor={execActor} canCount={false} canCancel={false} canDecide {...props} />
);

const screen: ScreenDefinition = {
  id: "W16",
  name: "اعتماد الجرد",
  states: [
    {
      key: "awaiting-me",
      label: "بانتظار قراري",
      when: "جرد مرسل من اللوجستي أو العامل: الأسطر والفروق (نقص وزيادة) ولوحة القرار: «اعتماد» (تتولّد التسويات وتُحال الفروق للمراقبة) أو «إرجاع لإعادة العدّ» بسبب.",
      node: executive("جرد #33", demo(submitted)),
    },
    {
      key: "return-dialog",
      label: "نافذة الإرجاع",
      when: "«إرجاع لإعادة العدّ» يفتح نافذة تطلب السبب (إلزامي) والزر معطّل حتى يُكتب. يعود الجرد قيد العدّ وتبقى الأسطر الحالية في السجل.",
      node: executive("جرد #33", demo(submitted, { initialReturnOpen: true })),
    },
    {
      key: "returned",
      label: "أُرجع",
      when: "بعد الإرجاع: الجرد قيد العدّ بشريط السبب، والأسطر القديمة في «أسطر سابقة»، وأسطر جديدة. لا لوحة قرار حتى يُرسل من جديد.",
      node: executive("جرد #34", demo(returned)),
    },
    {
      key: "approved",
      label: "معتمد",
      when: "بعد الاعتماد تحلّ بطاقة القرار محل اللوحة: من اعتمد ومتى. تولّدت التسويات وأُحيلت الفروق للمراقبة.",
      node: executive("جرد #35", demo(approved)),
    },
    {
      key: "approved-delegated",
      label: "معتمد بالتفويض",
      when: "اعتمده المدير المفوَّض بالتفويض عن المدير التنفيذي: بطاقة القرار بشارة «بالتفويض»، والسجل يذكر عن من.",
      node: executive("جرد #29", demo(approvedDelegated)),
    },
    {
      key: "self-decision-forbidden",
      label: "جرد المفوَّض نفسه",
      when: "مفوَّض فتح جرداً أنشأه هو: الاعتماد والإرجاع معطّلان وتحتهما السبب «لا تقرر فيما يخصّك. ينتظر قرار المدير التنفيذي.» (القرار بالتفويض لا يشمل جرده).",
      node: (
        <ShellScreen user="delegate" activeKey="pending" breadcrumbs={breadcrumbsFor("جرد #37")}>
          <StockCountDetailsDemo initialCount={delegateOwn} actor={{ counter: rana, decider: { by: rana, onBehalfOf: ziad } }} canCount={false} canCancel={false} canDecide decisionState="self-decision-forbidden" />
        </ShellScreen>
      ),
    },
    {
      key: "approve-failed",
      label: "تعذّر الاعتماد",
      when: "الجرد لم يعد مرسلاً (أرجعه غيرك أو ألغي): الخادم يردّ 409 invalid_status فيظهر شريط خطر. حدّث الصفحة لرؤية الحالة.",
      node: executive("جرد #33", demo(submitted, { initialApproveError: "invalid_status" })),
    },
    {
      key: "not-found",
      label: "غير موجود",
      when: "رابط جرد غير موجود أو خارج نطاق المستخدم (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: executive("جرد", demo(submitted, { mode: "not-found" })),
    },
    ...systemStates({
      loading: executive("جرد #33", demo(submitted, { mode: "loading" })),
      error: executive("جرد #33", demo(submitted, { mode: "error" })),
      // الوكيل لا يملك صلاحيات الجرد: فتح رابطه يُظهر «لا صلاحية».
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

export default function StockCountApprovalPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
