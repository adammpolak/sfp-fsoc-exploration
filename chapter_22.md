# Chapter 22: Receive Apertures and Arrays — Scaling SNR and Riding Fades

*From single big glass to smart arrays: collecting photons under turbulence*

## 22.0 Why This Chapter Matters

FSOC receive performance hinges on how many photons we capture when the atmosphere doesn’t cooperate. This chapter quantifies how SNR scales with aperture diameter, how spatial diversity smooths scintillation, why simple parallel photodiode summing fails at high speed, and how to architect array receivers that deliver retimed, standard SFP outputs.

## 22.1 Single Aperture Scaling

### 22.1.1 Geometric and Diffraction Limits
```
Capture ∝ A_rx / w(R)² when a ≪ w(R)
Diffraction at focus: w_focus ≈ 1.22 λ f / D_rx
Optical throughput τ_rx reduces effective power; keep surfaces clean and AR coated
```

### 22.1.2 SNR Scaling with Bandwidth
```
I_photo ∝ P_rx;  σ_shot ∝ √(I_photo B);  σ_thermal, σ_amp ∝ √B
Reducing B (lower rate) improves sensitivity ~10 log10(B_old/B_new) / 2 dB
```

## 22.2 Arrays: Summation vs. Intelligent Combining

### 22.2.1 Why Simple Current Summing Fails at 10G
Parallel PDs add capacitance: C_total = Σ C_pd → RC cutoff f_3dB ≈ 1/(2π Rf C_total)
At 10G, allowable C_total is tens of fF; one PD already ~0.1–0.2 pF (Ch.16) → bandwidth collapse.

### 22.2.2 Architecture for High‑Speed Arrays
```
Each element: PD → TIA → LA → CDR → Retimed data
Combine in digital domain (selection, weighted voting, or muxing)
Expose a single SFP‑compatible differential output
```

### 22.2.3 Diversity Gain and Fade Mitigation
Uncorrelated channels (spacing ≥ r₀) yield average combining gain ≈ 10 log10(N) dB; during deep fades, selection combining ensures continuity. Aperture placement should target spatial decorrelation under site turbulence (Chapter 19).

## 22.3 Calculators

### 22.3.1 Geometric Capture per Element
```
Given D_elem, θ_out, R, alignment:
w = θ_out R; a = D_elem/2;  η_geo = 1 − exp(−2 a² / w²)
Pointing per element from local jitter; compute η_point and η_cap = η_geo η_point
```

### 22.3.2 Diversity Spacing
```
Use Fried parameter r₀ (Chapter 19): spacing ≥ r₀ for low correlation
If r₀ ≈ 2–5 cm (moderate), element centers ≥ 5–10 cm apart
```

### 22.3.3 Combining Logic
```
Selection combining: pick best eye/Q (live metrics from CDR)
Weighted combining: require aligned phase/timing → typically retime and select
Fallback rate: if all channels degrade, downshift to 1G/100M
```

## 22.4 Worked Designs

### 22.4.1 3‑Element Array Receiver for 10G, Urban 5 km
```
Elements: D=80 mm each, spaced 150 mm in a line
Each to its own ROSA chain; selection combining based on eye/Q
Expected diversity gain: ~4–5 dB average; improved outage performance in moderate turbulence
```

### 22.4.2 4‑Corner Roof Array (Square 1 m) for 10G/1G Hybrid
```
Four 150 mm apertures at corners; center‑fed timing; selection combining to 10G output
Auto fallback: when pre‑FEC BER degrades > threshold, switch to 1G path (larger PD, narrower B)
```

## 22.5 Practical Notes

- Power and space: arrays multiply ROSA/TIA/LA/CDR power; budget thermals
- Calibration: per‑element gain/offset, timing alignment for fair selection
- Maintenance: more surfaces → more cleaning; add heaters/defoggers if needed

## 22.6 Summary

- Bigger single apertures win until mechanical/thermal/weight constraints dominate
- At 10G+, arrays must combine after retiming; analog summing is a bandwidth trap
- Spatial diversity smooths turbulence; pair with adaptive pointing and rate/FEC strategies


