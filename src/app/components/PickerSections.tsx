"use client";

import { Check } from "@phosphor-icons/react";
import { useState } from "react";
import { Combobox } from "@/components/ui/Combobox";
import { Field } from "@/components/ui/Field";
import {
  OptionContent,
  OptionsEmpty,
  OptionsError,
  OptionsLoading,
  optionClass,
  optionPopupClass,
  type Option,
  type OptionsState,
} from "@/components/ui/OptionList";
import { Select } from "@/components/ui/Select";
import { forcedField } from "./forced-states";
import { GalleryGroup, GallerySection, StateStack } from "./gallery-kit";

const noop = () => {};

const returnReasons = [
  { value: "damaged", label: "تالف" },
  { value: "expired", label: "منتهي الصلاحية" },
  { value: "wrong-item", label: "خطأ في الصنف" },
  { value: "refused", label: "رفض العميل" },
  { value: "overstock", label: "زيادة عن الطلب", disabled: true, reason: "غير متاح لهذا النوع من الصرف." },
] as const satisfies readonly Option[];

type ReturnReason = (typeof returnReasons)[number]["value"];

const items: readonly Option[] = [
  { value: "milk-1-400", label: "حليب أطفال المرحلة الأولى 400غ" },
  { value: "milk-1-800", label: "حليب أطفال المرحلة الأولى 800غ" },
  { value: "milk-2-400", label: "حليب أطفال المرحلة الثانية 400غ" },
  { value: "milk-2-800", label: "حليب أطفال المرحلة الثانية 800غ", disabled: true, reason: "موقوفة منذ 3 تشرين الثاني" },
  { value: "milk-3-400", label: "حليب أطفال المرحلة الثالثة 400غ" },
  { value: "milk-3-800", label: "حليب أطفال المرحلة الثالثة 800غ" },
  { value: "milk-ar-400", label: "حليب أطفال خالٍ من اللاكتوز 400غ" },
  { value: "milk-hp-400", label: "حليب أطفال مضاد للارتجاع 400غ" },
  { value: "cereal-rice", label: "سيريلاك أرز 250غ" },
  { value: "cereal-wheat", label: "سيريلاك قمح بالحليب 250غ" },
  { value: "cereal-fruit", label: "سيريلاك فواكه 250غ" },
  { value: "water", label: "ماء أطفال معقّم 1.5 لتر" },
];

/** خيار مرسوم بصنف الخيار الحقيقي نفسه. الحالة (إبراز، مختار، معطّل) بسمات data كما يضعها Base UI. */
function PreviewOption({ label, reason, state }: { label: string; reason?: string; state?: "highlighted" | "selected" | "disabled" }) {
  return (
    <div
      data-highlighted={state === "highlighted" ? "" : undefined}
      data-selected={state === "selected" ? "" : undefined}
      data-disabled={state === "disabled" ? "" : undefined}
      className={optionClass}
    >
      <OptionContent label={label} reason={reason} indicator={state === "selected" ? <Check size={16} aria-hidden="true" /> : null} />
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  // صورة للعرض فقط: لا تُقرأ كقائمة حقيقية.
  return (
    <div aria-hidden="true" className={`${optionPopupClass} w-full`}>
      {children}
    </div>
  );
}

const triggerStates = (render: (state: { className?: string; filled?: boolean; invalid?: boolean; disabled?: boolean; locked?: boolean }) => React.ReactNode) => [
  { label: "افتراضي", node: render({}) },
  { label: "تمرير (hover)", node: render({ className: forcedField.hover }) },
  { label: "تركيز أو مفتوح", node: render({ className: forcedField.focus }) },
  { label: "ممتلئ", node: render({ filled: true }) },
  { label: "خطأ", node: render({ filled: true, invalid: true }) },
  { label: "معطّل", node: render({ filled: true, disabled: true }) },
  { label: "للقراءة فقط", node: render({ filled: true, locked: true }) },
];

function LiveSelect() {
  const [value, setValue] = useState<ReturnReason | null>(null);
  return (
    <Field label="سبب الإرجاع" required hint="اختر من القائمة.">
      <Select options={returnReasons} value={value} onValueChange={setValue} placeholder="اختر السبب" />
    </Field>
  );
}

export function SelectSection() {
  return (
    <GallerySection
      name="Select"
      title="القائمة المنسدلة"
      usage="للقوائم القصيرة حتى 10 خيارات. الزر بشكل الحقل نفسه. الخيار المعطّل يظهر ولا يُختار ومعه سببه. المختار بعلامة Check في النهاية."
    >
      <GalleryGroup title="الزر (مغلقة)">
        <StateStack
          states={triggerStates(({ filled, locked, ...state }) => (
            <Select
              {...state}
              locked={locked}
              options={returnReasons}
              value={filled ? "expired" : null}
              onValueChange={noop}
              placeholder="اختر السبب"
              aria-label="سبب الإرجاع"
            />
          ))}
        />
      </GalleryGroup>

      <GalleryGroup title="القائمة (مفتوحة): عادي، إبراز بالتمرير أو لوحة المفاتيح، مختار، معطّل بسببه">
        <StateStack
          states={[
            {
              label: "القائمة",
              node: (
                <Panel>
                  <div className="py-1">
                    <PreviewOption label="تالف" />
                    <PreviewOption label="منتهي الصلاحية" state="selected" />
                    <PreviewOption label="خطأ في الصنف" state="highlighted" />
                    <PreviewOption label="رفض العميل" />
                    <PreviewOption label="زيادة عن الطلب" reason="غير متاح لهذا النوع من الصرف." state="disabled" />
                  </div>
                </Panel>
              ),
            },
          ]}
        />
      </GalleryGroup>

      <GalleryGroup title="حي: انقر، واستعمل الأسهم والكتابة السريعة">
        <StateStack states={[{ label: "داخل Field", node: <LiveSelect /> }]} />
      </GalleryGroup>
    </GallerySection>
  );
}

function LiveCombobox() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Field label="الصنف" required hint="اكتب للبحث في القائمة.">
      <Combobox options={items} value={value} onValueChange={setValue} placeholder="ابحث عن صنف" clearable />
    </Field>
  );
}

function LiveMulti() {
  const [value, setValue] = useState<string[]>(["milk-1-400", "milk-3-400"]);
  return (
    <Field label="الأصناف" optional>
      <Combobox multiple options={items} value={value} onValueChange={setValue} placeholder="اختر أصنافاً" />
    </Field>
  );
}

/** يحاكي البحث من الخادم: التحميل 600 مللي ثانية ثم النتائج. الأب هو من يصفّي. */
function LiveServerSearch() {
  const [value, setValue] = useState<string | null>(null);
  const [options, setOptions] = useState<readonly Option[]>(items.slice(0, 5));
  const [state, setState] = useState<OptionsState>({ status: "ready" });

  const search = (query: string) => {
    setState({ status: "loading" });
    window.setTimeout(() => {
      setOptions(items.filter((item) => item.label.includes(query)));
      setState({ status: "ready" });
    }, 600);
  };

  return (
    <Field label="الصنف (بحث من الخادم)" hint="يحمّل 600 مللي ثانية عند كل كتابة.">
      <Combobox options={options} optionsState={state} onQueryChange={search} value={value} onValueChange={setValue} placeholder="ابحث" />
    </Field>
  );
}

export function ComboboxSection() {
  return (
    <GallerySection
      name="Combobox"
      title="قائمة مع بحث"
      usage="للقوائم الطويلة: الصنف، الدفعة، الصيدلية، الموظف، الوكيل. الكتابة تصفّي. الاختيار المتعدد بشارات، وبعد 3 شارات «+N». البحث من الخادم بـ onQueryChange."
    >
      <GalleryGroup title="الحقل: اختيار واحد (مغلق)">
        <StateStack
          states={triggerStates(({ filled, locked, ...state }) => (
            <Combobox
              {...state}
              locked={locked}
              options={items}
              value={filled ? "milk-1-400" : null}
              onValueChange={noop}
              placeholder="ابحث عن صنف"
              aria-label="الصنف"
            />
          ))}
        />
      </GalleryGroup>

      <GalleryGroup title="الحقل: اختيار متعدد">
        <StateStack
          states={[
            {
              label: "فارغ",
              node: <Combobox multiple options={items} value={[]} onValueChange={noop} placeholder="اختر أصنافاً" aria-label="الأصناف" />,
            },
            {
              label: "شارتان",
              node: <Combobox multiple options={items} value={["milk-1-400", "water"]} onValueChange={noop} aria-label="الأصناف" />,
            },
            {
              label: "5 محدّدة: 3 شارات و«+2»",
              node: (
                <Combobox
                  multiple
                  options={items}
                  value={["milk-1-400", "milk-3-400", "cereal-rice", "cereal-fruit", "water"]}
                  onValueChange={noop}
                  aria-label="الأصناف"
                />
              ),
            },
            {
              label: "خطأ",
              node: <Combobox multiple invalid options={items} value={[]} onValueChange={noop} placeholder="اختر أصنافاً" aria-label="الأصناف" />,
            },
            {
              label: "معطّل",
              node: <Combobox multiple disabled options={items} value={["milk-1-400", "water"]} onValueChange={noop} aria-label="الأصناف" />,
            },
          ]}
        />
      </GalleryGroup>

      <GalleryGroup title="القائمة المفتوحة: خيارات، تحميل، لا نتائج، خطأ (تشترك بها القائمتان)">
        <StateStack
          states={[
            {
              label: "خيارات: مختار، إبراز، معطّل بسببه",
              node: (
                <Panel>
                  <div className="py-1">
                    <PreviewOption label="حليب أطفال المرحلة الأولى 400غ" state="selected" />
                    <PreviewOption label="حليب أطفال المرحلة الأولى 800غ" state="highlighted" />
                    <PreviewOption label="حليب أطفال المرحلة الثانية 400غ" />
                    <PreviewOption label="حليب أطفال المرحلة الثانية 800غ" reason="موقوفة منذ 3 تشرين الثاني" state="disabled" />
                  </div>
                </Panel>
              ),
            },
            {
              label: "تحميل (3 أسطر)",
              node: (
                <Panel>
                  <OptionsLoading />
                </Panel>
              ),
            },
            {
              label: "لا نتائج",
              node: (
                <Panel>
                  <OptionsEmpty query="حليب 3" />
                </Panel>
              ),
            },
            {
              label: "لا خيارات",
              node: (
                <Panel>
                  <OptionsEmpty />
                </Panel>
              ),
            },
            {
              label: "خطأ مع إعادة المحاولة",
              node: (
                <Panel>
                  <OptionsError code="too_many_requests" onRetry={noop} />
                </Panel>
              ),
            },
          ]}
        />
      </GalleryGroup>

      <GalleryGroup title="حي: اكتب في الحقل، وجرّب الأسهم وEnter وBackspace">
        <StateStack
          states={[
            { label: "اختيار واحد مع مسح", node: <LiveCombobox /> },
            { label: "اختيار متعدد", node: <LiveMulti /> },
            { label: "بحث من الخادم", node: <LiveServerSearch /> },
          ]}
        />
      </GalleryGroup>
    </GallerySection>
  );
}
