import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AttemptsDemo } from "./AttemptsDemo";

// I07 · المحاولات غير المصرّح بها. الحالات في SCREENS.md (default وhandle وhandled)، ومعها «عولجت مسبقاً» والحالات العامة.
// security.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "المحاولات" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="it" activeKey="attempts" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I07",
  name: "المحاولات غير المصرّح بها",
  states: [
    {
      key: "default",
      label: "بانتظار المعالجة",
      when: "المحاولات المفتوحة: النوع، والجهاز أو البريد مع الهاتف وIP، والوقت، ومهلة 24 ساعة عمل. «تجاهل» و«حظر» في قائمة الصف.",
      node: shell(<AttemptsDemo />),
    },
    {
      key: "handle",
      label: "المعالجة",
      when: "«حظر» لجهاز غير مربوط: الملاحظة إلزامية، والزر معطّل حتى تُكتب.",
      node: shell(<AttemptsDemo initialHandling={{ id: 41, action: "BLOCKED" }} />),
    },
    {
      key: "handled",
      label: "معالجة",
      when: "تبويب «معالجة»: «حُظر» أو «تُجوهل» بمن عالجها ومتى، والملاحظة في قائمة الصف.",
      node: shell(<AttemptsDemo initialTab="handled" />),
    },
    {
      key: "already-handled",
      label: "عولجت مسبقاً",
      when: "الخادم يرفض بـ 409 «عولجت مسبقاً» (عالجها غيرك): شريط فوق الجدول.",
      node: shell(<AttemptsDemo initialError="invalid_status" />),
    },
    ...systemStates({
      loading: shell(<AttemptsDemo mode="loading" />),
      empty: shell(<AttemptsDemo mode="empty" />),
      error: shell(<AttemptsDemo mode="error" />),
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

export default function AttemptsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
