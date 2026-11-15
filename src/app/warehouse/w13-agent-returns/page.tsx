import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AgentReturnsDemo } from "./AgentReturnsDemo";

// W13 · إرجاعات الوكلاء. الحالات في SCREENS.md (in-transit وconfirm وreceived)، ومعها تفاصيل الإرجاع في الدرج والحالات العامة. تفاعلية: الفلاتر والترقيم،
// والصف يفتح الدرج، و«تأكيد الاستلام» (كامل، بلا جزئي) يحوّل الإرجاع إلى «مستلم». للوجستي وحده (agent_returns.receive): عامل المستودع «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "إرجاعات الوكلاء" }];

const logistics = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="agent-returns-warehouse" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "W13",
  name: "إرجاعات الوكلاء",
  states: [
    {
      key: "in-transit",
      label: "بالطريق",
      when: "الإرجاعات التي اعتمدها مدير المبيعات ولم تصل المستودع: الوكيل والأصناف والسبب والوجهة وتاريخ الاعتماد. جرّب فلتر الوكيل، والصف يفتح تفاصيله.",
      node: logistics(<AgentReturnsDemo />),
    },
    {
      key: "details",
      label: "تفاصيل الإرجاع",
      when: "درج بالأسطر ودفعاتها (منها دفعة موقوفة) والسبب والملاحظة ومن اعتمد ومتى، وزر «تأكيد الاستلام» للوجستي. هنا إرجاع رفعه مدير المبيعات عن وكيل معطَّل.",
      node: logistics(<AgentReturnsDemo initialSelectedId={8} />),
    },
    {
      key: "confirm",
      label: "نافذة التأكيد",
      when: "«تأكيد الاستلام» يفتح نافذة تشرح أن الاستلام كامل بلا جزئي، بمجموع الكمية والوجهة. التأكيد يحوّل الإرجاع إلى «مستلم».",
      node: logistics(<AgentReturnsDemo initialSelectedId={8} initialConfirmOpen />),
    },
    {
      key: "received",
      label: "مستلم",
      when: "ما أكّد اللوجستي استلامه: الشريط بمن استلم ومتى، ولا زر تأكيد. يخرج الإرجاع من «بالطريق» إلى هنا بعد التأكيد.",
      node: logistics(<AgentReturnsDemo initialStatus="RECEIVED" initialSelectedId={2} />),
    },
    ...systemStates({
      loading: logistics(<AgentReturnsDemo mode="loading" />),
      empty: logistics(<AgentReturnsDemo mode="empty" />),
      error: logistics(<AgentReturnsDemo mode="error" />),
      // عامل المستودع لا يملك agent_returns.receive: عنصر إرجاعات الوكلاء غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="warehouse_worker" activeKey="balances" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentReturnsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
