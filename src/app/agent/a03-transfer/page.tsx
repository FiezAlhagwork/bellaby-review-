import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AgentTransferDemo } from "./AgentTransferDemo";

// A03 · تفاصيل الصرف. الحالات في SCREENS.md (in-transit وconfirm وreceived وcancelled)، ومعها invalid_status وغير الموجود والحالات العامة. الاستلام كامل حصراً.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-receipts" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "الاستلامات", href: "#" }, { label: "الصرف" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "A03",
  name: "تفاصيل الصرف",
  states: [
    { key: "in-transit", label: "بالطريق", when: "صرف 360 علبة من مستودع دمشق: الأسطر بالدفعة والانتهاء، و«تأكيد الاستلام».", node: shell(<AgentTransferDemo state="in-transit" />) },
    { key: "confirm", label: "نافذة التأكيد", when: "تأكيد الاستلام كاملاً: يدخل رصيدك ولا يُعدَّل بعده.", node: shell(<AgentTransferDemo state="in-transit" confirmOpen />) },
    { key: "received", label: "مستلم", when: "أكّدته: من أكّد ومتى، ودخل رصيدك.", node: shell(<AgentTransferDemo state="received" />) },
    { key: "cancelled", label: "ملغى", when: "ألغاه المستودع بسببه، فلا تأكيد.", node: shell(<AgentTransferDemo state="cancelled" />) },
    { key: "invalid-status", label: "تغيّرت الحالة", when: "تأكيد صرف أُلغي بعد فتح الصفحة (409 invalid_status).", node: shell(<AgentTransferDemo state="in-transit" initialActionError="invalid_status" />) },
    { key: "not-found", label: "غير موجود", when: "صرف ليس لك أو غير موجود (404).", node: shell(<AgentTransferDemo state="in-transit" mode="not-found" />) },
    ...systemStates({
      loading: shell(<AgentTransferDemo state="in-transit" mode="loading" />),
      error: shell(<AgentTransferDemo state="in-transit" mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentTransferPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
