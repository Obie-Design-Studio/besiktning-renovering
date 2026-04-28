'use client'

import { useState, useEffect } from 'react'

export const NAV_ITEMS = [
  { id: 'nav-info', label: 'Projekt' },
  { id: 'nav-vvs', label: 'VVS' },
  { id: 'nav-vatrum', label: 'Våtrum' },
  { id: 'nav-el', label: 'El' },
  { id: 'nav-bygg', label: 'Bygg' },
  { id: 'nav-ventilation', label: 'Ventilation' },
  { id: 'nav-drift', label: 'Drift & UH' },
  { id: 'nav-handlingar', label: 'Handlingar' },
  { id: 'nav-garantier', label: 'Garantier' },
  { id: 'nav-ovrig', label: 'Övrig' },
]

export function StickyNav() {
  const [activeId, setActiveId] = useState<string>('nav-info')

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id)
        },
        { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  function handleClick(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      aria-label="Sidnavigering"
      style={{
        position: 'fixed',
        right: '1.75rem',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        alignItems: 'flex-end',
      }}
      className="hidden xl:flex"
    >
      {NAV_ITEMS.map(({ id, label }) => {
        const isActive = activeId === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => handleClick(id)}
            title={label}
            className="group flex items-center gap-2.5"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
          >
            {/* Label — visible on hover or when active */}
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: isActive ? 'var(--foreground)' : 'var(--muted)',
                whiteSpace: 'nowrap',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.15s, color 0.15s',
                letterSpacing: '0.02em',
              }}
              className="group-hover:opacity-100"
            >
              {label}
            </span>

            {/* Dot */}
            <div
              style={{
                width: isActive ? '7px' : '5px',
                height: isActive ? '7px' : '5px',
                borderRadius: '50%',
                background: isActive ? 'var(--accent)' : 'var(--border)',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            />
          </button>
        )
      })}
    </nav>
  )
}
