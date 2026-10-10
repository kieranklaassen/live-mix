#pragma once

// Prism: a spectral delay. Every band of the spectrum comes back at a time
// of its own, set by a curve over frequency, so a struck chord returns as a
// sweep of its own partials.
//
//   in ─┬──────────────────────────────────── dry() (kLatency late) ──────┐
//       │                                                                 ├─► out
//       └─► Stft ─► X ─(+)─► H ─► each bin thrown forward by its ─► ring of frames to come ─► pan ─► Stft ─► wet ─┘
//                       ▲         own delay, a partial as one             │
//                       └──── level hold ◄─ Feedback × Tilt ◄─────────────┘ (the frame that lands now)
//
// kit::Stft<2048, 512>: 2048-point frames every 512 samples, so the latency
// is 2304 samples and the dry path is the input that much late.
//
// - The ring holds the frames still to come, per channel. A new frame H is
//   not kept: each of its bins is added to the frame d hops ahead, d being
//   that bin's delay in whole hops (d ≥ 1), and the frame that falls due is
//   played and emptied. That IS a delay of d × 512 samples of the band the
//   bin belongs to. What is left of the delay under a hop (±256 samples) is
//   a circular shift of the frame, a turn of -2π k r / 2048 per bin, with
//   the gain the shifted window loses (1 + cos(2π r / 2048) / 2 in place of
//   1.5) put back.
// - A partial moves as one. A partial is three or four bins wide; if its
//   bins came back at different times a held note that lies where two bands
//   meet would cancel itself (measured before this: 8 % of held tones more
//   than 3 dB down, the worst 18). So every bin within two of a peak of the
//   frame takes the peak's delay, shift and turn. A held tone then comes
//   back whole whatever the curve; a click, which has no peaks, still
//   spreads bin by bin.
// - The curve. A place u is 0 at 60 Hz and 1 at 7680 Hz, on octaves. Bands
//   quantises u to N steps, Smear lets u run on between the steps again,
//   Shape and Bend turn u into the order of arrival c in 0..1, and
//
//     delay = Time × (1 - Fan × 7/8 × (1 - c))        never under 24 ms
//
//   so the last colour comes at Time and, with Fan open, the first at an
//   eighth of it. Scatter deals the N bands the N evenly spaced times in an
//   order shuffled by Shuffle. The floor is half a frame: what a frame makes
//   of an attack lies anywhere in its 43 ms, and under half a frame of delay
//   some of it came out before the attack was heard in the dry (measured at
//   the old floor of 6 ms: a kick's wet 37 dB under the kick, 20 ms early).
// - Strips. A bin does not read the curve at its own frequency but at the
//   middle of its strip: strips are 100 Hz wide (four bins where a bin is
//   wider than 25 Hz, at 96 kHz), and everything under 200 Hz is one strip at
//   u = 0. A partial is four bins wide, and two partials nearer than that
//   cannot be told apart by a frame, so they cannot be given two times:
//   measured without strips, of two held tones 25 to 45 Hz apart on two
//   delays one came back 3 to 16 dB down, at every such pair under 300 Hz
//   with 48 bands. In a strip both keep one time and come back whole. Two
//   such tones that lie either side of a strip's edge still lose; there are
//   a quarter as many edges as bins.
// - Neighbouring bins with different delays are turned by the phase a true
//   dispersive delay would have there, θ[k] = Σ ω(j+½) × (D[j+1] - D[j]),
//   so that at the frequency where two bands meet they agree. The share of
//   θ that comes from whole hops is a multiple of an eighth of a turn and
//   goes round the loop with the sound, so every repeat agrees as well; the
//   rest, with the shift under a hop, is in what is played only (a shift
//   that went round the loop would walk round the frame). Hence two frames
//   per place in the ring: one to play and one to feed back.
// - Feedback. The frame that lands is added to the new one, per bin, and
//   thrown forward again, so each band repeats at its own time (in whole
//   hops). Tilt is a gain per bin and pass that never exceeds 1. Two things
//   keep the loop's level:
//   - A bin holds no more than the larger of what comes in and what comes
//     round. A held note and its own repeats in step would add up to
//     1 / (1 - Feedback) of the note for as long as it is held (measured
//     before this: +4.8 dB at one pitch and -5.2 at another at Feedback
//     0.9, and at part-way Mix the echo then cancelled the note itself). So
//     a held note's echo is never louder than the note, and repeats that
//     land on a new sound of their own pitch join it instead of piling up.
//     Nothing is kept from frame to frame for this.
//   - The level hold: the energy of a frame H may not exceed twice that of
//     the loudest frame of input since the device last woke; over that the
//     fed-back share of the frame is turned down. With many different notes
//     circling at Feedback 1 this is what stops them adding up without end.
//     The memory does not fall, so the hold never shortens a tail (when it
//     fell by 60 dB in 40 s every tail was over in 40 s, whatever Feedback
//     said from 0.9 up): at Feedback 1 and Tilt 0 the sound circles on.
// - Drift. Dry and a late copy of a held tone stand in a comb: at part-way
//   Mix some pitches would be lost for as long as they are held (measured at
//   the default without this: -8.1 dB at one pitch, +4.9 at another, for
//   good). So each band's phase wanders, by Drift × 4.81 rad × sin(2π f t)
//   with f between 0.07 and 0.15 Hz, its own for each band, by the frame
//   clock (it keeps its place through silence and sleep). At Drift 0.5 the
//   swing is 2.405 rad, the first zero of J0: the mean of cos over a cycle is
//   nothing, so over time a held tone and its echo add as powers at every
//   pitch, and what was a fixed comb is a slow breathing. The turn goes
//   round the loop with the sound. At Drift 0 the echo is an exact copy.
// - Width pans each bin by its order of arrival, the first to the left and
//   the last to the right (nothing under 120 Hz moves). The side a bin
//   leans to keeps its own sound whole; the other side keeps tan of the
//   angle of its own, and the rest of that side's power is given to the
//   side the bin leans to, a quarter turn on. So a sound that is on one
//   side only is moved, not lost (as a balance it lost 8 dB of its top
//   octave at the default and 19 dB at Width 1), the power of the two sides
//   together is what went in, an in-phase and an anti-phase pair come out
//   alike, and a band panned hard is 3 dB down in mono, not 6.
// - What is in the air stays there: a knob changes where new sound is
//   thrown, not when what was thrown already comes back. (Width, Tilt and
//   Feedback act on a sound as it lands, by the tables that stand then.)
//
// Storage: the ring is 386,560 cells of four floats per channel, 12.4 MB in
// all. A cell is one bin of one frame, so the ring holds 377 frames of all
// 1025 bins at 48 kHz (4 s) and, at 96 kHz, 753 frames of the 513 bins up to
// 24 kHz (4 s again: above 24 kHz the wet path is silent there). With the
// two Stft blocks and the tables the device needs 13 MB ("memoryMb": 16).

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class Prism : public kit::DeviceBase<prism::kNumParams> {
 public:
  using Stft = kit::Stft<2048, 512>;
  static constexpr int kLatency = Stft::kLatency;  // "latencySamples": 2304
  static constexpr int kBins = Stft::kBins;
  // The ring, in cells (one bin of one frame): 4 s of every bin up to 24 kHz at any rate from 44.1 kHz up.
  static constexpr int kCells = 386560;
  static constexpr float kStoredHz = 24000.0f;
  static constexpr int kReach = 2;  // bins either side of a peak that go with it
  static constexpr int kZones = 7;      // the octaves of the curve's axis, for the meters
  static constexpr int kMaxBands = 48;

  // The curve's frequency axis: 60 Hz to 60 × 2^7 = 7680 Hz.
  static constexpr float kLowHz = 60.0f;
  static constexpr float kOctaves = 7.0f;
  // With Fan open the first colour comes at this share of Time.
  static constexpr float kFirstShare = 0.125f;
  // No band comes sooner than this: half a frame and a little, at 44.1 kHz and
  // up. A frame is 43 ms long, and what a frame makes of an attack lies
  // anywhere in it; with half a frame of delay or more none of it comes
  // before the attack itself is heard in the dry.
  static constexpr float kLeastSeconds = 0.024f;
  // No colour is narrower than a note can be told apart. A partial is four
  // bins wide, so two partials nearer than that cannot be given two times:
  // one of them came back 8 to 16 dB down. So the curve is read in strips of
  // this many hertz (or this many bins where the bins are wider, at 96 kHz),
  // every bin of a strip at the strip's own time, and everything under two
  // strips' width is one strip: the first colour.
  static constexpr float kStripHz = 100.0f;
  static constexpr float kStripBins = 4.0f;
  // Bend b is the power 4^-b the order of arrival is raised to.
  static constexpr float kBendBase = 4.0f;
  // Tilt at either end: dB lost per octave and pass, and where the loss begins.
  static constexpr float kTiltDb = 6.0f;
  static constexpr float kDarkFromHz = 250.0f;
  static constexpr float kThinFromHz = 4000.0f;
  // Width leaves everything under the first of these in the middle and is
  // whole from the second up.
  static constexpr float kPanFromHz = 120.0f;
  static constexpr float kPanWholeHz = 300.0f;
  // The level hold: a written frame's energy against the loudest input frame
  // since the device last woke.
  static constexpr float kHoldRatio = 2.0f;
  // The meters fall to a tenth in this long.
  static constexpr float kMeterSeconds = 0.12f;
  // Drift at 1: the swing of a band's phase in radians (twice the first zero of J0), and the rates of the bands.
  static constexpr float kDriftRadians = 4.8096512f;
  static constexpr float kDriftLowHz = 0.07f;
  static constexpr float kDriftHighHz = 0.15f;
  // A bin under this holds nothing: -174 dBFS (a full-scale sine reads 512).
  static constexpr float kFloor = 1.0e-6f;

  void init(float sample_rate);
  void set_param(int id, float value);
  void process(int frames);

  // The readings named by "meters": for each octave of the curve's axis, the
  // level of the sound that last came in there (both channels, before the
  // repeats are added: the display draws those itself, from the curve), as
  // the amplitude of a sine of that energy, with a fall of 120 ms so no frame
  // is missed between two readings. Asleep they read 0.
  float meter(int index) const {
    if (index < 0 || index >= kZones || idle_.asleep()) return 0.0f;
    return zone_level_[index];
  }

  // The width of a strip of the curve at a sample rate, in hertz.
  static float strip_width(float sample_rate) {
    const float bins = kStripBins * sample_rate / Stft::kFrame;
    return bins > kStripHz ? bins : kStripHz;
  }
  // The frequency the curve is read at for a sound at `hz`: the middle of its
  // strip, and kLowHz (the curve's first place) for everything in the first.
  static float strip_hz(float hz, float sample_rate) {
    const float width = strip_width(sample_rate);
    if (hz < 2.0f * width) return kLowHz;
    return (std::floor(hz / width) + 0.5f) * width;
  }

  // For the harness and the display's test: the delay of a bin in samples,
  // as the tables hold it now.
  float delay_samples(int bin) const {
    return static_cast<float>(hops_[bin]) * Stft::kHop + shift_[bin];
  }

 private:
  void rebuild();
  void frame(int c, float* re, float* im);
  float order_at(float u, int bands, float smear, int shape, float power) const;

  Stft stft_[2];
  // The frames to come: [channel][frame × stride_ + bin][to feed back re, im, to play re, im].
  float ring_[2][kCells][4] = {};
  int stride_ = kBins;       // bins kept per frame: all of them, or those up to 24 kHz
  int frames_ = 1;           // frames the ring holds: kCells / stride_
  int now_ = 0;              // the frame that falls due next
  int ahead_[2] = {0, 0};    // frames until the furthest thing thrown lands; 0 is an empty ring
  float loudest_[2] = {0.0f, 0.0f};      // the level hold's memory, per channel
  float meter_fall_ = 1.0f;
  float zone_level_[kZones] = {};
  float zone_energy_[kZones] = {};

  // Per bin, from the sample rate (init).
  float place_[kBins] = {};   // u: 0 at kLowHz, 1 seven octaves up
  float octave_[kBins] = {};  // log2(Hz / 1 kHz), for Tilt
  float pan_depth_[kBins] = {};
  uint8_t zone_[kBins] = {};
  // Per bin, from the knobs (rebuild).
  uint16_t hops_[kBins] = {};   // d: whole hops back
  uint8_t eighth_[kBins] = {};  // θ's share from whole hops, in eighths of a turn
  float shift_[kBins] = {};     // r: what is left of the delay, samples, ±Hop/2
  float turn_re_[kBins] = {};   // on the way out: the rest of θ, the shift, the window's gain
  float turn_im_[kBins] = {};
  float loop_[kBins] = {};      // Feedback × Tilt
  float pan_[2][kBins] = {};   // Width: what a side keeps of its own sound
  float fold_[2][kBins] = {};  // and what it is given of the other side's, a quarter turn on
  float order_[kMaxBands] = {};  // Scatter: each band's order of arrival
  uint8_t band_[kBins] = {};     // the band a bin lies in
  float drift_rate_[kMaxBands] = {};   // Hz, fixed
  float drift_start_[kMaxBands] = {};  // turns, fixed
  float drift_re_[kMaxBands] = {};     // this frame's turn of each band
  float drift_im_[kMaxBands] = {};
  float eighth_re_[8] = {};
  float eighth_im_[8] = {};
  float step_re_[kBins] = {};   // one bin's worth of the shift: the turn from bin k to k + 1
  float step_im_[kBins] = {};
  // One frame's work space.
  float size_[kBins] = {};     // |H|² per bin
  int16_t owner_[kBins] = {};  // the bin whose delay each bin takes: its own, or the peak it belongs to
  float play_re_[kBins] = {};  // the frame that landed
  float play_im_[kBins] = {};
  float left_re_[kBins] = {};  // the left frame that landed, kept for the right one's Width
  float left_im_[kBins] = {};

  bool dirty_ = true;
  kit::Smoother mix_;
  kit::IdleGate idle_;
  float mix_seen_ = -1.0f;
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
};

inline void Prism::init(float sample_rate) {
  using namespace prism;
  kit::SineTable::init();
  init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
  const float sr = this->sample_rate();
  stft_[0].init();
  stft_[1].init(Stft::kMaxStagger);
  for (int c = 0; c < 2; ++c) {
    for (int n = 0; n < kCells; ++n) {
      for (int part = 0; part < 4; ++part) ring_[c][n][part] = 0.0f;
    }
    ahead_[c] = 0;
    loudest_[c] = 0.0f;
  }
  stride_ = kit::clamp_int(Stft::nearest_bin(kStoredHz, sr) + 1, 2, kBins);
  frames_ = kCells / stride_;
  now_ = 0;
  const float frames_per_second = sr / Stft::kHop;
  meter_fall_ = std::exp(-2.30258509f / (kMeterSeconds * frames_per_second));
  for (int z = 0; z < kZones; ++z) {
    zone_level_[z] = 0.0f;
    zone_energy_[z] = 0.0f;
  }
  for (int k = 0; k < kBins; ++k) {
    const float hz = Stft::bin_to_hz(static_cast<float>(k > 0 ? k : 1), sr);
    // The curve is read at the middle of the bin's strip; Tilt, Width's depth and the meters go by the bin itself.
    place_[k] = kit::clamp(std::log2(strip_hz(hz, sr) / kLowHz) / kOctaves, 0.0f, 1.0f);
    const float own = k > 0 ? kit::clamp(std::log2(hz / kLowHz) / kOctaves, 0.0f, 1.0f) : 0.0f;
    octave_[k] = std::log2(hz / 1000.0f);
    pan_depth_[k] = kit::clamp(std::log2(hz / kPanFromHz) / std::log2(kPanWholeHz / kPanFromHz), 0.0f, 1.0f);
    zone_[k] = static_cast<uint8_t>(kit::clamp_int(static_cast<int>(own * kZones), 0, kZones - 1));
    left_re_[k] = 0.0f;
    left_im_[k] = 0.0f;
  }
  for (int e = 0; e < 8; ++e) {
    eighth_re_[e] = static_cast<float>(std::cos(0.78539816339744831 * e));
    eighth_im_[e] = static_cast<float>(std::sin(0.78539816339744831 * e));
  }
  // The quarter turns exactly, so a bin that goes round the loop keeps its size.
  eighth_re_[0] = 1.0f, eighth_im_[0] = 0.0f;
  eighth_re_[2] = 0.0f, eighth_im_[2] = 1.0f;
  eighth_re_[4] = -1.0f, eighth_im_[4] = 0.0f;
  eighth_re_[6] = 0.0f, eighth_im_[6] = -1.0f;
  {
    kit::Rng rng;
    rng.seed(0x51ED270Bu);
    for (int b = 0; b < kMaxBands; ++b) {
      drift_rate_[b] = kit::lerp(kDriftLowHz, kDriftHighHz, rng.uniform());
      drift_start_[b] = rng.uniform();
      drift_re_[b] = 1.0f;
      drift_im_[b] = 0.0f;
    }
  }
  mix_.set_time(kSmoothingSeconds, sr);
  mix_.snap(param(kMix));
  mix_seen_ = -1.0f;
  // What is in flight when the ring has emptied: a latency and a frame.
  idle_.reset(sr, static_cast<float>(Stft::kLatency + Stft::kFrame + Stft::kHop) / sr);
  rebuild();
}

inline void Prism::set_param(int id, float value) {
  if (!store_param(id, value)) return;
  if (id == prism::kMix) {
    // Asleep there is nothing to glide under: the knob is simply there when the device wakes.
    mix_.set(param(id), primed() && !idle_.asleep());
  } else {
    dirty_ = true;  // the tables are made again when the next frame comes
  }
}

inline void Prism::process(int frames) {
  frames = begin_block(frames);
  const bool alive = ahead_[0] > 0 || ahead_[1] > 0;
  if (!idle_.wake(input_present(frames) || alive)) {
    silence_output(frames);
    stft_[0].skip(frames);  // the frame clock runs on through the sleep
    stft_[1].skip(frames);
    mix_.snap(mix_.target);  // a knob moved while asleep does not glide in
    if (dirty_) rebuild();   // and the tables are ready for the first frame after it
    // Asleep the ring is empty: there is nothing left to hold a level for.
    loudest_[0] = loudest_[1] = 0.0f;
    for (int z = 0; z < kZones; ++z) zone_level_[z] = 0.0f;
    return;
  }
  for (int i = 0; i < frames; ++i) {
    float in[2];
    take_input(i, &in[0], &in[1]);
    const float mix = mix_.next();
    if (mix != mix_seen_) {
      mix_seen_ = mix;
      kit::equal_power(mix, &dry_gain_, &wet_gain_);
    }
    float out[2];
    for (int c = 0; c < 2; ++c) {
      const float wet = stft_[c].process(in[c], [this, c](float* re, float* im) { frame(c, re, im); });
      out[c] = stft_[c].dry() * dry_gain_ + wet * wet_gain_;
    }
    out_left_[i] = out[0];
    out_right_[i] = out[1];
  }
  idle_.settle(output_peak(frames), frames);
}

// The order of arrival, 0 (first) to 1 (last), of a place u on the curve's
// axis. Bands quantises the place, Smear lets it run on between the steps.
inline float Prism::order_at(float u, int bands, float smear, int shape, float power) const {
  const float steps = static_cast<float>(bands - 1);
  const float step = std::floor(u * steps + 0.5f) / steps;
  const float at = step + smear * (u - step);
  float base = at;  // Rising
  if (shape == 1) {
    base = 1.0f - at;  // Falling
  } else if (shape == 2) {
    base = 1.0f - std::fabs(2.0f * at - 1.0f);  // Peak: the middle last
  } else if (shape == 3) {
    base = std::fabs(2.0f * at - 1.0f);  // Valley: the middle first
  } else if (shape == 4) {
    // Scatter: each band's own order, a straight line from one to the next.
    const float position = at * steps;
    const int below = kit::clamp_int(static_cast<int>(position), 0, bands - 2);
    base = kit::lerp(order_[below], order_[below + 1], position - static_cast<float>(below));
  }
  return std::pow(kit::clamp(base, 0.0f, 1.0f), power);
}

// Every table that follows the knobs. Called when a frame comes after a knob
// has moved, so it costs nothing while they stand still.
inline void Prism::rebuild() {
  using namespace prism;
  dirty_ = false;
  const float sr = sample_rate();
  const double time = static_cast<double>(param(kTime)) * 0.001 * sr;
  const float fan = param(kFan);
  const int shape = kit::clamp_int(static_cast<int>(param(kShape) + 0.5f), 0, 4);
  const float power = std::pow(kBendBase, -param(kBend));
  const int bands = kit::clamp_int(static_cast<int>(param(kBands) + 0.5f), 2, kMaxBands);
  const float smear = param(kSmear);
  const float feedback = param(kFeedback);
  const float tilt = param(kTilt);
  const float width = param(kWidth);

  // Scatter: the bands take the evenly spaced orders 0, 1/(N-1) ... 1, dealt
  // by a shuffle that is the same every time for one Shuffle number.
  {
    int deal[kMaxBands];
    for (int b = 0; b < bands; ++b) deal[b] = b;
    kit::Rng rng;
    rng.seed(0x9E3779B9u * static_cast<uint32_t>(static_cast<int>(param(kShuffle) + 0.5f)) + 0x7F4A7C15u);
    for (int b = bands - 1; b > 0; --b) {
      const int other = static_cast<int>(rng.next_u32() % static_cast<uint32_t>(b + 1));
      const int kept = deal[b];
      deal[b] = deal[other];
      deal[other] = kept;
    }
    for (int b = 0; b < bands; ++b) order_[b] = static_cast<float>(deal[b]) / static_cast<float>(bands - 1);
  }

  const double least = static_cast<double>(kLeastSeconds) * sr;
  const double most = static_cast<double>(frames_ - 2) * Stft::kHop;
  double theta = 0.0;  // turns: the share of θ from the shifts under a hop
  int eighths = 0;     // eighths of a turn: the share from whole hops
  int last_hops = 1;
  double last_shift = 0.0;
  for (int k = 0; k < kBins; ++k) {
    const float order = order_at(place_[k], bands, smear, shape, power);
    band_[k] = static_cast<uint8_t>(static_cast<int>(place_[k] * static_cast<float>(bands - 1) + 0.5f));
    double delay = time * (1.0 - static_cast<double>(fan) * (1.0 - kFirstShare) * (1.0 - order));
    delay = delay < least ? least : (delay > most ? most : delay);
    int hops = static_cast<int>(std::floor(delay / Stft::kHop + 0.5));
    if (hops < 1) hops = 1;
    const double shift = delay - static_cast<double>(hops) * Stft::kHop;
    if (k > 0) {
      // Where bins k-1 and k meet, ω is (k - ½) / Frame turns a sample: (2k - 1) eighths a hop.
      eighths += (2 * k - 1) * (hops - last_hops);
      theta += (static_cast<double>(k) - 0.5) / Stft::kFrame * (shift - last_shift);
      theta -= std::floor(theta);
    }
    last_hops = hops;
    last_shift = shift;
    hops_[k] = static_cast<uint16_t>(hops);
    eighth_[k] = static_cast<uint8_t>(eighths & 7);
    shift_[k] = static_cast<float>(shift);
    double turns = theta - static_cast<double>(k) * shift / Stft::kFrame;
    turns -= std::floor(turns);
    const float gain =
        1.5f / (1.0f + 0.5f * kit::SineTable::cos_lookup(static_cast<float>(shift / Stft::kFrame)));
    turn_re_[k] = gain * kit::SineTable::cos_lookup(static_cast<float>(turns));
    turn_im_[k] = gain * kit::SineTable::lookup(static_cast<float>(turns));
    const float step = static_cast<float>(-shift / Stft::kFrame);
    step_re_[k] = kit::SineTable::cos_lookup(step);
    step_im_[k] = kit::SineTable::lookup(step);

    // Tilt: what a pass loses, never a gain.
    const float hz_octave = octave_[k];
    float lost_db = 0.0f;
    if (tilt < 0.0f) {
      const float over = hz_octave - std::log2(kDarkFromHz / 1000.0f);
      if (over > 0.0f) lost_db = -tilt * kTiltDb * over;
    } else {
      const float under = std::log2(kThinFromHz / 1000.0f) - hz_octave;
      if (under > 0.0f) lost_db = tilt * kTiltDb * under;
    }
    loop_[k] = feedback * std::exp(-0.115129255f * lost_db);

    // Width: the first to the left, the last to the right. The side a bin
    // leans to keeps its own whole; the other side keeps `keep` of its own,
    // and the rest of its power goes across, a quarter turn on.
    const float position = width * (2.0f * order - 1.0f) * pan_depth_[k];
    const float angle = (position + 1.0f) * 0.125f;  // turns: an eighth is the middle
    const float left = kit::SineTable::cos_lookup(angle);
    const float right = kit::SineTable::lookup(angle);
    const float keep = position > 0.0f ? left / right : (position < 0.0f ? right / left : 1.0f);
    const float across = std::sqrt(kit::clamp(1.0f - keep * keep, 0.0f, 1.0f));
    pan_[0][k] = position > 0.0f ? keep : 1.0f;
    pan_[1][k] = position < 0.0f ? keep : 1.0f;
    fold_[0][k] = position < 0.0f ? across : 0.0f;
    fold_[1][k] = position > 0.0f ? across : 0.0f;
  }
  // Zero frequency and the top bin are real: they are delayed, not turned, and stay on their own side.
  for (int k = 0; k < kBins; k += kBins - 1) {
    eighth_[k] = 0;
    turn_re_[k] = 1.0f;
    turn_im_[k] = 0.0f;
    pan_[0][k] = pan_[1][k] = 1.0f;
    fold_[0][k] = fold_[1][k] = 0.0f;
  }
}

// One frame of channel c. Channel 0's always comes first: what both share
// (the tables, the meters' sums) is done with it, and the ring moves on
// after channel 1's.
inline void Prism::frame(int c, float* re, float* im) {
  if (c == 0) {
    if (dirty_) rebuild();
    for (int z = 0; z < kZones; ++z) zone_energy_[z] = 0.0f;
    // Drift: where each band's phase stands at this frame, by the frame's number.
    const float swing = param(prism::kDrift) * kDriftRadians * (1.0f / kit::kTwoPi);  // turns
    const double seconds = static_cast<double>(stft_[0].frame()) * Stft::kHop / sample_rate();
    for (int b = 0; b < kMaxBands; ++b) {
      double cycle = seconds * drift_rate_[b] + drift_start_[b];
      cycle -= std::floor(cycle);
      const float turn = swing * kit::SineTable::lookup(static_cast<float>(cycle));
      drift_re_[b] = kit::SineTable::cos_lookup(turn);
      drift_im_[b] = kit::SineTable::lookup(turn);
    }
  }
  const int stride = stride_;
  float (*ring)[4] = ring_[c];
  float (*due)[4] = ring + static_cast<size_t>(now_) * stride;

  // What the new frame holds and what the frame that lands would add to it.
  float in_energy = 0.0f;
  float back_energy = 0.0f;
  for (int k = 0; k < stride; ++k) {
    in_energy += re[k] * re[k] + im[k] * im[k];
    const float gain = loop_[k];
    back_energy += gain * gain * (due[k][0] * due[k][0] + due[k][1] * due[k][1]);
  }

  // The level hold: H may hold twice the loudest input frame's energy and no
  // more; the fed-back share gives way. The memory does not fall while the
  // device is awake, so the hold never shortens a tail: what circles at
  // Feedback 1 circles on.
  float loudest = loudest_[c];
  if (in_energy > loudest) loudest = in_energy;
  loudest_[c] = loudest;
  const float room = kHoldRatio * loudest - in_energy;
  float scale = 1.0f;
  if (back_energy > room) scale = room > 0.0f ? std::sqrt(room / back_energy) : 0.0f;

  // H into re and im, what lands into the output's place, and the slot emptied.
  float* out_re = play_re_;
  float* out_im = play_im_;
  const float* pan = pan_[c];
  const float* fold = fold_[c];
  // The other side's frame that lands with this one. The left frame comes
  // first: the right one's is whole in the ring by then (nothing is thrown
  // less than a hop ahead), and the left one's is kept for the right.
  const float (*other)[4] = ring_[1] + static_cast<size_t>(now_) * stride;
  for (int k = 0; k < stride; ++k) {
    const float gain = scale * loop_[k];
    const float in = re[k] * re[k] + im[k] * im[k];
    zone_energy_[zone_[k]] += in;
    const float back_re = gain * due[k][0];
    const float back_im = gain * due[k][1];
    const float back = back_re * back_re + back_im * back_im;
    float hr = re[k] + back_re;
    float hi = im[k] + back_im;
    float energy = hr * hr + hi * hi;
    // A bin holds no more than the larger of what comes in and what comes
    // round: a held note and its own repeats, in step, would otherwise add
    // up to 1 / (1 - Feedback) of the note for as long as it is held.
    const float most = in > back ? in : back;
    if (energy > most) {
      const float down = std::sqrt(most / energy);
      hr *= down;
      hi *= down;
      energy = most;
    }
    if (energy < kFloor * kFloor) {
      hr = 0.0f;
      hi = 0.0f;
      energy = 0.0f;
    }
    const float across_re = c == 0 ? other[k][2] : left_re_[k];
    const float across_im = c == 0 ? other[k][3] : left_im_[k];
    if (c == 0) {
      left_re_[k] = due[k][2];
      left_im_[k] = due[k][3];
    }
    out_re[k] = due[k][2] * pan[k] - across_im * fold[k];
    out_im[k] = due[k][3] * pan[k] + across_re * fold[k];
    due[k][0] = due[k][1] = due[k][2] = due[k][3] = 0.0f;
    re[k] = hr;
    im[k] = hi;
    size_[k] = energy;
    owner_[k] = static_cast<int16_t>(k);
  }

  // Peaks: a bin over both neighbours takes the kReach bins either side with
  // it, each going to the nearer peak (the larger where two are as near).
  // Zero frequency and the top bin are real and stay their own.
  for (int peak = 1; peak < stride - 1; ++peak) {
    if (!(size_[peak] > size_[peak - 1] && size_[peak] >= size_[peak + 1])) continue;
    for (int k = peak - kReach; k <= peak + kReach; ++k) {
      if (k < 1 || k >= stride - 1 || k == peak) continue;
      const int holder = owner_[k];
      if (holder == k) {
        // Its own so far; a peak keeps itself.
        if (!(size_[k] > size_[k - 1] && size_[k] >= size_[k + 1])) owner_[k] = static_cast<int16_t>(peak);
        continue;
      }
      const int far = k > holder ? k - holder : holder - k;
      const int near = k > peak ? k - peak : peak - k;
      if (near < far || (near == far && size_[peak] > size_[holder])) owner_[k] = static_cast<int16_t>(peak);
    }
  }

  // Throw each bin forward by its owner's delay.
  int furthest = 0;
  for (int k = 0; k < stride; ++k) {
    if (size_[k] == 0.0f) continue;
    const int from = owner_[k];
    const int hops = hops_[from];
    int slot = now_ + hops;
    if (slot >= frames_) slot -= frames_;
    float* cell = ring[static_cast<size_t>(slot) * stride + k];
    if (hops > furthest) furthest = hops;
    // What goes round the loop with the sound: the share of θ from whole hops, and the drift.
    const float qr = eighth_re_[eighth_[from]];
    const float qi = eighth_im_[eighth_[from]];
    const float dr = drift_re_[band_[from]];
    const float di = drift_im_[band_[from]];
    const float er = qr * dr - qi * di;
    const float ei = qr * di + qi * dr;
    const float ar = re[k] * er - im[k] * ei;
    const float ai = re[k] * ei + im[k] * er;
    cell[0] += ar;
    cell[1] += ai;
    // The rest, with the shift: the owner's turn carried to this bin.
    float tr = turn_re_[from];
    float ti = turn_im_[from];
    for (int walk = from; walk < k; ++walk) {
      const float r = tr * step_re_[from] - ti * step_im_[from];
      ti = tr * step_im_[from] + ti * step_re_[from];
      tr = r;
    }
    for (int walk = from; walk > k; --walk) {
      const float r = tr * step_re_[from] + ti * step_im_[from];
      ti = ti * step_re_[from] - tr * step_im_[from];
      tr = r;
    }
    cell[2] += ar * tr - ai * ti;
    cell[3] += ar * ti + ai * tr;
  }
  if (ahead_[c] > 0) --ahead_[c];
  if (furthest > ahead_[c]) ahead_[c] = furthest;

  // What sounds: the frame that landed.
  for (int k = 0; k < stride; ++k) {
    re[k] = out_re[k];
    im[k] = out_im[k];
  }
  for (int k = stride; k < kBins; ++k) {
    re[k] = 0.0f;
    im[k] = 0.0f;
  }

  if (c == 1) {
    now_ = now_ + 1 < frames_ ? now_ + 1 : 0;
    // A sine of amplitude a on a bin holds 1.5 × (a × kFullScale)² in a frame.
    const float full = 1.0f / (2.0f * 1.5f * Stft::kFullScale * Stft::kFullScale);
    for (int z = 0; z < kZones; ++z) {
      const float level = std::sqrt(zone_energy_[z] * full);
      const float fallen = zone_level_[z] * meter_fall_;
      zone_level_[z] = level > fallen ? level : (fallen > 1.0e-6f ? fallen : 0.0f);
    }
  }
}

}  // namespace livemix
