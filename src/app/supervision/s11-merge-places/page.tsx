import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { MergePointsDemo } from "./MergePointsDemo";

// S11 · دمج جهتين. الحالات في SCREENS.md (default وconfirm وnot-duplicate)، ومعها الحالات العامة وفشل الحفظ. تفاعلية: اختيار الجهة الباقية ثم «دمج» أو «ليستا مكررتين».
// تُفتح من علامة التكرار (S08). الدمج ينقل الزيارات وربط العميل إلى الباقية ويعطّل الأخرى في معاملة واحدة (القرار 4).

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الجهات الجديدة", href: "#" }, { label: "دمج جهتين" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="monitoring" activeKey="new-places" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "S11",
  name: "دمج جهتين",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "«صيدلية الشفا» (أضافها عمر، زيارة واحدة) و«صيدلية الشفاء» (12 زيارة، عميل مربوط) على بعد 40 متراً: الاسم والموقع والزيارات والعميل المربوط. «دمج» معطّل حتى تُختار الجهة الباقية وسببه ظاهر.",
      node: shell(<MergePointsDemo />),
    },
    {
      key: "confirm",
      label: "تأكيد الدمج",
      when: "اختيار «صيدلية الشفاء» باقية ثم «دمج» يفتح تأكيداً: «تنتقل الزيارات وربط العميل إلى الباقية وتُعطَّل الأخرى. لا رجوع عن الدمج.» وبعد التأكيد شريط «تم الدمج».",
      node: shell(<MergePointsDemo initialKeepId={106} initialDialog={{ kind: "merge" }} />),
    },
    {
      key: "not-duplicate",
      label: "ليستا مكررتين",
      when: "«ليستا مكررتين» تفتح تأكيداً: تُغلق العلامة بلا مشكلة وتبقى الجهتان فعّالتين.",
      node: shell(<MergePointsDemo initialDialog={{ kind: "not-duplicate" }} />),
    },
    {
      key: "merge-failed",
      label: "تعذّر الدمج",
      when: "رفض الخادم الدمج (validation_failed): شريط «تعذّر الحفظ» ونص الخطأ، وتبقى الجهتان على حالهما.",
      node: shell(<MergePointsDemo initialKeepId={106} initialError="validation_failed" />),
    },
    {
      key: "not-found",
      label: "غير موجودة",
      when: "جهة غير موجودة أو خارج النطاق (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: shell(<MergePointsDemo mode="not-found" />),
    },
    ...systemStates({
      loading: shell(<MergePointsDemo mode="loading" />),
      error: shell(<MergePointsDemo mode="error" />),
      // السوبرفايزر لا يدمج الجهات: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
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

export default function MergePlacesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
