'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIdentityContext } from '@/context/IdentityContext'
import { updateDocumentUploader } from '@/actions/update-document-uploader'
import type { DocumentUpload, UploaderName } from '@/types/document'

const OPTIONS: { value: UploaderName; label: string }[] = [
  { value: 'Tobias', label: 'Tobias' },
  { value: 'Palmens byggservice', label: 'Palmens Byggservice' },
]

/** Tobias-only: correct mistaken uploader labels. Others see plain text. */
export function DocumentUploaderMeta({ upload }: { upload: DocumentUpload }) {
  const { identity } = useIdentityContext()
  const router = useRouter()
  const [pending, setPending] = useState(false)

  if (identity !== 'Tobias') {
    return <>{upload.uploader_name}</>
  }

  async function onSelect(value: UploaderName) {
    if (value === upload.uploader_name) return
    setPending(true)
    const result = await updateDocumentUploader(upload.id, value)
    setPending(false)
    if (result.success) router.refresh()
  }

  return (
    <select
      aria-label="Uppladdare"
      disabled={pending}
      value={upload.uploader_name}
      onChange={(e) => onSelect(e.target.value as UploaderName)}
      style={{
        fontSize: '0.75rem',
        color: 'var(--muted)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '2px 6px',
        background: 'var(--background)',
        maxWidth: '11rem',
      }}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
