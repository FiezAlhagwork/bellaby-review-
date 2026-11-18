import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { delegatedLog } from "@/mocks/audit-logs";
import { AuditDemo } from "./AuditDemo";

// E02 · سجل التدقيق. الحالتان في SCREENS.md (audit وaccess)، ومعهما درج التفاصيل ورؤية المراقبة والحالات العامة.
// للمدير التنفيذي والمراقبة (audit.view)، وتبويب الاطلاع على السري بـaccess_logs.view. مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "سجل التدقيق" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="audit" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E02",
  name: "سجل التدقيق",
  states: [
    {
      key: "audit",
      label: "سجل التدقيق",
      when: "كل إجراء بوقته ومنفّذه (أو «النظام» للإغلاق الآلي) وإجرائه وكيانه، وشارة «عن زياد المصري» لما نُفّذ بالتفويض. فلاتر المنفّذ والكيان والإجراء والفترة. الصف يفتح درج التغييرات.",
      node: shell(<AuditDemo />),
    },
    {
      key: "access",
      label: "سجل الاطلاع على السري",
      when: "من فتح ملف تحقيق أو نزاع أو وثيقة قانونية أو عقد، ومتى. فلتر نوع الملف.",
      node: shell(<AuditDemo initialTab="access" />),
    },
    {
      key: "details",
      label: "تفاصيل سجل",
      when: "درج سجل نُفّذ بالتفويض: المنفّذ، وبالتفويض عن، وعنوان IP، والتغييرات قبل وبعد لكل حقل.",
      node: shell(<AuditDemo initialSelected={delegatedLog} />),
    },
    {
      key: "monitoring",
      label: "رؤية المراقبة",
      when: "المراقبة ترى سجل التدقيق. تبويب الاطلاع على السري يظهر لمن يملك access_logs.view فقط (لم يُحسم للمراقبة: docs/backend-requests.md §57.4).",
      node: (
        <ShellScreen user="monitoring" activeKey="audit" breadcrumbs={breadcrumbs}>
          <AuditDemo canViewAccess={false} />
        </ShellScreen>
      ),
    },
    ...systemStates({
      loading: shell(<AuditDemo mode="loading" />),
      empty: shell(<AuditDemo mode="empty" />),
      error: shell(<AuditDemo mode="error" />),
      forbidden: (
        <ShellScreen user="sales_manager" activeKey="home-sales-manager" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AuditPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
