import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { ReportReviewDemo } from "./ReportReviewDemo";

// G13 · مراجعة المراقبة. الحالات في SCREENS.md (default وreviewed)، ومعها invalid_status والحالات العامة. المراقبة تراجع ولا تعتمد ولا تعيد.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "مراجعة التقارير", href: "#" }, { label: "المراجعة" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="monitoring" activeKey="report-review" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G13",
  name: "مراجعة المراقبة",
  states: [
    { key: "default", label: "الافتراضي", when: "تقرير اللوجستيات المرسل: نموذج المراجعة (مكتمل؟ يحتاج تحققاً؟ الملاحظات) فوق التقرير للقراءة.", node: shell(<ReportReviewDemo state="submitted" />) },
    { key: "reviewed", label: "روجع", when: "أُرسلت المراجعة: بطاقتها، والتقرير «بانتظار الإدارة».", node: shell(<ReportReviewDemo state="reviewed" />) },
    { key: "invalid-status", label: "تغيّرت الحالة", when: "مراجعة تقرير روجع أو تغيّرت حالته (409 invalid_status).", node: shell(<ReportReviewDemo state="submitted" initialActionError="invalid_status" />) },
    ...systemStates({
      loading: shell(<ReportReviewDemo state="submitted" mode="loading" />),
      error: shell(<ReportReviewDemo state="submitted" mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function ReportReviewPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
