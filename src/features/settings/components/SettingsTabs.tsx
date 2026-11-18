"use client";

import { Tabs } from "@/components/ui/Tabs";

/** أقسام الإعدادات (E13–E17): عنصر واحد في القائمة الجانبية («الإعدادات»)، والأقسام تبويبات تحت الرأس. */
export type SettingsSection = "general" | "lists" | "holidays" | "weights" | "geo";

const tabs = [
  { value: "general", label: "عامة" },
  { value: "lists", label: "القوائم" },
  { value: "holidays", label: "العطل الرسمية" },
  { value: "weights", label: "الأوزان والمجموعات" },
  { value: "geo", label: "الهيكل الجغرافي" },
] as const satisfies readonly { value: SettingsSection; label: string }[];

type SettingsTabsProps = { active: SettingsSection; onSelect?: (section: SettingsSection) => void };

export function SettingsTabs({ active, onSelect }: SettingsTabsProps) {
  return <Tabs aria-label="أقسام الإعدادات" tabs={tabs} value={active} onValueChange={(section) => onSelect?.(section)} />;
}
