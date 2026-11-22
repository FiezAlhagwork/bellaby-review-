import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AccountingReportDemo } from "./AccountingReportDemo";

// I13 · تقرير الدوام. الحالات في SCREENS.md (provisional وfinal)، ومعها الحالات العامة.
// accounting.reports: IT «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "تقرير الدوام" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="accountant" activeKey="attendance-report" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I13",
  name: "تقرير الدوام",
  states: [
    {
      key: "provisional",
      label: "مبدئي",
      when: "تشرين الثاني مفتوح (is_final = false): شارة «مبدئي» وشريط أن الأرقام تتغيّر حتى الإغلاق. لكل موظف أيام العمل والغياب والدوام الناقص والإجازات، والإجمالي، و«تصدير Excel».",
      node: shell(<AccountingReportDemo report="attendance" />),
    },
    {
      key: "final",
      label: "نهائي",
      when: "تشرين الأول مغلق (is_final = true): شارة «نهائي» بلا شريط.",
      node: shell(<AccountingReportDemo report="attendance" initialMonth="2026-10" />),
    },
    ...systemStates({
      loading: shell(<AccountingReportDemo report="attendance" mode="loading" />),
      empty: shell(<AccountingReportDemo report="attendance" dataset="empty" />),
      error: shell(<AccountingReportDemo report="attendance" mode="error" />),
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

export default function AttendanceReportPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
