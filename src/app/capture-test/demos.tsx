"use client";

import { ArrowsLeftRight, Barcode, ClipboardText, MagnifyingGlass, Package, UserCircle } from "@phosphor-icons/react";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Sidebar, type SidebarGroup } from "@/components/layout/Sidebar";
import { OverlayHost } from "@/components/ui/OverlayHost";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatDate, formatQuantity } from "@/lib/format";
import { captureTestTransfers } from "@/mocks/capture-test";
import type { Transfer } from "@/lib/api/types";

export function FieldDemo() {
  return (
    <div className="flex flex-col gap-6">
      <Field label="اسم الموظف" required>
        <Input icon={<UserCircle size={20} />} placeholder="مثال: سامر الحلبي" />
      </Field>
      <Field label="ملاحظات" optional hint="تظهر للمستلم في تفاصيل الصرف.">
        <Input defaultValue="تسليم باليد صباحاً" />
      </Field>
      <Field label="الكمية" required error="أكبر من المتاح (240)">
        <Input defaultValue="300" />
      </Field>
      <Field label="تاريخ التسليم" hint="تاريخ التسليم لحظة التسجيل ولا يُعدَّل.">
        <Input locked defaultValue={formatDate("2026-11-09T11:05:00Z")} />
      </Field>
      <Field label="الدور" disabled>
        <Input defaultValue="لوجستي" />
      </Field>
      <Field label="بحث" >
        <Input icon={<MagnifyingGlass size={20} />} placeholder="ابحث برقم الصرف" />
      </Field>
    </div>
  );
}

const columns: DataTableColumn<Transfer>[] = [
  { key: "reference", header: "رقم الصرف", cell: (row) => row.reference ?? "—", width: "w-44", priority: "high" },
  { key: "destination", header: "الوجهة", cell: (row) => row.to_location?.name ?? "—", priority: "high" },
  {
    key: "quantity",
    header: "الكمية",
    align: "end",
    width: "w-40",
    priority: "high",
    cell: (row) => (row.total_quantity === undefined ? "—" : formatQuantity(row.total_quantity, "علبة")),
  },
];

export function DataTableDemo() {
  // مضيف بعرض مكتب: الجدول يتجاوب مع @container.
  return (
    <OverlayHost>
      <DataTable label="الصرفيات" columns={columns} rows={captureTestTransfers} getRowKey={(row) => row.id ?? ""} />
    </OverlayHost>
  );
}

const groups: SidebarGroup[] = [
  {
    title: "المخزون",
    items: [
      { key: "balances", label: "الأرصدة", icon: Package, href: "#balances" },
      { key: "transfers", label: "الصرف", icon: ArrowsLeftRight, href: "#transfers", count: 3 },
      { key: "counts", label: "الجرد", icon: ClipboardText, href: "#counts" },
      { key: "batches", label: "الدفعات", icon: Barcode, href: "#batches" },
    ],
  },
];

export function SidebarDemo() {
  // كتلة بعرض ثابت داخل كتلة أعرض تلتصق بالبداية: يمين في RTL، ويسار في LTR. لذلك في صف، كما في DashboardShell.
  return (
    <CaptureRow>
      <div className="h-120 w-66 overflow-hidden rounded-lg ring-1 ring-border">
        <Sidebar mode="full" roleName="اللوجستي" groups={groups} activeKey="balances" profileHref="#profile" />
      </div>
    </CaptureRow>
  );
}
