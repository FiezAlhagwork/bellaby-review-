import type { DeactivationPreview, Governorate, Profile, Role, User, UserRef } from "@/lib/api/types";

// المستخدمون (I01–I03): GET /users، وGET /users/{id}، و/profile، و/deactivation-preview. لا تُنقل للإنتاج.

export const usersToday = "2026-11-18";

const gov = (id: number, name: string): Governorate => ({ id, name });
const damascus = gov(5, "دمشق");
const rifDimashq = gov(6, "ريف دمشق");
const aleppo = gov(1, "حلب");
const homs = gov(3, "حمص");
const latakia = gov(10, "اللاذقية");

export const governorateOptions: readonly Governorate[] = [aleppo, gov(2, "إدلب"), homs, gov(4, "حماة"), damascus, rifDimashq, gov(7, "درعا"), latakia, gov(11, "طرطوس")];

const role = (id: number, key: string, name: string, platform: "WEB" | "REP", users: number, system = true): Role => ({ id, key, name, platform, is_system: system, users_count: users, job_description: null, permissions: [] });

export const rolesList = [
  role(8, "executive", "المدير التنفيذي", "WEB", 1),
  role(6, "sales_manager", "مدير المبيعات", "WEB", 1),
  role(40, "scientific_manager", "مدير المكتب العلمي", "WEB", 1),
  role(4, "supervisor", "السوبرفايزر", "WEB", 3),
  role(5, "monitoring", "المراقبة", "WEB", 2),
  role(2, "logistics", "اللوجستي", "WEB", 1),
  role(3, "warehouse_worker", "عامل المستودع", "WEB", 2),
  role(10, "accountant", "المحاسب", "WEB", 1),
  role(11, "legal", "القانوني", "WEB", 1),
  role(9, "it", "IT", "WEB", 1),
  role(1, "agent", "الوكيل", "WEB", 5),
  role(12, "rep", "المندوب", "REP", 12),
] satisfies Role[];

const ref = (id: number) => rolesList.find((item) => item.id === id) ?? rolesList[0];
const roleRef = (id: number) => {
  const found = ref(id);
  return { id: found.id, key: found.key, name: found.name };
};

const ziad: UserRef = { id: 1, name: "زياد المصري" };
const heba: UserRef = { id: 40, name: "د. هبة الأحمد" };
const maher: UserRef = { id: 8, name: "ماهر الأتاسي" };
const rana: UserRef = { id: 6, name: "رنا الشامي" };

type Extra = Partial<User>;
const web = (id: number, name: string, email: string, roleId: number, department: User["department"], extra: Extra = {}): User => ({
  id,
  name,
  type: "WEB",
  email,
  phone: null,
  role: roleRef(roleId),
  department,
  is_department_head: false,
  manager: ziad,
  agent: null,
  governorates: [damascus],
  is_active: true,
  last_login_at: "2026-11-18T06:40:00Z",
  last_sync_at: null,
  created_at: "2025-02-01T09:00:00Z",
  ...extra,
});
const rep = (id: number, name: string, phone: string, governorates: Governorate[], extra: Extra = {}): User => ({
  id,
  name,
  type: "REP",
  email: null,
  phone,
  role: roleRef(12),
  department: "SCIENTIFIC_OFFICE",
  is_department_head: false,
  manager: maher,
  agent: null,
  governorates,
  is_active: true,
  last_login_at: "2026-11-18T05:12:00Z",
  last_sync_at: "2026-11-18T08:55:00Z",
  created_at: "2025-06-10T09:00:00Z",
  ...extra,
});

export const usersList = [
  web(1, "زياد المصري", "ziad@trust.example", 8, "EXECUTIVE", { is_department_head: true, manager: null, governorates: [] }),
  web(6, "رنا الشامي", "rana@trust.example", 6, "SALES", { is_department_head: true }),
  web(40, "د. هبة الأحمد", "heba@trust.example", 40, "SCIENTIFIC_OFFICE", { is_department_head: true }),
  web(8, "ماهر الأتاسي", "maher@trust.example", 4, "SCIENTIFIC_OFFICE", { manager: heba, governorates: [damascus, rifDimashq] }),
  web(14, "نادين الصبّاغ", "nadine@trust.example", 4, "SCIENTIFIC_OFFICE", { manager: heba, governorates: [aleppo], last_login_at: "2026-11-17T15:20:00Z" }),
  web(50, "جمال الحكيم", "jamal@trust.example", 5, "MONITORING", { is_department_head: true }),
  web(3, "رامي السيد", "rami@trust.example", 2, "LOGISTICS", { is_department_head: true }),
  web(5, "سليم القاسم", "salim@trust.example", 3, "LOGISTICS", { manager: { id: 3, name: "رامي السيد" } }),
  web(7, "هالة يوسف", "hala@trust.example", 10, "ACCOUNTING", { is_department_head: true }),
  web(9, "طارق النحاس", "tarek@trust.example", 9, "IT", { is_department_head: true }),
  web(41, "ياسر الحمصي", "yasser@yasmine-distribution.example", 1, null, { manager: rana, agent: { id: 1, name: "توزيع الياسمين" }, governorates: [damascus, rifDimashq] }),
  rep(21, "سامر العلي", "+963944123456", [damascus]),
  rep(22, "عمر الخطيب", "+963933765432", [rifDimashq], { last_sync_at: "2026-11-16T17:30:00Z" }),
  rep(23, "هدى العلي", "+963955112233", [homs], { manager: { id: 14, name: "نادين الصبّاغ" } }),
  rep(24, "مازن درويش", "+963988445566", [latakia], { is_active: false, last_login_at: "2026-10-02T07:10:00Z", last_sync_at: "2026-10-02T16:00:00Z" }),
  web(16, "لينا قبّاني", "lina@trust.example", 3, "LOGISTICS", { is_active: false, manager: { id: 3, name: "رامي السيد" }, last_login_at: "2026-08-30T10:00:00Z" }),
] satisfies User[];

export const findUser = (id: number): User => {
  const found = usersList.find((user) => user.id === id);
  if (!found) throw new Error(`مستخدم غير معرّف في المعرض: ${id}`);
  return found;
};

/** المرشّحون للمدير المباشر: مستخدمو الويب المفعّلون. */
export const managerOptions: readonly UserRef[] = usersList.filter((user) => user.type === "WEB" && user.is_active && user.role?.key !== "agent").map((user) => ({ id: user.id, name: user.name }));

export const agentOptions = [
  { id: 1, name: "توزيع الياسمين" },
  { id: 2, name: "مؤسسة النور" },
  { id: 3, name: "الساحل للأدوية" },
] as const;

/** العقد والراتب (يظهر للمدير التنفيذي ومدير المحاسبة وحدهما). */
export function profileOf(user: User, withContract: boolean): Profile {
  return {
    user,
    job_description: null,
    contract: withContract ? { file: { upload_id: "5b1c2d3e-0000-4000-8000-000000000021", name: "عقد-سامر-العلي-2026.pdf", mime: "application/pdf", url: "https://files.trust.example/contracts/21.pdf" }, starts_on: "2026-01-01", ends_on: "2026-12-31", salary: "450.00" } : null,
    scores: [],
    deductions: [],
    open_tasks: 2,
  };
}

const infant1 = { id: 1, name: "حليب أطفال مرحلة 1 — 400غ", sku: "BL-INF1-400", type: "PRODUCT" as const };
const sample = { id: 4, name: "عينة حليب مرحلة 1 — 50غ", sku: "BL-S1-50", type: "SAMPLE" as const };

/** المندوب سامر: عليه رصيد عينات (rep-active-warning). */
export const repPreview = {
  balance: [
    { location: { id: 21, type: "REP", name: "سامر العلي" }, item: sample, batch: { id: 62, batch_no: "LOT-2609-S", expiry_date: "2027-03-31", status: "ACTIVE" }, quantity: 18, in_transit_out: 0 },
    { location: { id: 21, type: "REP", name: "سامر العلي" }, item: infant1, batch: { id: 33, batch_no: "LOT-2610-A", expiry_date: "2027-09-30", status: "ACTIVE" }, quantity: 6, in_transit_out: 0 },
  ],
  last_sync_at: "2026-11-18T08:55:00Z",
  open_tasks_assigned_to: 1,
  open_tasks_assigned_by: 0,
  open_requests: 1,
  unpaid_deliveries_value: null,
  pending_documents: [{ type: "transfer", id: 812, status: "IN_TRANSIT" }],
} satisfies DeactivationPreview;

/** موظف ويب بلا رصيد: مهام أسندها فقط. */
export const webPreview = {
  balance: [],
  last_sync_at: null,
  open_tasks_assigned_to: 2,
  open_tasks_assigned_by: 3,
  open_requests: 0,
  unpaid_deliveries_value: null,
  pending_documents: [],
} satisfies DeactivationPreview;
