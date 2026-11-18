"use client";

import { useState } from "react";
import { GeoView, type GeoForm } from "@/features/settings/views/GeoView";
import type { GeoTree } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { geoTree } from "@/mocks/settings";

// غلاف تفاعلي لصفحة الرسم (E17): يملك الشجرة والنافذة. الإضافة والتعديل والنقل محلياً كما تفعل POST/PATCH /geo/regions و/geo/governorates
// (كلها تُرجع الشجرة كاملة). لا يُنقل للإنتاج.

type GeoDemoProps = { initialForm?: GeoForm | null; mode?: "ready" | "loading" | "error" };

function apply(tree: GeoTree, form: GeoForm): GeoTree {
  const name = form.name.trim();
  const nextId = (ids: readonly (number | undefined)[]) => Math.max(0, ...ids.map((id) => id ?? 0)) + 1;
  const regions = (tree.countries ?? []).flatMap((country) => country.regions ?? []);
  if (form.kind === "region") {
    if (form.regionClass === null) return tree;
    const regionClass = form.regionClass;
    return {
      countries: (tree.countries ?? []).map((country) =>
        country.id !== form.countryId
          ? country
          : {
              ...country,
              regions:
                form.id === null
                  ? [...(country.regions ?? []), { id: nextId(regions.map((region) => region.id)), name, class: regionClass, governorates: [] }]
                  : (country.regions ?? []).map((region) => (region.id === form.id ? { ...region, name, class: regionClass } : region)),
            },
      ),
    };
  }
  const governorateId = form.id ?? nextId(regions.flatMap((region) => (region.governorates ?? []).map((governorate) => governorate.id)));
  return {
    countries: (tree.countries ?? []).map((country) => ({
      ...country,
      regions: (country.regions ?? []).map((region) => {
        const kept = (region.governorates ?? []).filter((governorate) => governorate.id !== governorateId);
        return { ...region, governorates: region.id === form.regionId ? [...kept, { id: governorateId, name }] : kept };
      }),
    })),
  };
}

export function GeoDemo({ initialForm = null, mode = "ready" }: GeoDemoProps) {
  const [tree, setTree] = useState<GeoTree>(geoTree);
  const [form, setForm] = useState<GeoForm | null>(initialForm);

  const geo: Loadable<GeoTree> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: tree };

  return (
    <GeoView
      geo={geo}
      canManage
      form={form}
      onFormChange={setForm}
      onSubmit={() => {
        if (!form) return;
        setTree(apply(tree, form));
        setForm(null);
      }}
    />
  );
}
