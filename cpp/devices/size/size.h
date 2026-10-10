#pragma once

// Size: makes the body of a sound smaller or larger and leaves its notes
// where they are; or moves the notes and leaves the body.
//
//   in ─┬─────────────────────────────── dry(), 2304 late ───────────────┐
//       │                                                                ├─► out
//       └─► kit::Stft ─► per frame ─────────────────────► limit ─► wet ──┘
//                          │
//                          power ─► outline (the body) ─┐
//                          notes moved (Pitch, Fine) ───┼─► gain per bin ─► tone ─► level
//                                                       │
//                              outline read at f × 2^size, over outline read at f / pitch
//
// A sound is its notes (where the partials are) and its body (the broad
// outline of the spectrum the partials are heard through). Each frame:
//
// - The body is an outline laid over the frame's power in dB. From every
//   bin a slope falls away to both sides, 6 dB in a width w; the outline
//   rests on the bins no slope covers (the partials that stand out) and
//   runs straight from each of them to the next, then it is rounded a
//   little and eased over time. w is so many times the distance between
//   the partials, which is counted in every frame (the peaks within 40 dB
//   of the loudest), plus a share of the frequency. Detail sets how many:
//   twice the distance broad, a quarter of it fine. Broad, a partial has to
//   stand within 3 dB of the line from its neighbours to be part of the
//   body, so only the large shape is moved; fine, a partial 24 dB under its
//   neighbour still is, and the outline follows every partial's own level.
//   It is kept in dB (as log2 of power), so a hill 24 dB high is as plain
//   in it as a small one.
// - Size reads that outline at another place: a body `size` octaves larger
//   has at f what the body had at f × 2^size. The gain at each bin is the
//   moved outline less the outline that stands there, kept between -24 and
//   +18 dB. It is real and positive, so no phase is touched
//   and every partial stays at its frequency, to the cent.
// - Pitch and Fine move the notes: the spectrum is cut at the valleys between
//   its peaks, each peak's piece is moved by a whole number of bins and all
//   its bins are turned by one angle, the one the peak's own frequency (read
//   from its phase advance between two frames) asks for at the new pitch. So
//   the bins of one partial turn together. The body moves with the notes, so
//   the gain then divides by the outline as it was carried along (read at
//   f / pitch): Size 0 puts the body back where it stood.
// - Tone is a tilt about 1 kHz. Level makes the frame as strong as it came
//   in, so nothing here changes how loud the sound is, only its shape.
// - Wander drifts the size by the sample clock (two sines, Rate and 0.618 of
//   it), through silence and sleep. Width sets the left side smaller and the
//   right larger and turns the right side's drift a quarter cycle on.
//
// Mix is a straight cross-fade while the notes are not moved (the wet sound
// is then the dry one filtered, in phase with it) and equal power when they
// are. Each channel is worked on alone: nothing is summed to mono.
//
// Storage: two kit::Stft<2048, 512> (88 KB each), four arrays of 1025 floats
// per channel and nine shared ones, about 230 KB in all. Latency 2304 samples.

#include <cstring>

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class Size : public kit::DeviceBase<size::kNumParams> {
 public:
  using Stft = kit::Stft<2048, 512>;
  static constexpr int kLatency = Stft::kLatency;  // "latencySamples" in device.json
  static constexpr int kBins = Stft::kBins;

  // What the knobs mean, in octaves of the body: Size at 1, the most Wander
  // adds, what Width sets each side apart from the middle by, and the most
  // they come to together.
  static constexpr float kSizeOctaves = 1.0f;
  static constexpr float kWanderOctaves = 0.75f;
  static constexpr float kWidthOctaves = 0.25f;
  static constexpr float kMostOctaves = 1.5f;
  // The drift: two sines, the second at this share of Rate, weighed so.
  static constexpr float kWanderSlow = 0.6180340f;
  static constexpr float kWanderFirst = 0.65f;
  static constexpr float kWanderSecond = 0.35f;
  // How far Width turns the right side's drift on, in cycles.
  static constexpr float kWidthTurn = 0.25f;
  // The outline's width w at Detail 0 and at Detail 1: so many times the
  // distance between the partials, and so large a share of the frequency.
  static constexpr float kBroadWidths = 2.0f;
  static constexpr float kFineWidths = 0.25f;
  static constexpr float kBroadShare = 0.04f;
  static constexpr float kFineShare = 0.01f;
  // The rounding's width: so much of the distance between the partials and
  // so large a share of the frequency.
  static constexpr float kRoundWidths = 0.25f;
  static constexpr float kRoundShare = 0.02f;
  // The partials counted are those within this of the loudest bin (40 dB,
  // in log2 of power); the distance between them is taken as no less and no
  // more than these, and eased over time by this much a frame.
  static constexpr float kPartialSpan = 13.287712f;
  static constexpr float kLeastApartHz = 70.0f;
  static constexpr float kMostApartHz = 1500.0f;
  static constexpr float kApartStep = 0.2f;
  // The outline falls this far over w away from a partial, in log2 of power
  // (2 is 6 dB), and is eased over time: quickly up, in this long down.
  static constexpr float kFallPerWidth = 2.0f;
  static constexpr float kBodyRise = 0.5f;
  static constexpr float kBodySeconds = 0.04f;
  // The gain a bin may be given, +18 dB and -24 dB, as log2 of amplitude.
  static constexpr float kMostLift = 2.9897353f;
  static constexpr float kLeastLift = -3.9863137f;
  // The outline is not followed further down than this under its highest
  // point: 60 dB, in log2 of power.
  static constexpr float kFloorSpan = 19.931569f;
  static constexpr float kTiltDbPerOctave = 4.5f;
  static constexpr float kTiltMostDb = 18.0f;
  static constexpr float kTiltPivotHz = 1000.0f;
  // The most the level is made up by, either way: 24 dB.
  static constexpr float kMostLevel = 15.848932f;
  // The readings for the display: the outline at so many places, so far apart.
  static constexpr int kBodyPoints = 24;
  static constexpr float kBodyFirstHz = 40.0f;
  static constexpr float kBodyStepOctaves = 0.375f;
  static constexpr float kMeterFloorDb = -120.0f;

  void init(float sample_rate) {
    using namespace size;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    stft_[0].init();
    stft_[1].init(Stft::kMaxStagger);
    for (int k = 0; k < kBins; ++k) {
      octave_[k] = std::log2(Stft::bin_to_hz(k > 0 ? static_cast<float>(k) : 0.5f, sr) / kTiltPivotHz);
      tilt_[k] = 1.0f;
      smooth_[k] = 0.0f;
      slope_[k] = 0.0f;
      power_[k] = 0.0f;
      log_[k] = kNothing;
      now_[k] = kNothing;
      moved_re_[k] = 0.0f;
      moved_im_[k] = 0.0f;
    }
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kBins; ++k) {
        body_[c][k] = kNothing;
        last_re_[c][k] = 0.0f;
        last_im_[c][k] = 0.0f;
        turn_[c][k] = 0.0f;
      }
      floor_[c] = kNothing;
      level_[c] = 1.0f;
      apart_[c] = Stft::hz_to_bin(kMostApartHz, sr);
      alive_[c] = false;
      turned_[c] = false;
    }
    body_step_ = 1.0f - std::exp(-static_cast<float>(Stft::kHop) / (kBodySeconds * sr));
    wander_phase_[0] = 0u;
    wander_phase_[1] = 0u;
    dry_.set_time(kSmoothingSeconds, sr);
    wet_.set_time(kSmoothingSeconds, sr);
    // What is in flight when the outline has gone: a latency and a frame.
    idle_.reset(sr, static_cast<float>(Stft::kLatency + Stft::kFrame + Stft::kHop) / sr);
    tilt_dirty_ = true;
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display:
  // 0 and 1, the size of the left and the right side now, in octaves, with
  // the drift and Width in it (asleep too: the drift runs by the clock);
  // 2, what the level is made up by, in dB (both sides' mean; 0 at rest);
  // 3 on, the outline the gain is worked out from (both sides' mean, no
  // lower than its floor) at kBodyPoints frequencies from kBodyFirstHz, in
  // dB against a full-scale sine's own bin. Each is read from what the last
  // frame left.
  float meter(int index) const {
    if (index == 0 || index == 1) return size_of(index, wander_phase_[0], wander_phase_[1]);
    if (index == 2) return idle_.asleep() ? 0.0f : 10.0f * std::log10(level_[0] * level_[1]);
    const int point = index - 3;
    if (point < 0 || point >= kBodyPoints || idle_.asleep()) return kMeterFloorDb;
    const float hz = kBodyFirstHz * std::exp2(kBodyStepOctaves * static_cast<float>(point));
    const float at = Stft::hz_to_bin(hz, sample_rate());
    const float both = 0.5f * (kit::max(read(body_[0], at), floor_[0]) + kit::max(read(body_[1], at), floor_[1]));
    // log2 of power into dB, against a full-scale sine's bin.
    const float db = 3.0103f * (both - 2.0f * std::log2(Stft::kFullScale));
    return db > kMeterFloorDb ? db : kMeterFloorDb;
  }

  // At rest: nothing in, and the last outline gone.
  bool asleep() const { return idle_.asleep(); }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || alive_[0] || alive_[1])) {
      silence_output(frames);
      stft_[0].skip(frames);  // the frame clock runs on through the sleep,
      stft_[1].skip(frames);
      wander_phase_[0] += wander_step_[0] * static_cast<uint32_t>(frames);  // and so does the drift
      wander_phase_[1] += wander_step_[1] * static_cast<uint32_t>(frames);
      dry_.snap(dry_.target);  // a knob moved while asleep does not glide in
      wet_.snap(wet_.target);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const float dry_gain = dry_.next();
      const float wet_gain = wet_.next();
      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float made = stft_[c].process(in[c], [this, c](float* re, float* im) { frame(c, re, im); });
        // Linear up to ±1, never past ±2.
        const float wet = 2.0f * kit::soft_clip(0.5f * made);
        out[c] = stft_[c].dry() * dry_gain + wet * wet_gain;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
      wander_phase_[0] += wander_step_[0];
      wander_phase_[1] += wander_step_[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // A bin under this holds nothing: -174 dBFS, as power, and as log2 of it.
  static constexpr float kLeastPower = 9.094947e-13f;
  static constexpr float kNothing = -40.0f;
  static constexpr float kTiny = 1.0e-30f;
  // A frame weaker than this in all is passed as it is.
  static constexpr float kQuiet = 1.0e-20f;
  static constexpr float kPhaseToCycles = 1.0f / 4294967296.0f;
  static constexpr int kMostPeaks = kBins / 3 + 2;

  void apply(int id) {
    using namespace size;
    switch (id) {
      case kTone:
        tilt_dirty_ = true;
        break;
      case kRate: {
        const double cycles = static_cast<double>(param(kRate)) / sample_rate();
        wander_step_[0] = static_cast<uint32_t>(cycles * 4294967296.0);
        wander_step_[1] = static_cast<uint32_t>(cycles * kWanderSlow * 4294967296.0);
        break;
      }
      case kPitch:
      case kFine:
      case kMix: {
        // Moved notes are another sound than the dry one: equal power. Not
        // moved, the wet sound is the dry one filtered: a straight fade.
        const float mix = param(kMix);
        float dry = 1.0f - mix;
        float wet = mix;
        if (notes_moved() && mix > 0.0f && mix < 1.0f) kit::equal_power(mix, &dry, &wet);
        dry_.set(dry, primed());
        wet_.set(wet, primed());
        break;
      }
      default:
        break;  // the rest is read once per frame
    }
  }

  bool notes_moved() const { return param(size::kPitch) != 0.0f || param(size::kFine) != 0.0f; }

  // The size of side c (0 left, 1 right) in octaves when the two drift
  // phases stand at `first` and `second`.
  float size_of(int c, uint32_t first, uint32_t second) const {
    using namespace size;
    const float width = param(kWidth);
    const uint32_t turn = c == 1 ? static_cast<uint32_t>(width * kWidthTurn * 4294967296.0f) : 0u;
    const float drift = kWanderFirst * kit::SineTable::lookup(static_cast<float>(first + turn) * kPhaseToCycles) +
                        kWanderSecond * kit::SineTable::lookup(static_cast<float>(second + turn) * kPhaseToCycles);
    const float side = c == 1 ? kWidthOctaves : -kWidthOctaves;
    return kit::clamp(param(kSize) * kSizeOctaves + param(kWander) * kWanderOctaves * drift + width * side,
                      -kMostOctaves, kMostOctaves);
  }

  // The outline between two bins; past the last bin, the last bin.
  static float read(const float* body, float at) {
    if (!(at < static_cast<float>(kBins - 1))) return body[kBins - 1];
    const int below = static_cast<int>(at);
    return body[below] + (body[below + 1] - body[below]) * (at - static_cast<float>(below));
  }

  // log2 of a positive float within 2e-6: the float's own exponent, and for
  // what is left, m in [√½, √2), the series 2/ln 2 × (z + z³/3 + z⁵/5) with
  // z = (m - 1) / (m + 1).
  static float fast_log2(float x) {
    uint32_t bits;
    std::memcpy(&bits, &x, sizeof bits);
    int exponent = static_cast<int>((bits >> 23) & 0xFFu) - 127;
    bits = (bits & 0x007FFFFFu) | 0x3F800000u;
    float m;
    std::memcpy(&m, &bits, sizeof m);
    if (m > 1.4142135f) {
      m *= 0.5f;
      ++exponent;
    }
    const float z = (m - 1.0f) / (m + 1.0f);
    const float z2 = z * z;
    return static_cast<float>(exponent) + z * (2.8853901f + z2 * (0.96179670f + z2 * 0.57707802f));
  }

  // 2^x within 3e-6 of itself, for |x| under 100: the whole part is the
  // float's exponent, the rest (half either way) e^u to its fifth power.
  // 2^0 is exactly 1.
  static float fast_exp2(float x) {
    const float whole = std::floor(x + 0.5f);
    const float u = (x - whole) * 0.69314718f;
    const float rest = 1.0f + u * (1.0f + u * (0.5f + u * (0.16666667f + u * (0.041666667f + u * 0.0083333333f))));
    const uint32_t bits = static_cast<uint32_t>(static_cast<int>(whole) + 127) << 23;
    float scale;
    std::memcpy(&scale, &bits, sizeof scale);
    return scale * rest;
  }

  void update_tilt() {
    const float per_octave = param(size::kTone) * kTiltDbPerOctave;
    for (int k = 0; k < kBins; ++k) {
      const float db = kit::clamp(per_octave * octave_[k], -kTiltMostDb, kTiltMostDb);
      tilt_[k] = std::exp2(db * 0.1660964f);  // 10^(db / 20)
    }
    tilt_dirty_ = false;
  }

  // One frame of channel c, changed in place. The knobs are read here, once
  // per frame: the overlap cross-fades a change.
  void frame(int c, float* re, float* im) {
    using namespace size;
    if (tilt_dirty_) update_tilt();
    float* body = body_[c];

    // The frame's power, as it is and in log2.
    float total = 0.0f;
    float top = kNothing;
    for (int k = 0; k < kBins; ++k) {
      const float power = re[k] * re[k] + im[k] * im[k];
      total += power;
      const bool sounds = power > kLeastPower;
      power_[k] = sounds ? power : 0.0f;
      log_[k] = sounds ? fast_log2(power) : kNothing;
      if (log_[k] > top) top = log_[k];
    }
    // How far apart the partials lie: the peaks near the loudest are counted
    // between the lowest and the highest of them. One partial alone says
    // nothing of it, and is given the broadest outline.
    {
      const float span = top - kPartialSpan;
      int count = 0, first = 0, last = 0;
      for (int k = 2; k < kBins - 2; ++k) {
        const float here = log_[k];
        if (here > span && here > log_[k - 1] && here >= log_[k + 1] && here > log_[k - 2] && here >= log_[k + 2]) {
          if (count == 0) first = k;
          last = k;
          ++count;
        }
      }
      if (count > 0) {
        const float sr = sample_rate();
        const float apart = count > 1 ? kit::clamp(static_cast<float>(last - first) / static_cast<float>(count - 1),
                                                   Stft::hz_to_bin(kLeastApartHz, sr),
                                                   Stft::hz_to_bin(kMostApartHz, sr))
                                      : Stft::hz_to_bin(kMostApartHz, sr);
        apart_[c] = alive_[c] ? apart_[c] + (apart - apart_[c]) * kApartStep : apart;
      }
      // Per bin: how far the slopes fall from one bin to the next, and the
      // rounding's pole, (w - 1) / (w + 1), which is exp(-2 / w) near enough
      // for the price of a division.
      const float detail = param(kDetail);
      const float widths = kBroadWidths * std::pow(kFineWidths / kBroadWidths, detail);
      const float share = kBroadShare * std::pow(kFineShare / kBroadShare, detail);
      const float base = kit::max(apart_[c] * widths, 2.0f);
      const float round = kit::max(apart_[c] * kRoundWidths, 1.0f);
      for (int k = 0; k < kBins; ++k) {
        const float at = static_cast<float>(k);
        slope_[k] = kFallPerWidth / (base + share * at);
        const float wide = round + kRoundShare * at;
        smooth_[k] = (wide - 1.0f) / (wide + 1.0f);
      }
    }
    // The outline. The slopes that fall away from every bin, up the bins
    // and down them, and the highest of them at each bin; the outline rests
    // on the bins that reach it, the first and the last, and runs straight
    // between; then it is rounded, up the bins and back down, and eased over
    // time. What held nothing takes the new outline at once, so the first
    // frame of a sound has its whole body.
    float run = kNothing;
    for (int k = 0; k < kBins; ++k) {
      run = kit::max(log_[k], run - slope_[k]);
      now_[k] = run;
    }
    run = kNothing;
    for (int k = kBins - 1; k >= 0; --k) {
      run = kit::max(log_[k], run - slope_[k]);
      if (run > now_[k]) now_[k] = run;
    }
    int rests = 0;
    for (int k = 1; k < kBins; ++k) {
      if (log_[k] < now_[k] && k < kBins - 1) continue;
      if (k - rests > 1) {
        const float step = (now_[k] - now_[rests]) / static_cast<float>(k - rests);
        float line = now_[rests];
        for (int between = rests + 1; between < k; ++between) {
          line += step;
          now_[between] = line;
        }
      }
      rests = k;
    }
    run = now_[0];
    for (int k = 0; k < kBins; ++k) {
      run = now_[k] + (run - now_[k]) * smooth_[k];
      now_[k] = run;
    }
    float most = kNothing;
    for (int k = kBins - 1; k >= 0; --k) {
      run = now_[k] + (run - now_[k]) * smooth_[k];
      float held = body[k];
      if (held > kNothing) {
        held += (run - held) * (run > held ? kBodyRise : body_step_);
        if (held < kNothing + 0.02f) held = kNothing;
      } else {
        held = run > kNothing + 0.02f ? run : kNothing;
      }
      body[k] = held;
      if (held > most) most = held;
    }
    alive_[c] = most > kNothing;
    floor_[c] = kit::max(most - kFloorSpan, kNothing);

    const float semitones = param(kPitch) + 0.01f * param(kFine);
    const bool moved = semitones != 0.0f;
    if (!(total > kQuiet)) {
      keep(c, re, im);
      level_[c] = 1.0f;
      return;
    }

    // The notes.
    float carried = 1.0f;  // where the notes' move has carried the body: read it at f × this
    if (moved) {
      const float ratio = std::exp2(semitones * (1.0f / 12.0f));
      carried = 1.0f / ratio;
      shift(c, re, im, ratio);
      keep(c, re, im);
      for (int k = 0; k < kBins; ++k) {
        re[k] = moved_re_[k];
        im[k] = moved_im_[k];
      }
      turned_[c] = true;
    } else {
      keep(c, re, im);
      if (turned_[c]) {
        // The angles the pieces were turned by are let go of, so the next
        // move of the notes starts from the sound as it is.
        for (int k = 0; k < kBins; ++k) turn_[c][k] = 0.0f;
        turned_[c] = false;
      }
    }

    // The body: where it is wanted over where it stands, then the tone.
    // This side's frame is `stagger` samples behind the left one's in the
    // work, not in the sound: the drift is read where the left one read it.
    const uint32_t behind = static_cast<uint32_t>(stft_[c].stagger());
    const float wanted = std::exp2(
        size_of(c, wander_phase_[0] - behind * wander_step_[0], wander_phase_[1] - behind * wander_step_[1]));
    const float floor = floor_[c];
    float made = 0.0f;
    for (int k = 0; k < kBins; ++k) {
      const float at = static_cast<float>(k);
      const float stands = kit::max(moved ? read(body, at * carried) : body[k], floor);
      const float wants = kit::max(read(body, at * wanted), floor);
      const float gain = fast_exp2(kit::clamp(0.5f * (wants - stands), kLeastLift, kMostLift)) * tilt_[k];
      re[k] *= gain;
      im[k] *= gain;
      made += re[k] * re[k] + im[k] * im[k];
    }

    // As strong as it came in.
    const float level = kit::clamp(std::sqrt(total / (made + kTiny)), 1.0f / kMostLevel, kMostLevel);
    level_[c] = level;
    if (level != 1.0f) {
      for (int k = 0; k < kBins; ++k) {
        re[k] *= level;
        im[k] *= level;
      }
    }
  }

  // The frame as it came in is kept for the next one's phase advance.
  void keep(int c, const float* re, const float* im) {
    for (int k = 0; k < kBins; ++k) {
      last_re_[c][k] = re[k];
      last_im_[c][k] = im[k];
    }
  }

  // The notes of channel c's frame moved by `ratio`, into moved_re_ and
  // moved_im_. power_ holds the frame's power.
  //
  // A partial is three or four bins wide and its bins must turn together, so
  // the spectrum is cut into pieces at the lowest bin between each two peaks
  // and a piece is moved whole. Its peak's own frequency is read from how far
  // its phase turned since the last frame (b bins, not a whole number); the
  // piece goes b × (ratio - 1) bins up, to the nearest whole bin, and every
  // bin of it is turned by the angle that makes the frames agree at the new
  // frequency: a quarter of that distance in cycles more with every frame
  // (the hop is a quarter of the frame). The angle is kept per bin, so a peak
  // that wanders from bin to bin picks up where its piece left off.
  void shift(int c, const float* re, const float* im, float ratio) {
    const float* last_re = last_re_[c];
    const float* last_im = last_im_[c];
    float* turn = turn_[c];
    for (int k = 0; k < kBins; ++k) {
      moved_re_[k] = 0.0f;
      moved_im_[k] = 0.0f;
    }
    // The peaks: higher than the two bins on either side.
    int count = 0;
    for (int k = 1; k < kBins - 1; ++k) {
      const float power = power_[k];
      if (power > power_[k - 1] && power >= power_[k + 1] && power > power_[k >= 2 ? k - 2 : 0] &&
          power >= power_[k + 2 < kBins ? k + 2 : kBins - 1]) {
        peaks_[count++] = static_cast<int16_t>(k);
        if (count == kMostPeaks) break;
      }
    }
    int start = 0;
    for (int n = 0; n < count; ++n) {
      const int at = peaks_[n];
      int end = kBins - 1;
      if (n + 1 < count) {
        int lowest = at + 1;
        for (int k = at + 2; k < peaks_[n + 1]; ++k) {
          if (power_[k] < power_[lowest]) lowest = k;
        }
        end = lowest - 1;  // the lowest bin begins the next piece
      }
      // X × conj(X last): the angle of it is the phase advance.
      const float ar = re[at] * last_re[at] + im[at] * last_im[at];
      const float ai = im[at] * last_re[at] - re[at] * last_im[at];
      const float bin = (ar != 0.0f || ai != 0.0f) ? Stft::advance_to_bin(at, kit::fast_atan2(ai, ar))
                                                   : static_cast<float>(at);
      const float move = bin * (ratio - 1.0f);
      const int whole = static_cast<int>(std::floor(move + 0.5f));
      float angle = turn[at] + move * (1.0f / Stft::kOverlap);
      angle -= std::floor(angle);
      const float cosine = kit::SineTable::cos_lookup(angle);
      const float sine = kit::SineTable::lookup(angle);
      const int from = start > -whole ? start : -whole;
      const int to = end < kBins - 1 - whole ? end : kBins - 1 - whole;
      for (int k = from; k <= to; ++k) {
        moved_re_[k + whole] += re[k] * cosine - im[k] * sine;
        moved_im_[k + whole] += re[k] * sine + im[k] * cosine;
      }
      for (int k = start; k <= end; ++k) turn[k] = angle;
      start = end + 1;
    }
  }

  Stft stft_[2];
  float body_[2][kBins] = {};     // the outline, as log2 of power
  float last_re_[2][kBins] = {};  // the frame before, as it came in
  float last_im_[2][kBins] = {};
  float turn_[2][kBins] = {};  // the angle each bin's piece was last turned by, in cycles
  float floor_[2] = {kNothing, kNothing};  // the outline is not read lower than this
  float level_[2] = {1.0f, 1.0f};
  float apart_[2] = {64.0f, 64.0f};  // how far apart the partials lie, in bins, eased
  bool alive_[2] = {false, false};   // the outline still holds something
  bool turned_[2] = {false, false};  // turn_ holds angles
  // Shared by the two channels, whose frames never run at once.
  float power_[kBins] = {};
  float now_[kBins] = {};
  float moved_re_[kBins] = {};
  float moved_im_[kBins] = {};
  int16_t peaks_[kMostPeaks] = {};
  float log_[kBins] = {};     // log2 of power_
  float slope_[kBins] = {};   // how far the outline falls from one bin to the next
  float smooth_[kBins] = {};  // the rounding's pole per bin
  float tilt_[kBins] = {};    // Tone, as a gain per bin
  float octave_[kBins] = {};  // octaves from the pivot
  float body_step_ = 0.0f;
  bool tilt_dirty_ = true;
  uint32_t wander_phase_[2] = {0u, 0u};  // whole cycle = 2^32, so it is the same counted in any blocks
  uint32_t wander_step_[2] = {0u, 0u};
  kit::Smoother dry_;
  kit::Smoother wet_;
  kit::IdleGate idle_;
};

}  // namespace livemix
