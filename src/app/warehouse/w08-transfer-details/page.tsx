import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { cancelledRepTransfer, cancelledTransfer, inTransitTransfer, overdueTransfer, receivedTransfer, rejectedReceipts } from "@/mocks/transfer-details";
import { TransferDetailsDemo } from "./TransferDetailsDemo";

// W08 · تفاصيل الصرف. الحالات في SCREENS.md، ومعها الحالات العامة لتفاصيل الكيان (تحميل، خطأ، غير موجود، لا صلاحية). تفاعلية: «إلغاء الصرف» يفتح
// النافذة، والتأكيد يحوّل الصرف إلى «ملغى». للوجستي وحده (إلغاء بـ transfers.create): عامل المستودع «لا صلاحية».

const breadcrumbsFor = (reference: string) => [{ label: "الرئيسية", href: "#" }, { label: "الصرف", href: "#" }, { label: reference }];

const logistics = (reference: string, node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="dispatch" breadcrumbs={breadcrumbsFor(reference)}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "W08",
  name: "تفاصيل الصرف",
  states: [
    {
      key: "in-transit",
      label: "بالطريق",
      when: "صرف بالطريق ينتظر تأكيد المستلم: الأسطر والمستلم والسجل. للوجستي «إلغاء الصرف» ما دام لم يُؤكَّد.",
      node: logistics("TRF-000154", <TransferDetailsDemo initialTransfer={inTransitTransfer} />),
    },
    {
      key: "cancel",
      label: "نافذة الإلغاء",
      when: "«إلغاء الصرف» يفتح نافذة تطلب السبب (إلزامي) والزر معطّل حتى يُكتب. تعود الكميات إلى المستودع، ثم يصير الصرف «ملغى».",
      node: logistics("TRF-000154", <TransferDetailsDemo initialTransfer={inTransitTransfer} initialCancelOpen />),
    },
    {
      key: "received",
      label: "مستلم",
      when: "أكّد المستلم الاستلام (هنا مندوب عبر التطبيق): من أكّد ومتى في السجل، والصرف مرتبط بطلب العينات. لا إلغاء بعد التأكيد.",
      node: logistics("TRF-000156", <TransferDetailsDemo initialTransfer={receivedTransfer} />),
    },
    {
      key: "cancelled",
      label: "ملغى",
      when: "أُلغي الصرف لخطأ في الإدخال: شريط بمن ألغى والسبب وأن الكمية عادت للمستودع، والسجل يذكر الإلغاء بسببه.",
      node: logistics("TRF-000157", <TransferDetailsDemo initialTransfer={cancelledTransfer} />),
    },
    {
      key: "receipt-rejected",
      label: "تأكيد مرفوض بعد الإلغاء",
      when: "مندوب أكّد الاستلام بلا اتصال بعد أن أُلغي الصرف، فرفضته المزامنة: شريط ينبّه اللوجستي وحدث في السجل. الإلغاء نهائي، والحل «صرف جديد».",
      node: logistics("TRF-000149", <TransferDetailsDemo initialTransfer={cancelledRepTransfer} rejectedReceipts={rejectedReceipts} />),
    },
    {
      key: "overdue-48h",
      label: "غير مؤكَّد بعد 48 ساعة",
      when: "بقي «بالطريق» أكثر من 48 ساعة ولم يؤكّد المستلم: شريط تحذير بالساعات ليتابعه اللوجستي مع المستلم.",
      node: logistics("TRF-000158", <TransferDetailsDemo initialTransfer={overdueTransfer} />),
    },
    {
      key: "not-found",
      label: "غير موجود",
      when: "رابط صرف غير موجود أو خارج نطاق المستخدم (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: logistics("صرف", <TransferDetailsDemo initialTransfer={inTransitTransfer} mode="not-found" />),
    },
    ...systemStates({
      loading: logistics("TRF-000154", <TransferDetailsDemo initialTransfer={inTransitTransfer} mode="loading" />),
      error: logistics("TRF-000154", <TransferDetailsDemo initialTransfer={inTransitTransfer} mode="error" />),
      // عامل المستودع لا يملك transfers.create: عنصر الصرف غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="warehouse_worker" activeKey="balances" breadcrumbs={breadcrumbsFor("صرف")}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function TransferDetailsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
