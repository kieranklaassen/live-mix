#pragma once

// Bent Blade: a steel blade bent into an S. Where its curve turns over, the
// steel keeps one pure note that cannot get out.
//
//   key ─► glide law ─► pitch ─► the trap (up to 8 notes held by the curve)
//                                 │ first well  A+ A-   ┐ each note is split in
//   bow, mallet, thumb, breath ─► │ second well B+ B-   ┘ two by tunnelling
//                                 │
//                                 └► blade speed ─► friction ─► edge ─────┐
//                                        └► grain ─► 12 short steel modes ┴► out
//
// - A curve that turns over at one place traps bending waves there. For a
//   curvature that grows evenly to both sides the square of a trapped note's
//   frequency is a level of the well -d2 + k4, whose levels are kLevels. The
//   note played is the lowest; the rest stand at sqrt((level + floor) /
//   (level 0 + floor)), and Well Width moves the floor. Concord draws them to
//   the nearest open interval.
// - Bend is how deep the well is: how many notes it holds, and how well. A
//   note near the rim leaks out sooner.
// - Two wells tunnel. A note shared by two wells is two notes Tunnel hertz
//   apart, so what was put into the first is in the second half a beat later
//   and comes back. This is kept as it is in fact: two modes for each well,
//   and the beat is their sum. Wells at a fifth or an octave exchange the
//   same way. Upper notes reach further and tunnel faster.
//   The second well is kept to its four lowest notes.
// - A mode is one complex number turned and shrunk every sample. A bow or a
//   breath holds its length near a level (regulate) and leaves its phase
//   alone, and noise moves it; a strike pushes it along its own phase.
// - Friction is heard, not only used: the blade's speed under the bow goes
//   through a slip curve, whose harmonics and whose grain (noise let through
//   while the bow slips) ring the short modes the curve does not trap. It
//   feeds nothing back, so it cannot run away and cannot pull the pitch. A
//   tone rings a steel mode to its own level whatever its life, noise by its
//   band, so neither a long life nor the sample rate makes it loud.
// - Wind jumps from one trapped note to the next as it rises and falls, so a
//   breath has no fixed colour (gust).
// - Upper notes fall away with their frequency and not only their number, so
//   a high key does not pierce. Keys stand to the left and right in turn.
// - Tremble moves the trap along the blade: a little pitch, the odd notes in
//   and out (they have a node in the middle), and the place between the ears.
//
// Keys together make room for one another, and a guard turns down what would
// still meet the clip. All control runs on a 64-sample clock that restarts when a note finds
// nothing sounding, so the output does not depend on the block size. Asleep
// when every blade has rung out.

#include "../../kit/kit.h"
#include "params.gen.h"

// The rows of modes are vectors whether or not the build asks for them.
#if defined(__clang__) && defined(__wasm__) && !defined(__wasm_simd128__)
#pragma clang attribute push(__attribute__((target("simd128"))), apply_to = function)
#endif

namespace livemix {

class BentBlade : public kit::DeviceBase<bent_blade::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kNotes = 8;              // a well holds at most
  static constexpr int kTrapped = 4 * kNotes;   // A+ A- B+ B-
  static constexpr int kSteelModes = 12;
  static constexpr int kLanes = kTrapped + kSteelModes;
  enum Exciter : int { kBow = 0, kMallet, kThumb, kBreath };
  enum Well : int { kNoWell = 0, kTwin, kFifthWell, kOctaveWell };
  enum Law : int { kStraight = 0, kNearest, kFromOne };
  enum Meter : int { kMeterNear = 0, kMeterFar, kMeterShake, kMeterPitch };

  void init(float sample_rate) {
    using namespace bent_blade;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (Voice& voice : voices_) voice = Voice();
    chunk_left_ = 0;
    room_ = guard_ = 1.0f;
    room_step_ = guard_step_ = top_ = chunk_top_ = 0.0f;
    stamp_ = 0;
    ticks_ = gesture_tick_ = 0;
    prior_count_ = 0;
    last_pitch_ = gesture_from_ = 0.0f;
    tick_seconds_ = static_cast<float>(kChunk) / sr;
    noise_scale_ = std::sqrt(sr * (1.0f / 48000.0f));
    for (kit::Smoother& knob : knobs_) knob.set_time(0.015f, sr / static_cast<float>(kChunk));
    volume_.set_time(0.02f, sr);
    snap_knobs();
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    if (!store_param(id, value)) return;
    if (!primed() || count_sounding() == 0) {
      snap_knobs();
      return;
    }
    for (int k = 0; k < kNumKnobs; ++k) {
      if (knob_param(k) == id) knobs_[k].set_target(knob_target(k));
    }
    if (id == bent_blade::kVolume) volume_.set_target(kit::db_to_gain(param(id)));
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (count_sounding() == 0) restart();
    // Every note this id still holds is let go; an old ring at this pitch is
    // taken over by the new one.
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (voice.pending) {
        if (voice.pending_id == note_id) voice.pending_held = false;
        continue;
      }
      if (voice.held && voice.note_id == note_id) voice.held = false;
      if (!voice.held && voice.frequency == frequency && voice.fade_step == 0.0f) {
        voice.fade_step = 1.0f / (kTakeOverSeconds * sample_rate());
      }
    }
    float wait = 0.0f;
    const float from = slide_from(std::log2(frequency), &wait);
    Voice& voice = voices_[pick()];
    voice.stamp = ++stamp_;
    voice.pending_id = note_id;
    voice.pending_held = true;
    voice.pending_frequency = frequency;
    voice.pending_gain = gain;
    voice.pending_from = from;
    voice.pending_wait = wait;
    voice.follow = expected(gain);
    if (voice.sounding) {
      voice.pending = true;
      voice.fade_step = 1.0f / (kStealSeconds * sample_rate());
    } else {
      start(voice);
    }
  }

  void note_off(int note_id) {
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (voice.pending && voice.pending_id == note_id) voice.pending_held = false;
      if (voice.held && voice.note_id == note_id) voice.held = false;
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(count_sounding() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    int done = 0;
    while (done < frames) {
      if (chunk_left_ == 0) {
        control();
        chunk_left_ = kChunk;
      }
      const int n = kit::clamp_int(frames - done, 1, chunk_left_);
      float left[kChunk] = {}, right[kChunk] = {};
      for (Voice& voice : voices_) {
        if (voice.sounding) render_voice(voice, n, left, right);
      }
      float room = room_, guard = guard_, top = chunk_top_;
      for (int i = 0; i < n; ++i) {
        room += room_step_;
        guard += guard_step_;
        const float volume = volume_.next() * room;
        const float l = left[i] * volume, r = right[i] * volume;
        top = kit::max(top, kit::max(std::fabs(l), std::fabs(r)));
        out_left_[done + i] = kit::soft_clip(l * guard);
        out_right_[done + i] = kit::soft_clip(r * guard);
      }
      room_ = room;
      guard_ = guard;
      chunk_top_ = top;
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // The newest key that is down, or with none the newest that rings: how much
  // of it is in the first bend and in the second, how far the knee has it now,
  // and where its slide is. With none, nothing.
  float meter(int index) const {
    const Voice* newest = nullptr;
    for (const Voice& voice : voices_) {
      if (!voice.sounding || voice.pending) continue;
      if (!newest || (voice.held != newest->held ? voice.held : voice.stamp > newest->stamp)) newest = &voice;
    }
    if (!newest) return 0.0f;
    switch (index) {
      case kMeterNear:
        return in_bend(*newest, 0);
      case kMeterFar:
        return in_bend(*newest, 2);
      case kMeterShake: {
        const bool drawn = newest->exciter == kBow || newest->exciter == kBreath;
        const float onset = drawn ? smooth(kit::min(newest->age * 1.1f, 1.0f)) : 0.5f + 0.5f * std::exp(-0.5f * newest->age);
        return onset * common_.tremble * wave(newest->tremble_phase);
      }
      case kMeterPitch:
        return newest->frequency * std::exp2(slide_now(*newest));
      default:
        return 0.0f;
    }
  }

 private:
  static constexpr int kChunk = 64;
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kLevel = 0.16f;
  static constexpr float kStealSeconds = 0.004f;
  static constexpr float kTakeOverSeconds = 0.08f;
  static constexpr float kGestureSeconds = 0.06f;  // keys closer than this are one chord
  static constexpr float kFadeHz = 9000.0f;        // modes go out between these,
  static constexpr float kTopHz = 12000.0f;        // the same at every sample rate
  static constexpr float kSilence = 1.0e-6f;
  static constexpr float kAsymmetry = 0.1f;        // what never tunnels away

  // Four modes side by side. The compilers build this with or without vector
  // instructions, with the same result.
  typedef float F4 __attribute__((vector_size(16)));
  typedef float F4Alias __attribute__((vector_size(16), may_alias));
  static F4 load(const float* p) { return *reinterpret_cast<const F4Alias*>(p); }
  static void store(float* p, F4 v) { *reinterpret_cast<F4Alias*>(p) = v; }

  enum Knob : int {
    kBendKnob = 0, kWellKnob, kConcordKnob, kFarKnob, kTunnelKnob, kPressureKnob, kRaspKnob, kLeakKnob, kDampKnob,
    kSteelKnob, kEdgeKnob, kTrembleKnob, kRateKnob, kWanderKnob, kWidthKnob, kNumKnobs
  };

  struct Voice {
    // Per mode: the turn a sample with its decay, the state, the output gains
    // and their ramps, how much noise and how much tone it takes, how much the
    // bow sees of it, and the push of a strike that is going in.
    alignas(16) float step_re[kLanes] = {};
    alignas(16) float step_im[kLanes] = {};
    alignas(16) float re[kLanes] = {};
    alignas(16) float im[kLanes] = {};
    alignas(16) float left[kLanes] = {};
    alignas(16) float right[kLanes] = {};
    alignas(16) float left_step[kLanes] = {};
    alignas(16) float right_step[kLanes] = {};
    alignas(16) float noise_in[kLanes] = {};
    alignas(16) float tone_in[kLanes] = {};
    alignas(16) float bow[kTrapped] = {};
    alignas(16) float push_re[kLanes] = {};
    alignas(16) float push_im[kLanes] = {};
    float phase_re[kTrapped] = {}, phase_im[kTrapped] = {};
    float share[kTrapped] = {};  // of a note, what this mode of it holds
    // What ramps over a chunk outside the modes.
    float body = 0.0f, body_step = 0.0f, grain = 0.0f, grain_step = 0.0f;
    float drive = 1.0f, drive_step = 0.0f, air = 0.0f, air_step = 0.0f, fret = 0.0f, fret_step = 0.0f;
    float body_left = 0.7f, body_right = 0.7f;
    kit::Svf body_filter, grain_filter;
    kit::OnePole air_filter;
    kit::DcBlocker dc;
    uint32_t noise_state = 1;
    float noise_low = 0.0f, noise_cut = 1.0f;
    int exciter = 0, well = 0, law = 0, blocks = 2;
    int pulse_at = 0, pulse_length = 0;
    float root = 1.0f, ring_size = 1.0f, tunnel_size = 1.0f, even = 1.0f, air_size = 1.0f;
    float frequency = 440.0f, size = 1.0f, gain = 0.5f, hit = 0.5f;
    float pitch = 0.0f, slide = 0.0f, slide_at = 1.0f, slide_seconds = 1.0f, close = 0.0f;  // octaves
    float swell = 0.0f, gate = 0.0f, contact = 0.0f, age = 0.0f;
    float tremble_phase = 0.0f, wander_phase[4] = {}, place = 0.0f, side = 1.0f, tunnel_skew = 1.0f;
    float wait = 0.0f, open = 1.0f, gust = 0.0f;  // before a slide leaves, and how far a chord from one has opened
    float fade = 1.0f, fade_step = 0.0f, follow = 0.0f, coming = 0.0f;
    int note_id = -1, pending_id = -1;
    float pending_frequency = 440.0f, pending_gain = 0.0f, pending_from = 0.0f, pending_wait = 0.0f;
    uint32_t stamp = 0;
    bool sounding = false, held = false, pending = false, pending_held = false;
    bool first_tick = false;
  };

  // What all voices take from the knobs, once a tick.
  struct Common {
    float ratio[kNotes], far_ratio[kNotes], trapped[kNotes];
    float tunnel, ring, choke_power, tilt, clang, bright, grain_hz, air_pole, breath_pole, steel_life, drawn_in, leak, far, width, tremble, rate, wander, edge, pressure, rasp, steel, bend;
  };

  // --- knobs ---------------------------------------------------------------

  static int knob_param(int knob) {
    using namespace bent_blade;
    static const int kIds[kNumKnobs] = {kBend, kWellWidth, kConcord, kFarWell, kTunnel, kPressure, kRasp, kLeak,
                                        kDamp, kSteel, kEdge, kTremble, kRate, kWander, kWidth};
    return kIds[knob];
  }
  float knob_target(int knob) const {
    const float value = param(knob_param(knob));
    return knob == kTunnelKnob || knob == kRateKnob ? std::log2(value) : value;
  }
  void snap_knobs() {
    for (int k = 0; k < kNumKnobs; ++k) knobs_[k].snap(knob_target(k));
    volume_.snap(kit::db_to_gain(param(bent_blade::kVolume)));
    common_fresh_ = false;
  }
  int choice(int id) const { return static_cast<int>(param(id) + 0.5f); }

  int count_sounding() const {
    int count = 0;
    for (const Voice& voice : voices_) count += voice.sounding ? 1 : 0;
    return count;
  }

  // The first note of a silence: knobs where they point, the clock with it.
  void restart() {
    snap_knobs();
    room_ = guard_ = 1.0f;
    room_step_ = guard_step_ = top_ = chunk_top_ = 0.0f;
    chunk_left_ = 0;
    ticks_ = 0;
    gesture_tick_ = -1;
    prior_count_ = 0;
    last_pitch_ = 0.0f;
  }

  // Where a note's slide starts, in octaves from where it ends, and how many
  // slides it waits before it leaves.
  float slide_from(float pitch, float* wait) {
    const bool first = gesture_tick_ < 0;
    const long window = static_cast<long>(kGestureSeconds / tick_seconds_);
    if (first || ticks_ - gesture_tick_ > window) {
      gesture_tick_ = ticks_;
      gesture_size_ = 0;
      prior_count_ = 0;
      for (const Voice& voice : voices_) {
        if (voice.sounding && voice.fade_step == 0.0f) prior_[prior_count_++] = voice.pitch;
      }
      gesture_from_ = last_pitch_ != 0.0f ? last_pitch_ : pitch;
    }
    float from = pitch - kScoop;
    switch (choice(bent_blade::kGlideLaw)) {
      case kStraight:
        // The keys of a chord leave one after another.
        from = last_pitch_ != 0.0f ? last_pitch_ : pitch - 5.0f / 12.0f;
        *wait = kLeave * static_cast<float>(kit::clamp_int(gesture_size_, 0, 6));
        break;
      case kNearest: {
        float best = 1.0e9f;
        for (int i = 0; i < prior_count_; ++i) {
          const float apart = std::fabs(prior_[i] - pitch);
          if (apart < best) {
            best = apart;
            from = prior_[i];
          }
        }
        break;
      }
      default:
        if (gesture_from_ != pitch) from = gesture_from_;
        break;
    }
    last_pitch_ = pitch;
    ++gesture_size_;
    return from - pitch;
  }
  static constexpr float kLeave = 0.9f;
  static constexpr float kScoop = 1.0f / 12.0f;

  // The voice a new note takes: an idle one, else the quietest let go, else
  // the quietest held; one a note already waits in only when there is no other.
  int pick() const {
    int choice = -1;
    for (int pass = 0; pass < 4 && choice < 0; ++pass) {
      for (int v = 0; v < kMaxVoices; ++v) {
        const Voice& voice = voices_[v];
        if (pass == 0 && voice.sounding) continue;
        if (pass == 1 && (voice.pending || voice.held)) continue;
        if (pass == 2 && voice.pending) continue;
        if (choice < 0) {
          choice = v;
          continue;
        }
        const Voice& best = voices_[choice];
        const bool older = voice.stamp < best.stamp;
        if (pass == 0 ? older : voice.follow < best.follow || (voice.follow == best.follow && older)) choice = v;
      }
    }
    return choice;
  }

  static float hit_of(float gain) { return gain * (0.75f + 0.25f * gain); }
  static float expected(float gain) { return kit::max(hit_of(gain), kSilence); }

  // --- a note begins -------------------------------------------------------

  void start(Voice& voice) {
    const float frequency = voice.pending_frequency;
    for (int k = 0; k < kLanes; ++k) voice.re[k] = voice.im[k] = voice.push_re[k] = voice.push_im[k] = 0.0f;
    voice.exciter = choice(bent_blade::kExciter);
    voice.well = choice(bent_blade::kSecondWell);
    voice.law = choice(bent_blade::kGlideLaw);
    voice.note_id = voice.pending_id;
    voice.held = voice.pending_held;
    voice.pending = false;
    voice.sounding = true;
    voice.first_tick = true;
    voice.frequency = frequency;
    voice.gain = voice.pending_gain;
    voice.hit = hit_of(voice.gain);
    voice.pitch = std::log2(frequency);
    voice.size = frequency * (1.0f / 220.0f);
    voice.root = std::sqrt(voice.size);
    voice.ring_size = kit::clamp(std::pow(voice.size, -0.3f), 0.4f, 1.7f);
    voice.tunnel_size = std::pow(voice.size, 0.4f);
    voice.even = kit::clamp(voice.size < 1.0f ? std::pow(voice.size, 0.03f) : std::pow(voice.size, -0.1f), 0.3f, 1.2f);
    voice.air_size = kit::clamp(std::pow(voice.size, -0.15f), 0.6f, 1.3f);
    kit::Rng rng;
    rng.seed(0xB1ADEu + voice.stamp * 2654435761u + static_cast<uint32_t>(frequency * 16.0f));
    for (int i = 0; i < 4; ++i) rng.next_u32();
    voice.noise_state = rng.next_u32() | 1u;
    const float glide = param(bent_blade::kGlide);
    voice.slide = voice.pending_from;
    voice.slide_at = glide > 0.011f ? 0.0f : 1.0f;
    static const float kTakes[3] = {1.1f, 1.0f, 4.0f};  // a whole chord opens slowly
    voice.slide_seconds = glide * kTakes[voice.law] * (0.88f + 0.24f * rng.uniform());
    voice.wait = glide > 0.011f ? voice.pending_wait * glide : 0.0f;
    voice.close = voice.swell = voice.gate = voice.age = 0.0f;
    voice.contact = 1.0f;
    voice.tremble_phase = rng.uniform();
    for (float& phase : voice.wander_phase) phase = rng.uniform();
    voice.place = rng.bipolar();
    voice.side = (voice.stamp & 1) ? 1.0f : -1.0f;
    voice.tunnel_skew = 0.88f + 0.24f * rng.uniform();
    voice.fade = 1.0f;
    voice.fade_step = 0.0f;
    voice.follow = expected(voice.gain);
    voice.coming = 0.5f * voice.hit;
    voice.body = voice.grain = voice.air = voice.fret = 0.0f;
    voice.body_filter.reset();
    voice.grain_filter.reset();
    voice.air_filter.reset();
    voice.dc.reset();
    voice.dc.set_cutoff(20.0f, sample_rate());
    voice.noise_low = 0.0f;
    // How a trapped note is divided over its wells, and the phases that put
    // all of it into the first well as it begins.
    const bool two = voice.well != kNoWell;
    for (int n = 0; n < kNotes; ++n) {
      const float turn = rng.uniform();
      for (int group = 0; group < 4; ++group) {
        static const float kTurn[4] = {0.0f, 0.0f, 0.25f, 0.75f};
        const float phase = turn + kTurn[group];
        const int k = group * kNotes + n;
        voice.phase_re[k] = kit::SineTable::cos_lookup(phase);
        voice.phase_im[k] = kit::SineTable::lookup(phase);
        voice.share[k] = two ? 0.5f + (group == 0 ? kAsymmetry : group == 1 ? -kAsymmetry : 0.0f)
                             : (group == 0 ? 1.0f : 0.0f);
      }
    }
    voice.pulse_at = voice.pulse_length = 0;
    if (voice.exciter == kMallet || voice.exciter == kThumb) strike(voice, rng);
  }

  // How steeply the trapped notes fall away above the first.
  float slope(const Voice& voice, float edge, float pressure) const {
    switch (voice.exciter) {
      case kMallet:
        return kit::clamp(0.08f + 0.78f * edge + 0.25f * pressure + 0.3f * (voice.gain - 0.7f), 0.03f, 0.97f);
      case kThumb:
        return kit::clamp(0.36f + 0.5f * edge + 0.15f * pressure + 0.25f * (voice.gain - 0.7f), 0.1f, 0.98f);
      case kBreath:
        return kit::clamp(0.4f + 0.45f * edge + 0.15f * pressure + 0.2f * (voice.gain - 0.7f), 0.03f, 0.95f);
      default:
        return kit::clamp(0.14f + 0.64f * edge + 0.2f * pressure + 0.3f * (voice.gain - 0.7f), 0.03f, 0.94f);
    }
  }

  // Level of each trapped note, of about the same power whatever the slope.
  void weights(const Voice& voice, const Common& c, float pressure, float* out) const {
    const float fall = kit::clamp(slope(voice, c.edge, pressure) + 0.36f * (c.bend - 0.5f), 0.03f, 0.97f);
    const float upper = (0.15f + 0.85f * voice.open) * (1.15f - 0.5f * c.leak);
    float level = 1.0f, power = 0.0f;
    for (int n = 0; n < kNotes; ++n) {
      // Wind jumps from note to note as it rises and falls.
      const float off = static_cast<float>(n) - voice.gust;
      const float gust = voice.exciter != kBreath ? 1.0f : (n == 0 ? 0.4f : 0.12f) + 1.1f / (1.0f + 1.6f * off * off);
      out[n] = level * gust * c.trapped[n] * (voice.exciter == kThumb && (n & 1) ? 1.25f : 1.0f) * (n > 0 ? upper : 1.0f);
      power += out[n] * out[n];
      level *= fall;
    }
    // A shallow or a leaking bend holds less of what is put into it.
    const float kept = (0.45f + 0.55f * kit::min(2.0f * c.bend, 1.0f)) *
                       (voice.exciter == kBow || voice.exciter == kBreath ? 1.0f - 0.45f * c.leak : 1.0f);
    const float even = kept / std::pow(kit::max(power, 0.01f), 0.42f);
    for (int n = 0; n < kNotes; ++n) out[n] *= even;
  }

  void strike(Voice& voice, kit::Rng& rng) {
    refresh_common();
    const Common& c = common_;
    const float swell = param(bent_blade::kSwell);
    const bool thumb = voice.exciter == kThumb;
    const float seconds = ((thumb ? 0.0006f : 0.0016f) + std::pow(swell, 0.7f) * (thumb ? 0.03f : 0.07f)) *
                          (1.25f - 0.5f * voice.gain);
    // A long touch wakes less of what lies above.
    float level[kNotes];
    weights(voice, c, c.pressure, level);
    const float spare = 1.0f / (1.0f + 14.0f * seconds);
    float lose = 1.0f;
    for (float& note : level) {
      note *= lose;
      lose *= spare;
    }
    voice.pulse_at = 0;
    voice.pulse_length = kit::clamp_int(static_cast<int>(seconds * sample_rate() + 0.5f), 8, 1 << 20);
    // What is lost while a long touch goes in, and a short ring, are made up for.
    const float ring = c.ring * voice.ring_size * (thumb ? 0.42f : 1.0f);
    const float lost = kSixtyDb * seconds / kit::max(ring, 0.05f);
    const float struck = kStruck * kit::min(lost / (1.0f - std::exp(-lost)), 4.0f) *
                         kit::clamp(std::pow(4.0f / kit::max(ring, 0.01f), 0.2f), 0.8f, 1.7f);
    for (int k = 0; k < kTrapped; ++k) {
      const float amount = struck * voice.hit * level[k % kNotes] * voice.share[k];
      voice.push_re[k] = amount * voice.phase_re[k];
      voice.push_im[k] = amount * voice.phase_im[k];
    }
    // The plain steel answers a hard, quick blow.
    const float hard = (thumb ? 0.6f : 0.25f) + 0.9f * c.pressure;
    voice.coming = voice.hit * (0.9f * struck + 1.5f * kClang * hard * c.clang);
    voice.follow = kit::max(voice.coming, kSilence);
    float tilt = 1.0f;
    const float fall = kit::clamp(0.45f + 0.35f * c.edge + 0.15f * c.pressure - 4.0f * seconds, 0.2f, 0.93f);
    for (int j = 0; j < kSteelModes; ++j) {
      const float amount = kClang * hard * voice.hit * tilt * (0.75f + 0.5f * rng.uniform());
      const float phase = rng.uniform();
      voice.push_re[kTrapped + j] = amount * kit::SineTable::cos_lookup(phase);
      voice.push_im[kTrapped + j] = amount * kit::SineTable::lookup(phase);
      tilt *= fall;
    }
  }
  static constexpr float kStruck = 2.0f;
  static constexpr float kClang = 0.3f;

  // --- once a tick ---------------------------------------------------------

  // Open intervals a trapped note may be drawn to.
  static float open_interval(float ratio, float above) {
    static const float kSteps[4] = {1.0f, 1.125f, 1.3333333f, 1.5f};
    float best = ratio, nearest = 1.0e9f, octave = 1.0f;
    for (int o = 0; o < 4; ++o, octave *= 2.0f) {
      for (float step : kSteps) {
        const float place = octave * step;
        if (place <= above * 1.01f) continue;
        const float apart = std::fabs(std::log2(place / ratio));
        if (apart < nearest) {
          nearest = apart;
          best = place;
        }
      }
    }
    return best;
  }

  // The well as the knobs have it now.
  void refresh_common() {
    bool moved = !common_fresh_;
    for (kit::Smoother& knob : knobs_) {
      if (knob.settled()) continue;
      knob.next();
      moved = true;
    }
    if (!moved) return;
    common_fresh_ = true;
    Common& c = common_;
    c.bend = knobs_[kBendKnob].value;
    c.far = knobs_[kFarKnob].value;
    c.width = knobs_[kWidthKnob].value;
    c.tremble = knobs_[kTrembleKnob].value;
    c.wander = knobs_[kWanderKnob].value;
    c.edge = knobs_[kEdgeKnob].value;
    c.pressure = knobs_[kPressureKnob].value;
    c.rasp = knobs_[kRaspKnob].value;
    c.steel = knobs_[kSteelKnob].value;
    c.drawn_in = 1.0f - (1.0f - knobs_[kConcordKnob].value) * (1.0f - knobs_[kConcordKnob].value);
    c.leak = knobs_[kLeakKnob].value;
    c.air_pole = std::exp(-kit::kTwoPi * (1400.0f + 4400.0f * c.edge) / sample_rate());
    c.breath_pole = std::exp(-kit::kTwoPi * (1700.0f + 1100.0f * c.edge) / sample_rate());
    c.tilt = 1.0f / (1500.0f * 1500.0f * std::exp2(4.4f * c.edge));
    c.bright = 520.0f * std::exp2(4.2f * c.edge);
    c.grain_hz = 520.0f * std::exp2(2.9f * c.edge);
    c.clang = 4.6f * std::sqrt(c.steel) * (0.15f + 0.85f * c.steel) * (1.4f - 0.95f * c.bend) * (0.8f + 0.5f * c.leak);
    c.steel_life = 0.06f * std::pow(45.0f, c.steel);
    c.tunnel = std::exp2(knobs_[kTunnelKnob].value);
    c.rate = std::exp2(knobs_[kRateKnob].value);
    c.ring = 60.0f * std::exp(-4.7f * knobs_[kLeakKnob].value) * (0.3f + 0.7f * c.bend);
    const float damp = knobs_[kDampKnob].value;
    c.choke_power = damp * (0.35f + 0.65f * damp * damp * damp);
    // Levels of the well an evenly growing curvature makes.
    static const float kLevels[kNotes] = {1.0604f, 3.7997f, 7.4557f, 11.6447f, 16.2618f, 21.2384f, 26.5285f, 32.0986f};
    const float floor = -0.8f + 0.1f * std::exp(4.6f * knobs_[kWellKnob].value);
    const float depth = 0.75f + 7.4f * c.bend;
    const float concord = c.drawn_in;
    float last = 1.0f;
    for (int n = 0; n < kNotes; ++n) {
      c.trapped[n] = 1.0f / (1.0f + std::exp(-2.4f * (depth - static_cast<float>(n))));
      float ratio = std::sqrt((kLevels[n] + floor) / (kLevels[0] + floor));
      if (n > 0) {
        last = open_interval(ratio, last);
        ratio = std::exp2(kit::lerp(std::log2(ratio), std::log2(last), concord));
      }
      c.ratio[n] = ratio;
      // The second well is a little narrower: its upper notes lie further out.
      c.far_ratio[n] = n == 0 ? 1.0f : std::pow(ratio, kit::lerp(1.05f, 1.0f, concord));
    }
  }

  void control() {
    ++ticks_;
    refresh_common();
    float crowd = 0.0f;
    bool fresh = true;
    for (Voice& voice : voices_) {
      if (voice.sounding) step(voice);
      fresh = fresh && (!voice.sounding || voice.age < 1.5f * tick_seconds_);
      if (voice.sounding) crowd += kit::min(voice.follow, 4.0f);
    }
    // Many keys together make room for one another, softly.
    const float wanted = 1.0f / std::sqrt(1.0f + 0.5f * kit::max(crowd - 1.0f, 0.0f));
    if (fresh) room_ = wanted;
    const float now = room_ + (wanted - room_) * kit::min(tick_seconds_ / (wanted < room_ ? 0.1f * kRoomSeconds : kRoomSeconds), 1.0f);
    room_step_ = (now - room_) * (1.0f / kChunk);
    // And what still comes near the clip is turned down before it gets there.
    top_ = kit::max(chunk_top_, top_ * (1.0f - kit::min(tick_seconds_ / kGuardSeconds, 1.0f)));
    chunk_top_ = 0.0f;
    const float over = top_ - kGuardFrom;
    const float held = over > 0.0f ? (kGuardFrom + kGuardRoom * (1.0f - std::exp(-over / kGuardRoom))) / top_ : 1.0f;
    guard_step_ = (held - guard_) * (1.0f / kChunk);
  }
  static constexpr float kRoomSeconds = 0.06f;
  static constexpr float kGuardSeconds = 0.7f, kGuardFrom = 0.25f, kGuardRoom = 0.1f;

  // Each note of a bend is the sum of the two it is split in.
  static float in_bend(const Voice& voice, int group) {
    float power = 0.0f;
    for (int n = 0; n < kNotes; ++n) {
      const int a = group * kNotes + n, b = a + kNotes;
      const float re = voice.re[a] + voice.re[b], im = voice.im[a] + voice.im[b];
      power += re * re + im * im;
    }
    return std::sqrt(power);
  }

  static float smooth(float u) { return u * u * (3.0f - 2.0f * u); }
  static float wave(float phase) { return kit::SineTable::lookup(phase); }

  float slide_now(const Voice& voice) const {
    if (voice.slide_at >= 1.0f && voice.close <= 0.0f) return 0.0f;
    const float u = voice.slide_at;
    switch (voice.law) {
      case kStraight:
        return voice.slide * (1.0f - (0.75f * u + 0.25f * smooth(u)));
      case kNearest: {
        const float rest = 1.0f - u;
        return voice.slide * rest * rest * rest;
      }
      default:  // all wait together, then open, and close again when let go
        return voice.slide * (1.0f - smooth(kit::clamp((u - 0.28f) * (1.0f / 0.72f), 0.0f, 1.0f)) * (1.0f - smooth(voice.close)));
    }
  }

  void step(Voice& voice) {
    if (voice.fade <= 0.0f) {
      if (!voice.pending) {
        voice.sounding = false;
        return;
      }
      start(voice);
    }
    const Common& c = common_;
    const float dt = tick_seconds_;
    const bool first = voice.first_tick;
    voice.first_tick = false;
    const bool drawn = voice.exciter == kBow || voice.exciter == kBreath;
    voice.age += dt;
    voice.swell = kit::min(voice.swell + dt / kit::max(param(bent_blade::kSwell), 0.003f), 1.0f);
    voice.gate += ((voice.held ? 1.0f : 0.0f) - voice.gate) * kit::min(dt / (voice.held ? 0.02f : 0.07f), 1.0f);
    voice.contact = settle_to_zero(voice.contact * std::exp(-dt / (voice.exciter == kThumb ? 0.004f : 0.014f)));

    // Slow hands: bow speed, pressure and place, each on its own.
    static const float kWanderHz[4] = {0.23f, 0.41f, 0.157f, 0.31f};
    for (int i = 0; i < 4; ++i) {
      voice.wander_phase[i] += kWanderHz[i] * (1.0f + 0.2f * voice.place) * dt;
      voice.wander_phase[i] -= std::floor(voice.wander_phase[i]);
    }
    const float sway = 0.6f * wave(voice.wander_phase[0]) + 0.4f * wave(voice.wander_phase[1]);
    const float lean = 0.6f * wave(voice.wander_phase[2]) + 0.4f * wave(voice.wander_phase[3] + voice.wander_phase[0]);
    float speed = std::exp2((voice.exciter == kBreath ? 2.8f : 1.2f) * c.wander * sway);  // a breath comes in puffs
    const float pressure = kit::clamp(c.pressure * (1.0f + 0.75f * c.wander * lean), 0.0f, 1.0f);

    // The trap moves: a drawn blade is trembled once it speaks, a struck one
    // quivers from the blow and comes to rest.
    voice.tremble_phase += c.rate * (1.0f + 0.12f * c.wander * lean) * dt;
    voice.tremble_phase -= std::floor(voice.tremble_phase);
    const float onset = drawn ? smooth(kit::min(voice.age * 1.1f, 1.0f)) : 0.5f + 0.5f * std::exp(-0.5f * voice.age);
    const float shake = onset * c.tremble * wave(voice.tremble_phase);
    const float lift = onset * c.tremble * wave(voice.tremble_phase + 0.22f);
    if (drawn) speed *= 1.0f + 0.85f * lift;
    const float trap = shake + 0.5f * c.wander * lean;
    const float bend_cents = (18.0f + 20.0f * c.tremble) * shake + 2.5f * c.wander * sway +
                             (voice.exciter == kThumb ? 22.0f * voice.gain * std::exp(-voice.age * 22.0f) : 0.0f);
    voice.wait -= dt;
    if (voice.slide_at < 1.0f && voice.wait <= 0.0f) voice.slide_at = kit::min(voice.slide_at + dt / voice.slide_seconds, 1.0f);
    if (voice.law == kFromOne && voice.slide != 0.0f && !voice.held) {
      voice.close = kit::min(voice.close + dt / voice.slide_seconds, 1.0f);
    }
    const float away = slide_now(voice);
    voice.open = voice.law == kFromOne && voice.slide != 0.0f ? 1.0f - kit::clamp(away / voice.slide, 0.0f, 1.0f) : 1.0f;
    const float pitch = voice.frequency * std::exp2(away + bend_cents * (1.0f / 1200.0f));

    voice.gust = kit::max(2.6f * c.edge * (0.5f + 0.5f * voice.gain) * (1.0f + 1.6f * c.wander * lean) + 1.5f * c.wander * sway, 0.0f);
    float level[kNotes];
    weights(voice, c, pressure, level);
    tune(voice, c, pitch);
    regulate(voice, c, level, speed);
    const float loud = loudness(voice, c);
    place(voice, c, pitch, trap, loud * (1.0f + (drawn ? 0.35f : 0.65f) * lift), first);
    colour(voice, c, pitch, pressure, speed, loud, lift, sway, first);

    float power = 0.0f;
    for (int k = 0; k < kLanes; ++k) {
      const float amount = voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k];
      if (amount < 1.0e-18f) voice.re[k] = voice.im[k] = 0.0f;
      power += amount;
    }
    const float ringing = std::sqrt(power);
    const bool waiting = voice.pulse_at < voice.pulse_length || (drawn && voice.held);
    if (!voice.pending) voice.follow = waiting ? kit::max(ringing, voice.coming) : ringing;
    if (!waiting && ringing < 4.0f * kSilence && !voice.pending) voice.sounding = false;
  }

  float loudness(const Voice& voice, const Common& c) const {
    const float two = voice.well == kNoWell ? 1.0f : 1.0f / std::sqrt(0.5f + 0.4f * c.far);
    return kLevel * kWellLevel[voice.well] * voice.even * two / (1.0f + 0.45f * c.steel) * (voice.exciter == kBreath ? 1.55f : voice.exciter == kBow ? 1.0f : kStruckWell[voice.well]);
  }

  // Where a note of the second well lies. The fourth note of a well at the fifth
  // is the tone the two wells make together, an octave under the first.
  static float far_place(int well, int n, const Common& c) {
    static const float kPlace[4] = {1.0f, 1.0f, 1.5f, 0.5f};
    return well == kFifthWell && n == kResultant ? 0.5f : kPlace[well] * c.far_ratio[n];
  }
  static constexpr int kResultant = kNotes / 2 - 1;

  // Turn and decay of every mode.
  void tune(Voice& voice, const Common& c, float pitch) {
    const float sr = sample_rate();
    const float ring = c.ring * voice.ring_size * (voice.exciter == kThumb ? 0.42f : 1.0f);
    const bool drawn = voice.exciter == kBow || voice.exciter == kBreath;
    const float flutter = drawn ? 0.0f : kFlutter * c.rasp * c.rasp;  // what the noise adds, taken away
    const float tunnel = c.tunnel * kPace[voice.well] * voice.tunnel_size * voice.tunnel_skew;
    const float hurry = voice.held || voice.follow > kQuick ? 1.0f : 3.0f;  // the end of a long tail
    float hz[kLanes], nepers[kLanes];
    for (int n = 0; n < kNotes; ++n) {
      const float split = voice.well == kNoWell ? 0.0f : 0.5f * tunnel * (1.0f + 0.22f * static_cast<float>(n));
      const float here = pitch * c.ratio[n], there = pitch * far_place(voice.well, n, c);
      const float skew = split * (0.2f / 0.52f);  // puts the middle of the two on the note
      hz[n] = here + split - skew;
      hz[kNotes + n] = here - split - skew;
      hz[2 * kNotes + n] = there + split;
      hz[3 * kNotes + n] = there - split;
      const float held = c.trapped[n];
      float seconds = ring * held * held / (1.0f + 0.3f * static_cast<float>(n));
      if (!voice.held) seconds *= std::pow(kit::min(0.07f / kit::max(seconds, 0.001f), 1.0f), c.choke_power);
      const float rate = (hurry * kSixtyDb / kit::max(seconds, 0.02f) + flutter) / sr;
      for (int group = 0; group < 4; ++group) nepers[group * kNotes + n] = rate;
    }
    // The steel the curve does not trap: stiff, so its modes spread upward;
    // a bigger blade's lie lower, but less than its note does.
    // Concord draws each to the harmonic it stands nearest.
    float life = c.steel_life * (1.15f - 0.6f * c.bend);
    if (!voice.held) life *= std::pow(kit::min(0.07f / life, 1.0f), c.choke_power);
    const float drawn_in = c.drawn_in;
    for (int j = 0; j < kSteelModes; ++j) {
      const float x = static_cast<float>(j);
      const float own = 560.0f * voice.root * kSteelPlace[j];
      const float harmonic = kit::max(std::floor(own / voice.frequency + 0.5f), 1.0f);
      hz[kTrapped + j] = own + (harmonic * pitch - own) * drawn_in;
      nepers[kTrapped + j] = kSixtyDb / (life / (1.0f + 0.16f * x) * sr);
    }
    for (int k = 0; k < kLanes; ++k) {
      float length = 1.0f / (1.0f + nepers[k] + 0.5f * nepers[k] * nepers[k]);
      const float x = kit::min(kit::kPi * hz[k] / sr, 1.2f);
      const float x2 = x * x;
      const float t = x * (945.0f - x2 * (105.0f - x2)) / (945.0f - x2 * (420.0f - 15.0f * x2));
      const float over = length / (1.0f + t * t);
      voice.step_re[k] = (1.0f - t * t) * over;
      voice.step_im[k] = 2.0f * t * over;
      voice_hz_[k] = hz[k];
      voice_length_[k] = length;
    }
  }
  static constexpr float kQuick = 4.0e-4f;
  static constexpr float kFlutter = 0.5f;
  static constexpr float kSteelPlace[kSteelModes] = {1.0f,  1.61f, 2.31f, 3.12f, 4.02f, 4.98f,
                                                     6.07f, 7.2f,  8.41f, 9.7f,  11.0f, 12.6f};

  // A bow or a breath holds each mode near its level and leaves its phase to
  // itself; noise moves both. A struck mode is left to ring.
  void regulate(Voice& voice, const Common& c, const float* level, float speed) {
    const bool drawn = voice.exciter == kBow || voice.exciter == kBreath;
    const bool breath = voice.exciter == kBreath;
    const float dt = tick_seconds_;
    if (!drawn || !voice.held) {
      // Grain makes a struck blade flutter as it rings.
      const float stir = drawn ? 0.0f : c.rasp * std::sqrt(2.0f * kFlutter / sample_rate()) * 1.73f;
      for (int k = 0; k < kTrapped; ++k) {
        voice.noise_in[k] = stir == 0.0f ? 0.0f : stir * (std::fabs(voice.re[k]) + std::fabs(voice.im[k])) * 0.785f;
      }
    } else {
      const float rise = smooth(voice.swell) * voice.hit * speed * (breath ? kBreathTone : 1.0f);
      const float hold = breath ? 0.14f : kit::clamp(0.5f * param(bent_blade::kSwell), 0.012f, 0.06f);  // seconds
      const float k_hold = dt / hold;
      const float stir = std::sqrt(2.0f / ((breath ? 0.14f : 0.06f) * sample_rate())) * 1.73f;  // 1.73: the noise is uniform
      for (int k = 0; k < kTrapped; ++k) {
        const int n = k % kNotes;
        if (k >= 2 * kNotes && n >= kNotes / 2) continue;
        const float want = rise * level[n] * voice.share[k];
        const float re = voice.re[k], im = voice.im[k];
        const float is = std::sqrt(re * re + im * im);
        float turbulence = breath ? 0.32f + 0.55f * c.rasp + 0.1f * static_cast<float>(n)
                                  : 0.02f + 0.1f * c.rasp + (0.035f + 0.05f * c.rasp) * static_cast<float>(n);
        voice.noise_in[k] = want * stir * turbulence;
        if (want < 1.0e-6f && is < 1.0e-6f) continue;
        if (is < 0.002f * want || is < 1.0e-7f) {
          voice.re[k] = 0.003f * want * voice.phase_re[k];
          voice.im[k] = 0.003f * want * voice.phase_im[k];
          continue;
        }
        // The length a tick from now, spread over the samples of the chunk.
        const float grow = kit::clamp(1.0f + (want / is - 1.0f) * k_hold, 0.7f, 1.9f);
        const float nepers = 2.0f * (grow - 1.0f) / (grow + 1.0f);  // its logarithm, near enough
        const float each = (1.0f + nepers * (1.0f / kChunk)) / voice_length_[k];
        voice.step_re[k] *= each;
        voice.step_im[k] *= each;
      }
    }
    for (int j = 0; j < kSteelModes; ++j) {
      const float length = voice_length_[kTrapped + j];
      // A steady tone rings a mode to its own level, whatever its life; noise by its band.
      voice.tone_in[kTrapped + j] = 4.0f * (1.0f - length);
      voice.noise_in[kTrapped + j] = 0.26f * std::sqrt(1.0f - length * length) / noise_scale_;
    }
    // Wells of more than four notes cost a second row.
    float far = 0.0f;
    for (int n = kNotes / 2; n < kNotes; ++n) {
      far += level[n];
      for (int group = 0; group < 4; ++group) {
        const int k = group * kNotes + n;
        far += std::fabs(voice.re[k]) + std::fabs(voice.im[k]) + std::fabs(voice.push_re[k]);
      }
    }
    voice.blocks = far > 1.0e-5f ? 2 : 1;
    if (voice.blocks == 2) return;
    for (int k = 0; k < kTrapped; ++k) {
      if (k % kNotes >= kNotes / 2) voice.re[k] = voice.im[k] = 0.0f;
    }
  }

  // Where each mode is heard. The first well stands to one side and the
  // second to the other; the odd notes have their node in the middle of the
  // trap, so they come and go as it moves, and turn over when it crosses.
  void place(Voice& voice, const Common& c, float pitch, float trap, float loud, bool first) {
    const float spread = 0.7f * c.width * voice.place * (0.2f + 0.8f * voice.open);
    const bool two = voice.well != kNoWell;
    const float near_pan = two ? -0.55f * c.width * voice.side + 0.4f * spread + 0.3f * c.width * trap
                               : 0.55f * spread + 0.3f * c.width * trap;
    const float far_pan = kFarPan[voice.well] * c.width * voice.side + 0.3f * spread - 0.18f * c.width * trap;
    // From the near well to the far one, at equal power; the near never goes.
    const float across = 0.25f * c.far * (0.75f + 0.25f * c.far);
    const float far_gain = 1.45f * kit::SineTable::lookup(across);
    const float near_gain = !two ? 1.0f : kit::lerp(1.0f, kNear[voice.well], kit::min(2.0f * c.far, 1.0f)) * (0.2f + 0.8f * kit::SineTable::cos_lookup(across));
    const float stand = 0.3f + trap;
    const float odd = kit::clamp(1.6f * stand, -1.2f, 1.2f);
    const float even = 1.0f - 0.22f * kit::min(stand * stand, 2.0f);
    const float far_stand = -0.55f + 0.8f * trap;
    const float far_odd = kit::clamp(1.7f * far_stand, -1.2f, 1.2f);
    const float base = 1.0f + pitch * pitch * c.tilt;
    for (int group = 0; group < 4; ++group) {
      const bool is_far = group >= 2;
      for (int n = 0; n < kNotes; ++n) {
        const int k = group * kNotes + n;
        float pan = is_far ? far_pan : near_pan;
        pan += c.width * ((n & 1) ? 0.12f : -0.12f) * static_cast<float>(n > 0);
        float left, right;
        fast_pan(pan, &left, &right);
        // Dark above, so that a high key does not pierce.
        const float hz = voice_hz_[k];
        float level = loud * top_fade(hz) * kit::min(base / (1.0f + hz * hz * c.tilt), 1.0f);
        if (is_far && voice.well == kOctaveWell) level *= kit::min(hz * hz * (1.0f / (115.0f * 115.0f)), 1.0f);
        if (is_far) {
          level *= two ? far_gain * (n == 0 ? kFarFirst[voice.well] : kFarUpper[voice.well] * ((n & 1) ? far_odd : 0.8f)) : 0.0f;
          if (voice.well == kFifthWell && n == kResultant) level = loud * far_gain * 0.6f * kit::min(hz * hz * (1.0f / (115.0f * 115.0f)), 1.0f);
          if (voice.well == kTwin) level *= 0.7f + 0.3f * static_cast<float>(n);
        } else {
          level *= near_gain * (n == 0 ? 1.0f : kNearUpper[voice.well] * ((n & 1) ? odd : even));
        }
        go(voice, k, level * left, level * right, first);
        voice.bow[k] = is_far ? 0.0f : 1.0f / (1.0f + 0.35f * static_cast<float>(n));
      }
    }
    const float clang = loud * c.clang;
    float tilt = 1.0f;
    const float fall = 0.72f + 0.24f * c.edge;
    for (int j = 0; j < kSteelModes; ++j) {
      const int k = kTrapped + j;
      float left, right;
      fast_pan(((j & 1) ? 0.75f : -0.75f) * c.width, &left, &right);
      // Each of them comes forward and goes back by itself: the shimmer.
      const float glint = 1.0f + 0.85f * wave(voice.age * (0.21f + 0.037f * static_cast<float>(j)) + voice.wander_phase[j & 3] + 0.37f * static_cast<float>(j));
      const float level = clang * tilt * glint * top_fade(voice_hz_[k]);
      go(voice, k, level * left, level * right, first);
      tilt *= fall;
    }
  }

  // The twin is a thin bright ghost, the fifth a pure voice with the tone two
  // wells make under it, the octave a full one.
  static constexpr float kFarFirst[4] = {0.0f, 0.5f, 2.1f, 2.1f};
  static constexpr float kFarUpper[4] = {0.0f, 4.0f, 0.1f, 1.1f};
  static constexpr float kNear[4] = {1.0f, 0.9f, 0.45f, 0.35f};
  static constexpr float kStruckWell[4] = {1.0f, 1.5f, 1.6f, 1.1f};
  static constexpr float kWellLevel[4] = {1.12f, 0.9f, 0.82f, 1.0f};
  static constexpr float kPace[4] = {1.0f, 1.0f, 0.6f, 1.5f};
  static constexpr float kNearUpper[4] = {1.0f, 1.2f, 0.2f, 0.9f};
  static constexpr float kShade[4] = {1.0f, 1.6f, 0.4f, 1.0f};
  static constexpr float kBody[4] = {1.0f, 1.0f, 0.3f, 0.4f};  // of the friction, which the first well hears
  static constexpr float kFarPan[4] = {0.0f, 1.0f, 0.5f, 0.4f};

  // Equal power, near enough, with no sine: -1 is left.
  static void fast_pan(float pan, float* left, float* right) {
    pan = kit::clamp(pan, -1.0f, 1.0f);
    *left = std::sqrt(0.5f * (1.0f - pan));
    *right = std::sqrt(0.5f * (1.0f + pan));
  }
  float top_fade(float hz) const {
    const float top = kit::min(kTopHz, 0.45f * sample_rate());
    return kit::clamp((top - hz) * (1.0f / (kTopHz - kFadeHz)), 0.0f, 1.0f);
  }
  static void go(Voice& voice, int k, float left, float right, bool first) {
    if (first) {
      voice.left[k] = left;
      voice.right[k] = right;
      voice.left_step[k] = voice.right_step[k] = 0.0f;
    } else {
      voice.left_step[k] = (left - voice.left[k]) * (1.0f / kChunk);
      voice.right_step[k] = (right - voice.right[k]) * (1.0f / kChunk);
    }
  }

  // The friction: how hard it slips, how much of it and of its grain is heard.
  void colour(Voice& voice, const Common& c, float pitch, float pressure, float speed, float loud, float lift, float sway, bool first) {
    const float sr = sample_rate();
    const bool breath = voice.exciter == kBreath;
    const bool drawn = breath || voice.exciter == kBow;
    const float touch = 0.45f + 0.75f * voice.gain;
    // Higher notes slip less, which also keeps the curve's harmonics in band.
    const float keep = kit::min(1.0f, std::sqrt(600.0f / kit::max(pitch, 1.0f)));
    const float drive = 1.1f * std::exp2((drawn ? 3.9f : 3.2f) * pressure) * touch * (0.3f + 0.7f * keep);
    const float body = (breath ? 0.3f : drawn ? 2.0f : 1.5f) * pressure * (0.5f + 0.5f * pressure) * keep * kBody[voice.well];
    // What the friction adds it takes from the whole, so Pressure is colour before level.
    loud /= 1.0f + 1.1f * body * kit::fast_tanh(0.6f * drive * voice.hit) / kit::max(voice.hit, 0.1f) * 0.5f;
    static const float kGrain[4] = {2.6f, 1.8f, 1.8f, 2.6f};
    float grain = kGrain[voice.exciter] * c.rasp * (0.4f + 0.6f * c.rasp) * voice.hit * voice.air_size * noise_scale_;
    if (breath) grain = (grain + 0.5f * voice.hit * noise_scale_) * (0.45f + 0.75f * voice.gain);
    if (drawn) {
      grain *= voice.gate * smooth(voice.swell) * speed * (0.5f + 0.5f * pressure);
      // A quick bow bites, and a straight slide is heard to rub.
      if (!breath && voice.age < 1.0f) grain *= 1.0f + 2.5f / (1.0f + 6.0f * param(bent_blade::kSwell)) * std::exp(-voice.age * 14.0f);
      if (voice.law == kStraight && voice.slide_at < 1.0f && voice.wait <= 0.0f) grain *= 2.2f;
    } else {
      // A struck blade's grain is the touch itself, then the steel fretting while it rings.
      grain *= 5.0f * voice.contact + 0.5f * kit::min(voice.follow / kit::max(voice.hit, 0.02f), 1.0f);
    }
    ramp(body, &voice.body, &voice.body_step, first);
    ramp(drive, &voice.drive, &voice.drive_step, first);
    ramp(grain, &voice.grain, &voice.grain_step, first && drawn);
    // Steel left to its own places is kept awake by the touch, since no harmonic finds it.
    const float fret = drawn ? (breath ? 0.35f : 0.8f) * (1.0f - c.drawn_in) * voice.hit * voice.gate * smooth(voice.swell) * noise_scale_ : 0.0f;
    ramp(fret, &voice.fret, &voice.fret_step, first && drawn);
    ramp(loud, &voice.air, &voice.air_step, first);
    const float cut = kit::kTwoPi * 2.0f * pitch / sr;
    voice.noise_cut = kit::min(cut / (1.0f + 0.5f * cut), 1.0f);
    voice.body_filter.set(kit::clamp(c.bright * kShade[voice.well] * voice.root * (1.0f + 0.85f * lift + 0.6f * c.wander * sway), 150.0f, 9000.0f), 0.8f, sr);
    voice.grain_filter.set(kit::clamp(c.grain_hz * kShade[voice.well] * voice.root * (breath ? 0.75f : 1.0f), 250.0f, breath ? 2400.0f : 5000.0f), breath ? 0.6f : 0.75f, sr);
    voice.air_filter.a = breath ? c.breath_pole : c.air_pole;
    const float pan = breath ? 0.9f * c.width * (voice.place < 0.0f ? -0.5f : 0.5f) + 0.5f * c.width * voice.place : voice.well != kNoWell ? -0.2f * c.width * voice.side : 0.3f * c.width * voice.place;
    fast_pan(pan, &voice.body_left, &voice.body_right);
  }
  static void ramp(float to, float* value, float* step, bool first) {
    if (first) *value = to;
    *step = (to - *value) * (1.0f / kChunk);
  }

  // --- every sample --------------------------------------------------------

  void render_voice(Voice& voice, int n, float* out_left, float* out_right) {
    float noise[kChunk], soft[kChunk], blade[kChunk], force[kChunk], tone[kChunk], window[kChunk];
    F4 left[kChunk], right[kChunk], seen[kChunk];
    uint32_t state = voice.noise_state;
    float low = voice.noise_low;
    for (int i = 0; i < n; ++i) {
      state ^= state << 13;
      state ^= state >> 17;
      state ^= state << 5;
      noise[i] = static_cast<float>(static_cast<int32_t>(state)) * (1.0f / 2147483648.0f);
      low += voice.noise_cut * (noise[i] - low);
      soft[i] = low;
      left[i] = right[i] = seen[i] = F4{0.0f, 0.0f, 0.0f, 0.0f};
    }
    voice.noise_low = flush_denormal(low);
    voice.noise_state = state;
    const bool struck = voice.pulse_at < voice.pulse_length;
    if (struck) {
      const float each = 1.0f / static_cast<float>(voice.pulse_length);
      for (int i = 0; i < n; ++i) {
        const int at = voice.pulse_at + i;
        window[i] = at < voice.pulse_length
                        ? each * (1.0f - kit::SineTable::cos_lookup((static_cast<float>(at) + 0.5f) * each))
                        : 0.0f;
      }
      voice.pulse_at += n;
    }
    const int groups = voice.well == kNoWell ? 1 : 4;
    for (int group = 0; group < groups; ++group) {
      const int blocks = group < 2 ? voice.blocks : 1;
      for (int block = 0; block < blocks; ++block) {
        row<false>(voice, group * kNotes + block * 4, n, struck, soft, nullptr, window, left, right, seen);
      }
    }
    // The friction, from the speed of the blade under the bow.
    const float rub = kRub[voice.exciter], rumble = voice.exciter == kBreath ? 0.7f : 0.0f;
    float fret = voice.fret;
    float body = voice.body, drive = voice.drive, grain = voice.grain, loud = voice.air;
    const bool breath = voice.exciter == kBreath;
    for (int i = 0; i < n; ++i) {
      const F4 s = seen[i];
      blade[i] = (s[0] + s[1]) + (s[2] + s[3]);
      const float slip = kit::fast_tanh(drive * blade[i] + kBias);
      const float rubbed = voice.dc.process(slip - kBiasSlip);
      const float harmonics = (0.75f * voice.body_filter.lowpass(rubbed) + 1.3f * voice.body_filter.band) * body;
      const float open = 1.0f - slip * slip;
      const float air = voice.air_filter.lowpass(voice.grain_filter.bandpass(noise[i] * grain * (breath ? 0.45f + 0.55f * open : open)) + rumble * voice.grain_filter.low);
      tone[i] = rub * rubbed;
      force[i] = kRing[voice.exciter] * air + noise[i] * fret * open;
      fret += voice.fret_step;
      const float direct = (harmonics + air) * loud;
      left[i] += F4{direct * voice.body_left, 0.0f, 0.0f, 0.0f};
      right[i] += F4{direct * voice.body_right, 0.0f, 0.0f, 0.0f};
      body += voice.body_step;
      drive += voice.drive_step;
      grain += voice.grain_step;
      loud += voice.air_step;
    }
    voice.fret = fret;
    voice.body = body;
    voice.drive = drive;
    voice.grain = grain;
    voice.air = loud;
    for (int j = 0; j < kSteelModes; j += 4) row<true>(voice, kTrapped + j, n, struck, force, tone, window, left, right, seen);
    float fade = voice.fade;
    for (int i = 0; i < n; ++i) {
      const F4 l = left[i], r = right[i];
      out_left[i] += ((l[0] + l[1]) + (l[2] + l[3])) * fade;
      out_right[i] += ((r[0] + r[1]) + (r[2] + r[3])) * fade;
      fade = kit::max(fade - voice.fade_step, 0.0f);
    }
    voice.fade = fade;
  }
  static constexpr float kRub[4] = {0.7f, 0.4f, 0.5f, 0.05f};  // how much of the friction rings the steel
  static constexpr float kRing[4] = {3.0f, 2.0f, 2.0f, 0.6f};  // and of the grain
  static constexpr float kBreathTone = 0.3f;
  static constexpr float kBias = 0.35f;
  static constexpr float kBiasSlip = 0.337795f;  // fast_tanh(kBias)

  // Four modes over a chunk: turn, take in what drives them, be heard.
  template <bool kTone>
  void row(Voice& voice, int k, int n, bool struck, const float* in, const float* tone, const float* window, F4* left, F4* right, F4* seen) {
    const F4 c = load(voice.step_re + k), s = load(voice.step_im + k), take = load(voice.noise_in + k), take_tone = load(voice.tone_in + k);
    const F4 dl = load(voice.left_step + k), dr = load(voice.right_step + k);
    const F4 bow = k < kTrapped ? load(voice.bow + k) : F4{0.0f, 0.0f, 0.0f, 0.0f};
    F4 re = load(voice.re + k), im = load(voice.im + k);
    F4 gl = load(voice.left + k), gr = load(voice.right + k);
    if (struck) {
      F4 pr = load(voice.push_re + k), pi = load(voice.push_im + k);
      for (int i = 0; i < n; ++i) {
        const F4 p = c * pr - s * pi;
        pi = s * pr + c * pi;
        pr = p;
        F4 next = c * re - s * im + take * in[i] + pr * window[i];
        if constexpr (kTone) next += take_tone * tone[i];
        im = s * re + c * im + pi * window[i];
        re = next;
        left[i] += im * gl;
        right[i] += im * gr;
        seen[i] += im * bow;
        gl += dl;
        gr += dr;
      }
      store(voice.push_re + k, pr);
      store(voice.push_im + k, pi);
    } else {
      for (int i = 0; i < n; ++i) {
        F4 next = c * re - s * im + take * in[i];
        if constexpr (kTone) next += take_tone * tone[i];
        im = s * re + c * im;
        re = next;
        left[i] += im * gl;
        right[i] += im * gr;
        seen[i] += im * bow;
        gl += dl;
        gr += dr;
      }
    }
    store(voice.re + k, re);
    store(voice.im + k, im);
    store(voice.left + k, gl);
    store(voice.right + k, gr);
  }

  Voice voices_[kMaxVoices];
  kit::Smoother knobs_[kNumKnobs];
  kit::Smoother volume_;
  kit::IdleGate idle_;
  Common common_ = {};
  bool common_fresh_ = false;
  float voice_hz_[kLanes] = {}, voice_length_[kLanes] = {};
  float prior_[kMaxVoices] = {};
  float last_pitch_ = 0.0f, gesture_from_ = 0.0f;
  float tick_seconds_ = 0.001f, noise_scale_ = 1.0f;
  long ticks_ = 0, gesture_tick_ = -1;
  float room_ = 1.0f, room_step_ = 0.0f, guard_ = 1.0f, guard_step_ = 0.0f, top_ = 0.0f, chunk_top_ = 0.0f;
  int prior_count_ = 0, gesture_size_ = 0;
  int chunk_left_ = 0;
  uint32_t stamp_ = 0;
};

}  // namespace livemix

#if defined(__clang__) && defined(__wasm__) && !defined(__wasm_simd128__)
#pragma clang attribute pop
#endif
