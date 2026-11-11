import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import {
  agentForm,
  fromSampleRequestForm,
  insufficientErrors,
  insufficientForm,
  mismatchForm,
  repForm,
  sampleRequest,
  savedTransfer,
  suspendedErrors,
  suspendedForm,
} from "@/mocks/transfer-form";
import { TransferFormDemo } from "./TransferFormDemo";

// W06 · صرف جديد. الحالات في SCREENS.md، ومعها الحالات العامة. النموذج في الصفحة تفاعلي: بدّل المستلم، وعدّل الأسطر، ثم «اعتماد الصرف».
// للوجستي وحده (صلاحية transfers.create): عامل المستودع «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الصرف", href: "#" }, { label: "صرف جديد" }];

const logistics = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="dispatch" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "W06",
  name: "صرف جديد",
  states: [
    {
      key: "empty",
      label: "فارغ",
      when: "صرف جديد: المستودع الافتراضي وسطر فارغ. زر «اعتماد الصرف» معطّل وسببه ظاهر. جرّب اختيار الوكيل أو المندوب ثم الأصناف.",
      node: logistics(<TransferFormDemo />),
    },
    {
      key: "agent",
      label: "لوكيل",
      when: "المستلم وكيل: المنتجات وحدها في قائمة الأصناف، والدفعة المقترحة الأقرب انتهاءً مختارة تلقائياً مع متاحها.",
      node: logistics(<TransferFormDemo initialForm={agentForm} />),
    },
    {
      key: "rep",
      label: "لمندوب",
      when: "المستلم مندوب: العينات والمواد الدعائية وحدها في قائمة الأصناف.",
      node: logistics(<TransferFormDemo initialForm={repForm} />),
    },
    {
      key: "type-mismatch",
      label: "نوع لا يناسب المستلم",
      when: "منتج في أسطر صرف لمندوب (مثلاً بعد تبديل المستلم): السطر معلَّم «لا يُصرف للمندوب» والاعتماد معطّل حتى يُغيَّر الصنف أو المستلم.",
      node: logistics(<TransferFormDemo initialForm={mismatchForm} />),
    },
    {
      key: "suspended-batch",
      label: "دفعة موقوفة",
      when: "الدفعة الموقوفة معطّلة في قائمة الدفعات بسببها. وإن صارت موقوفة بعد اختيارها يرفضها الخادم (batch_suspended) فيظهر الخطأ تحت السطر.",
      node: logistics(<TransferFormDemo initialForm={suspendedForm} initialErrors={suspendedErrors} />),
    },
    {
      key: "insufficient",
      label: "رصيد غير كافٍ",
      when: "كمية أكبر من المتاح في الدفعة: خطأ فوري «أكبر من المتاح» تحت السطر، وخطأ الخادم (insufficient_stock). الاعتماد معطّل. لا رصيد سالب للمستودع.",
      node: logistics(<TransferFormDemo initialForm={insufficientForm} initialErrors={insufficientErrors} />),
    },
    {
      key: "from-sample-request",
      label: "من طلب عينات",
      when: "معبّأ من طلب عينات (W10): المستلم هو المندوب ومقفل، والأسطر بالأصناف المطلوبة. يجوز صرف أقل من المطلوب (المواد 20 من 30).",
      node: logistics(<TransferFormDemo initialForm={fromSampleRequestForm} sampleRequest={sampleRequest} />),
    },
    {
      key: "saved",
      label: "بالطريق",
      when: "بعد الاعتماد: المرجع TRF-… وحالة «بالطريق». نقص رصيد المستودع ولا يزيد رصيد المستلم حتى يؤكد الاستلام. «صرف آخر» أو «الصرفيات».",
      node: logistics(<TransferFormDemo initialSaved={savedTransfer} />),
    },
    ...systemStates({
      loading: logistics(<TransferFormDemo mode="loading" />),
      // لا قوائم خيارات فارغة: المستودعات والأصناف والمستلمون موجودون دائماً، فلا حالة «فراغ» لهذه الشاشة.
      error: logistics(<TransferFormDemo mode="error" />),
      // عامل المستودع لا يملك transfers.create: عنصر الصرف غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
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

export default function TransferFormPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
