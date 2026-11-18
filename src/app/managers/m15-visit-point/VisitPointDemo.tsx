"use client";

import { useState } from "react";
import { formFromPoint, VisitPointDetailsView, type VisitPointForm } from "@/features/visit-points/views/VisitPointDetailsView";
import type { VisitPoint } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { findVisitPoint, linkedPointId, pointCustomer, pointSpecialties, pointTypes, pointVisits } from "@/mocks/visit-points-list";

// غلاف تفاعلي لصفحة الرسم (M15): يملك الجهة ونموذج التعديل. «حفظ التعديل» يحدّث بيانات الجهة محلياً كما سيفعل PATCH /visit-points/{id}.
// في الإنتاج تحلّ محلّه حاوية تطلب GET /visit-points/{id} وGET /visits?visit_point_id= وترسل PATCH. لا يُنقل للإنتاج.

type VisitPointDemoProps = {
  /** الجهة المعروضة (افتراضها المربوطة بعميل). */
  pointId?: number;
  /** حالة البيانات: جاهزة، أو تحميل، أو غير موجودة، أو خطأ. */
  mode?: "ready" | "loading" | "not-found" | "error";
  /** نموذج التعديل مفتوح عند العرض. */
  initialEditing?: boolean;
};

export function VisitPointDemo({ pointId = linkedPointId, mode = "ready", initialEditing = false }: VisitPointDemoProps) {
  const [data, setData] = useState<VisitPoint>(() => findVisitPoint(pointId));
  const [form, setForm] = useState<VisitPointForm | null>(initialEditing ? formFromPoint(findVisitPoint(pointId)) : null);

  const point: Loadable<VisitPoint> =
    mode === "loading" ? { status: "loading" } : mode === "not-found" ? { status: "error", code: "not_found" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data };

  const save = () => {
    if (!form) return;
    const type = pointTypes.find((entry) => String(entry.id) === form.typeId);
    const specialty = pointSpecialties.find((entry) => String(entry.id) === form.specialtyId) ?? null;
    setData({ ...data, name: form.name.trim(), type, specialty, phone: `+963${form.phone}`, address: form.address.trim() || null });
    setForm(null);
  };

  return (
    <VisitPointDetailsView
      point={point}
      visits={{ status: "ready", data: pointVisits(pointId) }}
      linkedCustomer={pointCustomer(data)}
      canEdit
      types={pointTypes}
      specialties={pointSpecialties}
      form={form}
      onFormChange={setForm}
      onEdit={() => setForm(formFromPoint(data))}
      onCloseForm={() => setForm(null)}
      onSave={save}
      onOpenCustomer={() => {}}
      onBack={() => {}}
      onRetry={() => {}}
    />
  );
}
