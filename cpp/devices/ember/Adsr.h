#pragma once

#include <cmath>

namespace tatami::dsp
{

/**
    Exponential ADSR with analog-style segment timing:
    - attack reaches 1.0 at exactly the attack time (the curve aims 30 % above the peak and
      is clipped, the classic "RC into a comparator" shape),
    - decay and release are exponential and complete 60 dB of their travel at exactly the
      set time, then keep decaying; the envelope reports idle below -100 dB.
    Times are recomputed only when a setter changes them, so per-block calls are cheap.
*/
class Adsr
{
public:
    enum class Stage { idle = 0, attack, decay, sustain, release };

    static constexpr float kAttackOvershoot = 0.3f;
    static constexpr float kSixtyDb = 6.907755279f;     // ln (1000)
    static constexpr float kIdleLevel = 1.0e-5f;

    void setSampleRate (double newRate) noexcept
    {
        sampleRate = newRate;
        recompute();
    }

    void setTimes (float attackSeconds, float decaySeconds, float sustainLevel, float releaseSeconds) noexcept
    {
        if (same (attackSeconds, attack) && same (decaySeconds, decay) && same (sustainLevel, sustain) && same (releaseSeconds, release))
            return;
        attack = attackSeconds;
        decay = decaySeconds;
        sustain = sustainLevel < 0.0f ? 0.0f : (sustainLevel > 1.0f ? 1.0f : sustainLevel);
        release = releaseSeconds;
        recompute();
    }

    void noteOn() noexcept
    {
        stage = Stage::attack;
        if (attackSamples <= 1.0f)
            level = 1.0f;
    }

    void noteOff() noexcept
    {
        if (stage != Stage::idle)
            stage = Stage::release;
    }

    /** Immediate silence (voice steal, reset). */
    void reset() noexcept
    {
        stage = Stage::idle;
        level = 0.0f;
    }

    /** Fast fade for voice stealing: a release that completes in `seconds`. */
    void fastRelease (float seconds) noexcept
    {
        stage = Stage::release;
        releaseCoef = std::exp (-kSixtyDb / std::fmax (1.0f, seconds * (float) sampleRate));
    }

    float next() noexcept
    {
        switch (stage)
        {
            case Stage::idle:
                return 0.0f;
            case Stage::attack:
                level += attackRate * (attackTarget - level);
                if (level >= 1.0f)
                {
                    level = 1.0f;
                    stage = Stage::decay;
                }
                return level;
            case Stage::decay:
                level = sustain + (level - sustain) * decayCoef;
                if (level - sustain < kIdleLevel)
                {
                    level = sustain;
                    stage = Stage::sustain;
                }
                return level;
            case Stage::sustain:
                level = sustain;
                return level;
            case Stage::release:
                level *= releaseCoef;
                if (level < kIdleLevel)
                {
                    level = 0.0f;
                    stage = Stage::idle;
                }
                return level;
        }
        return 0.0f;
    }

    bool isActive() const noexcept { return stage != Stage::idle; }
    bool isReleasing() const noexcept { return stage == Stage::release; }
    Stage currentStage() const noexcept { return stage; }
    float value() const noexcept { return level; }

private:
    static bool same (float a, float b) noexcept { return ! (a < b || a > b); }

    void recompute() noexcept
    {
        const auto sr = (float) sampleRate;
        attackSamples = std::fmax (1.0f, attack * sr);
        // Aim for 1 + overshoot so that level == 1 after exactly attackSamples steps.
        attackTarget = 1.0f + kAttackOvershoot;
        attackRate = 1.0f - std::exp (std::log (kAttackOvershoot / attackTarget) / attackSamples);
        decayCoef = std::exp (-kSixtyDb / std::fmax (1.0f, decay * sr));
        releaseCoef = std::exp (-kSixtyDb / std::fmax (1.0f, release * sr));
    }

    double sampleRate = 44100.0;
    float attack = 0.01f, decay = 0.1f, sustain = 1.0f, release = 0.1f;
    float attackSamples = 441.0f, attackTarget = 1.3f, attackRate = 0.01f;
    float decayCoef = 0.999f, releaseCoef = 0.999f;
    Stage stage = Stage::idle;
    float level = 0.0f;
};

} // namespace tatami::dsp
