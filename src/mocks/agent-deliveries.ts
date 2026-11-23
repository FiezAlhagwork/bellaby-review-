import type { EditorBatch, EditorItem } from "@/components/data/LineItemsEditor";
import type { AgentReceivables } from "@/features/receivables/views/AgentReceivablesView";
import type { Delivery, Money } from "@/lib/api/types";
import { addDays } from "@/lib/calendar";
import type { Loadable } from "@/lib/loadable";
import { agentBalances } from "./agent";
import { receivablesByAgent, referDelivery, salesDeliveries, salesToday } from "./sales";
import { balanceItems } from "./stock-balances";

// التسليم والتحصيل للوكيل (A08–A11): تسليمات وكالة الياسمين (id 7) من mocks المبيعات، و«اليوم» 10 تشرين الثاني 2026. لا يُنقل للإنتاج.

export const deliveriesToday = salesToday;
export const maxPaymentDays = 30;
export const maxPaymentDate = addDays(salesToday, maxPaymentDays);

export const agentDeliveries: readonly Delivery[] = salesDeliveries.filter((delivery) => delivery.agent?.id === 7);
const byId = (id: number) => agentDeliveries.find((delivery) => delivery.id === id) ?? agentDeliveries[0];
const zaid = { id: 1, name: "زياد المصري" };

export type AgentDeliveryState = "unpaid" | "overdue" | "paid" | "approval-pending" | "cancelled" | "written-off" | "request-rejected" | "referred";

export function agentDeliveryAt(state: AgentDeliveryState): Delivery {
  switch (state) {
    case "unpaid":
      return byId(2103);
    case "overdue":
      return byId(2101);
    case "paid":
      return byId(2104);
    case "approval-pending":
      return byId(2121);
    case "written-off":
      return byId(2120);
    case "cancelled":
      return { ...byId(2103), status: "CANCELLED", decision: { type: "CANCEL", outcome: "APPROVED", reason: "لم يحدث التسليم: أُغلقت الصيدلية يومها.", decided_by: zaid, decided_at: "2026-11-09T10:00:00Z", on_behalf_of: null } };
    case "request-rejected":
      return { ...byId(2103), decision: { type: "WRITE_OFF", outcome: "REJECTED", reason: "الصيدلية ما زالت تعمل. تابع التحصيل.", decided_by: zaid, decided_at: "2026-11-09T10:00:00Z", on_behalf_of: null } };
    case "referred":
      return referDelivery(byId(2101));
  }
}

// ————— A08 —————

const [infant1, infant2, cereal] = balanceItems;
export const deliveryItems: readonly EditorItem[] = [infant1, infant2, cereal].map((item) => ({ id: item.id, name: item.name, type: item.type }));
export const deliveryPrices: Record<string, Money> = { "1": "4.50", "2": "7.20", "3": "3.10" };

/** دفعات رصيد الوكيل لكل صنف بالمتاح (الموقوفة تظهر معطّلة). */
export const deliveryBatches: Record<string, Loadable<readonly EditorBatch[]>> = Object.fromEntries(
  deliveryItems.map((item) => [
    String(item.id),
    {
      status: "ready",
      data: agentBalances
        .filter((line) => line.item?.id === item.id && line.batch && (line.quantity ?? 0) > 0)
        .map((line) => ({ id: line.batch?.id ?? 0, batch_no: line.batch?.batch_no ?? "", expiry_date: line.batch?.expiry_date ?? "", status: line.batch?.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE", available: line.quantity ?? 0 })),
    },
  ]),
);

export const savedDelivery: Delivery = {
  ...byId(2103),
  id: 2130,
  reference: "DLV-001130",
  customer: { id: 1006, name: "صيدلية الرحمة" },
  delivered_at: "2026-11-10T09:12:00Z",
  expected_payment_date: "2026-11-30",
  status: "UNPAID",
  estimated_value: "723.60",
  is_payment_overdue: false,
  decision: null,
  pending_request: null,
};

// ————— A11 —————

const summary = receivablesByAgent.find((row) => row.agent?.id === 7) ?? null;
const unpaid = agentDeliveries.filter((delivery) => delivery.status === "UNPAID");
const byDue = (rows: readonly Delivery[]) => [...rows].sort((a, b) => Number(b.is_payment_overdue) - Number(a.is_payment_overdue) || (a.expected_payment_date ?? "").localeCompare(b.expected_payment_date ?? ""));

export type AgentReceivablesState = "default" | "due-soon" | "overdue";

export function agentReceivablesAt(state: AgentReceivablesState): AgentReceivables {
  const onTime = unpaid.filter((delivery) => !delivery.is_payment_overdue);
  const noOverdue = summary ? { ...summary, overdue_value: "0.00", overdue_deliveries: 0 } : null;
  switch (state) {
    case "default":
      return { summary: noOverdue, unpaid: byDue(onTime) };
    case "due-soon":
      return { summary: noOverdue, unpaid: byDue(onTime.map((delivery) => (delivery.id === 2122 ? { ...delivery, expected_payment_date: "2026-11-12" } : delivery))) };
    case "overdue":
      return { summary, unpaid: byDue(unpaid) };
  }
}
