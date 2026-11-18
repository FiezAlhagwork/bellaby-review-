"use client";

import { useState } from "react";
import { NewManagerVisitView, type ManagerVisitForm, type ManagerVisitLocation } from "@/features/manager-visits/views/NewManagerVisitView";
import type { ManagerVisit } from "@/lib/api/types";
import { managerVisitOutcomes, managerVisitPurposes, readyLocation, savedVisit, visitTargets } from "@/mocks/manager-visits";

// غلاف تفاعلي لصفحة الرسم: يملك النموذج وحالة الموقع، ويحاكي ما تفعله الحاوية بـ navigator.geolocation: «تحديد موقعي» ينتظر الإذن (locating) ثم ينتهي إلى `locationOutcome`
// (ready أو denied). «حفظ الزيارة» يعرض الملخص كما يرد من POST /manager-visits. لا يُنقل للإنتاج.

type NewManagerVisitDemoProps = {
  initialForm: ManagerVisitForm;
  initialLocation?: ManagerVisitLocation;
  /** ما ينتهي إليه طلب الموقع: يُمنح أو يُرفض. */
  locationOutcome?: "granted" | "denied";
  /** أخطاء `validation_failed` على حقولها. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل. */
  submitError?: string;
  /** زيارة محفوظة بالفعل: يعرض الملخص. */
  initiallySaved?: boolean;
};

export function NewManagerVisitDemo({ initialForm, initialLocation = { status: "idle" }, locationOutcome = "granted", errors, submitError, initiallySaved = false }: NewManagerVisitDemoProps) {
  const [form, setForm] = useState(initialForm);
  const [location, setLocation] = useState<ManagerVisitLocation>(initialLocation);
  const [saved, setSaved] = useState<ManagerVisit | null>(initiallySaved ? savedVisit : null);
  const [query, setQuery] = useState("");

  const targets = visitTargets.filter((target) => !query.trim() || target.name.includes(query.trim()));

  return (
    <NewManagerVisitView
      targets={targets}
      onTargetQueryChange={setQuery}
      purposes={managerVisitPurposes}
      outcomes={managerVisitOutcomes}
      form={form}
      onFormChange={setForm}
      location={location}
      onRequestLocation={() => {
        setLocation({ status: "locating" });
        setTimeout(() => setLocation(locationOutcome === "granted" ? readyLocation : { status: "denied" }), 700);
      }}
      errors={errors}
      submitError={submitError}
      saved={saved}
      onSubmit={() => setSaved(savedVisit)}
      onNewVisit={() => {
        setSaved(null);
        setForm({ targetKey: null, purposeId: null, outcomeId: null, notes: "" });
        setLocation({ status: "idle" });
      }}
      onOpenVisits={() => {}}
    />
  );
}
