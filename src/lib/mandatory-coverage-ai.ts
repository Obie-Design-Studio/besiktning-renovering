import { GoogleGenAI } from '@google/genai'
import {
  CHECKLIST_ITEMS,
  groupItemsByCategory,
  type Category,
  type ChecklistItem,
} from '@/data/checklist-items'
import type { DocumentUpload } from '@/types/document'
import { GEMINI_FLASH_MODEL } from '@/lib/gemini-model'

/** Plain-text signals per slug when files sit under the wrong checklist row (backup if Gemini stalls or JSON breaks). */
function heuristicCoversSlug(slug: string, corpusLower: string): boolean {
  // NB: corpus is titlar + beskrivningar i samma område, gemener.
  switch (slug) {
    case 'vvs-sakervatten':
      return (
        corpusLower.includes('säker vatten') ||
        corpusLower.includes('säkervatten') ||
        corpusLower.includes('säker vatteninstallation') ||
        corpusLower.includes('säkervatteninstallation')
      )
    case 'vvs-egenkontroll':
      return (
        corpusLower.includes('provtryck') ||
        corpusLower.includes('provtryckning') ||
        corpusLower.includes('täthetsprov') ||
        corpusLower.includes('egenkontroll') ||
        corpusLower.includes('relining')
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

Uppgift: För varje obligatorisk delpost, avgör om NÅGOT av dokumenten uppfyller kraven för just den posten utifrån titel och beskrivning — även om arkiveringen/kategorival är fel. Om titeln eller beskrivningen tydligt handlar om det som krävs (t.ex. Säker Vatten-intyg för säkervatten-raden, eller provtryckningsprotokoll för provtryck-raden), sätt covered till true.

Sätt covered till false bara om inget dokument verkar handla om den aktuella kravraden.

Svara ENDAST med giltig JSON (ingen annan text):
{"coverage":[{"slug":"<exakt slug>","covered":true}]}

Inkludera exakt en rad per obligatorisk delpost ovan. Slug ska matcha exakt de slug-värden som listas ovan. covered är antingen true eller false.`
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

function parseCoverageJson(raw: string, allowedSlugs: Set<string>): string[] {
  const jsonStr = extractJsonObject(raw)
  const parsed = JSON.parse(jsonStr) as { coverage?: { slug?: string; covered?: boolean }[] }
  const out: string[] = []
  for (const row of parsed.coverage ?? []) {
    if (row.covered === true && row.slug && allowedSlugs.has(row.slug)) {
      out.push(row.slug)
    }
  }
  return out
}

async function analyzeCategory(
  ai: GoogleGenAI,
  category: Category,
  itemsInCategory: ChecklistItem[],
  uploadsBySlug: Record<string, DocumentUpload[]>,
): Promise<string[]> {
  const requiredInCat = itemsInCategory.filter((i) => i.required)
  const missingDirect = requiredInCat.filter(
    (i) => (uploadsBySlug[i.slug]?.length ?? 0) === 0,
  )
  if (missingDirect.length === 0) return []

  const categoryUploads = itemsInCategory.flatMap((i) => uploadsBySlug[i.slug] ?? [])
  if (categoryUploads.length === 0) return []

  const allowed = new Set(missingDirect.map((i) => i.slug))
  const fromHeuristic = heuristicSatisfiedSlugs(allowed, categoryUploads)

  let fromAi: string[] = []
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
    fromAi = parseCoverageJson(raw, allowed)
  } catch (err) {
    console.error('[mandatory-coverage-ai] Gemini failed for category', category, err)
  }

  return [...new Set([...fromHeuristic, ...fromAi])]
}

/**
 * Required checklist slugs that have no direct upload but are satisfied by another
 * document in the same category (Gemini + keyword fallback on titles/descriptions).
 */
export async function resolveAiMandatoryCoverage(
  uploadsBySlug: Record<string, DocumentUpload[]>,
): Promise<string[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim()
  if (!apiKey) {
    // Without Gemini, still apply heuristics so mis-filed docs clear mandatory flags.
    return resolveHeuristicOnly(uploadsBySlug)
  }

  const ai = new GoogleGenAI({ apiKey })
  const grouped = groupItemsByCategory(CHECKLIST_ITEMS)

  const tasks = grouped.map(([category, itemsInCategory]) =>
    analyzeCategory(ai, category, itemsInCategory, uploadsBySlug),
  )

  const nested = await Promise.all(tasks)
  return [...new Set(nested.flat())]
}

/** When GOOGLE_AI_API_KEY is missing: keyword-only coverage (dev / fallback). */
function resolveHeuristicOnly(uploadsBySlug: Record<string, DocumentUpload[]>): string[] {
  const grouped = groupItemsByCategory(CHECKLIST_ITEMS)
  const out: string[] = []
  for (const [, itemsInCategory] of grouped) {
    const requiredInCat = itemsInCategory.filter((i) => i.required)
    const missingDirect = requiredInCat.filter(
      (i) => (uploadsBySlug[i.slug]?.length ?? 0) === 0,
    )
    if (missingDirect.length === 0) continue
    const categoryUploads = itemsInCategory.flatMap((i) => uploadsBySlug[i.slug] ?? [])
    if (categoryUploads.length === 0) continue
    const allowed = new Set(missingDirect.map((i) => i.slug))
    out.push(...heuristicSatisfiedSlugs(allowed, categoryUploads))
  }
  return [...new Set(out)]
}
