import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { productTrace, sampleTrace } from "@/mocks/batches";
import type { ShellUserKey } from "@/mocks/shell-users";
import { RecallTraceDemo } from "./RecallTraceDemo";

// W19 · تقرير تتبع السحب. الحالات في SCREENS.md (default وdistributed-after)، ومعها التصدير والحالات العامة لتقرير.
// يُفتح من تفاصيل الدفعة (W18) للوجستي والمدير التنفيذي. التصدير PDF أو Excel (format في العقد).

const breadcrumbsFor = (label: string) => [{ label: "الرئيسية", href: "#" }, { label: "الدفعات", href: "#" }, { label, href: "#" }, { label: "تقرير التتبع" }];

const shell = (user: ShellUserKey, label: string, node: ReactNode) => (
  <ShellScreen user={user} activeKey="batches" breadcrumbs={breadcrumbsFor(label)}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "W19",
  name: "تقرير تتبع السحب",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "دفعة منتج موقوفة (LOT-2609-C): الباقي في كل موقع، وما وصل لكل عميل عبر وكيله بتاريخه وهاتفه. لا توزيع في الزيارات (المنتجات لا يوزّعها المندوب). وزرا «تصدير PDF» و«تصدير Excel».",
      node: shell("logistics", "LOT-2609-C", <RecallTraceDemo trace={productTrace} />),
    },
    {
      key: "distributed-after",
      label: "وُزّع بعد الإيقاف",
      when: "دفعة عيّنات موقوفة (LOT-2609-X) وُزّع منها بعد الإيقاف من أجهزة كانت دون اتصال: شريط تنبيه بالمجموع، والصفوف المعلّمة «بعد الإيقاف» في جدول التوزيع.",
      node: shell("executive", "LOT-2609-X", <RecallTraceDemo trace={sampleTrace} />),
    },
    {
      key: "exporting",
      label: "جارٍ التصدير",
      when: "الضغط على «تصدير PDF» أو «تصدير Excel» يعطّل الزرين حتى يصل الملف، ويكتب «جارٍ التصدير…» على الزر المضغوط.",
      node: shell("logistics", "LOT-2609-C", <RecallTraceDemo trace={productTrace} initialExporting="pdf" />),
    },
    {
      key: "not-found",
      label: "غير موجودة",
      when: "رابط دفعة غير موجودة أو خارج النطاق (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: shell("logistics", "دفعة", <RecallTraceDemo trace={productTrace} mode="not-found" />),
    },
    ...systemStates({
      loading: shell("logistics", "LOT-2609-C", <RecallTraceDemo trace={productTrace} mode="loading" />),
      error: shell("logistics", "LOT-2609-C", <RecallTraceDemo trace={productTrace} mode="error" />),
      // الوكيل لا يملك صلاحيات الدفعات: عنصرها غير ظاهر له، وفتح رابط التقرير يُظهر «لا صلاحية».
      forbidden: shell("agent", "دفعة", <ForbiddenState />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function RecallTracePage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
