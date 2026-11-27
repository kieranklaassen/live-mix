#pragma once

// Spun Wire: every key spins a wheel of six wires past a plucker.
//
//   key ─► wheel (gesture, spin, spin up, coast, gear) ─► passes ─► plucks ┐
//              └─► speed against Melt ─► rub, a small push every period ───┤
//                                                                          ▼
//                                            six wires (wires.h) ─► round the field
//   all keys ─► hub (six resonances a side, and what it takes off the top) ─► volume ─► soft clip
//
// - A key let go lays a damper on its wires: Release is a loss in their loops,
//   so the plucks of the coast are cut short by it.
// - Another hub is put in while the resonances are faded out.
// - The wheel is an angle counted in passes. Driven, it closes on Spin while
//   the key is down; let go it slows by dw/dt = -(2/T)·sqrt(w0·w), which
//   stands still after T = Coast and spaces its last passes further and
//   further apart. Thrown, it is brought up to speed once and coasts at once.
//   One turn plucks each wire once. Rocked, the angle swings as a pendulum
//   does, one turn to either side.
// - A pass plucks the wire that passes: an impulse that waits for the wire's
//   own place in its period, so it always meets what still rings in step, and
//   is made as large as what the wire has lost (kRefill). No run of plucks can
//   pile up, however fast.
// - Around Melt passes a second (1.5 octaves either side) plucks give way, at
//   equal power, to a rub: the same impulse every period, as much smaller as
//   the period's loss, so the wire stands at the level the plucks held.
// - Lacing ties the wires: part of what they share is lost to the rim, and a
//   pluck is passed on to the next three, later and softer.
// - A pitch has one wheel: struck again while it coasts it is driven on from
//   where it stands.
//
// The whole device renders in chunks of kChunk samples into a small buffer
// the host's blocks are read from, so the output does not depend on the block
// size; the chunk clock restarts when a key finds the device asleep.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "wires.h"

namespace livemix {

class SpunWire : public kit::DeviceBase<spun_wire::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kWires = spun_wire::Wires::kWires;
  static constexpr int kChunk = spun_wire::Wires::kChunk;
  enum Gesture : int { kDriven = 0, kThrown, kOneTurn, kRocked };
  static constexpr int kCard = 1;  // of the pluckers
  enum Meter : int { kMeterTurn = 0, kMeterSpeed };

  void init(float sample_rate) {
    using namespace spun_wire;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    dt_ = static_cast<float>(kChunk) / sr;
    for (Voice& voice : voices_) {
      voice.state = kIdle;
      voice.held = false;
      voice.id = -1;
      voice.stamp = 0;
    }
    stamp_ = 0;
    serial_ = 1;
    awake_ = false;
    glide_ = 1.0f - kit::time_to_coeff(0.02f, 1.0f / dt_);
    volume_.set_time(0.02f, sr);
    restart();
  }

  void set_param(int id, float value) {
    using namespace spun_wire;
    if (!store_param(id, value)) return;
    switch (id) {
      case kTuning:
      case kPlucker:
      case kHub:
      case kStrung:
      case kGauge:
      case kRing:
      case kDamp:
      case kBeat:
      case kRim:
        ++serial_;
        break;
      default:
        break;
    }
    if (!awake_) settle_knobs();
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (gain <= 0.0f) return note_off(note_id);
    if (!awake_) restart();
    awake_ = true;

    // The wheel this pitch already has, held by this id or let go. Whatever
    // else the id held is let go.
    Voice* same = nullptr;
    Voice* waiting = nullptr;
    for (Voice& voice : voices_) {
      if (voice.state == kIdle) continue;
      const bool mine = voice.held && voice.id == note_id;
      if (voice.hz == frequency && (mine || !voice.held) && !same) {
        same = &voice;
        continue;
      }
      if (!mine) continue;
      voice.held = false;
      if (voice.state == kFading) waiting = &voice;
    }
    Voice& voice = same ? *same : (waiting ? *waiting : voices_[pick()]);
    const bool sounding = voice.state != kIdle;
    voice.id = note_id;
    voice.held = true;
    voice.stamp = ++stamp_;
    voice.gain_to = gain;
    voice.level = kit::max(voice.level, gain);
    if (same && voice.state == kPlaying) {
      voice.restrike = true;
    } else {
      voice.hz = frequency;
      voice.state = sounding && voice.state != kWaiting ? kFading : kWaiting;
    }
    rank();
  }

  void note_off(int note_id) {
    for (Voice& voice : voices_) {
      if (voice.state != kIdle && voice.held && voice.id == note_id) voice.held = false;
    }
    rank();
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!awake_) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    for (int i = 0; i < frames; ++i) {
      if (ready_ == kChunk) {
        if (awake_) render_chunk();
        if (!awake_) {
          for (; i < frames; ++i) out_left_[i] = out_right_[i] = 0.0f;
          return;
        }
      }
      out_left_[i] = chunk_left_[ready_];
      out_right_[i] = chunk_right_[ready_];
      ++ready_;
    }
  }

  // The newest wheel: where it stands, in turns, and how fast it goes.
  float meter(int index) const {
    const Voice* newest = nullptr;
    for (const Voice& voice : voices_) {
      if (voice.state == kPlaying && (!newest || voice.stamp > newest->stamp)) newest = &voice;
    }
    if (!newest) return 0.0f;
    if (index == kMeterTurn) {
      const float turns = static_cast<float>(newest->passes % 600 + newest->part) * (1.0f / static_cast<float>(kWires));
      return turns - std::floor(turns);
    }
    return index == kMeterSpeed ? newest->speed : 0.0f;
  }

 private:
  enum State : int { kIdle = 0, kWaiting, kPlaying, kFading };

  static constexpr float kMinHz = 24.0f;
  static constexpr float kMaxHz = 4200.0f;
  static constexpr float kTopWire = 5000.0f;     // a wire above this is strung an octave lower
  static constexpr float kLowWire = 26.0f;       // and one under this an octave higher
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kLevel = 0.15f;
  static constexpr float kRefill = 0.75f;        // how much of what rings a pluck leaves out
  static constexpr float kLeast = 0.25f;         // what it still puts into a full wire, and how full is full
  static constexpr float kFull = 1.8f;
  static constexpr float kRubLevel = 0.45f;         // where the rub holds a wire, of a full pluck, and what a long ring adds
  static constexpr float kRubRing = 0.2f;
  static constexpr float kStealSeconds = 0.003f;
  static constexpr float kSilence = 1.0e-6f;
  static constexpr float kStop = 0.12f;          // passes a second at which a wheel stands
  static constexpr float kTailSeconds = 2.5f;    // the hub rings out
  static constexpr float kUneven[kWires] = {0.0f, 0.8f, 0.4f, 1.0f, 0.2f, 0.7f};
  using Wires = spun_wire::Wires;
  static constexpr float kOpen = 14000.0f;       // the top with no hub in the way
  static constexpr float kTopSpeed = 90.0f;

  struct Plucker {
    float body, pick_hz, pick_track;  // the two low-passes: times the note, hertz, times the note
    float thin;                       // where the high-pass stands, times the note
    float pulse;                      // how much of a pluck and of a rub is the clean push
    float puff, rub_noise;            // and how much is noise
    float puff_seconds;
    float ring, damp;                 // what it makes of the wires' ring and their damping
    float gain;
    float fall;                       // how fast what it puts in falls off, an octave
    float dark;                       // how the noise leans over the wires, a power of their ratio
    float even_ring;                  // one over the ring it is levelled at, a second
    float even;                       // and how much of the wires' own levelling it needs
  };
  static const Plucker& plucker(int index) {
    static const Plucker kTable[4] = {
        {0.55f, 560.0f, 1.2f, 0.75f, 1.0f, 0.03f, 0.03f, 0.006f, 1.0f, 0.0f, 1.1f, 0.3f, 0.0f, 0.35f, 1.0f},
        {2.2f, 1800.0f, 0.5f, 0.1f, 0.7f, 2.2f, 1.1f, 0.008f, 0.008f, 0.2f, 0.5f, 0.7f, 0.0f, 12.0f, 0.45f},
        {16.0f, 4400.0f, 2.0f, 11.0f, 1.0f, 0.12f, 0.02f, 0.002f, 3.0f, -0.17f, 1.2f, 1.0f, 0.0f, 0.15f, 0.75f},
        {5.0f, 2800.0f, 0.0f, 1.8f, 0.0f, 0.8f, 1.7f, 0.35f, 0.5f, 0.0f, 0.15f, 0.9f, -0.2f, 0.5f, 0.6f},
    };
    return kTable[kit::clamp_int(index, 0, 3)];
  }

  struct Hub {
    float ring, damp;     // what it makes of the wires' ring and their damping
    float top_hz;         // where it takes off the top, at Rim 1
    float dry, wet;
    float hz[6], q[6], gain[6];
  };
  static const Hub& hub(int index) {
    static const Hub kTable[3] = {
        {1.6f, -0.2f, 10000.0f, 0.35f, 2.1f,
         {640.0f, 1170.0f, 1930.0f, 2870.0f, 4130.0f, 5600.0f},
         {24.0f, 28.0f, 32.0f, 36.0f, 40.0f, 40.0f},
         {0.9f, 1.2f, 1.5f, 1.5f, 1.1f, 0.7f}},
        {0.6f, 0.12f, 1400.0f, 0.1f, 2.0f,
         {128.0f, 246.0f, 380.0f, 560.0f, 860.0f, 1320.0f},
         {5.0f, 6.0f, 6.0f, 7.0f, 6.0f, 6.0f},
         {1.1f, 1.0f, 1.0f, 0.9f, 0.6f, 0.4f}},
        {0.07f, 0.28f, 150.0f, 0.03f, 2.4f,
         {62.0f, 97.0f, 132.0f, 180.0f, 243.0f, 330.0f},
         {5.0f, 6.0f, 6.0f, 6.0f, 6.0f, 6.0f},
         {2.0f, 1.8f, 1.6f, 1.2f, 0.9f, 0.6f}},
    };
    return kTable[kit::clamp_int(index, 0, 2)];
  }

  struct Voice {
    spun_wire::Wires wires;
    int state = kIdle;
    int id = -1;
    bool held = false, restrike = false;
    bool resting = false, coasting = false;
    float hz = 220.0f, play_hz = 220.0f;
    float gain = 0.7f, gain_to = 0.7f, force = 0.65f;
    float level = 0.0f, rub_level = 0.45f;
    float fade = 1.0f;     // steals
    int plucker = 0;       // the one its wires were worked out for
    float spread = 1.0f;   // how far its wires are carried from side to side
    bool damped = false;   // the damper is on: its key is up
    float speed = 0.0f;    // passes a second, always forward
    float coast_from = 1.0f;
    float part = 0.0f;     // of a pass
    int passes = 0;
    int gesture = kDriven;
    int strung = 6;
    float swing = 0.0f, swing_phase = 0.0f, swing_at = 0.0f;  // the rocked wheel
    float quiet = 0.0f;
    float sign = 1.0f;
    float own = 0.0f;      // how far this wheel runs off the others, set by its key
    float start_phase = 0.0f;
    float weight[kWires] = {}, ratio[kWires] = {};
    float hand[kWires] = {};  // what the touch makes of each wire: a hard one lights the high ones
    float loud[kWires] = {};  // glides, so a wire taken off fades
    float echo_at[kWires] = {}, echo_size[kWires] = {};
    int rank = 0;
    uint32_t stamp = 0, designed = 0;
    int tone_wait = 0;
    kit::Drift drift;
  };

  // --- keys ---------------------------------------------------------------

  // A free voice, else the quietest let go, else the quietest held; one that
  // already waits for a new note is left to it while there is another.
  int pick() const {
    int best = 0;
    float lowest = 1.0e9f;
    for (int i = 0; i < kMaxVoices; ++i) {
      const Voice& voice = voices_[i];
      float score = voice.level;
      if (voice.state == kIdle) score = -1.0f;
      if (voice.held) score += 10.0f;
      if (voice.state == kFading || voice.state == kWaiting) score += 100.0f;
      if (score < lowest || (score == lowest && voice.stamp < voices_[best].stamp)) {
        lowest = score;
        best = i;
      }
    }
    return best;
  }

  // Where each held key stands among the held, from the lowest: its gear. A
  // key let go keeps the one it had.
  void rank() {
    for (Voice& voice : voices_) {
      if (voice.state == kIdle || !voice.held) continue;
      int below = 0;
      for (const Voice& other : voices_) {
        if (other.state != kIdle && other.held && other.hz < voice.hz) ++below;
      }
      voice.rank = kit::clamp_int(below, 0, 4);
    }
  }

  // Free, together, 3 4 5, 1 2 3, and 1 2 3 from the top key down.
  float geared(const Voice& voice) const {
    const int gear = kit::clamp_int(static_cast<int>(param(spun_wire::kGear) + 0.5f), 0, 4);
    const float step = static_cast<float>(voice.rank);
    switch (gear) {
      case 0: return 1.0f + 0.09f * voice.own;
      case 1: return 1.0f;
      case 2: return (3.0f + step) * (1.0f / 3.0f);
      case 3: return 1.0f + step;
      default: return 1.0f / (1.0f + step);
    }
  }

  void begin(Voice& voice) {
    voice.state = kPlaying;
    voice.play_hz = voice.hz;
    const uint32_t key = static_cast<uint32_t>(kit::hz_to_midi(voice.hz) * 64.0f + 0.5f);
    kit::Rng rng;
    rng.seed(key * 2654435761u + 77u);
    for (int i = 0; i < 4; ++i) rng.next_u32();
    voice.own = rng.bipolar();
    voice.start_phase = rng.uniform();
    voice.sign = rng.uniform() < 0.5f ? -1.0f : 1.0f;
    voice.drift.seed(key * 40503u + 3u);
    voice.drift.set_rate(0.13f, 1.0f / dt_);
    voice.wires.reset(key);
    voice.fade = 1.0f;
    voice.damped = false;
    voice.part = 0.0f;
    voice.passes = 0;
    voice.speed = 0.0f;
    voice.quiet = 0.0f;
    voice.restrike = false;
    for (int i = 0; i < kWires; ++i) voice.echo_at[i] = -1.0f;
    voice.wires.rim = voice.wires.rim_to = rim_loss();
    voice.gain = voice.gain_to;
    voice.gesture = kDriven;
    design(voice, true);
    aim(voice, true);
    throw_wheel(voice);
    for (int i = 0; i < kWires; ++i) {
      voice.wires.next[i] = kit::min(2.0f * voice.wires.period[i], 0.014f / dt_ * static_cast<float>(kChunk)) * voice.start_phase;
    }
  }

  // A key goes down: the first wire is plucked and the wheel set going.
  void throw_wheel(Voice& voice) {
    voice.gain = voice.gain_to;
    voice.force = 0.97f * std::pow(voice.gain, 0.9f);
    tone(voice);
    voice.tone_wait = 12;
    hand(voice);
    voice.gesture = kit::clamp_int(static_cast<int>(param(spun_wire::kGesture) + 0.5f), 0, 3);
    voice.resting = false;
    voice.coasting = false;
    voice.swing = 0.34f;
    voice.swing_phase = 0.0f;
    voice.swing_at = 0.0f;
    voice.restrike = false;
    if (voice.gesture == kOneTurn) {
      voice.passes = 0;
      voice.part = 0.0f;
    }
    voice.quiet = 0.0f;
    pass(voice, voice.passes, 1.0f);
  }

  // --- the wires ----------------------------------------------------------

  static const float* ratios(int tuning) {
    static const float kTable[4][kWires] = {{1, 1, 1, 1, 1, 1},
                                            {1, 2, 4, 0.5f, 2, 8},
                                            {1, 3, 5, 7, 9, 6},
                                            {1, 1.5f, 0.75f, 2.25f, 0.5f, 0.375f}};
    return kTable[kit::clamp_int(tuning, 0, 3)];
  }

  static float wire_hz(float key, float ratio) {
    float hz = key * ratio;
    while (hz > kTopWire) hz *= 0.5f;
    while (hz < kLowWire && hz < key) hz *= 2.0f;
    return hz;
  }

  // Works out all six wires from the knobs as they stand.
  void design(Voice& voice, bool snap) {
    using namespace spun_wire;
    static const float kBeats[kWires] = {-0.35f, 0.55f, -0.15f, 0.9f, 0.4f, -0.75f};
    voice.designed = serial_;
    const float even = kit::clamp(std::pow(voice.play_hz * (1.0f / 220.0f), 0.42f), 0.6f, 3.2f);
    const float sr = this->sample_rate();
    static const float kTilt[4] = {0.0f, 0.36f, 0.66f, -0.4f};
    static const float kGain[4] = {1.05f, 0.95f, 0.8f, 0.64f};
    const float tilt = kTilt[kit::clamp_int(static_cast<int>(param(kTuning) + 0.5f), 0, 3)];
    const float* steps = ratios(static_cast<int>(param(kTuning) + 0.5f));
    voice.plucker = kit::clamp_int(static_cast<int>(param(kPlucker) + 0.5f), 0, 3);
    const Plucker& touch = plucker(voice.plucker);
    const Hub& body = hub(static_cast<int>(param(kHub) + 0.5f));
    const float gauge = param(kGauge);
    // A plucker that stops the wires leaves Ring less to say, and never nothing.
    const float said = touch.ring < 1.0f ? std::pow(param(kRing), 0.75f) : param(kRing);
    const float ring = kit::clamp(said * body.ring * touch.ring * (1.1f - 0.75f * gauge), 0.012f, 50.0f);
    const float damp = kit::max(0.95f * param(kDamp) + 0.6f * (body.damp + touch.damp + 0.37f), 0.0f) * (1.09f - 0.6f * gauge) - 0.15f;
    voice.strung = kit::clamp_int(static_cast<int>(param(kStrung) + 0.5f), 1, kWires);
    voice.rub_level = (kRubLevel + kRubRing * kit::clamp((ring - 1.5f) * (1.0f / 3.0f), 0.0f, 1.0f)) * (touch.thin > 1.0f ? 1.6f : 1.0f);
    const float level = kit::clamp(std::pow(voice.play_hz * (1.0f / 600.0f), 0.5f), 1.0f, 2.0f) * even;
    const float levelled = std::pow(level, touch.even);
    float heard = 0.0f;
    for (int i = 0; i < voice.strung; ++i) {
      const float size = through_hub(wire_hz(voice.play_hz, steps[i]), touch.fall);
      heard += size * size;
    }
    heard = std::sqrt(heard / static_cast<float>(voice.strung));
    const float answer = kit::clamp(std::pow(0.7f / heard, 0.75f), 0.3f, 4.0f);
    const float long_ring = kit::clamp(std::pow(ring * touch.even_ring, -0.24f), 0.8f, 1.6f);
    for (int i = 0; i < kWires; ++i) {
      float hz = wire_hz(voice.play_hz, steps[i]);
      const float ratio = hz / voice.play_hz;
      hz += kBeats[i] * param(kBeat) * std::sqrt(hz * (1.0f / 220.0f)) * kit::min(1.0f, hz * (1.0f / 160.0f));
      Wires::Spec spec;
      spec.hz = hz;
      spec.ring = ring * kit::clamp(std::pow(hz * (1.0f / 330.0f), -0.3f), 0.4f, 2.0f);
      spec.ring_high = spec.ring * std::pow(10.0f, -0.35f - 1.5f * damp);
      spec.high_hz = 4000.0f;
      spec.stiffness = gauge < 0.02f ? 0.0f : 0.07f * gauge * gauge;
      voice.wires.design(i, spec, sr, snap);
      voice.ratio[i] = ratio;
      voice.weight[i] = answer * levelled * long_ring * kGain[kit::clamp_int(static_cast<int>(param(kTuning) + 0.5f), 0, 3)] * std::pow(ratio, tilt) * std::pow(static_cast<float>(voice.strung) * (1.0f / 6.0f), -0.22f);
      voice.wires.on[i] = i < voice.strung ? 1.0f : 0.0f;
    }
    hand(voice);
  }

  // What the hub makes of a wire at hz: of its first partials, as the plucker lights them.
  float through_hub(float hz, float fall) const {
    using namespace spun_wire;
    const Hub& to = hub(static_cast<int>(param(kHub) + 0.5f));
    const float rim = std::pow(param(kRim), 0.8f);
    const float dry = 1.0f + (to.dry - 1.0f) * rim, wet = to.wet * rim;
    const float top = std::exp2(std::log2(to.top_hz) * rim + std::log2(kOpen) * (1.0f - rim));
    float power = 0.0f, whole = 0.0f, weight = 1.0f;
    for (float n = 1.0f; n < 9.0f; n *= 2.0f) {
      const float f = n * hz;
      float size = dry * dry / (1.0f + (f / top) * (f / top));
      for (int m = 0; m < 6; ++m) {
        const float off = to.q[m] * (f / to.hz[m] - to.hz[m] / f);
        size += wet * wet * to.gain[m] * to.gain[m] / (1.0f + off * off);
      }
      power += weight * size;
      whole += weight;
      weight *= fall * fall;
    }
    return std::sqrt(power / whole);
  }

  void hand(Voice& voice) {
    for (int i = 0; i < kWires; ++i) voice.hand[i] = std::pow(voice.ratio[i], 0.55f * (voice.gain - 0.7f));
  }

  // What the plucker's two low-passes are, and what they cost a pluck.
  void tone(Voice& voice) {
    using namespace spun_wire;
    const float sr = this->sample_rate();
    voice.damped = !voice.held;
    const Plucker& touch = plucker(voice.plucker);
    const float hand = (voice.gain - 0.7f) * 4.0f;
    const float octaves = (param(kEdge) - 0.5f) * 5.0f;
    const float point = param(kPoint);
    // Near the end a wire is bent more sharply.
    const float near_end = -0.55f * std::log2(point * (1.0f / 0.18f));
    const float thin = touch.thin * std::exp2(0.6f * octaves);
    const float thinned = thin > 1.0f ? std::sqrt(thin / touch.thin) : 1.0f;
    // What the second impulse leaves of a wire's power.
    float left = 0.0f, whole = 0.0f;
    for (int n = 1; n <= 8; ++n) {
      const float fall = std::pow(static_cast<float>(n), 2.0f * std::log2(touch.fall));
      const float s = 2.0f * std::sin(static_cast<float>(n) * kit::kPi * point);
      left += s * s * fall;
      whole += fall;
    }
    const float comb = std::sqrt(left / whole);
    voice.wires.comb = point;
    voice.wires.damp(voice.damped ? param(kRelease) : 0.0f, sr);
    voice.wires.hissing = touch.puff > 0.0f || touch.rub_noise > 0.0f;
    const float puff_decay = kit::time_to_coeff(
        voice.damped ? kit::min(touch.puff_seconds, param(kRelease) * (1.0f / kSixtyDb)) : touch.puff_seconds, sr);
    float whole_key = 1.0f;
    for (int i = -1; i < kWires; ++i) {
      const float hz = i < 0 ? voice.play_hz : sr / voice.wires.period[i];
      const float low = kit::clamp(hz * touch.body * std::exp2(octaves * 1.0f + near_end + hand), 60.0f, 0.4f * sr);
      const float high = kit::clamp((touch.pick_hz + touch.pick_track * hz) * std::exp2(octaves * 1.1f + near_end + hand), 80.0f,
                                    kit::min(5800.0f, 0.4f * sr));
      const float a = hz / low, b = hz / high;
      const float through = 1.0f / std::sqrt((1.0f + a * a) * (1.0f + b * b));
      if (i < 0) {
        whole_key = through;
        continue;
      }
      voice.wires.body_k[i] = 1.0f - std::exp(-kit::kTwoPi * low / sr);
      voice.wires.pick_k[i] = 1.0f - std::exp(-kit::kTwoPi * high / sr);
      voice.wires.high_k[i] = 1.0f - std::exp(-kit::kTwoPi * kit::min(thin * hz, 3200.0f) / sr);
      // The key's own loss is made good, and half of what a wire loses beside it.
      const float norm = kit::min(7.0f, std::pow(whole_key, -0.4f) * std::pow(through, -0.45f)) * thinned / comb;
      const float sharp = touch.thin > 1.0f ? kit::clamp(std::pow(hz * (1.0f / 330.0f), 0.35f), 0.4f, 1.3f) : 1.0f;
      voice.wires.pulse[i] = touch.pulse * norm * touch.gain * sharp * std::exp2(-0.25f * hand - 0.3f * kit::max(octaves, 0.0f));
      voice.wires.breath[i] = norm * touch.gain * std::sqrt(voice.wires.period[i]) * std::pow(voice.ratio[i], touch.dark);
      voice.wires.noise_decay[i] = puff_decay;
    }
  }

  float rim_loss() const {
    const float tied = param(spun_wire::kLacing);
    const float strung = kit::clamp(param(spun_wire::kStrung), 1.0f, 6.0f);
    return strung > 1.0f ? 0.015f * tied * tied / strung : 0.0f;
  }

  // --- the wheel ----------------------------------------------------------

  // Wire `passing` meets the plucker; what it is tied to hears of it later.
  void pass(Voice& voice, int passing, float strength) {
    using namespace spun_wire;
    const int n = voice.strung;
    const int wire = ((passing % n) + n) % n;
    const float wobble = param(kWobble);
    const float uneven = 1.0f - 0.95f * wobble * kUneven[wire] * kUneven[wire];
    touch(voice, wire, strength * uneven);
    const float tied = std::sqrt(param(kLacing));
    if (n < 2 || tied < 0.05f) return;
    const float gap = kit::clamp(0.31f / kit::max(voice.speed, 1.0f), 0.012f, 0.085f);
    float size = strength * uneven;
    for (int k = 1; k <= 3 && k < n; ++k) {
      size *= 0.95f * tied;
      const int other = (wire + k) % n;
      if (voice.echo_at[other] >= 0.0f && voice.echo_size[other] > size) continue;
      voice.echo_at[other] = gap * static_cast<float>(k);
      voice.echo_size[other] = size;
    }
  }

  // Plucks one wire: as much as it has lost, and a little more.
  void touch(Voice& voice, int wire, float strength) {
    const Plucker& with = plucker(voice.plucker);
    Wires& wires = voice.wires;
    const float want = strength * voice.force * voice.weight[wire] * voice.hand[wire];
    const float still = wires.amount[wire];
    const float size = kit::max(want - kRefill * still, kLeast * kit::max(kFull * want - still, 0.0f));
    if (size <= wires.pluck[wire]) return;
    wires.pluck[wire] = size;
    wires.puff[wire] = size * with.puff * wires.breath[wire];
  }

  // One tick of the wheel: its speed, the wires that pass.
  void turn(Voice& voice) {
    using namespace spun_wire;
    const float wander = voice.drift.next() * (0.02f + 0.26f * param(kWobble));
    const float spin = kit::min(param(kSpin) * geared(voice) * (1.0f + wander), kTopSpeed);
    const float rise = param(kRise);
    float forward = 0.0f;
    switch (voice.gesture) {
      case kOneTurn:
        if (voice.resting) break;
        voice.speed += (spin - voice.speed) * kit::min(1.0f, dt_ * 6.0f / rise);
        forward = kit::max(voice.speed, 0.08f * spin) * dt_;
        if (voice.passes >= voice.strung - 1) rest(voice);
        break;
      case kRocked: {
        if (voice.resting) break;
        const float reach = static_cast<float>(kWires);
        if (voice.held) {
          voice.swing += (1.0f - voice.swing) * kit::min(1.0f, dt_ * 2.2f / rise);
        } else {
          voice.swing -= dt_ / param(kCoast);
          if (voice.swing <= 0.02f) rest(voice);
        }
        const float before = voice.swing_at;
        voice.swing_phase += dt_ * spin / (kit::kTwoPi * reach);
        voice.swing_phase -= std::floor(voice.swing_phase);
        voice.swing_at = reach * voice.swing * kit::SineTable::lookup(voice.swing_phase);
        forward = voice.swing_at - before;
        voice.speed = (forward < 0.0f ? -forward : forward) / dt_;
        break;
      }
      default: {
        const bool driven = voice.held && !voice.coasting;
        if (driven) {
          if (voice.speed < 0.15f * spin) voice.speed += (0.15f * spin - voice.speed) * kit::min(1.0f, dt_ * 30.0f);
          voice.speed += (spin - voice.speed) * kit::min(1.0f, dt_ * 2.2f / rise);
          voice.coast_from = kit::max(voice.speed, 0.5f);
          if (voice.gesture == kThrown && voice.speed > 0.93f * spin) voice.coasting = true;
        } else if (!voice.resting) {
          const float held_up = voice.coasting && !voice.held ? 3.0f : 1.0f;
          if (!voice.coasting && voice.gesture == kDriven) voice.coasting = true;
          voice.speed -= dt_ * (2.0f / param(kCoast)) * (voice.gesture == kThrown ? held_up : 1.0f) *
                         std::sqrt(voice.coast_from * kit::max(voice.speed, 0.0f));
          if (voice.speed <= kStop) rest(voice);
        }
        forward = voice.speed * dt_;
        break;
      }
    }
    if (voice.resting) voice.speed = forward = 0.0f;
    voice.part += forward;
    const float shape = voice.gesture == kOneTurn ? 1.0f : 1.0f - melted(voice, voice.speed);
    const float force = std::sqrt(shape) * (0.55f + 0.45f * kit::min(1.0f, voice.speed / kit::max(spin, 0.1f)));
    // Passes too many to be told apart share out what they do.
    const float strength = often(voice.speed) * force;
    while (voice.part >= 1.0f) {
      voice.part -= 1.0f;
      ++voice.passes;
      if (strength > 0.02f) pass(voice, voice.passes, strength);
    }
    while (voice.part < 0.0f) {
      voice.part += 1.0f;
      if (strength > 0.02f) pass(voice, voice.passes, strength);
      --voice.passes;
    }
    for (int i = 0; i < kWires; ++i) {
      if (voice.echo_at[i] < 0.0f) continue;
      voice.echo_at[i] -= dt_;
      if (voice.echo_at[i] < 0.0f) touch(voice, i, voice.echo_size[i]);
    }
  }

  static float often(float speed) { return speed > 20.0f ? std::pow(20.0f / speed, 0.35f) : 1.0f; }

  void rest(Voice& voice) {
    voice.resting = true;
    voice.speed = 0.0f;
  }

  // A rocked wheel carries its tone only as it moves.
  float rocking(const Voice& voice) const {
    const float share = kit::min(1.0f, voice.speed / kit::max(param(spun_wire::kSpin) * voice.swing, 0.1f));
    return (0.08f + 0.92f * share * share * share) * kit::min(1.0f, 3.0f * voice.swing);
  }

  // How far a wheel at this speed is rubbed and no longer plucked, 0 to 1.
  float melted(const Voice& voice, float speed) const {
    if (speed < 0.5f) return 0.0f;
    // A card slaps on where a feather has long run together.
    const float octaves =
        std::log2(speed / param(spun_wire::kMelt)) - (voice.plucker == kCard ? 1.5f : 0.0f);
    const float t = kit::clamp((octaves + 1.5f) * (1.0f / 3.0f), 0.0f, 1.0f);
    return t * t * (3.0f - 2.0f * t);
  }

  // Where the wires stand in the field, and how hard each is rubbed.
  void aim(Voice& voice, bool snap) {
    using namespace spun_wire;
    const Plucker& with = plucker(voice.plucker);
    Wires& wires = voice.wires;
    const float angle = static_cast<float>(((voice.passes % 6) + 6) % 6) + voice.part;
    const float melt = voice.gesture == kOneTurn ? 0.0f : melted(voice, voice.speed);
    const float drive = std::sqrt(melt) * voice.rub_level * voice.force;
    const float heavy = param(kGauge) * param(kGauge);
    const float even = with.pulse > 0.0f ? 0.35f + 0.5f * param(kLacing) : 0.6f * param(kLacing);  // air only blows where it points
    // A card slaps from where it stands; the others are carried round.
    const float spread_to = voice.plucker == kCard ? 0.35f : 1.0f;
    voice.spread = snap ? spread_to : voice.spread + (spread_to - voice.spread) * 0.12f;
    const float swell = (1.0f + 0.45f * param(kWobble)) *
                        (1.0f - 0.85f * param(kWobble) * (0.5f + 0.5f * kit::SineTable::cos_lookup(angle * (1.0f / 6.0f) + 0.2f)));
    const float rocked = swell * (voice.gesture == kRocked ? rocking(voice) : 1.0f);
    for (int i = 0; i < kWires; ++i) {
      const float at = angle - static_cast<float>(i);
      const float turned = at * (1.0f / static_cast<float>(kWires));
      float near = 0.5f + 0.5f * kit::SineTable::cos_lookup(turned);
      if (with.pulse <= 0.0f) near *= 1.8f * near * near;
      const float rubbed = drive * (even + (1.0f - even) * near) * voice.weight[i] * voice.hand[i] * wires.on[i];
      wires.rub_to[i] = with.pulse > 0.0f ? rubbed * wires.lost[i] : 0.0f;
      wires.noise_gain[i] = rubbed * (with.rub_noise + 0.6f * heavy) * wires.breath[i] * std::sqrt(wires.lost[i]);
      const float pan = width_ * voice.spread * kit::SineTable::lookup(turned + 0.08f + 0.5f * voice.start_phase);
      const float loud_to = rocked * wires.on[i];
      voice.loud[i] = snap ? loud_to : voice.loud[i] + (loud_to - voice.loud[i]) * 0.12f;
      const float loud = voice.loud[i];
      const float a = (pan + 1.0f) * 0.125f;
      wires.pan_l_to[i] = loud * kit::SineTable::cos_lookup(a);
      wires.pan_r_to[i] = loud * kit::SineTable::lookup(a);
      if (snap) {
        wires.pan_l[i] = wires.pan_l_to[i];
        wires.pan_r[i] = wires.pan_r_to[i];
      }
    }
  }

  // --- one chunk ----------------------------------------------------------

  void restart() {
    ready_ = kChunk;
    ticks_ = 0;
    tail_ = 0.0f;
    for (int c = 0; c < 2; ++c) {
      top_[c].reset();
      dc_[c].reset();
      dc_[c].set_cutoff(18.0f, sample_rate());
      for (kit::Svf& mode : modes_[c]) mode.reset();
    }
    settle_knobs();
  }

  // Every gliding knob to its place.
  void settle_knobs() {
    width_ = param(spun_wire::kWidth);
    volume_.snap(kit::db_to_gain(param(spun_wire::kVolume)) * kLevel);
    glide_hub(1.0f);
  }

  // The hub on its way to where it should be. Another hub's resonances are
  // put in while nothing is heard through them.
  void glide_hub(float share) {
    using namespace spun_wire;
    const int wanted = kit::clamp_int(static_cast<int>(param(kHub) + 0.5f), 0, 2);
    const Hub& to = hub(wanted);
    const float rim = std::pow(param(kRim), 0.8f);
    const float sr = sample_rate();
    const auto go = [share](float* value, float target) {
      const float left = target - *value;
      *value = (left < 1.0e-5f && left > -1.0e-5f) ? target : *value + left * share;
    };
    const float before = dry_ + top_log_;
    go(&dry_, 1.0f + (to.dry - 1.0f) * rim);
    go(&top_log_, std::log2(to.top_hz) * rim + std::log2(kOpen) * (1.0f - rim));
    go(&wet_, wanted == hub_on_ ? to.wet * rim : 0.0f);
    const bool swap = wanted != hub_on_ && (share >= 1.0f || wet_ < 0.02f);
    if (swap) {
      hub_on_ = wanted;
      if (share >= 1.0f) wet_ = to.wet * rim;
    }
    for (int c = 0; c < 2; ++c) {
      if (share >= 1.0f || dry_ + top_log_ != before) top_[c].set_cutoff(kit::min(std::exp2(top_log_), 0.45f * sr), sr);
      if (!swap && share < 1.0f) continue;
      for (int m = 0; m < 6; ++m) {
        if (swap) modes_[c][m].reset();
        modes_[c][m].set(to.hz[m] * (m % 2 == c ? 1.018f : 0.982f), to.q[m], sr);
      }
    }
  }

  void render_chunk() {
    using namespace spun_wire;
    ready_ = 0;
    const auto approach = [this](float* value, float target) {
      const float left = target - *value;
      *value = (left < 1.0e-5f && left > -1.0e-5f) ? target : *value + left * glide_;
    };
    approach(&width_, param(kWidth));
    float dry = dry_, wet = wet_;
    glide_hub(0.5f * glide_);
    const float dry_step = (dry_ - dry) * (1.0f / static_cast<float>(kChunk));
    const float wet_step = (wet_ - wet) * (1.0f / static_cast<float>(kChunk));
    const float* mode_gain = hub(hub_on_).gain;
    volume_.set_target(kit::db_to_gain(param(kVolume)) * kLevel);
    float left[kChunk] = {}, right[kChunk] = {};
    bool any = false;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = voices_[v];
      if (voice.state == kIdle) continue;
      any = true;
      if (voice.state == kWaiting) begin(voice);
      voice_chunk(voice, v, left, right);
    }
    ++ticks_;
    for (int i = 0; i < kChunk; ++i) {
      const float volume = volume_.next();
      dry += dry_step;
      wet += wet_step;
      float out[2] = {left[i], right[i]};
      for (int c = 0; c < 2; ++c) {
        const float x = dc_[c].process(out[c]);
        float body = 0.0f;
        for (int m = 0; m < 6; ++m) body += modes_[c][m].bandpass(x) * mode_gain[m];
        out[c] = kit::soft_clip((top_[c].lowpass(x) * dry + body * wet) * volume);
      }
      chunk_left_[i] = out[0];
      chunk_right_[i] = out[1];
    }
    tail_ = any ? 0.0f : tail_ + dt_;
    if (tail_ > kTailSeconds) awake_ = false;
  }

  void voice_chunk(Voice& voice, int index, float* left, float* right) {
    Wires& wires = voice.wires;
    const bool fading = voice.state == kFading;
    if (!fading) {
      if (voice.restrike) throw_wheel(voice);
      // One voice a tick works its wires out anew, when a knob has moved and
      // the last change has gone in.
      if (voice.designed != serial_ && wires.fade == 0 && (ticks_ + index) % 3 == 0) {
        design(voice, false);
        voice.tone_wait = 0;
      }
      if (--voice.tone_wait <= 0 || voice.damped == voice.held) {
        tone(voice);
        voice.tone_wait = 12;
      }
      turn(voice);
      wires.rim_to = rim_loss();
    }
    aim(voice, false);
    wires.excite(voice.sign);
    float l[kChunk] = {}, r[kChunk] = {};
    const float peak = wires.run(l, r) * voice.fade;
    float gain = voice.fade;
    if (fading) {
      voice.fade = kit::max(0.0f, voice.fade - dt_ / kStealSeconds);
    }
    const float step = (voice.fade - gain) * (1.0f / static_cast<float>(kChunk));
    for (int i = 0; i < kChunk; ++i) {
      gain += step;
      left[i] += l[i] * gain;
      right[i] += r[i] * gain;
    }
    if (fading) {
      if (voice.fade <= 0.0f) {
        voice.state = kWaiting;
      }
      return;
    }
    voice.level = kit::max(peak, 0.05f * voice.gain * (voice.resting ? 0.0f : 1.0f));
    voice.quiet = (voice.resting && peak < kSilence) ? voice.quiet + dt_ : 0.0f;
    if (voice.quiet > 0.12f) {
      voice.state = kIdle;
      voice.level = 0.0f;
      voice.held = false;
    }
  }

  Voice voices_[kMaxVoices];
  kit::Svf modes_[2][6];
  kit::OnePole top_[2];
  kit::DcBlocker dc_[2];
  kit::Smoother volume_;
  float chunk_left_[kChunk] = {}, chunk_right_[kChunk] = {};
  float dry_ = 1.0f, wet_ = 0.0f, top_log_ = 14.0f;
  int hub_on_ = 0;
  float width_ = 0.5f;
  float dt_ = 0.001f, glide_ = 0.1f, tail_ = 0.0f;
  int ready_ = kChunk;
  uint32_t stamp_ = 0, serial_ = 1, ticks_ = 0;
  bool awake_ = false;
};

}  // namespace livemix
