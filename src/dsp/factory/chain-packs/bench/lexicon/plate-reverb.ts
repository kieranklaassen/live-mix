import { type DeviceLexicon } from './types'

export const LEXICON: DeviceLexicon = {
  device: 'plate-reverb',
  jitter: ['predelayMs'],
  trim: [{ param: 'mix', kind: 'mix' }],
  voices: {
    'Medium plate': {
      says: 'a medium plate with a smooth tail of a few seconds',
      brief: 'a medium plate',
      nouns: ['plate'],
      roles: ['hall'],
      traits: ['clean'],
    },
    'Small plate': {
      says: 'a small plate that is gone in a second or two',
      brief: 'a small plate',
      nouns: ['plate'],
      roles: ['room'],
      traits: ['faint'],
    },
    'Long plate': {
      says: 'a long plate with a wide and even tail',
      brief: 'a long plate',
      nouns: ['plate'],
      roles: ['hall'],
      traits: ['long', 'wide'],
    },
    'Tight room': {
      says: 'a tight, damped little room close around the sound',
      brief: 'a tight little room',
      nouns: ['room', 'booth'],
      roles: ['room'],
      traits: ['short', 'faint'],
    },
    'Dark plate': {
      says: 'a dark plate whose tail is soft on top',
      brief: 'a dark plate',
      nouns: ['plate', 'shade'],
      roles: ['hall'],
      traits: ['dark', 'warm'],
    },
    'Bright plate': {
      says: 'a bright undamped plate of a couple of seconds',
      brief: 'a bright plate',
      nouns: ['plate'],
      roles: ['hall'],
      traits: ['bright', 'clean'],
    },
    'Faint sheen': {
      says: 'a quiet plate tail that comes in late behind each note',
      brief: 'a quiet late plate',
      nouns: ['sheen', 'plate'],
      roles: ['hall'],
      traits: ['clean'],
    },
    'Endless wash': {
      says: 'a plate wash that hangs on for half a minute',
      brief: 'a very long plate wash',
      nouns: ['wash', 'plate'],
      roles: ['hall'],
      traits: ['long', 'wide', 'heavy'],
    },
    'Distant haze': {
      says: 'a far-off plate haze with a long, soft tail',
      brief: 'a far-off plate haze',
      nouns: ['haze', 'plate'],
      roles: ['hall'],
      traits: ['far', 'wide', 'long'],
    },
    'Full wet send': {
      says: 'a plate heard alone with none of the dry sound left',
      brief: 'a plate with no dry sound',
      nouns: ['plate'],
      roles: ['hall'],
      traits: ['heavy', 'far', 'wide'],
    },
  },
}
