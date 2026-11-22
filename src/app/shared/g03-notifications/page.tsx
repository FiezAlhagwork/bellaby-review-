import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { NotificationsDemo } from "./NotificationsDemo";

// G03 · الإشعارات. الحالات في SCREENS.md (default وempty)، ومعها التحميل والخطأ. الصفحة الكاملة (الموبايل، و«عرض الكل»)، والنافذة من الجرس تستعمل NotificationList نفسه.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الإشعارات" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="sales_manager" activeKey="" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G03",
  name: "الإشعارات",
  states: [
    { key: "default", label: "مختلطة", when: "إشعارات اليوم وهذا الأسبوع والأقدم، غير المقروء بخلفية ونقطة. «تعليم الكل كمقروء»، ومبدّل «الكل / غير المقروءة». النقر يعلّم الإشعار مقروءاً ويفتح وجهته.", node: shell(<NotificationsDemo />) },
    ...systemStates({
      loading: shell(<NotificationsDemo mode="loading" />),
      empty: shell(<NotificationsDemo mode="empty" />),
      error: shell(<NotificationsDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function NotificationsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
