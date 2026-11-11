"use client";

import { useState, type ReactNode } from "react";
import { Calendar, type Holiday } from "@/components/ui/Calendar";
import { DatePicker } from "@/components/ui/DatePicker";
import { DateRangePanel, DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { Field } from "@/components/ui/Field";
import { MonthGrid, MonthPicker } from "@/components/ui/MonthPicker";
import { floatingPanelClass } from "@/components/ui/OptionList";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { forcedField } from "./forced-states";
import { GalleryGroup, GallerySection, StateStack } from "./gallery-kit";

const noop = () => {};

// يوم ثابت في المعرض فلا يتغير الشكل بتغير التاريخ الحقيقي. الحقول الحية تستعمل اليوم الحقيقي.
const TODAY = "2026-11-10";

const holidays: readonly Holiday[] = [{ date: "2026-01-01", name: "رأس السنة الميلادية" }];

/** صورة للقائمة المفتوحة بإطارها الحقيقي (floatingPanelClass). المحتوى حيّ يعمل بالنقر. */
function Panel({ children }: { children: ReactNode }) {
  // في صف: كتلة بعرض محتواها داخل خلية أعرض تبقى عند البداية (يمين) في وضع الالتقاط أيضاً.
  return (
    <CaptureRow>
      <div className={`${floatingPanelClass} w-fit p-3`}>{children}</div>
    </CaptureRow>
  );
}

const triggerStates = (
  render: (state: { className?: string; filled?: boolean; invalid?: boolean; disabled?: boolean; locked?: boolean }) => ReactNode,
) => [
  { label: "افتراضي", node: render({}) },
  { label: "تمرير (hover)", node: render({ className: forcedField.hover }) },
  { label: "تركيز أو مفتوح", node: render({ className: forcedField.focus }) },
  { label: "ممتلئ", node: render({ filled: true }) },
  { label: "خطأ", node: render({ filled: true, invalid: true }) },
  { label: "معطّل", node: render({ filled: true, disabled: true }) },
  { label: "للقراءة فقط", node: render({ filled: true, locked: true }) },
];

function LiveDate() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Field label="تاريخ بداية السعر" required hint="لا يبدأ السعر قبل اليوم.">
      <DatePicker value={value} onValueChange={setValue} min={TODAY} today={TODAY} />
    </Field>
  );
}

export function DatePickerSection() {
  return (
    <GallerySection
      name="DatePicker"
      title="التاريخ"
      usage="حقل بنص التاريخ يفتح تقويماً في popover. الأسبوع يبدأ بالسبت، والجمعة والعطل بـ fg-muted ونقطة، والأيام خارج min وmax معطّلة. على الموبايل يصير ورقة سفلية (مع نافذة الدفعة القادمة). القيمة نص ISO كما في العقد."
    >
      <GalleryGroup title="الحقل (مغلق)">
        <StateStack
          states={triggerStates(({ filled, locked, ...state }) => (
            <DatePicker {...state} locked={locked} value={filled ? "2026-11-09" : null} onValueChange={noop} today={TODAY} aria-label="التاريخ" />
          ))}
        />
      </GalleryGroup>

      <GalleryGroup title="التقويم المفتوح (حي: انقر، والأسهم وPageUp وPageDown)">
        <StateStack
          states={[
            {
              label: "اليوم 10 تشرين الثاني، المحدّد 17، والجمعة بنقطة",
              node: (
                <Panel>
                  <Calendar from="2026-11-17" today={TODAY} onSelect={noop} />
                </Panel>
              ),
            },
            {
              label: "min = 5 تشرين الثاني: ما قبله معطّل، والشهر السابق معطّل",
              node: (
                <Panel>
                  <Calendar from={null} initialMonth="2026-11" today={TODAY} min="2026-11-05" onSelect={noop} />
                </Panel>
              ),
            },
            {
              label: "عطلة رسمية: 1 كانون الثاني (مع اسمها في tooltip وقارئ الشاشة)",
              node: (
                <Panel>
                  <Calendar from="2026-01-14" today={TODAY} holidays={holidays} onSelect={noop} />
                </Panel>
              ),
            },
          ]}
        />
      </GalleryGroup>

      <GalleryGroup title="حي داخل Field">
        <StateStack states={[{ label: "min = اليوم", node: <LiveDate /> }]} />
      </GalleryGroup>
    </GallerySection>
  );
}

function LiveRange() {
  const [value, setValue] = useState<DateRange>({ from: null, to: null });
  return (
    <Field label="فترة الإجازة" hint="الضغطة الأولى البداية والثانية النهاية.">
      <DateRangePicker value={value} onValueChange={setValue} today={TODAY} min="2026-11-01" />
    </Field>
  );
}

function LiveRangePanel() {
  const [value, setValue] = useState<DateRange>({ from: "2026-11-12", to: "2026-11-19" });
  return (
    <Panel>
      <DateRangePanel value={value} onValueChange={setValue} today={TODAY} />
    </Panel>
  );
}

export function DateRangePickerSection() {
  return (
    <GallerySection
      name="DateRangePicker"
      title="الفترة"
      usage="للفلاتر والإجازات: من · إلى بتقويم واحد، مع اختصارات (اليوم، هذا الأسبوع، هذا الشهر، الشهر الماضي). الضغطة الأولى البداية، والثانية النهاية، وتمرير المؤشر يعاين الفترة."
    >
      <GalleryGroup title="الحقل (مغلق)">
        <StateStack
          states={[
            { label: "افتراضي", node: <DateRangePicker value={{ from: null, to: null }} onValueChange={noop} today={TODAY} aria-label="الفترة" /> },
            { label: "تمرير (hover)", node: <DateRangePicker className={forcedField.hover} value={{ from: null, to: null }} onValueChange={noop} today={TODAY} aria-label="الفترة" /> },
            { label: "ممتلئ", node: <DateRangePicker value={{ from: "2026-11-12", to: "2026-11-19" }} onValueChange={noop} today={TODAY} aria-label="الفترة" /> },
            { label: "البداية فقط (بانتظار النهاية)", node: <DateRangePicker value={{ from: "2026-11-12", to: null }} onValueChange={noop} today={TODAY} aria-label="الفترة" /> },
            { label: "خطأ", node: <DateRangePicker invalid value={{ from: "2026-11-12", to: "2026-11-19" }} onValueChange={noop} today={TODAY} aria-label="الفترة" /> },
            { label: "معطّل", node: <DateRangePicker disabled value={{ from: "2026-11-12", to: "2026-11-19" }} onValueChange={noop} today={TODAY} aria-label="الفترة" /> },
          ]}
        />
      </GalleryGroup>

      <GalleryGroup title="القائمة المفتوحة (حية)">
        <StateStack alignLabel="top" states={[{ label: "الفترة 12–19 تشرين الثاني", node: <LiveRangePanel /> }]} />
      </GalleryGroup>

      <GalleryGroup title="حي داخل Field (min = أول الشهر)">
        <StateStack states={[{ label: "الإجازة", node: <LiveRange /> }]} />
      </GalleryGroup>
    </GallerySection>
  );
}

function LiveMonth() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Field label="شهر الميزانية" required>
      <MonthPicker value={value} onValueChange={setValue} today={TODAY} closedMonths={["2026-08", "2026-09"]} max="2026-12" />
    </Field>
  );
}

export function MonthPickerSection() {
  return (
    <GallerySection
      name="MonthPicker"
      title="الشهر"
      usage="للمؤشرات والتقارير الشهرية والميزانية: الأشهر في شبكة 3 × 4 مع التنقل بين السنوات. الشهر المغلق بأيقونة قفل ويبقى قابلاً للاختيار للعرض. القيمة نص Month في العقد."
    >
      <GalleryGroup title="الحقل (مغلق)">
        <StateStack
          states={triggerStates(({ filled, locked, ...state }) => (
            <MonthPicker {...state} locked={locked} value={filled ? "2026-11" : null} onValueChange={noop} today={TODAY} aria-label="الشهر" />
          ))}
        />
      </GalleryGroup>

      <GalleryGroup title="الشبكة المفتوحة (حية)">
        <StateStack
          alignLabel="top"
          states={[
            {
              label: "الشهر الحالي بحد، المحدّد بلون، المغلق بقفل",
              node: (
                <Panel>
                  <MonthGrid value="2026-06" currentMonth="2026-11" closedMonths={["2026-06", "2026-07"]} onSelect={noop} />
                </Panel>
              ),
            },
            {
              label: "min = 2026-03 وmax = 2026-11: ما خارجه معطّل، وأسهم السنة معطّلة عند الحد",
              node: (
                <Panel>
                  <MonthGrid value={null} currentMonth="2026-11" min="2026-03" max="2026-11" onSelect={noop} />
                </Panel>
              ),
            },
          ]}
        />
      </GalleryGroup>

      <GalleryGroup title="حي داخل Field">
        <StateStack states={[{ label: "الأشهر المغلقة: آب وأيلول، وmax = كانون الأول", node: <LiveMonth /> }]} />
      </GalleryGroup>
    </GallerySection>
  );
}
