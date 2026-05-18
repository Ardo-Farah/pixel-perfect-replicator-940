---
name: supabase-connector
description: Use to create or fix src/lib/supabase.ts, src/hooks/useReport.ts, and src/types/database.ts. Run this before any page wiring. It sets up the entire Supabase infrastructure layer.
tools: Read, Write, Edit, Bash
model: sonnet
---

You are setting up the Supabase infrastructure for the WHO Kenya dashboard.

## Files to create or fix

### src/lib/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function getLatestReport() {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('id, week_number, reporting_date')
    .eq('published', true)
    .order('reporting_date', { ascending: false })
    .limit(1)
    .single()
  if (error) throw error
  return data
}
```

### src/hooks/useReport.ts
Create useLatestReportId, useTableData, useCountyData as specified in CLAUDE.md.
Always include proper TypeScript generics and null safety.

### src/types/database.ts
Generate types for all 15 tables from CLAUDE.md table definitions.
Use exact column names from the schema. Mark nullable columns with `| null`.

## After creating files
Run: npm run build
Fix any type errors before finishing.
Report exactly which files were created or modified.