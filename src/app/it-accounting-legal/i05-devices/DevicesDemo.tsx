"use client";

import { useState } from "react";
import { DevicesView, type DevicesPage } from "@/features/devices/views/DevicesView";
import type { Loadable } from "@/lib/loadable";
import { devicesList } from "@/mocks/devices";

// غلاف تفاعلي لصفحة الرسم (I05): يملك الصفحة. في الإنتاج: GET /devices. لا يُنقل للإنتاج.

type DevicesDemoProps = { mode?: "ready" | "loading" | "error" | "empty" };

export function DevicesDemo({ mode = "ready" }: DevicesDemoProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const rows = mode === "empty" ? [] : devicesList;
  const lastPage = Math.max(1, Math.ceil(rows.length / perPage));
  const current = Math.min(page, lastPage);
  const result: DevicesPage = { data: rows.slice((current - 1) * perPage, current * perPage), meta: { current_page: current, last_page: lastPage, per_page: perPage, total: rows.length } };
  const devices: Loadable<DevicesPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <DevicesView
      devices={devices}
      onPageChange={setPage}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
      }}
    />
  );
}
