# SFP Engineering Reference (Overview)

This canvas acts as the **table of contents** to a book‐style, multi‐page guide that carries the reader from first‐principles physics through SFP transceiver operation and, finally, to Free‐Space Optical Communication (FSOC) innovation. Follow the sections in order—or jump to any topic via the embedded links.

## 📚 Part I — Foundational Physics & Engineering

| # | Chapter | What you'll learn | Link |
|---|---------|------------------|------|
| 1 | Electromagnetic Waves & Photons | Complete electromagnetic theory foundation: Maxwell's equations (integral & differential forms), E & B field propagation, Poynting vector & energy flux, wave equation derivation, plane wave solutions, polarization states, boundary conditions at dielectric interfaces, Fresnel coefficients, waveguide modes, evanescent fields, quantization of EM field → photon picture, energy E = h·f, momentum p = h/λ, photon statistics, coherence, why 1310/1550 nm for telecom, material absorption/dispersion mechanisms, and how every SFP design decision ultimately traces back to these fundamentals | [chapter_01.md](chapter_01.md) |
| 2 | Semiconductor Fundamentals | P‐N junctions, carrier injection, bandgap, doping | [chapter_02.md](chapter_02.md) |
| 3 | Laser Physics & Optical Modes | Population inversion, FP vs. DFB vs. VCSEL, single / multi‐mode | [chapter_03.md](chapter_03.md) |
| 4 | Photodiodes & TIAs | PIN vs. APD, shot noise, transimpedance design | [chapter_04.md](chapter_04.md) |
| 5 | Power‐Electronics & PCB Basics | Impedance, 100 Ω diff pairs, four‐layer stack‐ups, EMI control, LDO/PI‐filter design | [chapter_05.md](chapter_05.md) |

## 🛠️ Part II — SFP Interface & Management

| # | Chapter | Focus | Link |
|---|---------|-------|------|
| 6 | SFP MSA Mechanical & Thermal Envelope | Cage, latch, heat‐slug, airflow considerations | [chapter_06.md](chapter_06.md) |
| 7 | 20‐Pin Electrical Pinout | TX/RX pairs, VccT/R, TX_DISABLE, LOS, MOD_ABS, etc. | [chapter_07.md](chapter_07.md) |
| 8 | EEPROM & I2C Management | Two‐wire serial bus, SFF‐8472 diagnostics, digital alarms | [chapter_08.md](chapter_08.md) |
| 9 | Power Delivery & Hot‐Swap Sequencing | 3.3 V rails, inrush limiting, soft‐start, power budget per SFF‐8431 | [chapter_09.md](chapter_09.md) |
| 10 | Control & Alarm Signals | Real‐time status: TX_FAULT, RX_LOS; interaction timing with host logic | [chapter_10.md](chapter_10.md) |

## 🚀 Part III — End‐to‐End Signal Path (Transmit → Receive)

The chapters below trace one symbol from host pins, through optics and fiber, back to pins on the far side. Read sequentially for the full story.

| Step | Stage | Key Interfaces | Link |
|------|-------|----------------|------|
| 11 | Host SerDes & Line Coding | 100 Base‐FX (4B/5B), 1 G (8b/10b), 10 G (64b/66b), 100 G (PAM4) | [chapter_11.md](chapter_11.md) |
| 12 | Impedance Matching & EMI | AC‐coupling caps, 100 Ω diff, return loss, SI simulations | [chapter_12.md](chapter_12.md) |
| 13 | Laser Driver & TOSA | Bias + modulation current, TEC control, FP/DFB/VCSEL examples | [chapter_13.md](chapter_13.md) |
| 14 | Connector & Fiber Launch | LC/SC, mode‐field diameter, insertion loss budget | [chapter_14.md](chapter_14.md) |
| 15 | Fiber Propagation | Attenuation α [dB/km], dispersion β₂, modal vs. chromatic | [chapter_15.md](chapter_15.md) |
| 16 | ROSA, Photodiode & TIA | Responsivity R, TIA gain‐bandwidth, limiting amp | [chapter_16.md](chapter_16.md) |
| 17 | Clock/Data Recovery & Output | CDR PLL, equalisation, host electrical specs | [chapter_17.md](chapter_17.md) |

## ⚡ Part IV — Speed Scaling Trade‐offs

Compare how every block above evolves from 100 Mb/s → 1 Gb/s → 10 Gb/s → 100 Gb/s (laser types, PCB loss, equalisation, FEC, power draw, thermal).  
↪️ [chapter_18.md](chapter_18.md)

## 🌐 Part V — FSOC Theory & Link Budgeting

Beam divergence θ, spot size, geometric loss 1/(R²), atmospheric attenuation γ(λ), required optical power P_tx for BER ≤ 10⁻¹² at 1 km, 10 km, 100 km. Every step in the full chain so any update in component specs or performance can then be analyzed across the full solution.
↪️ [chapter_19.md](chapter_19.md)

## 🧪 Part VI — FSOC Innovation & Prototyping

## For FSOC Innovation we are only constrained by the SFP electrical 20 pin MSA with the media converter. The media converter must receive the electrical signals expected from the 20 pin so it is unaware there is a 'exotic' SFP sending data. There is no need to be constrained by SFP chasis/thermal properties as these modified SFPs are not for resale but for purpose specific FSOC use.

* Exploring transmission from SFP fiber optics to a wider collimated beam, beam expanders [chapter_20.md](chapter_20.md)
* Exploring lenses (MEMs, plastic Fresnel lens, more) [chapter_21.md](chapter_21.md)
* Exploring increasing FSOC receiving size (multiple photodetectors, multiple ROSA's, 1 photodetector for data, array of detectors for signal and auto alignment, parallel photodiode arrays vs. single‐large‐aperture design, etc) [chapter_22.md](chapter_22.md)
* Exploring using SFP Experimenter boards to extract TOSA/ROSA or modulate or create a prototype [chapter_23.md](chapter_23.md).
* Dual‑channel FSOC: primary data + alignment telemetry (dual‑λ or pilot subcarriers) for closed‑loop auto‑align using servo/FS mirrors [chapter_23.md](chapter_23.md)

---

## How to Navigate

1. **Start with Part I** if foundational physics is unfamiliar.
2. **Part II** explains the SFP "contract" (mechanical, electrical, management).
3. **Part III** walks the actual signal path—read in order steps 11 → 17.
4. **Part IV** zooms out to speed‐grade evolution.
5. **Part V & VI** cover FSOC theory and hands‐on innovation ideas.
