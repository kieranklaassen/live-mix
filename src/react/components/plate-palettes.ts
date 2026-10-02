// The colours of the kit's device plates: a plate and its two inks per
// device id. A plate carries them as `--lm-plate`, `--lm-plate-ink` and
// `--lm-plate-accent`; the components draw only in those variables.

export interface PlatePalette {
  /** The plate's colour. */
  plate: string
  /** Lines, knobs and the name tag. */
  ink: string
  /** The second ink: the lamp and what the picture points out. */
  accent: string
}

export const PLATE_PALETTES = {
  'fdn-reverb': { plate: '#23566b', ink: '#e6f1ee', accent: '#8fe0d0' },
  expanse: { plate: '#2b2550', ink: '#ece4ff', accent: '#f2b872' },
  'ether-reverb': { plate: '#cfe3ea', ink: '#1d3a4a', accent: '#2f7fa6' },
  'grain-cloud': { plate: '#ead9cf', ink: '#3b2a2a', accent: '#c0502f' },
  'tape-echo': { plate: '#efe5cf', ink: '#2a231c', accent: '#c4572b' },
  shimmer: { plate: '#cdbbe8', ink: '#2d2147', accent: '#fff3b8' },
  'tape-loop': { plate: '#5c6b3a', ink: '#f1f0dc', accent: '#f0cf5a' },
  lattice: { plate: '#0f6f6a', ink: '#e8fbf7', accent: '#f2b872' },
  chorus: { plate: '#8fc7d9', ink: '#123344', accent: '#ffffff' },
  'auto-filter': { plate: '#e0b43a', ink: '#2b2208', accent: '#8a2f12' },
  tape: { plate: '#6b4a36', ink: '#f3e6d6', accent: '#f0a85a' },
  'reverse-delay': { plate: '#6a2f55', ink: '#fbe6f3', accent: '#f7a6c8' },
  'spectral-blur': { plate: '#9aa0b8', ink: '#1f2333', accent: '#f6f7fb' },
  'bloom-reverb': { plate: '#e79aa5', ink: '#40121c', accent: '#fff3e8' },
  sympathetic: { plate: '#c89b5a', ink: '#2b1a08', accent: '#fff1d6' },
  saturator: { plate: '#d9482b', ink: '#fff1e6', accent: '#3a0f06' },
  'spring-reverb': { plate: '#e8e3d3', ink: '#1d1d1b', accent: '#2e6f63' },
  rotary: { plate: '#7a4a2b', ink: '#f5e9d8', accent: '#e7c04a' },
  'analog-delay': { plate: '#6a5a7e', ink: '#f8f3fc', accent: '#ffd98a' },
  'analog-drive': { plate: '#a9b3a2', ink: '#1b2118', accent: '#a3260f' },
  cascade: { plate: '#bfe0cf', ink: '#15352a', accent: '#c53d27' },
  'echo-memory': { plate: '#4c4560', ink: '#f0eaf7', accent: '#9fe0c0' },
  glitch: { plate: '#ecebe4', ink: '#141414', accent: '#e0195f' },
  'half-speed': { plate: '#17264a', ink: '#e4ecff', accent: '#6fb8ff' },
  'low-bitrate': { plate: '#3c424b', ink: '#e9edf2', accent: '#7dffb0' },
  'micro-looper': { plate: '#d9c8a2', ink: '#2c2416', accent: '#17616a' },
  'noise-floor': { plate: '#807d76', ink: '#11100e', accent: '#f7f3e8' },
  octaves: { plate: '#d2641c', ink: '#2a1404', accent: '#fff4dc' },
  'pad-follower': { plate: '#f2d8bb', ink: '#3a2a1c', accent: '#6a4bb5' },
  patina: { plate: '#9cc4b2', ink: '#1f3a33', accent: '#93421f' },
  'pitch-shifter': { plate: '#2f55d4', ink: '#f2f5ff', accent: '#ffe14a' },
  radio: { plate: '#5a1f24', ink: '#f5e3d0', accent: '#f2c14e' },
  're-amp': { plate: '#c4c7c9', ink: '#1c1f22', accent: '#b3261f' },
  'shaped-reverb': { plate: '#6d3fb0', ink: '#f3ecff', accent: '#7df0d0' },
  'stereo-detune': { plate: '#f3e9a6', ink: '#2b2a12', accent: '#2459b8' },
  sustainer: { plate: '#1f4a3c', ink: '#e8f6ee', accent: '#ff9e7a' },
  'swarm-reverb': { plate: '#0f2a30', ink: '#dff1f0', accent: '#f2c66b' },
  'vintage-digital': { plate: '#56657a', ink: '#f2f5f8', accent: '#ffb8a8' },
  vinyl: { plate: '#201f1f', ink: '#eee6d8', accent: '#e8604c' },
  'vowel-reverb': { plate: '#2f9c99', ink: '#03201f', accent: '#fffbe6' },
} as const satisfies Record<string, PlatePalette>

/**
 * Cases for hosted plug-ins: a plug-in the kit has never seen takes one of
 * these by its id, so the same plug-in is the same colour every time and two
 * in a chain are told apart. Workshop colours, none of them a maker's own.
 */
export const HOSTED_PLATES = [
  { plate: '#2e3136', ink: '#eef0f2', accent: '#ffd166' },
  { plate: '#bfbdb6', ink: '#26231d', accent: '#a82f18' },
  { plate: '#4f6b58', ink: '#f2f6ef', accent: '#ffe9a8' },
  { plate: '#7f5640', ink: '#fbf3e9', accent: '#ffd9a0' },
  { plate: '#174756', ink: '#e9f0f7', accent: '#7fe0c8' },
  { plate: '#a6b9cb', ink: '#17242a', accent: '#8a2a18' },
  { plate: '#875266', ink: '#fbf3f4', accent: '#ffcf8a' },
  { plate: '#bf9230', ink: '#231a08', accent: '#5c1407' },
] as const satisfies readonly PlatePalette[]
