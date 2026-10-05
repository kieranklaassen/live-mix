// Rosewood Circles: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
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
    id: 'rosewood-ring-at-rehearsal',
    name: 'Ring at rehearsal',
    category: 'space',
    description:
      'A brief ring of sixteen C major strings behind each note, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Short halo', params: { decay: 0.718 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'rosewood-broad-leaf-air',
    name: 'Broad-leaf air',
    category: 'space',
    description:
      'A far-off room laid in under the untouched sound, into a thin bright reverb with all its lows cut away.',
    effects: [
      { deviceId: 're-amp', preset: 'Room underneath' },
      { deviceId: 'expanse', preset: 'Thin air', params: { modRate: 0.212 } },
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
    id: 'rosewood-rawhide-cloud',
    name: 'Rawhide cloud',
    category: 'space',
    description:
      'A stereo image widened a little, with the bass left central, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'rosewood-hall-on-soft-yarn',
    name: 'Hall on soft yarn',
    category: 'space',
    description:
      'A hall with about two and a half seconds of tail, then a wavering double of the sound spread wide to both sides.',
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
    id: 'rosewood-unvarnished-ring',
    name: 'Unvarnished ring',
    category: 'space',
    description:
      'One slow scatter of echoes over about a second and no tail, into sixteen strings in C major that ring for about ten seconds.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Long scatter' },
      { deviceId: 'sympathetic', preset: 'Long ring' },
    ],
  },
  {
    id: 'rosewood-tuning-bench-halo',
    name: 'Tuning-bench halo',
    category: 'space',
    description:
      'Sixteen hard-driven strings in F major that ring for seconds, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Glass harp' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { preDelay: 27.7, lowDecay: 1.36 } },
    ],
  },
  {
    id: 'rosewood-halo-on-bare-wood',
    name: 'Halo on bare wood',
    category: 'space',
    description:
      'Nine hard-driven strings in E minor that soon fall silent, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Hammered', params: { decay: 1.6 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'rosewood-padauk-trace',
    name: 'Padauk trace',
    category: 'space',
    description:
      'Five strings in F major that ring for about half a second, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Brief pluck' },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'rosewood-room-in-the-round',
    name: 'Room in the round',
    category: 'space',
    description:
      'The first hint of weight from a tape preamp, into a late wall of reverb that holds, then fades away.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'shaped-reverb', preset: 'Late wall' },
    ],
  },
  {
    id: 'rosewood-far-wall-plate',
    name: 'Far-wall plate',
    category: 'space',
    description:
      'A swell that fades every note in like a bow stroke, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 446, release: 163 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'rosewood-recital-hall',
    name: 'Recital hall',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 54.4, lowDecay: 3.21, midDecay: 2.62 },
      },
    ],
  },
  {
    id: 'rosewood-workshop-halo',
    name: 'Workshop halo',
    category: 'space',
    description:
      'A short bright haze with an octave above everything, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.27 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'rosewood-four-hand-drone',
    name: 'Four-hand drone',
    category: 'space',
    description:
      'A scooped tone with lows and highs up and the body down, into thirteen drone strings in D major kept near the centre.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow' },
      { deviceId: 'sympathetic', preset: 'Sitar drone' },
    ],
  },
  {
    id: 'rosewood-bronze-hall',
    name: 'Bronze hall',
    category: 'space',
    description:
      'A faint scatter of echoes just behind the sound, into a hall that answers about a quarter of a second late.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Faint scatter' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Late arrival',
        params: { decay: 5.24, predelayMs: 239, breathRate: 0.334 },
      },
    ],
  },
  {
    id: 'rosewood-patter-in-the-wings',
    name: 'Patter in the wings',
    category: 'space',
    description:
      'A slow pan from side to side, a few seconds each way, into a quick patter of separate echoes behind each note.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.156 } },
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { length: 0.393, glide: 0.54 } },
    ],
  },
  {
    id: 'rosewood-backstage-ring',
    name: 'Backstage ring',
    category: 'space',
    description:
      'Ten strings that tune themselves to the notes they hear, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.3 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 43.4, lowDecay: 2.35, midDecay: 3.01, mix: 0.078 },
      },
    ],
  },
  {
    id: 'rosewood-birch-shaft-room',
    name: 'Birch-shaft room',
    category: 'space',
    description:
      'Soft saturation that adds the octave above each note, into a reverb that fades evenly to nothing in a second or two.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { time: 1.58, preDelay: 19.1 } },
    ],
  },
  {
    id: 'rosewood-halo-before-dusk',
    name: 'Halo before dusk',
    category: 'space',
    description:
      'The close reflections of a very small room, into twelve strings in A minor that ring with notes in that key.',
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.357, breathRate: 0.324, mix: 0.15 },
      },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.27 } },
    ],
  },
  {
    id: 'rosewood-plate-at-the-bridge',
    name: 'Plate at the bridge',
    category: 'space',
    description:
      'Tape-style saturation that rounds only the loudest peaks, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'rosewood-four-mallet-haze',
    name: 'Four-mallet haze',
    category: 'space',
    description:
      'A thin, bright haze that hangs high above the sound, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'High air' },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'rosewood-practice-cloud',
    name: 'Practice cloud',
    category: 'space',
    description:
      'A bowed swell that lets part of each attack through, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed' },
      { deviceId: 'shaped-reverb', preset: 'Bloom' },
    ],
  },
  {
    id: 'rosewood-hall-among-gongs',
    name: 'Hall among gongs',
    category: 'space',
    description:
      'A hall that answers about a quarter of a second late, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Late arrival' },
      { deviceId: 'ambient-eq', preset: 'Forward' },
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
      'Short moments of the last few seconds replayed as they were, then a tape echo whose three heads make a cluster of each repeat.',
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
      'A transformer driven so the low end thickens and loosens, then a quick loop of about the last half second that soon fades.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { output: -6.88 } },
      { deviceId: 'micro-looper', preset: 'Quick loop', params: { length: 0.455 } },
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
    id: 'rosewood-cedar-echo',
    name: 'Cedar echo',
    category: 'echo',
    description:
      'An overdriven reel, then a three-head tape echo, into a quiet plate tail that comes in late behind each note.',
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
      'A bucket-brigade echo whose soft repeats dull as they fade, then a stereo image widened a little, with the bass left central.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 348, modRate: 0.666 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'rosewood-backstage-echo',
    name: 'Backstage echo',
    category: 'echo',
    description:
      'An echo whose repeats come in quick, separate pulses, into a bright wide chamber that is over in about a second.',
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
      'Each note answered by a rising C pentatonic run of echoes, into thirteen drone strings in D major kept near the centre.',
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
    id: 'rosewood-cut-cane-echo',
    name: 'Cut-cane echo',
    category: 'echo',
    description:
      'A clean, steady echo with no wobble and little dulling, into a short pipe that rings like metal on every attack.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 217, modRate: 0.653 } },
      { deviceId: 'swarm-reverb', preset: 'Metal pipe', params: { length: 0.0522, glide: 0.591 } },
    ],
  },
  {
    id: 'rosewood-birch-shaft-echo',
    name: 'Birch-shaft echo',
    category: 'echo',
    description:
      'A plain, centred echo rebuilt from grains, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Plain repeat', params: { time: 361 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'rosewood-paulownia-echoes',
    name: 'Paulownia echoes',
    category: 'echo',
    description:
      'A slow flanger-like sweep, opposite on each side, then a space that answers in hard separate echoes.',
    effects: [
      { deviceId: 'tremolo', preset: 'Drifting comb', params: { rate: 0.0996 } },
      { deviceId: 'expanse', preset: 'Hard echoes' },
    ],
  },
  {
    id: 'rosewood-hardwood-echo',
    name: 'Hardwood echo',
    category: 'echo',
    description:
      'A clean, steady echo with no wobble and little dulling, then a shallow chorus that thickens the sound above its lows.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 204, modRate: 0.565 } },
      { deviceId: 'chorus', preset: 'Vocal thickener', params: { rate: 0.414, delayMs: 17.9 } },
    ],
  },
  {
    id: 'rosewood-yarn-wound-memory',
    name: 'Yarn-wound memory',
    category: 'echo',
    description:
      'A quick slapback echo over short glimpses of earlier notes, into a far-off room laid in under the untouched sound.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Glimpses' },
      { deviceId: 're-amp', preset: 'Room underneath' },
    ],
  },
  {
    id: 'rosewood-echoes-before-dusk',
    name: 'Echoes before dusk',
    category: 'echo',
    description:
      'A handful of separate echoes that fall away and repeat, then a soft slapback echo close behind each note.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Scattered' },
      { deviceId: 'analog-delay', preset: 'Slapback' },
    ],
  },
  {
    id: 'rosewood-gourd-echo',
    name: 'Gourd echo',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 674 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 43.9, lowDecay: 1.97 },
      },
    ],
  },
  {
    id: 'rosewood-oiled-wood-loop',
    name: 'Oiled-wood loop',
    category: 'echo',
    description:
      'A thin, far-off tape loop with its lows cut away, then grain repeats that climb by fifths on every pass.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Thin and distant', params: { length: 2.44 } },
      { deviceId: 'grain-delay', preset: 'Rising fifths' },
    ],
  },
  {
    id: 'rosewood-workshop-cascade',
    name: 'Workshop cascade',
    category: 'echo',
    description:
      'Echoes that jump an octave on every repeat, left and right, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 'lattice', preset: 'Crystal cascade', params: { output: 5.09 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 165 } },
    ],
  },
  {
    id: 'rosewood-echo-round-again',
    name: 'Echo round again',
    category: 'echo',
    description:
      'An echo whose repeats jump up an octave and back, then a single saturated tape echo close behind each note.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 378, modRate: 0.543 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 82.4 } },
    ],
  },
  {
    id: 'rosewood-counted-echo',
    name: 'Counted echo',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into a small chapel with a short sung eh in its tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
      { deviceId: 'vowel-reverb', preset: 'Chapel' },
    ],
  },
  {
    id: 'rosewood-wide-set-echo',
    name: 'Wide-set echo',
    category: 'echo',
    description:
      'A plain echo whose repeats bounce from side to side, then dotted tape repeats that bounce from side to side.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Side to side',
        params: { time: 348, reach: 20.5, size: 3.16 },
      },
      { deviceId: 'tape-echo', preset: 'Dotted bounce' },
    ],
  },
  {
    id: 'rosewood-lacquered-echo',
    name: 'Lacquered echo',
    category: 'echo',
    description:
      'A plain echo that is a little darker on each repeat, into a reverb that swells up behind each note and cuts off.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Plain echo' },
      { deviceId: 'shaped-reverb', preset: 'Reverse' },
    ],
  },
  {
    id: 'rosewood-humid-echoes',
    name: 'Humid echoes',
    category: 'echo',
    description:
      'A console channel driven until it is firm in the mids, then echoes that sink in pitch, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'lattice', preset: 'Sinking cascade' },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
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
    id: 'rosewood-rattan-reel',
    name: 'Rattan reel',
    category: 'tape',
    description:
      'A tape reel pushed hard, saturated and thick, into a medium hall with only a breath of voice in its tail.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 3.1, preDelay: 21.6 } },
    ],
  },
  {
    id: 'rosewood-reel-among-gongs',
    name: 'Reel among gongs',
    category: 'tape',
    description:
      'A tape reel pushed hard, saturated and thick, then a clean, steady echo with no wobble and little dulling.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 216, modRate: 0.608 } },
    ],
  },
  {
    id: 'rosewood-oiled-wood-cassette',
    name: 'Oiled-wood cassette',
    category: 'tape',
    description:
      'A thick, soft cassette, full in the lows and dull on top, then a steady tape echo with no wobble, dirt or dulling.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 467 } },
    ],
  },
  {
    id: 'rosewood-cord-wound-reel',
    name: 'Cord-wound reel',
    category: 'tape',
    description:
      'A reel driven as hard as it goes, thick with harmonics, into a trace of room around the sound.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'rosewood-tape-after-rain',
    name: 'Tape after rain',
    category: 'tape',
    description:
      'A big lift of the low end that puts weight under the sound, then a thick, soft cassette, then echoes that climb an octave on every repeat.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.06 } },
      { deviceId: 'tape', preset: 'Warm thump', params: { output: -3.35 } },
      { deviceId: 'pitch-shifter', preset: 'Rising steps', params: { size: 66.6, delay: 321 } },
    ],
  },
  {
    id: 'rosewood-padauk-replay',
    name: 'Padauk replay',
    category: 'tape',
    description:
      'Short moments of the last few seconds replayed as they were, then a fresh reel of tape, open on top and nearly steady.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Just now', params: { time: 255, size: 0.792 } },
      { deviceId: 'patina', preset: 'New tape' },
    ],
  },
  {
    id: 'rosewood-chorus-in-bronze',
    name: 'Chorus in bronze',
    category: 'motion',
    description:
      'A thin chorus of one copy bending against the dry sound, into a faint hall tail of about three seconds.',
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
      'A hint of wavefolder, then a held pad whose every overtone wavers in pitch and level, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass', params: { outputDb: -7.19 } },
      { deviceId: 'sustainer', preset: 'Wavering choir', params: { attack: 0.43, glide: 0.67 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 5.54 } },
    ],
  },
  {
    id: 'rosewood-brazier-ripple',
    name: 'Brazier ripple',
    category: 'motion',
    description:
      'A harmonic tremolo whose lows and highs trade places quickly, into a thin veil of reverb kept low under the sound.',
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 3.54 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { decay: 2.72, breathRate: 0.328 } },
    ],
  },
  {
    id: 'rosewood-pulse-over-gourds',
    name: 'Pulse over gourds',
    category: 'motion',
    description:
      'A hard pan that jumps from one side to the other, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'tremolo', preset: 'Side to side', params: { rate: 2.66 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 65.1, lowDecay: 7.7, midDecay: 1.94 },
      },
    ],
  },
  {
    id: 'rosewood-roof-tile-chorus',
    name: 'Roof-tile chorus',
    category: 'motion',
    description:
      'A hard pan that jumps from one side to the other, then a wide chorus drifting over a cycle of about twelve seconds.',
    effects: [
      { deviceId: 'tremolo', preset: 'Side to side' },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'rosewood-tremolo-in-the-grove',
    name: 'Tremolo in the grove',
    category: 'motion',
    description:
      'A shudder in the level, too fast to count, into a small plain room that is over in about a second.',
    effects: [
      { deviceId: 'tremolo', preset: 'Fast shudder' },
      { deviceId: 'fdn-reverb', preset: 'Room' },
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
    id: 'rosewood-ringing-wash',
    name: 'Ringing wash',
    category: 'texture',
    description:
      'A fast, steady reel with soft saturation, then slow loops of each phrase that swell in at several octaves.',
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
      'A swell so late that notes seem to play in reverse, then a clear sustain that holds every note on after it is played.',
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
    id: 'rosewood-grove-wind-octaves',
    name: 'Grove-wind octaves',
    category: 'texture',
    description:
      'Slow soft replays of each phrase that climb by octaves, into a small plain room that is over in about a second.',
    effects: [
      { deviceId: 'cascade', preset: 'Slow staircase' },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'rosewood-high-bar-arpeggio',
    name: 'High-bar arpeggio',
    category: 'texture',
    description:
      'Each note replayed as an arpeggio of octaves and fifths, into five strings in F major that ring for about half a second.',
    effects: [
      { deviceId: 'cascade', preset: 'Rising steps', params: { time: 247 } },
      { deviceId: 'sympathetic', preset: 'Brief pluck' },
    ],
  },
  {
    id: 'rosewood-hard-stick-halo',
    name: 'Hard-stick halo',
    category: 'texture',
    description:
      'A thin, high pad an octave up with nothing low in it, then a big lift of presence and air, with ringing held in check.',
    effects: [
      { deviceId: 'pad-follower', preset: 'High mist', params: { rise: 1.47, fall: 9.24 } },
      { deviceId: 'ambient-eq', preset: 'Bright' },
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
      'A full voice an octave below a single line, in the centre, then a thinning tape echo, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'lattice', preset: 'Sub octave', params: { output: 5.7 } },
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 313 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
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
      'A bowed swell, then each note mirrored around D, with a third above, in C major, into a wide open space with a slowly wavering tail.',
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
      'A pure-tuned third, fifth and low octave in C major, then two dull copies a few cents off, tucked behind the sound.',
    effects: [
      { deviceId: 'lattice', preset: 'Just intonation triad', params: { output: 5.12 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'rosewood-charcoal-octave',
    name: 'Charcoal octave',
    category: 'pitch',
    description:
      'A faint octave above, a little air over the dry sound, into a quick patter of separate echoes behind each note.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Faint air' },
      { deviceId: 'swarm-reverb', preset: 'Pattering' },
    ],
  },
  {
    id: 'rosewood-wide-set-fifths',
    name: 'Wide-set fifths',
    category: 'pitch',
    description:
      'A wide, slightly detuned fifth above held chords, then a thin band of tone with the lows cut and the top rolled off.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth', params: { size: 67.4 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { clearTime: 1.48 } },
    ],
  },
  {
    id: 'rosewood-master-under-tiles',
    name: 'Master under tiles',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'rosewood-heartwood-mixdown',
    name: 'Heartwood mixdown',
    category: 'master',
    description:
      'A subsonic cut with the low mids and the presence eased, then a slightly wider image, then a lightly pushed limiter.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'rosewood-conservatory-finish',
    name: 'Conservatory finish',
    category: 'master',
    description:
      'A few decibels of soft saturation with the top eased, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.54, gain: -4.53 } },
    ],
  },
  {
    id: 'rosewood-cedar-finish',
    name: 'Cedar finish',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a very gentle compressor, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Glue', params: { attack: 534, release: 4.33 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
  {
    id: 'rosewood-counted-master',
    name: 'Counted master',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a parallel compressor that lifts quiet playing and tails, then a safety limiter.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 372, release: 3.08 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'rosewood-polish-on-bare-wood',
    name: 'Polish on bare wood',
    category: 'master',
    description:
      'A subsonic cut, then a gentle compressor that draws loud and quiet together, then a fast limiter that steps in only on the loudest peaks.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 3.26 } },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 2.45 } },
    ],
  },
  {
    id: 'rosewood-finish-between-bowls',
    name: 'Finish between bowls',
    category: 'master',
    description:
      'A rumble cut and a small lift of presence, then a compressor that lets each attack through before it levels, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys' },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { attack: 107, release: 1.68 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.93 } },
    ],
  },
]
