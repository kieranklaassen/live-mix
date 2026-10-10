#pragma once

// Spiral: a reverb whose tail climbs (or sinks) for as long as it rings and
// never arrives. The endless staircase, made from whatever is played.
//
//   in ─► 4 allpasses ─┬─────────── early ───────────┐
//                      ▼                              ▼
//                     (+)─► 8 delay lines ─► mixes ──(+)──► six gliding voices
//                      ▲                   │              an octave apart, each
//                      └ damping ◄ decay ◄─┘              with its own two mixes
//
//   voices ─► bell of level over pitch ─► 5 allpasses (Blur) ─► low-pass (Tone)
//          ─► low cut ─► width ─► level hold ─► wet
//
// - The tank is where the tail lives: Decay is its RT60, Size its line
//   lengths, Tone its damping. Its lines do not move by themselves: a tank
//   whose modes wander lets a held note fade and swell (5 dB on average and
//   up to 13 dB within four seconds, measured with a wander of one part in a
//   hundred), and here the level of each partial is what the bell is made
//   of. What moves is the voices.
// - What a voice is given is the early sound (the input after the four
//   allpasses, at a fixed level) and the tank's share. The early sound is
//   flat over pitch, so a held tone is in the tail at every pitch, whatever
//   the tank's modes do there; the tank's share is scaled by (1 - g²)^0.3
//   for a loop gain g, between leaving a long tail as loud as a short one
//   (a held sound would pile up) and taking all of what the loop stores
//   back (a single note would leave next to nothing), and it is evened:
//   see `control`. Each voice and side reads its own mix of the eight
//   lines.
// - The glide is one clock: a position P in octaves that moves at Climb
//   octaves a minute and turns over every six. Voice v stands at
//   u = (P + v) mod 6 and plays the tail at 2^(u - 3) times its pitch: six
//   shifts an octave apart, from three octaves down to three up, all
//   gliding together. The clock is a 64-bit count that runs by the sample,
//   asleep or awake, by Climb as it is set (not smoothed: its slope turns a
//   corner, the pitch does not jump), so the glide keeps its place through
//   any silence. With Climb at its centre the clock goes to the nearest
//   whole octave and rests: a still tail is in tune, the same every time.
// - The bell: Voices says how many octaves sound. Over the N octaves from
//   ceil(N/2) below the played pitch, a voice at the share x of that range
//   has the level sin(pi x)^(2q), and none outside it; Spread sets q from 4
//   (narrow: one voice leads) to 0.5 (wide: all sound). The levels are
//   divided by the root of the sum of their squares, so the power of the
//   stack is the same at every moment: a voice fades to nothing at the top
//   as the one six octaves below it fades in, and nothing steps.
// - Each voice is a three-head delay-line shifter that looks for the start
//   of every pass (glide_voice.h), so a held note comes out as one gliding
//   tone and not as a ladder of fixed lines.
// - Blur is the length of five allpasses in a row (gain 0.7): flat in level
//   at every setting, nothing at 0 (so the tail does not wait for them) and
//   66 ms of lines at 1, a smear of some hundreds of ms that melts the
//   passes of the heads into one wash.
// - The level hold bounds the wet path: unity for ordinary levels, never
//   above full scale (see `hold`).
// - Sleep is counted by the sample, not by the block, so the output is the
//   same at every block size across a silence.
//
// Storage: 12 voice lines of 32768 floats (1.5 MB), 8 tank lines of 16384
// (0.5 MB), 18 allpasses of 2048 to 4096 (0.2 MB).

#include "../../kit/kit.h"
#include "glide_voice.h"
#include "params.gen.h"

namespace livemix {

class Spiral : public kit::DeviceBase<spiral::kNumParams> {
 public:
  static constexpr int kStack = 6;  // voices on the clock, an octave apart

  void init(float sample_rate) {
    using namespace spiral;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float scale = sr / 48000.0f;

    for (int c = 0; c < 2; ++c) {
      for (int a = 0; a < kInputStages; ++a) {
        input_allpass_[c][a].clear();
        input_length_[c][a] =
            kit::clamp_int(static_cast<int>(kInputAllpass[c][a] * scale), 1, kSmallSize - 1);
      }
      for (int a = 0; a < kBlurStages; ++a) {
        blur_allpass_[c][a].clear();
        blur_length_[c][a] = kit::min(kBlurSeconds[a] * (c == 0 ? 1.0f : kBlurSkew) * sr,
                                      static_cast<float>(kBlurSize - 4));
      }
      tone_filter_[c].reset();
      low_cut_[c].reset();
      low_cut_[c].set_cutoff(kLowCutHz, sr);
    }
    for (int n = 0; n < kLines; ++n) {
      line_[n].clear();
      damping_[n].reset();
      length_[n] = kLineSeconds[n] * sr;
      gain_[n] = 0.0f;
    }
    for (int v = 0; v < kStack; ++v) {
      voice_[v].clear(0x9E3779B9u * static_cast<uint32_t>(v + 1), 0.381966f * static_cast<float>(v));
      voice_gain_[v].set_time(kBellSeconds, sr);
      voice_gain_[v].snap(0.0f);
    }

    dry_.set_time(kSmoothingSeconds, sr);
    wet_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    tank_.set_time(0.02f, sr);
    heard_coeff_ = 1.0f - kit::time_to_coeff(kHeardSeconds, sr);
    heard_ = 0.0f;
    expected_ = 0.0f;
    keep_ = 0.0f;
    take_ = 0.0f;
    unkept_ = 1.0f;
    blur_.set_time(kBlurSeconds_, sr);
    size_.set_time(0.15f, sr);
    // Stepped on the control clock.
    decay_.set_time(0.02f, sr / kControlPeriod);
    level_.set_time(0.02f, sr / kControlPeriod);
    tone_.set_time(0.02f, sr / kControlPeriod);
    decay_.snap(param(kDecay));
    clock_.reset(kControlPeriod);

    glide_ = 0;
    glide_step_ = 0;
    per_octave_minute_ = static_cast<double>(kOctave) / (60.0 * static_cast<double>(sr));
    home_step_ = static_cast<uint64_t>(step_for(kHomeRate));
    envelope_ = 0.0f;
    envelope_release_ = kit::time_to_coeff(kHoldRelease, sr);
    // The longest silent gap the device makes: the blur's delays and a
    // voice's longest read, well inside half a second.
    hold_samples_ = static_cast<long>(0.5f * sr);
    quiet_ = hold_samples_;
    asleep_ = true;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    control(true);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display:
  // 0, the glide position P in octaves, 0 up to 6 (voice v stands at
  // (P + v) mod 6); 1, the level of the wet path before Mix, 0 asleep.
  float meter(int index) const {
    if (index == 0) {
      return static_cast<float>(static_cast<double>(glide_ >> 37) * (1.0 / 16777216.0));
    }
    if (index == 1) return asleep_ ? 0.0f : envelope_;
    return 0.0f;
  }

  void process(int frames) {
    using namespace spiral;
    frames = begin_block(frames);
    if (asleep_ && !input_present(frames)) {
      silence_output(frames);
      sleep_on(frames);
      return;
    }
    const float max_line = kit::DelayLine<kLineSize>::max_delay() - 2.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (asleep_) {
        if (in[0] == 0.0f && in[1] == 0.0f) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          sleep_on(1);
          continue;
        }
        wake();
      }
      if (clock_.tick()) control(false);
      glide_ = moved(glide_, 1);

      // Input diffusion, per side. The wet path never sees a sample that is
      // not a number or is out of all range; the dry path passes what came.
      float feed[2];
      for (int c = 0; c < 2; ++c) {
        float x = sane(in[c]);
        x = input_allpass_[c][0].process(x, input_length_[c][0], 0.75f);
        x = input_allpass_[c][1].process(x, input_length_[c][1], 0.75f);
        x = input_allpass_[c][2].process(x, input_length_[c][2], 0.625f);
        x = input_allpass_[c][3].process(x, input_length_[c][3], 0.625f);
        feed[c] = 0.5f * x;
      }

      // The tank.
      float v[kLines];
      if (size_.settled()) {
        for (int n = 0; n < kLines; ++n) v[n] = line_[n].read(whole_length_[n]);
      } else {
        const float size = size_.next();
        for (int n = 0; n < kLines; ++n) {
          v[n] = line_[n].read_linear(kit::clamp(length_[n] * size, 2.0f, max_line));
        }
      }
      hadamard8(v);
      // What comes back round, heard through the same door the sound went
      // in by: line n is fed its side's sound in one sense or the other, and
      // `port` takes what returns to it in that same sense.
      float port[2] = {0.0f, 0.0f};
      for (int n = 0; n < kLines; ++n) {
        const float back = damping_[n].lowpass(v[n] * gain_[n]);
        port[n & 1] += (n & 2) ? -back : back;
        const float x = back + ((n & 2) ? -feed[n & 1] : feed[n & 1]);
        // Linear to ±2, landing on ±4: out of the way of any normal level.
        line_[n].write(flush_denormal(4.0f * kit::soft_clip(0.25f * x)));
      }
      // What is heard of the tank now (the power at its two doors, over a
      // tenth of a second, as it stood before the loop gains took their
      // part) beside what would be there of a sound with no pitch of its
      // own: see `even`.
      const float stored = (port[0] * port[0] + port[1] * port[1]) * unkept_;
      heard_ += (stored - heard_) * heard_coeff_ + 1.0e-30f;
      expected_ = expected_ * keep_ + (feed[0] * feed[0] + feed[1] * feed[1]) * take_ + 1.0e-30f;

      // The gliding voices under the bell, all given the same sound: the
      // early sound turned over, and the tank heard at the door it is fed
      // by. That is the pair an allpass puts out (the input reflected, the
      // loop let through), and it is chosen for what a held tone does in a
      // tank that rings for a long time, where its modes stand far apart
      // beside their width. Heard at the door it is fed by, a loop that
      // loses nothing returns the sound turned over plus a part a quarter
      // turn from it, at every pitch; so between two modes, where any other
      // tap may cancel the early sound, this one adds to it, and the two
      // sides together are never under early + tank. On a mode it is over,
      // and `even` (see control()) turns that down.
      const float tank = 0.5f * glide(tank_);
      const float tail_left = tank * port[0] - kEarly * feed[0];
      const float tail_right = tank * port[1] - kEarly * feed[1];
      float wet[2] = {0.0f, 0.0f};
      for (int n = 0; n < kStack; ++n) {
        voice_[n].process(tail_left, tail_right, glide(voice_gain_[n]), &wet[0], &wet[1]);
      }

      // Blur (its allpasses on whole samples once the knob has come to
      // rest), Tone, low cut.
      if (blur_.remaining == 0) {
        for (int c = 0; c < 2; ++c) {
          float x = wet[c];
          for (int a = 0; a < kBlurStages; ++a) {
            x = blur_allpass_[c][a].process(x, blur_whole_[c][a], kBlurGain);
          }
          wet[c] = x;
        }
      } else {
        const float blur = blur_.next();
        for (int c = 0; c < 2; ++c) {
          float x = wet[c];
          for (int a = 0; a < kBlurStages; ++a) {
            x = blur_allpass_[c][a].process_modulated(x, kit::max(blur_length_[c][a] * blur, 1.0f),
                                                      kBlurGain);
          }
          wet[c] = x;
        }
      }
      for (int c = 0; c < 2; ++c) wet[c] = low_cut_[c].highpass(tone_filter_[c].lowpass(wet[c]));

      const float width = glide(width_);
      const float mid = 0.5f * (wet[0] + wet[1]);
      const float side = 0.5f * (wet[0] - wet[1]) * width;
      const float scaled_left = mid + side;
      const float scaled_right = mid - side;
      const float held = hold(scaled_left, scaled_right);
      const float wet_left = scaled_left * held;
      const float wet_right = scaled_right * held;

      // With Mix full the dry path is out altogether: a sample that is not a
      // number does not get through as nothing times itself.
      const float dry = glide(dry_);
      out_left_[i] = (dry != 0.0f ? in[0] * dry : 0.0f) + wet_left * glide(wet_);
      out_right_[i] = (dry != 0.0f ? in[1] * dry : 0.0f) + wet_right * wet_.value;

      // Asleep once nothing has come in and the wet path has stayed under
      // -140 dBFS for half a second, counted here by the sample.
      const bool sounding = in[0] != 0.0f || in[1] != 0.0f || wet_left > kFloor ||
                            wet_left < -kFloor || wet_right > kFloor || wet_right < -kFloor;
      if (sounding) {
        quiet_ = 0;
      } else if (++quiet_ >= hold_samples_) {
        asleep_ = true;
      }
    }
  }

 private:
  static constexpr int kLines = 8;
  static constexpr int kLineSize = 16384;   // 162 ms at 96 kHz plus modulation
  static constexpr int kSmallSize = 2048;
  static constexpr int kBlurSize = 4096;    // 25.6 ms at 96 kHz
  static constexpr int kVoiceSize = 32768;  // 203 ms at 96 kHz: see kGrainSeconds
  static constexpr int kInputStages = 4;
  static constexpr int kBlurStages = 5;
  static constexpr int kControlPeriod = 32;

  // Line lengths at Size 0.5, mutually prime in samples at 48 kHz.
  static constexpr float kLineSeconds[kLines] = {0.041354f, 0.047896f, 0.055104f, 0.062313f,
                                                 0.071938f, 0.083271f, 0.094729f, 0.108104f};
  // Size 0..1 scales the lines by 0.5..1.5.
  static constexpr float kMinScale = 0.5f;
  static constexpr float kMaxScale = 1.5f;
  static constexpr float kInputAllpass[2][kInputStages] = {{229.0f, 173.0f, 611.0f, 447.0f},
                                                           {241.0f, 181.0f, 631.0f, 463.0f}};
  // The blur's allpasses, 66 ms in all on the left and a little longer on
  // the right; Blur 1 is this gain.
  static constexpr float kBlurSeconds[kBlurStages] = {0.0053f, 0.0079f, 0.0117f, 0.0173f, 0.0239f};
  static constexpr float kBlurSkew = 1.07f;
  static constexpr float kBlurGain = 0.7f;
  static constexpr float kBlurSeconds_ = 0.4f;
  // One pass of a voice's head at ratios up to 2 (80 ms: no pass travels
  // more than that), and the range its start is searched over (16 ms: a full
  // cycle down to 62 Hz). The longest delay a head can reach is the start
  // margin (27 ms), the search and two passes' travel.
  static constexpr float kGrainSeconds = 0.08f;
  static constexpr float kSearchSeconds = 0.016f;
  // The bell: Spread 0 is sin^8, Spread 1 is sin^1 (see the header).
  static constexpr float kNarrowPower = 4.0f;
  static constexpr float kWidePower = 0.5f;
  static constexpr float kBellSeconds = 0.02f;
  static constexpr float kLowCutHz = 30.0f;
  // The early sound a voice is given, and the tank's share beside it: the
  // tank at kTank x (1 - g²)^kLaw (see control()).
  static constexpr float kEarly = 1.5f;
  static constexpr float kTank = 1.1f;
  static constexpr float kLaw = 0.3f;
  static constexpr float kEvenOver = 1.25f;
  static constexpr float kHeardSeconds = 0.1f;
  static constexpr float kHoldRelease = 0.12f;
  static constexpr float kFloor = 1.0e-7f;
  static constexpr float kSane = 8.0f;
  // The clock counts 2^61 to the octave and turns over after six of them.
  static constexpr uint64_t kOctave = 1ull << 61;
  static constexpr uint64_t kTurn = kOctave * kStack;
  // Climb nearer the centre than this is the centre: the clock goes to the
  // nearest whole octave at kHomeRate octaves a minute and stays there.
  static constexpr float kCentre = 0.05f;
  static constexpr float kHomeRate = 12.0f;

  // kit::hadamard<8> written out (as cpp/devices/shimmer does): the loop
  // form costs six times as much without unrolling.
  static void hadamard8(float* v) {
    const float a0 = v[0] + v[1], a1 = v[0] - v[1], a2 = v[2] + v[3], a3 = v[2] - v[3];
    const float a4 = v[4] + v[5], a5 = v[4] - v[5], a6 = v[6] + v[7], a7 = v[6] - v[7];
    const float b0 = a0 + a2, b1 = a1 + a3, b2 = a0 - a2, b3 = a1 - a3;
    const float b4 = a4 + a6, b5 = a5 + a7, b6 = a4 - a6, b7 = a5 - a7;
    constexpr float scale = 0.35355339059f;
    v[0] = (b0 + b4) * scale;
    v[1] = (b1 + b5) * scale;
    v[2] = (b2 + b6) * scale;
    v[3] = (b3 + b7) * scale;
    v[4] = (b0 - b4) * scale;
    v[5] = (b1 - b5) * scale;
    v[6] = (b2 - b6) * scale;
    v[7] = (b3 - b7) * scale;
  }

  // A smoother that has arrived costs one compare.
  static float glide(kit::Smoother& s) { return s.value == s.target ? s.value : s.next(); }

  // What the wet path is given: zero for a sample that is not a number or
  // is far out of range.
  static float sane(float x) { return (x > -kSane && x < kSane) ? x : 0.0f; }

  // The level hold: the gain that keeps the wet path under full scale.
  // With e the peak level (instant attack, 120 ms release) the gain is
  // (1 + e^4)^(-1/4): 0.1 dB down at half scale, 1.5 dB at full scale, and
  // the output never passes 1 however hard the tank is driven.
  float hold(float left, float right) {
    const float a = left < 0.0f ? -left : left;
    const float b = right < 0.0f ? -right : right;
    const float peak = a > b ? a : b;
    envelope_ = peak > envelope_ ? peak
                                 : flush_denormal(peak + (envelope_ - peak) * envelope_release_);
    const float square = envelope_ * envelope_;
    return 1.0f / std::sqrt(std::sqrt(1.0f + square * square));
  }

  // The clock's step for a Climb in octaves a minute.
  int64_t step_for(float climb) const {
    return static_cast<int64_t>(static_cast<double>(climb) * per_octave_minute_);
  }

  // The clock `count` samples on from `at`, asleep or awake alike. With Climb
  // off its centre it moves by Climb; at the centre it goes to the nearest
  // whole octave and rests there, so a tail that holds still is in tune
  // with what is played, the same every time.
  uint64_t moved(uint64_t at, int count) const {
    if (glide_step_ > 0) {
      at += static_cast<uint64_t>(glide_step_) * static_cast<uint64_t>(count);
      return at >= kTurn ? at - kTurn : at;
    }
    if (glide_step_ < 0) {
      const uint64_t back = static_cast<uint64_t>(-glide_step_) * static_cast<uint64_t>(count);
      return at >= back ? at - back : at + kTurn - back;
    }
    const uint64_t over = at & (kOctave - 1);
    if (over == 0) return at;
    const uint64_t reach = home_step_ * static_cast<uint64_t>(count);
    if (over >= kOctave / 2) {
      const uint64_t left = kOctave - over;
      at = reach >= left ? at + left : at + reach;
      return at >= kTurn ? at - kTurn : at;
    }
    return reach >= over ? at - over : at - reach;
  }

  // `count` samples asleep: the glide and the control clock run on.
  void sleep_on(int count) {
    glide_ = moved(glide_, count);
    clock_.counter = (clock_.counter + count) % clock_.period;
  }

  // Knobs moved while asleep snap; nothing glides under the first sound.
  void wake() {
    asleep_ = false;
    quiet_ = 0;
    dry_.snap(dry_.target);
    wet_.snap(wet_.target);
    width_.snap(width_.target);
    blur_.snap(blur_.target);
    size_.snap(size_.target);
    control(true);
  }

  // Where voice `n` stands on the clock, in octaves from 0 up to 6.
  float voice_position(int n) const {
    // Wrapped before the sum is made: two numbers under kTurn can pass 2^64.
    const uint64_t ahead = kOctave * static_cast<uint64_t>(n);
    const uint64_t turn = glide_ >= kTurn - ahead ? glide_ - (kTurn - ahead) : glide_ + ahead;
    return static_cast<float>(static_cast<double>(turn >> 37) * (1.0 / 16777216.0));
  }

  // Every 32 samples: the clock's step, each voice's ratio and level under
  // the bell, the tank's gains, the filters. `snap` on
  // waking: what would glide lands at once.
  void control(bool snap) {
    using namespace spiral;
    const float sr = sample_rate();
    if (snap) {
      decay_.snap(param(kDecay));
    } else {
      decay_.next();
    }

    // The bell over the N octaves that sound.
    const int count = kit::clamp_int(static_cast<int>(param(spiral::kVoices) + 0.5f), 2, kStack);
    const float lowest = static_cast<float>(kStack / 2 - (count + 1) / 2);
    const float power =
        2.0f * kNarrowPower * std::pow(kWidePower / kNarrowPower, param(kSpread));
    float bell[kStack];
    float total = 0.0f;
    for (int n = 0; n < kStack; ++n) {
      const float position = voice_position(n);
      voice_[n].set(std::exp2(position - static_cast<float>(kStack / 2)), kGrainSeconds * sr,
                    kSearchSeconds * sr, sr);
      const float x = (position - lowest) / static_cast<float>(count);
      bell[n] = (x > 0.0f && x < 1.0f) ? std::pow(std::sin(kit::kPi * x), power) : 0.0f;
      total += bell[n] * bell[n];
    }
    const float norm = total > 1.0e-12f ? 1.0f / std::sqrt(total) : 0.0f;
    for (int n = 0; n < kStack; ++n) {
      if (snap) {
        voice_gain_[n].snap(bell[n] * norm);
      } else {
        voice_gain_[n].set_target(bell[n] * norm);
      }
    }

    // The tank: loop gains from Decay and the line lengths.
    const float decay = decay_.value;
    const float size = size_.value;
    for (int n = 0; n < kLines; ++n) gain_[n] = kit::rt60_gain(length_[n] * size, decay, sr);
    // A loop of gain g holds 1 / (1 - g²) times the power it is fed: take
    // half of that back (in dB), so Decay is not also a volume knob.
    // The doors hear the loop after its gains: that part is given back.
    const float middle = gain_[kLines / 2] * gain_[kLines / 2];
    float mean = 0.0f;
    for (int n = 0; n < kLines; ++n) mean += gain_[n] * gain_[n];
    mean *= 1.0f / kLines;
    unkept_ = 1.0f / kit::max(mean, 0.01f);
    const float level = kTank * std::pow(kit::max(1.0f - middle, 1.0e-5f), kLaw) * std::sqrt(unkept_);
    if (snap) {
      level_.snap(level);
    } else {
      level_.set_target(level);
      level_.next();
    }
    // Evening the tank. A tank that rings for long has sharp modes: a pure
    // held tone that sits on one rings it up many times louder than a tone
    // beside it does, however the taps are chosen. The power a sound with
    // no pitch of its own would have stored is known (what was fed, kept as
    // the tank keeps it: `expected_`); when the tank holds more than
    // kEvenOver times that, its share in the voices is turned down to it.
    // Nothing is ever turned up, and once the input stops both fall at the
    // tank's own rate, so the turn stays where it was and the tail's length
    // is the tank's.
    keep_ = std::exp(-13.8155f / (decay * sr));
    take_ = (1.0f - keep_) * (kLines / 2) / kit::max(1.0f - mean, 1.0e-5f);
    const float allowed = kEvenOver * expected_;
    const float even = heard_ > allowed && heard_ > 1.0e-20f ? std::sqrt(allowed / heard_) : 1.0f;
    if (snap) {
      tank_.snap(level_.value * even);
    } else {
      tank_.set_target(level_.value * even);
    }

    // Tone moves over a fiftieth of a second, by ratio: thrown, it does not click.
    const float aim = std::log2(param(kTone));
    if (snap) {
      tone_.snap(aim);
    } else {
      tone_.set_target(aim);
      tone_.next();
    }
    const float tone = std::exp2(tone_.value);
    damping_[0].set_cutoff(tone, sr);
    for (int n = 1; n < kLines; ++n) damping_[n].a = damping_[0].a;
    tone_filter_[0].set(tone, kit::kSqrtHalf, sr);
    tone_filter_[1].g = tone_filter_[0].g;
    tone_filter_[1].k = tone_filter_[0].k;
    tone_filter_[1].a1 = tone_filter_[0].a1;
    tone_filter_[1].a2 = tone_filter_[0].a2;
    tone_filter_[1].a3 = tone_filter_[0].a3;
  }

  void apply(int id) {
    using namespace spiral;
    const float value = param(id);
    switch (id) {
      case kMix: {
        float dry, wet;
        kit::equal_power(value, &dry, &wet);
        if (value >= 1.0f) dry = 0.0f;  // cos(pi/2) in floats is -4e-8, not 0
        dry_.set(dry, primed());
        wet_.set(wet, primed());
        break;
      }
      case kDecay:
        if (primed()) {
          decay_.set_target(value);
        } else {
          decay_.snap(value);
        }
        break;
      case kClimb:
        // The clock's step, taken at once: the slope of the glide turns a
        // corner, the pitch does not jump.
        glide_step_ = (value > -kCentre && value < kCentre) ? 0 : step_for(value);
        break;
      case kSize: {
        const float size = kit::lerp(kMinScale, kMaxScale, value);
        size_.set(size, primed());
        // Where the lines are read once Size has arrived: on whole samples,
        // so a line at rest is a plain delay with no loss of its own.
        for (int n = 0; n < kLines; ++n) {
          whole_length_[n] = kit::clamp_int(static_cast<int>(length_[n] * size + 0.5f), 2, kLineSize - 8);
        }
        break;
      }
      case kBlur:
        // Blur is the length of the allpasses: none at 0, so nothing waits.
        blur_.set(value, primed());
        for (int c = 0; c < 2; ++c) {
          for (int a = 0; a < kBlurStages; ++a) {
            blur_whole_[c][a] =
                kit::clamp_int(static_cast<int>(blur_length_[c][a] * value + 0.5f), 1, kBlurSize - 4);
          }
        }
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      default:
        break;  // Voices, Spread and Tone are read on the control clock
    }
  }

  kit::AllpassDelay<kSmallSize> input_allpass_[2][kInputStages];
  int input_length_[2][kInputStages] = {};
  kit::DelayLine<kLineSize> line_[kLines];
  kit::OnePole damping_[kLines];
  float length_[kLines] = {};
  float gain_[kLines] = {};
  int whole_length_[kLines] = {};

  spiral_dsp::GlideVoice<kVoiceSize> voice_[kStack];
  kit::Smoother voice_gain_[kStack];

  kit::AllpassDelay<kBlurSize> blur_allpass_[2][kBlurStages];
  float blur_length_[2][kBlurStages] = {};
  int blur_whole_[2][kBlurStages] = {};
  kit::Svf tone_filter_[2];
  kit::OnePole low_cut_[2];

  kit::Smoother dry_, wet_, width_, size_;
  kit::LinearRamp blur_;  // by even steps: the allpasses' lines never move faster than 66 ms in kBlurSeconds_
  kit::Smoother decay_, level_, tank_, tone_;
  float heard_ = 0.0f;     // the power of the tank's eight outputs
  float expected_ = 0.0f;  // what a sound with no pitch would have stored
  float heard_coeff_ = 0.0f;
  float keep_ = 0.0f;
  float take_ = 0.0f;
  float unkept_ = 1.0f;  // 1 / the mean power gain of the loop
  kit::ControlClock clock_;

  // The glide clock: P / 6 as a 64-bit fraction of a turn, and its step a
  // sample (signed: Climb below the centre runs it backwards).
  uint64_t glide_ = 0;
  int64_t glide_step_ = 0;
  uint64_t home_step_ = 0;
  double per_octave_minute_ = 0.0;

  float envelope_ = 0.0f;
  float envelope_release_ = 0.0f;
  long hold_samples_ = 1;
  long quiet_ = 1;
  bool asleep_ = true;
};

}  // namespace livemix
