export interface ChecklistItem {
  slug: string
  category: string
  title: string
  description: string
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    slug: 'vvs-egenkontroll',
    category: 'VVS',
    title: 'Egenkontroll VVS & Provtryckningsprotokoll',
    description: 'Egenkontroll för VVS-arbeten samt protokoll för provtryckning av rörinstallationer.',
  },
  {
    slug: 'vvs-sakervatten',
    category: 'VVS',
    title: 'Säkervattensprotokoll & Övrig VVS-dokumentation',
    description: 'Säkervatten-protokoll samt annan dokumentation så som foto och övriga intyg.',
  },
  {
    slug: 'vatrum-tatskikt',
    category: 'Våtrum',
    title: 'Egenkontroll Våtrum & Tätskikt',
    description:
      'Egenkontroll för våtrum och tätskikt, utfört enligt svensk standard av certifierad utförare.',
  },
  {
    slug: 'el-egenkontroll',
    category: 'El',
    title: 'Egenkontroll El, Isolationsmätning & Jordfelsprovning',
    description:
      'Fullständig el-dokumentation med egenkontroll, protokoll för isolationsmätning och jordfelsprovning.',
  },
  {
    slug: 'bygg-egenkontroll',
    category: 'Bygg',
    title: 'Egenkontroll Bygg',
    description:
      'Egenkontroll för allt utfört byggnadsarbete — att man följt ritning, beskrivning och gällande regelverk.',
  },
  {
    slug: 'ventilation',
    category: 'Ventilation',
    title: 'Ventilationsdokumentation & OVK',
    description:
      'Dokumentation av ventilationsinstallationer. OVK (obligatorisk ventilationskontroll) ska utföras om det krävs vid ombyggnation.',
  },
  {
    slug: 'drift-underhall',
    category: 'Drift & Underhåll',
    title: 'Drift- och underhållsinstruktioner',
    description: 'Instruktioner för drift och underhåll av installationer där sådana krävs.',
  },
  {
    slug: 'relationshandlingar',
    category: 'Handlingar',
    title: 'Underlag till relationshandlingar',
    description: 'Underlag och dokumentation som utgör relationshandlingar för fastigheten.',
  },
  {
    slug: 'kontrakt-handlingar',
    category: 'Handlingar',
    title: 'Kontrakt & Handlingar',
    description:
      'Kontrakt, avtal och handlingar som specificerar vad som ingår i uppdraget och utförda arbeten.',
  },
  {
    slug: 'garantier',
    category: 'Garantier & Försäkringar',
    title: 'Garantier & Försäkringar',
    description:
      'Försäkringsbrev, garantier och liknande handlingar. Enligt HF17 ska följande bifogas: Allriskförsäkring för skador på entreprenaden (beställaren ska vara medförsäkrad) samt Ansvarsförsäkring för entreprenörsverksamhet, som ska gälla under entreprenadtiden och minst två år efter entreprenadens godkännande.',
  },
]

/** Maps category name → sticky nav anchor ID. */
export const CATEGORY_NAV_ID: Record<string, string> = {
  'VVS': 'nav-vvs',
  'Våtrum': 'nav-vatrum',
  'El': 'nav-el',
  'Bygg': 'nav-bygg',
  'Ventilation': 'nav-ventilation',
  'Drift & Underhåll': 'nav-drift',
  'Handlingar': 'nav-handlingar',
  'Garantier & Försäkringar': 'nav-garantier',
}

/** Categories in display order. */
export const CATEGORY_ORDER = [
  'VVS',
  'Våtrum',
  'El',
  'Bygg',
  'Ventilation',
  'Drift & Underhåll',
  'Handlingar',
  'Garantier & Försäkringar',
] as const

export type Category = (typeof CATEGORY_ORDER)[number]

/** Returns checklist items grouped and sorted by category. */
export function groupItemsByCategory(
  items: ChecklistItem[],
): [Category, ChecklistItem[]][] {
  const map = new Map<Category, ChecklistItem[]>()
  for (const item of items) {
    const cat = item.category as Category
    map.set(cat, [...(map.get(cat) ?? []), item])
  }
  return CATEGORY_ORDER.filter((cat) => map.has(cat)).map((cat) => [cat, map.get(cat)!])
}
