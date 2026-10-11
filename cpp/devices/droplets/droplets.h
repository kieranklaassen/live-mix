#pragma once

// Droplets: tuned rain on the keys you hold.
//
//   key down ──► its own drop, at once ──┐
//                                        ├─► a drop (one of 32):
//   keys held ─► the rain: when, on      │     partials of the surface ─► contact ramp ─┐
//                which key, which octave ┘     splash: a burst of band-passed noise ────┴─► pan ─┐
//                                                                                                │
//                                                       out ◄─ soft clip ◄─ volume ◄─ all drops ─┘
//
// - A key going down always sounds one drop on that key at once, at the
//   key's own pitch and loudness and in the middle, so the instrument
//   answers the hands; the rain is what scatters (Width). After
//   that the rain falls at Rain drops a second over all the held keys
//   together, not per key: a bigger chord is spelled out, not louder.
// - When a drop is due is counted in whole steps of 2^-32 of a drop per
//   sample, so the moment it lands does not depend on how the host cuts the
//   time into blocks. Loose 0 waits exactly one period between drops and
//   climbs the held keys in order of pitch, going up an octave each time
//   round as far as Spread allows; Loose 1 waits a random (exponential) time
//   and takes any key and any octave within Spread. Between the two, the
//   wait is a mix of both and each drop is random with that probability.
// - Bursts switches the rate between flurries (up to four times Rain, a
//   quarter of the time) and lulls (down to nothing), so the count over time
//   stays Rain.
// - A released key stays in the rain for Trail seconds while its share, the
//   rate (once no key is held) and the loudness of its drops fall away.
// - A drop is up to four partials, each one complex number turned and shrunk
//   a little every sample, the sound its imaginary part: it starts from zero
//   as a struck thing does. What the partials are is the material:
//     Glass  1 : 2.32 : 4.25 (a wine glass), a thin ping
//     Wood   1 : 4 : 9.9 (a tuned bar), the upper two gone at once: a knock
//     Metal  1 : 2 : 3 : 4.2 (a bell without its minor third), long
//     Water  one sine that climbs to the note in a few hundredths of a
//            second, as a bubble does, and dies fast
//     Felt   the note and a trace of its octave behind a slow contact
//   Ring time follows the pitch, (440 / f)^e, and the upper partials die
//   faster by 1 + d·(ratio - 1). A smoothstep ramp as long as the contact
//   time opens every drop; Size lengthens it, darkens the partials, slows
//   the bubble and lowers the splash.
// - The splash is white noise through a band-pass that belongs to the
//   material, dying in a few milliseconds (a few hundredths for water).
// - A drop is settled when it falls: Material, Size, Ring, Soft, Splash and
//   Width are read then, and a ringing drop keeps what it got. It ends on an
//   exact sample, 110 dB under where it began.
// - The rain against the strike. A chord's strike is one drop for every key
//   at once and the rain is shared, so left alone a held chord is a loud
//   strike and something faint after it. Three things hold the two together:
//   a drop of the rain lands a little harder than a key's own, and harder
//   the fuller the chord (by the fourth root of the keys in the rain: 3.5 dB
//   for five); Soft draws most drops near how the key was played and only a
//   few far under it; and the rain is thinned only once drops pile up. Each
//   surface says how many drops' worth of ring (Rain × ring time, a drop
//   shorter than half a second counting as that long) may sound before its
//   drops are thinned, and from there a drop is scaled towards
//   1 / sqrt(that count), which holds the level of a shower where it is. A
//   key's own drop is never thinned.
// - With all 32 voices ringing, the quietest fades over 2 ms and the new
//   drop falls then.
// - Everything random comes from five generators seeded in init(), so the
//   same keys after init() give the same rain. Each drop carries its own
//   noise generator: a shared one would hand out its values in an order that
//   depends on the block size. Its seed is scattered first, so no two drops
//   play the same noise a sample apart.
//
// The instrument sleeps once no key is in the rain and the last drop is out.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Droplets : public kit::DeviceBase<droplets::kNumParams> {
 public:
  static constexpr int kMaxKeys = 16;
  static constexpr int kMaxDrops = 32;
  static constexpr int kModes = 4;
  enum Material : int { kGlass = 0, kWood, kMetal, kWater, kFelt, kNumMaterials };

  void init(float sample_rate) {
    using namespace droplets;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (Key& key : keys_) key = Key();
    for (Drop& drop : drops_) drop = Drop();
    for (Drop& drop : waiting_) drop = Drop();
    num_keys_ = 0;
    sounding_ = 0;
    stamp_ = 0;
    // The first notes after init() are what a preview plays and what is
    // heard first, so these three are seeds whose opening is like the rain
    // at large: the first sixteen waits near their mean with none over 2.4
    // gaps, the first drops over all the keys and both sides, loud and soft.
    timing_.seed(0x116A274u);
    flurries_.seed(0x0F1A2B3Cu);
    choice_.seed(0x1000058u);
    colour_.seed(0x10001C9u);
    seeds_.seed(0x5EED5EEDu);
    chunk_left_ = 0;
    until_ = kOneDrop;
    step_ = 0;
    flurry_ = true;
    flurry_left_ = 0.0f;
    cursor_hz_ = -1.0f;
    cursor_slot_ = -1;
    round_ = 0;
    upward_ = true;
    noise_gain_ = std::sqrt(sr / kVoicedRate);
    fade_step_ = 1.0f / (kStealSeconds * sr);
    volume_.set_time(kSmoothingSeconds, sr);
    volume_.snap(kit::db_to_gain(param(kVolume)));
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    if (!store_param(id, value)) return;
    // Rain, Bursts and Trail are read on the control clock or when a key is
    // let go; the rest when a drop falls.
    if (id == droplets::kVolume) volume_.set(kit::db_to_gain(param(id)), primed());
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kit::min(kMaxHz, 0.4f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (num_keys_ == 0) {
      // Nothing sounds: a Volume moved in the silence has arrived. (Decided
      // here, on an exact sample, and not on waking, which the block size moves.)
      if (sounding_ == 0) volume_.snap(volume_.target);
      begin_rain();
    }
    Key& key = take_key(note_id);
    key.note_id = note_id;
    key.hz = frequency;
    key.gain = gain;
    key.weight = 1.0f;
    key.held = true;
    key.stamp = ++stamp_;
    fall(key, 0, 1.0f, 0.0f, false);
  }

  void note_off(int note_id) {
    for (Key& key : keys_) {
      if (!key.used || !key.held || key.note_id != note_id) continue;
      const float trail = param(droplets::kTrail) * sample_rate();
      if (trail < 1.0f) {
        key.used = false;
        --num_keys_;
      } else {
        key.held = false;
        key.left = key.total = trail;
      }
      return;
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(num_keys_ > 0 || sounding_ > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    int done = 0;
    while (done < frames) {
      // One stretch with nothing happening in it: up to the next control
      // step and the next drop, 32 samples at most.
      int n = frames - done;
      if (n > kChunk) n = kChunk;
      if (num_keys_ > 0) {
        if (chunk_left_ == 0) {
          control();
          chunk_left_ = kChunk;
        }
        while (num_keys_ > 0 && until_ <= 0) {
          rain_drop();
          until_ += gap();
        }
        if (n > chunk_left_) n = chunk_left_;
        if (step_ > 0) {
          const int64_t due = (until_ + step_ - 1) / step_;  // samples until the next drop, 1 or more
          if (due < n) n = static_cast<int>(due);
        }
      }
      float left[kChunk] = {}, right[kChunk] = {};
      if (sounding_ > 0) {
        for (int v = 0; v < kMaxDrops; ++v) {
          if (drops_[v].sounding) render(v, n, left, right);
        }
      }
      for (int i = 0; i < n; ++i) {
        const float volume = volume_.next();
        out_left_[done + i] = kit::soft_clip(left[i] * volume);
        out_right_[done + i] = kit::soft_clip(right[i] * volume);
      }
      if (num_keys_ > 0) {
        until_ -= step_ * n;
        chunk_left_ -= n;
      }
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kChunk = 32;  // control period, samples
  static constexpr int64_t kOneDrop = static_cast<int64_t>(1) << 32;  // the rain's clock counts drops in 2^-32
  static constexpr float kVoicedRate = 48000.0f;  // the splash levels were set at this rate
  static constexpr float kMinHz = 16.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kTopDropHz = 5000.0f;      // an octave that would take a drop above this is not taken
  static constexpr float kTopPartialHz = 16000.0f;  // partials above this do not exist, at any sample rate,
  static constexpr float kTopOfBand = 0.45f;        // nor above this share of a low one
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kLifeDb = 110.0f;  // a partial is put out this far under where it began
  static constexpr float kReferenceHz = 440.0f;
  // The ring law is held between three octaves above its reference and far below it.
  static constexpr float kShortestLaw = 0.125f;
  static constexpr float kLongestLaw = 6.0f;
  static constexpr float kShortestRing = 0.02f;  // seconds
  static constexpr float kLongestRing = 20.0f;
  static constexpr float kStealSeconds = 0.002f;
  static constexpr float kDropGain = 0.5f;
  static constexpr float kLeastRing = 0.5f;    // a shorter drop counts as this long (seconds) when the rain is thinned
  static constexpr float kRainGain = 1.1f;     // a drop of the rain on one key against the key's own, before it is thinned
  static constexpr float kSoftOctaves = 4.0f;  // Soft 1 spreads the drops over this many halvings of level (24 dB)
  static constexpr float kTiltHz = 800.0f;     // above this a drop is 1.8 dB softer per octave
  static constexpr float kTilt = 0.3f;
  static constexpr float kTrailFloor = 0.4f;   // the level of the last drops of a trail
  // Flurries: this many times Rain for this share of the time, about this many drops each.
  static constexpr float kFlurryPace = 4.0f;
  static constexpr float kFlurryDrops = 6.0f;
  static constexpr float kLongestWait = 8.0f;  // a random wait is never longer than this many mean gaps
  // The bubble: how far under the note it starts and how long it takes to get there, small to large.
  static constexpr float kBubbleDepth[2] = {0.18f, 0.4f};
  static constexpr float kBubbleSeconds[2] = {0.012f, 0.05f};
  static constexpr int kBubbleStep = 8;        // samples between two retunings of a rising bubble
  static constexpr float kSplashDb = 100.0f;   // a splash is put out this far under where it began

  // What sets one material apart from the next.
  struct Surface {
    int count;
    float ratio[kModes];
    float level[kModes];
    float seconds;   // the fundamental's ring to -60 dB at 440 Hz, Ring 1, Size in the middle
    float exponent;  // ring time goes as (440 / f)^exponent
    float damping;   // extra decay rate per unit of ratio above the fundamental
    float contact[2];       // seconds the drop takes to speak, small to large
    float splash_hz;        // centre of the splash at Size 0.46 (for a thud, its top)
    float splash_q;
    float splash_seconds;   // its ring to -60 dB at Size 0.5
    float splash_level;     // set so that at Splash 1 it peaks about where the drop does (over many drops, Size 0.5)
    bool thud;              // low-passed noise, not band-passed
    float gain;             // evens out how loud a drop is across materials
    float dense;            // drops' worth of ring (Rain × seconds) from which the rain's drops are thinned
  };

  static constexpr Surface kSurfaces[kNumMaterials] = {
      // Glass: the lowest modes of a wine glass, thin and bright, with a tick.
      {3, {1.0f, 2.32f, 4.25f, 0.0f}, {1.0f, 0.4f, 0.2f, 0.0f}, 1.6f, 0.5f, 0.4f, {0.00025f, 0.0015f}, 7000.0f, 1.0f, 0.004f, 3.4f, false, 1.0f, 4.5f},
      // Wood: a bar tuned to 1 : 4 : 9.9, the upper modes gone in a moment, with a knock.
      {3, {1.0f, 4.0f, 9.9f, 0.0f}, {1.0f, 0.8f, 0.4f, 0.0f}, 0.4f, 0.8f, 0.8f, {0.0005f, 0.003f}, 1600.0f, 1.5f, 0.008f, 9.0f, false, 0.9f, 4.0f},
      // Metal: a bell's octave, twelfth and stretched double octave, long, with a tink.
      {4, {1.0f, 2.0f, 3.0f, 4.2f}, {1.0f, 0.5f, 0.35f, 0.22f}, 5.0f, 0.4f, 0.06f, {0.0002f, 0.0012f}, 9000.0f, 2.0f, 0.003f, 4.2f, false, 0.66f, 10.0f},
      // Water: one sine, a bubble, with the splash of the drop going in.
      {1, {1.0f, 0.0f, 0.0f, 0.0f}, {1.0f, 0.0f, 0.0f, 0.0f}, 0.25f, 0.3f, 0.0f, {0.001f, 0.004f}, 2800.0f, 1.2f, 0.03f, 2.9f, false, 1.3f, 3.5f},
      // Felt: the note and a trace of its octave behind a slow contact, with a thud.
      {2, {1.0f, 2.0f, 0.0f, 0.0f}, {1.0f, 0.12f, 0.0f, 0.0f}, 0.6f, 0.6f, 2.0f, {0.006f, 0.018f}, 400.0f, 0.7f, 0.012f, 16.0f, true, 1.2f, 3.5f},
  };

  // A key in the rain: held, or let go and trailing off.
  struct Key {
    int note_id = -1;
    float hz = 440.0f;
    float gain = 0.0f;
    float weight = 1.0f;               // 1 while held, down to 0 over the trail
    float left = 0.0f, total = 1.0f;   // samples of trail to go, and at the release
    uint32_t stamp = 0;                // the order the keys went down in
    bool used = false, held = false;
  };

  struct Drop {
    // Per partial: the state, the turn with its decay in it, and the age at
    // which it has rung out. Partials are in order of ratio, so of ring time.
    float re[kModes] = {}, im[kModes] = {};
    float step_re[kModes] = {}, step_im[kModes] = {};
    int end[kModes] = {};
    int count = 0;
    int age = 0, life = 0;  // samples
    int attack = 2;         // the contact ramp, samples
    float left = 0.7071f, right = 0.7071f;
    // For stealing: what the fundamental began at and its decay rate per sample.
    float amp = 0.0f, rate = 0.0f;
    // The bubble: samples the rise takes (-1 for none), how far under it starts.
    int rise = -1;
    float depth = 0.0f, hz = 0.0f, radius = 1.0f;
    // The splash: its own noise, band, level now, decay per sample and last sample.
    kit::Rng noise;
    kit::Svf band;
    float splash = 0.0f, splash_decay = 0.0f;
    int splash_end = 0;
    bool thud = false;
    float fade = 1.0f;     // a stolen drop on its way out
    bool fading = false;
    bool sounding = false;
  };

  int material() const {
    return kit::clamp_int(static_cast<int>(param(droplets::kMaterial) + 0.5f), 0, kNumMaterials - 1);
  }

  // The rain starts afresh with the first key: the control clock, the first
  // wait, a flurry (so Bursts never opens on a lull) and the bottom of the climb.
  void begin_rain() {
    chunk_left_ = 0;
    until_ = gap();
    flurry_ = true;
    flurry_left_ = flurry_seconds(param(droplets::kRain)) * sample_rate();
    cursor_hz_ = -1.0f;
    cursor_slot_ = -1;
    round_ = 0;
  }

  // The entry for a key going down: its own if it is still in the rain, a
  // free one, else the faintest trailing key's, else the oldest held one's.
  Key& take_key(int note_id) {
    int free = -1, faintest = -1, oldest = -1;
    for (int k = 0; k < kMaxKeys; ++k) {
      Key& key = keys_[k];
      if (!key.used) {
        if (free < 0) free = k;
      } else if (key.note_id == note_id) {
        return key;
      } else if (!key.held) {
        if (faintest < 0 || key.weight < keys_[faintest].weight) faintest = k;
      } else if (oldest < 0 || key.stamp < keys_[oldest].stamp) {
        oldest = k;
      }
    }
    if (free < 0) return keys_[faintest >= 0 ? faintest : oldest];
    keys_[free].used = true;
    ++num_keys_;
    return keys_[free];
  }

  // The wait before the next drop, in 2^-32 of the mean gap: exactly one at
  // Loose 0, exponential (random arrivals) at Loose 1.
  int64_t gap() {
    const float loose = param(droplets::kLoose);
    const float wait = kit::min(-std::log(1.0f - timing_.uniform()), kLongestWait);
    const double gaps = static_cast<double>(1.0f - loose + loose * wait);
    const int64_t steps = static_cast<int64_t>(gaps * static_cast<double>(kOneDrop));
    return steps > (kOneDrop >> 10) ? steps : (kOneDrop >> 10);
  }

  // How long the flurry or the lull that starts now lasts.
  float flurry_seconds(float rain) {
    const float on = kit::clamp(kFlurryDrops / (kFlurryPace * rain), 0.15f, 3.0f);
    return (flurry_ ? on : (kFlurryPace - 1.0f) * on) * (0.5f + flurries_.uniform());
  }

  // Every kChunk samples while a key is in the rain: the trails, the
  // flurries, and from them how fast the rain's clock runs.
  void control() {
    using namespace droplets;
    const float sr = sample_rate();
    float most = 0.0f;
    for (Key& key : keys_) {
      if (!key.used) continue;
      if (!key.held) {
        key.left -= static_cast<float>(kChunk);
        if (key.left <= 0.0f) {
          key.used = false;
          --num_keys_;
          continue;
        }
        key.weight = key.left / key.total;
      }
      most = kit::max(most, key.weight);
    }
    const float rain = param(kRain);
    flurry_left_ -= static_cast<float>(kChunk);
    if (flurry_left_ <= 0.0f) {
      flurry_ = !flurry_;
      flurry_left_ += flurry_seconds(rain) * sr;
    }
    const float bursts = param(kBursts);
    const float pace = flurry_ ? 1.0f + (kFlurryPace - 1.0f) * bursts : 1.0f - bursts;
    step_ = static_cast<int64_t>(static_cast<double>(rain * most * pace) / sr * static_cast<double>(kOneDrop));
  }

  // One drop of the rain: which key, which octave, how loud.
  void rain_drop() {
    using namespace droplets;
    const float spread = param(kSpread);
    int which, octave;
    if (choice_.uniform() < param(kLoose)) {
      which = any_key();
      // Every whole octave of Spread counts once, the part of one that is left for that part.
      const int whole = static_cast<int>(spread);
      octave = kit::clamp_int(static_cast<int>(choice_.uniform() * (spread + 1.0f)), 0, whole + 1);
    } else {
      which = next_key();
      octave = round_ % (1 + static_cast<int>(spread + 0.5f));
    }
    // Squared, so most drops fall near how the key was played and the soft ones are the fewer.
    const float softer = colour_.uniform();
    const float loudness = std::exp2(-kSoftOctaves * param(kSoft) * softer * softer);
    fall(keys_[which], octave, loudness, param(kWidth) * colour_.bipolar(), true);
  }

  // How many keys are in the rain, a trailing one counting for less as it goes.
  float keys_in_rain() const {
    float total = 0.0f;
    for (const Key& key : keys_) {
      if (key.used) total += key.weight;
    }
    return total;
  }

  // Any key in the rain, a trailing one less often as it goes.
  int any_key() {
    float at = choice_.uniform() * keys_in_rain();
    int last = 0;
    for (int k = 0; k < kMaxKeys; ++k) {
      if (!keys_[k].used) continue;
      last = k;
      at -= keys_[k].weight;
      if (at < 0.0f) break;
    }
    return last;
  }

  // The next key up from the last one the pulse played, by pitch, going
  // round; each time round counts, for the octave. A trailing key is passed
  // over more often as it goes.
  int next_key() {
    int next = 0;
    for (int tries = 0; tries < kMaxKeys; ++tries) {
      int lowest = -1;
      next = -1;
      for (int k = 0; k < kMaxKeys; ++k) {
        if (!keys_[k].used) continue;
        if (lowest < 0 || keys_[k].hz < keys_[lowest].hz) lowest = k;
        const bool after = keys_[k].hz > cursor_hz_ || (keys_[k].hz == cursor_hz_ && k > cursor_slot_);
        if (after && (next < 0 || keys_[k].hz < keys_[next].hz)) next = k;
      }
      if (next < 0) {
        next = lowest;
        ++round_;
      }
      cursor_hz_ = keys_[next].hz;
      cursor_slot_ = next;
      if (keys_[next].held || choice_.uniform() < keys_[next].weight) break;
    }
    return next;
  }

  // A drop lands on `key`, `octave` octaves up, at `loudness` (0 to 1) of
  // how the key was played, at `place` from left (-1) to right (1); `rain`
  // is false for a key's own drop. Everything about it is settled here.
  void fall(const Key& key, int octave, float loudness, float place, bool rain) {
    using namespace droplets;
    const float sr = sample_rate();
    const int kind = material();
    const Surface& surface = kSurfaces[kind];
    const float size = param(kSize);
    float hz = key.hz;
    for (; octave > 0; --octave) {
      if (hz * 2.0f <= kTopDropHz) hz *= 2.0f;
    }
    const float law = kit::clamp(std::pow(kReferenceHz / hz, surface.exponent), kShortestLaw, kLongestLaw);
    const float seconds =
        kit::clamp(surface.seconds * param(kRing) * 0.5f * std::exp2(2.0f * size) * law, kShortestRing, kLongestRing);
    // Its noise is drawn whether or not it is heard, so a silent drop does
    // not change the ones after it.
    const uint32_t noise_seed = seeds_.next_u32();

    const float hard = key.gain * loudness;  // how hard this drop lands
    // The denser the rain, the softer each of its drops; a key's own drop is not thinned.
    // A fuller chord strikes louder, so its rain falls harder too: by the
    // fourth root of the number of keys in it, which is 3.5 dB for five.
    // A drop that is over at once still counts as half a second of rain: a
    // patter of ticks piles up as surely as a wash of long notes.
    const float ringing = param(kRain) * kit::max(seconds, kLeastRing) / surface.dense;
    const float thin = rain ? kRainGain * std::sqrt(std::sqrt(kit::max(1.0f, keys_in_rain()))) * thinning(ringing) : 1.0f;
    const float tilt = hz > kTiltHz ? std::pow(kTiltHz / hz, kTilt) : 1.0f;
    const float amp = kDropGain * surface.gain * hard * (0.4f + 0.6f * key.gain) * thin * tilt *
                      (kTrailFloor + (1.0f - kTrailFloor) * key.weight);
    if (!(amp > 1.0e-6f)) return;

    // Drops swing up and down in turn, so the keys of a chord going down
    // together do not all push the same way at once.
    const float way = upward_ ? 1.0f : -1.0f;
    upward_ = !upward_;

    Drop drop;
    drop.sounding = true;
    drop.amp = amp;
    drop.rate = kSixtyDb / (seconds * sr);
    drop.life = static_cast<int>(seconds * sr * (kLifeDb / 60.0f)) + 1;
    drop.attack = static_cast<int>(kit::lerp(surface.contact[0], surface.contact[1], size) * sr);
    if (drop.attack < 2) drop.attack = 2;
    kit::pan_gains(place, &drop.left, &drop.right);

    // A larger and a softer drop light the upper partials less.
    const float bright = kit::lerp(1.5f, 0.4f, size) * (0.5f + 0.5f * hard);
    const float top = kit::min(kTopPartialHz, kTopOfBand * sr);
    for (int k = 0; k < surface.count; ++k) {
      const float partial_hz = hz * surface.ratio[k];
      if (partial_hz >= top) break;
      const float partial_seconds =
          kit::max(seconds / (1.0f + surface.damping * (surface.ratio[k] - 1.0f)), 0.25f * kShortestRing);
      const float radius = std::exp(-kSixtyDb / (partial_seconds * sr));
      const double angle = 2.0 * 3.14159265358979323846 * static_cast<double>(partial_hz) / static_cast<double>(sr);
      drop.step_re[k] = radius * static_cast<float>(std::cos(angle));
      drop.step_im[k] = radius * static_cast<float>(std::sin(angle));
      drop.re[k] = way * amp * surface.level[k] * (k == 0 ? 1.0f : bright);
      drop.end[k] = static_cast<int>(partial_seconds * sr * (kLifeDb / 60.0f)) + 1;
      drop.count = k + 1;
      if (k == 0) drop.radius = radius;
    }
    if (kind == kWater) {
      drop.rise = static_cast<int>(kit::lerp(kBubbleSeconds[0], kBubbleSeconds[1], size) * sr);
      if (drop.rise < 1) drop.rise = 1;
      drop.depth = kit::lerp(kBubbleDepth[0], kBubbleDepth[1], size);
      drop.hz = hz;
    }

    const float splash = param(kSplash);
    if (splash > 0.0f) {
      const float splash_seconds = surface.splash_seconds * (0.5f + size);
      drop.noise.seed(scatter(noise_seed));
      drop.thud = surface.thud;
      const float band_hz = kit::min(surface.splash_hz * std::exp2(0.6f - 1.3f * size), 0.4f * sr);
      drop.band.set(band_hz, surface.splash_q, sr);
      drop.splash = splash * splash * surface.splash_level * amp * noise_gain_ * band_makeup(band_hz, surface.splash_q, sr);
      drop.splash_decay = std::exp(-kSixtyDb / (splash_seconds * sr));
      drop.splash_end = static_cast<int>(splash_seconds * sr * (kSplashDb / 60.0f)) + 1;
      if (drop.life < drop.splash_end) drop.life = drop.splash_end;
    }
    place_drop(drop);
  }

  // The noise of one drop starts somewhere of its own in the generator's
  // round. Seeded with the next value of `seeds_` as it stands, every drop
  // would play the same noise one sample later than the drop before it: the
  // splashes of a chord's keys would be one splash five times over, and add
  // up as one.
  static uint32_t scatter(uint32_t x) {
    x *= 0x9E3779B1u;
    x ^= x >> 15;
    x *= 0x85EBCA77u;
    x ^= x >> 13;
    return x;
  }

  // White noise through the splash's band-pass comes out with a power of
  // rate × g k / (1 + g k + g²), g = tan(π f / rate), k = 1 / Q (the noise is
  // already scaled by sqrt(rate)). Far under half the sample rate that is the
  // same at every rate; near it the band is squeezed, and a tick at 10 kHz
  // was 2 dB louder at 96 kHz than at 48 kHz.
  static float band_power(float hz, float q, float sr) {
    const float g = std::tan(kit::kPi * hz / sr), k = 1.0f / q;
    return sr * g * k / (1.0f + g * k + g * g);
  }

  // What makes up for it, against the rate the splashes were voiced at.
  static float band_makeup(float hz, float q, float sr) {
    return std::sqrt(band_power(kit::min(hz, 0.4f * kVoicedRate), q, kVoicedRate) / band_power(hz, q, sr));
  }

  // How much softer a drop of the rain is when `dense` times the surface's count of drops ring
  // at once: hardly at all while they are few, then as 1 / sqrt(dense), which
  // holds the power of the whole where it is. (1 + dense^4)^(-1/8).
  static float thinning(float dense) {
    const float squared = dense * dense;
    return 1.0f / std::sqrt(std::sqrt(std::sqrt(1.0f + squared * squared)));
  }

  // A free voice, or the quietest: it fades over 2 ms and the drop falls then.
  void place_drop(const Drop& drop) {
    for (int v = 0; v < kMaxDrops; ++v) {
      if (drops_[v].sounding) continue;
      drops_[v] = drop;
      ++sounding_;
      return;
    }
    int quietest = 0;
    float lowest = 1.0e9f;
    for (int v = 0; v < kMaxDrops; ++v) {
      // A voice that is already giving way counts as the drop it waits for.
      const Drop& ringing = drops_[v];
      const float level = ringing.fading ? waiting_[v].amp
                                         : ringing.amp * std::exp(-ringing.rate * static_cast<float>(ringing.age));
      if (level < lowest) {
        lowest = level;
        quietest = v;
      }
    }
    drops_[quietest].fading = true;
    waiting_[quietest] = drop;
  }

  // The bubble's pitch `age` samples in: a cubic ease up to the note, on it
  // exactly from the end of the rise.
  static void tune_bubble(Drop& drop, int age, float sr) {
    const float to_go = age < drop.rise ? 1.0f - static_cast<float>(age) / static_cast<float>(drop.rise) : 0.0f;
    const double hz = static_cast<double>(drop.hz) * (1.0 - static_cast<double>(drop.depth * to_go * to_go * to_go));
    const double angle = 2.0 * 3.14159265358979323846 * hz / static_cast<double>(sr);
    drop.step_re[0] = drop.radius * static_cast<float>(std::cos(angle));
    drop.step_im[0] = drop.radius * static_cast<float>(std::sin(angle));
  }

  // `m` samples of the lowest N partials of a drop, all of them still ringing.
  // The partials are turned side by side: each is a chain of its own, and
  // one after the other they would wait on themselves.
  template <int N>
  static void turn(Drop& drop, float* mono, int m) {
    float re[N], im[N], step_re[N], step_im[N];
    for (int k = 0; k < N; ++k) {
      re[k] = drop.re[k];
      im[k] = drop.im[k];
      step_re[k] = drop.step_re[k];
      step_im[k] = drop.step_im[k];
    }
    for (int i = 0; i < m; ++i) {
      float sum = 0.0f;
      for (int k = 0; k < N; ++k) {
        const float turned = step_re[k] * re[k] - step_im[k] * im[k];
        im[k] = step_re[k] * im[k] + step_im[k] * re[k];
        re[k] = turned;
        sum += im[k];
      }
      mono[i] = sum;
    }
    for (int k = 0; k < N; ++k) {
      drop.re[k] = re[k];
      drop.im[k] = im[k];
    }
  }

  // The same for a bubble on its way up: one partial, retuned every few samples.
  void turn_bubble(Drop& drop, float* mono, int m, int age) {
    const float sr = sample_rate();
    float re = drop.re[0], im = drop.im[0];
    for (int i = 0; i < m; ++i) {
      const int at = age + i;
      if (at <= drop.rise && (at % kBubbleStep == 0 || at == drop.rise)) tune_bubble(drop, at, sr);
      const float turned = drop.step_re[0] * re - drop.step_im[0] * im;
      im = drop.step_re[0] * im + drop.step_im[0] * re;
      re = turned;
      mono[i] = im;
    }
    drop.re[0] = re;
    drop.im[0] = im;
  }

  // The next n samples of one drop into `mono`; past its life it is silent
  // and no longer sounding.
  void ring(Drop& drop, int n, float* mono) {
    for (int i = 0; i < n; ++i) mono[i] = 0.0f;
    const int age = drop.age;
    // In stretches over which the same partials ring: the highest of them is
    // the first to have rung out, on its own exact sample.
    int done = 0;
    while (done < n && drop.count > 0) {
      int m = drop.end[drop.count - 1] - (age + done);
      if (m <= 0) {
        --drop.count;
        continue;
      }
      if (m > n - done) m = n - done;
      if (age + done <= drop.rise) {
        turn_bubble(drop, mono + done, m, age + done);
      } else if (drop.count == 1) {
        turn<1>(drop, mono + done, m);
      } else if (drop.count == 2) {
        turn<2>(drop, mono + done, m);
      } else if (drop.count == 3) {
        turn<3>(drop, mono + done, m);
      } else {
        turn<4>(drop, mono + done, m);
      }
      done += m;
    }
    if (age < drop.attack) {
      const float scale = 1.0f / static_cast<float>(drop.attack);
      for (int i = 0; i < n && age + i < drop.attack; ++i) {
        const float x = static_cast<float>(age + i + 1) * scale;
        mono[i] *= x * x * (3.0f - 2.0f * x);
      }
    }
    if (age < drop.splash_end) {
      float level = drop.splash;
      for (int i = 0; i < n && age + i < drop.splash_end; ++i) {
        drop.band.process(drop.noise.bipolar());
        mono[i] += level * (drop.thud ? drop.band.low : drop.band.band * drop.band.k);
        level *= drop.splash_decay;
      }
      drop.splash = level;
    }
    drop.age = age + n;
    if (drop.age >= drop.life) drop.sounding = false;
  }

  void render(int slot, int n, float* left, float* right) {
    Drop& drop = drops_[slot];
    float mono[kChunk];
    int from = 0;
    if (drop.fading) {
      // Stolen: out over 2 ms (or to the end of its life, if that is sooner),
      // then the drop that waits for this voice falls, on that sample.
      const int alive = drop.life - drop.age;
      ring(drop, n, mono);
      while (from < n && from < alive && drop.fade > 0.0f) {
        drop.fade = kit::max(drop.fade - fade_step_, 0.0f);
        left[from] += mono[from] * drop.left * drop.fade;
        right[from] += mono[from] * drop.right * drop.fade;
        ++from;
      }
      if (from < alive && drop.fade > 0.0f) return;
      drop = waiting_[slot];
      if (from == n) return;
    }
    ring(drop, n - from, mono);
    for (int i = 0; i < n - from; ++i) {
      left[from + i] += mono[i] * drop.left;
      right[from + i] += mono[i] * drop.right;
    }
    if (!drop.sounding) --sounding_;
  }

  Key keys_[kMaxKeys];
  Drop drops_[kMaxDrops];
  Drop waiting_[kMaxDrops];  // the drop a stolen voice starts once it has faded
  kit::Rng timing_, flurries_, choice_, colour_, seeds_;
  kit::Smoother volume_;
  kit::IdleGate idle_;
  int64_t until_ = kOneDrop;  // what is left of the wait for the next drop
  int64_t step_ = 0;          // how much of it one sample takes
  int num_keys_ = 0;
  int sounding_ = 0;
  int chunk_left_ = 0;
  int cursor_slot_ = -1;
  int round_ = 0;
  uint32_t stamp_ = 0;
  float cursor_hz_ = -1.0f;
  float flurry_left_ = 0.0f;
  float noise_gain_ = 1.0f;
  float fade_step_ = 0.0f;
  bool flurry_ = true;
  bool upward_ = true;
};

}  // namespace livemix
