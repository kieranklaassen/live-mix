import { type DeviceLexicon } from './types'

export const LEXICON: DeviceLexicon = {
  device: 'fet-limiter',
  jitter: [],
  trim: [{ param: 'outputGain', kind: 'db' }],
  voices: {
    Safety: {
      says: 'a fast limiter that steps in only on the loudest peaks',
      brief: 'a safety limiter',
      nouns: ['limiter'],
      roles: ['ceiling'],
      traits: ['clean', 'faint', 'whole'],
    },
    Drive: {
      says: 'a fast limiter pushed so that soft and loud notes even out',
      brief: 'a pushed limiter',
      nouns: ['limiter'],
      roles: ['ceiling', 'glue'],
      traits: [],
    },
    Squash: {
      says: 'a fast limiter driven hard, pressing every note level',
      brief: 'a hard-driven limiter',
      nouns: ['limiter'],
      roles: ['ceiling'],
      traits: [],
    },
    'Light touch': {
      says: 'a fast limiter leaned on lightly, catching stray peaks',
      brief: 'a lightly pushed limiter',
      nouns: ['limiter'],
      roles: ['ceiling'],
      traits: ['clean', 'faint', 'whole'],
    },
    'Gentle lift': {
      says: 'a fast limiter pushed a little, holding the loudest notes in',
      brief: 'a gently pushed limiter',
      nouns: ['limiter'],
      roles: ['ceiling', 'glue'],
      traits: ['clean', 'faint'],
    },
    'Lower ceiling': {
      says: 'a safety limiter with its ceiling brought down a little',
      brief: 'a lowered safety limiter',
      nouns: ['limiter'],
      roles: [],
      traits: [],
      skip: 'It is "Safety" with the output 3 dB down and nothing else changed, and the output is the control the builder trims to bring a chain to level: not a voice of its own.',
    },
    Flattened: {
      says: 'a fast limiter at full drive that flattens every note',
      brief: 'a limiter at full drive',
      nouns: ['limiter'],
      roles: ['ceiling'],
      traits: [],
    },
    'Tucked under': {
      says: 'a hard-pressed limiter with its output pulled well down',
      brief: 'a pressed, quiet limiter',
      nouns: ['limiter'],
      roles: [],
      traits: [],
      skip: 'It is "Squash" with 4 dB more drive, which the probe cannot tell from it, and a lower output, which is the control the builder trims: not a voice of its own.',
    },
  },
}
