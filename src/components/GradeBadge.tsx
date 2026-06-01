import { getGrade, GRADE_STYLES } from "@/lib/disease-grades";

/**
 * Small pill badge showing a disease's WHO emergency classification.
 * Renders the primary grade color as background, white text.
 * If the disease is Protracted AND has a numeric grade, label reads
 * "PROTRACTED · GRADE 3".
 */
export function GradeBadge({
  disease,
  className = "",
}: {
  disease: string;
  className?: string;
}) {
  const info = getGrade(disease);
  if (!info) return null;
  const primary = GRADE_STYLES[info.grade];
  const secondary = info.numericGrade ? GRADE_STYLES[info.numericGrade] : null;
  const label = secondary ? `${primary.label} · ${secondary.label}` : primary.label;
  const bg = secondary ? secondary.bgClass : primary.bgClass;
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white ${bg} ${className}`}
    >
      {label}
    </span>
  );
}
