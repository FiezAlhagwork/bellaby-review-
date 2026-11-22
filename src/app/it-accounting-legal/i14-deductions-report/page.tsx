import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AccountingReportDemo } from "../i13-attendance-report/AccountingReportDemo";

// I14 · تقرير الخصومات. الحالات في SCREENS.md (provisional وfinal وwith-reversal)، ومعها الحالات العامة.
// accounting.reports: IT «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "تقرير الخصومات" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="accountant" activeKey="deductions-report" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I14",
  name: "تقرير الخصومات",
  states: [
    {
      key: "provisional",
      label: "مبدئي",
      when: "تشرين الثاني مفتوح: شارة «مبدئي» وشريطها. لكل خصم الموظف والسبب والتاريخ والمبلغ، والإجمالي، و«تصدير Excel».",
      node: shell(<AccountingReportDemo report="deductions" />),
    },
    {
      key: "final",
      label: "نهائي",
      when: "تشرين الأول مغلق: شارة «نهائي» بلا شريط.",
      node: shell(<AccountingReportDemo report="deductions" initialMonth="2026-10" />),
    },
    {
      key: "with-reversal",
      label: "مع قيد معاكس",
      when: "خصم عُكس: سطران متقابلان، الخصم الأصلي وسطر بالقيمة السالبة مع ملاحظته، كما يرسلهما الخادم.",
      node: shell(<AccountingReportDemo report="deductions" dataset="with-reversal" />),
    },
    ...systemStates({
      loading: shell(<AccountingReportDemo report="deductions" mode="loading" />),
      empty: shell(<AccountingReportDemo report="deductions" dataset="empty" />),
      error: shell(<AccountingReportDemo report="deductions" mode="error" />),
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

export default function DeductionsReportPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
