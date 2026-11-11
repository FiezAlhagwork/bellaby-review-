"use client";

import { DownloadSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatFileSize, isolate } from "@/lib/format";
import { FileName } from "./FileName";
import { IconButton } from "./IconButton";
import { fileKind, fileKindIcon } from "./file-type";

/** مرفق للعرض فقط (DESIGN.md 9.8). `thumbnailUrl` لصور المعاينة. */
export type Attachment = {
  id: string;
  name: string;
  /** بالبايت. */
  size: number;
  /** رابط مصغّرة الصورة. بدونه تظهر أيقونة النوع. */
  thumbnailUrl?: string;
};

type AttachmentListProps = {
  attachments: readonly Attachment[];
  onDownload: (id: string) => void;
  /** فتح الصورة في نافذة. بدونه لا تكون المصغّرة والاسم قابلين للنقر. */
  onOpen?: (id: string) => void;
  className?: string;
};

/**
 * قائمة المرفقات للعرض (DESIGN.md 9.8): أيقونة النوع أو مصغّرة الصورة، الاسم والحجم، وزر تنزيل.
 * الصورة بمصغّرة تُفتح بـ `onOpen` (النافذة من الأب).
 */
export function AttachmentList({ attachments, onDownload, onOpen, className }: AttachmentListProps) {
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {attachments.map((attachment) => {
        const kind = fileKind(attachment.name);
        const TypeIcon = fileKindIcon[kind];
        const openable = onOpen !== undefined && kind === "image";

        const thumb = (
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-sunken text-fg-muted">
            {attachment.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- مصغّرة من رابط الخادم المباشر، بلا تحسين Next
              <img src={attachment.thumbnailUrl} alt="" className="size-full object-cover" />
            ) : (
              <TypeIcon size={20} aria-hidden="true" />
            )}
          </span>
        );

        return (
          <li key={attachment.id}>
            <CaptureRow className="items-center gap-3 rounded-md border border-border bg-surface p-3">
              {openable ? (
                <button
                  type="button"
                  aria-label={`فتح ${attachment.name}`}
                  onClick={() => onOpen(attachment.id)}
                  className="shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  {thumb}
                </button>
              ) : (
                thumb
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <FileName name={attachment.name} className="text-body text-fg" />
                <span className="text-label text-fg-muted">{isolate(formatFileSize(attachment.size))}</span>
              </div>
              <IconButton variant="ghost" size="sm" icon={DownloadSimple} aria-label={`تنزيل ${attachment.name}`} onClick={() => onDownload(attachment.id)} />
            </CaptureRow>
          </li>
        );
      })}
    </ul>
  );
}
