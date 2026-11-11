"use client";

import { CheckCircle, UploadSimple, WarningCircle, X } from "@phosphor-icons/react";
import { useId, useState, type ChangeEvent, type DragEvent } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatFileSize, isolate } from "@/lib/format";
import { FileName } from "./FileName";
import { IconButton } from "./IconButton";
import { fileKind, fileKindIcon } from "./file-type";

/** ملف في القائمة. الأب هو من يرفعه ويحدّث حالته، والمكوّن يعرض فقط. */
export type UploadFile = {
  id: string;
  name: string;
  /** بالبايت. */
  size: number;
  status: "uploading" | "done" | "error";
  /** 0–100 أثناء الرفع. */
  progress?: number;
  /** رسالة الخطأ لملف فشل رفعه (من error-messages.ts أو الخادم). */
  error?: string;
};

export type FileRejection = { name: string; reason: "type" | "size" };

type Limits = {
  /** نص الأنواع المسموحة للقارئ: «PDF أو صورة». */
  acceptLabel?: string;
  /** بالبايت. */
  maxSize?: number;
};

/** رسالة جاهزة لرفض ملف قبل الرفع: «النوع غير مسموح» أو «أكبر من الحد». تُمرَّر إلى `error`. */
export function fileRejectionMessage({ name, reason }: FileRejection, { acceptLabel, maxSize }: Limits): string {
  if (reason === "size") return `«${isolate(name)}» أكبر من الحد المسموح${maxSize ? ` (${isolate(formatFileSize(maxSize))})` : ""}.`;
  return `«${isolate(name)}» نوعه غير مسموح${acceptLabel ? `. المسموح: ${acceptLabel}` : ""}.`;
}

// يطابق `accept` بصيغة <input>: امتداد (.pdf) أو نوع (image/*) أو نوع كامل (application/pdf).
function matchesAccept(file: File, accept: string): boolean {
  const name = file.name.toLowerCase();
  return accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
    .some((token) => {
      if (token.startsWith(".")) return name.endsWith(token);
      if (token.endsWith("/*")) return file.type.toLowerCase().startsWith(token.slice(0, -1));
      return file.type.toLowerCase() === token;
    });
}

type FileUploadProps = {
  files: readonly UploadFile[];
  /** الملفات الصالحة (بعد فحص النوع والحجم). ابدأ رفعها وأضفها إلى `files`. */
  onSelect: (files: File[]) => void;
  /** ملفات رُفضت قبل الرفع. اعرض سببها بـ `error` (انظر fileRejectionMessage). */
  onReject?: (rejections: FileRejection[]) => void;
  /** يُستدعى لملف يُرفع (إلغاء الرفع) أو مرفوع أو فاشل (إزالة). */
  onRemove: (id: string) => void;
  /** صيغة <input accept>: `application/pdf,image/*`. */
  accept?: string;
  acceptLabel?: string;
  /** بالبايت. */
  maxSize?: number;
  /** ملفات متعددة. الافتراضي ملف واحد: بعد اختياره تُخفى منطقة الإفلات. */
  multiple?: boolean;
  /** خطأ على المنطقة نفسها (رفض نوع أو حجم، أو من الخادم). */
  error?: string;
  disabled?: boolean;
  id?: string;
  /** على منطقة الإفلات نفسها (لا على الحاوية). */
  zoneClassName?: string;
  className?: string;
};

/**
 * رفع الملفات (DESIGN.md 9.8): منطقة بحد متقطع «اسحب الملف هنا أو اختره»، وتحتها الأنواع المسموحة والحد الأقصى،
 * وبعد الاختيار صف لكل ملف (أيقونة النوع، الاسم، الحجم، شريط التقدم، إزالة).
 * الحالات: فارغ · سحب فوقه · يُرفع · مرفوع · خطأ · معطّل. المكوّن لا يرفع شيئاً: يفحص النوع والحجم ويسلّم الملفات للأب.
 */
export function FileUpload({
  files,
  onSelect,
  onReject,
  onRemove,
  accept,
  acceptLabel,
  maxSize,
  multiple = false,
  error,
  disabled = false,
  id: idProp,
  zoneClassName,
  className,
}: FileUploadProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [dragging, setDragging] = useState(false);
  const showZone = multiple || files.length === 0;

  const hint = [acceptLabel, maxSize ? `حتى ${isolate(formatFileSize(maxSize))}` : null].filter(Boolean).join(" · ");

  const receive = (incoming: File[]) => {
    if (disabled || incoming.length === 0) return;
    const rejections: FileRejection[] = [];
    const accepted: File[] = [];
    for (const file of multiple ? incoming : incoming.slice(0, 1)) {
      if (accept && !matchesAccept(file, accept)) rejections.push({ name: file.name, reason: "type" });
      else if (maxSize !== undefined && file.size > maxSize) rejections.push({ name: file.name, reason: "size" });
      else accepted.push(file);
    }
    if (rejections.length > 0) onReject?.(rejections);
    if (accepted.length > 0) onSelect(accepted);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    receive(Array.from(event.target.files ?? []));
    // يسمح باختيار الملف نفسه مرة أخرى بعد إزالته.
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    receive(Array.from(event.dataTransfer.files));
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {showZone ? (
        <div className="flex flex-col gap-2">
          <label
            htmlFor={id}
            onDragOver={(event) => {
              event.preventDefault();
              if (!disabled) setDragging(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
            }}
            onDrop={handleDrop}
            className={cn(
              "flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-6 text-center transition-colors duration-120 ease-out",
              "focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2",
              disabled
                ? "cursor-not-allowed border-border-strong bg-surface-sunken text-fg-disabled"
                : cn(
                    "cursor-pointer",
                    error ? "border-danger" : "border-border-strong hover:border-border-hover",
                    dragging ? "border-primary bg-primary-soft" : "bg-surface-muted",
                  ),
              zoneClassName,
            )}
          >
            <input
              id={id}
              type="file"
              accept={accept}
              multiple={multiple}
              disabled={disabled}
              onChange={handleChange}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              className="sr-only"
            />
            <UploadSimple size={32} aria-hidden="true" className={disabled ? "text-fg-disabled" : "text-fg-subtle"} />
            <span className={cn("text-body", disabled ? "text-fg-disabled" : "text-fg")}>
              {multiple ? "اسحب الملفات هنا أو" : "اسحب الملف هنا أو"} <span className="font-medium underline">اختره</span>
            </span>
            {hint ? <span className={cn("text-label", disabled ? "text-fg-disabled" : "text-fg-muted")}>{hint}</span> : null}
          </label>
          {error ? (
            <p id={`${id}-error`} role="alert" className="text-label text-danger">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      {files.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {files.map((file) => (
            <li key={file.id}>
              <FileRow file={file} disabled={disabled} onRemove={() => onRemove(file.id)} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FileRow({ file, disabled, onRemove }: { file: UploadFile; disabled: boolean; onRemove: () => void }) {
  const TypeIcon = fileKindIcon[fileKind(file.name)];
  const uploading = file.status === "uploading";
  const progress = Math.min(100, Math.max(0, file.progress ?? 0));

  return (
    <CaptureRow className={cn("items-center gap-3 rounded-md border bg-surface p-3", file.status === "error" ? "border-danger" : "border-border")}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-fg-muted">
        <TypeIcon size={20} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <FileName name={file.name} className="text-body text-fg" />
        {uploading ? (
          <div
            role="progressbar"
            aria-label={`رفع ${file.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-1 w-full overflow-hidden rounded-full bg-surface-sunken"
          >
            <CaptureRow className="h-full w-full">
              <div style={{ inlineSize: `${progress}%` }} className="h-full rounded-full bg-primary transition-[inline-size] duration-200 ease-out" />
            </CaptureRow>
          </div>
        ) : null}
        <CaptureRow className="items-center gap-1 text-label">
          {file.status === "error" ? (
            <>
              <WarningCircle size={16} aria-hidden="true" className="shrink-0 text-danger" />
              <span role="alert" className="min-w-0 truncate text-danger">
                {file.error ?? "تعذّر رفع الملف."}
              </span>
            </>
          ) : file.status === "done" ? (
            <>
              <CheckCircle size={16} aria-hidden="true" className="shrink-0 text-success" />
              <span className="text-fg-muted">
                تم الرفع · {isolate(formatFileSize(file.size))}
              </span>
            </>
          ) : (
            <span className="text-fg-muted">
              جارٍ الرفع · {isolate(`${progress}%`)} · {isolate(formatFileSize(file.size))}
            </span>
          )}
        </CaptureRow>
      </div>
      <IconButton
        variant="ghost"
        size="sm"
        icon={X}
        aria-label={uploading ? `إلغاء رفع ${file.name}` : `إزالة ${file.name}`}
        disabled={disabled}
        onClick={onRemove}
      />
    </CaptureRow>
  );
}
