import { GoogleGenAI } from '@google/genai'
import {
  CHECKLIST_ITEMS,
  groupItemsByCategory,
  type Category,
  type ChecklistItem,
} from '@/data/checklist-items'
import type { DocumentUpload } from '@/types/document'
import { GEMINI_FLASH_MODEL } from '@/lib/gemini-model'

/** Normalize stored titles/descriptions so substring checks survive hyphens and Swedish compounds. */
function normalizeCorpusText(corpusLower: string): string {
  return corpusLower
    .replace(/\u00ad/g, '') // soft hyphen
    .replace(/[\u2010-\u2015\u2212]/g, '-') // unicode dashes → ascii
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Övrig uploads that clearly belong to a category — counted when resolving mis-filed mandatory rows. */
function extraUploadsRelevantToCategory(category: Category, extra: DocumentUpload[]): DocumentUpload[] {
  if (extra.length === 0) return []
  switch (category) {
    case 'VVS':
      return extra.filter((u) => {
        const t = normalizeCorpusText(`${u.upload_title}\n${u.upload_description}`.toLowerCase())
        return (
          /vvs|säker.?vatten|säkervatten|avlopp|rör|provtryck|sanitär|värmepump|tappvatten|vatteninstallation|fjärrvärme|värmesystem/i.test(
            t,
          ) ||
          (t.includes('intyg') && (t.includes('säker') || t.includes('vatteninstallation')))
        )
      })
    default:
      return []
  }
}

function corpusForMandatoryCategory(
  category: Category,
  itemsInCategory: ChecklistItem[],
  uploadsBySlug: Record<string, DocumentUpload[]>,
  extraUploads: DocumentUpload[],
): DocumentUpload[] {
  const fromSlugs = itemsInCategory.flatMap((i) => uploadsBySlug[i.slug] ?? [])
  return [...fromSlugs, ...extraUploadsRelevantToCategory(category, extraUploads)]
}

function dedupeUploads(uploads: DocumentUpload[]): DocumentUpload[] {
  const seen = new Set<string>()
  const out: DocumentUpload[] = []
  for (const u of uploads) {
    if (seen.has(u.id)) continue
    seen.add(u.id)
    out.push(u)
  }
  return out
}

/** Docs anywhere on the site whose text signals VVS content — catches rows filed under Handlingar etc. */
function uploadsLikelyVvsRelated(uploads: DocumentUpload[]): DocumentUpload[] {
  return uploads.filter((u) => {
    const n = normalizeCorpusText(`${u.upload_title}\n${u.upload_description}`.toLowerCase())
    return /säker.?vatten|säkervatten|provtryck|vatteninstallation|avlopp|rör|sanitär|\bvvs\b|tappvatten|fjärrvärme|värmesystem|heat\s*up|tappvattensystem|intyg.*vatten|vatten.*intyg/i.test(
      n,
    )
  })
}

function mergeVvsSignalUploads(
  category: Category,
  base: DocumentUpload[],
  allUploads: DocumentUpload[],
): DocumentUpload[] {
  if (category !== 'VVS') return base
  return dedupeUploads([...base, ...uploadsLikelyVvsRelated(allUploads)])
}

/** Full corpus for mandatory matching (includes cross-area VVS signals when category is VVS). */
function mandatoryCorpusUploads(
  category: Category,
  itemsInCategory: ChecklistItem[],
  uploadsBySlug: Record<string, DocumentUpload[]>,
  extraUploads: DocumentUpload[],
  allUploads: DocumentUpload[],
): DocumentUpload[] {
  const base = corpusForMandatoryCategory(category, itemsInCategory, uploadsBySlug, extraUploads)
  return mergeVvsSignalUploads(category, base, allUploads)
}

/** Plain-text signals per slug when files sit under the wrong checklist row (backup if Gemini stalls or JSON breaks). */
function heuristicCoversSlug(slug: string, corpusLower: string): boolean {
  // NB: corpus is titlar + beskrivningar i samma område, gemener.
  const n = normalizeCorpusText(corpusLower)
  switch (slug) {
    case 'vvs-sakervatten':
      return (
        n.includes('säker vatten') ||
        n.includes('säkervatten') ||
        n.includes('säker vatteninstallation') ||
        n.includes('säkervatteninstallation') ||
        // Compound word: "vatteninstallation" has no word boundary between vatten … installation
        (n.includes('säker') && n.includes('vatteninstallation')) ||
        // Short AI titles: intyg + VVS topic words
        (n.includes('intyg') &&
          /vatten|avlopp|vvs|rör|sanitär|installation|tapp|värmepump|provtryck/i.test(n))
      )
    case 'vvs-egenkontroll':
      return (
        n.includes('provtryck') ||
        n.includes('provtryckning') ||
        n.includes('täthetsprov') ||
        n.includes('egenkontroll') ||
        n.includes('relining')
      )
    case 'el-egenkontroll':
      return (
        /\bgolvvärme\b|\belinstallation\b|\bjordfel\b|\bisolationsmätning\b|\bjordslut\b|\belsäker\b|\bel\b.*egenkontroll|egenkontroll.*\bel\b/i.test(
          corpusLower,
        ) || corpusLower.includes('isolation')
      )
    case 'bygg-egenkontroll':
      return corpusLower.includes('egenkontroll') && corpusLower.includes('bygg')
    case 'garantier-forsakring':
      return (
        corpusLower.includes('allrisk') ||
        corpusLower.includes('ansvarsförsäkring') ||
        corpusLower.includes('ansvarsförsäkr')
      )
    default:
      return false
  }
}

function categoryCorpus(uploads: DocumentUpload[]): string {
  return uploads
    .map((u) => `${u.upload_title}\n${u.upload_description}`)
    .join('\n')
    .toLowerCase()
}

function heuristicSatisfiedSlugs(
  missingSlugs: Set<string>,
  categoryUploads: DocumentUpload[],
): string[] {
  const corpusLower = categoryCorpus(categoryUploads)
  const out: string[] = []
  for (const slug of missingSlugs) {
    if (heuristicCoversSlug(slug, corpusLower)) out.push(slug)
  }
  return out
}

function buildPrompt(
  category: Category,
  missingRequired: ChecklistItem[],
  uploads: DocumentUpload[],
): string {
  const reqBlock = missingRequired
    .map(
      (item, idx) =>
        `${idx + 1}. slug "${item.slug}" — ${item.title}\n   Förväntat innehåll: ${item.description}`,
    )
    .join('\n')

  const docBlock = uploads
    .map((u, idx) => {
      return `${idx + 1}. Arkiverad under slug "${u.document_item_slug}"\n   Titel: ${u.upload_title}\n   Beskrivning: ${u.upload_description}`
    })
    .join('\n\n')

  return `Du hjälper vid slutbesiktning av en villa. Område: "${category}".

OBLIGATORISKA DELPOSTER som saknar en fil direkt kopplad till sin egen slug (men dokument kan finnas under annan slug i samma område):

${reqBlock}

ALLA UPPLADDADE DOKUMENT I DETTA OMRÅDE:

${docBlock}

Uppgift: För varje obligatorisk delpost, avgör om NÅGOT av dokumenten uppfyller kraven för just den posten utifrån titel och beskrivning — även om arkiveringen/kategorival är fel. Om titeln eller beskrivningen tydligt handlar om det som krävs (t.ex. Säker Vatten-intyg för säkervatten-raden, eller provtryckningsprotokoll för provtryck-raden), sätt covered till true och ange vilket dokument (1-baserat index i listan ovan) som täcker kravet bäst i best_doc.

Sätt covered till false bara om inget dokument verkar handla om den aktuella kravraden. Sätt då best_doc till null.

Svara ENDAST med giltig JSON (ingen annan text):
{"coverage":[{"slug":"<exakt slug>","covered":true,"best_doc":2}]}

Inkludera exakt en rad per obligatorisk delpost ovan. Slug ska matcha exakt de slug-värden som listas ovan. covered är antingen true eller false. best_doc är ett heltal (1-baserat dokumentindex) eller null.`
}

/** Pull out a JSON object if the model adds conversational text around it. */
function extractJsonObject(raw: string): string {
  const trimmed = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  try {
    JSON.parse(trimmed)
    return trimmed
  } catch {
    const start = trimmed.indexOf('{')
    if (start === -1) throw new SyntaxError('No JSON object')
    let depth = 0
    for (let i = start; i < trimmed.length; i++) {
      const c = trimmed[i]
      if (c === '{') depth++
      if (c === '}') {
        depth--
        if (depth === 0) return trimmed.slice(start, i + 1)
      }
    }
    throw new SyntaxError('Unbalanced braces')
  }
}

interface CoverageRow {
  slug?: string
  covered?: boolean
  best_doc?: number | null
}

interface ParsedCoverage {
  /** Required slugs AI says are satisfied */
  satisfiedSlugs: string[]
  /** Map of docIndex (0-based) → the required slug it best covers */
  docIndexToRequiredSlug: Map<number, string>
}

function parseCoverageJson(raw: string, allowedSlugs: Set<string>): ParsedCoverage {
  const jsonStr = extractJsonObject(raw)
  const parsed = JSON.parse(jsonStr) as { coverage?: CoverageRow[] }
  const satisfiedSlugs: string[] = []
  const docIndexToRequiredSlug = new Map<number, string>()
  for (const row of parsed.coverage ?? []) {
    if (row.covered === true && row.slug && allowedSlugs.has(row.slug)) {
      satisfiedSlugs.push(row.slug)
      // best_doc is 1-based from the prompt; convert to 0-based index
      if (typeof row.best_doc === 'number' && row.best_doc >= 1) {
        docIndexToRequiredSlug.set(row.best_doc - 1, row.slug)
      }
    }
  }
  return { satisfiedSlugs, docIndexToRequiredSlug }
}

export interface MisfiledSuggestion {
  /** DB id of the document that should move */
  documentId: string
  /** The required checklist slug it should be moved to */
  targetSlug: string
}

interface CategoryAnalysisResult {
  satisfiedSlugs: string[]
  misfiledSuggestions: MisfiledSuggestion[]
}

async function analyzeCategory(
  ai: GoogleGenAI,
  category: Category,
  itemsInCategory: ChecklistItem[],
  uploadsBySlug: Record<string, DocumentUpload[]>,
  extraUploads: DocumentUpload[],
  allUploads: DocumentUpload[],
): Promise<CategoryAnalysisResult> {
  const requiredInCat = itemsInCategory.filter((i) => i.required)
  const missingDirect = requiredInCat.filter(
    (i) => (uploadsBySlug[i.slug]?.length ?? 0) === 0,
  )
  if (missingDirect.length === 0) return { satisfiedSlugs: [], misfiledSuggestions: [] }

  const categoryUploads = mandatoryCorpusUploads(
    category,
    itemsInCategory,
    uploadsBySlug,
    extraUploads,
    allUploads,
  )
  if (categoryUploads.length === 0) return { satisfiedSlugs: [], misfiledSuggestions: [] }

  const allowed = new Set(missingDirect.map((i) => i.slug))
  const fromHeuristic = heuristicSatisfiedSlugs(allowed, categoryUploads)

  let satisfiedSlugs: string[] = []
  const misfiledSuggestions: MisfiledSuggestion[] = []

  try {
    const prompt = buildPrompt(category, missingDirect, categoryUploads)
    const response = await ai.models.generateContent({
      model: GEMINI_FLASH_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
    const raw = response.text ?? ''
    const parsed = parseCoverageJson(raw, allowed)
    satisfiedSlugs = parsed.satisfiedSlugs

    // Detect mis-filed documents: AI says doc at index N covers required slug S,
    // but the doc is currently stored under a different slug.
    for (const [docIndex, requiredSlug] of parsed.docIndexToRequiredSlug) {
      const doc = categoryUploads[docIndex]
      if (doc && doc.document_item_slug !== requiredSlug) {
        misfiledSuggestions.push({ documentId: doc.id, targetSlug: requiredSlug })
      }
    }
  } catch (err) {
    console.error('[mandatory-coverage-ai] Gemini failed for category', category, err)
  }

  return {
    satisfiedSlugs: [...new Set([...fromHeuristic, ...satisfiedSlugs])],
    misfiledSuggestions,
  }
}

export interface AiMandatoryCoverageResult {
  /** Required slugs AI judges as covered by an existing document */
  satisfiedSlugs: string[]
  /** Documents AI thinks are filed under the wrong slug */
  misfiledSuggestions: MisfiledSuggestion[]
}

/**
 * Required checklist slugs that have no direct upload but are satisfied by another
 * document in the same category (Gemini + keyword fallback on titles/descriptions).
 * Also returns mis-filed document suggestions where AI detected a better slug.
 */
export async function resolveAiMandatoryCoverage(
  uploadsBySlug: Record<string, DocumentUpload[]>,
  extraUploads: DocumentUpload[] = [],
): Promise<AiMandatoryCoverageResult> {
  const allUploads = dedupeUploads([
    ...Object.values(uploadsBySlug).flat(),
    ...extraUploads,
  ])

  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim()
  if (!apiKey) {
    return { satisfiedSlugs: resolveHeuristicOnly(uploadsBySlug, extraUploads, allUploads), misfiledSuggestions: [] }
  }

  const ai = new GoogleGenAI({ apiKey })
  const grouped = groupItemsByCategory(CHECKLIST_ITEMS)

  const results = await Promise.all(
    grouped.map(([category, itemsInCategory]) =>
      analyzeCategory(ai, category, itemsInCategory, uploadsBySlug, extraUploads, allUploads),
    ),
  )

  return {
    satisfiedSlugs: [...new Set(results.flatMap((r) => r.satisfiedSlugs))],
    misfiledSuggestions: results.flatMap((r) => r.misfiledSuggestions),
  }
}

/** When GOOGLE_AI_API_KEY is missing: keyword-only coverage (dev / fallback). */
function resolveHeuristicOnly(
  uploadsBySlug: Record<string, DocumentUpload[]>,
  extraUploads: DocumentUpload[],
  allUploads: DocumentUpload[],
): string[] {
  const grouped = groupItemsByCategory(CHECKLIST_ITEMS)
  const out: string[] = []
  for (const [category, itemsInCategory] of grouped) {
    const requiredInCat = itemsInCategory.filter((i) => i.required)
    const missingDirect = requiredInCat.filter(
      (i) => (uploadsBySlug[i.slug]?.length ?? 0) === 0,
    )
    if (missingDirect.length === 0) continue
    const categoryUploads = mandatoryCorpusUploads(
      category,
      itemsInCategory,
      uploadsBySlug,
      extraUploads,
      allUploads,
    )
    if (categoryUploads.length === 0) continue
    const allowed = new Set(missingDirect.map((i) => i.slug))
    out.push(...heuristicSatisfiedSlugs(allowed, categoryUploads))
  }
  return [...new Set(out)]
}
