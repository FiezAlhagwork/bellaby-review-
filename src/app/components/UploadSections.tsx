"use client";

import { useState } from "react";
import { AttachmentList } from "@/components/ui/AttachmentList";
import { Field } from "@/components/ui/Field";
import { FileUpload, fileRejectionMessage, type FileRejection, type UploadFile } from "@/components/ui/FileUpload";
import { forcedDrop } from "./forced-states";
import { GalleryGroup, GallerySection, StateStack } from "./gallery-kit";

const noop = () => {};

const MAX = 5 * 1024 * 1024;
const limits = { acceptLabel: "PDF أو صورة", maxSize: MAX };

const uploading: UploadFile = { id: "1", name: "إيصال-التسليم.pdf", size: 1_240_000, status: "uploading", progress: 45 };
const done: UploadFile = { id: "2", name: "صورة-الإيصال.jpg", size: 2_480_000, status: "done" };
const failed: UploadFile = { id: "3", name: "وثيقة-قانونية.pdf", size: 4_900_000, status: "error", error: "انقطع الاتصال أثناء الرفع. أعد المحاولة." };

const zone = (props: Partial<React.ComponentProps<typeof FileUpload>> = {}) => (
  <FileUpload files={[]} onSelect={noop} onRemove={noop} accept="application/pdf,image/*" {...limits} {...props} />
);

/** حيّ فعلاً: يفحص النوع والحجم، ويحاكي الرفع بشريط يتقدم ثم «تم الرفع». الحالة للمعرض وحده. */
function LiveUpload({ multiple }: { multiple: boolean }) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [error, setError] = useState<string | undefined>();

  const simulate = (id: string, step: number) => {
    window.setTimeout(() => {
      setFiles((current) =>
        current.map((file) => (file.id === id ? (step >= 100 ? { ...file, status: "done", progress: 100 } : { ...file, progress: step }) : file)),
      );
      if (step < 100) simulate(id, step + 20);
    }, 400);
  };

  return (
    <Field label="صورة الإيصال" required hint="صورة أو PDF حتى 5 ميغابايت.">
      <FileUpload
        multiple={multiple}
        accept="application/pdf,image/*"
        {...limits}
        files={files}
        error={error}
        onSelect={(selected) => {
          setError(undefined);
          const added = selected.map((file, index) => ({
            id: `${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            status: "uploading" as const,
            progress: 0,
          }));
          setFiles((current) => [...(multiple ? current : []), ...added]);
          for (const file of added) simulate(file.id, 20);
        }}
        onReject={(rejections: FileRejection[]) => setError(rejections.map((rejection) => fileRejectionMessage(rejection, limits)).join(" "))}
        onRemove={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
      />
    </Field>
  );
}

export function FileUploadSection() {
  return (
    <GallerySection
      name="FileUpload"
      title="رفع الملفات"
      usage="منطقة بحد متقطع، وتحتها الأنواع المسموحة والحد الأقصى، وصف لكل ملف بأيقونة النوع والحجم والتقدم وزر الإزالة. المكوّن لا يرفع: يفحص النوع والحجم ويسلّم الملفات للأب. الاستعمال: تسليم المهمة، الوثائق القانونية، صورة الإيصال."
    >
      <GalleryGroup title="منطقة الإفلات">
        <StateStack
          alignLabel="top"
          states={[
            { label: "فارغ", node: zone() },
            { label: "تمرير (hover)", node: zone({ zoneClassName: forcedDrop.hover }) },
            { label: "سحب ملف فوقها", node: zone({ zoneClassName: forcedDrop.dragging }) },
            { label: "تركيز (focus)", node: zone({ zoneClassName: forcedDrop.focus }) },
            { label: "خطأ (نوع غير مسموح)", node: zone({ error: fileRejectionMessage({ name: "جدول.xlsx", reason: "type" }, limits) }) },
            { label: "خطأ (حجم)", node: zone({ error: fileRejectionMessage({ name: "صورة-كبيرة.png", reason: "size" }, limits) }) },
            { label: "معطّل", node: zone({ disabled: true }) },
            { label: "ملفات متعددة", node: zone({ multiple: true }) },
          ]}
        />
      </GalleryGroup>

      <GalleryGroup title="الملفات">
        <StateStack
          alignLabel="top"
          states={[
            { label: "يُرفع (45%)", node: zone({ multiple: true, files: [uploading] }) },
            { label: "مرفوع", node: zone({ multiple: true, files: [done] }) },
            { label: "فشل الرفع", node: zone({ multiple: true, files: [failed] }) },
            { label: "ملف واحد: المنطقة تُخفى بعد الاختيار", node: zone({ files: [done] }) },
            { label: "الثلاث معاً (متعدد)", node: zone({ multiple: true, files: [uploading, done, failed] }) },
            { label: "معطّل مع ملف", node: zone({ multiple: true, disabled: true, files: [done] }) },
          ]}
        />
      </GalleryGroup>

      <GalleryGroup title="حي: اختر أو اسحب ملفاً (يفحص ويحاكي الرفع)">
        <StateStack
          alignLabel="top"
          states={[
            { label: "ملف واحد", node: <LiveUpload multiple={false} /> },
            { label: "ملفات متعددة", node: <LiveUpload multiple /> },
          ]}
        />
      </GalleryGroup>
    </GallerySection>
  );
}

export function AttachmentListSection() {
  return (
    <GallerySection
      name="AttachmentList"
      title="قائمة المرفقات"
      usage="العرض للقراءة: أيقونة النوع أو مصغّرة الصورة، والاسم والحجم، وزر تنزيل. الصورة قابلة للفتح بـ onOpen (النافذة من الأب)."
    >
      <GalleryGroup title="الحالات">
        <StateStack
          alignLabel="top"
          states={[
            {
              label: "pdf وصورة وملف",
              node: (
                <AttachmentList
                  onDownload={noop}
                  attachments={[
                    { id: "1", name: "عقد-التوزيع.pdf", size: 1_240_000 },
                    { id: "2", name: "صورة-الإيصال.jpg", size: 2_480_000 },
                    { id: "3", name: "جدول-الأسعار.xlsx", size: 86_000 },
                  ]}
                />
              ),
            },
            {
              label: "الصورة قابلة للفتح (onOpen)",
              node: (
                <AttachmentList
                  onDownload={noop}
                  onOpen={noop}
                  attachments={[
                    { id: "1", name: "صورة-الإيصال.jpg", size: 2_480_000 },
                    { id: "2", name: "عقد-التوزيع.pdf", size: 1_240_000 },
                  ]}
                />
              ),
            },
            {
              label: "اسم طويل",
              node: (
                <AttachmentList
                  onDownload={noop}
                  attachments={[{ id: "1", name: "محضر-تسليم-الدفعة-الرابعة-من-مستودع-حلب-إلى-وكيل-اللاذقية-الشهر-الماضي.pdf", size: 3_900_000 }]}
                />
              ),
            },
          ]}
        />
      </GalleryGroup>
    </GallerySection>
  );
}
