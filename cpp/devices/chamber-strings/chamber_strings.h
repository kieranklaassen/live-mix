#pragma once

// Chamber Strings: a small bowed section for long quiet notes.
//
//   per note (up to 12), one to six players:
//     sawtooth ─► × own entry, attack, level wander, bow changes ─► place ─┐
//     (own pitch offset, drift and late vibrato)                           │
//                                                                          ▼
//     bow filter, left and right: tracking low-pass, tracking high-pass ─► × velocity × levelling
//                                                                          │
//   bow noise: white, left and right ─► band-pass ─► × Air × the notes ────┤
//                                                                          ▼ by pitch
//                              low body (left, right) + high body (left, right)   body.h
//                                                                          │
//             out ◄─ soft clip ◄─ volume ◄─ width (mid/side) ◄─ mute ◄─────┘
//
// - A bowed string pulls on its bridge in something close to a sawtooth, so
//   each player is one, band-limited. What makes a section is that nothing
//   is shared: every player has a fixed place in the pitch spread, a slow
//   drift, a level wander, a vibrato of their own rate, depth and delay, an
//   entry a little after the others and an attack a little faster or slower.
//   The drift and the wander are random walks, not sines: apart from each
//   player's own vibrato nothing here repeats, and no two notes move together.
// - Now and then a player changes bow: a dip of about 6 dB for 80 ms, every
//   three to eight seconds, never while another player of the note does.
// - The bodies do not move with the note (body.h). A note below C3 goes to
//   the low body, above C4 to the high one, between the two to both. Since a
//   harmonic that lands on a narrow resonance is much louder than one that
//   falls beside it, each note is levelled at its start: its gain is the
//   inverse of what its harmonics would come out with. The body then colours
//   a note, and vibrato moves its harmonics up and down the resonances,
//   without one key jumping out of a chord.
// - Bow is where the bow meets the string, as a filter that tracks the note:
//   a low-pass at 3.5 times the note over the fingerboard, 16 times in the
//   middle and open at the bridge, where a high-pass at three times the note
//   also thins the fundamental by 10 dB. Harder and louder is brighter.
// - Air is the hiss of the bow: one noise source a side through the same
//   bodies, as loud as the notes are, following the root of their envelope
//   so that it leads a slow attack. Its upper half also rounds the tone and
//   takes a little of it away (flautando).
// - Mute is an equaliser after the bodies: a shelf down above 2 kHz and a
//   small peak at 1.6 kHz.
// - Width scales the difference between left and right, which comes from
//   where the players sit and from the two bodies being a little apart.
//
// The instrument sleeps when no note sounds and the bodies have rung out.

#include "../../kit/kit.h"
#include "body.h"
#include "params.gen.h"

namespace livemix {

class ChamberStrings : public kit::DeviceBase<chamber_strings::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kMaxPlayers = 6;
  static constexpr int kControlPeriod = 32;

  // Scatter 0..1: how far the players' fixed pitches spread either side of
  // the note, how far each drifts, and how late the last one enters.
  static constexpr float kSpreadCents = 1.0f;
  static constexpr float kSpreadCentsScatter = 19.0f;
  static constexpr float kDriftCents = 0.8f;
  static constexpr float kDriftCentsScatter = 4.5f;
  static constexpr float kStaggerSeconds = 0.08f;
  // The drift picks a new target every 0.4 to 1.6 s and the level wander
  // every 0.8 to 3 s; each goes through two one-pole stages of this length.
  static constexpr float kDriftSmoothSeconds = 0.35f;
  static constexpr float kSwaySmoothSeconds = 0.6f;
  // Level wander of a player, as a share of their level (about ±1 dB).
  static constexpr float kSway = 0.12f;
  // A player's attack is the knob times 1 ± this, and their release 1 ± that.
  static constexpr float kAttackSpread = 0.3f;
  static constexpr float kReleaseSpread = 0.15f;
  // The attack is an S-curve; this share of it lies between 10 % and 90 %.
  static constexpr float kRiseShare = 0.6084f;
  // Vibrato: each player's rate, share of the knob's depth and delay; it
  // comes in over kVibratoRiseSeconds once the delay has passed, and the
  // rate follows the player's level wander by this share.
  static constexpr float kVibratoHz = 5.3f;
  static constexpr float kVibratoHzRange = 1.0f;
  static constexpr float kVibratoDepth = 0.6f;
  static constexpr float kVibratoDelay = 0.15f;
  static constexpr float kVibratoDelayRange = 0.25f;
  static constexpr float kVibratoRiseSeconds = 0.5f;
  static constexpr float kVibratoWander = 0.03f;
  // Bow changes.
  static constexpr float kBowChangeMin = 3.0f;
  static constexpr float kBowChangeMax = 8.0f;
  static constexpr float kDipSeconds = 0.08f;
  static constexpr float kDipDepth = 0.5f;
  // The bow filter: log2 of the low-pass multiple at Bow 0, 0.5 and 1, its
  // damping (Butterworth), where it stops, how far down a soft note and the
  // start of an attack pull it, and the high-pass of the bridge end with
  // the gain that makes up for the fundamental it takes away.
  static constexpr float kBowLog2Tasto = 1.807f;  // 3.5
  static constexpr float kBowLog2Normal = 4.0f;   // 16
  static constexpr float kBowLog2Bridge = 6.0f;   // 64: open
  static constexpr float kBowDamping = 1.41421356f;
  static constexpr float kBowTopHz = 16000.0f;
  static constexpr float kBrightSoft = 0.6f;
  static constexpr float kBrightLoud = 1.2f;
  static constexpr float kBrightStart = 0.55f;
  static constexpr float kThinMultiple = 3.0f;
  static constexpr float kThinMakeup = 0.88f;
  // The upper half of Air: the bow filter comes down to this share and the
  // tone to that level.
  static constexpr float kFlautandoCutoff = 0.5f;
  static constexpr float kFlautandoTone = 0.7f;
  // Bow noise: its band, and its level under one note at Air 1.
  static constexpr float kNoiseHz = 2450.0f;
  static constexpr float kNoiseQ = 0.49f;
  static constexpr float kNoiseLevel = 0.4f;
  // Mute at 1.
  static constexpr float kMuteShelfHz = 2000.0f;
  static constexpr float kMuteShelfDb = -11.0f;
  static constexpr float kMutePeakHz = 1600.0f;
  static constexpr float kMutePeakQ = 2.0f;
  static constexpr float kMutePeakDb = 3.0f;
  // Width 1 scales the side signal by this.
  static constexpr float kWidthScale = 1.3f;
  // Levelling looks at harmonics up to here and never lifts a note by more
  // than this (notes with nothing inside the bodies' range).
  static constexpr int kLevelHarmonics = 64;
  static constexpr float kLevelTopHz = 10000.0f;
  static constexpr float kMaxLevelling = 4.0f;
  // One note at full velocity peaks near -7 dBFS before Volume.
  static constexpr float kVoiceGain = 0.275f;
  // A stolen voice fades over this long; a key struck again lets its old
  // voice go in that long.
  static constexpr float kStealSeconds = 0.0025f;
  static constexpr float kRestrikeSeconds = 0.03f;
  // Players, Bow, Air and Mute follow their knobs with this time constant.
  static constexpr float kGlideSeconds = 0.02f;

  void init(float sample_rate) {
    using namespace chamber_strings;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      for (int p = 0; p < kMaxPlayers; ++p) {
        voice.player[p].rng.seed(0x9E3779B9u * static_cast<uint32_t>(v * kMaxPlayers + p + 1) ^ 0x51ED270Bu);
      }
    }
    start_.seed(0xA5A5F00Du);
    noise_left_.seed(0xC0FFEE11u);
    noise_right_.seed(0x7F4A7C15u);
    low_left_.set(chamber_strings_dsp::kLowBody, 1.0f - chamber_strings_dsp::kBodySkew, sr);
    low_right_.set(chamber_strings_dsp::kLowBody, 1.0f + chamber_strings_dsp::kBodySkew, sr);
    high_left_.set(chamber_strings_dsp::kHighBody, 1.0f - chamber_strings_dsp::kBodySkew, sr);
    high_right_.set(chamber_strings_dsp::kHighBody, 1.0f + chamber_strings_dsp::kBodySkew, sr);
    hiss_left_.reset();
    hiss_right_.reset();
    hiss_left_.set(kNoiseHz, kNoiseQ, sr);
    hiss_right_.set(kNoiseHz, kNoiseQ, sr);
    noise_trim_low_ = noise_trim(low_left_);
    noise_trim_high_ = noise_trim(high_left_);
    for (int side = 0; side < 2; ++side) {
      mute_shelf_[side].reset();
      mute_shelf_[side].set_identity();
      mute_peak_[side].reset();
      mute_peak_[side].set_identity();
    }
    mute_set_ = -1.0f;
    players_.set_time(kGlideSeconds, control_rate);
    bow_.set_time(kGlideSeconds, control_rate);
    air_.set_time(kGlideSeconds, control_rate);
    mute_.set_time(kGlideSeconds, control_rate);
    width_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    gain_coeff_ = 1.0f - kit::time_to_coeff(kSmoothingSeconds, sr);
    drift_coeff_ = 1.0f - kit::time_to_coeff(kDriftSmoothSeconds, control_rate);
    sway_coeff_ = 1.0f - kit::time_to_coeff(kSwaySmoothSeconds, control_rate);
    thin_step_ = 0.0f;
    for (int bank = 0; bank < 2; ++bank) {
      noise_[bank] = 0.0f;
      noise_target_[bank] = 0.0f;
      noise_step_[bank] = 0.0f;
    }
    clock_.reset(kControlPeriod);
    // Nothing outlives the envelopes but the ring of the bodies, which is
    // continuous: no silent gap for the gate to mistake for the end.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    thin_ = thin_target_ = upper_half(bow_.value);
    hissing_ = false;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.pending) {
        // Struck again before it could start: the waiting note is this one.
        // Letting the voice go would let the pool take a second voice for
        // the same key, and one note off would end only one of them.
        again.next_frequency = frequency;
        again.next_gain = gain;
        return;
      }
      // A key struck again while held: let the old voice go quickly.
      release(again, true);
    }

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // The old note fades out first; the new one waits in the voice.
      voice.pending = true;
      voice.next_frequency = frequency;
      voice.next_gain = gain;
      if (voice.fade_step == 0.0f) voice.fade_step = 1.0f / (kStealSeconds * sample_rate());
    } else {
      start(voice, frequency, gain);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) {
      // Released before it could start: the voice just finishes its fade.
      voice.pending = false;
      voice.released = true;
    } else {
      release(voice, false);
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool was_asleep = idle_.asleep();
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    if (was_asleep) wake();
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();

      thin_ += thin_step_;
      float low_l = 0.0f, low_r = 0.0f, high_l = 0.0f, high_r = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.sounding) continue;
        float left = 0.0f, right = 0.0f;
        for (int p = 0; p < kMaxPlayers; ++p) {
          Player& player = voice.player[p];
          if (!player.running) continue;
          player.amp += player.amp_step;
          const float bowed = player.osc.saw(voice.increment * player.ratio) * player.amp;
          left += bowed * player.pan_left;
          right += bowed * player.pan_right;
        }
        left = voice.bow_left.lowpass(left);
        right = voice.bow_right.lowpass(right);
        left -= thin_ * voice.thin_left.lowpass(left);
        right -= thin_ * voice.thin_right.lowpass(right);
        voice.gain += (voice.gain_target - voice.gain) * gain_coeff_;
        float gain = voice.gain;
        if (voice.fade_step > 0.0f) {
          voice.fade -= voice.fade_step;
          if (voice.fade <= 0.0f) {
            // The stolen note is gone: start the one that was waiting.
            voice.sounding = false;
            if (voice.pending) start(voice, voice.next_frequency, voice.next_gain);
            continue;
          }
          gain *= voice.fade;
        }
        left *= gain;
        right *= gain;
        low_l += left * voice.to_low;
        low_r += right * voice.to_low;
        high_l += left * voice.to_high;
        high_r += right * voice.to_high;
      }
      if (hissing_) {
        noise_[0] += noise_step_[0];
        noise_[1] += noise_step_[1];
        const float hiss_l = hiss_left_.bandpass(noise_left_.bipolar());
        const float hiss_r = hiss_right_.bandpass(noise_right_.bipolar());
        low_l += noise_[0] * hiss_l;
        low_r += noise_[0] * hiss_r;
        high_l += noise_[1] * hiss_l;
        high_r += noise_[1] * hiss_r;
      }

      float left = low_left_.process(low_l) + high_left_.process(high_l);
      float right = low_right_.process(low_r) + high_right_.process(high_r);
      left = mute_peak_[0].process(mute_shelf_[0].process(left));
      right = mute_peak_[1].process(mute_shelf_[1].process(right));
      const float mid = 0.5f * (left + right);
      const float side = 0.5f * (left - right) * width_.next();
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip((mid + side) * volume);
      out_right_[i] = kit::soft_clip((mid - side) * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // A slow aperiodic wander in about -1..1: a new random target at random
  // intervals, through two one-pole stages. Its spectrum is a hump with no
  // line in it, which is the difference from an LFO.
  struct Wander {
    float target = 0.0f;
    float first = 0.0f;
    float value = 0.0f;
    float wait = 0.0f;

    void start(kit::Rng& rng) {
      target = rng.bipolar();
      first = value = 0.5f * rng.bipolar();
      wait = 0.0f;
    }
    float next(kit::Rng& rng, float dt, float shortest, float longest, float coeff) {
      wait -= dt;
      if (wait <= 0.0f) {
        target = rng.bipolar();
        wait = kit::lerp(shortest, longest, rng.uniform());
      }
      first += (target - first) * coeff;
      value += (first - value) * coeff;
      return value;
    }
  };

  enum Stage : int { kOff = 0, kWaiting, kRising, kHolding, kFalling };

  struct Player {
    kit::BlepOsc osc;
    kit::Rng rng;
    Wander drift;                // pitch
    Wander sway;                 // level, and a little of the vibrato rate
    float ratio = 1.0f;          // pitch against the note, set on the control clock
    float amp = 0.0f;            // ramped per sample to the target of the last tick
    float amp_target = 0.0f;
    float amp_step = 0.0f;
    float pan_left = 0.7071f;
    float pan_right = 0.7071f;
    float offset = 0.0f;         // place in the pitch spread, -1..1
    float attack_scale = 1.0f;
    float release_scale = 1.0f;
    float vibrato_phase = 0.0f;
    float vibrato_hz = 5.8f;
    float vibrato_depth = 1.0f;
    float vibrato_delay = 0.2f;
    float wait = 0.0f;           // seconds until this player enters
    float age = 0.0f;            // seconds since
    float rise = 0.0f;           // 0..1 along the attack
    float env = 0.0f;
    float next_bow = 0.0f;       // seconds of sustain until the next bow change
    float dip = -1.0f;           // seconds into a bow change, or negative
    int stage = kOff;
    bool running = false;        // the oscillator has something to play
  };

  struct Voice {
    Player player[kMaxPlayers];
    kit::Svf bow_left, bow_right;
    kit::OnePole thin_left, thin_right;
    float frequency = 220.0f;
    float increment = 0.0f;
    float velocity = 0.0f;       // loudness from the note's gain
    float bright = 1.0f;         // bow filter multiple from the note's gain
    float levelling = 1.0f;
    float gain = 0.0f;           // velocity, levelling and make-up, smoothed per sample
    float gain_target = 0.0f;
    float to_low = 0.0f;         // share of each body
    float to_high = 1.0f;
    float envelope = 0.0f;       // mean of the players' envelopes
    float hiss_scale = 0.0f;     // keeps the hiss continuous through note-off
    float fade = 1.0f;           // falls to 0 while a stolen voice makes room
    float fade_step = 0.0f;
    float next_frequency = 220.0f;
    float next_gain = 0.0f;
    int dipping = -1;            // the player changing bow, if any
    bool sounding = false;
    bool released = false;
    bool fast = false;           // released by a second strike of its key
    bool pending = false;        // a note waits for the fade to finish

    bool active() const { return sounding || pending; }
    bool releasing() const { return released && !pending; }
    float level() const { return envelope * velocity; }
  };

  // 0 up to the middle of a knob, then 0..1 over its upper half: the bridge
  // end of Bow (the tracking high-pass) and the flautando end of Air.
  static float upper_half(float knob) { return kit::clamp((knob - 0.5f) * 2.0f, 0.0f, 1.0f); }

  // How strongly player `p` of the section plays: the last one in has the
  // level of the knob's fraction.
  static float player_weight(float players, int p) {
    return kit::clamp(players - static_cast<float>(p), 0.0f, 1.0f);
  }

  // The low-pass of the bow as a multiple of the note, before velocity.
  static float bow_multiple(float bow, float air) {
    const float log2 = bow < 0.5f ? kit::lerp(kBowLog2Tasto, kBowLog2Normal, bow * 2.0f)
                                  : kit::lerp(kBowLog2Normal, kBowLog2Bridge, bow * 2.0f - 1.0f);
    return std::exp2(log2) * kit::lerp(1.0f, kFlautandoCutoff, upper_half(air));
  }

  float bow_cutoff(const Voice& voice, float multiple, float level) const {
    const float hz = voice.frequency * multiple * voice.bright * kit::lerp(kBrightStart, 1.0f, level);
    return kit::min(hz, kit::min(kBowTopHz, 0.45f * sample_rate()));
  }

  // `count` values spread evenly over -1..1 with a little disorder, handed
  // out in random order and centred on zero by weight; the rest are random.
  // One value alone is exactly zero: a soloist plays the note as written.
  void spread(float* out, int count, const float* weight) {
    int order[kMaxPlayers];
    for (int i = 0; i < count; ++i) order[i] = i;
    for (int i = count - 1; i > 0; --i) {
      const int j = static_cast<int>(start_.uniform() * static_cast<float>(i + 1));
      const int swap = order[i];
      order[i] = order[j];
      order[j] = swap;
    }
    float sum = 0.0f, total = 0.0f;
    for (int i = 0; i < count; ++i) {
      const float slot = static_cast<float>(2 * order[i] + 1) + 0.6f * start_.bipolar();
      out[i] = slot / static_cast<float>(count) - 1.0f;
      sum += out[i] * weight[i];
      total += weight[i];
    }
    for (int i = 0; i < count; ++i) out[i] -= sum / total;
    for (int i = count; i < kMaxPlayers; ++i) out[i] = start_.bipolar();
  }

  // Start a note in a voice that is silent.
  void start(Voice& voice, float frequency, float gain) {
    using namespace chamber_strings;
    const float sr = sample_rate();
    voice.frequency = frequency;
    voice.increment = frequency / sr;
    voice.velocity = 0.25f + 0.75f * gain;
    voice.bright = kit::lerp(kBrightSoft, kBrightLoud, gain);
    // Below C3 the low body, above C4 the high one, a blend between.
    voice.to_high = kit::clamp(std::log2(frequency / 130.81f), 0.0f, 1.0f);
    voice.to_low = 1.0f - voice.to_high;
    voice.envelope = 0.0f;
    voice.hiss_scale = 0.0f;
    voice.fade = 1.0f;
    voice.fade_step = 0.0f;
    voice.dipping = -1;
    voice.sounding = true;
    voice.released = false;
    voice.fast = false;
    voice.pending = false;
    voice.bow_left.reset();
    voice.bow_right.reset();
    voice.thin_left.reset();
    voice.thin_right.reset();
    voice.thin_left.set_cutoff(kThinMultiple * frequency, sr);
    voice.thin_right.a = voice.thin_left.a;

    // The section as the knob stands: who plays, and how strongly the last.
    const float players = param(kPlayers);
    int count = static_cast<int>(std::ceil(players));
    count = kit::clamp_int(count, 1, kMaxPlayers);
    float weight[kMaxPlayers];
    for (int p = 0; p < kMaxPlayers; ++p) weight[p] = player_weight(players, p);
    float offset[kMaxPlayers], attack[kMaxPlayers], let_go[kMaxPlayers], place[kMaxPlayers];
    spread(offset, count, weight);
    spread(attack, count, weight);
    spread(let_go, count, weight);
    // Seats across the image, in order; which pitch sits where is random.
    const float mirror = start_.uniform() < 0.5f ? -1.0f : 1.0f;
    for (int p = 0; p < kMaxPlayers; ++p) {
      place[p] = p < count ? mirror * (static_cast<float>(2 * p + 1) / static_cast<float>(count) - 1.0f)
                           : start_.bipolar();
    }
    const float stagger = kStaggerSeconds * param(kScatter);
    float first = 1.0e9f;
    for (int p = 0; p < kMaxPlayers; ++p) {
      Player& player = voice.player[p];
      player.osc.reset(start_.uniform());
      player.drift.start(start_);
      player.sway.start(start_);
      player.ratio = 1.0f;
      player.amp = 0.0f;
      player.amp_target = 0.0f;
      player.amp_step = 0.0f;
      kit::pan_gains(place[p], &player.pan_left, &player.pan_right);
      player.offset = offset[p];
      player.attack_scale = 1.0f + kAttackSpread * attack[p];
      player.release_scale = 1.0f + kReleaseSpread * let_go[p];
      player.vibrato_phase = start_.uniform();
      player.vibrato_hz = kVibratoHz + kVibratoHzRange * start_.uniform();
      player.vibrato_depth = kit::lerp(kVibratoDepth, 1.0f, start_.uniform());
      player.vibrato_delay = kVibratoDelay + kVibratoDelayRange * start_.uniform();
      player.wait = stagger * start_.uniform();
      if (p < count) first = kit::min(first, player.wait);
      player.age = 0.0f;
      player.rise = 0.0f;
      player.env = 0.0f;
      player.next_bow = kit::lerp(kBowChangeMin, kBowChangeMax, start_.uniform());
      player.dip = -1.0f;
      player.stage = kWaiting;
      player.running = false;
    }
    // The first of the section enters with the key.
    for (int p = 0; p < kMaxPlayers; ++p) {
      voice.player[p].wait = kit::max(voice.player[p].wait - first, 0.0f);
    }

    // Level the note against the bodies with its bow filter as it will stand
    // at full level; the make-up of the bridge end is taken out again so
    // that it can follow the knob afterwards.
    const float bow = param(kBow);
    const float thin = upper_half(bow);
    const float power = note_power(voice, bow_cutoff(voice, bow_multiple(bow, param(kAir)), 1.0f), thin);
    const float makeup = 1.0f + kThinMakeup * thin;
    voice.levelling = kit::min(1.0f / std::sqrt(kit::max(power, 1.0e-12f)), kMaxLevelling) / makeup;
    voice.gain_target = voice_gain(voice, thin, tone_trim(param(kAir)));
    voice.gain = voice.gain_target;
  }

  void release(Voice& voice, bool fast) {
    voice.released = true;
    voice.fast = fast;
    voice.hiss_scale = voice.envelope > 1.0e-4f ? 1.0f / std::sqrt(voice.envelope) : 0.0f;
    for (int p = 0; p < kMaxPlayers; ++p) {
      Player& player = voice.player[p];
      if (player.stage == kWaiting) {
        player.stage = kOff;
      } else if (player.stage != kOff) {
        player.stage = kFalling;
      }
    }
  }

  // What the upper half of Air takes off the tone.
  static float tone_trim(float air) { return kit::lerp(1.0f, kFlautandoTone, upper_half(air)); }

  // `thin` is the share of the bridge end's high-pass, whose loss the gain
  // makes up; `trim` is tone_trim().
  static float voice_gain(const Voice& voice, float thin, float trim) {
    return voice.velocity * voice.levelling * kVoiceGain * (1.0f + kThinMakeup * thin) * trim;
  }

  // The power a note's harmonics come out with, mean of left and right: a
  // sawtooth (1/n) through the bow filter and the note's share of the bodies.
  float note_power(const Voice& voice, float cutoff_hz, float thin) const {
    const float sr = sample_rate();
    const float g = kit::tan_prewarp(kit::kPi * cutoff_hz / sr);
    const float a = voice.thin_left.a;
    float power = 0.0f;
    for (int n = 1; n <= kLevelHarmonics; ++n) {
      const float hz = voice.frequency * static_cast<float>(n);
      if (hz > kLevelTopHz || hz > 0.45f * sr) break;
      const float t = kit::tan_prewarp(kit::kPi * hz / sr);
      // The low-pass, 1 / (1 - x² + j·k·x).
      const float x = t / g;
      const float d = 1.0f - x * x;
      const float e = x * kBowDamping;
      const float low_pass = 1.0f / (d * d + e * e);
      // The high-pass, 1 - thin·(1 - a) / (1 - a·e^-jω).
      const float cosw = (1.0f - t * t) / (1.0f + t * t);
      const float sinw = 2.0f * t / (1.0f + t * t);
      const float den_re = 1.0f - a * cosw;
      const float den_im = a * sinw;
      const float pole = thin * (1.0f - a) / (den_re * den_re + den_im * den_im);
      const float hp_re = 1.0f - pole * den_re;
      const float hp_im = pole * den_im;
      const float high_pass = hp_re * hp_re + hp_im * hp_im;
      // The bodies: both banks add as signals, each side on its own.
      float left_re = 0.0f, left_im = 0.0f, right_re = 0.0f, right_im = 0.0f, re, im;
      if (voice.to_low > 0.0f) {
        low_left_.response(t, &re, &im);
        left_re += voice.to_low * re;
        left_im += voice.to_low * im;
        low_right_.response(t, &re, &im);
        right_re += voice.to_low * re;
        right_im += voice.to_low * im;
      }
      if (voice.to_high > 0.0f) {
        high_left_.response(t, &re, &im);
        left_re += voice.to_high * re;
        left_im += voice.to_high * im;
        high_right_.response(t, &re, &im);
        right_re += voice.to_high * re;
        right_im += voice.to_high * im;
      }
      const float body = 0.5f * (left_re * left_re + left_im * left_im + right_re * right_re + right_im * right_im);
      power += low_pass * high_pass * body / static_cast<float>(n * n);
    }
    return power;
  }

  // What scales white noise (uniform, ±1) through the hiss band-pass and a
  // body to an RMS of one.
  float noise_trim(const chamber_strings_dsp::BodyBank& bank) const {
    const int steps = 1024;
    const float g = hiss_left_.g;
    const float k = hiss_left_.k;
    float sum = 0.0f;
    for (int i = 0; i < steps; ++i) {
      const float t = std::tan(kit::kHalfPi * (static_cast<float>(i) + 0.5f) / static_cast<float>(steps));
      // The band-pass, j·e / (d + j·e).
      const float x = t / g;
      const float d = 1.0f - x * x;
      const float e = x * k;
      float re, im;
      bank.response(t, &re, &im);
      sum += e * e / (d * d + e * e) * (re * re + im * im);
    }
    return std::sqrt(3.0f * static_cast<float>(steps) / sum);
  }

  // Every 32 samples: the knobs that glide, every player's envelope and
  // pitch, each note's bow filter, and the level of the hiss.
  void control() {
    using namespace chamber_strings;
    const float sr = sample_rate();
    const float dt = static_cast<float>(kControlPeriod) / sr;
    const float per_sample = 1.0f / static_cast<float>(kControlPeriod);

    const float players = players_.next();
    const float bow = bow_.next();
    const float air = air_.next();
    const float mute = mute_.next();
    if (mute != mute_set_) {
      mute_set_ = mute;
      mute_shelf_[0].set_high_shelf(kMuteShelfHz, kMuteShelfDb * mute, sr);
      mute_peak_[0].set_peak(kMutePeakHz, kMutePeakQ, kMutePeakDb * mute, sr);
      copy_coefficients(mute_shelf_[0], &mute_shelf_[1]);
      copy_coefficients(mute_peak_[0], &mute_peak_[1]);
    }
    low_left_.flush();
    low_right_.flush();
    high_left_.flush();
    high_right_.flush();

    // The section, scaled to the power of one player.
    float weight[kMaxPlayers];
    float power = 0.0f;
    for (int p = 0; p < kMaxPlayers; ++p) {
      weight[p] = player_weight(players, p);
      power += weight[p] * weight[p];
    }
    const float even = 1.0f / std::sqrt(power);

    const float scatter = param(kScatter);
    const float spread_cents = kSpreadCents + kSpreadCentsScatter * scatter;
    const float drift_cents = kDriftCents + kDriftCentsScatter * scatter;
    const float vibrato_cents = param(kVibrato);
    const float attack_step = dt * kRiseShare / param(kAttack);
    const float release_step = 6.908f * dt / param(kRelease);
    const float restrike_step = 6.908f * dt / kRestrikeSeconds;

    const float multiple = bow_multiple(bow, air);
    thin_ = thin_target_;
    thin_target_ = upper_half(bow);
    thin_step_ = (thin_target_ - thin_) * per_sample;
    const float trim = tone_trim(air);

    float hiss_low = 0.0f, hiss_high = 0.0f;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding) continue;
      const float let_go = voice.fast ? restrike_step : release_step;
      float level = 0.0f, total = 0.0f;
      bool alive = false;
      for (int p = 0; p < kMaxPlayers; ++p) {
        Player& player = voice.player[p];
        player.amp = player.amp_target;
        switch (player.stage) {
          case kWaiting:
            player.wait -= dt;
            if (player.wait > 0.0f) break;
            player.stage = kRising;
            [[fallthrough]];
          case kRising:
            player.rise += attack_step / player.attack_scale;
            if (player.rise >= 1.0f) {
              player.rise = 1.0f;
              player.stage = kHolding;
            }
            player.env = player.rise * player.rise * (3.0f - 2.0f * player.rise);
            break;
          case kFalling:
            player.env *= kit::max(1.0f - let_go / player.release_scale, 0.0f);
            if (player.env < 1.0e-5f) {
              player.env = 0.0f;
              player.stage = kOff;
            }
            break;
          default:
            break;
        }
        float target = 0.0f;
        if (player.stage >= kRising) {
          player.age += dt;
          const float sway = player.sway.next(player.rng, dt, 0.8f, 3.0f, sway_coeff_);
          const float drift = player.drift.next(player.rng, dt, 0.4f, 1.6f, drift_coeff_);
          // Vibrato: none at first, then in over kVibratoRiseSeconds.
          const float onset = kit::clamp((player.age - player.vibrato_delay) / kVibratoRiseSeconds, 0.0f, 1.0f);
          player.vibrato_phase += player.vibrato_hz * (1.0f + kVibratoWander * sway) * dt;
          player.vibrato_phase -= std::floor(player.vibrato_phase);
          const float vibrato = onset * onset * (3.0f - 2.0f * onset) * player.vibrato_depth *
                                kit::SineTable::lookup(player.vibrato_phase);
          const float cents = spread_cents * player.offset + drift_cents * drift + vibrato_cents * vibrato;
          // 2^(cents/1200) to second order: exact to 0.01 cent over ±100 cents.
          const float x = cents * (0.69314718f / 1200.0f);
          player.ratio = 1.0f + x + 0.5f * x * x;

          // A bow change, when it is this player's turn and nobody else's.
          float dip = 1.0f;
          if (player.stage == kHolding && player.dip < 0.0f && weight[p] > 0.0f) {
            player.next_bow -= dt;
            if (player.next_bow <= 0.0f && voice.dipping < 0) {
              player.dip = 0.0f;
              voice.dipping = p;
            }
          }
          if (player.dip >= 0.0f) {
            dip = 1.0f - 0.5f * kDipDepth * (1.0f - kit::SineTable::cos_lookup(player.dip / kDipSeconds));
            player.dip += dt;
            if (player.dip >= kDipSeconds) {
              player.dip = -1.0f;
              player.next_bow = kit::lerp(kBowChangeMin, kBowChangeMax, player.rng.uniform());
              voice.dipping = -1;
            }
          }
          target = player.env * (1.0f + kSway * sway) * dip * weight[p] * even;
        } else if (voice.dipping == p) {
          voice.dipping = -1;
        }
        player.amp_target = target;
        player.amp_step = (target - player.amp) * per_sample;
        player.running = player.amp != 0.0f || target != 0.0f;
        alive = alive || player.running || player.stage != kOff;
        level += weight[p] * player.env;
        total += weight[p];
      }
      if (!alive && voice.fade_step == 0.0f) {
        voice.sounding = false;
        continue;
      }
      voice.envelope = level / total;

      // The bow filter, the same on both sides.
      voice.bow_left.set(bow_cutoff(voice, multiple, voice.envelope), 1.0f / kBowDamping, sr);
      voice.bow_right.g = voice.bow_left.g;
      voice.bow_right.k = voice.bow_left.k;
      voice.bow_right.a1 = voice.bow_left.a1;
      voice.bow_right.a2 = voice.bow_left.a2;
      voice.bow_right.a3 = voice.bow_left.a3;
      voice.gain_target = voice_gain(voice, thin_target_, trim);

      // The hiss leads a slow attack and leaves with the tone.
      const float hiss = (voice.released ? voice.envelope * voice.hiss_scale : std::sqrt(voice.envelope)) *
                         voice.velocity;
      hiss_low += hiss * hiss * voice.to_low * voice.to_low;
      hiss_high += hiss * hiss * voice.to_high * voice.to_high;
    }

    // Under one note the hiss has kNoiseLevel of its RMS at Air 1 (a
    // levelled sawtooth has an RMS of 0.45 of its voice gain).
    const float hiss_gain = air * air * kNoiseLevel * 0.45f * kVoiceGain;
    const float targets[2] = {hiss_gain * noise_trim_low_ * std::sqrt(hiss_low),
                              hiss_gain * noise_trim_high_ * std::sqrt(hiss_high)};
    hissing_ = false;
    for (int bank = 0; bank < 2; ++bank) {
      noise_[bank] = noise_target_[bank];
      noise_target_[bank] = targets[bank];
      noise_step_[bank] = (noise_target_[bank] - noise_[bank]) * per_sample;
      hissing_ = hissing_ || noise_[bank] != 0.0f || noise_target_[bank] != 0.0f;
    }
  }

  static void copy_coefficients(const kit::Biquad& from, kit::Biquad* to) {
    to->b0 = from.b0;
    to->b1 = from.b1;
    to->b2 = from.b2;
    to->a1 = from.a1;
    to->a2 = from.a2;
  }

  // Back from sleep: whatever moved while nothing sounded is simply there,
  // and the control clock starts on the first sample.
  void wake() {
    players_.snap(players_.target);
    bow_.snap(bow_.target);
    air_.snap(air_.target);
    mute_.snap(mute_.target);
    width_.snap(width_.target);
    volume_.snap(volume_.target);
    thin_ = thin_target_ = upper_half(bow_.value);
    thin_step_ = 0.0f;
    for (int bank = 0; bank < 2; ++bank) {
      noise_[bank] = 0.0f;
      noise_target_[bank] = 0.0f;
      noise_step_[bank] = 0.0f;
    }
    low_left_.reset();
    low_right_.reset();
    high_left_.reset();
    high_right_.reset();
    hiss_left_.reset();
    hiss_right_.reset();
    for (int side = 0; side < 2; ++side) {
      mute_shelf_[side].reset();
      mute_peak_[side].reset();
    }
    clock_.reset(kControlPeriod);
  }

  void apply(int id) {
    using namespace chamber_strings;
    const float value = param(id);
    switch (id) {
      case kPlayers:
        players_.set(value, primed());
        break;
      case kBow:
        bow_.set(value, primed());
        break;
      case kAir:
        air_.set(value, primed());
        break;
      case kMute:
        mute_.set(value, primed());
        break;
      case kWidth:
        width_.set(value * kWidthScale, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  chamber_strings_dsp::BodyBank low_left_, low_right_, high_left_, high_right_;
  kit::Svf hiss_left_, hiss_right_;
  kit::Biquad mute_shelf_[2], mute_peak_[2];
  kit::Rng start_, noise_left_, noise_right_;
  // Read on the control clock (time constants in control ticks).
  kit::Smoother players_, bow_, air_, mute_;
  // Read per sample.
  kit::Smoother width_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float gain_coeff_ = 0.0f;
  float drift_coeff_ = 0.0f;
  float sway_coeff_ = 0.0f;
  float mute_set_ = -1.0f;       // the Mute the equaliser was last set for
  float thin_ = 0.0f;            // share of the tracking high-pass, ramped per sample
  float thin_target_ = 0.0f;
  float thin_step_ = 0.0f;
  float noise_[2] = {};          // hiss into the low and the high body, ramped per sample
  float noise_target_[2] = {};
  float noise_step_[2] = {};
  float noise_trim_low_ = 1.0f;
  float noise_trim_high_ = 1.0f;
  bool hissing_ = false;
};

}  // namespace livemix
