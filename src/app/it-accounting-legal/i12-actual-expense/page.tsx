import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { ActualExpenseDemo } from "./ActualExpenseDemo";

// I12 · المصروف الفعلي. الحالات في SCREENS.md (default وmissing وclosed)، ومعها خطأ التحقق ورفض الحفظ لإغلاق الشهر والحالات العامة.
// expenses.enter: IT «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "المصروف الفعلي" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="accountant" activeKey="actual-expense" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I12",
  name: "المصروف الفعلي",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "تشرين الثاني مفتوح وكل البنود مُدخلة: حقل مبلغ لكل بند يدخله المحاسب، وبند العينات محسوب للقراءة. «حفظ المصروف».",
      node: shell(<ActualExpenseDemo />),
    },
    {
      key: "missing",
      label: "بنود ناقصة",
      when: "«اتصالات» بلا فعلي: شارة «ناقص» وحقل فارغ، وشريط تحذير بأن الشهر لا يُغلق حتى يكتمل.",
      node: shell(<ActualExpenseDemo dataset="missing" />),
    },
    {
      key: "closed",
      label: "مقفل",
      when: "تشرين الأول مغلق: شريط وقفل، والمبالغ للقراءة بلا حفظ.",
      node: shell(<ActualExpenseDemo initialMonth="2026-10" />),
    },
    {
      key: "validation",
      label: "خطأ التحقق",
      when: "مبلغ بصيغة خاطئة يعطّل الحفظ ويُظهر السبب، وخطأ الخادم (422) تحت حقله.",
      node: shell(<ActualExpenseDemo dataset="missing" initialDraft={{ "1": "1320.00", "3": "450.00", "4": "21O" }} errors={{ "lines.0.actual": "قيمة المصروف غير صالحة." }} />),
    },
    {
      key: "month-closed",
      label: "رفض الحفظ",
      when: "أُغلق الشهر أثناء الإدخال: الحفظ يرجع 409 month_closed فيظهر شريط الخطأ.",
      node: shell(<ActualExpenseDemo dataset="missing" initialDraft={{ "1": "1320.00", "3": "450.00", "4": "210.00" }} saveError="month_closed" />),
    },
    ...systemStates({
      loading: shell(<ActualExpenseDemo mode="loading" />),
      error: shell(<ActualExpenseDemo mode="error" />),
      forbidden: (
        <ShellScreen user="it" activeKey="users" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function ActualExpensePage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
