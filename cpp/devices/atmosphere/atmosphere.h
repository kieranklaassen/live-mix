#pragma once

// Atmosphere: weather and room tone as an instrument.
//
//   per key (up to 8), left and right generated separately:
//
//     noise L / R ──► bed filter (band or low-pass, moving) ──► level ─┐
//     random events ► tick filter (retuned per event) ─────────────────┤
//     noise L / R ──► two one-poles (rumble) ──────────────────────────┼─► tuned
//     odd harmonics of the key (Hum) ──────────────────────────────────┘   resonance
//                                                                             │
//   out ◄─ soft clip ◄─ volume ◄─ width ◄─ diffusion ◄─ distance low-pass ◄─ envelope
//
// Each type is a recipe over those four sources, recomputed every 32 samples:
//
//   Wind   pink noise through a band-pass whose centre and level follow one
//          slow random gust (Density is the gust rate, Movement its depth).
//          Resonance narrows the band and pulls it onto the key: a whistle.
//   Rain   droplets (Density: 3 to 600 a second) over a soft hiss. A droplet
//          is one impulse into a band-pass that is retuned for every drop.
//   Sea    pink noise (and a little white, the foam) through a low-pass; each
//          wave (Density: 0.08 to 0.2 Hz) builds, opens the filter as it
//          breaks, and runs back.
//   Fire   a flickering low rumble under a soft roar, and crackles (0.6 to
//          48 a second).
//   Vinyl  steady hiss, clicks (0.3 to 30 a second) and a rumble that swells
//          once per revolution of a 33⅓ record.
//   Hum    the key's pitch and its odd harmonics; Density is how far up they
//          reach, Movement how unsteady the supply is.
//
// - Left and right never share a noise source, and every event lands mostly
//   on one side, so the image is wide without being a panned mono signal.
//   Width folds it towards mono at constant power.
// - The key's pitch tunes the resonance (or, for Wind, the whistle; for Hum,
//   the hum itself, where Resonance thins the harmonics towards a sine) and
//   leans the colour: low keys are darker, high keys brighter, by half an
//   octave per octave.
// - Size is distance: a low-pass that closes from 20 kHz to 1 kHz and two
//   allpass stages per side whose feedback grows with it, smearing the
//   events into the room. The stages are always in the path (17 ms on both
//   sides, different splits), so the level of a steady tone does not depend
//   on Size and the image does not lean.
// - Every random source is seeded in init(), each from its own hashed seed.
// - Changing Type while keys are down dips the output for 20 ms around the
//   switch.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Atmosphere : public kit::DeviceBase<atmosphere::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;
  static constexpr int kHumHarmonics = 6;  // 1, 3, 5, 7, 9, 11
  enum Kind : int { kWind = 0, kRain, kSea, kFire, kVinyl, kHum, kKinds };

  void init(float sample_rate) {
    using namespace atmosphere;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    uint32_t stream = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
      voice.noise[0].seed(seed_for(stream++));
      voice.noise[1].seed(seed_for(stream++));
      voice.events.seed(seed_for(stream++));
      voice.slow.seed(seed_for(stream++));
      voice.flicker.seed(seed_for(stream++));
      voice.wobble[0].seed(seed_for(stream++));
      voice.wobble[1].seed(seed_for(stream++));
    }
    for (int c = 0; c < 2; ++c) {
      distance_[c].reset();
      for (int stage = 0; stage < 2; ++stage) {
        diffuser_[c][stage].clear();
        diffuser_length_[c][stage] =
            kit::clamp_int(static_cast<int>(kDiffuserSeconds[c][stage] * sr), 1, kDiffuserSize - 4);
      }
    }
    for (int h = 0; h < kHumHarmonics; ++h) {
      hum_cos_[h] = kit::SineTable::cos_lookup(kHumOffset[h]);
      hum_sin_[h] = kit::SineTable::lookup(kHumOffset[h]);
    }
    clock_.reset(kControlPeriod);
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    density_.set_time(0.03f, control_rate);
    movement_.set_time(0.03f, control_rate);
    tone_.set_time(0.03f, control_rate);
    resonance_.set_time(0.03f, control_rate);
    size_.set_time(0.03f, control_rate);
    diffusion_.set_time(0.02f, sr);
    ring_.set_time(kSmoothingSeconds, sr);
    ring_dry_.set_time(kSmoothingSeconds, sr);
    mid_.set_time(kSmoothingSeconds, sr);
    side_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    fade_.set_time(0.01f, sr);
    fade_.snap(1.0f);
    kind_ = kit::clamp_int(static_cast<int>(param(kType) + 0.5f), 0, kKinds - 1);
    pending_kind_ = kind_;
    // The diffuser holds 17 ms; the hold has to outlast it.
    idle_.reset(sr, 0.2f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace atmosphere;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.fast_release(0.05f);

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.hz = frequency;
    voice.gain = gain;  // velocity is the level
    // Half an octave of colour per octave of key, around A3.
    voice.lean = kit::clamp(std::sqrt(frequency / 220.0f), 0.35f, 2.8f);
    const float ring_hz = kit::clamp(frequency, 30.0f, 0.4f * sample_rate());
    for (int c = 0; c < 2; ++c) voice.ring[c].set(ring_hz, kRingQ, sample_rate());
    if (!stolen) prepare(voice);  // a stolen voice keeps running to avoid a click
    survey();
    shape(voice, true);
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.gate_off();
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    const float sr = sample_rate();
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control(sr);

      const int kind = kind_;
      const bool pink = kind == kWind || kind == kSea;
      const bool foam = kind == kSea;
      const bool band = kind == kWind;
      const bool has_bed = kind != kHum;
      const bool has_events = kind == kRain || kind == kFire || kind == kVinyl;
      const bool has_rumble = kind == kFire || kind == kVinyl;
      const float ring = ring_.next();
      const float ring_dry = ring_dry_.next();

      float left = 0.0f, right = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        float out[2] = {0.0f, 0.0f};

        if (has_bed) {
          for (int c = 0; c < 2; ++c) {
            float noise = pink ? voice.noise[c].pink() : voice.noise[c].white();
            if (foam) noise += kSeaFoam * voice.noise[c].white();
            voice.bed_gain[c] += voice.bed_step[c];
            voice.bed[c].process(noise);
            out[c] = (band ? voice.bed[c].band * voice.bed[c].k : voice.bed[c].low) * voice.bed_gain[c];
            if (has_rumble) {
              voice.rumble_gain[c] += voice.rumble_step[c];
              out[c] +=
                  voice.rumble_b[c].lowpass(voice.rumble_a[c].lowpass(noise)) * voice.rumble_gain[c];
            }
          }
        }

        if (has_events) {
          float hit[2] = {0.0f, 0.0f};
          voice.countdown -= 1.0f;
          if (voice.countdown <= 0.0f) strike(voice, hit, sr);
          // A tick lasts milliseconds; the filters rest between events.
          for (int c = 0; c < 2; ++c) {
            kit::Svf& tick = voice.tick[c];
            if (hit[c] != 0.0f || std::fabs(tick.ic1) > kTickFloor || std::fabs(tick.ic2) > kTickFloor) {
              out[c] += tick.bandpass(hit[c]);
            }
          }
        }

        if (kind == kHum) {
          voice.hum_phase += voice.hum_increment;
          if (voice.hum_phase >= 1.0f) voice.hum_phase -= 1.0f;
          // sin and cos of the odd multiples from one table read each:
          // f((n+2)θ) = 2·cos(2θ)·f(nθ) - f((n-2)θ).
          const float sine = kit::SineTable::lookup(voice.hum_phase);
          const float cosine = kit::SineTable::cos_lookup(voice.hum_phase);
          const float twice = 2.0f * (1.0f - 2.0f * sine * sine);
          float sin_n = sine, sin_before = -sine, cos_n = cosine, cos_before = cosine;
          float sum_left = 0.0f, sum_right = 0.0f;
          for (int h = 0; h < kHumHarmonics; ++h) {
            // The right side hears each harmonic at another phase.
            sum_left += voice.hum_shape[h] * sin_n;
            sum_right += voice.hum_shape[h] * (sin_n * hum_cos_[h] + cos_n * hum_sin_[h]);
            const float sin_next = twice * sin_n - sin_before;
            const float cos_next = twice * cos_n - cos_before;
            sin_before = sin_n;
            sin_n = sin_next;
            cos_before = cos_n;
            cos_n = cos_next;
          }
          voice.bed_gain[0] += voice.bed_step[0];
          voice.bed_gain[1] += voice.bed_step[1];
          out[0] = sum_left * voice.bed_gain[0];
          out[1] = sum_right * voice.bed_gain[1];
        }

        if (ring > 0.0f) {
          out[0] = out[0] * ring_dry + voice.ring[0].process(out[0]) * ring;
          out[1] = out[1] * ring_dry + voice.ring[1].process(out[1]) * ring;
        }
        const float env = voice.env.next() * voice.gain;
        left += out[0] * env;
        right += out[1] * env;
      }

      // The dip around a type change happens here, ahead of the delays, so
      // the new type fades in at its source. Then distance: low-pass and
      // the allpass pair.
      const float fade = fade_.next();
      left = distance_[0].lowpass(left * fade);
      right = distance_[1].lowpass(right * fade);
      const float diffusion = diffusion_.next();
      for (int stage = 0; stage < 2; ++stage) {
        left = diffuser_[0][stage].process(left, diffuser_length_[0][stage], diffusion);
        right = diffuser_[1][stage].process(right, diffuser_length_[1][stage], diffusion);
      }

      const float mid = (left + right) * 0.5f * mid_.next();
      const float side = (left - right) * 0.5f * side_.next();
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip((mid + side) * volume);
      out_right_[i] = kit::soft_clip((mid - side) * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // Band-pass biquad with unity gain at its centre (the cookbook's constant
  // peak design), for the fixed resonance on the key.
  struct Band {
    float b0 = 0.0f, a1 = 0.0f, a2 = 0.0f;
    float x1 = 0.0f, x2 = 0.0f, y1 = 0.0f, y2 = 0.0f;

    void reset() { x1 = x2 = y1 = y2 = 0.0f; }
    void set(float hz, float q, float sample_rate) {
      const float w = kit::kTwoPi * hz / sample_rate;
      const float alpha = std::sin(w) / (2.0f * q);
      const float inverse = 1.0f / (1.0f + alpha);
      b0 = alpha * inverse;
      a1 = -2.0f * std::cos(w) * inverse;
      a2 = (1.0f - alpha) * inverse;
    }
    float process(float x) {
      const float y = flush_denormal(b0 * (x - x2) - a1 * y1 - a2 * y2);
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      return y;
    }
  };

  struct Voice {
    kit::Adsr env;
    kit::Noise noise[2];
    kit::Rng events;
    kit::Svf bed[2];
    kit::Svf tick[2];
    kit::OnePole rumble_a[2], rumble_b[2];
    Band ring[2];
    kit::Drift slow, flicker, wobble[2];
    float bed_gain[2] = {0.0f, 0.0f}, bed_target[2] = {0.0f, 0.0f}, bed_step[2] = {0.0f, 0.0f};
    float rumble_gain[2] = {0.0f, 0.0f}, rumble_target[2] = {0.0f, 0.0f}, rumble_step[2] = {0.0f, 0.0f};
    float event_rate = 1.0f;
    float event_centre = 1000.0f;
    float countdown = 0.0f;
    float wave_phase = 0.0f;
    float wave_jitter = 0.0f;
    float turn_phase = 0.0f;
    float hum_phase = 0.0f;
    float hum_increment = 0.0f;
    float hum_shape[kHumHarmonics] = {};
    float hz = 220.0f;
    float lean = 1.0f;
    float gain = 0.0f;

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.level(); }
  };

  // What an event is, per type: how wide its pitch scatters (octaves), how
  // short it is (Q), its quietest level, how strongly loud ones are the
  // exception (power of a uniform draw), how much reaches the far side, and
  // how loud the loudest is.
  struct EventKind {
    float scatter, q, floor;
    int rarity;
    float bleed, gain;
  };
  static constexpr EventKind kEvent[kKinds] = {
      {0.0f, 1.0f, 0.0f, 1, 0.0f, 0.0f},     // Wind: none
      {0.9f, 2.5f, 0.4f, 2, 0.2f, 0.80f},    // Rain: droplets
      {0.0f, 1.0f, 0.0f, 1, 0.0f, 0.0f},     // Sea: none
      {1.2f, 1.2f, 0.25f, 3, 0.45f, 0.55f},  // Fire: crackles
      {0.7f, 0.9f, 0.3f, 3, 0.3f, 0.70f},    // Vinyl: clicks
      {0.0f, 1.0f, 0.0f, 1, 0.0f, 0.0f},     // Hum: none
  };

  static constexpr int kControlPeriod = 32;
  static constexpr int kDiffuserSize = 2048;
  static constexpr float kDiffuserSeconds[2][2] = {{0.0047f, 0.0123f}, {0.0061f, 0.0109f}};
  static constexpr float kDiffuserGain = 0.65f;
  static constexpr float kTickFloor = 1.0e-7f;
  static constexpr float kRingQ = 25.0f;
  static constexpr float kRingGain = 14.0f;
  static constexpr float kHumOffset[kHumHarmonics] = {0.0f, 0.21f, 0.37f, 0.11f, 0.43f, 0.29f};
  // Levels that put one key at velocity 0.7 near -18 dBFS peak for each type.
  static constexpr float kWindGain = 1.5f;
  static constexpr float kRainHiss = 0.2f;
  static constexpr float kSeaGain = 0.8f;
  // White noise under the pink: it only gets through when a breaking wave
  // opens the filter, which is the foam.
  static constexpr float kSeaFoam = 0.2f;
  static constexpr float kFireRumble = 1.5f;
  static constexpr float kFireHiss = 0.2f;
  static constexpr float kVinylHiss = 0.035f;
  static constexpr float kVinylRumble = 1.6f;
  static constexpr float kHumGain = 0.25f;

  // An unrelated seed per stream. Seeding one xorshift from the next output
  // of another would hand out the same sequence one step apart.
  static uint32_t seed_for(uint32_t stream) {
    uint32_t x = (stream + 1u) * 0x9E3779B9u;
    x ^= x >> 16;
    x *= 0x85EBCA6Bu;
    x ^= x >> 13;
    x *= 0xC2B2AE35u;
    x ^= x >> 16;
    return x;
  }

  // Put a voice at the start of the current type: empty filters, the fixed
  // rates of its slow paths, the first event some way off.
  void prepare(Voice& voice) {
    const float sr = sample_rate();
    for (int c = 0; c < 2; ++c) {
      voice.bed[c].reset();
      voice.tick[c].reset();
      voice.rumble_a[c].reset();
      voice.rumble_b[c].reset();
      voice.ring[c].reset();
      const float rumble_hz = kind_ == kVinyl ? 45.0f : 140.0f;
      voice.rumble_a[c].set_cutoff(rumble_hz, sr);
      voice.rumble_b[c].set_cutoff(rumble_hz, sr);
    }
    voice.slow.set_rate(kind_ == kRain ? 0.07f : (kind_ == kFire ? 0.15f : 0.25f), sr);
    voice.flicker.set_rate(3.0f, sr);
    voice.wobble[0].set_rate(0.40f, sr);
    voice.wobble[1].set_rate(0.47f, sr);
    voice.countdown = voice.events.uniform() * 0.05f * sr;
    voice.wave_phase = 0.15f + 0.2f * voice.events.uniform();  // the first wave is already building
    voice.wave_jitter = 0.0f;
    voice.turn_phase = 0.0f;
  }

  // One event: an impulse, mostly on one side, into tick filters retuned to
  // a pitch of their own. The impulse is scaled by the peak of the retuned
  // filter's impulse response (found by running a copy for a few samples), so
  // a tick peaks at the drawn amplitude whatever its pitch.
  void strike(Voice& voice, float* hit, float sr) {
    const EventKind& event = kEvent[kind_];
    const float rate = kit::max(voice.event_rate, 0.01f);
    // Exponential gaps: a Poisson stream.
    voice.countdown += -std::log(1.0f - voice.events.uniform()) * sr / rate;
    const float draw = voice.events.uniform();
    float loud = draw;
    for (int n = 1; n < event.rarity; ++n) loud *= draw;
    const float amplitude = (event.floor + (1.0f - event.floor) * loud) * event.gain;
    const int near = static_cast<int>(voice.events.next_u32() >> 31);
    const float far = event.bleed * voice.events.uniform();
    for (int c = 0; c < 2; ++c) {
      const float hz = kit::clamp(voice.event_centre * std::exp2(event.scatter * voice.events.bipolar()),
                                  60.0f, 0.42f * sr);
      voice.tick[c].set(hz, event.q, sr);
      kit::Svf probe = voice.tick[c];
      probe.reset();
      float peak = std::fabs(probe.bandpass(1.0f));
      for (int n = 0; n < 5; ++n) peak = kit::max(peak, std::fabs(probe.bandpass(0.0f)));
      hit[c] = (c == near ? 1.0f : far) * amplitude / kit::max(peak, 1.0e-4f);
    }
  }

  // What the current type makes of Density and Tone, once per control step
  // for all voices: the colour (a frequency in Hz before the key leans it)
  // and the rate (gusts, drops, waves, crackles or clicks per second).
  void survey() {
    const float density = density_.value;
    const float tone = tone_.value;
    switch (kind_) {
      case kWind:
        colour_ = 180.0f * std::pow(16.0f, tone);
        rate_ = 0.04f * std::pow(20.0f, density);
        break;
      case kRain:
        colour_ = 1200.0f * std::pow(6.0f, tone);
        rate_ = 3.0f * std::pow(200.0f, density);
        break;
      case kSea:
        colour_ = 350.0f * std::pow(8.0f, tone);
        rate_ = 0.08f * std::pow(2.5f, density);
        break;
      case kFire:
        colour_ = 900.0f * std::pow(6.0f, tone);
        rate_ = 0.6f * std::pow(80.0f, density);
        break;
      case kVinyl:
        colour_ = 2000.0f * std::pow(4.0f, tone);
        hiss_colour_ = 2500.0f * std::pow(6.0f, tone);
        rate_ = 0.3f * std::pow(100.0f, density);
        break;
      default: {  // Hum: Density is how slowly the odd harmonics fall away
        colour_ = 150.0f * std::pow(40.0f, tone);
        const float fall = 2.6f - 2.0f * density;
        for (int h = 0; h < kHumHarmonics; ++h)
          hum_fall_[h] = std::pow(static_cast<float>(2 * h + 1), -fall);
        break;
      }
    }
  }

  // One control step of a voice: aim its filters and levels for the current
  // type. `snap` lands on the targets at once (note-on, type change).
  void shape(Voice& voice, bool snap) {
    const float sr = sample_rate();
    const float top = 0.45f * sr;
    const float density = density_.value;
    const float movement = movement_.value;
    const float colour = colour_ * voice.lean;
    float bed[2] = {0.0f, 0.0f};
    float rumble[2] = {0.0f, 0.0f};
    switch (kind_) {
      case kWind: {
        voice.slow.set_rate(rate_, sr);
        const float gust = kit::clamp(0.5f + 0.75f * voice.slow.next(kControlPeriod), 0.0f, 1.0f);
        const float pitched = resonance_.value;
        // Resonance pulls the band onto the key and narrows it into a whistle.
        float centre = colour * std::exp2(1.6f * movement * (1.0f - 0.9f * pitched) * (gust - 0.5f));
        float q = 1.2f;
        if (pitched > 0.0f) {
          centre *= std::pow(voice.hz / colour, pitched);
          q *= std::pow(25.0f, pitched);
        }
        for (int c = 0; c < 2; ++c) voice.bed[c].set(kit::min(centre, top), q, sr);
        // A narrower band passes less noise: keep the loudness.
        bed[0] = bed[1] = kWindGain * std::sqrt(q / 1.2f) * (1.0f - movement * (1.0f - gust));
        break;
      }
      case kRain: {
        const float swell = movement * voice.slow.next(kControlPeriod);
        voice.event_rate = rate_ * (swell != 0.0f ? std::exp2(1.2f * swell) : 1.0f);
        voice.event_centre = colour;
        for (int c = 0; c < 2; ++c) voice.bed[c].set(kit::min(1.5f * colour, top), 0.7f, sr);
        // Light rain is drops; the hiss arrives with the downpour.
        bed[0] = bed[1] = kRainHiss * (0.15f + 0.85f * density * density) * (1.0f + 0.5f * swell);
        break;
      }
      case kSea: {
        voice.wave_phase += rate_ * (1.0f + voice.wave_jitter) * static_cast<float>(kControlPeriod) / sr;
        if (voice.wave_phase >= 1.0f) {
          voice.wave_phase -= 1.0f;
          voice.wave_jitter = 0.12f * voice.events.bipolar();  // no two waves the same length
        }
        for (int c = 0; c < 2; ++c) {
          // The wave reaches the right a moment after the left.
          float phase = voice.wave_phase - 0.04f * static_cast<float>(c);
          if (phase < 0.0f) phase += 1.0f;
          // A slow build and a quicker run back: the crest sits at 63 % of the cycle.
          const float swell = 0.5f - 0.5f * kit::SineTable::cos_lookup(phase * std::sqrt(phase));
          const float crest = swell * swell * swell;
          const float cutoff = colour * std::exp2(2.6f * crest * (0.3f + 0.7f * movement));
          voice.bed[c].set(kit::min(cutoff, top), 0.6f, sr);
          bed[c] = kSeaGain * (1.0f - 0.92f * movement * (1.0f - swell * std::sqrt(std::sqrt(swell))));
        }
        break;
      }
      case kFire: {
        const float burst = movement * voice.slow.next(kControlPeriod);
        const float lick = kit::max(0.0f, 1.0f + 0.6f * movement * voice.flicker.next(kControlPeriod));
        voice.event_rate = rate_ * (burst != 0.0f ? std::exp2(1.5f * burst) : 1.0f);
        voice.event_centre = colour;
        for (int c = 0; c < 2; ++c) voice.bed[c].set(kit::min(0.7f * colour, top), 0.7f, sr);
        bed[0] = bed[1] = kFireHiss * lick;
        rumble[0] = rumble[1] = kFireRumble * lick;
        break;
      }
      case kVinyl: {
        voice.turn_phase += (33.333f / 60.0f) * static_cast<float>(kControlPeriod) / sr;
        if (voice.turn_phase >= 1.0f) voice.turn_phase -= 1.0f;
        const float turn = movement * kit::SineTable::lookup(voice.turn_phase);
        voice.event_rate = rate_;
        voice.event_centre = colour;
        for (int c = 0; c < 2; ++c) voice.bed[c].set(kit::min(hiss_colour_ * voice.lean, top), 0.7f, sr);
        bed[0] = bed[1] = kVinylHiss * (1.0f + 0.3f * turn);
        rumble[0] = rumble[1] = kVinylRumble * (1.0f + 0.6f * turn);
        break;
      }
      default: {  // Hum
        const float sag = voice.slow.next(kControlPeriod);
        voice.hum_increment = kit::min(voice.hz / sr, 0.45f) * (1.0f + 0.0035f * movement * sag);
        for (int h = 0; h < kHumHarmonics; ++h) {
          const float n = static_cast<float>(2 * h + 1);
          const float x = n * voice.hz / colour_;  // Tone is a ceiling in Hz, whatever the key
          voice.hum_shape[h] = n * voice.hz < top ? hum_fall_[h] / (1.0f + x * x) : 0.0f;
        }
        for (int c = 0; c < 2; ++c) {
          bed[c] =
              kHumGain * kit::max(0.0f, 1.0f + 0.25f * movement * voice.wobble[c].next(kControlPeriod));
        }
        break;
      }
    }
    // A long gap drawn at a low rate must not outlive a turn of Density.
    const float longest = 3.0f * sr / kit::max(voice.event_rate, 0.01f);
    if (voice.countdown > longest) voice.countdown = longest * voice.events.uniform();

    const float per_sample = 1.0f / static_cast<float>(kControlPeriod);
    for (int c = 0; c < 2; ++c) {
      // Land exactly on the last targets before leaving for the new ones.
      voice.bed_gain[c] = snap ? bed[c] : voice.bed_target[c];
      voice.bed_target[c] = bed[c];
      voice.bed_step[c] = (bed[c] - voice.bed_gain[c]) * per_sample;
      voice.rumble_gain[c] = snap ? rumble[c] : voice.rumble_target[c];
      voice.rumble_target[c] = rumble[c];
      voice.rumble_step[c] = (rumble[c] - voice.rumble_gain[c]) * per_sample;
    }
  }

  // Every 32 samples.
  void control(float sr) {
    using namespace atmosphere;
    density_.next();
    movement_.next();
    tone_.next();
    resonance_.next();

    // A type change waits for the dip to reach silence, then every sounding
    // voice starts the new type from empty filters.
    bool restart = false;
    if (pending_kind_ != kind_) {
      if (fade_.value <= 0.0f && fade_.remaining == 0) {
        kind_ = pending_kind_;
        fade_.set_target(1.0f);
        restart = true;
      } else {
        fade_.set_target(0.0f);
      }
    }
    survey();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      if (restart) prepare(voice);
      shape(voice, restart);
      voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    }

    // Wind whistles with its own band; the others ring a resonance on the key.
    const float pitched = kind_ == kWind ? 0.0f : resonance_.value;
    float ring = kRingGain * pitched * pitched;
    float dry = 1.0f - 0.5f * pitched;
    if (kind_ == kHum) {
      // The hum already sits on the resonance: hold its fundamental where it
      // is, so Resonance thins the harmonics instead of adding 20 dB.
      const float level = 1.0f / (dry + ring);
      ring *= level;
      dry *= level;
    }
    ring_.set(ring, ring_primed_);
    ring_dry_.set(dry, ring_primed_);
    ring_primed_ = true;

    const float size = size_.next();
    const float cutoff = 20000.0f * std::pow(0.05f, size);
    for (int c = 0; c < 2; ++c) distance_[c].set(cutoff, 0.6f, sr);
  }

  void apply(int id) {
    using namespace atmosphere;
    const float value = param(id);
    switch (id) {
      case kType:
        pending_kind_ = kit::clamp_int(static_cast<int>(value + 0.5f), 0, kKinds - 1);
        if (!primed()) kind_ = pending_kind_;
        break;
      case kDensity:
        density_.set(value, primed());
        break;
      case kMovement:
        movement_.set(value, primed());
        break;
      case kTone:
        tone_.set(value, primed());
        break;
      case kResonance:
        resonance_.set(value, primed());
        break;
      case kSize:
        size_.set(value, primed());
        diffusion_.set(kDiffuserGain * value, primed());
        break;
      case kWidth:
        // Constant power for two unrelated sides.
        mid_.set(std::sqrt(2.0f - value * value), primed());
        side_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock
    }
    if (!primed()) ring_primed_ = false;
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Svf distance_[2];
  kit::AllpassDelay<kDiffuserSize> diffuser_[2][2];
  int diffuser_length_[2][2] = {{1, 1}, {1, 1}};
  kit::Smoother density_, movement_, tone_, resonance_, size_;  // advanced on the control clock
  kit::Smoother diffusion_, ring_, ring_dry_, mid_, side_, volume_;
  kit::LinearRamp fade_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float colour_ = 1000.0f;
  float hiss_colour_ = 1000.0f;
  float rate_ = 1.0f;
  float hum_fall_[kHumHarmonics] = {};
  float hum_cos_[kHumHarmonics] = {};
  float hum_sin_[kHumHarmonics] = {};
  int kind_ = 0;
  int pending_kind_ = 0;
  bool ring_primed_ = false;
};

}  // namespace livemix
