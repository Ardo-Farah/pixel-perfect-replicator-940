import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { ErrorModal } from "@/components/feedback/ErrorModal";
import { toast } from "@/lib/toast";
import { uploadErrorFromStatus, type FriendlyError } from "@/lib/error-messages";
import { validateReportUploadFile } from "@/lib/upload-validation";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

export type UploadResult = {
  report_id: string | null;
  week_number: number | null;
  tables_written?: string[];
  warnings?: string[];
  preview?: Record<string, Record<string, number | null>>;
  evidence_summary?: {
    rows: number;
    candidate_fields?: number;
    grounded_fields?: number;
    coverage_pct?: number | null;
    by_source_type: Record<string, number>;
    headline_fields: Array<{
      field_path: string;
      value_text: string;
      source_type: string;
      slide_number: number | null;
      source_snippet: string;
      confidence: number;
    }>;
  };
};

type UploadContextValue = {
  status: UploadStatus;
  stage: string;
  progress: number;
  friendlyError: FriendlyError | null;
  startUpload: (file: File, options?: { storagePath?: string }) => Promise<UploadResult | null>;
  dismiss: () => void;
  openFilePicker: () => void;
  registerFilePicker: (fn: () => void) => void;
};

const UploadContext = createContext<UploadContextValue | null>(null);

export function useUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUpload must be used within an <UploadProvider />");
  return ctx;
}

export function UploadProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [friendlyError, setFriendlyError] = useState<FriendlyError | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const filePickerRef = useRef<(() => void) | null>(null);

  const clearTicker = () => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  };

  const startTicker = (cap: number) => {
    clearTicker();
    tickerRef.current = setInterval(() => {
      setProgress((p) => (p < cap ? p + 1 : p));
    }, 400);
  };

  const dismiss = () => {
    clearTicker();
    setStatus("idle");
    setStage("");
    setProgress(0);
    setFriendlyError(null);
  };

  const registerFilePicker = (fn: () => void) => {
    filePickerRef.current = fn;
  };

  const openFilePicker = () => {
    filePickerRef.current?.();
  };

  const startUpload = async (file: File, options?: { storagePath?: string }): Promise<UploadResult | null> => {
    if (status === "uploading") return null;

    const validation = validateReportUploadFile(file);
    if (!validation.ok) {
      clearTicker();
      setStatus("error");
      setStage("");
      setProgress(0);
      setFriendlyError(validation.error);
      return null;
    }

    setStatus("uploading");
    setFriendlyError(null);
    setProgress(5);
    setStage("Uploading file");

    try {
      startTicker(38);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const session = sessionData.session;
      if (!session) {
        clearTicker();
        setStatus("error");
        setFriendlyError(uploadErrorFromStatus(401));
        return null;
      }

      let path = options?.storagePath;
      if (!path) {
        path = `${session.user.id}/${Date.now()}-${validation.safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("weekly-uploads")
          .upload(path, file, { upsert: false });
        if (uploadError) {
          console.error("[upload] storage upload error:", uploadError);
          clearTicker();
          setStatus("error");
          setFriendlyError(uploadErrorFromStatus(500));
          return null;
        }
      }

      setProgress(40);
      setStage("AI reading report");
      startTicker(88);

      const SUPABASE_URL =
        (import.meta.env.VITE_EXTERNAL_SUPABASE_URL as string | undefined) ??
        (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
        "https://xewepnpqhwxsqiqhbfyr.supabase.co";

      const res = await fetch(`${SUPABASE_URL}/functions/v1/process-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file_path: path, file_name: file.name }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`[upload] edge function error ${res.status}:`, text);
        let serverMessage: string | null = null;
        try {
          const body = JSON.parse(text) as { error?: unknown; message?: unknown };
          serverMessage =
            typeof body.error === "string"
              ? body.error
              : typeof body.message === "string"
                ? body.message
                : null;
        } catch {
          serverMessage = text || null;
        }
        clearTicker();
        setStatus("error");
        const friendly = uploadErrorFromStatus(res.status, serverMessage);
        setFriendlyError(friendly);
        if (friendly.action === "signin") {
          toast.info("Your session expired. Please sign in again.");
        }
        return null;
      }

      let weekNumber: number | null = null;
      let reportId: string | null = null;
      let tablesWritten: string[] | undefined;
      let warnings: string[] | undefined;
      let preview: Record<string, Record<string, number | null>> | undefined;
      let evidenceSummary: UploadResult["evidence_summary"] | undefined;
      try {
        const json = await res.clone().json();
        weekNumber = json?.week_number ?? json?.report?.week_number ?? null;
        reportId = json?.report_id ?? json?.report?.id ?? null;
        if (Array.isArray(json?.tables_written)) tablesWritten = json.tables_written;
        if (Array.isArray(json?.warnings)) warnings = json.warnings;
        if (json?.preview && typeof json.preview === "object") preview = json.preview;
        if (json?.evidence_summary && typeof json.evidence_summary === "object") {
          evidenceSummary = json.evidence_summary;
        }
      } catch {
        // ignore — response may not be JSON
      }

      clearTicker();
      setStage("Saving to database");
      setProgress(100);
      setStatus("success");
      toast.success(
        weekNumber
          ? `Week ${weekNumber} read as a draft — review the figures, then Publish`
          : "Report read as a draft — review the figures, then Publish",
      );
      setTimeout(() => {
        setStatus((s) => (s === "success" ? "idle" : s));
        setStage((st) => (st === "Saving to database" ? "" : st));
        setProgress((p) => (p === 100 ? 0 : p));
      }, 3000);
      return {
        report_id: reportId,
        week_number: weekNumber,
        tables_written: tablesWritten,
        warnings,
        preview,
        evidence_summary: evidenceSummary,
      };
    } catch (err) {
      clearTicker();
      console.error("[upload] caught:", err);
      setProgress(0);
      setStage("");
      setStatus("error");
      setFriendlyError(uploadErrorFromStatus(500));
      return null;
    }
  };

  return (
    <UploadContext.Provider
      value={{
        status,
        stage,
        progress,
        friendlyError,
        startUpload,
        dismiss,
        openFilePicker,
        registerFilePicker,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function UploadBanner() {
  const { status, stage, progress, friendlyError, dismiss, openFilePicker } = useUpload();

  const handleAction = () => {
    if (!friendlyError) return;
    if (friendlyError.action === "reupload") {
      dismiss();
      // small delay so modal teardown completes before file dialog opens
      setTimeout(() => openFilePicker(), 50);
      return;
    }
    if (friendlyError.action === "signin") {
      dismiss();
      if (typeof window !== "undefined") window.location.href = "/login";
      return;
    }
    if (friendlyError.action === "retry") {
      dismiss();
      setTimeout(() => openFilePicker(), 50);
      return;
    }
    dismiss();
  };

  return (
    <>
      {status === "uploading" && (
        <div className="fixed inset-x-0 top-0 z-[60] border-b border-outline-variant bg-surface-container px-8 py-3">
          <div className="mb-1.5 flex items-center justify-between text-body-sm text-on-surface-variant">
            <span>{stage}</span>
            <span className="font-semibold tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-outline-variant">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: "#0093D5" }}
            />
          </div>
        </div>
      )}

      <ErrorModal
        open={status === "error" && !!friendlyError}
        error={friendlyError}
        onAction={handleAction}
        onClose={dismiss}
      />
    </>
  );
}
