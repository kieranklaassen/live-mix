// Polar Night Signal: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'polar-signal-weather-hut-waves',
    name: 'Weather-hut waves',
    category: 'space',
    description:
      'A clean speaker at the far end of a big, echoing room, into a long reverb that comes and goes in waves, over and over.',
    effects: [
      { deviceId: 're-amp', preset: 'Far end of the hall' },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.87 } },
    ],
  },
  {
    id: 'polar-signal-snowbound-plate',
    name: 'Snowbound plate',
    category: 'space',
    description:
      'A clean speaker at the far end of a big, echoing room, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 're-amp', preset: 'Far end of the hall', params: { output: 2.07 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 18.9 } },
    ],
  },
  {
    id: 'polar-signal-choir-off-the-pier',
    name: 'Choir off the pier',
    category: 'space',
    description:
      'A dark cellar of a room that folds the sound to mono, into a soft sung oo that follows a moment behind each note.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { decay: 2.86, mix: 0.24 } },
      {
        deviceId: 'vowel-reverb',
        preset: 'Oo behind',
        params: { decay: 4.47, preDelay: 80.1, mix: 0.18 },
      },
    ],
  },
  {
    id: 'polar-signal-generator-room',
    name: 'Generator room',
    category: 'space',
    description:
      'A stereo image pushed wide, with the bass kept in the middle, into a wide room heard from its far end.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Wide' },
      { deviceId: 'ether-reverb', preset: 'Distant' },
    ],
  },
  {
    id: 'polar-signal-cloud-on-the-fjord',
    name: 'Cloud on the fjord',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, then a clean speaker at the far end of a big, echoing room, into a slow dark swell.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 're-amp', preset: 'Far end of the hall' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'polar-signal-shuttered-wash',
    name: 'Shuttered wash',
    category: 'space',
    description:
      'A low cut that thins the bass, with a little air on top, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.34 } },
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 16.5 } },
    ],
  },
  {
    id: 'polar-signal-far-shore-hall',
    name: 'Far-shore hall',
    category: 'space',
    description:
      'A swell that takes seconds to rise after each silence, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 20.2, lowDecay: 4.93, midDecay: 4.16 },
      },
    ],
  },
  {
    id: 'polar-signal-hall-on-the-fjord',
    name: 'Hall on the fjord',
    category: 'space',
    description:
      'A late swell on every note like a rocked volume pedal, into a long bright reverb tail kept low behind the sound.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 243, release: 158 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'polar-signal-tideline-hall',
    name: 'Tideline hall',
    category: 'space',
    description:
      'A wide detune, sharp on the left and flat on the right, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Detuned', params: { delay: 41.5, lfoRate: 0.504 } },
      { deviceId: 'fdn-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'polar-signal-hall-at-the-mast',
    name: 'Hall at the mast',
    category: 'space',
    description:
      'A half-deep swell that leaves a ghost of each attack, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick', params: { attack: 507, release: 141 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 64.5 } },
    ],
  },
  {
    id: 'polar-signal-lamp-lit-halo',
    name: 'Lamp-lit halo',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 15.2 } },
    ],
  },
  {
    id: 'polar-signal-snowbound-hall',
    name: 'Snowbound hall',
    category: 'space',
    description:
      'An audio stream cut off above the mids, as if through a wall, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Through a wall' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 11.3 } },
    ],
  },
  {
    id: 'polar-signal-january-hall',
    name: 'January hall',
    category: 'space',
    description:
      'A thin, far-off tape loop with its lows cut away, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Thin and distant', params: { length: 2.06 } },
      { deviceId: 'hall-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'polar-signal-snow-muffled-wash',
    name: 'Snow-muffled wash',
    category: 'space',
    description:
      'The drifting tail of a long reverb with no dry sound, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 14 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 5.34, midDecay: 4.75 } },
    ],
  },
  {
    id: 'polar-signal-hall-by-lamplight',
    name: 'Hall by lamplight',
    category: 'space',
    description:
      'A medium hall with only a breath of voice in its tail, then a thin band of tone with the lows cut and the top rolled off.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 3.11, preDelay: 18.5 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { clearTime: 1.4 } },
    ],
  },
  {
    id: 'polar-signal-midwinter-plate',
    name: 'Midwinter plate',
    category: 'space',
    description:
      'A far-off plate haze with a long, soft tail, then a thin band of tone with the lows cut and the top rolled off.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { clearTime: 1.58 } },
    ],
  },
  {
    id: 'polar-signal-pack-ice-air',
    name: 'Pack-ice air',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Bright air',
        params: { decay: 3.27, breathRate: 0.291, mix: 0.272 },
      },
    ],
  },
  {
    id: 'polar-signal-night-band-tunnel',
    name: 'Night-band tunnel',
    category: 'space',
    description:
      'A dull mono tunnel with a tail of several seconds, then a gentle high cut that shades the top end.',
    effects: [
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 5.99, modRate: 0.409 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.43 } },
    ],
  },
  {
    id: 'polar-signal-streetlamp-mist',
    name: 'Streetlamp mist',
    category: 'space',
    description:
      'A thin, high pad an octave up with nothing low in it, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'pad-follower', preset: 'High mist', params: { rise: 1.52, fall: 9.67 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 18.7, preDelay: 37.6 } },
    ],
  },
  {
    id: 'polar-signal-hoarfrost-hall',
    name: 'Hoarfrost hall',
    category: 'space',
    description:
      'A mid-forward tone with the lows and the top trimmed, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward' },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 21.4, lowDecay: 4.69, midDecay: 4.03, mix: 0.48 },
      },
    ],
  },
  {
    id: 'polar-signal-fogbound-loop',
    name: 'Fogbound loop',
    category: 'echo',
    description:
      'A short, dull loop at a quarter of the sample rate, then a small mono radio, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter', params: { length: 1.52 } },
      { deviceId: 'patina', preset: 'Kitchen radio', params: { output: 5.24 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 26.9, modRate: 0.102 } },
    ],
  },
  {
    id: 'polar-signal-cabin-reel',
    name: 'Cabin reel',
    category: 'echo',
    description:
      'A half-speed tape loop, then a digital telephone line, into a large hall heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 7.06 } },
      { deviceId: 'vintage-digital', preset: 'Phone' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Full wet send',
        params: { decay: 8.85, breathRate: 0.291 },
      },
    ],
  },
  {
    id: 'polar-signal-small-hours-echo',
    name: 'Small-hours echo',
    category: 'echo',
    description:
      'Grain repeats that sink by fourths on every pass, into a far-off room laid in under the untouched sound.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling fourths', params: { time: 567, size: 206 } },
      { deviceId: 're-amp', preset: 'Room underneath' },
    ],
  },
  {
    id: 'polar-signal-northern-loop',
    name: 'Northern loop',
    category: 'echo',
    description:
      'A half-speed loop that plays the last phrase an octave down, into a wide room heard from its far end.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed' },
      { deviceId: 'ether-reverb', preset: 'Distant' },
    ],
  },
  {
    id: 'polar-signal-bell-buoy-echo',
    name: 'Bell-buoy echo',
    category: 'echo',
    description:
      'A low-pass that opens and closes over about half a minute, then tape repeats that lose their lows and thin out as they fade.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0336, envAttackMs: 11.1 },
      },
      { deviceId: 'tape-echo', preset: 'Thin and fading' },
    ],
  },
  {
    id: 'polar-signal-slipway-repeats',
    name: 'Slipway repeats',
    category: 'echo',
    description:
      'A resonant low-pass that swings open about every two seconds, then a quick loop of about the last half second that soon fades.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { lfoRateHz: 0.499, envAttackMs: 11, envReleaseMs: 182 },
      },
      { deviceId: 'micro-looper', preset: 'Quick loop' },
    ],
  },
  {
    id: 'polar-signal-sea-ice-embers',
    name: 'Sea-ice embers',
    category: 'echo',
    description:
      'Grain repeats that fall an octave and darken each time, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { time: 455, size: 238 } },
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 15.3 } },
    ],
  },
  {
    id: 'polar-signal-tundra-memory',
    name: 'Tundra memory',
    category: 'echo',
    description:
      'A soft echo while earlier phrases drift back under it, then a combo amplifier heard from the far side of a big room.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Recalling',
        params: { time: 503, reach: 20.9, size: 2.74 },
      },
      { deviceId: 're-amp', preset: 'Down the hall' },
    ],
  },
  {
    id: 'polar-signal-reel-at-the-quay',
    name: 'Reel at the quay',
    category: 'echo',
    description:
      'A half-speed tape loop, then a watery, dull audio stream, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down' },
      { deviceId: 'low-bitrate', preset: 'Underwater' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'polar-signal-loop-out-at-anchor',
    name: 'Loop out at anchor',
    category: 'echo',
    description:
      'A half-speed tape loop, then a gritty audio stream, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down' },
      { deviceId: 'low-bitrate', preset: 'Gritty attacks' },
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
    ],
  },
  {
    id: 'polar-signal-quayside-reel',
    name: 'Quayside reel',
    category: 'echo',
    description:
      'A half-speed tape loop, then a bed of digital grit, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 8.18 } },
      { deviceId: 'vintage-digital', preset: 'Grit bed' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 6.67, modRate: 0.357 } },
    ],
  },
  {
    id: 'polar-signal-loop-under-the-ice',
    name: 'Loop under the ice',
    category: 'echo',
    description:
      'A slow backwards loop, then dull ten-bit converters that hiss along with every note, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 3.82 } },
      { deviceId: 'vintage-digital', preset: 'Dusty' },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'polar-signal-weather-hut-echoes',
    name: 'Weather-hut echoes',
    category: 'echo',
    description:
      'A handful of separate echoes that fall away and repeat, into a short diffuse haze around the sound, like a small room.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Scattered', params: { time: 2.42 } },
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
    ],
  },
  {
    id: 'polar-signal-jetty-sampler',
    name: 'Jetty sampler',
    category: 'echo',
    description:
      'A low cut that thins the bass, with a little air on top, then a short, muffled loop at an eighth of the sample rate.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture' },
      { deviceId: 'micro-looper', preset: 'Sampler grit', params: { length: 1.12 } },
    ],
  },
  {
    id: 'polar-signal-january-reel',
    name: 'January reel',
    category: 'echo',
    description:
      'A thin, far-off tape loop with its lows cut away, then a big lift of the low end, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Thin and distant' },
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 20.2, modRate: 0.239 } },
    ],
  },
  {
    id: 'polar-signal-windward-echo',
    name: 'Windward echo',
    category: 'echo',
    description:
      'A slow phasing drift that turns over every few seconds, then a plain echo whose repeats bounce from side to side.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift' },
      {
        deviceId: 'echo-memory',
        preset: 'Side to side',
        params: { time: 359, reach: 20.6, size: 2.87 },
      },
    ],
  },
  {
    id: 'polar-signal-echo-at-the-quay',
    name: 'Echo at the quay',
    category: 'echo',
    description:
      'A soft echo while earlier phrases drift back under it, then echoes that creep sharp on the left and flat on the right.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Recalling', params: { time: 537, size: 2.89 } },
      { deviceId: 'freq-shifter', preset: 'Split sky' },
    ],
  },
  {
    id: 'polar-signal-lighthouse-loop',
    name: 'Lighthouse loop',
    category: 'echo',
    description:
      'A short tape loop where each pass comes back quieter, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.58 } },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'polar-signal-repeats-at-the-light',
    name: 'Repeats at the light',
    category: 'echo',
    description:
      'A wavefolder that wraps the peaks over as bright overtones, then a clean, steady echo with no wobble and little dulling.',
    effects: [
      { deviceId: 'saturator', preset: 'Wavefold lead', params: { outputDb: -13 } },
      { deviceId: 'analog-delay', preset: 'Clean echo' },
    ],
  },
  {
    id: 'polar-signal-net-loft-tide',
    name: 'Net-loft tide',
    category: 'echo',
    description:
      'Clean converters fed hot, so the loudest peaks flatten, then slow backwards swells that rise and die behind the playing.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Flat tops' },
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1410 } },
    ],
  },
  {
    id: 'polar-signal-callsign-radio',
    name: 'Callsign radio',
    category: 'tape',
    description:
      'A small medium-wave radio, boxy and nasal, with light static, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio' },
      {
        deviceId: 'hall-reverb',
        preset: 'Airy tail',
        params: { preDelay: 30.1, lowDecay: 1.11, midDecay: 4.51 },
      },
    ],
  },
  {
    id: 'polar-signal-night-band-station',
    name: 'Night-band station',
    category: 'tape',
    description:
      'A far shortwave station that sinks deep into rising static, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'radio', preset: 'Far station' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 21.3, modRate: 0.272 } },
    ],
  },
  {
    id: 'polar-signal-signal-past-the-buoy',
    name: 'Signal past the buoy',
    category: 'tape',
    description:
      'A well-tuned sideband signal, mono, with light static, then a wash of three fed-back tape heads that hovers and fades.',
    effects: [
      { deviceId: 'radio', preset: 'Clear sideband' },
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
    ],
  },
  {
    id: 'polar-signal-forecast-radio',
    name: 'Forecast radio',
    category: 'tape',
    description:
      'A small medium-wave radio, boxy and nasal, with light static, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio' },
      { deviceId: 'hall-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'polar-signal-trawler-whistles',
    name: 'Trawler whistles',
    category: 'tape',
    description:
      'A shortwave station crowded by whistles, buzz and data tones, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'radio', preset: 'Crowded band' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'polar-signal-headland-static',
    name: 'Headland static',
    category: 'tape',
    description:
      'A far radio station, sinking in and out of heavy static, into a long reverb whose tail wavers queasily in pitch.',
    effects: [
      { deviceId: 'patina', preset: 'Distant station' },
      { deviceId: 'expanse', preset: 'Seasick choir' },
    ],
  },
  {
    id: 'polar-signal-bell-buoy-clicks',
    name: 'Bell-buoy clicks',
    category: 'tape',
    description:
      'A record with loud clicks and a scratch on every turn, then a dark held drone, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'vinyl', preset: 'Locked scratch' },
      { deviceId: 'micro-looper', preset: 'Deep drone' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'polar-signal-pack-ice-hiss',
    name: 'Pack-ice hiss',
    category: 'tape',
    description:
      'A far-off, dulled tone, then a trace of tape hiss, then a dark smear of long grains that trails for many seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'noise-floor', preset: 'Faint hiss', params: { response: 0.443, hold: 10.9 } },
      { deviceId: 'grain-delay', preset: 'Dark slow smear' },
    ],
  },
  {
    id: 'polar-signal-lightship-sideband',
    name: 'Lightship sideband',
    category: 'tape',
    description:
      'A well-tuned sideband signal, mono, with light static, into a small damped room that is over within a second.',
    effects: [
      { deviceId: 'radio', preset: 'Clear sideband' },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'polar-signal-slow-thaw-reel',
    name: 'Slow-thaw reel',
    category: 'tape',
    description:
      'A low, dark tape loop played backwards at half speed, then a small mono transistor radio with a clear, steady signal.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards' },
      { deviceId: 'radio', preset: 'Clean transistor' },
    ],
  },
  {
    id: 'polar-signal-station-on-the-floe',
    name: 'Station on the floe',
    category: 'tape',
    description:
      'A far shortwave station that sinks deep into rising static, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 'radio', preset: 'Far station' },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0839 } },
    ],
  },
  {
    id: 'polar-signal-crackle-by-lamplight',
    name: 'Crackle by lamplight',
    category: 'tape',
    description:
      'A medium-wave station under the crackle of a far storm, then the low hum of an amplifier left switched on, into a slowly breathing hall.',
    effects: [
      { deviceId: 'radio', preset: 'Storm coming' },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { response: 0.381, hold: 26.9 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 7.18, breathRate: 0.179 } },
    ],
  },
  {
    id: 'polar-signal-radio-between-bands',
    name: 'Radio between bands',
    category: 'tape',
    description:
      'A small mono radio, then the soft air of an open microphone under the sound, into a long reverb that comes and goes in waves, over and over.',
    effects: [
      { deviceId: 'patina', preset: 'Kitchen radio' },
      { deviceId: 'noise-floor', preset: 'Close mic' },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.71 } },
    ],
  },
  {
    id: 'polar-signal-night-band-drift',
    name: 'Night-band drift',
    category: 'tape',
    description:
      'A slow reel whose pitch sways widely and never settles, then a pure, low electrical hum that sits in the centre.',
    effects: [
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'noise-floor', preset: 'Mains hum', params: { response: 0.423, hold: 20.1 } },
    ],
  },
  {
    id: 'polar-signal-record-in-january',
    name: 'Record in January',
    category: 'tape',
    description:
      'A worn shellac disc, then a smeared backwards loop at half speed and an octave down, into a huge wash by itself.',
    effects: [
      { deviceId: 'vinyl', preset: 'Ballroom 78' },
      { deviceId: 'micro-looper', preset: 'Slow reverse' },
      { deviceId: 'expanse', preset: 'Wash alone' },
    ],
  },
  {
    id: 'polar-signal-windward-record',
    name: 'Windward record',
    category: 'tape',
    description:
      'A lightly played shellac disc, nearly mono, no bass or top, then faint recollections, into a deep dark well of slow blurred echoes.',
    effects: [
      { deviceId: 'vinyl', preset: 'Parlour 78', params: { spin: 1.53 } },
      {
        deviceId: 'echo-memory',
        preset: 'Faint recall',
        params: { time: 405, reach: 20.8, size: 1.9 },
      },
      { deviceId: 'swarm-reverb', preset: 'Dark well' },
    ],
  },
  {
    id: 'polar-signal-record-in-the-dark',
    name: 'Record in the dark',
    category: 'tape',
    description:
      'A well-played record, dulled, swaying, with ticks and pops, then a half-speed loop, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find', params: { spin: 1.52 } },
      { deviceId: 'micro-looper', preset: 'Half speed' },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'polar-signal-trawler-hum',
    name: 'Trawler hum',
    category: 'tape',
    description:
      'An equaliser that takes presence, air and lows away, then the low hum of an amplifier left switched on, into a damped hall.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.34 } },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { response: 0.409, hold: 33.6 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'polar-signal-coast-station-hiss',
    name: 'Coast-station hiss',
    category: 'tape',
    description:
      'A big lift of the low end, then hiss that swells in the gaps, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.74 } },
      {
        deviceId: 'noise-floor',
        preset: 'Breathing tape',
        params: { response: 0.942, hold: 13.7 },
      },
      { deviceId: 'expanse', preset: 'Open space' },
    ],
  },
  {
    id: 'polar-signal-dust-through-sleet',
    name: 'Dust through sleet',
    category: 'tape',
    description:
      'A big lift of the low end, then the surface noise and crackle of an old record, into a dark, very long hall.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.33 } },
      { deviceId: 'noise-floor', preset: 'Old record', params: { response: 0.378, hold: 8.74 } },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0707 } },
    ],
  },
  {
    id: 'polar-signal-narrow-band-storm',
    name: 'Narrow-band storm',
    category: 'tape',
    description:
      'A far-off, dulled tone, then a medium-wave station under the crackle of a far storm, into a slowly breathing hall.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.44 } },
      { deviceId: 'radio', preset: 'Storm coming' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 8.82, breathRate: 0.222 } },
    ],
  },
  {
    id: 'polar-signal-boathouse-drift',
    name: 'Boathouse drift',
    category: 'tape',
    description:
      'A medium-wave set whose dial slips off into whistle and back, into a dark cellar of a room that folds the sound to mono.',
    effects: [
      { deviceId: 'radio', preset: 'Drifting dial' },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { decay: 2.88 } },
    ],
  },
  {
    id: 'polar-signal-harbour-warble',
    name: 'Harbour warble',
    category: 'tape',
    description:
      'A few warbling tones, then a steady shortwave signal half buried in a wash of static, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Few partials' },
      { deviceId: 'radio', preset: 'Static wash' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.21 } },
    ],
  },
  {
    id: 'polar-signal-tin-roof-static',
    name: 'Tin-roof static',
    category: 'tape',
    description:
      'A far shortwave station that sinks deep into rising static, into a short reverb that swells in just after each note.',
    effects: [
      { deviceId: 'radio', preset: 'Far station' },
      { deviceId: 'expanse', preset: 'Quick swell', params: { decay: 2.17, modRate: 0.386 } },
    ],
  },
  {
    id: 'polar-signal-drift-in-harbour',
    name: 'Drift in harbour',
    category: 'tape',
    description:
      'A medium-wave set whose dial slips off into whistle and back, then a slow tape echo with a long trail that dulls as it goes.',
    effects: [
      { deviceId: 'radio', preset: 'Drifting dial' },
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1350 } },
    ],
  },
  {
    id: 'polar-signal-net-loft-loop',
    name: 'Net-loft loop',
    category: 'tape',
    description:
      'A loop of the last phrase played backwards as a bed, then a four-track cassette, dull on top, unsteady and hissing.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { length: 3.31 } },
      { deviceId: 'tape', preset: 'Cassette four-track' },
    ],
  },
  {
    id: 'polar-signal-harbour-filter',
    name: 'Harbour filter',
    category: 'motion',
    description:
      'A tape reel pushed hard, saturated and thick, then a low-pass that opens and closes over about half a minute.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard', params: { output: -5.54 } },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0325, envAttackMs: 9.77, envReleaseMs: 218 },
      },
    ],
  },
  {
    id: 'polar-signal-snowline-drift',
    name: 'Snowline drift',
    category: 'motion',
    description:
      'A slow phasing drift, then a space that answers in hard separate echoes, into a plain hall of about four seconds.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { delay: 48.3, lfoRate: 0.0838 } },
      { deviceId: 'expanse', preset: 'Hard echoes', params: { decay: 3.69, modRate: 0.368 } },
      { deviceId: 'vowel-reverb', preset: 'Plain hall' },
    ],
  },
  {
    id: 'polar-signal-relay-sway',
    name: 'Relay sway',
    category: 'motion',
    description:
      'The whole sound swaying sharp and flat every few seconds, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Seasick' },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { predelayMs: 194, mix: 0.172 } },
    ],
  },
  {
    id: 'polar-signal-filter-in-the-lee',
    name: 'Filter in the lee',
    category: 'motion',
    description:
      'A resonant upper-mid peak that rises when played hard, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Resonant peak' },
      { deviceId: 'bloom-reverb', preset: 'Tail alone' },
    ],
  },
  {
    id: 'polar-signal-coastal-sway',
    name: 'Coastal sway',
    category: 'motion',
    description:
      'A transformer driven so the low end thickens and loosens, then a slow pan from side to side, a few seconds each way.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { output: -7.3 } },
      { deviceId: 'tremolo', preset: 'Slow pan' },
    ],
  },
  {
    id: 'polar-signal-record-off-the-coast',
    name: 'Record off the coast',
    category: 'motion',
    description:
      'A badly warped record whose pitch sways once a turn, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'vinyl', preset: 'Warped' },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'polar-signal-arctic-drone',
    name: 'Arctic drone',
    category: 'texture',
    description:
      'A dark drone made by holding the first phrase an octave down, then a drifting reel laid against the dry sound to make a chorus.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Deep drone', params: { length: 3.08 } },
      { deviceId: 'tape', preset: 'Drifting chorus' },
    ],
  },
  {
    id: 'polar-signal-mist-in-midwinter',
    name: 'Mist in midwinter',
    category: 'texture',
    description:
      'A wide, darkened wash in which every note slowly dissolves, then converters at a very low rate, filtered smooth and dull.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.42 } },
      { deviceId: 'vintage-digital', preset: 'Sunken' },
    ],
  },
  {
    id: 'polar-signal-mooring-sustain',
    name: 'Mooring sustain',
    category: 'texture',
    description:
      'A clear sustain that holds every note on after it is played, into a long blurred cave that slides slowly between intervals.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Clean sustain', params: { mix: 0.27 } },
      {
        deviceId: 'swarm-reverb',
        preset: 'Slow stretch',
        params: { length: 0.656, glide: 5.06, mix: 0.24 },
      },
    ],
  },
  {
    id: 'polar-signal-leeward-depths',
    name: 'Leeward depths',
    category: 'texture',
    description:
      'A dark drone looped from each note with the octave below, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'cascade', preset: 'Deep drone', params: { time: 1390 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 20.5, lowDecay: 4.79, midDecay: 4.08 },
      },
    ],
  },
  {
    id: 'polar-signal-northern-depths',
    name: 'Northern depths',
    category: 'texture',
    description:
      'A slow bass shadow of long grains two octaves down, into a thin bright reverb with all its lows cut away.',
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Two octaves under',
        params: { size: 1240, density: 4.24 },
      },
      { deviceId: 'expanse', preset: 'Thin air', params: { decay: 10.6, modRate: 0.196 } },
    ],
  },
  {
    id: 'polar-signal-fogbound-swell',
    name: 'Fogbound swell',
    category: 'texture',
    description:
      'Long slow grains an octave down, most of them reversed, then a clean bright reel under a thick layer of tape hiss.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { size: 965, density: 4.81 } },
      { deviceId: 'tape', preset: 'Hiss and air' },
    ],
  },
  {
    id: 'polar-signal-skerry-mist',
    name: 'Skerry mist',
    category: 'texture',
    description:
      'A long-hanging wide wash, then the level rising and falling at random, like surf, into a swelling reverb cloud.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless' },
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.272 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.56 } },
    ],
  },
  {
    id: 'polar-signal-pier-end-wash',
    name: 'Pier-end wash',
    category: 'texture',
    description:
      'A watery audio stream whose notes hang on as a grainy wash, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Frozen stream' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 52.2, lowDecay: 4.21, midDecay: 3.15, mix: 0.24 },
      },
    ],
  },
  {
    id: 'polar-signal-treeline-drone',
    name: 'Treeline drone',
    category: 'texture',
    description:
      'A dark held drone, then a low-pass that opens and closes over about half a minute, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Deep drone', params: { length: 3.23 } },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 6.01, modRate: 0.354 } },
    ],
  },
  {
    id: 'polar-signal-air-up-the-coast',
    name: 'Air up the coast',
    category: 'texture',
    description:
      'A softened attack, then a thin, bright haze that hangs high above the sound, into a cave whose echoes bend slowly up and down in pitch.',
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 46.3, release: 66.5 } },
      { deviceId: 'spectral-blur', preset: 'High air' },
      { deviceId: 'swarm-reverb', preset: 'Bending' },
    ],
  },
  {
    id: 'polar-signal-fogbound-mist',
    name: 'Fogbound mist',
    category: 'texture',
    description:
      'A wide, darkened wash in which every note slowly dissolves, then five-bit converters fed hot, coarse and grainy on every note.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.42 } },
      { deviceId: 'vintage-digital', preset: 'Crushed' },
    ],
  },
  {
    id: 'polar-signal-bell-buoy-octave',
    name: 'Bell-buoy octave',
    category: 'pitch',
    description:
      'A smooth octave-down bed, then a high cut set low enough to muffle everything, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave' },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.6 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'polar-signal-transmitter-drift',
    name: 'Transmitter drift',
    category: 'pitch',
    description:
      'A wide, slowed copy a fourth below that drifts behind, then a murky slow echo, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift', params: { length: 3350 } },
      { deviceId: 'analog-delay', preset: 'Murky' },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { preDelay: 21.9, lowDecay: 3.57, midDecay: 4.17 },
      },
    ],
  },
  {
    id: 'polar-signal-breakwater-fourth',
    name: 'Breakwater fourth',
    category: 'pitch',
    description:
      'A close harmony a fourth below, made of short slowed pieces, then two dull copies a few cents off, tucked behind the sound.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth below', params: { length: 178 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'polar-signal-below-deck-depths',
    name: 'Below-deck depths',
    category: 'pitch',
    description:
      'A quarter-speed crawl two octaves down, smooth and unbroken, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'half-speed', preset: 'Quarter speed' },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.64 } },
    ],
  },
  {
    id: 'polar-signal-octave-off-the-coast',
    name: 'Octave off the coast',
    category: 'pitch',
    description:
      'A long half-speed replay, then a gentle high cut that shades the top end, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'half-speed', preset: 'Long drag' },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.34 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'polar-signal-shadow-on-the-ferry',
    name: 'Shadow on the ferry',
    category: 'pitch',
    description:
      'A thin half-speed shadow an octave down, its lows cut away, then a gentle high cut that shades the top end, into a vast nave.',
    effects: [
      { deviceId: 'half-speed', preset: 'Thin shadow', params: { length: 1980 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { lowDecay: 7.25, midDecay: 7.01 } },
    ],
  },
  {
    id: 'polar-signal-quayside-octave',
    name: 'Quayside octave',
    category: 'pitch',
    description:
      'A smooth octave-down bed, then a warm, full equaliser, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { length: 2390 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.35 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 12.9, modRate: 0.334 } },
    ],
  },
  {
    id: 'polar-signal-sodium-lit-octave',
    name: 'Sodium-lit octave',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, kept in the centre, then a low cut with some air, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 2090 } },
      { deviceId: 'ambient-eq', preset: 'Texture' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 9.95, modRate: 0.359 } },
    ],
  },
  {
    id: 'polar-signal-snowplough-depths',
    name: 'Snowplough depths',
    category: 'pitch',
    description:
      'A bowed swell that lets part of each attack through, then dark voices one and two octaves below the dry sound, into a dark, very long hall.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 289, release: 164 } },
      { deviceId: 'pitch-shifter', preset: 'Two octaves' },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0818 } },
    ],
  },
  {
    id: 'polar-signal-december-octave',
    name: 'December octave',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, then a slow bass shadow of long grains two octaves down.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed', params: { length: 889 } },
      { deviceId: 'grain-cloud', preset: 'Two octaves under' },
    ],
  },
  {
    id: 'polar-signal-starlit-undertow',
    name: 'Starlit undertow',
    category: 'pitch',
    description:
      'A dark, smooth half-speed octave under the dry sound, then a shortwave broadcast, narrow and mono, fading under static.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix' },
      { deviceId: 'patina', preset: 'Shortwave' },
    ],
  },
  {
    id: 'polar-signal-finish-before-thaw',
    name: 'Finish before thaw',
    category: 'master',
    description:
      'A rumble cut and a small lift of presence, then a slow compressor that evens out swells over seconds, then a bare brickwall ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys' },
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.45 } },
    ],
  },
  {
    id: 'polar-signal-snowline-lacquer',
    name: 'Snowline lacquer',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-limiter', preset: 'Streaming' },
    ],
  },
  {
    id: 'polar-signal-mast-light-finish',
    name: 'Mast-light finish',
    category: 'master',
    description:
      'A stereo image widened a little, with the bass left central, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'polar-signal-night-watch-master',
    name: 'Night-watch master',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a subsonic cut, then a fast limiter that steps in only on the loudest peaks.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-eq', preset: 'Master' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'polar-signal-island-finish',
    name: 'Island finish',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.64 } },
    ],
  },
  {
    id: 'polar-signal-finish-in-january',
    name: 'Finish in January',
    category: 'master',
    description:
      'A rumble cut and a small lift of presence, then a gentle compressor, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys' },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 2.42 } },
    ],
  },
]
