type Props = {
  title?: string;
  message?: string;
  icon?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title = "No report uploaded for this week yet",
  message = "Once a weekly bulletin is uploaded and processed, the data will appear here.",
  icon = "description",
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-10 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(0, 147, 213, 0.12)" }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 36, color: "#0093D5" }}
        >
          {icon}
        </span>
      </div>
      <h3 className="mt-4 text-headline-sm font-semibold text-on-surface">{title}</h3>
      <p className="mt-2 max-w-md text-body-md text-on-surface-variant">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
