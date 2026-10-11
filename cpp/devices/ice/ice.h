#pragma once

// Ice: a frozen lake tuned to the keys.
//
//   key down ──┐                    ┌─► the strike: six partials, each a sine that
//              ├─► strike ──────────┤   starts at the top of the chirp and falls onto
//   the lake ──┘   (distance,       │   its own place, then lands in the ring
//   cracking by     loudness,       ├─► three shore echoes: the same, later, quieter,
//   itself          place)          │   darker, longer in the chirp, from either side
//                                   └─► snap: a few ms of bright noise
//
//   chirps ─► land ─► ring (per key: six modes, middle and side) ─┐
//   chirps in flight ──────────────────────────────────────────────┼─► width ─► volume ─► soft clip ─► out
//   snap ──────────────────────────────────────────────────────────┘
//
// - In a floating plate a bending wave of a higher frequency travels faster:
//   arrival time goes as one over the root of frequency. A crack far off is
//   therefore heard as a chirp that falls as one over time squared. Here a
//   partial that ends on `f` starts at `top` and follows
//
//       f(t) = f + (start - f) · s(t),   s(t) = (1 - (t/T)²)² / (1 + t/t0)²
//
//   t0 is set by Distance (kFarT0 · distance², so Distance 0 is a plain
//   ping), `start` by Bright. The pure law, 1 / (1 + t/t0)², never arrives (a
//   low note is still semitones sharp after thirty t0), so it is tapered to
//   reach the note, level, at T = kLand · t0 (1.6 s at most, which only the
//   far echoes reach): from there the partial is exactly on its place. Up to
//   two t0 a strike's curve is within 3.1 % of the pure law.
// - A crack is one sharp snap, and the ice spreads it out in time: what
//   arrives first, high and fast, is brief and faint, and the sound gathers
//   as the fall slows towards the note. So a partial in flight is softer the
//   further it still is above its place: its level is (place / where it is
//   now) to the power of three quarters, 4.5 dB for each octave. Over a whole
//   far strike every octave above the ring holds less than the one under it,
//   and the top is under the ring it lands in, to the ear as well (weighted
//   as the ear is, which hears 4 kHz far better than 100 Hz).
// - The partials do not start as one tone. The highest starts at the top that
//   Bright sets and each one under it a little lower (kStart, about half an
//   octave in all), each on a phase of its own drawn from a seeded generator:
//   a strike begins as a faint cluster, a splash, that fans out into the note
//   and its overtones. No partial crosses another on the way down.
// - A partial in flight is a phase-accumulating sine (the frequency is a
//   closed form of its age, so it is exact and costs one divide per arrival
//   and sample). It does not die on the way: its ring starts where it lands.
//   When it lands it becomes a mode of the key's ring: one
//   complex number turned and shrunk every sample, as in modal-bells. Landing is
//   adding the partial's amplitude and phase to that number, so strikes,
//   echoes and the lake's own cracks all end up in the same six modes and a
//   held key costs the same however often it is struck. The ring keeps a
//   middle and a side number per mode, so every arrival stays where it came
//   from between the speakers.
// - The ring: the note, four overtones at n · sqrt((1 + B·n²) / (1 + B)) with
//   B = kStiffness · stretch² (a stiff plate pulls them sharp), and with
//   Thick a body an octave under the note that dies sooner. Thick also leans
//   the levels: thin ice is mostly overtones, thick ice mostly note.
// - Shore: three more arrivals of the same strike at fixed later times, each
//   quieter, starting lower, with a longer t0, with only the note and two
//   overtones, alternating sides.
// - Cracks: while keys are held a seeded scheduler strikes one of the held
//   notes, a quarter of the time an octave up (in a voice of its own that
//   rings out), at kMaxRate · cracks³ a second with gaps between 0.4 and 1.6
//   of the mean. Roam spreads their distance, loudness and place.
// - A key struck again while its note rings strikes the same ring. A
//   released note rings out: nobody lays a hand on a lake.
//
// The instrument sleeps when no key is held and every ring is under -120 dB.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Ice : public kit::DeviceBase<ice::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kModes = 6;      // 0 the body, 1 the note, 2..5 overtones
  static constexpr int kEchoes = 3;
  static constexpr int kMaxChirps = 48; // strikes and echoes in flight or waiting

  void init(float sample_rate) {
    using namespace ice;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int i = 0; i < kTable + 2; ++i) {
      sine_[i] = static_cast<float>(std::sin(2.0 * 3.14159265358979323846 * i / kTable));
    }
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) pool_.voices[v] = Voice();
    for (Chirp& chirp : chirps_) chirp = Chirp();
    phase_rng_.seed(0x1CE0A11u);
    lake_rng_.seed(0x5EED1CEu);
    snap_rng_.seed(0x00C4AC6Bu);
    serial_ = 1;
    chunk_left_ = 0;
    until_ = 1.0f;
    waiting_ = false;
    snap_mid_ = snap_side_ = 0.0f;
    snap_low_ = 0.0f;
    snap_decay_ = kit::time_to_coeff(kSnapSeconds, sr);
    snap_pole_ = std::exp(-kit::kTwoPi * kSnapLowHz / sr);
    // White noise spreads over a wider band at a higher rate.
    snap_scale_ = kSnapGain * std::sqrt(sr / 48000.0f);
    steal_step_ = 1.0f / (kStealSeconds * sr);
    shed_ = std::pow(10.0f, -kShedDb / (20.0f * sr));
    width_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    width_.snap(param(kWidth));
    volume_.snap(kit::db_to_gain(param(kVolume)));
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    using namespace ice;
    if (!store_param(id, value)) return;
    switch (id) {
      case kRing:
      case kStretch:
        ++serial_;  // ringing notes follow on the control clock
        break;
      case kWidth:
        width_.set(param(kWidth), primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(param(kVolume)), primed());
        break;
      default:
        break;  // the next strike, or the scheduler's next step
    }
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // Nothing sounds: whatever moved in the silence has arrived, and the
    // control clock starts with the note (the same at every block size).
    if (pool_.count_active() == 0) arrive();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding || voice.fading || pool_.note_id_of(v) != note_id) continue;
      if (voice.pending) {
        if (!voice.held) continue;
        // Struck again before it could start: the waiting note is this one.
        voice.pending_frequency = frequency;
        voice.pending_gain = gain;
        return;
      }
      if (voice.frequency == frequency) {
        // The same key while its note still rings: strike that ring again.
        voice.held = true;
        voice.gain = gain;
        strike(v, gain, 1.0f, param(ice::kDistance), voice.place);
        return;
      }
      voice.held = false;
    }
    bool stolen = false;
    const int index = pool_.note_on(note_id, &stolen);
    Voice& voice = pool_.voices[index];
    if (stolen) {
      // Fade the old note over 2 ms, then start (see finish_steals).
      voice.pending = true;
      voice.fading = false;
      voice.held = true;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
      voice.follow = strength_of(gain);  // it counts as the new note from now
    } else {
      start(voice, frequency, gain, true);
      strike(index, gain, 1.0f, param(ice::kDistance), voice.place);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) {
      // Released before its stolen start: it never sounds.
      voice.pending = false;
      voice.fading = true;
    }
    voice.held = false;
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
      if (chunk_left_ == 0) {
        control();
        chunk_left_ = kChunk;
      }
      const int n = kit::clamp_int(frames - done, 1, chunk_left_);
      float mid[kChunk] = {}, side[kChunk] = {};
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (voice.sounding) render_ring(voice, n, mid, side);
      }
      for (Chirp& chirp : chirps_) {
        if (chirp.active) render_chirp(chirp, n, mid, side);
      }
      render_snap(n, mid, side);
      for (int i = 0; i < n; ++i) {
        const float wide = side[i] * width_.next();
        const float volume = volume_.next();
        out_left_[done + i] = kit::soft_clip((mid[i] + wide) * volume);
        out_right_[done + i] = kit::soft_clip((mid[i] - wide) * volume);
      }
      finish_steals(n);
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kChunk = 32;   // control period, samples
  static constexpr int kTable = 2048; // the sine a partial in flight reads
  static constexpr int kGhostNote = -0x1CE0001;  // the note id of a crack an octave up
  static constexpr float kMinHz = 16.0f;
  static constexpr float kMaxHz = 8400.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kTopOfBand = 0.45f;     // modes above this share of the sample rate do not exist
  static constexpr float kLowestBodyHz = 20.0f;

  // The chirp.
  static constexpr float kFarT0 = 0.06f;         // seconds: t0 at Distance 1
  static constexpr float kLand = 16.0f;          // a chirp is on its note after this many t0
  static constexpr float kMaxFlight = 1.6f;      // seconds, whatever t0 is
  static constexpr float kLowTop = 1500.0f;      // Hz: where the chirp starts, Bright 0
  static constexpr float kTopSpan = 8.0f;        // ... and Bright 1, this many times higher
  static constexpr float kChirpTopOfBand = 0.42f;
  // Where each partial starts, as a share of the top: the body lowest, the
  // highest overtone at the top, unevenly spaced so the cluster has no beat.
  static constexpr float kStart[kModes] = {0.66f, 0.72f, 0.79f, 0.84f, 0.93f, 1.0f};
  static constexpr int kGrid = 32;               // samples between two readings of a partial's level in flight
  static constexpr float kStrikeAttack = 0.0006f;  // seconds a strike takes to come up
  static constexpr float kEchoAttack = 0.004f;

  // The ring.
  static constexpr float kStiffness = 0.12f;     // B at Stretch 1
  static constexpr float kDamping = 0.7f;        // an overtone's ring time: Ring / ratio^kDamping
  static constexpr float kBodyRing = 0.4f;       // the body's, as a share of Ring
  static constexpr float kShortestRing = 0.05f;
  static constexpr float kThinTilt = 0.5f;       // level of overtone n: n^tilt
  static constexpr float kThickTilt = -1.5f;
  static constexpr float kThinNote = 0.7f;       // the note itself under thin ice
  static constexpr float kBody = 0.8f;           // the body at Thick 1, re the note
  static constexpr float kVelocityTilt = 0.5f;   // a harder strike is a brighter one
  static constexpr float kStrikeGain = 0.22f;    // one key at gain 0.7 peaks near -20 dBFS at the default volume
  static constexpr float kLean = 0.3f;           // how far a key sits to its side
  static constexpr float kSilence = 1.0e-6f;     // a released ring under this is over
  static constexpr float kGone = 1.0e-14f;       // a mode whose square is under this (-140 dB) is not turned any more
  // A ring holds what 1.8 of its hardest strikes would leave in it (in
  // amplitude; a strike puts half its power in the middle and side numbers).
  // A key struck over and over on a long ring, or a busy lake, goes no
  // further: what is over that is shed at kShedDb a second, until 1 dB under.
  static constexpr float kMostRing = 0.5f * (1.8f * kStrikeGain) * (1.8f * kStrikeGain);
  static constexpr float kShedDb = 30.0f;
  static constexpr float kShedUntil = 0.8f;

  // The shore.
  static constexpr float kEchoSeconds[kEchoes] = {0.31f, 0.73f, 1.27f};
  static constexpr float kEchoLevel[kEchoes] = {0.6f, 0.42f, 0.3f};
  static constexpr float kEchoTop[kEchoes] = {0.8f, 0.65f, 0.5f};      // of the strike's top
  static constexpr float kEchoStretch[kEchoes] = {1.5f, 2.1f, 2.8f};   // of the strike's t0 ...
  static constexpr float kEchoExtraT0 = 0.006f;                         // ... after adding this
  static constexpr float kEchoPlace[kEchoes] = {-0.7f, 0.8f, -0.5f};   // times the strike's side
  static constexpr int kEchoModes = 3;                                  // the note and two overtones

  // The lake.
  static constexpr float kMaxRate = 4.0f;        // cracks a second at Cracks 1
  static constexpr float kShortGap = 0.4f;       // a gap is between this and 1.6 of the mean
  static constexpr float kGapSpan = 1.2f;
  static constexpr float kSelfLevel = 0.5f;      // a crack of the lake's own, re the key's strike
  static constexpr float kRoamDistance = 0.6f;
  static constexpr float kRoamQuiet = 0.75f;
  static constexpr float kRoamPlace = 0.9f;
  static constexpr float kOctaveChance = 0.25f;
  static constexpr float kOctaveTopHz = 5000.0f; // no octave above a note that would land higher

  // The snap.
  static constexpr float kSnapSeconds = 0.0012f;
  static constexpr float kSnapLowHz = 3000.0f;   // high-pass: brittle, not a thump
  static constexpr float kSnapGain = 3.0f;
  static constexpr float kSnapFar = 0.6f;        // how much softer a far strike snaps
  static constexpr float kSnapFloor = 1.0e-7f;   // under this the snap is over

  static constexpr float kStealSeconds = 0.002f;

  struct Voice {
    // Per mode: frequency in cycles per sample (0 when the mode does not
    // exist), decay per sample, the two as one turn, and the state: a middle
    // and a side number.
    float inc[kModes] = {}, decay[kModes] = {};
    float step_re[kModes] = {}, step_im[kModes] = {};
    float mid_re[kModes] = {}, mid_im[kModes] = {};
    float side_re[kModes] = {}, side_im[kModes] = {};
    float frequency = 440.0f;
    float gain = 0.0f;   // of the key, for the lake's own cracks
    float place = 0.0f;
    float follow = 0.0f;
    float steal = 1.0f, steal_from = 1.0f;
    float pending_frequency = 440.0f, pending_gain = 0.0f;
    uint32_t tuned = 0;  // the serial these modes were last set from
    int flying = 0;      // chirps on their way to this ring
    bool sounding = false, held = false, pending = false, fading = false;
    bool shedding = false;  // the ring holds more than kMostRing and dies faster

    bool active() const { return sounding; }
    bool releasing() const { return !held; }
    float level() const { return follow; }
    bool leaving() const { return pending || fading; }
  };

  // One arrival: up to six partials on their way to the modes of a ring.
  struct Chirp {
    float phase[kModes] = {}, inc[kModes] = {}, dinc[kModes] = {};
    float amp[kModes] = {};
    float level[kModes] = {}, next_level[kModes] = {};  // in flight, at the two ends of the kGrid samples it is in
    int mode[kModes] = {};
    int count = 0, voice = 0;
    int wait = 0;    // samples before it arrives
    int age = 0, land = 0, attack = 1;
    int settled = 0;  // `land`, rounded up to kGrid: the age from which it can join the ring
    float top = 0.0f;                               // cycles per sample
    float rate = 0.0f, per_land = 0.0f;  // s = (1 - (age·per_land)²)² / (1 + age·rate)²
    float to_mid = 0.0f, to_side = 0.0f;
    bool active = false;
  };

  static float strength_of(float gain) { return kStrikeGain * gain * (0.35f + 0.65f * gain); }

  // A mode's frequency as a multiple of the note's.
  static float ratio(int k, float stiffness) {
    if (k == 0) return 0.5f;
    const float n = static_cast<float>(k);
    return n * std::sqrt((1.0f + stiffness * n * n) / (1.0f + stiffness));
  }

  float sine(float phase) const {
    const float position = phase * kTable;
    const int index = static_cast<int>(position);
    return sine_[index] + (sine_[index + 1] - sine_[index]) * (position - static_cast<float>(index));
  }

  // Nothing is sounding: the knobs are where they point and the control
  // clock runs on the next sample.
  void arrive() {
    width_.snap(width_.target);
    volume_.snap(volume_.target);
    chunk_left_ = 0;
    waiting_ = false;
  }

  void start(Voice& voice, float frequency, float gain, bool held) {
    for (int k = 0; k < kModes; ++k) {
      voice.mid_re[k] = voice.mid_im[k] = voice.side_re[k] = voice.side_im[k] = 0.0f;
    }
    voice.frequency = frequency;
    voice.gain = gain;
    voice.sounding = true;
    voice.held = held;
    voice.pending = voice.fading = false;
    voice.steal = voice.steal_from = 1.0f;
    voice.follow = 0.0f;
    voice.flying = 0;
    voice.shedding = false;
    // Keys alternate sides going up the keyboard.
    const int key = static_cast<int>(std::floor(kit::hz_to_midi(frequency) + 0.5f));
    voice.place = (key & 1) ? kLean : -kLean;
    tune(voice);
  }

  // Frequency and decay of every mode from the knobs as they stand.
  void tune(Voice& voice) {
    using namespace ice;
    const float sr = sample_rate();
    const float stretch = param(kStretch);
    const float stiffness = kStiffness * stretch * stretch;
    const float ring = param(kRing);
    for (int k = 0; k < kModes; ++k) {
      const float multiple = ratio(k, stiffness);
      const float hz = voice.frequency * multiple;
      const bool exists = hz < kTopOfBand * sr && (k > 0 || hz >= kLowestBodyHz);
      if (!exists) {
        voice.inc[k] = voice.decay[k] = voice.step_re[k] = voice.step_im[k] = 0.0f;
        voice.mid_re[k] = voice.mid_im[k] = voice.side_re[k] = voice.side_im[k] = 0.0f;
        continue;
      }
      const float seconds =
          kit::max(ring * (k == 0 ? kBodyRing : std::pow(multiple, -kDamping)), kShortestRing);
      voice.inc[k] = hz / sr;
      voice.decay[k] = std::exp(-kSixtyDb / (seconds * sr)) * (voice.shedding ? shed_ : 1.0f);
      const float w = kit::kTwoPi * voice.inc[k];
      voice.step_re[k] = voice.decay[k] * std::cos(w);
      voice.step_im[k] = voice.decay[k] * std::sin(w);
    }
    voice.tuned = serial_;
  }

  // What a strike puts into each mode: Thick leans the overtones against the
  // note and adds the body, a harder strike is a brighter one, and the whole
  // is as loud whatever the lean.
  void levels(const Voice& voice, float gain, float* level) const {
    const float thick = param(ice::kThick);
    const float tilt = kit::lerp(kThinTilt, kThickTilt, thick) + kVelocityTilt * (gain - 0.7f);
    float power = 0.0f;
    for (int k = 0; k < kModes; ++k) {
      if (voice.inc[k] <= 0.0f) {
        level[k] = 0.0f;
      } else if (k == 0) {
        level[k] = kBody * thick * thick;
      } else if (k == 1) {
        level[k] = kit::lerp(kThinNote, 1.0f, thick);
      } else {
        level[k] = std::pow(static_cast<float>(k), tilt);
      }
      power += level[k] * level[k];
    }
    const float even = power > 0.0f ? 1.0f / std::sqrt(power) : 0.0f;
    for (int k = 0; k < kModes; ++k) level[k] *= even;
  }

  // The ice breaks: the strike itself, its echoes off the shores, the snap.
  // `loud` scales a crack of the lake's own against the key's strike.
  void strike(int index, float gain, float loud, float distance, float place) {
    using namespace ice;
    Voice& voice = pool_.voices[index];
    const float sr = sample_rate();
    float level[kModes];
    levels(voice, gain, level);
    const float strength = strength_of(gain) * loud;
    const float t0 = kFarT0 * distance * distance * sr;
    const float top = kit::min(kLowTop * std::pow(kTopSpan, param(kBright)), kChirpTopOfBand * sr) / sr;
    launch(index, level, 0, kModes, strength, t0, top, place, 0, kStrikeAttack, true);

    const float shore = param(kShore);
    if (shore > 0.001f) {
      const float side = place < 0.0f ? -1.0f : 1.0f;
      float darker = 1.0f;
      for (int e = 0; e < kEchoes; ++e) {
        // Each echo loses more of the overtones than the one before.
        darker *= 0.7f;
        float dark[kModes] = {};
        for (int k = 1; k <= kEchoModes; ++k) dark[k] = level[k] * std::pow(darker, static_cast<float>(k - 1));
        launch(index, dark, 1, kEchoModes + 1, strength * shore * kEchoLevel[e],
               (t0 + kEchoExtraT0 * sr) * kEchoStretch[e], top * kEchoTop[e], side * kEchoPlace[e],
               static_cast<int>(kEchoSeconds[e] * sr), kEchoAttack, false);
      }
    }

    // Snaps that fall together add as noises of their own would, in power
    // (ten keys struck at once snap three times as loud as one, not ten),
    // and sit where most of that power came from.
    const float snap = snap_scale_ * param(kCrack) * strength * (1.0f - kSnapFar * distance);
    float to_mid, to_side;
    place_gains(place, &to_mid, &to_side);
    snap_mid_ = std::sqrt(snap_mid_ * snap_mid_ + snap * snap * to_mid * to_mid);
    const float side_power = snap_side_ * std::fabs(snap_side_) + snap * snap * to_side * std::fabs(to_side);
    snap_side_ = side_power < 0.0f ? -std::sqrt(-side_power) : std::sqrt(side_power);

    voice.follow = kit::max(voice.follow, strength);  // as loud as it will be, before it has sounded
  }

  // Where something sits between the speakers, as a share for the middle and
  // one for the side (left is middle plus side).
  static void place_gains(float place, float* to_mid, float* to_side) {
    float left, right;
    kit::pan_gains(place, &left, &right);
    *to_mid = 0.5f * (left + right);
    *to_side = 0.5f * (left - right);
  }

  // Send modes [first, last) of a ring an arrival: `t0` in samples, `top` in
  // cycles per sample, `wait` samples from now. When every slot is taken a
  // strike lands at once as a plain ping (`must`) and an echo is left out.
  void launch(int index, const float* level, int first, int last, float gain, float t0, float top,
              float place, int wait, float attack_seconds, bool must) {
    Voice& voice = pool_.voices[index];
    float to_mid, to_side;
    place_gains(place, &to_mid, &to_side);
    Chirp* chirp = nullptr;
    for (Chirp& slot : chirps_) {
      if (!slot.active) {
        chirp = &slot;
        break;
      }
    }
    if (chirp == nullptr) {
      if (!must) return;
      for (int k = first; k < last; ++k) {
        // On the real side, so the sound (the imaginary side) starts from zero.
        voice.mid_re[k] += gain * level[k] * to_mid;
        voice.side_re[k] += gain * level[k] * to_side;
      }
      return;
    }
    chirp->count = 0;
    bool sweeps = false;
    for (int k = first; k < last; ++k) {
      if (level[k] <= 0.0f || voice.inc[k] <= 0.0f) continue;
      const int j = chirp->count++;
      chirp->mode[j] = k;
      chirp->inc[j] = voice.inc[k];
      chirp->dinc[j] = kit::max(top * kStart[k] - voice.inc[k], 0.0f);
      chirp->amp[j] = gain * level[k];
      chirp->phase[j] = phase_rng_.uniform();
      sweeps = sweeps || chirp->dinc[j] > 0.0f;
    }
    if (chirp->count == 0) return;
    const float sr = sample_rate();
    chirp->attack = kit::clamp_int(static_cast<int>(attack_seconds * sr), 2, 4096);
    chirp->top = top;
    if (!sweeps || t0 < 1.0f) {
      // Too near to chirp: a ping, in its ring as soon as it has come up.
      chirp->rate = chirp->per_land = 0.0f;
      chirp->land = chirp->attack;
      for (int j = 0; j < chirp->count; ++j) chirp->dinc[j] = 0.0f;
    } else {
      chirp->rate = 1.0f / t0;
      const int flight = static_cast<int>(kit::min(kLand * t0, kMaxFlight * sr));
      chirp->land = flight > chirp->attack ? flight : chirp->attack;
      chirp->per_land = 1.0f / static_cast<float>(chirp->land);
    }
    chirp->settled = (chirp->land + kGrid - 1) / kGrid * kGrid;
    for (int j = 0; j < chirp->count; ++j) {
      chirp->level[j] = flight_level(*chirp, j, 0);
      chirp->next_level[j] = flight_level(*chirp, j, kGrid);
    }
    chirp->to_mid = to_mid;
    chirp->to_side = to_side;
    chirp->wait = wait;
    chirp->age = 0;
    chirp->voice = index;
    chirp->active = true;
    ++voice.flying;
  }

  // How much of its fall a chirp of this age still has before it: 1 at the
  // start, 0 from the moment it lands.
  static float fall(const Chirp& chirp, int age) {
    if (age >= chirp.land || chirp.rate <= 0.0f) return 0.0f;
    const float u = 1.0f + static_cast<float>(age) * chirp.rate;
    const float x = static_cast<float>(age) * chirp.per_land;
    const float taper = 1.0f - x * x;
    return taper * taper / (u * u);
  }

  // How loud partial `j` is at that age, against what it lands with: its
  // place over where it is now, to the power of three quarters.
  static float flight_level(const Chirp& chirp, int j, int age) {
    const float above = chirp.dinc[j] * fall(chirp, age);
    if (above <= 0.0f) return 1.0f;
    const float root = std::sqrt(chirp.inc[j] / (chirp.inc[j] + above));
    return root * std::sqrt(root);
  }

  // A chirp that has arrived becomes part of its ring: the same amplitude and
  // phase, from the next sample on turned by the mode instead of read from
  // the table.
  void land(Chirp& chirp) {
    Voice& voice = pool_.voices[chirp.voice];
    for (int j = 0; j < chirp.count; ++j) {
      const int k = chirp.mode[j];
      float quarter = chirp.phase[j] + 0.25f;
      if (quarter >= 1.0f) quarter -= 1.0f;
      const float re = chirp.amp[j] * sine(quarter);
      const float im = chirp.amp[j] * sine(chirp.phase[j]);
      voice.mid_re[k] += re * chirp.to_mid;
      voice.mid_im[k] += im * chirp.to_mid;
      voice.side_re[k] += re * chirp.to_side;
      voice.side_im[k] += im * chirp.to_side;
    }
    chirp.active = false;
    --voice.flying;
  }

  // Every kChunk samples: land what has arrived, follow the knobs, let the
  // lake crack, retire the rings that have died.
  void control() {
    using namespace ice;
    for (int v = 0; v < kMaxVoices; ++v) pool_.voices[v].follow = 0.0f;
    for (Chirp& chirp : chirps_) {
      if (!chirp.active) continue;
      if (chirp.wait == 0 && chirp.age >= chirp.settled) {
        land(chirp);
        continue;
      }
      Voice& voice = pool_.voices[chirp.voice];
      if (voice.tuned != serial_) retarget(chirp, voice);
      for (int j = 0; j < chirp.count; ++j) voice.follow += chirp.amp[j];
    }

    int held = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding) continue;
      if (voice.pending) {
        voice.follow = strength_of(voice.pending_gain);
        continue;
      }
      if (voice.fading) continue;
      if (voice.tuned != serial_) tune(voice);
      float energy = 0.0f;
      for (int k = 0; k < kModes; ++k) {
        const float mid = voice.mid_re[k] * voice.mid_re[k] + voice.mid_im[k] * voice.mid_im[k];
        const float side = voice.side_re[k] * voice.side_re[k] + voice.side_im[k] * voice.side_im[k];
        if (mid < kGone) voice.mid_re[k] = voice.mid_im[k] = 0.0f;
        if (side < kGone) voice.side_re[k] = voice.side_im[k] = 0.0f;
        energy += mid + side;
      }
      voice.follow += std::sqrt(energy);
      if ((energy > (voice.shedding ? kShedUntil : 1.0f) * kMostRing) != voice.shedding) {
        voice.shedding = !voice.shedding;
        tune(voice);
      }
      if (voice.held) {
        ++held;
      } else if (voice.flying == 0 && energy < kSilence * kSilence) {
        retire(voice);
      }
    }

    // The lake: while a key is down, a strike of its own now and then.
    if (held == 0) {
      waiting_ = false;
      return;
    }
    if (!waiting_) {
      waiting_ = true;
      until_ = kShortGap + kGapSpan * lake_rng_.uniform();
    }
    const float cracks = param(kCracks);
    const float rate = kMaxRate * cracks * cracks * cracks;
    until_ -= rate * static_cast<float>(kChunk) / sample_rate();
    if (until_ <= 0.0f) {
      until_ += kShortGap + kGapSpan * lake_rng_.uniform();
      crack(held);
    }
  }

  // One crack of the lake's own, on one of the `held` notes.
  void crack(int held) {
    using namespace ice;
    int pick = static_cast<int>(lake_rng_.next_u32() % static_cast<uint32_t>(held));
    int index = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = pool_.voices[v];
      if (!voice.sounding || !voice.held || voice.leaving()) continue;
      if (pick-- == 0) index = v;
    }
    const Voice& on = pool_.voices[index];
    const float roam = param(kRoam);
    const float distance = kit::clamp(param(kDistance) + kRoamDistance * roam * lake_rng_.bipolar(), 0.0f, 1.0f);
    const float loud = kSelfLevel * (1.0f - kRoamQuiet * roam * lake_rng_.uniform());
    const float place = kit::clamp(on.place + kRoamPlace * roam * lake_rng_.bipolar(), -1.0f, 1.0f);
    const bool octave = lake_rng_.uniform() < kOctaveChance;
    if (octave && on.frequency * 2.0f <= kOctaveTopHz) {
      // An octave up rings in a voice of its own, if one is free.
      for (int v = 0; v < kMaxVoices; ++v) {
        if (pool_.voices[v].sounding) continue;
        bool stolen = false;
        const int ghost = pool_.note_on(kGhostNote, &stolen);
        start(pool_.voices[ghost], on.frequency * 2.0f, on.gain, false);
        strike(ghost, on.gain, loud, distance, place);
        return;
      }
    }
    strike(index, on.gain, loud, distance, place);
  }

  // Ring or Stretch moved under a chirp in flight: it makes for where its
  // mode is now.
  void retarget(Chirp& chirp, const Voice& voice) {
    for (int j = 0; j < chirp.count; ++j) {
      const int k = chirp.mode[j];
      if (voice.inc[k] <= 0.0f) {
        chirp.amp[j] = 0.0f;
        continue;
      }
      chirp.inc[j] = voice.inc[k];
      if (chirp.rate > 0.0f) chirp.dinc[j] = kit::max(chirp.top * kStart[k] - voice.inc[k], 0.0f);
    }
  }

  void retire(Voice& voice) {
    voice.sounding = voice.held = voice.pending = voice.fading = voice.shedding = false;
    voice.follow = 0.0f;
    for (int k = 0; k < kModes; ++k) {
      voice.mid_re[k] = voice.mid_im[k] = voice.side_re[k] = voice.side_im[k] = 0.0f;
    }
  }

  // The fade of a voice that is being taken, at sample `i` of this stretch.
  float steal_at(const Voice& voice, int i) const {
    return kit::max(voice.steal_from - steal_step_ * static_cast<float>(i + 1), 0.0f);
  }

  void render_ring(Voice& voice, int n, float* mid, float* side) {
    voice.steal_from = voice.steal;
    // Gather the modes that hold anything, the middle ones first, and turn
    // them side by side: a mode alone waits on its own last sample, a dozen
    // together do not wait on each other.
    float re[2 * kModes], im[2 * kModes], step_re[2 * kModes], step_im[2 * kModes];
    int slot[2 * kModes];
    int total = 0;
    for (int k = 0; k < kModes; ++k) {
      if (voice.mid_re[k] == 0.0f && voice.mid_im[k] == 0.0f) continue;
      re[total] = voice.mid_re[k];
      im[total] = voice.mid_im[k];
      step_re[total] = voice.step_re[k];
      step_im[total] = voice.step_im[k];
      slot[total++] = k;
    }
    const int middle = total;
    for (int k = 0; k < kModes; ++k) {
      if (voice.side_re[k] == 0.0f && voice.side_im[k] == 0.0f) continue;
      re[total] = voice.side_re[k];
      im[total] = voice.side_im[k];
      step_re[total] = voice.step_re[k];
      step_im[total] = voice.step_im[k];
      slot[total++] = k;
    }
    if (total == 0) return;
    const bool leaving = voice.leaving();
    for (int i = 0; i < n; ++i) {
      for (int q = 0; q < total; ++q) {
        const float turned = step_re[q] * re[q] - step_im[q] * im[q];
        im[q] = step_re[q] * im[q] + step_im[q] * re[q];
        re[q] = turned;
      }
      float out_mid = 0.0f, out_side = 0.0f;
      for (int q = 0; q < middle; ++q) out_mid += im[q];
      for (int q = middle; q < total; ++q) out_side += im[q];
      const float fade = leaving ? steal_at(voice, i) : 1.0f;
      mid[i] += out_mid * fade;
      side[i] += out_side * fade;
    }
    for (int q = 0; q < middle; ++q) {
      voice.mid_re[slot[q]] = re[q];
      voice.mid_im[slot[q]] = im[q];
    }
    for (int q = middle; q < total; ++q) {
      voice.side_re[slot[q]] = re[q];
      voice.side_im[slot[q]] = im[q];
    }
  }

  void render_chirp(Chirp& chirp, int n, float* mid, float* side) {
    int from = 0;
    if (chirp.wait > 0) {
      if (chirp.wait >= n) {
        chirp.wait -= n;
        return;
      }
      from = chirp.wait;
      chirp.wait = 0;
    }
    const int length = n - from;
    const Voice& voice = pool_.voices[chirp.voice];
    const bool leaving = voice.leaving();
    // How far along the fall it is, and its coming up, sample by sample.
    float sweep[kChunk], gain[kChunk];
    for (int i = 0; i < length; ++i) {
      const int age = chirp.age + i;
      sweep[i] = fall(chirp, age);
      float g = 1.0f;
      if (age < chirp.attack) {
        const float x = (static_cast<float>(age) + 0.5f) / static_cast<float>(chirp.attack);
        g *= x * x * (3.0f - 2.0f * x);
      }
      if (leaving) g *= steal_at(voice, from + i);
      gain[i] = g;
    }
    // The partials side by side, on copies the compiler can keep in hand.
    const int count = chirp.count;
    float phase[kModes], amp[kModes], inc[kModes], dinc[kModes];
    for (int j = 0; j < count; ++j) {
      phase[j] = chirp.phase[j];
      amp[j] = chirp.amp[j];
      inc[j] = chirp.inc[j];
      dinc[j] = chirp.dinc[j];
    }
    const float* table = sine_;
    float sum[kChunk];
    int i = 0;
    while (i < length) {
      // A partial's level is read every kGrid samples of the chirp's age (not
      // of the host's blocks) and runs straight between two readings.
      const int along = (chirp.age + i) & (kGrid - 1);
      if (along == 0 && chirp.age + i > 0) {
        for (int j = 0; j < count; ++j) {
          chirp.level[j] = chirp.next_level[j];
          chirp.next_level[j] = flight_level(chirp, j, chirp.age + i + kGrid);
        }
      }
      float level[kModes], slope[kModes];
      for (int j = 0; j < count; ++j) {
        level[j] = chirp.level[j];
        slope[j] = (chirp.next_level[j] - chirp.level[j]) * (1.0f / kGrid);
      }
      const int stop = kit::clamp_int(i + kGrid - along, i + 1, length);
      for (; i < stop; ++i) {
        const float s = sweep[i];
        const float step = static_cast<float>((chirp.age + i) & (kGrid - 1));
        float x = 0.0f;
        for (int j = 0; j < count; ++j) {
          float turn = phase[j] + inc[j] + dinc[j] * s;
          if (turn >= 1.0f) turn -= 1.0f;
          phase[j] = turn;
          const float position = turn * kTable;
          const int index = static_cast<int>(position);
          x += amp[j] * (level[j] + slope[j] * step) *
               (table[index] + (table[index + 1] - table[index]) * (position - static_cast<float>(index)));
        }
        sum[i] = x * gain[i];
      }
    }
    for (int j = 0; j < count; ++j) chirp.phase[j] = phase[j];
    for (int i = 0; i < length; ++i) {
      mid[from + i] += sum[i] * chirp.to_mid;
      side[from + i] += sum[i] * chirp.to_side;
    }
    chirp.age += length;
  }

  // The snap: high-passed noise under an envelope every strike adds to. It
  // ends on a sample, not on a block, so the noise is drawn the same number
  // of times whatever the block size.
  void render_snap(int n, float* mid, float* side) {
    for (int i = 0; i < n; ++i) {
      if (snap_mid_ == 0.0f && snap_side_ == 0.0f) return;
      const float white = snap_rng_.bipolar();
      snap_low_ = white + (snap_low_ - white) * snap_pole_;
      const float brittle = white - snap_low_;
      mid[i] += brittle * snap_mid_;
      side[i] += brittle * snap_side_;
      snap_mid_ *= snap_decay_;
      snap_side_ *= snap_decay_;
      if (std::fabs(snap_mid_) < kSnapFloor && std::fabs(snap_side_) < kSnapFloor) {
        snap_mid_ = snap_side_ = snap_low_ = 0.0f;
      }
    }
  }

  // After `n` samples: a voice whose fade has reached the bottom starts the
  // note that was waiting for it, or is free.
  void finish_steals(int n) {
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding || !voice.leaving()) continue;
      voice.steal = kit::max(voice.steal - steal_step_ * static_cast<float>(n), 0.0f);
      if (voice.steal > 0.0f) continue;
      for (Chirp& chirp : chirps_) {
        if (chirp.active && chirp.voice == v) chirp.active = false;
      }
      if (voice.pending) {
        start(voice, voice.pending_frequency, voice.pending_gain, true);
        strike(v, voice.gain, 1.0f, param(ice::kDistance), voice.place);
      } else {
        retire(voice);
      }
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  Chirp chirps_[kMaxChirps];
  float sine_[kTable + 2] = {};
  kit::Smoother width_, volume_;
  kit::IdleGate idle_;
  kit::Rng phase_rng_, lake_rng_, snap_rng_;
  uint32_t serial_ = 1;
  int chunk_left_ = 0;
  float until_ = 1.0f;  // of a mean gap, before the lake cracks next
  bool waiting_ = false;
  float snap_mid_ = 0.0f, snap_side_ = 0.0f, snap_low_ = 0.0f;
  float snap_decay_ = 0.0f, snap_pole_ = 0.0f, snap_scale_ = 0.0f;
  float steal_step_ = 0.0f;
  float shed_ = 1.0f;  // per sample, on top of a mode's own decay
};

}  // namespace livemix
