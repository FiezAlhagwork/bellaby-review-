import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { SampleRequestsDemo } from "./SampleRequestsDemo";

// M18 · طلبات العينات. الحالات في SCREENS.md: default (جديد ومصروف ومرفوض بسبب وملغى) وnew-form وcancel، ومعها الحالات العامة للقوائم.
// لمدير المكتب العلمي (sample_requests.create): السوبرفايزر «لا صلاحية». القرار 12.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "طلبات العينات" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="scientific_manager" activeKey="scientific-sample-requests" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M18",
  name: "طلبات العينات",
  states: [
    {
      key: "default",
      label: "طلباتي",
      when: "طلبات العينات والمواد التي رفعتها: المندوب والأصناف والسبب والتاريخ وسبب الرفض والحالة (جديد، مصروف، مرفوض بسبب، ملغى). «طلب عينات» في الرأس، و«إلغاء الطلب» في قائمة الصف الجديد فقط.",
      node: shell(<SampleRequestsDemo />),
    },
    {
      key: "new-form",
      label: "نافذة الطلب",
      when: "«طلب عينات» يفتح نافذة: المندوب، والسبب، والأصناف من العينات والمواد فقط بكمياتها. الزر معطّل وسببه ظاهر حتى يكتمل، ويُضاف الطلب «جديداً» أعلى القائمة.",
      node: shell(<SampleRequestsDemo initialFormOpen />),
    },
    {
      key: "cancel",
      label: "إلغاء قبل الصرف",
      when: "تأكيد إلغاء طلب جديد لم يُصرف: ينقله إلى «ملغى». الطلب المصروف أو المرفوض لا يظهر له إجراء إلغاء.",
      node: shell(<SampleRequestsDemo initialCancelId={21} />),
    },
    ...systemStates({
      loading: shell(<SampleRequestsDemo mode="loading" />),
      empty: shell(<SampleRequestsDemo mode="empty" />),
      error: shell(<SampleRequestsDemo mode="error" />),
      // السوبرفايزر لا يملك sample_requests.create: عنصر «طلبات العينات» غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
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

export default function SampleRequestsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
