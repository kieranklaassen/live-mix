// The pan stage every strip, rack chain and utility is made with: a
// StereoPanner that takes two channels whatever it is fed.
//
// Left to itself the node has two laws. One channel is panned with equal
// power, 3.01 dB down each side at the centre; two channels pass at the
// centre as they came. And what a pan stage is fed is not what was recorded:
// the browser's compressor gives two channels out for one in, every WASM
// device does, and a strip with no nodes yet has no panner at all. So a voice
// in one channel played 3.01 dB louder with a compressor in its chain than
// without, and 3.01 dB quieter once its fader was first touched. With the
// node told to take two channels, one channel is both of them before it is
// panned: at the centre it leaves as loud as it came, as two channels do, and
// it is panned by the law two channels are.

/** A StereoPanner on `context` that plays one channel as it plays two. */
export function createPan(context: BaseAudioContext): StereoPannerNode {
  const panner = context.createStereoPanner()
  panner.channelCount = 2
  panner.channelCountMode = 'explicit'
  return panner
}
