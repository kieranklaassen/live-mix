#include "SympatheticBank.h"
#include <cmath>

namespace
{
// String tunings: one chromatic octave of low strings (C2..B2). A Karplus-
// Strong loop resonates at every multiple of its fundamental, so a low string
// of each pitch class gives every played note a resonant partner through its
// harmonic series — matching how real pedal-down bass strings carry most of
// the sympathetic bloom. (An A/E-only spread left most pitch classes silent.)
constexpr int kStringNotes[SympatheticBank::kNumStrings] = {
    36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47
};

float noteToHz(int midiNote)
{
    return 440.0f * std::exp2(static_cast<float>(midiNote - 69) / 12.0f);
}
} // namespace

void SympatheticBank::prepare(double sr)
{
    sampleRate = static_cast<float>(sr);

    // In-loop damping lowpass at ~3.3 kHz regardless of sample rate.
    dampCoeff = 1.0f - std::exp(-6.2831853f * 3300.0f / sampleRate);

    for (int i = 0; i < kNumStrings; ++i)
    {
        auto& s = strings[i];
        const float freq = noteToHz(kStringNotes[i]);

        // Total loop delay = fs / f; split into integer + Thiran fractional part
        // (allpass adds ~1 sample).
        const float totalDelay = sampleRate / freq;
        s.delayLength = static_cast<int>(totalDelay) - 1;
        if (s.delayLength < 2)
            s.delayLength = 2;
        if (s.delayLength > kMaxDelay - 2)
            s.delayLength = kMaxDelay - 2;

        float d = totalDelay - static_cast<float>(s.delayLength) - 1.0f + 1.0f;
        d = d < 0.5f ? 0.5f : (d > 1.5f ? 1.5f : d);
        s.allpassCoeff = (1.0f - d) / (1.0f + d);

        // Strings panned across the field, bass left.
        const float pos = static_cast<float>(i) / static_cast<float>(kNumStrings - 1);
        const float angle = pos * 1.5707963f;
        s.panL = std::cos(angle);
        s.panR = std::sin(angle);
    }

    reset();
}

void SympatheticBank::reset()
{
    for (auto& s : strings)
    {
        s.buffer.fill(0.0f);
        s.writeIndex = 0;
        s.allpassState = 0.0f;
        s.dampState = 0.0f;
        s.dcX1 = s.dcY1 = 0.0f;
        s.feedback = 0.0f;
    }
    lastAppliedCc64 = -1.0f;
}

void SympatheticBank::updateBlockRate()
{
    // Only recompute the 12 pow() calls when the pedal actually moved.
    if (std::abs(cc64 - lastAppliedCc64) < 0.004f)
        return;
    lastAppliedCc64 = cc64;

    // Pedal opens the dampers: RT60 sweeps ~0.12 s (damped, faint struck-string
    // coupling) to ~3.5 s (open bloom). Continuous CC64 gives a progressive lift.
    const float rt60 = 0.12f + 3.38f * cc64;

    for (auto& s : strings)
    {
        const float delaySeconds = static_cast<float>(s.delayLength + 1) / sampleRate;
        float fb = std::pow(0.001f, delaySeconds / rt60);
        s.feedback = fb > 0.998f ? 0.998f : fb;
    }
}
