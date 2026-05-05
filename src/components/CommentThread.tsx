'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addComment } from '@/actions/add-comment'
import { deleteComment } from '@/actions/delete-comment'
import { useIdentityContext } from '@/context/IdentityContext'
import type { Comment, CommentAuthor } from '@/types/comment'

interface CommentThreadProps {
  slug: string
  comments: Comment[]
}

const AUTHORS: CommentAuthor[] = ['Besiktningsman', 'Tobias', 'Palmens byggservice']

const AUTHOR_INITIAL: Record<CommentAuthor, string> = {
  Besiktningsman: 'B',
  Tobias: 'T',
  'Palmens byggservice': 'P',
}

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffHours / 24

  if (diffHours < 1) return 'nyss'
  if (diffHours < 24) return `${Math.floor(diffHours)} tim sedan`
  if (diffDays < 7) return `${Math.floor(diffDays)} dagar sedan`
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

function Avatar({ author }: { author: CommentAuthor }) {
  return (
    <div
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'var(--border)',
        color: 'var(--muted)',
        fontSize: '0.6875rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {AUTHOR_INITIAL[author]}
    </div>
  )
}

export function CommentThread({ slug, comments }: CommentThreadProps) {
  const router = useRouter()
  const { identity, setFallbackIdentity } = useIdentityContext()
  const [isOpen, setIsOpen] = useState(false)
  const [author, setAuthor] = useState<CommentAuthor | ''>('')
  const [state, formAction, isPending] = useActionState(addComment, null)
  const formRef = useRef<HTMLFormElement>(null)

  // Pre-select the author from the identity cookie
  useEffect(() => {
    if (identity && !author) {
      setAuthor(identity as CommentAuthor) // eslint-disable-line react-hooks/set-state-in-effect -- sync author field from persisted identity
    }
  }, [identity, author])

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      // Re-apply identity so the radio stays selected after reset
      if (identity) setAuthor(identity as CommentAuthor) // eslint-disable-line react-hooks/set-state-in-effect -- restore selection after form reset
      router.refresh()
    }
  }, [state?.success, router, identity])

  return (
    <div style={{ marginTop: '0.875rem' }}>

      {/* Existing comments — always visible */}
      {comments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '0.75rem' }}>
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2.5">
              <Avatar author={comment.author_name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-baseline gap-2" style={{ marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>
                    {comment.author_name}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
                    {formatRelative(comment.created_at)}
                  </span>
                  {identity === 'Tobias' && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm('Ta bort kommentaren?')) return
                        await deleteComment(comment.id)
                        router.refresh()
                      }}
                      style={{
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.6875rem',
                        color: 'var(--muted)',
                        padding: '0 2px',
                        lineHeight: 1,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#DC2626')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                      aria-label="Ta bort kommentar"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--foreground)',
                    lineHeight: 1.5,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {comment.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toggle — only controls the form */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontSize: '0.75rem',
          color: 'var(--muted)',
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {isOpen ? 'Avbryt' : 'Kommentera'}
      </button>

      {isOpen && (
        <div style={{ marginTop: '0.75rem' }}>
          {/* New comment form */}
          <form
            ref={formRef}
            action={formAction}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <input type="hidden" name="section_slug" value={slug} />

            {/* Author — hidden if identity is known from cookie */}
            {identity ? (
              <>
                <input type="hidden" name="author_name" value={identity} />
                <p style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
                  Kommenterar som <strong style={{ color: 'var(--foreground)' }}>{identity}</strong>
                </p>
              </>
            ) : (
              <div>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                  Vem skriver du som?
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {AUTHORS.map((name) => (
                    <label
                      key={name}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '5px',
                        border: `1px solid ${author === name ? 'var(--foreground)' : 'var(--border)'}`,
                        background: author === name ? 'var(--foreground)' : 'transparent',
                        fontSize: '0.75rem',
                        color: author === name ? 'var(--card)' : 'var(--muted)',
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                      }}
                    >
                      <input
                        type="radio"
                        name="author_name"
                        value={name}
                        checked={author === name}
                        onChange={() => {
                          setAuthor(name)
                          setFallbackIdentity(name)
                        }}
                        disabled={isPending}
                        className="sr-only"
                      />
                      {name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            <textarea
              name="message"
              rows={2}
              placeholder="Skriv ett meddelande..."
              disabled={isPending}
              style={{
                width: '100%',
                borderRadius: '7px',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                padding: '0.5rem 0.625rem',
                fontSize: '0.8125rem',
                color: 'var(--foreground)',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />

            {state?.error && (
              <p style={{ fontSize: '0.75rem', color: '#DC2626', margin: 0 }} role="alert">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              style={{
                alignSelf: 'flex-start',
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                background: 'var(--foreground)',
                color: 'var(--card)',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? 'Skickar...' : 'Skicka'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
