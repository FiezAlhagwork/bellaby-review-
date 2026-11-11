"use client";

import { Gear, PencilSimple, Prohibit, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { IconButton } from "@/components/ui/IconButton";
import { Menu, MenuContent, menuPanelClass, type MenuItem } from "@/components/ui/Menu";
import { PersonCell } from "@/components/ui/PersonCell";
import { Popover } from "@/components/ui/Popover";
import { Tabs } from "@/components/ui/Tabs";
import { Tooltip, tooltipClass } from "@/components/ui/Tooltip";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { GalleryGroup, GallerySection, StateStack } from "./gallery-kit";
import { FakePage, Frame } from "./OverlaySections";

const noop = () => {};

const menuItems: readonly MenuItem[] = [
  { id: "edit", label: "تعديل", icon: PencilSimple, onSelect: noop },
  { id: "settings", label: "الإعدادات", icon: Gear, onSelect: noop },
  { id: "suspend", label: "إيقاف", icon: Prohibit, disabled: true, reason: "الدفعة موقوفة أصلاً.", onSelect: noop },
  { id: "delete", label: "حذف", icon: Trash, danger: true, onSelect: noop },
];

function DrawerBody() {
  return (
    <div className="flex flex-col gap-4">
      <Field label="الحالة">
        <Input defaultValue="مفتوحة" locked />
      </Field>
      <Field label="المسؤول">
        <PersonCell name="سامر الحلبي" subtitle="دمشق" />
      </Field>
      <Field label="ملاحظات" optional>
        <Input placeholder="تظهر في السجل." />
      </Field>
    </div>
  );
}

const drawerActions = [
  <Button key="close" variant="secondary" onClick={noop}>
    إغلاق
  </Button>,
  <Button key="act" onClick={noop}>
    إحالة للتحقيق
  </Button>,
];

function LiveDrawer() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        فتح الدرج
      </Button>
      <FakePage />
      <Drawer open={open} onOpenChange={setOpen} title="تفاصيل العلامة" description="رقم 1042 · بتاريخ 9 تشرين الثاني" actions={drawerActions}>
        <DrawerBody />
      </Drawer>
    </div>
  );
}

export function DrawerSection() {
  return (
    <GallerySection
      name="Drawer"
      title="الدرج"
      usage="لوحة من البداية (يمين) بعرض 480 أو 640 بارتفاع المضيف، لعرض تفاصيل عنصر دون مغادرة القائمة. على الموبايل شاشة كاملة بزر رجوع. يحبس التركيز ويغلق بـ Esc."
    >
      <GalleryGroup title="مفتوح (ثابت للعرض)">
        <div className="flex flex-col gap-6">
          <Frame label="sm: 480" height="h-136">
            <FakePage />
            <Drawer preview open onOpenChange={noop} size="sm" title="تفاصيل العلامة" description="رقم 1042 · بتاريخ 9 تشرين الثاني" actions={drawerActions}>
              <DrawerBody />
            </Drawer>
          </Frame>
          <Frame label="md: 640" height="h-136">
            <FakePage />
            <Drawer preview open onOpenChange={noop} size="md" title="سجل القرار" actions={drawerActions}>
              <DrawerBody />
            </Drawer>
          </Frame>
        </div>
        <CaptureRow className="gap-6">
          <Frame label="على الموبايل: شاشة كاملة بزر رجوع" mobile height="h-136">
            <FakePage />
            <Drawer preview open onOpenChange={noop} title="تفاصيل العلامة" actions={drawerActions}>
              <DrawerBody />
            </Drawer>
          </Frame>
        </CaptureRow>
      </GalleryGroup>

      <GalleryGroup title="حي داخل إطار الموبايل">
        <CaptureRow>
          <Frame label="انقر لفتح الدرج" mobile height="h-136">
            <LiveDrawer />
          </Frame>
        </CaptureRow>
      </GalleryGroup>
    </GallerySection>
  );
}

export function FloatingSection() {
  return (
    <GallerySection
      name="Menu · Popover · Tooltip"
      title="القوائم والتلميحات"
      usage="Menu قائمة إجراءات من زر، والخطر في آخرها بعد فاصل. Popover محتوى صغير تفاعلي. Tooltip نص قصير غير تفاعلي بعد 400ms وعند التركيز."
    >
      <GalleryGroup title="Menu">
        <StateStack
          alignLabel="top"
          states={[
            {
              label: "مفتوحة (ثابتة): عادي، معطّل بسببه، خطر بعد فاصل",
              node: (
                <CaptureRow>
                  <div className={menuPanelClass}>
                    <MenuContent items={menuItems} />
                  </div>
                </CaptureRow>
              ),
            },
            {
              label: "حية: انقر، الأسهم وEnter وEsc",
              node: (
                <CaptureRow>
                  <Menu items={menuItems} aria-label="إجراءات الدفعة" />
                </CaptureRow>
              ),
            },
          ]}
        />
      </GalleryGroup>

      <GalleryGroup title="Popover">
        <StateStack
          alignLabel="top"
          states={[
            {
              label: "حي: فلتر صغير",
              node: (
                <CaptureRow>
                  <Popover
                    trigger={<Button variant="secondary">فلاتر (2)</Button>}
                  >
                    <div className="flex w-64 flex-col gap-3">
                      <Field label="الوكيل">
                        <Input placeholder="اسم الوكيل" />
                      </Field>
                      <Button size="sm">تطبيق</Button>
                    </div>
                  </Popover>
                </CaptureRow>
              ),
            },
          ]}
        />
      </GalleryGroup>

      <GalleryGroup title="Tooltip">
        <StateStack
          alignLabel="top"
          states={[
            {
              label: "الشكل",
              node: (
                <CaptureRow>
                  <div className={tooltipClass}>تعديل الصرف</div>
                </CaptureRow>
              ),
            },
            {
              label: "حي: مرّر المؤشر أو ركّز بـ Tab",
              node: (
                <CaptureRow>
                  <Tooltip label="تعديل الصرف">
                    <IconButton variant="secondary" icon={PencilSimple} aria-label="تعديل الصرف" />
                  </Tooltip>
                </CaptureRow>
              ),
            },
          ]}
        />
      </GalleryGroup>
    </GallerySection>
  );
}

const tabs = [
  { value: "details", label: "التفاصيل" },
  { value: "lines", label: "الأسطر", count: 12 },
  { value: "log", label: "السجل", count: 3 },
  { value: "docs", label: "المرفقات", disabled: true },
] as const;

function LiveTabs({ many = false }: { many?: boolean }) {
  const [value, setValue] = useState<string>("lines");
  const list = many
    ? [...tabs.slice(0, 3), { value: "a", label: "الموافقات" }, { value: "b", label: "التحقيقات" }, { value: "c", label: "المهام المرتبطة" }, { value: "d", label: "الإشعارات" }]
    : tabs;
  return <Tabs aria-label="أقسام الصرف" tabs={list} value={value} onValueChange={setValue} />;
}

export function TabsSection() {
  return (
    <GallerySection
      name="Tabs"
      title="التبويبات"
      usage="أفقية تحت رأس الصفحة لأقسام الكيان الواحد. المؤشر خط بعرض 2 بـ primary، والنشط fg بوزن 600، والعدد في Badge. تتمرر أفقياً على الموبايل. الأسهم تنقل."
    >
      <GalleryGroup title="الحالات">
        <StateStack
          alignLabel="top"
          states={[
            { label: "حية: نشط، عدّاد، معطّل", node: <LiveTabs /> },
          ]}
        />
        <CaptureRow>
          <Frame label="على الموبايل: تمرير أفقي" mobile height="h-24">
            <div className="p-4">
              <LiveTabs many />
            </div>
          </Frame>
        </CaptureRow>
      </GalleryGroup>
    </GallerySection>
  );
}

export function CardSection() {
  return (
    <GallerySection
      name="Card"
      title="البطاقة"
      usage="surface وحد border وrounded-lg، padding 24 على التابلت وما فوقه و16 على الموبايل. رأس اختياري بعنوان وإجراء وفاصل. لا بطاقة داخل بطاقة."
    >
      <GalleryGroup title="الحالات">
        <StateStack
          alignLabel="top"
          states={[
            { label: "بلا رأس", node: <Card><p className="text-body text-fg-muted">محتوى البطاقة.</p></Card> },
            {
              label: "رأس وإجراء",
              node: (
                <Card
                  title="بيانات الصرف"
                  action={
                    <Button variant="secondary" size="sm">
                      تعديل
                    </Button>
                  }
                >
                  <p className="text-body text-fg-muted">محتوى البطاقة تحت الفاصل.</p>
                </Card>
              ),
            },
            { label: "عنوان فقط", node: <Card title="الملخص"><p className="text-body text-fg-muted">12 سطراً.</p></Card> },
          ]}
        />
        <CaptureRow>
          <Frame label="على الموبايل: padding 16" mobile height="h-48">
            <div className="p-4">
              <Card title="بيانات الصرف">
                <p className="text-body text-fg-muted">محتوى البطاقة.</p>
              </Card>
            </div>
          </Frame>
        </CaptureRow>
      </GalleryGroup>
    </GallerySection>
  );
}

export function PersonSection() {
  return (
    <GallerySection
      name="Avatar · PersonCell"
      title="الأفاتار وخلية الشخص"
      usage="الأفاتار دائرة بالحرف الأول على surface-sunken بأحجام 24 و32 و40. لا صور أشخاص. خلية الشخص: أفاتار والاسم وتحته الدور أو المحافظة."
    >
      <GalleryGroup title="Avatar">
        <StateStack
          alignLabel="top"
          states={[
            {
              label: "24 · 32 · 40",
              node: (
                <CaptureRow className="items-center gap-3">
                  <Avatar name="سامر الحلبي" size={24} />
                  <Avatar name="رامي السيد" size={32} />
                  <Avatar name="ليلى الأحمد" size={40} />
                </CaptureRow>
              ),
            },
          ]}
        />
      </GalleryGroup>
      <GalleryGroup title="PersonCell">
        <StateStack
          alignLabel="top"
          states={[
            { label: "بالدور", node: <PersonCell name="سامر الحلبي" subtitle="مندوب" /> },
            { label: "بالمحافظة، 40", node: <PersonCell name="ليلى الأحمد" subtitle="حلب" size={40} /> },
            { label: "بلا سطر ثانٍ", node: <PersonCell name="رامي السيد" /> },
            { label: "اسم طويل يُقتطع", node: <div className="w-48"><PersonCell name="عبد الرحمن محمد خير الدين الأتاسي" subtitle="حمص" /></div> },
          ]}
        />
      </GalleryGroup>
    </GallerySection>
  );
}
