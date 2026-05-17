# Update process-upload Edge Function: Anthropic → DeepSeek

The `process-upload` function lives on the external Supabase project (`xewepnpqhwxsqiqhbfyr`). I'll write the new code and you'll paste it into the Supabase dashboard (Edge Functions → process-upload) and add the `DEEPSEEK_API_KEY` secret there. No changes to the upload UI or `AppShell.tsx`.

## What the new function does

1. Reads `{ file_path, file_name }` from the request (unchanged contract).
2. Verifies the caller's JWT (auth required).
3. Downloads the file from the `weekly-uploads` storage bucket using the service-role client.
4. Parses the file to plain text server-side:
   - **.xlsx / .xls** → SheetJS (`xlsx` npm package via `esm.sh`); concatenate every sheet as TSV.
   - **.pptx** → unzip with JSZip, read each `ppt/slides/slideN.xml`, strip XML tags, join slide text.
   - **.pdf** → out of scope for now (return 415 with a clear message).
5. Sends the extracted text to **DeepSeek** at `https://api.deepseek.com/v1/chat/completions`, model `deepseek-chat`, with:
   - `Authorization: Bearer ${DEEPSEEK_API_KEY}`
   - `response_format: { type: "json_object" }`
   - A system prompt that lists every target table + column (see schema map below) and instructs strict JSON output with `null` for missing values.
   - `temperature: 0` for deterministic extraction.
6. Parses the JSON response, then inserts rows into Supabase using the service-role client:
   - Insert `weekly_reports` first (`week_number`, `reporting_date` derived by the LLM), capture the new `id` as `report_id`.
   - For each table, attach `report_id` and insert (single-row tables with `.insert(obj)`, array tables with `.insert(rows)`).
   - Write one `audit_log` row.
7. Returns `{ report_id, week_number, reporting_date, tables_written: [...] }` on 2xx. On any failure: 4xx/5xx with `{ error: "..." }` — the existing UI already shows the generic error message.

## Schema map sent to DeepSeek

The system prompt enumerates exactly these tables/columns (matches `project-knowledge`):

```
weekly_reports: week_number, reporting_date, published
report_summary: new_events, outbreaks, grade_1, grade_2, grade_3
mpox_data: cumulative_cases, new_cases_this_week, deaths, cfr, counties_affected
mpox_counties[]: county_name, cases_2026, is_hotspot
mpox_demographics[]: age_group, sex, occupation, case_count
measles_data: total_cases, confirmed, suspected, counties_affected
measles_counties[]: county_name, sub_county, case_count
anthrax_data[]: county, sub_county, human_cases, human_deaths, animal_deaths
floods_data: counties_affected, total_deaths, missing_persons, <region>_deaths
idsr_data: completeness_pct, timeliness_pct, cebs_community_signals
idsr_counties[]: county_name, completeness_pct, timeliness_pct, below_threshold
nutrition_data: phase3_above, phase4_5, ipc_notes
nutrition_counties[]: county_name, ipc_phase, projected_phase, population_affected
weather_data[]: region, max_temp_c, min_temp_c, rainfall_onset
```

Output shape required from DeepSeek:
```json
{
  "weekly_reports": { "week_number": 18, "reporting_date": "2026-05-04", "published": false },
  "report_summary": { ... },
  "mpox_data": { ... },
  "mpox_counties": [ ... ],
  ...
}
```

## Secrets to add (in the external Supabase project)

- `DEEPSEEK_API_KEY` — get from https://platform.deepseek.com → API Keys.

You'll add this in **Supabase Dashboard → Project Settings → Edge Functions → Secrets** for `xewepnpqhwxsqiqhbfyr`. The function also uses the auto-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Deliverable

I'll produce a single file `supabase/functions/process-upload/index.ts` in this repo for reference (Deno runtime, npm imports via `esm.sh`). You copy its contents into the dashboard editor for the existing `process-upload` function and deploy.

## Out of scope (untouched)

- `src/components/AppShell.tsx` upload flow.
- The `weekly-uploads` storage bucket and its RLS.
- Any frontend page, hook, or styling.
- The PDF parsing branch (returns 415 for now — current UI accepts `.pdf` but DeepSeek can't read binary PDFs without a vision model; flag if you want PDF support added separately).
