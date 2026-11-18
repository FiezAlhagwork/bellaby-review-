import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { BudgetDemo } from "./BudgetDemo";

// E03 · الميزانية والمصاريف. الحالات في SCREENS.md (default وedit وmissing-actual وclosed)، ومعها رفض الحفظ لإغلاق الشهر والحالات العامة.
// للمدير التنفيذي (budgets.manage)، ولا يشمله التفويض (القرار 15): المفوَّض «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الميزانية" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="budget" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E03",
  name: "الميزانية والمصاريف",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "تشرين الثاني مفتوح: لكل بند الميزانية والفعلي حتى اليوم والنسبة ونوعه (محسوب أو يدخله المحاسب)، والإجمالي في البطاقات. «تعديل الميزانية» و«بنود المصاريف» في الرأس.",
      node: shell(<BudgetDemo />),
    },
    {
      key: "edit",
      label: "تعديل الميزانية",
      when: "حقول المبلغ مكان الميزانية لكل بند. «حفظ الميزانية» معطّل وسببه ظاهر حتى تكون كل القيم مبالغ صحيحة. منتقي الشهر مقفل أثناء التعديل.",
      node: shell(<BudgetDemo initialEditing />),
    },
    {
      key: "missing-actual",
      label: "فعلي ناقص",
      when: "المحاسب لم يُدخل فعلي «اتصالات»: شارة في الصف وشريط تحذير، والشهر لا يُغلق حتى يكتمل.",
      node: shell(<BudgetDemo dataset="missing" />),
    },
    {
      key: "closed",
      label: "الشهر مغلق",
      when: "تشرين الأول مغلق: شريط وقفل، ولا زر تعديل. للقراءة فقط.",
      node: shell(<BudgetDemo initialMonth="2026-10" />),
    },
    {
      key: "month-closed",
      label: "رفض الحفظ",
      when: "أُغلق الشهر أثناء التعديل: الحفظ يرجع 409 month_closed فيظهر شريط الخطأ.",
      node: shell(<BudgetDemo initialEditing saveError="month_closed" />),
    },
    ...systemStates({
      loading: shell(<BudgetDemo mode="loading" />),
      error: shell(<BudgetDemo mode="error" />),
      // التفويض لا يشمل الميزانية: المفوَّض لا يرى العنصر، وفتح الرابط يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="delegate" activeKey="pending" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function BudgetPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
