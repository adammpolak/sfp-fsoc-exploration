# Chapter 21: Lenses for FSOC — MEMS Steering, Fresnel, and Refractive Optics

*Shaping and steering light with grams of glass and microns of motion*

## 21.0 Why This Chapter Matters

Chapter 20 expanded the beam; now we need to point it, shape it, and sometimes change it on the fly. This chapter covers practical lens families (refractive singlets/doublets, Fresnel, aspheres), plus MEMS steering mirrors and micro‑optics that enable compact FSOC heads. We build calculators for focal length, field‑of‑view, aberrations, Fresnel efficiency, and steering bandwidth, and close with worked designs and test plans.

## 21.1 Refractive Lenses: Fundamentals and Choices

### 21.1.1 Thin Lens and Effective Focal Length
```
1/f = (n−1)(1/R1 − 1/R2)
EFL for multi‑element groups via lensmaker’s/ABCD; pick EFL to match required NA and beam diameter
```

### 21.1.2 Aberrations and Aspheres
- Spherical aberration, coma, astigmatism: scale with aperture and field; aspheres reduce aberrations for compact heads
- For narrow fields (FSOC), prioritize on‑axis correction and minimal tilt sensitivity

### 21.1.3 Materials and AR Coatings
```
Fused silica (low loss @ 1550 nm), BK7 (economical), high‑index flints for compact EFL
AR at 1550: R < 0.2% per surface typical; watch dn/dT for thermal focus shift
```

## 21.2 Fresnel Lenses

### 21.2.1 Efficiency and Diffraction
Fresnels approximate aspheric profiles; they trade thickness for diffraction efficiency and stray orders.
```
η_Fresnel ≈ 90–95% with good microstructure; stray orders add background and ghosting
F‑number sets zone width; smaller F → coarser zones → more scatter; pick F to balance thickness vs efficiency
```

### 21.2.2 Large‑Aperture Receivers
For lightweight receive optics, Fresnels enable >200 mm apertures at grams rather than kilograms. Combine with baffles and narrowband filters to control background.

## 21.3 MEMS Steering Mirrors and Micro‑Optics

### 21.3.1 Steering Range and Resolution
```
MEMS tilt ±θ_max (mrad), resolution δθ (µrad); pointing jitter contribution adds to σ_point
Mirror size sets beam diameter before clipping; keep beam smaller than mirror clear aperture
```

### 21.3.2 Bandwidth and Control
```
Resonant frequency f0; closed‑loop bandwidth ≈ 0.2–0.3 f0 for good phase margin
Drive limits and cross‑axis coupling; calibrate to linearize response
```

## 21.4 Design Calculators

### 21.4.1 Receiver Lens to Photodiode Coupling
```
Given D_rx, EFL f_r, and PD diameter d_pd:
Spot at focus (diffraction): w_focus ≈ 1.22 λ f_r / D_rx
Coupling η ≈ 1 − exp(−2 (d_pd/2)² / w_focus²)
```

### 21.4.2 Fresnel Thickness and Zone Pitch
```
Fresnel zone width at radius r: p(r) ≈ λ / (n−1) · f / r
Total thickness ~ a few mm for 200–300 mm diameter, f/10–f/20 designs
```

### 21.4.3 MEMS Steering Budget
```
Total σ_point² = σ_platform² + σ_gimbal² + σ_MEMS² + σ_turb²
Set σ_MEMS from tilt resolution and control noise; ensure σ_point ≤ 0.3 w at link range
```

## 21.5 Worked Designs

### 21.5.1 Lightweight 200 mm Fresnel Receiver @ 1550 nm
```
Fresnel D=200 mm, f=2 m (f/10); w_focus ≈ 1.22 λ f / D ≈ 1.22×1.55e−6×2 / 0.2 ≈ 19 µm
PD d=80 µm → η ≈ 1 − exp(−2 (40e−6)² / (19e−6)²) ≈ 1 − exp(−8.9) ≈ 0.9999 (idealized)
Budget additional aberrations/scatter → practical η 90–95%
```

### 21.5.2 MEMS Fine Steering + Refractive Transmit Head
```
Beam after 20× expander: D ≈ 20 mm; MEMS mirror clear aperture ≥ 25 mm
Tilt range ±1 mrad → coverage ±1 mrad at far field; residual jitter ≤ 50 µrad RMS
Closed‑loop BW ≥ 1 kHz; integrate quad‑cell or FPA for feedback
```

## 21.6 Test & Validation Plan

1) Lens throughput/AR: spectrophotometer @ 1310/1550; record τ vs angle
2) Fresnel efficiency: measure main order vs stray orders; background with solar simulator
3) MEMS dynamics: Bode plot; bandwidth, phase margin; jitter spectrum under closed loop
4) End‑to‑end: lab far‑field path or outdoor range; measure P_rx and σ_point vs wind/temperature; compare to Chapter 19

## 21.7 Summary

- Refractive/aspheric lenses provide high quality with some mass; Fresnels reduce mass at cost of scatter/efficiency
- MEMS mirrors enable kHz steering to fight turbulence; integrate into σ_point budget
- Use the calculators to match apertures, focal lengths, and steering to FSOC link budgets


