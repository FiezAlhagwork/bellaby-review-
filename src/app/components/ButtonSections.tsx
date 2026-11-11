"use client";

import { DotsThreeVertical, FloppyDisk, Pencil, Plus, Prohibit } from "@phosphor-icons/react";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { IconButton, type IconButtonVariant } from "@/components/ui/IconButton";
import { forcedButton } from "./forced-states";
import { GalleryGroup, GallerySection, StateTable } from "./gallery-kit";

const stateColumns = ["افتراضي", "تمرير (hover)", "تركيز (focus)", "مضغوط", "معطّل", "تحميل"] as const;

const buttonRows: { variant: ButtonVariant; text: string }[] = [
  { variant: "primary", text: "اعتماد" },
  { variant: "secondary", text: "إلغاء" },
  { variant: "ghost", text: "عرض التفاصيل" },
  { variant: "danger", text: "رفض" },
  { variant: "danger-ghost", text: "إلغاء الطلب" },
];

export function ButtonSection() {
  return (
    <GallerySection
      name="Button"
      title="الزر"
      usage="الإجراء في الشاشة أو النافذة. primary واحد فقط في كل منطقة، وdanger لإجراء لا رجعة فيه أو قرار سلبي. اسم الإجراء بصيغة المصدر."
    >
      <GalleryGroup title="المتغيّرات والحالات (md · 40)">
        <StateTable
          columns={stateColumns}
          rows={buttonRows.map(({ variant, text }) => ({
            label: variant,
            cells: [
              <Button key="default" variant={variant}>
                {text}
              </Button>,
              <Button key="hover" variant={variant} className={forcedButton.hover[variant]}>
                {text}
              </Button>,
              <Button key="focus" variant={variant} className={forcedButton.focus}>
                {text}
              </Button>,
              <Button key="pressed" variant={variant} className={forcedButton.pressed[variant]}>
                {text}
              </Button>,
              <Button key="disabled" variant={variant} disabled>
                {text}
              </Button>,
              <Button key="loading" variant={variant} icon={Plus} loading>
                {text}
              </Button>,
            ],
          }))}
        />
      </GalleryGroup>

      <GalleryGroup title="الأحجام والأيقونات">
        <StateTable
          columns={["sm · 32", "md · 40", "lg · 48"]}
          rows={[
            {
              label: "primary",
              cells: [
                <Button key="sm" size="sm">
                  حفظ
                </Button>,
                <Button key="md" size="md">
                  حفظ
                </Button>,
                <Button key="lg" size="lg">
                  حفظ
                </Button>,
              ],
            },
            {
              label: "secondary + أيقونة",
              cells: [
                <Button key="sm" variant="secondary" size="sm" icon={Pencil}>
                  تعديل
                </Button>,
                <Button key="md" variant="secondary" size="md" icon={Pencil}>
                  تعديل
                </Button>,
                <Button key="lg" variant="secondary" size="lg" icon={Pencil}>
                  تعديل
                </Button>,
              ],
            },
            {
              label: "تحميل: العرض نفسه",
              cells: [
                <Button key="sm" size="sm" loading>
                  حفظ
                </Button>,
                <Button key="md" size="md" loading>
                  حفظ
                </Button>,
                <Button key="lg" size="lg" loading>
                  حفظ
                </Button>,
              ],
            },
          ]}
        />
        <StateTable
          columns={["أيقونة قبل النص", "أيقونة بعده", "الاثنتان", "بعرض كامل"]}
          rows={[
            {
              label: "primary · md",
              cells: [
                <Button key="start" icon={FloppyDisk}>
                  حفظ
                </Button>,
                <Button key="end" iconEnd={Plus}>
                  إضافة سطر
                </Button>,
                <Button key="both" icon={FloppyDisk} iconEnd={Plus}>
                  حفظ وإضافة
                </Button>,
                <Button key="full" fullWidth>
                  إرسال للمراجعة
                </Button>,
              ],
            },
          ]}
        />
      </GalleryGroup>
    </GallerySection>
  );
}

const iconRows: { variant: IconButtonVariant; icon: typeof Pencil; label: string }[] = [
  { variant: "secondary", icon: Pencil, label: "تعديل" },
  { variant: "ghost", icon: DotsThreeVertical, label: "المزيد" },
  { variant: "danger-ghost", icon: Prohibit, label: "إيقاف" },
];

export function IconButtonSection() {
  return (
    <GallerySection
      name="IconButton"
      title="زر الأيقونة"
      usage="إجراء ثانوي بأيقونة وحدها (قائمة الإجراءات في الجدول، إغلاق). aria-label إلزامي، ويظهر tooltip بالنص نفسه حين يُبنى Tooltip."
    >
      <GalleryGroup title="المتغيّرات والحالات (md · 40، و44 على الموبايل)">
        <StateTable
          columns={stateColumns}
          rows={iconRows.map(({ variant, icon, label }) => ({
            label: variant,
            cells: [
              <IconButton key="default" variant={variant} icon={icon} aria-label={label} />,
              <IconButton key="hover" variant={variant} icon={icon} aria-label={label} className={forcedButton.hover[variant]} />,
              <IconButton key="focus" variant={variant} icon={icon} aria-label={label} className={forcedButton.focus} />,
              <IconButton key="pressed" variant={variant} icon={icon} aria-label={label} className={forcedButton.pressed[variant]} />,
              <IconButton key="disabled" variant={variant} icon={icon} aria-label={label} disabled />,
              <IconButton key="loading" variant={variant} icon={icon} aria-label={label} loading />,
            ],
          }))}
        />
      </GalleryGroup>
      <GalleryGroup title="الأحجام">
        <StateTable
          columns={["sm · 32 (أيقونة 16)", "md · 40 (أيقونة 20)"]}
          rows={iconRows.map(({ variant, icon, label }) => ({
            label: variant,
            cells: [
              <IconButton key="sm" variant={variant} size="sm" icon={icon} aria-label={label} />,
              <IconButton key="md" variant={variant} size="md" icon={icon} aria-label={label} />,
            ],
          }))}
        />
      </GalleryGroup>
    </GallerySection>
  );
}
