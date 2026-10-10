#pragma once

// Common Tones: a spectral gate whose threshold is the sound itself a moment
// ago. In harmony a common tone is a note two chords share; this lets through,
// frequency by frequency, only what the sound now shares with the sound Ago
// before. A held tone under a moving line passes and the line goes; turned
// the other way (Changes) only what is new passes and the held tone goes.
//
//   in ─┬─► delay 4608 ───────────────────────────────────────────► dry ─┐
//       │                                                                 ├─► out
//       └─► Stft ─► power per bin ─┬─► history ─► then ─┐                 │
//                                  │                    ├─► share ─► gain │
//                                  └─► now ─────────────┘            │    │
//                   bins ──────────────────────────────────────────► × ─► ring ─► Stft ─► wet ─┘
//
// kit::Stft<4096, 1024>: a bin is 11.7 Hz at 48 kHz (two notes a whole tone
// apart are told apart from middle C up), a frame comes every 21 ms and the
// latency is 4608 samples. Each channel is worked alone, on its own past, so
// a mono input stays mono bit for bit and nothing is summed.
//
// - now: the power of each bin in this frame, A.
// - then: the power the bin had Ago before, B. Every frame's powers are kept
//   (the history), and the frame Ago back is read between the two frames
//   nearest to it, so Ago moves without steps. Memory makes `then` a running
//   average of that delayed past (a one pole, 10 s × Memory²) in place of one
//   moment. Until the device has heard Ago's worth of sound since it was
//   switched on, it compares with the first whole frame it heard: putting it
//   on a sounding channel does not drop the sound out for Ago. Silence it
//   really heard counts as silence.
// - Broad compares regions and not single bins: A and B are each averaged
//   over a box of ±(0.19 × Broad²) of the bin's own frequency (±3 semitones
//   at the top), so a note that wavers is still the same note.
// - share: what of the bin was there then. With t² = 10^(2.4 × (1 − Strict))
//   (24 dB of leeway at Strict 0, none at 1),
//
//       common = min(1, t² B / A)        changes = 1 − common
//
//   a Wiener-shaped gain: whole while `now` is no more than the leeway over
//   `then`, and from there down 2 dB for every dB. Common and Changes add up
//   to the input. Floor is the gain of what is turned down; at the bottom
//   of its travel that is nothing.
// - Ring: what gets through steadily hangs on. Each bin keeps the value it
//   last had in a steady sound (after the gain), turned on every frame by
//   the turn that sound was measured to make (a rotator from two frames of
//   the input) and falling 60 dB in 20 s × Ring²; a steady sound as loud as
//   what rings takes its place. The ring is heard wherever it is louder
//   than the input with its gain. Only frames with a frame of about the same
//   power on either side of them count as steady, so a held partial stays at
//   its own frequency, the bins of one partial stay together, and an edge (a
//   click, the start or the cut of a note) passes but is never rung on: rung
//   on, it would come round again every frame length. At Ring 0 the wet path
//   is the gain and nothing else.
// - Mix is a straight cross-fade: the wet sound is the dry one with a gain per
//   bin, in phase with it.
//
// Storage: the history is 752 frames (8 s at 96 kHz) of 2049 bins per channel
// as 16-bit codes (the top of the float: exponent and eight bits of mantissa,
// within 0.4 % of the power), 6.2 MB; with the two Stft (0.35 MB) and the
// per-bin state, under 7 MB, so "memoryMb" is 8.
//
// The display reads 72 meters: for each of 24 third octaves from 62.5 Hz to
// 16 kHz the level now, the level then and the level let through (wet), as
// the amplitude of a sine that would read the same, both channels together.
// They are added up inside the frame, where the bins are in hand; meter()
// only hands them over.

#include <cstring>

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class CommonTones : public kit::DeviceBase<common_tones::kNumParams> {
 public:
  using Stft = kit::Stft<4096, 1024>;
  static constexpr int kLatency = Stft::kLatency;  // 4608: "latencySamples" in device.json
  static constexpr int kBands = 24;                // third octaves the meters report
  static constexpr int kMeters = 3 * kBands;       // now, then, let through
  static constexpr float kBandLowHz = 62.5f;
  static constexpr float kMaxLeewayDb = 24.0f;     // at Strict 0
  static constexpr float kMaxRingSeconds = 20.0f;  // -60 dB at Ring 1
  static constexpr float kMaxMemorySeconds = 10.0f;
  static constexpr float kMaxBroad = 0.19f;        // half width of the box, as a share of the frequency

  void init(float sample_rate) {
    using namespace common_tones;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    stft_[0].init();
    stft_[1].init(Stft::kMaxStagger);
    frames_per_second_ = sr / Stft::kHop;
    for (int c = 0; c < 2; ++c) {
      Channel& channel = channel_[c];
      for (int k = 0; k < kBins; ++k) {
        channel.then[k] = 0.0f;
        channel.ring_re[k] = 0.0f;
        channel.ring_im[k] = 0.0f;
        // Until measured, a bin turns by its centre frequency: k quarter turns.
        channel.turn_re[k] = kQuarterTurn[k & 3][0];
        channel.turn_im[k] = kQuarterTurn[k & 3][1];
        channel.next_re[k] = 0.0f;
        channel.next_im[k] = 0.0f;
        channel.last_gain[k] = 0.0f;
        channel.last_re[k] = 0.0f;
        channel.last_im[k] = 0.0f;
      }
      for (int slot = 0; slot < kHistory; ++slot) {
        channel.stamp[slot] = kNoFrame;
        for (int k = 0; k < kBins; ++k) channel.history[slot][k] = 0;
      }
      for (int b = 0; b <= kBands; ++b) {
        channel.band_now[b] = 0.0f;
        channel.band_then[b] = 0.0f;
        channel.band_heard[b] = 0.0f;
      }
      channel.last_frame = 0;
      channel.slot = 0;
      channel.age = 0;
      channel.alive = false;
    }
    for (int k = 0; k < kBins; ++k) {
      silent_row_[k] = 0;
      power_[k] = 0.0f;
      // Which third octave a bin is reported in: everything under the first
      // band's top goes with the first, everything over the last with the last.
      const float hz = Stft::bin_to_hz(static_cast<float>(k), sr);
      const int band = k == 0 ? kBands : static_cast<int>(std::floor(3.0f * std::log2(hz / kBandLowHz)));
      band_of_[k] = static_cast<uint8_t>(k == 0 ? kBands : kit::clamp_int(band, 0, kBands - 1));
    }
    for (int i = 0; i < kMeters; ++i) shown_[i] = 0.0f;
    meters_live_ = false;
    mix_.set_time(kSmoothingSeconds, sr);
    // The past Ago can reach, and the frames in flight when the last sound has gone.
    idle_.reset(sr, kParamMax[kAgo] * 0.001f + static_cast<float>(Stft::kLatency + 2 * Stft::kFrame) / sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    side_ = side_target_;
    broad_dirty_ = true;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json: 0..23 the level now in each
  // third octave, 24..47 the level then, 48..71 the level let through. Each is
  // the amplitude of a sine that would read the same (1 is full scale), from
  // the newest frame of both channels; 0 at rest and asleep.
  float meter(int index) const { return (index >= 0 && index < kMeters) ? shown_[index] : 0.0f; }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || channel_[0].alive || channel_[1].alive)) {
      silence_output(frames);
      stft_[0].skip(frames);  // the frame clock runs on through the sleep
      stft_[1].skip(frames);
      mix_.snap(mix_.target);  // a knob moved while asleep does not glide in
      side_ = side_target_;
      if (meters_live_) {
        for (int i = 0; i < kMeters; ++i) shown_[i] = 0.0f;
        meters_live_ = false;
      }
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const float mix = mix_.next();
      const float dry_gain = 1.0f - mix;
      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float made = stft_[c].process(in[c], [this, c](float* re, float* im) { frame(c, re, im); });
        // Linear up to full scale, never past twice that: ringing bins with
        // phases of their own can pile up where the input's never did.
        const float wet = 2.0f * kit::soft_clip(0.5f * made);
        out[c] = stft_[c].dry() * dry_gain + wet * mix;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kBins = Stft::kBins;
  // Frames of history: 8 s at 96 kHz (750) and the two a read between frames needs.
  static constexpr int kHistory = 752;
  // Stft::frame() counts in what a 32-bit sample count leaves: it wraps here, once a day.
  static constexpr uint32_t kFrameMask = 0xFFFFFFFFu / Stft::kHop;
  static constexpr uint32_t kNoFrame = 0xFFFFFFFFu;
  static constexpr uint32_t kOldEnough = 1u << 24;  // an age past any Ago; the count stops there
  // A bin's power under this is silence: an amplitude of 1e-6 where a full-scale sine reads 1024.
  static constexpr float kPowerFloor = 1.0e-12f;
  static constexpr float kMagnitudeFloor = 1.0e-4f;  // a ring 140 dB under a full-scale sine is over
  static constexpr float kSteady = 0.8f;  // a bin's power from one frame to the next, either way, while its sound is steady
  static constexpr float kSideStep = 0.25f;  // Keep crosses over in four frames
  static constexpr float kQuarterTurn[4][2] = {{1.0f, 0.0f}, {0.0f, 1.0f}, {-1.0f, 0.0f}, {0.0f, -1.0f}};

  struct Channel {
    uint16_t history[kHistory][kBins];  // every frame's powers, as codes (pack)
    uint32_t stamp[kHistory];           // the frame each row holds; a row that was slept over is stale
    float then[kBins];                  // the power each bin is compared with
    float ring_re[kBins], ring_im[kBins];    // what each bin rings with: its last steady value, turned on and fallen
    float turn_re[kBins], turn_im[kBins];    // the ring's phase advance per frame, a unit vector
    float next_re[kBins], next_im[kBins];    // the advance measured last, not yet taken up (0: none)
    float last_gain[kBins];                  // the gain the bin was given in the previous frame
    float last_re[kBins], last_im[kBins];    // the previous analysis frame
    float band_now[kBands + 1];              // this frame's power per third octave (the last is not shown)
    float band_then[kBands + 1];
    float band_heard[kBands + 1];
    uint32_t last_frame;  // the frame worked on last
    int slot;             // its row of the history
    uint32_t age;         // frames since init, the ones slept through too
    bool alive;           // any bin still holding sound
  };

  // What one frame is worked out with, fixed when the left channel's comes
  // (it always comes first) so that both channels use the same.
  struct Plan {
    float lookback = 1.0f;  // Ago in frames
    float alpha = 1.0f;     // how much of the delayed past `then` takes each frame
    float leeway = 1.0f;    // t²
    float floor = 0.0f;
    float side = 0.0f;      // 0 common, 1 changes
    float decay = 0.0f;
    bool broad = false;
  };

  // A power as 16 bits: the float's exponent and the top eight bits of its
  // mantissa, read back at the middle of the step (within 0.2 %). Nothing is 0.
  static uint16_t pack(float power) {
    uint32_t bits;
    std::memcpy(&bits, &power, sizeof bits);
    return static_cast<uint16_t>(bits >> 15);
  }
  static float unpack(uint16_t code) {
    if (code == 0) return 0.0f;
    const uint32_t bits = (static_cast<uint32_t>(code) << 15) | 0x4000u;
    float power;
    std::memcpy(&power, &bits, sizeof power);
    return power;
  }

  void apply(int id) {
    using namespace common_tones;
    switch (id) {
      case kAgo:
        lookback_ = kit::clamp(param(id) * 0.001f * frames_per_second_, 1.0f, static_cast<float>(kHistory - 2));
        break;
      case kKeep:
        side_target_ = param(id) >= 0.5f ? 1.0f : 0.0f;
        if (!primed()) side_ = side_target_;
        break;
      case kStrict:
        leeway_ = std::pow(10.0f, 0.1f * kMaxLeewayDb * (1.0f - param(id)));
        break;
      case kRing: {
        const float ring = param(id);
        const float seconds = kMaxRingSeconds * ring * ring;
        decay_ = seconds > 0.0f ? std::exp(-6.9077553f / (seconds * frames_per_second_)) : 0.0f;
        break;
      }
      case kBroad:
        broad_dirty_ = true;
        break;
      case kMemory: {
        const float memory = param(id);
        const float seconds = kMaxMemorySeconds * memory * memory;
        alpha_ = seconds > 0.0f ? 1.0f - std::exp(-1.0f / (seconds * frames_per_second_)) : 1.0f;
        break;
      }
      case kFloor:
        // The bottom of the knob is nothing at all.
        floor_ = param(id) <= kParamMin[id] + 0.01f ? 0.0f : std::pow(10.0f, 0.05f * param(id));
        break;
      case kMix:
        mix_.set(param(id), primed());
        break;
      default:
        break;
    }
  }

  // The box each bin's region is averaged over, as places in the running
  // sums: from k − w to k + 1 + w with w = kMaxBroad × Broad² × k, cut off at
  // the ends of the spectrum.
  void update_boxes() {
    const float broad = param(common_tones::kBroad);
    const float share = kMaxBroad * broad * broad;
    for (int k = 0; k < kBins; ++k) {
      const float reach = share * static_cast<float>(k);
      const float low = kit::max(0.0f, static_cast<float>(k) - reach);
      const float high = kit::min(static_cast<float>(kBins), static_cast<float>(k + 1) + reach);
      box_low_[k] = static_cast<uint16_t>(low);
      box_low_part_[k] = low - static_cast<float>(box_low_[k]);
      box_high_[k] = static_cast<uint16_t>(high);
      box_high_part_[k] = high - static_cast<float>(box_high_[k]);
      box_scale_[k] = 1.0f / (high - low);
    }
    broad_dirty_ = false;
  }

  // The mean over bin k's box of what `sums` adds up (sums[j] is everything under bin j).
  float boxed(const double* sums, int k) const {
    const int low = box_low_[k];
    const int high = box_high_[k];
    const double from = sums[low] + box_low_part_[k] * (sums[low + 1] - sums[low]);
    const double to = sums[high] + box_high_part_[k] * (sums[high + 1] - sums[high]);
    return static_cast<float>((to - from) * box_scale_[k]);
  }

  // The row of the history that holds the frame `back` frames before frame
  // `frame`, or silence when the device slept through it.
  const uint16_t* row(const Channel& channel, uint32_t frame, int back) const {
    const int slot = (channel.slot + kHistory - back) % kHistory;
    const uint32_t wanted = (frame - static_cast<uint32_t>(back)) & kFrameMask;
    return channel.stamp[slot] == wanted ? channel.history[slot] : silent_row_;
  }

  void plan() {
    if (broad_dirty_) update_boxes();
    const float step = side_target_ - side_;
    side_ += kit::clamp(step, -kSideStep, kSideStep);
    plan_.lookback = lookback_;
    plan_.alpha = alpha_;
    plan_.leeway = leeway_;
    plan_.floor = floor_;
    plan_.side = side_;
    plan_.decay = decay_;
    plan_.broad = param(common_tones::kBroad) > 0.0f;
  }

  // One frame of channel c: kBins bins, real and imaginary parts, changed in place.
  void frame(int c, float* re, float* im) {
    Channel& channel = channel_[c];
    if (c == 0) plan();

    // Where this frame stands: its number, its row, and how many frames have
    // gone by since init. The device may have slept since the last one.
    const uint32_t number = stft_[c].frame() & kFrameMask;
    const uint32_t passed = (number - channel.last_frame) & kFrameMask;
    channel.last_frame = number;
    channel.slot = static_cast<int>((static_cast<uint32_t>(channel.slot) + passed % kHistory) % kHistory);
    channel.age = channel.age + passed < kOldEnough ? channel.age + passed : kOldEnough;
    if (passed > 1) {
      // Slept through: the gate holds for longer than Ago reaches, so the
      // past of every frame missed was silence, and `then` fell towards it.
      const float fall = plan_.alpha >= 1.0f ? 0.0f : std::pow(1.0f - plan_.alpha, static_cast<float>(passed - 1));
      for (int k = 0; k < kBins; ++k) {
        const float then = channel.then[k] * fall;
        channel.then[k] = then < kPowerFloor ? 0.0f : then;
      }
    }

    // The past to compare with: Ago back, read between two frames; or, while
    // less than that has gone by since the first whole frame, that frame.
    const int since = static_cast<int>(channel.age) - Stft::kOverlap;
    float alpha = plan_.alpha;
    float far_part = 0.0f;
    bool mirror = false;
    const uint16_t* near = silent_row_;
    const uint16_t* far = silent_row_;
    if (since < 1) {
      mirror = true;  // the first whole frame and the part frames before it: then is now
      alpha = 1.0f;
    } else {
      int back;
      if (static_cast<float>(since) < plan_.lookback) {
        back = since;
        alpha = 1.0f;
      } else {
        back = static_cast<int>(plan_.lookback);
        far_part = plan_.lookback - static_cast<float>(back);
      }
      near = row(channel, number, back);
      if (far_part > 0.0f) far = row(channel, number, back + 1);
    }
    const float near_part = 1.0f - far_part;

    // Now and then, per bin; this frame goes into the history.
    uint16_t* keep = channel.history[channel.slot];
    channel.stamp[channel.slot] = number;
    double sum_now = 0.0;
    double sum_then = 0.0;
    for (int k = 0; k < kBins; ++k) {
      float power = re[k] * re[k] + im[k] * im[k];
      if (power < kPowerFloor) power = 0.0f;
      power_[k] = power;
      keep[k] = pack(power);
      const float was = mirror ? power : near_part * unpack(near[k]) + far_part * unpack(far[k]);
      float then = channel.then[k];
      then = alpha >= 1.0f ? was : then + alpha * (was - then);
      if (then < kPowerFloor) then = 0.0f;
      channel.then[k] = then;
      sum_now_[k] = sum_now;
      sum_then_[k] = sum_then;
      sum_now += power;
      sum_then += then;
    }
    sum_now_[kBins] = sum_now_[kBins + 1] = sum_now;
    sum_then_[kBins] = sum_then_[kBins + 1] = sum_then;

    for (int b = 0; b <= kBands; ++b) {
      channel.band_now[b] = 0.0f;
      channel.band_then[b] = 0.0f;
      channel.band_heard[b] = 0.0f;
    }
    const bool broad = plan_.broad;
    const float leeway = plan_.leeway;
    const float side = plan_.side;
    const float floor = plan_.floor;
    const float decay = plan_.decay;
    bool alive = false;
    for (int k = 0; k < kBins; ++k) {
      const float xr = re[k];
      const float xi = im[k];
      const float power = power_[k];
      const float then = channel.then[k];

      // The share: whole while now is within the leeway of then.
      const float a = broad ? boxed(sum_now_, k) : power;
      const float limit = leeway * (broad ? boxed(sum_then_, k) : then);
      const float common = a > limit ? limit / a : 1.0f;
      const float share = common + side * (1.0f - 2.0f * common);
      const float gain = floor + (1.0f - floor) * share;
      // The ring: what this bin last held steadily, turned on by the turn it
      // was measured to make and let fall, frame by frame.
      float tr = channel.turn_re[k];
      float ti = channel.turn_im[k];
      float rr = (channel.ring_re[k] * tr - channel.ring_im[k] * ti) * decay;
      float ri = (channel.ring_re[k] * ti + channel.ring_im[k] * tr) * decay;

      // Only a steady sound is taken into the ring. A frame in which a sound
      // comes or is cut off has the phase of the edge, not of the sound, and
      // the bins beside a partial are thrown furthest: rung on, an edge
      // comes round again every frame length, and the bins of one partial
      // beat against each other. So the turn (a rotator from two frames of
      // the input) and the value are taken from a frame with a frame of
      // about the same power on either side of it: the frame a cut first
      // touches loses too little power to be told, the one after it does not.
      const float lr = channel.last_re[k];
      const float li = channel.last_im[k];
      const float last_power = lr * lr + li * li;
      const bool steady = power >= kSteady * last_power && power * kSteady <= last_power;
      const float nr = channel.next_re[k];
      const float ni = channel.next_im[k];
      const float measured = nr * nr + ni * ni;
      if (steady && measured > 1.0e-24f) {
        // The frame before this one stood in a steady sound: where it would
        // stand now, one turn on. As loud as what rings, it rings from here.
        const float inverse = 1.0f / std::sqrt(measured);
        const float sr = nr * inverse;
        const float si = ni * inverse;
        const float scale = channel.last_gain[k] * decay;
        const float cr = (lr * sr - li * si) * scale;
        const float ci = (lr * si + li * sr) * scale;
        if (cr * cr + ci * ci >= rr * rr + ri * ri) {
          rr = cr;
          ri = ci;
          channel.turn_re[k] = sr;
          channel.turn_im[k] = si;
        }
      }
      if (rr * rr + ri * ri < kMagnitudeFloor * kMagnitudeFloor) {
        rr = 0.0f;
        ri = 0.0f;
      }
      channel.ring_re[k] = rr;
      channel.ring_im[k] = ri;
      alive = alive || rr != 0.0f || ri != 0.0f;
      if (steady) {
        channel.next_re[k] = xr * lr + xi * li;
        channel.next_im[k] = xi * lr - xr * li;
      } else {
        channel.next_re[k] = 0.0f;
        channel.next_im[k] = 0.0f;
      }
      channel.last_re[k] = xr;
      channel.last_im[k] = xi;
      channel.last_gain[k] = gain;

      // What is heard: the input with its gain, or the ring where that is louder.
      const float ringing = rr * rr + ri * ri;
      float heard = gain * gain * power;
      if (heard >= ringing) {
        re[k] = gain * xr;
        im[k] = gain * xi;
      } else {
        re[k] = rr;
        im[k] = ri;
        heard = ringing;
      }

      const int band = band_of_[k];
      channel.band_now[band] += power;
      channel.band_then[band] += then;
      channel.band_heard[band] += heard;
    }
    channel.alive = alive;

    // The meters, once both channels have this frame: a sine of amplitude 1
    // adds up to 1.5 × kFullScale² over its bins.
    if (c == 1) {
      const float scale = 1.0f / (3.0f * Stft::kFullScale * Stft::kFullScale);
      for (int b = 0; b < kBands; ++b) {
        shown_[b] = std::sqrt((channel_[0].band_now[b] + channel_[1].band_now[b]) * scale);
        shown_[kBands + b] = std::sqrt((channel_[0].band_then[b] + channel_[1].band_then[b]) * scale);
        shown_[2 * kBands + b] = std::sqrt((channel_[0].band_heard[b] + channel_[1].band_heard[b]) * scale);
      }
      meters_live_ = true;
    }
  }

  Stft stft_[2];
  Channel channel_[2];
  Plan plan_;
  uint16_t silent_row_[kBins];  // what a frame slept through reads as
  float power_[kBins];          // scratch: this frame's power per bin
  double sum_now_[kBins + 2];   // scratch: running sums of now and of then, for the boxes
  double sum_then_[kBins + 2];
  uint16_t box_low_[kBins];
  uint16_t box_high_[kBins];
  float box_low_part_[kBins];
  float box_high_part_[kBins];
  float box_scale_[kBins];
  uint8_t band_of_[kBins];
  float shown_[kMeters];
  kit::Smoother mix_;
  kit::IdleGate idle_;
  float frames_per_second_ = 46.875f;
  float lookback_ = 1.0f;
  float alpha_ = 1.0f;
  float leeway_ = 1.0f;
  float floor_ = 0.0f;
  float decay_ = 0.0f;
  float side_ = 0.0f;
  float side_target_ = 0.0f;
  bool broad_dirty_ = true;
  bool meters_live_ = false;
};

}  // namespace livemix
