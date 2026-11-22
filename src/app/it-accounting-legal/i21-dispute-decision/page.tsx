import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { DisputeDemo } from "../i20-dispute/DisputeDemo";

// I21 · قرار النزاع: شاشة I20 بعين المدير التنفيذي (disputes.decide). الحالات في SCREENS.md (awaiting-me وother-solution)،
// ومعها تأكيد الاعتماد، وinvalid_status، والمفوَّض «لا صلاحية» (لا تفويض، القرار 15).

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "بانتظار قراري", href: "#" }, { label: "قرار النزاع" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="pending" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I21",
  name: "قرار النزاع",
  states: [
    {
      key: "awaiting-me",
      label: "بانتظاري",
      when: "الملف والتوصية والخطر، و«اعتماد التوصية» و«حل آخر». القرار للمدير التنفيذي وحده.",
      node: shell(<DisputeDemo status="AWAITING_DECISION" canManage={false} canDecide />),
    },
    {
      key: "approve-confirm",
      label: "تأكيد الاعتماد",
      when: "«اعتماد التوصية»: تأكيد قبل الإرسال، فينتقل الملف إلى «تنفيذ القرار».",
      node: shell(<DisputeDemo status="AWAITING_DECISION" canManage={false} canDecide initialApproving />),
    },
    {
      key: "other-solution",
      label: "حل آخر",
      when: "«حل آخر»: نافذة بنص الحل وسببه، إلزاميين.",
      node: shell(<DisputeDemo status="AWAITING_DECISION" canManage={false} canDecide initialOtherSolution />),
    },
    {
      key: "invalid-status",
      label: "قُرّر مسبقاً",
      when: "الملف لم يعد بانتظار القرار (409 invalid_status): شريط تحذير.",
      node: shell(<DisputeDemo status="AWAITING_DECISION" canManage={false} canDecide initialActionError="invalid_status" />),
    },
    {
      key: "delegate-forbidden",
      label: "المفوَّض",
      when: "مدير المبيعات مفوَّضاً عن المدير التنفيذي: النزاعات لا يشملها التفويض، فـ«لا صلاحية».",
      node: (
        <ShellScreen user="delegate" activeKey="pending" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function DisputeDecisionPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
