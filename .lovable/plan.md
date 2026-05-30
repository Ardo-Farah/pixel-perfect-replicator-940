# Fix document upload failing with "InvalidJWT"

## Root cause

In `src/routes/admin/documents.tsx`, the upload uses:

```ts
await supabase.storage.from(bucket).uploadToSignedUrl(storage_path, token, file)
```

The `supabase-js` client always appends `Authorization: Bearer <user-session>` to every storage request. The current browser session JWT (kid `9c7c8d4e-…`) fails signature verification at the storage service, so the PUT returns `400 InvalidJWT`. The signed upload URL/token itself is valid — only the extra auth header is rejected.

Confirmed from the network trace:
- `createDocumentUploadUrl` returns 200 with a valid token.
- The subsequent `PUT …/storage/v1/object/upload/sign/weekly-uploads/…?token=…` returns `{"statusCode":"400","error":"InvalidJWT","message":"signature verification failed"}`.

## Fix

Replace `uploadToSignedUrl` with a plain `fetch` PUT to the signed URL. Signed upload URLs are authenticated by the token in the query string and do not need (and reject) the user's session bearer.

### File: `src/routes/admin/documents.tsx`

Inside `uploadMut.mutationFn`, after `createUrl(...)`, swap:

```ts
const { error } = await supabase.storage
  .from(bucket)
  .uploadToSignedUrl(storage_path, token, file);
if (error) throw new Error(error.message);
```

for:

```ts
const url =
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/upload/sign/` +
  `${bucket}/${storage_path}?token=${encodeURIComponent(token)}`;
const res = await fetch(url, {
  method: "PUT",
  headers: { "x-upsert": "false" },
  body: file,
});
if (!res.ok) {
  const msg = await res.text().catch(() => res.statusText);
  throw new Error(`Upload failed (${res.status}): ${msg}`);
}
```

No other changes needed — `finalizeDocumentUpload` already runs after and writes the `documents` row.

## Verification

1. Upload the attached `Summary of outbreaks _28th May 2026.xlsx` from `/admin/documents`.
2. Confirm toast "Document uploaded" and file appears in the list under XLSX.
3. Confirm no `400 InvalidJWT` in network requests; the PUT to `/storage/v1/object/upload/sign/…` returns 200.
