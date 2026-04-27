'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { uploadDocument } from '@/actions/upload-document'
import type { UploadDocumentState, UploaderName } from '@/types/document'
import type { AnalyzeDocumentResponse } from '@/app/api/analyze-document/route'
import { useIdentity } from '@/hooks/useIdentity'

interface InlineUploadFormProps {
  slug: string
  onCancel: () => void
}

type InputMode = 'file' | 'link'
type AnalysisState = 'idle' | 'analyzing' | 'done' | 'error'

const UPLOADERS: UploaderName[] = ['Tobias', 'Palmens byggservice']

async function fetchAiSuggestions(file: File): Promise<AnalyzeDocumentResponse> {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch('/api/analyze-document', { method: 'POST', body })
  const json = await res.json()
  if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Okänt fel')
  return json as AnalyzeDocumentResponse
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--background)',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--foreground)',
  outline: 'none',
}

export function InlineUploadForm({ slug, onCancel }: InlineUploadFormProps) {
  const identity = useIdentity()
  const [state, formAction, isPending] = useActionState<UploadDocumentState | null, FormData>(
    uploadDocument,
    null,
  )
  const [inputMode, setInputMode] = useState<InputMode>('file')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle')
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!selectedFile) return
    let cancelled = false

    async function analyze() {
      if (!selectedFile) return
      setAnalysisState('analyzing')
      setAnalysisError(null)
      setTitle('')
      setDescription('')
      try {
        const { title: aiTitle, description: aiDescription } = await fetchAiSuggestions(selectedFile)
        if (cancelled) return
        setTitle(aiTitle)
        setDescription(aiDescription)
        setAnalysisState('done')
      } catch (err) {
        if (cancelled) return
        setAnalysisError(err instanceof Error ? err.message : 'AI-analys misslyckades.')
        setAnalysisState('error')
      }
    }

    analyze()
    return () => { cancelled = true }
  }, [selectedFile])

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null)
  }

  function handleModeChange(mode: InputMode) {
    setInputMode(mode)
    setSelectedFile(null)
    setTitle('')
    setDescription('')
    setAnalysisState('idle')
    setAnalysisError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isAnalyzing = analysisState === 'analyzing'
  const showFields = inputMode === 'link' || analysisState === 'done' || analysisState === 'error'

  return (
    <form
      action={formAction}
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '1.25rem',
      }}
    >
      <input type="hidden" name="document_item_slug" value={slug} />

      {/* Mode toggle */}
      <div className="flex gap-1.5" style={{ marginBottom: '1rem' }}>
        {(['file', 'link'] as InputMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => handleModeChange(mode)}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: inputMode === mode ? '1px solid var(--foreground)' : '1px solid var(--border)',
              background: inputMode === mode ? 'var(--foreground)' : 'var(--card)',
              color: inputMode === mode ? 'var(--card)' : 'var(--muted)',
              transition: 'all 0.15s',
            }}
          >
            {mode === 'file' ? 'Fil' : 'Länk'}
          </button>
        ))}
      </div>

      {/* File picker */}
      {inputMode === 'file' && (
        <div style={{ marginBottom: analysisState === 'idle' ? '0' : '1rem' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2"
            style={{
              border: '1px dashed var(--border)',
              borderRadius: '8px',
              background: 'var(--card)',
              padding: '0.75rem',
              fontSize: '0.875rem',
              color: 'var(--muted)',
              cursor: 'pointer',
              marginBottom: '0.75rem',
              transition: 'border-color 0.15s',
            }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            {selectedFile ? selectedFile.name : 'Välj PDF-fil'}
          </button>
          <input ref={fileInputRef} name="file" type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="sr-only" />
          <input type="hidden" name="link_url" value="" />

          {isAnalyzing && (
            <div className="flex items-center gap-2" style={{ fontSize: '0.8125rem', color: 'var(--muted)', padding: '0.5rem 0' }}>
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyserar dokument...
            </div>
          )}

          {analysisState === 'done' && (
            <p style={{ fontSize: '0.75rem', color: '#16A34A', marginBottom: '0.75rem' }}>
              ✓ AI har föreslagit titel och beskrivning — granska nedan
            </p>
          )}

          {analysisState === 'error' && analysisError && (
            <p style={{ fontSize: '0.75rem', color: '#DC2626', marginBottom: '0.75rem' }}>
              {analysisError}
            </p>
          )}
        </div>
      )}

      {inputMode === 'link' && (
        <div style={{ marginBottom: '1rem' }}>
          <input name="link_url" type="url" placeholder="https://exempel.se/dokument.pdf" style={inputStyle} />
          <input type="hidden" name="file" value="" />
        </div>
      )}

      {/* Fields shown after analysis */}
      {showFields && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '0.35rem' }}>
              Titel <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input id={`title-${slug}`} name="upload_title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="t.ex. Provtryckningsprotokoll VVS" style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '0.35rem' }}>
              Beskrivning <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea id={`desc-${slug}`} name="upload_description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beskriv vad filen innehåller..." style={{ ...inputStyle, resize: 'none' }} />
          </div>

          <div>
            {identity ? (
              <>
                <input type="hidden" name="uploader_name" value={identity} />
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  Laddar upp som <strong style={{ color: 'var(--foreground)' }}>{identity}</strong>
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '0.5rem' }}>
                  Uppladdare <span style={{ color: '#DC2626' }}>*</span>
                </p>
                <div className="flex gap-2">
                  {UPLOADERS.map((name) => (
                    <label
                      key={name}
                      className="flex cursor-pointer items-center gap-2"
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                        fontSize: '0.8125rem',
                        color: 'var(--foreground)',
                        cursor: 'pointer',
                      }}
                    >
                      <input type="radio" name="uploader_name" value={name} className="accent-slate-800" />
                      {name}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {state?.error && (
            <p style={{ fontSize: '0.8125rem', color: '#DC2626' }} role="alert">{state.error}</p>
          )}

          <div className="flex gap-2" style={{ paddingTop: '0.25rem' }}>
            <button
              type="submit"
              disabled={isPending || isAnalyzing}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '7px',
                background: 'var(--foreground)',
                color: 'var(--card)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: 'none',
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? 'Sparar...' : 'Skicka in'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '7px',
                background: 'transparent',
                color: 'var(--muted)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <button type="button" onClick={onCancel} style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Avbryt
        </button>
      )}
    </form>
  )
}
