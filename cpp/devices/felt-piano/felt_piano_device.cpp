#include "felt_piano_device.h"

namespace livemix {

namespace {
constexpr float kDefaults[18] = {
    0.65f,  // felt
    0.35f,  // hardness
    0.5f,   // detune
    1.0f,   // stiffness
    0.5f,   // thump
    0.4f,   // action
    0.4f,   // pedalNoise
    0.12f,  // grit
    0.5f,   // resonance
    0.5f,   // damper
    0.25f,  // reverbMix
    0.3f,   // reverbSize
    0.5f,   // width
    0.0f,   // outputDb
    0.0f,   // sustain
    0.0f,   // sostenuto
    0.0f,   // soft
    32.0f,  // polyphony
};
}  // namespace

void FeltPianoDevice::init(float sample_rate) {
  sample_rate_ = sample_rate;
  for (int i = 0; i < kParamCount; ++i) params_[i] = kDefaults[i];

  // PluginProcessor::prepareToPlay (:73-107).
  synth_.prepare(static_cast<double>(sample_rate), &ghost_pool_);
  ghost_pool_.prepare(static_cast<double>(sample_rate));
  ghost_pool_.reset();
  sympathetic_.prepare(static_cast<double>(sample_rate));
  stereo_widener_.prepare(static_cast<double>(sample_rate));
  reverb_.prepare(static_cast<double>(sample_rate));
  damper_noise_.prepare(static_cast<double>(sample_rate));
  damper_noise_.seed(0xDA3BE201u);
  grit_rng_.seed(0xFE17F317u);

  sm_grit_.reset(sample_rate, kRampSeconds, kDefaults[7]);
  sm_reverb_mix_.reset(sample_rate, kRampSeconds, kDefaults[10]);
  sm_width_.reset(sample_rate, kRampSeconds, kDefaults[12]);
  sm_output_gain_.reset(sample_rate, kRampSeconds, decibels_to_gain(kDefaults[13]));
  last_output_db_ = kDefaults[13];
  last_applied_width_ = -1.0f;

  grit_env_ = 0.0f;
  grit_noise_lp_ = 0.0f;
  // SR-derived grit constants: ~470 Hz noise-floor lowpass and ~100 ms
  // envelope release at any rate.
  grit_noise_coeff_ = 1.0f - std::exp(-6.2831853f * 470.0f / sample_rate);
  grit_env_decay_ = std::exp(-1.0f / (0.1f * sample_rate));

  sustain_down_ = false;
  sostenuto_down_ = false;
  soft_down_ = false;
  primed_ = false;

  idle_frames_ = 0;
  idle_flush_frames_ = static_cast<int>(kIdleFlushSeconds * sample_rate);
  idle_ = true;

  for (int i = 0; i < kMaxBlockFrames; ++i) {
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;
    out_left_[i] = 0.0f;
    out_right_[i] = 0.0f;
  }
  update_voice_parameters();
}

int FeltPianoDevice::midi_note_for(float frequency) {
  if (!(frequency > 0.0f)) return kLowestKey;
  const float note = 69.0f + 12.0f * std::log2(frequency / 440.0f);
  int midi = static_cast<int>(std::floor(note + 0.5f));
  if (midi < kLowestKey) midi = kLowestKey;
  if (midi > kHighestKey) midi = kHighestKey;
  return midi;
}

void FeltPianoDevice::set_param(FeltPianoParam param, float value) {
  const int index = static_cast<int>(param);
  if (index < 0 || index >= kParamCount) return;

  switch (param) {
    case FeltPianoParam::kStiffness:
      value = value < 0.0f ? 0.0f : (value > 2.0f ? 2.0f : value);
      break;
    case FeltPianoParam::kOutputDb:
      value = value < -24.0f ? -24.0f : (value > 12.0f ? 12.0f : value);
      break;
    case FeltPianoParam::kPolyphony:
      value = std::floor(value + 0.5f);
      value = value < 1.0f ? 1.0f : (value > 32.0f ? 32.0f : value);
      synth_.set_polyphony(static_cast<int>(value));
      break;
    default:
      value = clamp01(value);
      break;
  }
  params_[index] = value;

  // Pedal transitions: PluginProcessor::handleMidiControllers (:115-154) and
  // juce::Synthesiser's controller handling for CC64/66/67.
  switch (param) {
    case FeltPianoParam::kSustain: {
      const bool is_down = value >= 0.5f;
      if (is_down != sustain_down_) {
        const float pedal_noise_level = params_[static_cast<int>(FeltPianoParam::kPedalNoise)];
        if (pedal_noise_level > 0.001f) {
          if (is_down) {
            damper_noise_.trigger(60.0f, 1200.0f, 0.10f * pedal_noise_level, 60.0f, 450.0f);
          } else {
            damper_noise_.trigger(45.0f, 1500.0f, 0.08f * pedal_noise_level, 80.0f, 700.0f);
          }
        }
        sustain_down_ = is_down;
        synth_.handle_sustain_pedal(is_down);
      }
      break;
    }
    case FeltPianoParam::kSostenuto: {
      const bool is_down = value >= 0.5f;
      if (is_down != sostenuto_down_) {
        sostenuto_down_ = is_down;
        synth_.handle_sostenuto_pedal(is_down);
      }
      break;
    }
    case FeltPianoParam::kSoft:
      soft_down_ = value >= 0.5f;
      break;
    default:
      break;
  }
}

// PluginProcessor::updateVoiceParameters (:156-184).
void FeltPianoDevice::update_voice_parameters() {
  ModeTable::CharacterParams cp;
  cp.felt = params_[static_cast<int>(FeltPianoParam::kFelt)];
  cp.hardness = params_[static_cast<int>(FeltPianoParam::kHardness)];
  cp.stiffness = params_[static_cast<int>(FeltPianoParam::kStiffness)];
  cp.detune = params_[static_cast<int>(FeltPianoParam::kDetune)];
  cp.softPedal = soft_down_;

  const float thump = params_[static_cast<int>(FeltPianoParam::kThump)];
  const float action = params_[static_cast<int>(FeltPianoParam::kAction)];
  const float damper_speed = params_[static_cast<int>(FeltPianoParam::kDamper)];
  const float cc64 = params_[static_cast<int>(FeltPianoParam::kSustain)];

  for (int i = 0; i < synth_.num_voices(); ++i) {
    FeltVoice* voice = synth_.voice(i);
    voice->set_character(cp);
    voice->set_noise_levels(thump, action);
    voice->set_damper(cc64, damper_speed);
  }

  sympathetic_.setPedal(cc64);
  sympathetic_.setAmount(params_[static_cast<int>(FeltPianoParam::kResonance)]);
  sympathetic_.updateBlockRate();

  reverb_.setSize(params_[static_cast<int>(FeltPianoParam::kReverbSize)]);
}

void FeltPianoDevice::note_on(int note_id, float frequency, float gain) {
  update_voice_parameters();
  synth_.note_on(note_id, midi_note_for(frequency), clamp01(gain));
  idle_ = false;
  idle_frames_ = 0;
}

void FeltPianoDevice::note_off(int note_id) { synth_.note_off(note_id, 0.0f, true); }

void FeltPianoDevice::flush_idle_state() {
  reverb_.reset();
  sympathetic_.reset();
  sympathetic_.updateBlockRate();
  stereo_widener_.reset();
  damper_noise_.prepare(static_cast<double>(sample_rate_));
  grit_env_ = 0.0f;
  grit_noise_lp_ = 0.0f;
  idle_ = true;
}

// PluginProcessor::processBlock (:186-290).
void FeltPianoDevice::process(int frames) {
  if (frames > kMaxBlockFrames) frames = kMaxBlockFrames;

  for (int i = 0; i < frames; ++i) {
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;
    out_left_[i] = 0.0f;
    out_right_[i] = 0.0f;
  }

  update_voice_parameters();

  float* left = out_left_;
  float* right = out_right_;

  synth_.render(left, right, frames);

  // Stolen-note tails fade here, after the synth render.
  ghost_pool_.render(left, right, frames);

  sm_grit_.set_target(params_[static_cast<int>(FeltPianoParam::kGrit)]);
  sm_reverb_mix_.set_target(params_[static_cast<int>(FeltPianoParam::kReverbMix)]);
  sm_width_.set_target(params_[static_cast<int>(FeltPianoParam::kWidth)]);
  const float output_db = params_[static_cast<int>(FeltPianoParam::kOutputDb)];
  if (output_db != last_output_db_) {
    sm_output_gain_.set_target(decibels_to_gain(output_db));
    last_output_db_ = output_db;
  }
  if (!primed_) {
    // Params set before the first block take effect at once rather than
    // ramping under the first attack.
    for (LinearRamp* ramp : {&sm_grit_, &sm_reverb_mix_, &sm_width_, &sm_output_gain_}) {
      ramp->snap();
    }
    primed_ = true;
  }

  const float pedal_noise_level = params_[static_cast<int>(FeltPianoParam::kPedalNoise)];

  // A rung-out pedal burst would otherwise iterate its one-poles on denormals
  // forever (see FeltVoice::flush_decayed_state).
  if (!damper_noise_.isActive()) damper_noise_.prepare(static_cast<double>(sample_rate_));

  bool bus_silent = true;
  float out_peak = 0.0f;

  for (int s = 0; s < frames; ++s) {
    float l = left[s];
    float r = right[s];

    // Damper/pedal noise: audible dry and feeding the sympathetic bank.
    const float dn = damper_noise_.process() * (0.5f + pedal_noise_level);
    l += dn;
    r += dn;
    if (l != 0.0f || r != 0.0f) bus_silent = false;

    const float mono = (l + r) * 0.5f;

    // Sympathetic resonance: strictly additive (resonance = 0 is bit-transparent).
    sympathetic_.processAdd(mono, l, r);

    // Grit: rational-tanh drive with makeup, plus a close-mic noise floor
    // gated by bus energy so idle stays digitally silent.
    const float g = sm_grit_.next();
    if (g > 0.0005f) {
      grit_env_ = flush_denormal(std::max(std::fabs(mono), grit_env_ * grit_env_decay_));
      grit_noise_lp_ = flush_denormal(grit_noise_lp_ + grit_noise_coeff_ * (grit_rng_.nextBipolar() - grit_noise_lp_));
      const float floor_noise = grit_noise_lp_ * g * g * grit_env_ * 0.012f;
      const float drive = 1.0f + 3.0f * g;
      const float inv = (1.0f + 0.4f * g) / drive;
      const float wl = FeltMath::rationalTanh((l + floor_noise) * drive) * inv;
      const float wr = FeltMath::rationalTanh((r + floor_noise) * drive) * inv;
      l += g * (wl - l);
      r += g * (wr - r);
    }

    // Image: width shapes the instrument before the room; only push the
    // width when it actually moved (setWidth rederives a sqrt).
    const float w = sm_width_.next();
    if (w != last_applied_width_) {
      stereo_widener_.setWidth(w);
      last_applied_width_ = w;
    }
    stereo_widener_.process(l, r);

    // Room.
    reverb_.processSample(l, r, sm_reverb_mix_.next());

    // Output gain, then the safety limiter.
    const float og = sm_output_gain_.next();
    l = FeltMath::softLimit(l * og);
    r = FeltMath::softLimit(r * og);

    left[s] = l;
    right[s] = r;

    const float al = std::fabs(l), ar = std::fabs(r);
    out_peak = al > out_peak ? al : out_peak;
    out_peak = ar > out_peak ? ar : out_peak;
  }

  // Idle flush: once the voices, ghosts and damper noise have gone exactly
  // silent and every tail has fallen below -180 dBFS for kIdleFlushSeconds,
  // reset the feedback paths so nothing idles on denormals.
  if (!bus_silent || out_peak >= kIdleOutputThreshold || synth_.active_voice_count() > 0) {
    idle_ = false;
    idle_frames_ = 0;
    return;
  }
  if (idle_) return;
  idle_frames_ += frames;
  if (idle_frames_ >= idle_flush_frames_) {
    flush_idle_state();
    for (int s = 0; s < frames; ++s) {
      left[s] = 0.0f;
      right[s] = 0.0f;
    }
  }
}

}  // namespace livemix
