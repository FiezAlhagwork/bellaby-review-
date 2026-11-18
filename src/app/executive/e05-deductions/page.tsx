import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { DeductionsDemo } from "./DeductionsDemo";

// E05 · الخصومات. الحالات في SCREENS.md (default وnew-form وreverse وmonth-closed)، ومعها الحالات العامة.
// للمدير التنفيذي وحده (deductions.create)، ولا يُنقص النقاط (القرار 13). مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الخصومات" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="deductions" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E05",
  name: "الخصومات",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "الموظف والمبلغ والسبب والمصدر (مهمة، دوام، تحقيق، آخر) والشهر والقيد المعاكس («يعكس #409» و«معكوس بـ #412»). فلتر الموظف والشهر. «خصم جديد» في الرأس، و«قيد معاكس» في قائمة الصف.",
      node: shell(<DeductionsDemo />),
    },
    {
      key: "new-form",
      label: "خصم جديد",
      when: "النافذة: الموظف والمبلغ والمصدر (بلا «تحقيق»: يأتي من قرار التحقيق) والشهر والسبب. الزر معطّل وسببه ظاهر حتى يكتمل.",
      node: shell(<DeductionsDemo initialForm={{ userId: null, amount: "", reason: "", source: null, month: "2026-11" }} />),
    },
    {
      key: "reverse",
      label: "قيد معاكس",
      when: "نافذة السبب لعكس خصم سليم القاسم: يُسجَّل قيد جديد يشير للأصلي، ويبقى الأصلي في السجل. الخصم المعكوس أو القيد المعاكس أو شهر مغلق: الخيار معطّل بسببه.",
      node: shell(<DeductionsDemo initialReversingId={411} />),
    },
    {
      key: "month-closed",
      label: "الشهر مغلق",
      when: "خصم على تشرين الأول المغلق: الخادم يرفض بـ month_closed فيظهر شريط الخطأ في النافذة. اضغط «تسجيل الخصم».",
      node: shell(<DeductionsDemo initialForm={{ userId: "5", amount: "20.00", reason: "تأخر تسليم تقرير الجرد.", source: "TASK", month: "2026-10" }} />),
    },
    ...systemStates({
      loading: shell(<DeductionsDemo mode="loading" />),
      empty: shell(<DeductionsDemo mode="empty" />),
      error: shell(<DeductionsDemo mode="error" />),
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

export default function DeductionsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
