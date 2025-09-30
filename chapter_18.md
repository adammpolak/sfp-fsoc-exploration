# Chapter 18: Speed Scaling Trade‑offs (100 Mb/s → 1G → 10G → 25/50/100G)

*How every block evolves as speed increases—and why those changes are inevitable*

## 18.0 Why This Chapter Matters

Up to now, we studied each block of the SFP chain in isolation—lasers, TIAs, CDRs—at a representative speed. Real systems live on roadmaps. Ethernet generations jump by ~10× or ~2.5× steps, and with each jump the physics, circuits, packaging, power, and thermal margins all change together. This chapter provides a systematic framework to compare generations and to quantify the trade‑offs that force different technology choices at 100 Mb/s, 1G, 10G, 25/50G and 100G.

By the end of this chapter, you will be able to:
- Map required bandwidth and SNR at each speed to laser choice (FP/DFB/VCSEL/EML) and modulation (NRZ vs. PAM4)
- Budget dispersion, jitter, and ISI for short‑reach MMF vs. long‑reach SMF links
- Select equalization/FEC appropriate to the baud rate and channel loss
- Predict power and thermal headroom as data rate scales, and explain why some modules need heat slugs, airflow, or case temperature derating
- Understand why the SFP mechanical and 20‑pin electrical “contract” survives even as internal architectures diverge

## 18.1 From Bit Rate to Bandwidth and SNR

### 18.1.1 Symbols, Baud Rate, and Eye Height
For binary NRZ, baud rate equals bit rate. For PAM4, baud rate is half the bit rate, but there are 4 levels with smaller eye openings.

```
NRZ 10 Gb/s → 10 GBaud, 1 eye
PAM4 25 Gb/s/lane → 12.5 GBaud, 3 eyes (~1/3 amplitude each)
```

Approximate analog bandwidth targets (rule‑of‑thumb):
- **NRZ**: front‑end −3 dB bandwidth ≈ 0.7 × baud
- **PAM4**: similar analog bandwidth, but SNR per eye is ~9.5 dB worse than NRZ at equal power (due to 3 decision thresholds and 3× smaller vertical eye)

Implications as speed rises:
- TIA/LA bandwidth, slope efficiency, and jitter tolerance must all improve together
- PCB loss and package parasitics consume a larger fraction of the signal period
- Equalization and FEC move from optional to mandatory at high speeds

### 18.1.2 Unit Interval Physics: What 97 ps Really Means
At 10 Gb/s, the unit interval (UI) is 100 ps (≈96.97 ps at 10.3125 G). Timing and bandwidth margins map directly into UIs:

```
Bit rate    UI (ps)   20–80% rise target    -3 dB BW target (NRZ)
100 Mb/s    10,000    1,000–2,000 ps        ~70 MHz
1 Gb/s      1,000     100–200 ps            ~700 MHz
10 Gb/s     100       10–20 ps              ~7 GHz
25 Gb/s     40        6–12 ps               ~17.5 GHz (NRZ)
PAM4 25G    40 (12.5G baud) same as above   ~9–10 GHz analog, FEC req'd
```

Rule‑of‑thumb mappings:
- Rise/fall 20–80% ≲ 0.2–0.3 UI to limit ISI
- Total deterministic jitter (DJ) budget ≲ 0.1–0.15 UI; random jitter (RJ, RMS) sized to BER target via Q‑factor

### 18.1.3 BER, Q‑Factor, and FEC Interaction
For OOK/NRZ with Gaussian noise, BER ≈ 0.5·erfc(Q/√2). Targets:
- BER 10⁻¹² → Q ≈ 7 (no FEC)
- With RS‑FEC (e.g., KP4), pre‑FEC BER up to ~10⁻³ can be corrected to <10⁻¹², trading latency/power for margin. This enables PAM4 at high rates with degraded SNR per eye (~9.5 dB penalty vs NRZ).

### 18.1.4 Quick Calculators
```
UI_ps = 1e12 / bitrate_Gbps
BW_Naive_GHz ≈ 0.7 × baud_Gbaud
Q_from_BER(B) ≈ √2 · erfc⁻¹(2B)
```
These back‑of‑envelope tools guide early feasibility before detailed sim.

## 18.2 Optical Sources vs. Speed and Reach

### 18.2.1 Common Choices by Generation
- **100 Mb/s–1G (FE/GE)**: FP or VCSEL, direct modulation, MMF (850 nm) for short reach; SMF (1310 nm) for longer reach. Simple encoding (4B/5B, 8b/10b), no FEC.
- **10G**: 10GBASE‑SR (850 nm VCSEL/MMF), 10GBASE‑LR (1310 nm DFB/EML/SMF). 64b/66b, dispersion starts to matter; pre‑emphasis/equalization common. Limited reach for directly modulated DFB due to chirp + CD.
- **25/50/100G per lane**: PAM4 for higher aggregate rates. For 25G NRZ short‑reach: VCSEL/MMF; for longer reach: externally modulated lasers (EML) or DFB with dispersion compensation, coherent for very long distances (beyond classic SFP contexts). FEC becomes standard.

### 18.2.2 Chirp and Dispersion Scaling
Directly modulated lasers exhibit chirp that converts to time spreading in dispersive fiber. For standard SMF at 1550 nm:
```
Dispersion D ≈ 17 ps/(nm·km)
Chirp swing at 10G NRZ: ~0.1 nm → 1 km adds ~1.7 ps of spread per 0.1 nm per km
10G over 80 km: ~136 ps broadening (≈ 1 UI at 10G)
```
As symbol periods shrink, the same absolute broadening consumes more UIs. Hence the transition to:
- Short‑reach MMF with VCSEL at 850 nm (low CD; MMF modal dispersion constrains distance)
- EML at 1310/1550 nm for longer reaches to minimize chirp
- Coherent detection at very high rates/long distances

### 18.2.3 Source Selection Matrix (Detail)
```
Rate/Reach     MMF 850 nm           SMF 1310 nm                 SMF 1550 nm
100M–1G        VCSEL/FP (DM)        FP/DFB (DM), low chirp      DFB (DM), CD manageable
10G SR         VCSEL (DM)           —                           —
10G LR/ER      —                    DFB/EML (DM/EM), low chirp  EML preferred, CD mgmt
25G NRZ SR     VCSEL (tight spec)   —                           —
25G+ PAM4      VCSEL (short)        EML/DFB + FEC               EML + FEC; coherent if long
```
DM=direct modulation; EM=external modulation (EML).

### 18.2.4 Chirp, Dispersion, and Penalty Calculators
```
# Inputs
bitrate_Gbps
wavelength_nm (1310/1550 common)
dispersion_ps_nm_km (e.g., 0 at 1310 nm on G.652, 17 at 1550 nm)
delta_lambda_nm (laser linewidth + modulation chirp swing)
fiber_km

# Derived
UI_ps = 1e12/bitrate_Gbps
spread_ps = |dispersion_ps_nm_km| * delta_lambda_nm * fiber_km
UI_fraction = spread_ps / UI_ps

# Rule-of-thumb penalty (NRZ OOK)
if UI_fraction ≤ 0.2 → penalty ≈ 0–1 dB
0.2–0.4 → 1–3 dB (requires EQ / lower chirp)
>0.4 → severe penalty, consider EML/compensation
```
Notes:
- At 1310 nm, G.652 CD ≈ 0 → Δλ mostly affects spectral width not ISI
- At 1550 nm, directly modulated DFB with Δλ~0.1 nm over tens of km incurs multi‑UI spread → EML favored

## 18.3 Fiber & Channel: Loss, Dispersion, and Modal Effects

### 18.3.1 Attenuation and Connector Budgets
Loss grows with distance and components. As data rate increases, margin shrinks because receiver sensitivity degrades with required bandwidth and tighter jitter specs.

Simple planning model:
```
Link loss (dB) = Fiber loss (dB/km) × distance + connector/splice losses
Power margin (dB) = Tx power – link loss – Rx sensitivity
```

### 18.3.2 MMF vs SMF with Speed
- **MMF (OM3/OM4/OM5)**: Optimized for 850 nm; VCSEL‑based SR links; distance declines as rate rises due to modal dispersion; equalization can extend reach modestly.
- **SMF (G.652/655)**: Lower modal issues; chromatic dispersion dominates; requires CD management (choice of wavelength/laser, dispersion compensation, or coherent).

### 18.3.3 Dispersion Budget to UI Conversion
```
Temporal spread (ps) = |D| [ps/(nm·km)] × Δλ [nm] × L [km]
UI fraction = spread_ps / UI_ps
```
Where Δλ includes laser linewidth + chirp swing. Keep UI fraction from dispersion ≲ 0.2–0.3 after equalization to preserve eye.

### 18.3.4 Effective Modal Bandwidth (EMB) for MMF
MMF reach is limited by differential mode delay (DMD). Standards specify EMB (MHz·km):
```
OM3: 2000 MHz·km   OM4: 4700 MHz·km   OM5: 2800 MHz·km @ 953 nm

Max reach ≈ EMB / (0.7 × baud_MHz)

Example 10G (10,000 MHz) on OM3:
Reach ≈ 2000 / (0.7 × 10,000) = 0.285 km ≈ 285 m (pre-EQ)
```
Launch conditioning, VCSEL spectral width, and connector alignment alter effective reach; equalization can extend modestly.

## 18.4 Electrical Channel & Packaging at Higher Baud

### 18.4.1 PCB Loss and Equalization
At 10–25+ GBaud, FR‑4 loss and via stubs severely degrade eyes. The tooling shifts from “keep routes short” to engineered channels with:
- Back‑drilling to remove via stubs
- AC coupling with tight capacitor choice
- Controlled‑impedance differential pairs, shallow return paths
- Transmitter de‑emphasis/pre‑emphasis and receiver CTLE/DFE

Loss targets (typical):
- 10G NRZ: insertion loss at Nyquist ≲ 6–10 dB pre‑EQ
- 25G NRZ/PAM4: ≲ 12–20 dB with strong Tx/Rx EQ and FEC

Practical steps:
- Keep connector/cage per MSA SI app notes; simulate with 3‑D EM as needed
- Use backdrill and via field management; minimize stubs; keep pair discontinuities small and symmetric

### 18.4.3 Package and Bond Parasitics
At multi‑GHz, package leads and bond wires are inductive:
```
L_bond ≈ 0.8–1.0 nH/mm, ESR/Q vary with frequency
X_L = 2πfL → 1 nH @ 10 GHz → 62.8 Ω
```
Mitigations:
- Short, multiple parallel bonds (effective L reduces roughly 1/N)
- Flip‑chip for shortest interconnects
- On‑package damping/peaking to shape frequency response

### 18.4.4 De‑emphasis/Pre‑emphasis and CTLE/DFE Tuning Guide
```
Given channel loss at Nyquist (|H| dB):
- Set Tx de‑emphasis ≈ 0.6–0.8 × |H| (avoid overboost)
- Configure Rx CTLE zero/pole to flatten mid‑band dip, keep peaking ≤ 6–9 dB
- Enable DFE taps to cancel first 2–3 post‑cursor ISI terms; limit tap noise gain
```
Validate with eye masks and jitter decomposition (ISI vs. RJ).

### 18.4.2 Connectors and Cage
SFP/SFP+ cages and connectors are SI‑critical at 10G+. Contact geometry and reference designs from MSAs must be followed; re‑timing inside the module protects host channels from accumulated loss and jitter.

## 18.5 Coding, Modulation, and FEC Evolution

### 18.5.1 Line Coding
- **100 Mb/s–1G**: 4B/5B and 8b/10b ensure transition density; 25%/20% overhead.
- **10G**: 64b/66b reduces overhead to ~3.1% and controls run length for CDR robustness.

### 18.5.2 PAM4 at 25/50/100G Lanes
- Cuts baud in half for the same bit rate, easing analog bandwidth
- Costs ~9.5 dB in eye SNR; needs stronger equalization and mandatory FEC

PAM4 practicalities:
- Three slicers or ADC‑DSP; offset/gain correction per eye
- Strong DFE to counter ISI; CTLE peaking matched to channel loss
- Gray mapping to minimize symbol error → bit error impact

### 18.5.4 FEC Taxonomy, Gain, and Latency
Common FECs in optics:
- RS‑FEC(528,514) KP4: ~2.4% OH, ~5–6 dB coding gain at BER targets, latency ~100 ns–µs depending on implementation
- CL74/CL91/CL108 (various OH/gains): trade throughput, gain, and latency

Design notes:
- Pre‑FEC BER budget: e.g., ≤ 2×10⁻⁴ for KP4 at 25/50/100G PAM4
- Latency sensitive links may prefer lighter FEC and tighter physical margin
- FEC power scales with lane rate and process node; plan thermals

### 18.5.3 Forward Error Correction
- **Low rates**: Optional, often absent in short‑reach
- **10G LR/ER**: Optional FEC in some standards for margin
- **25G/50G/100G**: RS‑FEC or similar is standard to close the link budget with PAM4 and lossy channels; FEC latency and power become system design parameters

## 18.6 Receiver Front‑End and CDR Scaling

### 18.6.1 Photodiode/TIA/LA Bandwidth
Bandwidth requirements scale with baud. Shot and thermal noise integrate over wider bandwidth, increasing input‑referred noise and demanding higher optical power or better responsivity. Limiting amps must preserve edge integrity without excessive jitter peaking.

Noise scaling intuition:
```
i_n,shot ∝ √B,  v_n,thermal ∝ √B  →  Required OMA ↑ with B
RIN penalty grows with optical power; balance OMA vs RIN vs TIA noise
```

### 18.6.2 CDR Bandwidth, Jitter, and Equalization
As in Chapter 17, loop bandwidth balances jitter filtering vs. tracking. At higher baud:
- The loop bandwidth shifts upward to maintain acquisition and wander tracking
- Data‑dependent jitter grows with ISI; CTLE/DFE are increasingly co‑designed with the CDR
- PAM4 receivers add multi‑threshold slicing, often with ADC‑DSP pipelines in 50/100G class devices

Jitter budget example (10G NRZ target):
- UI = 97 ps; total jitter at BER 1e‑12 ≲ 0.3 UI p‑p
- Allocate: DJ 0.12 UI, RJ (RMS) sized so 14σ ≲ 0.18 UI

### 18.6.3 Sensitivity Modeling (NRZ vs PAM4)
NRZ (OOK) approximate sensitivity:
```
I_avg_min ≈ Q · σ_total / k_ER
σ_total = √(σ_shot² + σ_thermal² + σ_amp²)
k_ER accounts for extinction ratio mapping between levels
P_min = I_avg_min / R (responsivity)
```
PAM4 sensitivity worsens due to 3 eyes and decision thresholds; approximate penalty ~6–9.5 dB vs NRZ for same bandwidth and noise. FEC closes the gap by 4–6 dB depending on code.

### 18.6.4 CDR Acquisition and Wander
- Increase loop BW with rate to maintain lock time ≲ 1000 UI
- Provide frequency detector for initial pull‑in across ±100 ppm
- For FSOC or high wander channels, adaptive BW per 17.8 (2–8 MHz example at 10G)

## 18.7 Power and Thermal Across Generations

### 18.7.1 Scaling Trends
- Higher baud → more gain‑bandwidth in analog → more bias current → more heat
- EML drivers and TECs (for wavelength stability) dominate long‑reach power
- PAM4 DSP and FEC engines add dynamic power; advanced CMOS nodes trade power for integration

Power budgeting pattern (module level):
- 1G SX/LX: <0.8 W typical
- 10G SR/LR: 1.0–1.5 W (SFP+ thermal envelope)
- 25G/50G/100G lanes: 1.5–3+ W depending on DSP/FEC and reach

### 18.7.3 Compact Thermal Model (CTM) for Modules
Model heat flow paths and case temperature:
```
P_total = Σ(P_laser/driver + P_TEC + P_TIA/LA + P_DSP/FEC)
ΔT_case = P_total × θ_ca (case→ambient)
T_case = T_amb + ΔT_case
Margin = T_case_max_spec − T_case
```
Thermal practices:
- Use cage heat sinks and airflow per MSA guidelines
- Balance TEC setpoints with total budget (wavelength stability vs power)
- Derate performance at high ambient if margin tight

### 18.7.2 Module Thermal Practices
- Heat spreaders/heat slugs interfacing to the cage
- Directed airflow requirements at higher power grades
- Case temperature derating curves; host budgets enforced by MSAs

## 18.8 Putting It Together: Speed‑by‑Speed Snapshots

### 18.8.1 100 Mb/s (Fast Ethernet over fiber)
- Source: LED/FP or low‑speed VCSEL; NRZ; MMF; generous link margin
- Coding: 4B/5B; simple CDR; minimal equalization; no FEC
- Power/Thermal: Low; passive cooling

### 18.8.2 1G (1000BASE‑SX/LX)
- Source: VCSEL @ 850 nm (SX); FP/DFB @ 1310 nm (LX)
- Coding: 8b/10b; CDR modest BW; limited EQ
- Reach: SX to a few hundred meters on OM2/OM3; LX kilometers on SMF

### 18.8.3 10G (SFP+ SR/LR/ER)
- Source: VCSEL @ 850 nm (SR); DFB/EML @ 1310/1550 (LR/ER)
- Coding: 64b/66b; significant pre‑emphasis/EQ; optional FEC on longer reaches
- Limits: Chirp+CD constrain directly modulated DFB reach; PCB/channel SI critical
- Power/Thermal: Moderate; improved cages/heatsinking common

Instrumentation checklist at 10G:
- Eye mask compliance at TP2/TP3
- Jitter tolerance/transfer tests vs spec mask
- Rx sensitivity with PRBS31, OMA and extinction targets

### 18.8.4 25G NRZ and 25/50/100G PAM4
- Source: Short‑reach VCSEL; long‑reach EML/DFB; coherent beyond SFP scopes
- Coding/Modulation: PAM4 with RS‑FEC mandatory for most reaches
- Receiver: ADC‑DSP CDR for PAM4, multi‑threshold slicing; robust EQ (CTLE+DFE)
- Power/Thermal: Higher due to DSP/FEC and driver complexity; careful airflow and case limits

Validation highlights:
- Pre‑FEC BER vs optical power curve; FEC margin ≥ 3 dB
- EVM/SER for PAM4; equalizer adaptation convergence
- Host compliance: return loss, crosstalk, CM noise

### 18.8.5 Compliance Metrics Quick Reference
Optical:
- OMAouter, TDP/TDECQ (PAM4), extinction ratio, SRS (spectral), RIN
Electrical:
- SNDR, COM, eye masks at TP2/TP3, jitter (TJ/DJ/RJ) decomposition
Link tests:
- Jitter tolerance/transfer, stressed eye, pre‑/post‑FEC BER

## 18.9 Design Checklists When Upleveling Speed

1. Define target link budget and reach (MMF vs SMF, connectors)
2. Choose laser/modulation: VCSEL vs DFB/EML; NRZ vs PAM4
3. Verify dispersion penalties vs. UI at target baud; simulate chirp/CD
4. Allocate EQ/FEC: CTLE/DFE at Rx, de‑emphasis at Tx, FEC type/latency
5. Close electrical channel budget: insertion loss, return loss, crosstalk, via stubs
6. Size CDR bandwidths and jitter tolerance; plan acquisition behavior
7. Thermal: estimate worst‑case power; ensure cage/airflow budget; check case temp limits
8. Management/I2C: diagnostics scaling (SFF‑8472), alarms at higher powers/temps

### 18.9.1 Migration Cookbooks
1) 1G SX → 10G SR (MMF campus):
- Verify OM3/OM4 EMB; recalc reach; upgrade to VCSEL with tighter spec
- Channel SI: connector/cage per SFP+ app notes; backdrill; set Tx de‑emph, Rx CTLE
- Validate: eye mask, jitter tol, Rx sens with PRBS31

2) 10G LR → 25G NRZ (short SMF):
- Reassess dispersion (UI shrinks 2.5×); consider EML if DM marginal
- Power/thermal: +0.5–1 W headroom; airflow requirements
- Compliance: OMA/ER at 25G, pre‑FEC BER, optional light FEC

3) 25G NRZ → 50/100G PAM4:
- Plan FEC (KP4) and DSP; budget ~1–2 W extra
- Channel: stronger EQ (CTLE+DFE), PAM4 TDECQ limits, SNDR
- Validate pre‑FEC BER ≤ 2e‑4, TDECQ within spec, sufficient FEC margin

## 18.10 Worked Example: Migrating 1G LX → 10G LR

Assume a campus SMF link upgraded from 1G LX to 10G LR at similar reach.

Inputs:
- Fiber: 10 km G.652 SMF, splice+connector loss 1.5 dB total, fiber loss 0.35 dB/km
- 1G LX baseline: FP/DFB @ 1310 nm, NRZ, no FEC, ample margin
- Upgrade target: 10G LR, 64b/66b, NRZ

Steps and outcomes:
1) Link loss ≈ 0.35 dB/km × 10 km + 1.5 dB = 5.0 dB
2) Tx power and Rx sensitivity tighten due to 10G bandwidth; margin shrinks
3) CD at 1310 nm is near zero in G.652 fiber (advantage vs 1550 nm). Direct modulation DFB feasible at 10G and 10 km; beyond ~10–20 km, EML preferable.
4) PCB SI upgrades: back‑drilled vias, improved reference planes; Tx de‑emphasis and Rx CTLE added
5) CDR loop bandwidth set ~4–5 MHz; jitter tolerance tested per spec; optional FEC considered if margin thin
6) Thermal: SFP+ cage with heat slug and directed airflow recommended

Result: 10G LR at 10 km closes comfortably with DFB or EML; careful SI and equalization restore eye opening; thermal budget meets SFP+ envelope with modest airflow.

## 18.11 FSOC Note: Applying Speed Scaling to Free‑Space Links

For FSOC explorations (Part V/VI), the electrical SFP contract is unchanged. As you scale rate:
- Atmospheric turbulence acts like additional low‑frequency jitter/wander—tune CDR bandwidth adaptively (see 17.8)
- Aperture and optics must preserve SNR at increased bandwidth; higher rates require higher collected photons/second or better detectors/TIAs
- FEC becomes critical to ride through scintillation‑induced fades at higher symbol rates

## Summary

- Higher speeds compress unit intervals, exposing dispersion, ISI, and jitter that were previously benign
- Technology shifts: VCSEL/MMF for short reach, DFB/EML/SMF for longer; PAM4 with mandatory FEC to extend aggregate rates
- Electrical design hardens: engineered channels, stronger EQ, tighter CDRs
- Power/thermal budgets rise; cages, airflow, and case temp specs become first‑order
- The SFP electrical/mechanical contract remains, but internal architectures evolve to meet physics at each speed tier

## 18.12 Worked Numeric Examples and Tables

### 18.12.1 NRZ: 1G SX (MMF) and 10G LR (SMF)

Case A — 1G SX on OM3 (850 nm VCSEL):
```
Bitrate: 1.25 Gb/s (8b/10b)
UI: 800 ps (effective 1.0 ns bit)
Tx OMA: –4 to –2 dBm typical
Fiber: OM3, EMB = 2000 MHz·km; Reach target 300 m
Loss: Fiber ~3 dB/km @ 850 nm → 0.9 dB + 2×0.5 dB connectors = 1.9 dB
Rx sens: ~ –17 dBm (NRZ, no FEC)
Rx power = Tx – loss = –2 dBm – 1.9 dB = –3.9 dBm
Margin to sensitivity = –3.9 – (–17) = 13.1 dB (ample)
EMB check: Reach ≈ 2000/(0.7×1250) = 2.29 km (channel limits dominate before EMB)
```

Case B — 10G LR (1310 nm DFB/EML, SMF 10 km):
```
Bitrate: 10.3125 Gb/s (64b/66b)
UI: 97 ps
Tx OMA: ≥ –1 dBm (spec-typical), ER ≥ 3.5–6 dB
Fiber loss: 0.35 dB/km × 10 km = 3.5 dB; connectors/splices = 1.5 dB → total ~5.0 dB
Rx sens: ~ –14.5 dBm (NRZ, no FEC, typical spec)
Rx power = –1 – 5.0 = –6.0 dBm
Margin = –6.0 – (–14.5) = 8.5 dB
Dispersion (1310 nm): ~0 ps/nm/km → negligible CD; chirp penalty small
SI actions: backdrill vias, set Tx de‑emph 3–4 dB, Rx CTLE 4–6 dB
```

### 18.12.2 PAM4: 50G/100G over SMF (Short‑Reach)

Case C — 50G PAM4 (25 GBaud) Short‑Reach SMF (2 km):
```
Bitrate: 53.125 Gb/s PAM4 (64b/66b)
Baud: 26.5625 GBaud; –3 dB analog BW ≈ 9–10 GHz
Tx OMAouter: ≥ 2 dBm typical; TDECQ ≤ spec (e.g., ≤ 3.4 dB)
Fiber loss: 0.35 dB/km × 2 km = 0.7 dB; connectors 1.0 dB → total 1.7 dB
Pre‑FEC BER target: ≤ 2×10⁻⁴ (KP4)
Rx pre‑FEC sens (OMAouter): ~ –5 to –3 dBm (depends on DSP/EQ)
Rx power = 2 – 1.7 = +0.3 dBm
FEC margin (OMAouter) ≈ 3–5 dB vs sens; verify TDECQ and SNDR
Dispersion: 1310 nm minimal; 1550 nm needs EML/low chirp and short reach
```

Case D — 100G PAM4 per lane (25 GBaud) Very Short‑Reach SMF (500 m):
```
Tx OMAouter: ≥ 3 dBm typical
Loss: 0.35 dB/km × 0.5 km = 0.175 dB + 1.0 dB connectors = 1.175 dB
Rx OMAouter sens: ~ –2 dBm pre‑FEC
Rx power = 3 – 1.175 = 1.825 dBm → Margin ≈ ~3.8 dB
Compliance: TDECQ ≤ limit, pre‑FEC BER ≤ budget; KP4 corrects to ≤ 10⁻¹²
```

### 18.12.3 Sensitivity Approximation Table (Indicative)
```
Mode       Rate        Coding       Mod  Pre‑FEC BER     Rx Sens (typ)
1G SX      1.25 Gb/s   8b/10b       NRZ  10⁻¹²           –17 dBm
1G LX      1.25 Gb/s   8b/10b       NRZ  10⁻¹²           –19 dBm
10G SR     10.3125G    64b/66b      NRZ  10⁻¹²           –9 to –11 dBm
10G LR     10.3125G    64b/66b      NRZ  10⁻¹²           –14 to –15 dBm
25G SR     25.78125G   64b/66b      NRZ  10⁻¹²           –7 to –9 dBm (OMA)
50G PAM4   53.125G     64b/66b+FEC  PAM4 2e‑4 (pre‑FEC)  –5 to –3 dBm (OMAouter)
100G PAM4  106.25G     64b/66b+FEC  PAM4 2e‑4 (pre‑FEC)  –2 to 0 dBm (OMAouter)
```
Notes:
- Values are indicative; consult specific MSA/IEEE specs for exact limits (e.g., SFF‑8431, 802.3 clauses).
- PAM4 sensitivities are in OMAouter; ensure TDECQ/SNDR compliance.

### 18.12.4 Worked Dispersion UI Impact (Quick)
```
10G NRZ @ 1550 nm, D = 17 ps/nm/km, Δλ = 0.1 nm, L = 40 km
Spread = 17 × 0.1 × 40 = 68 ps; UI = 97 ps → 0.70 UI (severe)

Mitigation:
- EML (lower chirp, Δλ ≈ 0.02 nm): Spread = 13.6 ps → 0.14 UI (manageable)
- Or move to 1310 nm where D≈0 for G.652
```

### 18.12.5 Worked SI/EQ Tuning Example (10G backplane‑like)
```
Channel: 10 dB @ 5.16 GHz (Nyquist), smooth roll‑off
Tx: –3 dB pre‑emph initial; Rx CTLE peaking 6 dB, zero near 3 GHz
DFE taps: [–0.3, –0.2, –0.1] post‑cursor
Result: Eye opening recovers from 30% to 78%; DJ reduced from 0.18 UI → 0.10 UI
```

These examples should be adapted with measured/simulated channel data and vendor datasheets to finalize design margins.


