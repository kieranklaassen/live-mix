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
      'A wide chorus drifting over a cycle of about twelve seconds, then a chorused echo, into a large space whose tail swells in behind each note.',
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
      'A hollow chorus that swells over about ten seconds, then a steady tape echo with no wobble, dirt or dulling, into a far-off hall.',
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
      'A plain chorus, then a clean, steady echo with no wobble and little dulling, into a damped hall whose tail lasts ten seconds and more.',
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
      'A thick ensemble chorus, then a soft bucket-brigade echo, into a damped hall whose tail lasts ten seconds and more.',
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
      'A plain chorus, then two tape heads that make every repeat gallop, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus' },
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 631 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 8.83, modRate: 0.351 } },
    ],
  },
  {
    id: 'neon-rain-plate-behind-blinds',
    name: 'Plate behind blinds',
    category: 'space',
    description:
      'A very slow swell, then a far-off plate haze with a long, soft tail, then the converters of an early sampler, soft on top and gritty.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
      { deviceId: 'vintage-digital', preset: 'Sampler' },
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
    id: 'neon-rain-hall-by-the-sign',
    name: 'Hall by the sign',
    category: 'space',
    description:
      'Two copies heard just after the sound, the left one first, into a large hall heard alone with none of the dry sound left.',
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
      'A wide open space with a slowly wavering tail, then a compressor so slow it rides the level over many seconds.',
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
    id: 'neon-rain-plate-at-curfew',
    name: 'Plate at curfew',
    category: 'space',
    description:
      'A plate heard alone with none of the dry sound left, then a full chorus spread wide to left and right.',
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
    id: 'neon-rain-sheen-in-steam',
    name: 'Sheen in steam',
    category: 'space',
    description:
      'A bowed swell that lets part of each attack through, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
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
    id: 'neon-rain-hall-below-towers',
    name: 'Hall below towers',
    category: 'space',
    description:
      'A dark low-pass that blooms, then a slowly breathing hall, then an early sampler whose quiet tails crumble to grain.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Soft bloom',
        params: { lfoRateHz: 1.04, envAttackMs: 129, envReleaseMs: 826 },
      },
      { deviceId: 'fdn-reverb', preset: 'Breathing' },
      { deviceId: 'patina', preset: 'Early sampler', params: { output: 5.32 } },
    ],
  },
  {
    id: 'neon-rain-halogen-hall',
    name: 'Halogen hall',
    category: 'space',
    description:
      'A string-like swell, then a long bright reverb tail kept low behind the sound, then early sampler converters.',
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 373, release: 558 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
      { deviceId: 'vintage-digital', preset: 'Sampler' },
    ],
  },
  {
    id: 'neon-rain-tenth-floor-swell',
    name: 'Tenth-floor swell',
    category: 'space',
    description:
      'A short, rounding swell, then a vast hall that opens to the sound in very slow waves, then dull, hissing converters.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 177, release: 76 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 10.5 } },
      { deviceId: 'vintage-digital', preset: 'Dusty' },
    ],
  },
  {
    id: 'neon-rain-sky-at-shift-end',
    name: 'Sky at shift end',
    category: 'space',
    description:
      'A first-note swell, then a wide open space with a slowly wavering tail, then dull ten-bit converters that hiss along with every note.',
    effects: [
      { deviceId: 'swell', preset: 'First note only' },
      { deviceId: 'expanse', preset: 'Open space', params: { modRate: 0.41 } },
      { deviceId: 'vintage-digital', preset: 'Dusty' },
    ],
  },
  {
    id: 'neon-rain-elevator-sway',
    name: 'Elevator sway',
    category: 'space',
    description:
      'An equaliser that adds lows and body and eases the top, into a hall that sways in pitch with a trace of the octave above.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.58 } },
      { deviceId: 'shimmer', preset: 'Swaying hall', params: { mix: 0.21 } },
    ],
  },
  {
    id: 'neon-rain-hall-at-the-market',
    name: 'Hall at the market',
    category: 'space',
    description:
      'Two dull copies that wander in a haze round the notes, into a plain hall that rings for about three seconds.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze', params: { delay: 16.6 } },
      { deviceId: 'shimmer', preset: 'Plain hall' },
    ],
  },
  {
    id: 'neon-rain-plate-past-midnight',
    name: 'Plate past midnight',
    category: 'space',
    description:
      'A low cut with some air, then a wide room heard from its far end, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.38 } },
      { deviceId: 'ether-reverb', preset: 'Distant' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 14.9 } },
    ],
  },
  {
    id: 'neon-rain-wet-neon-valley',
    name: 'Wet-neon valley',
    category: 'space',
    description:
      'A short swell that rounds the front off every note, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 11, predelayMs: 119, breathRate: 0.307 },
      },
    ],
  },
  {
    id: 'neon-rain-echoes-across-town',
    name: 'Echoes across town',
    category: 'space',
    description:
      'A pan that wanders to a new place every second or so, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'tremolo', preset: 'Wandering pan' },
      { deviceId: 'expanse', preset: 'Far echoes' },
    ],
  },
  {
    id: 'neon-rain-smog-haze',
    name: 'Smog haze',
    category: 'space',
    description:
      'A swell that takes seconds to rise after each silence, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2810, release: 755 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'neon-rain-plate-below-towers',
    name: 'Plate below towers',
    category: 'space',
    description:
      'Soft clipping, a little bright, laid under the clean sound, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Drum bus crunch' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 19.2 } },
    ],
  },
  {
    id: 'neon-rain-streetlamp-ascent',
    name: 'Streetlamp ascent',
    category: 'space',
    description:
      'A vast reverb where most of the tail climbs by octaves, into a dark reverb that rises behind each note, then lingers.',
    effects: [
      { deviceId: 'shimmer', preset: 'Endless ascent', params: { decay: 29.1, predelay: 64.7 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost' },
    ],
  },
  {
    id: 'neon-rain-neon-ring',
    name: 'Neon ring',
    category: 'space',
    description:
      'A gentle high cut that shades the top end, into sixteen strings that learn the tune and ring on long.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'sympathetic', preset: 'Learn and hold', params: { decay: 9.9 } },
    ],
  },
  {
    id: 'neon-rain-searchlight-vault',
    name: 'Searchlight vault',
    category: 'space',
    description:
      'A cathedral with about six seconds of tail, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.27 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'neon-rain-flare-stack-echo',
    name: 'Flare-stack echo',
    category: 'echo',
    description:
      'Two copies that repeat into a blur round the upper notes, then a clean, steady echo with no wobble and little dulling.',
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
      'Repeats that climb in pitch on the left, sink on the right, then a wide echo whose repeats drift slowly in pitch.',
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
      'A sharp copy hard left, a flat one hard right, heard alone, then a tape echo whose three heads make a cluster of each repeat.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only', params: { delay: 16.5 } },
      { deviceId: 'tape-echo', preset: 'Three heads' },
    ],
  },
  {
    id: 'neon-rain-elevator-echo',
    name: 'Elevator echo',
    category: 'echo',
    description:
      'A plain echo whose repeats bounce from side to side, then a big lift of the low end that puts weight under the sound.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Side to side' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.16 } },
    ],
  },
  {
    id: 'neon-rain-after-hours-phrase',
    name: 'After-hours phrase',
    category: 'echo',
    description:
      'Whole phrases coming back three times, each one duller, into a long bright reverb tail kept low behind the sound.',
    effects: [
      { deviceId: 'cascade', preset: 'Phrase returns' },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
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
      'Echoes that fall a fourth further on every repeat, then a full-range sharp and flat copy, wide to either side.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Falling steps', params: { size: 76.1, delay: 418 } },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'neon-rain-signboard-echo',
    name: 'Signboard echo',
    category: 'echo',
    description:
      'A gentle flanger sweeping about every four seconds, then grain repeats that climb an octave on every pass.',
    effects: [
      { deviceId: 'flanger', preset: 'Gentle sweep', params: { rate: 0.252, delayMs: 2.79 } },
      { deviceId: 'grain-delay', preset: 'Crystals' },
    ],
  },
  {
    id: 'neon-rain-searchlight-echoes',
    name: 'Searchlight echoes',
    category: 'echo',
    description:
      'A wide chorus drifting over a cycle of about twelve seconds, then echoes that climb an octave on every repeat.',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.0713, delayMs: 24.5 } },
      { deviceId: 'pitch-shifter', preset: 'Rising steps', params: { size: 54.4, delay: 352 } },
    ],
  },
  {
    id: 'neon-rain-echo-in-low-light',
    name: 'Echo in low light',
    category: 'echo',
    description:
      'A low, resonant flanger diving over about ten seconds, then dotted tape repeats that pile up in a darkening wash.',
    effects: [
      { deviceId: 'flanger', preset: 'Deep dive' },
      { deviceId: 'tape-echo', preset: 'Dub wash', params: { time: 659 } },
    ],
  },
  {
    id: 'neon-rain-rain-wet-echo',
    name: 'Rain-wet echo',
    category: 'echo',
    description:
      'A bucket-brigade echo with a slow chorus on its repeats, then echoes that jump an octave on every repeat, left and right.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 300, modRate: 0.89 } },
      { deviceId: 'lattice', preset: 'Crystal cascade', params: { output: 3.84 } },
    ],
  },
  {
    id: 'neon-rain-freeway-echo',
    name: 'Freeway echo',
    category: 'echo',
    description:
      'A triode valve stage, smoothly overdriven, then octave-falling grain echoes, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { time: 562, size: 233 } },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'neon-rain-steam-grate-haze',
    name: 'Steam-grate haze',
    category: 'echo',
    description:
      'A wash of three fed-back tape heads that hovers and fades, then a stereo image widened a little, with the bass left central.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Hovering wash', params: { time: 945 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'neon-rain-octaves-in-the-alley',
    name: 'Octaves in the alley',
    category: 'echo',
    description:
      'A swell that fades every note in like a bow stroke, then echoes that climb an octave on every repeat.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 433, release: 132 } },
      { deviceId: 'pitch-shifter', preset: 'Rising steps', params: { size: 55.9, delay: 304 } },
    ],
  },
  {
    id: 'neon-rain-billboard-trail',
    name: 'Billboard trail',
    category: 'echo',
    description:
      'A slow echo with a long dark trail and a few recollections, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Dark trail',
        params: { time: 1220, reach: 30.4, size: 4.64 },
      },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'neon-rain-billboard-echo',
    name: 'Billboard echo',
    category: 'echo',
    description:
      'A few decibels of soft saturation with the top eased, then an echo whose repeats hop up a fifth and down a fourth.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: -5.8 } },
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 303, modRate: 0.672 } },
    ],
  },
  {
    id: 'neon-rain-precinct-sampler',
    name: 'Precinct sampler',
    category: 'tape',
    description:
      'A muffled early sampler, its top filtered away, then a space that answers in hard separate echoes.',
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
      'The converters of an early sampler, soft on top and gritty, then dotted tape repeats that pile up in a darkening wash.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler' },
      { deviceId: 'tape-echo', preset: 'Dub wash' },
    ],
  },
  {
    id: 'neon-rain-glass-in-the-atrium',
    name: 'Glass in the atrium',
    category: 'tape',
    description:
      'Old converters left unsmoothed, with a glassy ring on top, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glassy' },
      { deviceId: 'hall-reverb', preset: 'Bright hall' },
    ],
  },
  {
    id: 'neon-rain-chromed-sampler',
    name: 'Chromed sampler',
    category: 'tape',
    description:
      'A huge bright space with a wide and very long tail, then dull ten-bit converters that hiss along with every note.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 44.8, mix: 0.24 } },
      { deviceId: 'vintage-digital', preset: 'Dusty' },
    ],
  },
  {
    id: 'neon-rain-foundry-converter',
    name: 'Foundry converter',
    category: 'tape',
    description:
      'A dark hall that takes about twenty seconds to die away, then converters at a very low rate, filtered smooth and dull.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0787 } },
      { deviceId: 'vintage-digital', preset: 'Sunken' },
    ],
  },
  {
    id: 'neon-rain-girder-converter',
    name: 'Girder converter',
    category: 'tape',
    description:
      'A fully damped hall with a few seconds of tail, then the converters of an early sampler, soft on top and gritty.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 19.7 } },
      { deviceId: 'vintage-digital', preset: 'Sampler' },
    ],
  },
  {
    id: 'neon-rain-back-alley-sampler',
    name: 'Back-alley sampler',
    category: 'tape',
    description:
      'A wide open space with a slowly wavering tail, then worn nine-bit converters, grainy, hissing on the high notes.',
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 8.92, modRate: 0.443 } },
      { deviceId: 'vintage-digital', preset: 'Worn' },
    ],
  },
  {
    id: 'neon-rain-atrium-sampler',
    name: 'Atrium sampler',
    category: 'tape',
    description:
      'Worn nine-bit converters, grainy, hissing on the high notes, into a wide room heard from its far end.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Worn' },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.523 } },
    ],
  },
  {
    id: 'neon-rain-basin-chorus',
    name: 'Basin chorus',
    category: 'motion',
    description:
      'A full chorus spread wide to left and right, then a rising C pentatonic run, into a plain hall with about four seconds of tail.',
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
    id: 'neon-rain-sprawling-drift',
    name: 'Sprawling drift',
    category: 'motion',
    description:
      'A wide chorus drifting over a cycle of about twelve seconds, into a damped hall of about five seconds, heard from far off.',
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
      'A short swell that rounds the front off every note, then a late copy on each side, like the same part played twice.',
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
      'A ten-stage phaser that takes most of a minute to sweep, into a damped hall of about five seconds, heard from far off.',
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
      'Dark, thick valve grit that fills out the low end, then a ten-stage phaser falling from the top again and again.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'phaser', preset: 'Endless fall', params: { rate: 0.442 } },
    ],
  },
  {
    id: 'neon-rain-lantern-filter',
    name: 'Lantern filter',
    category: 'motion',
    description:
      'A resonant upper-mid peak that rises when played hard, then a thin band of tone with the lows cut and the top rolled off.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Resonant peak' },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { clearTime: 1.54 } },
    ],
  },
  {
    id: 'neon-rain-phaser-at-the-kerb',
    name: 'Phaser at the kerb',
    category: 'motion',
    description:
      'A phaser with no dry sound, pulling the two sides apart, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'phaser', preset: 'Stereo scatter' },
      { deviceId: 'expanse', preset: 'Far echoes' },
    ],
  },
  {
    id: 'neon-rain-pylon-sway',
    name: 'Pylon sway',
    category: 'motion',
    description:
      'A slow pan from side to side, a few seconds each way, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan' },
      { deviceId: 'expanse', preset: 'Open space' },
    ],
  },
  {
    id: 'neon-rain-cloud-at-the-kerb',
    name: 'Cloud at the kerb',
    category: 'motion',
    description:
      'A wide detune, sharp on the left and flat on the right, then a dense many-notched phaser drifting opposite on each side.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Detuned', params: { delay: 40.3, lfoRate: 0.523 } },
      { deviceId: 'phaser', preset: 'Twelve stage cloud' },
    ],
  },
  {
    id: 'neon-rain-curfew-swirl',
    name: 'Curfew swirl',
    category: 'motion',
    description:
      'A slow phaser swirl, then a wide echo whose repeats drift slowly in pitch, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 652, modRate: 0.101 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 36.8, lowDecay: 2.62, midDecay: 3.09 },
      },
    ],
  },
  {
    id: 'neon-rain-dashboard-chorus',
    name: 'Dashboard chorus',
    category: 'motion',
    description:
      'A plain chorus with a detuned copy towards each side, into a brief swell of reverb close behind each note.',
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.875, delayMs: 10.6 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo' },
    ],
  },
  {
    id: 'neon-rain-phaser-in-light-rain',
    name: 'Phaser in light rain',
    category: 'motion',
    description:
      'A deep eight-stage phaser with sharp peaks between notches, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.19 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
    ],
  },
  {
    id: 'neon-rain-girder-rotary',
    name: 'Girder rotary',
    category: 'motion',
    description:
      'A slow rotating speaker heard from across the room, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.551 } },
    ],
  },
  {
    id: 'neon-rain-sweep-by-the-vents',
    name: 'Sweep by the vents',
    category: 'motion',
    description:
      'A flanger that takes about twelve seconds over each sweep, into a thin veil of reverb kept low under the sound.',
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { decay: 2.57, breathRate: 0.275 } },
    ],
  },
  {
    id: 'neon-rain-basin-flanger',
    name: 'Basin flanger',
    category: 'motion',
    description:
      'A hollow flanger that sweeps every two or three seconds, then a bright blurred cloud an octave above everything played.',
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.425, delayMs: 1.63 } },
      { deviceId: 'spectral-blur', preset: 'Bright octave cloud' },
    ],
  },
  {
    id: 'neon-rain-refinery-strings',
    name: 'Refinery strings',
    category: 'texture',
    description:
      'A wide string pad that picks up even the softest notes, then a phaser kept up high, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Catch all', params: { rise: 0.194, fall: 10.3 } },
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.388 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'neon-rain-fire-escape-mist',
    name: 'Fire-escape mist',
    category: 'texture',
    description:
      'A thin, high pad an octave up with nothing low in it, then a hollow peaking phaser, into a hall with about two and a half seconds of tail.',
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
      'Earlier phrases that return over and over and slowly gather, then smooth, dull converters with a hiss that rides high notes.',
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
    id: 'neon-rain-walkway-halo',
    name: 'Walkway halo',
    category: 'texture',
    description:
      'A bright, thin pad an octave up that follows closely, then a light chorus that widens more than it moves, into a mid-sized hall.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Glassy', params: { rise: 0.16, fall: 2.35 } },
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.326, delayMs: 7.44 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 66.8, lowDecay: 2.76, midDecay: 2.51 },
      },
    ],
  },
  {
    id: 'neon-rain-strings-on-wet-glass',
    name: 'Strings on wet glass',
    category: 'texture',
    description:
      'A quick string double, then a deep flanger that sweeps right up through the top, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Doubler', params: { rise: 0.044, fall: 0.836 } },
      { deviceId: 'flanger', preset: 'Through-zero feel' },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'neon-rain-awning-trace',
    name: 'Awning trace',
    category: 'texture',
    description:
      'A short glow of held tone that dies just after each note, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'sustainer', preset: 'Brief afterglow' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 5.49 } },
    ],
  },
  {
    id: 'neon-rain-sustain-at-shift-end',
    name: 'Sustain at shift end',
    category: 'texture',
    description:
      'A slow swell after each silence that opens only at the end, then a long clear sustain that holds each note for seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise' },
      { deviceId: 'spectral-blur', preset: 'Long clean hold' },
    ],
  },
  {
    id: 'neon-rain-depths-by-the-vents',
    name: 'Depths by the vents',
    category: 'texture',
    description:
      'A blurred bed of bass that hangs low under the sound, then the tone rocking slowly from dark to bright, sides opposed.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
      { deviceId: 'tremolo', preset: 'Tilting tone' },
    ],
  },
  {
    id: 'neon-rain-smog-dimmed-bass',
    name: 'Smog-dimmed bass',
    category: 'pitch',
    description:
      'Dark voices one and two octaves below the dry sound, into a gently rising reverb with the whole sound made extra wide.',
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
      'A single darkened voice an octave below the dry sound, then a chorus heard alone, its detuned copies spread hard apart.',
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
      'An octave above and an octave below, clean on chords, then a quick loop of about the last half second that soon fades.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octaves both' },
      { deviceId: 'micro-looper', preset: 'Quick loop' },
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
    id: 'neon-rain-glitter-in-wet-neon',
    name: 'Glitter in wet neon',
    category: 'pitch',
    description:
      'Sparse short grains two octaves up, after each note, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'grain-delay', preset: 'High glitter', params: { time: 264, size: 40.8 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { predelayMs: 176 } },
    ],
  },
  {
    id: 'neon-rain-arcade-echoes',
    name: 'Arcade echoes',
    category: 'pitch',
    description:
      'Echoes that jump an octave on every repeat, left and right, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'lattice', preset: 'Crystal cascade', params: { output: 6.1 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 7.71, breathRate: 0.183 } },
    ],
  },
  {
    id: 'neon-rain-gantry-glitter',
    name: 'Gantry glitter',
    category: 'pitch',
    description:
      'Scattered sparks two octaves up, echoing higher still, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'High sparks', params: { size: 27.7, delay: 221 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 13.9, modRate: 0.27 } },
    ],
  },
  {
    id: 'neon-rain-late-shift-echoes',
    name: 'Late-shift echoes',
    category: 'pitch',
    description:
      'Each note answered by a rising C pentatonic run of echoes, into a long bright reverb tail kept low behind the sound.',
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Pentatonic harp',
        params: { v1Delay: 123, v2Delay: 284, v3Delay: 458, v4Delay: 462, output: 2.55 },
      },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 26.4 } },
    ],
  },
  {
    id: 'neon-rain-rain-below-towers',
    name: 'Rain below towers',
    category: 'pitch',
    description:
      'A fast glittering stutter of plucked octaves over each note, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain', params: { time: 127 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 11.2, breathRate: 0.0514 } },
    ],
  },
  {
    id: 'neon-rain-curfew-undertow',
    name: 'Curfew undertow',
    category: 'pitch',
    description:
      'A slow breathing level, then a dark, smooth half-speed octave under the dry sound, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1250 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 41.3, mix: 0.305 } },
    ],
  },
  {
    id: 'neon-rain-sub-level-organ',
    name: 'Sub-level organ',
    category: 'pitch',
    description:
      'Every note doubled one and two octaves below and above, then a low cut that thins the bass, with a little air on top.',
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.6 } },
    ],
  },
  {
    id: 'neon-rain-overcast-undertow',
    name: 'Overcast undertow',
    category: 'pitch',
    description:
      'A dark, smooth half-speed octave under the dry sound, into a long reverb whose tail wavers queasily in pitch.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix' },
      { deviceId: 'expanse', preset: 'Seasick choir', params: { decay: 18.1, modRate: 1.56 } },
    ],
  },
  {
    id: 'neon-rain-fifth-below-ground',
    name: 'Fifth below ground',
    category: 'pitch',
    description:
      'A slowed copy a fifth below, running on beside the dry sound, then a bed of six-bit grit and false tones under the clean sound.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down bed', params: { length: 1720 } },
      { deviceId: 'vintage-digital', preset: 'Grit bed' },
    ],
  },
  {
    id: 'neon-rain-lacquer-in-steam',
    name: 'Lacquer in steam',
    category: 'master',
    description:
      'A rumble cut and a small lift of presence, then a stereo image widened a little, with the bass left central, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.39 } },
    ],
  },
  {
    id: 'neon-rain-neon-mixdown',
    name: 'Neon mixdown',
    category: 'master',
    description:
      'A parallel compressor, then a slightly wider image, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 383, release: 3.08 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 2.01 } },
    ],
  },
  {
    id: 'neon-rain-finish-under-neon',
    name: 'Finish under neon',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a gentle compressor, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { gain: 2.38 } },
    ],
  },
  {
    id: 'neon-rain-finish-at-shift-end',
    name: 'Finish at shift end',
    category: 'master',
    description:
      'Tape-style saturation that rounds only the loudest peaks, then a subsonic cut, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-eq', preset: 'Master' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.65 } },
    ],
  },
  {
    id: 'neon-rain-night-market-finish',
    name: 'Night-market finish',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then an even-handed compressor, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { attack: 119, release: 1.47 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
  {
    id: 'neon-rain-slow-lane-master',
    name: 'Slow-lane master',
    category: 'master',
    description:
      'A subsonic cut, then a parallel compressor that lifts quiet playing and tails, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 2.65 } },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 411, release: 2.94 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
]
