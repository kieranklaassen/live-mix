#pragma once

#include <cmath>
#include "ModalBank.h"
#include "FeltMath.h"

// Per-note physics model, evaluated at startNote (bounded fixed-time math, no
// allocation). Fills a ModalBank with mode coefficients, gains, and expiry times.
//
// Calibrated against MEASURED piano data (deep-research pass, June 2026):
// - Inharmonicity B: Fletcher 1964 / Young / Pianoteq measured-grand tables.
//   Grand anchors: A0~2.9e-4, C4~3.1e-4 (near-flat through the bass break),
//   A4~6e-4, C6~2.1e-3, C8~1.4e-2. A4 partial-2 stretch ~2 cents. Bell
//   character begins around B>2e-3 mid-register — the original curve was
//   8-15x too stiff and tuned the instrument like a carillon.
// - Decay: Wogram/Weinreich. T60(key) ~ 36*exp(-0.036*key), extra treble
//   rolloff above ~C7. Per-partial T60 ~ T60(1) * n^-1.5 (losses ~ w^1.5).
// - Double decay (Weinreich): unison strings mistuned 0.3-1.5 cents produce a
//   fast "prompt" decay (~4x rate) then a slow aftersound. Modeled as a
//   detuned duplicate mode carrying the prompt component (louder, T60 x0.3).
// - Amplitude: struck-string 1/sqrt(n) x hammer-position comb (softened — real
//   hammers have width) x gentle radiation tilt. Applied ONCE, at injection;
//   output gains are flat (the original applied it at both ends, squaring the
//   envelope and burying the fundamental).
//
// Note-on transcendental cost: sin/cos in double for pitch accuracy; bounded
// (~300 libm calls/note, measured 10-40 us).
namespace ModeTable
{
struct CharacterParams
{
    float felt = 0.65f;      // 0..1
    float hardness = 0.35f;  // 0..1
    float stiffness = 1.0f;  // 0..2 (scales inharmonicity B)
    float detune = 0.5f;     // 0..1 (scales unison detune cents)
    bool softPedal = false;  // CC67 una corda
};

// Mode count by register, fs-independent (96 kHz adds throughput, never modes).
inline int partialCountForNote(int midiNote) noexcept
{
    const int n = 112 - midiNote; // note 21 -> 91, note 108 -> 16 (before clamping)
    return n < 16 ? 16 : (n > 96 ? 96 : n);
}

// Unison string count: real pianos use 1 wound string for the lowest notes,
// 2 through the low bass, 3 from roughly G1 up. The ensemble of slightly
// mistuned strings IS the piano's chorus — a single resonator per partial
// reads as thin the moment the attack fades.
inline int stringCountForNote(int midiNote) noexcept
{
    if (midiNote <= 26) return 1;  // A0..D1
    if (midiNote <= 32) return 2;  // Eb1..Ab1
    return 3;
}

// Strike position d/L: ~1/8 in the bass narrowing toward ~1/15 in the treble
// (Conklin). Sets the comb nulls around partials 8/16.
inline float strikePositionForNote(int midiNote) noexcept
{
    return 0.125f - 0.058f * static_cast<float>(midiNote - 21) / 87.0f;
}

// Soundboard body gain, MEASURED from the Logic Steinway factory library:
// median per-partial residual (after removing each note's smooth trend) across
// 235 sampled notes / 2002 partials, binned on a log grid 27.5 Hz .. 18 kHz.
// Carries the real instrument's fixed-frequency features (the ~100 Hz body
// bump, the ~350 Hz radiation peak, the ~420 Hz notch).
constexpr float kBodyCurveDb[40] = {
    1.5f, 1.5f, 1.5f, 1.5f, 1.5f, 1.5f, -0.9f, 6.4f, -1.3f, -1.0f,
    1.1f, -1.3f, 0.7f, 5.4f, -7.1f, 1.6f, -0.7f, -0.0f, 0.5f, -2.6f,
    -0.1f, 1.1f, -0.6f, -0.5f, 0.9f, 0.6f, -0.7f, -1.1f, 0.9f, -0.3f,
    0.6f, -0.9f, -0.5f, -0.4f, 0.6f, 0.6f, 0.6f, 0.6f, 0.6f, 0.6f
};

inline float bodyGainDb(float hz) noexcept
{
    // log-spaced bins: index = 39 * log(f/27.5) / log(18000/27.5)
    const float x = 39.0f * std::log(hz / 27.5f) * 0.154235f; // 1/ln(18000/27.5)
    if (x <= 0.0f) return kBodyCurveDb[0];
    if (x >= 39.0f) return kBodyCurveDb[39];
    const int i = static_cast<int>(x);
    const float t = x - static_cast<float>(i);
    return kBodyCurveDb[i] + t * (kBodyCurveDb[i + 1] - kBodyCurveDb[i]);
}

// Inharmonicity coefficient B per note — measured-grand curve. Near-flat
// ~2.6e-4..3.1e-4 through the bass/tenor (wound-string design minimizes B),
// then exponential rise above C4 to ~1.1e-2 at C8.
inline float inharmonicityForNote(int midiNote) noexcept
{
    if (midiNote >= 60)
        return 3.1e-4f * std::exp(0.075f * static_cast<float>(midiNote - 60));
    return 2.6e-4f + 0.5e-4f * static_cast<float>(midiNote - 21) / 39.0f;
}

// Aftersound (slow-phase) T60 per note in seconds. Decay constant softened to
// 0.031 after measuring the Steinway library's mid-register fundamentals
// (~8-11 s around A4 vs the literature model's 5.7). Anchors: A0~36 s,
// C4~10.7 s, A4~8.1 s, C7~2.0 s, C8~0.7 s.
inline float baseT60ForNote(int midiNote) noexcept
{
    float t = 36.0f * std::exp(-0.031f * static_cast<float>(midiNote - 21));
    if (midiNote > 85)
        t *= std::exp(-static_cast<float>(midiNote - 85) / 20.0f);
    return t;
}

// Fills the bank for one note. Velocity shaping lives in HammerExciter — the
// bank's gains are velocity-independent by design.
inline void buildNote(ModalBank& bank, int midiNote,
                      const CharacterParams& cp, double sampleRate)
{
    const float fs = static_cast<float>(sampleRate);
    const float f0 = 440.0f * std::exp2(static_cast<float>(midiNote - 69) / 12.0f);
    const float B = inharmonicityForNote(midiNote) * cp.stiffness;

    // Felt moderator adds slight string damping: ~25% shorter sustain (measured
    // on felt-moderated uprights), far less than the attack darkening.
    const float baseT60 = baseT60ForNote(midiNote) * (1.0f - 0.28f * cp.felt);

    const int numPartials = partialCountForNote(midiNote);
    // fs-independent spectral ceiling: 96 kHz gets throughput, never extra
    // modes (SR-consistent timbre and CPU; plan R13). The 0.47*fs term only
    // bites below ~44.1 kHz.
    const float nyquistLimit = 0.47f * fs < 21000.0f ? 0.47f * fs : 21000.0f;

    // Unison mistuning for the Weinreich double decay: ~0.5-1.2 cents at the
    // nominal control setting, larger in the bass.
    const float detuneCents =
        (1.2f - 0.7f * static_cast<float>(midiNote - 21) / 87.0f) * (2.0f * cp.detune);

    // Strike-position comb sin(n*pi*x) via sine recurrence (no per-mode libm).
    const float strikePos = strikePositionForNote(midiNote);
    const double alpha = 3.141592653589793 * static_cast<double>(strikePos);
    const double twoCosA = 2.0 * std::cos(alpha);
    double combPrev = 0.0;               // sin(0 * alpha)
    double combCur = std::sin(alpha);    // sin(1 * alpha)

    const float outScale = 0.5f / std::sqrt(static_cast<float>(numPartials));
    const float twoPiOverFs = 6.2831853071795864f / fs;
    const float ln1000 = 6.907755f;

    int idx = 0;
    const int maxModes = ModalBank::kCapacity;

    for (int n = 1; n <= numPartials && idx < maxModes - 1; ++n)
    {
        const float nf = static_cast<float>(n);
        const float sqrtN = std::sqrt(nf);
        const float fn = nf * f0 * std::sqrt(1.0f + B * nf * nf);
        if (fn >= nyquistLimit)
            break;

        // Per-partial decay for the PROMPT phase: losses ~ w^1.5 ->
        // T60(n) ~ n^-1.5 (Weinreich/Bank). The slow aftersound string gets a
        // gentler exponent below (its HF rings for seconds on a real
        // instrument — with n^-1.5 on every string the 1.5-4 kHz sustain went
        // tonally empty and any residual floor read as noise).
        float t60 = baseT60 / (nf * sqrtN);
        if (t60 < 0.035f)
            t60 = 0.035f;
        // MEASURED on the Steinway refs: aftersound T60 is nearly FLAT across
        // partials (C3: p1 6.0s vs p12 4.9s; C4: 5.0 vs 5.2) — the steep
        // n-dependence belongs to the prompt phase only. Slight n decline plus
        // air absorption at absolute frequency fits all four reference notes.
        float t60slow = baseT60 * std::pow(nf, -0.3f) / (1.0f + fn / 9000.0f);
        if (t60slow < 0.05f)
            t60slow = 0.05f;

        // Amplitude, applied ONCE (injection side): struck-string 1/sqrt(n),
        // width-softened strike comb (a real hammer's width fills the
        // theoretical nulls — model as a floor), gentle radiation tilt.
        const float comb = 0.15f + 0.85f * std::abs(static_cast<float>(combCur));
        float amp = (comb / sqrtN) / (1.0f + fn / 12000.0f);

        // Soundboard radiation highpass (~90 Hz corner): the lowest octave's
        // fundamentals radiate weakly from a real soundboard — the ear
        // reconstructs the pitch from the partials. Full-strength bass
        // fundamentals are a synthesizer tell.
        amp *= fn / std::sqrt(fn * fn + 90.0f * 90.0f);

        // Soundboard coloration: the MEASURED Steinway body curve (fixed in
        // absolute frequency) plus a gentle synthetic fine-ripple for the
        // mode density the 40-bin measurement can't resolve. The combination
        // breaks the smooth mathematical envelope that reads as "synthetic"
        // without overdriving the irregularity (the measured shared ripple is
        // gentler than per-note profiles suggest — those also carry comb and
        // unison variation, which the model already produces elsewhere).
        {
            const float L = std::log2(fn / 27.5f);
            const float fineDb = 2.2f * std::sin(9.7f * L + 4.1f)
                               + 1.6f * std::sin(14.3f * L + 0.7f);
            amp *= std::exp(0.1151f * (bodyGainDb(fn) + fineDb)); // dB -> linear
        }

        // Advance comb recurrence: sin((n+1)a) = 2cos(a)sin(na) - sin((n-1)a)
        const double combNext = twoCosA * combCur - combPrev;
        combPrev = combCur;
        combCur = combNext;

        // UNISON ENSEMBLE: one mode per physical string of this note. Each
        // string is slightly mistuned (the tuner's unison spread, ~1-2 cents
        // total) and couples to the bridge slightly differently, so each gets
        // its own decay rate: the fast string carries the Weinreich "prompt"
        // attack, the slow one the aftersound, and because ALL strings ring
        // for seconds, the beating chorus persists through the whole note —
        // a single surviving resonator per partial is what reads as "thin,
        // like one string". Upper partials keep one string (their beating is
        // masked and they decay in milliseconds anyway).
        const int nStrings = (n <= (numPartials * 3) / 5) ? stringCountForNote(midiNote) : 1;
        for (int s = 0; s < nStrings && idx < maxModes - 1; ++s)
        {
            // cents offsets: 1 string {0}; 2 strings {-de/2,+de/2};
            // 3 strings {-de, +0.18de, +de} (slightly asymmetric, like a tuner)
            float cents = 0.0f;
            if (nStrings == 2)
                cents = (s == 0 ? -0.5f : 0.5f) * detuneCents;
            else if (nStrings == 3)
                cents = (s == 0 ? -1.0f : (s == 1 ? 0.18f : 1.0f)) * detuneCents;

            const float fd = fn * (1.0f + cents * 5.78e-4f);
            if (fd >= nyquistLimit)
                continue;

            // Per-string decay spread: prompt ~2x faster than aftersound,
            // and the aftersound string keeps its high partials singing.
            const float t60s = (s == 0 ? t60slow : t60 * (s == 1 ? 0.62f : 0.45f));
            const float amps = amp * (s == 0 ? 1.0f : (s == 1 ? 0.95f : 0.9f));

            const float rs = FeltMath::fastExpNegSmall(ln1000 / (t60s * fs));
            const double thetaS = static_cast<double>(twoPiOverFs * fd);
            const bool even = (idx & 1) == 0;
            bank.aRe[idx] = rs * static_cast<float>(std::cos(thetaS));
            bank.aIm[idx] = rs * static_cast<float>(std::sin(thetaS));
            bank.gainA[idx] = even ? outScale : 0.0f;
            bank.gainB[idx] = even ? 0.0f : outScale;
            bank.inGain[idx] = amps;
            bank.expiry[idx] = static_cast<int>(t60s * fs * 1.2f);
            ++idx;
        }
    }

    // Longitudinal-mode precursor (Bank & Sujbert, JASA 2005): the metallic
    // "ping" of compressional string waves, at roughly 2n*f0, decaying in tens
    // of ms, ~-18 dB. Perceptually significant below ~C4; masked above.
    if (midiNote < 60)
    {
        for (int k = 1; k <= 4 && idx < maxModes - 1; ++k)
        {
            const float fl = 2.0f * static_cast<float>(k) * f0 * 1.013f; // slightly off-harmonic
            if (fl >= nyquistLimit)
                break;
            const float t60l = 0.03f;
            const float rl = FeltMath::fastExpNegSmall(ln1000 / (t60l * fs));
            const double thetaL = static_cast<double>(twoPiOverFs * fl);
            const float ampL = 0.12f / static_cast<float>(k);
            const bool evenL = (idx & 1) == 0;
            bank.aRe[idx] = rl * static_cast<float>(std::cos(thetaL));
            bank.aIm[idx] = rl * static_cast<float>(std::sin(thetaL));
            bank.gainA[idx] = evenL ? outScale : 0.0f;
            bank.gainB[idx] = evenL ? 0.0f : outScale;
            bank.inGain[idx] = ampL;
            bank.expiry[idx] = static_cast<int>(t60l * fs * 2.0f);
            ++idx;
        }
    }

    // Pad to a stride multiple with inert modes (zero coefficients and gains).
    // Padding inherits the last real mode's expiry: a zero expiry would make
    // shrinkExpired drop the whole mixed final strip — up to 7 live partials —
    // one block after note-on.
    const int padExpiry = idx > 0 ? bank.expiry[idx - 1] : 0;
    while ((idx % ModalBank::kStride) != 0 && idx < maxModes)
    {
        bank.aRe[idx] = 0.0f;
        bank.aIm[idx] = 0.0f;
        bank.gainA[idx] = 0.0f;
        bank.gainB[idx] = 0.0f;
        bank.inGain[idx] = 0.0f;
        bank.expiry[idx] = padExpiry;
        ++idx;
    }

    bank.activeModes = idx;
    bank.clearStates();
}
} // namespace ModeTable
