import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { FlagsDemo } from "./FlagsDemo";

// S08 · العلامات. الحالات في SCREENS.md (default وby-type وnear-deadline وclosed)، ومعها الحالات العامة للقوائم. الفلاتر والترقيم تفاعلية، والصف يفتح درج المعالجة (S09).
// مجمّعة حسب الشخص: الأكثر علامات مفتوحة أولاً. المهلة 72 ساعة عمل. المراقبة لا تملك عقوبة (القرار 4).

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "العلامات" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="monitoring" activeKey="flags" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "S08",
  name: "العلامات",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "العلامات المفتوحة مجمّعة حسب الشخص (الأكثر علامات مفتوحة أولاً): لكل علامة نوعها والسجل المرتبط وعمرها والوقت المتبقي من مهلة 72 ساعة عمل («متبقٍّ…» أو «متأخر»). فلاتر النوع والحالة والشخص. الصف يفتح درج المعالجة.",
      node: shell(<FlagsDemo />),
    },
    {
      key: "by-type",
      label: "بالنوع",
      when: "فلتر «النوع: فرق مخزون» دون تقييد الحالة: كل علامات فرق المخزون مجمّعة حسب من تقع عليه، مفتوحة ومغلقة.",
      node: shell(<FlagsDemo initialFilters={{ type: "STOCK_DISCREPANCY", status: null, personId: null }} />),
    },
    {
      key: "near-deadline",
      label: "قاربت المهلة",
      when: "فلتر «الحالة: قاربت المهلة» (مشتق: المفتوحة وبقي لها 8 ساعات عمل فأقل أو تجاوزت): «متأخر» بشارة خطر و«متبقٍّ…» بلون تحذير.",
      node: shell(<FlagsDemo initialFilters={{ type: null, status: "NEAR", personId: null }} />),
    },
    {
      key: "closed",
      label: "المغلقة",
      when: "فلتر «الحالة: مغلقة» (مشتق: كل ما ليس مفتوحاً): لا مشكلة · مؤكَّدة · محالة للتحقيق · زال سببها، ومعها «عولجت خلال N ساعة عمل».",
      node: shell(<FlagsDemo initialFilters={{ type: null, status: "CLOSED", personId: null }} />),
    },
    ...systemStates({
      loading: shell(<FlagsDemo mode="loading" />),
      empty: shell(<FlagsDemo mode="empty" />),
      error: shell(<FlagsDemo mode="error" />),
      // السوبرفايزر لا يقرأ العلامات: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="supervisor" activeKey="home-supervisor" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function FlagsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
