import { type DeviceLexicon } from './types'

export const LEXICON: DeviceLexicon = {
  device: 'stereo-widener',
  jitter: [],
  trim: [],
  voices: {
    Mono: {
      says: 'the whole sound folded to mono',
      brief: 'a fold to mono',
      nouns: ['mono'],
      roles: ['tone'],
      traits: ['narrow', 'clean'],
    },
    Normal: {
      says: 'a widener set to leave the stereo image as it came',
      brief: 'a widener left flat',
      nouns: ['width'],
      roles: [],
      traits: ['faint'],
      skip: 'Width at the middle leaves the stereo image alone by design: 0.1 dB off the dry sound with no change in level.',
    },
    Wide: {
      says: 'a stereo image pushed wide, with the bass kept in the middle',
      brief: 'a widened stereo image',
      nouns: ['width'],
      roles: ['width'],
      traits: ['wide'],
    },
    'Ultra wide': {
      says: 'a stereo image at its widest, with one side a touch late',
      brief: 'the widest stereo image',
      nouns: ['width'],
      roles: ['width'],
      traits: ['wide'],
    },
    Narrow: {
      says: 'a stereo image drawn partway in towards mono',
      brief: 'a narrowed stereo image',
      nouns: ['mono'],
      roles: ['tone'],
      traits: ['narrow', 'faint', 'clean'],
    },
    'Gently wide': {
      says: 'a stereo image widened a little, with the bass left central',
      brief: 'a slightly wider image',
      nouns: ['width'],
      roles: ['width'],
      traits: ['wide', 'faint', 'clean', 'whole'],
    },
  },
}
