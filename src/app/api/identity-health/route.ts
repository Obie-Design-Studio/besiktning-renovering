import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function envPresent(v: string | undefined): boolean {
  return Boolean(v?.trim())
}

/** Same steps as DEPLOY.md — repeated here so API consumers get a single JSON bundle. */
const VERCEL_CHECKLIST = [
  'Vercel → Project → Settings → Environment Variables',
  'Lägg till (Production): IDENTITY_TOKEN_TOBIAS = samma hemliga sträng som efter ?token= i URL.',
  'Lägg till IDENTITY_TOKEN_PALMENS / IDENTITY_TOKEN_BESIKTNINGSMAN om du använder de länkarna.',
  'Spara och Redeploy efter env-ändringar (eller ny deployment från main).',
  'Testa i inkognito: https://besiktning-renovering.vercel.app/?token=DITT_TOKEN_VÄRDE',
  'Efter redirect: DevTools → Application → Cookies → ska finnas idn (t.ex. Tobias).',
  'Om idn saknas: token i URL matchar inte IDENTITY_TOKEN_TOBIAS i Vercel — fixa värdet och redeploy.',
] as const

/**
 * Deployment sanity check: booleans only (never secret values).
 * Includes the Vercel checklist as static strings — see also DEPLOY.md in the repo root.
 */
export async function GET() {
  const identityTokens = {
    tobias: envPresent(process.env.IDENTITY_TOKEN_TOBIAS),
    palmens: envPresent(process.env.IDENTITY_TOKEN_PALMENS),
    besiktningsman: envPresent(process.env.IDENTITY_TOKEN_BESIKTNINGSMAN),
  }

  const supabase = {
    url: envPresent(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: envPresent(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole: envPresent(process.env.SUPABASE_SERVICE_ROLE_KEY),
  }

  const googleAi = envPresent(process.env.GOOGLE_AI_API_KEY)

  const anyIdentityTokenConfigured =
    identityTokens.tobias || identityTokens.palmens || identityTokens.besiktningsman

  const supabaseReady = supabase.url && supabase.anonKey && supabase.serviceRole

  /** Owner token login + DB — minimal för „Markera sektion klar” och databas. */
  const productionIdentityAndDbReady = Boolean(identityTokens.tobias && supabaseReady)

  return NextResponse.json({
    identityTokens,
    anyIdentityTokenConfigured,
    /** True om Tobias-token är satt — krävs för ägar-flödet (?token= → idn). */
    tobiasTokenConfigured: identityTokens.tobias,
    googleAi,
    supabase,
    /** Grov hälsa: Tobias-token + Supabase komplett. */
    productionIdentityAndDbReady,
    vercelChecklist: [...VERCEL_CHECKLIST],
    docs: {
      deployMarkdown: 'DEPLOY.md i repo-roten beskriver samma steg.',
    },
  })
}
