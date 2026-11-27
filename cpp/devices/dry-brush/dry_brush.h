#pragma once

// Dry Brush: every key is one stroke of a brush, and the stroke is the note.
//
//   the script (dot, level, hook, sweep, trembling, seal), every tick (1.3 ms):
//     where the hand is ─► pressure ─► how many hairs touch ─┐
//                      └─► speed ────► rubbing, thirst ──────┤
//                                                            ▼
//   per key, 28 hairs: a hair is a narrow band on a partial of the key, with
//   an ink store of its own.  flow ─► tone (wet) ─┐
//                                  ─► scratch (dry) ─┼─► complex level ─► rotator
//                      paper ◄─ flow ─► stain ───┘
//   per key, one string under the paper: plucked as the brush lands, rubbed as
//   it moves, damped as it lifts.  per key, four paper modes rung by the
//   landing.  per key, the rubbing itself: noise in the brush's own band.
//   all keys ─► the sheet (a low-pass and two resonances) ─► volume ─► clip
//
// - A hair's level is a complex number that moves in straight lines between
//   ticks. Its real part turns the hair's sine up and down; noise of a few to
//   a hundred hertz in both parts makes the sine a narrow band of noise. The
//   tone and the scratch are the same hair: wet it sings, dry it hisses on the
//   same pitch. The middle of the stereo picture hears the real part and the
//   sides the imaginary one, so what is blurred is also wide, and folding to
//   mono takes away nothing but the blur's sides.
// - Ink runs out by flow, hair by hair: each has its own thirst. A hair that
//   runs short skips, in gaps with rounded edges of 10 ms and more, every hair
//   at its own moments, and at last fails to a thin floor. The core hairs of a
//   key keep some ink for ever, so a key never drops out.
// - The stain is what the paper has drunk: the same pitches, slow to come,
//   slow to go, each wandering by a hertz or two. It outlives the lift.
// - The hairs that touch share one level, so Pressure is colour first and
//   loudness a little, and no script or brush is lost at an end of it.
// - Pitch moves only at the two ends of a stroke. In between every hair stands
//   on its partial, its copies Spread apart from it, farther as they dry.
// - Chance is seeded by the count of strokes since init().

#include "../../kit/kit.h"
#include "params.gen.h"
#include "stroke.h"

namespace livemix {

namespace made = dry_brush_matter;

class DryBrush : public kit::DeviceBase<dry_brush::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kHairs = dry_brush_matter::kHairs;
  static constexpr int kRows = 8;  // seven rows of hairs and one of paper modes
  static constexpr int kMaxTick = 320;

  void init(float sample_rate) {
    using namespace dry_brush;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    period_ = kit::clamp_int(static_cast<int>(sr * (1.0f / 750.0f) + 0.5f), 8, kMaxTick);
    dt_ = static_cast<float>(period_) / sr;
    per_sample_ = 1.0f / static_cast<float>(period_);
    noise_scale_ = std::sqrt(sr / 48000.0f);
    edge_step_ = dt_ / kEdgeSeconds;
    pool_.reset();
    for (Voice& voice : pool_.voices) voice = Voice();
    for (int v = 0; v < kMaxVoices; ++v) {
      strings_[v].reset();
      strings_[v].set_tuning(kit::PluckedString<made::kLine>::Tuning::Interpolated);
      pool_.voices[v].side = (v & 1) ? -1.0f : 1.0f;
    }
    strokes_ = 0;
    until_tick_ = 0;
    const float rate = sr / static_cast<float>(period_);
    for (kit::Smoother& s : ramps_) s.set_time(0.015f, rate);
    mode_step_ = 1.0f - kit::time_to_coeff(0.35f, rate);
    level_step_ = 1.0f - kit::time_to_coeff(0.02f, rate);
    sheet_step_ = 1.0f - kit::time_to_coeff(0.03f, rate);
    volume_.set_time(kSmoothingSeconds, sr);
    idle_.reset(sr, 0.15f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    meter_ink_ = meter_pressure_ = meter_stain_ = meter_hairs_ = 0.0f;
    newest_ = 0;
    arrive();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 12.0f, kit::min(10000.0f, 0.3f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (pool_.count_active() == 0) arrive();
    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.waiting > 0) {  // struck again before it could start
        again.next_hz = frequency;
        again.next_gain = gain;
        return;
      }
      again.held = false;
      again.quick = true;
    }
    // A new stroke wets the brush for the ones beside it.
    const float share = param(dry_brush::kRedip);
    if (share > 0.0f) {
      for (int s = 0; s < kMaxVoices; ++s) {
        const Voice& voice = pool_.voices[s];
        if (voice.sounding && voice.held && voice.time > 0.1f && voice.waiting == 0) dip(s, share);
      }
    }
    bool stolen = false;
    const int slot = pool_.note_on(note_id, &stolen);
    Voice& voice = pool_.voices[slot];
    voice.next_hz = frequency;
    voice.next_gain = gain;
    voice.held = true;
    voice.quick = false;
    voice.sounding = true;
    voice.loudness = 1.0f;
    if (!stolen) {
      voice.waiting = 0;
      begin(slot);
    } else if (voice.waiting == 0) {
      voice.waiting = kStealTicks + 1;
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].held = false;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    // Stretches that end where the next tick falls, whatever the block size.
    int done = 0;
    while (done < frames) {
      if (until_tick_ == 0) {
        control();
        until_tick_ = period_;
      }
      const int count = kit::clamp_int(frames - done, 1, until_tick_);
      render(done, count);
      until_tick_ -= count;
      done += count;
    }
    idle_.settle(output_peak(frames), frames);
  }

  float meter(int index) const {
    switch (index) {
      case 0: return meter_ink_;
      case 1: return meter_pressure_;
      case 2: return meter_stain_;
      case 3: return meter_hairs_;
    }
    return 0.0f;
  }

 private:
  using V4 = made::V4;
  using Voice = made::Voice;
  using Glide = made::Glide;
  static constexpr int kStealTicks = 8;
  static constexpr float kEdgeSeconds = 0.012f;  // a gap's edge, from sounding to still
  static constexpr float kVoiceGain = 0.137f;
  static constexpr float kStringGain = 1.5f;
  static constexpr float kRubGain = 1.0f;

  int choice(int id, int count) const { return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, count - 1); }

  // Start the note a voice has been given, on silent hairs.
  void begin(int slot) {
    using namespace dry_brush;
    Voice& v = pool_.voices[slot];
    v.script = choice(kScript, 6);
    v.brush = choice(kBrush, made::kStuffs);
    v.paper = choice(kPaper, made::kSheets);
    v.hz = v.next_hz;
    v.gain = v.next_gain;
    newest_ = slot;
    const made::Matter& m = made::kMatter[v.brush];
    const made::Ground& g = made::kGround[v.paper];
    ++strokes_;
    v.rng.seed(made::seed_for(strokes_));
    for (uint32_t& c : v.chance) c = v.rng.next_u32() | 1u;
    v.phase_a = v.rng.uniform();
    v.phase_b = v.rng.uniform();
    const float sr = sample_rate();
    const float base = kit::kTwoPi * v.hz / sr;
    const bool struck = v.script == made::kDot || v.script == made::kStamp;

    // How raggedly the hairs land, in seconds.
    const float apart = param(kSpread);
    const float ragged = (struck ? 0.3f : 1.0f) * (apart * apart * (1.0f / 3600.0f) * (0.15f + 2.5f * attack_of(v)) + apart * 0.002f);
    float partial_phase = 0.0f, last = -1.0f;
    int copy = 0;
    for (int i = 0; i < kHairs; ++i) {
      const float n = made::kRatio[v.brush][i];
      copy = n == last ? copy + 1 : 0;
      last = n;
      if (copy == 0) partial_phase = v.rng.uniform();
      const int k = made::slot_of(i);
      const float order = static_cast<float>(i) / static_cast<float>(kHairs - 1);
      const float inside = kit::max(0.0f, 1.0f - order - 0.07f * static_cast<float>(copy));
      const float phase = 1.0f + partial_phase + 0.05f * static_cast<float>(copy) * ((copy & 1) ? 1.0f : -1.0f);
      v.re[k] = kit::SineTable::cos_lookup(phase);
      v.im[k] = kit::SineTable::lookup(phase);
      v.angle[k] = base * n;
      v.apart[k] = copy == 0 ? 0.0f : ((copy & 1) ? 1.0f : -1.0f) * (0.35f + 0.65f * v.rng.uniform()) * (copy > 2 ? 1.0f : 0.85f);
      v.touch[k] = 1.7f * m.open * (1.0f - inside) - 0.35f;
      v.late[k] = ragged * v.rng.uniform();
      v.land[k] = 0.0f;
      v.thirst[k] = m.thirst * g.thirst * (0.55f + 0.5f * (1.0f - inside) + 0.7f * v.rng.uniform());
      v.core[k] = kit::clamp((inside - 0.55f) * 3.0f, 0.0f, 1.0f);
      v.floor[k] = kit::min(0.9f, m.left * g.left * (0.03f + 0.36f * inside * inside * inside));
      const float blur = kit::clamp(m.blur * std::sqrt(n) * (0.7f + 0.6f * v.rng.uniform()), 1.0f, 120.0f);
      v.blur_k[k] = made::pole_for(blur, dt_);
      v.blur_gain[k] = made::blur_norm(v.blur_k[k]);
      v.wear_rate[k] = struck ? m.fade * g.fade * (v.script == made::kStamp ? kit::max(0.3f, 0.3f + 0.8f * (n - 1.0f)) : 1.0f + 0.45f * (n - 1.0f)) : 0.0f;
      v.ink[k] = kit::min(1.0f, 0.35f + 2.2f * param(kInk)) - 1.3f * kit::max(0.0f, param(kDryness) - 0.55f) * (0.6f + 0.8f * v.rng.uniform());
      v.ink[k] = kit::max(v.ink[k], 0.0f);
      v.timer[i] = 1 + static_cast<int>(v.rng.uniform() * 0.3f / dt_);
      v.plain[i] = made::spectrum(v.brush, n);
      v.spec[i] = v.plain[i] * made::kCopy[copy & 7];
    }
    for (int k = 0; k < 32; ++k) {
      v.ar[k] = v.ai[k] = v.tr[k] = v.ti[k] = v.from_r[k] = v.from_i[k] = 0.0f;
      v.gate[k] = v.goal[k] = v.lift[k] = v.wear[k] = 1.0f;
      v.stain[k] = v.n1r[k] = v.n2r[k] = v.n1i[k] = v.n2i[k] = 0.0f;
      v.wet[k] = 1.0f;
      const float turn = v.rng.uniform();
      // A stain begins somewhere on its wandering.
      v.s1r[k] = v.s2r[k] = kit::SineTable::cos_lookup(turn) * 0.25f;
      v.s1i[k] = v.s2i[k] = kit::SineTable::lookup(turn) * 0.25f;
    }

    // The landing. A slow attack sets the brush down too softly to pluck.
    const float attack = param(kAttack);
    const float sharp = landing(attack);
    const float hard = (0.25f + 0.75f * v.gain) * (0.5f + 0.9f * param(kPressure));
    const float knock = m.knock * hard * (struck ? 0.4f + 0.6f * sharp : 0.06f + 0.94f * sharp) * (v.script == made::kStamp ? 1.4f : v.script == made::kHook ? 0.35f : 1.0f);
    for (int q = 0; q < 4; ++q) {
      const int k = kHairs + q;
      const float turn = v.rng.uniform();
      v.re[k] = kit::SineTable::cos_lookup(turn);
      v.im[k] = kit::SineTable::lookup(turn);
      const float n = g.ratio[q];
      const bool fits = v.hz * n < 0.4f * sr && v.hz * n < 13000.0f;
      v.angle[k] = fits ? base * n : base;
      v.mode_fit[q] = fits ? 1.0f / (1.0f + 0.8f * static_cast<float>(q)) : 0.0f;
      v.mode_drive[q] = 0.0f;
      v.mode_level[q] = fits ? g.ring * knock * (q == 0 ? 1.0f : 0.8f / (1.0f + 0.5f * static_cast<float>(q))) : 0.0f;
      v.mode_first[q] = v.mode_level[q];
      const float seconds = g.ring_seconds * std::sqrt(kit::clamp(330.0f / v.hz, 0.4f, 2.5f)) / (0.6f + 0.4f * n);
      v.mode_keep[q] = std::exp(-6.9f * dt_ * (struck ? 0.6f : 1.0f) / seconds);
      v.apart[k] = 0.0f;
    }

    v.contact = 4.2f * knock * sharp;
    // Strokes that land together do not all push the same way.
    v.knock = ((strokes_ * 5u) & 2u) ? -knock : knock;
    v.waiting = 0;
    v.quick = false;
    v.time = v.u = v.lifted = 0.0f;
    v.refill = 0.0f;
    v.splash = 0.45f * pool();  // a loaded brush leaves a blot where it lands
    v.until_dip = dip_wait(v.rng.uniform());
    v.tremor = v.rng.uniform() * 0.12f;
    v.pressure = v.weight = 0.0f;
    v.shade_seen = v.press_seen = v.release_seen = -1.0f;
    const float octave = std::log2(v.hz / 220.0f);
    v.trim = m.gain * kit::clamp(std::exp2(octave > 0.0f ? -0.27f * octave : 0.2f * octave), 0.45f, 1.0f);
    set_levels(v);
    for (int k = 0; k < kHairs; ++k) v.loud[k] = v.loud_to[k];
    place(v, v.side);
    place(v, v.side);  // twice: it starts where it stands

    kit::PluckedString<made::kLine>& string = strings_[slot];
    string.reset();
    v.string_fits = v.hz >= kit::PluckedString<made::kLine>::lowest_hz(sr) && v.hz < 0.1f * sr;
    tune_string(slot);
    v.exciter.stop();
    v.exciter.strike(0.7f * v.knock, v.hz, m.pick_hz * (0.6f + 0.8f * v.gain) * (0.4f + 1.2f * param(kShade)), 0.35f, sr);
    v.string_peak = 1.0f;
    for (int c = 0; c < 2; ++c) {
      v.rub_band[c].reset();
      v.rub_soft[c].reset();
    }
    v.drive_soft.reset();
    v.drive_soft.set_cutoff(0.45f * m.pick_hz, sr);
    v.rub.snap(0.0f);
    v.rub_side.snap(0.0f);
    v.drive.snap(0.0f);
    v.string_out.snap(0.0f);
    v.out.snap(1.0f);
  }

  // The level each hair and each hair's stain has at the ink's colour: unit
  // power over the brush, so the colour is not a fader.
  void set_levels(Voice& v) {
    using namespace dry_brush;
    const made::Matter& m = made::kMatter[v.brush];
    const made::Ground& g = made::kGround[v.paper];
    v.shade_seen = param(kShade);
    v.press_seen = param(kPressure);
    const float follow = std::sqrt(v.hz / 220.0f);
    const float corner = 170.0f * std::pow(42.0f, v.shade_seen) * m.bright * g.soft * std::exp2(3.0f * (v.press_seen - 0.55f)) * follow * (0.6f + 0.6f * v.gain);
    const float reach = g.reach * (0.4f + 1.2f * v.shade_seen) * kit::clamp(follow, 0.7f, 3.0f);
    const float nyquist = kit::min(15000.0f, 0.4f * sample_rate());
    const float pale = v.shade_seen - 0.5f, heavy = v.press_seen - 0.55f;
    const float tilt = (pale < 0.0f ? 2.2f : 1.1f) * pale + (heavy < 0.0f ? 0.9f : 0.6f) * heavy;
    // What the stroke comes to at its heaviest, of which most is made up for:
    // pressure is colour first and loudness second.
    const float most = hold_of(v.press_seen) * 1.056f * made::kHeaviest[v.script];
    float power = 0.0f, stain_power = 0.0f, touched = 0.0f;
    float own[kHairs], drunk[kHairs];
    for (int i = 0; i < kHairs; ++i) {
      const float n = made::kRatio[v.brush][i];
      const float f = v.hz * n;
      const float room = kit::clamp((nyquist - f) / (0.2f * nyquist), 0.0f, 1.0f);
      const float x = f / corner;
      own[i] = v.spec[i] * std::pow(n, tilt) * room / (1.0f + x * x);
      const float y = f / reach;
      drunk[i] = v.plain[i] * room / ((1.0f + y * y) * (0.7f + 0.3f * n));
      if (n < 1.0f) drunk[i] *= 0.5f;
      power += own[i] * own[i];
      const float open = made::smooth1((most - v.touch[made::slot_of(i)]) * (1.0f / 0.55f));
      touched += own[i] * own[i] * open * open;
      stain_power += drunk[i] * drunk[i];
    }
    const float heft = made::heft_of(most);
    v.norm = kit::clamp(std::pow(kit::max(touched / kit::max(power, 1.0e-9f), 1.0e-4f) * heft * heft, -0.36f), 0.5f, 3.5f) * made::kPresence[v.script];
    const float scale = v.norm * v.trim / std::sqrt(kit::max(power, 1.0e-9f));
    const float stain_scale = v.trim * g.drink * m.leave / std::sqrt(kit::max(stain_power, 1.0e-9f));
    for (int i = 0; i < kHairs; ++i) {
      const int k = made::slot_of(i);
      v.loud_to[k] = own[i] * scale;
      v.stain_level[k] = drunk[i] * stain_scale;
    }
  }

  void place(Voice& v, float side) {
    static constexpr float kWhere[4] = {-0.3f, 0.36f, -0.95f, 0.9f};
    for (int q = 0; q < 4; ++q) {
      const float angle = (kWhere[q] * side * kit::min(1.0f, ramps_[kWide].value * (0.4f + 0.6f * made::kGround[v.paper].wide)) + 1.0f) * 0.125f;
      v.pan_l[q] = v.pan_to_l[q];
      v.pan_r[q] = v.pan_to_r[q];
      v.pan_to_l[q] = kVoiceGain * kit::SineTable::cos_lookup(angle);
      v.pan_to_r[q] = kVoiceGain * kit::SineTable::lookup(angle);
      v.pan_by_l[q] = (v.pan_to_l[q] - v.pan_l[q]) * per_sample_;
      v.pan_by_r[q] = (v.pan_to_r[q] - v.pan_r[q]) * per_sample_;
    }
  }

  // The string rings as its brush has it, and is damped once the brush is up.
  void tune_string(int slot) {
    Voice& v = pool_.voices[slot];
    const made::Matter& m = made::kMatter[v.brush];
    const float release = v.quick ? 0.06f : param(dry_brush::kRelease);
    v.release_seen = v.held ? -1.0f : release;
    const float pace = kit::clamp(std::sqrt(220.0f / v.hz), 0.4f, 1.8f);
    float ring = m.hold * pace * (v.script == made::kDot ? 0.6f : v.script == made::kTremble ? 0.12f : 1.0f);
    if (!v.held) ring = kit::min(ring, 0.08f + release);
    strings_[slot].set_frequency(v.hz, sample_rate());
    strings_[slot].set_decay(ring, kit::min(ring, m.hold_high * (0.4f + 1.2f * param(dry_brush::kShade))), 4000.0f);
    const float g = std::pow(10.0f, -3.0f / (v.hz * ring));
    v.string_norm = std::sqrt(kit::max(1.0f - g * g, 1.0e-4f));
  }

  // Seconds a stroke takes to land. A script that is a landing by itself is
  // never set down slower than it can be heard.
  float attack_of(const Voice& v) const {
    const float pace = made::kMatter[v.brush].pace, set = param(dry_brush::kAttack);
    if (v.script == made::kLevelLine || v.script == made::kTremble) return pace * set;
    return kit::min(pace, 1.0f) * set / (1.0f + 0.6f * set);
  }
  // How sharply a landing strikes: all of it at once, next to nothing when it is slow.
  static float landing(float attack) { return kit::min(1.0f, 1.2f / (1.0f + std::pow(attack * (1.0f / 0.03f), 0.8f))); }
  // How hard a setting of Pressure presses.
  static float hold_of(float pressure) { return 0.16f + 1.52f * pressure; }
  // How much more ink the brush has than it can hold.
  float pool() const { return kit::max(0.0f, 2.0f * ramps_[kInking].value - 1.0f); }
  // Seconds to the next dip of a held stroke.
  float dip_wait(float chance) const {
    const float redip = param(dry_brush::kRedip);
    return 4.5f * std::pow(0.078f, redip) * (0.85f + 0.3f * chance);
  }
  void dip(int slot, float much) {
    Voice& v = pool_.voices[slot];
    v.refill = kit::max(v.refill, 0.6f + 0.4f * much);
    v.splash = kit::max(v.splash, 0.3f + 0.6f * much);
    if (v.script != made::kDot && v.script != made::kStamp) return;
    // A struck mark is struck again.
    const float sharp = landing(param(dry_brush::kAttack));
    v.splash = 0.0f;
    v.contact = 4.2f * std::fabs(v.knock) * sharp;
    for (int q = 0; q < 4; ++q) v.mode_level[q] = kit::max(v.mode_level[q], v.mode_first[q]);
    v.exciter.strike(0.7f * v.knock, v.hz, made::kMatter[v.brush].pick_hz * (0.6f + 0.8f * v.gain) * (0.4f + 1.2f * param(dry_brush::kShade)), 0.35f, sample_rate());
  }

  // One tick of one stroke: the hand, the ink, the hairs and the stain.
  void tick(int slot) {
    using namespace dry_brush;
    Voice& v = pool_.voices[slot];
    const made::Matter& m = made::kMatter[v.brush];
    const made::Ground& g = made::kGround[v.paper];
    place(v, v.side);
    if (v.waiting > 0) {
      if (--v.waiting == 0) {
        begin(slot);
      } else {
        // Stolen: every level goes to nothing, rounded at both ends.
        const float whole = static_cast<float>(kStealTicks);
        const float share = made::smooth1(static_cast<float>(v.waiting - 1) / whole) / made::smooth1(static_cast<float>(v.waiting) / whole);
        for (int k = 0; k < 32; ++k) {
          v.ar[k] = v.from_r[k] = v.tr[k];
          v.ai[k] = v.from_i[k] = v.ti[k];
          v.tr[k] *= share;
          v.ti[k] *= share;
        }
        v.out.aim(v.out.target * share, per_sample_);
        v.rub.aim(v.rub.target, per_sample_);
        v.rub_side.aim(v.rub_side.target, per_sample_);
        v.drive.aim(v.drive.target, per_sample_);
        v.string_out.aim(v.string_out.target, per_sample_);
        return;
      }
    }
    if (v.shade_seen != param(kShade) || v.press_seen != param(kPressure)) set_levels(v);

    // The hand.
    const float release = v.quick ? 0.06f : param(kRelease);
    v.time += dt_;
    const bool struck = v.script == made::kDot || v.script == made::kStamp;
    const float attack = attack_of(v);
    if (v.held && (v.script != made::kSweep || v.time > 0.7f * attack)) v.u += dt_ * (v.script == made::kHook ? 0.25f + 0.65f * script_rate_ : script_rate_);
    float p, speed;
    made::hand(v, &p, &speed);
    v.splash = flush_denormal(v.splash * splash_keep_);
    p *= hold_of(ramps_[kPress].value) * (0.56f + 0.62f * v.gain);
    p += 0.9f * v.splash;
    const float quick = 0.35f + 1.3f * param(kSpeed);
    speed *= quick;
    V4 press = made::all(p);
    if (v.tremor_depth > 0.0f) {
      // The two halves of the brush shake against each other, unevenly.
      const float depth = v.tremor_depth * kit::min(1.0f, v.time * 4.0f);
      const float a = made::shake(tremor_ + v.tremor), b = made::shake(tremor_ + v.tremor + 0.1f);
      press = p * (1.0f + depth * V4{a, b, a, b});
      speed *= 1.0f + 0.8f * depth * a;
    }

    // Pitch: a lean that is spent as the brush takes hold, one that grows as it lifts.
    float cents = ramps_[kLeaning].value * std::exp(-v.time * lean_rate_);
    if (!v.held) {
      v.lifted += dt_;
      if (!v.quick) cents += ramps_[kTrailing].value * made::smooth1(v.lifted / (0.05f + 0.45f * release));
    }
    const float bend = std::exp2(cents * (1.0f / 1200.0f));
    const bool bending = std::fabs(bend - v.bend) > 1.0e-6f;
    v.bend = bend;
    if (bending && v.string_fits) strings_[slot].set_frequency(v.hz * bend, sample_rate());
    if (!v.held && release != v.release_seen && v.string_fits) tune_string(slot);

    // Redipping.
    if (v.held && param(kRedip) > 0.0f) {
      v.until_dip = kit::min(v.until_dip, dip_wait(1.0f)) - dt_;
      if (v.until_dip <= 0.0f) {
        dip(slot, param(kRedip));
        v.until_dip = dip_wait(v.rng.uniform());
      }
    }
    float poured = 0.0f;
    if (v.refill > 0.0f) {
      poured = kit::min(v.refill, dt_ * 4.0f);
      v.refill -= poured;
    }

    skip(v, speed);

    // The hairs, four at a time.
    const float strung = ramps_[kStringing].value;
    // Hairs that stand on one pitch add up; apart they do not.
    const float bled = ramps_[kBleeding].value;
    const float hairs_gain = (1.0f - 0.8f * strung * strung) * (1.0f - 0.4f * bled * bled) * (1.0f - 0.3f / (1.0f + ramps_[kSpreading].value));
    const float land_by = dt_ / kit::max(attack, 0.002f);
    const float dry = ramps_[kDrying].value;
    const float lift_rate = dt_ * 6.9f / release;
    const float drag = param(kTail) * kit::min(7.0f, kit::max(0.0f, 24.0f / release - 1.0f));
    const float linger = 2.5f * param(kTail) * param(kTail);  // a struck mark's last hairs stay longer too
    // A struck mark fades by itself, later the more ink it was given.
    const float wear = struck && v.time > attack ? dt_ * fade_rate_ * (v.script == made::kStamp ? (v.time * script_rate_ < 1.1f ? 1.0f : 9.0f) : 9.5f) * std::exp2(2.2f * (0.6f - param(kInk))) * (0.8f + 0.6f * dry) : 0.0f;
    const float again = struck && v.refill > 0.0f ? 1.0f - std::exp(-dt_ / (0.004f + 0.3f * attack)) : 0.0f;
    const float spend = dt_ * (0.35f + speed) * ink_rate_;
    const float wetness = 3.0f - 2.1f * dry;
    const float tooth = ramps_[kTooth].value * g.tooth;
    const float flutter = kit::min(0.85f, tooth * (0.22f + 0.4f * speed));
    const float scratch_gain = 0.25f + 1.15f * dry;
    const float tone_gain = m.tone * (1.0f - 0.55f * dry * dry), blur_tone = std::sqrt(1.0f - tone_gain * tone_gain);
    const float split = 2.2f * dry;  // a hair that runs dry leaves the others
    const float stain_up = 1.0f - std::exp(-dt_ / (0.12f + 0.22f * soak_));
    const float stain_down = std::exp(-dt_ * 6.9f / (soak_ * 1.3f));
    const float bleed = bled * (1.0f + 1.1f * bled) * (0.85f + 0.6f * pool());
    const float wide = ramps_[kSpreading].value * (0.0005776f);  // cents to a ratio
    const float stain_keep = v.quick ? std::exp(-dt_ * 6.9f / 0.12f) : stain_down;
    // Weight is loudness too, and a hard key more of it.
    const V4 heft = made::vmin(press * 4.0f, made::all(1.0f)) * (0.3f + 0.7f * made::vmin(press, made::all(1.8f))) * (0.55f + 0.64f * v.gain) * hairs_gain;
    const float stain_share = v.script == made::kTremble ? 0.3f : v.script == made::kHook || v.script == made::kSweep ? 0.6f : 1.0f;
    const float heft_mean = v.gain * hairs_gain;
    V4 total = made::all(0.0f), ink_sum = made::all(0.0f), flow_sum = made::all(0.0f), stain_sum = made::all(0.0f), hair_sum = made::all(0.0f);
    const V4 zero = made::all(0.0f);
    const float sides = 1.35f * ramps_[kWide].value * g.wide;
    for (int r = 0; r < kRows - 1; ++r) {
      const int k = 4 * r;
      const V4 loud = made::load(v.loud + k) + (made::load(v.loud_to + k) - made::load(v.loud + k)) * level_step_;
      made::store(v.loud + k, loud);
      // Touching, landed, not yet lifted, not worn out.
      const V4 touching = made::smooth(made::unit((press - made::load(v.touch + k)) * (1.0f / 0.55f)));
      const V4 late = made::load(v.late + k);
      const V4 landing_at = made::vmin(made::load(v.land + k) + (v.time > late ? made::all(land_by) : zero), made::all(1.0f));
      made::store(v.land + k, landing_at);
      const V4 landed = made::smooth(landing_at);
      V4 lift = made::load(v.lift + k);
      if (!v.held) {
        const V4 x = lift_rate / (1.0f + drag * made::load(v.core + k));
        lift = made::settle(lift / (1.0f + x * (1.0f + 0.5f * x)));
        made::store(v.lift + k, lift);
      }
      V4 worn = made::load(v.wear + k);
      if (wear > 0.0f) {
        const V4 x = wear * made::load(v.wear_rate + k) / (1.0f + linger * made::load(v.core + k));
        worn = made::settle(worn / (1.0f + x * (1.0f + 0.5f * x)));
        made::store(v.wear + k, worn);
      }
      if (again > 0.0f) {
        worn = worn + (1.0f - worn) * again;
        made::store(v.wear + k, worn);
      }
      const V4 flow = touching * landed * lift * worn;
      // Ink.
      V4 ink = made::load(v.ink + k);
      ink = made::vmin(made::vmax(ink - spend * made::load(v.thirst + k) * flow, zero) + poured, made::all(1.0f));
      made::store(v.ink + k, ink);
      const V4 wet = made::smooth(made::unit(ink * wetness));
      made::store(v.wet + k, wet);
      // The gate of a skip, its edges rounded.
      const V4 goal = made::load(v.goal + k), was = made::load(v.gate + k);
      const V4 gate = was + made::vmin(made::vmax(goal - was, made::all(-edge_step_)), made::all(edge_step_));
      made::store(v.gate + k, gate);
      const V4 body = made::load(v.floor + k) + (1.0f - made::load(v.floor + k)) * wet;
      const V4 sound = loud * flow * heft * made::smooth(made::unit(gate));
      const V4 tone = sound * body * tone_gain;
      const V4 scratch = sound * (body * (blur_tone + flutter) + (1.0f - wet) * scratch_gain * (0.15f + 0.6f * body));
      // Two slow noises for the blur, two slower ones for the stain.
      const V4 bk = made::load(v.blur_k + k), sk = made::all(v.stain_k);
      const V4 blur_r = made::wander(v, v.n1r + k, v.n2r + k, bk), blur_i = made::wander(v, v.n1i + k, v.n2i + k, bk);
      const V4 slow_r = made::wander(v, v.s1r + k, v.s2r + k, sk), slow_i = made::wander(v, v.s1i + k, v.s2i + k, sk);
      // The stain drinks what flows and dries by itself.
      V4 stain = made::load(v.stain + k);
      const V4 drunk = flow * (0.5f + 0.5f * wet);
      const V4 rising = stain + (drunk - stain) * stain_up;
      stain = made::settle(drunk > stain ? rising : drunk + (stain - drunk) * stain_keep);
      made::store(v.stain + k, stain);
      const V4 bloom = stain * made::load(v.stain_level + k) * bleed * stain_share * (0.5f + 0.5f * heft_mean);
      const V4 blur = made::load(v.blur_gain + k) * scratch;
      made::store(v.ar + k, made::load(v.tr + k));
      made::store(v.ai + k, made::load(v.ti + k));
      made::store(v.from_r + k, made::load(v.tr + k));
      made::store(v.from_i + k, made::load(v.ti + k));
      const V4 real = tone + blur_r * blur + slow_r * v.stain_gain * bloom;
      const V4 imag = blur_i * blur + slow_i * v.stain_gain * bloom;
      made::store(v.tr + k, real);
      made::store(v.ti + k, imag * sides);
      total = total + real * real + imag * imag;
      ink_sum = ink_sum + ink;
      flow_sum = flow_sum + flow * loud * loud;
      stain_sum = stain_sum + stain;
      hair_sum = hair_sum + flow * gate;
      V4 sine, cosine;
      made::turn4(made::vmin(made::load(v.angle + k) * bend * (1.0f + wide * (1.0f + split * (1.0f - wet)) * made::load(v.apart + k)), made::all(2.64f)), &sine, &cosine);
      made::store(v.turn_s + k, sine);
      made::store(v.turn_c + k, cosine);
      made::steady(v, k);
    }
    // The paper under it rings where it was struck.
    {
      const int k = kHairs;
      const float rubbed_by = v.weight * speed;
      for (int q = 0; q < 4; ++q) {
        v.ar[k + q] = v.from_r[k + q] = v.tr[k + q];
        v.ai[k + q] = v.from_i[k + q] = v.ti[k + q];
        v.mode_level[q] = flush_denormal(v.mode_level[q] * v.mode_keep[q] * (v.held ? 1.0f : 1.0f / (1.0f + 0.35f * lift_rate)));
        v.mode_drive[q] = flush_denormal(v.mode_drive[q] + (g.rubbed * v.mode_fit[q] * rubbed_by - v.mode_drive[q]) * mode_step_);
        v.tr[k + q] = (v.mode_level[q] + v.mode_drive[q]) * v.trim * hairs_gain;
        v.ti[k + q] = v.tr[k + q] * ((q & 1) ? 0.5f : -0.5f) * sides;
      }
      V4 sine, cosine;
      made::turn4(made::vmin(made::load(v.angle + k) * bend, made::all(2.64f)), &sine, &cosine);
      made::store(v.turn_s + k, sine);
      made::store(v.turn_c + k, cosine);
      made::steady(v, k);
    }

    // The rubbing of the brush, and the string it rubs.
    const float shade = param(kShade);
    const float flowing = kit::min(made::sum(flow_sum) / (v.trim * v.trim * v.norm * v.norm), 1.0f);
    // A brush that lifts stops rubbing before its last hairs have left.
    const float leaving = v.held ? 0.0f : kit::min(v.lifted * 12.0f, 1.0f);
    const float weight = kit::min(p, 1.3f) * kit::lerp(kit::min(flowing * 1.6f, 1.0f), flowing * flowing, leaving);
    const float tooth_now = ramps_[kTooth].value * (0.4f + 1.3f * ramps_[kTooth].value) * (0.75f + 0.23f * g.tooth);
    const float x = weight * speed * (m.air + tooth_now) * (0.4f + 1.2f * shade) * (0.4f + 1.7f * dry);
    v.contact = flush_denormal(v.contact * contact_keep_);
    const float rub_hz = kit::clamp(g.rub * m.rub_hz * std::sqrt(std::sqrt(v.hz * (1.0f / 220.0f))) * (0.4f + 0.55f * speed) * (0.65f + 0.35f * kit::min(p, 1.8f)) * (0.45f + 1.1f * shade), 100.0f, 5000.0f);
    // The rubbing's level is told in what it measures, whatever its band.
    const float rub_norm = 2.4f / std::sqrt(kit::min(1.0f, 3.1f * rub_hz / (m.rub_q * sample_rate())));
    const float scrape = (0.1f + m.rub) * v.contact * (0.15f + 2.2f * kit::min(tooth_now, 0.9f));
    const float rubbing = m.rub * kit::min(1.0f, 1.6f * flowing) * x / (1.0f + x) + scrape / (1.0f + 1.1f * scrape);
    v.rub.aim(rub_norm * rubbing * (0.5f + 0.5f * v.gain) * hairs_gain * kit::min(v.norm, 1.6f), per_sample_);
    v.rub_side.aim(v.rub.target * ramps_[kWide].value, per_sample_);
    for (int c = 0; c < 2; ++c) {
      v.rub_band[c].set(rub_hz, m.rub_q, sample_rate());
      v.rub_soft[c].set_cutoff(1.3f * rub_hz, sample_rate());
    }
    v.drive.aim((v.script == made::kStamp || v.script == made::kDot ? 0.5f : 2.2f) * v.string_norm * (1.0f + 1.4f * strung * strung) * weight * kit::min(v.norm, 2.0f) * (0.2f + 0.8f * speed) * (0.5f + 0.5f * v.gain) * noise_scale_, per_sample_);
    const float audible = v.string_fits ? strung * (1.6f - 0.6f * strung) * kStringGain * m.string * v.trim : 0.0f;
    v.string_out.aim(audible, per_sample_);
    v.out.aim(1.0f, per_sample_);

    v.pressure = p;
    v.weight = weight;
    float mode_total = 0.0f;
    for (int q = 0; q < 4; ++q) mode_total += v.mode_level[q] + v.mode_drive[q];
    const float reach = std::sqrt(made::sum(total)) + mode_total + v.string_peak * audible;
    v.string_peak *= string_fall_;  // raised again in render()
    v.loudness = kit::max(reach, v.held ? 1.0e-3f : 0.0f);
    if (!v.held && reach < 1.2e-5f && v.rub.target < 1.0e-5f && v.time > 0.02f) {
      v.sounding = false;
      for (int k = 0; k < 32; ++k) v.tr[k] = v.ti[k] = v.ar[k] = v.ai[k] = v.from_r[k] = v.from_i[k] = 0.0f;
    }
    meter_note(slot, made::sum(ink_sum) * (1.0f / kHairs), p, made::sum(stain_sum) * (1.0f / kHairs), made::sum(hair_sum) * (1.0f / kHairs));
  }

  // The newest stroke is the one the meters read.
  void meter_note(int slot, float ink, float pressure, float stain, float hairs) {
    if (slot != newest_) return;
    const Voice& v = pool_.voices[slot];
    meter_ink_ = kit::clamp(ink, 0.0f, 1.0f);
    meter_pressure_ = v.sounding ? kit::clamp(pressure * 0.7f, 0.0f, 1.0f) : 0.0f;
    meter_stain_ = v.sounding ? kit::clamp(stain, 0.0f, 1.0f) : 0.0f;
    meter_hairs_ = v.sounding ? kit::clamp(hairs, 0.0f, 1.0f) : 0.0f;
  }

  // Each hair decides for itself when it skips. The drier it is the oftener
  // and the deeper; a hair with ink never does, but for the tooth of the paper.
  void skip(Voice& v, float speed) {
    const made::Matter& m = made::kMatter[v.brush];
    const made::Ground& g = made::kGround[v.paper];
    const float caught = g.catching * (0.45f + 0.55f * ramps_[kTooth].value) * kit::min(1.0f, 0.4f + speed);
    const float gap = m.gap * (1.5f - 0.6f * kit::min(speed, 1.4f));
    for (int i = 0; i < kHairs; ++i) {
      if (--v.timer[i] > 0) continue;
      const int k = made::slot_of(i);
      const float d = kit::clamp((1.0f - v.wet[k]) * ramps_[kDrying].value * 1.5f + caught * (0.4f + 0.6f * ramps_[kDrying].value), 0.0f, 0.9f);
      float seconds;
      if (v.goal[k] >= 1.0f && v.rng.uniform() < d) {
        v.goal[k] = 1.0f - kit::min(1.0f, 1.7f * d) * (1.0f - (caught > 0.0f ? 0.35f : 0.55f) * v.core[k]);
        seconds = 2.0f * kEdgeSeconds + gap * (0.5f + v.rng.uniform());
      } else {
        v.goal[k] = 1.0f;
        seconds = (0.5f + v.rng.uniform()) * kit::lerp(0.28f, 0.05f, d);
      }
      v.timer[i] = 1 + static_cast<int>(seconds / dt_);
    }
  }

  // Every tick, before any sample of it.
  void control() {
    using namespace dry_brush;
    for (kit::Smoother& s : ramps_) s.next();
    soak_ = param(kSoak);
    const float length = 5.0f * std::pow(0.028f, param(kSpeed));
    script_rate_ = 1.0f / length;
    fade_rate_ = 0.2f * std::pow(5.0f * script_rate_, 0.75f);  // a struck mark is never too short to be a tone
    // One hand shakes them all, unevenly.
    tremor_ += dt_ * kit::clamp(2.8f * std::pow(length, -0.8f), 0.7f, 11.0f) * (1.0f + 0.35f * kit::SineTable::lookup(tremor_slow_));
    tremor_ -= std::floor(tremor_);
    tremor_slow_ += dt_ * 0.31f;
    tremor_slow_ -= std::floor(tremor_slow_);
    ink_rate_ = 1.0f / (0.25f * std::pow(28.0f, param(kInk)));
    lean_rate_ = 1.0f / (0.06f + 0.3f * length);
    splash_keep_ = std::exp(-dt_ / 0.22f);
    contact_keep_ = std::exp(-dt_ / 0.03f);
    string_fall_ = std::exp(-dt_ / 0.08f);
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding) continue;
      const float wander = made::kGround[voice.paper].wander * kit::clamp(std::sqrt(voice.hz * (1.0f / 220.0f)), 0.5f, 2.0f);
      voice.stain_k = made::pole_for(wander, dt_);
      voice.stain_gain = made::blur_norm(voice.stain_k);
      tick(v);
    }
    sheet_aim();
  }

  void sheet_aim() {
    const made::Ground& g = made::kGround[choice(dry_brush::kPaper, made::kSheets)];
    const float sr = sample_rate();
    float* now[9] = {&thin_, &low_, &f1_, &q1_, &g1_, &f2_, &q2_, &g2_, &gain_};
    const float to[9] = {g.thin, g.low, g.f1, g.q1, g.g1, g.f2, g.q2, g.g2, g.gain};
    bool moved = false;
    for (int i = 0; i < 9; ++i) {
      if (*now[i] == to[i]) continue;
      moved = true;
      // Two stages, so that the sheet sets off gently.
      sheet_mid_[i] = sheet_fresh_ ? to[i] : sheet_mid_[i] + (to[i] - sheet_mid_[i]) * sheet_step_;
      const float next = *now[i] + (sheet_mid_[i] - *now[i]) * (sheet_fresh_ ? 1.0f : sheet_step_);
      *now[i] = std::fabs(next - to[i]) < 1.0e-4f * std::fabs(to[i]) + 1.0e-6f ? to[i] : next;
    }
    if (moved || sheet_fresh_) {
      for (int c = 0; c < 2; ++c) {
        low_pass_[c].set(low_, 0.62f, sr);
        band1_[c].set(f1_, q1_, sr);
        band2_[c].set(f2_, q2_, sr);
      }
    }
    sheet_gain_.aim(gain_, per_sample_);
    if (sheet_fresh_) sheet_gain_.snap(gain_);
    sheet_fresh_ = false;
  }

  // `count` samples between two ticks.
  void render(int offset, int count) {
    alignas(16) float left[kMaxTick], right[kMaxTick];
    for (int i = 0; i < count; ++i) left[i] = right[i] = 0.0f;
    const V4 share = made::all(per_sample_);
    for (int s = 0; s < kMaxVoices; ++s) {
      Voice& v = pool_.voices[s];
      if (!v.sounding) continue;
      V4 mid[kMaxTick], side[kMaxTick];
      for (int i = 0; i < count; ++i) mid[i] = side[i] = made::all(0.0f);
      for (int r = 0; r < kRows; r += 2) made::spin(v, 4 * r, share, mid, side, count);
      V4 pl = made::load(v.pan_l), pr = made::load(v.pan_r);
      const V4 step_l = made::load(v.pan_by_l), step_r = made::load(v.pan_by_r);
      const bool stringy = v.string_fits && (v.string_out.value > 0.0f || v.string_out.target > 0.0f);
      kit::PluckedString<made::kLine>& string = strings_[s];
      float peak = 0.0f;
      for (int i = 0; i < count; ++i) {
        const float white = v.rng.bipolar();
        const float other = v.rng.bipolar();
        const float level = v.rub.next();
        const float rub_a = v.rub_soft[0].lowpass(v.rub_band[0].bandpass(white)) * level;
        const float rub_b = v.rub_soft[1].lowpass(v.rub_band[1].bandpass(other)) * v.rub_side.next();
        const float drive = v.drive.next();
        const float out = v.out.next();
        const float string_level = v.string_out.next();
        float middle = rub_a;
        if (stringy) {
          const float y = string.tick(v.exciter.next(v.rng) + v.drive_soft.lowpass(white) * drive);
          const float size = y < 0.0f ? -y : y;
          if (size > peak) peak = size;
          middle += y * string_level;
        }
        middle *= out * kVoiceGain * kit::kSqrtHalf;
        const float edges = rub_b * out * kVoiceGain * kit::kSqrtHalf;
        pl += step_l;
        pr += step_r;
        const V4 l = pl * (mid[i] - side[i]);
        const V4 rr = pr * (mid[i] + side[i]);
        left[i] += l[0] + l[1] + l[2] + l[3] + middle + edges;
        right[i] += rr[0] + rr[1] + rr[2] + rr[3] + middle - edges;
      }
      made::store(v.pan_l, pl);
      made::store(v.pan_r, pr);
      if (peak > v.string_peak) v.string_peak = peak;
      if (!stringy) v.string_peak = 0.0f;
    }
    for (int i = 0; i < count; ++i) {
      const float volume = volume_.next() * sheet_gain_.next();
      out_left_[offset + i] = kit::soft_clip(sheet(0, left[i]) * volume);
      out_right_[offset + i] = kit::soft_clip(sheet(1, right[i]) * volume);
    }
  }

  float sheet(int c, float x) {
    x = dc_[c].process(x);
    x -= thin_ * bottom_[c].lowpass(x);
    const float y = x + g1_ * band1_[c].bandpass(x) + g2_ * band2_[c].bandpass(x);
    return low_pass_[c].lowpass(y);
  }

  // A key goes down and nothing is sounding: a knob moved in the silence has
  // arrived, and what ran on or stood still is where it would be from init().
  void arrive() {
    until_tick_ = 0;
    for (kit::Smoother& s : ramps_) s.snap(s.target);
    volume_.snap(volume_.target);
    for (int c = 0; c < 2; ++c) {
      low_pass_[c].reset();
      band1_[c].reset();
      band2_[c].reset();
      dc_[c].reset();
      bottom_[c].reset();
      bottom_[c].set_cutoff(260.0f, sample_rate());
      dc_[c].set_cutoff(18.0f, sample_rate());
    }
    tremor_ = tremor_slow_ = 0.0f;
    sheet_fresh_ = true;
  }

  void apply(int id) {
    using namespace dry_brush;
    const float value = param(id);
    switch (id) {
      case kPressure: ramps_[kPress].set(value, primed()); break;
      case kGrain: ramps_[kTooth].set(value, primed()); break;
      case kBleed: ramps_[kBleeding].set(value, primed()); break;
      case kString: ramps_[kStringing].set(value, primed()); break;
      case kWidth: ramps_[kWide].set(value, primed()); break;
      case kDryness: ramps_[kDrying].set(value, primed()); break;
      case kInk: ramps_[kInking].set(value, primed()); break;
      case kSpread: ramps_[kSpreading].set(value, primed()); break;
      case kLean: ramps_[kLeaning].set(value, primed()); break;
      case kTailLean: ramps_[kTrailing].set(value, primed()); break;
      case kVolume: volume_.set(kit::db_to_gain(value), primed()); break;
      default: break;  // read every tick or when a key goes down
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::PluckedString<made::kLine> strings_[kMaxVoices];
  kit::Svf low_pass_[2], band1_[2], band2_[2];
  kit::DcBlocker dc_[2];
  kit::OnePole bottom_[2];
  float thin_ = 0.0f;
  float low_ = 0.0f, f1_ = 0.0f, q1_ = 0.0f, g1_ = 0.0f, f2_ = 0.0f, q2_ = 0.0f, g2_ = 0.0f, gain_ = 0.0f;
  float sheet_mid_[9] = {};
  Glide sheet_gain_;
  bool sheet_fresh_ = true;
  enum Ramp : int { kPress = 0, kTooth, kBleeding, kStringing, kWide, kDrying, kInking, kSpreading, kLeaning, kTrailing, kRamps };
  kit::Smoother ramps_[kRamps];  // advanced every tick
  kit::Smoother volume_;
  kit::IdleGate idle_;
  int period_ = 64, until_tick_ = 0;
  float dt_ = 0.00133f, per_sample_ = 1.0f / 64.0f, noise_scale_ = 1.0f, edge_step_ = 0.1f;
  float level_step_ = 0.1f, mode_step_ = 0.01f, sheet_step_ = 0.1f;
  float soak_ = 3.0f, script_rate_ = 1.0f, tremor_ = 0.0f, tremor_slow_ = 0.0f, ink_rate_ = 0.2f, lean_rate_ = 5.0f;
  float fade_rate_ = 1.0f;
  float splash_keep_ = 0.99f, string_fall_ = 0.99f, contact_keep_ = 0.9f;
  float meter_ink_ = 0.0f, meter_pressure_ = 0.0f, meter_stain_ = 0.0f, meter_hairs_ = 0.0f;
  int newest_ = 0;  // where the newest stroke is
  uint32_t strokes_ = 0;
};

}  // namespace livemix
