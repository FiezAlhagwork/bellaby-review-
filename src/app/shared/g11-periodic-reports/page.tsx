import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { PeriodicReportsDemo } from "./PeriodicReportsDemo";

// G11 · التقارير الدورية. الحالات في SCREENS.md (head وmonitoring وexecutive وnew-optional)، ومعها الحالات العامة.

const crumbs = (label: string) => [{ label: "الرئيسية", href: "#" }, { label }];

const head = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="periodic-reports" breadcrumbs={crumbs("التقارير الدورية")}>
    {node}
  </ShellScreen>
);
const monitoring = (node: ReactNode) => (
  <ShellScreen user="monitoring" activeKey="report-review" breadcrumbs={crumbs("مراجعة التقارير")}>
    {node}
  </ShellScreen>
);
const executive = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="periodic-reports" breadcrumbs={crumbs("التقارير الدورية")}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G11",
  name: "التقارير الدورية",
  states: [
    { key: "head", label: "رئيس القسم", when: "تقارير رامي السيد (اللوجستيات): مسودة تشرين الأول بمهلتها، والمرسلة وبوقتها، و«تقرير اختياري».", node: head(<PeriodicReportsDemo viewer="head" />) },
    { key: "monitoring", label: "المراقبة", when: "«بانتظار المراجعة» أولاً (scope=to_review)، ثم «كل التقارير» بفلتر القسم.", node: monitoring(<PeriodicReportsDemo viewer="monitoring" />) },
    { key: "executive", label: "المدير التنفيذي", when: "«بانتظار القرار» أولاً (scope=to_decide)، ثم «كل التقارير» و«تقاريري».", node: executive(<PeriodicReportsDemo viewer="executive" />) },
    { key: "new-optional", label: "تقرير اختياري", when: "نافذة الإنشاء: النوع (يومي، أسبوعي، استثنائي) والفترة.", node: head(<PeriodicReportsDemo viewer="head" openDialog />) },
    ...systemStates({
      loading: head(<PeriodicReportsDemo viewer="head" mode="loading" />),
      empty: head(<PeriodicReportsDemo viewer="head" mode="empty" />),
      error: head(<PeriodicReportsDemo viewer="head" mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function PeriodicReportsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
