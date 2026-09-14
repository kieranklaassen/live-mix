// Audio encoding for bounces and recordings (R22, R23). WAV is written here
// (PCM 16/24-bit or IEEE float 32-bit, RIFF/WAVE with the extensible header
// for float and > 2 channels). Compressed formats come from the browser's
// MediaRecorder (see Recorder.ts) or an optional encoder the host supplies;
// the library keeps zero dependencies.

export type WavBitDepth = 16 | 24 | 32

export interface WavEncodeOptions {
  /** 16 or 24 = integer PCM, 32 = IEEE float. Default 16. */
  bitDepth?: WavBitDepth
}

/** Planar channels (one Float32Array per channel) plus the sample rate. */
export interface PlanarAudio {
  channels: readonly Float32Array[]
  sampleRate: number
}

/** Interleave planar channels into one frame-major array. */
export function interleave(channels: readonly Float32Array[]): Float32Array {
  const channelCount = channels.length
  if (channelCount === 0) return new Float32Array(0)
  const frames = channels[0].length
  const out = new Float32Array(frames * channelCount)
  for (let c = 0; c < channelCount; c += 1) {
    const channel = channels[c]
    for (let i = 0; i < frames; i += 1) out[i * channelCount + c] = channel[i]
  }
  return out
}

/** Split a frame-major array back into planar channels. */
export function deinterleave(interleaved: Float32Array, channelCount: number): Float32Array[] {
  if (channelCount <= 0) return []
  const frames = Math.floor(interleaved.length / channelCount)
  const channels = Array.from({ length: channelCount }, () => new Float32Array(frames))
  for (let i = 0; i < frames; i += 1) {
    for (let c = 0; c < channelCount; c += 1) channels[c][i] = interleaved[i * channelCount + c]
  }
  return channels
}

/** Planar channels of an AudioBuffer (copies, so the buffer can be released). */
export function planarFromAudioBuffer(buffer: AudioBuffer): PlanarAudio {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) =>
    Float32Array.from(buffer.getChannelData(index)),
  )
  return { channels, sampleRate: buffer.sampleRate }
}

/** Encode planar audio as a WAV file. */
export function encodeWav(audio: PlanarAudio, options: WavEncodeOptions = {}): ArrayBuffer {
  const bitDepth = options.bitDepth ?? 16
  const channelCount = audio.channels.length
  if (channelCount === 0) throw new Error('live-mix: encodeWav needs at least one channel')
  const frames = audio.channels[0].length
  for (const channel of audio.channels) {
    if (channel.length !== frames) throw new Error('live-mix: encodeWav channels differ in length')
  }
  const bytesPerSample = bitDepth / 8
  const blockAlign = channelCount * bytesPerSample
  const dataBytes = frames * blockAlign
  const isFloat = bitDepth === 32
  const extensible = isFloat || channelCount > 2
  const fmtBytes = extensible ? 40 : 16
  // fmt chunk (+ fact chunk for float) + data chunk.
  const factBytes = isFloat ? 12 : 0
  const headerBytes = 12 + (8 + fmtBytes) + factBytes + 8
  const buffer = new ArrayBuffer(headerBytes + dataBytes)
  const view = new DataView(buffer)
  let offset = 0
  const ascii = (text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i))
    offset += text.length
  }
  const u32 = (value: number) => {
    view.setUint32(offset, value, true)
    offset += 4
  }
  const u16 = (value: number) => {
    view.setUint16(offset, value, true)
    offset += 2
  }

  ascii('RIFF')
  u32(buffer.byteLength - 8)
  ascii('WAVE')

  ascii('fmt ')
  u32(fmtBytes)
  u16(extensible ? 0xfffe : isFloat ? 3 : 1)
  u16(channelCount)
  u32(audio.sampleRate)
  u32(audio.sampleRate * blockAlign)
  u16(blockAlign)
  u16(bitDepth)
  if (extensible) {
    u16(22) // cbSize
    u16(bitDepth) // valid bits per sample
    u32(channelMask(channelCount))
    // Sub-format GUID: PCM or IEEE float, both KSDATAFORMAT_SUBTYPE_*.
    u16(isFloat ? 3 : 1)
    ascii('\u0000\u0000')
    for (const byte of [0x00, 0x00, 0x10, 0x00, 0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71]) {
      view.setUint8(offset, byte)
      offset += 1
    }
  }
  if (isFloat) {
    ascii('fact')
    u32(4)
    u32(frames)
  }

  ascii('data')
  u32(dataBytes)
  const interleaved = interleave(audio.channels)
  if (isFloat) {
    for (const sample of interleaved) {
      view.setFloat32(offset, sample, true)
      offset += 4
    }
  } else if (bitDepth === 16) {
    for (const sample of interleaved) {
      view.setInt16(offset, toInt(sample, 32767), true)
      offset += 2
    }
  } else {
    for (const sample of interleaved) {
      const value = toInt(sample, 8388607)
      view.setUint8(offset, value & 0xff)
      view.setUint8(offset + 1, (value >> 8) & 0xff)
      view.setUint8(offset + 2, (value >> 16) & 0xff)
      offset += 3
    }
  }
  return buffer
}

/** Encode an AudioBuffer as WAV. */
export function audioBufferToWav(buffer: AudioBuffer, options: WavEncodeOptions = {}): ArrayBuffer {
  return encodeWav(planarFromAudioBuffer(buffer), options)
}

/** A WAV `Blob` (browser hosts); throws where `Blob` is unavailable. */
export function wavBlob(audio: PlanarAudio, options: WavEncodeOptions = {}): Blob {
  if (typeof Blob === 'undefined') throw new Error('live-mix: Blob is not available here')
  return new Blob([encodeWav(audio, options)], { type: 'audio/wav' })
}

/** Parsed header of a WAV file this module wrote (or any canonical PCM/float WAV). */
export interface WavInfo {
  channelCount: number
  sampleRate: number
  bitDepth: number
  format: 'pcm' | 'float'
  frames: number
  dataOffset: number
}

/** Read the header back; used by tests and by hosts importing bounced files. */
export function readWavInfo(wav: ArrayBuffer): WavInfo {
  const view = new DataView(wav)
  const tag = (at: number) => String.fromCharCode(...new Uint8Array(wav, at, 4))
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('live-mix: not a WAV file')
  let offset = 12
  let info: Partial<WavInfo> = {}
  while (offset + 8 <= wav.byteLength) {
    const id = tag(offset)
    const size = view.getUint32(offset + 4, true)
    const body = offset + 8
    if (id === 'fmt ') {
      let formatTag = view.getUint16(body, true)
      const channelCount = view.getUint16(body + 2, true)
      const sampleRate = view.getUint32(body + 4, true)
      const bitDepth = view.getUint16(body + 14, true)
      if (formatTag === 0xfffe) formatTag = view.getUint16(body + 24, true)
      info = {
        ...info,
        channelCount,
        sampleRate,
        bitDepth,
        format: formatTag === 3 ? 'float' : 'pcm',
      }
    } else if (id === 'data') {
      const bytesPerFrame = ((info.bitDepth ?? 16) / 8) * (info.channelCount ?? 1)
      info = { ...info, frames: Math.floor(size / bytesPerFrame), dataOffset: body }
      break
    }
    offset = body + size + (size % 2)
  }
  if (info.channelCount === undefined || info.frames === undefined) {
    throw new Error('live-mix: WAV is missing fmt or data')
  }
  return info as WavInfo
}

/** Decode a WAV written by `encodeWav` back into planar float audio. */
export function decodeWav(wav: ArrayBuffer): PlanarAudio {
  const info = readWavInfo(wav)
  const view = new DataView(wav)
  const channels = Array.from({ length: info.channelCount }, () => new Float32Array(info.frames))
  let offset = info.dataOffset
  for (let i = 0; i < info.frames; i += 1) {
    for (let c = 0; c < info.channelCount; c += 1) {
      if (info.format === 'float') {
        channels[c][i] = view.getFloat32(offset, true)
        offset += 4
      } else if (info.bitDepth === 16) {
        channels[c][i] = view.getInt16(offset, true) / 32768
        offset += 2
      } else {
        const raw =
          view.getUint8(offset) |
          (view.getUint8(offset + 1) << 8) |
          (view.getUint8(offset + 2) << 16)
        const signed = raw & 0x800000 ? raw - 0x1000000 : raw
        channels[c][i] = signed / 8388608
        offset += 3
      }
    }
  }
  return { channels, sampleRate: info.sampleRate }
}

function toInt(sample: number, scale: number): number {
  const clamped = Math.max(-1, Math.min(1, sample))
  return Math.round(clamped * scale)
}

function channelMask(channelCount: number): number {
  switch (channelCount) {
    case 1:
      return 0x4 // front centre
    case 2:
      return 0x3 // front left + right
    default:
      return (1 << channelCount) - 1
  }
}
