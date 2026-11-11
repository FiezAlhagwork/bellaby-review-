import { File, FileImage, FilePdf, type Icon } from "@phosphor-icons/react";

// أيقونة نوع الملف من اسمه (DESIGN.md 9.8). يشترك بها FileUpload وAttachmentList.

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "heic"];

export type FileKind = "image" | "pdf" | "file";

export function fileKind(name: string): FileKind {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "pdf") return "pdf";
  if (IMAGE_EXTENSIONS.includes(extension)) return "image";
  return "file";
}

export const fileKindIcon: Record<FileKind, Icon> = { image: FileImage, pdf: FilePdf, file: File };
