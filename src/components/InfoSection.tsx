import { DeadlineBanner } from '@/components/DeadlineBanner'
import { ShareLinks } from '@/components/ShareLinks'

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
        <h1 className="font-bold" style={{ fontSize: '1.75rem', color: 'var(--foreground)', lineHeight: 1.2, marginBottom: '0.35rem' }}>
          Schlyters Väg 4
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Lund 25:16 &nbsp;·&nbsp; 224 60 Lund &nbsp;·&nbsp; Torsdag 7 maj 2026, kl 09:00 &nbsp;·&nbsp; HF17
        </p>
      </div>

      <DeadlineBanner />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {uploadButton}
        <a
          href="/api/download-all"
          download="besiktningsdokument.zip"
          className="flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[0.8125rem] font-medium text-[var(--muted)] no-underline transition-colors hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Ladda ner alla dokument (ZIP)
        </a>
      </div>

      <ShareLinks />

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
            { label: 'Telefon', value: '0706 850809', href: 'tel:0706850809' },
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
            'Närvara vid besiktningen 7 maj',
          ]}
        />
      </div>
    </section>
  )
}
