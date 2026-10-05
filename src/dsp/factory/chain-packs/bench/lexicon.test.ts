// Holds the lexicon to the devices: every preset an effect lists has a voice,
// no voice is for a preset that is not there, and the words keep to the form
// a chain's name and sentence are built from.
//
//   pnpm vitest run src/dsp/factory/chain-packs/bench/lexicon.test.ts
//   LEXICON_DEVICES=tape-loop,chorus ...     only those devices (while a file is being written)
//   LEXICON_COMPLETE=1 ...                   every effect must have its file

import { describe, expect, it } from 'vitest'

import { BENCH_EFFECTS, benchEffect, presetNames } from './effects'
import { LEXICON, ROLES, TRAITS, VOICE_LIMITS, type DeviceLexicon } from './lexicon'

const only = process.env.LEXICON_DEVICES?.split(',')

/** What is wrong with one device's lexicon; empty when it is in order. */
export function lexiconProblems(lexicon: DeviceLexicon): string[] {
  const problems: string[] = []
  const device = benchEffect(lexicon.device)
  if (!device) return [`${lexicon.device}: not an effect of the library`]
  const say = (problem: string) => problems.push(`${lexicon.device}: ${problem}`)
  const presets = presetNames(device)
  for (const name of presets) if (!(name in lexicon.voices)) say(`no voice for "${name}"`)
  for (const name of Object.keys(lexicon.voices)) {
    if (!presets.includes(name)) say(`a voice for "${name}", which the device does not list`)
  }
  for (const param of lexicon.jitter) {
    const spec = device.params[param]
    if (!spec) say(`jitter names "${param}", which is not a parameter`)
    else if (spec.choices !== undefined || spec.step === 1) {
      say(`jitter names "${param}", which is a list or a switch`)
    }
  }
  for (const trim of lexicon.trim) {
    if (!device.params[trim.param]) say(`trim names "${trim.param}", which is not a parameter`)
  }
  for (const [name, voice] of Object.entries(lexicon.voices)) {
    const at = (problem: string) => say(`"${name}": ${problem}`)
    for (const [field, text, limit] of [
      ['says', voice.says, VOICE_LIMITS.says],
      ['brief', voice.brief, VOICE_LIMITS.brief],
    ] as const) {
      if (text.length > limit) at(`${field} is ${text.length} of ${limit} characters`)
      if (text.length < 6) at(`${field} is too short to say anything`)
      if (/^[A-Z]/.test(text)) at(`${field} starts with a capital: it is the middle of a sentence`)
      if (/[.!?;:]$/.test(text)) at(`${field} ends in punctuation`)
      if (/\s{2,}|^\s|\s$/.test(text)) at(`${field} has stray spaces`)
    }
    if (voice.nouns.length < 1 || voice.nouns.length > VOICE_LIMITS.nouns) {
      at(`${voice.nouns.length} nouns, 1 to ${VOICE_LIMITS.nouns}`)
    }
    for (const noun of voice.nouns) {
      if (!/^[a-z]+$/.test(noun)) at(`noun "${noun}" is not one lower-case word`)
      if (noun.length > VOICE_LIMITS.noun) at(`noun "${noun}" is over ${VOICE_LIMITS.noun} letters`)
    }
    for (const role of voice.roles) {
      if (!ROLES.includes(role)) at(`role "${String(role)}" is not one`)
    }
    for (const trait of voice.traits) {
      if (!TRAITS.includes(trait)) at(`trait "${String(trait)}" is not one`)
    }
    if (new Set(voice.roles).size !== voice.roles.length) at('a role twice')
    if (new Set(voice.traits).size !== voice.traits.length) at('a trait twice')
    for (const [a, b] of [
      ['dark', 'bright'],
      ['long', 'short'],
      ['slow', 'fast'],
      ['wide', 'narrow'],
      ['clean', 'worn'],
      ['faint', 'heavy'],
      ['warm', 'cold'],
    ] as const) {
      if (voice.traits.includes(a) && voice.traits.includes(b)) at(`both ${a} and ${b}`)
    }
    if (voice.roles.length === 0 && !voice.skip) at('no role and no reason to skip it')
    if (voice.roles.length > 0 && voice.skip) at('a role and a reason to skip it')
    if (voice.roles.length > 3) at('more than three roles')
  }
  return problems
}

describe('the chain lexicon', () => {
  const chosen = [...LEXICON.values()].filter((lexicon) => !only || only.includes(lexicon.device))

  it.each(chosen.map((lexicon) => [lexicon.device, lexicon] as const))(
    '%s has a voice in order for every preset',
    (_id, lexicon) => {
      expect(lexiconProblems(lexicon)).toEqual([])
    },
  )

  it.skipIf(!process.env.LEXICON_COMPLETE)('has a file for every effect', () => {
    const missing = BENCH_EFFECTS.filter((device) => !LEXICON.has(device.id)).map(
      (device) => device.id,
    )
    expect(missing).toEqual([])
  })
})
