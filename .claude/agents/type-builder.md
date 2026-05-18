---
name: type-builder
description: Use to generate or regenerate src/types/database.ts from the Supabase schema in CLAUDE.md. Run this before any other wiring work.
tools: Read, Write, Bash
model: haiku
---

Generate src/types/database.ts for the WHO Kenya dashboard.

Use the exact table and column names from CLAUDE.md.
Mark columns as `| null` if they are nullable (all non-id, non-required columns).

## Output structure
```typescript
export interface WeeklyReport { ... }
export interface ReportSummary { ... }
export interface MpoxData { ... }
export interface MpoxCounty { ... }
export interface MpoxDemographic { ... }
export interface MeaslesData { ... }
export interface MeaslesCounty { ... }
export interface AnthraxData { ... }
export interface FloodsData { ... }
export interface IDSRData { ... }
export interface IDSRCounty { ... }
export interface NutritionData { ... }
export interface NutritionCounty { ... }
export interface WeatherData { ... }
export interface AuditLog { ... }

// Convenience union for useTableData generic
export type TableName = 'weekly_reports' | 'report_summary' | 'mpox_data' | ...
```

After writing the file, run: npx tsc --noEmit
Report any errors.