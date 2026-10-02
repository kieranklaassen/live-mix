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
} as const satisfies Record<string, PlatePalette>
