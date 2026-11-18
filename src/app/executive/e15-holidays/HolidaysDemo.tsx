"use client";

import { useState } from "react";
import { HolidaysView, type HolidayForm } from "@/features/settings/views/HolidaysView";
import type { Holiday } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { holidays as initialHolidays, holidaysCreator, settingsToday } from "@/mocks/settings";

// غلاف تفاعلي لصفحة الرسم (E15): يملك العطل والنافذتين. الإضافة والحذف محلياً كما تفعل POST وDELETE /holidays. لا يُنقل للإنتاج.

type HolidaysDemoProps = { initialForm?: HolidayForm | null; mode?: "ready" | "loading" | "error" | "empty" };

export function HolidaysDemo({ initialForm = null, mode = "ready" }: HolidaysDemoProps) {
  const [year, setYear] = useState("2026");
  const [rows, setRows] = useState<readonly Holiday[]>(initialHolidays);
  const [form, setForm] = useState<HolidayForm | null>(initialForm);
  const [deleting, setDeleting] = useState<Holiday | null>(null);

  const ofYear = rows.filter((row) => row.date?.startsWith(year));
  const holidays: Loadable<readonly Holiday[]> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: mode === "empty" ? [] : ofYear };

  return (
    <HolidaysView
      year={year}
      years={["2026", "2027"]}
      onYearChange={setYear}
      holidays={holidays}
      canManage
      today={settingsToday}
      form={form}
      onFormChange={setForm}
      onSubmit={() => {
        if (!form?.date) return;
        const date = form.date;
        setRows([...rows, { id: Math.max(0, ...rows.map((row) => row.id ?? 0)) + 1, date, name: form.name.trim(), created_by: holidaysCreator }].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")));
        setYear(date.slice(0, 4));
        setForm(null);
      }}
      deleting={deleting}
      onDeletingChange={setDeleting}
      onDelete={() => {
        setRows(rows.filter((row) => row.id !== deleting?.id));
        setDeleting(null);
      }}
    />
  );
}
