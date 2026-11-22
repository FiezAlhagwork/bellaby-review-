import type { LegalDocument, UserRef } from "@/lib/api/types";

// الوثائق القانونية (I15–I17). اليوم 18 تشرين الثاني 2026. القريبة الانتهاء ما بقي على انتهائها أقل من مدة تنبيهها. لا يُنقل للإنتاج.

export const legalToday = "2026-11-18";

const lina: UserRef = { id: 60, name: "لينا الخطيب" };

const file = (id: string, name: string) => ({ upload_id: id, url: `https://files.trust.example/legal/${id}`, name, mime: "application/pdf" });

type Def = Pick<LegalDocument, "id" | "title" | "category" | "parties" | "starts_on" | "expires_on" | "alert_days" | "status"> & { file: string; createdAt: string };

const defs: Def[] = [
  { id: 101, title: "عقد وكالة توزيع — دمشق", category: "AGENT_CONTRACT", parties: ["شركة Trust", "وكالة الياسمين للتوزيع"], starts_on: "2026-01-01", expires_on: "2026-12-10", alert_days: 30, status: "EXPIRING", file: "agent-yasmine.pdf", createdAt: "2025-12-20T09:00:00Z" },
  { id: 102, title: "عقد وكالة توزيع — حلب", category: "AGENT_CONTRACT", parties: ["شركة Trust", "مؤسسة النور للتوزيع"], starts_on: "2026-03-01", expires_on: "2027-02-28", alert_days: 30, status: "ACTIVE", file: "agent-nour.pdf", createdAt: "2026-02-20T09:00:00Z" },
  { id: 103, title: "عقد تصنيع الحليب المرحلة 1", category: "MANUFACTURING_CONTRACT", parties: ["شركة Trust", "مصنع الشرق للأغذية"], starts_on: "2025-06-01", expires_on: "2027-05-31", alert_days: 60, status: "ACTIVE", file: "manufacturing-east.pdf", createdAt: "2025-05-25T09:00:00Z" },
  { id: 104, title: "تسجيل العلامة التجارية Bellaby", category: "TRADEMARK", parties: ["شركة Trust", "مديرية حماية الملكية"], starts_on: "2021-04-15", expires_on: "2031-04-14", alert_days: 90, status: "ACTIVE", file: "trademark-bellaby.pdf", createdAt: "2021-04-20T09:00:00Z" },
  { id: 105, title: "ترخيص مستودع دمشق", category: "LICENSE", parties: ["شركة Trust", "وزارة الصحة"], starts_on: "2025-12-01", expires_on: "2026-11-30", alert_days: 30, status: "EXPIRING", file: "license-warehouse.pdf", createdAt: "2025-12-02T09:00:00Z" },
  { id: 106, title: "عقد توريد عبوات", category: "SUPPLIER_CONTRACT", parties: ["شركة Trust", "شركة الأمل للتغليف"], starts_on: "2025-10-01", expires_on: "2026-09-30", alert_days: 30, status: "EXPIRED", file: "supplier-packaging.pdf", createdAt: "2025-09-28T09:00:00Z" },
  { id: 107, title: "عقد خدمة صيانة البرادات", category: "SERVICE_CONTRACT", parties: ["شركة Trust", "شركة التبريد الحديث"], starts_on: "2026-01-01", expires_on: "2026-12-31", alert_days: 15, status: "INTENTIONALLY_EXPIRED", file: "service-cooling.pdf", createdAt: "2025-12-28T09:00:00Z" },
  { id: 108, title: "عقد عمل — رامي السيد", category: "EMPLOYEE_CONTRACT", parties: ["شركة Trust", "رامي السيد"], starts_on: "2026-02-01", expires_on: "2027-01-31", alert_days: 30, status: "ACTIVE", file: "employee-rami.pdf", createdAt: "2026-01-30T09:00:00Z" },
  { id: 109, title: "السجل التجاري", category: "OFFICIAL_PAPER", parties: ["شركة Trust"], starts_on: "2024-01-10", expires_on: null, alert_days: 30, status: "ACTIVE", file: "commercial-register.pdf", createdAt: "2024-01-12T09:00:00Z" },
  { id: 110, title: "إنذار صيدلية الشفاء", category: "WARNING", parties: ["شركة Trust", "صيدلية الشفاء"], starts_on: "2026-10-20", expires_on: null, alert_days: 30, status: "ACTIVE", file: "warning-shifa.pdf", createdAt: "2026-10-20T09:00:00Z" },
];

const build = (def: Def): LegalDocument => ({
  id: def.id,
  title: def.title,
  category: def.category,
  parties: def.parties,
  version: 1,
  versions: [{ version: 1, reason: "الإضافة الأولى.", file: file(`f-${def.id}-1`, def.file), created_at: def.createdAt, by: lina }],
  starts_on: def.starts_on,
  expires_on: def.expires_on,
  alert_days: def.alert_days,
  status: def.status,
  intentional_expiry_reason: def.status === "INTENTIONALLY_EXPIRED" ? "أُلغي العقد باتفاق الطرفين بعد نقل الصيانة إلى فريق داخلي." : null,
});

/** عقد دمشق بثلاث نسخ: الأصل، وتعديل الأطراف، والتجديد الأخير. قريب الانتهاء. */
export const agentContract = {
  ...build(defs[0]),
  version: 3,
  versions: [
    { version: 3, reason: "تجديد لسنة 2026.", file: file("f-101-3", "agent-yasmine-2026.pdf"), created_at: "2025-12-20T09:00:00Z", by: lina },
    { version: 2, reason: "تعديل نسبة العمولة بملحق.", file: file("f-101-2", "agent-yasmine-annex.pdf"), created_at: "2025-06-03T09:00:00Z", by: lina },
    { version: 1, reason: "الإضافة الأولى.", file: file("f-101-1", "agent-yasmine.pdf"), created_at: "2025-01-02T09:00:00Z", by: lina },
  ],
} satisfies LegalDocument;

/** القائمة كما يرجعها GET /legal-documents، وعقد دمشق بنسخه الثلاث. */
export const legalDocuments: readonly LegalDocument[] = defs.map((def) => (def.id === agentContract.id ? agentContract : build(def)));

export const activeDocument = legalDocuments.find((doc) => doc.id === 102) as LegalDocument;
export const expiredDocument = legalDocuments.find((doc) => doc.id === 106) as LegalDocument;
export const intentionallyExpiredDocument = legalDocuments.find((doc) => doc.id === 107) as LegalDocument;
export const legalAuthor = lina;
