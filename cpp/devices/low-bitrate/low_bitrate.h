#pragma once

// Low Bitrate: a transform codec in outline, without the bitstream.

#include "../../kit/kit.h"
#include "mdct.h"
#include "params.gen.h"

namespace livemix {

class LowBitrate : public kit::DeviceBase<low_bitrate::kNumParams> {
 public:
  static constexpr int kLatency = 4096;

  void init(float sample_rate) {
    using namespace low_bitrate;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    rate_factor_ = sr >= 70000.0f ? 2 : 1;
    for (int f = 0; f < kNumFrames; ++f) {
      plan_[f].init(kBaseFrame[f] * rate_factor_);
      build_layout(f);
    }
    for (int q = 0; q < kQuantTable; ++q) {
      power_[q] = static_cast<float>(std::pow(static_cast<double>(q), 4.0 / 3.0));
    }
    for (int i = 0; i < kAngles; ++i) {
      angle_cos_[i] = kit::SineTable::cos_lookup(static_cast<float>(i) / kAngles);
      angle_sin_[i] = kit::SineTable::lookup(static_cast<float>(i) / kAngles);
    }
    angle_rng_.seed(0x9E3779B9u);
    packet_rng_.seed(0x7F4A7C15u);
    packet_size_ = kBaseFrame[kNumFrames - 1] * rate_factor_;
    packet_state_ = kFlowing;
    packet_left_ = 0;
    packet_repeats_ = 0;
    loss_.set_time(kLossSmoothingSeconds, sr);
    stereo_.set_time(kLossSmoothingSeconds, sr);
    high_cut_.set_time(kLossSmoothingSeconds, sr);
    for (int c = 0; c < 2; ++c) {
      for (int i = 0; i < kRing; ++i) input_[c][i] = 0.0f;
    }
    for (Engine& engine : engine_) reset_engine(engine, 0);
    position_ = 0;
    current_ = 0;
    switching_ = false;
    fade_start_ = 0;
    fade_length_ = static_cast<uint32_t>(kSwitchFadeSeconds * sr);
    wanted_frame_ = frame_choice();
    reset_engine(engine_[0], wanted_frame_);
    engine_[0].active = true;
    mix_.set_time(kSmoothingSeconds, sr);
    idle_.reset(sr, static_cast<float>(kRing + kLatency) / sr + 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace low_bitrate;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || alive())) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      loss_.next();
      stereo_.next();
      high_cut_.next();
      if ((position_ & static_cast<uint32_t>(packet_size_ - 1)) == 0) next_packet();
      if (!switching_ && wanted_frame_ != engine_[current_].frame) begin_switch();
      for (Engine& engine : engine_) {
        if (engine.active && (position_ & static_cast<uint32_t>(plan_[engine.frame].size() - 1)) == 0) {
          run_frame(engine);
        }
      }

      const uint32_t at = position_ & kRingMask;
      // A NaN or runaway sample would otherwise spread over a whole frame.
      input_[0][at] = (in[0] > -64.0f && in[0] < 64.0f) ? in[0] : 0.0f;
      input_[1][at] = (in[1] > -64.0f && in[1] < 64.0f) ? in[1] : 0.0f;

      float mid = engine_[current_].out[0][at];
      float side = engine_[current_].out[1][at];
      if (switching_) {
        const int32_t into = static_cast<int32_t>(position_ - fade_start_);
        if (into >= 0) {
          const Engine& next = engine_[1 - current_];
          const float t = static_cast<float>(into) / static_cast<float>(fade_length_);
          if (t >= 1.0f) {
            engine_[current_].active = false;
            current_ = 1 - current_;
            switching_ = false;
            mid = next.out[0][at];
            side = next.out[1][at];
          } else {
            const float g = t * t * (3.0f - 2.0f * t);
            mid += g * (next.out[0][at] - mid);
            side += g * (next.out[1][at] - side);
          }
        }
      }
      // Linear up to ±1, never past ±2.
      const float wet_left = 2.0f * kit::soft_clip(0.5f * (mid + side));
      const float wet_right = 2.0f * kit::soft_clip(0.5f * (mid - side));

      const uint32_t dry_at = (position_ - kLatency) & kRingMask;
      const float mix = mix_.next();
      // Dry and wet are time-aligned and coherent: a linear crossfade.
      out_left_[i] = input_[0][dry_at] * (1.0f - mix) + wet_left * mix;
      out_right_[i] = input_[1][dry_at] * (1.0f - mix) + wet_right * mix;
      ++position_;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kNumFrames = 3;
  static constexpr int kMaxN = 2048;  // the Long frame at 96 kHz
  static constexpr int kRing = 8192;  // input: a window plus the latency
  static constexpr uint32_t kRingMask = kRing - 1;
  // Coefficients per frame at 44.1 and 48 kHz; doubled from 88.2 kHz up.
  static constexpr int kBaseFrame[kNumFrames] = {128, 512, 1024};
  static constexpr float kSwitchFadeSeconds = 0.03f;
  static constexpr float kLossSmoothingSeconds = 0.02f;
  // log2 of a frequency above anything a bin can hold: "no cut".
  static constexpr float kOpenOctave = 17.0f;
  static constexpr int kQuantTable = 256;
  static constexpr int kAngles = 1024;  // steps per turn of the random-angle table
  // Band edges in Hz: the critical bands (Zwicker's Bark scale), which is the
  // grouping a perceptual codec's scale-factor bands follow.
  static constexpr int kNumEdges = 25;
  static constexpr int kMaxBands = kNumEdges + 1;
  static constexpr float kBandEdgeHz[kNumEdges] = {
      100.0f,  200.0f,  300.0f,  400.0f,  510.0f,  630.0f,  770.0f,  920.0f,  1080.0f,
      1270.0f, 1480.0f, 1720.0f, 2000.0f, 2320.0f, 2700.0f, 3150.0f, 3700.0f, 4400.0f,
      5300.0f, 6400.0f, 7700.0f, 9500.0f, 12000.0f, 15500.0f, 20000.0f};
  static constexpr int kMinBandBins = 4;
  enum Mode : int { kStandard = 0, kInverse = 1, kJitter = 2 };
  static constexpr float kLossOff = 1.0e-4f;  // under this the codec is out of circuit
  static constexpr float kSideTopOctave = 14.2877f;    // log2(20000)
  static constexpr float kSideBottomOctave = 2.3219f;  // log2(5): under every bin
  // Loss 0 → 1: the margin under a band's peak goes from 62 to 2 dB, the
  // floor under the stream's recent peak from 96 to 14 dB, the quantiser
  // from 200 steps to one and a half, the bandwidth from 22 kHz to 3.5 kHz.
  static constexpr float kMarginAtFullDb = 2.0f;
  static constexpr float kMarginRangeDb = 60.0f;
  static constexpr float kFloorAtFullDb = 14.0f;
  static constexpr float kFloorRangeDb = 82.0f;
  static constexpr float kLevelsAtFull = 1.5f;
  static constexpr float kLevelsRange = 80.0f;
  static constexpr float kBandwidthTopOctave = 14.4252f;     // log2(22000)
  static constexpr float kBandwidthBottomOctave = 11.7731f;  // log2(3500)
  static constexpr float kEdgeSlope = 6.0f;                  // a cut is a sixth of an octave wide
  static constexpr float kSpreadUp = 0.398f;                 // masking falls 8 dB per band upwards
  static constexpr float kSpreadDown = 0.158f;               // and 16 dB per band downwards
  static constexpr float kReferenceSeconds = 0.4f;           // how long the stream's peak is remembered
  static constexpr float kMakeUpSeconds = 0.25f;
  enum PacketState : int { kFlowing = 0, kLost = 1, kStuck = 2 };
  static constexpr float kMaxLostShare = 0.5f;          // Dropouts at 1: half the stream is missing
  static constexpr float kMaxStuckShare = 0.5f;
  static constexpr float kShortestEventSeconds = 0.02f; // Burst 0 → 1: events of 20 ms to half a second
  static constexpr float kEventRange = 25.0f;
  static constexpr float kStuckDecay = 0.94f;           // half a decibel per replay
  static constexpr float kDropFadeSeconds = 0.008f;
  static constexpr float kMaxSmearSeconds = 30.0f;  // RT60 of a held bin = 30 s × Smear³
  static constexpr float kSmearFrozen = 0.999f;     // from here up nothing fades
  static constexpr float kHeldFloor = 1.0e-9f;      // per coefficient of frame length: under -170 dBFS
  static constexpr float kMaxPhaseLift = 16.0f;     // cosine coefficient to complex magnitude, at most
  static constexpr float kCarryRatio = 0.25f;       // the stream still feeds a bin above this share of its hold
  static constexpr float kMaxMakeUp = 2.0f;                  // Standard: up to 6 dB
  static constexpr float kMaxGhostMakeUp = 8.0f;             // Inverse: up to 18 dB

  // What a frame size fixes: where the bands lie and how long a hop lasts.
  struct Layout {
    int bands;
    int start[kMaxBands + 1];  // first bin of each band; start[bands] = N
    float octave[kMaxN];       // log2 of each bin's centre frequency in Hz
    float hop_seconds;
  };

  void build_layout(int f) {
    Layout& layout = layout_[f];
    const int n = plan_[f].size();
    const float bin_hz = sample_rate() / static_cast<float>(2 * n);
    layout.hop_seconds = static_cast<float>(n) / sample_rate();
    for (int k = 0; k < kMaxN; ++k) layout.octave[k] = std::log2((static_cast<float>(k) + 0.5f) * bin_hz);
    int bands = 0;
    layout.start[0] = 0;
    for (int e = 0; e < kNumEdges; ++e) {
      const int bin = static_cast<int>(kBandEdgeHz[e] / bin_hz + 0.5f);
      // A band narrower than a few bins has no "quiet detail" to lose: merge.
      if (bin - layout.start[bands] >= kMinBandBins && n - bin >= kMinBandBins) layout.start[++bands] = bin;
    }
    layout.start[++bands] = n;
    layout.bands = bands;
  }

  struct Engine {
    int frame;    // which plan
    bool active;  // running frames
    float overlap[2][kMaxN];  // second half of the last frame, windowed
    float out[2][kRing];      // finished wet samples by output time (mid, side)
    float reference;          // recent peak coefficient of the stream
    float energy_in, energy_kept, energy_lost;  // smoothed, for the make-up gain
    float held[2][kMaxN];     // Smear: the magnitude each bin hangs on to
    float store[2][kMaxN];    // the last packet that arrived, as coefficients
    float hang_reference;     // Smear: peak energy of the stream, fading like the bins
    float flow;               // 1 while packets arrive, 0 in a dropout
    bool alive;               // any bin still held
  };

  void reset_engine(Engine& engine, int frame) {
    engine.frame = frame;
    engine.active = false;
    engine.reference = 0.0f;
    engine.energy_in = engine.energy_kept = engine.energy_lost = 0.0f;
    engine.flow = 1.0f;
    engine.hang_reference = 0.0f;
    engine.alive = false;
    for (int c = 0; c < 2; ++c) {
      for (int i = 0; i < kMaxN; ++i) {
        engine.held[c][i] = 0.0f;
        engine.store[c][i] = 0.0f;
      }
    }
    for (int c = 0; c < 2; ++c) {
      for (int i = 0; i < kMaxN; ++i) engine.overlap[c][i] = 0.0f;
      for (int i = 0; i < kRing; ++i) engine.out[c][i] = 0.0f;
    }
  }

  // What a Loss setting means for one frame.
  struct Severity {
    float margin;      // a bin this far under its band's peak is dropped (a ratio)
    float floor;       // and so is one this far under the recent peak of the stream
    float levels;      // quantiser steps up to a band's peak
    float cut_octave;  // log2 of the frequency above which nothing is kept
  };

  static Severity severity(float loss) {
    const float keep = 1.0f - loss;
    const float eased = keep * std::sqrt(keep);
    const float squared = keep * keep;
    Severity s;
    s.margin = kit::db_to_gain(-(kMarginAtFullDb + kMarginRangeDb * squared));
    s.floor = kit::db_to_gain(-(kFloorAtFullDb + kFloorRangeDb * squared));
    s.levels = kLevelsAtFull + kLevelsRange * eased * eased * eased;
    s.cut_octave = kBandwidthTopOctave + (kBandwidthBottomOctave - kBandwidthTopOctave) * loss * std::sqrt(loss);
    return s;
  }

  // The codec's decision for one channel of one frame: `x` in, what is kept
  // (and quantised) in `y`. A bin survives when it stands close enough to the
  // loudest bin of its band, to the loud bands beside it (masking spreads
  // further up than down) and to the recent peak of the whole stream.
  void lose(const Layout& layout, const float* x, float* y, const Severity& s, float floor) const {
    float peak[kMaxBands];
    float threshold[kMaxBands];
    const int bands = layout.bands;
    for (int b = 0; b < bands; ++b) {
      float loudest = 0.0f;
      for (int k = layout.start[b]; k < layout.start[b + 1]; ++k) {
        const float magnitude = x[k] < 0.0f ? -x[k] : x[k];
        if (magnitude > loudest) loudest = magnitude;
      }
      peak[b] = loudest;
      threshold[b] = loudest * s.margin;
    }
    for (int b = 1; b < bands; ++b) threshold[b] = kit::max(threshold[b], threshold[b - 1] * kSpreadUp);
    for (int b = bands - 2; b >= 0; --b) threshold[b] = kit::max(threshold[b], threshold[b + 1] * kSpreadDown);
    for (int b = 0; b < bands; ++b) {
      const float limit = kit::max(threshold[b], floor);
      const float step = peak[b] / s.levels;
      const float per_step = step > 1.0e-20f ? 1.0f / step : 0.0f;
      for (int k = layout.start[b]; k < layout.start[b + 1]; ++k) {
        float magnitude = x[k] < 0.0f ? -x[k] : x[k];
        const float edge = (s.cut_octave - layout.octave[k]) * kEdgeSlope + 0.5f;
        if (magnitude < limit || per_step == 0.0f || edge <= 0.0f) {
          y[k] = 0.0f;
          continue;
        }
        // The power-law quantiser of MPEG audio layer III: round |x/step|^(3/4).
        const float ratio = magnitude * per_step;
        const int q = static_cast<int>(std::sqrt(ratio * std::sqrt(ratio)) + 0.4054f);
        if (q < kQuantTable) magnitude = power_[q] * step;
        if (edge < 1.0f) magnitude *= edge;
        y[k] = x[k] < 0.0f ? -magnitude : magnitude;
      }
    }
  }

  // Standard and Inverse: decide what is kept, then play that or the rest.
  void code(Engine& engine, int n, float loss, bool inverse) {
    const Layout& layout = layout_[engine.frame];
    const Severity s = severity(loss);
    float loudest = 0.0f;
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < n; ++k) {
        const float magnitude = cosine_[c][k] < 0.0f ? -cosine_[c][k] : cosine_[c][k];
        if (magnitude > loudest) loudest = magnitude;
      }
    }
    const float release = std::exp(-layout.hop_seconds / kReferenceSeconds);
    engine.reference = flush_denormal(kit::max(loudest, engine.reference * release));
    const float floor = engine.reference * s.floor;

    float in = 0.0f, kept = 0.0f, lost = 0.0f;
    for (int c = 0; c < 2; ++c) {
      lose(layout, cosine_[c], kept_[c], s, floor);
      for (int k = 0; k < n; ++k) {
        const float x = cosine_[c][k];
        const float y = kept_[c][k];
        in += x * x;
        kept += y * y;
        lost += (x - y) * (x - y);
      }
    }
    // Make-up: the energy thrown away is given back as gain, within limits,
    // so Loss changes the character and not the level.
    const float hold = std::exp(-layout.hop_seconds / kMakeUpSeconds);
    engine.energy_in = flush_denormal(in + (engine.energy_in - in) * hold);
    engine.energy_kept = flush_denormal(kept + (engine.energy_kept - kept) * hold);
    engine.energy_lost = flush_denormal(lost + (engine.energy_lost - lost) * hold);
    const float heard = inverse ? engine.energy_lost : engine.energy_kept;
    const float ceiling = inverse ? kMaxGhostMakeUp : kMaxMakeUp;
    float gain = 1.0f;
    if (heard > 1.0e-18f) gain = kit::clamp(std::sqrt(engine.energy_in / heard), 1.0f, ceiling);
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < n; ++k) {
        cosine_[c][k] = gain * (inverse ? cosine_[c][k] - kept_[c][k] : kept_[c][k]);
      }
    }
  }

  // Jitter: every bin keeps its magnitude and has its phase turned by a
  // random angle of up to ±Loss × 180°, new every frame. Mid and side turn
  // together, so the image stays where it was.
  void jitter(int n, float loss) {
    const float steps = 0.5f * loss * kAngles;
    for (int k = 0; k < n; ++k) {
      const int index = static_cast<int>(angle_rng_.bipolar() * steps + static_cast<float>(kAngles)) & (kAngles - 1);
      const float turn_re = angle_cos_[index];
      const float turn_im = angle_sin_[index];
      cosine_[0][k] = cosine_[0][k] * turn_re - sine_[0][k] * turn_im;
      cosine_[1][k] = cosine_[1][k] * turn_re - sine_[1][k] * turn_im;
    }
  }

  // Smear: each bin's magnitude falls at a rate set by Smear instead of
  // following the stream. A bin the stream still feeds keeps the stream's
  // phase, so a sound that is only fading is carried, not replaced; a bin the
  // stream has left gets a new random phase every frame, which is the wash.
  // Magnitudes are those of the complex spectrum (cosine and sine transform
  // together), which do not flicker with the phase of a steady tone.
  void hang(Engine& engine, int n, float smear, bool jittered) {
    const Layout& layout = layout_[engine.frame];
    const float seconds = kMaxSmearSeconds * smear * smear * smear;
    const float decay = smear >= kSmearFrozen
                            ? 1.0f
                            : (seconds > 0.0f ? std::exp(-6.9077553f * layout.hop_seconds / seconds) : 0.0f);
    const float floor = kHeldFloor * static_cast<float>(n);
    bool alive = false;
    float passing = 0.0f, hanging = 0.0f;
    for (int c = 0; c < 2; ++c) {
      float* held = engine.held[c];
      for (int k = 0; k < n; ++k) {
        const float cosine = cosine_[c][k];  // what the codec lets through
        const float sine = sine_[c][k];
        const float source = source_[c][k];  // what went in
        const float size = std::sqrt(source * source + sine * sine);
        const float absolute = cosine < 0.0f ? -cosine : cosine;
        const float reference = source < 0.0f ? -source : source;
        // The level the codec passes at this bin, on the complex magnitude.
        float level;
        if (jittered) {
          level = size;
        } else {
          level = reference > 1.0e-20f ? absolute * kit::min(size / reference, kMaxPhaseLift) : 0.0f;
        }
        float hold = held[k] * decay;
        const int index = static_cast<int>(angle_rng_.next_u32() >> 22);  // kAngles = 1024
        if (level >= hold) {
          hold = level;
        } else if (size > kCarryRatio * hold) {
          cosine_[c][k] = hold * ((jittered ? cosine : source) / size);
        } else {
          cosine_[c][k] = hold * angle_cos_[index];
        }
        if (hold < floor) hold = 0.0f;
        held[k] = hold;
        alive = alive || hold > 0.0f;
        passing += level * level;
        hanging += hold * hold;
      }
    }
    engine.alive = alive;
    // What hangs is never louder than the loudest moment that fed it: the
    // energy of all held bins is kept under the peak energy of the stream,
    // which is let go at the same rate as the bins.
    engine.hang_reference = flush_denormal(kit::max(passing, engine.hang_reference * decay * decay));
    if (hanging > engine.hang_reference && hanging > 0.0f) {
      const float gain = std::sqrt(engine.hang_reference / hanging);
      for (int c = 0; c < 2; ++c) {
        for (int k = 0; k < n; ++k) cosine_[c][k] *= gain;
      }
    }
  }

  void let_go(Engine& engine) {
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kMaxN; ++k) engine.held[c][k] = 0.0f;
    }
    engine.hang_reference = 0.0f;
    engine.alive = false;
  }

  // The stream arrives in packets of one Long frame (21 ms) whatever the
  // Frame setting, so packet events sound and count the same at every size.
  // Called on every packet boundary: carry on with the event in flight or
  // draw whether one starts. The chance of a start is chosen so that the
  // share of packets lost (or stuck) in the long run is the control's.
  void next_packet() {
    using namespace low_bitrate;
    if (packet_state_ != kFlowing) {
      if (--packet_left_ > 0) {
        ++packet_repeats_;
        return;
      }
      packet_state_ = kFlowing;
    }
    const float draw = packet_rng_.uniform();
    const float length = packet_rng_.uniform();
    const float packet_seconds = static_cast<float>(packet_size_) / sample_rate();
    const float mean = kit::max(1.0f, kShortestEventSeconds * std::pow(kEventRange, param(kBurst)) / packet_seconds);
    const float d = param(kDropouts);
    const float t = param(kStutter);
    const float lost = kMaxLostShare * d * std::sqrt(d);
    const float stuck = kMaxStuckShare * t * std::sqrt(t);
    // Events of `mean` packets, with gaps of (1 - chance) / chance between them.
    const float chance_lost = lost / (lost + mean * (1.0f - lost));
    const float chance_stuck = stuck / (stuck + mean * (1.0f - stuck));
    if (draw < chance_lost) {
      packet_state_ = kLost;
    } else if (draw < chance_lost + chance_stuck) {
      packet_state_ = kStuck;
    } else {
      return;
    }
    packet_left_ = kit::clamp_int(static_cast<int>(mean * (0.5f + length) + 0.5f), 1, 1 << 12);
    packet_repeats_ = 0;
  }

  // A lost packet is silence (faded over 8 ms where a frame is shorter than
  // that); a stuck stream replays the last packet that arrived, a little
  // quieter each time round.
  void packets(Engine& engine, int n) {
    const Layout& layout = layout_[engine.frame];
    const int offset = static_cast<int>(position_ & static_cast<uint32_t>(packet_size_ - 1));
    if (packet_state_ == kStuck) {
      float gain = 1.0f;
      for (int r = 0; r <= packet_repeats_ && r < 64; ++r) gain *= kStuckDecay;
      for (int c = 0; c < 2; ++c) {
        for (int k = 0; k < n; ++k) cosine_[c][k] = gain * engine.store[c][offset + k];
      }
    } else if (packet_state_ == kFlowing) {
      for (int c = 0; c < 2; ++c) {
        for (int k = 0; k < n; ++k) engine.store[c][offset + k] = cosine_[c][k];
      }
    }
    const float target = packet_state_ == kLost ? 0.0f : 1.0f;
    const float step = kit::min(1.0f, layout.hop_seconds / kDropFadeSeconds);
    engine.flow += kit::clamp(target - engine.flow, -step, step);
    if (engine.flow < 1.0f) {
      // A raised cosine in frame steps; each step is smoothed by the windows.
      const float gain = engine.flow * engine.flow * (3.0f - 2.0f * engine.flow);
      for (int c = 0; c < 2; ++c) {
        for (int k = 0; k < n; ++k) cosine_[c][k] *= gain;
      }
    }
  }

  // What every mode shares: joint stereo and the High Cut.
  void finish_frame(Engine& engine, int n, float loss) {
    const Layout& layout = layout_[engine.frame];
    const float collapse = loss * (1.0f - stereo_.value);
    if (collapse > 0.0f) {
      // The side signal is dropped from the top down: from 20 kHz at none to
      // under the lowest bin at all, over an octave.
      const float cut = kSideTopOctave + (kSideBottomOctave - kSideTopOctave) * collapse;
      for (int k = 0; k < n; ++k) {
        const float keep = kit::clamp(cut - layout.octave[k] + 0.5f, 0.0f, 1.0f);
        cosine_[1][k] *= keep;
      }
    }
    const float high = high_cut_.value;
    if (high < kOpenOctave - 0.5f) {
      for (int k = 0; k < n; ++k) {
        const float keep = kit::clamp((high - layout.octave[k]) * kEdgeSlope + 0.5f, 0.0f, 1.0f);
        cosine_[0][k] *= keep;
        cosine_[1][k] *= keep;
      }
    }
  }

  int mode_choice() const { return kit::clamp_int(static_cast<int>(param(low_bitrate::kMode) + 0.5f), 0, 2); }

  int frame_choice() const {
    return kit::clamp_int(static_cast<int>(param(low_bitrate::kFrame) + 0.5f), 0, kNumFrames - 1);
  }

  bool alive() const { return (engine_[0].active && engine_[0].alive) || (engine_[1].active && engine_[1].alive); }

  void apply(int id) {
    using namespace low_bitrate;
    switch (id) {
      case kFrame:
        wanted_frame_ = frame_choice();
        if (!primed()) {
          reset_engine(engine_[current_], wanted_frame_);
          engine_[current_].active = true;
        }
        break;
      case kLoss:
        loss_.set(param(id), primed());
        break;
      case kStereo:
        stereo_.set(param(id), primed());
        break;
      case kHighCut:
        // Smoothed in octaves; at the top of its range the cut is off.
        high_cut_.set(param(id) >= kParamMax[kHighCut] * 0.995f ? kOpenOctave : std::log2(param(id)), primed());
        break;
      case kMix:
        mix_.set(param(id), primed());
        break;
      default:
        break;  // the rest is read once per frame
    }
  }

  // Start the other engine at the wanted frame size. What it writes is whole
  // from one latency on; the crossfade starts there.
  void begin_switch() {
    Engine& next = engine_[1 - current_];
    reset_engine(next, wanted_frame_);
    next.active = true;
    switching_ = true;
    fade_start_ = position_ + kLatency;
  }

  // One frame of one engine: the 2N samples that ended just now, as mid and
  // side, through the transform and back, overlap-added so that every sample
  // comes out kLatency after it went in.
  void run_frame(Engine& engine) {
    MdctPlan& plan = plan_[engine.frame];
    const int n = plan.size();
    const float* window = plan.window();
    const uint32_t start = position_ - 2 * static_cast<uint32_t>(n);
    const int mode = mode_choice();
    const float smear = param(low_bitrate::kSmear);
    for (int c = 0; c < 2; ++c) {
      const float sign = c == 0 ? 0.5f : -0.5f;
      for (int k = 0; k < 2 * n; ++k) {
        const uint32_t at = (start + k) & kRingMask;
        time_[k] = (0.5f * input_[0][at] + sign * input_[1][at]) * window[k];
      }
      plan.forward(time_, cosine_[c]);
      if (mode == kJitter || smear > 0.0f) plan.forward_sine(time_, sine_[c]);
      if (smear > 0.0f) {
        for (int k = 0; k < n; ++k) source_[c][k] = cosine_[c][k];
      }
    }
    const float loss = loss_.value;
    if (loss > kLossOff) {
      if (mode == kJitter) {
        jitter(n, loss);
      } else {
        code(engine, n, loss, mode == kInverse);
      }
    }
    if (smear > 0.0f) {
      hang(engine, n, smear, mode == kJitter);
    } else if (engine.alive) {
      let_go(engine);
    }
    finish_frame(engine, n, loss);
    packets(engine, n);
    for (int c = 0; c < 2; ++c) {
      plan.inverse(cosine_[c], time_);
      float* overlap = engine.overlap[c];
      float* out = engine.out[c];
      const uint32_t out_start = start + kLatency;
      for (int k = 0; k < n; ++k) {
        out[(out_start + k) & kRingMask] = overlap[k] + time_[k] * window[k];
        overlap[k] = time_[n + k] * window[n + k];
      }
    }
  }

  using MdctPlan = low_bitrate_dsp::Mdct<kMaxN>;

  MdctPlan plan_[kNumFrames];
  Engine engine_[2];
  float input_[2][kRing];        // left and right
  float time_[2 * kMaxN];        // scratch: one windowed frame
  float cosine_[2][kMaxN];       // scratch: MDCT coefficients, mid and side
  Layout layout_[kNumFrames];
  float sine_[2][kMaxN];         // scratch: MDST coefficients, mid and side
  float kept_[2][kMaxN];         // scratch: what the codec keeps
  float source_[2][kMaxN];       // scratch: the cosine coefficients as they went in
  float power_[kQuantTable];     // q^(4/3)
  float angle_cos_[kAngles];
  float angle_sin_[kAngles];
  kit::Rng angle_rng_;
  kit::Rng packet_rng_;
  int packet_size_ = 1024;       // samples per packet
  int packet_state_ = 0;
  int packet_left_ = 0;          // packets the event in flight still lasts
  int packet_repeats_ = 0;       // how often a stuck packet has been replayed
  kit::Smoother loss_, stereo_, high_cut_;
  kit::Smoother mix_;
  kit::IdleGate idle_;
  uint32_t position_ = 0;        // samples processed; rings use its low bits
  uint32_t fade_start_ = 0;
  uint32_t fade_length_ = 1;
  int rate_factor_ = 1;
  int current_ = 0;              // the engine that is heard
  int wanted_frame_ = 1;
  bool switching_ = false;
};

}  // namespace livemix
