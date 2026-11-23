import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { DeliveryFormDemo } from "./DeliveryFormDemo";

// A08 · تسجيل تسليم. الحالات في SCREENS.md (empty وfilled وover-balance وpayment-date-limit وreview وsaved). القراران 2 و7.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-deliveries" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "التسليمات", href: "#" }, { label: "تسليم جديد" }]}>
    {node}
  </ShellScreen>
);

const filled = {
  customerId: "1006",
  expectedPaymentDate: "2026-11-30",
  note: "",
  lines: [
    { id: "line-1", itemId: 1, batchId: 31, quantity: 60 },
    { id: "line-2", itemId: 2, batchId: 41, quantity: 48 },
  ],
};

const screen: ScreenDefinition = {
  id: "A08",
  name: "تسجيل تسليم",
  states: [
    { key: "empty", label: "فارغ", when: "العميل، وسطر فارغ، وتاريخ السداد المتوقع حتى 30 يوماً.", node: shell(<DeliveryFormDemo />) },
    { key: "filled", label: "معبّأ", when: "صيدلية الرحمة بسطرين بالدفعة الأقرب انتهاءً، والسداد 30 تشرين الثاني.", node: shell(<DeliveryFormDemo initialForm={filled} />) },
    { key: "over-balance", label: "أكثر من الرصيد", when: "كمية أكبر من المتاح في الدفعة: نص الخادم تحت السطر (422).", node: shell(<DeliveryFormDemo initialForm={{ ...filled, lines: [{ ...filled.lines[0], quantity: 140 }, filled.lines[1]] }} initialErrors={{ "lines.0.quantity": "الكمية أكبر من رصيدك في الدفعة (96 علبة)." }} />) },
    { key: "payment-date-limit", label: "حد مهلة السداد", when: "بعد 10 كانون الأول (30 يوماً) الأيام معطّلة في منتقي التاريخ.", node: shell(<DeliveryFormDemo initialForm={{ ...filled, expectedPaymentDate: "2026-12-10" }} />) },
    { key: "review", label: "المراجعة", when: "قبل التأكيد: الأسطر بسعر العلبة للعرض فقط، والقيمة يحسبها الخادم عند التأكيد.", node: shell(<DeliveryFormDemo initialForm={filled} initialStep="review" />) },
    { key: "saved", label: "حُفظ", when: "حُفظ «غير مسدد» بقيمته التقديرية من الخادم.", node: shell(<DeliveryFormDemo saved />) },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function NewDeliveryPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}
