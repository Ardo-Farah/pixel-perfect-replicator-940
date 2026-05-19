import type { FriendlyError } from "@/lib/error-messages";

type Props = {
  open: boolean;
  error: FriendlyError | null;
  onAction: () => void;
  onClose: () => void;
};

const ICONS: Record<FriendlyError["variant"], string> = {
  warning: "warning",
  error: "error",
  info: "info",
};

const ICON_BG: Record<FriendlyError["variant"], string> = {
  warning: "bg-yellow-500/15 text-yellow-400",
  error: "bg-red-500/15 text-red-400",
  info: "bg-secondary-container/30 text-secondary",
};

export function ErrorModal({ open, error, onAction, onClose }: Props) {
  if (!open || !error) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${ICON_BG[error.variant]}`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}
            >
              {ICONS[error.variant]}
            </span>
          </div>
          <div className="flex-1 pt-1">
            <h2 className="text-headline-sm font-semibold text-on-surface">
              {error.title}
            </h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              {error.message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-outline-variant px-4 py-2 text-body-md font-medium text-on-surface transition-colors hover:bg-surface-container-low"
          >
            Close
          </button>
          <button
            onClick={onAction}
            className="rounded-lg bg-secondary px-4 py-2 text-body-md font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#0093D5" }}
          >
            {error.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
