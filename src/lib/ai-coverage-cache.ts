import type { SupabaseClient } from '@supabase/supabase-js'

interface CacheRow {
  slug: string
  covered: boolean
}

/**
 * Returns the list of required slugs that AI has judged as covered, reading
 * from the `ai_coverage_cache` DB table.
 *
 * Returns `null` when:
 *   - The table does not exist yet (migration not run)
 *   - The table is empty (no re-check has been triggered yet)
 *
 * Returning null signals the caller to fall back to running Gemini live.
 */
export async function resolveAiCoverageFromCache(
  supabase: SupabaseClient,
): Promise<string[] | null> {
  const { data, error } = await supabase
    .from('ai_coverage_cache')
    .select('slug, covered')

  // Table missing or any other DB error → fall back to live AI
  if (error) return null

  // Empty table → no re-check triggered yet → fall back to live AI
  if (!data || data.length === 0) return null

  return (data as CacheRow[]).filter((r) => r.covered).map((r) => r.slug)
}
