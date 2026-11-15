import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import type { ShellUserKey } from "@/mocks/shell-users";
import { BatchDetailsDemo } from "./BatchDetailsDemo";

// W18 · تفاصيل الدفعة. الحالات في SCREENS.md (active وsuspend وsuspended وunsuspend وsuspended-logistics)، ومعها فشل الإيقاف (409) والحالات العامة.
// الإيقاف للوجستي والمدير التنفيذي (batches.suspend)، وفكّه للمدير التنفيذي وحده (batches.unsuspend، يشمله التفويض).
// تفاعلية: التأكيد يغيّر حالة الدفعة ويضيف حدثها إلى السجل.

const breadcrumbsFor = (label: string) => [{ label: "الرئيسية", href: "#" }, { label: "الدفعات", href: "#" }, { label }];

const shell = (user: ShellUserKey, label: string, node: ReactNode) => (
  <ShellScreen user={user} activeKey="batches" breadcrumbs={breadcrumbsFor(label)}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "W18",
  name: "تفاصيل الدفعة",
  states: [
    {
      key: "active",
      label: "فعّالة",
      when: "دفعة فعّالة (تنتهي بعد 34 يوماً): بياناتها، ورصيدها في كل موقع (مستودع ووكلاء)، وزر «إيقاف الدفعة». لا سجل إيقاف بعد.",
      node: shell("logistics", "LOT-2611-A", <BatchDetailsDemo batchId={31} actor="logistics" />),
    },
    {
      key: "suspend",
      label: "نافذة الإيقاف",
      when: "«إيقاف الدفعة» يفتح نافذة تطلب السبب (إلزامي) والزر معطّل حتى يُكتب: «ستتوقف حركتها في كل المواقع، ولا ينقص أي رصيد». التأكيد يحوّلها «موقوفة».",
      node: shell("logistics", "LOT-2611-A", <BatchDetailsDemo batchId={31} actor="logistics" initialDialog={{ kind: "suspend", reason: "" }} />),
    },
    {
      key: "suspended",
      label: "موقوفة",
      when: "دفعة موقوفة (للمدير التنفيذي): شريط بسبب الإيقاف، وسجلها: إيقاف ثم فكّ بالتفويض ثم إيقاف. وزر «فك الإيقاف» فعّال.",
      node: shell("executive", "LOT-2609-C", <BatchDetailsDemo batchId={33} actor="executive" />),
    },
    {
      key: "unsuspend",
      label: "نافذة الفك",
      when: "«فك الإيقاف» (للمدير التنفيذي وحده) يفتح نافذة تطلب السبب، ويصل إشعار لكل من يحمل منها. التأكيد يعيدها «فعّالة» ويسجّل الفك.",
      node: shell("executive", "LOT-2609-C", <BatchDetailsDemo batchId={33} actor="executive" initialDialog={{ kind: "unsuspend", reason: "" }} />),
    },
    {
      key: "suspended-logistics",
      label: "موقوفة · اللوجستي",
      when: "اللوجستي يرى الدفعة الموقوفة: «فك الإيقاف» معطّل وسببه ظاهر («للمدير التنفيذي وحده») في الزر وفي شريط تحت العنوان.",
      node: shell("logistics", "LOT-2609-C", <BatchDetailsDemo batchId={33} actor="logistics" />),
    },
    {
      key: "suspend-failed",
      label: "إيقاف مرفوض (409)",
      when: "أوقفها غيرك قبلك: الخادم يردّ 409 فيظهر نصه تحت السبب («حدّث الصفحة وراجع الحالة»). تبقى النافذة مفتوحة.",
      node: shell("logistics", "LOT-2611-A", <BatchDetailsDemo batchId={31} actor="logistics" initialDialog={{ kind: "suspend", reason: "اشتباه بتلف في العبوات." }} failWith="invalid_status" />),
    },
    {
      key: "not-found",
      label: "غير موجودة",
      when: "رابط دفعة غير موجودة أو خارج النطاق (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: shell("logistics", "دفعة", <BatchDetailsDemo batchId={31} actor="logistics" mode="not-found" />),
    },
    ...systemStates({
      loading: shell("logistics", "LOT-2611-A", <BatchDetailsDemo batchId={31} actor="logistics" mode="loading" />),
      error: shell("logistics", "LOT-2611-A", <BatchDetailsDemo batchId={31} actor="logistics" mode="error" />),
      // الوكيل لا يملك صلاحيات الدفعات: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
      forbidden: shell("agent", "دفعة", <ForbiddenState />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function BatchDetailsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
