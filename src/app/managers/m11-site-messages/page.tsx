import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { SiteMessagesDemo } from "./SiteMessagesDemo";

// M11 · رسائل الموقع. الحالات في SCREENS.md (default وhandle وhandled)، ومعها الرسالة في الدرج وتعارض المعالجة (409) والحالات العامة.
// صندوق: الاسم والهاتف والنوع (استفسار · شراء صيدلية · شكوى) والرسالة والحالة، الجديد أولاً. «تعليم: عولجت» بملاحظة إلزامية. المراقبة ترى الشكاوى وحدها في S12.
// لمدير المبيعات (site_messages.view وsite_messages.handle): السوبرفايزر «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "رسائل الموقع" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="sales_manager" activeKey="site-messages" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M11",
  name: "رسائل الموقع",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "17 رسالة من زوار الموقع، الجديدة أولاً ثم الأحدث: الاسم والهاتف والنوع والرسالة والتاريخ والحالة، و«تعليم: عولجت» في كل جديدة. فلتر النوع والحالة وترقيم. الصف يفتح الرسالة كاملة.",
      node: shell(<SiteMessagesDemo />),
    },
    {
      key: "details",
      label: "رسالة مفتوحة",
      when: "رسالة جديدة في الدرج: النص كاملاً، وزر «تعليم: عولجت» في تذييله.",
      node: shell(<SiteMessagesDemo initialOpenId={919} />),
    },
    {
      key: "handle",
      label: "نافذة المعالجة",
      when: "«تعليم: عولجت» يفتح نافذة: ملاحظة المعالجة إلزامية، والزر معطّل حتى تُكتب ومعه سببه. بعد التأكيد تُسجَّل معالجتك ولا تتغير.",
      node: shell(<SiteMessagesDemo initialHandlingId={920} />),
    },
    {
      key: "handled",
      label: "عولجت",
      when: "رسالة عولجت للتو: شارة «عولجت»، وفي درجها من عالجها ومتى وملاحظته، ولا زر معالجة.",
      node: shell(<SiteMessagesDemo initialOpenId={920} initialHandled={{ 920: "أُرسلت إليها المقارنة بين المنتجين ووُجّهت إلى المكتب العلمي." }} />),
    },
    {
      key: "already-handled",
      label: "عولجت مسبقاً (409)",
      when: "عالجها غيرك قبلك (409): شريط «عولجت هذه الرسالة من قبل. حدّث الصفحة لرؤية ملاحظة المعالجة».",
      node: shell(<SiteMessagesDemo initialHandlingId={920} conflict="invalid_status" initialError="invalid_status" />),
    },
    ...systemStates({
      loading: shell(<SiteMessagesDemo mode="loading" />),
      empty: shell(<SiteMessagesDemo mode="empty" />),
      error: shell(<SiteMessagesDemo mode="error" />),
      // السوبرفايزر لا يملك site_messages.view: عنصر رسائل الموقع غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
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

export default function SiteMessagesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
