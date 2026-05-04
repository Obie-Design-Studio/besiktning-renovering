import { cookies } from 'next/headers'
import { COOKIE_NAME } from '@/lib/identity'

const BASE_URL = 'https://besiktning-renovering.vercel.app'

interface ShareLink {
  label: string
  token: string | undefined
}

export async function ShareLinks() {
  const cookieStore = await cookies()
  const identity = cookieStore.get(COOKIE_NAME)?.value

  if (identity !== 'Tobias') return null

  const links: ShareLink[] = [
    { label: 'Tobias (du)', token: process.env.IDENTITY_TOKEN_TOBIAS },
    { label: 'Palmens Byggservice', token: process.env.IDENTITY_TOKEN_PALMENS },
    { label: 'Besiktningsman (Tomas Persson)', token: process.env.IDENTITY_TOKEN_BESIKTNINGSMAN },
  ]

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        marginTop: '1.5rem',
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--muted)', marginBottom: '0.75rem' }}
      >
        Inloggningslänkar
      </p>
      <ul className="space-y-2">
        {links.map(({ label, token }) => {
          const href = token ? `${BASE_URL}/?token=${token}` : null
          return (
            <li key={label} className="flex flex-col gap-0.5">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {label}
              </span>
              {href ? (
                <a
                  href={href}
                  className="text-sm font-mono break-all"
                  style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                >
                  {href}
                </a>
              ) : (
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  Token saknas i miljövariabler
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
