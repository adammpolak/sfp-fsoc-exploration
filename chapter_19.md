# Chapter 19: FSOC Link Budget — From TOSA to ROSA, End‑to‑End

*From a laser facet to a logic ‘1’: counting every photon in free space*

## 19.0 Why This Chapter Matters

Inside fiber, glass protects our photons: the core guides them, the cladding traps them, and connectors align them. In free space, there is no glass. A single optical symbol must cross kilometers of moving air, expand with diffraction, survive haze and heat shimmer, hit a receiver aperture that looks tiny from far away, and then—despite all that—deliver enough electrons to a TIA for the CDR to decide “1” or “0”.

Let’s quantify just how heroic that journey is.

Consider a modest eye‑safe transmitter at 1550 nm delivering +10 dBm (10 mW). That’s:
```
Photon rate N = P / (hc/λ)
             = 0.01 / (6.626×10⁻³⁴ × 3×10⁸ / 1.55×10⁻⁶)
             ≈ 7.8×10¹⁶ photons per second
```
Collimate to an effective divergence of 100 µrad. At 10 km, the beam radius is w ≈ θ·R = 1.0 m; our 10‑cm receive aperture (a = 0.05 m) sees only the center of that two‑meter‑wide spot. Even perfectly aimed, the geometric capture is only:
```
η_geo = 1 − exp(−2 a² / w²) = 1 − exp(−0.005) ≈ 0.5%
```
Half a percent of 10 mW is 50 µW (−13 dBm), before the atmosphere (≈ 0.2 dB/km clear air), before window/lens losses, before pointing jitter. And yet—if we size the apertures and beam properly, and if our receiver noise is tamed—we can still deliver error‑free 10 Gb/s over kilometers. This chapter shows you exactly how.

By the end of this chapter, you will be able to:
- Compute geometric capture with Gaussian beams, including pointing‑jitter penalties, and translate areas and angles into dB
- Budget atmospheric attenuation by wavelength and weather, and pick operating points for availability targets
- Convert received optical power into electrons at the ROSA, assemble the complete noise current, and map OMA/SNR/Q to BER
- Scale apertures, beam expansion, and rate/FEC to meet BER ≤ 10⁻¹² at 1 km, 10 km, and 100 km
- Build and iterate a full end‑to‑end FSOC link budget that ties optical physics to SFP electronics (TIA/LA/CDR)

## 19.1 The Journey: From Facet to Decision

Let’s walk one bit from the TOSA facet to the CDR flip‑flop, tracking power and probability at each interface.

```
Laser facet (P_tx, λ)
    ↓ beam expander / collimator (θ_eff, τ_tx)
Free space (R): diffraction → w(R), atmosphere γ(λ), weather
    ↓ pointing/boresight (σ_point)
Receive aperture (D_rx, τ_rx) → geometric capture η_geo, η_point
    ↓ ROSA / PD (R_pd) → I_photo = R_pd · P_rx
TIA / LA (noise, BW) → SNR → Q → CDR decision
```

We trace in Watts (or dBm) and photons/s, plus areas and angles. The key variables:
- Transmitter optics (TOSA) → P_tx, λ, w₀, θ_eff
- Path → R, γ(λ) [dB/km], C_n² (turbulence), weather loss
- Pointing → σ_point (RMS), boresight error budget
- Receiver optics → D_rx, A_rx = π(D_rx/2)², throughput τ_rx
- ROSA → responsivity R_pd [A/W], bandwidth B, noise terms
- Electronics → TIA/LA/CDR; required SNR/Q for target BER

## 19.2 Geometric Spreading and Aperture Capture

### 19.2.1 Gaussian Beam Propagation (Far‑Field Approximation)
For a well‑collimated beam (Gaussian), far‑field radius grows linearly with range R:
```
w(R) ≈ θ_eff × R    (for R ≫ z_R)
I(r,R) = I0 × exp(−2 r² / w(R)²)
```
If the receive aperture is circular with radius a = D_rx/2 and is centered on the beam:
```
Capture fraction η_geo = 1 − exp(−2 a² / w(R)²)
Approximate small‑aperture limit (a ≪ w): η_geo ≈ 2 a² / w(R)²
```

#### Deriving η_geo from first principles
The total Gaussian power at range R is conserved (neglecting atmosphere). The fraction passing through a circular aperture of radius a is the 2D integral of the normalized Gaussian:
```
η_geo = ( ∫₀^{a} 2πr · I0 e^{−2r²/w²} dr ) / ( ∫₀^{∞} 2πr · I0 e^{−2r²/w²} dr )
      = 1 − e^{−2a²/w²}
```
Two useful regimes:
- Aperture‑limited (a ≪ w):  η_geo ≈ 2(a/w)² → capture ∝ area / spot area
- Optics‑limited (a ≫ w):   η_geo → 1 (but beware alignment and obscuration)

#### Designing θ_eff with a beam expander
For a diffraction‑limited exit pupil of diameter D_tx at wavelength λ:
```
θ_DL ≈ 1.22 λ / D_tx   (Airy criterion)
```
Real beams include pointing and residual wavefront errors, so set a design margin:
```
θ_eff = k · θ_DL,   k ≈ 1.5–3 depending on tolerance
```
A beam expander trades divergence for head size: increasing D_tx by ×M reduces θ by ×M.

#### Quick calculator
```
Inputs: λ, D_tx, k, R, D_rx
θ_DL = 1.22 λ / D_tx
θ_eff = k θ_DL
w = θ_eff R
a = D_rx/2
η_geo = 1 − exp(−2 a² / w²)
L_geo_dB = −10 log10(η_geo)
```

### 19.2.2 Top‑Hat Approximation (Conservative)
For engineering bounds, approximate uniform disk with diameter D_beam = 2w. Then:
```
Geometric loss (no mispoint): L_geo = 10 log10( A_rx / A_beam )
where A_rx = π (D_rx/2)²,  A_beam = π (D_beam/2)² = π w²
→ L_geo ≈ 10 log10( (D_rx / D_beam)² ) = 20 log10( D_rx / (2w) )
```
Use Gaussian η_geo for accuracy; use L_geo for quick bounds.

#### Centering, obscurations, and vignetting
- Central obscuration (secondary mirror or baffle) reduces effective area: A_eff = A_outer − A_inner
- Vignetting from off‑axis incidence reduces throughput; include as τ_vig (−dB) in optics budget
- Alignment budget should include boresight error ≤ a/5 to keep η_geo within 1 dB of ideal

### 19.2.3 Pointing and Jitter — The Real Killer
Even a perfectly sized beam can miss the aperture if it wanders. Model radial pointing error as Gaussian with RMS σ_point (at the receiver plane):
```
η_point ≈ exp(−2 σ_point² / w²)
```
This expression comes from convolving two Gaussians (beam intensity and jitter distribution). Practical implications:
- If σ_point = 0.5 w → η_point ≈ exp(−0.5) ≈ 0.61 (−2.1 dB)
- If σ_point = w → η_point ≈ exp(−2) ≈ 0.14 (−8.6 dB)

Design guidance:
- Keep σ_point ≤ 0.3 w for <1 dB pointing loss
- Stabilize gimbal (10–100 Hz) and add fine steering (≥1 kHz) for turbulence

### 19.2.4 Worked Aperture/Beam Design Examples

Example 1 — 1 km link, compact optics:
```
λ = 1550 nm, D_tx = 20 mm, k = 2 → θ_eff ≈ 1.22·1.55e−6/0.02 · 2 ≈ 1.89e−4 rad (189 µrad)
w = θ_eff R = 0.189 m
D_rx = 0.1 m → a = 0.05 m → a/w = 0.264
η_geo = 1 − exp(−2×0.264²) = 1 − exp(−0.139) = 13.0% (−8.9 dB)
Pointing σ_point = 10 µrad × 1 km = 0.01 m → σ/w = 0.053 → η_point ≈ 0.994 (−0.03 dB)
Total geometric+pointing ≈ −8.93 dB
```

Example 2 — Improve with beam expander:
```
Increase D_tx to 80 mm (×4) → θ_eff/4 → w/4 = 0.047 m
a/w = 1.06 → η_geo = 1 − exp(−2×1.06²) = 1 − exp(−2.25) = 89.5% (−0.47 dB)
Same σ_point = 0.01 m → σ/w = 0.213 → η_point ≈ exp(−2×0.213²) = 0.913 (−0.39 dB)
Total ≈ −0.86 dB (vs −8.93 dB without expander)
```

Example 3 — 10 km link with large aperture:
```
Use θ_eff = 50 µrad via larger D_tx; w = 0.5 m at 10 km
D_rx = 0.2 m → a/w = 0.2 → η_geo = 1 − exp(−0.08) = 7.7% (−11.1 dB)
σ_point = 20 µrad × 10 km = 0.2 m → σ/w = 0.4 → η_point ≈ exp(−0.32) = 0.726 (−1.4 dB)
Total ≈ −12.5 dB before atmosphere
```

## 19.3 Atmospheric Attenuation and Weather

### 19.3.1 Clear‑Air Molecular/ Aerosol Loss
Modeled as exponential loss with coefficient κ(λ):
```
P_after = P_before × 10^{− (γ(λ) × R) / 10},  where γ(λ) [dB/km]
Typical γ: 0.1–0.5 dB/km clear, 2–10 dB/km haze, 20–100 dB/km fog
```

### 19.3.2 Weather Loss Catalog (Indicative)
```
Visibility (km)   Loss @ 1550 nm (dB/km)
>20 (clear)      0.1–0.2
5–20 (haze)      0.2–2
1–5 (mist)       2–10
0.2–1 (fog)      10–50+
Heavy rain       1–5 (size-dependent)
```
Use site statistics to select worst‑case percentile for availability.

### 19.3.3 Visibility Models and Wavelength Choice
Empirical models relate meteorological visibility V (at 550 nm) to attenuation at λ:
```
Kruse:   γ(λ) [dB/km] = (3.91 / V) × (λ / 550 nm)^{−q}
Kim:     γ(λ) [dB/km] = (3.91 / V) × (λ / 550 nm)^{−q(V)}

q(V) piecewise (Kim):
V ≥ 50 km: q = 1.6    6<V<50: q = 1.3
1<V≤6:     q = 0.16V + 0.34
0.5<V≤1:   q = V − 0.5
V≤0.5:     q = 0
```
Implications:
- Longer wavelength (1550 nm) usually suffers less scattering than 850/980 nm in haze/mist
- 1310 nm often balances detector responsivity and atmospheric performance
- In dense fog (Mie/Geometric), λ dependence weakens: high γ regardless of λ

### 19.3.4 Quick Attenuation Calculator
```
Inputs: V (km), λ (nm), R (km), model (Kruse/Kim)
Compute q(V) → γ(λ)
L_atm_dB = γ(λ) × R
P_rx_dBm = P_in_dBm − L_atm_dB  (apply with geometric/pointing and optics losses)
```

Example — Haze day, V = 10 km, λ = 1550 nm, R = 5 km (Kim):
```
q = 1.3 (since 6<V<50)
γ = 3.91/10 × (1550/550)^{−1.3} = 0.391 × (2.818)^{−1.3} ≈ 0.391 × 0.29 ≈ 0.113 dB/km
L_atm ≈ 0.56 dB
```

### 19.3.5 Availability Planning
Define availability target (e.g., 99.9%). Use cumulative distribution of visibility/attenuation for site:
```
For each percentile p:
  pick V_p → γ_p(λ) → L_atm_p(R)
  compute P_rx_p and BER/FEC margin
Availability = fraction of time BER target is met
```
Design actions:
- Increase D_rx or reduce θ_eff to fight geometric loss
- Increase P_tx within eye‑safety and thermal limits
- Lower rate or add stronger FEC for low‑visibility tails
- Plan diversity paths (multiple baselines) to improve availability

## 19.4 Turbulence, Scintillation, and Pointing Loss

### 19.4.1 Turbulence Strength and Scintillation
Refractive index fluctuations parameterized by C_n² (m⁻²/³). Scintillation index (weak‑to‑moderate regime):
```
σ_I² ≈ 1.23 C_n² k^{7/6} R^{11/6},  k = 2π/λ
```
This induces fading; budget margin or use diversity/FEC.

#### Rytov variance and regimes (λ = 1550 nm)
The Rytov variance quantifies turbulence strength:
```
σ_R² = 1.23 C_n² k^{7/6} R^{11/6}
Weak:    σ_R² < 1       (log‑normal intensity fluctuations)
Moderate: ~1–3          (increasing fades, beam wander)
Strong:  σ_R² > 3       (saturation; multiple scattering paths)
```
At 1550 nm, k = 2π/1.55e−6 ≈ 4.05×10⁶ rad/m, so k^{7/6} ≈ 1.6×10⁷.

Example — C_n² = 1e−14 m⁻²/³, R = 5 km:
```
σ_R² ≈ 1.23 × 1e−14 × (1.6e7) × (5000)^{11/6}
R^{11/6} ≈ 5000^{1.833} ≈ 1.5e6
σ_R² ≈ 1.23 × 1e−14 × 1.6e7 × 1.5e6 ≈ 0.30  (weak)
```

### 19.4.2 Fried Parameter (r₀) and Aperture Averaging
Fried parameter sets coherence diameter of the wavefront:
```
r₀ ≈ [0.423 k² C_n² R]^{−3/5}
```
If D_rx ≳ r₀, the aperture averages speckle/scintillation, reducing σ_I. Rule of thumb:
```
Scintillation reduction ≈ √(Averaging factor) ≈ √(D_rx / r₀)
```
Use with caution; exact factors depend on inner/outer scale and path weighting.

### 19.4.3 Greenwood Frequency and Control Bandwidth
Greenwood frequency estimates turbulence temporal bandwidth:
```
f_G ≈ 0.43 v / r₀
```
where v is transverse wind speed (m/s). To track beam wander and phase perturbations, closed‑loop pointing or adaptive optics bandwidth should exceed f_G.

Example — v = 5 m/s, r₀ = 3 cm → f_G ≈ 0.43×5/0.03 ≈ 71 Hz. Gimbal 100–200 Hz; fine steering ≥1 kHz ideal.

### 19.4.4 Beam Wander and Jitter Budgeting (λ = 1550 nm)
Let σ_point be total RMS jitter at the receive plane, combining platform, gimbal residual, and turbulence:
```
σ_point² = σ_platform² + σ_gimbal² + σ_turb²
```
Map to pointing loss via η_point = exp(−2 σ_point² / w²). For turbulence‑induced wander, proportional to R and C_n²; empirical/measurement‑based values recommended.

### 19.4.5 Worked Turbulence Examples (1550 nm)

Case A — Weak turbulence (campus scale):
```
C_n² = 1e−15 m⁻²/³, R = 1 km
σ_R² ≈ 1.23 × 1e−15 × 1.6e7 × (1000)^{1.833} ≈ 0.02 → weak
r₀ ≈ [0.423 k² C_n² R]^{−3/5}; k²≈(4.05e6)²=1.64e13
Denominator: 0.423×1.64e13×1e−15×1000 ≈ 6.94
r₀ ≈ 6.94^{−3/5} ≈ 0.28 m
With D_rx=0.1 m < r₀: little aperture averaging needed; σ_point dominated by mechanics.
```

Case B — Moderate turbulence (urban 5–10 km):
```
C_n² = 5e−14 m⁻²/³, R = 5 km
σ_R² ≈ 1.23×5e−14×1.6e7×(5000)^{1.833} ≈ 1.5 → moderate
r₀: denominator 0.423×1.64e13×5e−14×5000 ≈ 173.7 → r₀ ≈ 173.7^{−3/5} ≈ 4.0 cm
D_rx=0.2 m → D_rx/r₀≈5 → useful aperture averaging; aim fine steering BW > f_G ≈ 0.43 v / r₀ ~ 0.43×5/0.04 ≈ 54 Hz
```

Case C — Strong turbulence (summer desert 10 km):
```
C_n² = 1e−13 m⁻²/³, R = 10 km
σ_R² > 3 likely; deep fades expected
r₀ ~ few cm; demand large aperture, diversity, or reduced rate/FEC
```

### 19.4.2 Beam Wander, Pointing Jitter, and Misalignment
Assume radial pointing error with RMS σ_point. The effective capture lowers by the convolution of Gaussian beam with jitter distribution. A useful approximation:
```
η_point ≈ exp(−2 σ_point² / w(R)²)
Effective capture: η_cap ≈ η_geo × η_point
```
Centering/alignment errors add deterministic loss L_boresight; include per alignment budget.

## 19.5 End‑to‑End Optical Power Budget (dB Form)

We track link in dB to combine effects:
```
P_rx_dBm = P_tx_dBm + G_tx_optics_dB  
           − L_divergence_dB − L_atm_dB − L_weather_dB − L_point_dB  
           + G_rx_aperture_dB + G_rx_optics_dB

Where:
L_divergence_dB ≈ −10 log10(η_geo)  (or  −L_geo if using area ratio)
L_atm_dB = γ(λ)[dB/km] × R[km]
L_point_dB ≈ −10 log10(η_point)
G_tx_optics_dB, G_rx_optics_dB include telescope/optics throughput (can be negative)
```
Convert to Watts: P_rx_W = 10^{(P_rx_dBm − 30)/10}.

### 19.5.1 Step‑by‑Step Budget Template (λ = 1550 nm)
```
Inputs:
  P_tx_dBm, τ_tx_dB, τ_rx_dB
  θ_eff (rad), R (km), D_rx (m)
  σ_point (m at receiver), γ(λ) (dB/km)

Steps:
1) w = θ_eff × (R × 1000)
2) a = D_rx / 2
3) η_geo = 1 − exp(−2 a² / w²)
4) L_div = −10 log10(η_geo)
5) η_point = exp(−2 σ_point² / w²) → L_point = −10 log10(η_point)
6) L_atm = γ × R  (include weather term if applicable)
7) P_rx_dBm = P_tx_dBm + τ_tx_dB + τ_rx_dB − L_div − L_point − L_atm
8) Convert to Watts for ROSA: P_rx_W = 10^{(P_rx_dBm−30)/10}
```

### 19.5.2 Quick Numeric Example (10 km, moderate optics)
```
P_tx = +10 dBm; τ_tx = −1 dB; τ_rx = −1 dB
θ_eff = 60 µrad; R = 10 km → w = 0.60 m
D_rx = 0.20 m → a = 0.10 m → a/w = 0.167
η_geo = 1 − exp(−2×0.167²) = 1 − exp(−0.056) = 5.5% → L_div ≈ 12.6 dB
σ_point = 0.15 m (RMS) → (σ/w)=0.25 → η_point = exp(−2×0.25²)=0.882 → L_point=0.54 dB
γ(1550) clear = 0.2 dB/km → L_atm = 2.0 dB
P_rx_dBm = 10 −1 −1 −12.6 −0.54 −2.0 = −7.14 dBm → 0.193 mW
```
This value then feeds 19.6 to determine I_photo, noise, and BER margin.

## 19.6 Receiver Conversion to Electrons and SNR

### 19.6.1 Photocurrent and Noise
```
I_photo = R_pd × P_rx_W
Noise currents (RMS):
  Shot: i_n,shot = √(2 q I_photo B)
  Thermal: i_n,thermal = √(4 kT / R_eq × B)  (TIA equivalent)
  Amp/other: i_n,amp ≈ i_n0 × √B
Total: σ_I = √(i_n,shot² + i_n,thermal² + i_n,amp²)
```

### 19.6.2 Modulation Depth and Required OMA
For NRZ OOK:
```
OMA = P1 − P0 ≈ α × P_rx_W  (α reflects extinction ratio and coding)
SNR_current ≈ (R_pd × OMA) / σ_I
Q ≈ SNR_current / 2  → BER ≈ 0.5 erfc(Q/√2)
Target: BER ≤ 10⁻¹² → Q ≈ 7  (without FEC)
```
For PAM4, per‑eye SNR is ~9.5 dB worse for same OMA; FEC mitigates.

### 19.6.3 Practical Sensitivity Calculator (NRZ, 10G)
```
Inputs:
  P_rx_W (from 19.5), R_pd (A/W), B (Hz), i_n0 (A/√Hz), R_eq (Ω), ER

1) I_photo = R_pd P_rx_W
2) i_shot = √(2 q I_photo B)
3) i_amp = i_n0 √B
4) i_th = √(4 kT / R_eq × B)
5) σ_I = √(i_shot² + i_amp² + i_th²)
6) α(ER) ≈ 2(ER−1)/(ER+1)  → OMA ≈ α P_rx_W
7) SNR_I = (R_pd OMA) / σ_I;  Q ≈ SNR_I / 2
8) Check BER; if insufficient, adjust P_rx, B, ER, or add FEC
```

Example — Using 19.5 example (P_rx ≈ 0.193 mW), R_pd = 0.9 A/W, B = 7 GHz,
```
I_photo = 0.9 × 1.93e−4 = 1.74e−4 A
i_shot = √(2×1.6e−19×1.74e−4×7e9) ≈ 17 µA
i_amp  = 3e−12 × √7e9 ≈ 0.25 mA (example high; real TIA input‑referred must be far lower)
i_th   = √(4×1.38e−23×300/5000 × 7e9) ≈ 19 µA
σ_I ≈ dominated by i_amp in this crude example → use vendor TIA specs for realistic µA levels
```
Takeaway: high‑rate receivers demand extremely low input‑referred noise; bandwidth reduction (equalization/FEC) or higher OMA may be needed.

### 19.6.4 PAM4 Notes
- Use OMAouter; per‑eye SNR includes gain/offset/linearity calibration
- Pre‑FEC BER target (e.g., ≤2e−4) with KP4 → post‑FEC BER ≤ 10⁻¹²
- Include TDECQ compliance in optical budget at the chosen lane rate

## 19.7 Diversity, Aperture Scaling, and Adaptive Control

### 19.7.1 Aperture Scaling
For diffraction‑limited beams, captured power ∝ A_rx / w(R)². Doubling D_rx (diameter) → 4× area → +6 dB geometric gain (when w ≫ a). Practical limits: optics size, alignment, wind load.

### 19.7.2 Spatial Diversity
Multiple apertures with uncorrelated fading (separation ≥ Fried parameter r₀) yield combining gain ~10 log10(N) on average; during deep fades, selection combining chooses best channel; maximal ratio combining offers best SNR if phase or power weighting available.

### 19.7.3 Adaptive Optics and Tracking
Beam steering and deformable mirrors reduce σ_point and wavefront errors, improving η_point and η_geo. Closed‑loop tracking bandwidths of 10–100 Hz (gimbal) and >1 kHz (fine steering) are common.

### 19.7.4 Design Rules and Combining Architectures
```
Pointing:
  Keep σ_point ≤ 0.3 w for <1 dB pointing loss; gimbal BW > f_G; FPA/quad‑cell fine steering ≥1 kHz

Aperture vs Beam:
  If a/w < 0.3 → invest in beam expansion first; if 0.3<a/w<1 → increase both; if a/w ≥ 1 → aperture sufficient, improve pointing/atmosphere

Diversity:
  N independent paths → ~10 log10(N) dB average gain; spacing ≥ r₀ or separate mounts
  Selection combining: min complexity; MRC: best performance (requires calibrated weighting)

Synchronization:
  Equalize path delays (< UI) before combining in electrical/digital domain
```

### 19.7.5 Practical Implementations
- Dual‑aperture heads with independent ROSAs, CDRs, and digital selection combining
- 4‑corner roof‑mount apertures (1–2 m spacing) for urban canyons; tie into single SFP electrical output via retimed muxing
- Slow‑fast control split: gimbal (wind/boresight), fast steering mirror (turbulence), AO (wavefront if needed)

## 19.8 Worked Examples (1310/1550 nm)

Assumptions unless noted:
```
λ = 1550 nm (eye‑safe, low scattering), R_pd = 0.9 A/W
TIA Equivalent noise current i_n,amp ≈ 3 pA/√Hz, B = 10 GHz for 10G
Tx telescope throughput τ_tx = −1 dB, Rx optics τ_rx = −1 dB
Beam divergence θ_eff after expansion = 100 µrad (example)
Pointing jitter σ_point = 20 µrad (RMS)
```

### 19.8.1 1 km Link (10G NRZ)
```
P_tx = +10 dBm (10 mW)
w(R) = θ_eff × R = 100e−6 × 1000 m = 0.1 m (radius)
D_rx = 0.1 m → a = 0.05 m → a/w = 0.5
η_geo = 1 − exp(−2 × 0.5²) = 1 − exp(−0.5) ≈ 39.3%
η_point = exp(−2 σ_point² / w²) with σ_point= R×20 µrad = 0.02 m → (σ/w)=0.2
→ η_point ≈ exp(−2×0.04) = exp(−0.08) ≈ 0.923
η_cap = 0.393 × 0.923 ≈ 0.363 (−4.4 dB)
Atmosphere γ = 0.2 dB/km → L_atm = 0.2 dB
Optics: τ_tx = −1 dB, τ_rx = −1 dB
Power at PD (dBm):
P_rx = 10 + (−1) + (−1) − 4.4 − 0.2 = 3.4 dBm → 2.19 mW
I_photo = 0.9 × 2.19e−3 = 1.97 mA
Shot noise (RMS): √(2 q I B) ≈ √(2×1.6e−19×1.97e−3×1e10) = 2.5 µA
Amp noise: 3e−12 × √1e10 = 0.3 mA (dominant unless input‑referred differently)
→ In practice, TIA noise must be far lower or bandwidth reduced; for 10G receiver designs, input‑referred i_n,amp is in µA range over BW (see Ch.16)
Feasibility: Large margin at 1 km with 10 dBm Tx and 10 cm aperture; design to receiver noise budget.
```

### 19.8.2 10 km Link (10G NRZ)
```
Same θ_eff and D_rx → w(R)=1.0 m, a/w=0.05 → η_geo ≈ 1 − exp(−2×0.05²)=1 − exp(−0.005)=0.5%
η_point with σ_point=0.2 m → (σ/w)=0.2 → η_point ≈ 0.923
η_cap ≈ 0.0046 (−23.4 dB)
L_atm = γ×R = 0.2×10 = 2.0 dB
P_rx(dBm) = 10 −1 −1 −23.4 −2.0 = −17.4 dBm → 18 µW
I_photo ≈ 16 µA; compare against 10G NRZ sensitivity (≈ −14 to −15 dBm)
Margin: Slightly below typical sens; increase D_rx or reduce θ_eff (larger beam expander), or raise P_tx, or add FEC/lower rate.
```

### 19.8.3 100 km Link (Lower Rate or Coherent)
```
At 100 km, L_atm = 20 dB (clear air, 0.2 dB/km) and η_geo plummets unless θ_eff is very small and D_rx is very large.
Feasible approaches:
- Reduce rate (e.g., 1G or below) → narrower B, lower noise → better sensitivity
- Large apertures (e.g., 200 mm) and θ_eff ≪ 100 µrad (tight beam, precise pointing)
- Coherent detection (outside simple SFP constraints) to gain sensitivity
```

### 19.8.4 Climate Variants and Rate Trade‑offs

Case D — Mist day (V = 3 km), 5 km link, 1G NRZ @ 1550 nm:
```
Kim: q = 0.16V+0.34 = 0.82 → γ = 3.91/3 × (1550/550)^{−0.82}
γ ≈ 1.303 × (2.818)^{−0.82} ≈ 1.303 × 0.42 ≈ 0.55 dB/km → L_atm ≈ 2.75 dB
Lower rate → B ≈ 700 MHz → much lower noise; smaller apertures may suffice
```

Case E — Haze (V = 10 km), 10 km link, 25G PAM4 short‑reach goal:
```
γ ≈ 0.113 dB/km (from 19.3) → L_atm ≈ 1.13 dB
OMAouter and TDECQ compliance dominate; plan KP4 FEC and stronger EQ
Use EML and tight pointing to keep η_point losses < 1–2 dB
```

Case F — Fog event (V = 0.5 km), 1 km link, fallback to 100 Mb/s:
```
Kim: q=0, γ = 3.91/0.5 = 7.82 dB/km → L_atm ≈ 7.82 dB (potentially higher)
At 100 Mb/s, B~70 MHz → sensitivity improves ~10 dB vs 10G
Use large aperture and increased P_tx (within eye‑safety) to ride through
```

## 19.9 Design Calculator Recipe

1) Choose λ (1310/1550 nm) and rate; get B and required Q/BER (and FEC)
2) Set P_tx and optics throughputs (τ_tx, τ_rx)
3) Pick beam expander → θ_eff; set D_rx → compute w(R), η_geo
4) Estimate σ_point → η_point; compute η_cap = η_geo × η_point
5) Set γ(λ) from weather; compute L_atm = γ × R
6) P_rx_dBm = P_tx + τ_tx + τ_rx − L_div − L_atm (− L_weather) ; convert to Watts
7) I_photo = R_pd × P_rx; compute σ_I (shot, thermal, amp)
8) For NRZ/PAM4, compute required OMA and Q; verify BER target
9) If fail: increase D_rx, reduce θ_eff (bigger beam expander), raise P_tx, lower rate/B, add diversity or FEC

### 19.9.1 Flowchart (Text Form)
```
Start → Pick λ, Rate, FEC → Choose P_tx, τ_tx/τ_rx
→ Choose D_tx (θ_eff) and D_rx → Compute w, η_geo → σ_point → η_point
→ γ(λ), R → L_atm → P_rx_dBm → P_rx_W → I_photo
→ σ_I → Q (NRZ) or pre‑FEC BER (PAM4)
→ Meets target? yes → Done
                no → Adjust {D_rx, θ_eff, P_tx, Rate/FEC, Diversity} → loop
```

## 19.10 Practical Notes and Pitfalls

### 19.10.1 Quick Checklists
Alignment & Pointing:
- Verify σ_point ≤ 0.3 w at operating range (measure with target camera)
- Calibrate boresight daily; log drift vs temperature and wind
- Ensure gimbal BW > f_G; fine steering loop stability margin ≥ 6 dB

Optics & Cleanliness:
- Inspect/clean apertures daily in dusty/salty sites; track τ_rx changes
- Baffle against solar glints; use narrowband filters if background high

Atmosphere & Placement:
- Avoid rooftop exhaust plumes and AC outlets; raise path height where feasible
- Use site met data for V and C_n² distributions; plan availability

Safety & Compliance:
- Confirm eye‑safety classification at 1550 nm for max P_tx; document interlocks
- Respect no‑fly/line‑of‑sight constraints; add shutters for fault conditions

Validation & Ops:
- Field‑validate link budgets at short and long baselines; record P_rx and BER vs weather
- Build fallbacks: auto‑rate downshift (e.g., 10G→1G→100M) and FEC tiers
- Add telemetry (P_rx, σ_point, BER pre/post‑FEC) and alarms for predictive maintenance

## 19.11 Summary

- FSOC link budgets combine geometric capture, atmospheric attenuation, and pointing jitter with classic receiver noise and bandwidth trade‑offs
- The end‑to‑end method here provides quick estimates and deeper physics‑based calculations
- With appropriate apertures, beam expansion, and clean pointing, 1–10 km 10G NRZ links are feasible in clear air; fog and long distances demand lower rates, larger optics, FEC, or coherent techniques


