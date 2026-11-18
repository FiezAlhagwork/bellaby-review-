"use client";

import { useState } from "react";
import { ItemDetailsView, type PriceForm } from "@/features/items/views/ItemDetailsView";
import type { Item, PricePeriod } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { findItem, itemsToday, periodsOf } from "@/mocks/items";

// غلاف تفاعلي لصفحة الرسم (E12): يملك الصنف والسجل والنافذتين. الفترة الجديدة تُضاف محلياً وتُغلق السابقة قبلها بيوم (ما يفعله الخادم)،
// وتاريخ قبل اليوم يرجع price_in_past. التعطيل PATCH is_active. لا يُنقل للإنتاج.

type ItemDemoProps = {
  itemId?: number;
  initialPriceForm?: PriceForm | null;
  initialPriceError?: string;
  initialConfirming?: boolean;
  mode?: "ready" | "loading" | "error" | "not-found";
};

const ziad = { id: 1, name: "زياد المصري" };

/** اليوم السابق لتاريخ (YYYY-MM-DD) بتوقيت UTC: نهاية الفترة السابقة. */
function dayBefore(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function ItemDemo({ itemId = 1, initialPriceForm = null, initialPriceError, initialConfirming = false, mode = "ready" }: ItemDemoProps) {
  const [data, setData] = useState<Item>(() => findItem(itemId));
  const [periods, setPeriods] = useState<readonly PricePeriod[]>(() => periodsOf(itemId));
  const [priceForm, setPriceForm] = useState<PriceForm | null>(initialPriceForm);
  const [priceError, setPriceError] = useState(initialPriceError);
  const [confirming, setConfirming] = useState(initialConfirming);

  const item: Loadable<Item> = mode === "loading" ? { status: "loading" } : mode === "not-found" ? { status: "error", code: "not_found" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data };

  return (
    <ItemDetailsView
      item={item}
      periods={{ status: "ready", data: periods }}
      canPrice
      canManage
      priceForm={priceForm}
      onPriceFormChange={(next) => {
        setPriceForm(next);
        setPriceError(undefined);
      }}
      onSubmitPrice={() => {
        if (!priceForm?.startsOn) return;
        if (priceForm.startsOn < itemsToday) {
          setPriceError("price_in_past");
          return;
        }
        const startsOn = priceForm.startsOn;
        const kept = periods.filter((period) => (period.starts_on ?? "") < startsOn).map((period, index) => (index === 0 ? { ...period, ends_on: dayBefore(startsOn) } : period));
        setPeriods([{ id: Math.max(0, ...periods.map((period) => period.id ?? 0)) + 1, amount: priceForm.amount.trim(), starts_on: startsOn, ends_on: null, created_by: ziad }, ...kept]);
        if (startsOn <= itemsToday) setData(data.type === "PRODUCT" ? { ...data, current_price: priceForm.amount.trim() } : { ...data, current_unit_cost: priceForm.amount.trim() });
        setPriceForm(null);
      }}
      priceError={priceError}
      confirmingToggle={confirming}
      onConfirmingToggleChange={setConfirming}
      onToggleActive={() => {
        setData({ ...data, is_active: !data.is_active });
        setConfirming(false);
      }}
      today={itemsToday}
      onBack={() => {}}
    />
  );
}
