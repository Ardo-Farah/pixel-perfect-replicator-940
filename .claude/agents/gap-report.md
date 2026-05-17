# Gap Report

**Last audited:** 2026-05-17
**Phase:** Frontend (mock data) -> Supabase integration
**Overall status:** NOT STARTED — all pages use hardcoded mock data

---

## Support Files

| File | Status |
|---|---|
| src/lib/supabase.ts | MISSING |
| src/types/database.ts | MISSING |
| src/hooks/useReport.ts | MISSING |

All three must exist before any page can be wired to Supabase.

---

## Pages

| Page | Required tables | Status |
|---|---|---|
| Overview | report_summary, mpox_data, measles_data, floods_data | MOCK |
| Mpox | mpox_data, mpox_counties, mpox_demographics | MOCK |
| Measles | measles_data, measles_counties | MOCK |
| IDSR | idsr_data, idsr_counties | MOCK |
| Nutrition | nutrition_data, nutrition_counties | MOCK |
| Anthrax | anthrax_data | MOCK |
| Floods | floods_data | MOCK |

---

## Detail

**Overview** (`src/routes/_authenticated/index.tsx`)
- Hardcoded `tickets` array with static support ticket data
- No Supabase queries

**Mpox** (`src/routes/_authenticated/mpox.tsx`)
- Hardcoded `otherMetrics` array (cumulative cases: 1,123; deaths: 19; new cases: 4)
- No Supabase queries

**Measles** (`src/routes/_authenticated/measles.tsx`)
- Hardcoded `indicators` array (vaccination coverage 82.4%, Vitamin A 67.1%)
- No Supabase queries

**IDSR** (`src/routes/_authenticated/idsr.tsx`)
- Hardcoded: `regional`, `updates`, `countyWeek18`, `countyWeek17v18`, `cebs`, `hebs` arrays
- No Supabase queries

**Nutrition** (`src/routes/_authenticated/nutrition.tsx`)
- Hardcoded `breakdown` array (7.58M Phase 1, 429K Phase 3+)
- No Supabase queries

**Anthrax** (`src/routes/_authenticated/anthrax.tsx`)
- Hardcoded `counties` array with fake case/livestock data
- No Supabase queries

**Floods** (`src/routes/_authenticated/floods.tsx`)
- Hardcoded `regions` array (27 counties affected, 122 deaths, 5,992 displaced)
- No Supabase queries

---

## Suggested Order of Work

1. Create src/lib/supabase.ts (client setup)
2. Create src/types/database.ts (TypeScript types for all tables)
3. Create src/hooks/useReport.ts (useLatestReportId, useTableData, useCountyData)
4. Wire pages in dependency order: Overview -> Mpox -> Measles -> IDSR -> Nutrition -> Anthrax -> Floods