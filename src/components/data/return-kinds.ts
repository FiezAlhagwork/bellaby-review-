// أنواع قرارات المرتجع والتالف الأربعة (M08) وأسماء قراراتها، في مكان واحد كجدول الحالات. لا تُكتب في أي شاشة.
// «تالف وكيل» و«تالف مستودع» كلاهما `GET /damage-reports` يُقسم بنوع موقع التقرير (docs/backend-requests.md §47.1).

export type ReturnKind = "customer-return" | "agent-damage" | "warehouse-damage" | "agent-return";

export const returnKindLabels = {
  "customer-return": "مرتجع صيدلية",
  "agent-damage": "تالف وكيل",
  "warehouse-damage": "تالف مستودع",
  "agent-return": "إرجاع وكيل",
} as const satisfies Record<ReturnKind, string>;

export const returnKindOrder = ["customer-return", "agent-damage", "warehouse-damage", "agent-return"] as const satisfies readonly ReturnKind[];

/** قرار مرتجع الصيدلية (`POST /customer-returns/{id}/decision`): `RESTOCKED` و`DAMAGED` و`REJECTED`. */
export type CustomerReturnDecision = "RESTOCKED" | "DAMAGED" | "REJECTED";

export const customerReturnDecisionLabels = {
  RESTOCKED: { title: "أُعيد للمخزون", hint: "تعود الكمية صالحة إلى رصيد الوكيل." },
  DAMAGED: { title: "تالف بمسؤوليته", hint: "تُحدَّد المسؤولية للعلم، ولا ذمة مالية بها." },
  REJECTED: { title: "رفض بسبب", hint: "يُكتب السبب ويُعاد للوكيل." },
} as const satisfies Record<CustomerReturnDecision, { title: string; hint: string }>;
