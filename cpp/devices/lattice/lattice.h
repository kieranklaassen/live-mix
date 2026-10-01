#pragma once

// Lattice: a scale-aware harmonizer for a single melodic line. A pitch
// tracker names the note being played, the note is placed on a scale, and up
// to four voices are pitch-shifted to other steps of that scale.
//
//   in ─┬──────────────────────────────────────────────────── dry ─┐
//       │                                                          ▼
//       └► mono ─┬► pitch tracker ─► scale degree ─► voicing     (mix) ─► output ─► ceiling ─► out
//                │                                      │ shift    ▲
//                │                                      ▼ (glided) │
//                └─(+)─► 4 × [ crossfade shifter ─► delay ─► level, pan ]
//                   ▲                                │ ▲
//                   │                                └─┘ Echo feedback
//                   └────────── low-pass ◄───────────┘   Cascade feedback
//
// - Shifts are in scale degrees, not semitones: "+2" is a third that is major
//   or minor as the scale says. A voice follows either a plain interval or one
//   of the Thesis voicing rules (mirror, middle, mirror-middle, octaflip,
//   centre) around the Center Note.
// - Snap chooses what the shift is measured from: at 0 % the played pitch
//   keeps its own tuning and vibrato (the interval is preserved), at 100 % the
//   voices are tuned to the scale whatever the input does.
// - While the input is unpitched (noise, silence, a chord) the last harmony is
//   held; before anything has been tracked the voices pass unshifted.
// - The shifter splices two grains a whole number of input periods apart
//   (De-glitch), which keeps a held note free of the detune and tremolo of a
//   plain two-head shifter. That needs the tracker's period, so the tracker
//   runs every 256 samples, counted in samples and never per host block; its
//   two transforms are spread over the hop (see PitchTracker.h).
// - Feedback Path "Echo" is the original: the repeats of a voice keep its
//   pitch. "Cascade" (added in this port) sends the delay output back through
//   the shifter, so every repeat is shifted again and loses a little treble.
//   The tracker only knows the input, so each voice notes the period of what
//   leaves its shifter and reads that note back one delay later: a repeat is
//   then spliced on its own period and stays in tune. While a pitched note is
//   coming in the splices follow the input, which also suits every octave
//   above it; under a held note an octave cascade is therefore exact, and the
//   later generations of any other interval are smeared until the note ends.
// - A voice whose role is Off stops running once it has faded out; only its
//   shifter keeps recording the input, so it can come back without a click.
// - Parameters arrive between blocks and take effect at the next one; mix,
//   output, levels, pans, delay times and feedback ramp over 5 ms and the
//   shift itself moves at the Glide time.

#include "../../kit/kit.h"
#include "CrossfadeShifter.h"
#include "PitchTracker.h"
#include "Scale.h"
#include "VoiceDelay.h"
#include "Voicing.h"
#include "params.gen.h"

namespace livemix {

class Lattice : public kit::DeviceBase<lattice::kNumParams> {
 public:
  static constexpr int kNumVoices = 4;

  void init(float sample_rate) {
    using namespace lattice;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    tracker_.prepare(sr);
    for (Voice& voice : voices_) {
      voice.shifter.prepare(sr);
      voice.delay.prepare(sr, kMaxVoiceDelaySeconds);
      voice.gain_left.set_time(kSmoothingSeconds, sr);
      voice.gain_right.set_time(kSmoothingSeconds, sr);
      voice.delay_ms.set_time(kSmoothingSeconds, sr);
      voice.feedback.set_time(kSmoothingSeconds, sr);
      voice.loop_filter.reset();
      voice.loop_filter.set_cutoff(kCascadeLowpassHz, sr);
      voice.shift_cents.snap(0.0f);
      voice.ratio_cents = 0.0f;
      voice.ratio = 1.0f;
      voice.last_out = 0.0f;
      voice.off = false;
      voice.dormant = false;
      clear_loop_periods(voice);
    }
    period_clock_.reset(kPeriodStride);
    period_write_ = 0;
    longest_period_ = sr / ::lattice::PitchTracker::kMinHz;
    mix_.set_time(kSmoothingSeconds, sr);
    output_.set_time(kSmoothingSeconds, sr);
    cascade_.set_time(kPathFadeSeconds, sr);
    scale_map_ = ::lattice::ScaleMap{};
    input_degree_ = 0;
    have_input_degree_ = false;
    last_tracked_cents_ = 0.0f;
    // The longest silence the device makes while sound is still on its way:
    // a grain up to 0.4 s behind the input (two octaves up, 60 ms window),
    // then 0.5 s of voice delay.
    idle_.reset(sr, kIdleHoldSeconds);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    update_scale();
    recompute_targets();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    if (scale_dirty_) update_scale();
    if (targets_dirty_) recompute_targets();

    const float samples_per_ms = sample_rate() * 0.001f;
    float wet_peak = 0.0f;
    for (int i = 0; i < frames; ++i) {
      float in_left, in_right;
      take_input(i, &in_left, &in_right);
      const float mono = 0.5f * (in_left + in_right);

      if (tracker_.pushSample(mono)) on_new_pitch_estimate();
      const float period = tracker_.getPeriodSamples();
      const bool voiced = tracker_.isVoiced();
      const float cascade = cascade_.next();
      const bool period_tick = period_clock_.tick();
      if (period_tick) period_write_ = (period_write_ + 1) & kPeriodMask;

      float wet_left = 0.0f;
      float wet_right = 0.0f;
      for (Voice& voice : voices_) {
        const float shift_cents = voice.shift_cents.next();
        if (shift_cents != voice.ratio_cents) {
          voice.ratio_cents = shift_cents;
          voice.ratio = std::exp2(shift_cents * (1.0f / 1200.0f));
        }
        if (voice.off) {
          // A voice that is switched off and has faded out costs one store.
          if (!voice.dormant && voice.gain_left.remaining == 0 && voice.gain_right.remaining == 0 &&
              voice.gain_left.value == 0.0f && voice.gain_right.value == 0.0f) {
            voice.dormant = true;
          }
          if (voice.dormant) {
            voice.shifter.feed(mono);
            continue;
          }
        }
        const float delay = voice.delay_ms.next() * samples_per_ms;
        const float feedback = voice.feedback.next();
        float shifter_in = mono;
        float splice_period = period;
        bool splice_aligned = voiced;
        if (cascade > 0.0f) {
          const float back = voice.loop_filter.lowpass(voice.last_out);
          shifter_in += back * feedback * voice.delay.effectiveFeedbackScale(delay) * cascade;
          if (!voiced) {
            // Nothing pitched is coming in: splice on the period of what the
            // loop is returning, noted when it left the shifter one delay ago.
            const int behind = static_cast<int>(delay * (1.0f / kPeriodStride));
            const float returning = voice.loop_periods[(period_write_ - behind) & kPeriodMask];
            if (returning > 0.0f) voice.loop_period = returning;
            splice_period = voice.loop_period;
            splice_aligned = splice_period > 0.0f;
          }
        }
        voice.shifter.setRatio(voice.ratio);
        voice.shifter.setPeriod(splice_period, splice_aligned);
        if (period_tick) {
          const float leaving = splice_aligned ? splice_period / voice.ratio : 0.0f;
          voice.loop_periods[period_write_] = (leaving >= 2.0f && leaving <= longest_period_) ? leaving : 0.0f;
        }
        float s = voice.shifter.process(flush_denormal(shifter_in));
        s = voice.delay.process(s, delay, feedback * (1.0f - cascade));
        voice.last_out = s;

        wet_left += s * voice.gain_left.next();
        wet_right += s * voice.gain_right.next();
        const float magnitude = s < 0.0f ? -s : s;
        if (magnitude > wet_peak) wet_peak = magnitude;
      }

      const float mix = mix_.next();
      const float out = output_.next();
      out_left_[i] = ceiling((in_left * (1.0f - mix) + wet_left * mix) * out);
      out_right_[i] = ceiling((in_right * (1.0f - mix) + wet_right * mix) * out);
    }
    // The voices count even when Level, Mix or Output hide them, so a tail
    // that is still ringing inside is not frozen and replayed later.
    idle_.settle(kit::max(output_peak(frames), wet_peak), frames);
  }

  // What the tracker last heard, for the harness and for meters.
  bool tracking() const { return tracker_.isVoiced(); }
  float tracked_hz() const { return tracker_.getFrequency(); }

 private:
  static constexpr float kDegreeHysteresisCents = 20.0f;
  static constexpr double kMaxVoiceDelaySeconds = 1.0;
  // Cascade only: what the loop loses per pass, so a rising cascade fades
  // into air instead of folding back from Nyquist at full level.
  static constexpr float kCascadeLowpassHz = 8000.0f;
  static constexpr float kPathFadeSeconds = 0.02f;
  static constexpr int kPeriodStride = 32;
  static constexpr int kPeriodSlots = ::lattice::VoiceDelay::kBufferSize / kPeriodStride;
  static constexpr int kPeriodMask = kPeriodSlots - 1;
  static constexpr float kCeilingKnee = 4.0f;
  static constexpr float kIdleHoldSeconds = 1.25f;
  static constexpr int kVoiceParams = 6;

  static_assert(lattice::kV2Role - lattice::kV1Role == kVoiceParams &&
                    lattice::kV4Feedback - lattice::kV1Role == 4 * kVoiceParams - 1,
                "voice parameters are four contiguous groups of six");
  static_assert(lattice::kCustomCents12 - lattice::kCustomOn1 == 2 * ::lattice::kMaxDegrees - 1,
                "custom degrees are twelve contiguous (on, cents) pairs");

  struct Voice {
    ::lattice::CrossfadeShifter shifter;
    ::lattice::VoiceDelay delay;
    kit::LinearRamp gain_left, gain_right, delay_ms, feedback;
    kit::OnePole loop_filter;
    kit::Smoother shift_cents;  // glides at the Glide time
    float ratio_cents = 0.0f;   // the shift `ratio` was computed for
    float ratio = 1.0f;
    float last_out = 0.0f;
    // Cascade: the period of what left the shifter, one entry per
    // kPeriodStride samples over the span of the delay line (0 = unknown),
    // and the last one that came back round.
    float loop_periods[kPeriodSlots] = {};
    float loop_period = 0.0f;
    bool off = false;      // role Off
    bool dormant = false;  // off and faded out: not processed
  };

  // Output safety: exactly linear up to +12 dBFS (what a full-scale input
  // makes at the top of the Output range), then a knee that lands on +18 dBFS.
  // Four voices at +6 dB with 90 % feedback and +12 dB of Output would
  // otherwise reach +40 dBFS.
  static float ceiling(float x) {
    const float magnitude = x < 0.0f ? -x : x;
    if (magnitude <= kCeilingKnee) return x;
    const float shaped =
        kCeilingKnee + kCeilingKnee * kit::fast_tanh((magnitude - kCeilingKnee) / kCeilingKnee);
    return x < 0.0f ? -shaped : shaped;
  }

  static int to_int(float value) { return static_cast<int>(std::floor(value + 0.5f)); }

  int voice_param(int voice, int offset) const {
    return to_int(param(lattice::kV1Role + voice * kVoiceParams + offset));
  }

  void apply(int id) {
    using namespace lattice;
    const float value = param(id);
    const float sr = sample_rate();
    if (id >= kV1Role && id <= kV4Feedback) {
      apply_voice((id - kV1Role) / kVoiceParams, (id - kV1Role) % kVoiceParams);
      return;
    }
    if (id >= kCustomPeriod && id <= kCustomCents12) {
      scale_dirty_ = true;
      return;
    }
    switch (id) {
      case kRoot:
      case kScale:
        scale_dirty_ = true;
        break;
      case kCenter:
        targets_dirty_ = true;
        break;
      case kSnap:
        snap_amount_ = value * 0.01f;
        targets_dirty_ = true;
        break;
      case kGlide:
        for (Voice& voice : voices_) voice.shift_cents.set_time(value * 0.001f, sr);
        break;
      case kWindow:
        for (Voice& voice : voices_) {
          voice.shifter.setWindowSamples(static_cast<int>(value * 0.001f * sr));
        }
        break;
      case kDeglitch:
        for (Voice& voice : voices_) voice.shifter.setDeglitch(value > 0.5f);
        break;
      case kMix:
        mix_.set(value * 0.01f, primed());
        break;
      case kOutput:
        output_.set(kit::db_to_gain(value), primed());
        break;
      case kFeedbackPath:
        cascade_.set(value > 0.5f ? 1.0f : 0.0f, primed());
        break;
      default:
        break;
    }
  }

  void apply_voice(int index, int offset) {
    using namespace lattice;
    Voice& voice = voices_[index];
    const int base = kV1Role + index * kVoiceParams;
    switch (kV1Role + offset) {
      case kV1Role:
        targets_dirty_ = true;
        [[fallthrough]];
      case kV1Level:
      case kV1Pan: {
        const bool off = to_int(param(base)) == static_cast<int>(::lattice::VoiceRole::Off);
        if (voice.dormant && !off) wake(voice);
        voice.off = off;
        const float level_db = param(base + (kV1Level - kV1Role));
        const float level = (off || level_db <= -60.0f) ? 0.0f : kit::db_to_gain(level_db);
        const float pan = kit::clamp(param(base + (kV1Pan - kV1Role)) * 0.01f, -1.0f, 1.0f);
        const float theta = (pan + 1.0f) * kit::kPi * 0.25f;
        voice.gain_left.set(level * std::cos(theta), primed());
        voice.gain_right.set(level * std::sin(theta), primed());
        break;
      }
      case kV1Degrees:
        targets_dirty_ = true;
        break;
      case kV1Delay:
        voice.delay_ms.set(param(base + offset), primed());
        break;
      case kV1Feedback:
        voice.feedback.set(param(base + offset) * 0.01f, primed());
        break;
      default:
        break;
    }
  }

  // A voice coming back from Off starts clean: an empty delay line and fresh
  // grains on a ring that never stopped recording the input.
  void wake(Voice& voice) {
    voice.delay.reset();
    voice.shifter.restart();
    voice.loop_filter.reset();
    voice.last_out = 0.0f;
    voice.dormant = false;
    clear_loop_periods(voice);
  }

  static void clear_loop_periods(Voice& voice) {
    for (float& slot : voice.loop_periods) slot = 0.0f;
    voice.loop_period = 0.0f;
  }

  void update_scale() {
    using namespace lattice;
    scale_dirty_ = false;
    targets_dirty_ = true;
    const int root = kit::clamp_int(to_int(param(kRoot)), 0, 11);
    const int preset = kit::clamp_int(to_int(param(kScale)), 0,
                                      static_cast<int>(::lattice::ScalePreset::Count) - 1);
    if (preset == static_cast<int>(::lattice::ScalePreset::Custom)) {
      std::array<bool, ::lattice::kMaxDegrees> enabled{};
      std::array<float, ::lattice::kMaxDegrees> cents{};
      for (int i = 0; i < ::lattice::kMaxDegrees; ++i) {
        enabled[static_cast<size_t>(i)] = param(kCustomOn1 + 2 * i) > 0.5f;
        cents[static_cast<size_t>(i)] = param(kCustomCents1 + 2 * i);
      }
      scale_map_.scale = ::lattice::Scale::fromCustom(enabled, cents, param(kCustomPeriod));
    } else {
      scale_map_.scale = ::lattice::Scale::preset(static_cast<::lattice::ScalePreset>(preset));
    }
    scale_map_.rootCents = static_cast<float>(root) * 100.0f;
    if (have_input_degree_) input_degree_ = scale_map_.nearestDegree(last_tracked_cents_);
  }

  void recompute_targets() {
    using namespace lattice;
    targets_dirty_ = false;
    if (!have_input_degree_) {
      for (Voice& voice : voices_) voice.shift_cents.set_target(0.0f);
      return;
    }
    const int center_degree =
        scale_map_.nearestDegree(::lattice::midiToCents(static_cast<float>(to_int(param(kCenter)))));
    const float in_cents = scale_map_.degreeToCents(input_degree_);
    const float reference = (1.0f - snap_amount_) * in_cents + snap_amount_ * last_tracked_cents_;
    const int degrees_per_period = scale_map_.scale.numDegrees;
    for (int v = 0; v < kNumVoices; ++v) {
      const auto role = static_cast<::lattice::VoiceRole>(voice_param(v, 0));
      const int offset = voice_param(v, kV1Degrees - kV1Role);
      int target = 0;
      if (::lattice::targetDegree(role, input_degree_, center_degree, degrees_per_period, offset,
                                  target)) {
        voices_[v].shift_cents.set_target(
            kit::clamp(scale_map_.degreeToCents(target) - reference, -2400.0f, 2400.0f));
      }
    }
  }

  void on_new_pitch_estimate() {
    if (!tracker_.isVoiced()) return;  // hold the last harmony while unvoiced
    const float cents = ::lattice::hzToCents(tracker_.getFrequency());
    last_tracked_cents_ = cents;
    const int nearest = scale_map_.nearestDegree(cents);
    if (!have_input_degree_) {
      input_degree_ = nearest;
      have_input_degree_ = true;
    } else if (nearest != input_degree_) {
      const float to_current = std::fabs(cents - scale_map_.degreeToCents(input_degree_));
      const float to_nearest = std::fabs(cents - scale_map_.degreeToCents(nearest));
      if (to_nearest + kDegreeHysteresisCents < to_current) input_degree_ = nearest;
    }
    recompute_targets();
  }

  ::lattice::PitchTracker tracker_;
  ::lattice::ScaleMap scale_map_;
  Voice voices_[kNumVoices];
  kit::LinearRamp mix_, output_, cascade_;
  kit::ControlClock period_clock_;
  kit::IdleGate idle_;
  int period_write_ = 0;
  float longest_period_ = 1066.0f;
  float snap_amount_ = 0.0f;
  float last_tracked_cents_ = 0.0f;
  int input_degree_ = 0;
  bool have_input_degree_ = false;
  bool scale_dirty_ = true;
  bool targets_dirty_ = true;
};

}  // namespace livemix
