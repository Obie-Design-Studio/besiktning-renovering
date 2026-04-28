import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Browser-safe Supabase client using the public anon key.
 * Use this in client components (e.g. for direct-to-storage uploads).
 */
export function createSupabaseBrowser(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

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
