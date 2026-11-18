import type { CustomerTabsData } from "@/features/customers/views/CustomerDetailsView";
import type { Customer, ListEntry, UserRef, Visit, VisitPoint } from "@/lib/api/types";
import { managerVisitsOfCustomer } from "./manager-visits";
import { customerReturns, salesCustomers, salesDeliveries } from "./sales";
import { huda, omar, samer } from "./supervision";

// صفحة العميل (M05 وA07): العميل وجهة الزيارة المربوطة وزيارات المندوبين لها، وتسليماته ومرتجعاته من `mocks/sales.ts` وزياراتي من `manager-visits.ts`. لا يُنقل للإنتاج.

export const customerToday = "2026-11-10";

/** عميل مربوط بجهة زيارة وله تسليمات (مسدد وغير مسدد) ومرتجعات وزيارة لمدير المبيعات. */
export const linkedCustomerId = 1004;
/** عميل غير مربوط: تسليماته (غير مسدد وطلب شطب) بلا زيارات مندوبين. */
export const unlinkedCustomerId = 1003;

export const findCustomer = (id: number): Customer => salesCustomers.find((customer) => customer.id === id) ?? salesCustomers[0];

const pharmacyType: ListEntry = { id: 3, name: "صيدلية", order: 3, is_active: true };

/** الجهة المربوطة بالعميل (`GET /visit-points/{id}`)؛ null لغير المربوط. */
export function customerPoint(customer: Customer): VisitPoint | null {
  if (!customer.visit_point_id) return null;
  return {
    id: customer.visit_point_id,
    type: pharmacyType,
    specialty: null,
    name: customer.name,
    phone: customer.phone,
    governorate: customer.governorate,
    address: customer.address,
    location: { lat: 33.5, lng: 36.29, accuracy_m: 9 },
    status: "ACTIVE",
    review_state: "ACCEPTED",
    merged_into_id: null,
    customer_id: customer.id,
    created_by: customer.created_by,
    created_at: customer.created_at,
    last_visit_at: "2026-11-08T10:15:00Z",
    next_action: "عرض المرحلة الثانية الجديدة وأخذ طلب نهاية الشهر.",
  };
}

const purpose = (id: number, name: string): ListEntry => ({ id, name, order: id, is_active: true });

function repVisit(id: number, rep: UserRef, startedAt: string, why: ListEntry, outcome: ListEntry | null, point: VisitPoint): Visit {
  return { id, rep, visit_point: { id: point.id, name: point.name, type: point.type?.name, status: point.status }, status: "COMPLETED", started_at: startedAt, purpose: why, outcome, verification_status: "OK" };
}

/** زيارات المندوبين للجهة المربوطة (`GET /visits?visit_point_id=`): الأحدث أولاً. */
export function repVisitsOf(customer: Customer): readonly Visit[] {
  const point = customerPoint(customer);
  if (!point) return [];
  return [
    repVisit(8801, samer, "2026-11-08T10:15:00Z", purpose(2, "متابعة طلب"), purpose(1, "وعد بالتجربة"), point),
    repVisit(8802, omar, "2026-11-05T09:40:00Z", purpose(1, "تعريف بالمنتجات"), purpose(3, "لا اهتمام حالياً"), point),
    repVisit(8803, huda, "2026-11-02T11:05:00Z", purpose(3, "توزيع عينات"), purpose(2, "طلب عينات"), point),
  ];
}

export function customerTabs(id: number): CustomerTabsData {
  const customer = findCustomer(id);
  return {
    deliveries: { status: "ready", data: salesDeliveries.filter((delivery) => delivery.customer?.id === id).sort((a, b) => Date.parse(b.delivered_at ?? "") - Date.parse(a.delivered_at ?? "")) },
    returns: { status: "ready", data: customerReturns.filter((entry) => entry.customer?.id === id) },
    repVisits: { status: "ready", data: repVisitsOf(customer) },
    myVisits: { status: "ready", data: managerVisitsOfCustomer(id) },
  };
}
