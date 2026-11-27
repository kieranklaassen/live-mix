#pragma once

// Wire Lantern: wire strung along the edges of a solid, played at one place on
// one edge and heard from two others.
//
//   key down ─► exciter ─► 24 families of the solid, 48 lines ─► two ears ─┬─► volume ─► soft clip ─► out
//   (finger, hammer,       (lantern_solids.h: pitch, share of   (walk the  │
//    bow, breath)           the played place, touched corner)    edges)    ├─► frame (wires of the keys
//          └ contact noise ────────────────────────────────────────────────┤   played lately), Sympathy
//                                                                          └── ◄──┘
//
// - A line is one complex number turned and shrunk a little every sample. A
//   strike finds its voice silent: every line starts at its level with a phase
//   of its own, and the voice is opened by one raised cosine, so levels are
//   exact at every sample rate, nothing clicks and Swell opens any exciter.
// - A family is two lines, whatever its degeneracy: A is the shape the touched
//   corner feels, B the rest of what the player woke (the two span all that can
//   be heard of it). Touch damps A and leaves B, so it takes tones away by
//   where the edge is, and not by how high they are.
// - True bends every family from where the solid has it to the nearest open
//   interval, lets octaves and fifths lead, and takes out what makes a net
//   uneven: stiff wire, the cents between A and B, tones of odd strengths.
// - Bow and breath hold every line near a level: a line under it grows as it
//   is (no phase is pushed in), one over it sinks. Breath also blows noise
//   through the lines, and the bow lets its hair grip once a period.
// - The ears stand on the net and walk round it with Turn. What an ear hears
//   of a line is the size of that line's wave where it stands, so every tone
//   comes and goes by itself. Sizes only, never signs: the mix folds to mono.
// - The frame is a bank of four wires for each of the last twelve keys, driven
//   by the sum of all voices. Nothing goes back from it, so it cannot run away.
// - What Shade, Shell, Ear, Wire and Touch take from the level is mostly given
//   back, and each solid is trimmed to one level under each exciter.
// - All control runs on a 32-sample clock that restarts, with every smoothed
//   knob in its place, at a strike that finds the lantern silent: the sound
//   does not depend on the block size. Asleep when all has rung out.

#include <initializer_list>

#include "../../kit/kit.h"
#include "lantern_frame.h"
#include "lantern_solids.h"
#include "params.gen.h"

namespace livemix {

class WireLantern : public kit::DeviceBase<wire_lantern::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kFamilies = wire_lantern_solids::kFamilies;
  static constexpr int kLines = 2 * kFamilies;
  static constexpr int kGroups = kLines / 4;
  enum SolidName : int { kRing = 0, kTetrahedron, kOctahedron, kCube, kPrism, kWeb, kNumSolids };
  enum ExciterName : int { kFinger = 0, kHammer, kBow, kBreath, kNumExciters };

  void init(float sample_rate) {
    using namespace wire_lantern;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    if (!built_) {
      for (int s = 0; s < kNumSolids; ++s) wire_lantern_solids::build(solids_[s], s);
      built_ = true;
    }
    for (Voice& voice : voices_) voice = Voice();
    frame_ = Frame();
    stamp_ = 0;
    down_ = false;
    tune_serial_ = rate_serial_ = 1;
    chunk_left_ = 0;
    steal_step_ = 1.0f / (kStealSeconds * sr);
    noise_scale_ = std::sqrt(sr * (1.0f / 48000.0f));
    const float ticks = sr / static_cast<float>(kChunk);
    for (kit::Smoother* knob : {&true_, &wire_, &shade_, &shell_, &ear_, &width_, &contact_, &turn_}) {
      knob->set_time(kKnobSeconds, ticks);
    }
    volume_.set_time(0.02f, sr);
    sympathy_.set_time(0.02f, sr);
    dry_.set_time(0.02f, sr);
    set_knobs(false);
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    using namespace wire_lantern;
    if (!store_param(id, value)) return;
    switch (id) {
      case kWire:
      case kCornerLoss:
      case kTouch:
      case kDecay:
      case kRelease:
        ++rate_serial_;
        break;
      default:
        break;  // solid, exciter, pluck, edge, hardness, swell: the next key
    }
    set_knobs(primed());
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (quiet()) restart();
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      // An id holds one key. A wire that rings on after its key is stopped by
      // the finger that comes back to it.
      if (voice.id == note_id && voice.held) let_go(voice);
      if (!voice.held && !voice.pending && voice.frequency == frequency) voice.choked = true, voice.rated = 0;
    }
    frame_.take(frequency);
    down_ = true;
    Voice& voice = voices_[pick()];
    const bool taken = voice.sounding;
    voice.id = note_id;
    voice.held = true;
    voice.choked = false;
    voice.stamp = ++stamp_;
    if (taken) {
      voice.pending = true;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
      voice.follow = expected(gain);
    } else {
      start(voice, frequency, gain);
    }
  }

  void note_off(int note_id) {
    down_ = false;  // a key whose wire has died away under it is no longer known
    for (Voice& voice : voices_) {
      if (voice.sounding && voice.held && voice.id == note_id) let_go(voice);
      down_ = down_ || (voice.sounding && voice.held);
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(!quiet())) {
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
        if (voice.sounding) render(voice, n, left, right);
      }
      float frame_left[kChunk] = {}, frame_right[kChunk] = {};
      if (frame_.alive && !frame_off()) frame_.render(n, left, right, frame_left, frame_right);
      for (int i = 0; i < n; ++i) {
        const float volume = volume_.next();
        const float sympathy = sympathy_.next();
        const float dry = dry_.next();
        out_left_[done + i] = kit::soft_clip((left[i] * dry + frame_left[i] * sympathy) * volume);
        out_right_[done + i] = kit::soft_clip((right[i] * dry + frame_right[i] * sympathy) * volume);
      }
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  typedef wire_lantern_solids::F4 F4;
  typedef wire_lantern_solids::Frame Frame;

  static constexpr int kChunk = 32;     // the control clock, samples
  static constexpr int kAimEvery = 8;   // ticks between two looks at the ears
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kEdgeHz = 12000.0f;  // a line fades out between these
  static constexpr float kTopHz = 16500.0f;
  static constexpr float kStealSeconds = 0.003f;
  static constexpr float kKnobSeconds = 0.015f;
  static constexpr float kChokeSeconds = 0.09f;
  static constexpr float kSilence = 1.0e-6f;
  static constexpr float kStruck = 0.222f;     // a struck voice of gain 1, all its lines as power
  static constexpr float kHeld = 0.150f;       // a bowed or blown one
  static constexpr float kBlown = 0.095f;
  static constexpr float kPullSeconds = 0.10f;  // how fast a held line closes on its level

  using Voicing = wire_lantern_solids::Voicing;

  struct Voice {
    alignas(16) float re[kLines] = {}, im[kLines] = {};
    alignas(16) float step_re[kLines] = {}, step_im[kLines] = {};
    alignas(16) float left[kLines] = {}, right[kLines] = {}, quarter[kLines] = {};
    alignas(16) float left_step[kLines] = {}, right_step[kLines] = {}, quarter_step[kLines] = {};
    alignas(16) float drive[kLines] = {};
    float left_to[kLines] = {}, right_to[kLines] = {}, quarter_to[kLines] = {};
    float turn_re[kLines] = {}, turn_im[kLines] = {};
    float nepers[kLines] = {}, level[kLines] = {}, aim[kLines] = {}, stood[kLines] = {};
    float edge[kLines] = {}, hertz[kLines] = {}, hold_back[kLines] = {}, goal[kLines] = {}, shell[kLines] = {};
    float log_ratio[kLines] = {}, wired[kLines] = {}, made_up = 1.0f;
    wire_lantern_solids::Played played;
    bool live[kGroups] = {};
    kit::Rng rng;
    kit::Svf hiss[2];
    int id = -1;
    int solid = 0, exciter = 0;
    float frequency = 440.0f, gain = 0.0f, scale = 0.0f;
    float place = 0.0f, walked = 0.0f, waver = 0.0f;
    int tick = 0;
    int rise_at = 0, rise_length = 1;
    float hiss_hz = 500.0f, hiss_gain = 1.0f, hiss_q = 1.0f;
    float thin[2] = {}, thick[2] = {}, thin_step = 0.0f, thick_step = 0.0f, scrape = 0.0f;
    float noise = 0.0f, noise_step = 1.0f, noise_aim = 0.0f, noise_scale = 1.0f, noise_open = 1.0f, grip = 0.0f, grip_step = 0.0f;
    float air[2] = {}, air_step = 0.0f;
    float follow = 0.0f, steal = 1.0f;
    float pending_frequency = 440.0f, pending_gain = 0.0f;
    uint32_t stamp = 0, tuned = 0, rated = 0;
    bool sounding = false, pending = false, held = false, choked = false;
    bool ramping = false, driven = false, noisy = false;

    bool rising() const { return rise_at < rise_length; }
    bool sustained() const { return exciter >= kBow; }
  };

  int choice(int id, int count) const { return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, count - 1); }

  bool quiet() const {
    for (const Voice& voice : voices_) {
      if (voice.sounding) return false;
    }
    return !frame_.alive;
  }

  void set_knobs(bool glide) {
    using namespace wire_lantern;
    true_.set(param(kTrue), glide);
    wire_.set(param(kWire), glide);
    shade_.set(param(kShade), glide);
    shell_.set(param(kShell), glide);
    ear_.set(param(kEar), glide);
    turn_.set(param(kTurn), glide);
    width_.set(param(kWidth), glide);
    contact_.set(param(kContact), glide);
    sympathy_.set(1.9f * param(kSympathy) * std::sqrt(param(kSympathy)), glide);
    dry_.set(1.0f - 0.45f * param(kSympathy), glide);
    volume_.set(kit::db_to_gain(param(kVolume)), glide);
  }

  void restart() {
    set_knobs(false);
    frame_ = Frame();
    chunk_left_ = 0;
  }

  static float expected(float gain) { return kit::max(kStruck * touch_level(gain), kSilence); }
  static float touch_level(float gain) { return gain * (0.55f + 0.45f * gain); }

  // The voice a new key takes: an idle one, else the quietest let go, else the
  // quietest held, the oldest on a tie; one a key waits in only as the last.
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

  void let_go(Voice& voice) {
    voice.held = false;
    voice.rated = 0;
    voice.noise_aim = 0.0f;
    // The air stops; dust goes with the note.
    const float chunk = static_cast<float>(kChunk) / sample_rate();
    const float ending = std::exp(voice.sustained() ? -chunk / 0.05f : -kSixtyDb * chunk / param(wire_lantern::kRelease));
    voice.noise_step = kit::min(voice.noise_step, ending);
  }

  // --- a strike ------------------------------------------------------------

  // A number of its own for each line, the same in every voice.
  static float scatter(int k, float seed) {
    const float x = static_cast<float>(k) * 0.754877f + seed;
    return x - std::floor(x);
  }

  // What the exciter gives a family: a power of its ratio and a contact that
  // reaches so far up.
  float exciter_share(int exciter, float ratio, float hertz, float hardness, float tilt) const {
    static const float kPower[kNumExciters] = {0.80f, 0.15f, 0.10f, 1.50f};
    static const float kReach[kNumExciters] = {1.7f, 2.2f, 2.6f, 1.1f};
    static const float kGrow[kNumExciters] = {2.5f, 2.6f, 2.3f, 2.3f};
    const float reach = ratio / (kReach[exciter] * std::exp(kGrow[exciter] * hardness));
    const float high = hertz * (1.0f / 6500.0f);
    const float power = kPower[exciter] - 1.3f * (hardness - 0.45f) + tilt;
    return std::pow(ratio, -power) / ((1.0f + reach * reach) * (1.0f + high * high));
  }

  void start(Voice& voice, float frequency, float gain) {
    using namespace wire_lantern;
    namespace ws = wire_lantern_solids;
    const float sr = sample_rate();
    voice.solid = choice(kSolid, kNumSolids);
    voice.exciter = choice(kExciter, kNumExciters);
    const ws::Solid& solid = solids_[voice.solid];
    const Voicing& voiced = wire_lantern_solids::voicing(voice.solid);
    voice.frequency = frequency;
    voice.gain = gain;
    voice.sounding = true;
    voice.pending = false;
    voice.steal = 1.0f;
    voice.tick = 0;
    voice.walked = 0.0f;
    const float key = kit::hz_to_midi(frequency);
    voice.place = 0.381966f * key;
    voice.waver = 0.618034f * (key + static_cast<float>(voice.stamp & 1023u));
    voice.rng.seed(0x1A47E26u + (static_cast<uint32_t>(frequency * 8.0f) + 97u * voice.stamp) * 2654435761u);

    // How each family was played: its share in the touched corner's shape (A)
    // and in the rest (B).
    const float at = 0.03f + 0.47f * param(kPluck);
    const float hardness = kit::clamp(param(kHardness) + 0.6f * (gain - 0.7f), 0.0f, 1.2f);
    float share_a[kFamilies], share_b[kFamilies];
    const int step = kit::clamp_int(static_cast<int>(param(kEdge) + 0.5f) - 1, 0, 5);
    ws::play(solid, step, at, voice.played, share_a, share_b);
    float power = 0.0f;
    const float loose = 1.0f - true_.value, bend = 1.0f - loose * loose;
    const float tilt = (voice.sustained() ? voiced.held : voiced.tilt) + ws::kGauge[step];
    for (int f = 0; f < kFamilies; ++f) {
      const ws::Family& family = solid.family[f];
      const float a = share_a[f], b = share_b[f];
      // Families of many shapes are woken many times over: take most of that
      // back, and never lose the note itself.
      const float strength = std::sqrt(a * a + b * b);
      float want = 1.7f * strength / (1.0f + 0.7f * strength);
      if (f == 0) want = voiced.root * kit::max(want, 0.95f) * (0.55f + 1.0f * at);
      if (family.kind == ws::kLoop) want *= voiced.loop;
      if (f > 0) {
        // Octaves and fifths lead where the net is true; where it is not, no
        // two tones are as strong.
        const float open = std::fmod(family.just, 1200.0f);
        const bool leads = open < 1.0f || std::fabs(open - 701.955f) < 1.0f || family.just > 2700.0f;
        if (!leads) want *= 1.0f - 0.6f * bend;
        want *= kit::db_to_gain(16.0f * loose * loose * (scatter(f, 0.17f + 0.21f * voice.solid) - 0.5f)) * ws::knot(step, family.ratio);
      }
      if (voice.sustained()) {
        const float away = 2.4f * std::log(family.ratio / voiced.sings);
        want *= 1.0f + 5.5f * std::exp(-away * away);
      }
      const float hertz = frequency * family.ratio;
      const float share = exciter_share(voice.exciter, family.ratio, hertz, hardness, tilt + 2.4f * (at - 0.22f));
      const float each = strength > 1.0e-5f ? want * share / strength : 0.0f;
      voice.level[2 * f] = each * std::fabs(a);
      voice.level[2 * f + 1] = each * std::fabs(b);
      if (f == 0 && strength <= 1.0e-5f) voice.level[0] = want * share;
      // What the ear makes little of, at the top, counts for less.
      const float top = hertz * (1.0f / 5000.0f), counts = 1.0f / (1.0f + top * top);
      power += counts * (voice.level[2 * f] * voice.level[2 * f] + voice.level[2 * f + 1] * voice.level[2 * f + 1]);
    }
    const float key_level = std::pow(kit::clamp(220.0f / frequency, 0.1f, 4.0f), voice.exciter == kBreath ? 0.14f : 0.1f);
    voice.scale = (voice.exciter == kBow ? kHeld : voice.exciter == kBreath ? kBlown : kStruck) * touch_level(gain) * key_level / std::sqrt(kit::max(power, 1.0e-9f)) *
                  kit::db_to_gain(ws::kTrim[voice.solid][voice.exciter]);
    tune(voice);
    for (int k = 0; k < kLines; ++k) {
      voice.level[k] *= voice.scale;
      voice.hold_back[k] = 1.0f / (0.6f + 0.4f * solid.family[k >> 1].ratio);
      const float amount = voice.level[k] * (voice.exciter == kBow ? 0.35f : voice.exciter == kBreath ? 0.1f : 1.0f);
      const int f = k >> 1;
      // The two lines of a family a quarter turn apart: they add as power.
      const float phase = scatter(f, 0.13f + 0.46f * key + static_cast<float>(voice.stamp & 1023u) * scatter(f, 0.29f)) +
                          (k & 1 ? 0.25f : 0.0f);
      voice.re[k] = amount * kit::SineTable::cos_lookup(phase);
      voice.im[k] = amount * kit::SineTable::lookup(phase);
      voice.aim[k] = voice.level[k];
    }
    for (bool& live : voice.live) live = true;
    static const float kRise[kNumExciters] = {0.0045f, 0.0012f, 0.02f, 0.06f};
    voice.hiss_gain = 1.0f;
    const float own_rise = kRise[voice.exciter] * kit::min(voiced.rise, voice.sustained() ? 8.0f : 300.0f) * std::sqrt(kit::clamp(220.0f / frequency, 0.15f, 3.0f));
    voice.rise_at = 0;
    voice.rise_length = kit::clamp_int(static_cast<int>((param(kSwell) - kParamMin[kSwell] + own_rise) * sr), 8, 1 << 22);
    rates(voice);
    // A strike that is gone at once is struck a little harder.
    voice.made_up = 1.0f;
    if (!voice.sustained()) {
      float all = 1.0e-12f, rate = 0.0f;
      for (int k = 0; k < kLines; ++k) {
        const float level = voice.level[k] * voice.level[k];
        all += level;
        rate += level * kit::min(voice.nepers[k] * sr, 60.0f);
      }
      voice.made_up = kit::clamp(std::pow(rate / all * 0.5f, 0.28f), 0.9f, 2.8f);
    }
    contact(voice, voiced, hardness);
    aim(voice, true);
    voice.follow = expected(gain);
  }

  // The finger, the knock, the hair and the air, heard for themselves: a low
  // band of it, and a scrape above.
  void contact(Voice& voice, const Voicing& voiced, float hardness) {
    const float sr = sample_rate();
    const float size = std::sqrt(kit::clamp(220.0f / voice.frequency, 0.1f, 6.0f));
    static const float kHertz[kNumExciters] = {750.0f, 900.0f, 1500.0f, 360.0f};
    static const float kQ[kNumExciters] = {0.8f, 1.6f, 0.9f, 0.7f};
    static const float kLoud[kNumExciters] = {2.5f, 2.8f, 0.22f, 0.48f};
    static const float kScrape[kNumExciters] = {0.16f, 0.09f, 0.14f, 0.05f};
    static const float kSeconds[kNumExciters] = {0.10f, 0.14f, 0.0f, 0.0f};
    const int x = voice.exciter;
    const float hertz = kit::clamp(kHertz[x] * std::sqrt(voiced.size) * std::exp(0.9f * (hardness - 0.5f)) / size, 120.0f, 4200.0f);
    voice.hiss[0].reset();
    voice.hiss[1].reset();
    for (int c = 0; c < 2; ++c) voice.air[c] = voice.thin[c] = voice.thick[c] = 0.0f;
    voice.air_step = 1.0f - std::exp(-kit::kTwoPi * (x == kBreath ? 1.5f : 2.4f) * hertz / sr);
    voice.thin_step = 1.0f - std::exp(-kit::kTwoPi * 3600.0f / sr);
    voice.thick_step = 1.0f - std::exp(-kit::kTwoPi * 2200.0f / sr);
    voice.scrape = kScrape[x] * std::exp(1.1f * (hardness - 0.4f)) * (x >= kBow ? voiced.hair : kit::min(std::sqrt(voiced.hair), 1.2f));
    voice.hiss_hz = hertz;
    voice.hiss_q = kQ[x];
    const float loud = kLoud[x] * voiced.noise * touch_level(voice.gain) * noise_scale_;
    voice.grip = scatter(7, voice.place);
    voice.grip_step = voice.frequency / sr;
    voice.noisy = true;
    voice.noise_open = opens_slowly(voice) ? 0.0f : 1.0f;
    voice.noise_scale = x >= kBow ? 1.0f : std::sqrt(std::sqrt(900.0f / hertz));
    if (x >= kBow) {
      voice.noise = 0.0f;
      voice.noise_aim = loud;
      voice.noise_step = std::exp(-static_cast<float>(kChunk) / ((x == kBow ? 0.06f : 0.15f) * sr));
    } else {
      voice.noise = loud;
      voice.noise_aim = 0.0f;
      const float seconds = kSeconds[x] * voiced.dust * size * (0.5f + 1.5f * contact_.value);
      voice.noise_step = std::exp(-kSixtyDb * static_cast<float>(kChunk) / (seconds * sr));
    }
  }

  bool opens_slowly(const Voice& voice) const { return static_cast<float>(voice.rise_length) > 0.03f * sample_rate(); }

  // --- pitch and decay -----------------------------------------------------

  void tune(Voice& voice) {
    const wire_lantern_solids::Solid& solid = solids_[voice.solid];
    const float sr = sample_rate();
    const Voicing& voiced = wire_lantern_solids::voicing(voice.solid);
    const float loose = 1.0f - true_.value;
    const float bend = 1.0f - loose * loose;
    const float stiff = 8.0e-4f * loose * loose * (0.15f + wire_.value * wire_.value);
    const float top = kit::min(kTopHz, 0.45f * sr);
    for (int k = 0; k < kLines; ++k) {
      const auto& family = solid.family[k >> 1];
      const float r2 = family.ratio * family.ratio;
      // The two lines of a family stand a little either side of it.
      float apart = k < 2 ? 4.0f : 11.0f + 24.0f * scatter(k >> 1, 0.37f);
      if (!(k & 1)) apart = -apart;
      const float cents = family.natural + (family.just - family.natural) * bend + apart * loose * loose +
                          865.6f * std::log((1.0f + stiff * r2) / (1.0f + stiff));
      const float hertz = voice.frequency * kit::cents_to_ratio(cents);
      voice.hertz[k] = hertz;
      const float edge = kit::clamp((top - hertz) * (1.0f / (kTopHz - kEdgeHz)), 0.0f, 1.0f);
      voice.edge[k] = edge;
      voice.shell[k] = wire_lantern_solids::shell_log_gain(hertz, voiced.size);
      voice.log_ratio[k] = kit::min(std::log(family.ratio), 2.6f);
      const float w = kit::kTwoPi * kit::min(hertz, 0.49f * sr) / sr;
      voice.turn_re[k] = std::cos(w);
      voice.turn_im[k] = std::sin(w);
      if (edge <= 0.0f) voice.turn_re[k] = voice.turn_im[k] = 0.0f;
    }
    voice.tuned = tune_serial_;
    voice.rated = 0;  // the turn and the shrinking are one number
  }

  // How fast every line dies, and how high a held one stands.
  void rates(Voice& voice) {
    using namespace wire_lantern;
    const wire_lantern_solids::Solid& solid = solids_[voice.solid];
    const Voicing& voiced = wire_lantern_solids::voicing(voice.solid);
    const float sr = sample_rate();
    const float wire = param(kWire), corner = param(kCornerLoss), touch = param(kTouch);
    const float soft = 1.0f - wire;
    // Flesh takes the upper tones along; a hammer leaves the wire at once.
    static const float kKeep[kNumExciters] = {0.75f, 1.9f, 1.6f, 0.5f};
    static const float kSlope[kNumExciters] = {1.1f, 0.4f, 0.6f, 1.2f};
    const float slope = voiced.slope * kSlope[voice.exciter] * (0.04f + 1.1f * soft * soft + 1.5f * soft * soft * soft * soft);
    const float far = 1.0f / (600.0f * std::exp(3.0f * wire));
    const float base = std::pow(kit::clamp(voice.frequency * (1.0f / 220.0f), 0.2f, 16.0f), 0.3f) / (param(kDecay) * voiced.keep * kKeep[voice.exciter]);
    const float lossy = corner * corner * corner, finger = touch * touch * std::sqrt(touch);
    const float palm = touch > 0.3f ? (touch - 0.3f) * (touch - 0.3f) * 6.5f : 0.0f;
    static const float kGut[kNumExciters] = {0.0f, 0.0f, 1.0f, 1.0f};
    float ending = 0.0f;
    if (!voice.held) ending += (voice.exciter == kBreath ? 2.2f : 1.0f) / param(kRelease);
    if (voice.choked) ending += 1.0f / kChokeSeconds;
    for (int k = 0; k < kLines; ++k) {
      const auto& family = solid.family[k >> 1];
      const bool corner_shape = family.kind == wire_lantern_solids::kCorner;
      const bool felt = !(k & 1);
      const float h = voice.hertz[k] * far;
      float rate = base * (1.0f + slope * (family.ratio - 1.0f) + voiced.slope * h * h);
      float extra = palm;
      if (k < 2) {
        extra += 1.2f * lossy;
      } else if (corner_shape || felt) {
        extra += lossy * (2.6f + 0.9f * family.ratio);
      } else {
        extra += 0.25f * lossy;
      }
      if (felt) extra += finger * (k < 2 ? 20.0f : 30.0f);
      rate += extra;
      voice.nepers[k] = kSixtyDb * (rate + ending) / sr;
      // A held tone stands at what is lost of it: the same corners, in a law of its own.
      float less = palm + (k < 2 ? 0.5f : corner_shape || felt ? 1.0f + 0.5f * family.ratio : 0.0f) * 2.6f * corner * std::sqrt(corner);
      if (felt) less += (k < 2 ? 9.0f : 14.0f) * touch * touch;
      voice.aim[k] = voice.level[k] / ((1.0f + less) * (1.0f + (0.06f + 0.9f * soft * soft) * kGut[voice.exciter] * (family.ratio - 1.0f)));
    }
    voice.rated = rate_serial_;
    steps(voice, 1.0f);
  }

  void steps(Voice& voice, float share) {
    for (int k = 0; k < kLines; ++k) {
      const float radius = std::exp(-voice.nepers[k] * share);
      voice.step_re[k] = voice.turn_re[k] * radius;
      voice.step_im[k] = voice.turn_im[k] * radius;
    }
  }

  // --- the ears ------------------------------------------------------------

  // Where every output gain goes next: the ears, the shade, the shell.
  void aim(Voice& voice, bool snap) {
    const wire_lantern_solids::Solid& solid = solids_[voice.solid];
    const float length = static_cast<float>(solid.walk);
    const float turned = 0.5f * ear_.value + voice.walked;
    const float where = (turned + voice.place) * length;
    const float width = width_.value;
    float near[kLines], far[kLines];
    wire_lantern_solids::hear(solid, voice.played, where, near);
    wire_lantern_solids::hear(solid, voice.played, where + 0.43f * length * width, far);
    const float root_key = std::sqrt(kit::clamp(voice.frequency * (1.0f / 220.0f), 0.25f, 16.0f));
    const float drawn = shade_.value;
    const float shade = 1.0f / (9000.0f * std::exp(-4.8f * drawn / (0.6f + 0.4f * drawn)) * root_key);
    const float shell = shell_.value, touch = contact_.value;
    const float bumps = turn_.value * length * (1.0f / 3.14159265f) * (1.0f / 9.0f);
    // One face of the solid is bright and the other dark.
    const float facing = turned + 0.19f * kit::SineTable::lookup(voice.place);
    const float wire = 0.75f * (wire_.value - 0.6f), face_left = wire + 0.48f * kit::SineTable::cos_lookup(facing),
                face_right = wire + 0.48f * kit::SineTable::cos_lookup(facing + 0.3f * width);
    const float bare = 1.0f / (1.0f + 0.5f * touch * touch);  // the touch takes the tone's place
    // The levels move as the lines do: up at once, down as they sink.
    const float looked = static_cast<float>(kChunk * kAimEvery) / sample_rate();
    const float up = snap ? 1.0f : 1.0f - std::exp(-looked / 0.015f), down = snap ? 1.0f : 1.0f - std::exp(-looked / 0.3f);
    float left_color[kLines], right_color[kLines], before = 1.0e-12f, after = 1.0e-12f;
    for (int k = 0; k < kLines; ++k) {
      // What passes quicker than it can be followed is heard as its mean.
      const float quick = bumps * solid.family[k >> 1].kl;
      const float depth = (k < 2 ? 0.38f : 0.94f) / (1.0f + quick * quick);
      const float l = std::sqrt(1.0f + depth * (kit::min(near[k] * near[k], 3.5f) - 1.0f));
      const float r = std::sqrt(1.0f + depth * (kit::min(far[k] * far[k], 3.5f) - 1.0f));
      const float dark = voice.hertz[k] * shade;
      const float color = voice.edge[k] / (1.0f + dark * dark * (1.0f + 0.3f * dark));
      left_color[k] = color * l * std::exp(shell * voice.shell[k] + face_left * voice.log_ratio[k]);
      right_color[k] = color * r * std::exp(shell * voice.shell[k] + face_right * voice.log_ratio[k]);
      voice.stood[k] += (voice.aim[k] - voice.stood[k]) * (voice.aim[k] > voice.stood[k] ? up : down);
      const float level = voice.level[k] * voice.level[k], stands = voice.stood[k] * voice.stood[k];
      before += voice.sustained() ? level : stands;
      after += 0.5f * stands * (left_color[k] * left_color[k] + right_color[k] * right_color[k]);
    }
    // Shade, case and corners change the colour: most of what they take from
    // the level or add to it is given back.
    const float given = 0.7071f * bare * voice.made_up * kit::clamp(std::pow(before / after, 0.42f), 0.3f, 40.0f);
    for (int k = 0; k < kLines; ++k) {
      const float h = voice.hertz[k];
      const float left = given * left_color[k], right = given * right_color[k];
      // A turn of phase between the ears, none in the bass.
      const float spin = width * 0.19f * (k & 2 ? 1.0f : -1.0f) * h / (h + 180.0f);
      voice.left_to[k] = left;
      voice.right_to[k] = right * kit::SineTable::cos_lookup(spin);
      voice.quarter_to[k] = right * kit::SineTable::lookup(spin);
    }
    if (voice.noisy) {
      // The touch is heard through the same case, and turns with the rest.
      const float hertz = voice.hiss_hz * std::exp(0.7f * wire), q = voice.hiss_q * (1.0f + 1.6f * shell);
      const float gone = 0.5f + 0.7f / (1.0f + 0.8f * shell);  // what a narrow band loses less of its power by
      voice.hiss_gain = gone;
      voice.hiss[0].set(kit::clamp(hertz * (1.0f - 0.1f * width) * std::exp(1.3f * (face_left - wire)), 100.0f, 5000.0f), q, sample_rate());
      voice.hiss[1].set(kit::clamp(hertz * (1.0f + 0.1f * width) * std::exp(1.3f * (face_right - wire)), 100.0f, 5000.0f), q, sample_rate());
    }
    if (snap) {
      for (int k = 0; k < kLines; ++k) {
        voice.left[k] = voice.left_to[k];
        voice.right[k] = voice.right_to[k];
        voice.quarter[k] = voice.quarter_to[k];
        voice.left_step[k] = voice.right_step[k] = voice.quarter_step[k] = 0.0f;
      }
      voice.ramping = false;
      return;
    }
    constexpr float kShare = 1.0f / (kChunk * kAimEvery);
    for (int k = 0; k < kLines; ++k) {
      voice.left_step[k] = (voice.left_to[k] - voice.left[k]) * kShare;
      voice.right_step[k] = (voice.right_to[k] - voice.right[k]) * kShare;
      voice.quarter_step[k] = (voice.quarter_to[k] - voice.quarter[k]) * kShare;
    }
    voice.ramping = true;
  }

  bool frame_off() const { return sympathy_.target == 0.0f && sympathy_.value == 0.0f; }

  // --- every kChunk samples ------------------------------------------------

  void control() {
    if (!true_.settled() || !wire_.settled()) ++tune_serial_;
    for (kit::Smoother* knob : {&true_, &wire_, &shade_, &shell_, &ear_, &width_, &contact_, &turn_}) knob->next();
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (voice.pending) {
        if (voice.steal > 0.0f) continue;
        const bool held = voice.held;
        voice.choked = false;
        voice.rated = 0;
        start(voice, voice.pending_frequency, voice.pending_gain);
        if (!held) let_go(voice);
      }
      control_voice(voice);
    }
    if (!frame_.alive) return;
    bool playing = false;
    for (const Voice& voice : voices_) playing = playing || voice.sounding;
    frame_.control(sample_rate(), param(wire_lantern::kDecay), param(wire_lantern::kRelease), width_.value, frame_off(), playing, down_);
  }

  void control_voice(Voice& voice) {
    const float sr = sample_rate();
    if (voice.tuned != tune_serial_) tune(voice);
    if (voice.rated != rate_serial_) rates(voice);
    const bool looks = voice.tick % kAimEvery == 0;
    if (looks && voice.tick > 0) aim(voice, false);
    ++voice.tick;
    voice.walked += turn_.value * static_cast<float>(kChunk) / sr;
    if (voice.walked >= 1.0f) voice.walked -= 1.0f;
    const bool pulled = voice.sustained() && voice.held;
    voice.driven = false;
    if (pulled) {
      pull(voice, looks);
    } else if (voice.rising() && !voice.sustained() && voice.rise_length > 1024) {
      // While a slow strike opens, it rings on: it starts to die once it is here.
      const float t = static_cast<float>(voice.rise_at) / static_cast<float>(voice.rise_length), late = t * t * t;
      steps(voice, voice.held ? 0.03f + 0.97f * late * late : 1.0f);
      if (voice.rise_at + kChunk >= voice.rise_length) voice.rated = 0;
    }
    // A note that opens slowly opens its noise too; a strike's is its onset.
    voice.noise_open = voice.rising() && opens_slowly(voice)
                           ? static_cast<float>(voice.rise_at) / static_cast<float>(voice.rise_length)
                           : 1.0f;
    voice.noise = voice.noise_aim + (voice.noise - voice.noise_aim) * voice.noise_step;
    if (voice.noisy && voice.noise_aim == 0.0f && voice.noise < 1.0e-6f) {
      voice.noisy = false;
      voice.noise = 0.0f;
      voice.hiss[0].reset();
      voice.hiss[1].reset();
    }
    if (looks) weigh(voice, pulled);
  }

  // Bow and breath: each line is drawn to its level, the upper ones later, and
  // the levels waver by themselves, slowly.
  void pull(Voice& voice, bool looks) {
    const float sr = sample_rate();
    const float breath = voice.exciter == kBreath ? 1.0f : 0.0f;
    // A wire that rings long is slow to take up the bow, and takes less of its grain.
    const float long_ring = param(wire_lantern::kDecay) * (1.0f / 12.0f);
    const float pull = kPullSeconds * kit::clamp(std::pow(long_ring, 0.7f), 0.15f, 3.0f);
    const float grain = kit::clamp(std::pow(long_ring, -0.22f), 0.6f, 2.2f);
    const float quickness = static_cast<float>(kChunk) / (pull * sr);
    if (looks) {
      const float t = static_cast<float>(voice.tick) * static_cast<float>(kChunk) / sr;
      const float effective = 2.0f / (pull * sr);
      const Voicing& voiced = wire_lantern_solids::voicing(voice.solid);
      const float blown = grain * (breath > 0.0f ? 0.45f : 0.10f);
      const float shake = kit::SineTable::lookup(t * voiced.shakes + 0.37f * voice.place) * voiced.tremble * kit::min(t, 1.0f);
      for (int k = 0; k < kLines; ++k) {
        const float rate = 0.13f + 0.33f * scatter(k, 0.61f);
        const float wave = kit::SineTable::lookup(t * rate + scatter(k, voice.waver));
        // Over the first second or two the upper families come up.
        const float come = 1.0f - 0.65f * std::exp(-t * (0.8f + 2.0f * voice.hold_back[k]));
        const float depth = breath > 0.0f ? (k < 2 ? 0.34f : 0.6f) : (k < 2 ? 0.16f : 0.42f);
        // Less of it in the bass, where so many hertz are so many more cents.
        const float steady = kit::clamp(voice.hertz[k] * (1.0f / 180.0f), 0.2f, 1.0f);
        voice.drive[k] = voice.aim[k] * blown * steady * (k < 2 ? 0.6f * steady : 1.0f) * std::sqrt(3.0f * effective);
        voice.goal[k] = voice.edge[k] > 0.0f ? voice.aim[k] * (1.0f + depth * wave) * (1.0f + (k < 2 ? 0.4f : 1.0f) * (k & 2 ? shake : -shake)) * come : 0.0f;
        // A line that had gone out starts again from next to nothing.
        if (voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k] < 1.0e-8f * voice.goal[k] * voice.goal[k]) {
          const float phase = scatter(k, voice.waver);
          voice.re[k] = 1.0e-4f * voice.goal[k] * kit::SineTable::cos_lookup(phase);
          voice.im[k] = 1.0e-4f * voice.goal[k] * kit::SineTable::lookup(phase);
        }
      }
    }
    voice.driven = true;
    for (int k = 0; k < kLines; ++k) {
      const float size = std::sqrt(voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k]);
      const float goal = voice.goal[k];
      const float gap = kit::clamp((goal - size) / (size + 0.02f * goal + 1.0e-9f), -1.0f, 8.0f);
      const float x = kit::clamp(gap * quickness * voice.hold_back[k], -0.2f, 0.25f);
      const float radius = 1.0f + (x - 0.5f * x * x + 0.333f * x * x * x) * (1.0f / kChunk);
      voice.step_re[k] = voice.turn_re[k] * radius;
      voice.step_im[k] = voice.turn_im[k] * radius;
    }
  }

  // What still sounds: lines that have rung out are put out, four at a time,
  // and a voice with none left is free.
  void weigh(Voice& voice, bool pulled) {
    float energy = 0.0f, most = 0.0f;
    for (int g = 0; g < kGroups; ++g) {
      float group = 0.0f, goal = 0.0f;
      for (int k = 4 * g; k < 4 * g + 4; ++k) {
        goal += pulled ? voice.goal[k] : 0.0f;
        const float power = voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k];
        const float l = voice.left_to[k], r = voice.right_to[k], q = voice.quarter_to[k];
        energy += power * (l * l + r * r + q * q);
        group += power;
        // A line that has rung out goes by itself, before it is a denormal.
        if (power < 1.0e-18f) voice.re[k] = voice.im[k] = 0.0f;
      }
      most += group;
      if (goal > 4.0e-7f) {
        voice.live[g] = true;
      } else if (voice.live[g] && group < 1.0e-13f) {
        voice.live[g] = false;
        for (int k = 4 * g; k < 4 * g + 4; ++k) voice.re[k] = voice.im[k] = 0.0f;
      }
    }
    const float now = std::sqrt(energy);
    voice.follow = voice.rising() || pulled ? kit::max(now, expected(voice.gain)) : now;
    if (pulled || voice.rising() || voice.noisy) {
      // Let go before it had opened: what it is held by is its release.
      if (pulled || voice.held || most > 1.0e-12f) return;
    }
    if (now < kSilence && voice.noise < 1.0e-5f) retire(voice);
  }

  void retire(Voice& voice) {
    voice.sounding = voice.pending = voice.held = voice.choked = voice.noisy = false;
    voice.follow = voice.noise = 0.0f;
    for (int k = 0; k < kLines; ++k) voice.re[k] = voice.im[k] = 0.0f;
  }

  // --- sound ---------------------------------------------------------------

  static F4* four(float* x) { return wire_lantern_solids::four(x); }

  void render(Voice& voice, int n, float* left, float* right) {
    float open[kChunk], hiss[kChunk], air[2][kChunk], high[2][kChunk];
    opening(voice, n, open);
    const bool noisy = voice.noisy;
    if (noisy) {
      const float loud = voice.noise * voice.noise_scale;
      for (int i = 0; i < n; ++i) {
        float x = voice.rng.bipolar();
        if (voice.exciter == kBow) {
          // The hair grips and lets go once a period.
          voice.grip += voice.grip_step;
          if (voice.grip >= 1.0f) voice.grip -= 1.0f;
          const float grip = 1.0f - voice.grip;
          x *= 1.9f * grip * grip * grip + 0.1f;
        }
        hiss[i] = x;
        // What is heard of it is darker than what the wire is driven with; a
        // breath is another breath at the other ear.
        for (int c = 0; c < 2; ++c) {
          if (c == 1 && voice.exciter == kBreath) x += (voice.rng.bipolar() - x) * width_.value;
          voice.air[c] += (x - voice.air[c]) * voice.air_step;
          voice.thin[c] += (x - voice.thin[c]) * voice.thin_step;
          voice.thick[c] += (voice.thin[c] - voice.thick[c]) * voice.thick_step;
          air[c][i] = voice.air[c];
          high[c][i] = voice.thin[c] - voice.thick[c];
        }
      }
      const float touch = contact_.value;
      const float level = loud * 1.45f * std::pow(touch, 0.6f) * voice.noise_open;
      const float shade = shade_.value;
      const float low = level * voice.hiss_gain / (1.0f + 2.2f * shade * shade);
      const float scrape = voice.scrape * level * (1.0f - shade) * (1.0f - shade) / (1.0f + 10.0f * shade * shade);
      for (int i = 0; i < n; ++i) {
        const float now = voice.pending ? open[i] : 1.0f;
        left[i] += voice.hiss[0].bandpass(air[0][i] * low * now) + high[0][i] * scrape * now;
        right[i] += voice.hiss[1].bandpass(air[1][i] * low * now) + high[1][i] * scrape * now;
      }
    }
    const bool driven = voice.driven && noisy;
    F4 sum_left[kChunk] = {}, sum_right[kChunk] = {};
    for (int g = 0; g < kGroups; ++g) {
      if (!voice.live[g]) continue;
      const int k = 4 * g;
      if (driven) {
        lines<true, true>(voice, k, n, hiss, sum_left, sum_right);
      } else if (voice.ramping) {
        lines<true, false>(voice, k, n, hiss, sum_left, sum_right);
      } else {
        lines<false, false>(voice, k, n, hiss, sum_left, sum_right);
      }
    }
    for (int i = 0; i < n; ++i) {
      const F4 l = sum_left[i], r = sum_right[i];
      left[i] += open[i] * ((l[0] + l[1]) + (l[2] + l[3]));
      right[i] += open[i] * ((r[0] + r[1]) + (r[2] + r[3]));
    }
  }

  template <bool Ramp, bool Drive>
  static void lines(Voice& voice, int k, int n, const float* hiss, F4* sum_left, F4* sum_right) {
    F4 re = *four(voice.re + k), im = *four(voice.im + k);
    const F4 c = *four(voice.step_re + k), s = *four(voice.step_im + k);
    F4 l = *four(voice.left + k), r = *four(voice.right + k), q = *four(voice.quarter + k);
    const F4 dl = *four(voice.left_step + k), dr = *four(voice.right_step + k), dq = *four(voice.quarter_step + k);
    const F4 drive = *four(voice.drive + k);
    for (int i = 0; i < n; ++i) {
      F4 turned = c * re - s * im;
      im = c * im + s * re;
      re = turned;
      if (Drive) re += drive * hiss[i];
      sum_left[i] += l * im;
      sum_right[i] += r * im + q * re;
      if (Ramp) {
        l += dl;
        r += dr;
        q += dq;
      }
    }
    *four(voice.re + k) = re;
    *four(voice.im + k) = im;
    if (Ramp) {
      *four(voice.left + k) = l;
      *four(voice.right + k) = r;
      *four(voice.quarter + k) = q;
    }
  }

  // One raised cosine opens a voice; a taken one closes over 3 ms.
  void opening(Voice& voice, int n, float* open) {
    if (voice.rising()) {
      const float share = 0.5f / static_cast<float>(voice.rise_length);
      for (int i = 0; i < n; ++i) {
        open[i] = voice.rising()
                      ? 0.5f - 0.5f * kit::SineTable::cos_lookup((static_cast<float>(voice.rise_at) + 0.5f) * share)
                      : 1.0f;
        if (voice.rising()) ++voice.rise_at;
      }
    } else {
      for (int i = 0; i < n; ++i) open[i] = 1.0f;
    }
    if (!voice.pending) return;
    for (int i = 0; i < n; ++i) {
      voice.steal = kit::max(voice.steal - steal_step_, 0.0f);
      open[i] *= voice.steal;
    }
  }

  wire_lantern_solids::Solid solids_[kNumSolids];
  Voice voices_[kMaxVoices];
  Frame frame_;
  kit::Smoother true_, wire_, shade_, shell_, ear_, width_, contact_, turn_;  // once a tick
  kit::Smoother volume_, sympathy_, dry_;                                     // every sample
  kit::IdleGate idle_;
  uint32_t tune_serial_ = 1, rate_serial_ = 1, stamp_ = 0;
  int chunk_left_ = 0;
  float steal_step_ = 0.0f, noise_scale_ = 1.0f;
  bool built_ = false, down_ = false;
};

}  // namespace livemix
