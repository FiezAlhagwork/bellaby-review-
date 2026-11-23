import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AgentDeliveryDemo } from "./AgentDeliveryDemo";

// A10 · تفاصيل التسليم. الحالات في SCREENS.md، ومعها invalid_status وغير الموجود والحالات العامة. الـ view نفسه في M06 بأعلام الوكيل. لا دفعات جزئية.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-deliveries" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "التسليمات", href: "#" }, { label: "التسليم" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "A10",
  name: "تفاصيل التسليم",
  states: [
    { key: "unpaid", label: "غير مسدد", when: "صيدلية الحياة: «تأكيد التحصيل» و«مرتجع» و«طلب إلغاء أو شطب».", node: shell(<AgentDeliveryDemo state="unpaid" />) },
    { key: "collect-confirm", label: "تأكيد التحصيل", when: "نافذة التحصيل الكامل: لا دفعات جزئية، والوقت لحظة التأكيد.", node: shell(<AgentDeliveryDemo state="unpaid" initialDialog={{ kind: "collect" }} />) },
    { key: "paid", label: "مسدد", when: "سُدد في موعده: وقت السداد وشارة «في موعده».", node: shell(<AgentDeliveryDemo state="paid" />) },
    { key: "overdue", label: "متأخر", when: "تجاوز موعد السداد بأيامه.", node: shell(<AgentDeliveryDemo state="overdue" />) },
    { key: "request-form", label: "نافذة الطلب", when: "إلغاء (لم يحدث) أو شطب (لن يُحصَّل)، والسبب إلزامي.", node: shell(<AgentDeliveryDemo state="unpaid" initialDialog={{ kind: "request", type: "WRITE_OFF", reason: "" }} />) },
    { key: "approval-pending", label: "بانتظار الاعتماد", when: "طلب شطب بانتظار قرار المدير التنفيذي: بلا أفعال.", node: shell(<AgentDeliveryDemo state="approval-pending" />) },
    { key: "cancelled", label: "ملغى", when: "اعتُمد الإلغاء: عادت البضاعة لرصيدي.", node: shell(<AgentDeliveryDemo state="cancelled" />) },
    { key: "written-off", label: "مشطوب", when: "اعتُمد الشطب بسببه.", node: shell(<AgentDeliveryDemo state="written-off" />) },
    { key: "request-rejected", label: "رُفض الطلب", when: "رُفض طلب الشطب: عاد «غير مسدد» بسبب الرفض، والأفعال متاحة.", node: shell(<AgentDeliveryDemo state="request-rejected" />) },
    { key: "referred", label: "أُحيل للقانوني", when: "تسليم متأخر أُحيل إلى القانوني برقم نزاعه.", node: shell(<AgentDeliveryDemo state="referred" />) },
    { key: "invalid-status", label: "تغيّرت الحالة", when: "تحصيل تسليم لم يعد غير مسدد (409 invalid_status).", node: shell(<AgentDeliveryDemo state="unpaid" initialActionError="invalid_status" />) },
    { key: "not-found", label: "غير موجود", when: "تسليم ليس لك (404).", node: shell(<AgentDeliveryDemo state="unpaid" mode="not-found" />) },
    ...systemStates({
      loading: shell(<AgentDeliveryDemo state="unpaid" mode="loading" />),
      error: shell(<AgentDeliveryDemo state="unpaid" mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentDeliveryPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
