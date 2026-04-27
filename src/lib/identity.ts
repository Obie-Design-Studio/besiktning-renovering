export type IdentityName = 'Tobias' | 'Palmens byggservice' | 'Besiktningsman'

export interface Identity {
  name: IdentityName
  displayName: string
}

const IDENTITIES: Record<string, Identity> = {
  [process.env.IDENTITY_TOKEN_TOBIAS ?? '__unset_tobias__']: {
    name: 'Tobias',
    displayName: 'Tobias Johansson',
  },
  [process.env.IDENTITY_TOKEN_PALMENS ?? '__unset_palmens__']: {
    name: 'Palmens byggservice',
    displayName: 'Adde Zekaj / Palmens Byggservice',
  },
  [process.env.IDENTITY_TOKEN_BESIKTNINGSMAN ?? '__unset_besiktningsman__']: {
    name: 'Besiktningsman',
    displayName: 'Tomas Persson / Besiktningsman',
  },
}

export const COOKIE_NAME = 'idn'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

export function resolveToken(token: string): Identity | null {
  return IDENTITIES[token] ?? null
}
