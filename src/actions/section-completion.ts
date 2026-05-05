'use server'

import { createSupabaseServer } from '@/lib/supabase'
import { hasPortalIdentityCookie } from '@/lib/server-identity'
import { NAV_ITEMS } from '@/data/nav-items'

const ALLOWED_NAV_IDS = new Set<string>(NAV_ITEMS.map((n) => n.id))

export async function setSectionCompletion(
  navId: string,
  completed: boolean,
): Promise<{ success: boolean; error?: string }> {
  if (!(await hasPortalIdentityCookie())) {
    return {
      success: false,
      error:
        'Ingen giltig inloggningscookie (idn). Öppna sidan med ?token=… eller klistra in token i den gula hjälprutan högst upp.',
    }
  }
  if (!ALLOWED_NAV_IDS.has(navId)) {
    return { success: false, error: 'Ogiltig sektion.' }
  }

  const supabase = createSupabaseServer()

  if (completed) {
    const { error } = await supabase.from('checklist_section_completion').upsert(
      { nav_id: navId, completed_at: new Date().toISOString() },
      { onConflict: 'nav_id' },
    )
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase.from('checklist_section_completion').delete().eq('nav_id', navId)
    if (error) return { success: false, error: error.message }
  }

  return { success: true }
}
