---
'@kieranklaassen/live-mix': minor
---

Add the `stereo-widener` WASM device: kkfonie's S1-style StereoWidener (source copied unchanged from Felt/Bloom/Sympathetic/Thesis) behind the device ABI, with a single `width` parameter (0 = mono, 0.5 = normal, 1 = allpass decorrelation + micro Haas; bass below 200 Hz kept narrow). Exports `STEREO_WIDENER_PARAMS` and `StereoWidenerParamName` from `@kieranklaassen/live-mix/dsp`; ships `wasm/stereo-widener.wasm`.
