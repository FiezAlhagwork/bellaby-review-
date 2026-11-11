import { navItems, visibleNavItems, type NavItem } from "@/config/navigation";
import type { Me, RoleRef } from "@/lib/api/types";

// مستخدمون وهميون لإطار اللوحة (G02) وكل شاشة تحتاج قائمة دورها. لا يُنقل للإنتاج.
// عناصر كل دور من SCREENS.md ي.1، وصلاحياته مشتقة منها (أول مفتاح من كل عنصر)، ثم يتحقق هذا الملف عند التحميل أن القائمة
// المصفّاة بهذه الصلاحيات هي عناصر الدور بالضبط، فلا يتسرّب عنصر دور لدور آخر.

export type RoleKey =
  | "agent"
  | "logistics"
  | "warehouse_worker"
  | "supervisor"
  | "monitoring"
  | "sales_manager"
  | "scientific_manager"
  | "executive"
  | "it"
  | "accountant"
  | "legal";

type RoleSpec = { role: RoleRef; headOfDepartment: boolean; items: readonly string[] };

const roles: Record<RoleKey, RoleSpec> = {
  agent: {
    role: { id: 1, key: "agent", name: "الوكيل" },
    headOfDepartment: false,
    items: ["home-agent", "agent-receipts", "agent-stock", "agent-customers", "agent-deliveries", "agent-receivables", "agent-returns", "agent-return-to-warehouse", "my-leaves"],
  },
  logistics: {
    role: { id: 2, key: "logistics", name: "اللوجستي" },
    headOfDepartment: true,
    items: ["home-warehouse", "balances", "movements", "stock-intake", "dispatch", "warehouse-sample-requests", "withdraw-requests", "agent-returns-warehouse", "stock-counts", "batches", "warehouse-damage", "tasks", "leaves", "periodic-reports", "my-leaves", "department-requests"],
  },
  warehouse_worker: {
    role: { id: 3, key: "warehouse_worker", name: "عامل المستودع" },
    headOfDepartment: false,
    items: ["home-warehouse", "balances", "stock-counts", "tasks", "my-leaves"],
  },
  supervisor: {
    role: { id: 4, key: "supervisor", name: "السوبرفايزر" },
    headOfDepartment: false,
    items: ["home-supervisor", "daily-reports", "attendance", "visits", "leaves", "tasks", "my-leaves"],
  },
  monitoring: {
    role: { id: 5, key: "monitoring", name: "المراقبة" },
    headOfDepartment: true,
    items: ["flags", "new-places", "investigations", "visits", "report-review", "complaints", "audit", "tasks", "my-leaves", "department-requests"],
  },
  sales_manager: {
    role: { id: 6, key: "sales_manager", name: "مدير المبيعات" },
    headOfDepartment: true,
    items: ["home-sales-manager", "pending", "agents", "manager-customers", "manager-deliveries", "manager-receivables", "return-decisions", "my-visits", "site-messages", "plan", "periodic-reports", "tasks", "my-leaves", "department-requests"],
  },
  scientific_manager: {
    role: { id: 7, key: "scientific_manager", name: "مدير المكتب العلمي" },
    headOfDepartment: true,
    items: ["home-scientific-manager", "reps", "visits", "daily-reports", "visit-places", "market-intel", "scientific-sample-balances", "scientific-sample-requests", "plan", "periodic-reports", "leaves", "tasks", "my-leaves", "department-requests"],
  },
  executive: {
    role: { id: 8, key: "executive", name: "المدير التنفيذي" },
    headOfDepartment: true,
    items: ["home-executive", "pending", "budget", "deductions", "month-close", "manual-rating", "points", "month-winner", "items", "batches", "users", "periodic-reports", "tasks", "settings", "delegation", "audit", "my-leaves", "department-requests"],
  },
  it: {
    role: { id: 9, key: "it", name: "IT" },
    headOfDepartment: true,
    items: ["users", "roles", "devices", "device-requests", "attempts", "blocks", "app-versions", "site-content", "tasks", "periodic-reports", "my-leaves", "department-requests"],
  },
  accountant: {
    role: { id: 10, key: "accountant", name: "المحاسب" },
    headOfDepartment: true,
    items: ["home-accountant", "actual-expense", "attendance-report", "deductions-report", "leaves", "tasks", "my-leaves", "department-requests"],
  },
  legal: {
    role: { id: 11, key: "legal", name: "القانوني" },
    headOfDepartment: true,
    items: ["legal-documents", "disputes", "tasks", "periodic-reports", "my-leaves", "department-requests"],
  },
};

const itemByKey = new Map<string, NavItem>(navItems.map((item) => [item.key, item]));

/** صلاحيات الدور: أول مفتاح من كل عنصر من عناصره. */
export function rolePermissions(key: RoleKey): string[] {
  const permissions = roles[key].items.map((itemKey) => {
    const item = itemByKey.get(itemKey);
    if (!item) throw new Error(`عنصر قائمة غير معرّف: ${itemKey}`);
    return typeof item.permission === "string" ? item.permission : item.permission[0];
  });
  return [...new Set(permissions)];
}

export const roleName = (key: RoleKey) => roles[key].role.name;

// التحقق: ما تعرضه القائمة لكل دور هو عناصره وحدها.
for (const key of Object.keys(roles) as RoleKey[]) {
  const shown = new Set(visibleNavItems(rolePermissions(key)).map((item) => item.key));
  const expected = new Set(roles[key].items);
  const extra = [...shown].filter((item) => !expected.has(item));
  const missing = [...expected].filter((item) => !shown.has(item));
  if (extra.length || missing.length) throw new Error(`قائمة ${key}: زائد [${extra}] وناقص [${missing}]`);
}

const damascus = { id: 1, name: "دمشق" };

/** مستخدم وبقية ما يصل مع الإطار: العدّادات (من /notifications و/me/pending-decisions). */
type ShellUser = { me: Me; unreadCount: number; pendingCount?: number };

function makeMe(id: number, name: string, email: string, key: RoleKey, extra: Partial<Me> = {}): Me {
  const spec = roles[key];
  return {
    id,
    name,
    type: "WEB",
    email,
    role: spec.role,
    is_department_head: spec.headOfDepartment,
    governorates: [damascus],
    permissions: rolePermissions(key),
    ...extra,
  } satisfies Me;
}

const delegation = { id: 3, from: "2026-11-10", to: "2026-11-15" } satisfies NonNullable<Me["active_delegation"]>;

export type ShellUserKey = "agent" | "executive" | "delegate" | "logistics" | "warehouse_worker";

export const shellUsers: Record<ShellUserKey, ShellUser> = {
  logistics: { me: makeMe(3, "رامي السيد", "rami@trust.example", "logistics", { department: "LOGISTICS" }), unreadCount: 2 },
  warehouse_worker: { me: makeMe(5, "سليم القاسم", "salim@trust.example", "warehouse_worker", { department: "LOGISTICS" }), unreadCount: 1 },
  agent: { me: makeMe(41, "ياسر الحمصي", "yasser@yasmine-distribution.example", "agent"), unreadCount: 3 },
  executive: { me: makeMe(1, "زياد المصري", "ziad@trust.example", "executive", { department: "EXECUTIVE" }), unreadCount: 8, pendingCount: 7 },
  /** مدير المبيعات مفوَّض عن المدير التنفيذي: يرى بانتظار قراري، وصلاحيات التفويض داخل permissions. */
  delegate: {
    me: makeMe(6, "رنا الشامي", "rana@trust.example", "sales_manager", { department: "SALES", active_delegation: delegation }),
    unreadCount: 5,
    pendingCount: 4,
  },
};

/** من فوّض المدير التنفيذي (لحالة delegation-given). الاسم من التفويض نفسه، ومصدره سؤال للباك (docs/backend-requests.md). */
export const executiveDelegate = { name: "رنا الشامي", to: delegation.to };
