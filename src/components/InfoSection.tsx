const DEADLINE = new Date('2026-04-30T23:59:59')

interface ContactField {
  label: string
  value: string
  href?: string
}

interface PartyCardProps {
  role: string
  name: string
  company?: string
  contact: ContactField[]
  tasks: string[]
}

function PartyCard({ role, name, company, contact, tasks }: PartyCardProps) {
  return (
    <div
      className="flex flex-col"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)', marginBottom: '0.35rem' }}>
          {role}
        </p>
        <p className="font-semibold" style={{ fontSize: '0.95rem', color: 'var(--foreground)', lineHeight: 1.3 }}>
          {name}
        </p>
        {company && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{company}</p>
        )}
      </div>

      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
        <dl className="space-y-2">
          {contact.map(({ label, value, href }) => (
            <div key={label}>
              <dt className="text-xs" style={{ color: 'var(--muted)', marginBottom: '1px' }}>{label}</dt>
              <dd className="text-sm font-medium" style={{ color: 'var(--foreground)', wordBreak: 'break-all' }}>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                    {value}
                  </a>
                ) : value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div style={{ padding: '1rem 1.25rem', flex: 1 }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)', marginBottom: '0.6rem' }}>
          Ansvar
        </p>
        <ul className="space-y-1.5">
          {tasks.map((task) => (
            <li key={task} className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
              <span style={{ marginTop: '6px', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)', flexShrink: 0, display: 'block' }} />
              {task}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function DeadlineBanner() {
  const now = new Date()
  const isPast = now > DEADLINE
  const isUrgent = !isPast && DEADLINE.getTime() - now.getTime() < 72 * 60 * 60 * 1000

  if (!isPast && !isUrgent) return null

  return (
    <div
      className="flex items-center gap-3 text-sm font-medium"
      style={{
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: `1px solid ${isPast ? '#FCA5A5' : '#FCD34D'}`,
        background: isPast ? '#FEF2F2' : '#FFFBEB',
        color: isPast ? '#B91C1C' : '#92400E',
      }}
      role="alert"
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      {isPast
        ? 'Deadline för inlämning av handlingar har passerat (30 april 2026).'
        : 'Handlingar ska vara inlämnade senast 30 april 2026.'}
    </div>
  )
}

interface InfoSectionProps {
  uploadButton: React.ReactNode
}

export function InfoSection({ uploadButton }: InfoSectionProps) {
  return (
    <section style={{ marginBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)', marginBottom: '0.4rem' }}>
          Slutbesiktning
        </p>
        <h1 className="font-bold" style={{ fontSize: '1.75rem', color: 'var(--foreground)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
          Lund 25:16
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Schlyters Väg 4, 224 60 Lund &nbsp;·&nbsp; Tisdag 5 maj 2026, kl 09:00 &nbsp;·&nbsp; HF17
        </p>
      </div>

      <DeadlineBanner />

      {uploadButton}

      <div className="grid gap-4 sm:grid-cols-3" style={{ marginTop: '1.5rem' }}>
        <PartyCard
          role="Besiktningsman"
          name="Tomas Persson"
          company="Näset Fastighetskonsult AB"
          contact={[
            { label: 'Telefon', value: '0708–685805', href: 'tel:0708685805' },
            { label: 'Org.nr', value: '559477-5743' },
            { label: 'Adress', value: 'Ljungvägen 6, Höllviken' },
          ]}
          tasks={[
            'Utföra okulär slutbesiktning',
            'Ta emot handlingar senast 30 april',
            'Upprätta besiktningsprotokoll',
          ]}
        />

        <PartyCard
          role="Beställare"
          name="Tobias Johansson & Elisabeth Ståhl"
          contact={[
            { label: 'E-post', value: 'tobiasjohansson79@gmail.com', href: 'mailto:tobiasjohansson79@gmail.com' },
            { label: 'Adress', value: 'Schlyters Väg 4, Lund' },
          ]}
          tasks={[
            'Ladda upp handlingar senast 30 april',
            'Kalla övriga parter',
            'Säkerställa tillgång till fastigheten',
          ]}
        />

        <PartyCard
          role="Entreprenör"
          name="Adde Zekaj"
          company="Palmens Byggservice AB"
          contact={[
            { label: 'Telefon', value: '0735084810', href: 'tel:0735084810' },
            { label: 'E-post', value: 'adde@palmensbygg.se', href: 'mailto:adde@palmensbygg.se' },
            { label: 'Webbplats', value: 'palmensvvs.se', href: 'https://palmensvvs.se' },
            { label: 'Org.nr', value: '559484-2915' },
          ]}
          tasks={[
            'Lämna egenkontroller (VVS, El, Bygg, Våtrum)',
            'Lämna provtrycknings- och säkervattensprotokoll',
            'Närvara vid besiktningen 5 maj',
          ]}
        />
      </div>
    </section>
  )
}
