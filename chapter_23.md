# Chapter 23: SFP Experimenter Hardware — From Bench to Field Prototype

*Extracting TOSA/ROSA, building optics, and validating the whole chain*

## 23.0 Why This Chapter Matters

Turning concepts into working FSOC prototypes requires safe, repeatable access to SFP electro‑optics, solid power/thermal design, and a disciplined test plan. This chapter shows how to use experimenter boards to tap TOSA/ROSA signals, integrate external optics, respect the 20‑pin contract, and validate end‑to‑end performance.

We also add a critical capability: dual‑channel operation. A primary channel carries user data (e.g., 1 Gb/s Ethernet), while a secondary alignment/telemetry channel continuously exchanges where the beam is hitting at the receiver (x/y relative to the aperture center). Both ends use this telemetry to auto‑align via fast steering mirrors or gimbals.

## 23.1 Hardware Access and Safety

### 23.1.1 Experimenter Boards
- Break out TOSA/ROSA pins and I²C (SFF‑8472) to headers
- Provide clean 3.3 V rails with inrush limiting and ferrite isolation (Ch.09)
- SMA test points for TX/RX differential pairs; proper 100 Ω terminations

### 23.1.2 Eye‑Safety and Interlocks
- 1550 nm preferred for higher power (Class 1/1M configs)
- Add shutter/cover switches; disable TX on fault; log events

## 23.2 TOSA Path: Extract and Launch

### 23.2.1 Electrical and Control
- TX_DISABLE, TX_FAULT handling per MSA; soft‑start sequences
- I²C to monitor laser bias/temperature; log for drift analysis

### 23.2.2 Optics Integration
- Collimation lens mount aligned to TOSA ferrule; adjustable axial stack
- Bolt‑on beam expander (Ch.20); fiducials for repeatable setup

## 23.3 ROSA Path: Capture and Retiming

### 23.3.1 ROSA Mount and Aperture
- Rigid mount for receive optics; baffling and filters to reduce background
- Heater/defogger options for environmental operation

### 23.3.2 Signal Chain
- PD → TIA → LA → CDR (Ch.16–17); ensure power filtering per Ch.17.9
- Provide retimed differential output to host; measure eye and jitter

## 23.4 Power and Thermal Budget

### 23.4.1 Rails and Filtering
- Separate analog/digital domains with beads; local C’s (100 pF, 0.1 µF, 10 µF)
- Current budget for TOSA driver, TEC (if any), TIA/LA, CDR, sensors

### 23.4.2 Thermal Path
- Heat spreaders on drivers/DSP; airflow provisions; case temperature monitoring

## 23.5 Test Plan — Stepwise

1) Electrical bring‑up: rails, clocks, I²C; verify SFF‑8472 data
2) TX optical: collimate and expand; measure divergence vs design (Ch.20)
3) RX optical: align aperture; measure P_rx vs range; compare to Ch.19 budget
4) Link tests: BER vs P_rx at 10G/1G; record pre/post‑FEC
5) Environmental: thermal cycling and outdoor trials; log σ_point, P_rx, BER
6) Safety: interlock tests and fault response

## 23.7 Dual‑Channel Auto‑Alignment Architecture

### 23.7.1 Two Approaches: Dual‑Wavelength vs. Pilot Subcarriers
- Dual‑λ (recommended): transmit data at λ₁ (e.g., 1550 nm) and alignment at λ₂ (e.g., 1310 nm). Dichroic splitters isolate channels; λ₂ feeds quadrant/FPA sensor. Advantages: minimal interference, independent gain control. Web literature shows non‑mechanical and wavelength‑tuned steering variants (e.g., liquid‑crystal antennas, cascaded gratings).
- Pilot subcarriers (single λ): embed low‑frequency pilot tones orthogonal to data; detect with narrowband photodiodes or tap PD + demod chain. Advantage: single laser, but coupling/EMI care needed.

#### Why dual‑λ is recommended
- **Spectral isolation**: A dichroic routes λ₂ straight to a sensor chain. No interaction with the data ROSA/TIA/LA/CDR, so no eye‑mask/TDECQ penalties and no surprises from AC coupling or equalization.
- **Independent gain/bandwidth**: λ₂ power and sensor bandwidth (100 Hz–1 kHz) can be tuned to control‑loop needs without touching the data budget.
- **Clean control loop**: Sensor noise/offsets and servo dynamics are confined; alignment telemetry won’t leak into decision thresholds or jitter transfer.
- **Robust to modulation/coding**: Works for NRZ/PAM4 with any FEC; no need to re‑qualify pilot placement when data formats change.

#### What makes pilot subcarriers tricky
- **Receive‑chain filtering**: SFP receive paths are AC‑coupled and equalized; low‑frequency pilots (tens–kHz) get attenuated or distorted. In practice you often need an optical tap and a separate demod front‑end anyway—negating the “single chain” simplicity.
- **Eye and jitter penalties**: Injected pilots ride on OMA. Even 1–2% pilot depth can nudge decision thresholds, increase TDECQ (PAM4), or add pattern‑dependent jitter if they leak into limiting/CTLE/DFE/CDR.
- **EMI/crosstalk**: Analog pilot injection/demod can couple into sensitive TIA/LA nodes unless grounding/shielding and notch/LP filters are meticulous.
- **Nonlinearities**: Limiting amps and laser/driver chirp produce intermods; pilots are no longer perfectly “orthogonal.”
- **Compliance churn**: Pilot placement must dodge CDR loop bandwidths, wander corners, AC‑coupling zeros, and spec conditions—fragile across platforms.

#### When to choose pilots
- You must remain single‑λ and can add a dedicated optical tap (e.g., 95/5 splitter) + narrowband sensor chain isolated from the data ROSA (i.e., treat pilots like a dual‑λ sensor at the same λ).
- You can keep pilot depth very low (≤1% of OMA), place pilots safely away from receive‑chain poles/zeros, and verify no measurable impact on eye/jitter/TDECQ across PVT and channel loss.

#### If you still want pilot subcarriers (practical guidance)
- **Tap, don’t load**: Prefer a small optical tap to a separate PD/LNA/demod rather than modulating the main OMA.
- **Safe placement**: Put pilots outside CDR/equalizer sensitivities; capture with a band‑limited front‑end (notch/LP) while the data chain suppresses them.
- **Notch before data chain**: If they must share the receiver, notch pilots out before limiting/CTLE/DFE.
- **Validate thoroughly**: Measure eye/TDECQ (PAM4), jitter decomposition, and BER with/without pilots across temperature, patterns, and channel loss.

#### Rule of thumb
- **Dual‑λ**: robust, spec‑compliant alignment with minimal integration risk (recommended for FSOC).
- **Pilots**: only if you accept added integration/test burden and still isolate with a tap + dedicated demod chain.

### 23.7.9 Why pilots “leak” into limiting/CTLE/DFE/CDR (detailed)

Think of the pilot as a small sinusoidal amplitude (and sometimes phase) modulation superimposed on the high‑speed data. In a perfectly linear, perfectly filtered, perfectly isolated chain, an orthogonal low‑frequency pilot would not affect decisions. Real SFP receiver chains are not ideal, and the pilot couples through several mechanisms:

- **AC coupling and baseline wander**:
  - The module and host paths use AC‑coupling capacitors and high‑pass corners designed around the data’s spectral shaping (e.g., 8b/10b, 64b/66b).
  - A low‑frequency pilot sits near or below these corners; the chain does not pass it “flat”—you get baseline wander and slow amplitude bias that rides into the slicer.
  - Result: apparent vertical eye offset (noise), duty‑cycle distortion, and slow wander the CDR may partially track.

- **CTLE peaking and non‑flat group delay**:
  - The CTLE is tuned to counter channel loss around the data Nyquist; its magnitude/phase are not flat at pilot frequencies.
  - The pilot gets boosted or phase‑shifted unevenly; group‑delay ripple turns what should be a benign tone into pattern‑dependent ISI.
  - Net effect: horizontal eye closure (jitter) and vertical noise that vary with data pattern.

- **Limiting amplifier non‑linearity (AM→PM/AM intermod)**:
  - LAs compress by design; adding a low‑frequency tone to data creates intermod products.
  - Even small pilot depths (1–2% of OMA) can produce sidebands around data harmonics; in PAM4 these map into level skew and raise TDECQ.
  - Nonlinearities also convert some amplitude modulation (pilot) into phase modulation—observed as timing jitter.

- **Laser/driver chirp and optics**:
  - Pilot amplitude on the electrical side can alter optical frequency (chirp) slightly; fiber/optics convert that to additional AM/PM noise with dispersion.
  - The receive chain “sees” a composite impairment, not a clean, isolated tone.

- **CDR interaction (PLL bandwidth and phase detector)**:
  - CDRs track low‑frequency wander inside loop bandwidth; a pilot near this range shows up as deterministic phase error.
  - Bang‑bang/Alexander PDs quantize errors; tones can create spurs in the recovered clock, increasing periodic jitter and reducing jitter tolerance.

- **DFE and slicer threshold bias**:
  - DFE assumes consistent symbol statistics; low‑frequency amplitude bias shifts the error feedback operating point.
  - For PAM4, tiny level‑dependent biases inflate TDECQ; the equalizer “works harder,” adding noise gain.

- **Power allocation and OMA steal**:
  - Any in‑band pilot consumes part of the optical power budget; the effective OMA for data shrinks, directly impacting sensitivity/BER.

The symptoms line up with classic eye/jitter analysis: horizontal spreading (periodic jitter from PLL/LA intermod), vertical spreading (added amplitude noise and baseline wander), and eye asymmetry (pattern‑dependent ISI). These are precisely what eye diagrams and jitter decomposition expose.

### 23.7.10 Mitigations and measurement plan

- **Prefer optical tap + separate demod chain**:
  - Split a small fraction (e.g., 5%) to a narrowband PD/LNA/ADC; keep the main ROSA path pilot‑free.
  - If single‑λ, this mirrors the dual‑λ isolation concept spectrally.

- **If in‑band pilots are unavoidable**:
  - Keep pilot depth ≤ 0.5–1.0% of OMA and verify no measurable penalty.
  - Place pilot tones outside CDR loop bandwidth and away from CTLE peaking; avoid frequencies that align with package AC corners.
  - Add deep notches before the limiting/CTLE/DFE path so pilots are removed before non‑linear gain stages.

- **Validation (must‑do)**:
  - Eye diagram and jitter decomposition (separate RJ/DJ/PJ); verify no increase beyond spec masks.
  - PAM4 TDECQ/ER/SNDR across temperature, channel loss, and patterns.
  - Spectrum at LA output and at CDR input; look for pilot‑related spurs and intermods.
  - Pre‑/post‑FEC BER vs optical power curves with and without pilots; confirm no SNR penalty.
  - CDR jitter tolerance tests (sinusoidal jitter masks) with pilots on/off.

**Bottom line**: pilots are not “free.” In real chains, they couple through AC corners, equalizer shaping, non‑linear LAs, CDR loops, and DFE adaptation—exactly the blocks that decide bits. Dual‑λ keeps alignment orthogonal to data and avoids these traps; use it unless single‑λ is a hard constraint and you can truly isolate the pilot with a tap and notches, then prove neutrality with measurements.

### 23.7.11 Receive‑chain filtering (deep dive)

SFP+ receiver paths are purposely band‑limited and shaped for data, not for out‑of‑band tones.

- **Multiple high‑pass/AC corners**:
  - Series AC‑coupling capacitors (e.g., 100 nF into ~50–100 Ω) create HP corners in the 10–30 kHz region; additional corners appear across the module/host boundary and inside the LA/CTLE network.
  - A pilot below or near these corners is attenuated and phase‑shifted, causing baseline wander. Even if the average is zero, the slicer sees a drifting reference.
  - Simple model: for HP with f_c, a pilot at f_p has |H| ≈ f_p/√(f_p²+f_c²) and phase ≈ arctan(f_c/f_p). At f_p ≈ f_c you get large phase lag and partial attenuation—worst for wander.

- **CTLE magnitude/phase shaping**:
  - CTLE adds zeros/poles to counter channel loss near Nyquist. Outside that band, magnitude and group delay are not flat.
  - The pilot tone experiences arbitrary gain/phase depending on CTLE settings, so its waveform at the slicer is not a benign sinusoid; it morphs into pattern‑dependent ISI when combined with data.

- **Practical implication**: the receive chain fights low‑frequency content by design. A pilot that isn’t fully removed before these stages becomes distorted in ways that directly bias decisions.

### 23.7.12 EMI and crosstalk (how it sneaks in)

Analogue pilot injection and demod front‑ends add new aggressors into an already sensitive RF chain.

- **Capacitive coupling**: Long, high‑impedance runs near the TIA input couple through C_par into the summing node. Even femtofarad coupling at multi‑GHz edges injects µV‑level errors.
- **Inductive coupling/return paths**: Pilot loops and poor ground referencing add magnetic coupling into LA/CTLE stages; shared returns create common‑impedance coupling.
- **Demod front‑end noise**: LNA/ADC clocks for pilot demod spray spurs unless shielded/filtered.
- **Mitigations**: keep the pilot analog chain physically isolated, use star‑grounding and short return paths, guard/shield around TIA/LA inputs, and place deep notches/LP filters at pilot interfaces.

### 23.7.13 Nonlinearities and intermodulation (AM→PM)

- **Limiting amplifier**: By design, it compresses amplitude; superimposing a small pilot creates cross‑terms. If the data is x_d(t) and pilot is m cos(ω_p t), the output contains terms around data harmonics ±ω_p.
- **AM→PM conversion**: Nonlinear transfer (and laser/driver chirp) converts some amplitude variation into phase/timing jitter, directly widening the eye horizontally.
- **PAM4 sensitivity**: With four levels, small level‑dependent gain errors and intermods inflate TDECQ quickly. A 1% pilot can translate into several tenths of a dB TDECQ penalty depending on chain settings.

### 23.7.14 Compliance interactions (why it’s fragile across platforms)

Pilot placement must avoid:

- **CDR loop bandwidth**: Tones inside the loop (e.g., a few MHz for 10G CDRs, vendor‑dependent) appear as deterministic phase error; outside the loop they fold into jitter transfer.
- **Wander/HP corners**: Below wander masks and AC coupling zeros, pilots become baseline wander.
- **Equalizer settings**: Host backplane CTLE/DFE adaptation changes with channel loss/temperature, moving the “safe” region.
- **Spec tests**: Sinusoidal jitter tolerance, stressed‑eye, and PAM4 TDECQ measurements can all be perturbed by pilots—failing compliance even if BER seems fine.

Because these parameters vary by vendor and environment, a pilot that is harmless on one setup can be harmful on another. This creates ongoing re‑qualification burden; dual‑λ avoids it by design.

### 23.7.2 Receiver Sensing: From Hit Pattern to (x,y)
Options:
- Quadrant detector behind a diffuser: compute x,y = f(ΔI/I_total); kHz bandwidth.
- Small Fresnel/segment array (your sketch): multiple segments each with PD/TIA; the “most‑hit” segment and weighted centroid yield (x,y).
- FPA/CMOS sensor (low‑rate): compute centroid in DSP; slower but rich diagnostics.

Signal chain (dual‑λ):
```
Aperture → dichroic → λ₁ → ROSA/data chain
                 └→ λ₂ → quad/segments → analog front‑end → MCU/FPGA → (x,y)
```

### 23.7.3 Control Loop to Servos/FS Mirrors
```
Ref: desired (x,y)=0 → error e = −(x,y)
Controller: PID (or LQG) at 100 Hz–1 kHz
Actuators: gimbal (coarse, 10–100 Hz), fast steering mirror (fine, ≥1 kHz)
Feed alignment telemetry both directions (uplink/downlink) for cooperative tracking
```

### 23.7.4 Protocol for Alignment Telemetry
```
Dual‑λ: serialize (x,y), quality metrics (P_rx, σ_point_est), and status at, e.g., 10–1000 Hz; send via λ₂ optical link with simple framing (CRC, seq)
Pilot: modulate pilot subcarriers at distinct tones (e.g., 1, 2 kHz); recover amplitudes → (x,y) via calibration matrix; packetize over data or separate low‑rate channel
```

### 23.7.5 Implementation Notes
- Calibrate mapping from segment currents (or quad voltages) to (x,y) using a scan pattern.
- Ensure λ₂ power meets eye‑safety and doesn’t saturate sensors; add ND filters if needed.
- Clock the control loop from telemetry ingress; bound end‑to‑end latency (< few ms) to avoid instability.

### 23.7.6 Is This Possible with SFP Constraints?
Yes—with external optics and experimenter boards. Keep the SFP electrical contract untouched: the host still sees normal SFP data I/O. Add a parallel optical head for λ₂ sensing and a microcontroller/FPGA driving servos. Power budget and thermal management must account for the added sensors/actuators.

### 23.7.7 How to “Capture” the Alignment Signal Outside Normal Data
- Dual‑λ: use dichroic beamsplitter; λ₂ routed to a quadrant/segment sensor with its own TIA/ADC; completely bypasses the data ROSA chain.
- Pilot: tap a small fraction of λ₁ with a non‑polarizing beamsplitter (e.g., 95/5); run the 5% to a narrowband demod front‑end; isolate from data path to avoid crosstalk.

### 23.7.8 Worked Example
```
Data: 1 Gb/s @ 1550 nm to ROSA → 1G PHY
Alignment: 1310 nm @ 10 kb/s telemetry; dichroic sends 1310 to quad PD
Quad PD BW: 1 kHz; FS mirror BW: 1 kHz; control latency: 1 ms
Loop holds σ_point ≤ 0.2 w → <1 dB pointing loss per Ch.19
```

## 23.6 Summary

- Use experimenter boards to access SFP internals safely
- Follow power/thermal practices from earlier chapters; instrument everything
- Validate optics and link budgets incrementally; iterate to close performance


