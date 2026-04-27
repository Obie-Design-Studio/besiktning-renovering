# Besiktning & Renovering — Project Memory

## What this project is

A public web gallery where anyone with the link can upload a PDF (or paste a link to one) and add a short description. No authentication. Anyone can view and upload.

## Stack

| Layer       | Choice                                    |
|-------------|-------------------------------------------|
| Framework   | Next.js 16 (App Router)                  |
| Language    | TypeScript                               |
| Styling     | Tailwind CSS                             |
| Database    | Supabase (PostgreSQL)                    |
| Storage     | Supabase Storage (`inspection-pdfs` bucket) |
| Auth        | None — fully public                      |

## Project structure

```
src/
├── actions/upload-inspection.ts   Server action: upload file/link + insert DB row
├── app/
│   ├── layout.tsx                 Site-wide header + layout
│   ├── page.tsx                   Public gallery (server component, SSR)
│   └── upload/page.tsx            Upload page (renders UploadForm island)
├── components/
│   ├── InspectionCard.tsx         Card shown in gallery grid
│   └── UploadForm.tsx             Client component — file/link toggle + form state
├── lib/supabase.ts                createSupabaseServer() — service role, server only
└── types/inspection.ts            Shared TypeScript types
docs/
└── besiktning-renovering-memory.md  ← this file
supabase/
└── migrations/20260427_create_inspections_table.sql
```

## Database

**Table:** `inspections`

| Column        | Type        | Notes                                       |
|---------------|-------------|---------------------------------------------|
| `id`          | UUID        | Primary key, auto-generated                 |
| `file_url`    | TEXT        | Supabase Storage public URL or external link |
| `file_name`   | TEXT        | Original filename or last URL path segment  |
| `description` | TEXT        | User-provided description (required)        |
| `file_source` | TEXT        | `'upload'` or `'link'`                      |
| `uploaded_at` | TIMESTAMPTZ | Auto-set on insert                          |

RLS: anon can SELECT and INSERT. No UPDATE or DELETE allowed.

## Supabase Storage

Bucket name: `inspection-pdfs`  
Access: **public** (files readable without auth)  
Policy: allow anon INSERT (uploads)

**To create the bucket in Supabase Dashboard:**
1. Go to Storage → New bucket
2. Name: `inspection-pdfs`
3. Public: ON
4. Max file size: 50 MB (free tier default)

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=           # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Anon/public key (safe to expose)
SUPABASE_SERVICE_ROLE_KEY=          # Service role key (server-only, never expose)
```

## Key decisions

- **Apr 2026:** No authentication — fully public upload and view. Anyone with the link can use the site.
- **Apr 2026:** Server actions handle all writes (no client-side Supabase calls). Only service role key used server-side.
- **Apr 2026:** Gallery is a server component (SSR) — fetches fresh data on every request.
- **Apr 2026:** Upload supports two modes: file upload to Supabase Storage, or pasting an external URL.
