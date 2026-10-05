// Stairwell Choir of One: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'stairwell-choir-skylit-cathedral',
    name: 'Skylit cathedral',
    category: 'space',
    description:
      'A sharp copy on the left and a flat one on the right, into a cathedral whose long tail sings a soft open "ah".',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { delay: 14.2 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 20.2, preDelay: 36.7 } },
    ],
  },
  {
    id: 'stairwell-choir-bloom-without-words',
    name: 'Bloom without words',
    category: 'space',
    description:
      'A detuned double made of grains, spread to the sides, into a reverb whose tail climbs nearly an octave as it rings.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Detuned double' },
      { deviceId: 'bloom-reverb', preset: 'Octave halo', params: { decay: 5.95 } },
    ],
  },
  {
    id: 'stairwell-choir-clapboard-ascent',
    name: 'Clapboard ascent',
    category: 'space',
    description:
      'Two copies a few cents sharp and flat, left and right, into a very long reverb whose tail keeps climbing by octaves.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Doubler' },
      { deviceId: 'bloom-reverb', preset: 'Endless rise' },
    ],
  },
  {
    id: 'stairwell-choir-empty-pool-choir',
    name: 'Empty-pool choir',
    category: 'space',
    description:
      'A sharp copy and a flat one, full-range, wide to either side, into a huge hall whose tail hums a soft "oo" for a long while.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider' },
      { deviceId: 'vowel-reverb', preset: 'Endless oo', params: { preDelay: 22.3 } },
    ],
  },
  {
    id: 'stairwell-choir-daybreak-halo',
    name: 'Daybreak halo',
    category: 'space',
    description:
      'A slow swell after each silence that leaves some attack in, then a late climbing reverb, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1570, release: 311 } },
      { deviceId: 'shimmer', preset: 'Late answer' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3.57, breathRate: 0.298 } },
    ],
  },
  {
    id: 'stairwell-choir-rose-window-hall',
    name: 'Rose-window hall',
    category: 'space',
    description:
      'A hall that sways in pitch with a trace of the octave above, then a second take either side, a little late and out of tune.',
    effects: [
      { deviceId: 'shimmer', preset: 'Swaying hall', params: { decay: 4.27, predelay: 18.5 } },
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { delay: 35.8 } },
    ],
  },
  {
    id: 'stairwell-choir-held-breath-hall',
    name: 'Held-breath hall',
    category: 'space',
    description:
      'A short swell that rounds the front off every note, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 48.7, lowDecay: 3.75, midDecay: 3.12 },
      },
    ],
  },
  {
    id: 'stairwell-choir-halo-in-bare-tile',
    name: 'Halo in bare tile',
    category: 'space',
    description:
      'The octave-climbing tail of a large reverb with no dry sound, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'shimmer', preset: 'Rising tail alone' },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'stairwell-choir-plate-for-one-voice',
    name: 'Plate for one voice',
    category: 'space',
    description:
      'A long plate with a wide and even tail, then a valve stage that gives way under loud notes, tails rising.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 36.5 } },
      { deviceId: 'patina', preset: 'Valve bloom' },
    ],
  },
  {
    id: 'stairwell-choir-melisma-choir',
    name: 'Melisma choir',
    category: 'space',
    description:
      'A short reverb that swells in just after each note, into a wordless choir alone with none of the dry sound left.',
    effects: [
      { deviceId: 'expanse', preset: 'Quick swell', params: { mix: 0.27 } },
      { deviceId: 'vowel-reverb', preset: 'Choir alone' },
    ],
  },
  {
    id: 'stairwell-choir-gymnasium-plate',
    name: 'Gymnasium plate',
    category: 'space',
    description:
      'A plate heard alone with none of the dry sound left, then a compressor that pulls the tail of every note back up.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
      {
        deviceId: 'ambient-comp',
        preset: 'Long sustain',
        params: { attack: 221, release: 0.784, makeup: 11.5 },
      },
    ],
  },
  {
    id: 'stairwell-choir-hall-from-the-pews',
    name: 'Hall from the pews',
    category: 'space',
    description:
      'A swell that takes about four seconds to open after silence, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier' },
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
    ],
  },
  {
    id: 'stairwell-choir-banister-sky',
    name: 'Banister sky',
    category: 'space',
    description:
      'A wide open space with a slowly wavering tail, then a big lift of presence and air.',
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 9.63, modRate: 0.409 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.592 } },
    ],
  },
  {
    id: 'stairwell-choir-vespers-ascent',
    name: 'Vespers ascent',
    category: 'space',
    description:
      'A swell that takes about four seconds to open after silence, into a vast reverb where most of the tail climbs by octaves.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier' },
      { deviceId: 'shimmer', preset: 'Endless ascent' },
    ],
  },
  {
    id: 'stairwell-choir-plainsong-cathedral',
    name: 'Plainsong cathedral',
    category: 'space',
    description:
      'A slow swell on only the first note after each silence, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'swell', preset: 'First note only', params: { attack: 1410, release: 1660 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 85.5, lowDecay: 7.65, midDecay: 5.79 },
      },
    ],
  },
  {
    id: 'stairwell-choir-antiphon-swell',
    name: 'Antiphon swell',
    category: 'space',
    description:
      'A small room that casts a shadow an octave below, into a reverb that swells and ebbs in waves of over a second each.',
    effects: [
      { deviceId: 'shimmer', preset: 'Low shadow', params: { decay: 2.02, predelay: 21.5 } },
      { deviceId: 'shaped-reverb', preset: 'Slow tide' },
    ],
  },
  {
    id: 'stairwell-choir-hummed-ascent',
    name: 'Hummed ascent',
    category: 'space',
    description:
      'Two dull copies a few cents off, tucked behind the sound, into a very long reverb whose tail keeps climbing by octaves.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'bloom-reverb', preset: 'Endless rise' },
    ],
  },
  {
    id: 'stairwell-choir-skylit-hall',
    name: 'Skylit hall',
    category: 'space',
    description:
      'A bowed swell that lets part of each attack through, into a medium hall with only a breath of voice in its tail.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 283, release: 145 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering' },
    ],
  },
  {
    id: 'stairwell-choir-shadow-two-floors-up',
    name: 'Shadow two floors up',
    category: 'space',
    description:
      'An equaliser that adds lows and body and eases the top, into a soft sung "oo" that trails each note by a moment.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.44 } },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 4.7, preDelay: 87.9 } },
    ],
  },
  {
    id: 'stairwell-choir-vault-on-the-stairs',
    name: 'Vault on the stairs',
    category: 'space',
    description:
      'Two dark late copies that shadow the sound on either side, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Shadow' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'stairwell-choir-canon-cathedral',
    name: 'Canon cathedral',
    category: 'space',
    description:
      'A thin band of tone with the lows cut and the top rolled off, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 85.5, lowDecay: 7.3, midDecay: 5.34 },
      },
    ],
  },
  {
    id: 'stairwell-choir-sung-over-hall',
    name: 'Sung-over hall',
    category: 'space',
    description:
      'Two unison doubles snapped to pitch, hard left and right, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'lattice', preset: 'Tuned double', params: { output: 3.6 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'stairwell-choir-concrete-haze',
    name: 'Concrete haze',
    category: 'space',
    description:
      'A mid-forward tone, then an evenly fading reverb, then a wide haze of grains that hangs on long after the playing.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { time: 1.53, preDelay: 19.2 } },
      {
        deviceId: 'grain-delay',
        preset: 'Frozen haze',
        params: { time: 976, size: 384, mix: 0.359 },
      },
    ],
  },
  {
    id: 'stairwell-choir-empty-pool-hall',
    name: 'Empty-pool hall',
    category: 'space',
    description:
      'A big lift of the low end that puts weight under the sound, then a wide room heard from its far end, into a swaying hall.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.5 } },
      {
        deviceId: 'shimmer',
        preset: 'Swaying hall',
        params: { decay: 3.96, predelay: 22.1, mix: 0.21 },
      },
    ],
  },
  {
    id: 'stairwell-choir-a-cappella-voices',
    name: 'A-cappella voices',
    category: 'space',
    description:
      'A wordless choir alone with none of the dry sound left, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Choir alone' },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'stairwell-choir-spiral-stair-sparkle',
    name: 'Spiral-stair sparkle',
    category: 'space',
    description:
      'A sharp and a flat copy of the highs only, to either side, into a short bright room whose tail splits a fifth up and down.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Top only' },
      { deviceId: 'bloom-reverb', preset: 'Quick sparkle' },
    ],
  },
  {
    id: 'stairwell-choir-stair-foot-room',
    name: 'Stair-foot room',
    category: 'space',
    description:
      'A sharp copy hard left and a flat one hard right, alone, into a bright wide chamber that is over in about a second.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only', params: { delay: 16.3 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { predelayMs: 4.75 } },
    ],
  },
  {
    id: 'stairwell-choir-echoing-reel',
    name: 'Echoing reel',
    category: 'echo',
    description:
      'A short tape loop where each pass comes back quieter, into a long bright reverb tail kept low behind the sound.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.92 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 28.5 } },
    ],
  },
  {
    id: 'stairwell-choir-east-window-loop',
    name: 'East-window loop',
    category: 'echo',
    description:
      'A clean, unfading loop of the first phrase played, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Clean hold', params: { length: 2.16 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 41.5, mix: 0.264 } },
    ],
  },
  {
    id: 'stairwell-choir-landing-trace',
    name: 'Landing trace',
    category: 'echo',
    description:
      'A faint echo with earlier phrases coming faintly back, into a vast hall whose long tail sings a high bright "ah".',
    effects: [
      { deviceId: 'echo-memory', preset: 'Faint recall' },
      { deviceId: 'vowel-reverb', preset: 'High choir', params: { decay: 24.9, preDelay: 21.3 } },
    ],
  },
  {
    id: 'stairwell-choir-rotunda-voices',
    name: 'Rotunda voices',
    category: 'echo',
    description:
      'A short tape loop where each pass comes back quieter, into a wordless choir alone with none of the dry sound left.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.98 } },
      { deviceId: 'vowel-reverb', preset: 'Choir alone', params: { decay: 10.2, preDelay: 20.4 } },
    ],
  },
  {
    id: 'stairwell-choir-canon-voices',
    name: 'Canon voices',
    category: 'echo',
    description:
      'A blurred loop that never comes round quite the same, into faint voices singing behind the sound.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Drifting' },
      { deviceId: 'vowel-reverb', preset: 'Faint voices', params: { decay: 3.77, preDelay: 20.9 } },
    ],
  },
  {
    id: 'stairwell-choir-unaccompanied-loop',
    name: 'Unaccompanied loop',
    category: 'echo',
    description:
      'A gentle high cut that shades the top end, then a thin, far-off tape loop with its lows cut away.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.57 } },
      { deviceId: 'tape-loop', preset: 'Thin and distant' },
    ],
  },
  {
    id: 'stairwell-choir-echo-up-the-stairs',
    name: 'Echo up the stairs',
    category: 'echo',
    description:
      'An echo whose repeats come in quick, separate pulses, into a vast reverb where most of the tail climbs by octaves.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Pulsing repeat', params: { mix: 0.244 } },
      {
        deviceId: 'shimmer',
        preset: 'Endless ascent',
        params: { decay: 29.3, predelay: 64.3, mix: 0.3 },
      },
    ],
  },
  {
    id: 'stairwell-choir-loop-in-empty-pews',
    name: 'Loop in empty pews',
    category: 'echo',
    description:
      'A thin double-speed tape loop an octave above the playing, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Octave up ghosts' },
      { deviceId: 'hall-reverb', preset: 'Bright hall' },
    ],
  },
  {
    id: 'stairwell-choir-lightwell-chirps',
    name: 'Lightwell chirps',
    category: 'echo',
    description:
      'A short loop run backwards at double speed and an octave up, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Fast reverse' },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'stairwell-choir-psalm-loop',
    name: 'Psalm loop',
    category: 'echo',
    description:
      'A quick loop of about the last half second that soon fades, then a low cut that thins the bass, with a little air on top.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Quick loop', params: { length: 0.555 } },
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.43 } },
    ],
  },
  {
    id: 'stairwell-choir-one-voice-echo',
    name: 'One-voice echo',
    category: 'echo',
    description:
      'Whole phrases played backwards about four seconds later, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Long mirror', params: { time: 3650 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 21.6, lowDecay: 4.45, midDecay: 4.98 },
      },
    ],
  },
  {
    id: 'stairwell-choir-luminous-sparkle',
    name: 'Luminous sparkle',
    category: 'echo',
    description:
      'A short double-speed loop an octave up that soon dies away, into a small bright chamber that goes on ringing for seconds.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Octave up', params: { length: 1.3 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank' },
    ],
  },
  {
    id: 'stairwell-choir-echoing-trace',
    name: 'Echoing trace',
    category: 'echo',
    description:
      'A faint echo with earlier phrases coming faintly back, into a long reverb that comes and goes in waves, over and over.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Faint recall',
        params: { time: 405, reach: 18.9, size: 2.12 },
      },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.59 } },
    ],
  },
  {
    id: 'stairwell-choir-memory-sung-twice',
    name: 'Memory sung twice',
    category: 'echo',
    description:
      'Earlier moments of the playing that keep drifting back, into a vast nave that rings for about eight seconds.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'No echo',
        params: { time: 446, reach: 21.6, size: 2.79 },
      },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { preDelay: 93.1, midDecay: 7.82 } },
    ],
  },
  {
    id: 'stairwell-choir-choir-on-sunday',
    name: 'Choir on Sunday',
    category: 'echo',
    description:
      'A loop of the last phrase played backwards as a bed, into a wordless choir alone with none of the dry sound left.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { length: 2.92 } },
      { deviceId: 'vowel-reverb', preset: 'Choir alone' },
    ],
  },
  {
    id: 'stairwell-choir-wordless-halo',
    name: 'Wordless halo',
    category: 'echo',
    description:
      'A faint, soft loop of the last phrase that soon dies away, into a reverb whose tail climbs an octave on every pass.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Faint bed', params: { length: 1.36 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { predelay: 19.2 } },
    ],
  },
  {
    id: 'stairwell-choir-cupola-tide',
    name: 'Cupola tide',
    category: 'echo',
    description:
      'Slow backwards swells that rise and die behind the playing, then a pan that wanders to a new place every second or so.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1520 } },
      { deviceId: 'tremolo', preset: 'Wandering pan' },
    ],
  },
  {
    id: 'stairwell-choir-stairwell-octaves',
    name: 'Stairwell octaves',
    category: 'echo',
    description:
      'Backwards swells that climb an octave on every pass, into a wide room heard from its far end.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { time: 793 } },
      { deviceId: 'ether-reverb', preset: 'Distant' },
    ],
  },
  {
    id: 'stairwell-choir-three-flight-loop',
    name: 'Three-flight loop',
    category: 'echo',
    description:
      'A scooped tone with lows and highs up and the body down, then a tape loop about one second long that soon dies away.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow' },
      { deviceId: 'tape-loop', preset: 'One second round', params: { length: 1.06 } },
    ],
  },
  {
    id: 'stairwell-choir-silo-echo',
    name: 'Silo echo',
    category: 'echo',
    description:
      'Grain repeats that climb an octave on every pass, into a bright wide room that rings for a second or two.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { time: 330, size: 128 } },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'stairwell-choir-echo-before-mass',
    name: 'Echo before mass',
    category: 'echo',
    description:
      'A tape echo whose warm repeats soften as they fade, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { preDelay: 31.6, midDecay: 4.48 } },
    ],
  },
  {
    id: 'stairwell-choir-echo-on-sunday',
    name: 'Echo on Sunday',
    category: 'echo',
    description:
      'A swell that takes seconds to rise after each silence, then dotted tape repeats that bounce from side to side.',
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      { deviceId: 'tape-echo', preset: 'Dotted bounce' },
    ],
  },
  {
    id: 'stairwell-choir-sotto-voce-trace',
    name: 'Sotto-voce trace',
    category: 'echo',
    description:
      'A faint echo with earlier phrases coming faintly back, into a bright undamped plate of a couple of seconds.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Faint recall',
        params: { time: 489, reach: 21.5, size: 1.97 },
      },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 4.92 } },
    ],
  },
  {
    id: 'stairwell-choir-introit-cathedral',
    name: 'Introit cathedral',
    category: 'echo',
    description:
      'A soft echo while earlier phrases drift back under it, into a cathedral whose long tail sings a soft open "ah".',
    effects: [
      { deviceId: 'echo-memory', preset: 'Recalling' },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { preDelay: 42 } },
    ],
  },
  {
    id: 'stairwell-choir-canon-loop',
    name: 'Canon loop',
    category: 'echo',
    description:
      'A loop of the last phrase played backwards as a bed, then grain repeats that climb by fifths on every pass.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { length: 3.31 } },
      { deviceId: 'grain-delay', preset: 'Rising fifths', params: { time: 657, size: 154 } },
    ],
  },
  {
    id: 'stairwell-choir-loop-by-the-rail',
    name: 'Loop by the rail',
    category: 'echo',
    description:
      'A soft loop of whatever was just played, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { length: 2.24 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { preDelay: 22.2, lowDecay: 4.09, midDecay: 3.65 },
      },
    ],
  },
  {
    id: 'stairwell-choir-mid-flight-reel',
    name: 'Mid-flight reel',
    category: 'tape',
    description:
      'A fast backwards loop, then a clean bright reel under a thick layer of tape hiss, into a long bright reverb tail kept low behind the sound.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Fast reverse', params: { length: 0.571 } },
      { deviceId: 'tape', preset: 'Hiss and air' },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 27.1 } },
    ],
  },
  {
    id: 'stairwell-choir-balustrade-cassette',
    name: 'Balustrade cassette',
    category: 'tape',
    description:
      'A chorus on the upper range that leaves the lows steady, then a thick, soft cassette, full in the lows and dull on top.',
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer' },
      { deviceId: 'tape', preset: 'Warm thump', params: { output: 1.41 } },
    ],
  },
  {
    id: 'stairwell-choir-sunbeam-tape',
    name: 'Sunbeam tape',
    category: 'tape',
    description:
      'A thick, soft cassette, full in the lows and dull on top, then the start of each note struck again and again as it fades.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'cascade', preset: 'Restruck', params: { time: 510 } },
    ],
  },
  {
    id: 'stairwell-choir-clapboard-tape',
    name: 'Clapboard tape',
    category: 'tape',
    description:
      'A thick, soft cassette, full in the lows and dull on top, into a dark reverb that rises behind each note and lingers.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 2.13, preDelay: 54 } },
    ],
  },
  {
    id: 'stairwell-choir-hiss-from-the-pews',
    name: 'Hiss from the pews',
    category: 'tape',
    description:
      'A big lift of presence and air, then a clean bright reel under a thick layer of tape hiss, then a dark fog of slow backwards swells.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'tape', preset: 'Hiss and air' },
      { deviceId: 'reverse-delay', preset: 'Dark fog' },
    ],
  },
  {
    id: 'stairwell-choir-concrete-reel',
    name: 'Concrete reel',
    category: 'tape',
    description:
      'A clean bright reel under a thick layer of tape hiss, into a small plate that is gone in a second or two.',
    effects: [
      { deviceId: 'tape', preset: 'Hiss and air' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 11 } },
    ],
  },
  {
    id: 'stairwell-choir-mid-flight-glint',
    name: 'Mid-flight glint',
    category: 'motion',
    description:
      'A faint octave above each note, slightly detuned, then the level breathing in and out about every four seconds, into a late-arriving hall.',
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave' },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.265 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { predelayMs: 193 } },
    ],
  },
  {
    id: 'stairwell-choir-ground-floor-chorus',
    name: 'Ground-floor chorus',
    category: 'motion',
    description:
      'A deep slow chorus on a long delay, swaying over seconds, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.406, breathRate: 0.278 },
      },
    ],
  },
  {
    id: 'stairwell-choir-descant-glow',
    name: 'Descant glow',
    category: 'motion',
    description:
      'High octaves that fade in late above each note, then a slow rotating speaker with a shallow, gentle sway, into an undamped hall.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo' },
      { deviceId: 'rotary', preset: 'Faint motion', params: { mix: 0.36 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.21 } },
    ],
  },
  {
    id: 'stairwell-choir-chorus-either-side',
    name: 'Chorus either side',
    category: 'motion',
    description:
      'A late copy on each side, like the same part played twice, into a medium hall with only a breath of voice in its tail.',
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { rate: 0.187, delayMs: 26.9 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 3.71, preDelay: 20.5 } },
    ],
  },
  {
    id: 'stairwell-choir-back-pew-rotary',
    name: 'Back-pew rotary',
    category: 'motion',
    description:
      'A dark slow rotating speaker that mostly turns the lows, into a wide wash of sixteen long strings in D minor.',
    effects: [
      { deviceId: 'rotary', preset: 'Dark drum' },
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { mix: 0.39 } },
    ],
  },
  {
    id: 'stairwell-choir-halo-after-vespers',
    name: 'Halo after vespers',
    category: 'motion',
    description:
      'High octaves that fade in late above each note, then the level rising and falling at random, like surf, into a singing cathedral.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo', params: { attack: 0.778 } },
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.33 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 20.8 } },
    ],
  },
  {
    id: 'stairwell-choir-quavering-double',
    name: 'Quavering double',
    category: 'motion',
    description:
      'Two copies in tune that wander like extra takes, into a long thin cave whose single echoes swell and fade.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Drifting', params: { delay: 24.7 } },
      { deviceId: 'swarm-reverb', preset: 'Glinting', params: { length: 0.631, glide: 0.549 } },
    ],
  },
  {
    id: 'stairwell-choir-long-breath-horizon',
    name: 'Long-breath horizon',
    category: 'texture',
    description:
      'A swell so late that notes seem to play in reverse, then a long-hanging wide wash, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Backwards' },
      { deviceId: 'spectral-blur', preset: 'Endless' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 5.06 } },
    ],
  },
  {
    id: 'stairwell-choir-bloom-on-a-landing',
    name: 'Bloom on a landing',
    category: 'texture',
    description:
      'A late-blooming slow swell, then slow unfading chord layers, into a plain hall that rings for about three seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1480, release: 723 } },
      { deviceId: 'sustainer', preset: 'Slow bloom layers', params: { glide: 4.78 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 3.24, predelay: 14.1 } },
    ],
  },
  {
    id: 'stairwell-choir-pad-either-side',
    name: 'Pad either side',
    category: 'texture',
    description:
      'A wide smeared pad held from the first notes played, into a plain hall that rings for about three seconds.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Frozen pad' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 3.5, predelay: 16.8 } },
    ],
  },
  {
    id: 'stairwell-choir-frost-on-one-breath',
    name: 'Frost on one breath',
    category: 'texture',
    description:
      'A thin, bright held pad with everything low taken out, into sixteen hard-driven strings in F major that ring for seconds.',
    effects: [
      { deviceId: 'sustainer', preset: 'High frost' },
      { deviceId: 'sympathetic', preset: 'Glass harp', params: { decay: 6.47 } },
    ],
  },
  {
    id: 'stairwell-choir-rotunda-memory',
    name: 'Rotunda memory',
    category: 'texture',
    description:
      'Long grains of what was played about four seconds ago, then echoes that climb an octave on every repeat.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Long memory', params: { size: 1060, density: 5.29 } },
      { deviceId: 'pitch-shifter', preset: 'Rising steps' },
    ],
  },
  {
    id: 'stairwell-choir-steeple-pad',
    name: 'Steeple pad',
    category: 'texture',
    description:
      'A held pad that takes seconds to melt into each new chord, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'sustainer', preset: 'Long glide', params: { attack: 1.49, glide: 4.53 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'stairwell-choir-pad-in-a-dry-pool',
    name: 'Pad in a dry pool',
    category: 'texture',
    description:
      'A softened attack, then a soft string pad that swells in behind what is played, into a huge wash heard alone.',
    effects: [
      { deviceId: 'swell', preset: 'Soft pick' },
      { deviceId: 'pad-follower', preset: 'String pad' },
      { deviceId: 'expanse', preset: 'Wash alone' },
    ],
  },
  {
    id: 'stairwell-choir-wordless-shimmer',
    name: 'Wordless shimmer',
    category: 'texture',
    description:
      'A half-hidden slow swell, then a wide drifting chord cloud, into a reverb that swells in after each note and fades away.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow' },
      { deviceId: 'sustainer', preset: 'Shimmer cloud', params: { attack: 1.02, glide: 0.886 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.81 } },
    ],
  },
  {
    id: 'stairwell-choir-fog-left-to-ring',
    name: 'Fog left to ring',
    category: 'texture',
    description:
      'A dense, wide fog of grains that buries the dry sound, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Thick fog', params: { size: 505, density: 96.7 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 40.4, lowDecay: 2.19, midDecay: 2.68 },
      },
    ],
  },
  {
    id: 'stairwell-choir-glow-sung-alone',
    name: 'Glow sung alone',
    category: 'texture',
    description:
      'A thin halo of held sound, then a shallow chorus that thickens the sound above its lows, into an undamped hall.',
    effects: [
      { deviceId: 'sustainer', preset: 'Thin halo' },
      { deviceId: 'chorus', preset: 'Vocal thickener' },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 3.07, breathRate: 0.265 } },
    ],
  },
  {
    id: 'stairwell-choir-held-breath-pad',
    name: 'Held-breath pad',
    category: 'texture',
    description:
      'A dark, round pad that melts slowly from chord to chord, then a rotating speaker on its slow speed.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Dark bed',
        params: { attack: 1.1, glide: 2.69, mix: 0.36 },
      },
      { deviceId: 'rotary', preset: 'Chorale' },
    ],
  },
  {
    id: 'stairwell-choir-loop-in-a-dry-pool',
    name: 'Loop in a dry pool',
    category: 'texture',
    description:
      'A clean, unfading loop of the first phrase played, into a plain hall of about four seconds.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Clean hold' },
      { deviceId: 'vowel-reverb', preset: 'Plain hall', params: { decay: 4.43 } },
    ],
  },
  {
    id: 'stairwell-choir-plainsong-sheen',
    name: 'Plainsong sheen',
    category: 'pitch',
    description:
      'A grainy octave sheen, then moments drifting back, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Shimmer', params: { size: 44.6 } },
      { deviceId: 'echo-memory', preset: 'No echo' },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'stairwell-choir-fifth-in-dust-motes',
    name: 'Fifth in dust motes',
    category: 'pitch',
    description:
      'A single voice a fifth above the dry sound, then moments drifting back, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Fifth above', params: { size: 63.9 } },
      {
        deviceId: 'echo-memory',
        preset: 'No echo',
        params: { time: 521, reach: 19.2, size: 2.55 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'stairwell-choir-octaves-sung-low',
    name: 'Octaves sung low',
    category: 'pitch',
    description:
      'Octaves above and below, then a thin, far-off tape loop with its lows cut away, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octaves both', params: { size: 61 } },
      { deviceId: 'tape-loop', preset: 'Thin and distant' },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 61.6 } },
    ],
  },
  {
    id: 'stairwell-choir-offertory-fifths',
    name: 'Offertory fifths',
    category: 'pitch',
    description:
      'A wide, slightly detuned fifth above held chords, into a huge hall whose tail hums a soft "oo" for a long while.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth' },
      { deviceId: 'vowel-reverb', preset: 'Endless oo' },
    ],
  },
  {
    id: 'stairwell-choir-fire-stair-glow',
    name: 'Fire-stair glow',
    category: 'pitch',
    description:
      'High octaves that fade in late above each note, then a long dark tape trail, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo', params: { attack: 0.671 } },
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1440 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { lowDecay: 3.88, midDecay: 3.93 },
      },
    ],
  },
  {
    id: 'stairwell-choir-sparkle-off-concrete',
    name: 'Sparkle off concrete',
    category: 'pitch',
    description:
      'A soft wash of octave and fifth loops over each note, into a reverb that swells and ebbs in waves of over a second each.',
    effects: [
      { deviceId: 'cascade', preset: 'Sparkle bed', params: { time: 359 } },
      { deviceId: 'shaped-reverb', preset: 'Slow tide' },
    ],
  },
  {
    id: 'stairwell-choir-back-pew-bass',
    name: 'Back-pew bass',
    category: 'pitch',
    description:
      'A full voice an octave below a single line, in the centre, into a long bright reverb tail kept low behind the sound.',
    effects: [
      { deviceId: 'lattice', preset: 'Sub octave', params: { output: 3.68 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'stairwell-choir-top-step-drone',
    name: 'Top-step drone',
    category: 'pitch',
    description:
      'Copies of each note re-pitched to a fixed C and the G below, then a wide wash of swelling octave loops, some of them backwards.',
    effects: [
      { deviceId: 'lattice', preset: 'Two note drone', params: { output: 7.11 } },
      { deviceId: 'cascade', preset: 'Only the echoes', params: { time: 680 } },
    ],
  },
  {
    id: 'stairwell-choir-tall-window-mist',
    name: 'Tall-window mist',
    category: 'pitch',
    description:
      'A thin, high pad an octave up with nothing low in it, into a reverb that swells up behind each note and cuts off.',
    effects: [
      { deviceId: 'pad-follower', preset: 'High mist', params: { rise: 1.57, fall: 10 } },
      { deviceId: 'shaped-reverb', preset: 'Reverse' },
    ],
  },
  {
    id: 'stairwell-choir-steeple-octave',
    name: 'Steeple octave',
    category: 'pitch',
    description:
      'A single voice an octave above the dry sound, then a tape loop that plays its layers back in reverse, into a singing cathedral.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up' },
      { deviceId: 'tape-loop', preset: 'Backwards layers', params: { length: 5.61 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 20.3, preDelay: 43.7 } },
    ],
  },
  {
    id: 'stairwell-choir-dust-mote-treble',
    name: 'Dust-mote treble',
    category: 'pitch',
    description:
      'The octave above alone, every note of a chord moved up, into a vast reverb where most of the tail climbs by octaves.',
    effects: [
      { deviceId: 'octaves', preset: 'High voice alone' },
      { deviceId: 'shimmer', preset: 'Endless ascent', params: { decay: 27, predelay: 54.8 } },
    ],
  },
  {
    id: 'stairwell-choir-octave-in-low-sun',
    name: 'Octave in low sun',
    category: 'pitch',
    description:
      'A single voice an octave above the dry sound, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { size: 59.7 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'stairwell-choir-processional-harmony',
    name: 'Processional harmony',
    category: 'pitch',
    description:
      'A third above and a sixth below a single line, in C major, then backwards swells that climb an octave on every pass.',
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds', params: { output: 7.26 } },
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { time: 1010 } },
    ],
  },
  {
    id: 'stairwell-choir-descant-octave',
    name: 'Descant octave',
    category: 'pitch',
    description:
      'A single voice an octave above the dry sound, then thin backwards repeats with their lows cut away.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { size: 64.1 } },
      { deviceId: 'reverse-delay', preset: 'Thin and airy' },
    ],
  },
  {
    id: 'stairwell-choir-one-voice-rain',
    name: 'One-voice rain',
    category: 'pitch',
    description:
      'Scattered short grains an octave up, falling like rain, then a wide fog without lows or highs that hangs for seconds.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Octave rain' },
      { deviceId: 'spectral-blur', preset: 'Band of fog' },
    ],
  },
  {
    id: 'stairwell-choir-octaves-sung-high',
    name: 'Octaves sung high',
    category: 'pitch',
    description:
      'An octave above and an octave below a single line, then a soft echo while earlier phrases drift back under it, into a thin bright reverb.',
    effects: [
      { deviceId: 'lattice', preset: 'Octaves', params: { output: 8 } },
      { deviceId: 'echo-memory', preset: 'Recalling' },
      { deviceId: 'expanse', preset: 'Thin air' },
    ],
  },
  {
    id: 'stairwell-choir-marble-finish',
    name: 'Marble finish',
    category: 'master',
    description:
      'A gentle compressor that draws loud and quiet together, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 97.8, release: 1.78 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'stairwell-choir-east-window-master',
    name: 'East-window master',
    category: 'master',
    description:
      'A subsonic cut, then a slightly wider image, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 3.21 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.36 } },
    ],
  },
  {
    id: 'stairwell-choir-lone-mixdown',
    name: 'Lone mixdown',
    category: 'master',
    description:
      'A fresh reel of tape, then an even-handed compressor, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { attack: 109, release: 1.47 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.65 } },
    ],
  },
  {
    id: 'stairwell-choir-stairwell-master',
    name: 'Stairwell master',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a gentle compressor, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'stairwell-choir-cupola-finish',
    name: 'Cupola finish',
    category: 'master',
    description:
      'A very gentle compressor that leans on the loudest swells, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'stairwell-choir-long-breath-finish',
    name: 'Long-breath finish',
    category: 'master',
    description:
      'A rumble cut and a small lift of presence, then a parallel compressor, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys', params: { clearTime: 1.39 } },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 406, release: 3.2 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
]
