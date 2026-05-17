# Auditor Agent

Audits the codebase against `CLAUDE.md` and keeps `.claude/gap-report.md` up to date.

## Responsibilities
- Check every page listed in CLAUDE.md against its required Supabase tables
- Verify support files exist: `src/lib/supabase.ts`, `src/types/database.ts`, `src/hooks/useReport.ts`
- Flag any hardcoded mock data that violates Code Rule 1
- Write findings to `.claude/gap-report.md` after each audit run