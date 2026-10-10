#pragma once

// Prism: a spectral delay. Every band of the spectrum comes back at a time
// of its own, set by a curve over frequency, so a struck chord returns as a
// sweep of its own partials.
//
//   in ─┬──────────────────────────────────── dry() (kLatency late) ──────┐
//       │                                                                 ├─► out
//       └─► Stft ─► X ─(+)─► history of frames ─► read each bin at its ─► turn, pan ─► Stft ─► wet ─┘
//                       ▲                         own delay  (A)
//                       └── level hold ◄─ Feedback × Tilt ◄──┘
//
// kit::Stft<2048, 512>: 2048-point frames every 512 samples, so the latency
// is 2304 samples and the dry path is the input that much late.
//
// - The history is a ring of whole spectra per channel, one frame per hop.
//   Bin k is read from the frame d[k] hops back (d ≥ 1); that IS a delay of
//   d[k] × 512 samples of the band the bin belongs to. What is left of the
//   delay under a hop (±256 samples) is a circular shift of the frame, a turn
//   of -2π k r / 2048 per bin, with the gain the shifted window loses
//   (1 + cos(2π r / 2048) / 2 in place of 1.5) put back.
// - The curve. A bin's place u is 0 at 60 Hz and 1 at 7680 Hz, on octaves.
//   Bands quantises u to N steps, Smear lets u run on between the steps
//   again (at 1 every bin has its own time), Shape and Bend turn u into the
//   order of arrival c in 0..1, and
//
//     delay = Time × (1 - Fan × 7/8 × (1 - c))        never under 6 ms
//
//   so the last colour comes at Time and, with Fan open, the first at an
//   eighth of it. Scatter deals the N bands the N evenly spaced times in an
//   order shuffled by Shuffle.
// - Neighbouring bins with different delays would leave a held tone between
//   them out of phase with itself. Each bin is therefore turned by the phase
//   a true dispersive delay would have there, θ[k] = Σ ω(j+½) × (D[j+1] -
//   D[j]): at the frequency where two bands meet they agree. The share of θ
//   that comes from whole hops is a multiple of an eighth of a turn and is
//   applied inside the loop, so every repeat agrees as well; the rest, with
//   the shift under a hop, is applied on the way out only (a shift that went
//   round the loop would walk round the frame).
// - Feedback. What is read is written back with the new frame, per bin, so
//   each band repeats at its own time (in whole hops). Tilt is a gain per
//   bin and pass that never exceeds 1. The level hold: the energy of a frame
//   written may not exceed twice that of the loudest frame of input lately
//   (which is let fall by 60 dB in 40 s); over that the fed-back share of the
//   frame is turned down. A held full-scale chord therefore never comes back
//   at more than twice its amplitude, and at Feedback 1 the sound circles
//   for most of a minute and then goes.
// - Width pans each bin by its order of arrival, the first to the left and
//   the last to the right, by a balance law that leaves the level of a
//   centred sound as it was (and nothing under 120 Hz moves). The two sides
//   are never summed.
//
// Storage: the history is 2 channels × 768 frames × 1025 bins × 2 floats =
// 12.6 MB, which is 4 s at 96 kHz (8 s at 48 kHz). With the two Stft blocks
// and the tables the device needs 13 MB ("memoryMb": 16).

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class Prism : public kit::DeviceBase<prism::kNumParams> {
 public:
  using Stft = kit::Stft<2048, 512>;
  static constexpr int kLatency = Stft::kLatency;  // "latencySamples": 2304
  static constexpr int kBins = Stft::kBins;
  static constexpr int kHistory = 768;  // frames kept: 4 s at 96 kHz and a little
  static constexpr int kZones = 7;      // the octaves of the curve's axis, for the meters
  static constexpr int kMaxBands = 48;

  // The curve's frequency axis: 60 Hz to 60 × 2^7 = 7680 Hz.
  static constexpr float kLowHz = 60.0f;
  static constexpr float kOctaves = 7.0f;
  // With Fan open the first colour comes at this share of Time.
  static constexpr float kFirstShare = 0.125f;
  // No band comes sooner than this: half a hop at 44.1 kHz and under.
  static constexpr float kLeastSeconds = 0.006f;
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
  // lately, and how long that memory takes to fall by 60 dB.
  static constexpr float kHoldRatio = 2.0f;
  static constexpr float kHoldSeconds = 40.0f;
  // The meters fall to a tenth in this long.
  static constexpr float kMeterSeconds = 0.12f;
  // A bin under this holds nothing: -174 dBFS (a full-scale sine reads 512).
  static constexpr float kFloor = 1.0e-6f;

  void init(float sample_rate);
  void set_param(int id, float value);
  void process(int frames);

  // The readings named by "meters": for each octave of the curve's axis, the
  // level of what was last written to the history there (input and repeats
  // together, both channels), as the amplitude of a sine of that energy,
  // with a fall of 120 ms so no frame is missed between two readings. Asleep
  // they read 0.
  float meter(int index) const {
    if (index < 0 || index >= kZones || idle_.asleep()) return 0.0f;
    return zone_level_[index];
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
  // The history: [channel][frame][bin][re, im].
  float history_[2][kHistory][kBins][2] = {};
  int write_ = 0;                // the slot the next frame of channel 0 goes to
  int quiet_[2] = {kHistory, kHistory};  // frames written in a row that were all zero
  float loudest_[2] = {0.0f, 0.0f};      // the level hold's memory, per channel
  float hold_fall_ = 1.0f;
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
  float pan_[2][kBins] = {};
  float order_[kMaxBands] = {};  // Scatter: each band's order of arrival
  float eighth_re_[8] = {};
  float eighth_im_[8] = {};
  // One frame's work space.
  float read_re_[kBins] = {};
  float read_im_[kBins] = {};

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
    for (int n = 0; n < kHistory; ++n) {
      for (int k = 0; k < kBins; ++k) {
        history_[c][n][k][0] = 0.0f;
        history_[c][n][k][1] = 0.0f;
      }
    }
    quiet_[c] = kHistory;
    loudest_[c] = 0.0f;
  }
  write_ = 0;
  const float frames_per_second = sr / Stft::kHop;
  hold_fall_ = std::exp(-13.8155106f / (kHoldSeconds * frames_per_second));  // energy: 60 dB
  meter_fall_ = std::exp(-2.30258509f / (kMeterSeconds * frames_per_second));
  for (int z = 0; z < kZones; ++z) {
    zone_level_[z] = 0.0f;
    zone_energy_[z] = 0.0f;
  }
  for (int k = 0; k < kBins; ++k) {
    const float hz = Stft::bin_to_hz(static_cast<float>(k > 0 ? k : 1), sr);
    place_[k] = k > 0 ? kit::clamp(std::log2(hz / kLowHz) / kOctaves, 0.0f, 1.0f) : 0.0f;
    octave_[k] = std::log2(hz / 1000.0f);
    pan_depth_[k] = kit::clamp(std::log2(hz / kPanFromHz) / std::log2(kPanWholeHz / kPanFromHz), 0.0f, 1.0f);
    zone_[k] = static_cast<uint8_t>(kit::clamp_int(static_cast<int>(place_[k] * kZones), 0, kZones - 1));
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
  mix_.set_time(kSmoothingSeconds, sr);
  mix_.snap(param(kMix));
  mix_seen_ = -1.0f;
  // What is in flight when the history has emptied: a latency and a frame.
  idle_.reset(sr, static_cast<float>(Stft::kLatency + Stft::kFrame + Stft::kHop) / sr);
  rebuild();
}

inline void Prism::set_param(int id, float value) {
  if (!store_param(id, value)) return;
  if (id == prism::kMix) {
    mix_.set(param(id), primed());
  } else {
    dirty_ = true;  // the tables are made again when the next frame comes
  }
}

inline void Prism::process(int frames) {
  frames = begin_block(frames);
  const bool alive = quiet_[0] < kHistory || quiet_[1] < kHistory;
  if (!idle_.wake(input_present(frames) || alive)) {
    silence_output(frames);
    stft_[0].skip(frames);  // the frame clock runs on through the sleep
    stft_[1].skip(frames);
    mix_.snap(mix_.target);  // a knob moved while asleep does not glide in
    // Asleep the whole history is zeros: there is nothing left to hold a level for.
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
  const double most = static_cast<double>(kHistory - 2) * Stft::kHop;
  double theta = 0.0;  // turns: the share of θ from the shifts under a hop
  int eighths = 0;     // eighths of a turn: the share from whole hops
  int last_hops = 1;
  double last_shift = 0.0;
  for (int k = 0; k < kBins; ++k) {
    const float order = order_at(place_[k], bands, smear, shape, power);
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

    // Width: the first to the left, the last to the right, by balance.
    const float position = width * (2.0f * order - 1.0f) * pan_depth_[k];
    const float angle = (position + 1.0f) * 0.125f;  // turns: an eighth is the middle
    pan_[0][k] = 1.41421356f * kit::SineTable::cos_lookup(angle);
    pan_[1][k] = 1.41421356f * kit::SineTable::lookup(angle);
  }
  // Zero frequency and the top bin are real: they are delayed and not turned.
  for (int k = 0; k < kBins; k += kBins - 1) {
    eighth_[k] = 0;
    turn_re_[k] = 1.0f;
    turn_im_[k] = 0.0f;
  }
}

// One frame of channel c. Channel 0's always comes first: what both share
// (the tables, the meters' sums) is done with it, and the ring moves on
// after channel 1's.
inline void Prism::frame(int c, float* re, float* im) {
  if (c == 0) {
    if (dirty_) rebuild();
    for (int z = 0; z < kZones; ++z) zone_energy_[z] = 0.0f;
  }
  float (*ring)[kBins][2] = history_[c];
  const int write = write_;

  // What each bin's own delay brings back, and how much that and the new
  // frame hold.
  float in_energy = 0.0f;
  float back_energy = 0.0f;
  for (int k = 0; k < kBins; ++k) {
    in_energy += re[k] * re[k] + im[k] * im[k];
    int slot = write - hops_[k];
    if (slot < 0) slot += kHistory;
    const float* held = ring[slot][k];
    const float er = eighth_re_[eighth_[k]];
    const float ei = eighth_im_[eighth_[k]];
    const float ar = held[0] * er - held[1] * ei;
    const float ai = held[0] * ei + held[1] * er;
    read_re_[k] = ar;
    read_im_[k] = ai;
    const float gain = loop_[k];
    back_energy += gain * gain * (ar * ar + ai * ai);
  }

  // The level hold: the frame written may hold twice the loudest input
  // frame's energy and no more; the fed-back share gives way.
  float loudest = loudest_[c] * hold_fall_;
  if (in_energy > loudest) loudest = in_energy;
  if (loudest < 1.0e-18f) loudest = 0.0f;
  loudest_[c] = loudest;
  const float room = kHoldRatio * loudest - in_energy;
  float scale = 1.0f;
  if (back_energy > room) scale = room > 0.0f ? std::sqrt(room / back_energy) : 0.0f;

  bool any = false;
  float (*now)[2] = ring[write];
  const float* pan = pan_[c];
  for (int k = 0; k < kBins; ++k) {
    const float ar = read_re_[k];
    const float ai = read_im_[k];
    const float gain = scale * loop_[k];
    float hr = re[k] + gain * ar;
    float hi = im[k] + gain * ai;
    const float energy = hr * hr + hi * hi;
    if (energy < kFloor * kFloor) {
      hr = 0.0f;
      hi = 0.0f;
    } else {
      any = true;
      zone_energy_[zone_[k]] += energy;
    }
    now[k][0] = hr;
    now[k][1] = hi;
    const float tr = turn_re_[k] * pan[k];
    const float ti = turn_im_[k] * pan[k];
    re[k] = ar * tr - ai * ti;
    im[k] = ar * ti + ai * tr;
  }
  quiet_[c] = any ? 0 : (quiet_[c] < kHistory ? quiet_[c] + 1 : kHistory);

  if (c == 1) {
    write_ = write + 1 < kHistory ? write + 1 : 0;
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
