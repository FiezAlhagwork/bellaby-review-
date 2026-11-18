import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { damagedReturnForm, filledDamageDecisionForm, firstPending } from "@/mocks/return-decisions";
import { ReturnDecisionsDemo } from "./ReturnDecisionsDemo";

// M08 · قرارات المرتجع والتالف. الحالات في SCREENS.md (customer-return وagent-damage وwarehouse-damage وagent-return وalready-decided)، ومعها القائمة بتبويباتها الأربعة
// ونافذة الرفض والتالف بمسؤوليته والقرار الصادر وبلا صلاحية القرار والحالات العامة. يقرر مدير المبيعات أو المدير التنفيذي والأسبق يسري (القرار 12)، ويشمل التفويضُ القرار.
// الطلب يُفتح في درج (لا GET لعنصر واحد في العقد: §47.6). لمدير المبيعات (returns.decide): المراقبة «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "قرارات المرتجع والتالف" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="sales_manager" activeKey="return-decisions" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const customerReturnId = firstPending["customer-return"].id ?? 0;
const agentDamageId = firstPending["agent-damage"].id ?? 0;
const warehouseDamageId = firstPending["warehouse-damage"].id ?? 0;
const agentReturnId = firstPending["agent-return"].id ?? 0;

const screen: ScreenDefinition = {
  id: "M08",
  name: "قرارات المرتجع والتالف",
  states: [
    {
      key: "list",
      label: "القائمة",
      when: "أربعة تبويبات (مرتجع صيدلية · تالف وكيل · تالف مستودع · إرجاع وكيل) بعدّاد المعلّق في كل منها، وجدول المعلّق أولاً. «المعلّق فقط» مفعّل. الصف يفتح درج القرار.",
      node: shell(<ReturnDecisionsDemo />),
    },
    {
      key: "customer-return",
      label: "مرتجع صيدلية",
      when: "درج مرتجع صيدلية بانتظار القرار: الصنف والدفعة والكمية والسبب. القرار: «أُعيد للمخزون» أو «تالف بمسؤوليته» (فتظهر المسؤولية)، أو «رفض بسبب». «اعتماد القرار» معطّل وسببه ظاهر.",
      node: shell(<ReturnDecisionsDemo initialOpen={{ kind: "customer-return", id: customerReturnId }} />),
    },
    {
      key: "customer-return-damaged",
      label: "مرتجع: تالف",
      when: "اختيار «تالف بمسؤوليته» يُظهر المسؤولية (الوكيل · المستودع · المصنّع · جهة أخرى) وتبقى «اعتماد القرار» معطّلة حتى تُختار.",
      node: shell(<ReturnDecisionsDemo initialOpen={{ kind: "customer-return", id: customerReturnId }} initialForm={damagedReturnForm} />),
    },
    {
      key: "agent-damage",
      label: "تالف وكيل",
      when: "تقرير تالف رفعه وكيل: الأسطر والسبب والموقع. «قبول التالف» بمسؤولية (المستودع · المصنّع · جهة أخرى) معطّل حتى تُختار، أو «رفض بسبب».",
      node: shell(<ReturnDecisionsDemo initialKind="agent-damage" initialOpen={{ kind: "agent-damage", id: agentDamageId }} />),
    },
    {
      key: "warehouse-damage",
      label: "تالف مستودع",
      when: "تقرير تالف رفعه اللوجستي من المستودع بصوره المرفقة. المسؤولية «المستودع» مختارة، فيصير «قبول التالف» مفعّلاً.",
      node: shell(<ReturnDecisionsDemo initialKind="warehouse-damage" initialOpen={{ kind: "warehouse-damage", id: warehouseDamageId }} initialForm={filledDamageDecisionForm} />),
    },
    {
      key: "agent-return",
      label: "إرجاع وكيل",
      when: "طلب إرجاع بضاعة إلى المستودع: الأسطر والسبب. «اعتماد الإرجاع» يجعله «بالطريق» إلى المستودع المختار، أو «رفض بسبب». (الأول في القائمة عن وكيل معطّل يخصّ M03.)",
      node: shell(<ReturnDecisionsDemo initialKind="agent-return" initialOpen={{ kind: "agent-return", id: agentReturnId }} />),
    },
    {
      key: "reject-dialog",
      label: "نافذة الرفض",
      when: "«رفض» يفتح نافذة سبب إلزامي: الزر معطّل حتى يُكتب. الرفض لا يغيّر الكميات ويُعيد الطلب بسببه.",
      node: shell(<ReturnDecisionsDemo initialOpen={{ kind: "customer-return", id: customerReturnId }} initialRejecting />),
    },
    {
      key: "already-decided",
      label: "قرّر غيرك",
      when: "«اعتماد القرار» رجع 409 already_decided: قرّر المدير التنفيذي قبلك بلحظات. شريط «قرّر غيرك قبلك»، وسجل القرار الساري (من ومتى وما قرّر)، وتختفي لوحة القرار (القرار 12: الأسبق يسري).",
      node: shell(<ReturnDecisionsDemo initialOpen={{ kind: "customer-return", id: customerReturnId }} initialForm={{ decision: "RESTOCKED", responsibility: null, toLocationId: null }} conflict />),
    },
    {
      key: "decided",
      label: "قرار صادر",
      when: "طلب مقرَّر سابقاً (تالف مقبول بمسؤولية): شارة «تالف» وسجل القرار بمن ومتى والمسؤولية. بلا لوحة قرار. القرار بالتفويض يحمل شارة «بالتفويض».",
      node: shell(<ReturnDecisionsDemo initialKind="customer-return" initialPendingOnly={false} initialOpen={{ kind: "customer-return", id: 307 }} />),
    },
    {
      key: "no-permission",
      label: "بلا صلاحية القرار",
      when: "من لا يملك returns.decide يرى الطلب بلا لوحة قرار: «بانتظار قرار مدير المبيعات أو المدير التنفيذي».",
      node: shell(<ReturnDecisionsDemo initialOpen={{ kind: "customer-return", id: customerReturnId }} canDecide={false} />),
    },
    ...systemStates({
      loading: shell(<ReturnDecisionsDemo mode="loading" />),
      empty: shell(<ReturnDecisionsDemo mode="empty" />),
      error: shell(<ReturnDecisionsDemo mode="error" />),
      // المراقبة لا تملك returns.decide: عنصر قرارات المرتجع والتالف غير ظاهر لها، وفتح رابطه يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="monitoring" activeKey="flags" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function ReturnDecisionsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
