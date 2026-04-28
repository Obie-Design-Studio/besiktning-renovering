import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Server-only Supabase client using the service role key.
 * Never call this from a client component — the service role key must never
 * be exposed to the browser.
 */
export function createSupabaseServer(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.',
    )
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    global: {
      // Disable Next.js fetch cache so the page always reads fresh data from Supabase
      fetch: (url, opts) => fetch(url as RequestInfo, { ...opts, cache: 'no-store' }),
    },
  })
}
