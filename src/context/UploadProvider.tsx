import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

type UploadContextValue = {
  status: UploadStatus;
  stage: string;
  progress: number;
  errorMessage: string | null;
  startUpload: (file: File) => void;
  dismiss: () => void;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    setErrorMessage(null);
  };

  const startUpload = async (file: File) => {
    // Single upload at a time.
    if (status === "uploading") return;

    setStatus("uploading");
    setErrorMessage(null);
    setProgress(5);
    setStage("Uploading file");

    try {
      startTicker(38);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("[upload] session error:", sessionError);
        throw sessionError;
      }
      const session = sessionData.session;
      if (!session) throw new Error("No active session");

      const path = `${session.user.id}/${Date.now()}-${file.name}`;

      // Upload to storage first; the Edge Function downloads it server-side.
      const { error: uploadError } = await supabase.storage
        .from("weekly-uploads")
        .upload(path, file, { upsert: false });
      if (uploadError) {
        console.error("[upload] storage upload error:", uploadError);
        throw uploadError;
      }

      setProgress(40);
      setStage("AI reading report");
      startTicker(88);

      const SUPABASE_URL =
        (import.meta.env.VITE_EXTERNAL_SUPABASE_URL as string | undefined) ??
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
        throw new Error(`Edge Function ${res.status}: ${text}`);
      }

      clearTicker();
      setStage("Saving to database");
      setProgress(100);
      setStatus("success");
      setTimeout(() => {
        // Only clear if no newer upload has started in the meantime.
        setStatus((s) => (s === "success" ? "idle" : s));
        setStage((st) => (st === "Saving to database" ? "" : st));
        setProgress((p) => (p === 100 ? 0 : p));
      }, 5000);
    } catch (err) {
      clearTicker();
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[upload] caught:", err);
      setProgress(0);
      setStage("");
      setStatus("error");
      setErrorMessage(msg);
    }
  };

  return (
    <UploadContext.Provider
      value={{ status, stage, progress, errorMessage, startUpload, dismiss }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function UploadBanner() {
  const { status, stage, progress, errorMessage, dismiss } = useUpload();

  if (status === "idle") return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60]">
      {status === "uploading" && (
        <div className="border-b border-outline-variant bg-surface-container px-8 py-3">
          <div className="mb-1.5 flex items-center justify-between text-body-sm text-on-surface-variant">
            <span>{stage}</span>
            <span className="font-semibold tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-outline-variant">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {status === "success" && (
        <div className="flex items-center gap-2 border-b border-outline-variant bg-secondary-container px-8 py-2 text-body-md text-on-secondary-container">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          <span className="flex-1">Report uploaded successfully</span>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 border-b border-outline-variant bg-error-container px-8 py-2 text-body-md text-on-error-container">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
          <span className="flex-1">{errorMessage ?? "Upload failed"}</span>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="ml-2 text-on-error-container hover:opacity-70"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
      )}
    </div>
  );
}
