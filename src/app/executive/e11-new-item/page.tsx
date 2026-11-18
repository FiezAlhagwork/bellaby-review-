import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { NewItemDemo } from "./NewItemDemo";

// E11 · صنف جديد. الحالتان في SCREENS.md (empty وvalidation)، ومعهما منتج يظهر في الموقع و«لا صلاحية».
// items.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الأصناف", href: "#" }, { label: "صنف جديد" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="items" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const productForm = {
  name: "حليب أطفال المرحلة الثالثة 800غ",
  sku: "BL-INF3-800",
  type: "PRODUCT" as const,
  portfolio: "GROWTH" as const,
  minStock: 120,
  showOnSite: true,
  slug: "growing-up-milk-stage-3",
  description: "حليب نمو للأطفال من عمر سنة، بالحديد والكالسيوم.",
  ingredients: "حليب، زيوت نباتية، فيتامينات ومعادن.",
  ageRange: "1–3 سنوات",
  image: [{ id: "img-0", name: "stage-3.jpg", size: 412000, status: "done" as const }],
};

const screen: ScreenDefinition = {
  id: "E11",
  name: "صنف جديد",
  states: [
    {
      key: "empty",
      label: "فارغ",
      when: "النموذج فارغاً: الاسم والرمز والنوع (ثلاث بطاقات) والمحفظة والحد الأدنى. «حفظ الصنف» معطّل وسببه ظاهر. اختر «منتج» لتظهر بيانات الموقع.",
      node: shell(<NewItemDemo />),
    },
    {
      key: "product-site",
      label: "منتج في الموقع",
      when: "منتج يظهر في الموقع: الصورة والرابط والعمر المناسب والوصف والمكوّنات. الرابط والوصف إلزاميان حين يظهر.",
      node: shell(<NewItemDemo initialForm={productForm} />),
    },
    {
      key: "validation",
      label: "خطأ من الخادم",
      when: "الخادم يرفض بـ validation_failed: نصّه تحت الرمز والرابط كما هو (يختفي بعد أول تعديل).",
      node: shell(<NewItemDemo initialForm={productForm} initialErrors={{ sku: "الرمز مستعمل لصنف آخر.", "site.slug": "الرابط مستعمل لمنتج آخر في الموقع." }} />),
    },
    {
      key: "forbidden",
      label: "لا صلاحية",
      when: "من لا يملك items.manage: فتح الرابط يُظهر «لا صلاحية». النموذج لا يجلب بيانات فلا تحميل ولا خطأ تحميل.",
      node: (
        <ShellScreen user="sales_manager" activeKey="home-sales-manager" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function NewItemPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
