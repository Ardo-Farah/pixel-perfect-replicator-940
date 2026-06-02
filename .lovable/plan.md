## Update the Summary Intro Section

In `src/routes/_authenticated/index.tsx`:

1. **Change the heading default** (line 61) from `"Current Health Emergencies"` to `"Overview of the Current Health Emergencies in Kenya 2026"`.

2. **Change the description default** (lines 62–66) to the new copy:
   > Kenya is managing multiple concurrent public health emergencies including one protracted Grade 2 emergency (Mpox, Clade 1b), measles outbreaks in two counties, widespread flooding from the long rains, acute food insecurity and malnutrition crisis in nine arid and semi-arid land (ASAL) counties, a Grade 3 Bundibugyo Virus Disease (BVD) outbreak in the Democratic Republic of Congo and Uganda posing cross-border risk to Kenya, a cholera outbreak in Garissa County, and a newly reported dengue fever upsurge in Garissa County.

3. **Round the container corners** (line 116): add `rounded-xl` to match the GradeCards (which use `Card` → `rounded-xl`). Also tighten the heading so long titles wrap nicely (keep `text-2xl font-bold`, allow wrap).

No other components, styles, or business logic change. Admin-overridden values from `page_content` continue to win — only the fallback defaults are updated.