#pragma once

// Common Air, the sound of one stretch between two control ticks.
// Included by common_air.h.

namespace livemix {

inline void CommonAir::render(int at, int count) {
  using namespace common_air;
  bank_.run(count, keys_, seconds_, depth_, depth_step_);
  depth_ += depth_step_ * static_cast<float>(count);
  for (int i = 0; i < count; ++i) {
    bus_left_[i] = 0.0f;
    bus_right_[i] = 0.0f;
  }
  for (int v = 0; v < kVoices; ++v) {
    Voice& voice = pool_.voices[v];
    if (!voice.sounding) continue;
    const float bar_step = kBarRatio * voice.hz / sample_rate();
    const bool bar = voice.bar > 1.0e-6f && kBarRatio * voice.hz < kit::min(9500.0f, 0.4f * sample_rate());
    const float bar_level = kVoiceGain * shape_[4] * touch_of(voice.gain) * voice.gate *
                            kit::max(0.0f, voice.fade) * voice.bar *
                            kit::clamp((9500.0f - kBarRatio * voice.hz) * (1.0f / 4000.0f), 0.0f, 1.0f);
    for (int which = 0; which < 2; ++which) {
      const int k = v + which * kVoices;
      Lane& lane = lane_[k];
      if (which == 1 && lane.level <= 0.0f && lane.noise == 0.0f && bank_.g[k] == 0.0f) continue;
      float wet = pipe_wet_;
      float hold = pipe_hold_;
      float peak = 0.0f;
      for (int i = 0; i < count; ++i) {
        wet += pipe_wet_step_;
        hold += pipe_hold_step_;
        lane.noise += lane.dnoise;
        float x = bank_.flow[i][k];
        // The air is let through when the reed is open.
        const float white = lane.white.bipolar();
        lane.low += (white - lane.low) * voice.noise_low;
        lane.round += (lane.low - lane.round) * voice.noise_low;
        lane.slow += (lane.round - lane.slow) * voice.noise_slow;
        const float open = kit::clamp(1.0f + 9.0f * x, 0.25f, 2.2f);
        x += lane.noise * (lane.round - lane.slow) * open;
        if (bar && which == 0) {
          voice.bar_at += bar_step_level_ * (bar_level - voice.bar_at);
          x += voice.bar_at * kit::SineTable::lookup(voice.bar_phase);
          voice.bar_phase += bar_step;
          voice.bar_phase -= voice.bar_phase >= 1.0f ? 1.0f : 0.0f;
        }
        float y = x;
        if (piped_) {
          const float p = pipe_[k].process(x, hold);
          const float size = p < 0.0f ? -p : p;
          if (size > peak) peak = size;
          y = x + wet * (p - x);
        }
        lane.gl += lane.dl;
        lane.gr += lane.dr;
        bus_left_[i] += y * lane.gl;
        bus_right_[i] += y * lane.gr;
      }
      if (peak > voice.peak) voice.peak = peak;
    }
  }
  pipe_wet_ += pipe_wet_step_ * static_cast<float>(count);
  pipe_hold_ += pipe_hold_step_ * static_cast<float>(count);
  for (int i = 0; i < count; ++i) {
    cup_at_ += cup_step_;
    const float volume = volume_.next();
    float bus[2] = {bus_left_[i], bus_right_[i]};
    for (int side = 0; side < 2; ++side) {
      const float x = rumble_[side].process(bus[side]);
      float y = 0.75f * dark_[side].lowpass(x);
      for (int n = 0; n < 3; ++n) y += formant_gain_[n] * formant_[side][n].bandpass(x);
      bus[side] = x + cup_at_ * (y - x);
    }
    out_left_[at + i] = kit::soft_clip(bus[0] * volume);
    out_right_[at + i] = kit::soft_clip(bus[1] * volume);
  }
}

}  // namespace livemix
