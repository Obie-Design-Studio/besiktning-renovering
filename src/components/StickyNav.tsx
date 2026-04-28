'use client'

import { useState, useEffect } from 'react'
import { NAV_ITEMS } from '@/data/nav-items'

export { NAV_ITEMS }

interface StickyNavProps {
  counts?: Record<string, number>
}

export function StickyNav({ counts = {} }: StickyNavProps) {
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
        const count = counts[id] ?? 0
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
              background: isActive ? 'rgba(255,255,255,0.8)' : count > 0 ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.15s',
            }} />
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#ffffff' : 'var(--muted)',
              transition: 'color 0.15s',
              letterSpacing: '0.01em',
              flex: 1,
            }}>
              {label}
            </span>
            {count > 0 && (
              <span style={{
                fontSize: '0.625rem',
                fontWeight: 600,
                lineHeight: 1,
                padding: '2px 5px',
                borderRadius: '20px',
                background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--border)',
                color: isActive ? '#ffffff' : 'var(--muted)',
                transition: 'background 0.15s, color 0.15s',
                flexShrink: 0,
              }}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
