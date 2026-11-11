"use client";

import { useState } from "react";
import { BatchChip } from "@/components/data/BatchChip";
import { LineItemsEditor, type EditorLine } from "@/components/data/LineItemsEditor";
import { StockLine } from "@/components/data/StockLine";
import { stockBatches, stockItems } from "@/mocks/stock";
import { DESKTOP, HostFrame, MOBILE } from "./DataSections";
import { GalleryGroup, GallerySection, StateStack } from "./gallery-kit";

const TODAY = "2026-11-10";

export function BatchSection() {
  return (
    <GallerySection
      name="BatchChip · StockLine"
      title="الدفعة وصف الرصيد"
      usage="BatchChip: رقم الدفعة (لاتيني) وتاريخ الانتهاء وشارة الحالة: عادية بلا شارة، قريبة الانتهاء (ضمن 60 يوماً من الإعدادات) warning بـ Clock، موقوفة danger بـ Prohibit، منتهية danger. StockLine: الصنف ونوعه والدفعة والكمية والموقع، والسالبة بـ danger وtooltip."
    >
      <GalleryGroup title="BatchChip">
        <StateStack
          alignLabel="top"
          states={[
            { label: "عادية", node: <BatchChip today={TODAY} batch={{ id: 32, batch_no: "LOT-2701-B", expiry_date: "2027-03-01", status: "ACTIVE" }} /> },
            { label: "قريبة الانتهاء (34 يوماً)", node: <BatchChip today={TODAY} batch={{ id: 31, batch_no: "LOT-2611-A", expiry_date: "2026-12-14", status: "ACTIVE" }} /> },
            { label: "موقوفة", node: <BatchChip today={TODAY} batch={{ id: 33, batch_no: "LOT-2609-C", expiry_date: "2027-06-10", status: "SUSPENDED" }} /> },
            { label: "منتهية", node: <BatchChip today={TODAY} batch={{ id: 30, batch_no: "LOT-2510-D", expiry_date: "2026-10-30", status: "ACTIVE" }} /> },
          ]}
        />
      </GalleryGroup>

      <GalleryGroup title="StockLine">
        <div className="flex flex-col gap-6">
          <HostFrame label="مكتب" widthClass={DESKTOP}>
            <div className="divide-y divide-border rounded-lg border border-border bg-surface">
              <StockLine locationColumn today={TODAY} item={stockItems[0]} batch={{ id: 32, batch_no: "LOT-2701-B", expiry_date: "2027-03-01", status: "ACTIVE" }} quantity={600} location="مستودع دمشق الرئيسي" />
              <StockLine locationColumn today={TODAY} item={stockItems[1]} batch={{ id: 31, batch_no: "LOT-2611-A", expiry_date: "2026-12-14", status: "ACTIVE" }} quantity={1480} />
              <StockLine locationColumn today={TODAY} item={stockItems[3]} batch={{ id: 33, batch_no: "LOT-2609-C", expiry_date: "2027-06-10", status: "SUSPENDED" }} quantity={-12} location="سامر الحلبي" />
              <StockLine locationColumn today={TODAY} item={stockItems[4]} quantity={96} unit="نسخة" />
            </div>
          </HostFrame>
          <HostFrame label="موبايل: تكدّس" widthClass={MOBILE}>
            <div className="divide-y divide-border rounded-lg border border-border bg-surface">
              <StockLine today={TODAY} item={stockItems[0]} batch={{ id: 31, batch_no: "LOT-2611-A", expiry_date: "2026-12-14", status: "ACTIVE" }} quantity={600} location="مستودع دمشق الرئيسي" />
              <StockLine today={TODAY} item={stockItems[3]} batch={{ id: 33, batch_no: "LOT-2609-C", expiry_date: "2027-06-10", status: "SUSPENDED" }} quantity={-12} location="سامر الحلبي" />
            </div>
          </HostFrame>
        </div>
      </GalleryGroup>
    </GallerySection>
  );
}

const initial: EditorLine[] = [
  { id: "a", itemId: 1, batchId: 31, quantity: 120 },
  { id: "b", itemId: 2, batchId: 41, quantity: 60 },
  { id: "c", itemId: 3, batchId: 51, quantity: 180 },
];

function Live({ start = initial, ...rest }: { start?: EditorLine[] } & Partial<React.ComponentProps<typeof LineItemsEditor>>) {
  const [lines, setLines] = useState<EditorLine[]>(start);
  return <LineItemsEditor today={TODAY} items={stockItems} batches={stockBatches} {...rest} lines={lines} onChange={setLines} />;
}

export function LineItemsSection() {
  return (
    <GallerySection
      name="LineItemsEditor"
      title="محرّر الأسطر"
      usage="للصرف والتسليم والإرجاع والتالف والجرد وطلبات العينات. الدفعة المقترحة أولاً هي الأقرب انتهاءً (FEFO) وتُختار تلقائياً والاختيار حر. الموقوفة معطّلة بسببها إلا في الحركات التي يسمح بها القرار 2. المتاح لكل سطر وتجاوزه خطأ في السطر، وأخطاء الخادم تحته. بعد الإرسال جدول عادي. على الموبايل كل سطر بطاقة."
    >
      <GalleryGroup title="الحالات (حية: اختر صنفاً فتُختار دفعته المقترحة، اكتب كمية تتجاوز المتاح)">
        <div className="flex flex-col gap-8">
          <HostFrame label="مكتب: ثلاثة أسطر" widthClass={DESKTOP}>
            <Live />
          </HostFrame>
          <HostFrame label="تجاوز المتاح (300 > 240) وخطأ خادم على سطر آخر" widthClass={DESKTOP}>
            <Live
              start={[
                { id: "a", itemId: 1, batchId: 31, quantity: 300 },
                { id: "b", itemId: 2, batchId: 41, quantity: 60 },
                { id: "c", itemId: 3, batchId: 51, quantity: 20 },
              ]}
              errors={{ "lines.2.quantity": "الكمية أكبر من الرصيد المتاح" }}
            />
          </HostFrame>
          <HostFrame label="سطر جديد فارغ، دفعات قيد التحميل (الصنف 4) وخطأ تحميل الدفعات (الصنف 5)" widthClass={DESKTOP}>
            <Live
              start={[
                { id: "a", itemId: null, batchId: null, quantity: null },
                { id: "b", itemId: 4, batchId: null, quantity: null },
                { id: "c", itemId: 5, batchId: null, quantity: null },
              ]}
            />
          </HostFrame>
          <HostFrame label="الجرد: الموقوفة قابلة للاختيار، والكمية من 0" widthClass={DESKTOP}>
            <Live allowSuspended minQuantity={0} quantityField="actual_quantity" start={[{ id: "a", itemId: 1, batchId: 33, quantity: 0 }]} />
          </HostFrame>
          <HostFrame label="للقراءة فقط (بعد الإرسال)" widthClass={DESKTOP}>
            <Live readOnly />
          </HostFrame>
          <HostFrame label="بلا أسطر" widthClass={DESKTOP}>
            <Live start={[]} />
          </HostFrame>
          <HostFrame label="موبايل: كل سطر بطاقة" widthClass={MOBILE}>
            <Live
              start={[
                { id: "a", itemId: 1, batchId: 31, quantity: 300 },
                { id: "b", itemId: 2, batchId: 41, quantity: 60 },
              ]}
            />
          </HostFrame>
        </div>
      </GalleryGroup>
    </GallerySection>
  );
}
