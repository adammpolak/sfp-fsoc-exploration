# Chapter 20: From Fiber to Collimated Beam — Expanders and Launch Optics

*Transforming a 10 µm fiber mode into a kilometer‑class beam with dB to spare*

## 20.0 Why This Chapter Matters

SFPs are built to couple light into fiber cores ~9–10 µm (SMF) or ~50 µm (MMF). FSOC needs the opposite: we must take that tightly confined mode and turn it into a stable, low‑divergence beam that can cross kilometers. This chapter provides the optical engineering to bridge that gap: Gaussian mode matching, collimation, beam expansion (Galilean/Keplerian), practical alignment, and loss budgets—plus worked designs that preserve optical power and minimize pointing sensitivity.

## 20.1 The Fiber Output: What We Start With

### 20.1.1 Mode Field and Numerical Aperture (SMF)
```
SMF‑28 (1310/1550 nm): MFD ≈ 9–10.4 µm → beam waist w₀ ≈ MFD/2 ≈ 4.5–5.2 µm
NA_fiber ≈ 0.13 (1310 nm) → half‑angle ≈ 7.5° in air (diverging Gaussian)
Rayleigh range z_R = π w₀² / λ → ~65 µm (Chapter 16)
```
Key implication: the beam expands very quickly—collimate immediately with a short‑focal‑length lens.

### 20.1.2 From Gaussian Waist to Collimator
For a lens at distance s from the waist (near the fiber tip), the output collimation quality depends on precise spacing. The ideal thin‑lens collimation condition (waist at focal plane):
```
Place the fiber waist at lens front focal plane → output beam is collimated
Beam radius at lens: w_in ≈ function of s; choose f so that output radius w_out = f · (λ / (π w_in))
```

## 20.2 Collimation Lens Selection

### 20.2.1 Focal Length and Beam Diameter
For a Gaussian input waist w_in located at the lens front focal plane f:
```
Collimated beam waist (radius) w_c ≈ f · (λ / (π w_in))
Full beam diameter D_beam ≈ 2 w_c
```
Example (1550 nm): w_in = 5.2 µm, f = 4 mm →
```
w_c ≈ 4e−3 × 1.55e−6 / (π × 5.2e−6) = 0.38 mm → D_beam ≈ 0.76 mm
```
This is too small for kilometer ranges → use a beam expander.

### 20.2.2 AR Coatings, Materials, and Throughput
Select low‑loss, AR‑coated aspheres or GRIN lenses:
```
Material @ 1550 nm: Fused silica (low absorption), SF11 (higher n, more dispersion)
AR: R < 0.2% per surface typical → τ ≈ −0.04 dB per surface
Budget: τ_collimator ≈ −0.2 to −0.5 dB including mounts
```

## 20.3 Beam Expanders: Galilean vs Keplerian

### 20.3.1 Magnification and Divergence
Beam expander magnification M increases beam diameter by M and reduces divergence by M:
```
θ_out = θ_in / M,   D_out = M D_in
```
Trade‑off: larger optics, tighter mechanical tolerances, potential obscuration (Keplerian).

### 20.3.2 Galilean Expander (Two Lenses: −f1, +f2)
Pros: compact, no internal focus (less stray light), no central obscuration. Cons: higher aberrations if not well‑corrected.
```
M = |f2 / f1|  (f1 < 0, f2 > 0)
Input lens close to collimated beam; output lens sets final diameter
```

### 20.3.3 Keplerian Expander (Two Positives: +f1, +f2)
Pros: easier to correct aberrations, real internal focus for spatial filtering. Cons: central obscuration if mirrored, longer package.
```
M = f2 / f1;   spacing ≈ f1 + f2
Option: pinhole at focus for mode cleanup (lossy but improves beam quality)
```

## 20.4 Design Flow — From Fiber to Long‑Range Beam

### 20.4.1 Steps and Calculators
```
Inputs: λ, w_in (fiber waist), desired θ_out (or D_out), τ budgets

1) Pick collimation lens f_c to get manageable D_in (e.g., 1–2 mm)
2) Choose expander magnification M = θ_in / θ_out
3) Pick expander type (Galilean/Keplerian); compute f1, f2, spacing
4) Compute throughput: τ_total = τ_collimator + τ_expander + windows
5) Validate beam radius at target range: w(R) = θ_out · R; check η_geo with D_rx
6) Iterate M and D_rx to meet geometric budget with pointing margin
```

### 20.4.2 Example — 1550 nm, 10G Link, 10 km, D_rx = 200 mm
Goal: θ_out ≈ 50 µrad
```
Start: Collimator yields D_in ≈ 2 mm, θ_in ≈ λ/(πw_in) ≈ 1.55e−6/(π×5.2e−6) ≈ 0.095 rad (too large abstractly; after collimation D_in sets θ_in practical)
Practical approach: choose expander M so that θ_out ~ 50 µrad; if θ_in practical ≈ 1 mrad after collimation optics → M ≈ 20×
Pick Galilean: f1 = −10 mm, f2 = +200 mm → M = 20×
Throughput: τ_total ≈ −0.8 dB (good AR coatings)
At 10 km: w = θ_out R = 0.5 m; η_geo with D_rx=0.2 m → ~7.7% (see Ch.19) → boost D_rx or M to improve
```

## 20.5 Alignment and Tolerances

### 20.5.1 Axial and Lateral Tolerance Stack
```
Axial (focus): Δz at collimator → residual divergence Δθ ≈ Δz / f_c² × (λ/πw_in)
Lateral (decenter): Δx → beam walk‑off; keep Δx ≪ w_in at first lens; downstream magnified by M
Tilt: induces pointing error; maintain ≤ mrad at expander to keep σ_point budget
```

### 20.5.2 Thermal Considerations
CTE mismatch and refractive index dn/dT shift focus and pointing:
```
Use athermal mounts; select materials with matched CTE; consider focus compensation (spacer or flexure)
```

## 20.6 Loss Budget and Eye‑Safety

### 20.6.1 Optical Throughput and Power at Aperture
```
P_out_dBm = P_tx_dBm + τ_collimator_dB + τ_expander_dB + τ_window_dB
```
Ensure that eye‑safety classification at 1550 nm (IEC 60825) is maintained with expanded beam.

## 20.7 Worked Designs

### 20.7.1 Compact 1 km Beam (SMF → 10× Galilean)
```
λ = 1550 nm; f_c = 4 mm collimator → D_in ≈ 0.8 mm
Expander: f1 = −10 mm, f2 = +100 mm → M = 10× → D_out ≈ 8 mm, θ_out ≈ θ_in/10
At 1 km: w ≈ θ_out × 1000 m; evaluate η_geo for D_rx = 100 mm
Throughput τ_total ≈ −0.6 dB
```

### 20.7.2 Long‑Range 10 km Beam (SMF → 25× Galilean)
```
λ = 1550 nm; f_c chosen for D_in ≈ 1 mm
Expander: f1 = −8 mm, f2 = +200 mm → M = 25× → θ_out ≈ θ_in/25
At 10 km: confirm w and η_geo with D_rx = 200–300 mm
Check σ_point budget; combine with 19.4 for turbulence
```

## 20.8 Integration Notes with SFP Hardware

### 20.8.1 Mechanical Interface
- Use SFP experimenter boards to extract TOSA output to free‑space collimation stage
- Respect 20‑pin electrical contract; no change to host interface

### 20.8.2 Diagnostics and Control
- Monitor TOSA power and temperature via SFF‑8472; log τ_total drift
- Add alignment fiducials and camera for near‑field/far‑field setup

## 20.9 Summary

- Appendix 20.A: ABCD Matrix and M² Effects
```
ABCD (ray transfer) through lens and free space:
  Free space (L):  [1  L; 0 1]
  Thin lens (f):   [1  0; −1/f 1]

Gaussian beam q‑parameter propagation:
  q' = (Aq + B) / (Cq + D), where 1/q = 1/R − j λ/(π w²)

Non‑ideal beam quality (M²>1): effective divergence θ ≈ M² λ/(π w₀)
Include M² in expander design: θ_out ≈ (M² θ_in)/M
```

- Appendix 20.B: Build & Test Plan (Chapter‑16 style)
```
1) Bench: Collimation focus sweep → measure far‑field divergence vs lens spacing
2) Expander alignment: verify magnification (knife‑edge or beam profiler)
3) Throughput: measure τ_total (colimator+expander) with optical power meter
4) Near/Far field: capture profiles; compute M²
5) Thermal drift: soak test (−10 to +60°C); log focus/pointing shifts
6) Outdoor range test: log P_rx vs range and pointing; compare to Ch.19 budget
```
- A good FSOC transmitter begins with correct collimation and beam expansion; θ_out and D_out dictate geometric success
- Galilean expanders offer compactness; Keplerian enable spatial filtering
- Work the loop with Chapter 19: aperture vs divergence vs pointing vs atmosphere → link budget closure


