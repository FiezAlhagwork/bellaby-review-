import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { ItemDemo } from "./ItemDemo";

// E12 · صفحة الصنف. الحالات في SCREENS.md (product وsample وnew-price وpast-date وdisable)، ومعها صنف معطّل وغير موجود والحالات العامة. القرار 13.
// items.manage وprices.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الأصناف", href: "#" }, { label: "الصنف" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="items" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E12",
  name: "صفحة الصنف",
  states: [
    {
      key: "product",
      label: "منتج",
      when: "منتج: بياناته وبيانات الموقع، وسجل الأسعار (سعر يبدأ 1 كانون الأول «يبدأ لاحقاً»، والحالي «ساري» حتى 30 تشرين الثاني). «سعر جديد» و«تعطيل الصنف» في الرأس.",
      node: shell(<ItemDemo />),
    },
    {
      key: "sample",
      label: "عينة",
      when: "عينة: بلا بيانات موقع، وسجل تكلفة الوحدة، و«تكلفة جديدة».",
      node: shell(<ItemDemo itemId={4} />),
    },
    {
      key: "new-price",
      label: "سعر جديد",
      when: "نافذة المبلغ وتاريخ البدء (الأيام قبل اليوم معطّلة في المنتقي). الحفظ يضيف الفترة ويغلق السابقة قبلها بيوم.",
      node: shell(<ItemDemo initialPriceForm={{ amount: "", startsOn: "2026-11-10" }} />),
    },
    {
      key: "past-date",
      label: "تاريخ مضى",
      when: "الخادم يرفض فترة تبدأ قبل اليوم بـ price_in_past: شريط «لا سعر بتاريخ مضى» في النافذة.",
      node: shell(<ItemDemo initialPriceForm={{ amount: "12.90", startsOn: "2026-11-01" }} initialPriceError="price_in_past" />),
    },
    {
      key: "disable",
      label: "تعطيل الصنف",
      when: "تأكيد التعطيل: يتوقف صرفه وتسليمه وعرضه، ولا يُحذف.",
      node: shell(<ItemDemo initialConfirming />),
    },
    {
      key: "disabled",
      label: "صنف معطّل",
      when: "صنف معطّل: شريط تحذير، و«تفعيل الصنف» بدل التعطيل، ولا «سعر جديد».",
      node: shell(<ItemDemo itemId={10} />),
    },
    {
      key: "not-found",
      label: "غير موجود",
      when: "رابط صنف غير موجود (404).",
      node: shell(<ItemDemo mode="not-found" />),
    },
    ...systemStates({
      loading: shell(<ItemDemo mode="loading" />),
      error: shell(<ItemDemo mode="error" />),
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

export default function ItemPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
