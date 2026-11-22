import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import type { ShellUserKey } from "@/mocks/shell-users";
import { PeriodicReportDemo } from "./PeriodicReportDemo";

// G12 · التقرير: المسودة والتحرير. الحالات في SCREENS.md (draft وvalidation وsubmitted وreturned وoverdue وtargets-sales وtargets-scientific)، ومعها غير الموجود والحالات العامة. القرار 11.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "التقارير الدورية", href: "#" }, { label: "التقرير" }];

const shell = (node: ReactNode, user: ShellUserKey = "logistics") => (
  <ShellScreen user={user} activeKey="periodic-reports" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G12",
  name: "التقرير: المسودة والتحرير",
  states: [
    { key: "draft", label: "مسودة", when: "تقرير اللوجستيات لتشرين الأول: الأقسام التلقائية حيّة (الأعمال المتأخرة، والمشاكل المنقولة)، واليدوية مملوءة جزئياً، والإقرار و«إرسال».", node: shell(<PeriodicReportDemo state="draft" />) },
    { key: "validation", label: "أخطاء التحقق", when: "الإرسال بحقول ناقصة: نص الخادم تحت كل حقل (422)، والإقرار غير مؤكد.", node: shell(<PeriodicReportDemo state="validation" />) },
    { key: "submitted", label: "مرسل", when: "بانتظار المراقبة: الأرقام مثبّتة في النسخة 1، والتقرير للقراءة.", node: shell(<PeriodicReportDemo state="submitted" />) },
    { key: "returned", label: "معاد للتعديل", when: "أعاده المدير التنفيذي بملاحظاته والإجراء المطلوب: يُحرَّر ويُرسل من جديد بنسخة جديدة.", node: shell(<PeriodicReportDemo state="returned" />) },
    { key: "overdue", label: "تجاوز المهلة", when: "مسودة فاتت مهلتها: شارة وشريط، والمهلة بالأحمر.", node: shell(<PeriodicReportDemo state="overdue" />) },
    { key: "targets-sales", label: "أهداف المبيعات", when: "تقرير المبيعات: ما لم يتحقق بأسبابه، وأهداف الفترة القادمة لكل منطقة ووكيل ومنتج والعملاء الجدد وزيارات المدير. بلا تقييم فريق.", node: shell(<PeriodicReportDemo state="targets-sales" />, "sales_manager") },
    { key: "targets-scientific", label: "أهداف المكتب العلمي", when: "تقرير المكتب العلمي: الزيارات والفئات والمنتجات وخطة العينات، وتقييم المندوبين.", node: shell(<PeriodicReportDemo state="targets-scientific" />, "scientific_manager") },
    { key: "not-found", label: "غير موجود", when: "رقم تقرير غير موجود أو ليس لك (404).", node: shell(<PeriodicReportDemo state="draft" mode="not-found" />) },
    ...systemStates({
      loading: shell(<PeriodicReportDemo state="draft" mode="loading" />),
      error: shell(<PeriodicReportDemo state="draft" mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function PeriodicReportPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
