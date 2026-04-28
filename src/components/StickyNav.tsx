'use client'

import { useState, useEffect } from 'react'

export const NAV_ITEMS = [
  { id: 'nav-info', label: 'Projekt & parter' },
  { id: 'nav-vvs', label: 'VVS' },
  { id: 'nav-vatrum', label: 'Våtrum' },
  { id: 'nav-el', label: 'El' },
  { id: 'nav-bygg', label: 'Bygg' },
  { id: 'nav-ventilation', label: 'Ventilation' },
  { id: 'nav-drift', label: 'Drift & Underhåll' },
  { id: 'nav-handlingar', label: 'Handlingar' },
  { id: 'nav-garantier', label: 'Garantier' },
  { id: 'nav-ovrig', label: 'Övrig dokumentation' },
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
        right: '1.5rem',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '6px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      }}
      className="hidden lg:flex"
    >
      {NAV_ITEMS.map(({ id, label }) => {
        const isActive = activeId === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => handleClick(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 8px',
              borderRadius: '6px',
              background: isActive ? 'var(--accent)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--background)' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              flexShrink: 0,
              background: isActive ? 'rgba(255,255,255,0.8)' : 'var(--border)',
              transition: 'background 0.15s',
            }} />
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#ffffff' : 'var(--muted)',
              transition: 'color 0.15s',
              letterSpacing: '0.01em',
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
