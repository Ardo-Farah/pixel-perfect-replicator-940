// WHO emergency grade classification used across the dashboard.
// Single source of truth for per-disease grade tags and the colors
// they map to. Colors are kept in sync with GradeCard on the overview.

export type GradeKey = "grade3" | "grade2" | "grade1" | "ungraded" | "protracted";

export type GradeInfo = {
  key: GradeKey;
  label: string;          // displayed inside the badge / card
  shortLabel: string;     // for compact badges
  bgClass: string;        // Tailwind background utility
  protracted: boolean;    // whether this disease is a protracted emergency
};

// Visual tokens shared by GradeCard (overview) and GradeBadge (per-page).
// Text is always white over these fills.
export const GRADE_STYLES: Record<GradeKey, { bgClass: string; label: string; shortLabel: string }> = {
  grade3:     { bgClass: "bg-[#EF4444]!", label: "GRADE 3",   shortLabel: "G3" },
  grade2:     { bgClass: "bg-[#F97316]!", label: "GRADE 2",   shortLabel: "G2" },
  grade1:     { bgClass: "bg-[#EAB308]!", label: "GRADE 1",   shortLabel: "G1" },
  ungraded:   { bgClass: "bg-[#737373]!", label: "UNGRADED",  shortLabel: "U" },
  protracted: { bgClass: "bg-[#009ADE]!", label: "PROTRACTED", shortLabel: "P" },
};

// Per-disease grade assignment. A disease may be both Protracted AND have
// a numeric grade (e.g. Mpox = Protracted Grade 3); in that case the badge
// renders as "PROTRACTED · GRADE 3" using the Protracted color.
export type DiseaseGrade = {
  grade: GradeKey;          // primary color/label for the badge
  numericGrade?: GradeKey;  // optional secondary grade text (e.g. "Grade 3")
};

export const DISEASE_GRADES: Record<string, DiseaseGrade> = {
  mpox:      { grade: "protracted", numericGrade: "grade3" },
  cholera:   { grade: "protracted", numericGrade: "grade3" },
  measles:   { grade: "ungraded" },
  anthrax:   { grade: "grade2" },
  nutrition: { grade: "grade2" },
};

export function getGrade(diseaseKey: string): DiseaseGrade | null {
  return DISEASE_GRADES[diseaseKey.toLowerCase()] ?? null;
}

// Count diseases currently classified as Protracted (used by the overview
// "PROTRACTED" card). Derived client-side from DISEASE_GRADES; no DB column.
export function protractedDiseaseCount(): number {
  return Object.values(DISEASE_GRADES).filter((g) => g.grade === "protracted").length;
}
