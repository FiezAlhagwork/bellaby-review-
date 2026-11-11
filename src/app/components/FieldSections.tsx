"use client";

import { UserCircle } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { NumberInput } from "@/components/ui/NumberInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { SearchInput } from "@/components/ui/SearchInput";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { forcedField } from "./forced-states";
import { GalleryGroup, GallerySection, StateStack } from "./gallery-kit";

const noop = () => {};

type FieldDemoState = {
  className?: string;
  filled?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  /** للقراءة فقط بقاعدة. */
  locked?: boolean;
};

const fieldLabels = ["افتراضي", "تمرير (hover)", "تركيز (focus)", "ممتلئ", "خطأ", "معطّل", "للقراءة فقط"] as const;

const fieldStates: FieldDemoState[] = [
  {},
  { className: forcedField.hover },
  { className: forcedField.focus },
  { filled: true },
  { filled: true, invalid: true },
  { filled: true, disabled: true },
  { filled: true, locked: true },
];

/** الحالات السبع لحقل واحد، كل حالة بعرض الحقل الكامل (StateStack). */
function FieldStack({ render }: { render: (state: FieldDemoState & { className: string }) => ReactNode }) {
  return (
    <StateStack
      states={fieldStates.map((state, index) => ({
        label: fieldLabels[index],
        node: render({ ...state, className: cn("w-full", state.className) }),
      }))}
    />
  );
}

/** عدّاد حي: الأزرار تعمل فعلاً (الحالة هنا للمعرض وحده، المكوّن controlled). */
function LiveNumber(props: Omit<React.ComponentProps<typeof NumberInput>, "value" | "onValueChange"> & { initial: number | null }) {
  const { initial, ...rest } = props;
  const [value, setValue] = useState<number | null>(initial);
  return <NumberInput {...rest} className="w-full" value={value} onValueChange={setValue} />;
}

export function FieldSection() {
  return (
    <GallerySection
      name="Field · Input"
      title="الحقل والإدخال"
      usage="Field غلاف التسمية والرسالة، وInput الإدخال. الغلاف وحده يحمل الحد والخلفية. الخطأ من الخادم كما هو أو من error-messages.ts. controlled بـ value وonChange."
    >
      <GalleryGroup title="Input (ارتفاع 40، و48 على الموبايل)">
        <FieldStack
          render={({ filled, ...state }) => <Input {...state} placeholder="الاسم" defaultValue={filled ? "سامر الحلبي" : undefined} />}
        />
      </GalleryGroup>

      <GalleryGroup title="Input + أيقونة">
        <FieldStack
          render={({ filled, ...state }) => (
            <Input {...state} icon={<UserCircle size={20} />} placeholder="الموظف" defaultValue={filled ? "رامي السيد" : undefined} />
          )}
        />
      </GalleryGroup>

      <GalleryGroup title="SearchInput">
        <FieldStack
          render={({ filled, locked, ...state }) => (
            <SearchInput {...state} readOnly={locked} placeholder="ابحث" value={filled ? "حليب" : ""} onChange={noop} onClear={noop} />
          )}
        />
      </GalleryGroup>

      <GalleryGroup title="MoneyInput">
        <FieldStack
          render={({ filled, locked, ...state }) => <MoneyInput {...state} readOnly={locked} defaultValue={filled ? "1250.50" : undefined} />}
        />
      </GalleryGroup>

      <GalleryGroup title="PhoneInput">
        <FieldStack
          render={({ filled, locked, ...state }) => <PhoneInput {...state} readOnly={locked} defaultValue={filled ? "944123456" : undefined} />}
        />
      </GalleryGroup>

      <GalleryGroup title="Textarea (3 أسطر)">
        <FieldStack
          render={({ filled, ...state }) => (
            <Textarea {...state} placeholder="ملاحظات" defaultValue={filled ? "تسليم باليد صباحاً مع مراجعة الدفعة." : undefined} />
          )}
        />
      </GalleryGroup>

      <GalleryGroup title="NumberInput">
        <StateStack
          states={[
            { label: "فارغ", node: <LiveNumber initial={null} min={0} unit="علبة" aria-label="الكمية" /> },
            { label: "بقيمة", node: <LiveNumber initial={120} min={0} unit="علبة" aria-label="الكمية" /> },
            { label: "مع المتاح", node: <LiveNumber initial={120} min={0} available={240} unit="علبة" aria-label="الكمية" /> },
            { label: "تجاوز المتاح", node: <LiveNumber initial={300} min={0} available={240} unit="علبة" aria-label="الكمية" /> },
            { label: "معطّل", node: <LiveNumber initial={120} min={0} unit="علبة" disabled aria-label="الكمية" /> },
            { label: "عند الحد الأدنى", node: <LiveNumber initial={0} min={0} unit="علبة" aria-label="الكمية" /> },
          ]}
        />
      </GalleryGroup>

      <GalleryGroup title="داخل Field (تسمية، إلزامي، اختياري، مساعد، خطأ)">
        <div className="flex flex-col gap-6">
          <CaptureRow className="items-start gap-6">
            <div className="min-w-0 flex-1">
              <Field label="اسم الموظف" required hint="كما في الهوية الشخصية.">
                <Input placeholder="مثال: سامر الحلبي" />
              </Field>
            </div>
            <div className="min-w-0 flex-1">
              <Field label="ملاحظات" optional>
                <Textarea placeholder="تظهر للمستلم في تفاصيل الصرف." />
              </Field>
            </div>
          </CaptureRow>
          <CaptureRow className="items-start gap-6">
            <div className="min-w-0 flex-1">
              <Field label="رقم الهاتف" required error="الرقم غير مسجّل كمندوب.">
                <PhoneInput defaultValue="944123456" />
              </Field>
            </div>
            <div className="min-w-0 flex-1">
              <Field label="تاريخ التسليم" hint="تاريخ التسليم لحظة التسجيل ولا يُعدَّل.">
                <Input locked defaultValue="9 تشرين الثاني 2026" />
              </Field>
            </div>
          </CaptureRow>
        </div>
      </GalleryGroup>
    </GallerySection>
  );
}
