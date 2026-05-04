import type { Metadata } from 'next'
import './globals.css'
import { IdentityBadge } from '@/components/IdentityBadge'
import { IdentityProvider } from '@/context/IdentityContext'
import { SmartUploadProvider } from '@/context/SmartUploadContext'

export const metadata: Metadata = {
  title: 'Slutbesiktning Lund 25:16',
  description: 'Dokumentationsportal för slutbesiktning av Lund 25:16, Lunds kommun.',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="sv">
      <body className="min-h-screen antialiased" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <IdentityProvider>
        <SmartUploadProvider>
          <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
            <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
                Besiktningsportal
              </span>
              <IdentityBadge />
            </div>
          </header>

          <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>

          <footer className="mx-auto max-w-3xl px-6 pb-12">
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Schlyters Väg 4, 224 60 Lund &nbsp;·&nbsp; Tobias Johansson &amp; Elisabeth Ståhl &nbsp;·&nbsp; Palmens Byggservice AB
              </p>
            </div>
          </footer>
        </SmartUploadProvider>
        </IdentityProvider>
      </body>
    </html>
  )
}
