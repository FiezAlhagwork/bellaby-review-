import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { batchExistsForm, batchMismatchForm, expiredForm, filledForm, nearExpiryForm, savedReceipt, validationErrors, validationForm } from "@/mocks/stock-receipt-form";
import { StockReceiptFormDemo } from "./StockReceiptFormDemo";

// W04 · إدخال بضاعة. الحالات في SCREENS.md، ومعها حالة أخطاء الخادم والحالات العامة. النموذج في الصفحة تفاعلي: عدّل الأسطر ثم «إدخال».
// الإدخال للوجستي وحده (صلاحية stock.receive، القرار 8): عامل المستودع «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الإدخال", href: "#" }, { label: "إدخال بضاعة" }];

const logistics = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="stock-intake" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "W04",
  name: "إدخال بضاعة",
  states: [
    {
      key: "empty",
      label: "فارغ",
      when: "نموذج جديد: الموقع وسطر واحد فارغ. زر «إدخال» معطّل وسببه ظاهر تحته. جرّب ملء الأسطر وإضافة سطر.",
      node: logistics(<StockReceiptFormDemo />),
    },
    {
      key: "filled",
      label: "معبّأ",
      when: "سطران جديدان سليمان وملاحظة: الزر مفعّل. «إدخال» يعرض ملخص النتيجة.",
      node: logistics(<StockReceiptFormDemo initialForm={filledForm} />),
    },
    {
      key: "expired",
      label: "منتهٍ",
      when: "تاريخ الانتهاء مضى: «لا يُدخل منتهٍ» تحت السطر، والزر معطّل حتى يُصحَّح.",
      node: logistics(<StockReceiptFormDemo initialForm={expiredForm} />),
    },
    {
      key: "near-expiry",
      label: "قريب الانتهاء",
      when: "تاريخ الانتهاء خلال 60 يوماً: تحذير تحت السطر وشريط يطلب تأكيداً. الزر معطّل حتى تضع علامة التأكيد.",
      node: logistics(<StockReceiptFormDemo initialForm={nearExpiryForm} />),
    },
    {
      key: "batch-exists",
      label: "دفعة موجودة",
      when: "رقم الدفعة موجود لهذا الصنف بالتاريخ نفسه: «تُضاف الكمية للدفعة». الإدخال مسموح، والنتيجة تذكر أنها أُضيفت لدفعة موجودة.",
      node: logistics(<StockReceiptFormDemo initialForm={batchExistsForm} />),
    },
    {
      key: "batch-mismatch",
      label: "تعارض تاريخ",
      when: "الرقم مسجّل بتاريخ انتهاء مختلف: «راجع العلبة» مع التاريخ المسجّل. الزر معطّل.",
      node: logistics(<StockReceiptFormDemo initialForm={batchMismatchForm} />),
    },
    {
      key: "validation-failed",
      label: "أخطاء الخادم",
      when: "الخادم رفض بيانات ناقصة (validation_failed): نص كل خطأ تحت حقله كما يرجع.",
      node: logistics(<StockReceiptFormDemo initialForm={validationForm} initialErrors={validationErrors} />),
    },
    {
      key: "saved",
      label: "تم الإدخال",
      when: "بعد نجاح الإدخال: رقم الإدخال، وما أُنشئ من دفعات جديدة وما أُضيف لدفعة موجودة، و«إدخال آخر» أو «سجل الإدخال».",
      node: logistics(<StockReceiptFormDemo initialSaved={savedReceipt} />),
    },
    ...systemStates({
      loading: logistics(<StockReceiptFormDemo mode="loading" />),
      // لا قوائم خيارات فارغة هنا: المستودعات والأصناف موجودة دائماً، فلا حالة «فراغ» لهذه الشاشة.
      error: logistics(<StockReceiptFormDemo mode="error" />),
      // عامل المستودع لا يملك stock.receive: عنصر الإدخال غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
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

export default function StockReceiptPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
