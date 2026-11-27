#pragma once

// Bronze Vowels: struck bells that open their mouths as they fade.
//
//   strike ─► 44 partials (12 of them in pairs) ─► each dies by the mouth ─► pan ─► sum
//     │          ratios of the metal, the note      ▲
//     │          and its hum always in tune         │ Word, Speaking time, Clarity, Tract
//     │                                             │ the last bell struck teaches (Contagion)
//     ├─► knock ─────────────────────────────────────────────────────────► sum
//     └─► air ─► the same mouth as four formants ────────────────────────► sum
//
// - A partial is a unit vector turned every sample, and a level worked out
//   once a tick and ramped in between: what it was given by the strike
//   (`bare`, which dies by Ring, the metal and Wear) times what the mouth
//   leaves of it (`mouth`, log2). A strike therefore clicks nowhere and adds
//   to what rings as power.
// - The word is damping. A strike wakes every partial. After it, a partial
//   under the mouth's envelope dies to its place there at a held-down rate,
//   the sooner the further it lies outside the vowel; one that the next vowel
//   wants comes up again more slowly, out of what its neighbours have. Outside
//   the vowel the ring itself is shorter as well, so the word gets purer.
// - The envelope is four formants with skirts that fall as a resonance does,
//   and a floor under the first so that the note is always there. What it
//   takes away in power is partly given back, so Clarity is colour before
//   level; how far the lips are shut (Open) is not given back.
// - Above C5 too few partials are left to draw a vowel, and the same word is
//   said as a tilt: open vowels are bright and closed ones dark.
// - Each bell says its own word from its strike on. The last one struck is
//   the teacher: the others move to its mouth (Contagion up) or to the mouth
//   opposite to it (down), in about a fifth of the speaking time. The strike
//   also rings the bells that are held awake, up to what they were struck to.
// - Sing: while the key is down a partial falls no further than a share of
//   its strike. Air: the partials flutter, and noise goes through the mouth.
// - One pitch is one bell, held by every id that struck it. A strike on it
//   says the word anew.
//
// Control runs on a tick of 64 samples at 44.1 and 48 kHz (128 at 88.2 and
// 96), that restarts with a strike that finds nothing ringing, so the output
// does not depend on the block size.

#include <initializer_list>

#include "bell.h"
#include "params.gen.h"

namespace livemix {

class BronzeVowels : public kit::DeviceBase<bronze_vowels::kNumParams> {
 public:
  static constexpr int kMaxVoices = 10;
  static constexpr int kPartials = bronze::kPartials;
  static constexpr int kSlots = bronze::kSlots;
  enum Mallet : int { kFelt = 0, kWood, kNail, kBreath };
  enum Meter : int { kMeterJaw = 0, kMeterTongue, kMeterLevel };

  void init(float sample_rate) {
    using namespace bronze_vowels;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    if (!made_) {
      for (int m = 0; m < bronze::kMetals; ++m) bronze::make_metal(m, &metals_[m]);
      made_ = true;
    }
    for (int v = 0; v < bronze::kNumVowels; ++v) bronze::mouth_of(v, vowels_[v]);
    for (Voice& voice : voices_) voice = Voice();
    chunk_ = 64 * kit::clamp_int(static_cast<int>(sr / 48000.0f + 0.5f), 1, kMaxChunk / 64);
    dt_ = static_cast<float>(chunk_) / sr;
    chunk_left_ = 0;
    stamp_ = 0;
    tuning_ = 1;
    noise_scale_ = std::sqrt(sr * (1.0f / 48000.0f));
    top_hz_ = kit::min(kTopHz, 0.45f * sr);
    for (kit::Smoother* knob : {&stray_, &clarity_, &tract_, &contagion_, &hum_, &beat_, &sing_, &air_, &width_}) {
      knob->set_time(0.03f, 1.0f / dt_);
    }
    volume_.set_time(0.02f, sr);
    set_knobs(false);
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    using namespace bronze_vowels;
    if (!store_param(id, value)) return;
    set_knobs(primed());
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const int metal = choice(bronze_vowels::kMetal, bronze::kMetals);
    if (count_sounding() == 0) restart();

    Voice* same = nullptr;
    Voice* waiting = nullptr;
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (!same && (voice.pending ? voice.pending_frequency == frequency && voice.pending_metal == metal
                                  : voice.frequency == frequency && voice.metal == metal)) {
        same = &voice;
        continue;
      }
      // Every other bell this id held is let go.
      if (voice.drop(note_id) && voice.pending && voice.holders == 0) waiting = &voice;
    }
    if (same) {
      same->hold(note_id);
      same->stamp = ++stamp_;
      if (same->pending) {
        same->pending_gain = kit::max(same->pending_gain, gain);
        same->follow = expected(same->pending_gain);
      } else {
        strike(*same, gain, false);
      }
      return;
    }
    Voice& voice = waiting ? *waiting : voices_[pick()];
    const bool taken = voice.sounding;
    voice.holders = 0;
    voice.hold(note_id);
    voice.stamp = ++stamp_;
    if (taken) {
      // Fade what it rang over three ticks (4 ms), then strike.
      if (!voice.pending) voice.steal = kStealTicks;
      voice.pending = true;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
      voice.pending_metal = metal;
      voice.follow = expected(gain);
    } else {
      start(voice, metal, frequency, gain);
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
        chunk_left_ = chunk_;
      }
      const int n = kit::clamp_int(frames - done, 1, chunk_left_);
      alignas(16) float left[kMaxChunk * kLanes], right[kMaxChunk * kLanes];
      float air_left[kMaxChunk], air_right[kMaxChunk];
      for (int i = 0; i < n * kLanes; ++i) left[i] = right[i] = 0.0f;
      for (int i = 0; i < n; ++i) air_left[i] = air_right[i] = 0.0f;
      for (Voice& voice : voices_) {
        if (!voice.sounding) continue;
        voice.render_partials(n, left, right);
        voice.render_air(n, width_.value, air_left, air_right);
      }
      for (int i = 0; i < n; ++i) {
        float l = air_left[i], r = air_right[i];
        for (int k = 0; k < kLanes; ++k) {
          l += left[i * kLanes + k];
          r += right[i * kLanes + k];
        }
        const float volume = volume_.next();
        out_left_[done + i] = kit::soft_clip(l * volume);
        out_right_[done + i] = kit::soft_clip(r * volume);
      }
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // The last bell struck that rings: its mouth's first two formants and its
  // level. With none, the mouth of the vowel Er and 0.
  float meter(int index) const {
    const Voice* voice = teacher();
    const float* mouth = voice ? voice->said : vowels_[bronze::kEr];
    switch (index) {
      case kMeterJaw:
        return std::exp2(mouth[0]);
      case kMeterTongue:
        return std::exp2(mouth[1]);
      case kMeterLevel:
        return voice ? voice->follow : 0.0f;
      default:
        return 0.0f;
    }
  }

 private:
  static constexpr int kLanes = bronze::kLanes;
  static constexpr int kGroups = bronze::kGroups;
  static constexpr int kMaxChunk = 256;
  static constexpr int kStealTicks = 3;
  static constexpr int kLook = 4;  // ticks between two looks at the mouth's envelope
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kEdgeHz = 11000.0f;  // partials fade out between these
  static constexpr float kTopHz = 15000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kLevel = 0.185f;      // a strike at full gain, as the root of its partials' power
  static constexpr float kStack = 1.15f;       // how far a bell struck again may go over one strike
  static constexpr float kQuick = 0.03f;       // seconds: the shortest Swell, which is a strike
  static constexpr float kSilence = 1.0e-7f;
  static constexpr float kChoke = 0.15f;       // seconds, Damp on release 1
  static constexpr float kAirLevel = 2.0f;
  static constexpr float kLoudHalf = 0.80f;    // the halves of a pair
  static constexpr float kSoftHalf = 0.38f;
  static constexpr float kWhite = 0.52f;       // how far Clarity brings every partial to one level
  static constexpr float kGiveBack = 0.9f;    // of the power the mouth takes away
  static constexpr float kDeepest = 9.0f;      // log2: how far a mouth can shut a partial out (54 dB)
  static constexpr float kOpposite = -2.4f;    // the middle height of a formant, log2

  using Voice = bronze::Bell;

  static int partial_of(int slot) { return slot < 2 * bronze::kPairs ? slot >> 1 : slot - bronze::kPairs; }

  int choice(int id, int count) const { return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, count - 1); }

  int count_sounding() const {
    int count = 0;
    for (const Voice& voice : voices_) count += voice.sounding ? 1 : 0;
    return count;
  }

  // The last bell struck that rings.
  const Voice* teacher() const {
    const Voice* best = nullptr;
    for (const Voice& voice : voices_) {
      if (voice.sounding && !voice.pending && (!best || voice.stamp > best->stamp)) best = &voice;
    }
    return best;
  }

  // An idle voice, else the quietest let go, else the quietest held, the
  // oldest on a tie; one a strike already waits in only when there is no other.
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
    using namespace bronze_vowels;
    stray_.set(param(kStray), glide);
    clarity_.set(param(kClarity), glide);
    tract_.set(param(kTract) * (1.0f / 12.0f), glide);
    contagion_.set(param(kContagion), glide);
    hum_.set(param(kHum), glide);
    beat_.set(param(kBeat), glide);
    sing_.set(param(kSing), glide);
    air_.set(param(kAir), glide);
    width_.set(param(kWidth), glide);
    volume_.set(kit::db_to_gain(param(kVolume)), glide);
  }

  // A strike that finds nothing ringing: every knob is where it points, and
  // the control clock starts with the sound.
  void restart() {
    set_knobs(false);
    ++tuning_;
    chunk_left_ = 0;
  }

  // --- strikes -----------------------------------------------------------------

  static float loudness(float gain) { return gain * (0.75f + 0.25f * gain); }
  static float expected(float gain) { return kit::max(kLevel * loudness(gain), kSilence); }

  // A number in [0, 1) that is always the same for one partial of one key.
  static float scatter(uint32_t a, uint32_t b) {
    uint32_t x = a * 2654435761u + b * 40503u + 977u;
    x ^= x >> 15;
    x *= 2246822519u;
    x ^= x >> 13;
    return static_cast<float>(x >> 8) * (1.0f / 16777216.0f);
  }

  void start(Voice& voice, int metal, float frequency, float gain) {
    voice.renew();
    voice.sounding = true;
    voice.metal = metal;
    voice.frequency = frequency;
    const float midi = kit::hz_to_midi(frequency);
    const uint32_t key = static_cast<uint32_t>(midi * 8.0f + 0.5f);
    voice.key = key;
    voice.rng.seed(0xB2017Eu + key * 7919u);
    voice.air_rng.seed(0xA117u + key * 15485863u);
    voice.flutter_rng.seed(0x51A7Eu + key * 104729u);
    for (int s = 0; s < kSlots; ++s) {
      // The halves of a pair start apart, each pair by an amount of its own, so
      // the beats do not swell together; bells struck together start at different places, so their strikes do not pile up.
      const int p = partial_of(s);
      const float turn = 0.46f * midi + 1.0f * scatter(static_cast<uint32_t>(p), 5u) +
                         (s < 2 * bronze::kPairs && (s & 1) ? 0.8f * (scatter(static_cast<uint32_t>(p) + 40u, key) - 0.5f) : 0.0f);
      voice.re[s] = kit::SineTable::cos_lookup(turn);
      voice.im[s] = kit::SineTable::lookup(turn);
    }
    const bronze::MetalTable& table = metals_[metal];
    for (int p = 0; p < kPartials; ++p) {
      voice.keep[p] = table.keep[p];
      voice.octave[p] = bronze::log2_of(table.ratio[p]);
    }
    const float x = kit::clamp((midi - 60.0f) * (1.0f / 24.0f), -1.0f, 1.0f);
    voice.pace = x + 0.35f * (scatter(key, 3u) - 0.5f);
    voice.delay = 0.5f + 0.5f * x;
    const float above = kit::clamp((midi - 71.0f) * (1.0f / 9.0f), 0.0f, 1.0f);
    voice.high = above * above * (3.0f - 2.0f * above);
    voice.key_pan = 0.35f * (scatter(key, 11u) - 0.5f);
    tune(voice);
    strike(voice, gain, true);
  }

  // What the strike gives each partial, as a root of power 1 together.
  // `plain` is the mallet alone: no metal, no strike point, nothing faded.
  void shares(const Voice& voice, float gain, bool plain, float* out) const {
    using namespace bronze_vowels;
    const bronze::MetalTable& table = metals_[voice.metal];
    const int mallet = choice(kMallet, 4);
    // What Clarity makes even is little of the mallet, and part of Hardness.
    const float hardness = plain ? 0.45f + 0.4f * (param(kHardness) - 0.45f) : param(kHardness);
    const float tuned = kit::max(1.0f - 2.0f * param(kStray), 0.0f), raw = kit::max(2.0f * param(kStray) - 1.0f, 0.0f);
    static const float kSoft[4] = {330.0f, 1500.0f, 1900.0f, 500.0f};
    static const float kHard[4] = {3000.0f, 7000.0f, 5500.0f, 4000.0f};
    const float size = std::pow(voice.frequency * (1.0f / 220.0f), 0.33f);
    float cut = kSoft[mallet] * std::pow(kHard[mallet] / kSoft[mallet], hardness);
    if (plain) {
      const float felt = kSoft[kFelt] * std::pow(kHard[kFelt] / kSoft[kFelt], hardness);
      cut = felt * std::pow(cut / felt, 0.25f);
    }
    cut *= size * std::exp2(2.8f * (gain - 0.8f));
    const float thin = mallet == kNail && !plain ? 2.0f * voice.frequency + 350.0f : 0.0f;
    // From the rim inwards: the place in half waves of the prime.
    const float point = 0.02f * std::pow(24.0f, param(kPoint));
    float power = 0.0f;
    for (int p = 0; p < kPartials; ++p) {
      const float hz = voice.hz[p];
      const float x = hz / cut;
      float level = plain ? 1.0f : table.level[p];
      level *= mallet == kFelt ? 1.0f / (1.0f + x * x) : 1.0f / std::sqrt(1.0f + x * x * (1.0f + 0.25f * x * x));
      if (thin > 0.0f) level *= 0.15f + 0.85f * hz * hz / (hz * hz + thin * thin);
      if (!plain) {
        float wave = kit::SineTable::lookup(0.5f * point * kit::max(table.ratio[p], 1.0f));
        wave = wave < 0.0f ? -wave : wave;
        level *= p < 2 ? 0.5f + 0.5f * wave : 0.04f + 1.15f * wave;
        // What does not fit the key is silent in a tuned metal and louder in a raw one.
        if (p > 1) level *= table.fade[p] > 0.5f ? 1.0f + 0.8f * tuned - 0.55f * raw : (1.0f - tuned) * (1.0f + raw);
      }
      const float dull = hz * (1.0f / 5000.0f);
      level /= 1.0f + dull * dull;
      // Under 60 Hz a partial is mud and no note.
      const float low = hz * (1.0f / 48.0f);
      level *= low * low / (1.0f + low * low);
      out[p] = level * voice.edge[p];
      if (p > 0) power += out[p] * out[p];
    }
    const float scale = 1.0f / std::sqrt(power + 1.0e-6f);
    for (int p = 0; p < kPartials; ++p) out[p] *= scale;
    // The hum comes on top of that power, and never louder than a part of it.
    out[0] = out[0] / std::sqrt(1.0f + out[0] * out[0]);
  }

  void strike(Voice& voice, float gain, bool fresh) {
    using namespace bronze_vowels;
    float share[kPartials];
    shares(voice, gain, false, share);
    float usual[kPartials];
    shares(voice, 0.75f, true, usual);
    const bronze::MetalTable& table = metals_[voice.metal];
    const int mallet = choice(kMallet, 4);
    const float hardness = param(kHardness);
    // Few partials are left on a high key, so each has a little more.
    const float even = table.gain * (mallet == kBreath ? 0.78f : 1.0f) * std::pow(kit::clamp(voice.frequency * (1.0f / 260.0f), 0.5f, 8.0f), 0.1f);
    const float level = kLevel * loudness(gain) * even;
    const float full = kStack * kLevel * even;
    for (int p = 0; p < kPartials; ++p) {
      const float hit = level * share[p];
      voice.from[p] = voice.bare[p];
      const float both = std::sqrt(hit * hit + voice.bare[p] * voice.bare[p]);
      voice.to[p] = kit::min(both, kit::max(full * share[p], voice.bare[p]));
    }
    static const float kTouch[4] = {0.010f, 0.004f, 0.002f, 0.5f};
    const float touch = kTouch[mallet] * (1.6f - 1.1f * hardness);
    voice.attack = kit::max(touch, param(kSwell));
    // A low key has its vowels high up among its partials.
    const float white = kWhite * (1.0f + 0.3f * kit::clamp((190.0f - voice.frequency) * (1.0f / 120.0f), 0.0f, 1.0f));
    for (int p = 0; p < kPartials; ++p) {
      // Some metals bring their high partials up late.
      const float bloom = table.bloom * kit::clamp(0.25f + voice.octave[p] * 0.25f, 0.0f, 1.0f);
      voice.late[p] = voice.attack / (voice.attack + bloom);
      voice.white[p] = p == 0 ? 0.0f : white * kit::clamp(-bronze::log2_of(usual[p] + 1.0e-6f) - 1.0f, 0.0f, 7.0f);
    }
    static const float kPunch[4] = {0.25f, 0.8f, 0.15f, 0.0f};
    // A quick strike stands out from what rings after it, a swell does not.
    const float quick = kit::clamp(1.0f - std::log2(param(kSwell) * (1.0f / kQuick)) * 0.3f, 0.0f, 1.0f);
    voice.punch_to = kPunch[mallet] * quick;
    if (fresh) voice.punch = voice.punch_to;
    voice.breathy = mallet == kBreath ? 1.0f : 0.0f;
    voice.at = 0.0f;
    voice.struck = true;
    // A strike rings the other bells that are held awake.
    const float force = kit::min(2.0f * loudness(gain), 1.0f);
    for (Voice& other : voices_) {
      if (&other != &voice && other.sounding && !other.pending) other.lit = kit::max(other.lit, force);
    }
    // The word begins anew; what the mouth was saying goes over into it.
    float own[bronze::kMouth];
    own_mouth(voice, own);
    voice.position = 0.5f * param(kStagger) * voice.delay;
    voice.word = choice(kWord, bronze::kWords);
    float anew[bronze::kMouth];
    own_mouth(voice, anew);
    for (int j = 0; j < bronze::kMouth; ++j) {
      voice.off[j] = fresh ? 0.0f : voice.off[j] + own[j] - anew[j];
      voice.said[j] = anew[j] + voice.off[j];
    }
    if (fresh) {
      look_at_mouth(voice);
      // A quick strike wakes everything; a swell arrives with its vowel.
      const float open = (0.15f + 0.6f * hardness) * (0.4f + 0.8f * gain) * kit::min(kQuick / voice.attack, 1.0f);
      for (int p = 0; p < kPartials; ++p) voice.mouth[p] = voice.want[p] * (1.0f - open);
    } else {
      const float open = 0.5f * kit::min(kQuick / voice.attack, 1.0f);
      for (int p = 0; p < kPartials; ++p) voice.mouth[p] *= 1.0f - open;
    }
    voice.look = 0;
    knock(voice, mallet, gain, hardness);
    voice.follow = kit::max(voice.follow, expected(gain));
  }

  // The mallet heard for itself, lower and longer on a big bell.
  void knock(Voice& voice, int mallet, float gain, float hardness) {
    const float amount = param(bronze_vowels::kKnock);
    const float sr = sample_rate();
    const float size = std::pow(kit::clamp(voice.frequency * (1.0f / 220.0f), 0.2f, 8.0f), 0.3f);
    static const float kHz[4][3] = {{92.0f, 163.0f, 271.0f}, {395.0f, 905.0f, 1690.0f}, {1750.0f, 3150.0f, 4700.0f}, {310.0f, 760.0f, 1250.0f}};
    static const float kQ[4] = {12.0f, 22.0f, 26.0f, 5.0f};
    static const float kSeconds[4] = {0.16f, 0.03f, 0.012f, 0.5f};
    static const float kGain[4] = {2.1f, 1.5f, 0.75f, 0.4f};
    const float level = amount * std::pow(amount + 1.0e-6f, 0.1f) * loudness(gain) * noise_scale_ * kLevel;
    bool other = false;
    for (int j = 0; j < 3; ++j) {
      const float hz = kit::min(kHz[mallet][j] * size * (0.75f + 0.5f * hardness), 0.4f * sr);
      const float g = kit::tan_prewarp(kit::kPi * hz / sr);
      const float k = 1.0f / kQ[mallet];
      voice.next1[j] = 1.0f / (1.0f + g * (g + k));
      voice.next2[j] = g * voice.next1[j];
      voice.next3[j] = g * voice.next2[j];
      // One level whatever the place and the sharpness, from a burst that is
      // shorter than it rings.
      voice.next_gain[j] = k * 30.0f * std::sqrt(kQ[mallet] * kQ[mallet] / hz) / (1.0f + 0.5f * static_cast<float>(j));
      other = other || voice.next1[j] != voice.b1[j];
    }
    voice.next_knock = kGain[mallet] * level / std::sqrt(kSeconds[mallet] * 30.0f);
    voice.next_step = std::exp(-kSixtyDb / (kSeconds[mallet] * 3.0f * sr));
    // What rings of another mallet fades over a tick first.
    if (other && (voice.knock > 0.0f || voice.body > 0.0f)) {
      voice.swap = 2;
    } else {
      take_mallet(voice);
    }
    if (mallet == kBreath) {
      voice.puff = kit::max(voice.puff, 4.0f * level);
      voice.puff_step = std::exp(-kSixtyDb * dt_ / 1.4f);
    }
  }

  static void take_mallet(Voice& voice) {
    for (int j = 0; j < 3; ++j) {
      voice.b1[j] = voice.next1[j];
      voice.b2[j] = voice.next2[j];
      voice.b3[j] = voice.next3[j];
      voice.bg[j] = voice.next_gain[j];
    }
    voice.knock = kit::max(voice.knock, voice.next_knock);
    voice.knock_step = voice.next_step;
    voice.swap = 0;
  }

  // The halves of a pair: the faster they beat, the deeper.
  static float soft_of(float beat) { return kSoftHalf + (0.6f - kSoftHalf) * kit::min(beat * 0.16f, 1.0f); }
  static float loud_of(float beat) { return kLoudHalf + (0.64f - kLoudHalf) * kit::min(beat * 0.16f, 1.0f); }

  // --- pitch and place -----------------------------------------------------------

  void tune(Voice& voice) {
    const bronze::MetalTable& table = metals_[voice.metal];
    const float sr = sample_rate();
    // Half way up the metal is as it is cast; from there on it is stretched.
    const float pulled = kit::min(2.0f * stray_.value, 1.0f);
    const float stretched = 1.0f + 0.4f * kit::max(2.0f * stray_.value - 1.0f, 0.0f);
    const float beat = beat_.value;
    const float top = top_hz_;
    // Large bells turn more slowly.
    const float slow = std::sqrt(kit::clamp(voice.frequency * (1.0f / 220.0f), 0.1f, 1.0f));
    const float soft_half = soft_of(beat), loud_half = loud_of(beat);
    for (int p = 0; p < kPartials; ++p) {
      const float tuned = bronze::log2_of(table.tuned[p]);
      const float ratio = bronze::exp2_of(stretched * (tuned + pulled * (voice.octave[p] - tuned)));
      voice.ratio[p] = ratio;
      voice.hz[p] = p == 0 ? 0.5f * voice.frequency : (p == 1 ? voice.frequency : voice.frequency * ratio);
      voice.edge[p] = kit::clamp((top - voice.hz[p]) * (1.0f / (kTopHz - kEdgeHz)), 0.0f, 1.0f);
    }
    int live = 0;
    for (int s = 0; s < kSlots; ++s) {
      const int p = partial_of(s);
      float hz = voice.hz[p];
      if (s < 2 * bronze::kPairs) {
        // The louder half stands nearer the note, so their middle is in tune.
        const float part = p == 0 ? 0.35f : 0.65f + 0.75f * scatter(static_cast<uint32_t>(p), voice.key);
        hz += (s & 1 ? -loud_half : soft_half) * beat * slow * part / (loud_half + soft_half);
      }
      if (voice.edge[p] <= 0.0f || hz < 4.0f) {
        voice.cw[s] = 1.0f;
        voice.sw[s] = 0.0f;
        continue;
      }
      const float w = kit::kTwoPi * hz / sr;
      voice.cw[s] = std::cos(w);
      voice.sw[s] = std::sin(w);
      live = s + 1;
    }
    voice.live = live;
    place(voice);
    voice.tuned = tuning_;
  }

  // One half of a pair to each side, single partials to alternate sides; the
  // hum and the note stay near the middle. No half is turned over, so the two
  // speakers add up to the same bell.
  void place(Voice& voice) {
    const float soft_half = soft_of(beat_.value), loud_half = loud_of(beat_.value);
    const float width = width_.value * metals_[voice.metal].wide;
    for (int s = 0; s < kSlots; ++s) {
      const int p = partial_of(s);
      const bool pair = s < 2 * bronze::kPairs;
      const float side = ((pair ? s + p : p) & 1) ? 1.0f : -1.0f;
      const float far = p == 0 ? 0.25f : (p == 1 ? 0.6f : 0.65f + 0.35f * scatter(static_cast<uint32_t>(s), 23u));
      float left, right;
      kit::pan_gains(width * kit::clamp(side * far + voice.key_pan, -1.0f, 1.0f), &left, &right);
      const float part = pair ? (s & 1 ? soft_half : loud_half) : 1.0f;
      voice.pl[s] = part * left * voice.edge[p];
      voice.pr[s] = part * right * voice.edge[p];
    }
  }

  // --- the mouth -----------------------------------------------------------------

  // The mouth a bell would have by itself: its place along its word.
  void own_mouth(const Voice& voice, float* out) const {
    const int* word = bronze::word_row(voice.word);
    float x = voice.position - 2.0f * std::floor(voice.position * 0.5f);
    if (x > 1.0f) x = 2.0f - x;
    x *= static_cast<float>(bronze::kStations - 1);
    const int at = kit::clamp_int(static_cast<int>(x), 0, bronze::kStations - 2);
    float t = x - static_cast<float>(at);
    t = t * t * (3.0f - 2.0f * t);
    const float* a = vowels_[word[at]];
    const float* b = vowels_[word[at + 1]];
    for (int j = 0; j < bronze::kMouth; ++j) out[j] = a[j] + (b[j] - a[j]) * t;
  }

  void move_mouth(Voice& voice, const Voice* teacher) {
    using namespace bronze_vowels;
    const float speak = param(kSpeak);
    voice.position += dt_ / speak * bronze::exp2_of(2.0f * param(kStagger) * voice.pace);
    if (voice.position >= 2.0f) voice.position -= 2.0f;
    float own[bronze::kMouth];
    // A word changed while it is said goes over from the mouth it had.
    const int word = choice(kWord, bronze::kWords);
    if (word != voice.word) {
      float before[bronze::kMouth];
      own_mouth(voice, before);
      voice.word = word;
      own_mouth(voice, own);
      for (int j = 0; j < bronze::kMouth; ++j) voice.off[j] += before[j] - own[j];
    } else {
      own_mouth(voice, own);
    }
    const float c = contagion_.value;
    const float toward = teacher && teacher != &voice ? (c < 0.0f ? -c : c) : 0.0f;
    const float seconds = kit::clamp(0.22f * speak, 0.05f, 1.6f);
    const float step = 1.0f - bronze::exp2_of(-1.4427f * dt_ / seconds);
    const float* middle = vowels_[bronze::kEr];
    // A bell that has come round to another's vowel says it more clearly.
    voice.taught = flush_denormal(voice.taught + ((c > 0.0f ? toward : 0.0f) - voice.taught) * step);
    for (int j = 0; j < bronze::kMouth; ++j) {
      float goal = 0.0f;
      if (toward > 0.0f) {
        float other = teacher->said[j];
        // The opposite mouth: each formant as far on the other side of the
        // middle one, its heights exchanged as well.
        if (c < 0.0f) {
          if (j < 2) other = 2.0f * middle[j] - other;
          else if (j < 4) other = middle[j];
          else if (j < 8) other = kit::clamp(2.0f * kOpposite - other, -7.0f, -0.3f);
          else if (j > bronze::kOpen) other = 2.0f * middle[j] - other;
        }
        goal = toward * (other - own[j]);
      }
      voice.off[j] = flush_denormal(voice.off[j] + (goal - voice.off[j]) * step);
      voice.said[j] = own[j] + voice.off[j];
    }
  }

  // What the mouth leaves of every partial, and how fast each dies.
  void look_at_mouth(Voice& voice) {
    using namespace bronze_vowels;
    float f[4], inverse[4], height[4];
    const float sr = sample_rate();
    for (int j = 0; j < bronze::kFormants; ++j) {
      f[j] = kit::clamp(bronze::exp2_of(voice.said[j] + tract_.value), 60.0f, 9000.0f);
      const float half = 0.085f * f[j] + 34.0f;
      inverse[j] = 1.0f / half;
      height[j] = bronze::exp2_of(voice.said[bronze::kFormants + j]);
      const float hz = kit::min(f[j], 0.4f * sr);
      const float g = kit::tan_prewarp(kit::kPi * hz / sr);
      const float k = 2.4f * half / f[j];
      voice.a1[j] = 1.0f / (1.0f + g * (g + k));
      voice.a2[j] = g * voice.a1[j];
      voice.a3[j] = g * voice.a2[j];
      voice.kg[j] = k * height[j];
    }
    const float clarity = clarity_.value;
    const float deep = clarity * (1.0f + 0.5f * clarity) * (1.0f + 0.5f * voice.taught);
    const float high = voice.high;
    const float tilt = voice.said[bronze::kTilt];
    const float chest = bronze::exp2_of(voice.said[bronze::kChest]);
    const float under = 1.0f / f[0];
    alignas(16) float want[kPartials];
    for (int p = 0; p < kPartials; ++p) {
      const float hz = voice.hz[p];
      const float x0 = (hz - f[0]) * inverse[0], x1 = (hz - f[1]) * inverse[1];
      const float x2 = (hz - f[2]) * inverse[2], x3 = (hz - f[3]) * inverse[3];
      float u = hz * under;
      u *= u;
      const float sum = height[0] / (1.0f + x0 * x0) + height[1] / (1.0f + x1 * x1) + height[2] / (1.0f + x2 * x2) +
                        height[3] / (1.0f + x3 * x3) + chest / (1.0f + u * u);
      float drawn = bronze::log2_of(sum);
      drawn = drawn < -kDeepest ? -kDeepest : drawn;
      const float octave = voice.octave[p] > 0.0f ? voice.octave[p] : 0.0f;
      float tilted = tilt * octave;
      tilted = tilted < -kDeepest ? -kDeepest : tilted;
      want[p] = deep * (drawn + (tilted - drawn) * high) + clarity * (1.0f - 0.6f * high) * voice.white[p];
    }
    // The ring: Ring and the metal, Wear, and shorter outside the vowel. A
    // key let go adds what takes it to its choke.
    const float ring = param(kRing) * metals_[voice.metal].ring *
                       std::pow(kit::clamp(voice.frequency * (1.0f / 220.0f), 0.2f, 16.0f), -0.22f);
    const float wear = param(kWear);
    const float slope = 0.15f + 2.1f * wear;  // of the metal's own law
    const float octaves = 1.1f * wear * wear;
    voice.choke = 0.0f;
    if (voice.released()) {
      const float hand = param(kRelease);
      const float by_hand = std::pow(hand, 1.4f);
      const float seconds = ring * std::pow(kit::min(kChoke / ring, 1.0f), by_hand) *
                            (1.0f + (metals_[voice.metal].let * (1.0f - 0.6f * voice.breathy) - 1.0f) * kit::min(6.0f * hand, 1.0f) * (1.0f - by_hand));
      voice.choke = kit::max(kSixtyDb / seconds - kSixtyDb / ring, 0.0f);
    }
    const float base = kSixtyDb / ring;
    for (int p = 0; p < kPartials; ++p) {
      const float above = voice.octave[p] > 0.0f ? voice.octave[p] : 0.0f;
      const float brief = bronze::exp2_of(above * octaves - slope * bronze::log2_of(voice.keep[p]));
      const float outside = 1.0f + 0.12f * kit::max(-want[p], 0.0f);
      const float nepers = base * brief * outside + voice.choke;
      voice.want[p] = want[p];
      voice.decay[p] = bronze::exp2_of(-1.442695f * dt_ * kit::min(nepers, 400.0f));
    }
  }

  // --- once a tick ---------------------------------------------------------------

  void control() {
    if (!stray_.settled() || !beat_.settled()) {
      stray_.next();
      beat_.next();
      ++tuning_;
    }
    clarity_.next();
    tract_.next();
    contagion_.next();
    hum_.next();
    sing_.next();
    air_.next();
    const bool wider = !width_.settled();
    width_.next();
    for (Voice& voice : voices_) {
      if (!voice.sounding || !voice.pending) continue;
      if (--voice.steal < 0) start(voice, voice.pending_metal, voice.pending_frequency, voice.pending_gain);
    }
    // All learn from the mouth the teacher had a tick ago, whatever their order.
    const Voice* first = teacher();
    for (Voice& voice : voices_) {
      if (voice.sounding && !voice.pending && &voice != first) move_mouth(voice, first);
    }
    if (first) move_mouth(const_cast<Voice&>(*first), first);
    for (Voice& voice : voices_) {
      if (!voice.sounding) continue;
      if (voice.tuned != tuning_) {
        tune(voice);
      } else if (wider) {
        place(voice);
      }
      control_voice(voice);
    }
  }

  void control_voice(Voice& voice) {
    using namespace bronze_vowels;
    voice.age += dt_;
    if (--voice.look < 0) {
      look_at_mouth(voice);
      voice.look = kLook - 1;
    }
    // The level each partial has from the strike.
    float coming = 0.0f;
    {
      const bool rising = voice.struck;
      const float before = rising ? voice.at / voice.attack : 1.0e9f;
      voice.at += rising ? dt_ : 0.0f;
      const float now = rising ? voice.at / voice.attack : 1.0e9f;
      // A hand on a bell that is still coming up stops what would have come.
      const float hand = rising && voice.choke > 0.0f ? bronze::exp2_of(-1.442695f * dt_ * kit::min(voice.choke, 400.0f)) : 1.0f;
      bool done = true;
      const float lit = voice.released() ? 0.0f : voice.lit * (contagion_.value < 0.0f ? -contagion_.value : contagion_.value);
      const float awake = lit, waking = 1.0f - bronze::exp2_of(-1.442695f * dt_ * 7.0f * lit);
      voice.lit = voice.lit < 1.0e-4f ? 0.0f : voice.lit * bronze::exp2_of(-1.442695f * dt_ / 0.6f);
      const float sing = voice.released() ? 0.0f : sing_.value;
      const float fed = sing * (0.4f + 0.5f * sing) * metals_[voice.metal].feed * (1.0f + 0.3f * voice.breathy);
      const float rise = bronze::exp2_of(-1.442695f * dt_ / 0.7f);
      const float dim = 1.5f * param(kWear) * param(kWear) + 0.3f * param(kWear);
      for (int p = 0; p < kPartials; ++p) {
        if (rising) {
          voice.from[p] *= hand;
          voice.to[p] *= hand;
          float e = now * voice.late[p];
          if (e < 1.0f || before * voice.late[p] < 1.0f) {
            done = done && e >= 1.0f;
            e = e < 1.0f ? e * e * (3.0f - 2.0f * e) : 1.0f;
            voice.bare[p] = voice.from[p] + (voice.to[p] - voice.from[p]) * e;
            coming = kit::max(coming, voice.to[p]);
            continue;
          }
        }
        const float above = voice.octave[p] > 0.0f ? voice.octave[p] : 0.0f;
        const float rest = fed * voice.to[p] * bronze::exp2_of(-dim * above);
        const float over = voice.bare[p] - rest;
        const float kept = over > 0.0f ? voice.decay[p] : rise;
        float bare = rest + over * kept;
        const float called = awake * voice.to[p] - bare;
        if (called > 0.0f) bare += called * waking;
        voice.bare[p] = bare < 1.0e-10f ? 0.0f : bare;
      }
      voice.struck = rising && !done;
    }
    // The mouth: falling is dying, coming up again is slower.
    const float speak = param(kSpeak);
    const float fall = dt_ * 7.5f / kit::clamp(0.10f + 0.05f * speak, 0.10f, 0.45f);
    const float rise = dt_ * 7.5f / kit::clamp(0.06f + 0.09f * speak, 0.10f, 0.8f);
    const float near = kit::min(dt_ * (1.0f / 0.05f), 1.0f);
    alignas(16) float amp[kPartials];
    float power = 0.0f, left_over = 0.0f;
    // A bell another strike rings awake opens its mouth a little first.
    const float closed = voice.released() ? 1.0f : 1.0f - 0.8f * voice.lit * kit::max(contagion_.value, -contagion_.value);
    for (int p = 0; p < kPartials; ++p) {
      float step = (voice.want[p] * closed - voice.mouth[p]) * near;
      step = step < -fall ? -fall : (step > rise ? rise : step);
      voice.mouth[p] += step;
      amp[p] = voice.bare[p] * bronze::exp2_of(voice.mouth[p]);
    }
    for (int p = 1; p < kPartials; ++p) {
      power += voice.bare[p] * voice.bare[p];
      left_over += amp[p] * amp[p];
    }
    // Part of what the mouth took is given back.
    const float lost = (power + 1.0e-20f) / (left_over + 1.0e-20f);
    const float back = bronze::exp2_of(kit::clamp(0.5f * kGiveBack * bronze::log2_of(lost), -2.0f, 2.8f));
    const float open = bronze::exp2_of(clarity_.value * kit::min(voice.said[bronze::kOpen], 0.0f));
    if (voice.at < voice.attack) {
      voice.bump += (1.0f - voice.bump) * kit::min(3.0f * dt_ / voice.attack, 1.0f);
    } else {
      voice.bump = voice.bump < 1.0e-6f ? 0.0f : voice.bump * bronze::exp2_of(-1.4427f * dt_ / 0.16f);
    }
    voice.punch += (voice.punch_to - voice.punch) * kit::min(dt_ / 0.02f, 1.0f);
    const float gain = back * open * (1.0f - voice.punch * (1.0f - voice.bump));
    const float hum = 1.6f * hum_.value;
    amp[0] *= hum;
    const float loud = std::sqrt(left_over + amp[0] * amp[0]) * gain;
    flutter(voice, amp, gain);
    if ((!voice.struck || voice.released()) && !voice.pending) voice.follow = loud;
    const float fade = voice.pending ? static_cast<float>(voice.steal) / static_cast<float>(kStealTicks) : 1.0f;
    const float per = 1.0f / static_cast<float>(chunk_);
    alignas(16) float slot[kSlots];
    for (int s = 0; s < 2 * bronze::kPairs; ++s) slot[s] = amp[s >> 1] * fade;
    for (int p = bronze::kPairs; p < kPartials; ++p) slot[p + bronze::kPairs] = amp[p] * fade;
    for (int s = 0; s < kSlots; ++s) {
      const float l = voice.tl[s], r = voice.tr[s];
      voice.gl[s] = l;
      voice.gr[s] = r;
      const float to_l = slot[s] * voice.pl[s], to_r = slot[s] * voice.pr[s];
      voice.tl[s] = to_l;
      voice.tr[s] = to_r;
      voice.dl[s] = (to_l - l) * per;
      voice.dr[s] = (to_r - r) * per;
      // What rounding did to the unit length over a tick.
      const float right = 1.5f - 0.5f * (voice.re[s] * voice.re[s] + voice.im[s] * voice.im[s]);
      voice.re[s] *= right;
      voice.im[s] *= right;
    }
    for (int g = 0; g < kGroups; ++g) {
      float most = 0.0f;
      for (int s = g * kLanes; s < (g + 1) * kLanes; ++s) most += voice.gl[s] + voice.gr[s] + voice.tl[s] + voice.tr[s];
      voice.on[g] = most >= 1.0e-9f;
    }
    breathe(voice, loud, open, fade, per);
    const bool quiet = loud < kSilence && voice.knock < kSilence && voice.body < kSilence && voice.puff < kSilence && voice.air_to < kSilence;
    const bool fed = !voice.released() && sing_.target > 0.0f && quiet_fed(voice);
    const bool done = !voice.struck || (voice.released() && coming < kSilence);
    if (quiet && done && !voice.pending && !fed) retire(voice);
  }

  // A held key with Sing up keeps its bell even while its lips are shut.
  bool quiet_fed(const Voice& voice) const {
    float most = 0.0f;
    for (int p = 1; p < kPartials; ++p) most = kit::max(most, voice.bare[p]);
    return most > 1.0e-6f;
  }

  // Air makes the partials waver, the high ones more than the low.
  void flutter(Voice& voice, float* amp, float gain) {
    const float air = air_.value;
    const float depth = kit::min(0.9f * air * air + 0.25f * air, 1.0f);
    if (depth <= 0.0f) {
      for (int p = 0; p < kPartials; ++p) amp[p] *= gain;
      return;
    }
    const float follow = 1.0f - bronze::exp2_of(-1.442695f * dt_ / 0.018f);
    const float loud = std::sqrt((2.0f - follow) / follow) * 1.1f * depth;
    for (int p = 0; p < kPartials; ++p) {
      voice.flutter[p] += (voice.flutter_rng.bipolar() - voice.flutter[p]) * follow;
      const float more = kit::clamp(0.35f + 0.22f * voice.octave[p], 0.1f, 1.0f);
      amp[p] *= gain * kit::max(1.0f + loud * more * voice.flutter[p], 0.0f);
    }
  }

  // How much air goes through the mouth over the tick to come.
  void breathe(Voice& voice, float loud, float open, float fade, float per) {
    const float air = kit::max(air_.value, voice.breathy * (0.55f + 0.5f * air_.value));
    const float breath = clarity_.value * kit::clamp(voice.said[bronze::kBreathe], 0.0f, 1.0f);
    const float share = air * std::pow(air + 1.0e-6f, 0.25f);
    float to = (0.8f * share + breath * breath * (0.25f + air)) * kAirLevel * loud * noise_scale_;
    if (voice.puff > 0.0f) {
      const float up = kit::min(voice.age * (1.0f / 0.09f), 1.0f);
      to += voice.puff * up * open;
      voice.puff = voice.puff < 1.0e-9f ? 0.0f : voice.puff * voice.puff_step;
    }
    voice.air = voice.air_to;
    voice.air_to = to * fade;
    voice.air_step = (voice.air_to - voice.air) * per;
    voice.airy = voice.air > 1.0e-8f || voice.air_to > 1.0e-8f;
    if (voice.knock < 1.0e-8f) voice.knock = 0.0f;
    float body = 0.0f;
    for (int j = 0; j < 3; ++j) {
      body += voice.bg[j] * (std::fabs(voice.bc1[j]) + std::fabs(voice.bc2[j]));
    }
    voice.body = body;
    if (voice.knock == 0.0f && body < kSilence) {
      voice.body = 0.0f;
      for (int j = 0; j < 3; ++j) voice.bc1[j] = voice.bc2[j] = 0.0f;
    }
    voice.fade_step = (fade - voice.fade) * per;
    voice.knock_fade_step = 0.0f;
    if (voice.swap == 2) {
      voice.knock_fade = 1.0f;
      voice.knock_fade_step = -per;
      voice.swap = 1;
    } else if (voice.swap == 1) {
      for (int j = 0; j < 3; ++j) voice.bc1[j] = voice.bc2[j] = 0.0f;
      voice.knock = 0.0f;
      voice.knock_fade = 1.0f;
      take_mallet(voice);
    }
    for (int j = 0; j < 4; ++j) {
      voice.ic1[j] = flush_denormal(voice.ic1[j]);
      voice.ic2[j] = flush_denormal(voice.ic2[j]);
    }
  }

  void retire(Voice& voice) {
    voice.sounding = voice.pending = false;
    voice.holders = 0;
    voice.follow = 0.0f;
  }

  Voice voices_[kMaxVoices];
  bronze::MetalTable metals_[bronze::kMetals] = {};
  float vowels_[bronze::kNumVowels][bronze::kMouth] = {};
  kit::Smoother stray_, clarity_, tract_, contagion_, hum_, beat_, sing_, air_, width_;  // once a tick
  kit::Smoother volume_;                                                                  // every sample
  kit::IdleGate idle_;
  uint32_t stamp_ = 0, tuning_ = 1;
  int chunk_ = 64, chunk_left_ = 0;
  float dt_ = 0.0f, noise_scale_ = 1.0f, top_hz_ = kTopHz;
  bool made_ = false;
};

}  // namespace livemix
