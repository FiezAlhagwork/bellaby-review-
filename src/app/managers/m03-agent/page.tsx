import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { activeAgentId, blankAgentReturnForm, deactivatedAgentId, filledAgentReturnForm, findAgent, invalidAgentReturnErrors, invalidAgentReturnForm } from "@/mocks/sales";
import { AgentDetailsDemo } from "./AgentDetailsDemo";
import { AgentReturnFormDemo } from "./AgentReturnFormDemo";

// M03 · صفحة الوكيل. الحالتان في SCREENS.md (default وdeactivated)، ومعهما التبويبات الخمسة ونموذج الإرجاع عن الوكيل المعطّل (النموذج المشترك لـ A15) وغير موجود والحالات العامة.
// قراءة فقط: بياناته وتبويباته (الاستلامات · الرصيد بالدفعة · التسليمات · المستحقات · المرتجعات). الوكيل المعطّل يُنشأ الإرجاع عنه (القرار 14).
// لمدير المبيعات (agents.manage): المراقبة «لا صلاحية».

const active = findAgent(activeAgentId);
const inactive = findAgent(deactivatedAgentId);

/** الرئيسية ← الوكلاء ← ما بعدهما: كل عنصر رابط عدا الأخير. */
const breadcrumbsFor = (...trail: string[]) => [{ label: "الرئيسية", href: "#" }, { label: "الوكلاء", href: "#" }, ...trail.map((label, index) => (index < trail.length - 1 ? { label, href: "#" } : { label }))];

const shell = (node: ReactNode, ...trail: string[]) => (
  <ShellScreen user="sales_manager" activeKey="agents" breadcrumbs={breadcrumbsFor(...(trail.length ? trail : [active.name ?? "وكيل"]))}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M03",
  name: "صفحة الوكيل",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "وكالة الياسمين (فعّالة): الهاتف والمحافظات والعنوان والمستحق، وتبويب «الاستلامات» أولاً: صرفيات المستودع إليها بالرقم والتاريخ والكمية والحالة. التبويبات الخمسة تنقل بينها، للقراءة.",
      node: shell(<AgentDetailsDemo agentId={activeAgentId} initialTab="receipts" />),
    },
    {
      key: "balances",
      label: "الرصيد بالدفعة",
      when: "تبويب «الرصيد بالدفعة»: كل منتج بدفعته (الرقم والانتهاء والحالة) والكمية الموجودة عند الوكيل.",
      node: shell(<AgentDetailsDemo agentId={activeAgentId} initialTab="balances" />),
    },
    {
      key: "deliveries",
      label: "التسليمات",
      when: "تبويب «التسليمات»: تسليماته للصيدليات برقمها وعميلها وتاريخها وقيمتها وموعد سدادها وحالتها (مسدد · غير مسدد · متأخر).",
      node: shell(<AgentDetailsDemo agentId={activeAgentId} initialTab="deliveries" />),
    },
    {
      key: "receivables",
      label: "المستحقات",
      when: "تبويب «المستحقات»: المستحق والمسدَّد والمتأخر ونسبة التحصيل، وتحتها تسليماته غير المسدّدة (المتأخر منها معلَّم بأيام تأخره).",
      node: shell(<AgentDetailsDemo agentId={activeAgentId} initialTab="receivables" />),
    },
    {
      key: "returns",
      label: "المرتجعات",
      when: "تبويب «المرتجعات»: إرجاعاته للمستودع بسببها وحالتها، ومرتجعات صيدلياته (بانتظار القرار · أُعيد للمخزون · تالف).",
      node: shell(<AgentDetailsDemo agentId={activeAgentId} initialTab="returns" />),
    },
    {
      key: "deactivated",
      label: "وكيل معطّل",
      when: "الوكيل (الفرات) معطّل: شارة «معطّل» وشريط يشرح، وزر «إنشاء إرجاع للمستودع عنه» لأن رصيده لم يُرجَع بعد (يظهر في تبويب الرصيد، وفيه دفعة موقوفة). بلا استلامات.",
      node: shell(<AgentDetailsDemo agentId={deactivatedAgentId} initialTab="balances" />),
    },
    {
      key: "return-form",
      label: "إرجاع عن الوكيل",
      when: "«إنشاء إرجاع للمستودع عنه»: النموذج المشترك مع A15: شريط «بالنيابة عن الوكيل»، والسبب، وأسطر المنتجات من رصيد الوكيل بدفعاتها (الموقوفة مسموحة)، وملاحظة. «إنشاء الإرجاع» معطّل وسببه ظاهر.",
      node: shell(<AgentReturnFormDemo agentId={deactivatedAgentId} initialForm={blankAgentReturnForm} />, inactive.name ?? "وكيل", "إرجاع للمستودع"),
    },
    {
      key: "return-filled",
      label: "إرجاع: معبّأ",
      when: "السبب والأسطر مكتملة (دفعتان من المرحلة الأولى إحداهما موقوفة، وسيريلاك): «إنشاء الإرجاع» مفعّل، والشريط يوضح أن الموقوفة تُرجع ولا تُوزَّع.",
      node: shell(<AgentReturnFormDemo agentId={deactivatedAgentId} initialForm={filledAgentReturnForm} />, inactive.name ?? "وكيل", "إرجاع للمستودع"),
    },
    {
      key: "return-validation",
      label: "إرجاع: أخطاء",
      when: "رفض الخادم (validation_failed): السبب غير فعّال، وكمية سطر أكبر من رصيد الوكيل (insufficient_stock). تظهر نصوص الخادم تحت حقولها.",
      node: shell(<AgentReturnFormDemo agentId={deactivatedAgentId} initialForm={invalidAgentReturnForm} errors={invalidAgentReturnErrors} />, inactive.name ?? "وكيل", "إرجاع للمستودع"),
    },
    {
      key: "return-created",
      label: "إرجاع: أُنشئ",
      when: "بعد الإنشاء (201): ملخص الطلب بحالة «بانتظار القرار» وعلامة «عن الوكيل». يُقرَّر في «قرارات المرتجع والتالف»، وزر «صفحة الوكيل» يعيد إليه.",
      node: shell(<AgentReturnFormDemo agentId={deactivatedAgentId} initialForm={filledAgentReturnForm} initiallySaved />, inactive.name ?? "وكيل", "إرجاع للمستودع"),
    },
    {
      key: "not-found",
      label: "غير موجود",
      when: "رابط وكيل غير موجود أو خارج نطاقك (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: shell(<AgentDetailsDemo agentId={activeAgentId} mode="not-found" />, "وكيل"),
    },
    ...systemStates({
      loading: shell(<AgentDetailsDemo agentId={activeAgentId} mode="loading" />, "وكيل"),
      error: shell(<AgentDetailsDemo agentId={activeAgentId} mode="error" />, "وكيل"),
      // المراقبة لا تملك agents.manage: عنصر الوكلاء غير ظاهر لها، وفتح رابطه يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="monitoring" activeKey="flags" breadcrumbs={breadcrumbsFor("وكيل")}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
