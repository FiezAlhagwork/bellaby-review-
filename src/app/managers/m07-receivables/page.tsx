import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { ReceivablesDemo } from "./ReceivablesDemo";

// M07 · المستحقات. الحالات في SCREENS.md (default وrefer وreferred)، ومعها تعارض الإحالة (409) والحالات العامة.
// فوقها التحصيل لكل وكيل، وتحتها التسليمات غير المسدّدة المتأخر أولاً. «إحالة للقانوني» للمتأخر فقط: تفتح ملف نزاع بالمرحلة 1 مربوطاً بالتسليم.
// لمدير المبيعات (receivables.view): المراقبة «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "المستحقات" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="sales_manager" activeKey="manager-receivables" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M07",
  name: "المستحقات",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "التحصيل لكل وكيل (نسبة التحصيل والمتأخر وعدد التسليمات المتأخرة)، وتحته 13 تسليماً غير مسدّد: المتأخر أولاً (الأبعد تأخراً) ثم الباقي، بالوكيل والعميل والقيمة وموعد السداد وأيام التأخر. زر «إحالة للقانوني» في كل متأخر. فلتر الوكيل (يفلتره ضغط بطاقته أيضاً) و«المتأخر فقط».",
      node: shell(<ReceivablesDemo />),
    },
    {
      key: "refer",
      label: "نافذة الإحالة",
      when: "«إحالة للقانوني» يفتح نافذة: «يُفتح ملف نزاع بالمرحلة الأولى مربوطاً بالتسليم، يتابعه القسم القانوني» مع ملاحظة اختيارية للقانوني. التأكيد يحوّل التسليم إلى «أُحيل».",
      node: shell(<ReceivablesDemo initialReferringId={2113} />),
    },
    {
      key: "referred",
      label: "أُحيل",
      when: "بعد الإحالة (200): يعرض التسليم «أُحيل · نزاع #…» بلا زر. نزاعه عند القانوني، وقد أُحيل قبله تسليم الصيدلية العافية.",
      node: shell(<ReceivablesDemo initialReferred={{ 2113: 5002 }} />),
    },
    {
      key: "refer-conflict",
      label: "أُحيل مسبقاً (409)",
      when: "أحال غيرك التسليم قبلك أو لم يعد غير مسدّد (409): شريط في النافذة «أُحيل هذا التسليم مسبقاً أو لم يعد غير مسدّد».",
      node: shell(<ReceivablesDemo initialReferringId={2113} conflict="invalid_status" />),
    },
    ...systemStates({
      loading: shell(<ReceivablesDemo mode="loading" />),
      empty: shell(<ReceivablesDemo mode="empty" />),
      error: shell(<ReceivablesDemo mode="error" />),
      // المراقبة لا تملك receivables.view: عنصر المستحقات غير ظاهر لها، وفتح رابطه يُظهر «لا صلاحية».
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

export default function ReceivablesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
