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
      'A clean speaker at the far end of a big, live room, into a reverb that breathes in slow waves over and over.',
    effects: [
      { deviceId: 're-amp', preset: 'Far end of the hall' },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.87 } },
    ],
  },
  {
    id: 'polar-signal-coastguard-tail',
    name: 'Coastguard tail',
    category: 'space',
    description:
      'A stream cut off above the mids, as if through a wall, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Through a wall' },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0803 } },
    ],
  },
  {
    id: 'polar-signal-outport-canyon',
    name: 'Outport canyon',
    category: 'space',
    description:
      'A combo amplifier heard from the far side of a big room, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'expanse', preset: 'Far echoes' },
    ],
  },
  {
    id: 'polar-signal-blue-hour-hall',
    name: 'Blue-hour hall',
    category: 'space',
    description:
      'A thin, far-off tape loop with its lows cut away, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Thin and distant', params: { length: 2.38 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'polar-signal-mooring-pipe',
    name: 'Mooring pipe',
    category: 'space',
    description:
      'A dull mono tunnel with a tail of several seconds, then a very gentle compressor that leans on the loudest swells.',
    effects: [
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 6.21, modRate: 0.413 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'polar-signal-snowbound-plate',
    name: 'Snowbound plate',
    category: 'space',
    description:
      'A clean speaker at the far end of a big, live room, into a medium plate with a smooth tail of a few seconds.',
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
    id: 'polar-signal-glass-iced-over',
    name: 'Glass iced over',
    category: 'space',
    description:
      'Clean converters fed hot, so the loudest peaks flatten, into a fine patter of thin high echoes with no bass in them.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Flat tops' },
      { deviceId: 'swarm-reverb', preset: 'Glass rain', params: { length: 0.144, glide: 0.625 } },
    ],
  },
  {
    id: 'polar-signal-generator-room',
    name: 'Generator room',
    category: 'space',
    description:
      'The sides pushed out past normal, with the bass kept narrow, into a room heard from its far end with little dry sound left.',
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
      'An equaliser that takes presence, air and lows away, then a clean speaker at the far end of a big, live room, into a slow dark swell.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 're-amp', preset: 'Far end of the hall' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'polar-signal-lamp-lit-tail',
    name: 'Lamp-lit tail',
    category: 'space',
    description:
      'A gentle high cut that shades the top end, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.35 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { preDelay: 30.2, midDecay: 4.92 } },
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
    id: 'polar-signal-january-tail',
    name: 'January tail',
    category: 'space',
    description:
      'The drifting tail of a long reverb with no dry sound, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Tail alone', params: { decay: 15.1 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 21 } },
    ],
  },
  {
    id: 'polar-signal-narrow-band-shaft',
    name: 'Narrow-band shaft',
    category: 'space',
    description:
      'A dull mono tunnel with a tail of several seconds, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 6.58, modRate: 0.37 } },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.35 } },
    ],
  },
  {
    id: 'polar-signal-far-shore-hall',
    name: 'Far-shore hall',
    category: 'space',
    description:
      'A swell that takes seconds to rise after each silence, into a hall heard from far off with little dry sound left.',
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
      'A swell that stays low and arrives late, like a rocked pedal, into a long undamped tail kept low behind the sound.',
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
    id: 'polar-signal-cave-under-the-ice',
    name: 'Cave under the ice',
    category: 'space',
    description:
      'A gentle low-pass at a kilohertz, into a big muffled cave that rings for about six seconds.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 0.927, envAttackMs: 10.7, envReleaseMs: 212 },
      },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 5.3, breathRate: 0.337 } },
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
    id: 'polar-signal-hall-on-the-ferry',
    name: 'Hall on the ferry',
    category: 'space',
    description:
      'A plain hall with about four seconds of tail, then a low cut with the low mids dipped and the presence lifted.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Hall' },
      { deviceId: 'ambient-eq', preset: 'Voice', params: { clearTime: 1.39 } },
    ],
  },
  {
    id: 'polar-signal-fogbound-loop',
    name: 'Fogbound loop',
    category: 'echo',
    description:
      'A dull quarter-rate loop, then a small mono radio, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter', params: { length: 1.52 } },
      { deviceId: 'patina', preset: 'Kitchen radio', params: { output: 5.24 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 26.9, modRate: 0.102 } },
    ],
  },
  {
    id: 'polar-signal-oxide-in-the-dark',
    name: 'Oxide in the dark',
    category: 'echo',
    description:
      'A wearing tape loop, then a gritty short-frame stream, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out' },
      { deviceId: 'low-bitrate', preset: 'Gritty attacks' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'polar-signal-midwinter-loop',
    name: 'Midwinter loop',
    category: 'echo',
    description:
      'A half-speed loop, then eight-bit companded converters with false tones folded in, into a huge open valley.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 2.33 } },
      { deviceId: 'vintage-digital', preset: 'Toy' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 8.85, predelayMs: 114, breathRate: 0.29 },
      },
    ],
  },
  {
    id: 'polar-signal-pool-off-the-coast',
    name: 'Pool off the coast',
    category: 'echo',
    description:
      'A wide muffled loop, then ten-bit converters on a shaky clock, dull, with riding hiss, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Underwater' },
      { deviceId: 'vintage-digital', preset: 'Dusty' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { lowDecay: 7.66, midDecay: 7.34 } },
    ],
  },
  {
    id: 'polar-signal-pier-end-sides',
    name: 'Pier-end sides',
    category: 'echo',
    description:
      'A tape loop whose passes cross from side to side, then worn nine-bit converters, into a long thin cave whose single echoes swell and fade.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Crossing sides' },
      { deviceId: 'vintage-digital', preset: 'Worn' },
      { deviceId: 'swarm-reverb', preset: 'Glinting' },
    ],
  },
  {
    id: 'polar-signal-cabin-reel',
    name: 'Cabin reel',
    category: 'echo',
    description:
      'A tape loop at half speed, an octave down and darker, then a digital telephone line, into a hall with no dry sound.',
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
    id: 'polar-signal-sampler-under-snow',
    name: 'Sampler under snow',
    category: 'echo',
    description:
      'A short loop at an eighth of the sample rate, dull and plain, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Sampler grit', params: { length: 1.12 } },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'polar-signal-small-hours-echo',
    name: 'Small-hours echo',
    category: 'echo',
    description:
      'Grain repeats that sink by fourths on every pass, into a far-miked room laid in under the clean sound.',
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
      'A loop of the last phrase at half speed, an octave down, into a room heard from its far end with little dry sound left.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed' },
      { deviceId: 'ether-reverb', preset: 'Distant' },
    ],
  },
  {
    id: 'polar-signal-mirror-in-the-lee',
    name: 'Mirror in the lee',
    category: 'echo',
    description:
      'Whole phrases played backwards about four seconds later, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Long mirror' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'polar-signal-starlit-memory',
    name: 'Starlit memory',
    category: 'echo',
    description:
      'A quick slap while short glimpses of earlier notes return, then a glacial low-pass, into a far-off plate haze.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Glimpses',
        params: { time: 74.2, reach: 21.4, size: 0.548 },
      },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
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
    id: 'polar-signal-generator-loop',
    name: 'Generator loop',
    category: 'echo',
    description:
      'A subsonic cut and a slow ear that eases whatever rings on, then a short loop at a quarter of the sample rate, with less top.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 3.14 } },
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter', params: { length: 1.64 } },
    ],
  },
  {
    id: 'polar-signal-island-echo',
    name: 'Island echo',
    category: 'echo',
    description:
      'Three tape heads in a row, a cluster on every repeat, then a rumble cut and a single decibel of presence.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 512 } },
      { deviceId: 'ambient-eq', preset: 'Keys' },
    ],
  },
  {
    id: 'polar-signal-windward-slide',
    name: 'Windward slide',
    category: 'echo',
    description:
      'An echo that slides down an octave like tape slowed by hand, into four long strings on an A minor chord held in the centre.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Falling tape' },
      { deviceId: 'sympathetic', preset: 'Centre drone' },
    ],
  },
  {
    id: 'polar-signal-slipway-repeats',
    name: 'Slipway repeats',
    category: 'echo',
    description:
      'A resonant low-pass that swings open about every two seconds, then a quick loop of about the last half second, soon faded.',
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
      'Grain repeats that fall an octave each time, darkening, into the drifting tail of a long reverb with no dry sound.',
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
    id: 'polar-signal-wheelhouse-loop',
    name: 'Wheelhouse loop',
    category: 'echo',
    description:
      'A short loop at double speed, an octave up and soon gone, into a soft slap close behind each note.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Octave up', params: { length: 1.13 } },
      { deviceId: 'analog-delay', preset: 'Slapback' },
    ],
  },
  {
    id: 'polar-signal-snowline-echo',
    name: 'Snowline echo',
    category: 'echo',
    description:
      'A slow echo with a long dark trail and a few recollections, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Dark trail' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.527 } },
    ],
  },
  {
    id: 'polar-signal-callsign-radio',
    name: 'Callsign radio',
    category: 'tape',
    description:
      'A small medium-wave radio, boxy and honking, nearly steady, into a hall whose top rings on while its lows stop short.',
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
      'A well-tuned sideband signal, steady, full-band and mono, then a wash of three fed-back tape heads that hovers and fades.',
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
      'A small medium-wave radio, boxy and honking, nearly steady, into a hall of about four seconds with no dry sound in it.',
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
      'A far radio station, sinking in and out of heavy static, into a long tail that wavers in pitch like an unsteady choir.',
    effects: [
      { deviceId: 'patina', preset: 'Distant station' },
      { deviceId: 'expanse', preset: 'Seasick choir' },
    ],
  },
  {
    id: 'polar-signal-leeward-warp',
    name: 'Leeward warp',
    category: 'tape',
    description:
      'A badly warped record whose pitch sways once a turn, then a wide held pad, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'vinyl', preset: 'Warped', params: { spin: 1.59 } },
      { deviceId: 'micro-looper', preset: 'Frozen pad' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 5.36, modRate: 0.392 } },
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
    id: 'polar-signal-record-out-at-anchor',
    name: 'Record out at anchor',
    category: 'tape',
    description:
      'A new record, then a half-speed tape loop in reverse, low and dark, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'vinyl', preset: 'New pressing', params: { spin: 1.33 } },
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 3.85 } },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'polar-signal-off-station-scratch',
    name: 'Off-station scratch',
    category: 'tape',
    description:
      'A ruined record, lurching in pitch under clicks and crackle, then a slow backwards loop, into a slow dark swell.',
    effects: [
      { deviceId: 'vinyl', preset: 'Ruined record', params: { spin: 1.67 } },
      { deviceId: 'micro-looper', preset: 'Slow reverse', params: { length: 3.68 } },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'polar-signal-pack-ice-hiss',
    name: 'Pack-ice hiss',
    category: 'tape',
    description:
      'A far-off, dulled tone, then a trace of tape hiss, even and barely there, then a dark smear of long grains that trails for many seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'noise-floor', preset: 'Faint hiss', params: { response: 0.443, hold: 10.9 } },
      { deviceId: 'grain-delay', preset: 'Dark slow smear' },
    ],
  },
  {
    id: 'polar-signal-streetlamp-static',
    name: 'Streetlamp static',
    category: 'tape',
    description:
      'A steep low-pass at four hundred hertz, the top gone, then drifting radio static, into a hall with no dry sound.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 0.981, envAttackMs: 9.47, envReleaseMs: 175 },
      },
      { deviceId: 'noise-floor', preset: 'Radio static', params: { response: 0.364, hold: 8.9 } },
      { deviceId: 'fdn-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'polar-signal-coast-station-mains',
    name: 'Coast-station mains',
    category: 'tape',
    description:
      'A heavy low shelf, then the low mains hum of an amplifier left switched on, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.27 } },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { response: 0.37, hold: 27.2 } },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'polar-signal-tape-through-sleet',
    name: 'Tape through sleet',
    category: 'tape',
    description:
      'An equaliser that takes presence, air and lows away, then a trace of tape hiss, even and barely there, into a dark, very long hall.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'noise-floor', preset: 'Faint hiss' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Endless tail',
        params: { decay: 19.5, breathRate: 0.0736 },
      },
    ],
  },
  {
    id: 'polar-signal-snowbound-tape',
    name: 'Snowbound tape',
    category: 'tape',
    description:
      'A warm, full equaliser, then tape hiss that sinks under each note and swells in the gaps, into a slowly breathing hall.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'noise-floor', preset: 'Breathing tape', params: { response: 0.792, hold: 16 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'polar-signal-lightship-sideband',
    name: 'Lightship sideband',
    category: 'tape',
    description:
      'A well-tuned sideband signal, steady, full-band and mono, into a small damped room that is over within a second.',
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
      'A half-speed tape loop in reverse, low and dark, then a small mono transistor radio with a clear, steady signal.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards' },
      { deviceId: 'radio', preset: 'Clean transistor' },
    ],
  },
  {
    id: 'polar-signal-sideband-under-snow',
    name: 'Sideband under snow',
    category: 'tape',
    description:
      'A resonant high-pass falling for about two seconds at a time, then a sideband signal tuned wrong, every pitch shifted and sour.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Falling high-pass',
        params: { lfoRateHz: 0.548, envAttackMs: 10.2, envReleaseMs: 203 },
      },
      { deviceId: 'radio', preset: 'Sideband voices' },
    ],
  },
  {
    id: 'polar-signal-wind-bent-shellac',
    name: 'Wind-bent shellac',
    category: 'tape',
    description:
      'A worn shellac disc, nearly mono, narrow-band and noisy, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'vinyl', preset: 'Ballroom 78', params: { spin: 1.33 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
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
    id: 'polar-signal-static-over-the-town',
    name: 'Static over the town',
    category: 'tape',
    description:
      'A low cut and a small dip in the low mids, to make room, then a shortwave set tuned off the station, whistling and broken.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Layer' },
      { deviceId: 'radio', preset: 'Off the dial' },
    ],
  },
  {
    id: 'polar-signal-shellac-in-january',
    name: 'Shellac in january',
    category: 'tape',
    description:
      'A worn shellac disc, then a far radio station, sinking in and out of heavy static, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'vinyl', preset: 'Ballroom 78' },
      { deviceId: 'patina', preset: 'Distant station' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 70.8, lowDecay: 7.86, midDecay: 5.82 },
      },
    ],
  },
  {
    id: 'polar-signal-crackle-by-lamplight',
    name: 'Crackle by lamplight',
    category: 'tape',
    description:
      'A medium-wave station under the crackle of a far storm, then the hum of an amplifier, into a slowly breathing hall.',
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
      'A small mono radio, then the soft air of an open microphone under the sound, into a reverb that breathes in slow waves over and over.',
    effects: [
      { deviceId: 'patina', preset: 'Kitchen radio' },
      { deviceId: 'noise-floor', preset: 'Close mic' },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.71 } },
    ],
  },
  {
    id: 'polar-signal-december-bits',
    name: 'December bits',
    category: 'tape',
    description:
      'A low cut and a small dip in the low mids, to make room, then toy eight-bit converters, then a single saturated tape slap behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Layer' },
      { deviceId: 'vintage-digital', preset: 'Toy' },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  {
    id: 'polar-signal-night-band-drift',
    name: 'Night-band drift',
    category: 'tape',
    description:
      'A slow reel whose pitch sways widely and never settles, then a pure low mains hum in the middle of the sound.',
    effects: [
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'noise-floor', preset: 'Mains hum', params: { response: 0.423, hold: 20.1 } },
    ],
  },
  {
    id: 'polar-signal-harbour-filter',
    name: 'Harbour filter',
    category: 'motion',
    description:
      'A tape reel pushed hard into thick saturation, then a low-pass that opens and closes over about half a minute.',
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
    id: 'polar-signal-jetty-surf',
    name: 'Jetty surf',
    category: 'motion',
    description:
      'The level rising and falling at random, like surf, into a short mono slap of a few reflections.',
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.294 } },
      { deviceId: 'shaped-reverb', preset: 'Mono slap' },
    ],
  },
  {
    id: 'polar-signal-snowline-drift',
    name: 'Snowline drift',
    category: 'motion',
    description:
      'A slow phasing drift, then a space that answers in hard separate echoes, into a plain hall of about four seconds with no vowel in it.',
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
    id: 'polar-signal-skerry-voices',
    name: 'Skerry voices',
    category: 'motion',
    description:
      'A held pad whose every overtone wavers, like a choir, then a faint, very slow phasing that barely stirs the sound.',
    effects: [
      { deviceId: 'sustainer', preset: 'Wavering choir', params: { mix: 0.39 } },
      { deviceId: 'freq-shifter', preset: 'Still water', params: { mix: 0.21 } },
    ],
  },
  {
    id: 'polar-signal-comb-at-the-quay',
    name: 'Comb at the quay',
    category: 'motion',
    description:
      'A slow comb sliding against the dry sound, sides opposed, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      { deviceId: 'tremolo', preset: 'Drifting comb', params: { rate: 0.0938 } },
      { deviceId: 'tape', preset: 'Seasick' },
    ],
  },
  {
    id: 'polar-signal-strait-water',
    name: 'Strait water',
    category: 'texture',
    description:
      'A dark, bassy wash that hangs under the notes for seconds, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.36 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 44.4, mix: 0.24 } },
    ],
  },
  {
    id: 'polar-signal-ice-locked-drone',
    name: 'Ice-locked drone',
    category: 'texture',
    description:
      'A slow drone that swells from the playing and never fades, then a subsonic cut with the low mids and presence eased a touch.',
    effects: [
      { deviceId: 'sustainer', preset: 'Endless drone' },
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.65 } },
    ],
  },
  {
    id: 'polar-signal-strings-in-midwinter',
    name: 'Strings in midwinter',
    category: 'texture',
    description:
      'A compressor as slow as a hand on a fader, then a held pad that swells in slowly like bowed strings.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { attack: 2640 } },
      { deviceId: 'sustainer', preset: 'Slow strings', params: { attack: 2.08, glide: 1.63 } },
    ],
  },
  {
    id: 'polar-signal-arctic-drone',
    name: 'Arctic drone',
    category: 'texture',
    description:
      'The first phrase played, held an octave down as a dark drone, then a drifting reel laid half against the dry sound, a chorus.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Deep drone', params: { length: 3.08 } },
      { deviceId: 'tape', preset: 'Drifting chorus' },
    ],
  },
  {
    id: 'polar-signal-cloud-off-the-coast',
    name: 'Cloud off the coast',
    category: 'texture',
    description:
      'A wide cloud whose grains jump by fifths and octaves, then echoes that sink a few hertz flatter on every repeat.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Choir of fifths', params: { size: 556, density: 15.1 } },
      { deviceId: 'freq-shifter', preset: 'Falling spiral', params: { mix: 0.353 } },
    ],
  },
  {
    id: 'polar-signal-loop-in-harbour',
    name: 'Loop in harbour',
    category: 'texture',
    description:
      'A wide, muffled loop of the last phrase, as if under water, then a steep low-pass at four hundred hertz, the top gone.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Underwater', params: { length: 2.68 } },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 1.02, envAttackMs: 11.1, envReleaseMs: 196 },
      },
    ],
  },
  {
    id: 'polar-signal-net-loft-glue',
    name: 'Net-loft glue',
    category: 'texture',
    description:
      'A firm, slow compressor that keeps long swells held down, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { attack: 168, release: 6.66 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 1.34, modRate: 0.889 } },
    ],
  },
  {
    id: 'polar-signal-snowplough-undertow',
    name: 'Snowplough undertow',
    category: 'texture',
    description:
      'Long slow grains an octave down, most of them reversed, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { size: 953, density: 5.21 } },
      {
        deviceId: 'ether-reverb',
        preset: 'Dark infinite',
        params: { predelayMs: 55.6, mix: 0.192 },
      },
    ],
  },
  {
    id: 'polar-signal-solstice-melt',
    name: 'Solstice melt',
    category: 'texture',
    description:
      'A held pad that takes seconds to melt into each new chord, into a huge hall whose tail hums a soft oo for a long while.',
    effects: [
      { deviceId: 'sustainer', preset: 'Long glide', params: { attack: 1.36 } },
      { deviceId: 'vowel-reverb', preset: 'Endless oo' },
    ],
  },
  {
    id: 'polar-signal-drone-in-the-lee',
    name: 'Drone in the lee',
    category: 'texture',
    description:
      'A dark drone looped from each note with the octave below, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'cascade', preset: 'Deep drone', params: { time: 1500 } },
      { deviceId: 'expanse', preset: 'Far echoes' },
    ],
  },
  {
    id: 'polar-signal-blown-back-sub',
    name: 'Blown-back sub',
    category: 'texture',
    description:
      'A faint layer of reversed grains an octave below the sound, then five-bit converters fed hot, a coarse grain on every note.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Sub octave' },
      { deviceId: 'vintage-digital', preset: 'Crushed' },
    ],
  },
  {
    id: 'polar-signal-blur-in-january',
    name: 'Blur in january',
    category: 'pitch',
    description:
      'A blurred half-speed wash, then a steep dark low-pass, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'half-speed', preset: 'Blurred half' },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 1.07, envAttackMs: 9.75, envReleaseMs: 192 },
      },
      { deviceId: 'expanse', preset: 'Far echoes' },
    ],
  },
  {
    id: 'polar-signal-boathouse-octave',
    name: 'Boathouse octave',
    category: 'pitch',
    description:
      'A smooth octave-down bed, then a glacial low-pass, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { length: 2310 } },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'polar-signal-cabin-depths',
    name: 'Cabin depths',
    category: 'pitch',
    description:
      'A copy two octaves down, then a steep low-pass at four hundred hertz, the top gone, into a huge wash by itself.',
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves', params: { length: 1360 } },
      { deviceId: 'auto-filter', preset: 'Low-pass gate' },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 43, modRate: 0.0919 } },
    ],
  },
  {
    id: 'polar-signal-lighthouse-chops',
    name: 'Lighthouse chops',
    category: 'pitch',
    description:
      'Half-speed chops, then a glacial low-pass, into a long tail that wavers in pitch like an unsteady choir.',
    effects: [
      { deviceId: 'half-speed', preset: 'Slow chops', params: { length: 508 } },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.033, envAttackMs: 11.2, envReleaseMs: 197 },
      },
      { deviceId: 'expanse', preset: 'Seasick choir' },
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
    id: 'polar-signal-slide-up-the-coast',
    name: 'Slide up the coast',
    category: 'pitch',
    description:
      'An echo that slides down an octave like tape slowed by hand, then a thin, quiet held pad with its lows cut, behind the notes.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Falling tape', params: { time: 463, modRate: 0.276 } },
      { deviceId: 'sustainer', preset: 'Thin halo', params: { attack: 1.12, glide: 0.96 } },
    ],
  },
  {
    id: 'polar-signal-arctic-bass',
    name: 'Arctic bass',
    category: 'pitch',
    description:
      'A first-note swell, then the octave below alone, rounded off into a bass, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'swell', preset: 'First note only' },
      { deviceId: 'octaves', preset: 'Bass alone' },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
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
    id: 'polar-signal-breakwater-blur',
    name: 'Breakwater blur',
    category: 'pitch',
    description:
      'A blurred half-speed wash an octave down, its cycles uneven, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'half-speed', preset: 'Blurred half', params: { length: 500 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 35.8, lowDecay: 2.65, midDecay: 3.12 },
      },
    ],
  },
  {
    id: 'polar-signal-breakwater-fourth',
    name: 'Breakwater fourth',
    category: 'pitch',
    description:
      'A close harmony a fourth below, made of short slowed pieces, then two duller copies a few cents off, tucked behind the sound.',
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
    id: 'polar-signal-sampler-by-lamplight',
    name: 'Sampler by lamplight',
    category: 'master',
    description:
      'A grainy early sampler, then a compressor as slow as a hand on a fader, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'patina', preset: 'Early sampler' },
      { deviceId: 'ambient-comp', preset: 'Slow fader' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -5.74 } },
    ],
  },
  {
    id: 'polar-signal-weather-hut-width',
    name: 'Weather-hut width',
    category: 'master',
    description:
      'A scooped, hollow tone, then the sides lifted a little, wider with nothing added, then a lightly pushed limiter.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.63 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Light touch', params: { outputGain: 0.296 } },
    ],
  },
  {
    id: 'polar-signal-tin-roof-sampler',
    name: 'Tin-roof sampler',
    category: 'master',
    description:
      'A grainy early sampler, then a slow compressor that evens out swells over seconds, then a lowered safety limiter.',
    effects: [
      { deviceId: 'patina', preset: 'Early sampler' },
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'fet-limiter', preset: 'Lower ceiling', params: { outputGain: 0.919 } },
    ],
  },
  {
    id: 'polar-signal-island-reel',
    name: 'Island reel',
    category: 'master',
    description:
      'A fast, steady reel pushed into soft saturation, then a parallel compressor that lifts quiet playing and tails, then a safety limiter.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Lift' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'polar-signal-slipway-thump',
    name: 'Slipway thump',
    category: 'master',
    description:
      'A thick, soft cassette, then a low cut and a small dip in the low mids, to make room, then a low, breathing ceiling.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'ambient-eq', preset: 'Layer' },
      { deviceId: 'ambient-limiter', preset: 'Breathing', params: { gain: 0.768 } },
    ],
  },
  {
    id: 'polar-signal-coastguard-glue',
    name: 'Coastguard glue',
    category: 'master',
    description:
      'A slightly eased equaliser, then a pluck-taming compressor, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.62 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { attack: 10.7, release: 0.142 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
]
