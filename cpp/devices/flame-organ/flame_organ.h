#pragma once

// Flame Organ: a flame burns inside a tube, and the tube sings.
//
//   per key (up to 12):
//     twelve modes of the tube ──► the air at the flame (Place, Lag)
//           ▲                              │ + turbulence (Roar, Fuel)
//           │                              ▼
//           └──── feed (Place) ◄── the flame's heat: a curve that is out below
//                                  and full above (Flame, Fuel, Flicker)
//     a second tube and flame a little off, the two hearing each other (Between)
//     the glass of the tube, tapped as it is lit (Glass)
//     the heat itself, and the rush of the burning (Tube, Fuel, Roar)
//   all keys ──► the tube's own body ──► Mouth ──► Width ──► volume ──► soft clip
//
// - Nothing here is told which harmonic to play. A mode grows when the heat
//   comes at the right moment for it and dies when it comes at the wrong one:
//   for harmonic n that is sin(2 pi n lag) sin(2 pi n place). The lag is a
//   share of the key's period, kept as a turn of each mode's phase, so a
//   setting sounds the same on every key. What sings is always a mode of the
//   tube, so every jump lands on a harmonic of the key.
// - The strongest mode is always brought over the threshold by the same
//   factor, so there is no corner of Lag and Place where nothing sings.
// - A flame out of step with its tube pulls its pitch. A slow ear in each
//   voice compares the turn of the loudest mode with the key and bends the
//   tube back, so the note is in tune whatever the flame does.
// - Two flames hear each other's air. Close together they are nearly one pitch
//   and strongly coupled, and lock; apart they are further out of tune and
//   coupled less, so they slip, pull and at last beat.

#include "../../kit/kit.h"
#include "flame_bank.h"
#include "flame_levels.h"
#include "flame_tables.h"
#include "params.gen.h"

namespace livemix {

class FlameOrgan : public kit::DeviceBase<flame_organ::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kControlPeriod = 64;

  void init(float sample_rate) {
    using namespace flame_organ;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    tick_ = static_cast<float>(kControlPeriod) / sr;
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    for (kit::Smoother& knob : knobs_) knob.set_time(kKnobSeconds, control_rate);
    volume_.set_time(kSmoothingSeconds, sr);
    width_.set_time(0.02f, sr);
    noise_scale_ = std::sqrt(sr / 48000.0f);
    steal_ticks_ = static_cast<int>(0.005f * control_rate) + 1;
    pool_.reset();
    for (Voice& voice : pool_.voices) voice = Voice();
    chance_.seed(0x3C6EF372u);
    for (int i = 0; i < kNumParams; ++i) apply(i);
    until_tick_ = 0;
    tube_ = tube_param();
    idle_.reset(sr, 0.08f);
    dc_[0].set_cutoff(18.0f, sr);
    dc_[1].set_cutoff(18.0f, sr);
    arrivals_ = 0;
    arrive();
    arrivals_ = 0;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 16.0f, kit::min(9000.0f, 0.3f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (pool_.count_active() == 0) arrive();
    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.waiting > 0) {  // not begun yet: the waiting note is this one
        again.next_hz = frequency;
        again.next_gain = gain;
        return;
      }
      again.released = true;
      again.hush = true;
    }
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.next_hz = frequency;
    voice.next_gain = gain;
    voice.released = false;
    voice.hush = false;
    if (!stolen) {
      voice.waiting = 0;
      begin(voice);
    } else if (voice.waiting == 0) {
      voice.waiting = steal_ticks_ + 1;
      voice.fade_from = voice.waiting;
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].released = true;
  }

  // What the display is told of the newest key, as it was left by its last tick.
  enum Meter : int { kMeterKey = 0, kMeterBurning, kMeterAir, kMeterSings, kMeterLift, kMeterLag, kMeterPlace };
  float meter(int index) const {
    const Voice* newest = nullptr;
    for (const Voice& voice : pool_.voices) {
      if (voice.on && voice.waiting == 0 && (newest == nullptr || voice.fresh <= newest->fresh)) newest = &voice;
    }
    if (newest == nullptr) return 0.0f;
    switch (index) {
      case kMeterKey: return newest->hz;
      case kMeterBurning: return newest->burns;
      case kMeterAir: return newest->swing[0];
      case kMeterSings: return newest->pipe[0].ratio[newest->pipe[0].singer[0]];
      case kMeterLift: return newest->lift;
      case kMeterLag: return newest->lag;
      case kMeterPlace: return newest->place;
      default: return 0.0f;
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
      if (until_tick_ == 0) {
        until_tick_ = kControlPeriod;
        control();
      }
      const int count = kit::clamp_int(frames - done, 1, until_tick_);
      render(done, count);
      until_tick_ -= count;
      done += count;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  using Bank = flame_organ::Bank;
  using Line = flame_organ::Line;
  using Four = flame_organ::Four;
  static constexpr int kModes = flame_organ::kModes;
  static constexpr int kEars = 4;

  // The knobs that move on the control clock.
  enum Knob { kFlameK, kLagK, kPlaceK, kSecondK, kBetweenK, kFlickerK, kRoarK, kDraughtK, kLiftK, kGlassK, kMouthK, kKnobCount };

  static constexpr float kVoiceGain = 0.25f;
  static constexpr float kKnobSeconds = 0.02f;
  static constexpr float kBandLimit = 0.40f;   // of the sample rate: no mode above it
  static constexpr float kHighest = 5.5f;     // no harmonic over this may take the note
  static constexpr float kTopHz = 11000.0f;
  static constexpr float kNearly = 0.84f;      // how near a flame is to singing before it catches
  static constexpr float kGone = 1.0e-5f;      // a voice this quiet is over
  static constexpr float kEarSeconds = 0.10f;  // how slowly the ear bends the tube back
  static constexpr float kEarMost = 0.04f;     // and how far

  // One tube with its flame.
  struct Pipe {
    Bank bank;
    float ratio[kModes] = {}, octave[kModes] = {}, more[kModes] = {};
    float tilt = 9.0f, loud = 0.5f, sung = 1.0f;
    float cosine[kModes] = {}, sine[kModes] = {};  // of each mode's step a sample
    float ahead_cos[kModes] = {}, ahead_sin[kModes] = {};  // and of a step and a half
    int singer[2] = {0, flame_organ::kTwin};  // the mode that has the note, and a double tube's lower one
    float loss[kModes] = {};                       // of each mode a sample
    int modes = 0;
    float offset = 0.0f;   // how far out of tune this pipe is meant to be
    float gain = 1.0f;     // how steeply the flame answers
    // The ear.
    float heard[kEars] = {}, last_re[kEars] = {}, last_im[kEars] = {};
    int ear[kEars] = {-1, -1, -1, -1};  // the mode each of them listens to
    float error[kEars] = {};
    // The flame by itself.
    float under = 0.0f, direct = 0.0f, direct2 = 0.0f;
    flame_organ::Flame flame, low_flame;

    // How far the air at the flame swings.
    float swing(int from, int to) const {
      float power = 0.0f;
      for (int g = from; g < to && g < bank.groups; ++g) {
        const Four a = bank.re[g] * bank.re[g] + bank.im[g] * bank.im[g];
        power += flame_organ::across(a * (bank.see_re[g] * bank.see_re[g] + bank.see_im[g] * bank.see_im[g]));
      }
      return std::sqrt(power);
    }

    void clear() {
      bank.clear();
      for (int e = 0; e < kEars; ++e) {
        error[e] = heard[e] = last_re[e] = last_im[e] = 0.0f;
        ear[e] = -1;
      }
      under = direct = direct2 = 0.0f;
      flame = low_flame = flame_organ::Flame();
      singer[0] = 0;
      singer[1] = flame_organ::kTwin;
    }
  };

  struct Voice {
    Pipe pipe[2];
    Bank ring;  // the glass
    bool on = false, released = false, hush = false;
    bool ringing = false;
    float hz = 220.0f, gain = 0.0f;
    float octaves = 0.0f;     // over E4, for the level
    float sung = 0.0f;        // and by how much the harmonic that sings is over the key
    double base = 0.0;        // radians a sample
    float attack = 0.0f;      // the opening of the voice, 0 to 1
    float attack_step = 1.0f;
    float lit = 0.0f;         // how far the flame has caught
    float fuel = 1.0f;        // what is left to burn
    float gate = 1.0f;        // falls when the key is let go
    float tune[kModes] = {};  // what the ear adds to each of the modes
    float age = 0.0f;
    float lift = 0.0f;
    float even[2] = {1.0f, 1.0f};
    float caught = 0.0f;      // how nearly it sings, this key
    float swing[2] = {};      // how far the air at the flame moves, and at a double tube's lower one
    float pop = 0.0f;         // the burst of a quick catch
    float puff = 0.0f;
    float spark = 0.0f;       // a jumping ember
    float spark_next = 1.0f;
    float side = 1.0f;
    float jitter = 0.0f;
    int fresh = 0;            // ticks since the voice began, for the ear
    int waiting = 0, fade_from = 1;
    float next_hz = 220.0f, next_gain = 0.0f;
    kit::Drift flick, sway;
    kit::Lfo will;            // when it lifts
    kit::Rng rng;
    Line amp, second, flame, bias, low_bias, hiss, shake, glass, direct, tick;
    float edge_keep = 0.0f;
    float couple = 0.0f, tall2 = 1.0f;
    float burns = 0.0f, lag = 0.21f, place = 0.17f;  // as the display is told them

    bool active() const { return on; }
    bool releasing() const { return released; }
    float level() const { return released ? gate * gain : 0.5f + gain; }
  };

  static float fall(float seconds, float tick) { return std::exp(-6.907755f * tick / kit::max(seconds, 1.0e-3f)); }
  static float gentle(float x) {
    x = kit::clamp(x, 0.0f, 1.0f);
    return x * x * (3.0f - 2.0f * x);
  }
  int tube_param() const { return kit::clamp_int(static_cast<int>(param(flame_organ::kTube) + 0.5f), 0, flame_organ::kTubes - 1); }
  int fuel_param() const { return kit::clamp_int(static_cast<int>(param(flame_organ::kFuel) + 0.5f), 0, flame_organ::kFuels - 1); }
  float knob(Knob k) const { return knobs_[k].value; }

  // Cuts the tube to the key: where each mode is and how fast it loses.
  void cut(Voice& voice, Pipe& pipe, bool second) {
    using namespace flame_organ;
    const float sr = sample_rate();
    const Tube& t = tube(tube_);
    const float q_key = t.q * kit::clamp(std::pow(voice.hz / 220.0f, 0.4f), 0.4f, 2.2f);
    pipe.modes = 0;
    pipe.tilt = 9.0f;
    for (int m = 0; m < kModes; ++m) {
      const float n = tube_ratio(tube_, m);
      pipe.ratio[m] = n;
      pipe.octave[m] = std::log2(n);
      const float hz = voice.hz * n;
      const bool in_band = hz < kBandLimit * sr && (hz < kTopHz || m == 0);
      const double angle = voice.base * static_cast<double>(n);
      float out = 0.0f;
      if (in_band) {
        pipe.modes = m + 1;
        pipe.cosine[m] = static_cast<float>(std::cos(angle));
        pipe.sine[m] = static_cast<float>(std::sin(angle));
        pipe.ahead_cos[m] = static_cast<float>(std::cos(1.5 * angle));
        pipe.ahead_sin[m] = static_cast<float>(std::sin(1.5 * angle));
        pipe.loss[m] = static_cast<float>(angle) / (2.0f * q_key * std::pow(n, t.q_tilt));
        out = std::pow(n, t.mouth);
        if (tube_ == 4 && m >= kTwin) out *= 2.3f;  // the longer pipe stands behind
        if (hz > 5000.0f) out *= kit::max(0.0f, 1.0f - (hz - 5000.0f) / 7000.0f);
      } else {
        pipe.cosine[m] = pipe.sine[m] = pipe.ahead_cos[m] = pipe.ahead_sin[m] = pipe.loss[m] = 0.0f;
      }
      // Harmonics step from side to side, the two pipes lean apart.
      float pan = voice.side * ((m & 1) ? 0.55f : -0.35f);
      pan = second ? -pan + 0.35f * voice.side : pan - 0.15f * voice.side;
      float l, r;
      kit::pan_gains(pan * t.spread, &l, &r);
      pipe.bank.left[m >> 2][m & 3] = out * l * 1.41421f;
      pipe.bank.right[m >> 2][m & 3] = out * r * 1.41421f;
    }
    pipe.bank.groups = (pipe.modes + 3) / 4;
  }

  void cut_glass(Voice& voice) {
    using namespace flame_organ;
    const float sr = sample_rate();
    Bank& ring = voice.ring;
    ring.groups = 1;
    for (int m = 0; m < kRings; ++m) {
      const float hz = voice.hz * kRingRatio[m];
      const double angle = voice.base * static_cast<double>(kRingRatio[m]);
      const bool in_band = hz < kit::min(kBandLimit * sr, 9000.0f);
      const float seconds = (2.2f + 6.8f * param(kGlass)) * kit::clamp(std::pow(440.0f / hz, 0.45f), 0.15f, 2.0f);
      const float keep = in_band ? std::exp(-6.907755f / (seconds * sr)) : 0.0f;
      ring.turn_re[0][m] = keep * static_cast<float>(std::cos(angle));
      ring.turn_im[0][m] = keep * static_cast<float>(std::sin(angle));
      ring.feed[0][m] = 0.55f * (1.0f - keep);
      const float phase = voice.rng.uniform();
      const float size = in_band ? kRingLevel[m] * (m == 0 ? 1.0f : 0.35f + 0.9f * voice.gain) : 0.0f;
      ring.re[0][m] = size * kit::SineTable::cos_lookup(phase);
      ring.im[0][m] = size * kit::SineTable::lookup(phase);
      float l, r;
      kit::pan_gains(voice.side * ((m & 1) ? 0.6f : -0.3f), &l, &r);
      ring.left[0][m] = l * 1.41421f;
      ring.right[0][m] = r * 1.41421f;
    }
    voice.ringing = true;
  }

  // Lights the flame a voice has been given, in a silent tube.
  void begin(Voice& voice) {
    using namespace flame_organ;
    voice.on = true;
    voice.hush = false;
    voice.hz = voice.next_hz;
    voice.gain = voice.next_gain;
    voice.base = 6.283185307179586 * static_cast<double>(voice.hz) / static_cast<double>(sample_rate());
    voice.octaves = kit::clamp(std::log2(voice.hz * (1.0f / 330.0f)), -3.0f, 3.0f);
    voice.rng.seed(chance_.next_u32() | 1u);
    voice.flick.seed(voice.rng.next_u32());
    voice.sway.seed(voice.rng.next_u32());
    voice.will.seed(voice.rng.next_u32());
    voice.will.reset(0.0f);
    voice.will.set_rate(0.36f + 0.16f * voice.rng.uniform(), sample_rate());
    voice.side = (started_++ & 1) ? -1.0f : 1.0f;
    const float seconds = param(kCatch);
    voice.attack = 0.0f;
    voice.attack_step = tick_ / kit::clamp(0.12f * seconds, 0.003f, 0.12f);
    voice.lit = 0.0f;
    voice.fuel = voice.gate = 1.0f;
    for (float& tune : voice.tune) tune = 0.0f;
    voice.swing[0] = voice.swing[1] = 0.0f;
    voice.caught = voice.age = voice.lift = voice.puff = voice.pop = voice.spark = voice.jitter = 0.0f;
    voice.spark_next = 0.05f + 0.4f * voice.rng.uniform();
    voice.fresh = 0;
    voice.pop = 3.0f * std::exp(-seconds / 0.05f) * (0.3f + 0.7f * voice.gain);
    voice.edge_keep = std::exp(-1.6f * static_cast<float>(voice.base));
    // A quick catch starts with the tube already moving, a slow one from a breath.
    const float kick = 0.85f * std::exp(-seconds / 0.07f) + 0.012f;
    const float start = voice.rng.uniform();
    for (int p = 0; p < 2; ++p) {
      Pipe& pipe = voice.pipe[p];
      pipe.clear();
      cut(voice, pipe, p == 1);
      for (int m = 0; m < pipe.modes; ++m) {
        const float n = pipe.ratio[m];
        const float phase = start * n + 0.17f * static_cast<float>(p);
        const float size = kick * 0.8f / kit::max(n, 1.0f);
        pipe.bank.re[m >> 2][m & 3] = size * kit::SineTable::cos_lookup(phase);
        pipe.bank.im[m >> 2][m & 3] = size * kit::SineTable::lookup(phase);
      }
    }
    cut_glass(voice);
    Line* lines[] = {&voice.amp,  &voice.second, &voice.flame,  &voice.bias, &voice.low_bias, &voice.hiss,
                     &voice.shake, &voice.glass, &voice.direct, &voice.tick};
    for (Line* line : lines) line->snap(0.0f);
    steer(voice, until_tick_ > 0 ? until_tick_ : kControlPeriod, true);
  }

  // How a pipe's modes stand to its flame: what each takes of the heat and
  // what the flame sees of it. Returns how loud the pipe comes out.
  float stand(Voice& voice, Pipe& pipe, float lag, float place, float lift, float rush, float bend, float drive) {
    using namespace flame_organ;
    const bool closed = tube_ == 1;
    const bool twin = tube_ == 4;
    float shape[kModes], seen[kModes], sine[kModes], cosine[kModes];
    float power[2] = {};
    const float tilt = kit::clamp(1.0f - 5.0f * place, -1.2f, 0.9f);
    if (std::fabs(tilt - pipe.tilt) > 0.002f) {
      pipe.tilt = tilt;
      for (int m = 0; m < pipe.modes; ++m) pipe.more[m] = std::exp2(tilt * pipe.octave[m]);
    }
    for (int m = 0; m < pipe.modes; ++m) {
      const float n = pipe.ratio[m];
      // The longer pipe of a double tube has its flame as far up its own length.
      const float own = twin && m >= kTwin ? 2.0f * n : n;
      const float across = kit::SineTable::lookup(0.5f * own * place);
      const float along = kit::SineTable::cos_lookup(0.5f * own * place);
      // Low in the tube a flame feeds the upper harmonics more, and by as much
      // sees them less: the colour moves and what sings does not.
      const float more = pipe.more[m];
      const float s = (closed ? along : across) * more;
      const float c = (closed ? across : along) / more;
      shape[m] = s;
      const float over = n / fuel_.slow;
      seen[m] = c / (1.0f + over * over);
      sine[m] = kit::SineTable::lookup(own * lag);
      cosine[m] = kit::SineTable::cos_lookup(own * lag);
      power[twin && m >= kTwin ? 1 : 0] += s * s / n;
    }
    const float level[2] = {1.0f / std::sqrt(kit::max(power[0], 1.0e-4f)), 1.0f / std::sqrt(kit::max(power[1], 1.0e-4f))};
    for (int m = 0; m < pipe.modes; ++m) shape[m] *= level[twin && m >= kTwin ? 1 : 0];
    // Which mode sings: the one that is fed best, with a little for the one
    // that has the note. None over the fifth harmonic may take it: those are
    // out of tune with the keyboard. A double tube has a singer in each pipe.
    const int sides = twin ? 2 : 1;
    float most[2] = {1.0f, 1.0f}, scale[2] = {1.0f, 1.0f};
    for (int half = 0; half < sides; ++half) {
      const int from = half == 0 ? 0 : kTwin, to = twin && half == 0 ? kTwin : kModes;
      int singer = -1;
      float best = -1.0f;
      for (int m = from; m < to && m < pipe.modes; ++m) {
        if (pipe.ratio[m] > kHighest) break;
        const float fed = std::fabs(shape[m] * seen[m]) * kit::max(0.02f, shape[m] * seen[m] >= 0.0f ? sine[m] : -sine[m]);
        const float claim = (fed + 1.0e-5f) * (m == pipe.singer[half] ? 1.08f : 1.0f);
        if (claim > best) best = claim, singer = m;
      }
      if (singer < 0) continue;
      pipe.singer[half] = singer;
      // It is always fed, and never so far out of step that it is pulled off its pitch.
      const float own = shape[singer] >= 0.0f ? kit::max(shape[singer], 0.05f) : kit::min(shape[singer], -0.05f);
      shape[singer] = own;
      most[half] = kit::max(0.02f, std::fabs(own * seen[singer] * sine[singer]));
      const float a = most[half] / own;
      const float most_b = std::fabs(a);
      const float was_b = seen[singer] * cosine[singer];
      seen[singer] = 1.0f;
      sine[singer] = a;
      cosine[singer] = kit::clamp(was_b, -most_b, most_b);
      scale[half] = 1.0f / most[half];
    }
    const float sung = pipe.ratio[pipe.singer[0]];
    // The others follow. Each is held under the point where it would sing by
    // itself, so what they give are harmonics of the one that does.
    const float quiet = 0.7f / kit::max(0.7f, drive);
    for (int m = 0; m < pipe.modes; ++m) {
      const int half = twin && m >= kTwin ? 1 : 0;
      if (m == pipe.singer[half]) continue;
      const float k = shape[m] * seen[m] * sine[m] * scale[half];
      if (k > 0.0f) seen[m] *= kit::min(k * k, quiet / kit::max(k, 1.0e-3f));
      const float size = std::fabs(shape[m] * seen[m]) * scale[half];
      if (size > 1.5f) seen[m] *= 1.5f / size;
    }
    const float gone = gentle((lift - 0.4f) * 2.5f);  // by here the lower ones have died
    const float now_sung = sung + (pipe.ratio[1] - sung) * gone;
    pipe.sung = now_sung;
    // Lifted, the flame turns to the second mode of the tube and its
    // multiples, and lets the ones below it go.
    constexpr int upper = 1;
    if (lift > 0.0f && pipe.modes > 1) {
      for (int m = 0; m < pipe.modes; ++m) {
        if (m == upper || (twin && m >= kTwin)) continue;
        seen[m] *= 1.0f - lift * (pipe.ratio[m] < pipe.ratio[upper] ? 1.0f : 0.6f);
        if (m == pipe.singer[0] && lift > 0.5f) seen[m] *= 2.0f * (1.0f - lift);
      }
      const float s = shape[upper];
      shape[upper] += ((s >= 0.0f ? kit::max(s, 0.5f) : kit::min(s, -0.5f)) - s) * lift;
      const float ideal = most[0] / (s >= 0.0f ? kit::max(s, 0.5f) : kit::min(s, -0.5f));
      const float was_s = seen[upper] * sine[upper], was_c = seen[upper] * cosine[upper];
      seen[upper] = 1.0f;
      sine[upper] = was_s + (ideal - was_s) * lift;
      cosine[upper] = was_c * (1.0f - lift);
    }
    float loud = 0.0f;
    const float dark = voice.hz / mouth_hz_;
    for (int m = 0; m < pipe.modes; ++m) {
      const int g = m >> 2, j = m & 3;
      const float w = static_cast<float>(voice.base) * pipe.ratio[m];
      const float turn = w * (bend + voice.tune[m]);
      const float c = pipe.cosine[m] - turn * (pipe.sine[m] + 0.5f * turn * pipe.cosine[m]);
      const float s = pipe.sine[m] + turn * (pipe.cosine[m] - 0.5f * turn * pipe.sine[m]);
      const float lost = kit::max(pipe.loss[m], kit::min(rush, w * 0.06f));
      const float keep = 1.0f - lost + 0.5f * lost * lost;
      pipe.bank.turn_re[g][j] = keep * c;
      pipe.bank.turn_im[g][j] = keep * s;
      pipe.bank.feed[g][j] = 2.0f * (1.0f - keep) * shape[m];
      // The air as it was `lag` of a period ago, and a sample and a half for the loop.
      const float by = scale[twin && m >= kTwin ? 1 : 0];
      const float a = by * seen[m] * sine[m], b = by * seen[m] * cosine[m];
      pipe.bank.to_re[g][j] = a * pipe.ahead_cos[m] - b * pipe.ahead_sin[m];
      pipe.bank.to_im[g][j] = -b * pipe.ahead_cos[m] - a * pipe.ahead_sin[m];
      // What gets out of it: a mode sings as high as the singer drives it, and the mouth takes off the top.
      const float from = twin && m >= kTwin ? pipe.ratio[pipe.singer[1]] : now_sung;
      const float high = dark * pipe.ratio[m];
      const float out = shape[m] * pipe.bank.left[g][j] * (pipe.ratio[m] < 0.9f * from ? 0.15f : from / pipe.ratio[m]) *
                        (m == upper || (twin && m >= kTwin) ? 1.0f : 1.0f - gone) / (1.0f + high * high);
      const float thin = voice.hz * pipe.ratio[m] / pipe_.thin, off = pipe_.body_q * (voice.hz * pipe.ratio[m] / pipe_.body_hz - pipe_.body_hz / (voice.hz * pipe.ratio[m]));
      const float past = thin * thin / (1.0f + thin * thin);
      loud += out * out * past * past * (1.0f + pipe_.body * (pipe_.body + 2.0f) / (1.0f + off * off));
    }
    return std::sqrt(loud);
  }

  // The ear: how far the modes that sing turned against how far they should
  // have. Each is bent by itself, so modes that sing side by side stay
  // harmonics of one key; what is too quiet to trust is not believed.
  void listen(const Voice& voice, Pipe& pipe, float offset) {
    const bool twin = tube_ == 4;
    const int wanted[kEars] = {pipe.singer[0], 1, twin ? pipe.singer[1] : 0, twin ? 0 : 2};
    float most = 1.0e-12f;
    for (int e = 0; e < kEars; ++e) {
      pipe.error[e] = 0.0f;
      const int at = wanted[e];
      if (at >= pipe.modes) {
        pipe.ear[e] = -1;
        pipe.heard[e] = 0.0f;
        continue;
      }
      const float re = pipe.bank.re[at >> 2][at & 3], im = pipe.bank.im[at >> 2][at & 3];
      const bool known = pipe.ear[e] == at;
      if (!known) pipe.heard[e] = 0.0f;
      pipe.ear[e] = at;
      if (known && voice.fresh > 3) {
        const double turn = voice.base * static_cast<double>(pipe.ratio[at]) * static_cast<double>(1.0f + offset) * (2 * kControlPeriod);
        const double turns = turn * 0.15915494309189535;
        const float part = static_cast<float>(turns - std::floor(turns));
        const float c = kit::SineTable::cos_lookup(part), s = kit::SineTable::lookup(part);
        const float was_re = pipe.last_re[e] * c - pipe.last_im[e] * s, was_im = pipe.last_re[e] * s + pipe.last_im[e] * c;
        const float dot = re * was_re + im * was_im, cross = im * was_re - re * was_im;
        if (dot != 0.0f || cross != 0.0f) pipe.error[e] = std::atan2(cross, dot) / static_cast<float>(turn);
      }
      pipe.heard[e] += (re * re + im * im - pipe.heard[e]) * hear_step_;
      most = kit::max(most, pipe.heard[e]);
      pipe.last_re[e] = re;
      pipe.last_im[e] = im;
    }
    for (int e = 0; e < kEars; ++e) pipe.error[e] *= kit::min(1.0f, pipe.heard[e] / (0.02f * most));
  }

  // What the ears of both pipes heard bends the modes they heard; the others go along.
  void bend(Voice& voice, bool two, float lean) {
    float error[kModes] = {}, weight[kModes] = {};
    float common = 0.0f, power = 1.0e-12f;
    for (int p = 0; p < (two ? 2 : 1); ++p) {
      const Pipe& pipe = voice.pipe[p];
      const float w = p == 0 ? 1.0f - lean : lean;
      for (int e = 0; e < kEars; ++e) {
        if (pipe.ear[e] < 0 || pipe.heard[e] <= 0.0f) continue;
        const int m = pipe.ear[e];
        error[m] += pipe.error[e] * w;
        weight[m] += w;
        common += voice.tune[m] * pipe.heard[e] * w;
        power += pipe.heard[e] * w;
      }
    }
    common /= power;
    const bool twin = tube_ == 4;
    for (int m = 0; m < kModes; ++m) {
      const bool heard = weight[m] > 1.0e-4f;
      // One that only follows tells nothing by how it turns: it is driven at its harmonic wherever it stands.
      const bool sings = m == voice.pipe[0].singer[0] || m == voice.pipe[1].singer[0] || (twin && m == voice.pipe[0].singer[1]);
      voice.tune[m] += (common - voice.tune[m]) * (!heard ? 1.0f : sings ? 0.02f : 0.3f) * ear_step_;
      if (heard) voice.tune[m] -= error[m] / weight[m] * ear_step_;
      voice.tune[m] = kit::clamp(voice.tune[m], -kEarMost, kEarMost);
    }
  }

  static float pitch_of(float ratio) { return std::log2(kit::max(ratio, 0.5f)); }

  // One control tick of a voice; everything it aims at is reached `samples` later.
  void steer(Voice& voice, int samples, bool first) {
    using namespace flame_organ;
    if (!first) {
      voice.age += tick_;
      voice.lit += (1.0f - voice.lit) * catch_step_;
      if (param(kBurn) < kParamMax[kBurn] * 0.999f) voice.fuel *= burn_keep_;
      if (voice.released) voice.gate *= voice.hush ? hush_keep_ : embers_keep_;
      voice.attack = kit::min(1.0f, voice.attack + voice.attack_step);
      ++voice.fresh;
      voice.pop *= pop_keep_;
    }
    const float left = voice.fuel * voice.gate;
    if (left < kGone) {
      voice.on = false;
      voice.amp.snap(0.0f);
      return;
    }

    // The flame's own unrest: slow puffs, faster ones, and the flutter before it catches.
    voice.flick.set_rate(fuel_.puff_hz, sample_rate());
    const float flicker = knob(kFlickerK) * std::sqrt(std::sqrt(knob(kFlickerK)));
    const float slow = voice.flick.next(samples);
    voice.puff += (voice.rng.bipolar() * 3.2f - voice.puff) * puff_step_;
    const float unrest = kit::clamp(fuel_.puff * (1.35f * slow + 0.8f * voice.puff), -1.6f, 1.6f);
    const float early = 1.0f - voice.lit;
    const float flutter = early * early * 0.45f * kit::SineTable::lookup(voice.age * (11.0f + 3.0f * voice.side) + 0.2f * slow);

    // When it lifts: a slow mind of its own, and how readily Lift lets it.
    const float lift_knob = knob(kLiftK);
    const float mood = 0.5f + 0.5f * voice.will.next_block(kit::Lfo::kSmooth, samples);
    const float may = kit::max(kit::min(1.0f, voice.age * 1.2f), kit::clamp((lift_knob - 0.6f) * 2.5f, 0.0f, 1.0f));
    const float wants = gentle((mood - (1.02f - lift_knob * (1.8f - 0.4f * lift_knob))) * (1.0f / 0.36f)) * may;
    voice.lift += (wants - voice.lift) * lift_step_;
    if (voice.lift < 1.0e-4f) voice.lift = 0.0f;

    // How hard the flame answers.
    const float tall = kit::clamp(knob(kFlameK) * (0.40f + 0.86f * voice.gain), 0.0f, 1.15f);
    const float full = 1.34f + (0.5f * tall + 9.0f * tall * tall) * fuel_.drive;
    const float burning = voice.lit * std::sqrt(voice.lit) * std::pow(left, 0.22f);
    float answer = kNearly + (full - kNearly) * burning;
    answer *= kit::max(0.06f, 1.0f + flicker * unrest * 1.1f + flutter + 0.6f * draught_) * (1.0f + voice.pop);
    voice.flame.aim(answer, samples);
    voice.burns = answer / full;
    const bool twin = tube_ == 4;
    voice.swing[0] += (voice.pipe[0].swing(0, twin ? 2 : 3) - voice.swing[0]) * swing_step_;
    voice.swing[1] += ((twin ? voice.pipe[0].swing(2, 3) : 0.0f) - voice.swing[1]) * swing_step_;
    const float deep = answer * kit::min(0.88f, fuel_.bias * (0.55f + 0.75f * tall)) * kit::min(1.0f, 1500.0f / voice.hz);
    voice.bias.aim(-0.12f - deep * voice.swing[0], samples);
    voice.low_bias.aim(-0.12f - deep * voice.swing[1], samples);

    // The two pipes.
    const float second = knob(kSecondK);
    const float between = knob(kBetweenK);
    const float apart = kit::min((0.06f + between * between * (5.0f + 6.0f * between * between)) * std::pow(voice.hz * (1.0f / 220.0f), 0.6f) / voice.hz, 0.028f);
    voice.couple = 0.9f * (1.0f - between) * (1.0f - between) * (1.0f - between) * kit::min(1.0f, 2.0f * second);
    voice.tall2 = 0.8f + 1.8f * second;
    voice.pipe[0].offset = -apart * 0.5f * second;
    voice.pipe[1].offset = apart * (1.0f - 0.5f * second);
    const bool two = second > 0.0f || voice.second.value > 0.0f;
    const float sway = voice.sway.next(samples);
    const float drift = draught_ * 0.0035f;
    const float lag = kit::clamp(knob(kLagK) + 0.09f * draught_ + 0.012f * flicker * slow, 0.03f, 0.47f);
    const float place = kit::clamp(knob(kPlaceK) + 0.13f * draught_ * (1.0f + 0.3f * sway) + 0.008f * sway, 0.02f, 0.46f);
    voice.lag = lag;
    voice.place = place;
    // A tube that is slow by itself is helped until it sings, so that Catch is the same length in all of them.
    voice.caught = kit::max(voice.caught, kit::min(1.0f, 0.7f * answer * voice.swing[0]));
    const float help = 14.0f * burning * (1.0f - voice.caught) / kit::max(0.4f, answer - 1.0f);
    const float rush = kit::max(2.6f * early, voice.released ? 0.0f : help) / (fuel_.late * param(kCatch) * sample_rate());
    // The two pipes are seen to in turn, each every other tick.
    const bool turn_a = first || (voice.fresh & 1) == 0, turn_b = first || !turn_a;
    if (voice.fresh > 0) {
      if (turn_a) listen(voice, voice.pipe[0], voice.pipe[0].offset + drift);
      if (two && turn_b) listen(voice, voice.pipe[1], voice.pipe[1].offset + drift);
      bend(voice, two, two ? 0.5f * second : 0.0f);
    }
    if (turn_a) voice.pipe[0].loud = stand(voice, voice.pipe[0], lag, place, voice.lift, rush, voice.pipe[0].offset + drift, answer);
    if (two) {
      const float place2 = place + (kit::clamp(0.46f - 0.95f * place, 0.05f, 0.42f) - place) * kit::min(1.0f, 0.05f + 2.4f * between);
      if (turn_b) voice.pipe[1].loud = stand(voice, voice.pipe[1], lag, place2, voice.lift, rush, voice.pipe[1].offset + drift, answer * voice.tall2);
    } else {
      voice.pipe[1].bank.hush();
    }

    voice.pipe[0].bank.aim(first);
    if (two) voice.pipe[1].bank.aim(first || voice.second.target <= 0.0f);

    // How loud everything is.
    const float touch = 0.22f + 0.78f * voice.gain * std::sqrt(std::sqrt(voice.gain));
    float fade = 1.0f;
    if (voice.waiting > 0) fade = static_cast<float>(voice.waiting - 1) / static_cast<float>(voice.fade_from);
    const float open = gentle(voice.attack);
    for (int p = 0; p < 2; ++p) {
      const float even = kit::clamp(0.55f / kit::max(voice.pipe[p].loud, 0.01f), 0.15f, 14.0f);
      voice.even[p] += (even - voice.even[p]) * (first ? 1.0f : even > voice.even[p] ? 0.3f * even_step_ : kit::min(1.0f, 6.0f * even_step_));
    }
    const float strength = std::exp(kit::min(0.35f, 1.7f * flicker * unrest)) * kit::max(0.2f, 1.0f + 0.6f * draught_) * std::exp2((tall < 0.45f ? 1.8f : 0.9f) * (0.45f - tall));
    // A flame low in the tube and quick to answer has the sharper edge.
    const float edge = std::exp2(4.5f * (0.21f - lag) + 3.0f * (0.17f - place) + 1.6f * (between - 0.4f) * kit::min(1.0f, 2.0f * second));
    // What sings higher, by its key or by its harmonic, is turned up or down as that tube and fuel need.
    voice.sung += (pitch_of(voice.pipe[0].sung) - voice.sung) * (first ? 1.0f : 0.5f * even_step_);
    const float trim = kit::db_to_gain(climb_ * kit::clamp(voice.octaves + voice.sung, -3.5f, 4.5f));
    const float base = kVoiceGain * trim * touch * left * fade * open * pair_ * crowd_;
    const float tone = base * strength * swap_ * (1.0f - 0.12f * knob(kRoarK));
    voice.amp.aim(tone * voice.even[0] / (1.0f + 0.8f * second), samples);
    voice.second.aim(second * voice.even[1] / voice.even[0], samples);
    voice.direct.aim(tone * fuel_.direct * pipe_.direct * (0.25f + 0.75f * tall) * (0.4f + 0.86f * voice.gain) * edge, samples);
    voice.glass.aim(kVoiceGain * std::exp2(0.12f * voice.octaves) * (0.2f + 0.8f * voice.gain) * left * fade * open * 0.7f * std::pow(knob(kGlassK), 0.7f) * crowd_, samples);

    // Noise: what shakes the flame, and what is heard past it.
    voice.spark *= spark_keep_;
    if (fuel_.crackle > 0.01f) {
      voice.spark_next -= tick_ * (2.5f + 16.0f * flicker);
      if (voice.spark_next <= 0.0f) {
        voice.spark_next = -std::log(voice.rng.uniform() * 0.98f + 0.01f);
        const float size = voice.rng.uniform();
        voice.spark = fuel_.crackle * (0.4f + 1.6f * knob(kRoarK)) * (0.3f + 2.2f * size * size * size);
      }
    }
    const float roar = knob(kRoarK);
    // A flame that answers harder is shaken harder, or its pulses would hide it.
    const float stir = kit::max(1.0f, answer * 0.3f);
    voice.shake.aim((0.006f + (fuel_.jitter * (0.1f + 1.2f * roar) + 0.9f * roar * roar) * stir + 0.35f * early * early + 0.6f * voice.spark) * noise_scale_, samples);
    const float rush_out = base * noise_scale_ * kit::max(0.1f, 1.0f + 0.5f * flicker * unrest + 0.5f * draught_) * swap_;
    voice.hiss.aim(rush_out * fuel_.hiss * pipe_.breath * (roar * (0.9f + 1.6f * roar) + 0.5f * voice.spark + 0.2f * early * (1.0f + 2.0f * flutter) + 0.5f * voice.pop), samples);
    voice.tick.aim(base * noise_scale_ * swap_ * 0.9f * voice.spark * pipe_.breath, samples);
  }

  // Every tick: what all the voices share, then each of them.
  void control() {
    using namespace flame_organ;
    for (kit::Smoother& knob : knobs_) knob.next();
    const float sr = sample_rate();
    catch_step_ = 1.0f - std::exp(-tick_ / (0.36f * fuel_.late * param(kCatch)));
    burn_keep_ = fall(param(kBurn) + 0.7f * param(kCatch), tick_);
    embers_keep_ = fall(param(kEmbers), tick_);
    hush_keep_ = fall(0.06f, tick_);
    lift_step_ = 1.0f - std::exp(-tick_ / 0.12f);
    puff_step_ = 1.0f - std::exp(-kit::kTwoPi * 5.0f * tick_);
    spark_keep_ = std::exp(-tick_ / 0.004f);
    pop_keep_ = std::exp(-tick_ / 0.16f);
    swing_step_ = 1.0f - std::exp(-tick_ / 0.003f);
    ear_step_ = tick_ / kEarSeconds;
    even_step_ = 1.0f - std::exp(-tick_ / 0.08f);
    hear_step_ = 1.0f - std::exp(-2.0f * tick_ / 0.15f);
    gust_.set_rate(0.34f, sr);
    draught_ = knob(kDraughtK) * 1.45f * gust_.next(kControlPeriod) * kit::min(1.0f, weather_age_ * 0.8f);
    weather_age_ += tick_;
    blend(false);
    // Many keys share one air: each has a little less of it.
    float keys = 0.0f;
    for (const Voice& voice : pool_.voices) {
      if (voice.on && voice.waiting == 0) keys += kit::min(1.0f, 4.0f * voice.gate * voice.fuel);
    }
    const float crowd = 1.0f / std::sqrt(1.0f + 0.42f * kit::max(0.0f, keys - 1.0f));
    crowd_ += (crowd - crowd_) * (!crowded_ ? 1.0f : (crowd < crowd_ ? 1.0f : 0.06f) * crowd_step_);
    crowded_ = true;

    // Another tube: everything that sounds dips, is cut again and comes back.
    const int wanted = tube_param();
    if (wanted != tube_ && swap_ > 0.0f) {
      swap_ = kit::max(0.0f, swap_ - swap_step_);
    } else if (wanted != tube_) {
      tube_ = wanted;
      for (Voice& voice : pool_.voices) {
        if (!voice.on || voice.waiting > 0) continue;
        for (int p = 0; p < 2; ++p) cut(voice, voice.pipe[p], p == 1);
      }
      swap_ = swap_step_;
    } else {
      swap_ = kit::min(1.0f, swap_ + swap_step_);
    }
    open_mouth();
    ring_out_.aim(rim_level_, kControlPeriod);
    for (int e = 0; e < 2; ++e) {
      mouth_[e].set(mouth_hz_, 0.62f, sr);
      body_[e].set(pipe_.body_hz, pipe_.body_q, sr);
      thin_[2 * e].set_cutoff(pipe_.thin, sr);
      thin_[2 * e + 1].set_cutoff(pipe_.thin, sr);
      rim_[e].set_cutoff(1600.0f, sr);
      rush_[e].set(kit::min(fuel_.hiss_hz, 0.4f * sr), 0.7f, sr);
    }
    direct_keep_ = std::exp(-kit::kTwoPi * kit::min(fuel_.direct_hz, 0.4f * sr) / sr);
    shake_keep_ = std::exp(-kit::kTwoPi * 1400.0f / sr);

    for (Voice& voice : pool_.voices) {
      if (!voice.on) continue;
      if (voice.waiting > 0 && --voice.waiting == 0) {
        begin(voice);
        continue;
      }
      steer(voice, kControlPeriod, false);
      for (Pipe& pipe : voice.pipe) {
        pipe.bank.settle();
        if (std::fabs(pipe.direct) + std::fabs(pipe.direct2) + std::fabs(pipe.under) < 1.0e-14f) pipe.under = pipe.direct = pipe.direct2 = 0.0f;
      }
      voice.ring.settle();
    }
  }

  void open_mouth() {
    const float bright = knob(kMouthK);
    mouth_hz_ = kit::min(280.0f * std::exp2(bright * 5.6f + fuel_.bright), 0.42f * sample_rate());
    const float wide = kit::max(0.0f, bright - 0.4f);
    rim_level_ = 3.0f * wide * wide + kit::max(0.0f, fuel_.bright);
  }

  // Tube and fuel as they are just now: a new one is moved to and not jumped to.
  void blend(bool snap) {
    using namespace flame_organ;
    const Fuel& f = fuel(fuel_param());
    const Tube& t = tube(tube_param());
    const float step = snap ? 1.0f : 1.0f - std::exp(-tick_ / 0.03f);
    // How loud a tube is made with a fuel where the knobs stand, so that all of
    // them change the colour and the level stays.
    const float flame = knob(kFlameK) - 0.45f, lag = 4.0f * (knob(kLagK) - 0.21f), place = 4.0f * (knob(kPlaceK) - 0.17f);
    const float roar = knob(kRoarK) - 0.25f, mouth = knob(kMouthK) - 0.55f;
    const float at[kLevelTerms] = {1.0f, flame, flame * flame, lag, lag * lag, place, place * place, lag * place, roar, roar * roar, mouth, mouth * mouth, knob(kSecondK), knob(kLiftK)};
    const float* terms = level_terms(tube_param(), fuel_param());
    float loud = 0.0f;
    for (int i = 0; i < kLevelTerms; ++i) loud += terms[i] * at[i];
    const float quick = snap ? 1.0f : 1.0f - std::exp(-tick_ / 0.006f);
    pair_ += (kit::db_to_gain(-loud) - pair_) * quick;
    climb_ += (level_climb(tube_param(), fuel_param()) - climb_) * step;
    float* a = reinterpret_cast<float*>(&fuel_);
    const float* b = reinterpret_cast<const float*>(&f);
    for (unsigned i = 0; i < sizeof(Fuel) / sizeof(float); ++i) a[i] += (b[i] - a[i]) * step;
    float* c = reinterpret_cast<float*>(&pipe_);
    const float* d = reinterpret_cast<const float*>(&t);
    for (unsigned i = 0; i < sizeof(Tube) / sizeof(float); ++i) c[i] += (d[i] - c[i]) * step;
  }

  void render(int offset, int count) {
    using namespace flame_organ;
    float left[kControlPeriod] = {}, right[kControlPeriod] = {};
    float air_left[kControlPeriod] = {}, air_right[kControlPeriod] = {};
    float glass_left[kControlPeriod] = {}, glass_right[kControlPeriod] = {};
    for (Voice& voice : pool_.voices) {
      if (voice.on) speak(voice, kControlPeriod - until_tick_, count, left, right, air_left, air_right, glass_left, glass_right);
    }
    for (int i = 0; i < count; ++i) {
      float l = left[i], r = right[i];
      rush_[0].process(air_left[i]);
      rush_[1].process(air_right[i]);
      l += rush_[0].band + fuel_.hiss_low * rush_[0].low;
      r += rush_[1].band + fuel_.hiss_low * rush_[1].low;
      l = thin_[1].highpass(thin_[0].highpass(l));
      r = thin_[3].highpass(thin_[2].highpass(r));
      l += body_[0].bandpass(l) * pipe_.body + glass_left[i];
      r += body_[1].bandpass(r) * pipe_.body + glass_right[i];
      l = mouth_[0].lowpass(l);
      r = mouth_[1].lowpass(r);
      // A wide mouth gives off the upper harmonics better than the low ones.
      const float rim = ring_out_.next();
      l = dc_[0].process(l + rim * rim_[0].highpass(l));
      r = dc_[1].process(r + rim * rim_[1].highpass(r));
      const float mid = 0.5f * (l + r);
      const float side = 0.5f * (l - r) * width_.next();
      const float volume = volume_.next();
      out_left_[offset + i] = kit::soft_clip((mid + side) * volume);
      out_right_[offset + i] = kit::soft_clip((mid - side) * volume);
    }
  }

  // The flame heard past the tube: the edges of its pulses, the tone itself left to the tube.
  float past(Pipe& pipe, float q, float edge_keep) const {
    pipe.under = q + (pipe.under - q) * edge_keep;
    const float edge = q - pipe.under;
    pipe.direct = edge + (pipe.direct - edge) * direct_keep_;
    pipe.direct2 = pipe.direct + (pipe.direct2 - pipe.direct) * direct_keep_;
    return pipe.direct2;
  }

  void speak(Voice& voice, int at, int count, float* left, float* right, float* air_left, float* air_right, float* glass_left, float* glass_right) {
    using namespace flame_organ;
    Pipe& a = voice.pipe[0];
    Pipe& b = voice.pipe[1];
    const bool two = voice.second.value > 0.0f || voice.second.target > 0.0f;
    const bool twin = tube_ == 4;
    const float couple = two ? voice.couple : 0.0f;
    const float share = 1.0f / (1.0f + couple);
    const float second = couple > 0.0f ? couple : 0.0f;
    const float lean = voice.side * 0.35f;
    uint32_t seed = voice.rng.state;
    float jitter = voice.jitter;
    for (int i = 0; i < count; ++i) {
      if (((at + i) & 7) == 0) {
        a.bank.move();
        if (two) b.bank.move();
      }
      seed ^= seed << 13;
      seed ^= seed >> 17;
      seed ^= seed << 5;
      const float n1 = static_cast<float>(static_cast<int16_t>(seed & 0xFFFFu)) * (1.0f / 32768.0f);
      const float n2 = static_cast<float>(static_cast<int16_t>(seed >> 16)) * (1.0f / 32768.0f);
      jitter = n1 + (jitter - n1) * shake_keep_;
      const float shaken = voice.shake.next() * jitter * 3.0f;
      const float gain = voice.flame.next();
      const float bias = voice.bias.next();
      const float rest = heat(bias);
      const float low_bias = voice.low_bias.next();
      const float low_rest = twin ? heat(low_bias) : 0.0f;
      float low_a, low_b = 0.0f;
      float air_a = a.bank.air(&low_a);
      float air_b = two ? b.bank.air(&low_b) : 0.0f;
      if (!twin) {
        air_a += low_a;
        air_b += low_b;
      }
      const float qa = a.flame.burn(gain * (air_a + second * air_b) * share + shaken + bias) - rest;
      float l, r, l2 = 0.0f, r2 = 0.0f, qb = 0.0f;
      const float qa2 = twin ? a.low_flame.burn(gain * low_a + shaken + low_bias) - low_rest : qa;
      a.bank.step(qa, qa2, &l, &r);
      const float other = voice.second.next();
      if (two) {
        qb = b.flame.burn(voice.tall2 * gain * (air_b + couple * air_a) * share - shaken + bias) - rest;
        const float qb2 = twin ? b.low_flame.burn(gain * low_b - shaken + low_bias) - low_rest : qb;
        b.bank.step(qb, qb2, &l2, &r2);
      }
      const float amp = voice.amp.next();
      const float direct = voice.direct.next();
      const float da = past(a, qa, voice.edge_keep) * direct;
      const float db = two ? past(b, qb, voice.edge_keep) * direct * other : 0.0f;
      float gl = 0.0f, gr = 0.0f;
      if (voice.ringing) {
        voice.ring.step(qa, qa, &gl, &gr);
        const float glass = voice.glass.next();
        gl *= glass;
        gr *= glass;
      }
      const float tick = voice.tick.next();
      left[i] += n2 * tick;
      right[i] += n1 * tick;
      left[i] += (l + l2 * other) * amp + da * (1.0f + lean) + db * (1.0f - lean);
      right[i] += (r + r2 * other) * amp + da * (1.0f - lean) + db * (1.0f + lean);
      glass_left[i] += gl;
      glass_right[i] += gr;
      // The rush of the burning comes in the flame's own pulses.
      const float rush = voice.hiss.next() * (0.55f + 0.45f * qa);
      air_left[i] += n1 * rush;
      air_right[i] += n2 * rush;
    }
    voice.rng.state = seed;
    voice.jitter = jitter;
  }

  // A key goes down into silence: whatever stood still or ran on is put where
  // a device set this way from the start would have it.
  void arrive() {
    for (kit::Smoother& knob : knobs_) knob.snap(knob.target);
    volume_.snap(volume_.target);
    width_.snap(width_.target);
    tube_ = tube_param();
    swap_ = 1.0f;
    swap_step_ = tick_ / 0.008f;
    crowd_ = 1.0f;
    crowd_step_ = 1.0f - std::exp(-tick_ / 0.0025f);
    crowded_ = false;
    blend(true);
    chance_.seed(0x3C6EF372u + 7919u * arrivals_);
    gust_.seed(0x5851F42Du + 104729u * arrivals_);
    ++arrivals_;
    started_ = 0;
    weather_age_ = 0.0f;
    draught_ = 0.0f;
    until_tick_ = 0;
    for (int e = 0; e < 2; ++e) {
      mouth_[e].reset();
      body_[e].reset();
      rush_[e].reset();
      thin_[2 * e].reset();
      thin_[2 * e + 1].reset();
      rim_[e].reset();
      dc_[e].reset();
    }
    refresh();
  }

  // The rates a voice needs that begins before the first tick has run.
  void refresh() {
    using namespace flame_organ;
    open_mouth();
    ring_out_.snap(rim_level_);
    catch_step_ = 1.0f - std::exp(-tick_ / (0.36f * fuel_.late * param(kCatch)));
    puff_step_ = 1.0f - std::exp(-kit::kTwoPi * 5.0f * tick_);
    lift_step_ = 1.0f - std::exp(-tick_ / 0.12f);
    spark_keep_ = std::exp(-tick_ / 0.004f);
    pop_keep_ = std::exp(-tick_ / 0.16f);
    swing_step_ = 1.0f - std::exp(-tick_ / 0.003f);
  }

  void apply(int id) {
    using namespace flame_organ;
    const float value = param(id);
    const bool glide = primed();
    switch (id) {
      case kFlame: knobs_[kFlameK].set(value, glide); break;
      case kLag: knobs_[kLagK].set(value, glide); break;
      case kPlace: knobs_[kPlaceK].set(value, glide); break;
      case kSecondFlame: knobs_[kSecondK].set(value, glide); break;
      case kBetween: knobs_[kBetweenK].set(value, glide); break;
      case kFlicker: knobs_[kFlickerK].set(value, glide); break;
      case kRoar: knobs_[kRoarK].set(value, glide); break;
      case kDraught: knobs_[kDraughtK].set(value, glide); break;
      case kLift: knobs_[kLiftK].set(value, glide); break;
      case kGlass: knobs_[kGlassK].set(value, glide); break;
      case kMouth: knobs_[kMouthK].set(value, glide); break;
      case kWidth: width_.set(1.5f * std::pow(value, 1.25f), glide); break;
      case kVolume: volume_.set(kit::db_to_gain(value), glide); break;
      default: break;  // read on the control clock or as a key goes down
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Smoother knobs_[kKnobCount];
  kit::Smoother volume_, width_;
  kit::Svf mouth_[2], body_[2], rush_[2];
  kit::DcBlocker dc_[2];
  kit::OnePole thin_[4], rim_[2];
  flame_organ::Line ring_out_;
  float rim_level_ = 0.0f, mouth_hz_ = 2000.0f;
  kit::Drift gust_;
  kit::Rng chance_;
  kit::IdleGate idle_;
  flame_organ::Fuel fuel_ = {};
  flame_organ::Tube pipe_ = {};
  float tick_ = 0.001f, noise_scale_ = 1.0f;
  float catch_step_ = 0.0f, burn_keep_ = 1.0f, embers_keep_ = 1.0f, hush_keep_ = 1.0f;
  float lift_step_ = 0.0f, puff_step_ = 0.0f, swing_step_ = 0.0f, spark_keep_ = 0.0f, pop_keep_ = 0.0f, even_step_ = 0.0f, ear_step_ = 0.0f, hear_step_ = 0.0f;
  float direct_keep_ = 0.0f, shake_keep_ = 0.0f;
  float draught_ = 0.0f, weather_age_ = 0.0f;
  float pair_ = 1.0f, climb_ = 0.0f;
  float crowd_ = 1.0f, crowd_step_ = 0.1f;
  bool crowded_ = false;
  float swap_ = 1.0f, swap_step_ = 0.2f;
  int tube_ = 0, until_tick_ = 0, steal_ticks_ = 4;
  uint32_t arrivals_ = 0, started_ = 0;
};

}  // namespace livemix
