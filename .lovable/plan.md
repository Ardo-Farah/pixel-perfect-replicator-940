## Goal

Redesign `/ebola` so every quantifiable figure from the uploaded screenshots becomes a card, the alert sample breakdown becomes a table, response notes pull in the key facts shown, and the page links to both the MoH source and the WHO Disease Outbreak News article. Only the Ebola section is changed.

## What changes

Replace the generic `/$disease` rendering for Ebola with a dedicated bespoke route file, mirroring the structure of Mpox/Measles pages (same `AppShell`, `MetricCard`, `SectionCard`, `DataSourceBanner`, `DiseaseMap`, `NotesCard` components — no new design system).

### New file

`src/routes/_authenticated/ebola.tsx` — bespoke route. Because TanStack file routes win over dynamic `$disease`, this automatically takes over `/ebola` without touching the generic page or the disease config.

### Page layout (top to bottom)

1. **PageIntro + GradeBadge** — "Bundibugyo Virus Disease (BVD) — DRC & Uganda Updates", Grade 3 badge, sub-line "PHEIC declared 16 May 2026".

2. **Kenya alerts strip (5 metric cards)** — from screenshot 3:
   - Total Alerts Investigated — 25
   - Alerts Under Investigation (pending results) — 0
   - Alerts Discarded (tested negative) — 25 (correcting the on-screen 0, since 25 negative samples = 25 discarded; will mirror screenshot value 0 if you prefer, see Open question)
   - Alerts Confirmed — 0
   - Counties Reporting Alerts — 10
   Sub-callout under the strip: "All 25 alert samples investigated to date have tested negative for Ebola virus disease across 10 counties. Zero confirmed cases in Kenya."

3. **Regional outbreak cards (DRC vs Uganda)** — from screenshot 2, two grouped card clusters:
   - DRC (as of 1 June 2026): Cumulative Cases 321, Active 238, Recovered 6, Confirmed Deaths 48, CFR 15.0%, Suspected Under Investigation 116, HCW Infections 19, Contact Follow-up Rate 43%, Health Zones Affected 16.
   - Uganda (as of 1 June 2026): Cumulative Cases 15, Confirmed Deaths 2, HCW Infections 6, Contacts Listed 642.

4. **Preparedness & readiness cards** — from screenshot 4 (Surveillance / Case mgmt / Labs):
   - Travellers Screened at PoEs — 70,000+
   - Points of Entry Screening — 26
   - HCWs Sensitised via ECHO — 1,069
   - Surge Capacities Mapped — 118
   - 24-hour Rapid Response Teams — "On standby"
   - High-Risk Counties Mobilised — counts of POEs and isolation facilities
   - Designated Ebola Treatment Centres — Alupe Hospital (Busia), Trans Nzoia, Turkana
   - Designated Ebola Testing Labs — 4 (NPHL, KEMRI Nairobi, KEMRI Kisumu, Mobile Lab Busia)
   - HCWs Trained (Busia, 50) — integrated Ebola training
   Quantifiable values become numeric `MetricCard`s; named locations become compact info cards.

5. **DataSourceBanner** — MoH Kenya (existing).

6. **WHO reference link** — new banner styled like the data source row, linking to https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON602 (label: "WHO Disease Outbreak News — Ebola virus disease, DRC & Uganda").

7. **DiseaseMap** — existing `<DiseaseMap disease="ebola" />` (Kenya BVD risk choropleth). Add a static legend block under it that lists the four risk tiers from screenshot 2 (Very High / High / Medium / Low) so the meaning matches the WHO-style map.

8. **Alert samples by county — table** — from screenshot 1, columns: County, Total Samples, Negative, Positive, Pending Results. Rows: Uasin Gishu 2/1/0/0, Nairobi 14/14/0/0, Nyamira 1/1/0/0, Trans Nzoia 1/1/0/0, Kiambu 2/2/0/0, Nyeri 1/1/0/0, Nakuru 1/1/0/0, West Pokot 1/1/0/0, Kisumu 1/1/0/0, Bungoma 1/1/0/0, Totals 25/25/0/0. Nyamira highlighted in red (as in screenshot). Rendered with the same `SectionCard` + table styling used elsewhere.

9. **Response Notes** — `NotesCard` containing condensed key bullets pulled from screenshot 4: KNPHI partner coordination, NPHEOC tier-1 alert, MoH advisory, emergency preparedness working group, IMT activation, surveillance definitions, ECHO platform sensitisation, treatment-centre assessments, IPC training, simulation exercises in Trans Nzoia & Turkana.

### Implementation details

- All data above is rendered as static literals on the page (the user uploaded these figures and asked them keyed in). No DB writes, no migrations.
- File uses the same imports as `mpox.tsx`: `AppShell`, `MetricCard`, `SectionCard`, `NotesCard`, `DataSourceBanner`, `PageIntro`, `GradeBadge`, `DiseaseMap`.
- WHO link reuses the look of `DataSourceBanner` so visual rhythm matches the rest of the dashboard.
- No edits to `src/lib/diseases.ts`, the generic `$disease` route, or any other page. The new file is automatically picked up by the TanStack router code-gen.

### Files touched

- `src/routes/_authenticated/ebola.tsx` (new) — only file added.

### Out of scope

- No backend tables, no migrations, no edits to other diseases.
- The generic `/$disease` page continues to handle Cholera and Dengue unchanged.

## Open question

The "Alerts Discarded (tested negative)" tile in screenshot 3 reads **0**, but the same screenshot also says all 25 samples tested negative and the alert-samples table totals 25 negative. I plan to render the tile as **25** to keep the page internally consistent. If you want the tile to literally mirror the screenshot's **0**, say the word and I'll keep it at 0.
