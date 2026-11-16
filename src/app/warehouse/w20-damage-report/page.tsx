import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { filledDamageForm, insufficientDamageForm, invalidDamageErrors, invalidDamageForm, savedDamageReport, suspendedDamageForm, uploadingDamageForm } from "@/mocks/damage-reports";
import { DamageReportFormDemo } from "./DamageReportFormDemo";

// W20 · تقرير تالف المستودع. الحالات في SCREENS.md (empty وsubmitted)، ومعها نموذج معبّأ ومرفق قيد الرفع ودفعة موقوفة ورصيد غير كافٍ وخطأ الخادم والحالات العامة.
// النموذج في الصفحة تفاعلي: اختر السبب والأصناف وارفع صورة ثم «رفع التقرير». للوجستي (damage.create): عامل المستودع «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "التالف", href: "#" }, { label: "تقرير تالف" }];

const logistics = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="warehouse-damage" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "W20",
  name: "تقرير تالف المستودع",
  states: [
    {
      key: "empty",
      label: "فارغ",
      when: "تقرير جديد: المستودع الافتراضي وسطر فارغ. زر «رفع التقرير» معطّل وسببه ظاهر. اختر السبب والأصناف، وجرّب رفع صورة.",
      node: logistics(<DamageReportFormDemo />),
    },
    {
      key: "filled",
      label: "معبّأ",
      when: "سبب وسطران من دفعتين (الأقرب انتهاءً مختارة تلقائياً) وملاحظة وصورتان مرفوعتان. «رفع التقرير» فعّال.",
      node: logistics(<DamageReportFormDemo initialForm={filledDamageForm} />),
    },
    {
      key: "uploading",
      label: "مرفق قيد الرفع",
      when: "مرفق ما زال يُرفع: شريط تقدّم على صفّه، والزر معطّل وسببه «انتظر اكتمال رفع المرفقات».",
      node: logistics(<DamageReportFormDemo initialForm={uploadingDamageForm} />),
    },
    {
      key: "suspended-batch",
      label: "دفعة موقوفة",
      when: "الدفعة الموقوفة مسموحة في التالف (توثيق لا يُبعد الكمية، القرار 2) وتظهر معلَّمة «موقوفة» مع شريط يشرح ذلك.",
      node: logistics(<DamageReportFormDemo initialForm={suspendedDamageForm} />),
    },
    {
      key: "insufficient",
      label: "رصيد غير كافٍ",
      when: "كمية أكبر من المتاح في الدفعة: خطأ فوري «أكبر من المتاح» تحت السطر، والزر معطّل وسببه ظاهر.",
      node: logistics(<DamageReportFormDemo initialForm={insufficientDamageForm} />),
    },
    {
      key: "validation-failed",
      label: "خطأ من الخادم",
      when: "الخادم يرفض الطلب بـ validation_failed: نصه العربي تحت السبب وتحت السطر كما هو (يختفي بعد أول تعديل).",
      node: logistics(<DamageReportFormDemo initialForm={invalidDamageForm} initialErrors={invalidDamageErrors} />),
    },
    {
      key: "submitted",
      label: "معلّق بعد الرفع",
      when: "بعد «رفع التقرير»: ملخص بحالة «بانتظار القرار» (يقرّره مدير المبيعات) والموقع والسبب والأسطر والمرفقات، و«تقرير آخر».",
      node: logistics(<DamageReportFormDemo initialSaved={savedDamageReport} />),
    },
    ...systemStates({
      loading: logistics(<DamageReportFormDemo mode="loading" />),
      error: logistics(<DamageReportFormDemo mode="error" />),
      // عامل المستودع لا يملك damage.create: عنصر التالف غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
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

export default function DamageReportPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
