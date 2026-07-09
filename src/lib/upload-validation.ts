import type { FriendlyError } from "@/lib/error-messages";

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const REPORT_UPLOAD_EXTENSIONS = ["pptx", "pdf", "xlsx", "xls"] as const;
export const DOCUMENT_LIBRARY_EXTENSIONS = [...REPORT_UPLOAD_EXTENSIONS, "docx"] as const;

type FileLike = {
  name: string;
  size: number;
  type?: string;
};

type ValidationResult =
  | { ok: true; extension: string; safeName: string }
  | { ok: false; error: FriendlyError };

const supported = (extensions: readonly string[]) =>
  extensions.map((ext) => `.${ext.toUpperCase()}`).join(", ");

export function fileExtension(name: string): string {
  const trimmed = name.trim();
  const last = trimmed.split(/[\\/]/).pop() ?? trimmed;
  const dot = last.lastIndexOf(".");
  return dot >= 0 ? last.slice(dot + 1).toLowerCase() : "";
}

export function safeUploadFileName(name: string): string {
  const trimmed = name.trim().split(/[\\/]/).pop() || "report";
  return trimmed
    .replace(/[^A-Za-z0-9._ -]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 140);
}

export function validateUploadFile(
  file: FileLike,
  options: {
    allowedExtensions: readonly string[];
    label: string;
  },
): ValidationResult {
  const extension = fileExtension(file.name);
  if (!extension || !options.allowedExtensions.includes(extension)) {
    return {
      ok: false,
      error: {
        title: "Unsupported file type",
        message: `${options.label} must be one of: ${supported(options.allowedExtensions)}.`,
        actionLabel: "Choose Another File",
        variant: "warning",
        action: "reupload",
      },
    };
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return {
      ok: false,
      error: {
        title: "Empty file",
        message: "This file has no content. Please choose the exported report file again.",
        actionLabel: "Choose Another File",
        variant: "warning",
        action: "reupload",
      },
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: {
        title: "File is too large",
        message: `Uploads are limited to ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB so the report can be processed reliably.`,
        actionLabel: "Choose Smaller File",
        variant: "warning",
        action: "reupload",
      },
    };
  }

  return { ok: true, extension, safeName: safeUploadFileName(file.name) };
}

export function validateReportUploadFile(file: FileLike): ValidationResult {
  return validateUploadFile(file, {
    allowedExtensions: REPORT_UPLOAD_EXTENSIONS,
    label: "Weekly report uploads",
  });
}

export function validateDocumentLibraryFile(file: FileLike): ValidationResult {
  return validateUploadFile(file, {
    allowedExtensions: DOCUMENT_LIBRARY_EXTENSIONS,
    label: "Document library uploads",
  });
}
