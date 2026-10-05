// Island Patch Cables: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'patch-cables-sparkle-in-the-crown',
    name: 'Sparkle in the crown',
    category: 'space',
    description:
      'A hot console channel, forward in the upper mids, into a small room that sparkles two octaves above the sound.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel', params: { output: -19.5 } },
      { deviceId: 'shimmer', preset: 'Sparkle room', params: { decay: 1.23 } },
    ],
  },
  {
    id: 'patch-cables-springs-on-wet-cedar',
    name: 'Springs on wet cedar',
    category: 'space',
    description:
      'A slow swell after each silence that leaves some attack in, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1410, release: 267 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { decay: 4.64 } },
    ],
  },
  {
    id: 'patch-cables-halo-with-the-bees',
    name: 'Halo with the bees',
    category: 'space',
    description:
      'A reverb that comes in late and climbs by octaves and fifths, into a hard-driven two-spring tank that answers a moment late.',
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
    id: 'patch-cables-inlet-hall',
    name: 'Inlet hall',
    category: 'space',
    description:
      'A wavering double of the sound spread wide to both sides, into a damped hall of about five seconds, heard from far off.',
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
    id: 'patch-cables-hemlock-echo',
    name: 'Hemlock echo',
    category: 'space',
    description:
      'A sharp copy hard left, a flat one hard right, heard alone, then a short, soft tape echo close behind the playing.',
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
    id: 'patch-cables-seed-tray-room',
    name: 'Seed-tray room',
    category: 'space',
    description:
      'Two copies a few cents sharp and flat, left and right, into a late wall of reverb that holds, then fades away.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Doubler', params: { size: 58.9, delay: 14.4 } },
      { deviceId: 'shaped-reverb', preset: 'Late wall', params: { time: 1.69 } },
    ],
  },
  {
    id: 'patch-cables-patched-ring',
    name: 'Patched ring',
    category: 'space',
    description:
      'A phaser with no dry sound, pulling the two sides apart, into a short pipe that rings like metal on every attack.',
    effects: [
      { deviceId: 'phaser', preset: 'Stereo scatter', params: { rate: 0.219 } },
      { deviceId: 'swarm-reverb', preset: 'Metal pipe' },
    ],
  },
  {
    id: 'patch-cables-ferry-room',
    name: 'Ferry room',
    category: 'space',
    description:
      'A string voice that doubles each note almost at once, into a bright wide room that rings for a second or two.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Doubler', params: { rise: 0.047, fall: 0.707 } },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'patch-cables-trillium-hall',
    name: 'Trillium hall',
    category: 'space',
    description:
      'A scooped tone with lows and highs up and the body down, into a plain hall that rings for about three seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.58 } },
      { deviceId: 'shimmer', preset: 'Plain hall' },
    ],
  },
  {
    id: 'patch-cables-shingle-hall',
    name: 'Shingle hall',
    category: 'space',
    description:
      'A thin band of tone with the lows cut and the top rolled off, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { preDelay: 56.1, midDecay: 2.28 } },
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
      'Short moments of the last few seconds replayed as they were, into a brief swell of reverb close behind each note.',
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
      'An echo whose repeats come in quick, separate pulses, then an echo whose repeats jump up an octave and back.',
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
      'A thick ensemble chorus turning about every two seconds, then a bucket-brigade echo whose soft repeats dull as they fade.',
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
    id: 'patch-cables-cabled-sparkle',
    name: 'Cabled sparkle',
    category: 'echo',
    description:
      'A short double-speed loop an octave up that soon dies away, then backwards chunks spliced hard with no fades between them.',
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
      'A late swell on every note like a rocked volume pedal, then a bucket-brigade echo whose soft repeats dull as they fade.',
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
      'A rotating speaker at a standstill, heard close and in mono, then a clean, steady echo with no wobble and little dulling.',
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
    id: 'patch-cables-loop-in-leaf',
    name: 'Loop in leaf',
    category: 'echo',
    description:
      'A short loop run backwards at double speed and an octave up, into a plain hall of about four seconds.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Fast reverse', params: { length: 0.639 } },
      { deviceId: 'vowel-reverb', preset: 'Plain hall' },
    ],
  },
  {
    id: 'patch-cables-lupine-cascade',
    name: 'Lupine cascade',
    category: 'echo',
    description:
      'Echoes falling an octave on one side, a fourth on the other, into a tight cluster of echoes close behind each note.',
    effects: [
      { deviceId: 'lattice', preset: 'Sinking cascade', params: { v1Delay: 357, v2Delay: 244 } },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm' },
    ],
  },
  {
    id: 'patch-cables-echo-on-the-sill',
    name: 'Echo on the sill',
    category: 'echo',
    description:
      'An echo whose repeats hop up a fifth and down a fourth, into a tight, damped little room close around the sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 290, modRate: 0.587 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'patch-cables-dappled-echoes',
    name: 'Dappled echoes',
    category: 'echo',
    description:
      'Echoes that climb an octave on every repeat, into a thin veil of reverb kept low under the sound.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Rising steps' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { decay: 2.75, breathRate: 0.325 } },
    ],
  },
  {
    id: 'patch-cables-canopy-fifths',
    name: 'Canopy fifths',
    category: 'echo',
    description:
      'An echo whose repeats hop up a fifth and down a fourth, into a two-spring tank with its input driven into saturation.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 322, modRate: 0.536 } },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank', params: { decay: 1.83, mix: 0.277 } },
    ],
  },
  {
    id: 'patch-cables-loam-echoes',
    name: 'Loam echoes',
    category: 'echo',
    description:
      'A few thin bright echoes that grow, cut off and repeat, then grain repeats that climb by fifths on every pass.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Sparkles', params: { time: 0.493 } },
      { deviceId: 'grain-delay', preset: 'Rising fifths', params: { time: 712, size: 165 } },
    ],
  },
  {
    id: 'patch-cables-re-patched-echoes',
    name: 'Re-patched echoes',
    category: 'echo',
    description:
      "A hint of a wavefolder's glassy edge under the clean sound, then slurred whole-tone harmonies trailing off in echoes.",
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass' },
      {
        deviceId: 'lattice',
        preset: 'Whole tone haze',
        params: { v1Delay: 299, v2Delay: 500, v3Delay: 189 },
      },
    ],
  },
  {
    id: 'patch-cables-voltage-echo',
    name: 'Voltage echo',
    category: 'echo',
    description:
      'A bucket-brigade echo with a slow chorus on its repeats, then a scooped tone with lows and highs up and the body down.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 304, modRate: 0.933 } },
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.41 } },
    ],
  },
  {
    id: 'patch-cables-seed-tray-overtone',
    name: 'Seed-tray overtone',
    category: 'tape',
    description:
      'Soft saturation that adds the octave above each note, then a fast chopping low-pass, into a hint of a two-spring tank behind the sound.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'auto-filter', preset: 'Tremolo filter' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'patch-cables-rockpool-glass',
    name: 'Rockpool glass',
    category: 'tape',
    description:
      'Old converters left unsmoothed, with a glassy ring on top, into a small room that is over in about a second.',
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
    id: 'patch-cables-valves-by-the-dock',
    name: 'Valves by the dock',
    category: 'tape',
    description:
      'A brightish valve preamp, then a resonant upper-mid peak that rises when played hard, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { outputDb: -10.1 } },
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { lfoRateHz: 0.917, envAttackMs: 18.6, envReleaseMs: 285 },
      },
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.358, breathRate: 0.312 },
      },
    ],
  },
  {
    id: 'patch-cables-cedar-overtones',
    name: 'Cedar overtones',
    category: 'tape',
    description:
      'A bright wavefolder, then a low-pass snapping shut and open about eight times a second, into a small dead booth that is gone almost at once.',
    effects: [
      { deviceId: 'saturator', preset: 'Wavefold lead' },
      { deviceId: 'auto-filter', preset: 'Tremolo filter' },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'patch-cables-frog-pond-sheen',
    name: 'Frog-pond sheen',
    category: 'tape',
    description:
      'A bright layer of saturation, then a randomly stepping filter, into three slack springs where every echo is a long chirp.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine', params: { outputDb: -9.51 } },
      {
        deviceId: 'auto-filter',
        preset: 'Stepped',
        params: { lfoRateHz: 8.72, envAttackMs: 8.93, envReleaseMs: 202 },
      },
      { deviceId: 'spring-reverb', preset: 'Slack and strange' },
    ],
  },
  {
    id: 'patch-cables-wren-overtones',
    name: 'Wren overtones',
    category: 'tape',
    description:
      'A hint of wavefolder, then a resonant upper-mid peak that rises when played hard, into a trace of room around the sound.',
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass' },
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { lfoRateHz: 1.01, envAttackMs: 21.9, envReleaseMs: 265 },
      },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
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
    id: 'patch-cables-sprouting-flanger',
    name: 'Sprouting flanger',
    category: 'motion',
    description:
      'A gentle flanger sweeping about every four seconds, then slurred whole-tone harmonies trailing off in echoes, into a long rising reverb.',
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
    id: 'patch-cables-flutter-by-the-cove',
    name: 'Flutter by the cove',
    category: 'motion',
    description:
      'A quick shallow chorus flutter over the dry sound, then a combo amplifier boxed in by the walls of a cupboard.',
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
      'A shallow phaser pulsing about four times a second, then echoes that climb an octave on every repeat.',
    effects: [
      { deviceId: 'phaser', preset: 'Fast throb' },
      { deviceId: 'pitch-shifter', preset: 'Rising steps', params: { size: 64.9, delay: 327 } },
    ],
  },
  {
    id: 'patch-cables-pollen-rotary',
    name: 'Pollen rotary',
    category: 'motion',
    description:
      'A fast rotating speaker with its bright horn to the fore, then grain repeats that climb by fifths on every pass.',
    effects: [
      { deviceId: 'rotary', preset: 'Bright horn' },
      { deviceId: 'grain-delay', preset: 'Rising fifths', params: { time: 690, size: 175 } },
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
    id: 'patch-cables-kingfisher-drift',
    name: 'Kingfisher drift',
    category: 'motion',
    description:
      'A slow phasing drift that turns over every few seconds, then a big lift of presence and air, with ringing held in check.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift' },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.547 } },
    ],
  },
  {
    id: 'patch-cables-sapling-flanger',
    name: 'Sapling flanger',
    category: 'motion',
    description:
      'A flanger jumping to a new place about four times a second, then dotted tape repeats that bounce from side to side.',
    effects: [
      { deviceId: 'flanger', preset: 'Stepped random', params: { rate: 3.52, delayMs: 4.48 } },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 647 } },
    ],
  },
  {
    id: 'patch-cables-vibrato-in-a-hurry',
    name: 'Vibrato in a hurry',
    category: 'motion',
    description:
      'A deep pitch wobble with the two sides bending out of step, then a tape echo whose three heads make a cluster of each repeat.',
    effects: [
      { deviceId: 'tremolo', preset: 'Wide wobble', params: { rate: 3.27 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 516 } },
    ],
  },
  {
    id: 'patch-cables-cabled-tremolo',
    name: 'Cabled tremolo',
    category: 'motion',
    description:
      'A square tremolo that switches the sound hard on and off, then tape repeats that lose their lows and thin out as they fade.',
    effects: [
      { deviceId: 'tremolo', preset: 'On and off', params: { rate: 1.55 } },
      { deviceId: 'tape-echo', preset: 'Thin and fading' },
    ],
  },
  {
    id: 'patch-cables-hemlock-filter',
    name: 'Hemlock filter',
    category: 'motion',
    description:
      'A big lift of presence and air, with ringing held in check, then a squelching low-pass ramping open about four times a second.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'auto-filter', preset: 'Squelch' },
    ],
  },
  {
    id: 'patch-cables-sweep-in-new-leaf',
    name: 'Sweep in new leaf',
    category: 'motion',
    description:
      'A resonant high-pass falling for about two seconds at a time, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Falling high-pass' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.27 } },
    ],
  },
  {
    id: 'patch-cables-tremolo-in-the-ferns',
    name: 'Tremolo in the ferns',
    category: 'motion',
    description:
      'A hard chop to silence about seven times a second, then an echo with a fast flutter in the pitch of its repeats.',
    effects: [
      { deviceId: 'tremolo', preset: 'Chopper' },
      { deviceId: 'analog-delay', preset: 'Fluttering', params: { time: 236, modRate: 7.22 } },
    ],
  },
  {
    id: 'patch-cables-fern-warble',
    name: 'Fern warble',
    category: 'motion',
    description:
      'A shallow flanger warbling about six times a second, into a short burst of reverb that holds and stops dead.',
    effects: [
      { deviceId: 'flanger', preset: 'Fast warble' },
      { deviceId: 'shaped-reverb', preset: 'Gated' },
    ],
  },
  {
    id: 'patch-cables-sprouting-chorus',
    name: 'Sprouting chorus',
    category: 'motion',
    description:
      'A chorus on the upper range that leaves the lows steady, then a bright blurred cloud an octave above everything played.',
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer' },
      { deviceId: 'spectral-blur', preset: 'Bright octave cloud' },
    ],
  },
  {
    id: 'patch-cables-canopy-cloud',
    name: 'Canopy cloud',
    category: 'motion',
    description:
      'Two unison doubles snapped to pitch, hard left and right, then a dense many-notched phaser drifting opposite on each side.',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Tuned double',
        params: { v1Delay: 15.4, v2Delay: 31.7, output: 7.01 },
      },
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.115 } },
    ],
  },
  {
    id: 'patch-cables-wash-off-the-cable',
    name: 'Wash off the cable',
    category: 'motion',
    description:
      'A transformer driven so the low end thickens and loosens, then a long slow flanger, nearly a chorus, opposite on each side.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'flanger', preset: 'Wide wash', params: { rate: 0.167, delayMs: 7.62 } },
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
      'A soft wash of octave and fifth loops over each note, then detuned copies heard alone, into a small dead booth that is gone almost at once.',
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
      'A stack of octave loops, then two copies heard just after the sound, the left one first, into a bright chamber.',
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack' },
      { deviceId: 'stereo-detune', preset: 'Late copy' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { predelayMs: 5.23 } },
    ],
  },
  {
    id: 'patch-cables-otter-sparks',
    name: 'Otter sparks',
    category: 'texture',
    description:
      'Faint high grains, then two copies that repeat into a blur round the upper notes, into a plain room that is gone in a couple of seconds.',
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
      'A wavefolder that wraps the peaks over as bright overtones, then loops of each note played backwards at stacked octaves.',
    effects: [
      { deviceId: 'saturator', preset: 'Wavefold lead', params: { outputDb: -12.4 } },
      { deviceId: 'cascade', preset: 'Backwards stack' },
    ],
  },
  {
    id: 'patch-cables-darting-stutter',
    name: 'Darting stutter',
    category: 'texture',
    description:
      'Repeats like a bouncing ball, then a detuned copy either side, into a faint scatter of echoes just behind the sound.',
    effects: [
      { deviceId: 'glitch', preset: 'Bouncing', params: { time: 309 } },
      { deviceId: 'stereo-detune', preset: 'Classic', params: { delay: 15.2 } },
      {
        deviceId: 'swarm-reverb',
        preset: 'Faint scatter',
        params: { length: 0.249, glide: 0.607 },
      },
    ],
  },
  {
    id: 'patch-cables-garden-sparks',
    name: 'Garden sparks',
    category: 'texture',
    description:
      'Scattered sparks two octaves up, echoing higher still, into a tiny boxy room that is gone almost at once.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'High sparks', params: { size: 29.3, delay: 257 } },
      { deviceId: 'expanse', preset: 'Small box', params: { modRate: 0.356 } },
    ],
  },
  {
    id: 'patch-cables-swell-from-seed',
    name: 'Swell from seed',
    category: 'texture',
    description:
      'A late swell on every note like a rocked volume pedal, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 229, release: 138 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 2.7 } },
    ],
  },
  {
    id: 'patch-cables-patched-shimmer',
    name: 'Patched shimmer',
    category: 'texture',
    description:
      'A soft wash of octave and fifth loops over each note, into a medium hall with only a breath of voice in its tail.',
    effects: [
      { deviceId: 'cascade', preset: 'Sparkle bed', params: { time: 280 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 3.56, preDelay: 18 } },
    ],
  },
  {
    id: 'patch-cables-cabled-grains',
    name: 'Cabled grains',
    category: 'texture',
    description:
      'A scattered cloud of long grains, some an octave up, into a single saturated tape echo close behind each note.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Slow cloud' },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  {
    id: 'patch-cables-dockside-octaves',
    name: 'Dockside octaves',
    category: 'pitch',
    description:
      'An octave above and an octave below a single line, then a thick ensemble chorus, into three taut springs kept soft and close to the centre.',
    effects: [
      { deviceId: 'lattice', preset: 'Octaves', params: { output: 7.45 } },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.516, delayMs: 16.3 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
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
    id: 'patch-cables-triad-patched-in',
    name: 'Triad patched in',
    category: 'pitch',
    description:
      'A pure-tuned third, fifth and low octave in C major, then two soft detuned copies, into a short room fed in pulses about twice a second.',
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
    id: 'patch-cables-morning-fifths',
    name: 'Morning fifths',
    category: 'pitch',
    description:
      'A wide, slightly detuned fifth above held chords, then a full-range sharp and flat copy, wide to either side.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth' },
      { deviceId: 'stereo-detune', preset: 'Wider', params: { delay: 19.4 } },
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
    id: 'patch-cables-greenhouse-chord',
    name: 'Greenhouse chord',
    category: 'pitch',
    description:
      'A seventh chord in C major, then a clean steady echo, into a vast hall that opens to the sound in very slow waves.',
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
    id: 'patch-cables-stack-in-green',
    name: 'Stack in green',
    category: 'pitch',
    description:
      'Soft saturation that adds the octave above each note, then little loops of each note stacked one and two octaves up.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'cascade', preset: 'Octave stack', params: { time: 436 } },
    ],
  },
  {
    id: 'patch-cables-drone-on-the-sill',
    name: 'Drone on the sill',
    category: 'pitch',
    description:
      'A fixed drone on C and G, then a slowly drifting chorus, into a hall that answers about a quarter of a second late.',
    effects: [
      { deviceId: 'lattice', preset: 'Two note drone', params: { output: 9.01 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.0768, delayMs: 24.5 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Late arrival',
        params: { decay: 4.66, breathRate: 0.309 },
      },
    ],
  },
  {
    id: 'patch-cables-rain-barrel-thirds',
    name: 'Rain-barrel thirds',
    category: 'pitch',
    description:
      'A third above and a sixth below a single line, in C major, then a light chorus that widens more than it moves, into a small ringing chamber.',
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds', params: { output: 7.04 } },
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank' },
    ],
  },
  {
    id: 'patch-cables-mooring-harmony',
    name: 'Mooring harmony',
    category: 'pitch',
    description:
      'A mirrored line and a third, then a shallow chorus that thickens the sound above its lows, into an undamped hall.',
    effects: [
      { deviceId: 'lattice', preset: 'Thesis voicing', params: { output: 6.82 } },
      { deviceId: 'chorus', preset: 'Vocal thickener', params: { rate: 0.353, delayMs: 20.4 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air' },
    ],
  },
  {
    id: 'patch-cables-green-fifth',
    name: 'Green fifth',
    category: 'pitch',
    description:
      'A single voice a fifth above the dry sound, then a big lift of presence and air, with ringing held in check.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Fifth above', params: { size: 64.8 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.603 } },
    ],
  },
  {
    id: 'patch-cables-fifth-on-the-porch',
    name: 'Fifth on the porch',
    category: 'pitch',
    description:
      'A single voice a fifth above the dry sound, then a flanger that takes about twelve seconds over each sweep.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Fifth above' },
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.0732, delayMs: 3.94 } },
    ],
  },
  {
    id: 'patch-cables-cedar-arpeggio',
    name: 'Cedar arpeggio',
    category: 'pitch',
    description:
      'Each note answered by a rising C pentatonic run of echoes, then two tape heads that make every repeat gallop.',
    effects: [
      { deviceId: 'lattice', preset: 'Pentatonic harp', params: { output: 6.18 } },
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
    ],
  },
  {
    id: 'patch-cables-octave-at-the-inlet',
    name: 'Octave at the inlet',
    category: 'pitch',
    description:
      'A single voice an octave above the dry sound, then a resonant upper-mid peak that rises when played hard.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { size: 65.6 } },
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { lfoRateHz: 0.952, envAttackMs: 21.9, envReleaseMs: 272 },
      },
    ],
  },
  {
    id: 'patch-cables-ferry-octaves',
    name: 'Ferry octaves',
    category: 'pitch',
    description:
      'Short backwards chunks that climb by octaves and splinter, then a fast glittering stutter of plucked octaves over each note.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Glass splinters' },
      { deviceId: 'cascade', preset: 'Glass rain' },
    ],
  },
  {
    id: 'patch-cables-seedling-octave',
    name: 'Seedling octave',
    category: 'pitch',
    description:
      'A single voice an octave above the dry sound, into a reverb whose tail climbs an octave on every pass.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up' },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { decay: 8.41, predelay: 20.4 } },
    ],
  },
  {
    id: 'patch-cables-rowboat-rain',
    name: 'Rowboat rain',
    category: 'pitch',
    description:
      'A fast glittering stutter of plucked octaves over each note, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain' },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { predelayMs: 196 } },
    ],
  },
  {
    id: 'patch-cables-green-octaves',
    name: 'Green octaves',
    category: 'pitch',
    description:
      'Tape-style saturation that rounds only the loudest peaks, then an octave above and an octave below, clean on chords.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { outputDb: -7.24 } },
      { deviceId: 'pitch-shifter', preset: 'Octaves both', params: { size: 64.9 } },
    ],
  },
  {
    id: 'patch-cables-wharf-harmony',
    name: 'Wharf harmony',
    category: 'pitch',
    description:
      'A fluttering fifth above and fourth below, out of tune, into sixteen strings in C major that ring for about ten seconds.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Broken choir' },
      { deviceId: 'sympathetic', preset: 'Long ring', params: { decay: 9.76 } },
    ],
  },
  {
    id: 'patch-cables-orchard-polish',
    name: 'Orchard polish',
    category: 'master',
    description:
      'A stereo image widened a little, with the bass left central, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'patch-cables-pebble-finish',
    name: 'Pebble finish',
    category: 'master',
    description:
      'A little soft saturation, then an even-handed compressor, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { attack: 132, release: 1.56 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.42 } },
    ],
  },
  {
    id: 'patch-cables-garden-finish',
    name: 'Garden finish',
    category: 'master',
    description:
      'Tape-style saturation that rounds only the loudest peaks, then a gentle compressor, then a safety limiter.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'patch-cables-trillium-master',
    name: 'Trillium master',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a true-peak ceiling that lets go again over several seconds.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.56 } },
    ],
  },
  {
    id: 'patch-cables-sprouting-lacquer',
    name: 'Sprouting lacquer',
    category: 'master',
    description:
      'Light tape-style saturation, then a slow compressor that evens out swells over seconds, then a bare brickwall ceiling.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 308, release: 1.94 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.61 } },
    ],
  },
  {
    id: 'patch-cables-windowsill-lacquer',
    name: 'Windowsill lacquer',
    category: 'master',
    description:
      'A parallel compressor that lifts quiet playing and tails, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift' },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.64 } },
    ],
  },
]
