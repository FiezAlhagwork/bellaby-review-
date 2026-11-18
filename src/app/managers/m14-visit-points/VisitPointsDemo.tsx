"use client";

import { useState } from "react";
import { noVisitPointFilters, VisitPointsListView, type VisitPointFilters, type VisitPointsMode, type VisitPointsPage } from "@/features/visit-points/views/VisitPointsListView";
import type { Loadable } from "@/lib/loadable";
import { pointGovernorates, pointSpecialties, pointTypes, visitPointsList } from "@/mocks/visit-points-list";

// غلاف تفاعلي لصفحة الرسم (M14): يملك العرض (قائمة/خريطة) والفلاتر والصفحة والجهة المحدّدة، ويرشّح ويرقّم بيانات المعرض محلياً
// (ما يفعله الخادم بـ type_id وspecialty_id وgovernorate_id وstatus وpage). في الإنتاج تحلّ محلّه حاوية تطلب GET /visit-points. لا يُنقل للإنتاج.

type VisitPointsDemoProps = {
  initialMode?: VisitPointsMode;
  initialFilters?: VisitPointFilters;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا جهات. */
  mode?: "ready" | "loading" | "error" | "empty";
};

export function VisitPointsDemo({ initialMode = "list", initialFilters = noVisitPointFilters, mode = "ready" }: VisitPointsDemoProps) {
  const [view, setView] = useState<VisitPointsMode>(initialMode);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const matching =
    mode === "empty"
      ? []
      : visitPointsList.filter(
          (point) =>
            (!filters.typeId || String(point.type?.id) === filters.typeId) &&
            (!filters.specialtyId || String(point.specialty?.id) === filters.specialtyId) &&
            (!filters.governorateId || String(point.governorate?.id) === filters.governorateId) &&
            (!filters.status || point.status === filters.status),
        );
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: VisitPointsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };
  const points: Loadable<VisitPointsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <VisitPointsListView
      points={points}
      mode={view}
      onModeChange={setView}
      types={pointTypes}
      specialties={pointSpecialties}
      governorates={pointGovernorates}
      filters={filters}
      onFiltersChange={(next) => {
        setFilters(next);
        setPage(1);
        setSelectedId(null);
      }}
      onPageChange={setPage}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
      }}
      selectedId={selectedId}
      onSelectPoint={setSelectedId}
      onOpenPoint={() => {}}
    />
  );
}
