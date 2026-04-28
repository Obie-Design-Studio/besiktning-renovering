'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CHECKLIST_ITEMS } from '@/data/checklist-items'
import { saveDocumentUpload } from '@/actions/save-document-upload'
import { useIdentityContext } from '@/context/IdentityContext'
import type { AnalyzeDocumentResponse } from '@/app/api/analyze-document/route'
import type { UploaderName } from '@/types/document'

type FileStatus = 'analyzing' | 'ready' | 'saving' | 'done' | 'error'

interface FileReviewItem {
  id: string
  file: File | null
  linkUrl?: string
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
  onSetFallbackIdentity: (name: UploaderName) => void
}

function FileCard({ item, identity, onChange, onRemove, onSetFallbackIdentity }: FileCardProps) {
  const isDone = item.status === 'done'
  const isError = item.status === 'error'
  const isSaving = item.status === 'saving'
  const isAnalyzing = item.status === 'analyzing'
  const isReady = item.status === 'ready'

  return (
    <div
      style={{
        borderRadius: '10px',
        border: isReady ? '2px solid var(--accent)' : isDone ? '1px solid #BBF7D0' : isError ? '1px solid #FCA5A5' : '1px solid var(--border)',
        background: 'var(--card)',
        overflow: 'hidden',
        opacity: isDone ? 0.7 : 1,
        transition: 'opacity 0.2s',
        animation: isReady ? 'slideIn 0.25s ease-out' : undefined,
      }}
    >
      {/* Card header — accent stripe when ready */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          background: isReady ? 'var(--accent)' : isDone ? '#F0FDF4' : 'var(--background)',
          borderBottom: `1px solid ${isReady ? 'rgba(255,255,255,0.15)' : isDone ? '#BBF7D0' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {item.file ? (
            <svg className="h-4 w-4 shrink-0" style={{ color: isReady ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 shrink-0" style={{ color: isReady ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: isReady ? '#ffffff' : 'var(--foreground)' }}>
              {item.file ? item.file.name : item.linkUrl}
            </p>
            {isReady && (
              <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.75)', marginTop: '1px' }}>
                Granska nedan — klicka sedan "Spara till listan"
              </p>
            )}
          </div>
        </div>
        {!isDone && !isSaving && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="shrink-0"
            style={{ color: isReady ? 'rgba(255,255,255,0.5)' : '#D1D5DB', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
            onMouseEnter={e => e.currentTarget.style.color = isReady ? '#ffffff' : '#6B7280'}
            onMouseLeave={e => e.currentTarget.style.color = isReady ? 'rgba(255,255,255,0.5)' : '#D1D5DB'}
            aria-label="Ta bort"
          >
            ✕
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '0.875rem 1.25rem' }}>

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
        <div style={{ marginTop: '0.75rem' }}>
          {/* AI notice banner */}
          {item.file && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'rgba(28,63,94,0.05)',
              border: '1px solid rgba(28,63,94,0.12)',
              marginBottom: '1rem',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }} aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
              <p style={{ fontSize: '0.8125rem', color: 'var(--accent)', margin: 0, lineHeight: 1.45 }}>
                AI har fyllt i kategori, titel och beskrivning. <strong>Granska och justera</strong> om något behöver korrigeras — klicka sedan <strong>Spara till listan</strong>.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kategori
                <span style={{ fontSize: '0.6rem', background: 'var(--border)', borderRadius: '4px', padding: '1px 5px', color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'none' }}>redigerbar</span>
              </label>
              <select
                value={item.selectedSlug}
                onChange={(e) => onChange(item.id, { selectedSlug: e.target.value })}
                disabled={isSaving}
                style={{ width: '100%', borderRadius: '7px', border: '1.5px solid var(--border)', background: 'var(--card)', padding: '0.5rem 0.625rem', fontSize: '0.8125rem', color: 'var(--foreground)', outline: 'none', cursor: 'pointer' }}
              >
                {ALL_SLUG_OPTIONS.map((opt) => (
                  <option key={opt.slug} value={opt.slug}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Titel
                <span style={{ fontSize: '0.6rem', background: 'var(--border)', borderRadius: '4px', padding: '1px 5px', color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'none' }}>redigerbar</span>
              </label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => onChange(item.id, { title: e.target.value })}
                disabled={isSaving}
                style={{ width: '100%', borderRadius: '7px', border: '1.5px solid var(--border)', background: 'var(--card)', padding: '0.5rem 0.625rem', fontSize: '0.8125rem', color: 'var(--foreground)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Beskrivning
                <span style={{ fontSize: '0.6rem', background: 'var(--border)', borderRadius: '4px', padding: '1px 5px', color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'none' }}>redigerbar</span>
              </label>
              <textarea
                rows={3}
                value={item.description}
                onChange={(e) => onChange(item.id, { description: e.target.value })}
                disabled={isSaving}
                style={{ width: '100%', borderRadius: '7px', border: '1.5px solid var(--border)', background: 'var(--card)', padding: '0.5rem 0.625rem', fontSize: '0.8125rem', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }}
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
                    <input type="radio" name={`uploader-${item.id}`} value={name} checked={item.uploaderName === name} onChange={() => { onChange(item.id, { uploaderName: name }); onSetFallbackIdentity(name) }} disabled={isSaving} className="sr-only" />
                    {name}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      </div>{/* end body */}
    </div>
  )
}

export function SmartUpload() {
  const { identity, setFallbackIdentity } = useIdentityContext()
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<FileReviewItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function updateItem(id: string, patch: Partial<FileReviewItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function addLinkItem(url: string) {
    const trimmed = url.trim()
    if (!trimmed) return
    const newItem: FileReviewItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: null,
      linkUrl: trimmed,
      status: 'ready',
      title: '',
      description: '',
      selectedSlug: 'ovrig',
      uploaderName: (identity as UploaderName) ?? '',
    }
    setItems((prev) => [...prev, newItem])
    setUrlInput('')
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
      uploaderName: (identity as UploaderName) ?? '',
    }))

    setItems((prev) => [...prev, ...newItems])

    for (const item of newItems) {
      try {
        const result = await analyzeFile(item.file!)
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
  const analyzingItems = items.filter((i) => i.status === 'analyzing')
  const allReady = readyItems.length > 0 && analyzingItems.length === 0
  const canSaveAll = allReady && (identity !== null || readyItems.every((i) => i.uploaderName !== ''))

  async function handleSaveAll() {
    setSaveError(null)
    setIsSavingAll(true)
    const snapshot = readyItems // capture before async work begins
    let anySaved = false
    try {
      for (const item of snapshot) {
        updateItem(item.id, { status: 'saving' })
        const result = await saveDocumentUpload({
          slug: item.selectedSlug,
          uploadTitle: item.title,
          uploadDescription: item.description,
          uploaderName: identity ?? item.uploaderName,
          file: item.file,
          linkUrl: item.linkUrl,
        })
        if (result.success) {
          updateItem(item.id, { status: 'done' })
          anySaved = true
        } else {
          updateItem(item.id, { status: 'error', errorMessage: result.error ?? 'Okänt fel.' })
          setSaveError(result.error ?? 'Något gick fel. Försök igen.')
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Oväntat fel vid uppladdning.'
      setSaveError(msg)
    } finally {
      setIsSavingAll(false)
    }
    // Refresh immediately so data is ready when panel closes
    if (anySaved) router.refresh()
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const doneItems = items.filter((i) => i.status === 'done')
  const doneCount = doneItems.length
  const allDone = items.length > 0 && items.every((i) => i.status === 'done' || i.status === 'error')

  // Auto-close 4 seconds after all files are done (refresh already fired in handleSaveAll)
  useEffect(() => {
    if (!allDone || doneCount === 0) return
    const timer = setTimeout(() => {
      setIsOpen(false)
      setItems([])
    }, 4000)
    return () => clearTimeout(timer)
  }, [allDone, doneCount])

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
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '85vh',
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

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
        {/* Drop zone */}
        {!allDone && (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2"
              style={{
                border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '10px',
                padding: '2rem 1.5rem',
                background: isDragging ? 'rgba(28,63,94,0.04)' : 'var(--background)',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" style={{ color: 'var(--muted)' }} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Dra hit eller{' '}
                <span style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>välj PDF-filer</span>
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.6 }}>Flera filer kan väljas samtidigt</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleFiles(e.target.files)}
                className="sr-only"
              />
            </div>

            {/* URL input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', flexShrink: 0 }}>eller klistra in en URL</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLinkItem(urlInput) } }}
                placeholder="https://exempel.se/dokument.pdf"
                style={{
                  flex: 1,
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  color: 'var(--foreground)',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => addLinkItem(urlInput)}
                disabled={!urlInput.trim()}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: urlInput.trim() ? 'var(--foreground)' : 'var(--border)',
                  color: urlInput.trim() ? 'var(--card)' : 'var(--muted)',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: urlInput.trim() ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                  transition: 'background 0.15s',
                }}
              >
                Lägg till
              </button>
            </div>
          </>
        )}

        {/* File review cards */}
        {items.length > 0 && (
          <div className="space-y-3">
          {readyItems.length > 0 && analyzingItems.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#92400E' }}>
                {readyItems.length === 1 ? 'En fil redo — granska och redigera innan du sparar' : `${readyItems.length} filer redo — granska och redigera innan du sparar`}
              </p>
            </div>
          )}
            {items.map((item) => (
              <FileCard
                key={item.id}
                item={item}
                identity={identity as UploaderName | null}
                onChange={updateItem}
                onRemove={removeItem}
                onSetFallbackIdentity={(name) => setFallbackIdentity(name)}
              />
            ))}
          </div>
        )}

        {/* Analyzing progress hint */}
        {analyzingItems.length > 0 && readyItems.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--muted)' }}>
            Analyserar {analyzingItems.length} till…
          </p>
        )}

      </div>

      {/* Sticky footer — always visible */}
      {(canSaveAll || allDone || allReady || saveError) && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem', background: 'var(--card)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {saveError && !allDone && (
            <div style={{ borderRadius: '8px', border: '1px solid #FCA5A5', background: '#FEF2F2', padding: '0.75rem 1rem', display: 'flex', gap: '0.625rem' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }} aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#B91C1C', marginBottom: '2px' }}>Uppladdningen misslyckades</p>
                <p style={{ fontSize: '0.8125rem', color: '#DC2626' }}>{saveError}</p>
              </div>
            </div>
          )}

          {allDone ? (
            <div style={{ borderRadius: '10px', border: '1px solid #BBF7D0', background: '#F0FDF4', padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#15803D', marginBottom: '0.4rem' }}>
                Tack! {doneCount === 1 ? 'En fil lades till i listan.' : `${doneCount} filer lades till i listan.`}
              </p>
              <ul style={{ margin: '0 0 0.5rem', padding: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {doneItems.map((item) => (
                  <li key={item.id} style={{ fontSize: '0.8125rem', color: '#16A34A', display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                    <span>✓</span>
                    <span>
                      <span style={{ fontWeight: 500 }}>{item.title || item.file?.name || item.linkUrl}</span>
                      <span style={{ color: '#4ADE80', fontWeight: 400 }}> — {slugLabel(item.selectedSlug)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: '0.75rem', color: '#4ADE80', opacity: 0.8 }}>Stängs automatiskt…</p>
            </div>
          ) : canSaveAll ? (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSavingAll}
              style={{ width: '100%', background: 'var(--foreground)', color: 'var(--card)', border: 'none', borderRadius: '8px', padding: '0.875rem', fontSize: '0.9375rem', fontWeight: 700, cursor: isSavingAll ? 'not-allowed' : 'pointer', opacity: isSavingAll ? 0.6 : 1, letterSpacing: '-0.01em' }}
            >
              {isSavingAll ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sparar…
                </span>
              ) : readyItems.length === 1 ? 'Spara till listan' : `Spara ${readyItems.length} dokument till listan`}
            </button>
          ) : allReady ? (
            <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--muted)' }}>Välj uppladdare på varje dokument för att fortsätta</p>
          ) : null}

        </div>
      )}
    </div>
  )
}
