# WHO Kenya Health Emergency Dashboard

## Project Status
**Current phase:** Frontend (mock data) → Supabase integration
**Source:** Cloned from Lovable. Not yet connected to Supabase.
**Goal:** Replace all mock data with live Supabase queries, wire Edge Functions.

## Supabase
- Project ref: xewepnpqhwxsqiqhbfyr
- Region: EU West 3
- URL: https://xewepnpqhwxsqiqhbfyr.supabase.co
- Anon key: in VITE_SUPABASE_ANON_KEY env var

## Tech Stack
- Vite + React + TypeScript
- Tailwind CSS (Lovable-generated)
- Recharts (charts)
- Mapbox GL JS (maps)
- Supabase JS client
- Edge Functions: process-upload, chat-query

## Database Tables (all have RLS, all have report_id FK)
| Table               | Type        | Key columns |
|---------------------|-------------|-------------|
| weekly_reports      | master      | id, week_number, reporting_date, published |
| report_summary      | single-row  | new_events, outbreaks, grade_1..3 |
| mpox_data           | single-row  | cumulative_cases, new_cases_this_week, deaths, cfr, counties_affected |
| mpox_counties       | array       | county_name, cases_2026, is_hotspot |
| mpox_demographics   | array       | age_group, sex, occupation, case_count |
| measles_data        | single-row  | total_cases, confirmed, suspected, counties_affected |
| measles_counties    | array       | county_name, sub_county, case_count |
| anthrax_data        | array       | county, sub_county, human_cases, human_deaths, animal_deaths |
| floods_data         | single-row  | counties_affected, total_deaths, missing_persons, [region]_deaths |
| idsr_data           | single-row  | completeness_pct, timeliness_pct, cebs_community_signals |
| idsr_counties       | array       | county_name, completeness_pct, timeliness_pct, below_threshold |
| nutrition_data      | single-row  | phase3_above, phase4_5, ipc_notes |
| nutrition_counties  | array       | county_name, ipc_phase, projected_phase, population_affected |
| weather_data        | array       | region, max_temp_c, min_temp_c, rainfall_onset |
| audit_log           | array       | user_id, action, table_name, report_id |

## Standard Hooks (in src/hooks/useReport.ts)
- useLatestReportId() → { reportId, weekNumber, loading }
- useTableData<T>(table, reportId) → { data: T | null, loading }
- useCountyData<T>(table, reportId) → { data: T[], loading }

## Edge Functions
- POST /functions/v1/process-upload — body: { file_path, file_name }
- POST /functions/v1/chat-query — body: { question, report_id } → { chart_type, insight, data }
- Both require: Authorization: Bearer <session.access_token>

## Code Rules (non-negotiable)
1. Never hardcode data — if you see a mock array or object with fake values, it must be replaced
2. Always handle loading state (skeleton) and empty state ("No data uploaded yet")
3. Use TypeScript types for every Supabase table (from src/types/database.ts)
4. All Supabase calls go through the client in src/lib/supabase.ts — never fetch directly
5. RLS is on — queries will silently return empty if auth is missing
6. Use .single() only for tables that return exactly one row per report_id
7. Run `npm run build` and confirm zero TS errors before marking any task done

## Pages and Their Data Sources
| Page       | Tables needed |
|------------|---------------|
| Overview   | report_summary, mpox_data, measles_data, floods_data |
| Mpox       | mpox_data, mpox_counties, mpox_demographics |
| Measles    | measles_data, measles_counties |
| IDSR       | idsr_data, idsr_counties |
| Nutrition  | nutrition_data, nutrition_counties |
| Anthrax    | anthrax_data |
| Floods     | floods_data |
| Upload     | → process-upload edge function |
| Chat       | → chat-query edge function |

## Gap Report
Always check .claude/gap-report.md for current status before starting any task.
The auditor agent keeps this file up to date.