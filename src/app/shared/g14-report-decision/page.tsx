import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import type { ShellUserKey } from "@/mocks/shell-users";
import { ReportDecisionDemo } from "./ReportDecisionDemo";

// G14 · قرار المدير التنفيذي على التقرير. الحالات في SCREENS.md (default وfollow-up-action وreturned وapproved)، ومعها التفويض وself_decision_forbidden وinvalid_status والحالات العامة.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "بانتظار قراري", href: "#" }, { label: "التقرير الدوري" }];

const shell = (node: ReactNode, user: ShellUserKey = "executive") => (
  <ShellScreen user={user} activeKey="pending" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G14",
  name: "قرار المدير التنفيذي على التقرير",
  states: [
    { key: "default", label: "الافتراضي", when: "تقرير اللوجستيات بعد مراجعة المراقبة: بطاقة المراجعة، والقرارات الستة، والملاحظات، والتقرير للقراءة.", node: shell(<ReportDecisionDemo state="reviewed" />) },
    { key: "follow-up-action", label: "إجراء متابعة", when: "اختيار «فتح إجراء متابعة»: «الإجراء المطلوب» إلزامي ويصير مهمة لرئيس القسم.", node: shell(<ReportDecisionDemo state="reviewed" initialForm={{ decision: "APPROVE_WITH_FOLLOW_UP", notes: "", requiredAction: "تقرير أسبوعي عن أرصدة حلب حتى وصول الشحنة." }} />) },
    { key: "returned", label: "أُعيد", when: "بعد «إعادة للتعديل»: سجل القرار بالملاحظات والإجراء، والتقرير عند رئيس القسم.", node: shell(<ReportDecisionDemo state="returned" />) },
    { key: "approved", label: "معتمد", when: "بعد «اعتماد مع ملاحظات»: سجل القرار، وبنود الخطة صارت مهاماً والأهداف خطة الشهر التالي.", node: shell(<ReportDecisionDemo state="approved" />) },
    { key: "follow-up-approved", label: "معتمد بمتابعة", when: "بعد «فتح إجراء متابعة»: فُتح الإجراء مهمةً لرئيس القسم.", node: shell(<ReportDecisionDemo state="follow-up" />) },
    { key: "delegated", label: "بالتفويض", when: "رنا الشامي مفوَّضة عن المدير التنفيذي تقرر في تقرير اللوجستيات: شريط التفويض، والقرار يُسجَّل «بالتفويض».", node: shell(<ReportDecisionDemo state="reviewed" delegate />, "delegate") },
    { key: "self-decision-forbidden", label: "لا تقرر فيما يخصّك", when: "المفوَّضة على تقرير المبيعات الذي كتبته: الأزرار معطّلة وينتظر المدير التنفيذي.", node: shell(<ReportDecisionDemo state="sales-reviewed" delegate />, "delegate") },
    { key: "invalid-status", label: "تغيّرت الحالة", when: "قرار على تقرير لم يعد «بانتظار الإدارة» (409 invalid_status).", node: shell(<ReportDecisionDemo state="reviewed" initialForm={{ decision: "APPROVE", notes: "", requiredAction: "" }} initialActionError="invalid_status" />) },
    ...systemStates({
      loading: shell(<ReportDecisionDemo state="reviewed" mode="loading" />),
      error: shell(<ReportDecisionDemo state="reviewed" mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function ReportDecisionPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
