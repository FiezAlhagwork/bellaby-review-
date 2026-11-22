import type { Permission, PermissionGroup, Role } from "@/lib/api/types";
import { rolePermissions, type RoleKey } from "./shell-users";
import { rolesList } from "./users";

// الأدوار والصلاحيات (I04): GET /roles وGET /permissions. المفاتيح من أوصاف openapi.yml، والتجميع بالوحدة وأسماؤها من الخادم. لا تُنقل للإنتاج.

const p = (key: string, label: string, delegable = false): Permission => ({ key, label, delegable });

export const permissionModules = [
  { module: "stock", module_label: "المخزون والصرف", permissions: [p("transfers.create", "إنشاء صرف"), p("transfers.receive", "استلام صرف"), p("stock.receive", "إدخال بضاعة"), p("stock_counts.create", "فتح جرد"), p("stock_counts.count", "عدّ الجرد"), p("stock_counts.approve", "اعتماد الجرد", true), p("batches.suspend", "إيقاف دفعة"), p("batches.unsuspend", "فك إيقاف دفعة")] },
  { module: "sales", module_label: "المبيعات والوكلاء", permissions: [p("deliveries.create", "إنشاء تسليم"), p("deliveries.approve", "اعتماد التسليم", true), p("deliveries.collect", "تحصيل"), p("returns.create", "إنشاء مرتجع"), p("returns.decide", "قرار المرتجع والتالف", true), p("agents.manage", "إدارة الوكلاء")] },
  { module: "field", module_label: "العمل الميداني", permissions: [p("visits.decide", "قرار الزيارة المشكوك فيها"), p("visit_points.manage", "إدارة نقاط الزيارة"), p("visit_points.merge", "دمج نقاط مكرّرة"), p("daily_reports.rate", "تقييم التقرير اليومي"), p("plans.approve", "اعتماد الخطة", true), p("sample_requests.create", "طلب عينات")] },
  { module: "finance", module_label: "المالية والنقاط", permissions: [p("budgets.manage", "إدارة الميزانية"), p("deductions.create", "إنشاء خصم"), p("expenses.enter", "إدخال المصروف الفعلي"), p("ratings.manual", "التقييم اليدوي"), p("month_winners.approve", "اعتماد موظف الشهر")] },
  { module: "admin", module_label: "الإدارة والإعدادات", permissions: [p("users.view", "عرض المستخدمين"), p("users.manage", "إدارة المستخدمين"), p("roles.manage", "إدارة الأدوار"), p("devices.manage", "إدارة الأجهزة"), p("security.manage", "المحاولات والحظر"), p("settings.manage", "الإعدادات العامة"), p("delegations.manage", "التفويض")] },
] satisfies PermissionGroup[];

/** الأدوار بصلاحياتها ووصف مهامها (القائمة في mocks/users.ts بلا صلاحيات). */
const details: Readonly<Record<string, Pick<Role, "permissions" | "job_description">>> = {
  logistics: { job_description: "يدير المستودع: الإدخال والصرف والجرد وإيقاف الدفعات.", permissions: ["transfers.create", "stock.receive", "stock_counts.create", "batches.suspend"] },
  supervisor: { job_description: "يشرف على مندوبي محافظاته: يقيّم تقاريرهم ويعتمد خططهم.", permissions: ["daily_reports.rate", "plans.approve", "visit_points.manage"] },
  it: { job_description: "يدير الحسابات والأدوار والأجهزة والأمان.", permissions: ["users.view", "users.manage", "roles.manage", "devices.manage", "security.manage"] },
};

const roleKeys = { agent: 1, logistics: 1, warehouse_worker: 1, supervisor: 1, monitoring: 1, sales_manager: 1, scientific_manager: 1, executive: 1, it: 1, accountant: 1, legal: 1 } satisfies Record<RoleKey, 1>;

export const rolesWithPermissions: readonly Role[] = [
  ...rolesList.map((role) => ({ ...role, ...(role.key && role.key in roleKeys ? { permissions: rolePermissions(role.key as RoleKey) } : {}), ...(details[role.key ?? ""] ?? {}) })),
  { id: 30, key: "regional_coordinator", name: "منسّق إقليمي", platform: "WEB", is_system: false, users_count: 0, job_description: "ينسّق بين مستودعات المحافظات الشمالية.", permissions: ["transfers.receive", "stock_counts.count"] },
  { id: 31, key: "quality_officer", name: "مسؤول الجودة", platform: "WEB", is_system: false, users_count: 2, job_description: "يتابع الدفعات والمرتجعات.", permissions: ["batches.suspend", "returns.decide"] },
];

export const findRole = (id: number): Role => {
  const found = rolesWithPermissions.find((role) => role.id === id);
  if (!found) throw new Error(`دور غير معرّف في المعرض: ${id}`);
  return found;
};
