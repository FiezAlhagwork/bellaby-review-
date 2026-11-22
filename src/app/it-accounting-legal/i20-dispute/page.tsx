import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { DisputeDemo } from "./DisputeDemo";

// I20 · ملف النزاع. الحالات في SCREENS.md (stage-2 وstage-6 وawaiting-decision وstage-7 وclosed وclosed-resolved)، ومعها المرحلة 4 (الخطر)،
// ونافذة «زال السبب»، وinvalid_status، وغير الموجود، والحالات العامة. القرار 14. سري ولا تفويض.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "النزاعات", href: "#" }, { label: "ملف النزاع" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="legal" activeKey="disputes" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I20",
  name: "ملف النزاع",
  states: [
    { key: "stage-2", label: "المرحلة 2", when: "المرحلة الأولى مكتملة: نموذج «جمع المستندات» بملخص ومرفقات، و«إكمال المرحلة»، و«زال السبب» في الرأس.", node: shell(<DisputeDemo status="STAGE_2" />) },
    { key: "stage-4", label: "المرحلة 4", when: "«تقدير المخاطر»: الملخص ومستوى الخطر (إلزامي) والقيمة المعرّضة للخطر.", node: shell(<DisputeDemo status="STAGE_4" />) },
    { key: "stage-6", label: "المرحلة 6", when: "نموذج التوصية: المخاطر من المرحلة 4 والحلول من المرحلة 5، وحقل التوصية، و«رفع التوصية».", node: shell(<DisputeDemo status="STAGE_6" />) },
    { key: "awaiting-decision", label: "بانتظار القرار", when: "رُفعت التوصية: تظهر للقراءة، وشريط «بانتظار قرار المدير التنفيذي». لا إجراء للقانوني.", node: shell(<DisputeDemo status="AWAITING_DECISION" />) },
    { key: "stage-7", label: "المرحلة 7", when: "اعتُمدت التوصية: سجل القرار، ونموذج «تنفيذ القرار» بملخص إلزامي يغلق الملف.", node: shell(<DisputeDemo status="STAGE_7" />) },
    { key: "closed", label: "مغلق", when: "نُفّذ القرار: المراحل السبع والقرار مكتملة، وسجل القرار وما جرى في كل مرحلة.", node: shell(<DisputeDemo status="CLOSED" />) },
    { key: "closed-resolved", label: "زال السبب", when: "أُغلق في المرحلة 3 لزوال السبب: نهاية مبكرة في المراحل بسببها.", node: shell(<DisputeDemo status="CLOSED_RESOLVED" />) },
    { key: "close-resolved-dialog", label: "نافذة زال السبب", when: "«زال السبب» (المراحل 1–6): سبب إلزامي حتى 1000 حرف.", node: shell(<DisputeDemo status="STAGE_2" initialResolved />) },
    { key: "invalid-status", label: "تغيّرت الحالة", when: "إجراء على ملف تغيّرت حالته (409 invalid_status): شريط تحذير.", node: shell(<DisputeDemo status="STAGE_2" initialActionError="invalid_status" />) },
    { key: "not-found", label: "غير موجود", when: "رقم نزاع غير موجود (404).", node: shell(<DisputeDemo status="STAGE_2" mode="not-found" />) },
    ...systemStates({
      loading: shell(<DisputeDemo status="STAGE_2" mode="loading" />),
      error: shell(<DisputeDemo status="STAGE_2" mode="error" />),
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

export default function DisputePage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
