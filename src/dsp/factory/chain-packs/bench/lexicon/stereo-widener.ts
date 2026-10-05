import { type DeviceLexicon } from './types'

export const LEXICON: DeviceLexicon = {
  device: 'stereo-widener',
  jitter: [],
  trim: [],
  voices: {
    Mono: {
      says: 'the whole sound folded to mono',
      brief: 'a fold to mono',
      nouns: ['mono', 'centre'],
      roles: ['width'],
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
      says: 'the sides pushed out past normal, with the bass kept narrow',
      brief: 'the sides pushed out',
      nouns: ['width', 'sides'],
      roles: ['width'],
      traits: ['wide'],
    },
    'Ultra wide': {
      says: 'the sides pushed out as far as they go, one a touch late',
      brief: 'the sides at their widest',
      nouns: ['sides', 'width', 'spread'],
      roles: ['width'],
      traits: ['wide'],
    },
    Narrow: {
      says: 'the sides turned down, the image drawn towards the middle',
      brief: 'a narrowed stereo image',
      nouns: ['centre', 'middle'],
      roles: ['width'],
      traits: ['narrow', 'faint', 'clean'],
    },
    'Gently wide': {
      says: 'the sides lifted a little, wider with nothing added',
      brief: 'the sides lifted a little',
      nouns: ['width', 'sides'],
      roles: ['width'],
      traits: ['wide', 'faint', 'clean'],
    },
  },
}
