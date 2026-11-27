#pragma once

// Night Drum: a drum for every key, with a weighted skin that has a true pitch.
//
//   hand ─► contact ─► skin (20 modes) ─┬───────────────────────────► out
//   stroke   two-pole     Load, Place   ├─► air of the body (4)  ───► out
//   swirl    low-pass     Bend, Ring    ├─► second skin (4)      ───► out
//   rub      (Touch)                    └─► thread on the skin   ───► out
//   hum ─────────────────────────────► the hand itself (Grain)   ───► out
//
// - The skin is a bank of real membrane modes: complex one-poles turned and
//   shrunk every sample. Load draws their ratios from a bare skin (1, 1.59,
//   2.14, 2.30 ...) to the harmonics of a skin with a dark centre, where
//   several modes meet on each harmonic. Off Centre pulls every pair apart.
// - A stroke is one impulse through a two-pole low-pass, whose time is the
//   contact. Where it lands weights each mode by its own Bessel shape, and
//   the angle of the hand by its nodal lines. The weights are scaled so that
//   a stroke has one level wherever it lands: Place is colour.
// - A roll listens to the drum. Every stroke waits for the moment the
//   fundamental comes round (Scatter lets it miss), and is only as strong as
//   what is wanting of the level it keeps. So a roll neither piles up on a
//   long ring nor starves on a short one, and stays on its pitch.
// - Brush, rub and hum are sustained. What they give the skin is in
//   proportion to what is wanting, which settles without hunting.
// - Tension: a stroke harder than those the skin has got used to stretches
//   it by Bend and it falls back on the key over Fall. A steady roll is what
//   it has got used to, so it plays on the key and dips only when Bend is wide.
// - The body is a list of numbers (drum_tables.h): formants that stand in
//   hertz, resonances of air that follow the key, what the air does to ring
//   and ratios. A change of body glides through the list.
// - One drum to a pitch. Control work once in kChunk samples on a clock that
//   starts with the first stroke, and with every knob in its place.

#include "../../kit/kit.h"
#include "drum_tables.h"
#include "drum_voice.h"
#include "params.gen.h"

namespace livemix {

class NightDrum : public kit::DeviceBase<night_drum::kNumParams> {
  static constexpr int kModes = night_drum_tables::kModes;  // of the struck skin
  static constexpr int kCavity = night_drum_tables::kCavity;
  static constexpr int kOther = night_drum_tables::kOther;
  static constexpr int kSlots = night_drum_tables::kSlots;
  using Body = night_drum_tables::Body;
  using Hand = night_drum_tables::Hand;
  using Voice = night_drum_voice::Voice;
  static constexpr const float* kOtherShare = night_drum_voice::kOtherShare;

 public:
  static constexpr int kMaxVoices = 12;
  enum Meter : int { kMeterTension = 0, kMeterLevel, kMeterStroke };

  void init(float sample_rate) {
    using namespace night_drum;
    kit::SineTable::init();
    shapes_.init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (Voice& voice : voices_) voice = Voice();
    stamp_ = 0;
    chunk_left_ = 0;
    tick_ = static_cast<float>(kChunk) / sr;
    noise_scale_ = std::sqrt(sr * (1.0f / 48000.0f));
    steal_step_ = 1.0f / (kStealSeconds * sr);
    for (int k = 0; k < kNumKnobs; ++k) knobs_[k].set_time(kKnobSeconds, sr / static_cast<float>(kChunk));
    volume_.set_time(0.02f, sr);
    body_glide_ = kit::time_to_coeff(0.05f, sr / static_cast<float>(kChunk));
    tap_top_ = kit::min(2800.0f, 0.4f * sr);
    tension_rise_ = 1.0f - std::exp(-tick_ / 0.003f);
    gulp_fall_ = std::exp(-tick_ / 0.07f);
    fresh_fall_ = std::exp(-tick_ / 0.12f);
    answer_step_ = 1.0f / (0.25f * sr);
    used_fall_ = std::exp(-tick_ / 10.0f);
    tap_rise_ = 1.0f - std::exp(-1.0f / (0.0003f * sr));
    thread_a_ = 1.0f - std::exp(-kit::kTwoPi * 4500.0f / sr);
    soft_a_ = 1.0f - std::exp(-kit::kTwoPi * 4500.0f / sr);
    crowd_rise_ = 1.0f - std::exp(-tick_ / 0.004f);
    crowd_fall_ = 1.0f - std::exp(-tick_ / 0.3f);
    crowd_ = 0.0f;
    room_ = 1.0f;
    room_step_ = 0.0f;
    crowd_lands_ = true;
    set_knobs(false);
    land_body();
    derive();
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    if (!store_param(id, value)) return;
    set_knobs(primed());
    if (!primed()) land_body();
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (count_sounding() == 0) restart();
    // The drum this pitch already has, and a stroke of this id that waits in
    // a taken voice. Every other drum the id held is let go.
    Voice* same = nullptr;
    Voice* waiting = nullptr;
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (!same && (voice.pending ? voice.pending_frequency : voice.frequency) == frequency) {
        same = &voice;
        continue;
      }
      if (voice.drop(note_id) && voice.pending && voice.holders == 0) waiting = &voice;
    }
    if (same) {
      same->hold(note_id);
      same->stamp = ++stamp_;
      if (same->pending) {
        same->pending_gain = kit::max(same->pending_gain, gain);
      } else {
        play_again(*same, gain);
      }
      return;
    }
    Voice& voice = waiting ? *waiting : voices_[pick()];
    const bool taken = voice.sounding;
    voice.holders = 0;
    voice.hold(note_id);
    voice.stamp = ++stamp_;
    if (taken) {
      voice.pending = true;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
      voice.follow = kit::max(strength_of(gain), kSilence);
    } else {
      start(voice, frequency, gain);
    }
  }

  void note_off(int note_id) {
    for (Voice& voice : voices_) {
      if (voice.sounding) voice.drop(note_id);
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
      const night_drum_voice::Moment now = {knob(kGrainKnob), tap_rise_, thread_a_, soft_a_, steal_step_};
      for (Voice& voice : voices_) {
        if (voice.sounding) night_drum_voice::render_voice(voice, n, now, left, right);
      }
      for (int i = 0; i < n; ++i) {
        room_ += room_step_;
        const float volume = volume_.next() * room_;
        out_left_[done + i] = kit::soft_clip(left[i] * volume);
        out_right_[done + i] = kit::soft_clip(right[i] * volume);
      }
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // Of the newest drum: how far its skin is stretched (semitones), how loud
  // it rings, how fresh its last stroke is. Zero at rest.
  float meter(int index) const {
    const Voice* newest = nullptr;
    for (const Voice& voice : voices_) {
      if (voice.sounding && !voice.pending && (!newest || voice.stamp > newest->stamp)) newest = &voice;
    }
    if (!newest) return 0.0f;
    switch (index) {
      case kMeterTension:
        return newest->tension * knobs_[kBendKnob].value;
      case kMeterLevel:
        return newest->follow / kLevel;
      case kMeterStroke:
        return newest->fresh;
      default:
        return 0.0f;
    }
  }

 private:
  static constexpr int kChunk = night_drum_voice::kChunk;  // control period, samples
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 6000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kEdgeHz = 12000.0f;  // a mode fades out between these
  static constexpr float kTopHz = 16000.0f;
  static constexpr float kCrowd = 5.0f;      // how soon many drums stand back
  static constexpr float kLevel = 0.3f;      // the level of a full stroke
  static constexpr float kStealSeconds = 0.003f;
  static constexpr float kKnobSeconds = 0.025f;
  static constexpr float kSilence = 1.0e-6f;
  static constexpr float kLeastRoll = 0.3f;   // strokes a second under which there is no roll

  // The knobs that glide at the control rate, in one array.
  enum Knob : int {
    kLoadKnob = 0, kOffKnob, kTuneKnob, kOtherKnob, kOtherTuneKnob, kPlaceKnob, kTouchKnob, kBendKnob, kRingKnob,
    kSkinKnob, kThreadKnob, kDampKnob, kWidthKnob, kGrainKnob, kNumKnobs
  };

  int choice(int id) const { return static_cast<int>(param(id) + 0.5f); }
  int count_sounding() const {
    int count = 0;
    for (const Voice& voice : voices_) count += voice.sounding ? 1 : 0;
    return count;
  }

  // The voice a new drum takes: an idle one, else the quietest let go, else
  // the quietest held (the oldest on a tie); one that a stroke already waits
  // in only when there is no other.
  int pick() const {
    int chosen = -1;
    for (int pass = 0; pass < 4 && chosen < 0; ++pass) {
      for (int v = 0; v < kMaxVoices; ++v) {
        const Voice& voice = voices_[v];
        if (pass == 0 && voice.sounding) continue;
        if (pass == 1 && (voice.pending || !voice.released())) continue;
        if (pass == 2 && voice.pending) continue;
        if (chosen < 0) {
          chosen = v;
          continue;
        }
        const Voice& best = voices_[chosen];
        const bool older = voice.stamp < best.stamp;
        if (pass == 0 ? older : voice.follow < best.follow || (voice.follow == best.follow && older)) chosen = v;
      }
    }
    return chosen;
  }

  // --- knobs ---------------------------------------------------------------

  void set_knobs(bool glide) {
    using namespace night_drum;
    static const int kIds[kNumKnobs] = {kLoad, kOffCentre, kCavityTune, kOtherSkin, kOtherTune, kPlace, kTouch,
                                        kBend, kRing,      night_drum::kSkin,      kThread,    kDamp,      kWidth, kGrain};
    for (int k = 0; k < kNumKnobs; ++k) {
      const float value = param(kIds[k]);
      knobs_[k].set(k == kRingKnob ? std::log2(value) : value, glide);
    }
    volume_.set(kit::db_to_gain(param(kVolume)), glide);
  }
  float knob(int k) const { return knobs_[k].value; }

  void land_body() {
    body_ = night_drum_tables::body_of(choice(night_drum::kCavity));
    body_moving_ = false;
    body_at_ = choice(night_drum::kCavity);
  }

  // A stroke that finds every drum still: each knob is where it points and
  // the control clock starts with the sound.
  void restart() {
    set_knobs(false);
    land_body();
    derive();
    chunk_left_ = 0;
    crowd_lands_ = true;
  }

  void move_knobs() {
    bool moved = false;
    for (int k = 0; k < kNumKnobs; ++k) {
      if (knobs_[k].settled()) continue;
      knobs_[k].next();
      moved = true;
    }
    const int body = choice(night_drum::kCavity);
    if (body != body_at_) {
      body_at_ = body;
      body_moving_ = true;
    }
    if (body_moving_) {
      const Body& to = night_drum_tables::body_of(body_at_);
      float* now = reinterpret_cast<float*>(&body_);
      const float* want = reinterpret_cast<const float*>(&to);
      float apart = 0.0f;
      for (int i = 0; i < night_drum_tables::kBodyFloats; ++i) {
        now[i] = want[i] + (now[i] - want[i]) * body_glide_;
        apart = kit::max(apart, std::fabs(now[i] - want[i]));
      }
      if (apart < 1.0e-3f) {
        body_ = to;
        body_moving_ = false;
      }
      moved = true;
    }
    if (moved) derive();
  }

  // What every drum shares, worked out when a knob has moved.
  void derive() {
    using namespace night_drum_tables;
    const float bare = 1.0f - knob(kLoadKnob);
    const float off = knob(kOffKnob);
    // A load that has left the middle tunes the skin less.
    const float load = (1.0f - bare * bare * std::sqrt(bare)) * (1.0f - 0.45f * off * off * off * off);
    const float split = kSplit * off * off;
    const float skin = knob(kSkinKnob);
    const float loss = 1.3f - 1.8f * skin;  // power of the ratio by which the overtones die sooner
    ring_ = std::exp2(knob(kRingKnob));
    wide_ = spread_of(knob(kWidthKnob));
    const float wide = wide_;
    for (int k = 0; k < kModes; ++k) {
      const SkinMode& mode = skin_mode(k);
      const float open = std::log2(mode.bare) + (std::log2(mode.loaded) - std::log2(mode.bare)) * load;
      const float bowl = std::log2(mode.kettle_bare) + (std::log2(mode.kettle_loaded) - std::log2(mode.kettle_bare)) * load;
      octaves_[k] = open + (bowl - open) * body_.kettle;
      const float apart = mode.m > 0 ? split * (1.0f + 0.25f * static_cast<float>(mode.m)) : 0.0f;
      ratio_[k] = std::exp2(octaves_[k]) * (1.0f + (mode.side ? apart : -apart));
      loss_[k] = std::exp2(loss * octaves_[k]) * (mode.m == 0 && k > 0 ? body_.radial : 1.0f);
      // A bare skin gives its own note away to the air, and what is left is the clash above it.
      if (k == 0) loss_[k] = 1.0f + 2.5f * (1.0f - load);
      float pan = 0.0f;
      if (mode.m > 0) pan = (mode.side ? 1.0f : -1.0f) * (0.45f + 0.07f * static_cast<float>(mode.m)) * (1.0f + 0.8f * off);
      kit::pan_gains(kit::clamp(pan * wide, -1.0f, 1.0f), &pan_left_[k], &pan_right_[k]);
    }
    for (int j = 0; j < kCavity; ++j) {
      air_ratio_[j] = std::exp2(body_.air[j] + knob(kTuneKnob) * (1.0f / 12.0f));
      kit::pan_gains(((j & 1) ? 0.25f : -0.25f) * wide, &pan_left_[kModes + j], &pan_right_[kModes + j]);
    }
    // The second skin is a smaller drum of the same making, heard from the
    // other side.
    static const int kLike[kOther] = {0, 1, 3, 6};
    const float other = kit::semitones_to_ratio(knob(kOtherTuneKnob));
    for (int j = 0; j < kOther; ++j) {
      other_ratio_[j] = other * std::exp2(octaves_[kLike[j]]);
      kit::pan_gains(((j & 1) ? -0.5f : 0.7f) * wide, &pan_left_[kModes + kCavity + j],
                     &pan_right_[kModes + kCavity + j]);
    }
    tilt_ = 1.3f - 2.3f * skin - body_.tilt - 0.35f * (1.0f - load);
    rough_ = kRough + kBareRough * (1.0f - load) * (1.0f - load) + kGrainRough * std::pow(knob(kGrainKnob), 1.4f);
    shift_ = knob(kTuneKnob) * (1.0f / 12.0f);
    for (int b = 0; b < 3; ++b) bump_width_[b] = 1.0f / body_.width[b];
    ++shade_serial_;
  }

  // Width in this body: some stand wider than others, and each reaches its
  // own most at the top of the knob.
  float spread_of(float width) const {
    return body_.wide > 1.0f ? 1.0f - std::pow(kit::max(1.0f - width, 0.0f), body_.wide) : width * body_.wide;
  }

  // --- strokes -------------------------------------------------------------

  static float strength_of(float gain) { return kLevel * gain * (0.5f + 0.5f * gain); }

  const Hand& hand(const Voice& voice) const { return night_drum_tables::hand_of(voice.hand); }

  // The weights of a hand at `place` and `angle`, scaled so that an impulse
  // of 1 through the contact wakes the skin to a level of 1.
  void aim(Voice& voice, float place, float angle) {
    const Hand& how = hand(voice);
    voice.place = kit::clamp(place, 0.0f, 1.0f);
    voice.angle = angle;
    const float r = 0.03f + 0.92f * voice.place;
    const float both = kit::min(1.0f, 1.5f * knob(kOffKnob));
    // What stays on the skin leans brighter and darker as it wanders.
    const float lean = how.bright + 1.2f * (voice.place - 0.5f) + (knob(kTouchKnob) - 0.45f) + 0.6f * (voice.gain - 0.7f) +
                       (how.sustained ? kLean * scatter() * voice.breath.next(0) + 1.5f * (knob(kDampKnob) - 0.15f) : 0.0f);
    float power = 1.0e-12f, crest = 0.0f;
    for (int k = 0; k < kModes; ++k) {
      const night_drum_tables::SkinMode& mode = night_drum_tables::skin_mode(k);
      const float around = static_cast<float>(mode.m) * angle;
      float weight = shapes_.read(k, r);
      if (mode.m > 0) {
        // A load off the centre wakes both of a pair, wherever the hand is.
        const float line = mode.side ? kit::SineTable::lookup(around) : kit::SineTable::cos_lookup(around);
        weight *= line + both * (0.7071f * line / std::sqrt(line * line + 0.02f) - line);
      }
      weight *= std::exp(-how.area * mode.zero * how.area * mode.zero * 0.5f);
      weight *= std::exp2(lean * octaves_[k]);
      const float wt = kit::kTwoPi * voice.hz[k] * voice.contact;
      const float heard = weight * voice.shade[k] / (1.0f + wt * wt);
      const float loud = heard * heard * lift(voice, k);
      power += loud;
      crest += std::sqrt(loud);
      voice.in[k] = weight * voice.shade[k];
    }
    const float norm = 1.0f / std::sqrt(power + kCrest * crest * crest);
    for (int k = 0; k < kModes; ++k) voice.in[k] *= norm;
    // The air and the second skin hear the hand too.
    const float other = knob(kOtherKnob);
    for (int j = 0; j < kCavity; ++j) {
      const float direct = 0.5f * body_.direct * how.air * body_.gain[j] * boom(voice.frequency * air_ratio_[j]);
      voice.in[kModes + j] = direct / (1.0f + direct);
    }
    for (int j = 0; j < kOther; ++j) voice.in[kModes + kCavity + j] = 0.9f * other * kOtherShare[j];
  }
  // Air too low for a drum does not boom.
  static float boom(float hz) { return hz * hz * hz * hz / (hz * hz * hz * hz + 80.0f * 80.0f * 80.0f * 80.0f); }
  static float lift(const Voice& voice, int k) {
    return voice.left_to[k] * voice.left_to[k] + voice.right_to[k] * voice.right_to[k];
  }

  void set_contact(Voice& voice) {
    const Hand& how = hand(voice);
    const float size = std::pow(kit::clamp(voice.frequency * (1.0f / 220.0f), 0.2f, 8.0f), -0.35f);
    const float touch = knob(kTouchKnob);
    voice.contact = kit::clamp(how.touch * size * std::exp2((0.5f - touch) * 6.0f) * (1.7f - 1.1f * voice.gain), 0.000008f, 0.02f);
    voice.open = 0.92f - 0.6f * touch;
    voice.contact_a = 1.0f - std::exp(-1.0f / (voice.contact * sample_rate()));
    voice.tap.set(kit::clamp(how.tap_hz * std::sqrt(size) * std::exp2((touch - 0.5f) * 1.6f + body_.tap), 120.0f, tap_top_), how.tap_q,
                  sample_rate());
  }

  // How much of the hand itself is heard, which no body and no Grain takes
  // far over the drum.
  float own_sound(const Hand& how) const {
    const float sound = how.tap * body_.tap_level * 0.8f * std::pow(knob(kGrainKnob), 1.2f);
    return sound / (1.0f + sound);
  }

  // A skin that is used to its strokes still gives a little under each, the
  // more the wider Bend is set, and only what can fall back before the next.
  float again(float hard, float rate) const {
    const float wide = kit::min(std::fabs(knob(kBendKnob)) * (1.0f / 12.0f), 1.0f);
    const float back = 1.0f - std::exp(-1.0f / (kit::max(rate, 0.5f) * param(night_drum::kFall)));
    return kAgain * wide * hard * back;
  }

  // One stroke: `level` is what it gives the skin, `hard` (0..1) how hard
  // the hand came down, `delay` how many samples from now.
  void stroke(Voice& voice, float level, float hard, float place, float angle, int delay) {
    const Hand& how = hand(voice);
    set_contact(voice);
    aim(voice, place, angle);
    voice.impulse = level;
    voice.impulse_in = delay;
    voice.fresh = 1.0f;
    const float over = hard - voice.used_to - 0.08f;
    if (over > 0.0f) voice.tension_to += (over + 0.08f) * (1.0f - voice.tension_to);
    voice.tension_to = kit::max(voice.tension_to, again(hard, roll_rate() * how.pace));
    voice.used_to = kit::max(voice.used_to, hard);
    voice.gulp = 1.0f;
    const float tap = kTap * own_sound(how) * hard * voice.strength * noise_scale_;
    voice.tap_level = kit::max(voice.tap_level, tap);
    voice.tapping = true;
    const float burst = how.tap_seconds * std::exp2((0.5f - knob(kTouchKnob)) * 1.2f) * (0.8f + 4.0f * knob(kGrainKnob)) * sample_rate() * (1.0f / kSixtyDb);
    voice.tap_fall = std::exp(-1.0f / burst);
    voice.rough = level * rough_ / std::sqrt(0.1667f * burst);
    kit::pan_gains(0.7f * wide_ * kit::SineTable::lookup(angle), &voice.tap_left,
                   &voice.tap_right);
  }

  void start(Voice& voice, float frequency, float gain) {
    for (int k = 0; k < kSlots; ++k) voice.re[k] = voice.im[k] = 0.0f;
    voice.hand = choice(night_drum::kHand);
    voice.frequency = frequency;
    voice.octave = std::log2(frequency);
    voice.low1 = voice.low2 = voice.still = 0.0f;
    voice.still_a = 1.0f - std::exp(-kit::kTwoPi * 0.4f * frequency / sample_rate());
    voice.rng.seed(0x51A9D3u + static_cast<uint32_t>(frequency * 16.0f) * 2654435761u + stamp_ * 40503u);
    voice.gut.seed(voice.rng.next_u32());
    voice.breath.seed(voice.rng.next_u32());
    voice.wander.seed(voice.rng.next_u32());
    voice.breath.set_rate(0.17f, 1.0f / tick_);
    voice.wander.set_rate(0.23f, 1.0f / tick_);
    voice.home = voice.octave * 0.41f;
    voice.home -= std::floor(voice.home);
    voice.side = kit::SineTable::lookup(voice.octave * 2.618f) * kit::clamp(voice.octave - 6.2f, 0.0f, 1.0f);
    voice.home = 0.04f + 0.17f * voice.home;
    voice.tap.reset();
    voice.rattle.reset();
    voice.rattle.set(1900.0f, 0.55f, sample_rate());
    voice.tap_level = voice.tap_soft = voice.rough = voice.rough_soft = voice.thread_low = voice.tap_low = 0.0f;
    voice.thread = voice.thread_step = 0.0f;
    voice.tapping = voice.threading = false;
    voice.used_to = voice.tension = voice.tension_to = voice.gulp = 0.0f;
    voice.rise = voice.amp = voice.amp_step = 0.0f;
    voice.drive = voice.drive_step = voice.direct = voice.direct_step = voice.press = 0.0f;
    voice.vibrato = voice.slip = 0.0f;
    voice.phase = voice.octave * 7.31f;
    voice.phase -= std::floor(voice.phase);
    voice.reach = 1.0f;
    voice.swirl_peak = voice.swirl_rate = 1.0f;
    voice.swirl = 0.0f;
    voice.strokes = 0;
    voice.shaded = 0;
    voice.sounding = true;
    voice.pending = false;
    voice.halfway = true;
    voice.steal = 1.0f;
    voice.follow = voice.weight = 0.0f;
    voice.aim_in = 0;
    begin(voice, gain);
    tune(voice);
    outputs(voice, true);
    stand(voice, true);
    first_stroke(voice);
    voice.amp = voice.rise = swell_seconds(voice) < 0.004f ? 1.0f : 0.0f;
    voice.follow = kit::max(voice.strength, kSilence);
  }

  void begin(Voice& voice, float gain) {
    voice.gain = gain;
    voice.strength = strength_of(gain) * key_level(voice) * hand(voice).loud;
  }
  float key_level(const Voice& voice) const {
    return std::pow(kit::clamp(voice.frequency * (1.0f / 220.0f), 0.2f, 12.0f), 0.08f);
  }

  // The stroke of the key itself. A sustained hand sets down instead.
  void first_stroke(Voice& voice) {
    const float place = knob(kPlaceKnob);
    if (hand(voice).sustained) {
      set_contact(voice);
      aim(voice, place, voice.home);
      voice.tension_to += (1.0f - voice.tension_to) * std::sqrt(voice.gain);
      voice.gulp = 1.0f;
      voice.fresh = 1.0f;
      kit::pan_gains(0.0f, &voice.tap_left, &voice.tap_right);
      return;
    }
    voice.strokes = 0;
    const bool roll = rolls(voice);
    // Hands never come down together: each key lands within a few milliseconds.
    const int late = static_cast<int>(kLate * (0.5f + 0.5f * kit::SineTable::lookup(voice.octave * 5.3f)) * sample_rate());
    const float full = kit::min(voice.follow / kit::max(voice.strength, kSilence), 1.0f);  // what rings already,
    // and a drum that is to swell comes back softly.
    const float soft = full > 0.0f && roll ? 1.0f / (1.0f + 6.0f * swell_seconds(voice)) : 1.0f;
    stroke(voice, voice.strength * (roll ? 0.9f : kSingle) * (1.0f - 0.4f * full) * soft, std::sqrt(voice.gain), place, voice.home, late);
    voice.fingers = 0;
    voice.wait = 0.0f;
    if (roll) {
      next_wait(voice);
    } else if (scatter() > 0.02f) {
      voice.fingers = 4;
      voice.wait = finger_wait(voice);
    }
  }
  // A single stroke of a loose hand: the other fingers land after the first.
  float finger_wait(Voice& voice) const { return scatter() * (0.03f + 0.09f * voice.rng.uniform()); }
  void fingers_on(Voice& voice) {
    voice.wait -= tick_;
    if (voice.wait > 0.0f || voice.impulse_in >= 0) return;
    const float share = std::sqrt(scatter()) * (0.35f + 0.13f * static_cast<float>(voice.fingers)) * (0.6f + 0.4f * voice.rng.uniform());
    --voice.fingers;
    voice.wait = finger_wait(voice);
    const float loose = scatter();
    stroke(voice, voice.strength * share * 0.7f, 0.6f * std::sqrt(voice.gain) * share, knob(kPlaceKnob) + loose * 0.35f * voice.rng.bipolar(),
           voice.home + 0.25f * loose * voice.rng.bipolar(), 0);
  }

  // A key struck again on the drum that rings.
  void play_again(Voice& voice, float gain) {
    const int was = voice.hand;
    voice.hand = choice(night_drum::kHand);
    if (was != voice.hand) {
      voice.shaded = 0;
      voice.drive_step = -voice.drive / static_cast<float>(kChunk);
      voice.direct_step = -voice.direct / static_cast<float>(kChunk);
      voice.press = 0.0f;
      voice.tap_level = 0.0f;
    }
    voice.used_to *= 0.15f;
    begin(voice, gain);
    first_stroke(voice);
  }

  float roll_rate() const { return param(night_drum::kRoll); }
  bool rolls(const Voice& voice) const {
    return !hand(voice).sustained && !voice.released() && roll_rate() >= kLeastRoll;
  }
  float scatter() const { return param(night_drum::kScatter); }
  void next_wait(Voice& voice) {
    const float lean = 1.0f + 0.05f * (voice.home - 0.1f);
    voice.wait += lean * (1.0f + 0.55f * scatter() * voice.rng.bipolar()) / kit::max(roll_rate() * hand(voice).pace, kLeastRoll);
  }

  // Samples until the fundamental comes round to where a stroke lifts it.
  int in_step(Voice& voice) const {
    const float w = kit::kTwoPi * voice.hz[0] / sample_rate();
    if (voice.re[0] == 0.0f && voice.im[0] == 0.0f) return 0;
    float turns = -std::atan2(voice.im[0], voice.re[0]) / kit::kTwoPi - 2.0f * voice.contact * voice.hz[0];
    turns += scatter() * scatter() * voice.rng.uniform();
    turns -= std::floor(turns);
    return static_cast<int>(turns * kit::kTwoPi / w + 0.5f);
  }

  void roll_on(Voice& voice) {
    if (!rolls(voice)) {
      if (voice.fingers > 0) {
        fingers_on(voice);
      } else {
        voice.wait = 0.0f;
      }
      return;
    }
    voice.wait -= tick_;
    if (voice.wait > 0.0f || voice.impulse_in >= 0) return;
    next_wait(voice);
    ++voice.strokes;
    const float loose = scatter();
    const float hard = (1.0f - 0.6f * loose * voice.rng.uniform()) * breathing(voice);
    const float target = voice.strength * hand(voice).keep * hard;
    const float least = 0.16f * kit::min(1.0f, 3.0f / (1.0f + roll_rate() * hand(voice).pace * ring_));
    const float level = kit::clamp(target - voice.follow, least * target, target);
    const float swing = (voice.strokes & 1) ? 0.11f : -0.11f;  // one hand, then the other
    const float place = knob(kPlaceKnob) + loose * 0.28f * voice.rng.bipolar() + 0.05f * voice.wander.next(0);
    const float angle = voice.home + swing + loose * 0.22f * voice.rng.bipolar();
    stroke(voice, level, std::sqrt(voice.gain) * hard, place, angle, in_step(voice));
  }
  float breathing(Voice& voice) const {
    return 1.0f - (0.1f + 0.65f * scatter()) * (0.5f + 0.5f * voice.breath.next(0));
  }

  // --- pitch, ring and colour ----------------------------------------------

  // No drum rings without end: a long ring leans on kLongest seconds.
  static float longest(float seconds) {
    const float over = seconds * seconds * (1.0f / (kLongest * kLongest));
    return kit::max(seconds / std::sqrt(std::sqrt(1.0f + over * over)), kShortest);
  }

  // What the skin and the hand make of each mode, worked out when either changed.
  void colour(Voice& voice) {
    if (voice.shaded == shade_serial_) return;
    voice.shaded = shade_serial_;
    // A low key keeps more of its overtones, which a small speaker needs.
    const float low = kit::clamp(7.7f - voice.octave, 0.0f, 2.0f);
    const float tilt = tilt_ * (1.0f - 0.3f * low) - 0.12f * low;
    const float clear = hand(voice).clear;
    for (int k = 0; k < kModes; ++k) {
      voice.shade[k] = std::exp2(-tilt * octaves_[k]);
      voice.clear[k] = std::exp2(-clear * octaves_[k]);
    }
  }

  // The turn and the decay of every resonance, from the knobs, the tension
  // and the hand as they stand.
  void tune(Voice& voice) {
    colour(voice);
    const Hand& how = hand(voice);
    const float sr = sample_rate();
    const float bend = std::exp2(knob(kBendKnob) * how.bend * voice.tension * (1.0f / 12.0f));
    const float skin = voice.frequency * bend;
    float w[kSlots], n[kSlots];
    const float damp = knob(kDampKnob);
    const float key = std::pow(kit::clamp(voice.frequency * (1.0f / 220.0f), 0.1f, 20.0f), 0.4f);
    const float base = kSixtyDb / longest(ring_ * body_.ring * how.ring / key);
    const float far = kSixtyDb / longest(ring_ * 1.1f / key);  // no hand lies on the second skin
    const float rest = 14.0f * damp * damp;
    const float choke = voice.released() ? 60.0f * damp * std::sqrt(damp) / kit::clamp(body_.ring, 0.4f, 4.0f) : 0.0f;
    voice.nepers = base * loss_[0] + rest + choke;
    for (int k = 0; k < kModes; ++k) {
      const float hz = skin * ratio_[k];
      const float high = hz * (1.0f / 3500.0f);
      voice.hz[k] = hz;
      w[k] = hz;
      n[k] = base * loss_[k] * voice.clear[k] + rest * kRestShare[k] + choke + 5.0f * high * high;
    }
    const float gulp = std::exp2(-body_.gulp * voice.gulp);
    for (int j = 0; j < kCavity; ++j) {
      w[kModes + j] = kit::min(voice.frequency * air_ratio_[j] * gulp, 0.3f * sr);
      n[kModes + j] = kit::kPi * w[kModes + j] / body_.q[j];
    }
    for (int j = 0; j < kOther; ++j) {
      w[kModes + kCavity + j] = voice.frequency * other_ratio_[j];
      n[kModes + kCavity + j] = far * (1.0f + 0.5f * static_cast<float>(j)) + 0.3f * rest + choke;
    }
    night_drum_voice::turn_bank(voice, w, n, sr);
    const float share = 1.0f / sr, other = knob(kOtherKnob);
    for (int j = 0; j < kCavity; ++j) voice.from_skin[j] = 2.0f * kit::min(n[kModes + j] * share, 0.5f) * body_.gain[j] * boom(w[kModes + j]);
    for (int j = 0; j < kOther; ++j) {
      voice.from_skin[kCavity + j] = 2.0f * kit::min((n[kModes + kCavity + j] + 1.5f) * share, 0.5f) * other * kOtherShare[j];
    }
  }

  // The level of every mode at the output: the tilt of the skin, the body's
  // formants where the mode now stands, and its place across the field.
  void outputs(Voice& voice, bool snap) {
    const float shift = shift_ + 0.13f * voice.wander.next(0);
    const float at0 = body_.bump[0] + shift, at1 = body_.bump[1] + shift, at2 = body_.bump[2] + shift;
    const float moved = std::exp2(shift_);
    const float low2 = body_.low * body_.low * moved * moved, high2 = 1.0f / (body_.high * body_.high * moved * moved);
    for (int k = 0; k < kModes; ++k) {
      const float octave = voice.octave + octaves_[k];
      const float d0 = (octave - at0) * bump_width_[0], d1 = (octave - at1) * bump_width_[1], d2 = (octave - at2) * bump_width_[2];
      const float hz = voice.hz[k], hz2 = hz * hz;
      float level = body_.base + body_.lift[0] / (1.0f + d0 * d0) + body_.lift[1] / (1.0f + d1 * d1) + body_.lift[2] / (1.0f + d2 * d2);
      level *= hz2 / (hz2 + low2) / (1.0f + hz2 * high2);
      const float edge = (kTopHz - hz) * (1.0f / (kTopHz - kEdgeHz));
      level *= edge < 0.0f ? 0.0f : (edge > 1.0f ? 1.0f : edge);
      voice.left_to[k] = level * pan_left_[k];
      voice.right_to[k] = level * pan_right_[k];
    }
    for (int k = kModes; k < kSlots; ++k) {
      voice.left_to[k] = pan_left_[k];
      voice.right_to[k] = pan_right_[k];
    }
    for (int k = 0; k < kSlots; ++k) {
      if (snap) {
        voice.left[k] = voice.left_to[k];
        voice.right[k] = voice.right_to[k];
      }
      voice.left_step[k] = (voice.left_to[k] - voice.left[k]) * (0.5f / kChunk);
      voice.right_step[k] = (voice.right_to[k] - voice.right[k]) * (0.5f / kChunk);
    }
  }

  // Every drum stands at its own place across the field, the low ones in the
  // middle.
  void stand(Voice& voice, bool snap) {
    const float spread = hand(voice).spread;
    voice.spread = snap ? spread : toward(voice.spread, spread, 0.05f, tick_);
    float left, right;
    kit::pan_gains(kit::clamp(0.8f * voice.side * voice.spread * wide_, -1.0f, 1.0f), &left, &right);
    left *= 1.41421356f;
    right *= 1.41421356f;
    if (snap) {
      voice.side_left = left;
      voice.side_right = right;
    }
    voice.side_left_step = (left - voice.side_left) * (1.0f / kChunk);
    voice.side_right_step = (right - voice.side_right) * (1.0f / kChunk);
  }

  float swell_seconds(const Voice& voice) const {
    const float swell = param(night_drum::kSwell) - night_drum::kParamMin[night_drum::kSwell];
    // A single stroke that dies sooner than the swell would never be heard.
    if (hand(voice).sustained || rolls(voice)) return swell;
    const float most = 0.35f * kSixtyDb / kit::max(voice.nepers, 0.5f);
    return swell / (1.0f + swell / most);
  }

  // --- every kChunk samples ------------------------------------------------

  void control() {
    move_knobs();
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (voice.pending && voice.steal <= 0.0f) {
        start(voice, voice.pending_frequency, voice.pending_gain);
        continue;
      }
      if (!voice.pending) control_voice(voice);
    }
    make_room();
  }

  // Many drums at once each stand a little further back, so ten keys keep
  // under the clip and one is as loud as it should be. What a drum counts for
  // is the level it holds, which is steady under a roll: nothing pumps.
  void make_room() {
    float power = 0.0f;
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      voice.weight += (voice.follow * voice.rise - voice.weight) * crowd_fall_;
      const bool kept = hand(voice).sustained ? !voice.released() : rolls(voice);
      const float level = kept ? kit::max(voice.strength * hand(voice).keep * voice.rise, voice.weight) : voice.follow;
      power += level * level;
    }
    crowd_ = crowd_lands_ ? power : crowd_ + (power - crowd_) * (power > crowd_ ? crowd_rise_ : crowd_fall_);
    const float room = 1.0f / std::sqrt(1.0f + crowd_ * kCrowd);
    if (crowd_lands_) room_ = room;
    crowd_lands_ = false;
    room_step_ = (room - room_) * (1.0f / kChunk);
  }

  static float settle(float x) { return x < 1.0e-6f && x > -1.0e-6f ? 0.0f : x; }
  static float toward(float now, float to, float seconds, float tick) { return now + (to - now) * (1.0f - std::exp(-tick / seconds)); }

  void control_voice(Voice& voice) {
    voice.breath.next(1);
    voice.wander.next(1);
    // Tension, gulp and what the skin is used to all fall back.
    const float fall = std::exp(-tick_ / param(night_drum::kFall));
    // A hand that is still landing keeps the skin stretched.
    if (!(hand(voice).sustained && !voice.released() && voice.press < 0.5f)) voice.tension_to = settle(voice.tension_to * fall);
    voice.tension += (voice.tension_to - voice.tension) * tension_rise_;
    if (voice.tension_to == 0.0f && voice.tension < 1.0e-5f) voice.tension = 0.0f;
    voice.gulp = settle(voice.gulp * gulp_fall_);
    voice.fresh = settle(voice.fresh * fresh_fall_);
    voice.used_to *= used_fall_;

    roll_on(voice);
    tune(voice);
    // Where each mode stands is worked out every other tick, and glided to.
    voice.halfway = !voice.halfway;
    if (!voice.halfway) {
      for (int k = 0; k < kSlots; ++k) {
        voice.left[k] = voice.left_to[k];
        voice.right[k] = voice.right_to[k];
      }
      outputs(voice, false);
    }

    stand(voice, false);

    float energy = 0.0f, struck = 0.0f;
    for (int k = 0; k < kSlots; ++k) {
      const float power = voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k];
      if (power < 1.0e-22f) voice.re[k] = voice.im[k] = 0.0f;
      energy += power * lift(voice, k);
      if (k == kModes - 1) struck = energy;
    }
    night_drum_voice::answer(voice, 0.8f * knob(kOtherKnob) * std::sqrt(struck), answer_step_);
    const float ringing = std::sqrt(energy);
    sustain(voice, ringing);
    voice.follow = voice.impulse_in >= 0 ? kit::max(voice.follow * 0.98f, ringing) : ringing;

    // Swell.
    const float swell = swell_seconds(voice);
    voice.rise = swell < 0.004f ? toward(voice.rise, 1.0f, 0.0008f, tick_) : toward(voice.rise, 1.0f, swell * 0.4f, tick_);
    if (voice.rise > 0.9995f) voice.rise = 1.0f;
    voice.amp_step = (voice.rise - voice.amp) * (1.0f / kChunk);

    // The thread lies on the skin: it touches where the skin comes up far
    // enough, and lifts off as the drum dies.
    const float slack = knob(kThreadKnob) * (1.6f - 0.6f * knob(kThreadKnob));
    const float full = kit::max(voice.strength, kSilence);
    const float quiet = kit::min(full / kit::max(ringing, 1.0e-7f), 4.0f);
    voice.thread_over = kit::max((0.9f - 0.77f * slack) * (0.85f + 0.15f * quiet) * ringing, 1.0e-6f);
    voice.thread_give = 0.8f / kit::max(ringing, 1.0e-6f);
    const float want = kThreadLevel * slack * (0.7f + 0.3f * slack);
    voice.thread_step = (want - voice.thread) * (1.0f / (8.0f * kChunk));
    voice.threading = voice.thread > 1.0e-5f || voice.thread_step > 0.0f;
    if (voice.tap_level < 1.0e-8f) voice.tap_level = 0.0f;
    if (voice.rough < 1.0e-8f) voice.rough = 0.0f;
    voice.tapping = voice.tap_level > 0.0f || voice.rough > 0.0f || voice.tap_soft > 1.0e-8f || voice.rough_soft > 1.0e-8f;
    if (std::fabs(voice.tap.ic1) + std::fabs(voice.tap.ic2) < 1.0e-14f) voice.tap.reset();
    if (std::fabs(voice.rattle.ic1) + std::fabs(voice.rattle.ic2) < 1.0e-14f) voice.rattle.reset();
    if (std::fabs(voice.thread_low) < 1.0e-14f) voice.thread_low = 0.0f;
    if (std::fabs(voice.tap_low) < 1.0e-14f) voice.tap_low = 0.0f;
    if (std::fabs(voice.low1) + std::fabs(voice.low2) < 1.0e-13f) voice.low1 = voice.low2 = 0.0f;
    if (std::fabs(voice.still) < 1.0e-13f) voice.still = 0.0f;

    const bool asleep = voice.released() || (!hand(voice).sustained && !rolls(voice));
    if (asleep && voice.impulse_in < 0 && voice.press == 0.0f && voice.tap_level == 0.0f && voice.fingers == 0 && ringing < kSilence && voice.rise > 0.01f &&
        voice.low2 < 1.0e-6f && voice.low2 > -1.0e-6f) {
      retire(voice);
    }
  }

  void retire(Voice& voice) {
    voice.sounding = voice.pending = false;
    voice.holders = 0;
    voice.follow = 0.0f;
    for (int k = 0; k < kSlots; ++k) voice.re[k] = voice.im[k] = 0.0f;
  }

  // What a hand that stays on the skin gives it in the coming chunk.
  void sustain(Voice& voice, float ringing) {
    const Hand& how = hand(voice);
    float drive = 0.0f, direct = 0.0f;
    if (how.sustained) {
      voice.press = voice.released() ? voice.press * std::exp(-tick_ / how.leave) : voice.press + (1.0f - voice.press) * (1.0f - std::exp(-tick_ / kit::min(how.land, 0.015f + param(night_drum::kSwell))));
      if (voice.released() && voice.press < 1.0e-4f) voice.press = 0.0f;
      const float roll = roll_rate();
      const float there = kit::min(roll * 0.5f, 1.0f);
      float rate = how.pace * roll, depth = 0.96f * there;                      // rub: the finger chatters
      if (voice.hand == night_drum_tables::kBrush) {
        rate = 0.15f + how.pace * roll;                                   // brush: it swirls
        depth = 0.96f;
      } else if (voice.hand == night_drum_tables::kHum) {
        depth = 0.75f * there;                                       // hum: the breath shakes
      }
      voice.swirl += rate * voice.swirl_rate * tick_;
      if (voice.swirl >= 1.0f) {
        voice.swirl -= 1.0f;
        voice.swirl_rate = 1.0f + 0.5f * scatter() * voice.rng.bipolar();
        voice.swirl_peak = 1.0f - 0.7f * scatter() * voice.rng.uniform();
        voice.fresh = 1.0f;
        voice.tension_to = kit::max(voice.tension_to, again(std::sqrt(voice.gain) * voice.swirl_peak, rate));
      }
      const float turn = kit::SineTable::cos_lookup(voice.swirl);
      const float chatter = 1.0f - depth * (1.0f - voice.swirl_peak * (0.5f - 0.5f * turn));
      const float pressed = voice.press * chatter * breathing(voice);
      const float target = voice.strength * how.keep * pressed;
      if (voice.aim_in-- <= 0) {
        voice.aim_in = 7;
        const float move = scatter() * 0.12f * voice.wander.next(0) + (voice.hand == night_drum_tables::kBrush ? 0.1f * turn : 0.0f);
        aim(voice, knob(kPlaceKnob) + move, voice.home + 0.05f * kit::SineTable::lookup(0.5f * voice.swirl) + 0.1f * scatter() * voice.wander.next(0));
        set_contact(voice);
      }
      const float wanting = target > 1.0e-7f ? kit::clamp(6.0f * (1.0f - ringing / target), 0.0f, 1.0f) : 0.0f;
      // A skin the hand cannot wake at that (bare, or far from the note) is pressed harder.
      voice.reach = kit::clamp(voice.reach + (wanting > 0.9f ? 3.0f : -2.0f) * tick_, 1.0f, 2.5f);
      const float rise = voice.reach * target * (1.3f * voice.nepers + 5.0f + kit::min(1.5f / param(night_drum::kSwell), 40.0f)) * wanting;  // level a second
      direct = kDirect * own_sound(how) * voice.strength * pressed;
      float cents = 0.0f;
      if (voice.hand == night_drum_tables::kBrush) {
        drive = 2.6f * voice.reach * target * std::sqrt(2.0f * (voice.nepers + 3.0f) / sample_rate()) * wanting;
        direct *= 0.7f * noise_scale_;
      } else if (voice.hand == night_drum_tables::kRub) {
        drive = rise / voice.frequency;
        direct *= noise_scale_;
        cents = 4.0f * voice.rng.bipolar();
      } else {
        drive = rise / sample_rate();
        voice.vibrato += 4.6f * tick_;
        voice.vibrato -= std::floor(voice.vibrato);
        cents = 4.0f * kit::SineTable::lookup(voice.vibrato);
      }
      voice.phase_step = voice.hz[0] * (1.0f + cents * 0.000578f) / sample_rate();
    } else {
      voice.press = 0.0f;
    }
    voice.drive_step = (drive - voice.drive) * (1.0f / kChunk);
    voice.direct_step = (direct - voice.direct) * (1.0f / kChunk);
    if (drive == 0.0f && voice.drive < 1.0e-9f) voice.drive = voice.drive_step = 0.0f;
    if (direct == 0.0f && voice.direct < 1.0e-9f) voice.direct = voice.direct_step = 0.0f;
  }

  static constexpr float kShortest = 0.07f;  // seconds a drum rings at the least
  static constexpr float kLongest = 18.0f;
  static constexpr float kLean = 1.6f;       // of Scatter, how far a hand that stays leans in colour
  static constexpr float kSplit = 0.06f;    // how far Off Centre pulls a pair, of its pitch
  static constexpr float kLate = 0.004f;     // seconds a key's first stroke may land late
  static constexpr float kCrest = 0.04f;     // how much the sum of the modes counts beside their energy
  static constexpr float kSingle = 0.9f;     // of a full level, a stroke by itself
  static constexpr float kAgain = 0.35f;     // of Bend, what a stroke of a roll does
  static constexpr float kTap = 5.0f;        // of the hand itself
  static constexpr float kDirect = 2.2f;
  static constexpr float kRough = 0.08f;     // how much of a stroke is rough, on a loaded skin
  static constexpr float kGrainRough = 0.42f;  // what Grain adds
  static constexpr float kBareRough = 0.75f;  // and what a bare one adds
  static constexpr float kThreadLevel = 4.0f;
  // How much of a resting hand each mode feels: what moves at the centre most.
  static constexpr float kRestShare[kModes] = {1.0f, 0.8f, 0.8f, 0.9f, 0.9f, 2.0f, 1.2f, 1.2f, 1.4f, 1.4f,
                                               1.6f, 1.6f, 1.8f, 1.8f, 3.0f, 2.0f, 2.2f, 2.4f, 2.6f, 2.8f};

  Voice voices_[kMaxVoices];
  night_drum_tables::Shapes shapes_;
  kit::Smoother knobs_[kNumKnobs];  // once a tick
  kit::Smoother volume_;            // every sample
  kit::IdleGate idle_;
  Body body_ = {};
  int body_at_ = 0;
  bool body_moving_ = false;
  float body_glide_ = 0.0f;
  float octaves_[kModes] = {}, ratio_[kModes] = {}, loss_[kModes] = {};
  float pan_left_[kSlots] = {}, pan_right_[kSlots] = {};
  float air_ratio_[kCavity] = {}, other_ratio_[kOther] = {};
  float bump_width_[3] = {};
  float rough_ = 0.05f, tilt_ = 1.0f, shift_ = 0.0f, ring_ = 2.0f, wide_ = 0.5f;
  uint32_t shade_serial_ = 1, stamp_ = 0;
  int chunk_left_ = 0;
  float tick_ = 0.0f, noise_scale_ = 1.0f, steal_step_ = 0.0f, tap_top_ = 19000.0f;
  float tension_rise_ = 0.1f, gulp_fall_ = 0.9f, fresh_fall_ = 0.9f, used_fall_ = 0.9f;
  float soft_a_ = 0.5f, crowd_ = 0.0f, crowd_rise_ = 0.1f, crowd_fall_ = 0.1f, room_ = 1.0f, room_step_ = 0.0f;
  bool crowd_lands_ = true;
  float answer_step_ = 0.0f, tap_rise_ = 0.1f, thread_a_ = 0.3f;
};

}  // namespace livemix
