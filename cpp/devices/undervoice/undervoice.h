#pragma once

// Undervoice: a throat that sings under itself.
//
//   per key (up to 12), one to four singers:
//
//   true folds ─► × false folds (first) ──┐                        (folds.h)
//   one pulse     every n-th pulse        ├─ door ─► × envelope ─► tilt ─┬──────────► dry ──┐
//   a cycle    ─► × false folds (second) ─┘                              └─► 8 tuned rings ─┤
//   air × flow × gate ──────────────────────────────────────────────────────────────────────┤
//                                                                                            ▼
//   out ◄─ soft clip ◄─ volume ◄─ rumble cut ◄─ lips ◄─ six formants + six chest modes ◄─ all keys
//                                                                                     (tract.h)
//
// - The undertone. The false folds close over whole groups of n pulses of
//   the true folds. They count the key's own cycles, so what they add lies
//   exactly on the key divided by n: an octave below (2), a twelfth (3), two
//   octaves (4), a flutter (8), and at the end the power of two that brings
//   the key down to two to four pulses a second: tuned drips. Depth says how far they
//   close and, in its upper half, how few of the pulses are let through, and
//   what the voice is made of goes with it: with none of it every division is
//   the open voice. Skew says whether a group is struck or swells. The open
//   voice has nothing to count: there the folds shut within each pulse.
// - The door. A key has two divisions. Turn says how far it goes over from
//   the first to the second and back at Pace, each key of a chord a little
//   after the last; Breath does it for the whole chord, which breathes out on
//   the first and in, quiet and airy, on the second.
// - Shared. A pulse between 10 and 34 a second is fitted to the keys that are
//   down, and each key is divided by the whole number that brings it nearest
//   to it: every key keeps its pitch and the whole chord purrs together.
// - The rings. Eight resonators a key: one at each division's undertone (or
//   the first octave of it that is a tone), six
//   on the key's first harmonics. They fill the gaps between pulses, so that
//   a sparse gate turns from a creak into a string of tuned drops.
// - The formants and the chest are shared by every key (one throat). Each
//   key is levelled by what its harmonics come out with.
// - A full chord makes room for its keys, so that ten of them stay under the
//   clip.
// - Low keys that stand close together are gated less deeply and lose some
//   of their floor: that is where gates beat and the floor turns to mud.
//
// A stolen voice fades out over 5 ms before the new note starts in it. The
// instrument sleeps when no key sounds; the first note after a silence finds
// every knob where it was left.

#include "../../kit/kit.h"
#include "folds.h"
#include "params.gen.h"
#include "tract.h"
#include "voice.h"

namespace livemix {

class Undervoice : public kit::DeviceBase<undervoice::kNumParams> {
 public:
  using F4 = undervoice_dsp::F4;
  using I4 = undervoice_dsp::I4;
  using Colour = undervoice_dsp::Colour;
  using Posture = undervoice_dsp::Posture;
  using Slot = undervoice_dsp::Slot;
  using Voice = undervoice_dsp::Voice;

  static constexpr int kLanes = undervoice_dsp::kLanes;
  static constexpr int kRings = undervoice_dsp::kRings;
  static constexpr int kDivisions = undervoice_dsp::kDivisions;
  static constexpr int kControlPeriod = undervoice_dsp::kControlPeriod;

  static constexpr int kMaxVoices = 12;
  static constexpr float kMinHz = 16.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kVoiceGain = 0.44f;
  static constexpr float kStealSeconds = 0.005f;
  static constexpr float kSlotSeconds = 0.012f;  // a division that changes: shut, swap, open

  // How loud the floor, the rings and the air are against the voice, how
  // much of the air reaches the rings, and how a ring's level falls with the
  // time it takes to fill.
  static constexpr float kFloorGain = 8.0f;
  static constexpr float kRingGain = 1.6f;
  static constexpr float kDripGain = 2.5f;
  static constexpr float kChestGain = 3.0f;
  static constexpr float kFloorSeconds = 0.3f;
  static constexpr float kAirGain = 0.4f;
  static constexpr float kAirIntoRings = 0.5f;
  static constexpr float kRingFeed = 0.8f;
  static constexpr float kShutOne = 0.92f;
  static constexpr float kKeyPlace[kMaxVoices] = {-0.1f, 0.5f, -0.6f, 0.75f, 0.2f, -0.35f, 0.9f, -0.85f, 0.35f, -0.5f, 0.65f, -0.75f};
  static constexpr float kRingPlace[kRings] = {0.0f, 0.0f, 0.0f, -0.35f, 0.4f, -0.6f, 0.65f, -0.2f};

  static constexpr float kDripMost = 3.9f;
  static constexpr float kPulseLow = 10.0f, kPulseMiddle = 17.0f, kPulseHigh = 34.0f;

  // The singers: cents apart, place in the image, how their group is turned
  // against the first one's.
  static constexpr float kSpread[kLanes] = {-0.35f, 0.45f, -1.0f, 1.0f};
  static constexpr float kPlace[kLanes] = {-0.45f, 0.45f, 0.95f, -0.95f};
  static constexpr float kTurns[kLanes] = {0.0f, 0.12f, 0.31f, 0.43f};

  void init(float sample_rate) {
    using namespace undervoice;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    control_rate_ = sr / static_cast<float>(kControlPeriod);
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
      voice.env.reset();
      const uint32_t seed = 0x9E3779B9u * static_cast<uint32_t>(v + 1);
      voice.cycle.seed(seed ^ 0x51ED270Bu);
      voice.air_left = seed ^ 0x0BADC0DEu;
      voice.air_right = seed ^ 0x7F4A7C15u;
      for (int s = 0; s < kLanes; ++s) {
        voice.wander[s].seed(seed ^ (0x1337u * static_cast<uint32_t>(s + 3)));
        voice.wander[s].set_rate(0.21f + 0.07f * static_cast<float>(s), control_rate_);
      }
    }
    start_.seed(0xA5A5F00Du);
    vowel_drift_.seed(0x13579BDFu);
    vowel_drift_.set_rate(0.13f, control_rate_);
    mouth_drift_.seed(0x2468ACE1u);
    mouth_drift_.set_rate(0.17f, control_rate_);
    tract_.init(sr);
    gain_coeff_ = 1.0f - kit::time_to_coeff(kSmoothingSeconds, control_rate_);
    slow_coeff_ = 1.0f - kit::time_to_coeff(0.04f, control_rate_);
    room_down_ = 1.0f - kit::time_to_coeff(0.012f, control_rate_);
    room_up_ = 1.0f - kit::time_to_coeff(0.35f, control_rate_);
    air_low_ = std::exp(-kit::kTwoPi * 280.0f / sr);
    air_high_ = std::exp(-kit::kTwoPi * 1600.0f / sr);
    steal_samples_ = static_cast<int>(kStealSeconds * sr);
    volume_.set_time(kSmoothingSeconds, sr);
    chest_.set_time(kSmoothingSeconds, sr);
    for (int c = 0; c < 2; ++c) {
      rumble_[c].set_cutoff(24.0f, sr);
      rumble_[c].reset();
    }
    idle_.reset(sr, 0.4f);
    clock_.reset(kControlPeriod);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (pool_.count_active() == 0) restart();
    // Every voice this id still holds is let go first, so one note off always
    // ends the key; a note that waits in a stolen voice is replaced.
    bool waiting = false;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& own = pool_.voices[v];
      if (pool_.note_id_of(v) != note_id || !own.active()) continue;
      if (own.pending) {
        own.next_hz = frequency;
        own.next_gain = gain;
        waiting = true;
      } else if (!own.releasing()) {
        own.env.fast_release(0.06f);
        own.damped = true;
      }
    }
    if (waiting) return;
    bool stolen = false;
    const int index = pool_.note_on(note_id, &stolen);
    Voice& voice = pool_.voices[index];
    if (stolen) {
      voice.next_hz = frequency;
      voice.next_gain = gain;
      voice.pending = true;
      if (voice.fade_left == 0) voice.fade_left = steal_samples_;
      return;
    }
    start(voice, index, frequency, gain);
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) {
      voice.pending = false;  // let go before it began: only the fade is left
    } else {
      voice.env.gate_off();
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    int done = 0;
    while (done < frames) {
      if (clock_.counter == 0) control();
      stretch_ = done;
      const int count = kit::clamp_int(clock_.period - clock_.counter, 1, frames - done);
      for (int i = done; i < done + count; ++i) {
        out_left_[i] = 0.0f;
        out_right_[i] = 0.0f;
      }
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.active()) continue;
        int at = done, left = count;
        if (voice.fade_left > 0) {
          const int fading = left < voice.fade_left ? left : voice.fade_left;
          render(voice, at, fading);
          at += fading;
          left -= fading;
          if (voice.fade_left > 0) continue;
          if (!voice.pending) {
            undervoice_dsp::silence(voice);
            continue;
          }
          start(voice, v, voice.next_hz, voice.next_gain);
        }
        if (left > 0) render(voice, at, left);
      }
      for (int i = done; i < done + count; ++i) {
        float left = out_left_[i], right = out_right_[i];
        tract_.process(&left, &right, chest_.next());
        const float volume = volume_.next() * room_.value;
        room_.value += room_.step;
        out_left_[i] = kit::soft_clip(rumble_[0].process(left) * volume);
        out_right_[i] = kit::soft_clip(rumble_[1].process(right) * volume);
      }
      clock_.counter += count;
      if (clock_.counter >= clock_.period) clock_.counter = 0;
      done += count;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // `count` samples of one key, added to the bus from `at`. The hump's line is
  // read from where the sample stands in the control period.
  void render(Voice& voice, int at, int count) {
    using namespace undervoice_dsp;
    kit::Adsr env = voice.env;
    F4 phase = voice.phase, count1 = voice.count1, count2 = voice.count2;
    F4 left = voice.left.value, right = voice.right.value, door = voice.door.value;
    const F4 left_step = voice.left.step, right_step = voice.right.step, door_step = voice.door.step;
    F4 rl0 = voice.ring_left[0].value, rl1 = voice.ring_left[1].value;
    F4 rr0 = voice.ring_right[0].value, rr1 = voice.ring_right[1].value;
    const F4 rl0s = voice.ring_left[0].step, rl1s = voice.ring_left[1].step;
    const F4 rr0s = voice.ring_right[0].step, rr1s = voice.ring_right[1].step;
    F4 re0 = voice.re[0], re1 = voice.re[1], im0 = voice.im[0], im1 = voice.im[1];
    const F4 c0 = voice.turn_re[0], c1 = voice.turn_re[1], s0 = voice.turn_im[0], s1 = voice.turn_im[1];
    const F4 feed0 = voice.feed[0], feed1 = voice.feed[1];
    const bool ringing = voice.ringing;
    float open = voice.open.value, tilt = voice.tilt.value, level = voice.force.value;
    float air = voice.air.value, dry = voice.dry.value, thin = voice.thin.value;
    float thin_left = voice.thin_left, thin_right = voice.thin_right;
    const float thin_coeff = voice.thin_coeff;
    float low_left = voice.low_left, low_right = voice.low_right;
    float soft_left = voice.soft_left, soft_right = voice.soft_right;
    float depth1 = voice.slot[0].depth.value, trim1 = voice.slot[0].trim.value;
    float depth2 = voice.slot[1].depth.value, trim2 = voice.slot[1].trim.value;
    const F4 n1 = splat(static_cast<float>(voice.slot[0].n)), n2 = splat(static_cast<float>(voice.slot[1].n));
    const float per1 = 1.0f / static_cast<float>(voice.slot[0].n), per2 = 1.0f / static_cast<float>(voice.slot[1].n);
    const float sharp1 = voice.slot[0].colour.sharp, sharp2 = voice.slot[1].colour.sharp;
    const F4 zero = splat(0.0f), one = splat(1.0f);
    F4 increment = voice.increment * voice.jitter, per_increment = voice.per_increment;
    float tilt_left = voice.tilt_left, tilt_right = voice.tilt_right, tilt_again = voice.tilt_again.value;
    float fell_left = voice.fell_left, fell_right = voice.fell_right;
    uint32_t air_left = voice.air_left, air_right = voice.air_right;
    const bool airy = air > 0.0f || voice.air.step != 0.0f;
    const bool two = sum_of(size_of(voice.door.step)) != 0.0f || sum_of(door) != 0.0f;
    const int fade_left = voice.fade_left;
    const float fade_step = 1.0f / static_cast<float>(steal_samples_);
    float* out_left = out_left_ + at;
    float* out_right = out_right_ + at;
    const int since = clock_.counter + (at - stretch_);

    for (int i = 0; i < count; ++i) {
      phase += increment;
      const I4 over = phase >= one;
      const F4 whole = reinterpret_cast<F4>(over & reinterpret_cast<I4>(one));
      phase -= whole;
      count1 += whole;
      count1 = pick(count1 >= n1, zero, count1);
      count2 += whole;
      count2 = pick(count2 >= n2, zero, count2);
      if ((over[0] | over[1] | over[2] | over[3]) != 0) {
        for (int s = 0; s < kLanes; ++s) {
          if (over[s] == 0) continue;
          voice.jitter[s] = 1.0f + jitter_ * voice.cycle.bipolar();
          if (count1[s] == 0.0f) voice.group[s] = 1.0f + unlike_ * voice.cycle.bipolar();
          voice.shimmer[s] = voice.group[s] * (1.0f + shimmer_ * voice.cycle.bipolar());
        }
        increment = voice.increment * voice.jitter;
      }
      const Hump& hump = hump_[since + i];
      const float inv_open = 1.0f / open;
      F4 gate = trim1 * (one - depth1 * (one - hump.at((count1 + phase) * per1, sharp1)));
      if (two) {
        const F4 other = trim2 * (one - depth2 * (one - hump.at((count2 + phase) * per2, sharp2)));
        gate += door * (other - gate);
      }
      const float shape = env.next() * level;
      const F4 sung = flow_slope(phase, open, inv_open, increment, per_increment) * voice.shimmer * gate * shape;
      const float sung_left = sum_of(sung * left);
      const float sung_right = sum_of(sung * right);
      tilt_left = sung_left + (tilt_left - sung_left) * tilt;
      tilt_right = sung_right + (tilt_right - sung_right) * tilt;
      fell_left = tilt_left + (fell_left - tilt_left) * tilt_again;
      fell_right = tilt_right + (fell_right - tilt_right) * tilt_again;
      thin_left = fell_left + (thin_left - fell_left) * thin_coeff;
      thin_right = fell_right + (thin_right - fell_right) * thin_coeff;
      float l = (fell_left - thin * thin_left) * dry, r = (fell_right - thin * thin_right) * dry;
      float into = fell_left + fell_right;
      if (airy) {
        const float x = phase[0] * inv_open;
        const float flow = x < 1.0f ? 6.75f * x * x * (1.0f - x) : 0.0f;
        const float rush = shape * air * (0.3f + 0.7f * flow) * gate[0];
        // Air has no bottom of its own, and folds that breathe take its edge.
        const float nl = undervoice_dsp::noise(air_left), nr = air_same_ * nl + air_side_ * undervoice_dsp::noise(air_right);
        low_left = nl + (low_left - nl) * air_low_;
        low_right = nr + (low_right - nr) * air_low_;
        soft_left = (nl - low_left) + (soft_left - (nl - low_left)) * air_high_;
        soft_right = (nr - low_right) + (soft_right - (nr - low_right)) * air_high_;
        const float al = soft_left * rush, ar = soft_right * rush;
        l += al;
        r += ar;
        into += (al + ar) * kAirIntoRings;
      }
      if (ringing) {
        const F4 x0 = feed0 * into, x1 = feed1 * into;
        const F4 a0 = re0 * c0 - im0 * s0 + x0, a1 = re1 * c1 - im1 * s1 + x1;
        im0 = re0 * s0 + im0 * c0;
        im1 = re1 * s1 + im1 * c1;
        re0 = a0;
        re1 = a1;
        l += sum_of(re0 * rl0 + re1 * rl1);
        r += sum_of(re0 * rr0 + re1 * rr1);
      }
      const float fade = fade_left > 0 ? static_cast<float>(fade_left - 1 - i) * fade_step : 1.0f;
      out_left[i] += l * fade;
      out_right[i] += r * fade;

      left += left_step;
      right += right_step;
      door += door_step;
      rl0 += rl0s;
      rl1 += rl1s;
      rr0 += rr0s;
      rr1 += rr1s;
      open += voice.open.step;
      tilt += voice.tilt.step;
      tilt_again += voice.tilt_again.step;
      level += voice.force.step;
      air += voice.air.step;
      dry += voice.dry.step;
      thin += voice.thin.step;
      depth1 += voice.slot[0].depth.step;
      trim1 += voice.slot[0].trim.step;
      depth2 += voice.slot[1].depth.step;
      trim2 += voice.slot[1].trim.step;
    }

    voice.env = env;
    voice.phase = phase;
    voice.count1 = count1;
    voice.count2 = count2;
    voice.left.value = left;
    voice.right.value = right;
    voice.door.value = door;
    voice.ring_left[0].value = rl0;
    voice.ring_left[1].value = rl1;
    voice.ring_right[0].value = rr0;
    voice.ring_right[1].value = rr1;
    voice.re[0] = re0;
    voice.re[1] = re1;
    voice.im[0] = im0;
    voice.im[1] = im1;
    voice.open.value = open;
    voice.tilt.value = tilt;
    voice.tilt_again.value = tilt_again;
    voice.fell_left = fell_left;
    voice.fell_right = fell_right;
    voice.force.value = level;
    voice.air.value = air;
    voice.dry.value = dry;
    voice.thin.value = thin;
    voice.thin_left = thin_left;
    voice.thin_right = thin_right;
    voice.low_left = low_left;
    voice.low_right = low_right;
    voice.soft_left = soft_left;
    voice.soft_right = soft_right;
    voice.slot[0].depth.value = depth1;
    voice.slot[0].trim.value = trim1;
    voice.slot[1].depth.value = depth2;
    voice.slot[1].trim.value = trim2;
    voice.tilt_left = tilt_left;
    voice.tilt_right = tilt_right;
    voice.air_left = air_left;
    voice.air_right = air_right;
    if (voice.fade_left > 0) voice.fade_left -= count;
  }

  int division() const { return kit::clamp_int(static_cast<int>(param(undervoice::kDivision) + 0.5f), 0, kDivisions - 1); }

  Colour colour_for(int slot, int n) const {
    if (slot == 0 && undervoice_dsp::kDivide[division()] == 0) return undervoice_dsp::kPurr;
    return undervoice_dsp::colour_at(n);
  }
  // How many pulses of `hz` a group of the given slot has.
  int divide_for(int slot, float hz) const {
    if (slot == 1) return kit::clamp_int(static_cast<int>(param(undervoice::kSecond) + 0.5f), 1, 8);
    const int n = undervoice_dsp::kDivide[division()];
    if (n == 32) {
      // Drips: the power of two that brings the key down to where its pulses
      // can be counted, two to four a second.
      int many = 32;
      while (hz / static_cast<float>(many) > kDripMost && many < 2048) many *= 2;
      return many;
    }
    if (n > 0) return n;
    return kit::clamp_int(static_cast<int>(hz / pulse_hz_ + 0.5f), 1, 1024);
  }

  // The pulse the keys that sound agree on best: the one that divides each
  // of them into a whole number with the least left over, in shares of the
  // pulse's own step, leaning to the middle of the range.
  void fit_pulse() {
    if (undervoice_dsp::kDivide[division()] != 0) return;
    float best = 1.0e9f, found = kPulseMiddle;
    bool any = false;
    for (float pulse = kPulseLow; pulse <= kPulseHigh; pulse *= 1.004f) {
      float cost = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        const Voice& voice = pool_.voices[v];
        if (!voice.env.active() || voice.releasing() || voice.pending) continue;
        any = true;
        const float turns = voice.hz / pulse;
        const float whole = std::floor(turns + 0.5f);
        const float off = std::fabs(turns - whole) / kit::max(whole, 1.0f);
        cost += off;
      }
      const float lean = std::fabs(std::log2(pulse / kPulseMiddle));
      cost += 0.004f * lean;
      if (cost < best) {
        best = cost;
        found = pulse;
      }
    }
    if (any) pulse_hz_ = found;
  }

  // Start a note in a voice that is silent.
  void start(Voice& voice, int index, float frequency, float gain) {
    using namespace undervoice;
    using namespace undervoice_dsp;
    const float sr = sample_rate();
    undervoice_dsp::silence(voice);
    voice.pending = false;
    voice.damped = false;
    voice.hz = frequency;
    voice.gain = gain;
    voice.amp = 0.3f + 0.7f * gain;
    voice.age = 0.0f;
    voice.fell_left = voice.fell_right = 0.0f;
    voice.tilt_left = voice.tilt_right = voice.thin_left = voice.thin_right = 0.0f;
    voice.low_left = voice.low_right = voice.soft_left = voice.soft_right = 0.0f;
    voice.thin_coeff = std::exp(-kit::kTwoPi * kit::min(2.6f * frequency, 0.2f * sr) / sr);
    voice.env.set(param(kAttack), fade_seconds(), fade_level(), param(kRelease));
    voice.env.gate_on();
    voice.ringing = true;
    // The door goes through a chord from key to key, not all at once.
    voice.flip_turn = -0.07f * static_cast<float>(keys_ % 5);
    voice.breath_turn = 0.22f * start_.bipolar() * (keys_ > 0 ? 1.0f : 0.0f);
    ++keys_;
    fit_pulse();
    for (int s = 0; s < 2; ++s) {
      Slot& slot = voice.slot[s];
      slot.n = slot.want = divide_for(s, frequency);
      slot.play = 1.0f;
      slot.colour = colour_for(s, slot.n);
      slot.trim_depth = -1.0f;
    }
    for (int s = 0; s < kLanes; ++s) {
      voice.phase[s] = s == 0 && keys_ < 2 ? 0.0f : start_.uniform() * 0.98f;
      voice.jitter[s] = 1.0f;
      voice.shimmer[s] = 1.0f;
      voice.group[s] = 1.0f;
      const float n = static_cast<float>(voice.slot[0].n), m = static_cast<float>(voice.slot[1].n);
      const bool shared = undervoice_dsp::kDivide[division()] == 0;
      const float turn = shared ? pulse_phase_ : kTurns[s];
      voice.count1[s] = kit::min(std::floor(turn * n), n - 1.0f);
      voice.count2[s] = kit::min(std::floor(kTurns[s] * m), m - 1.0f);
    }
    for (int k = 2; k < kRings; ++k) undervoice_dsp::aim_ring(voice, k, frequency * static_cast<float>(k - 1), sr);
    for (int s = 0; s < 2; ++s) undervoice_dsp::aim_ring(voice, s, floor_hz(frequency, voice.slot[s].n), sr);
    voice.ring_seconds = -1.0f;
    voice.pan_width = -1.0f;
    even_out(voice);
    crowds();
    tune(voice, index, true);
  }

  void even_out(Voice& voice) {
    const float drip = voice.drip, rung = kit::max(drip, ring_ * ring_);
    float power = tract_.power(voice.hz, undervoice_dsp::tilt_for(voice.hz, closure_) * std::exp2(struck_), undervoice_dsp::kTiltAgain, [drip, rung](int h) {
      if (h >= undervoice_dsp::kDropped) return 1.0f - rung;
      const float ring = undervoice_dsp::drip_tilt(h, 1.0f);
      return 1.0f + drip * (ring * ring - 1.0f);
    });
    float under[2];
    for (int s = 0; s < 2; ++s) {
      under[s] = tract_.power_at(undervoice_dsp::floor_hz(voice.hz, voice.slot[s].n));
      // The second division counts as far as it is heard.
      if (voice.slot[s].n > 1) power += (s == 0 ? 0.06f : 0.06f * kit::min(turning_ + breathing_, 1.0f)) * under[s];
    }
    // High keys have less to be heard by.
    const float high = kit::clamp(std::log2(voice.hz * (1.0f / 400.0f)), 0.0f, 1.2f);
    voice.evened = (1.0f + 0.25f * high) / std::sqrt(power);
    for (int s = 0; s < 2; ++s) voice.floor_even[s] = 1.0f / (voice.evened * std::sqrt(under[s]));
  }

  // Fade is one knob over a decay and the level it leaves: under six seconds
  // every note dies away, above that it keeps more and more of itself.
  float fade_seconds() const { return param(undervoice::kFade); }
  float fade_level() const { return kit::clamp((std::log2(param(undervoice::kFade)) - 2.585f) * (1.0f / 2.3f), 0.0f, 1.0f); }

  // A full chord makes room for its keys: ten of them at their hardest come
  // out 6 dB under what ten times one would be, two or three hardly under it.
  void fill(bool snap) {
    float sum = 0.0f;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = pool_.voices[v];
      if (!voice.active()) continue;
      const float amp = voice.pending ? 0.3f + 0.7f * voice.next_gain : voice.amp * (voice.releasing() ? voice.env.level() : 1.0f);
      sum += amp * amp;
    }
    const float room = 1.0f / std::sqrt(1.0f + 0.3f * kit::max(sum - 1.0f, 0.0f));
    if (snap) {
      room_.snap(room);
    } else {
      room_.head(room, room < room_.aim ? room_down_ : room_up_);
    }
  }

  // Low keys that stand close together gate less deeply.
  void crowds() {
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.active()) continue;
      const float low = kit::clamp((300.0f - voice.hz) * (1.0f / 160.0f), 0.0f, 1.0f);
      float sum = 0.0f;
      if (low > 0.0f) {
        for (int o = 0; o < kMaxVoices; ++o) {
          const Voice& other = pool_.voices[o];
          if (o == v || !other.env.active() || other.releasing()) continue;
          const float gap = (other.hz - voice.hz) * (1.0f / 42.0f);
          if (std::fabs(other.hz - voice.hz) < 0.5f) continue;
          sum += std::exp(-gap * gap);
        }
      }
      voice.crowd = 1.0f / (1.0f + 0.75f * low * sum);
    }
  }

  // Every 32 samples for a sounding key (and once as it starts, with `snap`).
  void tune(Voice& voice, int index, bool snap) {
    using namespace undervoice;
    using namespace undervoice_dsp;
    const float sr = sample_rate();
    const float dt = 1.0f / control_rate_;
    voice.age += dt;

    // Pitch: each singer a little apart, and wandering.
    const float drift = drift_, spread = 2.2f + 9.0f * drift;
    const float others = kit::clamp(singers_ - 1.0f, 0.0f, 1.0f);
    for (int s = 0; s < kLanes; ++s) {
      const float cents = spread * kSpread[s] * others + 11.0f * drift * voice.wander[s].next(1);
      const float x = cents * (0.69314718f / 1200.0f);
      const float inc = kit::min(voice.hz * (1.0f + x + 0.5f * x * x) / sr, 0.24f);
      voice.increment[s] = inc;
      voice.per_increment[s] = 1.0f / inc;
    }

    // Which door is open.
    F4 door = splat(0.0f);
    float share = 0.0f;
    for (int s = 0; s < kLanes; ++s) {
      const float apart = static_cast<float>(s & 1) * kit::min(drift, 0.5f);
      const float swing = 0.5f - 1.5f * kit::SineTable::cos_lookup(1.0f + flip_phase_ + voice.flip_turn + apart);
      const float t = kit::clamp(swing, 0.0f, 1.0f);
      door[s] = turning_ * t * t * (3.0f - 2.0f * t);
      share += 0.25f * door[s];
    }
    // The breath: out loud and full, in quiet and dark on the second division.
    voice.breath_turn -= voice.breath_turn * dt * (1.0f / 7.0f);
    float ph = flip_phase_ + voice.breath_turn;
    ph -= std::floor(ph);
    const float out = ph < 0.62f ? kit::SineTable::lookup(ph * (0.5f / 0.62f)) : 0.0f;
    const float in = ph < 0.62f ? 0.0f : kit::SineTable::lookup((ph - 0.62f) * (0.5f / 0.38f));
    const float breath = 1.0f + breathing_ * (0.05f + 1.1f * out + 0.22f * in - 1.0f);
    const float hush = 1.0f - 0.8f * breathing_ * in;
    const float sigh = 1.0f + 6.0f * breathing_ * in;
    if (in > 0.0f && breathing_ > 0.0f) {
      const float to = breathing_ * kit::min(2.0f * in, 1.0f);
      door += (splat(1.0f) - door) * to;
      share += (1.0f - share) * to;
    }

    // The two gates. A division that changes is shut first, then swapped.
    // What the folds are like follows how far they shut: with none of it every
    // division is the open voice.
    const Colour& open_voice = undervoice_dsp::kColour[0];
    const float most = std::pow(kit::min(depth_ * (1.0f / 0.7f), 1.0f), 0.75f);
    for (int s = 0; s < 2; ++s) {
      Slot& slot = voice.slot[s];
      slot.want = divide_for(s, voice.hz);
      if (slot.n != slot.want && undervoice_dsp::kDivide[division()] == 0 && s == 0 && slot.n > 4 && std::abs(slot.n - slot.want) * 60 < slot.n) {
        slot.want = slot.n;  // near enough to the shared pulse
      }
      if (slot.n != slot.want) {
        slot.play = kit::max(slot.play - dt / kSlotSeconds, 0.0f);
        if (slot.play <= 0.0f && slot.depth.value == 0.0f && slot.depth.step == 0.0f) {
          slot.n = slot.want;
          slot.colour = colour_for(s, slot.n);
          slot.trim_depth = -1.0f;
          const float n = static_cast<float>(slot.n);
          F4& count = s == 0 ? voice.count1 : voice.count2;
          for (int k = 0; k < kLanes; ++k) {
            count[k] = std::fmod(count[k], n);
            if (s == 0 && undervoice_dsp::kDivide[division()] == 0) count[k] = kit::min(std::floor(pulse_phase_ * n), n - 1.0f);
          }
          undervoice_dsp::aim_ring(voice, s, floor_hz(voice.hz, slot.n), sr);
          voice.ring_seconds = -1.0f;
        }
      } else if (slot.play < 1.0f) {
        slot.play = kit::min(slot.play + dt / kSlotSeconds, 1.0f);
      }
      // With nothing to count the false folds shut within each pulse.
      const float shut = slot.n > 1 ? voice.crowd : (s == 0 ? kShutOne * kit::clamp((1800.0f - voice.hz) * (1.0f / 1200.0f), 0.0f, 1.0f) : 0.0f);
      const float depth = most * shut * slot.play;
      const float shade = most * slot.play;
      if (depth != slot.trim_depth || narrow_ != slot.trim_narrow || shade != slot.shade) {
        slot.shade = shade;
        slot.trim_depth = depth;
        slot.trim_narrow = narrow_;
        slot.trim_now = kit::lerp(open_voice.trim, slot.colour.trim, shade) * std::pow(undervoice_dsp::hump_power(depth, narrow_, slot.colour.sharp), -0.45f);
      }
      const float trim = slot.trim_now;
      if (snap) {
        slot.depth.snap(depth);
        slot.trim.snap(trim);
      } else {
        slot.depth.head(depth, gain_coeff_);
        if (slot.play <= 0.0f && slot.depth.aim < 1.0e-4f) {
          slot.depth.aim = 0.0f;
          slot.depth.step = -slot.depth.value * (1.0f / static_cast<float>(kControlPeriod));
        }
        slot.trim.head(trim, gain_coeff_);
      }
    }

    const Slot &first = voice.slot[0], &second = voice.slot[1];
    const Colour colour = undervoice_dsp::mixed(undervoice_dsp::mixed(open_voice, first.colour, first.shade), undervoice_dsp::mixed(open_voice, second.colour, second.shade), share);
    voice.drip = colour.drip;

    // How hard the folds meet: the knob, the touch, and the envelope.
    const float touch = voice.gain - 0.7f;
    const float closure = kit::clamp(closure_ + 0.42f * touch, 0.0f, 1.0f);
    const float lift = voice.env.level();
    const float tilt_hz = kit::min(undervoice_dsp::tilt_for(voice.hz, closure) * (0.45f + 0.55f * lift) * hush * std::exp2(colour.edge + struck_ + 1.1f * touch + 0.9f * rough_), 0.42f * sr);
    const float tilt = std::exp(-kit::kTwoPi * kit::max(tilt_hz, 60.0f) / sr);
    const float tilt_again = std::exp(-kit::kTwoPi * kit::min(kTiltAgain * kit::max(tilt_hz, 60.0f), 0.45f * sr) / sr);
    const float open = 0.84f - 0.5f * closure;

    // Gains.
    const float spoken = 1.0f - 0.88f * whisper_ * whisper_;
    const float level = kVoiceGain * voice.amp * (1.0f + 0.35f * touch) * breath;
    if (width_ != voice.pan_width || others != voice.pan_others) pan(voice, index, others);
    F4 left, right;
    for (int s = 0; s < kLanes; ++s) {
      const float sung = weight_[s] * voice.evened * spoken;
      left[s] = voice.pan_left[s] * sung;
      right[s] = voice.pan_right[s] * sung;
    }
    const float air_gain = kAirGain * whisper_ * sigh * (colour.air + (1.0f - kit::min(colour.air, 1.0f)) * whisper_ * whisper_ * (1.0f - 0.5f * colour.drip)) * air_even_;

    // The rings.
    float seconds = ring_seconds_ * (1.0f + 0.3f * colour.drip);
    if (voice.damped) {
      seconds = kit::min(seconds, 0.12f);
    } else if (voice.releasing()) {
      seconds = kit::min(seconds, kit::max(param(kRelease) * 0.9f, 0.05f));
    }
    if (seconds != voice.ring_seconds) ring_times(voice, seconds, sr);
    F4 ring_left[2], ring_right[2];
    const float ring_gain = ring_gain_ + (kDripGain - ring_gain_) * colour.drip;
    const float dry = dry_ + (0.4f * (1.0f - 0.8f * ring_) - dry_) * colour.drip;
    const float floor_gain = kFloorGain * (0.15f + 0.85f * chest_amount_) * chest_amount_ * depth_ * (0.65f + 0.6f * depth_ * depth_) * std::sqrt(voice.crowd);
    for (int k = 0; k < kRings; ++k) {
      float gain;
      if (k < 2) {
        const float under = floor_hz(voice.hz, voice.slot[k].n);
        gain = floor_gain * voice.floor_even[k] * voice.slot[k].colour.floor * kit::clamp((700.0f - under) * (1.0f / 400.0f), 0.0f, 1.0f);
        gain *= k == 0 ? 1.0f - share : share;
      } else {
        const float hz = voice.hz * static_cast<float>(k - 1);
        gain = ring_gain * undervoice_dsp::drip_tilt(k - 1, colour.drip) * kit::clamp((7000.0f - hz) * (1.0f / 3000.0f), 0.0f, 1.0f);
      }
      ring_left[k >> 2][k & 3] = gain * voice.ring_pan_left[k];
      ring_right[k >> 2][k & 3] = gain * voice.ring_pan_right[k];
    }

    if (snap) {
      voice.left.snap(left);
      voice.right.snap(right);
      voice.door.snap(door);
      voice.open.snap(open);
      voice.tilt.snap(tilt);
      voice.tilt_again.snap(tilt_again);
      voice.force.snap(level);
      voice.air.snap(air_gain);
      voice.dry.snap(dry);
      voice.thin.snap(colour.thin);
      for (int b = 0; b < 2; ++b) {
        voice.ring_left[b].snap(ring_left[b]);
        voice.ring_right[b].snap(ring_right[b]);
      }
    } else {
      voice.left.head(left, gain_coeff_);
      voice.right.head(right, gain_coeff_);
      voice.door.head(door, gain_coeff_);
      voice.open.head(open, gain_coeff_);
      voice.tilt.head(tilt, gain_coeff_);
      voice.tilt_again.head(tilt_again, gain_coeff_);
      voice.force.head(level, gain_coeff_);
      voice.air.head(air_gain, gain_coeff_);
      voice.dry.head(dry, gain_coeff_);
      voice.thin.head(colour.thin, gain_coeff_);
      for (int b = 0; b < 2; ++b) {
        voice.ring_left[b].head(ring_left[b], gain_coeff_);
        voice.ring_right[b].head(ring_right[b], gain_coeff_);
      }
    }
  }

  // Where a key, its singers and its rings stand.
  void pan(Voice& voice, int index, float others) {
    voice.pan_width = width_;
    voice.pan_others = others;
    const float place = kKeyPlace[index] * width_ * 0.9f;
    for (int s = 0; s < kLanes; ++s) {
      kit::pan_gains(place + kPlace[s] * width_ * others, &voice.pan_left[s], &voice.pan_right[s]);
    }
    for (int k = 0; k < kRings; ++k) {
      kit::pan_gains(place + kRingPlace[k] * width_, &voice.ring_pan_left[k], &voice.ring_pan_right[k]);
    }
  }

  // The rings of a key ring for `seconds` (60 dB), those of its floors as
  // long as a floor needs to be a tone.
  static void ring_times(Voice& voice, float seconds, float sr) {
    voice.ring_seconds = seconds;
    const float decay = std::exp(-6.9077553f / (seconds * sr));
    const float floor_seconds = kit::min(kFloorSeconds, kit::max(seconds, 0.12f));
    const float floor_decay = std::exp(-6.9077553f / (floor_seconds * sr));
    const float rest = kit::min(1.0f - decay, 1.0f);
    const float middle = 6.9077553f / (0.4f * sr);
    const float feed = 0.5f * middle * std::pow(rest / middle, kRingFeed);
    for (int k = 0; k < kRings; ++k) {
      const float d = k < 2 ? floor_decay : decay;
      voice.turn_re[k >> 2][k & 3] = d * voice.turn_cos[k];
      voice.turn_im[k >> 2][k & 3] = d * voice.turn_sin[k];
      voice.feed[k >> 2][k & 3] = k < 2 ? 0.5f * (1.0f - floor_decay) : feed;
    }
  }

  // What every key shares, on the control clock.
  void globals(bool snap) {
    using namespace undervoice;
    using namespace undervoice_dsp;
    const auto follow = [&](float* value, float target, float coeff) {
      if (snap || std::fabs(target - *value) < 1.0e-6f) {
        *value = target;
      } else {
        *value += (target - *value) * coeff;
      }
    };
    follow(&depth_, param(kDepth), gain_coeff_);
    follow(&closure_, param(kClosure), gain_coeff_);
    follow(&vowel_, param(kVowel), slow_coeff_);
    follow(&mouth_, param(kMouth), slow_coeff_);
    const Posture& stand = undervoice_dsp::kPosture[division()];
    follow(&posture_.size, stand.size, slow_coeff_);
    follow(&posture_.lips, stand.lips, slow_coeff_);
    follow(&posture_.vowel, stand.vowel, slow_coeff_);
    follow(&posture_.chest, stand.chest, slow_coeff_);
    follow(&throat_, param(kThroat), slow_coeff_);
    follow(&ring_, param(kRing), slow_coeff_);
    follow(&whisper_, param(kWhisper), gain_coeff_);
    follow(&rough_, param(kRoughness), slow_coeff_);
    follow(&drift_, param(kDrift), slow_coeff_);
    follow(&width_, param(kWidth) * (0.6f + 0.4f * param(kWidth)) * stand.width, slow_coeff_);
    follow(&chest_amount_, param(kChest), gain_coeff_);
    chest_.set(kChestGain * param(kChest) * stand.chest, !snap);
    follow(&turning_, param(kTurn), slow_coeff_);
    follow(&breathing_, param(kBreath), slow_coeff_);
    follow(&singers_, param(kSingers), slow_coeff_);
    follow(&skew_, skew_aim_, slow_coeff_);
    follow(&struck_, 2.4f * (0.2f - param(kSkew)), slow_coeff_);  // what is struck is bright

    // The hump of this control period, sample by sample.
    const float rise = skew_;
    const float narrow = kit::clamp((depth_ - 0.5f) * 2.0f, 0.0f, 1.0f);
    if (snap || rise != rise_ || narrow != narrow_ || hump_moving_) {
      const float from_rise = snap ? rise : rise_, from_narrow = snap ? narrow : narrow_;
      hump_moving_ = rise != from_rise || narrow != from_narrow;
      for (int i = 0; i < kControlPeriod; ++i) {
        const float t = static_cast<float>(i + 1) * (1.0f / static_cast<float>(kControlPeriod));
        hump_[i].set(kit::lerp(from_rise, rise, t), kit::lerp(from_narrow, narrow, t));
      }
      rise_ = rise;
      narrow_ = narrow;
    }

    // The section: whole singers from one to the count, one power.
    float power = 0.0f;
    for (int s = 0; s < kLanes; ++s) {
      const float here = kit::clamp(singers_ - static_cast<float>(s), 0.0f, 1.0f);
      power += here * here;
      weight_[s] = here;
    }
    const float even = 1.0f / std::sqrt(power);
    for (int s = 0; s < kLanes; ++s) weight_[s] *= even;

    const float rough = rough_ * std::sqrt(rough_);
    jitter_ = 0.0015f * drift_ + 0.032f * rough;
    shimmer_ = 0.02f * drift_ + 0.75f * rough;
    unlike_ = 0.85f * rough_;
    ring_seconds_ = 0.05f * std::exp2(6.3f * ring_);
    ring_gain_ = kRingGain * std::pow(ring_, 0.75f) * (1.0f + 1.1f * ring_);
    dry_ = 1.0f - 0.97f * ring_ * (1.6f - 0.6f * ring_);

    // The mouth goes with the door: it opens as the second division comes.
    const float swing = turning_ * (0.5f - 0.5f * kit::SineTable::cos_lookup(flip_phase_ + 0.9f));
    float vowel = vowel_ + 4.0f * posture_.vowel * vowel_ * (1.0f - vowel_) + 0.11f * swing + 0.07f * drift_ * vowel_drift_.next(1);
    if (vowel < 0.0f) vowel = -vowel;
    if (vowel > 1.0f) vowel = 2.0f - vowel;
    const float mouth = kit::clamp(mouth_ + 0.14f * (swing - 0.3f * turning_) + 0.1f * drift_ * mouth_drift_.next(1), 0.0f, 1.0f);
    tract_.set(vowel, throat_ * posture_.size, mouth, kit::clamp(480.0f * std::exp2(5.0f * mouth + posture_.lips), 250.0f, 0.4f * sample_rate()));
    tract_.spread(kit::min(width_, 1.0f));
    kit::pan_gains(2.0f * kit::min(width_, 1.0f) - 1.0f, &air_same_, &air_side_);
    air_even_ = std::sqrt(sample_rate() / tract_.noise_power());
  }

  void control() {
    using namespace undervoice;
    const float dt = 1.0f / control_rate_;
    if (!fresh_) {
      flip_phase_ += param(kPace) * dt;
      flip_phase_ -= std::floor(flip_phase_);
      pulse_phase_ += pulse_hz_ * dt;
      pulse_phase_ -= std::floor(pulse_phase_);
      globals(false);
    }
    if (fresh_) fill(true);
    fresh_ = false;
    fill(false);
    // One key a tick is levelled anew, and the crowd counted now and then.
    Voice& turn = pool_.voices[turn_];
    if (turn.active() && !turn.pending) even_out(turn);
    if (++turn_ >= kMaxVoices) {
      turn_ = 0;
      crowds();
      fit_pulse();
    }
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.active()) continue;
      voice.env.set(param(kAttack), fade_seconds(), fade_level(), param(kRelease));
      tune(voice, v, false);
      if (!voice.env.active() && voice.ringing && !voice.pending) {
        float most = voice.tilt_left * voice.tilt_left + voice.tilt_right * voice.tilt_right;
        for (int b = 0; b < 2; ++b) {
          const F4 size = voice.re[b] * voice.re[b] + voice.im[b] * voice.im[b];
          most += undervoice_dsp::sum_of(size);
        }
        if (most < 1.0e-13f && voice.fade_left == 0) undervoice_dsp::silence(voice);
      }
    }
  }

  // Nothing sounds (init, or the first note after a silence): what moved in
  // the silence has arrived, and what runs by itself starts from its start.
  void restart() {
    volume_.snap(volume_.target);
    tract_.reset();
    for (int c = 0; c < 2; ++c) rumble_[c].reset();
    flip_phase_ = 0.0f;
    pulse_phase_ = 0.0f;
    pulse_hz_ = kPulseMiddle;
    keys_ = 0;
    turn_ = 0;
    fresh_ = true;
    vowel_drift_.seed(0x13579BDFu);
    mouth_drift_.seed(0x2468ACE1u);
    clock_.reset(kControlPeriod);
    globals(true);
  }

  void apply(int id) {
    using namespace undervoice;
    const float value = param(id);
    switch (id) {
      case kSkew:
        skew_aim_ = 0.015f + 0.965f * std::pow(value, 1.15f);
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  undervoice_dsp::Tract tract_;
  undervoice_dsp::Hump hump_[kControlPeriod];
  kit::Smoother volume_, chest_;
  kit::DcBlocker rumble_[2];
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  kit::Rng start_;
  kit::Drift vowel_drift_, mouth_drift_;
  undervoice_dsp::Ramp room_;
  float room_down_ = 0.05f, room_up_ = 0.002f;
  float weight_[kLanes] = {1.0f, 0.0f, 0.0f, 0.0f};
  float control_rate_ = 1500.0f, gain_coeff_ = 0.1f, slow_coeff_ = 0.02f;
  float air_even_ = 1.0f, air_low_ = 0.9f, air_high_ = 0.7f, air_same_ = 1.0f, air_side_ = 0.0f;
  float depth_ = 0.0f, closure_ = 0.0f, vowel_ = 0.0f, mouth_ = 0.0f, throat_ = 1.0f, ring_ = 0.0f;
  float whisper_ = 0.0f, rough_ = 0.0f, drift_ = 0.0f, width_ = 0.0f, chest_amount_ = 0.0f, singers_ = 1.0f;
  Posture posture_ = undervoice_dsp::kPosture[0];
  float turning_ = 0.0f, breathing_ = 0.0f;
  float skew_aim_ = 0.15f, skew_ = 0.3f, struck_ = 0.0f, rise_ = 0.3f, narrow_ = 0.0f;
  float jitter_ = 0.0f, shimmer_ = 0.0f, unlike_ = 0.0f;
  float ring_seconds_ = 0.1f, ring_gain_ = 0.0f, dry_ = 1.0f;
  float flip_phase_ = 0.0f, pulse_phase_ = 0.0f, pulse_hz_ = kPulseMiddle;
  int steal_samples_ = 240, keys_ = 0, turn_ = 0, stretch_ = 0;
  bool hump_moving_ = false, fresh_ = true;
};

}  // namespace livemix
