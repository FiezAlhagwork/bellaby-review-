import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { TransfersListDemo } from "./TransfersListDemo";

// W07 · الصرف. الحالات في SCREENS.md (`default` و`unconfirmed`)، ومعها الحالات العامة. البحث والفلاتر والترقيم في الصفحة تفاعلية.
// للوجستي وحده (صلاحية transfers.create لعنصر القائمة): عامل المستودع «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الصرف" }];

const logistics = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="dispatch" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "W07",
  name: "الصرف",
  states: [
    {
      key: "default",
      label: "كل الصرفيات",
      when: "كل الصرفيات من الأحدث إلى الأقدم: الرقم والمستلم والتاريخ والكمية والحالة وساعات بالطريق. ما مضى عليه أكثر من 48 ساعة بالطريق معلَّم بشارة. جرّب البحث والفلاتر.",
      node: logistics(<TransfersListDemo />),
    },
    {
      key: "unconfirmed",
      label: "غير مؤكَّد أكثر من 48 ساعة",
      when: "الصرف الذي بقي «بالطريق» أكثر من 48 ساعة ولم يؤكد المستلم استلامه: الفلتر مفعّل ويعرضه وحده (من «فلاتر أخرى»). يتابعه اللوجستي مع المستلم.",
      node: logistics(<TransfersListDemo initialFilters={{ q: "", status: "IN_TRANSIT", toLocationId: null, overdue: true, range: { from: null, to: null } }} />),
    },
    ...systemStates({
      loading: logistics(<TransfersListDemo mode="loading" />),
      empty: logistics(<TransfersListDemo mode="empty" />),
      error: logistics(<TransfersListDemo mode="error" />),
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

export default function TransfersListPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
