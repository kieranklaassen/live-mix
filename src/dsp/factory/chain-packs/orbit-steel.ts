// Steel in Slow Orbit: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'orbit-steel-lunar-space',
    name: 'Lunar space',
    category: 'space',
    description:
      'A half-hidden slow swell, then a single saturated tape echo close behind each note, into a space whose tail flutters quickly in pitch.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1370, release: 325 } },
      { deviceId: 'tape-echo', preset: 'Single slap' },
      { deviceId: 'expanse', preset: 'Fast flutter', params: { decay: 5.45 } },
    ],
  },
  {
    id: 'orbit-steel-nave-past-the-moon',
    name: 'Nave past the moon',
    category: 'space',
    description:
      'A bowed swell that lets part of each attack through, then two copies heard just after the sound, the left one first, into a vast nave.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed' },
      { deviceId: 'stereo-detune', preset: 'Late copy' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'orbit-steel-county-fair-hall',
    name: 'County-fair hall',
    category: 'space',
    description:
      'A volume-pedal swell, then a short, soft tape echo close behind the playing, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 52, lowDecay: 4.11, midDecay: 2.73 },
      },
    ],
  },
  {
    id: 'orbit-steel-cabin-hall',
    name: 'Cabin hall',
    category: 'space',
    description:
      'A swell that takes seconds to rise after each silence, then a tight cluster of tape repeats, like a very small room, into a far-off hall.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2380, release: 697 } },
      { deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { time: 92.5 } },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'orbit-steel-crescent-plate',
    name: 'Crescent plate',
    category: 'space',
    description:
      'A volume-pedal swell, then a single saturated tape echo close behind each note, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 90.1 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'orbit-steel-earthrise-plate',
    name: 'Earthrise plate',
    category: 'space',
    description:
      'Tape-style saturation that rounds peaks and dulls the top, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -14 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'orbit-steel-hall-above-it-all',
    name: 'Hall above it all',
    category: 'space',
    description:
      'A big lift of the low end, then a rising, cut-off reverb, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 1.05, mix: 0.27 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { preDelay: 22.1, lowDecay: 3.83, midDecay: 4.45 },
      },
    ],
  },
  {
    id: 'orbit-steel-hovering-voices',
    name: 'Hovering voices',
    category: 'space',
    description:
      'A gentle high cut that shades the top end, into a hall whose choir wanders from vowel to vowel.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.43 } },
      { deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { decay: 8.67, preDelay: 20.8 } },
    ],
  },
  {
    id: 'orbit-steel-plate-at-earthrise',
    name: 'Plate at earthrise',
    category: 'space',
    description:
      'A stereo image widened a little, with the bass left central, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 16.8 } },
    ],
  },
  {
    id: 'orbit-steel-hall-on-the-porch',
    name: 'Hall on the porch',
    category: 'space',
    description:
      'A fast, steady reel with soft saturation, into a hall that answers about a quarter of a second late.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'fdn-reverb', preset: 'Late arrival' },
    ],
  },
  {
    id: 'orbit-steel-hall-at-the-dance',
    name: 'Hall at the dance',
    category: 'space',
    description:
      'A late swell on every note like a rocked volume pedal, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 268, release: 138 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
    ],
  },
  {
    id: 'orbit-steel-outbound-plate',
    name: 'Outbound plate',
    category: 'space',
    description:
      'A hard pan that jumps from one side to the other, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'tremolo', preset: 'Side to side', params: { rate: 2.37 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 57.3 } },
    ],
  },
  {
    id: 'orbit-steel-sagebrush-cavern',
    name: 'Sagebrush cavern',
    category: 'space',
    description:
      'A big muffled cave that rings for about six seconds, then a second take either side, a little late and out of tune.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Dark cave' },
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { delay: 35.9 } },
    ],
  },
  {
    id: 'orbit-steel-buoyant-plate',
    name: 'Buoyant plate',
    category: 'space',
    description:
      'A slow rotating speaker with its amplifier driven hard, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'rotary', preset: 'Slow burn' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 36.1, mix: 0.31 } },
    ],
  },
  {
    id: 'orbit-steel-creekside-vault',
    name: 'Creekside vault',
    category: 'space',
    description:
      'Bright tape-style saturation mixed in under the clean sound, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { preDelay: 98.6, midDecay: 7 } },
    ],
  },
  {
    id: 'orbit-steel-translunar-haze',
    name: 'Translunar haze',
    category: 'space',
    description:
      'A swell so late that notes seem to play in reverse, then two copies a moment late, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'swell', preset: 'Backwards' },
      { deviceId: 'stereo-detune', preset: 'Late copy' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'orbit-steel-homesick-fifths',
    name: 'Homesick fifths',
    category: 'space',
    description:
      'The level breathing in and out about every four seconds, into a reverb whose tail climbs in fifths as it rings.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.24 } },
      { deviceId: 'shimmer', preset: 'Fifths', params: { decay: 9.55, predelay: 20.9 } },
    ],
  },
  {
    id: 'orbit-steel-halo-miles-up',
    name: 'Halo miles up',
    category: 'space',
    description:
      'A slow swell on only the first note after each silence, into a reverb whose tail drifts up towards the fifth as it rings.',
    effects: [
      { deviceId: 'swell', preset: 'First note only' },
      { deviceId: 'bloom-reverb', preset: 'Rising fifths' },
    ],
  },
  {
    id: 'orbit-steel-halo-in-harmonics',
    name: 'Halo in harmonics',
    category: 'space',
    description:
      'A quick fade-in that only softens the edge of each note, into a small still reverb ringing in stacked octaves and fifths.',
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 48.7, release: 61.5 } },
      { deviceId: 'shimmer', preset: 'Still pipes', params: { decay: 20.3, predelay: 21.8 } },
    ],
  },
  {
    id: 'orbit-steel-halo-off-the-ridge',
    name: 'Halo off the ridge',
    category: 'space',
    description:
      'A swell that fades every note in like a bow stroke, into a vast reverb where most of the tail climbs by octaves.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 436, release: 165 } },
      { deviceId: 'shimmer', preset: 'Endless ascent' },
    ],
  },
  {
    id: 'orbit-steel-tide-at-last-call',
    name: 'Tide at last call',
    category: 'space',
    description:
      'A small room that is over in about a second, into a reverb that swells and ebbs in waves of over a second each.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { preDelay: 26.8, lowDecay: 1.42, midDecay: 1.33 },
      },
      { deviceId: 'shaped-reverb', preset: 'Slow tide' },
    ],
  },
  {
    id: 'orbit-steel-moonlit-whisper',
    name: 'Moonlit whisper',
    category: 'space',
    description:
      'A two-spring tank with its input driven into saturation, into a medium hall with only a breath of voice in its tail.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Overdriven tank', params: { decay: 1.79, mix: 0.275 } },
      {
        deviceId: 'vowel-reverb',
        preset: 'Whispering',
        params: { decay: 3.29, preDelay: 20.2, mix: 0.18 },
      },
    ],
  },
  {
    id: 'orbit-steel-cloud-in-slow-orbit',
    name: 'Cloud in slow orbit',
    category: 'space',
    description:
      'A dark reverb that rises behind each note, then lingers, then a deep pitch wobble with the two sides bending out of step.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Ghost' },
      { deviceId: 'tremolo', preset: 'Wide wobble', params: { rate: 3.01 } },
    ],
  },
  {
    id: 'orbit-steel-dance-hall-halo',
    name: 'Dance-hall halo',
    category: 'space',
    description:
      'A mellow reverb whose tail splits up and down in pitch, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Scatter' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 21.3 } },
    ],
  },
  {
    id: 'orbit-steel-space-after-liftoff',
    name: 'Space after liftoff',
    category: 'space',
    description:
      'A wide open space with a slowly wavering tail, then a big lift of the low end that puts weight under the sound.',
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.308 } },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'orbit-steel-room-after-liftoff',
    name: 'Room after liftoff',
    category: 'space',
    description:
      'A sharp and a flat copy of the highs only, to either side, into a reverb that fades evenly to nothing in a second or two.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Top only', params: { delay: 13.3 } },
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { time: 1.79, preDelay: 20.7 } },
    ],
  },
  {
    id: 'orbit-steel-tethered-echo',
    name: 'Tethered echo',
    category: 'echo',
    description:
      'A faint trace of tape echo behind the playing, then a combo amplifier driven hard and recorded right up close, into a dull single spring.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace' },
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { output: -3.6 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { decay: 1.54 } },
    ],
  },
  {
    id: 'orbit-steel-campfire-embers',
    name: 'Campfire embers',
    category: 'echo',
    description:
      'A combo amplifier heard from the far side of a big room, then grain repeats that fall an octave and darken each time.',
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'grain-delay', preset: 'Falling embers' },
    ],
  },
  {
    id: 'orbit-steel-echo-at-moonrise',
    name: 'Echo at moonrise',
    category: 'echo',
    description:
      'A soft echo while earlier phrases drift back under it, then an echo whose repeats hop up a fifth and down a fourth.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Recalling',
        params: { time: 473, reach: 18.2, size: 3.18 },
      },
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 303, modRate: 0.603 } },
    ],
  },
  {
    id: 'orbit-steel-crater-echo',
    name: 'Crater echo',
    category: 'echo',
    description:
      'Tape repeats that lose their lows and thin out as they fade, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 38.3 } },
    ],
  },
  {
    id: 'orbit-steel-echo-headed-home',
    name: 'Echo headed home',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'orbit-steel-splashdown-memory',
    name: 'Splashdown memory',
    category: 'echo',
    description:
      'Earlier moments of the playing that keep drifting back, into a small room that sparkles two octaves above the sound.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'No echo',
        params: { time: 465, reach: 19.4, size: 2.38 },
      },
      { deviceId: 'shimmer', preset: 'Sparkle room', params: { decay: 1.33, predelay: 21 } },
    ],
  },
  {
    id: 'orbit-steel-creekside-loop',
    name: 'Creekside loop',
    category: 'echo',
    description:
      'A tape loop about a second round that soon dies away, then a gentle high cut that shades the top end, into a huge open valley.',
    effects: [
      { deviceId: 'tape-loop', preset: 'One second round' },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.37 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 9.07, predelayMs: 117, breathRate: 0.301 },
      },
    ],
  },
  {
    id: 'orbit-steel-repeats-in-the-cabin',
    name: 'Repeats in the cabin',
    category: 'echo',
    description:
      'A fast, steady reel with soft saturation, then a clean, steady echo with no wobble and little dulling.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 196, modRate: 0.543 } },
    ],
  },
  {
    id: 'orbit-steel-moonrise-trace',
    name: 'Moonrise trace',
    category: 'echo',
    description:
      'A faint trace of tape echo behind the playing, then an amp in a cupboard, into a bright spring splash that lands a moment after the note.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 528 } },
      { deviceId: 're-amp', preset: 'In the cupboard' },
      { deviceId: 'spring-reverb', preset: 'Late splash', params: { decay: 1.16 } },
    ],
  },
  {
    id: 'orbit-steel-echo-at-the-window',
    name: 'Echo at the window',
    category: 'echo',
    description:
      'A soft slapback echo close behind each note, then a clean, bright combo amp, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback' },
      { deviceId: 're-amp', preset: 'Clean and bright' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
  },
  {
    id: 'orbit-steel-dawn-line-echo',
    name: 'Dawn-line echo',
    category: 'echo',
    description:
      'A single saturated tape echo close behind each note, then amplifier valves driven until they round off every peak, into a small plate.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 79.2 } },
      { deviceId: 're-amp', preset: 'Just the valves' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'orbit-steel-homeward-reel',
    name: 'Homeward reel',
    category: 'echo',
    description:
      'A short tape loop where each pass comes back quieter, into a plain hall of about four seconds.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.87 } },
      { deviceId: 'vowel-reverb', preset: 'Plain hall' },
    ],
  },
  {
    id: 'orbit-steel-night-side-trail',
    name: 'Night-side trail',
    category: 'echo',
    description:
      'The first hint of weight from a tape preamp, then a slow tape echo with a long trail that dulls as it goes.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1540 } },
    ],
  },
  {
    id: 'orbit-steel-moondust-echo',
    name: 'Moondust echo',
    category: 'echo',
    description:
      'Whole phrases played backwards about four seconds later, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Long mirror', params: { time: 3630 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 164 } },
    ],
  },
  {
    id: 'orbit-steel-liftoff-haze',
    name: 'Liftoff haze',
    category: 'echo',
    description:
      'A wash of three fed-back tape heads that hovers and fades, into a far-off room laid in under the untouched sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
      { deviceId: 're-amp', preset: 'Room underneath' },
    ],
  },
  {
    id: 'orbit-steel-loop-at-moonrise',
    name: 'Loop at moonrise',
    category: 'echo',
    description:
      'An equaliser that takes presence, air and lows away, then a loop of the last phrase played backwards as a bed.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.43 } },
      { deviceId: 'micro-looper', preset: 'Reverse bed' },
    ],
  },
  {
    id: 'orbit-steel-porthole-sway',
    name: 'Porthole sway',
    category: 'echo',
    description:
      'A swell that fades every note in like a bow stroke, then a short echo whose pitch sways like a seasick vibrato.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed' },
      { deviceId: 'analog-delay', preset: 'Seasick', params: { time: 161, modRate: 3.09 } },
    ],
  },
  {
    id: 'orbit-steel-night-field-swells',
    name: 'Night-field swells',
    category: 'echo',
    description:
      'Backwards swells that climb an octave on every pass, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { time: 920 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 60.9, lowDecay: 7.41, midDecay: 1.89 },
      },
    ],
  },
  {
    id: 'orbit-steel-screen-door-memory',
    name: 'Screen-door memory',
    category: 'tape',
    description:
      'Long grains of what was played about four seconds ago, then a clean bright reel under a thick layer of tape hiss.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Long memory' },
      { deviceId: 'tape', preset: 'Hiss and air' },
    ],
  },
  {
    id: 'orbit-steel-re-entry-chorus',
    name: 'Re-entry chorus',
    category: 'tape',
    description:
      'A drifting reel laid against the dry sound to make a chorus, then a slow tape echo with a long trail that dulls as it goes.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1430 } },
    ],
  },
  {
    id: 'orbit-steel-tape-in-free-fall',
    name: 'Tape in free fall',
    category: 'tape',
    description:
      'A muffled cassette, its top rolled off and its lows lifted, then dotted tape repeats that bounce from side to side.',
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 533 } },
    ],
  },
  {
    id: 'orbit-steel-countdown-reel',
    name: 'Countdown reel',
    category: 'tape',
    description:
      'A slow reel that trembles fast, mixed against the dry sound, into a clean speaker heard from well back in a room.',
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer' },
      { deviceId: 're-amp', preset: 'Just the room' },
    ],
  },
  {
    id: 'orbit-steel-lander-flutter',
    name: 'Lander flutter',
    category: 'tape',
    description:
      'A slow flanger-like sweep, opposite on each side, then a slow reel that trembles fast, mixed against the dry sound.',
    effects: [
      { deviceId: 'tremolo', preset: 'Drifting comb', params: { rate: 0.106 } },
      { deviceId: 'tape', preset: 'Flutter shimmer' },
    ],
  },
  {
    id: 'orbit-steel-homeward-sway',
    name: 'Homeward sway',
    category: 'tape',
    description:
      'A fast rotating speaker with its amplifier growling, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      { deviceId: 'rotary', preset: 'Growl' },
      { deviceId: 'tape', preset: 'Seasick', params: { output: -3.17 } },
    ],
  },
  {
    id: 'orbit-steel-dawn-line-warmth',
    name: 'Dawn-line warmth',
    category: 'tape',
    description:
      'A transformer that fills out the lows and dulls the top, then a scooped tone with lows and highs up and the body down.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.61 } },
    ],
  },
  {
    id: 'orbit-steel-tape-at-splashdown',
    name: 'Tape at splashdown',
    category: 'tape',
    description:
      'A thick, soft cassette, full in the lows and dull on top, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.39 } },
    ],
  },
  {
    id: 'orbit-steel-tremolo-from-orbit',
    name: 'Tremolo from orbit',
    category: 'motion',
    description:
      'A clean combo amplifier with the treble all the way up, then a harmonic tremolo, into a dull single spring.',
    effects: [
      { deviceId: 're-amp', preset: 'Clean and bright', params: { output: 3.34 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 3.07 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { decay: 1.43 } },
    ],
  },
  {
    id: 'orbit-steel-two-lane-swell',
    name: 'Two-lane swell',
    category: 'motion',
    description:
      'A sagging valve stage, then a slow breathing level, into a two-spring tank with its input driven into saturation.',
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom', params: { output: -5.02 } },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.229 } },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank' },
    ],
  },
  {
    id: 'orbit-steel-tin-roof-breath',
    name: 'Tin-roof breath',
    category: 'motion',
    description:
      'An amp in a cupboard, then the level breathing in and out about every four seconds, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 're-amp', preset: 'In the cupboard' },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.259 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring' },
    ],
  },
  {
    id: 'orbit-steel-rotary-headed-home',
    name: 'Rotary headed home',
    category: 'motion',
    description:
      'A fast rotating speaker with its amplifier growling, into a plain room that is gone in a couple of seconds.',
    effects: [
      { deviceId: 'rotary', preset: 'Growl' },
      { deviceId: 'bloom-reverb', preset: 'Still room' },
    ],
  },
  {
    id: 'orbit-steel-orbiting-waves',
    name: 'Orbiting waves',
    category: 'motion',
    description:
      'Quick waves of reverb rippling about twice a second, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Ripples', params: { time: 0.412 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 32.9, modRate: 0.101 } },
    ],
  },
  {
    id: 'orbit-steel-outbound-swirl',
    name: 'Outbound swirl',
    category: 'motion',
    description:
      'A fast spinning speaker horn laid over the dry sound, into a vast space whose tail swells in and hangs a minute or more.',
    effects: [
      { deviceId: 'rotary', preset: 'Guitar swirl' },
      { deviceId: 'expanse', preset: 'Event horizon', params: { decay: 56.6, modRate: 0.133 } },
    ],
  },
  {
    id: 'orbit-steel-flanger-by-moonlight',
    name: 'Flanger by moonlight',
    category: 'motion',
    description:
      'Two dull copies a few cents off, tucked behind the sound, then a flanger that takes about twelve seconds over each sweep.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.0799, delayMs: 4.36 } },
    ],
  },
  {
    id: 'orbit-steel-throbbing-tremolo',
    name: 'Throbbing tremolo',
    category: 'motion',
    description:
      'A steady amplifier tremolo, about four pulses a second, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'orbit-steel-tethered-swirl',
    name: 'Tethered swirl',
    category: 'motion',
    description:
      'A reel driven as hard as it goes, thick with harmonics, then a phaser taking about a quarter of a minute to come round.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'phaser', preset: 'Slow swirl' },
    ],
  },
  {
    id: 'orbit-steel-floating-chorus',
    name: 'Floating chorus',
    category: 'motion',
    description:
      'A dark, driven amplifier stack with the mic off to one side, then a plain chorus with a detuned copy towards each side.',
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { output: 0.517 } },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.727, delayMs: 12.5 } },
    ],
  },
  {
    id: 'orbit-steel-front-room-breath',
    name: 'Front-room breath',
    category: 'motion',
    description:
      'A clean combo amplifier with the treble all the way up, then a slow breathing level, into two taut, long springs.',
    effects: [
      { deviceId: 're-amp', preset: 'Clean and bright' },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.275 } },
      { deviceId: 'spring-reverb', preset: 'Tight long tank' },
    ],
  },
  {
    id: 'orbit-steel-slow-orbit-tide',
    name: 'Slow-orbit tide',
    category: 'motion',
    description:
      'A brightish valve preamp, then the level rising and falling at random, like surf, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp' },
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.31 } },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'orbit-steel-heat-shield-rotary',
    name: 'Heat-shield rotary',
    category: 'motion',
    description:
      'A reel driven hot, then a rotating speaker on its slow speed, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0863 } },
    ],
  },
  {
    id: 'orbit-steel-chorus-in-earthshine',
    name: 'Chorus in earthshine',
    category: 'motion',
    description:
      'A thick ensemble chorus turning about every two seconds, then a low cut that thins the bass, with a little air on top.',
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.481, delayMs: 19.8 } },
      { deviceId: 'ambient-eq', preset: 'Texture' },
    ],
  },
  {
    id: 'orbit-steel-rotary-on-a-tin-roof',
    name: 'Rotary on a tin roof',
    category: 'motion',
    description:
      'A slow rotating speaker heard from across the room, then a dull, wobbling, saturated echo on worn tape, into a small ringing chamber.',
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 574 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank' },
    ],
  },
  {
    id: 'orbit-steel-phaser-by-the-creek',
    name: 'Phaser by the creek',
    category: 'motion',
    description:
      'A four-stage phaser with two broad notches, turning slowly, into a wide room heard from its far end.',
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.314 } },
      { deviceId: 'ether-reverb', preset: 'Distant' },
    ],
  },
  {
    id: 'orbit-steel-cislunar-vibrato',
    name: 'Cislunar vibrato',
    category: 'motion',
    description:
      'A fast vibrato that warbles the whole sound in pitch, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'chorus', preset: 'Vibrato', params: { rate: 5.31, delayMs: 6.29 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air' },
    ],
  },
  {
    id: 'orbit-steel-chrome-chorus',
    name: 'Chrome chorus',
    category: 'motion',
    description:
      'A full chorus spread wide to left and right, into a short diffuse haze around the sound, like a small room.',
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus' },
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
    ],
  },
  {
    id: 'orbit-steel-buoyant-swell',
    name: 'Buoyant swell',
    category: 'texture',
    description:
      'A half-hidden slow swell, then a sharp and a flat copy of the highs only, to either side, into a late-arriving hall.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1550, release: 296 } },
      { deviceId: 'stereo-detune', preset: 'Top only', params: { delay: 12.1 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'orbit-steel-slow-orbit-swell',
    name: 'Slow-orbit swell',
    category: 'texture',
    description:
      'A first-note swell, then a wavering double of the sound spread wide to both sides, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'swell', preset: 'First note only', params: { attack: 1680, release: 1390 } },
      { deviceId: 'analog-delay', preset: 'Doubler', params: { time: 41.7, modRate: 2.34 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'orbit-steel-homeward-swell',
    name: 'Homeward swell',
    category: 'texture',
    description:
      'A short swell that rounds the front off every note, then a shallow thickening chorus, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 163, release: 75.6 } },
      { deviceId: 'chorus', preset: 'Vocal thickener', params: { rate: 0.444, delayMs: 19.6 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'orbit-steel-grains-in-earthshine',
    name: 'Grains in earthshine',
    category: 'texture',
    description:
      'Scattered grains a fifth down, spread across both sides, into a very long reverb whose tail keeps climbing by octaves.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down grains', params: { length: 79.2 } },
      { deviceId: 'bloom-reverb', preset: 'Endless rise', params: { mix: 0.414 } },
    ],
  },
  {
    id: 'orbit-steel-night-side-afterglow',
    name: 'Night-side afterglow',
    category: 'texture',
    description:
      'A dark string pad that lingers long after each chord, then a slow reel that trembles fast, mixed against the dry sound.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Lingering' },
      { deviceId: 'tape', preset: 'Flutter shimmer' },
    ],
  },
  {
    id: 'orbit-steel-floating-echo',
    name: 'Floating echo',
    category: 'texture',
    description:
      'A dark amplifier stack with the bass full up and no treble, then backwards grains of each phrase, repeating as they fade.',
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly' },
      { deviceId: 'grain-delay', preset: 'Backwards shards', params: { time: 427, size: 264 } },
    ],
  },
  {
    id: 'orbit-steel-nickel-swell',
    name: 'Nickel swell',
    category: 'texture',
    description:
      'A string-like swell, then two copies heard just after the sound, the left one first, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'swell', preset: 'String section' },
      { deviceId: 'stereo-detune', preset: 'Late copy', params: { delay: 57.4 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 88.8, lowDecay: 7.81, midDecay: 5.83 },
      },
    ],
  },
  {
    id: 'orbit-steel-pearl-snap-swell',
    name: 'Pearl-snap swell',
    category: 'texture',
    description:
      'A seconds-long swell, then a sharp copy on the left and a flat one on the right, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2290, release: 766 } },
      { deviceId: 'stereo-detune', preset: 'Classic', params: { delay: 14.6 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 46.6, lowDecay: 4.41, midDecay: 3.35 },
      },
    ],
  },
  {
    id: 'orbit-steel-prairie-tide',
    name: 'Prairie tide',
    category: 'texture',
    description:
      'A string pad that arrives long after the chord and stays, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Late tide', params: { fall: 17.6 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 19.9 } },
    ],
  },
  {
    id: 'orbit-steel-lunar-glow',
    name: 'Lunar glow',
    category: 'texture',
    description:
      'A held tone that takes over each note at once and soon fades, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'sustainer', preset: 'Quick catch' },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'orbit-steel-prairie-shimmer',
    name: 'Prairie shimmer',
    category: 'texture',
    description:
      'A wide string pad that never stops shifting and shimmering, into a brief ring of sixteen C major strings behind each note.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Restless', params: { rise: 0.503, fall: 6.12 } },
      { deviceId: 'sympathetic', preset: 'Short halo' },
    ],
  },
  {
    id: 'orbit-steel-lonesome-pad',
    name: 'Lonesome pad',
    category: 'texture',
    description:
      'A soft string pad that swells in behind what is played, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'pad-follower', preset: 'String pad' },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 54.1 } },
    ],
  },
  {
    id: 'orbit-steel-gibbous-mist',
    name: 'Gibbous mist',
    category: 'texture',
    description:
      'A wide fog without lows or highs that hangs for seconds, into a vast blurred hollow that rings for half a minute.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Band of fog' },
      { deviceId: 'swarm-reverb', preset: 'Vast hollow', params: { glide: 0.561 } },
    ],
  },
  {
    id: 'orbit-steel-chrome-pad',
    name: 'Chrome pad',
    category: 'texture',
    description:
      'A held pad that takes seconds to melt into each new chord, into a hall whose tail sings a soft ah.',
    effects: [
      { deviceId: 'sustainer', preset: 'Long glide' },
      { deviceId: 'vowel-reverb', preset: 'Choir of ah' },
    ],
  },
  {
    id: 'orbit-steel-fourth-under-the-bar',
    name: 'Fourth under the bar',
    category: 'pitch',
    description:
      'A close harmony a fourth below, made of short slowed pieces, then a lightly worn reel, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth below', params: { length: 160 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 39.5, lowDecay: 2.44, midDecay: 3.32 },
      },
    ],
  },
  {
    id: 'orbit-steel-baritone-fourth',
    name: 'Baritone fourth',
    category: 'pitch',
    description:
      'A harmony a fourth below, then a reel with a little hiss, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth below' },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 6.53, modRate: 0.389 } },
    ],
  },
  {
    id: 'orbit-steel-depths-in-the-cabin',
    name: 'Depths in the cabin',
    category: 'pitch',
    description:
      'A copy two octaves down, then a tape reel pushed hard, saturated and thick, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves' },
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 63.3, lowDecay: 2.93, midDecay: 2.67 },
      },
    ],
  },
  {
    id: 'orbit-steel-crater-fourth',
    name: 'Crater fourth',
    category: 'pitch',
    description:
      'A wide, slowed copy a fourth below that drifts behind, then a lightly worn reel, into a long reverb in waves.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift', params: { length: 2800 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.95 } },
    ],
  },
  {
    id: 'orbit-steel-airlock-octave',
    name: 'Airlock octave',
    category: 'pitch',
    description:
      'A muffled octave below, then a long dark tape trail, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 2070 } },
      { deviceId: 'tape-echo', preset: 'Long dark trail' },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'orbit-steel-tranquility-thirds',
    name: 'Tranquility thirds',
    category: 'pitch',
    description:
      'A third above and a sixth below a single line, in C major, into sixteen strings in E minor heard alone with no dry sound.',
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds' },
      { deviceId: 'sympathetic', preset: 'Strings alone' },
    ],
  },
  {
    id: 'orbit-steel-creekside-octave',
    name: 'Creekside octave',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, then two dark late copies that shadow the sound on either side.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed', params: { length: 997 } },
      { deviceId: 'stereo-detune', preset: 'Shadow' },
    ],
  },
  {
    id: 'orbit-steel-truck-stop-octave',
    name: 'Truck-stop octave',
    category: 'pitch',
    description:
      'A dark octave below held chords, every note moved cleanly, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad below', params: { size: 58.8 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 81.8 } },
    ],
  },
  {
    id: 'orbit-steel-night-field-depths',
    name: 'Night-field depths',
    category: 'pitch',
    description:
      'A soft, deep bass one and two octaves below each note, into sixteen strings in E minor heard alone with no dry sound.',
    effects: [
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'sympathetic', preset: 'Strings alone' },
    ],
  },
  {
    id: 'orbit-steel-porch-octave',
    name: 'Porch octave',
    category: 'pitch',
    description:
      'An echo whose repeats jump up an octave and back, then the level breathing in and out about every four seconds.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop' },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
    ],
  },
  {
    id: 'orbit-steel-bunkhouse-mixdown',
    name: 'Bunkhouse mixdown',
    category: 'master',
    description:
      'A slow levelling compressor, then a slightly wider image, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 288 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.6, gain: 2.38 } },
    ],
  },
  {
    id: 'orbit-steel-porthole-polish',
    name: 'Porthole polish',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a parallel compressor, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Lift' },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
  {
    id: 'orbit-steel-orbiting-polish',
    name: 'Orbiting polish',
    category: 'master',
    description:
      'A fresh reel of tape, then a very gentle compressor, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.38 } },
    ],
  },
  {
    id: 'orbit-steel-airlock-finish',
    name: 'Airlock finish',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a slow compressor that evens out swells over seconds, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 318, release: 2.13 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'orbit-steel-master-after-liftoff',
    name: 'Master after liftoff',
    category: 'master',
    description:
      'A subsonic cut and a slow easing of any note that rings on, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 2.93 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'orbit-steel-porthole-finish',
    name: 'Porthole finish',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a subsonic cut, then a true-peak ceiling that lets go again over several seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-eq', preset: 'Master' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 6.27 } },
    ],
  },
]
