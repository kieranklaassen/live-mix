// Neon Rain, 2019: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'neon-rain-bloom-till-morning',
    name: 'Bloom till morning',
    category: 'space',
    description:
      'Three voices drifting over a cycle of about twelve seconds, then a chorused echo, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.0793, delayMs: 27.8 } },
      { deviceId: 'analog-delay', preset: 'Chorused' },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'neon-rain-hall-in-the-smog',
    name: 'Hall in the smog',
    category: 'space',
    description:
      'A hollow three-voice chorus swelling over about ten seconds, then a steady tape echo with no wobble, dirt or dulling, into a far-off hall.',
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.111, delayMs: 8.63 } },
      { deviceId: 'tape-echo', preset: 'Clean and steady' },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 4.76, midDecay: 4.97 } },
    ],
  },
  {
    id: 'neon-rain-hall-under-neon',
    name: 'Hall under neon',
    category: 'space',
    description:
      'A trace of chorus on the top of the sound only, then an echo whose repeats jump up an octave and back, into a cathedral.',
    effects: [
      { deviceId: 'chorus', preset: 'Faint air', params: { rate: 0.22, delayMs: 9.91 } },
      { deviceId: 'analog-delay', preset: 'Octave hop' },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'neon-rain-small-hours-hall',
    name: 'Small-hours hall',
    category: 'space',
    description:
      'A plain two-voice chorus with a voice towards each side, then a clean steady echo, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.83, delayMs: 13 } },
      { deviceId: 'analog-delay', preset: 'Clean echo' },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 63.8 } },
    ],
  },
  {
    id: 'neon-rain-sprawling-hall',
    name: 'Sprawling hall',
    category: 'space',
    description:
      'A slow ensemble chorus, then a soft bucket-brigade echo, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.528, delayMs: 19.3 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 364, modRate: 0.614 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 54.8 } },
    ],
  },
  {
    id: 'neon-rain-overcast-sky',
    name: 'Overcast sky',
    category: 'space',
    description:
      'A plain two-voice chorus, then two tape heads that make every repeat gallop, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus' },
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 631 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 8.83, modRate: 0.351 } },
    ],
  },
  {
    id: 'neon-rain-downtown-swell',
    name: 'Downtown swell',
    category: 'space',
    description:
      'A compressor as slow as a hand on a fader, then a large space whose tail swells in behind each note, then a grainy early sampler.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 13.7, modRate: 0.333 } },
      { deviceId: 'patina', preset: 'Early sampler' },
    ],
  },
  {
    id: 'neon-rain-plate-behind-blinds',
    name: 'Plate behind blinds',
    category: 'space',
    description:
      'A very slow swell, then a far-off plate haze, then the converters of an early sampler, twelve bits, low rate.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
      { deviceId: 'vintage-digital', preset: 'Sampler' },
    ],
  },
  {
    id: 'neon-rain-wet-neon-hall',
    name: 'Wet-neon hall',
    category: 'space',
    description:
      'A firm, slow compressor that keeps long swells held down, then a hall whose lows outlast its damped top, then early sampler converters.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { attack: 140, release: 6.34 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 52, lowDecay: 4.14, midDecay: 2.63 },
      },
      { deviceId: 'vintage-digital', preset: 'Sampler' },
    ],
  },
  {
    id: 'neon-rain-searchlight-sheen',
    name: 'Searchlight sheen',
    category: 'space',
    description:
      'A compressor as slow as a hand on a fader, then a quiet late plate, then nine-bit converters on an unsteady clock, hiss on high notes.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { attack: 2660, release: 17.8 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 84 } },
      { deviceId: 'vintage-digital', preset: 'Worn' },
    ],
  },
  {
    id: 'neon-rain-last-train-plate',
    name: 'Last-train plate',
    category: 'space',
    description:
      'A slow compressor that evens out swells over seconds, then a medium plate with a smooth tail of a few seconds, then a bed of digital grit.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level', params: { makeup: 2.07 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 21.3 } },
      { deviceId: 'vintage-digital', preset: 'Grit bed' },
    ],
  },
  {
    id: 'neon-rain-airship-glint',
    name: 'Airship glint',
    category: 'space',
    description:
      'A slow swell on only the first note after each silence, into a small glassy reverb with a glint two octaves up.',
    effects: [
      { deviceId: 'swell', preset: 'First note only' },
      { deviceId: 'shimmer', preset: 'Glass', params: { decay: 6.15, predelay: 18.7 } },
    ],
  },
  {
    id: 'neon-rain-vault-below-towers',
    name: 'Vault below towers',
    category: 'space',
    description:
      'A cathedral with about six seconds of tail, then a rumble cut and a single decibel of presence.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
      { deviceId: 'ambient-eq', preset: 'Keys', params: { clearTime: 1.49 } },
    ],
  },
  {
    id: 'neon-rain-foundry-strings',
    name: 'Foundry strings',
    category: 'space',
    description:
      'Five strings in F major that ring for about half a second, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Brief pluck' },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 63.6 } },
    ],
  },
  {
    id: 'neon-rain-hall-by-the-sign',
    name: 'Hall by the sign',
    category: 'space',
    description:
      'Two copies a slap behind, the left one first, into a large hall heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Late copy', params: { delay: 58.8 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Full wet send',
        params: { decay: 7.85, breathRate: 0.283 },
      },
    ],
  },
  {
    id: 'neon-rain-kiosk-hall',
    name: 'Kiosk hall',
    category: 'space',
    description:
      'A wide open space with a slowly wavering tail, then a compressor as slow as a hand on a fader.',
    effects: [
      { deviceId: 'expanse', preset: 'Open space' },
      {
        deviceId: 'ambient-comp',
        preset: 'Slow fader',
        params: { attack: 2780, release: 17.6, makeup: 0.884 },
      },
    ],
  },
  {
    id: 'neon-rain-all-night-choir',
    name: 'All-night choir',
    category: 'space',
    description:
      'A cathedral whose long tail sings a soft open ah, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Cathedral' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'neon-rain-overpass-cathedral',
    name: 'Overpass cathedral',
    category: 'space',
    description:
      'A scooped tone with lows and highs up and the body down, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'neon-rain-night-market-choir',
    name: 'Night-market choir',
    category: 'space',
    description:
      'A reverb whose tail climbs an octave on every pass, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'shimmer', preset: 'Rising choir' },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'neon-rain-pylon-halo',
    name: 'Pylon halo',
    category: 'space',
    description:
      'A subsonic cut and a slow ear that eases whatever rings on, into a reverb whose tail drifts up towards the octave as it rings.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 2.81 } },
      { deviceId: 'bloom-reverb', preset: 'Bloom', params: { decay: 5.31 } },
    ],
  },
  {
    id: 'neon-rain-puddle-chant',
    name: 'Puddle chant',
    category: 'space',
    description:
      'A single saturated tape slap behind each note, into a large hall whose tail hums a deep oh in bass voices.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap' },
      { deviceId: 'vowel-reverb', preset: 'Low monks' },
    ],
  },
  {
    id: 'neon-rain-plate-at-curfew',
    name: 'Plate at curfew',
    category: 'space',
    description:
      'A plate heard alone with none of the dry sound left, then a three-voice chorus spread wide across the sides.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.888, delayMs: 12.5 } },
    ],
  },
  {
    id: 'neon-rain-halo-past-midnight',
    name: 'Halo past midnight',
    category: 'space',
    description:
      'A half-hidden slow swell, then an octave-sinking reverb, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1420, release: 282 } },
      { deviceId: 'shimmer', preset: 'Undertow', params: { decay: 12.6, predelay: 20.4 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 13.1, modRate: 0.317 } },
    ],
  },
  {
    id: 'neon-rain-blacked-out-choir',
    name: 'Blacked-out choir',
    category: 'space',
    description:
      'A low cut that thins the bass, with a little air on top, into a muffled reverb whose octave climb is soon damped away.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.62 } },
      { deviceId: 'shimmer', preset: 'Muffled choir' },
    ],
  },
  {
    id: 'neon-rain-sheen-in-steam',
    name: 'Sheen in steam',
    category: 'space',
    description:
      'A bowed swell at half strength under the dry attacks, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'neon-rain-signboard-veil',
    name: 'Signboard veil',
    category: 'space',
    description:
      'A long slow flanger, nearly a chorus, opposite on each side, into a thin veil of reverb kept low under the sound.',
    effects: [
      { deviceId: 'flanger', preset: 'Wide wash', params: { rate: 0.166, delayMs: 7.39 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'neon-rain-air-in-exhaust',
    name: 'Air in exhaust',
    category: 'space',
    description:
      'A subsonic cut and a slow ear that eases whatever rings on, then a thin, bright haze that hangs high above the sound.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master' },
      { deviceId: 'spectral-blur', preset: 'High air' },
    ],
  },
  {
    id: 'neon-rain-walkway-tail',
    name: 'Walkway tail',
    category: 'space',
    description:
      'A dark hall that takes about twenty seconds to die away, then a low-pass that opens and closes over about half a minute.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0867 } },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0294, envAttackMs: 9.1 },
      },
    ],
  },
  {
    id: 'neon-rain-rain-streak-hall',
    name: 'Rain-streak hall',
    category: 'space',
    description:
      'A bright wide room that rings for a second or two, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Ether' },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 41.7, lowDecay: 2.18, midDecay: 2.83 },
      },
    ],
  },
  {
    id: 'neon-rain-choir-in-wet-neon',
    name: 'Choir in wet neon',
    category: 'space',
    description:
      'A tape preamp pushed just enough to add weight, into a vast hall whose long tail sings a high bright ah.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'vowel-reverb', preset: 'High choir', params: { decay: 24.1, preDelay: 19.8 } },
    ],
  },
  {
    id: 'neon-rain-flare-stack-echo',
    name: 'Flare-stack echo',
    category: 'echo',
    description:
      'Two copies fed back into a small blur round the upper notes, then a clean, steady echo with no wobble and an open top.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Cloud', params: { delay: 20.3 } },
      { deviceId: 'analog-delay', preset: 'Clean echo' },
    ],
  },
  {
    id: 'neon-rain-noodle-bar-trace',
    name: 'Noodle-bar trace',
    category: 'echo',
    description:
      'A sharp copy on the left and a flat one on the right, then a faint, dull echo with a slow chorus on it.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { delay: 13.8 } },
      { deviceId: 'analog-delay', preset: 'Faint halo' },
    ],
  },
  {
    id: 'neon-rain-airship-echo',
    name: 'Airship echo',
    category: 'echo',
    description:
      'Fed-back copies that climb on the left and sink on the right, then a wide echo whose repeats drift slowly in pitch.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Spiral' },
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 579, modRate: 0.093 } },
    ],
  },
  {
    id: 'neon-rain-echo-in-the-basin',
    name: 'Echo in the basin',
    category: 'echo',
    description:
      'Only the two detuned copies, hard left and right, then three tape heads in a row, a cluster on every repeat.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only', params: { delay: 16.5 } },
      { deviceId: 'tape-echo', preset: 'Three heads' },
    ],
  },
  {
    id: 'neon-rain-steam-grate-trace',
    name: 'Steam-grate trace',
    category: 'echo',
    description:
      'A ten-stage phaser that takes most of a minute to sweep, then a faint trace of tape echo behind the playing.',
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { rate: 0.0213 } },
      { deviceId: 'tape-echo', preset: 'Faint trace' },
    ],
  },
  {
    id: 'neon-rain-freeway-echoes',
    name: 'Freeway echoes',
    category: 'echo',
    description:
      'A hot console channel, then a huge space that answers in separate far-off echoes, into a hall with long lows.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 19.9, modRate: 0.264 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'neon-rain-rain-wet-trail',
    name: 'Rain-wet trail',
    category: 'echo',
    description:
      'A transformer driven so the low end thickens and loosens, then a long dark tape trail, into a slowly breathing hall.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1540 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 7.9, breathRate: 0.191 } },
    ],
  },
  {
    id: 'neon-rain-echo-in-headlights',
    name: 'Echo in headlights',
    category: 'echo',
    description:
      'A resonant high-pass falling for about two seconds at a time, then a steady tape echo with no wobble, dirt or dulling.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Falling high-pass',
        params: { lfoRateHz: 0.472, envAttackMs: 10.6, envReleaseMs: 202 },
      },
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 423, mix: 0.198 } },
    ],
  },
  {
    id: 'neon-rain-elevator-echo',
    name: 'Elevator echo',
    category: 'echo',
    description:
      'A plain echo whose repeats bounce from side to side, then a heavy low shelf that puts weight under the sound.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Side to side' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.16 } },
    ],
  },
  {
    id: 'neon-rain-tenth-floor-chorus',
    name: 'Tenth-floor chorus',
    category: 'echo',
    description:
      'A bucket-brigade echo with a slow chorus on its repeats, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused' },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 19.6, preDelay: 37.6 } },
    ],
  },
  {
    id: 'neon-rain-pylon-stairs',
    name: 'Pylon stairs',
    category: 'echo',
    description:
      'A short swell that rounds the front off every note, then echoes that climb an octave on every repeat.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 146, release: 88.6 } },
      { deviceId: 'pitch-shifter', preset: 'Rising steps' },
    ],
  },
  {
    id: 'neon-rain-after-hours-phrase',
    name: 'After-hours phrase',
    category: 'echo',
    description:
      'Whole phrases coming back three times, each one duller, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'cascade', preset: 'Phrase returns' },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'neon-rain-arcade-gate',
    name: 'Arcade gate',
    category: 'echo',
    description:
      'A deep flanger that takes most of a minute to cross, then gated bursts of reverb repeating about four times a second.',
    effects: [
      { deviceId: 'flanger', preset: 'Glacial drift', params: { rate: 0.018, delayMs: 2.89 } },
      { deviceId: 'shaped-reverb', preset: 'Gate steps', params: { time: 0.22 } },
    ],
  },
  {
    id: 'neon-rain-gutter-wash',
    name: 'Gutter wash',
    category: 'echo',
    description:
      'Dotted tape repeats that pile up in a darkening wash, into a short reverb that swells in just after each note.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dub wash', params: { time: 756 } },
      { deviceId: 'expanse', preset: 'Quick swell' },
    ],
  },
  {
    id: 'neon-rain-curfew-hop',
    name: 'Curfew hop',
    category: 'echo',
    description:
      'A deep eight-stage phaser with sharp peaks between notches, then an echo whose repeats jump up an octave and back.',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage' },
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 433, modRate: 0.581 } },
    ],
  },
  {
    id: 'neon-rain-smokestack-echoes',
    name: 'Smokestack echoes',
    category: 'echo',
    description:
      'Echoes that creep sharp on the left and flat on the right, then a wide haze of grains that hangs on long after the playing.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Split sky' },
      {
        deviceId: 'grain-delay',
        preset: 'Frozen haze',
        params: { time: 954, size: 384, mix: 0.373 },
      },
    ],
  },
  {
    id: 'neon-rain-noodle-bar-echoes',
    name: 'Noodle-bar echoes',
    category: 'echo',
    description:
      'Echoes that fall a fourth further on every repeat, then two full-range copies tuned further apart, reaching lower.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Falling steps', params: { size: 76.1, delay: 418 } },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'neon-rain-balcony-bits',
    name: 'Balcony bits',
    category: 'tape',
    description:
      'A vast hall that opens to the sound in very slow waves, then nine-bit converters on an unsteady clock, hiss on high notes.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 11.4 } },
      { deviceId: 'vintage-digital', preset: 'Worn' },
    ],
  },
  {
    id: 'neon-rain-smog-bits',
    name: 'Smog bits',
    category: 'tape',
    description:
      'A wide open space with a slowly wavering tail, then a thin twelve-bit glaze from converters at a moderate rate.',
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 9.02, modRate: 0.405 } },
      { deviceId: 'vintage-digital', preset: 'Glaze' },
    ],
  },
  {
    id: 'neon-rain-mezzanine-sampler',
    name: 'Mezzanine sampler',
    category: 'tape',
    description:
      'A vast nave that rings for about eight seconds, then smooth, dull converters whose clock is badly unsteady.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { lowDecay: 7.77 } },
      { deviceId: 'vintage-digital', preset: 'Jittery' },
    ],
  },
  {
    id: 'neon-rain-glass-in-sodium',
    name: 'Glass in sodium',
    category: 'tape',
    description:
      'A huge dark open space that answers late and rings on, then old converters with no output filter, a glassy ring on top.',
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 9.76, predelayMs: 128, breathRate: 0.291 },
      },
      { deviceId: 'vintage-digital', preset: 'Glassy' },
    ],
  },
  {
    id: 'neon-rain-precinct-sampler',
    name: 'Precinct sampler',
    category: 'tape',
    description:
      'An early sampler at a low rate, its top filtered away, then a space that answers in hard separate echoes.',
    effects: [
      { deviceId: 'patina', preset: 'Muffled sampler', params: { output: -2.45 } },
      { deviceId: 'expanse', preset: 'Hard echoes', params: { decay: 4.1, modRate: 0.422 } },
    ],
  },
  {
    id: 'neon-rain-tail-light-sampler',
    name: 'Tail-light sampler',
    category: 'tape',
    description:
      'The converters of an early sampler, twelve bits, low rate, then dotted tape repeats that pile up in a darkening wash.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler' },
      { deviceId: 'tape-echo', preset: 'Dub wash' },
    ],
  },
  {
    id: 'neon-rain-halogen-bits',
    name: 'Halogen bits',
    category: 'tape',
    description:
      'A slightly eased equaliser, then a thin twelve-bit glaze, then a handful of separate echoes that fall away and repeat.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.32 } },
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'shaped-reverb', preset: 'Scattered', params: { time: 1.98 } },
    ],
  },
  {
    id: 'neon-rain-glass-in-the-atrium',
    name: 'Glass in the atrium',
    category: 'tape',
    description:
      'Old converters with no output filter, a glassy ring on top, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glassy' },
      { deviceId: 'hall-reverb', preset: 'Bright hall' },
    ],
  },
  {
    id: 'neon-rain-basin-chorus',
    name: 'Basin chorus',
    category: 'motion',
    description:
      'A three-voice chorus spread wide across the sides, then a rising pentatonic run, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.833, delayMs: 13.3 } },
      {
        deviceId: 'lattice',
        preset: 'Pentatonic harp',
        params: { v1Delay: 127, v2Delay: 266, v3Delay: 456, v4Delay: 460, output: 8.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 4.33, breathRate: 0.327 } },
    ],
  },
  {
    id: 'neon-rain-dashboard-riser',
    name: 'Dashboard riser',
    category: 'motion',
    description:
      'A comb that climbs for about five seconds and starts again, into a plain short room whose tail stays at pitch.',
    effects: [
      { deviceId: 'flanger', preset: 'Rising comb', params: { rate: 0.18, delayMs: 3.91 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { decay: 2.48 } },
    ],
  },
  {
    id: 'neon-rain-comb-on-wet-glass',
    name: 'Comb on wet glass',
    category: 'motion',
    description:
      'A short hollow flanger on negative feedback, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.411, delayMs: 1.62 } },
      { deviceId: 'shaped-reverb', preset: 'Dark swell', params: { time: 3.75 } },
    ],
  },
  {
    id: 'neon-rain-sway-at-a-crawl',
    name: 'Sway at a crawl',
    category: 'motion',
    description:
      'A slow compressor that evens out swells over seconds, then a deep slow chorus on a long delay, swaying over seconds.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Level',
        params: { attack: 330, release: 2.12, makeup: 3.95 },
      },
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.136 } },
    ],
  },
  {
    id: 'neon-rain-storm-drain-rotor',
    name: 'Storm-drain rotor',
    category: 'motion',
    description:
      'A slow dark bass rotor, then backwards grains of each phrase, repeating as they fade, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'rotary', preset: 'Dark drum' },
      { deviceId: 'grain-delay', preset: 'Backwards shards' },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { mix: 0.239 } },
    ],
  },
  {
    id: 'neon-rain-level-nine-phaser',
    name: 'Level-nine phaser',
    category: 'motion',
    description:
      'A deep eight-stage phaser with sharp peaks between notches, into a small tank that goes on ringing for seconds.',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.209 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank' },
    ],
  },
  {
    id: 'neon-rain-awning-breath',
    name: 'Awning breath',
    category: 'motion',
    description:
      'The level breathing in and out about every four seconds, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.228 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 38.2 } },
    ],
  },
  {
    id: 'neon-rain-airship-chorus',
    name: 'Airship chorus',
    category: 'motion',
    description:
      'A bucket-brigade echo with a slow chorus on its repeats, then a low cut and a small dip in the low mids, to make room.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 281, modRate: 0.795 } },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'neon-rain-sprawling-drift',
    name: 'Sprawling drift',
    category: 'motion',
    description:
      'Three voices drifting over a cycle of about twelve seconds, into a hall heard from far off with little dry sound left.',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.0707, delayMs: 24.7 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 5.46, midDecay: 4.58 } },
    ],
  },
  {
    id: 'neon-rain-streetlamp-chorus',
    name: 'Streetlamp chorus',
    category: 'motion',
    description:
      'A short swell that rounds the front off every note, then two late copies either side, like loose double-tracking.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 168, release: 78 } },
      { deviceId: 'chorus', preset: 'Loose double' },
    ],
  },
  {
    id: 'neon-rain-shopfront-filter',
    name: 'Shopfront filter',
    category: 'motion',
    description:
      'A resonant low-pass that swings open about every two seconds, then a phaser that climbs for about two seconds and snaps back.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { lfoRateHz: 0.514, envAttackMs: 9.28, envReleaseMs: 210 },
      },
      { deviceId: 'phaser', preset: 'Saw riser', params: { rate: 0.552 } },
    ],
  },
  {
    id: 'neon-rain-sweep-after-rain',
    name: 'Sweep after rain',
    category: 'motion',
    description:
      'A ten-stage phaser that takes most of a minute to sweep, into a hall heard from far off with little dry sound left.',
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { rate: 0.0219 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 21.1, lowDecay: 5.16, midDecay: 4.51 },
      },
    ],
  },
  {
    id: 'neon-rain-back-alley-phaser',
    name: 'Back-alley phaser',
    category: 'motion',
    description:
      'A dark, thick valve curve mixed over some of the clean sound, then a ten-stage phaser falling from the top again and again.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'phaser', preset: 'Endless fall', params: { rate: 0.442 } },
    ],
  },
  {
    id: 'neon-rain-windscreen-breath',
    name: 'Windscreen breath',
    category: 'motion',
    description:
      'The level breathing in and out about every four seconds, into a reverb that breathes in slow waves over and over.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.278 } },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.95 } },
    ],
  },
  {
    id: 'neon-rain-signboard-phaser',
    name: 'Signboard phaser',
    category: 'motion',
    description:
      'A brightish valve curve, then a phaser kept up high, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { outputDb: -9.24 } },
      { deviceId: 'phaser', preset: 'Bass safe' },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { lowDecay: 4.46, midDecay: 4.38 },
      },
    ],
  },
  {
    id: 'neon-rain-choir-at-the-market',
    name: 'Choir at the market',
    category: 'motion',
    description:
      'A long tail that wavers in pitch like an unsteady choir, into a smeared wash of grains that climbs by octaves.',
    effects: [
      { deviceId: 'expanse', preset: 'Seasick choir', params: { decay: 19.3, modRate: 1.65 } },
      { deviceId: 'grain-delay', preset: 'Shimmer wash', params: { time: 496, size: 298 } },
    ],
  },
  {
    id: 'neon-rain-refinery-strings',
    name: 'Refinery strings',
    category: 'texture',
    description:
      'A wide string pad that picks up even the softest notes, then a phaser kept up high, into a far-off plate haze.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Catch all', params: { rise: 0.194, fall: 10.3 } },
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.388 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'neon-rain-back-alley-strings',
    name: 'Back-alley strings',
    category: 'texture',
    description:
      'A quiet string pad kept far behind the playing, then a falling phaser, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Barely there' },
      { deviceId: 'phaser', preset: 'Endless fall' },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 62.4, lowDecay: 7.51, midDecay: 1.85 },
      },
    ],
  },
  {
    id: 'neon-rain-fire-escape-mist',
    name: 'Fire-escape mist',
    category: 'texture',
    description:
      'A thin, high pad an octave up with nothing low in it, then a hollow phaser with peaks where its notches would be, into a mid-sized hall.',
    effects: [
      { deviceId: 'pad-follower', preset: 'High mist', params: { rise: 1.33, fall: 8.4 } },
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.262 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 59.5, lowDecay: 2.86, midDecay: 2.81 },
      },
    ],
  },
  {
    id: 'neon-rain-tube-lit-layers',
    name: 'Tube-lit layers',
    category: 'texture',
    description:
      'Recalled phrases that are remembered again and slowly gather, then smooth, dull converters whose clock is badly unsteady.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Gathering',
        params: { time: 619, reach: 25.4, size: 3.1 },
      },
      { deviceId: 'vintage-digital', preset: 'Jittery' },
    ],
  },
  {
    id: 'neon-rain-billboard-hold',
    name: 'Billboard hold',
    category: 'texture',
    description:
      'A quiet, unsmeared sustain that holds each note for seconds, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Long clean hold' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 30.3, modRate: 0.111 } },
    ],
  },
  {
    id: 'neon-rain-tunnel-till-morning',
    name: 'Tunnel till morning',
    category: 'texture',
    description:
      'A piece of each note looped into a long, swelling drone, then a resonant comb that seems to climb without end.',
    effects: [
      { deviceId: 'cascade', preset: 'Long drone', params: { time: 859 } },
      {
        deviceId: 'freq-shifter',
        preset: 'Barber pole',
        params: { delay: 10.9, lfoRate: 0.0865, mix: 0.374 },
      },
    ],
  },
  {
    id: 'neon-rain-gutter-mist',
    name: 'Gutter mist',
    category: 'texture',
    description:
      'A diffuse mist where each note hangs on after it is played, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'neon-rain-smog-frost',
    name: 'Smog frost',
    category: 'texture',
    description:
      'A thin, bright held pad with everything low taken out, then a gentle low-pass at a kilohertz.',
    effects: [
      { deviceId: 'sustainer', preset: 'High frost', params: { attack: 1.55, glide: 1.66 } },
      { deviceId: 'auto-filter', preset: 'Init' },
    ],
  },
  {
    id: 'neon-rain-mezzanine-wash',
    name: 'Mezzanine wash',
    category: 'texture',
    description:
      'A swell that stays low and arrives late, like a rocked pedal, then a very wide wash in which every note hangs for many seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'spectral-blur', preset: 'Endless', params: { mix: 0.535 } },
    ],
  },
  {
    id: 'neon-rain-high-rise-crystals',
    name: 'High-rise crystals',
    category: 'pitch',
    description:
      'Echoes that jump an octave on every repeat, left and right, into a wide hall that answers about a fifth of a second late.',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Crystal cascade',
        params: { v1Delay: 322, v2Delay: 500, v3Delay: 161, output: 4.56 },
      },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'neon-rain-storm-drain-ladder',
    name: 'Storm-drain ladder',
    category: 'pitch',
    description:
      'Each note replayed as an arpeggio of octaves and fifths, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'cascade', preset: 'Rising steps', params: { time: 233 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 35.5, mix: 0.273 } },
    ],
  },
  {
    id: 'neon-rain-wash-in-the-alley',
    name: 'Wash in the alley',
    category: 'pitch',
    description:
      'A soft wash of octave and fifth loops over each note, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'cascade', preset: 'Sparkle bed' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 37.9 } },
    ],
  },
  {
    id: 'neon-rain-atrium-stairs',
    name: 'Atrium stairs',
    category: 'pitch',
    description:
      'Echoes that climb an octave on every repeat, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Rising steps', params: { size: 63.8, delay: 361 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 19.8, modRate: 0.229 } },
    ],
  },
  {
    id: 'neon-rain-late-shift-crystals',
    name: 'Late-shift crystals',
    category: 'pitch',
    description:
      'Grain repeats that climb an octave on every pass, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { time: 387, size: 124 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'neon-rain-smog-dimmed-bass',
    name: 'Smog-dimmed bass',
    category: 'pitch',
    description:
      'Dark voices one and two octaves below the dry sound, into a full reverb with the whole sound pushed extra wide.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Two octaves' },
      { deviceId: 'bloom-reverb', preset: 'Wide summer' },
    ],
  },
  {
    id: 'neon-rain-fire-escape-depths',
    name: 'Fire-escape depths',
    category: 'pitch',
    description:
      'A copy two octaves down, then a space that answers in hard separate echoes, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves' },
      { deviceId: 'expanse', preset: 'Hard echoes', params: { decay: 3.52, modRate: 0.397 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 51.8, lowDecay: 4.42, midDecay: 2.69 },
      },
    ],
  },
  {
    id: 'neon-rain-balcony-octave',
    name: 'Balcony octave',
    category: 'pitch',
    description:
      'A single voice an octave below the dry sound, darkened, then three detuned voices spread hard apart with no dry sound.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave down', params: { size: 95.5 } },
      { deviceId: 'chorus', preset: 'Voices only' },
    ],
  },
  {
    id: 'neon-rain-sodium-octaves',
    name: 'Sodium octaves',
    category: 'pitch',
    description:
      'An octave above and an octave below, clean on chords, then a quick loop of about the last half second, soon faded.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octaves both' },
      { deviceId: 'micro-looper', preset: 'Quick loop' },
    ],
  },
  {
    id: 'neon-rain-lantern-shadow',
    name: 'Lantern shadow',
    category: 'pitch',
    description:
      'A dull copy an octave below, close behind each note, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Sub shadow', params: { time: 58.2, size: 171 } },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 270, modRate: 0.834 } },
    ],
  },
  {
    id: 'neon-rain-stairs-in-the-rain',
    name: 'Stairs in the rain',
    category: 'pitch',
    description:
      'Each phrase climbing in slow soft steps, an octave at a time, then a wide pad made of the sound with its attacks dissolved.',
    effects: [
      { deviceId: 'cascade', preset: 'Slow staircase' },
      { deviceId: 'spectral-blur', preset: 'Pad from anything' },
    ],
  },
  {
    id: 'neon-rain-after-hours-pipes',
    name: 'After-hours pipes',
    category: 'pitch',
    description:
      'Four octaves of pipes that swell in behind each note, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'octaves', preset: 'Cathedral', params: { attack: 0.302 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.21 } },
    ],
  },
  {
    id: 'neon-rain-high-rise-jangle',
    name: 'High-rise jangle',
    category: 'pitch',
    description:
      'A detuned octave above each note, like doubled strings, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string' },
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 281, modRate: 0.893, mix: 0.24 },
      },
    ],
  },
  {
    id: 'neon-rain-walkway-hop',
    name: 'Walkway hop',
    category: 'pitch',
    description:
      'An echo whose repeats jump up an octave and back, then a phaser held still, two fixed peaks like a vowel.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 397, modRate: 0.666 } },
      { deviceId: 'phaser', preset: 'Still formant' },
    ],
  },
  {
    id: 'neon-rain-glow-in-the-flare',
    name: 'Glow in the flare',
    category: 'master',
    description:
      'A lopsided soft curve that adds the octave above each note, then a low ceiling that keeps loud passages down for a while.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'ambient-limiter', preset: 'Late night' },
    ],
  },
  {
    id: 'neon-rain-after-hours-lift',
    name: 'After-hours lift',
    category: 'master',
    description:
      'A parallel compressor that lifts quiet playing and tails, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'neon-rain-sprawling-width',
    name: 'Sprawling width',
    category: 'master',
    description:
      'A low cut and some presence, then the sides lifted a little, wider with nothing added, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Voice', params: { clearTime: 1.62 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.35, gain: 2.34 } },
    ],
  },
  {
    id: 'neon-rain-trace-in-light-rain',
    name: 'Trace in light rain',
    category: 'master',
    description:
      'A faint hall tail of about three seconds, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 36.7, lowDecay: 2.59, midDecay: 3.11 },
      },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'neon-rain-glue-in-the-alley',
    name: 'Glue in the alley',
    category: 'master',
    description:
      'A warm, full equaliser, then a quicker compressor, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.67 } },
      { deviceId: 'ambient-comp', preset: 'Mic' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'neon-rain-shopfront-reel',
    name: 'Shopfront reel',
    category: 'master',
    description:
      'A reel driven hot, then a fast compressor that takes the spike off plucked notes, then a safety limiter.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { attack: 10.2, release: 0.158 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
]
