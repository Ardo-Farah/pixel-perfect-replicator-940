## Make Protracted badges use the numeric-grade color

**Current:** `GradeBadge` paints "PROTRACTED · GRADE 3" with the Protracted blue. The user wants the badge to reflect the numeric grade's severity color when one is set — so "PROTRACTED · GRADE 3" should be red (Grade 3), "PROTRACTED · GRADE 2" orange, etc. Pure "PROTRACTED" (no numeric grade) and the standalone overview "PROTRACTED" card keep the WHO blue.

### Change

In `src/components/GradeBadge.tsx`, when `info.numericGrade` is set, use the numeric grade's `bgClass` for the pill background instead of the protracted blue. Label format unchanged ("PROTRACTED · GRADE 3"), white text unchanged.

### Effect across pages

- Mpox → red (Protracted · Grade 3)
- Cholera → red (Protracted · Grade 3)
- Measles → gray (Ungraded)
- Anthrax / Floods / Nutrition → orange (Grade 2)
- Overview "PROTRACTED" summary card → stays WHO blue (uses GradeCard, not GradeBadge)

### Out of scope

- No changes to `disease-grades.ts` mapping
- No changes to the 5 summary cards on the overview
- No changes to other pages' layouts or data
