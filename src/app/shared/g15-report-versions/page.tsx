import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { ReportVersionsDemo } from "./ReportVersionsDemo";

// G15 · نسخ التقرير. الحالة في SCREENS.md (default بنسختين)، ومعها الحالات العامة.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "التقارير الدورية", href: "#" }, { label: "التقرير", href: "#" }, { label: "النسخ" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="periodic-reports" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G15",
  name: "نسخ التقرير",
  states: [
    { key: "default", label: "الافتراضي", when: "نسختان من تقرير اللوجستيات: الأولى قبل الإعادة، والثانية بعد شرح فرق الجرد (مختارة). كل نسخة بأرقامها المثبّتة.", node: shell(<ReportVersionsDemo />) },
    ...systemStates({
      loading: shell(<ReportVersionsDemo mode="loading" />),
      error: shell(<ReportVersionsDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function ReportVersionsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
