type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function InlineErrorCard({
  title = "We couldn't load this data",
  message = "There was a problem reaching the server. Please try again.",
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-400">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}
        >
          warning
        </span>
      </div>
      <h3 className="mt-4 text-headline-sm font-semibold text-on-surface">{title}</h3>
      <p className="mt-2 max-w-md text-body-md text-on-surface-variant">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-2 text-body-md font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#0093D5" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            refresh
          </span>
          Retry
        </button>
      ) : null}
    </div>
  );
}
