import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { CHECKLIST_ITEMS } from '@/data/checklist-items'

export interface AnalyzeDocumentResponse {
  title: string
  description: string
  suggested_slug: string
}

const CHECKLIST_CONTEXT = CHECKLIST_ITEMS.map(
  (item) => `  - "${item.slug}": ${item.title} — ${item.description}`,
).join('\n')

const PROMPT = `Du är en assistent som hjälper till att kategorisera byggdokument för en slutbesiktning av en villa i Sverige.

Analysera detta PDF-dokument och returnera:
- "title": en kort, tydlig titel (max 8 ord) som beskriver vad dokumentet är
- "description": en beskrivning på 1–2 meningar som förklarar vad dokumentet innehåller och vad det visar
- "suggested_slug": den slug från listan nedan som bäst matchar dokumentets innehåll. Om inget stämmer bra, använd "ovrig".

Tillgängliga kategorier (slug: beskrivning):
${CHECKLIST_CONTEXT}
  - "ovrig": Övrig dokumentation som inte passar in i någon av kategorierna ovan

Skriv title och description på svenska. Var konkret — undvik vaga formuleringar.
Svara ENDAST med giltig JSON: {"title": "...", "description": "...", "suggested_slug": "..."}`

const VALID_SLUGS = new Set(['ovrig', ...CHECKLIST_ITEMS.map((i) => i.slug)])

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_AI_API_KEY saknas i miljövariabler.' },
      { status: 500 },
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Kunde inte läsa formulärdata.' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Ingen fil bifogad.' }, { status: 400 })
  }

  try {
    const ai = new GoogleGenAI({ apiKey })
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'application/pdf', data: base64 } },
            { text: PROMPT },
          ],
        },
      ],
    })

    const raw = response.text ?? ''
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    const parsed = JSON.parse(cleaned) as {
      title?: string
      description?: string
      suggested_slug?: string
    }

    const title = parsed.title ?? ''
    const description = parsed.description ?? ''
    const suggestedSlug = VALID_SLUGS.has(parsed.suggested_slug ?? '')
      ? (parsed.suggested_slug ?? 'ovrig')
      : 'ovrig'

    if (!title || !description) {
      return NextResponse.json(
        { error: 'AI returnerade inget svar. Skriv in titel och beskrivning manuellt.' },
        { status: 502 },
      )
    }

    const result: AnalyzeDocumentResponse = { title, description, suggested_slug: suggestedSlug }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      {
        error:
          'AI-analysen misslyckades. Försök igen eller skriv in titel och beskrivning manuellt.',
      },
      { status: 502 },
    )
  }
}
