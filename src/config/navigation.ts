import {
  ArrowsLeftRight,
  ArrowUUpLeft,
  Barcode,
  Binoculars,
  Calculator,
  CalendarCheck,
  ChartBar,
  ChatCircleText,
  ClipboardText,
  Clock,
  Coins,
  Cube,
  Detective,
  DeviceMobile,
  Devices,
  FileText,
  Flag,
  Gavel,
  Gear,
  Globe,
  Handshake,
  HandCoins,
  House,
  Key,
  ListChecks,
  Lock,
  MapPin,
  Medal,
  MagnifyingGlass,
  Newspaper,
  Notebook,
  Package,
  Prohibit,
  Receipt,
  Scales,
  Scroll,
  ShieldCheck,
  Stamp,
  Star,
  Storefront,
  Tag,
  TrendUp,
  Trophy,
  Truck,
  UserGear,
  UserList,
  UsersThree,
  Wallet,
  Warning,
  type Icon,
} from "@phosphor-icons/react";
import type { SidebarGroup } from "@/components/layout/Sidebar";

// عناصر القائمة الجانبية لكل مستخدم (DESIGN.md 10.2). تُصفّى بصلاحيات المستخدم من `GET /me` (`permissions`)، فلا فحص لاسم الدور في أي مكان.
// المصدر: SCREENS.md ي.1 (العناصر بالترتيب لكل دور). كل عنصر له `permission`: مفتاح واحد، أو عدة مفاتيح يكفي أحدها (any-of).
//
// مفاتيح الصلاحيات:
//  - المذكورة في وصف openapi.yml تُسجَّل في CONTRACT_PERMISSIONS، وعناصرها مؤكَّدة (`isConfirmed`).
//    (القائمة الكاملة تأتي من `GET /permissions`؛ هذه ما ورد في أوصاف العقد.)
//  - الناقصة وضعناها مؤقتاً بقاعدة تسمية موحّدة من مفردات العقد، وكلها في `docs/backend-requests.md` لتُرسل للباك
//    فتُؤكَّد أو تُصحَّح، ثم يُحدَّث هذا الملف.
//    القاعدة: `<module>.<action>` بحروف صغيرة و snake_case، الوحدة اسم الكيان بالجمع، والفعل من (view · create · manage · approve ·
//    decide · receive · review). عنصر القائمة يأخذ `view` للوحدة. الرئيسية `dashboard.<role>` كنمط `dashboard.executive`.

/** المفاتيح الواردة في أوصاف openapi.yml. */
const CONTRACT_PERMISSIONS: ReadonlySet<string> = new Set([
  "access_logs.view", "accounting.reports", "agent_returns.create", "agent_returns.receive", "agents.manage", "app_versions.manage",
  "audit.view", "batches.suspend", "batches.unsuspend", "budgets.manage", "contracts.manage", "customers.create", "daily_reports.rate",
  "damage.create", "dashboard.executive", "deductions.create", "deductions.view", "delegations.manage", "deliveries.approve",
  "deliveries.collect", "deliveries.create", "devices.manage", "disputes.decide", "disputes.manage", "disputes.refer", "disputes.view",
  "expenses.enter", "flags.decide", "flags.view", "geo.manage", "holidays.manage", "investigations.decide", "investigations.manage",
  "investigations.view", "items.manage", "kpi.manage", "legal.manage", "legal.view", "lists.manage", "locations.manage",
  "manager_visits.create", "month_winners.approve", "periodic_reports.decide", "periodic_reports.review", "plans.approve",
  "prices.manage", "ratings.manual", "returns.create", "returns.decide", "roles.manage", "sample_requests.create", "security.manage",
  "settings.manage", "site.manage", "site_messages.handle", "site_messages.view", "stock.receive", "stock_counts.approve",
  "stock_counts.count", "stock_counts.create", "tasks.resolve_overdue", "transfers.create", "transfers.receive", "users.manage",
  "users.view", "visit_points.manage", "visit_points.merge", "visits.decide", "withdraw.confirm_on_behalf", "withdraw.create",
]);

export type NavGroupKey = "main" | "stock" | "sales" | "team" | "administration" | "account";

export type NavItem = {
  key: string;
  label: string;
  icon: Icon;
  /** معرّف الشاشة التي يفتحها العنصر (SCREENS.md). */
  screen: string;
  group: NavGroupKey;
  /** مفتاح صلاحية، أو عدة مفاتيح يكفي أحدها. */
  permission: string | readonly string[];
};

// الترتيب هنا هو ترتيب العرض داخل كل مجموعة.
export const navItems: readonly NavItem[] = [
  // الرئيسية: واحدة لكل مستخدم (شاشتها بحسب ما يملكه).
  { key: "home-agent", label: "الرئيسية", icon: House, screen: "A01", group: "main", permission: "dashboard.agent" },
  { key: "home-warehouse", label: "الرئيسية", icon: House, screen: "W01", group: "main", permission: "dashboard.warehouse" },
  { key: "home-supervisor", label: "الرئيسية", icon: House, screen: "S01", group: "main", permission: "dashboard.supervisor" },
  { key: "home-sales-manager", label: "الرئيسية", icon: House, screen: "M01", group: "main", permission: "dashboard.sales_manager" },
  { key: "home-scientific-manager", label: "الرئيسية", icon: House, screen: "M12", group: "main", permission: "dashboard.scientific_manager" },
  { key: "home-executive", label: "الرئيسية", icon: House, screen: "E01", group: "main", permission: "dashboard.executive" },
  { key: "home-accountant", label: "الرئيسية", icon: House, screen: "I11", group: "main", permission: "dashboard.accounting" },
  { key: "pending", label: "بانتظار قراري", icon: Stamp, screen: "G04", group: "main", permission: "pending_decisions.view" },

  // المخزون
  { key: "agent-receipts", label: "الاستلامات", icon: Package, screen: "A02", group: "stock", permission: "transfers.receive" },
  { key: "agent-stock", label: "رصيدي", icon: Cube, screen: "A04", group: "stock", permission: "agent_stock.view" },
  { key: "balances", label: "الأرصدة", icon: ClipboardText, screen: "W02", group: "stock", permission: "stock.view" },
  { key: "movements", label: "الحركات", icon: ArrowsLeftRight, screen: "W03", group: "stock", permission: "transfers.view" },
  { key: "stock-intake", label: "الإدخال", icon: Package, screen: "W05", group: "stock", permission: "stock.receive" },
  { key: "dispatch", label: "الصرف", icon: Truck, screen: "W07", group: "stock", permission: "transfers.create" },
  { key: "warehouse-sample-requests", label: "طلبات العينات", icon: Tag, screen: "W09", group: "stock", permission: "sample_requests.manage" },
  { key: "withdraw-requests", label: "طلبات السحب", icon: ArrowUUpLeft, screen: "W11", group: "stock", permission: "withdraw.confirm_on_behalf" },
  { key: "agent-returns-warehouse", label: "إرجاعات الوكلاء", icon: ArrowUUpLeft, screen: "W13", group: "stock", permission: "agent_returns.receive" },
  { key: "stock-counts", label: "الجرد", icon: ListChecks, screen: "W14", group: "stock", permission: ["stock_counts.create", "stock_counts.count"] },
  { key: "batches", label: "الدفعات", icon: Barcode, screen: "W17", group: "stock", permission: "batches.view" },
  { key: "warehouse-damage", label: "التالف", icon: Warning, screen: "W21", group: "stock", permission: "damage.view" },
  { key: "scientific-sample-balances", label: "أرصدة العينات", icon: Cube, screen: "M17", group: "stock", permission: "sample_stock.view" },
  { key: "scientific-sample-requests", label: "طلبات العينات", icon: Tag, screen: "M18", group: "stock", permission: "sample_requests.create" },

  // المبيعات
  { key: "agents", label: "الوكلاء", icon: Storefront, screen: "M02", group: "sales", permission: "agents.manage" },
  { key: "agent-customers", label: "العملاء", icon: UsersThree, screen: "A05", group: "sales", permission: "customers.create" },
  { key: "manager-customers", label: "العملاء", icon: UsersThree, screen: "M04", group: "sales", permission: "customers.view" },
  { key: "agent-deliveries", label: "التسليمات", icon: Handshake, screen: "A09", group: "sales", permission: "deliveries.create" },
  { key: "manager-deliveries", label: "التسليمات", icon: Handshake, screen: "M06", group: "sales", permission: "deliveries.approve" },
  { key: "agent-receivables", label: "المستحقات", icon: Receipt, screen: "A11", group: "sales", permission: "deliveries.collect" },
  { key: "manager-receivables", label: "المستحقات", icon: Receipt, screen: "M07", group: "sales", permission: "receivables.view" },
  { key: "agent-returns", label: "المرتجعات والتالف", icon: ArrowUUpLeft, screen: "A13", group: "sales", permission: "returns.create" },
  { key: "return-decisions", label: "قرارات المرتجع والتالف", icon: Gavel, screen: "M08", group: "sales", permission: "returns.decide" },
  { key: "agent-return-to-warehouse", label: "الإرجاع للمستودع", icon: Truck, screen: "A16", group: "sales", permission: "agent_returns.create" },
  { key: "my-visits", label: "زياراتي", icon: MapPin, screen: "M10", group: "sales", permission: "manager_visits.create" },
  { key: "site-messages", label: "رسائل الموقع", icon: ChatCircleText, screen: "M11", group: "sales", permission: "site_messages.view" },

  // الفريق
  { key: "daily-reports", label: "التقارير اليومية", icon: Notebook, screen: "S02", group: "team", permission: "daily_reports.rate" },
  { key: "attendance", label: "الدوام", icon: Clock, screen: "S04", group: "team", permission: "attendance.view" },
  { key: "visits", label: "الزيارات", icon: MapPin, screen: "S05", group: "team", permission: ["visits.view", "visits.decide"] },
  { key: "reps", label: "المندوبون", icon: UserList, screen: "M13", group: "team", permission: "reps.view" },
  { key: "visit-places", label: "جهات الزيارة", icon: MapPin, screen: "M14", group: "team", permission: "visit_points.manage" },
  { key: "market-intel", label: "معلومات السوق", icon: TrendUp, screen: "M16", group: "team", permission: "market_intel.view" },
  { key: "flags", label: "العلامات", icon: Flag, screen: "S08", group: "team", permission: "flags.view" },
  { key: "new-places", label: "الجهات الجديدة", icon: Binoculars, screen: "S10", group: "team", permission: "visit_points.merge" },
  { key: "investigations", label: "التحقيقات", icon: Detective, screen: "S13", group: "team", permission: "investigations.view" },
  { key: "complaints", label: "الشكاوى", icon: ChatCircleText, screen: "S12", group: "team", permission: "complaints.view" },
  { key: "report-review", label: "مراجعة التقارير", icon: FileText, screen: "G11", group: "team", permission: "periodic_reports.review" },
  { key: "tasks", label: "المهام", icon: CalendarCheck, screen: "G06", group: "team", permission: "tasks.view" },
  { key: "plan", label: "الخطة", icon: ListChecks, screen: "G16", group: "team", permission: "plans.view" },
  { key: "periodic-reports", label: "التقارير الدورية", icon: FileText, screen: "G11", group: "team", permission: ["periodic_reports.create", "periodic_reports.decide"] },
  { key: "leaves", label: "الإجازات", icon: CalendarCheck, screen: "G18", group: "team", permission: "leaves.approve" },

  // الإدارة
  { key: "budget", label: "الميزانية", icon: Wallet, screen: "E03", group: "administration", permission: "budgets.manage" },
  { key: "deductions", label: "الخصومات", icon: Coins, screen: "E05", group: "administration", permission: "deductions.view" },
  { key: "month-close", label: "إغلاق الشهر", icon: Lock, screen: "E06", group: "administration", permission: "month_closings.manage" },
  { key: "manual-rating", label: "التقييم اليدوي", icon: Star, screen: "E07", group: "administration", permission: "ratings.manual" },
  { key: "points", label: "النقاط", icon: Medal, screen: "E08", group: "administration", permission: "points.view" },
  { key: "month-winner", label: "موظف الشهر", icon: Trophy, screen: "E09", group: "administration", permission: "month_winners.approve" },
  { key: "items", label: "الأصناف", icon: Cube, screen: "E10", group: "administration", permission: "items.manage" },
  { key: "users", label: "المستخدمون", icon: UserGear, screen: "I01", group: "administration", permission: ["users.view", "users.manage"] },
  { key: "roles", label: "الأدوار", icon: Key, screen: "I04", group: "administration", permission: "roles.manage" },
  { key: "devices", label: "الأجهزة", icon: Devices, screen: "I05", group: "administration", permission: "devices.manage" },
  { key: "device-requests", label: "طلبات تغيير الجهاز", icon: DeviceMobile, screen: "I06", group: "administration", permission: "devices.manage" },
  { key: "attempts", label: "المحاولات", icon: MagnifyingGlass, screen: "I07", group: "administration", permission: "security.manage" },
  { key: "blocks", label: "الحظر", icon: Prohibit, screen: "I08", group: "administration", permission: "security.manage" },
  { key: "app-versions", label: "إصدارات التطبيق", icon: DeviceMobile, screen: "I09", group: "administration", permission: "app_versions.manage" },
  { key: "site-content", label: "محتوى الموقع", icon: Globe, screen: "I10", group: "administration", permission: "site.manage" },
  { key: "settings", label: "الإعدادات", icon: Gear, screen: "E13", group: "administration", permission: "settings.manage" },
  { key: "delegation", label: "التفويض", icon: Handshake, screen: "E18", group: "administration", permission: "delegations.manage" },
  { key: "audit", label: "سجل التدقيق", icon: ShieldCheck, screen: "E02", group: "administration", permission: "audit.view" },
  { key: "actual-expense", label: "المصروف الفعلي", icon: HandCoins, screen: "I12", group: "administration", permission: "expenses.enter" },
  { key: "attendance-report", label: "تقرير الدوام", icon: ChartBar, screen: "I13", group: "administration", permission: "accounting.reports" },
  { key: "deductions-report", label: "تقرير الخصومات", icon: Calculator, screen: "I14", group: "administration", permission: "accounting.reports" },
  { key: "legal-documents", label: "الوثائق", icon: Scroll, screen: "I15", group: "administration", permission: "legal.view" },
  { key: "disputes", label: "النزاعات", icon: Scales, screen: "I18", group: "administration", permission: "disputes.view" },

  // حسابي: ملفي الشخصي وتسجيل الخروج في أسفل القائمة (profileHref).
  { key: "my-leaves", label: "إجازاتي", icon: CalendarCheck, screen: "G17", group: "account", permission: "leaves.create" },
  { key: "department-requests", label: "الطلبات بين الأقسام", icon: Newspaper, screen: "G09", group: "account", permission: "department_requests.create" },
];

const groupTitles: Record<NavGroupKey, string | undefined> = {
  main: undefined,
  stock: "المخزون",
  sales: "المبيعات",
  team: "الفريق",
  administration: "الإدارة",
  account: "حسابي",
};

const groupOrder: readonly NavGroupKey[] = ["main", "stock", "sales", "team", "administration", "account"];

const permissionKeys = (permission: NavItem["permission"]) => (typeof permission === "string" ? [permission] : permission);

/** كل مفاتيح العنصر مذكورة في العقد. غير ذلك: ينتظر تأكيد الباك (docs/backend-requests.md). */
export const isConfirmed = (item: NavItem) => permissionKeys(item.permission).every((key) => CONTRACT_PERMISSIONS.has(key));

/** العناصر التي يراها صاحب هذه الصلاحيات، بالترتيب. */
export function visibleNavItems(permissions: readonly string[]): NavItem[] {
  const owned = new Set(permissions);
  return navItems.filter((item) => permissionKeys(item.permission).some((key) => owned.has(key)));
}

export type NavCounts = Partial<Record<string, number>>;

/**
 * مجموعات القائمة الجانبية لصاحب هذه الصلاحيات (`me.permissions`). تُمرَّر لـ `DashboardShell` في `navigation.groups`.
 * `counts`: عدد بجانب عنصر (مثل «بانتظار قراري» من `/me/pending-decisions`).
 */
export function navigationFor(permissions: readonly string[], counts: NavCounts = {}): SidebarGroup[] {
  const visible = visibleNavItems(permissions);
  return groupOrder
    .map((group) => ({
      title: groupTitles[group],
      items: visible
        .filter((item) => item.group === group)
        .map(({ key, label, icon, screen }) => ({ key, label, icon, href: `#${screen.toLowerCase()}`, count: counts[key] })),
    }))
    .filter((group) => group.items.length > 0);
}
