// Island Patch Cables: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'patch-cables-drift-in-the-ferns',
    name: 'Drift in the ferns',
    category: 'space',
    description:
      'A resonant upper-mid peak that rises when played hard, into a hall whose tail sways in pitch with a trace of the octave.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Resonant peak' },
      { deviceId: 'shimmer', preset: 'Swaying hall', params: { decay: 3.99 } },
    ],
  },
  {
    id: 'patch-cables-sparkle-in-the-crown',
    name: 'Sparkle in the crown',
    category: 'space',
    description:
      'A console channel run hot with its level pulled back down, into a small room that sparkles two octaves above the sound.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel', params: { output: -19.5 } },
      { deviceId: 'shimmer', preset: 'Sparkle room', params: { decay: 1.23 } },
    ],
  },
  {
    id: 'patch-cables-fern-plate',
    name: 'Fern plate',
    category: 'space',
    description:
      'A compressor as slow as a hand on a fader, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 4.48 } },
    ],
  },
  {
    id: 'patch-cables-springs-on-wet-cedar',
    name: 'Springs on wet cedar',
    category: 'space',
    description:
      'A slow swell after each silence, with some dry attack left, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1410, release: 267 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { decay: 4.64 } },
    ],
  },
  {
    id: 'patch-cables-sapling-cave',
    name: 'Sapling cave',
    category: 'space',
    description:
      'A cave whose echoes jump now and then by a fifth or octave, then a phaser held still, two fixed peaks like a vowel.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Intervals', params: { length: 0.634, glide: 0.0445 } },
      { deviceId: 'phaser', preset: 'Still formant', params: { rate: 0.295 } },
    ],
  },
  {
    id: 'patch-cables-halo-with-the-bees',
    name: 'Halo with the bees',
    category: 'space',
    description:
      'A late reverb that climbs by octaves and fifths, into a hard-driven two-spring tank that answers late and loud.',
    effects: [
      { deviceId: 'shimmer', preset: 'Late answer', params: { decay: 8.92, predelay: 393 } },
      {
        deviceId: 'spring-reverb',
        preset: 'Dub send',
        params: { decay: 3.32, predelay: 62.8, mix: 0.3 },
      },
    ],
  },
  {
    id: 'patch-cables-clover-halo',
    name: 'Clover halo',
    category: 'space',
    description:
      'A low cut that thins the bass, with a little air on top, into a reverb whose tail climbs an octave on every pass.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.38 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { decay: 8.33, predelay: 20.3 } },
    ],
  },
  {
    id: 'patch-cables-room-in-dew',
    name: 'Room in dew',
    category: 'space',
    description:
      'Soft clipping, a little bright, laid under the clean sound, into a small room that sparkles two octaves above the sound.',
    effects: [
      { deviceId: 'saturator', preset: 'Drum bus crunch' },
      { deviceId: 'shimmer', preset: 'Sparkle room', params: { decay: 1.25, predelay: 21.6 } },
    ],
  },
  {
    id: 'patch-cables-salal-gate',
    name: 'Salal gate',
    category: 'space',
    description:
      'Two unison doubles snapped to pitch, hard left and right, into a late wall of reverb that holds and stops dead.',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Tuned double',
        params: { v1Delay: 16.1, v2Delay: 31.6, output: 4.68 },
      },
      { deviceId: 'shaped-reverb', preset: 'Late wall', params: { time: 1.55 } },
    ],
  },
  {
    id: 'patch-cables-inlet-hall',
    name: 'Inlet hall',
    category: 'space',
    description:
      'A wavering double spread wide to both sides, into a hall heard from far off with little dry sound left.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Doubler', params: { time: 37.9, modRate: 2.32 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 20.6, lowDecay: 4.84, midDecay: 4.69 },
      },
    ],
  },
  {
    id: 'patch-cables-greenhouse-tank',
    name: 'Greenhouse tank',
    category: 'space',
    description:
      'A soft slap close behind each note, into two taut springs that ring long and clean with no drip.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 91.5 } },
      { deviceId: 'spring-reverb', preset: 'Tight long tank' },
    ],
  },
  {
    id: 'patch-cables-hemlock-echo',
    name: 'Hemlock echo',
    category: 'space',
    description:
      'Only the two detuned copies, hard left and right, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only', params: { delay: 17.4 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 164 } },
    ],
  },
  {
    id: 'patch-cables-foxglove-bloom',
    name: 'Foxglove bloom',
    category: 'space',
    description:
      'A fine patter of thin high echoes with no bass in them, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Glass rain', params: { length: 0.152, glide: 0.634 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 13.7, modRate: 0.328 } },
    ],
  },
  {
    id: 'patch-cables-trillium-ladder',
    name: 'Trillium ladder',
    category: 'echo',
    description:
      'Each note replayed as an arpeggio of octaves and fifths, into a quick bright twang of springs behind each attack.',
    effects: [
      { deviceId: 'cascade', preset: 'Rising steps', params: { time: 243 } },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { decay: 0.79 } },
    ],
  },
  {
    id: 'patch-cables-arpeggio-in-a-hurry',
    name: 'Arpeggio in a hurry',
    category: 'echo',
    description:
      'Each note replayed as an arpeggio of octaves and fifths, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 'cascade', preset: 'Rising steps', params: { time: 274 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
  },
  {
    id: 'patch-cables-patched-hop',
    name: 'Patched hop',
    category: 'echo',
    description:
      'An echo whose repeats jump up an octave and back, into a bright spring splash that lands a moment after the note.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 440, modRate: 0.671 } },
      { deviceId: 'spring-reverb', preset: 'Late splash', params: { decay: 1.34 } },
    ],
  },
  {
    id: 'patch-cables-madrona-descent',
    name: 'Madrona descent',
    category: 'echo',
    description:
      'Echoes falling an octave on one side, a fourth on the other, into a quick patter of separate echoes behind each note.',
    effects: [
      { deviceId: 'lattice', preset: 'Sinking cascade', params: { v1Delay: 423, v2Delay: 281 } },
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { length: 0.368, glide: 0.532 } },
    ],
  },
  {
    id: 'patch-cables-sapwood-echo',
    name: 'Sapwood echo',
    category: 'echo',
    description:
      'Grain repeats that climb an octave on every pass, into a small plate that is gone in a second or two.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'patch-cables-plugged-in-memory',
    name: 'Plugged-in memory',
    category: 'echo',
    description:
      'Short moments of the last few seconds, replayed as they were, into a brief swell of reverb close behind each note.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Just now' },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { time: 0.335 } },
    ],
  },
  {
    id: 'patch-cables-trellis-echo',
    name: 'Trellis echo',
    category: 'echo',
    description:
      'An echo of single grains with gaps, so the repeats pulse, then an echo whose repeats jump up an octave and back.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Pulsing repeat' },
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 421, modRate: 0.637 } },
    ],
  },
  {
    id: 'patch-cables-swells-by-the-pond',
    name: 'Swells by the pond',
    category: 'echo',
    description:
      'A hard-clipped copy held at one level under the clean sound, then backwards swells that climb an octave on every pass.',
    effects: [
      { deviceId: 'saturator', preset: 'Sustain bed' },
      { deviceId: 'reverse-delay', preset: 'Rising glass' },
    ],
  },
  {
    id: 'patch-cables-cabled-lurch',
    name: 'Cabled lurch',
    category: 'echo',
    description:
      "A hint of a wavefolder's glassy edge under the clean sound, then a lurching echo, into an undamped hall with about three seconds of tail.",
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass' },
      { deviceId: 'analog-delay', preset: 'Slow lurch', params: { time: 357, modRate: 0.541 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air' },
    ],
  },
  {
    id: 'patch-cables-barnacle-chime',
    name: 'Barnacle chime',
    category: 'echo',
    description:
      'Inharmonic chimes far above the notes, echoing higher still, into a muffled reverb whose octave climb is soon damped away.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'High chime' },
      { deviceId: 'shimmer', preset: 'Muffled choir' },
    ],
  },
  {
    id: 'patch-cables-tree-frog-echo',
    name: 'Tree-frog echo',
    category: 'echo',
    description:
      'A thick three-voice ensemble chorus that turns slowly, then a bucket-brigade echo whose soft repeats dull as they fade.',
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.516, delayMs: 19.7 } },
      { deviceId: 'analog-delay', preset: 'Dark echo' },
    ],
  },
  {
    id: 'patch-cables-frog-pond-echo',
    name: 'Frog-pond echo',
    category: 'echo',
    description:
      'Whole phrases coming back three times, each one duller, into a small plain room that is over in about a second.',
    effects: [
      { deviceId: 'cascade', preset: 'Phrase returns', params: { time: 1540 } },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'patch-cables-dappled-echoes',
    name: 'Dappled echoes',
    category: 'echo',
    description:
      'Echoes that climb an octave on every repeat, then a low cut and a small dip in the low mids, to make room.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Rising steps' },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'patch-cables-cabled-sparkle',
    name: 'Cabled sparkle',
    category: 'echo',
    description:
      'A short loop at double speed, an octave up and soon gone, then backwards chunks spliced hard, with no fades between them.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Octave up', params: { length: 1.15 } },
      { deviceId: 'reverse-delay', preset: 'Hard splices' },
    ],
  },
  {
    id: 'patch-cables-rowboat-echo',
    name: 'Rowboat echo',
    category: 'echo',
    description:
      'A swell that stays low and arrives late, like a rocked pedal, then a bucket-brigade echo whose soft repeats dull as they fade.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 225, release: 141 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 403, modRate: 0.614 } },
    ],
  },
  {
    id: 'patch-cables-cascade-on-the-ferry',
    name: 'Cascade on the ferry',
    category: 'echo',
    description:
      'Echoes that jump an octave on every repeat, left and right, into a hint of a two-spring tank behind the sound.',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Crystal cascade',
        params: { v1Delay: 296, v2Delay: 472, v3Delay: 172, output: 3.83 },
      },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'patch-cables-hand-wired-echo',
    name: 'Hand-wired echo',
    category: 'echo',
    description:
      'A rotating speaker at a standstill, heard close and in mono, then a clean, steady echo with no wobble and an open top.',
    effects: [
      { deviceId: 'rotary', preset: 'Stopped horn' },
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 195, modRate: 0.577, mix: 0.21 },
      },
    ],
  },
  {
    id: 'patch-cables-voltage-crystals',
    name: 'Voltage crystals',
    category: 'echo',
    description:
      'Grain repeats that climb an octave on every pass, then a detuned double made of grains, spread to the sides.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals' },
      { deviceId: 'grain-cloud', preset: 'Detuned double' },
    ],
  },
  {
    id: 'patch-cables-loop-in-leaf',
    name: 'Loop in leaf',
    category: 'echo',
    description:
      'A short loop run backwards at double speed, an octave up, into a plain hall of about four seconds with no vowel in it.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Fast reverse', params: { length: 0.639 } },
      { deviceId: 'vowel-reverb', preset: 'Plain hall' },
    ],
  },
  {
    id: 'patch-cables-canopy-hop',
    name: 'Canopy hop',
    category: 'echo',
    description:
      'An echo whose repeats hop up a fifth and down a fourth, into a two-spring tank with its input driven into saturation.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop' },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank', params: { mix: 0.265 } },
    ],
  },
  {
    id: 'patch-cables-lupine-console',
    name: 'Lupine console',
    category: 'tape',
    description:
      'A console channel driven until it is firm in the mids, then a resonant peak up high, into a late bright spring splash.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { output: -6.47 } },
      { deviceId: 'auto-filter', preset: 'Resonant peak' },
      { deviceId: 'spring-reverb', preset: 'Late splash', params: { decay: 1.28 } },
    ],
  },
  {
    id: 'patch-cables-wren-pentode',
    name: 'Wren pentode',
    category: 'tape',
    description:
      'A biting pentode stage, then a resonant upper-mid peak that rises when played hard, into a quick bright twang of springs behind each attack.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { output: -6.26 } },
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { lfoRateHz: 1.1, envAttackMs: 18.5, envReleaseMs: 297 },
      },
      { deviceId: 'spring-reverb', preset: 'Quick twang' },
    ],
  },
  {
    id: 'patch-cables-rain-barrel-fold',
    name: 'Rain-barrel fold',
    category: 'tape',
    description:
      'A bright wavefolder, then a narrow band-pass that jumps about eight times a second, into a bright wide room that rings for a second or two.',
    effects: [
      { deviceId: 'saturator', preset: 'Wavefold lead', params: { outputDb: -7.11 } },
      {
        deviceId: 'auto-filter',
        preset: 'Stepped',
        params: { lfoRateHz: 7.39, envAttackMs: 10.4, envReleaseMs: 210 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'patch-cables-seed-tray-overtone',
    name: 'Seed-tray overtone',
    category: 'tape',
    description:
      'An octave-adding soft curve, then a fast chopping low-pass, into a hint of a two-spring tank behind the sound.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'auto-filter', preset: 'Tremolo filter' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'patch-cables-pebble-crunch',
    name: 'Pebble crunch',
    category: 'tape',
    description:
      'Soft clipping, mixed low, then a resonant upper-mid peak that rises when played hard, into a trace of room around the sound.',
    effects: [
      { deviceId: 'saturator', preset: 'Drum bus crunch', params: { outputDb: -9.55 } },
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { lfoRateHz: 1.01, envAttackMs: 20.3, envReleaseMs: 288 },
      },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'patch-cables-rockpool-glass',
    name: 'Rockpool glass',
    category: 'tape',
    description:
      'Old converters with no output filter, a glassy ring on top, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glassy' },
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { preDelay: 31.1, lowDecay: 1.49, midDecay: 1.15 },
      },
    ],
  },
  {
    id: 'patch-cables-darting-phaser',
    name: 'Darting phaser',
    category: 'motion',
    description:
      'A phaser jumping to a new place about three times a second, then an echo whose repeats jump up an octave and back.',
    effects: [
      { deviceId: 'phaser', preset: 'Random steps', params: { rate: 3.32 } },
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 373, modRate: 0.587 } },
    ],
  },
  {
    id: 'patch-cables-ramp-patched-in',
    name: 'Ramp patched in',
    category: 'motion',
    description:
      'A shallow flanger that ramps and snaps back in a steady beat, then an echo whose repeats jump up an octave and back.',
    effects: [
      { deviceId: 'flanger', preset: 'Tremolo saw' },
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 421, modRate: 0.567 } },
    ],
  },
  {
    id: 'patch-cables-kelp-gate',
    name: 'Kelp gate',
    category: 'motion',
    description:
      'A square tremolo that switches the sound hard on and off, then an echo with a fast flutter in the pitch of its repeats.',
    effects: [
      { deviceId: 'tremolo', preset: 'On and off' },
      { deviceId: 'analog-delay', preset: 'Fluttering' },
    ],
  },
  {
    id: 'patch-cables-tendril-pan',
    name: 'Tendril pan',
    category: 'motion',
    description:
      'A hard pan that jumps from one side to the other, then an echo that now and then lurches down a fifth and back.',
    effects: [
      { deviceId: 'tremolo', preset: 'Side to side', params: { rate: 2.33 } },
      { deviceId: 'analog-delay', preset: 'Slow lurch', params: { time: 346, modRate: 0.56 } },
    ],
  },
  {
    id: 'patch-cables-saltwater-flanger',
    name: 'Saltwater flanger',
    category: 'motion',
    description:
      'A flanger jumping to a new place about four times a second, then a plain echo that is a little darker on each repeat.',
    effects: [
      { deviceId: 'flanger', preset: 'Stepped random', params: { rate: 3.67, delayMs: 4.41 } },
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 409, reach: 21.9, size: 2.78 },
      },
    ],
  },
  {
    id: 'patch-cables-ferry-wobble',
    name: 'Ferry wobble',
    category: 'motion',
    description:
      'Clean converters fed hot, so the loudest peaks flatten, then a short echo whose pitch sways like a seasick vibrato.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Flat tops' },
      { deviceId: 'analog-delay', preset: 'Seasick' },
    ],
  },
  {
    id: 'patch-cables-sprouting-flanger',
    name: 'Sprouting flanger',
    category: 'motion',
    description:
      'A gentle flanger sweep about four seconds round, then slurred whole-tone harmonies trailing off in echoes, into a long backwards rise.',
    effects: [
      { deviceId: 'flanger', preset: 'Gentle sweep', params: { rate: 0.244, delayMs: 2.29 } },
      {
        deviceId: 'lattice',
        preset: 'Whole tone haze',
        params: { v1Delay: 290, v2Delay: 435, v3Delay: 203, output: 9.31 },
      },
      { deviceId: 'shaped-reverb', preset: 'Long rise' },
    ],
  },
  {
    id: 'patch-cables-sapwood-phaser',
    name: 'Sapwood phaser',
    category: 'motion',
    description:
      'A deep eight-stage phaser with sharp peaks between notches, into a single fixed voice in the middle that is barely there.',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.194 } },
      { deviceId: 'vowel-reverb', preset: 'Lone voice', params: { decay: 2.65, preDelay: 22.1 } },
    ],
  },
  {
    id: 'patch-cables-flutter-by-the-cove',
    name: 'Flutter by the cove',
    category: 'motion',
    description:
      'A quick flutter of three voices over the dry sound, then a combo amplifier shut in a cupboard, the mic pulled back.',
    effects: [
      { deviceId: 'chorus', preset: 'Fast flutter' },
      { deviceId: 're-amp', preset: 'In the cupboard', params: { output: 0.979 } },
    ],
  },
  {
    id: 'patch-cables-phaser-on-the-island',
    name: 'Phaser on the island',
    category: 'motion',
    description:
      'A quick shallow phaser throb, the same on both sides, then echoes that climb an octave on every repeat.',
    effects: [
      { deviceId: 'phaser', preset: 'Fast throb' },
      { deviceId: 'pitch-shifter', preset: 'Rising steps', params: { size: 64.9, delay: 327 } },
    ],
  },
  {
    id: 'patch-cables-shingle-chopper',
    name: 'Shingle chopper',
    category: 'motion',
    description:
      'A hard chop to silence about seven times a second, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'tremolo', preset: 'Chopper' },
      { deviceId: 'expanse', preset: 'Faint air', params: { decay: 2.67, modRate: 0.398 } },
    ],
  },
  {
    id: 'patch-cables-salal-phaser',
    name: 'Salal phaser',
    category: 'motion',
    description:
      'A six-stage phaser turning about every three seconds, then a subsonic cut and a slow ear that eases whatever rings on.',
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { rate: 0.301 } },
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 2.92 } },
    ],
  },
  {
    id: 'patch-cables-pollen-rotary',
    name: 'Pollen rotary',
    category: 'motion',
    description:
      'A fast rotating speaker with the horn to the fore, then grain repeats that climb by fifths on every pass.',
    effects: [
      { deviceId: 'rotary', preset: 'Bright horn' },
      { deviceId: 'grain-delay', preset: 'Rising fifths', params: { time: 690, size: 175 } },
    ],
  },
  {
    id: 'patch-cables-heron-pan',
    name: 'Heron pan',
    category: 'motion',
    description:
      'A pan that wanders to a new place every second or so, into a far-miked room laid in under the clean sound.',
    effects: [
      { deviceId: 'tremolo', preset: 'Wandering pan', params: { rate: 0.707 } },
      { deviceId: 're-amp', preset: 'Room underneath' },
    ],
  },
  {
    id: 'patch-cables-hand-wired-flanger',
    name: 'Hand-wired flanger',
    category: 'motion',
    description:
      'A flanger jumping to a new place about four times a second, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'flanger', preset: 'Stepped random' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.381, breathRate: 0.296 },
      },
    ],
  },
  {
    id: 'patch-cables-dragonfly-filter',
    name: 'Dragonfly filter',
    category: 'motion',
    description:
      'A few decibels of soft saturation with the top eased, then a touch wah, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: 3.21 } },
      {
        deviceId: 'auto-filter',
        preset: 'Touch wah',
        params: { lfoRateHz: 0.876, envAttackMs: 4.34, envReleaseMs: 128 },
      },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 5.15 } },
    ],
  },
  {
    id: 'patch-cables-kingfisher-drift',
    name: 'Kingfisher drift',
    category: 'motion',
    description:
      'A slow phasing drift from partials moved less than a hertz, then a big lift of presence and air, with ringing held in check.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift' },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.547 } },
    ],
  },
  {
    id: 'patch-cables-fall-on-the-ferry',
    name: 'Fall on the ferry',
    category: 'motion',
    description:
      'A resonant high-pass falling for about two seconds at a time, then a hollow phaser with peaks where its notches would be.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Falling high-pass',
        params: { lfoRateHz: 0.485, envAttackMs: 10.2, envReleaseMs: 210 },
      },
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.227 } },
    ],
  },
  {
    id: 'patch-cables-salmonberry-rain',
    name: 'Salmonberry rain',
    category: 'texture',
    description:
      'A glittering octave stutter, then a second take either side, a little late and out of tune, into two splashing springs.',
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain', params: { time: 139 } },
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { delay: 30.4 } },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { decay: 2.19 } },
    ],
  },
  {
    id: 'patch-cables-dew-sparkle',
    name: 'Dew sparkle',
    category: 'texture',
    description:
      'A soft wash of octave and fifth loops over each note, then only the two detuned copies, hard left and right, into a small dead booth.',
    effects: [
      { deviceId: 'cascade', preset: 'Sparkle bed', params: { time: 354 } },
      { deviceId: 'stereo-detune', preset: 'Wet only' },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'patch-cables-eelgrass-octaves',
    name: 'Eelgrass octaves',
    category: 'texture',
    description:
      'Little loops of each note stacked one and two octaves up, then two copies a slap behind, the left one first, into a bright chamber.',
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack' },
      { deviceId: 'stereo-detune', preset: 'Late copy' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { predelayMs: 5.23 } },
    ],
  },
  {
    id: 'patch-cables-pebble-strum',
    name: 'Pebble strum',
    category: 'texture',
    description:
      'The start of each note struck again in a bouncing run, then two detuned centre copies, into a backwards reverb.',
    effects: [
      { deviceId: 'cascade', preset: 'Restruck' },
      { deviceId: 'stereo-detune', preset: 'Thickener' },
      { deviceId: 'shaped-reverb', preset: 'Reverse' },
    ],
  },
  {
    id: 'patch-cables-otter-sparks',
    name: 'Otter sparks',
    category: 'texture',
    description:
      'Faint high grains, then two copies fed back into a small blur round the upper notes, into a plain short room whose tail stays at pitch.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints', params: { time: 408, size: 110 } },
      { deviceId: 'stereo-detune', preset: 'Cloud', params: { delay: 23.3 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { decay: 2.74 } },
    ],
  },
  {
    id: 'patch-cables-huckleberry-shards',
    name: 'Huckleberry shards',
    category: 'texture',
    description:
      'A half-deep swell that leaves a ghost of each attack, then rough splinters one and two octaves up, in quick echoes, into an undamped hall.',
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick', params: { attack: 516, release: 136 } },
      {
        deviceId: 'lattice',
        preset: 'Rough high splinters',
        params: { v1Delay: 94.2, v2Delay: 146, v3Delay: 50.1, output: 7.25 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 36.7, lowDecay: 2.13, midDecay: 3.37 },
      },
    ],
  },
  {
    id: 'patch-cables-lupine-grains',
    name: 'Lupine grains',
    category: 'texture',
    description:
      'Faint reversed grains that climb quickly towards the octave, then an echo with a fast flutter in the pitch of its repeats.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Shimmer', params: { decay: 2.95 } },
      { deviceId: 'analog-delay', preset: 'Fluttering', params: { time: 248, modRate: 6.2 } },
    ],
  },
  {
    id: 'patch-cables-grains-in-the-crown',
    name: 'Grains in the crown',
    category: 'texture',
    description:
      'A scattered cloud of long grains, some an octave up, then a low cut with the low mids dipped and the presence lifted.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Slow cloud', params: { size: 254, delay: 116 } },
      { deviceId: 'ambient-eq', preset: 'Voice', params: { clearTime: 1.48 } },
    ],
  },
  {
    id: 'patch-cables-dockside-swell',
    name: 'Dockside swell',
    category: 'texture',
    description:
      'A swell that takes seconds to rise after each silence, then a hard pan that jumps from one side to the other.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2920, release: 675 } },
      { deviceId: 'tremolo', preset: 'Side to side', params: { rate: 2.51 } },
    ],
  },
  {
    id: 'patch-cables-starfish-glitter',
    name: 'Starfish glitter',
    category: 'texture',
    description:
      'Bright tape-style saturation mixed in under the clean sound, then sparse short grains two octaves up, after each note.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine' },
      { deviceId: 'grain-delay', preset: 'High glitter', params: { time: 333, size: 46.7 } },
    ],
  },
  {
    id: 'patch-cables-cloud-in-the-garden',
    name: 'Cloud in the garden',
    category: 'texture',
    description:
      'A bright, lean console channel driven for an edge on top, then a scattered cloud of short grains behind the playing.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Sheen', params: { output: -2.09 } },
      { deviceId: 'grain-delay', preset: 'Grain cloud' },
    ],
  },
  {
    id: 'patch-cables-felt-under-cedar',
    name: 'Felt under cedar',
    category: 'texture',
    description:
      'The sound with its attacks blurred soft and nothing added, into a quick bright twang of springs behind each attack.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Softened attacks' },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { decay: 0.855, mix: 0.18 } },
    ],
  },
  {
    id: 'patch-cables-drone-in-the-kelp',
    name: 'Drone in the kelp',
    category: 'texture',
    description:
      'A drone looped from each note with the fifth above it, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'cascade', preset: 'Drone of fifths' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'patch-cables-otter-cascade',
    name: 'Otter cascade',
    category: 'texture',
    description:
      'A wavefolder that wraps the peaks over into bright overtones, then loops of each note played backwards at stacked octaves.',
    effects: [
      { deviceId: 'saturator', preset: 'Wavefold lead', params: { outputDb: -12.4 } },
      { deviceId: 'cascade', preset: 'Backwards stack' },
    ],
  },
  {
    id: 'patch-cables-burl-afterglow',
    name: 'Burl afterglow',
    category: 'texture',
    description:
      'A short glow of held tone that dies just after each note, into a hall whose tail sings a soft ah.',
    effects: [
      { deviceId: 'sustainer', preset: 'Brief afterglow', params: { mix: 0.3 } },
      {
        deviceId: 'vowel-reverb',
        preset: 'Choir of ah',
        params: { decay: 5.95, preDelay: 22.3, mix: 0.24 },
      },
    ],
  },
  {
    id: 'patch-cables-dockside-octaves',
    name: 'Dockside octaves',
    category: 'pitch',
    description:
      'An octave above and an octave below a single line, then a slow ensemble chorus, into three taut springs kept soft and close to the centre.',
    effects: [
      { deviceId: 'lattice', preset: 'Octaves', params: { output: 7.45 } },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.516, delayMs: 16.3 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'patch-cables-mirror-from-seed',
    name: 'Mirror from seed',
    category: 'pitch',
    description:
      'A mirror and a third above, then a light widening chorus, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 'lattice', preset: 'Thesis voicing', params: { output: 6.25 } },
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
  },
  {
    id: 'patch-cables-mirror-in-shallows',
    name: 'Mirror in shallows',
    category: 'pitch',
    description:
      'A mirror and a third above, then a chorus above the lows, into a two-spring tank with its input driven into saturation.',
    effects: [
      { deviceId: 'lattice', preset: 'Thesis voicing', params: { output: 5.94 } },
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { rate: 1.34, delayMs: 12.3 } },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank' },
    ],
  },
  {
    id: 'patch-cables-fifths-in-a-hothouse',
    name: 'Fifths in a hothouse',
    category: 'pitch',
    description:
      'Stacked fifths above, then a deep slow chorus, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'lattice', preset: 'Fifths up', params: { v2Delay: 23.9, output: 7.82 } },
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.167 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'patch-cables-mirror-in-the-ferns',
    name: 'Mirror in the ferns',
    category: 'pitch',
    description:
      'A mirror and a third above, then a light widening chorus, into a tight damped little room that is barely there.',
    effects: [
      { deviceId: 'lattice', preset: 'Thesis voicing', params: { output: 8.66 } },
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.334, delayMs: 8.69 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'patch-cables-triad-patched-in',
    name: 'Triad patched in',
    category: 'pitch',
    description:
      'A pure-tuned triad, then two duller copies a few cents off, tucked behind the sound, into a short room fed in pulses about twice a second.',
    effects: [
      { deviceId: 'lattice', preset: 'Just intonation triad', params: { output: 6.99 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'fdn-reverb', preset: 'Pulsing gate', params: { decay: 1.45, breathRate: 1.84 } },
    ],
  },
  {
    id: 'patch-cables-treetop-splinters',
    name: 'Treetop splinters',
    category: 'pitch',
    description:
      'Rough splinters one and two octaves up, in quick echoes, into a two-spring tank with its input driven into saturation.',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Rough high splinters',
        params: { v1Delay: 97.5, v2Delay: 134, v3Delay: 45.1 },
      },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank' },
    ],
  },
  {
    id: 'patch-cables-pollen-metal',
    name: 'Pollen metal',
    category: 'pitch',
    description:
      'A buzzing metallic fifth above from very short grains, then echoes that sink in pitch, into a mid-sized hall.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Metal grains' },
      { deviceId: 'lattice', preset: 'Sinking cascade', params: { v1Delay: 338, v2Delay: 268 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 58.1, lowDecay: 3.28, midDecay: 2.76 },
      },
    ],
  },
  {
    id: 'patch-cables-garden-pedal',
    name: 'Garden pedal',
    category: 'pitch',
    description:
      'A fixed drone on C and G, then a short echo whose pitch sways like a seasick vibrato, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'lattice', preset: 'Two note drone', params: { output: 6.05 } },
      { deviceId: 'analog-delay', preset: 'Seasick' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 4.32, breathRate: 0.276 } },
    ],
  },
  {
    id: 'patch-cables-morning-fifths',
    name: 'Morning fifths',
    category: 'pitch',
    description:
      'A wide, slightly detuned fifth above held chords, then two full-range copies tuned further apart, reaching lower.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth' },
      { deviceId: 'stereo-detune', preset: 'Wider', params: { delay: 19.4 } },
    ],
  },
  {
    id: 'patch-cables-pipes-in-new-leaf',
    name: 'Pipes in new leaf',
    category: 'pitch',
    description:
      'Four octaves of pipes that swell in behind each note, then a tape echo whose warm repeats soften as they fade.',
    effects: [
      { deviceId: 'octaves', preset: 'Cathedral' },
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 400, mix: 0.21 } },
    ],
  },
  {
    id: 'patch-cables-harmony-from-seed',
    name: 'Harmony from seed',
    category: 'pitch',
    description:
      'A third above and a sixth below a single line, in C major, then a band-pass wah over the dry sound, opening with each note.',
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds', params: { output: 10.1 } },
      { deviceId: 'auto-filter', preset: 'Touch wah' },
    ],
  },
  {
    id: 'patch-cables-air-on-the-sill',
    name: 'Air on the sill',
    category: 'pitch',
    description:
      'A faint octave above, a little air over the dry sound, then a single saturated tape slap behind each note.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Faint air', params: { size: 54.1 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 81.1 } },
    ],
  },
  {
    id: 'patch-cables-fifth-under-cedar',
    name: 'Fifth under cedar',
    category: 'pitch',
    description:
      'A single voice a fifth above the dry sound, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Fifth above' },
      { deviceId: 'spring-reverb', preset: 'Long three spring' },
    ],
  },
  {
    id: 'patch-cables-kingfisher-mirror',
    name: 'Kingfisher mirror',
    category: 'pitch',
    description:
      'A line mirrored around a centre note, with a third above it, into three slack springs where every echo is a long chirp.',
    effects: [
      { deviceId: 'lattice', preset: 'Thesis voicing' },
      {
        deviceId: 'spring-reverb',
        preset: 'Slack and strange',
        params: { decay: 3.57, predelay: 31.3 },
      },
    ],
  },
  {
    id: 'patch-cables-porch-glass',
    name: 'Porch glass',
    category: 'pitch',
    description:
      'A fast glittering stutter of plucked octaves over each note, then scattered sparks two octaves up, echoing higher still.',
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain' },
      { deviceId: 'pitch-shifter', preset: 'High sparks' },
    ],
  },
  {
    id: 'patch-cables-greenhouse-chord',
    name: 'Greenhouse chord',
    category: 'pitch',
    description:
      'A stacked seventh chord, then a clean steady echo, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'lattice', preset: 'Seventh chord stack', params: { output: 7.52 } },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 217, modRate: 0.666 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { breathRate: 0.0524 } },
    ],
  },
  {
    id: 'patch-cables-cove-organ',
    name: 'Cove organ',
    category: 'pitch',
    description:
      'Octaves below and above through a nasal, peaked filter, then a handful of separate echoes that fall away and repeat.',
    effects: [
      { deviceId: 'octaves', preset: 'Nasal reed' },
      { deviceId: 'shaped-reverb', preset: 'Scattered', params: { time: 2.34 } },
    ],
  },
  {
    id: 'patch-cables-voltage-bloom',
    name: 'Voltage bloom',
    category: 'pitch',
    description:
      'A slow compressor that evens out swells over seconds, then four octaves that bloom about two seconds behind each note.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'octaves', preset: 'Late bloom', params: { attack: 1.95 } },
    ],
  },
  {
    id: 'patch-cables-seedling-harp',
    name: 'Seedling harp',
    category: 'pitch',
    description:
      'Each note answered by a rising pentatonic run of echoes, then a plain two-voice chorus with a voice towards each side.',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Pentatonic harp',
        params: { v1Delay: 141, v2Delay: 306, v3Delay: 423, v4Delay: 445, output: 7.35 },
      },
      { deviceId: 'chorus', preset: 'Classic chorus' },
    ],
  },
  {
    id: 'patch-cables-glints-in-clover',
    name: 'Glints in clover',
    category: 'pitch',
    description:
      'Faint grains an octave and a fifth up, behind the playing, then a flanger that takes about twelve seconds over each sweep.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints' },
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.0847, delayMs: 4.12 } },
    ],
  },
  {
    id: 'patch-cables-stack-in-green',
    name: 'Stack in green',
    category: 'pitch',
    description:
      'A lopsided soft curve that adds the octave above each note, then little loops of each note stacked one and two octaves up.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'cascade', preset: 'Octave stack', params: { time: 436 } },
    ],
  },
  {
    id: 'patch-cables-deck-on-the-porch',
    name: 'Deck on the porch',
    category: 'master',
    description:
      'A fast, steady reel pushed into soft saturation, then a scooped, hollow tone, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.64 } },
    ],
  },
  {
    id: 'patch-cables-fold-in-full-sun',
    name: 'Fold in full sun',
    category: 'master',
    description:
      'A hint of wavefolder, then a fast compressor that takes the spike off plucked notes, then a low, slow ceiling.',
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass' },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { release: 0.151 } },
      { deviceId: 'ambient-limiter', preset: 'Late night' },
    ],
  },
  {
    id: 'patch-cables-canopy-room',
    name: 'Canopy room',
    category: 'master',
    description:
      'The close reflections of a very small room, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.396, breathRate: 0.318 },
      },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'patch-cables-woodshed-sheen',
    name: 'Woodshed sheen',
    category: 'master',
    description:
      'A quiet plate tail that comes in late behind each note, then a low ceiling that lets go quickly, so loud passages breathe.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 92.9 } },
      { deviceId: 'ambient-limiter', preset: 'Breathing', params: { release: 0.285, gain: 0.615 } },
    ],
  },
  {
    id: 'patch-cables-island-room',
    name: 'Island room',
    category: 'master',
    description:
      'A small room that is over in about a second, then a safety limiter with its ceiling brought down a little.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { preDelay: 26.3, lowDecay: 1.54, midDecay: 1.33 },
      },
      { deviceId: 'fet-limiter', preset: 'Lower ceiling', params: { outputGain: -0.295 } },
    ],
  },
  {
    id: 'patch-cables-pollen-glue',
    name: 'Pollen glue',
    category: 'master',
    description:
      'A mid-forward tone with the lows and the top trimmed, then a gentle compressor, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.54 } },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
]
