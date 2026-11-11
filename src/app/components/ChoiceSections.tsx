"use client";

import { Rows, SquaresFour } from "@phosphor-icons/react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Radio, RadioCard, RadioGroup } from "@/components/ui/Radio";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Switch } from "@/components/ui/Switch";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { forcedCard, forcedChoice, forcedSwitch } from "./forced-states";
import { GalleryGroup, GallerySection, StateStack } from "./gallery-kit";

const noop = () => {};

/** عنصر بعرضه الذاتي داخل خلية أعرض منه: في صف، فيبقى عند البداية (يمين) في الوضعين. */
function Start({ children }: { children: ReactNode }) {
  return <CaptureRow>{children}</CaptureRow>;
}

/** الحالة هنا للمعرض وحده: المكوّنات controlled. تعمل بالنقر فعلاً. */
function Live<T>({ initial, children }: { initial: T; children: (value: T, set: (value: T) => void) => ReactNode }) {
  const [value, setValue] = useState(initial);
  return children(value, setValue);
}

type CheckboxDemo = Omit<ComponentProps<typeof Checkbox>, "checked" | "onCheckedChange"> & { initial?: boolean };

function LiveCheckbox({ initial = false, ...rest }: CheckboxDemo) {
  return <Live initial={initial}>{(checked, set) => <Checkbox {...(rest as ComponentProps<typeof Checkbox>)} checked={checked} onCheckedChange={set} />}</Live>;
}

type SwitchDemo = Omit<ComponentProps<typeof Switch>, "checked" | "onCheckedChange"> & { initial?: boolean };

function LiveSwitch({ initial = false, ...rest }: SwitchDemo) {
  return <Live initial={initial}>{(checked, set) => <Switch {...(rest as ComponentProps<typeof Switch>)} checked={checked} onCheckedChange={set} />}</Live>;
}

export function CheckboxSection() {
  return (
    <GallerySection
      name="Checkbox"
      title="مربع الاختيار"
      usage="16 على الويب و20 على الموبايل. للاختيار الذي يحتاج حفظاً، ولتحديد الكل في رأس الجدول (جزئي). النص بعد المربع. يعمل بالنقر."
    >
      <GalleryGroup title="الحالات">
        <StateStack
          alignLabel="top"
          states={[
            { label: "افتراضي", node: <LiveCheckbox label="أوافق على الشروط" /> },
            { label: "تمرير (hover)", node: <LiveCheckbox label="أوافق على الشروط" className={forcedChoice.hover} /> },
            { label: "تركيز (focus)", node: <LiveCheckbox label="أوافق على الشروط" className={forcedChoice.focus} /> },
            { label: "محدّد", node: <LiveCheckbox label="أوافق على الشروط" initial /> },
            { label: "جزئي (تحديد الكل)", node: <Checkbox label="تحديد الكل" checked={false} indeterminate onCheckedChange={noop} /> },
            { label: "خطأ", node: <LiveCheckbox label="أوافق على الشروط" invalid /> },
            { label: "معطّل", node: <LiveCheckbox label="أوافق على الشروط" disabled /> },
            { label: "معطّل ومحدّد", node: <LiveCheckbox label="أوافق على الشروط" disabled initial /> },
            { label: "للقراءة فقط", node: <LiveCheckbox label="أوافق على الشروط" readOnly initial /> },
            { label: "مع شرح", node: <LiveCheckbox label="إشعاري عند الاعتماد" description="يصلك إشعار حين يُعتمد الصرف." initial /> },
            { label: "بلا نص (رأس الجدول)", node: (
                <Start>
                  <LiveCheckbox aria-label="تحديد كل الصفوف" />
                </Start>
              ), },
          ]}
        />
      </GalleryGroup>
    </GallerySection>
  );
}

export function RadioSection() {
  return (
    <GallerySection
      name="Radio · RadioCard"
      title="الاختيار الواحد"
      usage="Radio للاختيار من 2 إلى 5 خيارات ظاهرة، وما زاد عن 5 فهو Select. وRadioCard لقرار مهم بعنوان ووصف. الأسهم تنقل بين الخيارات."
    >
      <GalleryGroup title="Radio">
        <StateStack
          alignLabel="top"
          states={[
            {
              label: "افتراضي (لا اختيار)",
              node: (
                <Live<string | null> initial={null}>
                  {(value, set) => (
                    <RadioGroup value={value} onValueChange={set} aria-label="نوع التسليم">
                      <Radio value="hand" label="تسليم باليد" />
                      <Radio value="courier" label="عبر ناقل" />
                    </RadioGroup>
                  )}
                </Live>
              ),
            },
            {
              label: "تمرير وتركيز (مُجبَران)",
              node: (
                <RadioGroup value={null} onValueChange={noop} aria-label="نوع التسليم">
                  <Radio value="a" label="تمرير (hover)" className={forcedChoice.hover} />
                  <Radio value="b" label="تركيز (focus)" className={forcedChoice.focus} />
                </RadioGroup>
              ),
            },
            {
              label: "محدّد، مع شرح، ومعطّل",
              node: (
                <Live<string | null> initial="hand">
                  {(value, set) => (
                    <RadioGroup value={value} onValueChange={set} aria-label="نوع التسليم">
                      <Radio value="hand" label="تسليم باليد" description="يوقّع المستلم على الشاشة." />
                      <Radio value="courier" label="عبر ناقل" description="يُسجَّل رقم الشحنة." />
                      <Radio value="post" label="بريد" disabled />
                    </RadioGroup>
                  )}
                </Live>
              ),
            },
            {
              label: "خطأ (داخل Field)",
              node: (
                <Field label="نوع التسليم" required error="اختر نوع التسليم.">
                  <RadioGroup value={null} onValueChange={noop}>
                    <Radio value="hand" label="تسليم باليد" />
                    <Radio value="courier" label="عبر ناقل" />
                  </RadioGroup>
                </Field>
              ),
            },
            {
              label: "المجموعة معطّلة",
              node: (
                <RadioGroup value="hand" onValueChange={noop} aria-label="نوع التسليم" disabled>
                  <Radio value="hand" label="تسليم باليد" />
                  <Radio value="courier" label="عبر ناقل" />
                </RadioGroup>
              ),
            },
            {
              label: "للقراءة فقط",
              node: (
                <RadioGroup value="hand" onValueChange={noop} aria-label="نوع التسليم" readOnly>
                  <Radio value="hand" label="تسليم باليد" />
                  <Radio value="courier" label="عبر ناقل" />
                </RadioGroup>
              ),
            },
            {
              label: "أفقي",
              node: (
                <Live<string | null> initial="monthly">
                  {(value, set) => (
                    <RadioGroup value={value} onValueChange={set} aria-label="الفترة" orientation="horizontal">
                      <Radio value="daily" label="يومي" />
                      <Radio value="monthly" label="شهري" />
                    </RadioGroup>
                  )}
                </Live>
              ),
            },
          ]}
        />
      </GalleryGroup>

      <GalleryGroup title="RadioCard: قرار المدير التنفيذي على المهمة المتأخرة">
        <StateStack
          alignLabel="top"
          states={[
            {
              label: "لا اختيار",
              node: (
                <Live<string | null> initial={null}>
                  {(value, set) => (
                    <RadioGroup value={value} onValueChange={set} aria-label="قرار المهمة المتأخرة">
                      <RadioCard value="deduct-open" title="خصم ويبقى مفتوحاً" description="يُخصم من المندوب وتبقى المهمة مفتوحة للتنفيذ." />
                      <RadioCard value="deduct-close" title="خصم وإغلاق" description="يُخصم من المندوب وتُغلق المهمة." />
                      <RadioCard value="close" title="إغلاق دون خصم" description="تُغلق المهمة بلا أثر مالي." />
                      <RadioCard value="none" title="لا إجراء" description="تبقى المهمة كما هي." />
                    </RadioGroup>
                  )}
                </Live>
              ),
            },
            {
              label: "تمرير وتركيز (مُجبَران)",
              node: (
                <RadioGroup value={null} onValueChange={noop} aria-label="قرار المهمة المتأخرة">
                  <RadioCard value="a" title="تمرير (hover)" description="الحد يغمق." className={forcedCard.hover} />
                  <RadioCard value="b" title="تركيز (focus)" description="حلقة التركيز." className={forcedCard.focus} />
                </RadioGroup>
              ),
            },
            {
              label: "محدّد وخيار معطّل بسببه",
              node: (
                <RadioGroup value="close" onValueChange={noop} aria-label="قرار المهمة المتأخرة">
                  <RadioCard value="deduct-open" title="خصم ويبقى مفتوحاً" description="يُخصم من المندوب وتبقى المهمة مفتوحة." />
                  <RadioCard value="close" title="إغلاق دون خصم" description="تُغلق المهمة بلا أثر مالي." />
                  <RadioCard value="deduct-close" title="خصم وإغلاق" description="يُخصم من المندوب وتُغلق المهمة." disabled reason="الشهر مغلق، فلا يمكن الخصم." />
                </RadioGroup>
              ),
            },
          ]}
        />
      </GalleryGroup>
    </GallerySection>
  );
}

export function SwitchSection() {
  return (
    <GallerySection
      name="Switch"
      title="المفتاح"
      usage="لإعداد يسري فوراً دون حفظ فقط. ما يحتاج حفظاً فهو Checkbox. النص في البداية والمفتاح في النهاية. يعمل بالنقر."
    >
      <GalleryGroup title="الحالات">
        <StateStack
          alignLabel="top"
          states={[
            { label: "مطفأ", node: <LiveSwitch label="إشعارات البريد" /> },
            { label: "مشغّل", node: <LiveSwitch label="إشعارات البريد" initial /> },
            { label: "تمرير مطفأ (hover)", node: <LiveSwitch label="إشعارات البريد" className={forcedSwitch.hoverOff} /> },
            { label: "تمرير مشغّل (hover)", node: <LiveSwitch label="إشعارات البريد" initial className={forcedSwitch.hoverOn} /> },
            { label: "تركيز (focus)", node: <LiveSwitch label="إشعارات البريد" className={forcedSwitch.focus} /> },
            { label: "معطّل مطفأ", node: <LiveSwitch label="إشعارات البريد" disabled /> },
            { label: "معطّل مشغّل", node: <LiveSwitch label="إشعارات البريد" disabled initial /> },
            { label: "للقراءة فقط", node: <LiveSwitch label="إشعارات البريد" readOnly initial /> },
            { label: "مع شرح", node: <LiveSwitch label="إشعارات البريد" description="يصلك بريد عند كل اعتماد." initial /> },
            { label: "بلا نص", node: (
                <Start>
                  <LiveSwitch aria-label="تفعيل الإشعارات" initial />
                </Start>
              ), },
          ]}
        />
      </GalleryGroup>
    </GallerySection>
  );
}

export function SegmentedSection() {
  return (
    <GallerySection
      name="SegmentedControl"
      title="التبديل بين العروض"
      usage="للتبديل بين عرضين إلى أربعة للمحتوى نفسه: جدول وبطاقات، يومي وشهري. اختيار واحد دائماً. الأسهم تنقل. الارتفاع كالحقول."
    >
      <GalleryGroup title="الحالات">
        <StateStack
          states={[
            {
              label: "نص فقط",
              node: (
                <Live initial="daily">
                  {(value, set) => (
                    <SegmentedControl
                      aria-label="الفترة"
                      value={value}
                      onValueChange={set}
                      options={[
                        { value: "daily", label: "يومي" },
                        { value: "monthly", label: "شهري" },
                      ]}
                    />
                  )}
                </Live>
              ),
            },
            {
              label: "بأيقونات",
              node: (
                <Live initial="table">
                  {(value, set) => (
                    <SegmentedControl
                      aria-label="طريقة العرض"
                      value={value}
                      onValueChange={set}
                      options={[
                        { value: "table", label: "جدول", icon: Rows },
                        { value: "cards", label: "بطاقات", icon: SquaresFour },
                      ]}
                    />
                  )}
                </Live>
              ),
            },
            {
              label: "أربعة أجزاء بعرض الحاوية",
              node: (
                <Live initial="week">
                  {(value, set) => (
                    <SegmentedControl
                      fullWidth
                      aria-label="الفترة"
                      value={value}
                      onValueChange={set}
                      options={[
                        { value: "today", label: "اليوم" },
                        { value: "week", label: "الأسبوع" },
                        { value: "month", label: "الشهر" },
                        { value: "year", label: "السنة" },
                      ]}
                    />
                  )}
                </Live>
              ),
            },
            {
              label: "جزء معطّل",
              node: (
                <SegmentedControl
                  aria-label="الفترة"
                  value="daily"
                  onValueChange={noop}
                  options={[
                    { value: "daily", label: "يومي" },
                    { value: "monthly", label: "شهري", disabled: true },
                  ]}
                />
              ),
            },
            {
              label: "كله معطّل",
              node: (
                <SegmentedControl
                  aria-label="الفترة"
                  value="daily"
                  disabled
                  onValueChange={noop}
                  options={[
                    { value: "daily", label: "يومي" },
                    { value: "monthly", label: "شهري" },
                  ]}
                />
              ),
            },
          ]}
        />
      </GalleryGroup>
    </GallerySection>
  );
}
