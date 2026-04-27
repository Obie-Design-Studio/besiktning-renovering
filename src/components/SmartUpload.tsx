'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CHECKLIST_ITEMS } from '@/data/checklist-items'
import { saveDocumentUpload } from '@/actions/save-document-upload'
import { useIdentity } from '@/hooks/useIdentity'
import type { AnalyzeDocumentResponse } from '@/app/api/analyze-document/route'
import type { UploaderName } from '@/types/document'

type FileStatus = 'analyzing' | 'ready' | 'saving' | 'done' | 'error'

interface FileReviewItem {
  id: string
  file: File
  status: FileStatus
  title: string
  description: string
  selectedSlug: string
  uploaderName: UploaderName | ''
  errorMessage?: string
}

const UPLOADERS: UploaderName[] = ['Tobias', 'Palmens byggservice']

const ALL_SLUG_OPTIONS = [
  ...CHECKLIST_ITEMS.map((item) => ({ slug: item.slug, label: item.title })),
  { slug: 'ovrig', label: 'Övrig dokumentation' },
]

async function analyzeFile(file: File): Promise<AnalyzeDocumentResponse> {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch('/api/analyze-document', { method: 'POST', body })
  const json = await res.json()
  if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Okänt fel')
  return json as AnalyzeDocumentResponse
}

function slugLabel(slug: string): string {
  return ALL_SLUG_OPTIONS.find((o) => o.slug === slug)?.label ?? slug
}

interface FileCardProps {
  item: FileReviewItem
  identity: UploaderName | null
  onChange: (id: string, patch: Partial<FileReviewItem>) => void
  onRemove: (id: string) => void
}

function FileCard({ item, identity, onChange, onRemove }: FileCardProps) {
  const isDone = item.status === 'done'
  const isError = item.status === 'error'
  const isSaving = item.status === 'saving'
  const isAnalyzing = item.status === 'analyzing'
  const isReady = item.status === 'ready'

  return (
    <div
      style={{
        borderRadius: '10px',
        border: `1px solid ${isDone ? '#BBF7D0' : isError ? '#FCA5A5' : 'var(--border)'}`,
        background: 'var(--card)',
        padding: '1rem 1.25rem',
        opacity: isDone ? 0.75 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* File name + remove */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className="h-4 w-4 shrink-0 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
          <span className="truncate text-sm font-medium text-gray-700">{item.file.name}</span>
        </div>
        {!isDone && !isSaving && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="shrink-0 text-gray-300 hover:text-gray-500"
            aria-label="Ta bort"
          >
            ✕
          </button>
        )}
      </div>

      {/* Analyzing */}
      {isAnalyzing && (
        <div className="flex items-center gap-2" style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Analyserar...
        </div>
      )}

      {isDone && (
        <p style={{ fontSize: '0.8125rem', color: '#16A34A', fontWeight: 500 }}>
          ✓ Sparat under: {slugLabel(item.selectedSlug)}
        </p>
      )}

      {isError && item.errorMessage && (
        <p style={{ fontSize: '0.8125rem', color: '#DC2626' }}>{item.errorMessage}</p>
      )}

      {(isReady || isSaving) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kategori</label>
            <select
              value={item.selectedSlug}
              onChange={(e) => onChange(item.id, { selectedSlug: e.target.value })}
              disabled={isSaving}
              style={{ width: '100%', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--background)', padding: '0.4rem 0.625rem', fontSize: '0.8125rem', color: 'var(--foreground)', outline: 'none' }}
            >
              {ALL_SLUG_OPTIONS.map((opt) => (
                <option key={opt.slug} value={opt.slug}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Titel</label>
            <input type="text" value={item.title} onChange={(e) => onChange(item.id, { title: e.target.value })} disabled={isSaving}
              style={{ width: '100%', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--background)', padding: '0.4rem 0.625rem', fontSize: '0.8125rem', color: 'var(--foreground)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beskrivning</label>
            <textarea rows={2} value={item.description} onChange={(e) => onChange(item.id, { description: e.target.value })} disabled={isSaving}
              style={{ width: '100%', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--background)', padding: '0.4rem 0.625rem', fontSize: '0.8125rem', color: 'var(--foreground)', outline: 'none', resize: 'none' }}
            />
          </div>

          {identity ? (
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              Laddar upp som <strong style={{ color: 'var(--foreground)' }}>{identity}</strong>
            </p>
          ) : (
            <div className="flex gap-2">
              {UPLOADERS.map((name) => (
                <label key={name} className="flex cursor-pointer items-center gap-2"
                  style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${item.uploaderName === name ? 'var(--foreground)' : 'var(--border)'}`, background: item.uploaderName === name ? 'var(--foreground)' : 'var(--card)', fontSize: '0.75rem', color: item.uploaderName === name ? 'var(--card)' : 'var(--muted)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <input type="radio" name={`uploader-${item.id}`} value={name} checked={item.uploaderName === name} onChange={() => onChange(item.id, { uploaderName: name })} disabled={isSaving} className="sr-only" />
                  {name}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function SmartUpload() {
  const identity = useIdentity()
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<FileReviewItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isSavingAll, setIsSavingAll] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function updateItem(id: string, patch: Partial<FileReviewItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  async function processFiles(files: File[]) {
    const pdfFiles = files.filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    if (!pdfFiles.length) return

    const newItems: FileReviewItem[] = pdfFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      status: 'analyzing',
      title: '',
      description: '',
      selectedSlug: 'ovrig',
      // Pre-fill from identity cookie when available
      uploaderName: (identity as UploaderName) ?? '',
    }))

    setItems((prev) => [...prev, ...newItems])

    for (const item of newItems) {
      try {
        const result = await analyzeFile(item.file)
        updateItem(item.id, {
          status: 'ready',
          title: result.title,
          description: result.description,
          selectedSlug: result.suggested_slug,
        })
      } catch (err) {
        updateItem(item.id, {
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'AI-analys misslyckades.',
        })
      }
    }
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    processFiles(Array.from(fileList))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const readyItems = items.filter((i) => i.status === 'ready')
  const allReady = readyItems.length > 0
  // When identity is known from cookie, uploader is implicit — no manual selection needed
  const canSaveAll = allReady && (identity !== null || readyItems.every((i) => i.uploaderName !== ''))

  async function handleSaveAll() {
    setIsSavingAll(true)
    for (const item of readyItems) {
      updateItem(item.id, { status: 'saving' })
      const result = await saveDocumentUpload({
        slug: item.selectedSlug,
        uploadTitle: item.title,
        uploadDescription: item.description,
        uploaderName: identity ?? item.uploaderName,
        file: item.file,
      })
      if (result.success) {
        updateItem(item.id, { status: 'done' })
      } else {
        updateItem(item.id, { status: 'error', errorMessage: result.error })
      }
    }
    setIsSavingAll(false)
    router.refresh()
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const doneCount = items.filter((i) => i.status === 'done').length
  const allDone = items.length > 0 && items.every((i) => i.status === 'done')

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2.5"
        style={{
          background: 'var(--foreground)',
          color: 'var(--card)',
          border: 'none',
          borderRadius: '10px',
          padding: '0.875rem 1.5rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '0',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        Ladda upp dokument
      </button>
    )
  }

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '0',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--foreground)', fontSize: '0.9375rem' }}>Ladda upp dokument</h3>
          <p className="text-xs" style={{ color: 'var(--muted)', marginTop: '2px' }}>
            AI analyserar och placerar dokumenten i rätt kategori automatiskt
          </p>
        </div>
        {!isSavingAll && (
          <button
            type="button"
            onClick={() => { setIsOpen(false); setItems([]) }}
            style={{ fontSize: '0.8125rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Stäng
          </button>
        )}
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Drop zone */}
        {!allDone && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2"
            style={{
              border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '10px',
              padding: '2.5rem 1.5rem',
              background: isDragging ? 'rgba(28,63,94,0.04)' : 'var(--background)',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" style={{ color: 'var(--muted)' }} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Dra hit eller{' '}
              <span style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>välj filer</span>
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.6 }}>Flera filer kan väljas samtidigt</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="sr-only"
            />
          </div>
        )}

        {/* File review cards */}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <FileCard
                key={item.id}
                item={item}
                identity={identity as UploaderName | null}
                onChange={updateItem}
                onRemove={removeItem}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        {allDone ? (
          <div className="flex items-center justify-between" style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #BBF7D0', background: '#F0FDF4' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#16A34A' }}>
              ✓ {doneCount} {doneCount === 1 ? 'dokument sparat' : 'dokument sparade'}
            </p>
            <button type="button" onClick={() => { setIsOpen(false); setItems([]) }} style={{ fontSize: '0.8125rem', color: '#16A34A', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Stäng
            </button>
          </div>
        ) : canSaveAll ? (
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSavingAll}
            style={{ width: '100%', background: 'var(--foreground)', color: 'var(--card)', border: 'none', borderRadius: '8px', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600, cursor: isSavingAll ? 'not-allowed' : 'pointer', opacity: isSavingAll ? 0.6 : 1 }}
          >
            {isSavingAll ? 'Sparar...' : `Bekräfta och spara ${readyItems.length} ${readyItems.length === 1 ? 'dokument' : 'dokument'}`}
          </button>
        ) : allReady ? (
          <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--muted)' }}>Välj uppladdare på varje dokument för att fortsätta</p>
        ) : null}
      </div>
    </div>
  )
}
