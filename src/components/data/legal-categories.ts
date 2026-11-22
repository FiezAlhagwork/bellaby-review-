import type { LegalDocumentCategory } from "@/lib/api/types";

/** فئات الوثائق القانونية (`LegalDocument.category`) بالعربية، وترتيبها في القوائم. */
export const legalCategoryLabels = {
  AGENT_CONTRACT: "عقد وكيل",
  MANUFACTURING_CONTRACT: "عقد تصنيع",
  EMPLOYEE_CONTRACT: "عقد موظف",
  SUPPLIER_CONTRACT: "عقد مورّد",
  PARTNER_CONTRACT: "عقد شريك",
  SERVICE_CONTRACT: "عقد خدمة",
  TRADEMARK: "علامة تجارية",
  LICENSE: "ترخيص",
  OFFICIAL_PAPER: "ورقة رسمية",
  WARNING: "إنذار",
} satisfies Record<LegalDocumentCategory, string>;

export const legalCategoryOrder = Object.keys(legalCategoryLabels) as LegalDocumentCategory[];
