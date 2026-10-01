// The mirrored copy of a decoded buffer that a reversed clip reads forwards:
// frame `i` of the copy is frame `length - 1 - i` of the source. Where a clip
// enters it is `clips/reverse.ts`.

const mirrored = new WeakMap<AudioBuffer, AudioBuffer>()

/**
 * The mirrored copy of a decoded buffer, made on first use and kept for as
 * long as the buffer itself is.
 */
export function reversedBuffer(ctx: BaseAudioContext, buffer: AudioBuffer): AudioBuffer {
  const known = mirrored.get(buffer)
  if (known) return known
  const copy = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = Float32Array.from(buffer.getChannelData(channel))
    data.reverse()
    copy.copyToChannel(data, channel)
  }
  mirrored.set(buffer, copy)
  return copy
}
