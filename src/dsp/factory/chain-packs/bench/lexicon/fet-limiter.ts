import { type DeviceLexicon } from './types'

export const LEXICON: DeviceLexicon = {
  device: 'fet-limiter',
  jitter: [],
  trim: [{ param: 'outputGain', kind: 'db' }],
  voices: {
    Safety: {
      says: 'a fast limiter that steps in only on the loudest peaks',
      brief: 'a safety limiter',
      nouns: ['limiter', 'guard', 'ceiling'],
      roles: ['ceiling'],
      traits: ['clean', 'faint'],
    },
    Drive: {
      says: 'a fast limiter pushed so that soft and loud notes even out',
      brief: 'a pushed limiter',
      nouns: ['limiter', 'press'],
      roles: ['ceiling', 'glue'],
      traits: [],
    },
    Squash: {
      says: 'a fast limiter driven hard, pressing every note level',
      brief: 'a hard-driven limiter',
      nouns: ['press', 'limiter', 'clamp'],
      roles: ['ceiling'],
      traits: [],
    },
    'Light touch': {
      says: 'a fast limiter leaned on lightly, catching stray peaks',
      brief: 'a lightly pushed limiter',
      nouns: ['limiter', 'guard'],
      roles: ['ceiling'],
      traits: ['clean', 'faint'],
    },
    'Gentle lift': {
      says: 'a fast limiter with the level lifted a little into it',
      brief: 'a limiter with a little lift',
      nouns: ['limiter', 'lift'],
      roles: ['ceiling', 'glue'],
      traits: ['clean', 'faint'],
    },
    'Lower ceiling': {
      says: 'a safety limiter with its ceiling brought down a little',
      brief: 'a lowered safety limiter',
      nouns: ['ceiling', 'limiter', 'lid'],
      roles: ['ceiling'],
      traits: ['clean', 'faint'],
    },
    Flattened: {
      says: 'a fast limiter at full drive that flattens every note',
      brief: 'a limiter at full drive',
      nouns: ['clamp', 'press', 'limiter'],
      roles: ['ceiling'],
      traits: [],
    },
    'Tucked under': {
      says: 'a hard-pressed limiter with its output pulled well down',
      brief: 'a pressed, quiet limiter',
      nouns: ['limiter', 'lid', 'press'],
      roles: ['ceiling'],
      traits: [],
    },
  },
}
