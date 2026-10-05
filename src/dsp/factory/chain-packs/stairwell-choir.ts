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
      'A sharp copy on the left and a flat one on the right, into a cathedral whose long tail sings a soft open ah.',
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
      'Two full-range copies tuned further apart, reaching lower, into a huge hall whose tail hums a soft oo for a long while.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider' },
      { deviceId: 'vowel-reverb', preset: 'Endless oo', params: { preDelay: 22.3 } },
    ],
  },
  {
    id: 'stairwell-choir-top-landing-choir',
    name: 'Top-landing choir',
    category: 'space',
    description:
      'A trace of chorus on the top of the sound only, into deep voices on an ee that come in late behind each note.',
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'vowel-reverb', preset: 'Late basses' },
    ],
  },
  {
    id: 'stairwell-choir-cupola-halo',
    name: 'Cupola halo',
    category: 'space',
    description:
      'A vast reverb where most of the tail climbs by octaves, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'shimmer', preset: 'Endless ascent', params: { predelay: 60.8 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'stairwell-choir-back-pew-tail',
    name: 'Back-pew tail',
    category: 'space',
    description:
      'A thin band of tone, then a small room that sparkles two octaves above the sound, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { clearTime: 1.32 } },
      { deviceId: 'shimmer', preset: 'Sparkle room' },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 31.7 } },
    ],
  },
  {
    id: 'stairwell-choir-choir-on-the-stairs',
    name: 'Choir on the stairs',
    category: 'space',
    description:
      'A low cut with the low mids dipped and the presence lifted, into a reverb whose tail climbs an octave on every pass.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Voice' },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { decay: 7.4, predelay: 22.2 } },
    ],
  },
  {
    id: 'stairwell-choir-daybreak-halo',
    name: 'Daybreak halo',
    category: 'space',
    description:
      'A half-hidden slow swell, then a late reverb that climbs by octaves and fifths, into a plain hall with about four seconds of tail.',
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
      'A hall whose tail sways in pitch with a trace of the octave, then a second take either side, a little late and out of tune.',
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
      'The octave-climbing tail of a large reverb by itself, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'shimmer', preset: 'Rising tail alone' },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'stairwell-choir-wash-by-the-rail',
    name: 'Wash by the rail',
    category: 'space',
    description:
      'A huge bright space with a wide and very long tail, then a subsonic cut and a slow ear that eases whatever rings on.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 43.3, mix: 0.24 } },
      { deviceId: 'ambient-eq', preset: 'Master' },
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
    id: 'stairwell-choir-hall-on-sunday',
    name: 'Hall on sunday',
    category: 'space',
    description:
      'A sharp and a flat copy kept in the centre, thick not wide, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Thickener' },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 64.6, lowDecay: 3.02, midDecay: 2.42 },
      },
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
      'A wide open space with a slowly wavering tail, then a big lift of presence and air, with ringing held in check.',
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 9.63, modRate: 0.409 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.592 } },
    ],
  },
  {
    id: 'stairwell-choir-room-for-one-voice',
    name: 'Room for one voice',
    category: 'space',
    description:
      'A far-off, dulled tone, then a faint scatter of echoes just behind the sound, into a plain hall of about four seconds with no vowel in it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.42 } },
      { deviceId: 'swarm-reverb', preset: 'Faint scatter', params: { length: 0.264 } },
      { deviceId: 'vowel-reverb', preset: 'Plain hall', params: { decay: 3.53, preDelay: 17.8 } },
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
    id: 'stairwell-choir-stairwell-room',
    name: 'Stairwell room',
    category: 'space',
    description:
      'A faint short reverb with a slight upward drift, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { decay: 3.8 } },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'stairwell-choir-tiled-strings',
    name: 'Tiled strings',
    category: 'space',
    description:
      'Four strings tuned to a G major chord that ring in sympathy, into a medium hall with only a breath of a vowel in its tail.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Open triad', params: { decay: 4.53 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering' },
    ],
  },
  {
    id: 'stairwell-choir-motet-cloud',
    name: 'Motet cloud',
    category: 'space',
    description:
      'A sharp copy on the left and a flat one on the right, into a dark reverb that rises backwards and leaves a dim tail.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic' },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 2.04, preDelay: 57.7 } },
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
    id: 'stairwell-choir-open-vowel-cathedral',
    name: 'Open-vowel cathedral',
    category: 'space',
    description:
      'A subsonic cut with the low mids and presence eased a touch, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.6 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { preDelay: 89.3, lowDecay: 7.46 } },
    ],
  },
  {
    id: 'stairwell-choir-antiphon-swell',
    name: 'Antiphon swell',
    category: 'space',
    description:
      'A small room that casts a shadow an octave below, into a reverb that swells and ebbs in waves of about four seconds.',
    effects: [
      { deviceId: 'shimmer', preset: 'Low shadow', params: { decay: 2.02, predelay: 21.5 } },
      { deviceId: 'shaped-reverb', preset: 'Slow tide' },
    ],
  },
  {
    id: 'stairwell-choir-echoing-reel',
    name: 'Echoing reel',
    category: 'echo',
    description:
      'A short tape loop where each pass comes back quieter, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.92 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 28.5 } },
    ],
  },
  {
    id: 'stairwell-choir-canon-loop',
    name: 'Canon loop',
    category: 'echo',
    description:
      'A short loop at double speed, an octave up and soon gone, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Octave up', params: { length: 1.25 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 2.79, breathRate: 0.317 } },
    ],
  },
  {
    id: 'stairwell-choir-handrail-memory',
    name: 'Handrail memory',
    category: 'echo',
    description:
      'A quick slap while short glimpses of earlier notes return, into a cathedral with about six seconds of tail.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Glimpses',
        params: { time: 67, reach: 22.3, size: 0.592 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'stairwell-choir-east-window-loop',
    name: 'East-window loop',
    category: 'echo',
    description:
      'The first phrase played, looped clean and never fading, into a huge bright space with a wide and very long tail.',
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
      'A faint echo and faint recollections behind the playing, into a vast hall whose long tail sings a high bright ah.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Faint recall' },
      { deviceId: 'vowel-reverb', preset: 'High choir', params: { decay: 24.9, preDelay: 21.3 } },
    ],
  },
  {
    id: 'stairwell-choir-echoing-hold',
    name: 'Echoing hold',
    category: 'echo',
    description:
      'The first notes played, held as a wide smeared pad, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Frozen pad', params: { length: 0.982 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'stairwell-choir-hum-in-low-sun',
    name: 'Hum in low sun',
    category: 'echo',
    description:
      'A loop of the last phrase played backwards as a bed, into a huge hall whose tail hums a soft oo for a long while.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { length: 3.37 } },
      { deviceId: 'vowel-reverb', preset: 'Endless oo', params: { preDelay: 18.1 } },
    ],
  },
  {
    id: 'stairwell-choir-breath-after-vespers',
    name: 'Breath after vespers',
    category: 'echo',
    description:
      'A short loop at double speed, an octave up and soon gone, into a medium hall with only a breath of a vowel in its tail.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Octave up', params: { length: 1.12 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering' },
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
      'A blurred loop that never comes round quite the same, into faint voices singing quietly behind the sound.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Drifting' },
      { deviceId: 'vowel-reverb', preset: 'Faint voices', params: { decay: 3.77, preDelay: 20.9 } },
    ],
  },
  {
    id: 'stairwell-choir-voices-left-to-ring',
    name: 'Voices left to ring',
    category: 'echo',
    description:
      'A quick loop of about the last half second, soon faded, into a vast hall whose long tail sings a high bright ah.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Quick loop', params: { length: 0.442 } },
      { deviceId: 'vowel-reverb', preset: 'High choir' },
    ],
  },
  {
    id: 'stairwell-choir-fire-stair-echoes',
    name: 'Fire-stair echoes',
    category: 'echo',
    description:
      'Echoes that fall a fourth further on every repeat, into a huge slow wash that swells in and hangs with no dry sound.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Falling steps', params: { size: 79, delay: 367 } },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 37.6, modRate: 0.0909 } },
    ],
  },
  {
    id: 'stairwell-choir-echoing-loop',
    name: 'Echoing loop',
    category: 'echo',
    description:
      'A tape loop whose passes cross from side to side, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Crossing sides', params: { length: 1.29 } },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
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
      'An echo of single grains with gaps, so the repeats pulse, into a vast reverb where most of the tail climbs by octaves.',
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
      'A double-speed tape loop, an octave up and thin, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Octave up ghosts' },
      { deviceId: 'hall-reverb', preset: 'Bright hall' },
    ],
  },
  {
    id: 'stairwell-choir-underpass-sparkle',
    name: 'Underpass sparkle',
    category: 'echo',
    description:
      'A short loop at double speed, an octave up and soon gone, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Octave up', params: { length: 1.09 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 9.62, predelayMs: 125, breathRate: 0.313 },
      },
    ],
  },
  {
    id: 'stairwell-choir-lightwell-chirps',
    name: 'Lightwell chirps',
    category: 'echo',
    description:
      'A short loop run backwards at double speed, an octave up, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Fast reverse' },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'stairwell-choir-dust-mote-scatter',
    name: 'Dust-mote scatter',
    category: 'echo',
    description:
      'A handful of separate echoes that fall away and repeat, into a plain hall that rings for about three seconds.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Scattered' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 3.26, predelay: 15.4 } },
    ],
  },
  {
    id: 'stairwell-choir-psalm-loop',
    name: 'Psalm loop',
    category: 'echo',
    description:
      'A quick loop of about the last half second, soon faded, then a low cut that thins the bass, with a little air on top.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Quick loop', params: { length: 0.555 } },
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.43 } },
    ],
  },
  {
    id: 'stairwell-choir-concrete-trace',
    name: 'Concrete trace',
    category: 'echo',
    description:
      'A faint echo and faint recollections behind the playing, then echoes that climb an octave on every repeat.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Faint recall',
        params: { time: 445, reach: 21.2, size: 1.93 },
      },
      { deviceId: 'pitch-shifter', preset: 'Rising steps', params: { size: 65, delay: 357 } },
    ],
  },
  {
    id: 'stairwell-choir-one-voice-echo',
    name: 'One-voice echo',
    category: 'echo',
    description:
      'Whole phrases played backwards about four seconds later, into a hall heard from far off with little dry sound left.',
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
    id: 'stairwell-choir-sung-over-mirror',
    name: 'Sung-over mirror',
    category: 'echo',
    description:
      'A short swell that rounds the front off every note, then a backwards echo of each phrase, swelling in and cut off.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 153, release: 85.8 } },
      { deviceId: 'reverse-delay', preset: 'Backwards echo' },
    ],
  },
  {
    id: 'stairwell-choir-introit-bounce',
    name: 'Introit bounce',
    category: 'echo',
    description:
      'A plain echo whose repeats bounce from side to side, then a low cut with the low mids dipped and the presence lifted.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Side to side',
        params: { time: 305, reach: 18, size: 3.21 },
      },
      { deviceId: 'ambient-eq', preset: 'Voice', params: { clearTime: 1.54 } },
    ],
  },
  {
    id: 'stairwell-choir-marble-harp',
    name: 'Marble harp',
    category: 'echo',
    description:
      'Each note answered by a rising pentatonic run of echoes, into a reverb that breathes in slow waves over and over.',
    effects: [
      { deviceId: 'lattice', preset: 'Pentatonic harp', params: { output: 5.63 } },
      { deviceId: 'shaped-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'stairwell-choir-luminous-sparkle',
    name: 'Luminous sparkle',
    category: 'echo',
    description:
      'A short loop at double speed, an octave up and soon gone, into a small tank that goes on ringing for seconds.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Octave up', params: { length: 1.3 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank' },
    ],
  },
  {
    id: 'stairwell-choir-silo-hold',
    name: 'Silo hold',
    category: 'tape',
    description:
      'The first phrase played, looped clean and never fading, then a fresh reel of tape, open on top and nearly steady.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Clean hold', params: { length: 1.79 } },
      { deviceId: 'patina', preset: 'New tape' },
    ],
  },
  {
    id: 'stairwell-choir-steeple-tape',
    name: 'Steeple tape',
    category: 'tape',
    description:
      'A clean pass over fast new tape, with nothing added, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Clean transfer' },
      {
        deviceId: 'hall-reverb',
        preset: 'Vast nave',
        params: { preDelay: 87.8, lowDecay: 7.3, midDecay: 7.75 },
      },
    ],
  },
  {
    id: 'stairwell-choir-concrete-reel',
    name: 'Concrete reel',
    category: 'tape',
    description:
      'A reel of tape at middle speed, with a little drift and hiss, then a plain echo that is a little darker on each repeat.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'echo-memory', preset: 'Plain echo' },
    ],
  },
  {
    id: 'stairwell-choir-clear-voiced-deck',
    name: 'Clear-voiced deck',
    category: 'tape',
    description:
      'A soft echo while earlier phrases drift back under it, then a fast steady reel, into a huge space that answers in separate far-off echoes.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Recalling',
        params: { time: 508, reach: 22, size: 2.67 },
      },
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 21.9, modRate: 0.252 } },
    ],
  },
  {
    id: 'stairwell-choir-drift-under-a-dome',
    name: 'Drift under a dome',
    category: 'tape',
    description:
      'A slow tape chorus, then the soft air of an open microphone under the sound, into a huge wash by itself.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'noise-floor', preset: 'Close mic', params: { response: 0.416, hold: 10.4 } },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 38.6, modRate: 0.0941 } },
    ],
  },
  {
    id: 'stairwell-choir-a-cappella-drift',
    name: 'A-cappella drift',
    category: 'tape',
    description:
      'A drifting reel laid half against the dry sound, a chorus, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 38.3, lowDecay: 2.14, midDecay: 3.36 },
      },
    ],
  },
  {
    id: 'stairwell-choir-soprano-organ',
    name: 'Soprano organ',
    category: 'motion',
    description:
      'Four octaves of pipes that swell in behind each note, then a rotating speaker on its slow speed, into a long undamped tail.',
    effects: [
      { deviceId: 'octaves', preset: 'Cathedral' },
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 33.7, mix: 0.12 } },
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
    id: 'stairwell-choir-glow-in-a-round',
    name: 'Glow in a round',
    category: 'motion',
    description:
      'High octaves that fade in late above each note, then a rotating speaker on its slow speed, into a slowly sliding cave.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo', params: { attack: 0.767 } },
      { deviceId: 'rotary', preset: 'Chorale' },
      {
        deviceId: 'swarm-reverb',
        preset: 'Slow stretch',
        params: { length: 0.679, glide: 4.44, mix: 0.24 },
      },
    ],
  },
  {
    id: 'stairwell-choir-choir-left-to-ring',
    name: 'Choir left to ring',
    category: 'motion',
    description:
      'A long tail that wavers in pitch like an unsteady choir, then a wide cloud whose grains jump by fifths and octaves.',
    effects: [
      { deviceId: 'expanse', preset: 'Seasick choir' },
      { deviceId: 'grain-cloud', preset: 'Choir of fifths' },
    ],
  },
  {
    id: 'stairwell-choir-balustrade-sway',
    name: 'Balustrade sway',
    category: 'motion',
    description:
      'A long tail that wavers in pitch like an unsteady choir, into a rush of short echoes that piles up into a cavern.',
    effects: [
      { deviceId: 'expanse', preset: 'Seasick choir', params: { decay: 16.9, modRate: 1.67 } },
      { deviceId: 'swarm-reverb', preset: 'Cavern' },
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
    id: 'stairwell-choir-three-flight-drift',
    name: 'Three-flight drift',
    category: 'motion',
    description:
      'A choir of a hall whose vowel wanders on its own, into eight strings in C major that ring on as under a held pedal.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Vowel drift' },
      { deviceId: 'sympathetic', preset: 'Piano pedal' },
    ],
  },
  {
    id: 'stairwell-choir-long-breath-horizon',
    name: 'Long-breath horizon',
    category: 'texture',
    description:
      'A reverse-sounding swell, then a long-hanging wide wash, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Backwards' },
      { deviceId: 'spectral-blur', preset: 'Endless' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 5.06 } },
    ],
  },
  {
    id: 'stairwell-choir-halo-in-a-dry-pool',
    name: 'Halo in a dry pool',
    category: 'texture',
    description:
      'A slow compressor that evens out swells over seconds, then a thin halo of held sound, into a plain hall that rings for about three seconds.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 281, release: 2.13 } },
      { deviceId: 'sustainer', preset: 'Thin halo', params: { attack: 0.932, glide: 0.9 } },
      { deviceId: 'shimmer', preset: 'Plain hall' },
    ],
  },
  {
    id: 'stairwell-choir-bloom-on-a-landing',
    name: 'Bloom on a landing',
    category: 'texture',
    description:
      'A late-blooming slow swell, then layers of held chords that bloom slowly and never fade, into a plain medium hall.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1480, release: 723 } },
      { deviceId: 'sustainer', preset: 'Slow bloom layers', params: { glide: 4.78 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 3.24, predelay: 14.1 } },
    ],
  },
  {
    id: 'stairwell-choir-top-step-pedal',
    name: 'Top-step pedal',
    category: 'texture',
    description:
      'A compressor as slow as a hand on a fader, then a clean, unsmeared sustain, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Slow fader',
        params: { attack: 2920, release: 19.5, makeup: -0.622 },
      },
      { deviceId: 'spectral-blur', preset: 'Clean sustain' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'stairwell-choir-lone-hold',
    name: 'Lone hold',
    category: 'texture',
    description:
      'A held pad alone, in place of the sound that was played, into a bright wide chamber that is over in about a second.',
    effects: [
      { deviceId: 'sustainer', preset: 'Held sound alone' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'stairwell-choir-glitter-in-a-sunbeam',
    name: 'Glitter in a sunbeam',
    category: 'texture',
    description:
      'A firm, slow compressor that keeps long swells held down, then sparse short grains two octaves up, after each note, into an undamped hall.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
      { deviceId: 'grain-delay', preset: 'High glitter' },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 2.84, breathRate: 0.306 } },
    ],
  },
  {
    id: 'stairwell-choir-sheen-sung-high',
    name: 'Sheen sung high',
    category: 'texture',
    description:
      'A grainy octave and twelfth above, thickened by feedback, then an equaliser that adds lows and body and eases the top.',
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Shimmer',
        params: { size: 40.7, delay: 38.5, mix: 0.24 },
      },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.35 } },
    ],
  },
  {
    id: 'stairwell-choir-pad-either-side',
    name: 'Pad either side',
    category: 'texture',
    description:
      'The first notes played, held as a wide smeared pad, into a plain hall that rings for about three seconds.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Frozen pad' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 3.5, predelay: 16.8 } },
    ],
  },
  {
    id: 'stairwell-choir-newel-post-layers',
    name: 'Newel-post layers',
    category: 'texture',
    description:
      'Layers of held chords that bloom slowly and never fade, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow bloom layers',
        params: { attack: 4.9, glide: 4.41, mix: 0.393 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 289, modRate: 0.802, mix: 0.24 },
      },
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
    id: 'stairwell-choir-sunbeam-harp',
    name: 'Sunbeam harp',
    category: 'pitch',
    description:
      'A rising pentatonic run, then a tape loop whose passes cross from side to side, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'lattice', preset: 'Pentatonic harp' },
      { deviceId: 'tape-loop', preset: 'Crossing sides' },
      { deviceId: 'ether-reverb', preset: 'Cathedral' },
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
    id: 'stairwell-choir-vespers-shimmer',
    name: 'Vespers shimmer',
    category: 'pitch',
    description:
      'A grainy octave sheen, then a quick slap while short glimpses of earlier notes return, into a late-arriving hall.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Shimmer' },
      {
        deviceId: 'echo-memory',
        preset: 'Glimpses',
        params: { time: 68.2, reach: 19.4, size: 0.663 },
      },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { predelayMs: 179 } },
    ],
  },
  {
    id: 'stairwell-choir-offertory-fifths',
    name: 'Offertory fifths',
    category: 'pitch',
    description:
      'A wide, slightly detuned fifth above held chords, into a huge hall whose tail hums a soft oo for a long while.',
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
      'High octaves that fade in late above each note, then a slow tape echo with a long trail that dulls as it goes, into a hall on its own.',
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
    id: 'stairwell-choir-spiral-stair-octaves',
    name: 'Spiral-stair octaves',
    category: 'pitch',
    description:
      'A compressor as slow as a hand on a fader, then a copy two octaves down, into a reverb that rises backwards for about four seconds.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { attack: 2930 } },
      { deviceId: 'half-speed', preset: 'Two octaves' },
      { deviceId: 'shaped-reverb', preset: 'Long rise', params: { time: 3.58 } },
    ],
  },
  {
    id: 'stairwell-choir-sparkle-off-concrete',
    name: 'Sparkle off concrete',
    category: 'pitch',
    description:
      'A soft wash of octave and fifth loops over each note, into a reverb that swells and ebbs in waves of about four seconds.',
    effects: [
      { deviceId: 'cascade', preset: 'Sparkle bed', params: { time: 359 } },
      { deviceId: 'shaped-reverb', preset: 'Slow tide' },
    ],
  },
  {
    id: 'stairwell-choir-fire-stair-glass',
    name: 'Fire-stair glass',
    category: 'pitch',
    description:
      'Backwards swells that climb an octave on every pass, then a heavy low shelf that puts weight under the sound.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.65 } },
    ],
  },
  {
    id: 'stairwell-choir-back-pew-bass',
    name: 'Back-pew bass',
    category: 'pitch',
    description:
      'One voice an octave below a single line, as loud as the line, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'lattice', preset: 'Sub octave', params: { output: 3.68 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'stairwell-choir-descant-glints',
    name: 'Descant glints',
    category: 'pitch',
    description:
      'Faint high grains, then a plain echo whose repeats bounce from side to side, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints' },
      { deviceId: 'echo-memory', preset: 'Side to side' },
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
    ],
  },
  {
    id: 'stairwell-choir-top-step-drone',
    name: 'Top-step drone',
    category: 'pitch',
    description:
      'Copies of each note re-pitched to a fixed C and the G below, then a wide wash of octave loops with no dry sound left in it.',
    effects: [
      { deviceId: 'lattice', preset: 'Two note drone', params: { output: 7.11 } },
      { deviceId: 'cascade', preset: 'Only the echoes', params: { time: 680 } },
    ],
  },
  {
    id: 'stairwell-choir-one-voice-glass',
    name: 'One-voice glass',
    category: 'pitch',
    description:
      'Backwards swells that climb an octave on every pass, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass' },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 21.4, preDelay: 39.4 } },
    ],
  },
  {
    id: 'stairwell-choir-tall-window-mist',
    name: 'Tall-window mist',
    category: 'pitch',
    description:
      'A thin, high pad an octave up with nothing low in it, into a reverb that grows backwards behind each note and cuts off.',
    effects: [
      { deviceId: 'pad-follower', preset: 'High mist', params: { rise: 1.57, fall: 10 } },
      { deviceId: 'shaped-reverb', preset: 'Reverse' },
    ],
  },
  {
    id: 'stairwell-choir-glints-sung-twice',
    name: 'Glints sung twice',
    category: 'pitch',
    description:
      'Faint grains an octave and a fifth up, behind the playing, then detuned copies of the highs only, the body left as it was.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints' },
      { deviceId: 'stereo-detune', preset: 'Top only' },
    ],
  },
  {
    id: 'stairwell-choir-hummed-chamber',
    name: 'Hummed chamber',
    category: 'master',
    description:
      'A tight chamber close round the sound for about a second, then a low ceiling that lets go quickly, so loud passages breathe.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { preDelay: 22 } },
      { deviceId: 'ambient-limiter', preset: 'Breathing', params: { release: 0.28, gain: -0.167 } },
    ],
  },
  {
    id: 'stairwell-choir-banister-glue',
    name: 'Banister glue',
    category: 'master',
    description:
      'A mid-forward tone, then a quicker compressor, then a true-peak ceiling with the level eased back before it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'ambient-comp', preset: 'Mic' },
      { deviceId: 'ambient-limiter', preset: 'Pull back', params: { release: 1.37, gain: 2.19 } },
    ],
  },
  {
    id: 'stairwell-choir-wordless-glue',
    name: 'Wordless glue',
    category: 'master',
    description:
      'A fast compressor that takes the spike off plucked notes, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { release: 0.162 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -4.26 } },
    ],
  },
  {
    id: 'stairwell-choir-vocalise-crunch',
    name: 'Vocalise crunch',
    category: 'master',
    description:
      'Soft clipping, mixed low, then a scooped, hollow tone, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'saturator', preset: 'Drum bus crunch' },
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.42 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.4 } },
    ],
  },
  {
    id: 'stairwell-choir-fader-two-floors-up',
    name: 'Fader two floors up',
    category: 'master',
    description:
      'A low cut and a low-mid dip, then a slow levelling compressor, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Layer' },
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'stairwell-choir-stair-foot-room',
    name: 'Stair-foot room',
    category: 'master',
    description:
      'A small room that is over in about a second, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { preDelay: 33.7, lowDecay: 1.47, midDecay: 1.16 },
      },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
]
