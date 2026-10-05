// Rosewood Circles: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'rosewood-padauk-strings',
    name: 'Padauk strings',
    category: 'space',
    description:
      'Nine hard-driven strings in E minor that soon fall silent, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Hammered', params: { decay: 1.52 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'rosewood-conservatory-strings',
    name: 'Conservatory strings',
    category: 'space',
    description:
      'Twelve strings in A minor that ring with notes in that key, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { decay: 3.73, mix: 0.27 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { preDelay: 30.7, lowDecay: 1.49, midDecay: 1.29, mix: 0.15 },
      },
    ],
  },
  {
    id: 'rosewood-four-hand-trace',
    name: 'Four-hand trace',
    category: 'space',
    description:
      'Four strings that retune to what is played and ring briefly, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Echo the tune', params: { mix: 0.24 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 36.7, lowDecay: 2.16, midDecay: 3.14, mix: 0.21 },
      },
    ],
  },
  {
    id: 'rosewood-tokyo-strings',
    name: 'Tokyo strings',
    category: 'space',
    description:
      'A faint ring of six strings in A major, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Faint ring' },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 55.7, midDecay: 1.97 },
      },
    ],
  },
  {
    id: 'rosewood-ring-at-rehearsal',
    name: 'Ring at rehearsal',
    category: 'space',
    description:
      'A brief ring of sixteen strings behind each note, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Short halo', params: { decay: 0.718 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'rosewood-strings-in-the-round',
    name: 'Strings in the round',
    category: 'space',
    description:
      'Four strings that retune to what is played and ring briefly, into a small tank that goes on ringing for seconds.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Echo the tune', params: { mix: 0.314 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'rosewood-workshop-hall',
    name: 'Workshop hall',
    category: 'space',
    description:
      'A small plain room that is over in about a second, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.09, breathRate: 0.306 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'rosewood-humid-strings',
    name: 'Humid strings',
    category: 'space',
    description:
      'A bowed swell at half strength under the dry attacks, into twelve strings in A minor that ring with notes in that key.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 275, release: 155 } },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { decay: 4.18, mix: 0.347 } },
    ],
  },
  {
    id: 'rosewood-hall-by-charcoal',
    name: 'Hall by charcoal',
    category: 'space',
    description:
      'A slow swell after each silence, with some dry attack left, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow' },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 56.4, lowDecay: 2.64, midDecay: 2.37 },
      },
    ],
  },
  {
    id: 'rosewood-roof-tile-choir',
    name: 'Roof-tile choir',
    category: 'space',
    description:
      'A tight cluster of tape repeats, like a very small room, into a small chapel with a short sung eh in its tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { time: 91.7, mix: 0.235 } },
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'rosewood-broad-leaf-air',
    name: 'Broad-leaf air',
    category: 'space',
    description:
      'A far-miked room laid in under the clean sound, into a thin bright tail with all its lows cut away.',
    effects: [
      { deviceId: 're-amp', preset: 'Room underneath' },
      { deviceId: 'expanse', preset: 'Thin air', params: { modRate: 0.212 } },
    ],
  },
  {
    id: 'rosewood-streamside-strings',
    name: 'Streamside strings',
    category: 'space',
    description:
      'A room heard from its far end with little dry sound left, into a brief ring of sixteen strings behind each note.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.496 } },
      { deviceId: 'sympathetic', preset: 'Short halo', params: { decay: 0.809, mix: 0.21 } },
    ],
  },
  {
    id: 'rosewood-vault-on-the-count',
    name: 'Vault on the count',
    category: 'space',
    description:
      'A cathedral with about six seconds of tail, then a fast reel with no hiss, driven hard so peaks are squashed.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 73.3, lowDecay: 6.49, midDecay: 5.65 },
      },
      { deviceId: 'tape', preset: 'Hot glue' },
    ],
  },
  {
    id: 'rosewood-rosewood-cluster',
    name: 'Rosewood cluster',
    category: 'space',
    description:
      'A plain two-voice chorus with a voice towards each side, into a tight cluster of tape repeats, like a very small room.',
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus' },
      { deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { time: 96.6 } },
    ],
  },
  {
    id: 'rosewood-air-over-gourds',
    name: 'Air over gourds',
    category: 'space',
    description:
      'The level breathing in and out about every four seconds, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.265 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall' },
    ],
  },
  {
    id: 'rosewood-fifths-by-the-stream',
    name: 'Fifths by the stream',
    category: 'space',
    description:
      'A soft slap close behind each note, into a reverb whose tail drifts up towards the fifth as it rings.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback' },
      { deviceId: 'bloom-reverb', preset: 'Rising fifths' },
    ],
  },
  {
    id: 'rosewood-strings-before-dusk',
    name: 'Strings before dusk',
    category: 'space',
    description:
      'A fine patter of thin high echoes with no bass in them, into a faint ring of six strings in A major.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Glass rain' },
      { deviceId: 'sympathetic', preset: 'Faint ring', params: { decay: 2.19 } },
    ],
  },
  {
    id: 'rosewood-harp-round-again',
    name: 'Harp round again',
    category: 'space',
    description:
      'A swell that takes about four seconds to open after silence, into twelve strings in A minor that ring with notes in that key.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier', params: { attack: 4430, release: 1900 } },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { decay: 3.67 } },
    ],
  },
  {
    id: 'rosewood-heartwood-strings',
    name: 'Heartwood strings',
    category: 'space',
    description:
      'A longer bowed swell that leans into every note, into twelve strings in A minor that ring with notes in that key.',
    effects: [
      { deviceId: 'swell', preset: 'Slow bow', params: { attack: 640, release: 149 } },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { decay: 4.25 } },
    ],
  },
  {
    id: 'rosewood-rawhide-cloud',
    name: 'Rawhide cloud',
    category: 'space',
    description:
      'The sides lifted a little, wider with nothing added, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'rosewood-gate-at-a-roll',
    name: 'Gate at a roll',
    category: 'space',
    description:
      'A triode valve stage, smoothly overdriven, into a short room fed in pulses about twice a second.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'fdn-reverb', preset: 'Pulsing gate' },
    ],
  },
  {
    id: 'rosewood-brazier-basses',
    name: 'Brazier basses',
    category: 'space',
    description:
      'Deep voices on an ee that come in late behind each note, into a hall heard from far off with little dry sound left.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Late basses', params: { decay: 7.53 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 22.4, lowDecay: 4.87, midDecay: 3.99 },
      },
    ],
  },
  {
    id: 'rosewood-hall-on-soft-yarn',
    name: 'Hall on soft yarn',
    category: 'space',
    description:
      'A hall with about two and a half seconds of tail, then a wavering double spread wide to both sides.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 54.3, lowDecay: 3.14, midDecay: 2.46 },
      },
      { deviceId: 'analog-delay', preset: 'Doubler' },
    ],
  },
  {
    id: 'rosewood-paulownia-strings',
    name: 'Paulownia strings',
    category: 'space',
    description:
      'A tight cluster of echoes close behind each note, into nine hard-driven strings in E minor that soon fall silent.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Tight swarm' },
      { deviceId: 'sympathetic', preset: 'Hammered', params: { decay: 1.67 } },
    ],
  },
  {
    id: 'rosewood-roof-tile-shade',
    name: 'Roof-tile shade',
    category: 'space',
    description:
      'A low cut with the low mids dipped and the presence lifted, then a bright chamber, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Voice' },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { decay: 2.69, modRate: 0.556 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 16.7 } },
    ],
  },
  {
    id: 'rosewood-unvarnished-trace',
    name: 'Unvarnished trace',
    category: 'echo',
    description:
      'A faint trace of tape echo behind the playing, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'rosewood-lacquered-repeats',
    name: 'Lacquered repeats',
    category: 'echo',
    description:
      'A plain echo that is a little darker on each repeat, into a brief swell of reverb close behind each note.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Plain echo' },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { time: 0.305 } },
    ],
  },
  {
    id: 'rosewood-tuning-bench-gallop',
    name: 'Tuning-bench gallop',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into a quick patter of separate echoes behind each note.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 632 } },
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { length: 0.382, glide: 0.58 } },
    ],
  },
  {
    id: 'rosewood-echoes-in-circles',
    name: 'Echoes in circles',
    category: 'echo',
    description:
      'A handful of separate echoes that fall away and repeat, into a bright wide room that rings for a second or two.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Scattered', params: { time: 1.94 } },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'rosewood-unconducted-echo',
    name: 'Unconducted echo',
    category: 'echo',
    description:
      'A tape echo whose warm repeats soften as they fade, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 413 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { preDelay: 29.3, lowDecay: 1.45, midDecay: 1.17 },
      },
    ],
  },
  {
    id: 'rosewood-birch-shaft-trace',
    name: 'Birch-shaft trace',
    category: 'echo',
    description:
      'A faint, dull echo with a slow chorus on it, into a small room that answers about an eighth of a second late.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo' },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { predelayMs: 122 } },
    ],
  },
  {
    id: 'rosewood-hardwood-bounce',
    name: 'Hardwood bounce',
    category: 'echo',
    description:
      'Dotted tape repeats that bounce from side to side, into a small plain room that is over in about a second.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.34, breathRate: 0.32 } },
    ],
  },
  {
    id: 'rosewood-oiled-wood-trace',
    name: 'Oiled-wood trace',
    category: 'echo',
    description:
      'A tape-style curve that rounds the peaks and dulls the top, then a faint trace of tape echo behind the playing.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -11 } },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 454 } },
    ],
  },
  {
    id: 'rosewood-cicada-noon-echo',
    name: 'Cicada-noon echo',
    category: 'echo',
    description:
      'A short, soft tape echo close behind the playing, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.18 } },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.49 } },
    ],
  },
  {
    id: 'rosewood-gourd-memory',
    name: 'Gourd memory',
    category: 'echo',
    description:
      'Short moments of the last few seconds, replayed as they were, then three tape heads in a row, a cluster on every repeat.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Just now' },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 505 } },
    ],
  },
  {
    id: 'rosewood-loop-between-bowls',
    name: 'Loop between bowls',
    category: 'echo',
    description:
      'A transformer driven so the low end thickens and loosens, then a quick loop of about the last half second, soon faded.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { output: -6.88 } },
      { deviceId: 'micro-looper', preset: 'Quick loop', params: { length: 0.455 } },
    ],
  },
  {
    id: 'rosewood-kneeling-trace',
    name: 'Kneeling trace',
    category: 'echo',
    description:
      'A tape loop kept low, an afterimage behind the playing, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Faint afterimage', params: { length: 3.71 } },
      { deviceId: 'expanse', preset: 'Faint air', params: { decay: 3.06, modRate: 0.422 } },
    ],
  },
  {
    id: 'rosewood-kneeling-echoes',
    name: 'Kneeling echoes',
    category: 'echo',
    description:
      'A space that answers in hard separate echoes, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'expanse', preset: 'Hard echoes', params: { decay: 3.89, modRate: 0.411 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'rosewood-midsummer-crystals',
    name: 'Midsummer crystals',
    category: 'echo',
    description:
      'The level breathing in and out about every four seconds, then echoes that jump an octave on every repeat, left and right.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.254 } },
      {
        deviceId: 'lattice',
        preset: 'Crystal cascade',
        params: { v1Delay: 323, v2Delay: 500, v3Delay: 151, output: 5.44 },
      },
    ],
  },
  {
    id: 'rosewood-bronze-bounce',
    name: 'Bronze bounce',
    category: 'echo',
    description:
      'A plain echo whose repeats bounce from side to side, into a short mono slap of a few reflections.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Side to side' },
      { deviceId: 'shaped-reverb', preset: 'Mono slap', params: { time: 0.133 } },
    ],
  },
  {
    id: 'rosewood-echo-in-rosewood',
    name: 'Echo in rosewood',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, into twelve strings in A minor that ring with notes in that key.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo' },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { decay: 4.03 } },
    ],
  },
  {
    id: 'rosewood-hard-stick-ghosts',
    name: 'Hard-stick ghosts',
    category: 'echo',
    description:
      'A heavy low shelf that puts weight under the sound, then a double-speed tape loop, an octave up and thin.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.29 } },
      { deviceId: 'tape-loop', preset: 'Octave up ghosts', params: { length: 2.83 } },
    ],
  },
  {
    id: 'rosewood-counted-scatter',
    name: 'Counted scatter',
    category: 'echo',
    description:
      'A handful of separate echoes that fall away and repeat, then a faint, dull echo with a slow chorus on it.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Scattered', params: { time: 2.27 } },
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { time: 262, modRate: 0.355 } },
    ],
  },
  {
    id: 'rosewood-cedar-echo',
    name: 'Cedar echo',
    category: 'echo',
    description:
      'An overdriven reel, then three tape heads in a row, a cluster on every repeat, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned', params: { output: -3 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 599 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 99.1 } },
    ],
  },
  {
    id: 'rosewood-soft-mallet-repeats',
    name: 'Soft-mallet repeats',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, then the sides lifted a little, wider with nothing added.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 348, modRate: 0.666 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'rosewood-slap-for-two-hands',
    name: 'Slap for two hands',
    category: 'echo',
    description:
      'A single saturated tape slap behind each note, into a small tank that goes on ringing for seconds.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap' },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank' },
    ],
  },
  {
    id: 'rosewood-backstage-echo',
    name: 'Backstage echo',
    category: 'echo',
    description:
      'An echo of single grains with gaps, so the repeats pulse, into a bright wide chamber that is over in about a second.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Pulsing repeat', params: { time: 240, size: 104 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { predelayMs: 5.29 } },
    ],
  },
  {
    id: 'rosewood-hinoki-arpeggio',
    name: 'Hinoki arpeggio',
    category: 'echo',
    description:
      'Each note answered by a rising pentatonic run of echoes, into thirteen drone strings in D major kept near the centre.',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Pentatonic harp',
        params: { v1Delay: 152, v2Delay: 275, v3Delay: 380, v4Delay: 446 },
      },
      { deviceId: 'sympathetic', preset: 'Sitar drone' },
    ],
  },
  {
    id: 'rosewood-grove-wind-scatter',
    name: 'Grove-wind scatter',
    category: 'echo',
    description:
      'Bright tape-style saturation mixed in under the clean sound, then a handful of separate echoes that fall away and repeat.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine' },
      { deviceId: 'shaped-reverb', preset: 'Scattered', params: { time: 2.3 } },
    ],
  },
  {
    id: 'rosewood-practice-gallop',
    name: 'Practice gallop',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into a thin veil of reverb kept low under the sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'rosewood-echo-for-two-hands',
    name: 'Echo for two hands',
    category: 'echo',
    description:
      'A swell that fades every note in like a bow stroke, then an echo whose repeats hop up a fifth and down a fourth.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 393, release: 139 } },
      { deviceId: 'analog-delay', preset: 'Fifth hop' },
    ],
  },
  {
    id: 'rosewood-two-player-echo',
    name: 'Two-player echo',
    category: 'echo',
    description:
      'A bucket-brigade echo with a slow chorus on its repeats, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 302, modRate: 0.836 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { preDelay: 26.8, midDecay: 5.1 } },
    ],
  },
  {
    id: 'rosewood-barefoot-round',
    name: 'Barefoot round',
    category: 'echo',
    description:
      'A lopsided soft curve that adds the octave above each note, then a one-second tape loop that soon dies away.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'tape-loop', preset: 'One second round', params: { length: 1.02 } },
    ],
  },
  {
    id: 'rosewood-yarn-wound-bounce',
    name: 'Yarn-wound bounce',
    category: 'echo',
    description:
      'A plain echo whose repeats bounce from side to side, then a scooped tone with lows and highs up and the body down.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Side to side' },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'rosewood-cut-cane-echo',
    name: 'Cut-cane echo',
    category: 'echo',
    description:
      'A clean, steady echo with no wobble and an open top, into a short pipe that rings like metal on every attack.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 217, modRate: 0.653 } },
      { deviceId: 'swarm-reverb', preset: 'Metal pipe', params: { length: 0.0522, glide: 0.591 } },
    ],
  },
  {
    id: 'rosewood-hill-thunder-tape',
    name: 'Hill-thunder tape',
    category: 'tape',
    description:
      'A fast reel with no hiss, driven hard so peaks are squashed, then a steady tape echo with no wobble, dirt or dulling.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'tape-echo', preset: 'Clean and steady' },
    ],
  },
  {
    id: 'rosewood-two-player-bloom',
    name: 'Two-player bloom',
    category: 'tape',
    description:
      'A valve stage that gives way under loud notes, tails rising, then an echo whose repeats jump up an octave and back.',
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom', params: { output: -6.64 } },
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 413, modRate: 0.574 } },
    ],
  },
  {
    id: 'rosewood-glue-in-the-grove',
    name: 'Glue in the grove',
    category: 'tape',
    description:
      'A few decibels of soft saturation with the top eased, then echoes falling an octave on one side, a fourth on the other.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'lattice', preset: 'Sinking cascade', params: { output: -0.418 } },
    ],
  },
  {
    id: 'rosewood-plum-rain-glow',
    name: 'Plum-rain glow',
    category: 'tape',
    description:
      'A valve stage driven hard until it thickens and sags, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { output: -6.32 } },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
    ],
  },
  {
    id: 'rosewood-coil-in-the-wings',
    name: 'Coil in the wings',
    category: 'tape',
    description:
      'A transformer driven so the low end thickens and loosens, then a resonant upper-mid peak that rises when played hard.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { output: -7.55 } },
      { deviceId: 'auto-filter', preset: 'Resonant peak' },
    ],
  },
  {
    id: 'rosewood-rattan-reel',
    name: 'Rattan reel',
    category: 'tape',
    description:
      'A tape reel pushed hard into thick saturation, into a medium hall with only a breath of a vowel in its tail.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 3.1, preDelay: 21.6 } },
    ],
  },
  {
    id: 'rosewood-tape-in-the-grove',
    name: 'Tape in the grove',
    category: 'tape',
    description:
      'Soft clipping, mixed low, then a clean pass over fast new tape, with nothing added, into a small damped room that is over within a second.',
    effects: [
      { deviceId: 'saturator', preset: 'Drum bus crunch' },
      { deviceId: 'tape', preset: 'Clean transfer' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { predelayMs: 9.38 } },
    ],
  },
  {
    id: 'rosewood-counted-deck',
    name: 'Counted deck',
    category: 'tape',
    description:
      'A fast, steady reel pushed into soft saturation, then two tape heads that make every repeat gallop.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { output: -2.28 } },
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 636 } },
    ],
  },
  {
    id: 'rosewood-stage-left-cassette',
    name: 'Stage-left cassette',
    category: 'tape',
    description:
      'A lift of presence and air, then a cassette with a full head bump and a rolled-off top, then echoes that climb an octave on every repeat.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.537 } },
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'pitch-shifter', preset: 'Rising steps', params: { size: 56.1, delay: 336 } },
    ],
  },
  {
    id: 'rosewood-cord-wound-shudder',
    name: 'Cord-wound shudder',
    category: 'motion',
    description:
      'A shudder in the level, too fast to count, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'tremolo', preset: 'Fast shudder', params: { rate: 15.7 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 2.89, breathRate: 0.273 } },
    ],
  },
  {
    id: 'rosewood-chorus-in-bronze',
    name: 'Chorus in bronze',
    category: 'motion',
    description:
      'A one-voice chorus, the pitch bending against the dry sound, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow chorus' },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 36, lowDecay: 2.66, midDecay: 3.24 },
      },
    ],
  },
  {
    id: 'rosewood-backstage-pan',
    name: 'Backstage pan',
    category: 'motion',
    description:
      'A slow pan from side to side, a few seconds each way, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan' },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'rosewood-conservatory-tremolo',
    name: 'Conservatory tremolo',
    category: 'motion',
    description:
      'A steady amplifier tremolo, about four pulses a second, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 4.47 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Tight chamber',
        params: { preDelay: 21.9, lowDecay: 1.08 },
      },
    ],
  },
  {
    id: 'rosewood-rainy-season-swell',
    name: 'Rainy-season swell',
    category: 'motion',
    description:
      'The level rising and falling at random, like surf, then a soft wash of octave and fifth loops over each note.',
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell' },
      { deviceId: 'cascade', preset: 'Sparkle bed', params: { time: 284 } },
    ],
  },
  {
    id: 'rosewood-hinoki-pad',
    name: 'Hinoki pad',
    category: 'motion',
    description:
      'A hint of wavefolder, then a held pad whose every overtone wavers, like a choir, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass', params: { outputDb: -7.19 } },
      { deviceId: 'sustainer', preset: 'Wavering choir', params: { attack: 0.43, glide: 0.67 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 5.54 } },
    ],
  },
  {
    id: 'rosewood-comb-on-bare-wood',
    name: 'Comb on bare wood',
    category: 'motion',
    description:
      'A slow comb sliding against the dry sound, sides opposed, into a reverb whose tail climbs nearly an octave as it rings.',
    effects: [
      { deviceId: 'tremolo', preset: 'Drifting comb', params: { rate: 0.0902 } },
      { deviceId: 'bloom-reverb', preset: 'Octave halo' },
    ],
  },
  {
    id: 'rosewood-humid-swell',
    name: 'Humid swell',
    category: 'motion',
    description:
      'A fast, steady reel pushed into soft saturation, then a reverb that swells and ebbs in waves of about four seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'shaped-reverb', preset: 'Slow tide' },
    ],
  },
  {
    id: 'rosewood-streamside-glitter',
    name: 'Streamside glitter',
    category: 'texture',
    description:
      'A fast glittering stutter of plucked octaves over each note, into a tight cluster of echoes close behind each note.',
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain', params: { time: 156 } },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm' },
    ],
  },
  {
    id: 'rosewood-barefoot-cascade',
    name: 'Barefoot cascade',
    category: 'texture',
    description:
      'Little loops of each note stacked one and two octaves up, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { time: 372 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3.9, breathRate: 0.269 } },
    ],
  },
  {
    id: 'rosewood-recital-strikes',
    name: 'Recital strikes',
    category: 'texture',
    description:
      'The start of each note struck again in a bouncing run, into five strings in F major that ring for about half a second.',
    effects: [
      { deviceId: 'cascade', preset: 'Restruck' },
      { deviceId: 'sympathetic', preset: 'Brief pluck', params: { decay: 0.521 } },
    ],
  },
  {
    id: 'rosewood-rolled-strikes',
    name: 'Rolled strikes',
    category: 'texture',
    description:
      'The start of each note struck again in a bouncing run, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'cascade', preset: 'Restruck', params: { time: 451 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.37, breathRate: 0.312 },
      },
    ],
  },
  {
    id: 'rosewood-organ-in-circles',
    name: 'Organ in circles',
    category: 'texture',
    description:
      'A steady, unmoving voice per note, like organ pipes, then a fresh reel of tape, open on top and nearly steady.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Still pipes', params: { rise: 0.0977 } },
      { deviceId: 'patina', preset: 'New tape' },
    ],
  },
  {
    id: 'rosewood-ringing-wash',
    name: 'Ringing wash',
    category: 'texture',
    description:
      'A fast, steady reel pushed into soft saturation, then slow loops of each phrase that swell in at several octaves.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'cascade', preset: 'Slow tiles' },
    ],
  },
  {
    id: 'rosewood-sustain-after-rain',
    name: 'Sustain after rain',
    category: 'texture',
    description:
      'A swell that arrives late, so notes seem to play in reverse, then every note sustained after it is played, with no smearing.',
    effects: [
      { deviceId: 'swell', preset: 'Backwards', params: { attack: 382, release: 93.3 } },
      { deviceId: 'spectral-blur', preset: 'Clean sustain' },
    ],
  },
  {
    id: 'rosewood-unhurried-tide',
    name: 'Unhurried tide',
    category: 'texture',
    description:
      'A swell that takes seconds to rise after each silence, then two unison doubles snapped to pitch, hard left and right.',
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      {
        deviceId: 'lattice',
        preset: 'Tuned double',
        params: { v1Delay: 18.6, v2Delay: 31.5, output: 5.43 },
      },
    ],
  },
  {
    id: 'rosewood-halo-off-the-hills',
    name: 'Halo off the hills',
    category: 'texture',
    description:
      'A bright, thin pad an octave up that follows closely, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Glassy', params: { rise: 0.142, fall: 2.27 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { preDelay: 52.3, midDecay: 2.85 } },
    ],
  },
  {
    id: 'rosewood-soft-mallet-swell',
    name: 'Soft-mallet swell',
    category: 'texture',
    description:
      'A slow swell after each silence that opens only at the end, into a small dead booth that is gone almost at once.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1400, release: 868 } },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'rosewood-plum-rain-harp',
    name: 'Plum-rain harp',
    category: 'pitch',
    description:
      'Each note answered by a rising pentatonic run of echoes, into a single saturated tape slap behind each note.',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Pentatonic harp',
        params: { v1Delay: 149, v2Delay: 252, v3Delay: 460, v4Delay: 500, output: 5.45 },
      },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 98.5 } },
    ],
  },
  {
    id: 'rosewood-fifths-at-the-bridge',
    name: 'Fifths at the bridge',
    category: 'pitch',
    description:
      'A wide, slightly detuned fifth above held chords, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth' },
      {
        deviceId: 'hall-reverb',
        preset: 'Tight chamber',
        params: { preDelay: 22.5, lowDecay: 1.07, midDecay: 1.01, mix: 0.125 },
      },
    ],
  },
  {
    id: 'rosewood-hill-thunder-sheen',
    name: 'Hill-thunder sheen',
    category: 'pitch',
    description:
      'A grainy octave and twelfth above, thickened by feedback, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Shimmer', params: { size: 42.6, delay: 41.9 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'rosewood-fifth-by-the-stream',
    name: 'Fifth by the stream',
    category: 'pitch',
    description:
      'A single voice a fifth above the dry sound, into a short burst of reverb that holds and stops dead.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Fifth above', params: { size: 62 } },
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.38 } },
    ],
  },
  {
    id: 'rosewood-octave-on-small-bars',
    name: 'Octave on small bars',
    category: 'pitch',
    description:
      'A single voice an octave above the dry sound, into a small plate that is gone in a second or two.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { size: 63.3 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 10.9 } },
    ],
  },
  {
    id: 'rosewood-charcoal-bass',
    name: 'Charcoal bass',
    category: 'pitch',
    description:
      'One voice an octave below a single line, as loud as the line, then a thinning tape echo, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'lattice', preset: 'Sub octave', params: { output: 5.7 } },
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 313 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'rosewood-high-bar-harp',
    name: 'High-bar harp',
    category: 'pitch',
    description:
      'Bright tape-style saturation mixed in under the clean sound, then each note answered by a rising pentatonic run of echoes.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine' },
      { deviceId: 'lattice', preset: 'Pentatonic harp', params: { output: 4.49 } },
    ],
  },
  {
    id: 'rosewood-goatskin-octaves',
    name: 'Goatskin octaves',
    category: 'pitch',
    description:
      'An octave above and an octave below a single line, then grain repeats that climb an octave on every pass.',
    effects: [
      { deviceId: 'lattice', preset: 'Octaves', params: { output: 4.47 } },
      { deviceId: 'grain-delay', preset: 'Crystals', params: { time: 317, size: 114 } },
    ],
  },
  {
    id: 'rosewood-sparks-under-tiles',
    name: 'Sparks under tiles',
    category: 'pitch',
    description:
      'Scattered sparks two octaves up, echoing higher still, into a tight cluster of tape repeats, like a very small room.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'High sparks', params: { size: 26.6, delay: 245 } },
      { deviceId: 'tape-echo', preset: 'Tiny room cluster' },
    ],
  },
  {
    id: 'rosewood-silk-string-voicing',
    name: 'Silk-string voicing',
    category: 'pitch',
    description:
      'A bowed swell, then a line mirrored around a centre note, with a third above it, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 372, release: 164 } },
      { deviceId: 'lattice', preset: 'Thesis voicing', params: { output: 6.61 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 10.4, modRate: 0.381 } },
    ],
  },
  {
    id: 'rosewood-rosewood-triad',
    name: 'Rosewood triad',
    category: 'pitch',
    description:
      'A pure-tuned third and fifth above, with an octave below, then two duller copies a few cents off, tucked behind the sound.',
    effects: [
      { deviceId: 'lattice', preset: 'Just intonation triad', params: { output: 5.12 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'rosewood-stage-left-deck',
    name: 'Stage-left deck',
    category: 'master',
    description:
      'A fast steady reel, then a low cut and some presence, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-eq', preset: 'Voice', params: { clearTime: 1.39 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -5.15 } },
    ],
  },
  {
    id: 'rosewood-preamp-by-charcoal',
    name: 'Preamp by charcoal',
    category: 'master',
    description:
      'A brightish valve curve, then a fast compressor that takes the spike off plucked notes, then an eased-back ceiling.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp' },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { attack: 11.1, release: 0.157 } },
      { deviceId: 'ambient-limiter', preset: 'Pull back', params: { release: 1.4, gain: -0.362 } },
    ],
  },
  {
    id: 'rosewood-unvarnished-room',
    name: 'Unvarnished room',
    category: 'master',
    description:
      'The close reflections of a very small room, then a fast limiter that steps in only on the loudest peaks.',
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.363, breathRate: 0.297 },
      },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'rosewood-hinoki-lift',
    name: 'Hinoki lift',
    category: 'master',
    description:
      'A parallel compressor, then the sides lifted a little, wider with nothing added, then a true-peak ceiling with the level pushed up into it.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 361, release: 3.33 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { release: 2.21, gain: 2.08 } },
    ],
  },
  {
    id: 'rosewood-sawn-plank-trace',
    name: 'Sawn-plank trace',
    category: 'master',
    description:
      'A faint hall tail of about three seconds, then a fast limiter pushed so that soft and loud notes even out.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 36.6, lowDecay: 2.61, midDecay: 2.95 },
      },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'rosewood-tape-on-soft-yarn',
    name: 'Tape on soft yarn',
    category: 'master',
    description:
      'A reel driven hot, then a slightly eased equaliser, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'rosewood-glue-for-two-hands',
    name: 'Glue for two hands',
    category: 'master',
    description:
      'A gentle compressor, then the sides lifted a little, wider with nothing added, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { gain: 3.78 } },
    ],
  },
]
