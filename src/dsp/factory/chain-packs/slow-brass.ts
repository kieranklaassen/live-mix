// Austin Slow Brass: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'slow-brass-after-hours-plate',
    name: 'After-hours plate',
    category: 'space',
    description:
      'A first-note swell, then a high cut set low enough to muffle everything, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'swell', preset: 'First note only', params: { attack: 1550, release: 1680 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 39.2 } },
    ],
  },
  {
    id: 'slow-brass-two-guitar-nave',
    name: 'Two-guitar nave',
    category: 'space',
    description:
      'A half-deep swell, then an equaliser that adds lows and body and eases the top, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick', params: { attack: 539, release: 158 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'slow-brass-hall-in-still-air',
    name: 'Hall in still air',
    category: 'space',
    description:
      'A very slow swell, then an equaliser that adds lows and body and eases the top, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier' },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.58 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 56, midDecay: 2.14 },
      },
    ],
  },
  {
    id: 'slow-brass-heat-haze-plate',
    name: 'Heat-haze plate',
    category: 'space',
    description:
      'A very slow swell, then a big lift of the low end, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier', params: { attack: 4420, release: 1860 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.81 } },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'slow-brass-water-tower-sheen',
    name: 'Water-tower sheen',
    category: 'space',
    description:
      'A short, soft tape echo close behind the playing, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 141 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'slow-brass-rehearsal-plate',
    name: 'Rehearsal plate',
    category: 'space',
    description:
      'A dark plate whose tail is soft on top, then a low cut that thins the bass, with a little air on top.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 16.1 } },
      { deviceId: 'ambient-eq', preset: 'Texture' },
    ],
  },
  {
    id: 'slow-brass-hall-till-morning',
    name: 'Hall till morning',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.64 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 8.24, breathRate: 0.177 } },
    ],
  },
  {
    id: 'slow-brass-waiting-room-hall',
    name: 'Waiting-room hall',
    category: 'space',
    description:
      'A hard-clipped copy held at one level under the clean sound, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Sustain bed' },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'slow-brass-choir-in-the-eaves',
    name: 'Choir in the eaves',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, into a hall of deep voices that sing ee late behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.33 } },
      { deviceId: 'vowel-reverb', preset: 'Late basses', params: { decay: 6.89, preDelay: 188 } },
    ],
  },
  {
    id: 'slow-brass-fire-door-hall',
    name: 'Fire-door hall',
    category: 'space',
    description:
      'A smooth swell that brings every note in like bowed strings, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'swell', preset: 'String section' },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'slow-brass-muted-fog',
    name: 'Muted fog',
    category: 'space',
    description:
      'A dull reverb that swells in over seconds and fades slowly, then a parallel compressor that lifts quiet playing and tails.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
      {
        deviceId: 'ambient-comp',
        preset: 'Lift',
        params: { attack: 438, release: 3.05, makeup: 11.3 },
      },
    ],
  },
  {
    id: 'slow-brass-borrowed-bloom',
    name: 'Borrowed bloom',
    category: 'space',
    description:
      'A large space whose tail swells in behind each note, then two copies in tune that wander like extra takes.',
    effects: [
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 12.4, modRate: 0.31 } },
      { deviceId: 'stereo-detune', preset: 'Drifting' },
    ],
  },
  {
    id: 'slow-brass-unlit-undertow',
    name: 'Unlit undertow',
    category: 'space',
    description:
      'A small plate that is gone in a second or two, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 9.83 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 54.3, midDecay: 2.09 },
      },
    ],
  },
  {
    id: 'slow-brass-proscenium-vault',
    name: 'Proscenium vault',
    category: 'space',
    description:
      'A bowed swell that lets part of each attack through, then a mid-forward tone, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 314, release: 140 } },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.61 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 82.7, lowDecay: 7.74, midDecay: 6.12 },
      },
    ],
  },
  {
    id: 'slow-brass-fermata-hall',
    name: 'Fermata hall',
    category: 'space',
    description:
      'A seconds-long swell, then a high cut set low enough to muffle everything, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2330, release: 632 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.41 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'slow-brass-hall-on-the-ward',
    name: 'Hall on the ward',
    category: 'space',
    description:
      'A hall whose lows outlast its damped top, then a big lift of the low end that puts weight under the sound.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'slow-brass-hall-all-evening',
    name: 'Hall all evening',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, then a short room fed in pulses about twice a second, into a far-off hall.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'fdn-reverb', preset: 'Pulsing gate', params: { decay: 1.43 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 4.57, midDecay: 4.04 } },
    ],
  },
  {
    id: 'slow-brass-valley-nodding-off',
    name: 'Valley nodding off',
    category: 'space',
    description:
      'A trace of dull detuned copies at the edges, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Faint width', params: { delay: 12.2 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 10.5, predelayMs: 131, breathRate: 0.309 },
      },
    ],
  },
  {
    id: 'slow-brass-drowsy-hall',
    name: 'Drowsy hall',
    category: 'space',
    description:
      'A thin veil of reverb kept low under the sound, into a plain hall that rings for about three seconds.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
      { deviceId: 'shimmer', preset: 'Plain hall' },
    ],
  },
  {
    id: 'slow-brass-august-hall',
    name: 'August hall',
    category: 'space',
    description:
      'A hot console channel, forward in the upper mids, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel', params: { output: -20.1 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 21.2 } },
    ],
  },
  {
    id: 'slow-brass-back-row-hall',
    name: 'Back-row hall',
    category: 'space',
    description:
      'A small room that casts a shadow an octave below, into a plain hall of about four seconds.',
    effects: [
      { deviceId: 'shimmer', preset: 'Low shadow', params: { predelay: 22 } },
      { deviceId: 'vowel-reverb', preset: 'Plain hall' },
    ],
  },
  {
    id: 'slow-brass-lights-off-echoes',
    name: 'Lights-off echoes',
    category: 'space',
    description:
      'A huge space that answers in separate far-off echoes, then a thin band of tone with the lows cut and the top rolled off.',
    effects: [
      { deviceId: 'expanse', preset: 'Far echoes' },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { clearTime: 1.63 } },
    ],
  },
  {
    id: 'slow-brass-floorboard-tide',
    name: 'Floorboard tide',
    category: 'space',
    description:
      'A quick fade-in that only softens the edge of each note, into a long reverb that comes and goes in waves, over and over.',
    effects: [
      { deviceId: 'swell', preset: 'Soft pick' },
      { deviceId: 'shaped-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'slow-brass-muted-cathedral',
    name: 'Muted cathedral',
    category: 'space',
    description:
      'A sharp copy hard left, a flat one hard right, heard alone, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 30.3, modRate: 0.0948 } },
    ],
  },
  {
    id: 'slow-brass-swell-at-the-door',
    name: 'Swell at the door',
    category: 'space',
    description:
      'A reel driven as hard as it goes, thick with harmonics, into a reverb that rises for about four seconds behind each note.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'shaped-reverb', preset: 'Long rise', params: { time: 3.63 } },
    ],
  },
  {
    id: 'slow-brass-hot-night-depths',
    name: 'Hot-night depths',
    category: 'space',
    description:
      'A large reverb whose tail sinks an octave on every pass, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'shimmer', preset: 'Undertow', params: { decay: 10.6, predelay: 21.7 } },
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 13.7 } },
    ],
  },
  {
    id: 'slow-brass-cave-in-still-air',
    name: 'Cave in still air',
    category: 'space',
    description:
      'A gentle high cut that shades the top end, then a tiny boxy room, into a cave whose echoes bend slowly up and down in pitch.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.33 } },
      { deviceId: 'expanse', preset: 'Small box', params: { modRate: 0.425 } },
      { deviceId: 'swarm-reverb', preset: 'Bending' },
    ],
  },
  {
    id: 'slow-brass-hall-in-the-heat',
    name: 'Hall in the heat',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.57 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3.9, breathRate: 0.317 } },
    ],
  },
  {
    id: 'slow-brass-night-shift-loop',
    name: 'Night-shift loop',
    category: 'echo',
    description:
      'A half-speed loop that plays the last phrase an octave down, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 2.79 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall' },
    ],
  },
  {
    id: 'slow-brass-patient-phrase',
    name: 'Patient phrase',
    category: 'echo',
    description:
      'Whole phrases coming back three times, each one duller, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 'cascade', preset: 'Phrase returns' },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'slow-brass-sleepless-swells',
    name: 'Sleepless swells',
    category: 'echo',
    description:
      'A reel driven as hard as it goes, thick with harmonics, then slow backwards swells that rise and die behind the playing.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned', params: { output: -3 } },
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1800 } },
    ],
  },
  {
    id: 'slow-brass-echo-from-the-end',
    name: 'Echo from the end',
    category: 'echo',
    description:
      'A valve stage that gives way under loud notes, tails rising, then a backwards echo, into a deep dark well of slow blurred echoes.',
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom' },
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 579 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well' },
    ],
  },
  {
    id: 'slow-brass-vestry-echo',
    name: 'Vestry echo',
    category: 'echo',
    description:
      'Backwards grains of each phrase, repeating as they fade, then a gentle high cut that shades the top end.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Backwards shards' },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.36 } },
    ],
  },
  {
    id: 'slow-brass-screen-door-loop',
    name: 'Screen-door loop',
    category: 'echo',
    description:
      'A gentle high cut that shades the top end, then a half-speed tape loop that returns an octave down and dull.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 7.83 } },
    ],
  },
  {
    id: 'slow-brass-echo-by-the-exit',
    name: 'Echo by the exit',
    category: 'echo',
    description:
      'Backwards repeats that step down an octave each time, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Descending steps', params: { time: 438 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 8.07, breathRate: 0.196 } },
    ],
  },
  {
    id: 'slow-brass-echoes-after-closing',
    name: 'Echoes after closing',
    category: 'echo',
    description:
      'A handful of separate echoes that fall away and repeat, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Scattered', params: { time: 2.19 } },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'slow-brass-stage-door-hiss',
    name: 'Stage-door hiss',
    category: 'tape',
    description:
      'A pad that glides slowly, then a thin, even trace of tape hiss, heard in the pauses, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'sustainer', preset: 'Long glide', params: { attack: 1.55, glide: 4.96 } },
      { deviceId: 'noise-floor', preset: 'Faint hiss', params: { response: 0.384, hold: 10.9 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'slow-brass-drift-by-lamplight',
    name: 'Drift by lamplight',
    category: 'tape',
    description:
      'The first hint of weight from a tape preamp, then a slow tape chorus, into a clean speaker at the far end of a big, echoing room.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 're-amp', preset: 'Far end of the hall' },
    ],
  },
  {
    id: 'slow-brass-tape-left-running',
    name: 'Tape left running',
    category: 'tape',
    description:
      'A four-track cassette, then the low hum of an amplifier left switched on, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { response: 0.43, hold: 33.7 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.43 } },
    ],
  },
  {
    id: 'slow-brass-thunderhead-cassette',
    name: 'Thunderhead cassette',
    category: 'tape',
    description:
      'A few decibels of soft saturation with the top eased, then a muffled cassette, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'tape', preset: 'Under a blanket', params: { output: -8.23 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'slow-brass-cassette-at-the-door',
    name: 'Cassette at the door',
    category: 'tape',
    description:
      'A driven valve amplifier, then a four-track cassette, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 're-amp', preset: 'Just the valves' },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'expanse', preset: 'Far echoes' },
    ],
  },
  {
    id: 'slow-brass-reel-nodding-off',
    name: 'Reel nodding off',
    category: 'tape',
    description:
      'A dark amplifier stack with the bass full up and no treble, then a fast, steady reel with soft saturation, into a huge wash by itself.',
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly' },
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'expanse', preset: 'Wash alone' },
    ],
  },
  {
    id: 'slow-brass-house-lights-tape',
    name: 'House-lights tape',
    category: 'tape',
    description:
      'Tape-style saturation that rounds only the loudest peaks, then a lightly worn reel, into a huge open valley.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
    ],
  },
  {
    id: 'slow-brass-dog-days-tape',
    name: 'Dog-days tape',
    category: 'tape',
    description:
      'A warm amplifier stack, then a thick, soft cassette, full in the lows and dull on top, into a far-off hall.',
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack' },
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'slow-brass-noise-left-running',
    name: 'Noise left running',
    category: 'tape',
    description:
      'A held pad where each new chord piles onto the last, then the low, wide rumble of an empty room, into a big muffled cave.',
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony', params: { attack: 0.568, glide: 0.72 } },
      { deviceId: 'noise-floor', preset: 'Empty room' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 5.94, breathRate: 0.297 } },
    ],
  },
  {
    id: 'slow-brass-hiss-for-two',
    name: 'Hiss for two',
    category: 'tape',
    description:
      'A long clear sustain that holds each note for seconds, then dull, thick tape hiss, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Long clean hold' },
      { deviceId: 'noise-floor', preset: 'Muffled hiss', params: { response: 0.372, hold: 12.9 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 20.7, mix: 0.236 } },
    ],
  },
  {
    id: 'slow-brass-left-on-hiss',
    name: 'Left-on hiss',
    category: 'tape',
    description:
      'A held pad where each new chord piles onto the last, then a trace of tape hiss, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony', params: { attack: 0.672, glide: 0.757 } },
      { deviceId: 'noise-floor', preset: 'Faint hiss', params: { response: 0.449, hold: 10.7 } },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'slow-brass-backstage-reel',
    name: 'Backstage reel',
    category: 'tape',
    description:
      'A tape reel pushed hard, saturated and thick, into a plain room that is gone in a couple of seconds.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'bloom-reverb', preset: 'Still room' },
    ],
  },
  {
    id: 'slow-brass-tide-before-rain',
    name: 'Tide before rain',
    category: 'motion',
    description:
      'A low-pass that opens and closes over about half a minute, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 38.9, lowDecay: 2.24, midDecay: 2.82 },
      },
    ],
  },
  {
    id: 'slow-brass-tide-at-the-back',
    name: 'Tide at the back',
    category: 'motion',
    description:
      'A slow phasing drift that turns over every few seconds, into a long blurred cave that slides slowly between intervals.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift' },
      { deviceId: 'swarm-reverb', preset: 'Slow stretch', params: { length: 0.655, glide: 4.38 } },
    ],
  },
  {
    id: 'slow-brass-backstage-drift',
    name: 'Backstage drift',
    category: 'motion',
    description:
      'Two copies in tune that wander like extra takes, then a big lift of the low end that puts weight under the sound.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Drifting' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.76 } },
    ],
  },
  {
    id: 'slow-brass-sway-in-the-wings',
    name: 'Sway in the wings',
    category: 'motion',
    description:
      'A chorus heard alone, its detuned copies spread hard apart, then a slow pan from side to side, a few seconds each way.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.341, delayMs: 14.4 } },
      { deviceId: 'tremolo', preset: 'Slow pan' },
    ],
  },
  {
    id: 'slow-brass-chorus-on-the-porch',
    name: 'Chorus on the porch',
    category: 'motion',
    description:
      'Dark, thick valve grit, then a full chorus spread wide to left and right, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'chorus', preset: 'Wide chorus' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 55, lowDecay: 4.1, midDecay: 2.78 },
      },
    ],
  },
  {
    id: 'slow-brass-lights-off-chorus',
    name: 'Lights-off chorus',
    category: 'motion',
    description:
      'A late copy on each side, like the same part played twice, then a gentle high cut that shades the top end.',
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { rate: 0.196, delayMs: 29.7 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.59 } },
    ],
  },
  {
    id: 'slow-brass-second-desk-drift',
    name: 'Second-desk drift',
    category: 'motion',
    description:
      'A quick fade-in that only softens the edge of each note, then a slow flanger-like sweep, opposite on each side.',
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 39.9, release: 64.8 } },
      { deviceId: 'tremolo', preset: 'Drifting comb' },
    ],
  },
  {
    id: 'slow-brass-cedar-pad',
    name: 'Cedar pad',
    category: 'texture',
    description:
      'A short swell that rounds the front off every note, then a held pad that swells in slowly like bowed strings, into a dull mono tunnel.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'sustainer', preset: 'Slow strings' },
      { deviceId: 'expanse', preset: 'Narrow tunnel' },
    ],
  },
  {
    id: 'slow-brass-wash-in-no-hurry',
    name: 'Wash in no hurry',
    category: 'texture',
    description:
      'A very slow swell, then a very wide wash in which every note hangs for many seconds, into a slow tide of reverb.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier' },
      { deviceId: 'spectral-blur', preset: 'Endless' },
      { deviceId: 'shaped-reverb', preset: 'Slow tide' },
    ],
  },
  {
    id: 'slow-brass-strings-between-sets',
    name: 'Strings between sets',
    category: 'texture',
    description:
      'A slow breathing level, then a slow-swelling string pad, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 3.8, fall: 7.65 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 57.2 } },
    ],
  },
  {
    id: 'slow-brass-bloom-between-sets',
    name: 'Bloom between sets',
    category: 'texture',
    description:
      'Layers of held chords that bloom slowly and never fade, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow bloom layers', params: { attack: 4.9 } },
      { deviceId: 'tape', preset: 'Seasick', params: { output: -2.31 } },
    ],
  },
  {
    id: 'slow-brass-velvet-wash',
    name: 'Velvet wash',
    category: 'texture',
    description:
      'A late swell on every note like a rocked volume pedal, then a slowly dissolving wash, into a quiet late plate.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 98.4 } },
    ],
  },
  {
    id: 'slow-brass-water-tower-wash',
    name: 'Water-tower wash',
    category: 'texture',
    description:
      'A wide, darkened wash in which every note slowly dissolves, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.42 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.21 } },
    ],
  },
  {
    id: 'slow-brass-unlit-strings',
    name: 'Unlit strings',
    category: 'texture',
    description:
      'A muffled, slow-fading string pad with its top taken off, then a big lift of the low end that puts weight under the sound.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Felted pad', params: { rise: 0.731, fall: 11.5 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.71 } },
    ],
  },
  {
    id: 'slow-brass-rosin-undertow',
    name: 'Rosin undertow',
    category: 'texture',
    description:
      'A transformer that fills out the lows and dulls the top, then dark backwards loops of each note and its octave below.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'cascade', preset: 'Undertow', params: { time: 552 } },
    ],
  },
  {
    id: 'slow-brass-after-hours-tide',
    name: 'After-hours tide',
    category: 'texture',
    description:
      'A string pad that arrives long after the chord and stays, then a thick, soft cassette, full in the lows and dull on top.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Late tide', params: { rise: 5.6 } },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'slow-brass-limestone-depths',
    name: 'Limestone depths',
    category: 'texture',
    description:
      'A swell that takes seconds to rise after each silence, then a blurred bed of bass that hangs low under the sound.',
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
    ],
  },
  {
    id: 'slow-brass-hill-country-strings',
    name: 'Hill-country strings',
    category: 'texture',
    description:
      'A soft string pad that swells in behind what is played, into a cave whose echoes bend slowly up and down in pitch.',
    effects: [
      { deviceId: 'pad-follower', preset: 'String pad' },
      { deviceId: 'swarm-reverb', preset: 'Bending', params: { length: 0.541, glide: 2.02 } },
    ],
  },
  {
    id: 'slow-brass-night-ward-drone',
    name: 'Night-ward drone',
    category: 'texture',
    description:
      'A dark, round pad that melts slowly from chord to chord, then a scooped tone with lows and highs up and the body down.',
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 1.14, glide: 2.59 } },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'slow-brass-unhurried-haze',
    name: 'Unhurried haze',
    category: 'texture',
    description:
      'A dark smear of long grains that trails for many seconds, into a dark cellar of a room that folds the sound to mono.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Dark slow smear', params: { time: 1650 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar' },
    ],
  },
  {
    id: 'slow-brass-wash-by-lamplight',
    name: 'Wash by lamplight',
    category: 'texture',
    description:
      'A string-like swell, then a dark, bassy wash, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 373, release: 587 } },
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.384 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 15.1, modRate: 0.271, mix: 0.24 } },
    ],
  },
  {
    id: 'slow-brass-small-hours-sustain',
    name: 'Small-hours sustain',
    category: 'texture',
    description:
      'A dark low-pass that each note nudges open a moment late, then a clear sustain on each note, into a vast nave.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Soft bloom' },
      { deviceId: 'spectral-blur', preset: 'Clean sustain' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { midDecay: 7.57 } },
    ],
  },
  {
    id: 'slow-brass-creek-bed-pad',
    name: 'Creek-bed pad',
    category: 'texture',
    description:
      'A half-hidden slow swell, then a held pad that swells in slowly like bowed strings, into a hall with long lows.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1440, release: 280 } },
      { deviceId: 'sustainer', preset: 'Slow strings', params: { attack: 2.02, glide: 1.41 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 64.5, lowDecay: 7.56, midDecay: 2.2 },
      },
    ],
  },
  {
    id: 'slow-brass-vestry-haze',
    name: 'Vestry haze',
    category: 'texture',
    description:
      'A long bowed swell, then a hanging mist of overtones, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'spectral-blur', preset: 'Hanging mist' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'slow-brass-echoes-in-the-pit',
    name: 'Echoes in the pit',
    category: 'texture',
    description:
      'Sparse stray grains of things played seconds earlier, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Stray memories', params: { size: 245, density: 1.36 } },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.46 } },
    ],
  },
  {
    id: 'slow-brass-memory-between-sets',
    name: 'Memory between sets',
    category: 'texture',
    description:
      'A quick slapback echo over short glimpses of earlier notes, then an equaliser that takes presence, air and lows away.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Glimpses' },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.39 } },
    ],
  },
  {
    id: 'slow-brass-fermata-drone',
    name: 'Fermata drone',
    category: 'texture',
    description:
      'A slow swell after each silence that leaves some attack in, then a dark, round pad that melts slowly from chord to chord.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow' },
      { deviceId: 'sustainer', preset: 'Dark bed' },
    ],
  },
  {
    id: 'slow-brass-two-guitar-wash',
    name: 'Two-guitar wash',
    category: 'texture',
    description:
      'A transformer that fills out the lows and dulls the top, then a wide, darkened wash in which every note slowly dissolves.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth', params: { output: -9.89 } },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve' },
    ],
  },
  {
    id: 'slow-brass-unhurried-wash',
    name: 'Unhurried wash',
    category: 'texture',
    description:
      'A very wide wash in which every note hangs for many seconds, then a low-pass that opens and closes over about half a minute.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless', params: { mix: 0.45 } },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
    ],
  },
  {
    id: 'slow-brass-velvet-afterglow',
    name: 'Velvet afterglow',
    category: 'texture',
    description:
      'A long clear sustain that holds each note for seconds, into a vast space whose tail swells in and hangs a minute or more.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Long clean hold' },
      { deviceId: 'expanse', preset: 'Event horizon', params: { decay: 54.7, modRate: 0.141 } },
    ],
  },
  {
    id: 'slow-brass-rosin-cloud',
    name: 'Rosin cloud',
    category: 'texture',
    description:
      'A smear of long overlapping grains, half of them reversed, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear' },
      { deviceId: 'fdn-reverb', preset: 'Bright air' },
    ],
  },
  {
    id: 'slow-brass-largo-strings',
    name: 'Largo strings',
    category: 'texture',
    description:
      'A dark lingering pad, then a single notch drifting slowly up and down the spectrum, into a late-arriving hall.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Lingering', params: { rise: 1.16, fall: 19.4 } },
      {
        deviceId: 'auto-filter',
        preset: 'Slow notch',
        params: { lfoRateHz: 0.138, envAttackMs: 8.76, envReleaseMs: 192 },
      },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'slow-brass-half-asleep-pad',
    name: 'Half-asleep pad',
    category: 'texture',
    description:
      'A held pad caught from each chord that glides to the next, then a plain chorus with a detuned copy towards each side.',
    effects: [
      { deviceId: 'sustainer', preset: 'Sustain pedal', params: { attack: 0.273, glide: 0.447 } },
      { deviceId: 'chorus', preset: 'Classic chorus' },
    ],
  },
  {
    id: 'slow-brass-cloakroom-strings',
    name: 'Cloakroom strings',
    category: 'texture',
    description:
      'A dark string pad doubled an octave below the playing, into a big muffled cave that rings for about six seconds.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Low section' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 5.41, breathRate: 0.266 } },
    ],
  },
  {
    id: 'slow-brass-octave-on-the-porch',
    name: 'Octave on the porch',
    category: 'pitch',
    description:
      'A slow swell after each silence that opens only at the end, then a smooth octave-down bed, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1410, release: 781 } },
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { length: 2110 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 41.7 } },
    ],
  },
  {
    id: 'slow-brass-octave-at-the-back',
    name: 'Octave at the back',
    category: 'pitch',
    description:
      'The level rising and falling at random, like surf, then a muffled half-speed octave below, kept in the centre, into a vast nave.',
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.285 } },
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 1870 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'slow-brass-green-room-undertow',
    name: 'Green-room undertow',
    category: 'pitch',
    description:
      'A slow breathing level, then a dark, smooth half-speed octave under the dry sound, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.26 } },
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1240 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'slow-brass-balcony-undertow',
    name: 'Balcony undertow',
    category: 'pitch',
    description:
      'A short swell that rounds the front off every note, then a dark, smooth half-speed octave under the dry sound, into a hall with long lows.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 175, release: 73.9 } },
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1090 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 57.3, lowDecay: 7.93, midDecay: 1.89 },
      },
    ],
  },
  {
    id: 'slow-brass-night-shift-octave',
    name: 'Night-shift octave',
    category: 'pitch',
    description:
      'A triode valve stage, smoothly overdriven, then a single darkened voice an octave below the dry sound.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'pitch-shifter', preset: 'Octave down' },
    ],
  },
  {
    id: 'slow-brass-next-room-cellos',
    name: 'Next-room cellos',
    category: 'pitch',
    description:
      'A dark, low string pad like cellos under the playing, into a hall whose choir wanders from vowel to vowel.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { rise: 1.49, fall: 7.21 } },
      { deviceId: 'vowel-reverb', preset: 'Vowel drift' },
    ],
  },
  {
    id: 'slow-brass-one-chord-bass',
    name: 'One-chord bass',
    category: 'pitch',
    description:
      'A slow swell after each silence that opens only at the end, then an octave below, into a long reverb whose tail wavers queasily in pitch.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise' },
      { deviceId: 'pitch-shifter', preset: 'Octave down' },
      { deviceId: 'expanse', preset: 'Seasick choir' },
    ],
  },
  {
    id: 'slow-brass-unlit-loop',
    name: 'Unlit loop',
    category: 'pitch',
    description:
      'A low, dark tape loop played backwards at half speed, then a drifting reel laid against the dry sound to make a chorus.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 3.55 } },
      { deviceId: 'tape', preset: 'Drifting chorus', params: { output: -0.92 } },
    ],
  },
  {
    id: 'slow-brass-replay-by-the-exit',
    name: 'Replay by the exit',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed', params: { length: 885 } },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.47 } },
    ],
  },
  {
    id: 'slow-brass-largo-drone',
    name: 'Largo drone',
    category: 'pitch',
    description:
      'A dark drone made by holding the first phrase an octave down, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Deep drone', params: { length: 3.23 } },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'slow-brass-bass-clef-octave',
    name: 'Bass-clef octave',
    category: 'pitch',
    description:
      'A dark, smooth half-speed octave under the dry sound, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1260 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'slow-brass-bass-clef-tide',
    name: 'Bass-clef tide',
    category: 'pitch',
    description:
      'Long, dark backwards phrases an octave below the playing, then a small radio speaker muffled as if under a pillow.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 2400 } },
      { deviceId: 're-amp', preset: 'Pillow speaker' },
    ],
  },
  {
    id: 'slow-brass-master-past-midnight',
    name: 'Master past midnight',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a true-peak ceiling that lets go again over several seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'slow-brass-empty-house-finish',
    name: 'Empty-house finish',
    category: 'master',
    description:
      'A parallel compressor, then a slightly wider image, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 377, release: 3.21 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'slow-brass-one-chord-finish',
    name: 'One-chord finish',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a fast limiter that steps in only on the loudest peaks.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'slow-brass-polish-before-rain',
    name: 'Polish before rain',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a parallel compressor, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 398, release: 2.81 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.65 } },
    ],
  },
  {
    id: 'slow-brass-limestone-finish',
    name: 'Limestone finish',
    category: 'master',
    description:
      'A rumble cut and a small lift of presence, then a gentle compressor that draws loud and quiet together, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys' },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { gain: 2.42 } },
    ],
  },
  {
    id: 'slow-brass-waiting-room-finish',
    name: 'Waiting-room finish',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
]
