#pragma once

#include <cmath>

// First-order antiderivative anti-aliasing (Parker, Zavalishin, Le Bivic 2016): instead of
// f(x[n]) output the mean of f over [x[n-1], x[n]], i.e. (F(x[n]) - F(x[n-1])) / (x[n] - x[n-1]).
// The averaging is a continuous-time low-pass on the curve's high-order products, which is
// what suppresses the aliases; the price is half a sample of delay and one antiderivative per
// sample. Near-equal successive inputs fall back to f at the midpoint (the ill-conditioned
// division). The antiderivative runs in double so the difference keeps its precision.

namespace tatami::dsp
{

template <typename Shaper>
class Adaa1
{
public:
    static constexpr double kMinDelta = 1.0e-4;

    float process (float x) noexcept
    {
        const auto xd = (double) x;
        const auto F0 = Shaper::antiderivative (xd);
        const auto delta = xd - x1;
        const auto y = std::abs (delta) > kMinDelta ? (F0 - F1) / delta
                                                    : (double) Shaper::shape ((float) (0.5 * (xd + x1)));
        x1 = xd;
        F1 = F0;
        return (float) y;
    }

    void reset() noexcept
    {
        x1 = 0.0;
        F1 = Shaper::antiderivative (0.0);
    }

private:
    double x1 = 0.0;
    double F1 = Shaper::antiderivative (0.0);
};

} // namespace tatami::dsp
