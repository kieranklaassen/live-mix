import { type FactoryPreset } from '../types'

// Old orchestral records looped, slowed and blurred until only fog is left between the trees,
// with a muffled four-to-the-floor thump somewhere under the ground.

export const PRESETS: readonly FactoryPreset[] = [
  // Chamber strings: the section the loops are cut from.
  {
    id: 'forest-pulse-canopy-fog',
    name: 'Canopy fog',
    category: 'string',
    description:
      'Six muted players to a note, arriving over three seconds, smeared until no bow change is left, in a very large space.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { players: 6, attack: 3, release: 5, scatter: 0.8, width: 0.5, volume: -10.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.5, mix: 0.8 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { mix: 0.35, highCut: 4000, width: 0.6 },
      },
    ],
  },
  {
    id: 'forest-pulse-wrong-speed-strings',
    name: 'Wrong speed strings',
    category: 'string',
    description:
      'A warm section on a record played an octave down at half speed, crackle and all, run together in a stone hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 1.2, release: 3, vibrato: 10, volume: -9 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Clean pressing',
        params: { surface: 0.2, warp: 0.45, crackle: 0.35, wear: 0.4, tone: -0.3 },
      },
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { highCut: 6000 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'forest-pulse-locked-groove-bows',
    name: 'Locked groove bows',
    category: 'string',
    description:
      'A bar of strings caught by a short looper and going round under itself, a scratch coming past once a turn, in a hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: { attack: 0.3, release: 1.5, bow: 0.5, volume: -7 },
    },
    effects: [
      {
        deviceId: 'micro-looper',
        params: { length: 1.4, smear: 0.3, fade: 0.9, drift: 0.1, tone: 5000, mix: 0.5 },
      },
      { deviceId: 'vinyl', preset: 'Locked scratch', params: { crackle: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'forest-pulse-dark-trunk-strings',
    name: 'Dark trunk strings',
    category: 'string',
    description:
      'Slow bows on a low fifth, wide in tuning, under a steep filter closed to 500 Hz, glued and left in a seven-second nave.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { players: 6, attack: 2, release: 4, bow: 0.2, mute: 0.6, volume: -6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 0, slope: 1, cutoffHz: 520, resonance: 0.9 },
      },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4, damping: 2500 } },
    ],
    preview: 'low',
  },
  {
    id: 'forest-pulse-grain-mist-bows',
    name: 'Grain mist bows',
    category: 'string',
    description:
      'Airy bows over the fingerboard replayed as long grains an octave down, half of them backwards, in a tail that falls.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { players: 5, attack: 2, release: 4, volume: -4.5 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { spread: 0.9, mix: 0.6 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'forest-pulse-far-violin',
    name: 'Far violin',
    category: 'string',
    description:
      'One player with a wide vibrato while dull memories of the line drift back, some slowed or reversed, with far echoes behind.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.5, release: 2, vibrato: 16, scatter: 0.5, volume: -2 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Half-remembered', params: { mix: 0.45 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'forest-pulse-standing-section',
    name: 'Standing section',
    category: 'string',
    description:
      'Players without vibrato caught and held as an even dark bed that glides to the next chord, slowly phased, in a long plate.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { players: 4, attack: 2.2, volume: -2 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { mix: 0.6 } },
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { centerHz: 700, mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.3 } },
    ],
  },

  // Tape orchestra: sections already on worn tape, slowed and filtered further.
  {
    id: 'forest-pulse-cellos-under-fog',
    name: 'Cellos under fog',
    category: 'string',
    description:
      'Cellos on tape at half speed, an octave down, blurred into a wash below 2.5 kHz and left in a cathedral.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { attack: 1, release: 3, tone: -0.2, spread: 0.6, volume: -18 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { width: 0.4, mix: 0.65 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'forest-pulse-flea-market-strings',
    name: 'Flea market strings',
    category: 'string',
    description:
      'Slow tape strings pressed onto a worn, warped record with its clicks, filtered to a dull band, in a very large space.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { age: 0.6, attack: 1.4, release: 2.5, volume: -11 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find' },
      {
        deviceId: 'auto-filter',
        params: { type: 0, slope: 0, cutoffHz: 1500, resonance: 0.8 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'forest-pulse-fir-horn-loop',
    name: 'Fir horn loop',
    category: 'wind',
    description:
      'A horn chorale played into a two-second tape loop that piles up and wears on every pass, in a hall that breathes.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { attack: 0.5, release: 2, age: 0.45, volume: -11 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 2, feedback: 0.78, wear: 0.5, wow: 0.3, spread: 0.5, mix: 0.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'forest-pulse-choir-among-needles',
    name: 'Choir among needles',
    category: 'voice',
    description:
      'A worn choir tape at half speed scattered into soft grains, in a hall whose tail sings a low vowel back.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { speed: 1, attack: 0.8, release: 2.5, volume: -11 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 500, density: 12, reverse: 0.4, mix: 0.55 },
      },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'forest-pulse-slow-phase-reeds',
    name: 'Slow phase reeds',
    category: 'wind',
    description:
      'Clarinets and oboes at half speed with a twelve-stage phaser turning once in twenty seconds, in a very large room.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { speed: 1, attack: 0.9, release: 2.5, age: 0.4, volume: -9.5 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Twelve Stage Cloud',
        params: { rate: 0.05, stereo: 90, mix: 0.5 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, highCut: 5000 } },
    ],
    preview: 'chord',
  },
  {
    id: 'forest-pulse-bright-clearing',
    name: 'Bright clearing',
    category: 'wind',
    description:
      'Breathy tape flutes thrown back reversed an octave up and blurred into a halo that climbs: light coming through the leaves.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { attack: 0.6, release: 2.5, age: 0.3, tone: 1, length: 9, volume: -14.5 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { tone: 9000, mix: 0.55 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Glass halo',
        params: { tilt: 4, width: 0.8, mix: 0.55 },
      },
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { shimmer: 0.65, tone: 9000, mix: 0.4 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'forest-pulse-sticking-disc-violins',
    name: 'Sticking disc violins',
    category: 'string',
    description:
      'Three violins on a disc that sticks and repeats a quarter of a second, dust and scratches over it, in a small plate.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: { attack: 0.2, release: 1.2, volume: -8 },
    },
    effects: [
      {
        deviceId: 'glitch',
        preset: 'Stuck',
        params: { time: 240, chance: 0.4, calm: 0.6, mix: 0.8 },
      },
      { deviceId: 'vinyl', preset: 'Dust and scratches', params: { crackle: 0.6 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },

  // Horns: the forest's own instrument, mostly heard from a long way off.
  {
    id: 'forest-pulse-far-horn-call',
    name: 'Far horn call',
    category: 'wind',
    description:
      'A horn section calling in parallel fifths from the far side of the wood, sparse far echoes behind it and the top rolled off.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { attack: 1, release: 3.5, section: 0.8, harmony: 1, volume: -2 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 9000 } },
    ],
  },
  {
    id: 'forest-pulse-low-brass-fog',
    name: 'Low brass fog',
    category: 'wind',
    description:
      'Low brass that takes three seconds to speak, smeared until it has no edges, on a low fifth in a cathedral.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 3, volume: -9 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { highCut: 5000, width: 0.3, mix: 0.7 },
      },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
      { deviceId: 'stereo-widener', params: { width: 0.35 } },
    ],
    preview: 'low',
  },
  {
    id: 'forest-pulse-brass-comes-round',
    name: 'Brass comes round',
    category: 'wind',
    description:
      'A firm trumpet chord whose last two seconds come round again at half speed underneath, on tape, in a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.55, attack: 0.25, release: 1.2, volume: -6 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed bed', params: { length: 2, mix: 0.45 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'forest-pulse-muted-horn-smoke',
    name: 'Muted horn smoke',
    category: 'wind',
    description:
      'A muted trumpet line whose echoes fall an octave as grains, on a crackling record, in a long tail that falls.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.5, release: 2.2, volume: 0 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.4 } },
      { deviceId: 'vinyl', preset: 'Clean pressing', params: { surface: 0.2, crackle: 0.4 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'forest-pulse-half-speed-chorale',
    name: 'Half-speed chorale',
    category: 'wind',
    description:
      'A full horn section replayed an octave down at half speed as one slow bed, darkened, in a very long room.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.5, section: 1, attack: 1.5, volume: -10 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave' },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 5000 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'forest-pulse-flugel-going-under',
    name: 'Flugel going under',
    category: 'wind',
    description:
      'A breathy flugelhorn line with a slow chorus, in a reverb whose tail drops an octave on every pass.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { breath: 0.65, attack: 0.9, release: 3, vibrato: 0.2, volume: 1.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.35 } },
      { deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'forest-pulse-lidded-horns',
    name: 'Lidded horns',
    category: 'wind',
    description:
      'A hard-blown horn chord under a steep filter that opens and closes over sixteen seconds, through a transformer, in a reverb that swells.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.75, section: 0.9, attack: 2, volume: -11 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.4 } },
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 450,
          resonance: 1.1,
          lfoAmount: 45,
          lfoRateHz: 0.06,
          lfoShape: 0,
        },
      },
      { deviceId: 'shaped-reverb', preset: 'Slow bloom', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },

  // Ladder bass: the thump. Short, low-passed, and kept going by an echo or a tremolo.
  {
    id: 'forest-pulse-heartbeat-below',
    name: 'Heartbeat below',
    category: 'keys',
    description:
      'One low thump repeated twice a second by a dark delay that slowly lets it go, closed off above 160 Hz: the drum under the floor.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 0.8,
        beat: 2,
        sub: 1,
        cutoff: 85,
        emphasis: 0.1,
        contour: 0.3,
        decay: 0.4,
        drive: 0.5,
        glide: 0,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 500,
          feedback: 0.9,
          modDepth: 0,
          tone: 1000,
          age: 0.2,
          spread: 0,
          mix: 0.5,
        },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 160 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
    preview: 'low',
  },
  {
    id: 'forest-pulse-four-through-moss',
    name: 'Four through moss',
    category: 'keys',
    description:
      'A held sub note cut into two soft beats a second by a square tremolo, warmed and closed to 130 Hz: felt more than heard.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { cutoff: 140, drive: 0.3, volume: -22.5 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 0, rate: 2, depth: 1, shape: 2, drift: 0, smooth: 0.5 },
      },
      { deviceId: 'saturator', preset: 'Tape Print', params: { outputDb: -2 } },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 130 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.12 } },
    ],
    preview: 'low',
  },
  {
    id: 'forest-pulse-root-floor',
    name: 'Root floor',
    category: 'drone',
    description:
      'A pure sub note held for as long as the key is down, given weight by a preamp, in a hall heard only when it stops.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { beat: 5, cutoff: 160, drive: 0.15, volume: -24.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'forest-pulse-next-room-kick',
    name: 'Next room kick',
    category: 'keys',
    description:
      'A kick repeated by a tape echo and heard from the corridor: through a speaker, round a corner and down a hall.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 0.6,
        beat: 3,
        sub: 0.8,
        cutoff: 120,
        emphasis: 0.2,
        contour: 0.7,
        decay: 0.3,
        drive: 0.6,
        glide: 0,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 480,
          feedback: 0.88,
          heads: 0,
          wow: 0.1,
          flutter: 0.05,
          drive: 0.4,
          lowCut: 20,
          highCut: 900,
          spread: 0,
          mix: 0.5,
        },
      },
      {
        deviceId: 're-amp',
        preset: 'Down the hall',
        params: { speaker: 2, room: 0.7, bass: 1, treble: -0.6, noise: 0.05, output: 4.5 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'forest-pulse-slow-bass-walk',
    name: 'Slow bass walk',
    category: 'keys',
    description:
      'Two beating oscillators behind a filter that opens a little as each note speaks, for slow low lines, in a long dull plate.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { beat: 12, sub: 0.5, cutoff: 240, glide: 0.5, volume: -14.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 0,
          cutoffHz: 320,
          resonance: 1.4,
          envAmount: 20,
          envAttackMs: 200,
          envReleaseMs: 900,
        },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.7, mix: 0.25 } },
    ],
    preview: 'line',
  },
  {
    id: 'forest-pulse-knock-on-bark',
    name: 'Knock on bark',
    category: 'keys',
    description:
      'A short hollow knock with the filter snapping shut, repeated unevenly by dotted tape heads into a driven spring.',
    instrument: {
      deviceId: 'ladder-bass',
      params: {
        wave: 1,
        beat: 0,
        sub: 0.4,
        cutoff: 180,
        emphasis: 0.55,
        contour: 0.85,
        decay: 0.28,
        drive: 0.4,
        glide: 0,
        volume: 6,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 375,
          feedback: 0.85,
          heads: 3,
          wow: 0.2,
          flutter: 0.1,
          drive: 0.4,
          lowCut: 40,
          highCut: 1800,
          spread: 0.6,
          mix: 0.45,
        },
      },
      { deviceId: 'spring-reverb', preset: 'Dub send', params: { mix: 0.4 } },
    ],
    preview: 'low',
  },
  {
    id: 'forest-pulse-ground-swell',
    name: 'Ground swell',
    category: 'drone',
    description:
      'A low note whose filter opens at once and closes over eight seconds, widened by a slow deep chorus, in a very large dark space.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Slow opener',
      params: { sub: 0.6, cutoff: 90, emphasis: 0.4, contour: 0.9, decay: 8, volume: -2 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep Sea', params: { mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, highCut: 3000 } },
    ],
  },

  // String machine: the synthetic section, for the passages where no orchestra is left.
  {
    id: 'forest-pulse-ensemble-behind-trees',
    name: 'Ensemble behind trees',
    category: 'string',
    description:
      'The cello register of a string ensemble keyboard, filtered to 700 Hz on a slow dull record, in a space that hardly ends.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 2.5, release: 5, tone: 700, volume: -8 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Slow platter' },
      { deviceId: 'expanse', preset: 'Event horizon', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'forest-pulse-morning-needles',
    name: 'Morning needles',
    category: 'string',
    description:
      'The upper octave of the ensemble without the lower, a slow flanger moving through it, hung in mist: the lighter side of the same wood.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 2, release: 5, speed: 0.8, width: 0.6, volume: -9 },
    },
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Slow Sweep',
        params: { mix: 0.4 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { tilt: 1.5, width: 0.5, mix: 0.5 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'forest-pulse-three-phase-haze',
    name: 'Three-phase haze',
    category: 'string',
    description:
      'A string ensemble with its chorus fully in and slowed, on tape with a deep slow wow, in a hall that lets it in by waves.',
    instrument: {
      deviceId: 'string-machine',
      params: {
        attack: 1.6,
        release: 4,
        low: 0.5,
        high: 0.3,
        tone: 2200,
        ensemble: 1,
        speed: 0.5,
        drift: 0.6,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { hiss: 0.15 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'forest-pulse-stacked-loops',
    name: 'Stacked loops',
    category: 'string',
    description:
      'A slow ensemble chord with copies an octave and a fourth below under it, as loops at two speeds pile into one chord.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 2.5, release: 5, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        params: {
          pitchA: -12,
          pitchB: -5,
          levelB: 0.8,
          detune: 6,
          mode: 3,
          tone: 4000,
          spread: 0.7,
          mix: 0.5,
        },
      },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.5, mix: 0.3 } },
    ],
  },
  {
    id: 'forest-pulse-saws-to-dust',
    name: 'Saws to dust',
    category: 'string',
    description:
      "Bare sawtooths with no ensemble, through an early sampler's converters, smeared into long grains that run both ways.",
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { attack: 0.5, release: 1.2, tone: 3000, volume: -15 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty sampler', params: { jitter: 0.5 } },
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { decay: 10, mix: 0.3 } },
    ],
  },
  {
    id: 'forest-pulse-low-ensemble-floor',
    name: 'Low ensemble floor',
    category: 'string',
    description:
      'The cello register on a low fifth, four seconds arriving, caught and held as a drone, in a long tail that falls.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 4, release: 7, tone: 600, drift: 0.6, volume: 1 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Endless drone', params: { mix: 0.6 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4 } },
    ],
    preview: 'low',
  },

  // Bow: single strings, bowed, held singing or plucked and then un-plucked.
  {
    id: 'forest-pulse-cello-loop-slowed',
    name: 'Cello loop slowed',
    category: 'string',
    description:
      'A bowed low fifth fed to a four-second tape loop that returns at half speed, an octave under itself, more worn each time.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 1.2, release: 3, pressure: 0.5, volume: -8 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 4, mix: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'low',
  },
  {
    id: 'forest-pulse-thin-bow-mist',
    name: 'Thin bow mist',
    category: 'string',
    description:
      'A light bow that swells slowly into each note, hung in mist, in a hall whose tail sings back an open vowel.',
    instrument: { deviceId: 'bowed-string', preset: 'Glass bow', params: { volume: -6 } },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.7, mix: 0.6 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral choir', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'forest-pulse-sung-string-cluster',
    name: 'Sung string cluster',
    category: 'string',
    description:
      'Strings held singing with no bow, each pair tuned wide apart so the chord beats, filtered to 900 Hz in a very large space.',
    instrument: {
      deviceId: 'bowed-string',
      params: { attack: 2.5, release: 5, brightness: 0.35, detune: 16, volume: -14.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.4 } },
      {
        deviceId: 'auto-filter',
        params: { type: 0, slope: 0, cutoffHz: 900, resonance: 0.9 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'forest-pulse-feedback-in-firs',
    name: 'Feedback in firs',
    category: 'string',
    description:
      'Held strings pushed until they sing their octave like amplifier feedback, through a dark valve fuzz closed at 2.4 kHz, in a long plate.',
    instrument: { deviceId: 'bowed-string', preset: 'Octave feedback', params: { volume: -10 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz bed', params: { output: -7.5 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'forest-pulse-plucks-remembered',
    name: 'Plucks remembered',
    category: 'plucked',
    description:
      'Soft plucks with their starts eased off, coming back later dull, slowed or reversed, in a long room.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { decay: 8, release: 3, volume: -1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'echo-memory', preset: 'Half-remembered', params: { mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 12, mix: 0.35 } },
    ],
  },
  {
    id: 'forest-pulse-worn-cello-side',
    name: 'Worn cello side',
    category: 'string',
    description:
      'A cello line with vibrato on a worn record, each note left hanging behind it as a dull haze of grains.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.4, release: 1.5, body: 0.7, vibrato: 0.4, volume: -9.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find' },
      { deviceId: 'grain-delay', preset: 'Frozen haze', params: { feedback: 0.8, mix: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },

  // Choir: voices as one more section, wordless and mostly low.
  {
    id: 'forest-pulse-low-vowels-fog',
    name: 'Low vowels fog',
    category: 'voice',
    description:
      'Bass voices on a closed vowel arriving over three seconds, blurred below 2.5 kHz, in a seven-second cathedral.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { attack: 3, release: 6, width: 0.5, volume: -15 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { width: 0.45, mix: 0.6 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'forest-pulse-shellac-trebles',
    name: 'Shellac trebles',
    category: 'voice',
    description:
      'A treble choir on oo off an old shellac disc, narrow and crackling, at the far end of a very large space.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { attack: 1.5, release: 3, volume: -10.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Ballroom 78' },
      {
        deviceId: 'auto-filter',
        params: { type: 0, slope: 0, cutoffHz: 1800, resonance: 0.8 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'forest-pulse-breath-between-trees',
    name: 'Breath between trees',
    category: 'voice',
    description:
      'Almost only breath on the vowel, turned slowly by a phaser and scattered round a deep well of short echoes.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 3, release: 6, volume: -10.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.5 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { width: 0.7, mix: 0.4 } },
    ],
  },
  {
    id: 'forest-pulse-looped-singer',
    name: 'Looped singer',
    category: 'voice',
    description:
      'One singer with a wide vibrato, the last three seconds running backwards underneath, on tape that is falling apart.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { attack: 0.3, release: 1.5, tone: 4500, volume: -5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Backwards bed', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'forest-pulse-vowels-doubled-below',
    name: 'Vowels doubled below',
    category: 'voice',
    description:
      'A choir whose vowels keep changing, doubled an octave below, in a hall that lets the sound in by slow waves.',
    instrument: { deviceId: 'choir', preset: 'Slow vowels', params: { volume: -9.5 } },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad octave below', params: { mix: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'forest-pulse-grain-choir-falling',
    name: 'Grain choir falling',
    category: 'voice',
    description:
      'A still ee without vibrato scattered into grains a fifth apart, in a reverb whose tail falls an octave at a time.',
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { voice: 1.1, attack: 3, tone: 3000, volume: -10 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Choir of fifths', params: { mix: 0.5 } },
      { deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.35 } },
    ],
  },

  // Acoustic guitar: plucks taken off, what rings left to loop.
  {
    id: 'forest-pulse-nylon-in-fog',
    name: 'Nylon in fog',
    category: 'plucked',
    description:
      'A nylon guitar with the pluck eased off every note and the rest blurred, with open strings ringing in sympathy behind.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { sustain: 9, release: 5, volume: -1.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0, mix: 0.7 } },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { root: 2, mix: 0.4 } },
    ],
  },
  {
    id: 'forest-pulse-folk-side-looping',
    name: 'Folk side looping',
    category: 'plucked',
    description:
      'A slow twelve-string strum caught in a loop at half speed under itself, crackling like a record left on.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { strum: 90, sustain: 9, release: 5, volume: 0.5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed bed', params: { length: 3, mix: 0.4 } },
      {
        deviceId: 'vinyl',
        preset: 'Clean pressing',
        params: { surface: 0.2, warp: 0.3, crackle: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Atmosphere: what is on the record when the music is not.
  {
    id: 'forest-pulse-canopy-rain',
    name: 'Canopy rain',
    category: 'texture',
    description:
      'Heavy rain heard from under the trees, its top filtered off, in a very large space.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Distant downpour',
      params: { tone: 0.3, attack: 3, width: 0.6, volume: 4.5 },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 2200 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'forest-pulse-empty-groove',
    name: 'Empty groove',
    category: 'texture',
    description:
      'The surface of a record with nothing on it, slowed to half speed and driven hard so the crackle is low and thick, in a small room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Old record',
      params: { density: 0.9, attack: 1, release: 2, volume: 0 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed', params: { length: 2000, smooth: 1 } },
      {
        deviceId: 'saturator',
        params: { curve: 1, driveDb: 22, toneDb: 0, outputDb: -10.5, adaa: 1 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },

  // Aurora: synthetic brass standing in for the horn section.
  {
    id: 'forest-pulse-brass-through-fog',
    name: 'Brass through fog',
    category: 'pad',
    description:
      'A dark brass pad that speaks over three seconds and keeps swelling, hung in mist, in a long plate.',
    instrument: { deviceId: 'aurora', preset: 'Slow bloom', params: { volume: -10 } },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.8, width: 0.7, mix: 0.6 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'forest-pulse-night-horn-floor',
    name: 'Night horn floor',
    category: 'pad',
    description:
      'Soft synthetic horns on a low fifth with the same notes an octave down at half speed under them, in a cathedral.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { brilliance: 500, lowCut: 40, attack: 2.5, release: 6, detune: 12, volume: -7.5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'low',
  },

  // Chord harp: one strum, returned later.
  {
    id: 'forest-pulse-harp-chord-returning',
    name: 'Harp chord returning',
    category: 'plucked',
    description:
      'A slow strum up and down four octaves that comes back whole three seconds later, backwards, in a cathedral.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { tone: 0.25, volume: -3.5 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Long mirror', params: { time: 3000, mix: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'forest-pulse-brushed-chord-below',
    name: 'Brushed chord below',
    category: 'plucked',
    description:
      'A brushed chord with its soft pad turned up, replayed an octave down as long slow grains, in a very long room.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { sustain: 7, pad: 0.8, spread: 0.3, volume: -17 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { spread: 0, mix: 0.55 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
    ],
  },

  // Clarinet: the woodwind desk, low and slowed.
  {
    id: 'forest-pulse-bass-reed-under',
    name: 'Bass reed under',
    category: 'wind',
    description:
      'A bass clarinet line with itself an octave down at half speed running together underneath, in a cathedral.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { attack: 0.6, release: 2, volume: -5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { mix: 0.6 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'forest-pulse-hollow-reed-haze',
    name: 'Hollow reed haze',
    category: 'wind',
    description:
      'A hollow clarinet chord on tape that wows and drops out, hung in mist, in a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { attack: 1.5, release: 3, volume: -13 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.25 } },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.7, mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },

  // Drone: the chord with everything but its weight removed.
  {
    id: 'forest-pulse-cluster-among-firs',
    name: 'Cluster among firs',
    category: 'drone',
    description:
      'A cluster of close partials wandering in pitch over tuned air, the surface of a record under it, in a very large space.',
    instrument: {
      deviceId: 'drone',
      preset: 'Fog cluster',
      params: { attack: 4, volume: -10.5 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Old record', params: { level: -36 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, width: 0.8 } },
    ],
  },
  {
    id: 'forest-pulse-throbbing-low-octaves',
    name: 'Throbbing low octaves',
    category: 'drone',
    description:
      'Low octaves over a heavy sub, throbbing twice a second under a steep filter at 300 Hz, in a hall.',
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { attack: 2, volume: -9 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 0, rate: 2, depth: 0.6, shape: 0, drift: 0, smooth: 0.3 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 300 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Dusk: a chorus polysynth, either bent by the record or turned into the drum.
  {
    id: 'forest-pulse-warped-evening-pad',
    name: 'Warped evening pad',
    category: 'pad',
    description:
      'A chorus-synth chord whose filter opens over three seconds, on a warped record that bends its pitch every turn, in a hall.',
    instrument: { deviceId: 'dusk', preset: 'Slow bloom', params: { volume: -10 } },
    effects: [
      { deviceId: 'vinyl', preset: 'Warped', params: { crackle: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'forest-pulse-pad-turned-kick',
    name: 'Pad turned kick',
    category: 'keys',
    description:
      'A square and its sub octave under a filter that snaps open and falls shut twice a second: a drum made out of a pad.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { cutoff: 400, attack: 0.05, volume: -14.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 70,
          resonance: 1.5,
          lfoAmount: 100,
          lfoRateHz: 2,
          lfoShape: 3,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
    preview: 'low',
  },

  // Ember: a plain synth, used once as the kick drum itself and once as its room.
  {
    id: 'forest-pulse-kick-under-leaves',
    name: 'Kick under leaves',
    category: 'keys',
    description:
      'A sine and its sub octave whose pitch and level both fall twice a second while a key is held: a kick, closed to 140 Hz.',
    instrument: {
      deviceId: 'ember',
      preset: 'Sub Sine',
      params: {
        lfo1Shape: 2,
        lfo1Rate: 2,
        lfo1Dest: 2,
        lfo1Amount: 1,
        lfo2Shape: 2,
        lfo2Rate: 2,
        lfo2Dest: 0,
        lfo2Amount: 0.5,
        ampRelease: 0.3,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 140 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
    preview: 'low',
  },
  {
    id: 'forest-pulse-ash-floor',
    name: 'Ash floor',
    category: 'pad',
    description:
      'Saw and pulse an octave apart with the filter near 260 Hz moving slowly, a haze of grains behind, in a large dark space.',
    instrument: { deviceId: 'ember', preset: 'Dark drone', params: { volume: -9.5 } },
    effects: [
      { deviceId: 'grain-delay', preset: 'Frozen haze', params: { feedback: 0.8, mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, highCut: 3500 } },
    ],
    preview: 'low',
  },

  // Felt piano: a salon piano with the hammers taken away or the record slowed.
  {
    id: 'forest-pulse-piano-standing-still',
    name: 'Piano standing still',
    category: 'keys',
    description:
      'A felted piano with the hammers faded off, a string pad growing out of each chord behind it, both blurred until they stand still.',
    instrument: { deviceId: 'felt-piano', preset: 'Intimate', params: { outputDb: -10 } },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'pad-follower', preset: 'Long shadow', params: { width: 0.6 } },
      { deviceId: 'spectral-blur', preset: 'Endless', params: { width: 0.3, mix: 0.7 } },
    ],
  },
  {
    id: 'forest-pulse-slowed-salon-piano',
    name: 'Slowed salon piano',
    category: 'keys',
    description:
      'A piano in a hall on a worn record, with the same bars an octave down at half speed under it.',
    instrument: { deviceId: 'felt-piano', preset: 'Hall', params: { outputDb: -13.5 } },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find' },
      {
        deviceId: 'half-speed',
        preset: 'Half speed',
        params: { length: 2000, smooth: 0.8, mix: 0.6 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Flute: breath more than tone.
  {
    id: 'forest-pulse-low-flutes-smeared',
    name: 'Low flutes smeared',
    category: 'wind',
    description:
      'Low flutes on a chord, replayed as second-long grains running both ways until the breaths join up, in a very large space.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 1.2, volume: -14.5 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.65 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'forest-pulse-breath-through-bark',
    name: 'Breath through bark',
    category: 'wind',
    description:
      'A low flute that is nearly all air through a slow band-pass sweep, in a hall whose tail sings a low vowel.',
    instrument: { deviceId: 'flute', preset: 'Breath pad', params: { volume: -6.5 } },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 2, slope: 0, cutoffHz: 700, resonance: 2, lfoAmount: 40, lfoRateHz: 0.07 },
      },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },

  // Glass: the one bright corner, and a bowl dragged under.
  {
    id: 'forest-pulse-light-on-leaves',
    name: 'Light on leaves',
    category: 'bell',
    description:
      'Small glass strikes that come back as a rain of fast octave repeats, under a short halo two octaves up: water dripping in sunlight.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: { brightness: 0.7, volume: -2 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain', params: { spread: 0.8, mix: 0.5 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { width: 0.8, mix: 0.35 } },
      { deviceId: 'ambient-eq', params: { lowCut: 300, body: -4, presence: 4, air: 6 } },
    ],
  },
  {
    id: 'forest-pulse-quarter-speed-bowl',
    name: 'Quarter-speed bowl',
    category: 'bell',
    description:
      'A struck bowl with itself two octaves down at quarter speed under it, blurred dark, in a long tail that falls.',
    instrument: { deviceId: 'fm-glass', preset: 'Temple bowl', params: { volume: -15.5 } },
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves under', params: { mix: 0.6 } },
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { width: 0.6, mix: 0.5 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4 } },
    ],
  },

  // Grain: for a bar lifted from an old record.
  {
    id: 'forest-pulse-one-bar-in-mist',
    name: 'One bar in mist',
    category: 'pad',
    description:
      'Whatever is loaded, stopped at one moment and held as soft grains, hung in mist, in a cathedral: made for a bar of strings.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: { attack: 2, release: 5, tone: 4000, volume: -22 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.7, mix: 0.6 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'forest-pulse-backwards-bar',
    name: 'Backwards bar',
    category: 'pad',
    description:
      'Whatever is loaded read backwards in long grains, on a record, with a slowed copy a fifth below under it.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { tone: 3500, volume: -18 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Clean pressing',
        params: { surface: 0.2, crackle: 0.35, wear: 0.4 },
      },
      { deviceId: 'half-speed', preset: 'Fifth down bed' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },

  // Guitar: a rock chord with the pick removed, the other thing loops get cut from.
  {
    id: 'forest-pulse-fuzz-chord-haze',
    name: 'Fuzz chord haze',
    category: 'plucked',
    description:
      'An electric chord swelled in with no pick, through a dark valve fuzz, the sort of rock chord a loop is cut from, in a large room.',
    instrument: { deviceId: 'guitar', preset: 'Volume swell', params: { volume: 0 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz bed', params: { output: -6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, highCut: 4000 } },
    ],
    preview: 'chord',
  },
  {
    id: 'forest-pulse-strum-under-water',
    name: 'Strum under water',
    category: 'plucked',
    description:
      'A slow strum on the neck pickup that returns two seconds later backwards and an octave down, both blurred dark.',
    instrument: { deviceId: 'guitar', preset: 'Slow strum', params: { volume: -4 } },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { mix: 0.45 } },
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { width: 0.6, mix: 0.5 } },
    ],
  },

  // Handpan: slowed and dulled until the thump of air is the point.
  {
    id: 'forest-pulse-slowed-steel',
    name: 'Slowed steel',
    category: 'bell',
    description:
      'A steel pan replayed an octave down at half speed and dulled to 900 Hz: mostly the low thump of air under each note.',
    instrument: { deviceId: 'handpan', preset: 'Low ding', params: { volume: -3.5 } },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { mix: 0.7 } },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 900 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'forest-pulse-tongue-drum-mist',
    name: 'Tongue drum mist',
    category: 'bell',
    description:
      'A soft tongue drum with the stroke eased off, its ring scattered into a cloud, in a long tail that falls.',
    instrument: { deviceId: 'handpan', preset: 'Tongue drum', params: { volume: 0 } },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.5 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4 } },
    ],
  },

  // Harp: the orchestra's harp, a sweep on a loop or strings with no fingers.
  {
    id: 'forest-pulse-looped-harp-sweep',
    name: 'Looped harp sweep',
    category: 'plucked',
    description:
      'Harp notes that each start with a sweep up the strings, piling up on a three-second tape loop, on a record, in a hall.',
    instrument: { deviceId: 'harp', preset: 'Glissando', params: { volume: -0.5 } },
    effects: [
      { deviceId: 'tape-loop', preset: 'Two decks', params: { length: 3, feedback: 0.75 } },
      { deviceId: 'vinyl', preset: 'Clean pressing', params: { surface: 0.2, crackle: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'forest-pulse-pluckless-harp-blur',
    name: 'Pluckless harp blur',
    category: 'plucked',
    description:
      'Long-ringing harp strings with the pluck faded off each one, smeared until the chord stands still, in a long plate.',
    instrument: { deviceId: 'harp', preset: 'Long glass ring', params: { volume: -5 } },
    effects: [
      { deviceId: 'swell', preset: 'Bowed' },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.2, mix: 0.7 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },

  // Mallets: a rolled chord, and wood standing in for the drum.
  {
    id: 'forest-pulse-rolled-bar-fog',
    name: 'Rolled bar fog',
    category: 'bell',
    description:
      'A marimba chord rolled with soft mallets into a tremolo, filtered to 1.2 kHz, on tape, in a cathedral.',
    instrument: { deviceId: 'mallets', preset: 'Rolled marimba', params: { volume: -16.5 } },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 1200 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'forest-pulse-wooden-heartbeat',
    name: 'Wooden heartbeat',
    category: 'bell',
    description:
      'One low marimba stroke repeated twice a second by a dark delay as it fades, filtered to 400 Hz: a heartbeat made of wood.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.15, decay: 0.6, volume: -7 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 500,
          feedback: 0.9,
          modDepth: 0,
          tone: 1500,
          age: 0.3,
          spread: 0,
          mix: 0.5,
        },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 400 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },

  // Bells: heard from inside the wood, never close.
  {
    id: 'forest-pulse-bells-through-trees',
    name: 'Bells through trees',
    category: 'bell',
    description:
      'Church bells heard from deep in the trees: a long way off, the top gone, with slow far echoes.',
    instrument: { deviceId: 'modal-bells', preset: 'Church bell', params: { volume: -6.5 } },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room', params: { distance: 0.9, room: 0.5 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.4, width: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Dark', params: { presence: -4, highCut: 2500 } },
    ],
  },
  {
    id: 'forest-pulse-rubbed-glass-below',
    name: 'Rubbed glass below',
    category: 'bell',
    description:
      'Rubbed glass on a chord, with each note added an octave below, hung in mist, in a hall.',
    instrument: { deviceId: 'modal-bells', preset: 'Glass harp', params: { volume: -17.5 } },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.7, mix: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },

  // Organ: the cathedral in the city beyond the trees.
  {
    id: 'forest-pulse-spires-in-fog',
    name: 'Spires in fog',
    category: 'organ',
    description:
      'Pipes that take three seconds to speak with the swell box shut, smeared, far down a seven-second nave.',
    instrument: { deviceId: 'organ', preset: 'Distant pipes', params: { volume: -16.5 } },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.5, mix: 0.6 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'forest-pulse-shellac-reed-organ',
    name: 'Shellac reed organ',
    category: 'organ',
    description:
      'A pump organ off an old shellac disc, with the same chord an octave down at half speed under it, in a hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { attack: 0.5, release: 1.5, volume: -12.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Ballroom 78', params: { crackle: 0.4 } },
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Outdoors: the wood itself, slowed or running.
  {
    id: 'forest-pulse-slow-birds',
    name: 'Slow birds',
    category: 'texture',
    description:
      'A dawn chorus slowed to half speed, so every call is an octave down and twice as long, in a very large space.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: { width: 0.7, volume: 1.5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed', params: { length: 3000, smooth: 1 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.7 } },
    ],
  },
  {
    id: 'forest-pulse-clearing-stream',
    name: 'Clearing stream',
    category: 'texture',
    description:
      'A small stream running close by with a slow phaser turning in it and a short bright halo over the water.',
    instrument: { deviceId: 'outdoors', preset: 'Small stream', params: { volume: 0.5 } },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.4 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.3 } },
    ],
  },

  // Pedal steel: sustain with nothing country left in it.
  {
    id: 'forest-pulse-steel-without-edges',
    name: 'Steel without edges',
    category: 'plucked',
    description:
      'Steel strings swelled in over a second and a half with no vibrato, smeared into one tone, in a long plate.',
    instrument: { deviceId: 'pedal-steel', preset: 'Still glass', params: { volume: -12.5 } },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.6, mix: 0.7 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'forest-pulse-slides-slowed',
    name: 'Slides slowed',
    category: 'plucked',
    description:
      'Long steel slides with four-second pieces of themselves coming back an octave down at half speed, on a record, in a long spring.',
    instrument: { deviceId: 'pedal-steel', preset: 'Long slides', params: { volume: -6 } },
    effects: [
      { deviceId: 'half-speed', preset: 'Long drag', params: { mix: 0.6 } },
      { deviceId: 'vinyl', preset: 'Clean pressing', params: { surface: 0.2, crackle: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
  },

  // Sampler: load a bar of an old record; these do the rest.
  {
    id: 'forest-pulse-twelve-bit-bar',
    name: 'Twelve-bit bar',
    category: 'pad',
    description:
      'Whatever is loaded, an octave down and faded in, through an early twelve-bit sampler and mist: load a bar of an old record.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 1.5, release: 4, tone: 3000, volume: -20 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Twelve bit', params: { wear: 0.35 } },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.7, mix: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'forest-pulse-pendulum-bar',
    name: 'Pendulum bar',
    category: 'pad',
    description:
      'The middle of whatever is loaded going there and back an octave down, on a worn record, closed to 1 kHz, in a large space.',
    instrument: {
      deviceId: 'sampler',
      preset: 'There and back',
      params: { attack: 0.8, tone: 2400, volume: -19 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find' },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 1000 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },

  // Tanpura: a drone lute with the buzz taken off or the strings slowed.
  {
    id: 'forest-pulse-buzz-filtered-off',
    name: 'Buzz filtered off',
    category: 'drone',
    description:
      'Four drone strings plucked round slowly with the buzz filtered off at 600 Hz, blurred, in a hall that sings a low vowel back.',
    instrument: { deviceId: 'tanpura', preset: 'Slow wall', params: { volume: -11.5 } },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 600 } },
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { width: 0.6, mix: 0.5 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'forest-pulse-plain-strings-slowed',
    name: 'Plain strings slowed',
    category: 'drone',
    description:
      'Drone strings with no buzz, with themselves an octave down at half speed underneath, on tape with a slow wow, in a hall.',
    instrument: { deviceId: 'tanpura', preset: 'Monochord', params: { volume: -4.5 } },
    effects: [
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { mix: 0.6 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // Thesis: tuned noise, the wind in the trunks.
  {
    id: 'forest-pulse-hollow-trunk-wind',
    name: 'Hollow trunk wind',
    category: 'pad',
    description:
      'Broad bands of noise tuned low around each note and drifting, like wind in hollow trunks, in a very large space.',
    instrument: { deviceId: 'thesis', preset: 'Dark Phrygian' },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 0, outputGain: -5.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'forest-pulse-singing-bands-under',
    name: 'Singing bands under',
    category: 'pad',
    description:
      'Narrow singing bands of noise on each note and its mirror, with an octave below at half speed, in a cathedral.',
    instrument: { deviceId: 'thesis', preset: 'Glass Choir', params: { attack: 2 } },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 6, outputGain: 0 } },
      { deviceId: 'half-speed', preset: 'Continuous octave', params: { mix: 0.6 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },

  // Tine piano: an electric piano with the strike removed or dragged.
  {
    id: 'forest-pulse-tines-without-hammers',
    name: 'Tines without hammers',
    category: 'keys',
    description:
      'A dark electric piano with each strike faded off, through a slow rotating speaker heard across the room, in a very long room.',
    instrument: { deviceId: 'tine-piano', preset: 'Dark felt', params: { volume: -15 } },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'forest-pulse-blurred-half-tines',
    name: 'Blurred half tines',
    category: 'keys',
    description:
      'Long-ringing tines with short jittered pieces of themselves an octave down smeared underneath, in a hall.',
    instrument: { deviceId: 'tine-piano', preset: 'Long sustain', params: { volume: -15.5 } },
    effects: [
      { deviceId: 'half-speed', preset: 'Blurred half', params: { mix: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // Wavetable: slow tables, heard through water or slowed.
  {
    id: 'forest-pulse-hollow-under-water',
    name: 'Hollow under water',
    category: 'pad',
    description:
      'A hollow wavetable chord with its quiet detail thrown away until it swirls as if under water, in a very large space.',
    instrument: { deviceId: 'wavetable', preset: 'Hollow drift', params: { volume: -11 } },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Underwater', params: { stereo: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, width: 0.7 } },
    ],
  },
  {
    id: 'forest-pulse-vowel-table-slowed',
    name: 'Vowel table slowed',
    category: 'pad',
    description:
      'A wavetable moving through vowels, with a slowed copy a fifth below and a blur over both, in a hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { spread: 0.6, volume: -12.5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down bed' },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.4, mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // West coast: a folded tone under a lid, and soft strikes dragged back.
  {
    id: 'forest-pulse-lidded-fold-drone',
    name: 'Lidded fold drone',
    category: 'drone',
    description:
      'A folded tone that keeps shifting under a steep filter near 500 Hz, its partials drifting a fraction of a hertz, in a cathedral.',
    instrument: { deviceId: 'west-coast', preset: 'Folding drone', params: { volume: -9.5 } },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 0, slope: 1, cutoffHz: 500, lfoAmount: 30, lfoRateHz: 0.05 },
      },
      { deviceId: 'freq-shifter', preset: 'Slow drift' },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'forest-pulse-mallets-pulled-under',
    name: 'Mallets pulled under',
    category: 'bell',
    description:
      'Soft woody strikes that come back reversed as slow loops in the octaves below, dull, in a cave of short echoes.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { decay: 2.5, volume: 0.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Undertow', params: { mix: 0.5 } },
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.35 } },
    ],
  },

  // Zither: hammers rolled into an orchestra's tremolo, and a sweep run backwards.
  {
    id: 'forest-pulse-tremolo-strings-haze',
    name: 'Tremolo strings haze',
    category: 'plucked',
    description:
      "Hammers rolling on doubled strings like an orchestra's tremolo, filtered to 1.4 kHz and smeared, in a cathedral.",
    instrument: { deviceId: 'zither', preset: 'Hammered shimmer', params: { volume: -15.5 } },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 1400 } },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.2, mix: 0.6 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'forest-pulse-sweep-returning-crackle',
    name: 'Sweep returning, crackle',
    category: 'plucked',
    description:
      'A slow sweep across open strings that returns backwards two and a half seconds later, over the surface of a record, in a hall.',
    instrument: { deviceId: 'zither', preset: 'Harp glissando', params: { volume: -7 } },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Long mirror', params: { time: 2500, mix: 0.5 } },
      { deviceId: 'noise-floor', preset: 'Old record', params: { level: -36 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
]
