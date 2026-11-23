import type { LinkSuggestion } from "@/features/customers/views/CustomerFormView";
import type { Customer, Governorate } from "@/lib/api/types";
import { salesCustomers } from "./sales";

// عملاء الوكيل (A05–A07): عملاء وكالة الياسمين (id 7) من mocks المبيعات، في دمشق وريفها. لا يُنقل للإنتاج.

export const agentCustomers: readonly Customer[] = salesCustomers.filter((customer) => customer.agent?.id === 7);

/** محافظات الوكيل: من عملائه (في الإنتاج من `me.governorates`). */
export const agentGovernorates: readonly Governorate[] = [...new Map(agentCustomers.flatMap((customer) => (customer.governorate ? [[customer.governorate.id, customer.governorate] as const] : []))).values()];

/** «صيدلية الزهراء» تشابه جهة زيارة بالاسم نفسه في دمشق. */
export const linkSuggestion: LinkSuggestion = { visit_point_id: 531, name: "صيدلية الزهراء", address: "دمشق، ركن الدين، ساحة شمدين", similarity: 0.94 };
