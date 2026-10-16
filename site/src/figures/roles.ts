// One colour per role of a signal, the same in every figure of every lesson: what goes in, what
// comes out, a control signal, and up to three more that lie between. The colours themselves are
// in styles/site.css, one set for each scheme, so a figure and a caption name a line by its
// role or its label and never by a colour.

import type { TapInfo } from '../lab/describe.ts'

export const ROLES = ['in', 'out', 'ctl', 'alt', 'alt2', 'alt3'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_VAR: Record<Role, string> = {
  in: '--sig-in',
  out: '--sig-out',
  ctl: '--sig-ctl',
  alt: '--sig-alt',
  alt2: '--sig-alt2',
  alt3: '--sig-alt3',
}

/** A tap as a figure is handed it: what the lab says of it, and the colour it is drawn in. */
export interface TapRef extends Omit<TapInfo, 'index'> {
  role: Role
}

const isRole = (text: string | undefined): text is Role => ROLES.includes(text as Role)

/**
 * The taps a figure names, "in sidechain out" or "in level:alt", as the lab describes them.
 * A tap may name its role after a colon; the others get theirs by what they are. Throws on a
 * name the lab does not have, so a misspelt tap stops the build and does not draw an empty figure.
 */
export function tapRefs(
  names: string,
  taps: readonly TapInfo[],
  lesson = 'the lesson',
  /** In one picture each tap needs a colour of its own; in a strip of pictures each has its role's. */
  apart = true,
): TapRef[] {
  const asked = names
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((name) => {
      const [id, role] = name.split(':')
      const info = taps.find((tap) => tap.id === id)
      if (!info) {
        const known = taps.map((tap) => tap.id).join(', ')
        throw new Error(`${lesson}: the lab has no tap called "${id}". It has: ${known}`)
      }
      if (role !== undefined && !isRole(role)) {
        throw new Error(`${lesson}: "${role}" is not a role. The roles are: ${ROLES.join(', ')}`)
      }
      return { info, role }
    })

  const spare: Role[] = ['alt', 'alt2', 'alt3', 'ctl', 'out', 'in']
  const taken = new Set<Role>(asked.flatMap((one) => (one.role ? [one.role] : [])))
  const take = (wanted: Role): Role => {
    if (!apart) return wanted
    const role = taken.has(wanted) ? (spare.find((one) => !taken.has(one)) ?? wanted) : wanted
    taken.add(role)
    return role
  }
  const lastSound = asked.findLast(
    (one) => one.info.kind === 'audio' && one.info.origin !== 'source',
  )

  return asked.map((one) => {
    const { index: _index, ...info } = one.info
    let role = one.role
    if (!role) {
      if (info.origin === 'source') role = take('in')
      else if (asked.length === 1 && apart) role = take(info.kind === 'control' ? 'ctl' : 'out')
      else if (one === lastSound) role = take('out')
      else if (info.kind === 'control') role = take('ctl')
      else role = take('alt')
    }
    return { ...info, role }
  })
}
