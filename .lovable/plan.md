## Plan

The 413 error from `qwen/qwen3-32b` is stale — the source in `supabase/functions/process-upload/index.ts` already uses `llama-3.1-8b-instant` for validation and Claude for extraction. The deployed edge function is just out of date.

### Steps
1. Redeploy `process-upload` so the live function matches the repo (no Qwen, 6k-char sample for the Groq validator, Claude for extraction).
2. Confirm deployment via edge function logs.
3. Ask you to retry the upload and verify the 413 is gone; if a different error appears, check logs and iterate.

No code changes needed — this is a deploy-only fix.