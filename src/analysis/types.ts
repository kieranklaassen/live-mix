// What a measuring gives back. Every figure is a number or null, null where
// the stretch gives the figure nothing to be measured on, so a result is JSON
// as it stands: no infinity, nothing that is not a number.

/** One of the seven bands, and how much of the stretch's sound lies in it. */
export interface BandLevels {
  /** The band's lower edge in Hz, which is in the band. */
  fromHz: number
  /** The band's upper edge in Hz, which is not. */
  toHz: number
  /**
   * The level in the band, in dB under full scale, as the mean square over
   * every channel. Null when the band holds nothing, or lies over half the
   * sample rate.
   */
  levelDbfs: number | null
  /** The level in the band of the mid, (left + right) / 2. Null for one channel, or with no mid there. */
  midDbfs: number | null
  /** The level in the band of the side, (left - right) / 2. Null for one channel, or with no side there. */
  sideDbfs: number | null
}

/** Short-term loudness over the stretch, at most 120 points. */
export interface ShortTermSeries {
  /** Where the first point's three seconds end: three seconds in. */
  startSeconds: number
  /** The time from one point to the next: a second, or a 120th of the stretch when that is longer. */
  hopSeconds: number
  /**
   * Point `n` is the loudness, in LUFS, of the three seconds that end at
   * `startSeconds + n * hopSeconds`, read at the 100 ms step nearest that
   * time. Null where those three seconds hold no sound at all, at the head
   * of the stretch or after its sound has ended. Empty for a stretch under
   * three seconds.
   */
  lufs: (number | null)[]
}

/** What a stretch of sound measured. */
export interface Measurement {
  /** The version of the measuring. It changes when a figure's meaning or method does. */
  version: number
  sampleRate: number
  /** How many channels were measured, one or two. */
  channels: number
  frames: number
  seconds: number
  /** True when no sample of the stretch is other than zero. */
  silent: boolean
  /**
   * Gated loudness of the whole stretch, in LUFS (ITU-R BS.1770-4). Null
   * under 400 ms, and when no 400 ms of it is over -70 LUFS.
   */
  integratedLufs: number | null
  /** The highest loudness of any 400 ms, in LUFS. Null under 400 ms and for silence. */
  maxMomentaryLufs: number | null
  /** The highest loudness of any three seconds, in LUFS. Null under three seconds and for silence. */
  maxShortTermLufs: number | null
  shortTerm: ShortTermSeries
  /**
   * Loudness range in LU (EBU Tech 3342). Null under three seconds, and when
   * no three seconds of the stretch are over -70 LUFS.
   */
  loudnessRangeLu: number | null
  /** The highest peak between samples, in dB under full scale (dBTP), over every channel. Null for silence. */
  truePeakDbtp: number | null
  /** The largest sample, in dB under full scale, over every channel. Null for silence. */
  samplePeakDbfs: number | null
  /** The mean level, in dB under full scale: the mean square over every channel. Null for silence. */
  rmsDbfs: number | null
  /** Crest factor in dB: the sample peak over the mean level. Null for silence. */
  crestDb: number | null
  /** The seven bands, lowest first. */
  bands: BandLevels[]
  /**
   * Width in dB: the side's level over the mid's, both over the whole
   * stretch. 0 when left and right have nothing in common, lower as they
   * agree. Null for one channel, and when the stretch has no side (left and
   * right the same) or no mid.
   */
  widthDb: number | null
  /**
   * Correlation of left and right, from -1 to 1: the sum of left times right
   * over the root of the two channels' sums of squares. Null for one channel,
   * and when either channel is silent.
   */
  correlation: number | null
  /** The mean sample value of each channel, 1 being full scale. Null for a stretch of no frames. */
  dcOffset: (number | null)[]
}
