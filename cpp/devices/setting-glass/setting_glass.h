#pragma once

// Setting Glass: a key is a gather of molten glass, and holding it lets it set.
//
//   strike, blows ─► contact ─┐            falls as the glass cools
//   ticks, pings ─► pushes ───┼─► 32 modes ◄── setting front (Hz) ◄── heat
//   furnace breath ─► noise ──┘      │                               ▲
//                  and rubbing       └─► pan ─► width ─► volume      │
//                                        Heat, Cooling, Rest, Remelt, Neighbours
//
// - A mode is one complex number turned and shrunk a little every sample, so
//   its loss can change under a ringing note with no click. Its pitch is that
//   of its note, its matter and the Order and Stretch knobs, and does not move
//   as the glass sets: only its loss does.
// - The glass has one temperature, `heat`, 0 set to 1 molten. From it comes
//   the setting front, a frequency. A mode above the front moves faster than
//   the glass can flow and rings; one under it is soft and dies in a moment;
//   one in the front loses most of all (the loss peak of relaxation). The
//   front falls as the glass cools, so a note clears from the top down, and
//   since the front is in hertz a chord's high notes are clear before its low.
// - A mode the front has passed is struck by the shrinking glass (a ping, its
//   time scattered a little), and can be struck again by ticks.
// - The breath of the furnace is noise into every mode, its gain set by the
//   mode's loss so that it comes out at one level whether the mode is soft
//   (moving air round the note) or set (the note itself). The same breath
//   rubs set modes: they grow toward a level and stay there.
// - Strikes are real contacts, pulses a fraction of a millisecond to many
//   milliseconds long, longer on soft glass; a drop adds the bubble it traps,
//   a rod its own clack, a pour is two seconds of small drops.
// - Blows repeat the strike through the hold, each key at a pace of its own,
//   and after it where the strikes fall at the end, each less than the last.
// - One pitch is one piece of glass: the same pitch struck again warms it and
//   strikes it again. It is let go when the last id holding it is.
// - Keys share heat (Neighbours): they draw toward their mean, and several
//   cool more slowly than one. A strike on one shakes the set ones that are held.
// - Let go to melt, the front climbs again and each tone it takes is pushed
//   once as it goes, so a chord falls from its lowest tone up.
//
// All control runs on a 64-sample clock which restarts, with every smoothed
// knob in its place, when a key finds nothing sounding, so the output does not
// depend on the block size. Asleep when every piece has died below -120 dB.

#include <cstring>
#include <initializer_list>

#include "../../kit/kit.h"
#include "matters.h"
#include "params.gen.h"

namespace livemix {

class SettingGlass : public kit::DeviceBase<setting_glass::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kModes = setting_glass::kModes;
  static constexpr int kPairs = setting_glass::kPairs;
  enum Strike : int { kDrop = 0, kRod, kTap, kPour };
  enum When : int { kPress = 0, kSet, kLetGo, kBoth };
  enum Release : int { kQuench = 0, kAnneal, kRemelted };
  enum Meter : int { kMeterHeat = 0, kMeterFront, kMeterLevel, kMeterNote };

  void init(float sample_rate) {
    using namespace setting_glass;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (Voice& voice : voices_) voice = Voice();
    serial_ = 1;
    stamp_ = 0;
    chunk_left_ = 0;
    ticks_run_ = 0;
    dt_ = static_cast<float>(kChunk) / sr;
    noise_scale_ = std::sqrt(sr * (1.0f / 48000.0f));
    steal_step_ = 1.0f / (kStealSeconds * sr);
    for (kit::Smoother* knob : {&bright_, &edge_, &breath_, &tick_, &ring_}) {
      knob->set_time(kKnobSeconds, sr / static_cast<float>(kChunk));
    }
    for (kit::Smoother* knob : {&order_, &stretch_}) knob->set_time(kGlideSeconds, sr / static_cast<float>(kChunk));  // they move pitch
    volume_.set_time(0.02f, sr);
    width_.set_time(0.02f, sr);
    set_knobs(false);
    reset_furnace();
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    if (!store_param(id, value)) return;
    set_knobs(primed());
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (count_sounding() == 0) restart();

    Voice* same = nullptr;
    Voice* waiting = nullptr;
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (!same && (voice.pending ? voice.pending_frequency : voice.frequency) == frequency) {
        same = &voice;
        continue;
      }
      if (!voice.drop(note_id)) continue;
      if (voice.holders > 0) continue;
      if (voice.pending) {
        waiting = &voice;
      } else {
        let_go(voice);
      }
    }
    if (same) {
      const bool was_let_go = same->holders == 0;
      same->hold(note_id);
      same->stamp = ++stamp_;
      if (same->pending) {
        same->pending_gain = kit::max(same->pending_gain, gain);
      } else {
        press_again(*same, gain, was_let_go);
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
      voice.follow = kLevel * gain;
    } else {
      start(voice, frequency, gain);
    }
  }

  void note_off(int note_id) {
    for (Voice& voice : voices_) {
      if (voice.sounding && voice.drop(note_id) && voice.holders == 0 && !voice.pending) let_go(voice);
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(count_sounding() > 0 || roar_ > 0.0f)) {
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
      float mid[kChunk] = {}, side[kChunk] = {};
      for (Voice& voice : voices_) {
        if (voice.sounding) render_voice(voice, n, mid, side);
      }
      furnace(n, mid, side);
      for (int i = 0; i < n; ++i) {
        const float volume = volume_.next();
        const float s = side[i] * width_.next();
        out_left_[done + i] = kit::soft_clip((mid[i] + s) * volume);
        out_right_[done + i] = kit::soft_clip((mid[i] - s) * volume);
      }
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // The newest piece of glass: its heat, its setting front, its level, its note.
  float meter(int index) const {
    const Voice* newest = nullptr;
    for (const Voice& voice : voices_) {
      if (voice.sounding && !voice.pending && (!newest || voice.stamp > newest->stamp)) newest = &voice;
    }
    if (!newest) return 0.0f;
    switch (index) {
      case kMeterHeat:
        return newest->heat;
      case kMeterFront:
        return std::exp2(newest->front);
      case kMeterLevel:
        return newest->follow;
      case kMeterNote:
        return newest->frequency;
      default:
        return 0.0f;
    }
  }

 private:
  using Voice = setting_glass::Voice;
  using Stuff = setting_glass::Stuff;
  static const Stuff& stuff(int matter) { return setting_glass::stuff(matter); }
  static constexpr int kChunk = 64;  // control period, samples
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kEdgeHz = 3000.0f;   // a mode fades out between these, at any sample rate
  static constexpr float kTopHz = 13000.0f;
  static constexpr float kTopFront = 13.6f;    // log2 of the front at heat 1
  static constexpr float kHottest = 1.15f;
  static constexpr float kRestMost = 0.88f;
  static constexpr float kMiddle = 6.78f;      // log2 of 110 Hz
  static constexpr float kFollowKey = 0.4f;    // how far the cold end of the front follows the note
  static constexpr float kLevel = 0.31f;       // a full strike of a note's lowest tone
  static constexpr float kSing = 0.12f;        // what rubbing brings a set mode to
  static constexpr float kAir = 0.030f;        // what the breath alone brings a mode to
  static constexpr float kPing = 0.16f;
  static constexpr float kTick = 0.14f;
  static constexpr float kFalls = 0.4f;
  static constexpr float kCap = 1.5f;          // of a full strike: above it a mode loses more
  static constexpr float kMeltSeconds = 0.34f; // a soft mode at 150 Hz, to -60 dB
  static constexpr float kPressedSoftly = 0.12f;  // the press when the full strike is elsewhere
  static constexpr float kPourSeconds = 2.0f;
  static constexpr float kStealSeconds = 0.003f;
  static constexpr float kKnobSeconds = 0.015f;
  static constexpr float kGlideSeconds = 0.08f;
  static constexpr float kSeed = 1.5e-5f;
  static constexpr float kSilence = 1.0e-6f;

  typedef float Four __attribute__((vector_size(16), may_alias));

  static int partial_of(int k) { return k < kPairs ? k : k - kPairs; }

  // A steady number in -1..1 for a matter's partial.
  static float scattered(int matter, int p) {
    kit::Rng rng;
    rng.seed(0x51A55u + 7919u * static_cast<uint32_t>(matter * 64 + p));
    rng.next_u32();
    rng.next_u32();
    return rng.bipolar();
  }

  int choice(int id, int count) const { return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, count - 1); }

  int count_sounding() const {
    int count = 0;
    for (const Voice& voice : voices_) count += voice.sounding ? 1 : 0;
    return count;
  }

  // The voice a new piece takes: an idle one, else the quietest let go, else
  // the quietest held (the oldest on a tie); one a press already waits in only
  // when there is no other.
  int pick() const {
    int found = -1;
    for (int pass = 0; pass < 4 && found < 0; ++pass) {
      for (int v = 0; v < kMaxVoices; ++v) {
        const Voice& voice = voices_[v];
        if (pass == 0 && voice.sounding) continue;
        if (pass == 1 && (voice.pending || !voice.released())) continue;
        if (pass == 2 && voice.pending) continue;
        if (found < 0) {
          found = v;
          continue;
        }
        const Voice& best = voices_[found];
        const bool older = voice.stamp < best.stamp;
        if (pass == 0 ? older : voice.follow < best.follow || (voice.follow == best.follow && older)) found = v;
      }
    }
    return found;
  }

  void set_knobs(bool glide) {
    using namespace setting_glass;
    bright_.set(param(kBright), glide);
    order_.set(param(kOrder), glide);
    stretch_.set(param(kStretch), glide);
    edge_.set(param(kEdge), glide);
    breath_.set(param(kBreath), glide);
    tick_.set(param(kTicks), glide);
    ring_.set(std::log2(param(kRing)), glide);
    const float wide = param(kWidth);
    width_.set(kWidest * wide * (0.25f + 0.75f * wide), glide);
    volume_.set(kit::db_to_gain(param(kVolume)), glide);
  }

  void restart() {
    set_knobs(false);
    ++serial_;
    chunk_left_ = 0;
    ticks_run_ = 0;
    reset_furnace();
  }

  // --- pitch, level and loss of the modes -----------------------------------

  // No matter and no Bright makes the upper tones louder than the lower: near
  // and past `kFlattest` a tilt is bent back under it.
  static float falling(float steep) {
    const float x = (kFlattest - steep) * (1.0f / kBend);
    return kFlattest - kBend * (x > 12.0f ? x : std::log(1.0f + std::exp(x)));
  }

  void tune(Voice& voice) {
    const Stuff& matter = stuff(voice.matter);
    const float sr = sample_rate();
    const float loose = 1.0f - order_.value;
    const float apart = loose * loose * std::sqrt(loose);
    const float scatter = kScatter * matter.scatter * apart;
    const float missing = kMissing * loose * std::sqrt(loose);  // a piece set too soon lacks some of its tones
    const float power = 1.0f + kStretchMost * stretch_.value;
    const float bright = bright_.value + 0.3f * (voice.gain - 0.6f);
    const float steep = (bright > 0.5f ? kTiltUp : kTiltDown) * (bright - 0.5f) - matter.roll;
    const float tilt = falling(steep);
    const float ring = std::exp2(ring_.value) * matter.ring;
    const float top = kit::min(kTopHz, 0.45f * sr);
    const float reach = std::exp2(1.6f - 2.4f * bright);  // how soon soft glass loses its upper tones
    float energy = 0.0f, sum = 0.0f, rim = 0.0f;
    for (int k = 0; k < kModes; ++k) {
      const int p = partial_of(k);
      const bool pair = k < 2 * kPairs;
      float ratio = matter.ratio[p];
      const bool plain = ratio == 1.0f || ratio == 2.0f || ratio == 0.5f;
      if (p > 0) {
        const float cents = plain ? 0.35f * scatter * scattered(voice.matter, p) * loose : scatter * scattered(voice.matter, p);
        ratio = std::exp2(std::log2(ratio) * power + cents * (1.0f / 1200.0f));
      }
      float hz = voice.frequency * ratio;
      const float width = pair ? kit::clamp((hz - 0.0f) * 0.0007f, 0.0f, 0.5f * matter.beat * (1.0f + 8.0f * loose * loose)) : 0.0f;
      hz += k < kPairs ? width : (pair ? -width : 0.0f);
      float in = hz < 24.0f ? 0.0f : kit::clamp((top - hz) * (1.0f / (kTopHz - kEdgeHz)), 0.0f, 1.0f);
      in *= in;
      const float w = kit::kTwoPi * kit::min(hz, 0.49f * sr) / sr;
      voice.turn_re[k] = std::cos(w);
      voice.turn_im[k] = std::sin(w);
      voice.place[k] = std::log2(kit::max(hz, 1.0f));
      float level = in * std::exp2(tilt * (ratio < 1.0f ? -std::log2(ratio) * 0.7f : std::log2(ratio)));
      if (p > 0) level *= std::exp2(-missing * kit::max(scattered(voice.matter, p + 64), 0.0f));
      if (pair) level *= k < kPairs ? 0.62f : 0.5f;
      if (p == 0) level *= matter.root;
      if (matter.formant > 0.0f) level *= setting_glass::mouth(hz, matter.formant);
      voice.level[k] = level;
      energy += level * level;
      sum += level;
      rim += level * (1.0f + kRim * kit::clamp(voice.place[k] - std::log2(voice.frequency), 0.0f, 5.0f));
      const float above = kit::max(ratio - 1.0f, 0.0f) * reach * 0.8f;
      // Which way a contact moves it, as a piece struck off its middle.
      voice.way_in[k] = p > 0 && scattered(voice.matter, p + 32) > 0.0f ? -1.0f : 1.0f;
      voice.soft[k] = 1.0f / (1.0f + above * above);
      // Past the top of the band nothing is left ringing.
      const float seconds = kit::min(0.05f + 80.0f * in, kit::clamp(ring * std::exp2((7.64f - voice.place[k]) * matter.slope), 0.04f, 60.0f));
      const float melt = kMeltSeconds * matter.melt * std::exp2((7.23f - voice.place[k]) * 0.7f);
      voice.nepers_set[k] = kSixtyDb / (seconds * sr);
      voice.nepers_melt[k] = kSixtyDb / (kit::clamp(kit::min(melt, 0.6f * seconds), 0.012f, 1.2f) * sr);
    }
    // One loudness whatever the tilt, and whatever the register.
    const float even = matter.gain * std::exp2((7.8f - std::log2(voice.frequency)) * kRegister);
    const float scale = even / std::sqrt(kit::max(energy, 1.0e-6f));
    const float root = std::log2(voice.frequency);
    for (int k = 0; k < kModes; ++k) {
      voice.level[k] *= scale;
      voice.uncap[k] = 1.0f / (voice.level[k] + 0.04f);
      voice.above[k] = kit::clamp(voice.place[k] - root, 0.0f, 5.0f);
    }
    voice.crest = std::sqrt(kit::min(1.0f, kCrest / (scale * sum + 0.01f)));
    voice.crest_rim = std::pow(kit::min(1.0f, kCrest / (scale * rim + 0.01f)), 0.75f);
    voice.tuned = serial_;
  }

  void place(Voice& voice) {
    for (int k = 0; k < kModes; ++k) {
      const int p = partial_of(k);
      const bool pair = k < 2 * kPairs;
      float far = pair ? (p == 0 ? 0.35f : 0.75f) : 0.85f;
      const int side = pair ? ((k < kPairs) == ((p & 1) == 0) ? 1 : -1) : ((p & 1) ? 1 : -1);
      voice.mid[k] = std::sqrt(1.0f - 0.5f * far * far);
      voice.side[k] = static_cast<float>(side) * far * kit::kSqrtHalf;
    }
  }

  // --- presses, strikes, blows ----------------------------------------------

  void start(Voice& voice, float frequency, float gain) {
    using namespace setting_glass;
    const uint32_t stamp = voice.stamp;
    const int holders = voice.holders;
    int ids[setting_glass::kHolders];
    for (int i = 0; i < setting_glass::kHolders; ++i) ids[i] = voice.ids[i];
    voice = Voice();
    voice.stamp = stamp;
    voice.holders = holders;
    for (int i = 0; i < setting_glass::kHolders; ++i) voice.ids[i] = ids[i];
    voice.sounding = true;
    voice.frequency = frequency;
    voice.gain = gain;
    voice.matter = choice(kMatter, kNumMatters);
    voice.way = kAnneal;
    voice.rng.seed(0x6A55u + static_cast<uint32_t>(frequency * 16.0f) * 2654435761u);
    voice.pace = std::exp2(0.22f * voice.rng.bipolar());
    voice.thin = std::exp2((std::log2(frequency) - 7.8f) * 0.18f);
    voice.hot = voice.heat = kHottest * param(kHeat);
    voice.blow_in = (0.55f + 0.25f * voice.rng.uniform()) * voice.pace / param(kTurn);
    voice.fire_in = 0.45f * param(kEvery) * (0.95f + 0.1f * voice.rng.uniform());
    voice.flutter = voice.flutter_to = 0.0f;
    tune(voice);
    place(voice);
    place_front(voice);
    const float front = voice.front, border = border_of(voice);
    for (int k = 0; k < kModes; ++k) {
      voice.set[k] = setness(voice.place[k], front, border);
      voice.due[k] = voice.set[k] < 0.6f ? 1.0f : 0.0f;
    }
    work_modes(voice);
    pressed(voice);
    voice.follow = kLevel * voice.gain;
    if (released_while_waiting(voice)) let_go(voice);
  }

  static bool released_while_waiting(const Voice& voice) { return voice.holders == 0; }

  void pressed(Voice& voice) {
    const int when = choice(setting_glass::kWhen, 4);
    const bool full = when == kPress || when == kBoth;
    voice.waiting_to_set = when == kSet;
    voice.bare = when == kLetGo;
    if (full || when == kSet) strike(voice, full ? 1.0f : kPressedSoftly, 1.0f);
  }

  // The same pitch again: the glass is warmed through part of the way, struck,
  // and held as it was.
  void press_again(Voice& voice, float gain, bool was_let_go) {
    voice.gain = gain;
    voice.hot = kHottest * param(setting_glass::kHeat);
    voice.rewarm = kit::max(voice.heat, kAgain * voice.hot);
    if (was_let_go) {
      voice.choke = voice.after = 0.0f;
      voice.way = kAnneal;
      voice.age = 0.0f;
      voice.blow_in = 0.7f * voice.pace / param(setting_glass::kTurn);
      voice.fire_in = param(setting_glass::kEvery);
    }
    tune(voice);
    pressed(voice);
    voice.follow = kit::max(voice.follow, 0.5f * kLevel * gain);
  }

  void let_go(Voice& voice) {
    using namespace setting_glass;
    const int when = choice(kWhen, 4);
    const bool struck = when == kLetGo || when == kBoth;
    voice.way = choice(kRelease, 3);
    voice.waiting_to_set = false;
    voice.rewarm = 0.0f;
    voice.fire = 0.0f;
    const float tail = param(kTail);
    const float share = voice.way == kQuench ? 0.3f : (voice.way == kAnneal ? 1.35f : 1.0f);
    voice.choke = kSixtyDb / (share * tail * sample_rate());
    if (voice.way == kQuench) {
      // The skin sets at once and cracks: every tone not yet set sounds, and
      // those that had are shaken.
      const float cracks = kPing * (struck ? 0.8f : 1.5f);
      for (int k = 0; k < kModes; ++k) {
        const float high = kit::clamp(0.25f * (voice.place[k] - std::log2(voice.frequency)), 0.0f, 1.0f);
        voice.waits[k] = cracks * voice.gain * voice.level[k] * (0.25f + high);
        voice.wait[k] = 0.09f * voice.rng.uniform() * voice.rng.uniform();
        voice.due[k] = 0.0f;
      }
      crackle(voice, struck ? 0.35f : 0.6f);
    }
    if (struck) {
      // And the blows go on from there, each less than the last.
      strike(voice, when == kLetGo ? kLastAlone : kLast, 1.0f, true);
      voice.after = param(kBlows) > 0.0f ? 1.0f : 0.0f;
      voice.blow_in = voice.pace / param(kTurn);
    }
  }

  static float touch_of(float gain) { return gain * (0.72f + 0.28f * gain); }

  // One strike, `amount` of a full one; `length` shortens a pour.
  // At the end of a hold (`last`) set glass is struck as hard as soft glass.
  void strike(Voice& voice, float amount, float length, bool last = false) {
    using namespace setting_glass;
    const int striker = choice(kStrike, 4);
    const Stuff& matter = stuff(voice.matter);
    const float sr = sample_rate();
    const float bright = bright_.value;
    if (!last) amount *= kSetHits + (1.0f - kSetHits) * kit::min(voice.heat, 1.0f);
    const float hard = touch_of(voice.gain);
    const float soft = 1.0f + 0.9f * kit::min(voice.heat, 1.0f);
    if (!last) shake(voice, amount * hard);
    const float lighter = std::exp2(1.2f * (0.5f - bright)) * (1.35f - 0.55f * voice.gain) * soft;
    static const float kPeriods[4] = {0.8f, 0.03f, 0.22f, 0.1f};
    const float touch = std::sqrt(matter.touch);
    // A cold rod draws heat out of the glass, hot drops bring some.
    static const float kWarms[4] = {0.13f, -0.34f, 0.0f, 0.0f};
    if (voice.heat > 0.0f && !voice.released()) {
      voice.heat = kit::clamp(voice.heat + kWarms[striker] * kit::min(amount, 1.0f) * kit::min(voice.heat, 1.0f), 0.0f, kHottest);
    }
    if (striker == kPour) {
      voice.dig = 0.6f;
      voice.muffle_to = 0.0f;
      // A stream still running goes on as it is until the new one is stronger.
      voice.pour_to = kit::max(amount * hard, voice.pour > 0.0f ? voice.pour_to * flow_of(voice.pour) : 0.0f);
      if (voice.pour <= 0.0f && voice.stream <= 0.0f) voice.stream = 0.2f * voice.pour_to;
      voice.pour = kit::max(voice.pour, length);
      return;
    }
    // Contact, in periods of the note; what it costs the note is given back.
    const float periods = kit::clamp(kPeriods[striker] * touch * lighter, 0.02f, 1.1f);
    const float through = std::fabs(periods - 1.0f) < 0.02f ? 0.5f
                          : std::sin(kit::kPi * periods) / (kit::kPi * periods * (1.0f - periods * periods));
    static const float kWeigh[4] = {0.85f, 0.5f, 0.95f, 0.0f};
    static const float kDig[4] = {0.0f, 0.6f, 0.12f, 0.6f};
    voice.dig = kDig[striker];
    voice.rim = striker == kRod ? kRim : 0.0f;  // the rod is struck at the rim, where the high tones live
    if (striker == kRod) voice.rasp = kit::max(voice.rasp, amount * hard);
    voice.muffle_to = striker == kTap ? 1.0f : 0.0f;
    if (striker == kDrop && !voice.released()) voice.bloom_in = kit::min(voice.bloom_in + amount, 1.5f);
    const int slot = voice.next_contact;
    voice.next_contact ^= 1;
    // A contact still under way is let finish by the other slot; a third
    // waits for nothing: what was left of the older one is added to it.
    const float left = voice.contact_phase[slot] < 1.0f && voice.contact_area[slot] > 0.0f
                           ? voice.contact_area[slot] * (1.0f - kit::max(voice.contact_phase[slot], 0.0f))
                           : 0.0f;
    voice.contact_step[slot] = kit::min(voice.frequency / (periods * sr), 0.4f);
    voice.contact_phase[slot] = -voice.contact_step[slot] * in_step(voice, periods);
    voice.contact_area[slot] = kLevel * kWeigh[striker] * amount * hard / kit::max(through, 0.3f) * (striker == kDrop ? 1.0f : (striker == kRod ? voice.crest_rim * kRodMakes : voice.crest)) + left;
    if (striker == kDrop) {
      voice.bubble_wait = 0.045f + 0.04f * voice.rng.uniform();
      voice.bubble_to = folded(2.0f * voice.frequency, 320.0f);
      voice.bubble_from = 0.6f;
      voice.bubble_gain = kBubble * (1.0f - 0.8f * matter.crack) * amount * hard * std::sqrt(320.0f / voice.bubble_to);
      voice.bubble_seconds = 0.16f;
      voice.drips = 4;
    } else if (striker == kRod) {
      // The rod rings too, on a high octave of the note.
      voice.drips = 0;
      voice.bubble_wait = 1.0e-4f;
      if (voice.bubble <= 0.0f) voice.bubble_phase = voice.rng.uniform();
      voice.bubble_to = folded(8.0f * voice.frequency, 1500.0f);
      voice.bubble_from = 1.0f;
      voice.bubble_gain = kIron * amount * hard * (0.5f + bright);
      voice.bubble_seconds = 0.5f;
    }
    // Iron clacks, wood knocks.
    if (striker == kRod || striker == kTap) {
      const bool iron = striker == kRod;
      const float size = std::sqrt(kit::clamp(220.0f / voice.frequency, 0.1f, 6.0f));
      const float hz = iron ? 1500.0f + 2200.0f * bright : 190.0f + 260.0f * bright;
      voice.clack.set(kit::clamp(hz / std::sqrt(size), 120.0f, 5000.0f), iron ? 1.1f : 2.2f, sr);
      voice.noise = kit::max(voice.noise, (iron ? 0.8f : 3.4f) * kClack * amount * hard * (iron ? 0.35f + 0.65f * bright : 1.0f) * noise_scale_);
      voice.noise_step = std::exp(-kSixtyDb / ((iron ? 0.045f : 0.09f) * size * sr));
    }
  }

  // What strikes one piece shakes the set tones of those that stand beside it.
  void shake(const Voice& struck, float amount) {
    const float shared = param(setting_glass::kNeighbours);
    amount *= kShake * shared / std::sqrt(static_cast<float>(count_sounding()));
    if (amount < 1.0e-5f) return;
    for (Voice& voice : voices_) {
      if (&voice == &struck || !voice.sounding || voice.pending || voice.released() || voice.bare || voice.waiting_to_set || voice.age < 0.05f) continue;
      for (int k = 0; k < kModes; ++k) {
        voice.owed[k] += amount * voice.level[k] * voice.set[k] * (0.5f + 0.5f * voice.above[k]) * (0.4f + 1.2f * voice.rng.uniform());
      }
    }
  }

  // How many samples a contact waits, under one period, for the ringing note
  // to come round to where the strike adds to it and takes nothing away.
  float in_step(const Voice& voice, float periods) const {
    const float re = voice.re[0], im = voice.im[0];
    if (re * re + im * im < 1.0e-6f) return 0.0f;
    const float turns = voice.frequency / sample_rate();
    float ahead = 0.18f - std::atan2(im, re) / kit::kTwoPi - 0.5f * periods;
    ahead -= std::floor(ahead);
    return ahead / turns;
  }

  static float folded(float hz, float low) {
    while (hz >= 2.0f * low) hz *= 0.5f;
    while (hz < low) hz *= 2.0f;
    return hz;
  }

  // A dry crack: a bit of noise into the glass and out of it.
  void crackle(Voice& voice, float amount) {
    const Stuff& matter = stuff(voice.matter);
    const float sr = sample_rate();
    const float hard = touch_of(voice.gain);
    const float dry = amount * matter.crack * hard;
    if (dry <= 0.0f) return;
    const float loud = kClack * dry * noise_scale_;
    if (voice.noise < loud) {  // a louder clack still going keeps its own sound
      voice.clack.set(2200.0f + 2600.0f * voice.rng.uniform(), 0.9f, sr);
      voice.noise = loud;
      voice.noise_step = std::exp(-kSixtyDb / ((0.006f + 0.02f * voice.rng.uniform()) * sr));
    }
    grain(voice, 0.35f * kLevel * dry, 5000.0f);
  }

  void grain(Voice& voice, float area, float hz) {
    voice.grain += area;
    voice.grain_pole = std::exp(-kit::kTwoPi * kit::min(hz, 0.4f * sample_rate()) / sample_rate());
  }

  // --- heat and the front ---------------------------------------------------

  float border_of(const Voice& voice) const {
    return 0.12f * std::exp2(4.8f * edge_.value) * stuff(voice.matter).border;
  }

  void place_front(Voice& voice) const {
    const float border = border_of(voice);
    const float key = std::log2(voice.frequency);
    const float cold = kFollowKey * key + (1.0f - kFollowKey) * kMiddle - 1.2f - border;
    const float hot = kTopFront + 0.5f * border;
    voice.front = cold + voice.heat * (hot - cold);
  }

  static float setness(float at, float front, float border) {
    const float x = kit::clamp(0.5f + 0.5f * (at - front) / border, 0.0f, 1.0f);
    return x * x * (3.0f - 2.0f * x);
  }

  // What a tick does to the heat of a piece, with the mean heat of those held.
  void cool(Voice& voice, float mean, int count) {
    using namespace setting_glass;
    const float before = voice.heat;
    if (voice.released() && voice.way == kQuench) {
      voice.heat -= voice.heat * kit::min(dt_ / 0.035f, 1.0f);
    } else if (voice.released() && voice.way == kRemelted) {
      voice.heat = kit::min(kHottest, voice.heat + dt_ * (2.6f - 1.9f * kit::min(voice.heat, 1.0f)) / param(kTail));
    } else {
      const float shared = param(kNeighbours);
      const float rest = kHottest * kRestMost * param(kRest);
      const float over = voice.heat - rest;
      const float mass = 1.0f + 0.45f * shared * static_cast<float>(count > 1 ? count - 1 : 0);
      const float out = voice.fire > 0.0f ? kit::max(1.0f - 3.0f * param(kRemelt), 0.0f) : 1.0f;  // in the fire nothing cools
      const float pull = out * dt_ * 1.45f * voice.thin / (param(kCooling) * mass);
      if (over > 0.0f) {
        voice.heat -= kit::min(over, pull * (0.35f + over));
      } else {
        voice.heat -= kit::max(over, -pull * (0.2f - over));
      }
      if (!voice.released()) {
        voice.heat += (mean - voice.heat) * kit::min(dt_ * 5.0f * shared * shared, 0.5f);
        visit_fire(voice);
      }
      if (voice.rewarm > voice.heat) {
        voice.heat += (voice.rewarm - voice.heat) * kit::min(dt_ / 0.03f, 1.0f);
        if (voice.rewarm - voice.heat < 0.03f) voice.rewarm = 0.0f;
      } else {
        voice.rewarm = 0.0f;
      }
    }
    voice.heat = kit::clamp(voice.heat, 0.0f, kHottest);
    const float speed = kit::max(before - voice.heat, 0.0f) / dt_;
    voice.speed = flush_denormal(voice.speed + (speed - voice.speed) * kit::min(dt_ / 0.05f, 1.0f));
    place_front(voice);
  }

  // Remelt: every so often the glass goes back to the fire for a moment.
  void visit_fire(Voice& voice) {
    using namespace setting_glass;
    const float every = param(kEvery);
    voice.fire_in = kit::min(voice.fire_in, every * 1.1f) - dt_;
    if (voice.fire_in <= 0.0f) {
      voice.fire_in += every * (0.95f + 0.1f * voice.rng.uniform());
      voice.fire = kit::min(0.3f * every, 0.9f);
    }
    if (voice.fire <= 0.0f) return;
    const float lasts = kit::min(0.3f * every, 0.9f);
    voice.fire -= dt_;
    voice.heat += param(kRemelt) * 1.05f * dt_ / lasts * kit::max(kHottest - voice.heat, 0.0f);
  }

  // --- every kChunk samples --------------------------------------------------

  void control() {
    ++ticks_run_;
    bool moved = false;
    for (kit::Smoother* knob : {&bright_, &order_, &stretch_, &ring_}) {
      if (knob->settled()) continue;
      knob->next();
      moved = true;
    }
    for (kit::Smoother* knob : {&edge_, &breath_, &tick_}) knob->next();
    if (moved) ++serial_;
    float sum = 0.0f;
    int count = 0;
    for (const Voice& voice : voices_) {
      if (!voice.sounding || voice.pending || voice.released()) continue;
      sum += voice.heat;
      ++count;
    }
    const float mean = count > 0 ? sum / static_cast<float>(count) : 0.0f;
    float roar = 0.0f;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = voices_[v];
      if (!voice.sounding) continue;
      if (voice.pending && voice.steal <= 0.0f) {
        start(voice, voice.pending_frequency, voice.pending_gain);
        continue;
      }
      if (voice.tuned != serial_ && ((static_cast<int>(ticks_run_) + v) & 3) == 0) tune(voice);
      tick(voice, mean, count);
      if (voice.sounding) roar += voice.roar * voice.steal;
    }
    roar_to_ = roar;
    if (roar_to_ <= 0.0f && roar_ < 1.0e-8f) roar_ = 0.0f;
  }

  void tick(Voice& voice, float mean, int count) {
    using namespace setting_glass;
    const bool held = !voice.released();
    voice.age += dt_;
    if (voice.age >= 1000.0f) voice.age -= 1000.0f;  // a whole number of turns of every haze
    cool(voice, mean, count);
    // The breath comes up in an eighth of a second and goes with the key.
    const float tail = param(kTail);
    if (held) {
      voice.on += (1.0f - voice.on) * kit::min(dt_ / 0.11f, 1.0f);
    } else {
      const float goes = voice.way == kQuench ? 0.05f : (voice.way == kAnneal ? 0.22f * tail : (0.06f + 1.2f * kit::clamp(1.2f * (1.0f - voice.heat), 0.0f, 1.0f)) * tail);
      voice.on -= voice.on * kit::min(dt_ / kit::max(goes, 0.01f), 1.0f);
      if (voice.on < 1.0e-7f) voice.on = 0.0f;
    }
    if (voice.rng.uniform() < dt_ * 1.6f) voice.flutter_to = voice.rng.bipolar();
    voice.flutter += (voice.flutter_to - voice.flutter) * kit::min(dt_ / 0.5f, 1.0f);
    if (voice.rng.uniform() < dt_ * 12.0f) voice.rumble_to = voice.rng.bipolar();
    voice.rumble += (voice.rumble_to - voice.rumble) * kit::min(dt_ / 0.03f, 1.0f);

    if (voice.waiting_to_set) {
      const bool cold = voice.heat < kHottest * kRestMost * param(kRest) + 0.02f;
      if (voice.set[0] > 0.55f || cold) {
        strike(voice, kLast, 1.0f, true);
        voice.waiting_to_set = false;
      }
    } else if (held && voice.set[0] < 0.25f && choice(kWhen, 4) == kSet && voice.heat > kHottest * kRestMost * param(kRest) + 0.06f) {
      voice.waiting_to_set = true;  // back from the fire
    }
    const int when = choice(kWhen, 4);
    if (held || voice.after > 0.0f) {
      voice.blow_in = kit::min(voice.blow_in, 1.5f * voice.pace / param(kTurn)) - dt_;
      if (voice.blow_in <= 0.0f) {
        voice.blow_in += voice.pace / param(kTurn) * (0.94f + 0.12f * voice.rng.uniform());
        const float blows = param(kBlows);
        const float amount = 1.25f * blows * (0.8f + 0.2f * voice.rng.bipolar());
        const bool falls = when == kPress || when == kBoth || (when == kSet && voice.set[0] > 0.5f);
        if (!held) {
          if (when == kLetGo || when == kBoth) strike(voice, kLast * voice.after * amount, 0.3f, true);
        } else if (amount > 1.0e-4f && falls) {
          strike(voice, amount * (kSetBlows + (1.0f - kSetBlows) * kit::min(voice.heat, 1.0f)), 0.5f);
        }
      }
    }
    if (voice.after > 0.0f) {
      voice.after -= voice.after * kit::min(dt_ / ((voice.way == kQuench ? 0.12f : 0.35f) * tail), 0.5f);
      if (voice.after < 0.04f) voice.after = 0.0f;
    }
    if (voice.pour > 0.0f || voice.stream > 0.0f) pour(voice);
    voice.rasp -= voice.rasp * kit::min(dt_ / 0.4f, 1.0f);
    if (voice.rasp < 1.0e-5f) voice.rasp = 0.0f;
    voice.bloom_in -= voice.bloom_in * kit::min(dt_ / 0.25f, 1.0f);
    voice.bloom = flush_denormal(voice.bloom + (voice.bloom_in - voice.bloom) * kit::min(dt_ / 0.12f, 1.0f));
    if (voice.bloom_in < 1.0e-5f) voice.bloom_in = 0.0f;
    voice.muffle = flush_denormal(voice.muffle + (voice.muffle_to - voice.muffle) * kit::min(dt_ / 0.05f, 1.0f));
    shrink(voice);
    const float slope = 0.5f / border_of(voice), base = 0.5f - voice.front * slope;
    for (int k = 0; k < kModes; ++k) {
      const float x = base + voice.place[k] * slope;
      const float in = x > 0.0f ? (x < 1.0f ? x : 1.0f) : 0.0f;
      voice.set[k] = in * in * (3.0f - 2.0f * in);
    }
    work_modes(voice);
    voice.roar = kRoar * breath_.value * touch_of(voice.gain) * voice.on * kit::min(voice.heat, 1.0f) *
                 (1.0f + 0.4f * voice.flutter + 0.5f * voice.rumble);
    if (!held && !voice.pending && voice.follow < kSilence && voice.on < 1.0e-4f && voice.pour <= 0.0f && voice.stream <= 0.0f && voice.after <= 0.0f && voice.bubble < kSilence &&
        voice.bubble_wait <= 0.0f && voice.noise < kSilence) {
      voice.sounding = false;
    }
    if (voice.noise < 1.0e-6f) voice.noise = 0.0f;
  }

  // A stream of small hot drops, thickening for a moment and then thinning out.
  static float flow_of(float left) { return kit::clamp((1.0f - left) * 5.0f + 0.25f, 0.0f, 1.0f) * left * (0.4f + 0.6f * left); }

  void pour(Voice& voice) {
    const float left = voice.pour;
    voice.pour = kit::max(left - dt_ / kPourSeconds, 0.0f);
    voice.stream += (flow_of(left) * voice.pour_to - voice.stream) * kit::min(dt_ / 0.1f, 1.0f);
    if (voice.pour <= 0.0f && voice.stream < 1.0e-6f) {
      voice.stream = 0.0f;
      return;
    }
    if (!voice.released()) voice.heat = kit::min(kHottest, voice.heat + dt_ * left * kit::min(voice.heat, 1.0f));
    if (voice.rng.uniform() < dt_ * 85.0f) {
      const float u = voice.rng.uniform();
      const float bright = std::exp2((bright_.value - 0.5f) * 2.0f);
      grain(voice, kGrain * kLevel * (0.2f + u * u) * voice.stream * (voice.rng.next_u32() & 1u ? 1.0f : -1.0f),
            voice.frequency * (2.5f + 12.0f * voice.rng.uniform()) * bright);
    }
  }

  // The front passing, and ticks.
  void shrink(Voice& voice) {
    const Stuff& matter = stuff(voice.matter);
    const float ticks = tick_.value;
    const float hard = touch_of(voice.gain);
    const bool melts = voice.released() && voice.way == kRemelted;
    const float each = kPing * hard * voice.crest * (0.4f + 0.8f * ticks) * (1.0f - 0.55f * edge_.value);
    for (int k = 0; k < kModes; ++k) {
      if (voice.due[k] > 0.0f) {
        if (voice.set[k] > 0.6f && !melts) {
          voice.due[k] = 0.0f;
          const float high = 1.0f + 0.28f * voice.above[k];
          voice.waits[k] = (voice.released() ? voice.on : 1.0f) * each * voice.level[k] * high * (0.7f + 0.6f * voice.rng.uniform());
          voice.wait[k] = 0.07f * voice.rng.uniform();
        }
      } else if (voice.set[k] < (melts ? 0.85f : 0.3f)) {
        voice.due[k] = 1.0f;
        // Glass that melts as it is let go lets its tones fall one by one, from the lowest up.
        if (melts) voice.owed[k] += kFalls * hard * (1.0f - 0.7f * edge_.value) / matter.border * voice.level[k] * (1.0f + 0.5f * voice.above[k]);
      }
      if (voice.waits[k] > 0.0f) {
        voice.wait[k] -= dt_;
        if (voice.wait[k] <= 0.0f) {
          voice.owed[k] += voice.waits[k];
          voice.waits[k] = 0.0f;
        }
      }
    }
    const float rate = ticks * ticks * matter.tick * (2.2f + 26.0f * kit::min(voice.speed, 1.2f)) * voice.on;
    if (rate <= 0.0f || voice.rng.uniform() >= rate * dt_) return;
    const float size = voice.rng.uniform();
    int k = static_cast<int>(voice.rng.uniform() * static_cast<float>(kModes));
    for (int tries = 0; tries < 5 && voice.set[k] < 0.6f; ++tries) {
      k = static_cast<int>(voice.rng.uniform() * static_cast<float>(kModes));
    }
    if (voice.set[k] >= 0.6f) {
      const float amount = kTick * voice.on * hard * (0.35f + 0.65f * size * size) * (0.5f + 0.5f * ticks) / (1.0f + 0.08f * rate);
      const float high = 1.0f + 0.6f * voice.above[k];
      voice.owed[k] += amount * voice.level[k] * high;
      if (k < 2 * kPairs) {
        const int mate = k < kPairs ? k + kPairs : k - kPairs;
        voice.owed[mate] += 0.7f * amount * voice.level[mate] * high;
      }
    }
    crackle(voice, 0.5f * voice.on * ticks * (0.2f + 0.8f * size * size));
  }

  // Loss, drive and turn of every mode for the next tick.
  void work_modes(Voice& voice) {
    const Stuff& matter = stuff(voice.matter);
    const float sr = sample_rate();
    const float hard = touch_of(voice.gain);
    const float blown = breath_.value, breath = blown * voice.on;
    const float moves = (voice.waiting_to_set ? 0.5f : 1.0f) * (1.0f - 0.6f * voice.muffle) * (1.0f + (0.25f + 0.45f * blown) * voice.flutter);
    const float air = (kAir * matter.air * breath * (0.7f + 0.55f * blown) * hard * moves * (1.0f + (0.15f + 0.4f * blown) * voice.rumble) + kStream * voice.stream) * 1.732f;
    const float poured = kPoured * voice.stream * 1.732f;
    const float borne = kBorne * voice.stream;  // and what a stream keeps set glass at, whatever its drops do to each other
    // Glass that waits for its strike is not rubbed before it.
    const float sing = voice.waiting_to_set || voice.bare ? 0.0f : kSing * matter.sing * 0.9f * breath / (0.45f + blown) * hard * (1.0f + 0.3f * voice.flutter);
    const float keen = 0.28f * kit::max(blown - 0.35f, 0.0f);  // a strong breath is a brighter one
    const float gather = dt_ / 0.45f;
    const float soon = 1.4f / sr;  // a pour is over before long tones have filled: it is let in faster
    const float peak = 1.6f * (1.0f - 0.75f * edge_.value);
    const float uncap = 1.0f / (kCap * kLevel * kit::max(hard, 0.05f));
    const float over_loss = kSixtyDb / (0.4f * sr);
    const float choke = voice.choke;
    const float rasp = kRasp * voice.crest_rim / matter.gain * voice.rasp * 1.732f;
    const float palm = voice.muffle * kPalm / sr;
    const float lean = voice.rim * kLean / sr;
    const bool quench = voice.released() && voice.way == kQuench;
    const bool remelt = voice.released() && voice.way == kRemelted;
    const float hurry = kit::min(260.0f * dt_, 0.6f);
    // Each tone sings in a slow time of its own: four of them looked at a tick.
    const int few = static_cast<int>(voice.ticks++ & 7u) * 4;
    for (int k = few; k < few + 4; ++k) {
      voice.haze[k] = 1.0f + 0.7f * kit::SineTable::lookup(voice.age * (0.11f + 0.013f * static_cast<float>(k)) +
                                                          0.381966f * static_cast<float>(k * k));
    }
    const float ends_flat = quench ? 1.9f * choke : (remelt ? choke * (0.15f + 0.85f * kit::clamp(3.0f * voice.heat - 2.2f, 0.0f, 1.0f)) : choke);
    const float ends_slope = quench ? 0.28f * choke : 0.0f;
    const float thin = remelt ? 0.9f * kit::min(1.6f * voice.heat, 1.0f) : 0.0f;
    const float bloom = kBloom * voice.bloom;
    const float dig = voice.dig, rim = voice.rim, muffle = 0.4f * voice.muffle;
    alignas(16) float amp[kModes], add[kModes], owed[kModes], nepers[kModes];
    // No branch and no call in here: four modes at a time.
    for (int k = 0; k < kModes; ++k) amp[k] = std::sqrt(voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k]);
    for (int k = 0; k < kModes; ++k) {
      const float s = voice.set[k], u = 1.0f - s, octaves = voice.above[k], level = voice.level[k];
      const float over = amp[k] * voice.uncap[k] * uncap - 1.0f;
      const float beaten = over > 0.0f ? (over < 6.0f ? over : 6.0f) : 0.0f;
      const float low = 1.4f - octaves;
      float n = voice.nepers_set[k] + (u * u * u + 2.0f * s * u * peak) * voice.nepers_melt[k] + ends_flat - ends_slope * octaves +
                palm * (0.6f + octaves) * s + lean * (low > 0.0f ? low : 0.0f) * s + over_loss * beaten;
      n = n < 0.2f ? n : 0.2f;
      nepers[k] = n;
      const float open = voice.soft[k] + (1.0f - voice.soft[k]) * s;
      const float give = voice.soft[k] + (1.0f - voice.soft[k]) * (dig > s ? dig : s);
      voice.hit[k] = voice.way_in[k] * level * give * (1.0f + rim * octaves);
      const float swell = 1.0f + bloom / (1.0f + octaves);
      const float drag = octaves < 3.0f ? octaves : 3.0f;
      voice.air[k] = level * swell * (air * open * (1.0f + keen * octaves) * (1.0f - 0.35f * s) * std::sqrt(2.0f * n) +
                                  give * (rasp * drag * std::sqrt(2.0f * n) + poured * std::sqrt(2.0f * n + soon)));
      const float target = (sing * (1.0f + thin * octaves) + borne) * swell * voice.haze[k] * level * (1.0f + 0.3f * octaves) / (1.0f + muffle * octaves) * s * s;
      const float short_by = target - amp[k];
      owed[k] = hurry * voice.owed[k];
      add[k] = owed[k] + (short_by > 0.0f ? short_by : 0.0f) * gather;
    }
    for (int k = 0; k < kModes; ++k) {
      if (amp[k] < 1.0e-10f) voice.re[k] = voice.im[k] = 0.0f;
      if (amp[k] >= kSeed || add[k] <= 1.0e-6f) continue;
      const float phase = 0.618f * static_cast<float>(k);
      voice.re[k] = kSeed * kit::SineTable::cos_lookup(phase);
      voice.im[k] = kSeed * kit::SineTable::lookup(phase);
      amp[k] = kSeed;
    }
    float power[4] = {};
    for (int k = 0; k < kModes; ++k) {
      const float a = amp[k], want = add[k] / (a + 1.0e-12f);
      const float grow = a > 1.0e-9f ? (want < 1.6f ? want : 1.6f) : 0.0f;
      const float left = voice.owed[k] - grow * a * owed[k] / (add[k] + 1.0e-20f);
      voice.owed[k] = left < 1.0e-7f ? 0.0f : left;
      const float n = nepers[k];
      const float turn = 1.0f - n + 0.5f * n * n + grow / (1.0f + 0.43f * grow) * (1.0f / kChunk);
      voice.step_re[k] = voice.turn_re[k] * turn;
      voice.step_im[k] = voice.turn_im[k] * turn;
      nepers[k] = a * voice.mid[k];
    }
    for (int k = 0; k < kModes; ++k) power[k & 3] += nepers[k] * nepers[k];
    voice.follow = std::sqrt(power[0] + power[1] + power[2] + power[3]);
  }

  // --- audio ------------------------------------------------------------------

  void render_voice(Voice& voice, int n, float* mid, float* side) {
    const float sr = sample_rate();
    Four re[kModes / 4], im[kModes / 4];
    std::memcpy(re, voice.re, sizeof re);
    std::memcpy(im, voice.im, sizeof im);
    const Four* step_re = reinterpret_cast<const Four*>(voice.step_re);
    const Four* step_im = reinterpret_cast<const Four*>(voice.step_im);
    const Four* hit = reinterpret_cast<const Four*>(voice.hit);
    const Four* air = reinterpret_cast<const Four*>(voice.air);
    const Four* to_mid = reinterpret_cast<const Four*>(voice.mid);
    const Four* to_side = reinterpret_cast<const Four*>(voice.side);
    const bool blown = voice.on > 0.0f || voice.stream > 0.0f || voice.rasp > 0.0f;
    for (int i = 0; i < n; ++i) {
      float push = contacts(voice);
      if (voice.grain != 0.0f || voice.grain_b > 1.0e-9f || voice.grain_b < -1.0e-9f || voice.grain_a != 0.0f) {
        const float pole = voice.grain_pole;
        voice.grain_a = voice.grain * (1.0f - pole) + voice.grain_a * pole;
        voice.grain_b += (voice.grain_a - voice.grain_b) * (1.0f - pole);
        voice.grain_a = flush_denormal(voice.grain_a);
        voice.grain_b = flush_denormal(voice.grain_b);
        voice.grain = 0.0f;
        push += voice.grain_b;
      }
      const float wind = blown ? voice.rng.bipolar() : 0.0f;
      const Four e = {push, push, push, push};
      const Four u = {wind, wind, wind, wind};
      Four m = {}, s = {};
      for (int g = 0; g < kModes / 4; ++g) {
        const Four a = step_re[g] * re[g] - step_im[g] * im[g] + hit[g] * e + air[g] * u;
        im[g] = step_re[g] * im[g] + step_im[g] * re[g];
        re[g] = a;
        m += a * to_mid[g];
        s += a * to_side[g];
      }
      float out = m[0] + m[1] + m[2] + m[3];
      float wide = s[0] + s[1] + s[2] + s[3];
      if (voice.noise > 0.0f) {
        voice.clack.process(voice.rng.bipolar() * voice.noise);
        out += voice.clack.band;
        voice.noise *= voice.noise_step;
      }
      if (voice.bubble_wait > 0.0f || voice.bubble > 0.0f) out += bubble(voice, sr);
      if (voice.pending) {
        voice.steal = kit::max(voice.steal - steal_step_, 0.0f);
        const float left = voice.steal * voice.steal * (3.0f - 2.0f * voice.steal);
        out *= left;
        wide *= left;
      }
      mid[i] += out;
      side[i] += wide;
    }
    std::memcpy(voice.re, re, sizeof re);
    std::memcpy(voice.im, im, sizeof im);
  }

  static float contacts(Voice& voice) {
    float push = 0.0f;
    for (int c = 0; c < 2; ++c) {
      if (voice.contact_area[c] <= 0.0f) continue;
      voice.contact_phase[c] += voice.contact_step[c];
      if (voice.contact_phase[c] < 0.0f) continue;
      if (voice.contact_phase[c] >= 1.0f) {
        voice.contact_area[c] = 0.0f;
        continue;
      }
      push += voice.contact_area[c] * voice.contact_step[c] * (1.0f - kit::SineTable::cos_lookup(voice.contact_phase[c]));
    }
    return push;
  }

  // The air a drop traps: it rises to an octave of the note as it shrinks.
  float bubble(Voice& voice, float sr) const {
    if (voice.bubble_wait > 0.0f) {
      voice.bubble_wait -= 1.0f / sr;
      if (voice.bubble_wait <= 0.0f) {
        voice.bubble_wait = 0.0f;
        voice.bubble = kit::max(voice.bubble_gain, voice.bubble);
        voice.bubble_hz = voice.bubble_from * voice.bubble_to;
        voice.bubble_rise = 0.0f;
      }
      if (voice.bubble <= 0.0f) return 0.0f;
    }
    voice.bubble_hz += (voice.bubble_to - voice.bubble_hz) * kit::min(1.0f / (0.018f * sr), 1.0f);
    voice.bubble_phase += voice.bubble_hz / sr;
    if (voice.bubble_phase >= 1.0f) voice.bubble_phase -= 1.0f;
    voice.bubble *= 1.0f - kit::min(kSixtyDb / (voice.bubble_seconds * sr), 0.5f);
    voice.bubble_rise += (1.0f - voice.bubble_rise) * kit::min(1.0f / (0.003f * sr), 1.0f);
    const float out = voice.bubble * voice.bubble_rise * kit::SineTable::lookup(voice.bubble_phase);
    if (voice.bubble < 1.0e-6f) voice.bubble = 0.0f;
    if (voice.drips > 0 && voice.bubble_wait <= 0.0f && voice.bubble < 0.15f * voice.bubble_gain) {
      // And what follows it in, smaller and a fifth or an octave up.
      --voice.drips;
      voice.bubble_wait = 0.03f + 0.09f * voice.rng.uniform();
      voice.bubble_to = folded(voice.bubble_to * (voice.rng.next_u32() & 1u ? 1.5f : 2.0f), 420.0f);
      voice.bubble_gain *= 0.75f;
    }
    return out;
  }

  // The furnace itself: low moving air, as hot as the glass that is held.
  void furnace(int n, float* mid, float* side) {
    const float sr = sample_rate();
    const float follow = kit::min(1.0f / (0.02f * sr), 1.0f);
    const float pole = kit::min(kit::kTwoPi * 330.0f / sr, 0.5f);
    if (roar_ <= 0.0f && roar_to_ <= 0.0f) return;
    for (int i = 0; i < n; ++i) {
      roar_ += (roar_to_ - roar_) * follow;
      for (int c = 0; c < 2; ++c) {
        roar_a_[c] += (roar_rng_.bipolar() * noise_scale_ * roar_ - roar_a_[c]) * pole;
        roar_b_[c] += (roar_a_[c] - roar_b_[c]) * pole;
      }
      mid[i] += 0.5f * (roar_b_[0] + roar_b_[1]);
      side[i] += 0.5f * (roar_b_[0] - roar_b_[1]);
    }
  }

  void reset_furnace() {
    roar_rng_.seed(0xF17Eu);
    roar_ = roar_to_ = 0.0f;
    for (int c = 0; c < 2; ++c) roar_a_[c] = roar_b_[c] = 0.0f;
  }

  static constexpr float kWidest = 2.2f;
  static constexpr float kScatter = 7.0f;
  static constexpr float kMissing = 6.0f;     // octaves of level, at Order 0
  static constexpr float kStretchMost = 0.25f;
  static constexpr float kFlattest = -0.08f;
  static constexpr float kBend = 0.1f;
  static constexpr float kTiltUp = 0.85f;
  static constexpr float kTiltDown = 2.0f;
  static constexpr float kRegister = 0.10f;
  static constexpr float kAgain = 0.7f;      // how hot a piece struck again is, of a fresh one
  static constexpr float kBloom = 4.5f;      // how a drop that has fallen in makes the low tones swell
  static constexpr float kBubble = 0.27f;
  static constexpr float kIron = 0.025f;
  static constexpr float kRasp = 0.15f;      // a rod that drags
  static constexpr float kLean = 7.0f;       // and a rod, on the low tones
  static constexpr float kPalm = 4.0f;       // what a tap leaves resting on the glass, nepers a second an octave
  static constexpr float kClack = 0.16f;
  static constexpr float kStream = 0.10f;
  static constexpr float kPoured = 0.024f;
  static constexpr float kGrain = 0.3f;
  static constexpr float kBorne = 0.3f;
  static constexpr float kRoar = 0.08f;
  static constexpr float kSetBlows = 0.85f;  // what is left of a blow on set glass
  static constexpr float kSetHits = 0.56f;
  static constexpr float kLast = 0.65f;
  static constexpr float kLastAlone = 0.85f;
  static constexpr float kShake = 0.11f;
  static constexpr float kRim = 0.5f;
  static constexpr float kRodMakes = 1.3f;
  static constexpr float kCrest = 2.4f;      // the sum of the modes' levels past which a hard strike is held back;    // and of any strike

  Voice voices_[kMaxVoices];
  kit::Smoother bright_, order_, stretch_, edge_, breath_, tick_, ring_, width_, volume_;
  kit::Rng roar_rng_;
  kit::IdleGate idle_;
  float roar_ = 0.0f, roar_to_ = 0.0f, roar_a_[2] = {}, roar_b_[2] = {};
  float dt_ = 0.001f, noise_scale_ = 1.0f, steal_step_ = 0.01f;
  uint32_t serial_ = 1, stamp_ = 0, ticks_run_ = 0;
  int chunk_left_ = 0;
};

}  // namespace livemix
