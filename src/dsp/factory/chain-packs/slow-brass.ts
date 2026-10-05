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
    id: 'slow-brass-interval-nave',
    name: 'Interval nave',
    category: 'space',
    description:
      'A slow swell after each silence, with some dry attack left, then a gentle low-pass at a kilohertz, into a vast nave.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1480, release: 305 } },
      { deviceId: 'auto-filter', preset: 'Init' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'slow-brass-hall-in-the-stalls',
    name: 'Hall in the stalls',
    category: 'space',
    description:
      'A late-blooming slow swell, then a warm, full equaliser, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1620, release: 776 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.46 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'slow-brass-heat-haze-plate',
    name: 'Heat-haze plate',
    category: 'space',
    description:
      'A very slow swell, then a heavy low shelf that puts weight under the sound, into a plate heard alone with none of the dry sound left.',
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
    id: 'slow-brass-foyer-fog',
    name: 'Foyer fog',
    category: 'space',
    description:
      'Two dull copies that wander, a haze round the notes, into a huge slow wash that swells in and hangs with no dry sound.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze' },
      { deviceId: 'expanse', preset: 'Wash alone' },
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
    id: 'slow-brass-august-wash',
    name: 'August wash',
    category: 'space',
    description:
      'A huge slow wash that swells in and hangs with no dry sound, then a one-voice chorus, the pitch bending against the dry sound.',
    effects: [
      { deviceId: 'expanse', preset: 'Wash alone' },
      { deviceId: 'tremolo', preset: 'Slow chorus' },
    ],
  },
  {
    id: 'slow-brass-thunderhead-tail',
    name: 'Thunderhead tail',
    category: 'space',
    description:
      'A cassette with a full head bump and a rolled-off top, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0816 } },
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
    id: 'slow-brass-far-end-voices',
    name: 'Far-end voices',
    category: 'space',
    description:
      'A slow swell after each silence, with some dry attack left, into a wordless choir alone with none of the dry sound left.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1460, release: 301 } },
      { deviceId: 'vowel-reverb', preset: 'Choir alone' },
    ],
  },
  {
    id: 'slow-brass-choir-in-the-eaves',
    name: 'Choir in the eaves',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, into deep voices on an ee that come in late behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.33 } },
      { deviceId: 'vowel-reverb', preset: 'Late basses', params: { decay: 6.89, preDelay: 188 } },
    ],
  },
  {
    id: 'slow-brass-organ-all-evening',
    name: 'Organ all evening',
    category: 'space',
    description:
      'A mid-forward tone with the lows and the top trimmed, into a large dark reverb stacking octaves and fifths like pipes.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.69 } },
      {
        deviceId: 'shimmer',
        preset: 'Organ loft',
        params: { decay: 12.8, predelay: 39.9, mix: 0.24 },
      },
    ],
  },
  {
    id: 'slow-brass-fire-door-hall',
    name: 'Fire-door hall',
    category: 'space',
    description:
      "A smooth swell on every note, like a string section's bows, into a hall whose lows outlast its damped top.",
    effects: [
      { deviceId: 'swell', preset: 'String section' },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'slow-brass-strings-held-over',
    name: 'Strings held over',
    category: 'space',
    description:
      'A bowed swell, then sixteen strings in E minor heard alone with no dry sound, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 418, release: 147 } },
      { deviceId: 'sympathetic', preset: 'Strings alone' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 9.62, modRate: 0.421 } },
    ],
  },
  {
    id: 'slow-brass-hall-for-two',
    name: 'Hall for two',
    category: 'space',
    description:
      'A low cut and some presence, then a clean speaker at the far end of a big, live room, into a hall with no dry sound.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Voice' },
      { deviceId: 're-amp', preset: 'Far end of the hall', params: { output: 5.85 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Full wet send',
        params: { decay: 7.59, breathRate: 0.265 },
      },
    ],
  },
  {
    id: 'slow-brass-county-road-hall',
    name: 'County-road hall',
    category: 'space',
    description:
      'A hall with about two and a half seconds of tail, then a low cut and a small dip in the low mids, to make room.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall' },
      { deviceId: 'ambient-eq', preset: 'Layer', params: { clearTime: 1.39 } },
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
    id: 'slow-brass-house-lights-hall',
    name: 'House-lights hall',
    category: 'space',
    description:
      'A low-pass that opens and closes over about half a minute, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0335, envAttackMs: 8.78, envReleaseMs: 190 },
      },
      { deviceId: 'fdn-reverb', preset: 'Endless tail' },
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
    id: 'slow-brass-back-row-fifths',
    name: 'Back-row fifths',
    category: 'space',
    description:
      'A late-blooming slow swell, then a reverb whose tail climbs in fifths as it rings, into a long backwards rise.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1370, release: 899 } },
      { deviceId: 'shimmer', preset: 'Fifths', params: { decay: 10.8, predelay: 18 } },
      { deviceId: 'shaped-reverb', preset: 'Long rise', params: { time: 3.94 } },
    ],
  },
  {
    id: 'slow-brass-foyer-scatter',
    name: 'Foyer scatter',
    category: 'space',
    description:
      'A mellow reverb whose tail splits upwards and downwards, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Scatter', params: { decay: 9.91 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'slow-brass-upper-circle-hall',
    name: 'Upper-circle hall',
    category: 'space',
    description:
      'A subsonic cut with the low mids and presence eased a touch, then a tight chamber, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.36 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 55.4 } },
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
    id: 'slow-brass-second-desk-plate',
    name: 'Second-desk plate',
    category: 'space',
    description:
      'A bowed swell at half strength under the dry attacks, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'slow-brass-night-shift-loop',
    name: 'Night-shift loop',
    category: 'echo',
    description:
      'A loop of the last phrase at half speed, an octave down, into an undamped hall of about three seconds with light lows.',
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
    id: 'slow-brass-loop-on-the-porch',
    name: 'Loop on the porch',
    category: 'echo',
    description:
      'A half-speed tape loop in reverse, low and dark, then backwards repeats that step down an octave each time.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards' },
      { deviceId: 'reverse-delay', preset: 'Descending steps' },
    ],
  },
  {
    id: 'slow-brass-screen-door-loop',
    name: 'Screen-door loop',
    category: 'echo',
    description:
      'A gentle high cut that shades the top end, then a tape loop at half speed, an octave down and darker.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 7.83 } },
    ],
  },
  {
    id: 'slow-brass-proscenium-hold',
    name: 'Proscenium hold',
    category: 'echo',
    description:
      'The first phrase played, held an octave down as a dark drone, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Deep drone' },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 28 } },
    ],
  },
  {
    id: 'slow-brass-deck-by-the-exit',
    name: 'Deck by the exit',
    category: 'tape',
    description:
      'A tape preamp pushed just enough to add weight, then a fast, steady reel pushed into soft saturation, into a breathing reverb.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'shaped-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'slow-brass-tape-in-the-stalls',
    name: 'Tape in the stalls',
    category: 'tape',
    description:
      'A transformer that fills out the lows and dulls the top, then a reel of tape, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 10.9 } },
    ],
  },
  {
    id: 'slow-brass-night-ward-tape',
    name: 'Night-ward tape',
    category: 'tape',
    description:
      'A driven valve amplifier, then a clean pass over tape, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 're-amp', preset: 'Just the valves' },
      { deviceId: 'tape', preset: 'Clean transfer' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'slow-brass-deck-after-closing',
    name: 'Deck after closing',
    category: 'tape',
    description:
      'A low, warm transformer, then a fast, steady reel pushed into soft saturation, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 33.7, modRate: 0.102 } },
    ],
  },
  {
    id: 'slow-brass-thump-in-the-heat',
    name: 'Thump in the heat',
    category: 'tape',
    description:
      'A low-heavy transformer, then a thick, soft cassette, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'tape', preset: 'Warm thump', params: { output: -4.13 } },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'slow-brass-stage-door-hiss',
    name: 'Stage-door hiss',
    category: 'tape',
    description:
      'A pad that glides slowly, then a trace of tape hiss, even and barely there, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'sustainer', preset: 'Long glide', params: { attack: 1.55, glide: 4.96 } },
      { deviceId: 'noise-floor', preset: 'Faint hiss', params: { response: 0.384, hold: 10.9 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'slow-brass-fermata-hum',
    name: 'Fermata hum',
    category: 'tape',
    description:
      'A dark string pad doubled an octave below the playing, then a pure low mains hum, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Low section', params: { rise: 0.717, fall: 5.14 } },
      { deviceId: 'noise-floor', preset: 'Mains hum' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 14.1 } },
    ],
  },
  {
    id: 'slow-brass-slow-leaving-mains',
    name: 'Slow-leaving mains',
    category: 'tape',
    description:
      'A dark slow-melting bed, then a pure low mains hum in the middle of the sound, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed' },
      { deviceId: 'noise-floor', preset: 'Mains hum' },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'slow-brass-exit-sign-rumble',
    name: 'Exit-sign rumble',
    category: 'tape',
    description:
      'A held pad that swells in slowly like bowed strings, then the low rumble of an empty room, left running, into a far-off plate haze.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { attack: 1.92, glide: 1.59 } },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { response: 0.371, hold: 22.1 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'slow-brass-drift-by-lamplight',
    name: 'Drift by lamplight',
    category: 'tape',
    description:
      'The first hint of weight from a tape preamp, then a slow tape chorus, into a clean speaker at the far end of a big, live room.',
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
      'A four-track cassette, then the low mains hum of an amplifier left switched on, into a swelling reverb cloud.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { response: 0.43, hold: 33.7 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.43 } },
    ],
  },
  {
    id: 'slow-brass-one-chord-tape',
    name: 'One-chord tape',
    category: 'tape',
    description:
      'A glacial low-pass, then a muffled cassette, then long backwards phrases an octave down, dark and slow.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0315, envAttackMs: 10.3, envReleaseMs: 224 },
      },
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'reverse-delay', preset: 'Undertow' },
    ],
  },
  {
    id: 'slow-brass-drift-before-rain',
    name: 'Drift before rain',
    category: 'motion',
    description:
      'A dark, woolly stack, then a wide echo whose repeats drift slowly in pitch, into a vast blurred hollow that rings for half a minute.',
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly', params: { output: -0.972 } },
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 562, modRate: 0.109 } },
      { deviceId: 'swarm-reverb', preset: 'Vast hollow', params: { length: 1.17, glide: 0.526 } },
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
    id: 'slow-brass-drowsy-double',
    name: 'Drowsy double',
    category: 'motion',
    description:
      'A deep, slow compressor that lifts a quiet bed and holds it, then two late copies either side, like loose double-tracking.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Drone bed', params: { attack: 678, release: 10.2 } },
      { deviceId: 'chorus', preset: 'Loose double', params: { rate: 0.218 } },
    ],
  },
  {
    id: 'slow-brass-tide-at-the-back',
    name: 'Tide at the back',
    category: 'motion',
    description:
      'A slow phasing drift from partials moved less than a hertz, into a long blurred cave that slides slowly between intervals.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift' },
      { deviceId: 'swarm-reverb', preset: 'Slow stretch', params: { length: 0.655, glide: 4.38 } },
    ],
  },
  {
    id: 'slow-brass-ripple-at-the-door',
    name: 'Ripple at the door',
    category: 'motion',
    description:
      'A swell that takes seconds to rise after each silence, then a faint, very slow phasing that barely stirs the sound.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2560, release: 737 } },
      { deviceId: 'freq-shifter', preset: 'Still water', params: { delay: 6.06, lfoRate: 0.0447 } },
    ],
  },
  {
    id: 'slow-brass-vestry-pan',
    name: 'Vestry pan',
    category: 'motion',
    description:
      'A slow swell after each silence, with some dry attack left, then a pan that wanders to a new place every second or so.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow' },
      { deviceId: 'tremolo', preset: 'Wandering pan' },
    ],
  },
  {
    id: 'slow-brass-floorboard-pan',
    name: 'Floorboard pan',
    category: 'motion',
    description:
      'A slow pan, then a slow echo with a long dark trail and a few recollections, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.153 } },
      {
        deviceId: 'echo-memory',
        preset: 'Dark trail',
        params: { time: 1210, reach: 31.4, size: 5.12 },
      },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'slow-brass-lamp-warm-strings',
    name: 'Lamp-warm strings',
    category: 'texture',
    description:
      'A deep, slow compressor, then a soft following string pad, into a long dark reverb whose tail sinks slowly in pitch.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Drone bed',
        params: { attack: 648, release: 8.87, makeup: 12.6 },
      },
      { deviceId: 'pad-follower', preset: 'String pad', params: { rise: 0.538, fall: 4.14 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark' },
    ],
  },
  {
    id: 'slow-brass-interval-mist',
    name: 'Interval mist',
    category: 'texture',
    description:
      'A deep, slow compressor, then a long-hanging wide wash, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Drone bed',
        params: { attack: 768, release: 9.91, makeup: 2.91 },
      },
      { deviceId: 'spectral-blur', preset: 'Endless' },
      { deviceId: 'fdn-reverb', preset: 'Breathing' },
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
    id: 'slow-brass-lights-off-horizon',
    name: 'Lights-off horizon',
    category: 'texture',
    description:
      'A struck-to-pad swell, then an unfading slow drone, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 829, release: 402 } },
      { deviceId: 'sustainer', preset: 'Endless drone', params: { attack: 2.67, glide: 3.71 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
    ],
  },
  {
    id: 'slow-brass-depths-nodding-off',
    name: 'Depths nodding off',
    category: 'texture',
    description:
      'Long sparse grains two octaves down, a slow bass shadow, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Two octaves under',
        params: { size: 1160, density: 4.41 },
      },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'slow-brass-layers-in-the-pit',
    name: 'Layers in the pit',
    category: 'texture',
    description:
      'A firm, slow compressor that keeps long swells held down, then recalled phrases that are remembered again and slowly gather.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { makeup: 3.54 } },
      { deviceId: 'echo-memory', preset: 'Gathering', params: { time: 770, reach: 23, size: 3.3 } },
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
    id: 'slow-brass-empty-house-water',
    name: 'Empty-house water',
    category: 'texture',
    description:
      'A valve stage driven hard until it thickens and sags, then a dark, bassy wash that hangs under the notes for seconds.',
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { output: -11.7 } },
      { deviceId: 'spectral-blur', preset: 'Dark water' },
    ],
  },
  {
    id: 'slow-brass-velvet-wash',
    name: 'Velvet wash',
    category: 'texture',
    description:
      'A volume-pedal swell, then a wide, darkened wash in which every note slowly dissolves, into a quiet late plate.',
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
    id: 'slow-brass-largo-swell',
    name: 'Largo swell',
    category: 'texture',
    description:
      'Octaves below and above that swell in, with no dry sound, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'octaves', preset: 'Swell pad', params: { attack: 0.822 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'slow-brass-sleepless-depths',
    name: 'Sleepless depths',
    category: 'texture',
    description:
      'A compressor as slow as a hand on a fader, then a dark, bassy wash that hangs under the notes for seconds.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { release: 18.9, makeup: -5 } },
      { deviceId: 'spectral-blur', preset: 'Dark water' },
    ],
  },
  {
    id: 'slow-brass-unlit-strings',
    name: 'Unlit strings',
    category: 'texture',
    description:
      'A muffled pad with all its top taken off, slow to fade, then a heavy low shelf that puts weight under the sound.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Felted pad', params: { rise: 0.731, fall: 11.5 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.71 } },
    ],
  },
  {
    id: 'slow-brass-cloakroom-rumble',
    name: 'Cloakroom rumble',
    category: 'texture',
    description:
      'A low blurred bed under the sound, nothing above the bass, into a huge slow wash that swells in and hangs with no dry sound.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Sub bed', params: { mix: 0.15 } },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 44, modRate: 0.0982 } },
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
      'A string pad that arrives long after the chord and stays, then a cassette with a full head bump and a rolled-off top.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Late tide', params: { rise: 5.6 } },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'slow-brass-felt-till-morning',
    name: 'Felt till morning',
    category: 'texture',
    description:
      'A muffled pad with all its top taken off, slow to fade, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Felted pad' },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'slow-brass-limestone-depths',
    name: 'Limestone depths',
    category: 'texture',
    description:
      'A swell that takes seconds to rise after each silence, then a low blurred bed under the sound, nothing above the bass.',
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
    ],
  },
  {
    id: 'slow-brass-largo-loop',
    name: 'Largo loop',
    category: 'texture',
    description:
      'A piece of each note looped into a long, swelling drone, then a tape preamp overloaded until it breaks up, dull and thick.',
    effects: [
      { deviceId: 'cascade', preset: 'Long drone' },
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -11.2 } },
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
    id: 'slow-brass-second-desk-sustain',
    name: 'Second-desk sustain',
    category: 'texture',
    description:
      'A held pad caught from each chord that glides to the next, then a slow comb sliding against the dry sound, sides opposed.',
    effects: [
      { deviceId: 'sustainer', preset: 'Sustain pedal', params: { attack: 0.265, glide: 0.367 } },
      { deviceId: 'tremolo', preset: 'Drifting comb' },
    ],
  },
  {
    id: 'slow-brass-undertow-before-rain',
    name: 'Undertow before rain',
    category: 'texture',
    description:
      'Long slow grains an octave down, most of them reversed, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
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
    id: 'slow-brass-hot-night-wash',
    name: 'Hot-night wash',
    category: 'texture',
    description:
      'A first-note swell, then a long-hanging wide wash, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'swell', preset: 'First note only', params: { attack: 1630, release: 1340 } },
      { deviceId: 'spectral-blur', preset: 'Endless', params: { mix: 0.521 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { mix: 0.15 } },
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
    id: 'slow-brass-two-guitar-octave',
    name: 'Two-guitar octave',
    category: 'pitch',
    description:
      'A slow compressor that evens out swells over seconds, then a dark octave below chords, into a wavering seasick tail.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 333, makeup: 2.77 } },
      { deviceId: 'pitch-shifter', preset: 'Pad below', params: { size: 63.1 } },
      { deviceId: 'expanse', preset: 'Seasick choir' },
    ],
  },
  {
    id: 'slow-brass-octave-at-the-back',
    name: 'Octave at the back',
    category: 'pitch',
    description:
      'The level rising and falling at random, like surf, then a muffled octave below, into a vast nave that rings for about eight seconds.',
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
      'A slow breathing level, then a dark half-speed octave kept low under the dry sound, into a fully damped hall with a few seconds of tail.',
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
      'A short swell that rounds the front off every note, then a dark half-speed octave kept low under the dry sound, into a hall with long lows.',
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
    id: 'slow-brass-two-guitar-drag',
    name: 'Two-guitar drag',
    category: 'pitch',
    description:
      'Whole phrases dragged out at half speed, an octave down, into a thin veil of reverb kept low under the sound.',
    effects: [
      { deviceId: 'half-speed', preset: 'Long drag' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'slow-brass-chops-past-midnight',
    name: 'Chops past midnight',
    category: 'pitch',
    description:
      'Half-speed chunks an octave down, cut about twice a second, into a hall that answers about a quarter of a second late.',
    effects: [
      { deviceId: 'half-speed', preset: 'Slow chops', params: { length: 518 } },
      { deviceId: 'fdn-reverb', preset: 'Late arrival' },
    ],
  },
  {
    id: 'slow-brass-night-shift-octave',
    name: 'Night-shift octave',
    category: 'pitch',
    description:
      'A triode valve stage, smoothly overdriven, then a single voice an octave below the dry sound, darkened.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'pitch-shifter', preset: 'Octave down' },
    ],
  },
  {
    id: 'slow-brass-hill-country-fourth',
    name: 'Hill-country fourth',
    category: 'pitch',
    description:
      'A compressor as slow as a hand on a fader, then a wide, slowed copy a fourth below that drifts behind, into a big muffled cave.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { attack: 2900 } },
      { deviceId: 'half-speed', preset: 'Fourth down drift', params: { length: 3270 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 5.47, breathRate: 0.32 } },
    ],
  },
  {
    id: 'slow-brass-next-room-cellos',
    name: 'Next-room cellos',
    category: 'pitch',
    description:
      'A dark, low string pad like cellos under the playing, into a choir of a hall whose vowel wanders on its own.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { rise: 1.49, fall: 7.21 } },
      { deviceId: 'vowel-reverb', preset: 'Vowel drift' },
    ],
  },
  {
    id: 'slow-brass-cloakroom-drone',
    name: 'Cloakroom drone',
    category: 'pitch',
    description:
      'The first phrase played, held an octave down as a dark drone, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Deep drone' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 10.7, predelayMs: 127, breathRate: 0.268 },
      },
    ],
  },
  {
    id: 'slow-brass-dog-days-pedals',
    name: 'Dog-days pedals',
    category: 'pitch',
    description:
      'A swell that takes about four seconds to open after silence, then deep pedal notes two octaves down that swell in slowly.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier' },
      { deviceId: 'octaves', preset: 'Slow pedals', params: { attack: 1.18 } },
    ],
  },
  {
    id: 'slow-brass-half-asleep-valve',
    name: 'Half-asleep valve',
    category: 'master',
    description:
      'Dark, thick valve grit, then a slow compressor that evens out swells over seconds, then a pushed true-peak ceiling.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 288, release: 2.17 } },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { gain: -0.857 } },
    ],
  },
  {
    id: 'slow-brass-iron-in-still-air',
    name: 'Iron in still air',
    category: 'master',
    description:
      'A low-heavy transformer, then a low cut and a small dip in the low mids, to make room, then an eased-back ceiling.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'ambient-eq', preset: 'Layer', params: { clearTime: 1.37 } },
      { deviceId: 'ambient-limiter', preset: 'Pull back' },
    ],
  },
  {
    id: 'slow-brass-tape-in-the-wings',
    name: 'Tape in the wings',
    category: 'master',
    description:
      'A clean pass over fast new tape, with nothing added, then a fast limiter pushed so that soft and loud notes even out.',
    effects: [
      { deviceId: 'tape', preset: 'Clean transfer' },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'slow-brass-back-row-room',
    name: 'Back-row room',
    category: 'master',
    description:
      'A small plain room that is over in about a second, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.3, breathRate: 0.27 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'slow-brass-width-by-lamplight',
    name: 'Width by lamplight',
    category: 'master',
    description:
      'A heavy low shelf, then the sides lifted a little, wider with nothing added, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.88 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
  {
    id: 'slow-brass-back-row-sheen',
    name: 'Back-row sheen',
    category: 'master',
    description:
      'A quiet plate tail that comes in late behind each note, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 96.4 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming' },
    ],
  },
]
