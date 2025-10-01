                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              FSOC SFP Simulator — Static Web App (Spec & Roadmap)

Project goal

Build a pure static HTML/CSS/JS tool to design and evaluate Free Space Optical Communication (FSOC) systems built from SFP electro‑optics and external optics/actuators. Users assemble a chain (TX → optics → free‑space channel → RX optics → electronics) and see cost, weight, power, link budget, distance, BER, and alignment/control requirements. A separate alignment return channel is modeled (full‑duplex), with multiple alignment strategies (dual‑λ, pilot tones, retroreflector beacons, imaging sensors).

References in this repo

- Overview of SFP stack: `Overview.md`
- FSOC theory/link budgeting: `chapter_19.md`
- SFP experimenter & alignment strategies: `chapter_23.md`
- FSOC with SFP adaptations and expanded beam: `chapter_30.md`

Constraints and scope (v1)

- Pure static site, no backend; runs from `index.html` (local file or static host).
- Optionally use D3.js for scales/axes; otherwise plain JS + SVG/Canvas.
- Full‑duplex topology with a separate alignment return channel.
- Simplified, parameterized physics with explicit comments on simplifications and future upgrades.
- Include turbulence/scintillation and pointing jitter effects (stochastic margin), with presets and tunables.
- External hardware integration is in scope (future): serial/WebUSB/WebSocket adapters for gimbal/FS mirror.

User experience (UX)

- Canvas: center-stage beam path with transmitter columns on the left, free-space channel cards in the middle, and receiver columns on the right. Nodes show gain/loss badges, tooltips, and stay vertically aligned with their launch/receive counterparts.
- Left sidebar (Parts): hierarchical palette with category headers and tooltips. Selecting a model hot-swaps it into the baseline topology; incompatible items are disabled with explanations.
- Right sidebar (Properties + Max Distance Explained): inspector inputs for editable models, warnings, and a narrative breakdown of why the max reach is what it is. A “Revert to defaults” button restores per-component seeds.
- Canvas interactivity: zoom (scroll), pan (drag), reset (double-click). Hovering reveals tooltips; clicking focuses the inspector. Default view provides left/right padding so both TX and RX stacks are visible even when max reach is short.
- Bottom metrics panel: live KPIs (cost, weight, power, max distance, link margin, BER pre/post-FEC, pointing residuals, actuator bandwidth targets) plus `P_rx` and BER plots versus distance.
- Top toolbar: global settings (bitrate 100 Mb/s / 1 Gb/s / 10 Gb/s, target BER, weather preset), PSD/jitter inputs, alignment mode, import/export JSON, auto-update toggle, run button, wind speed, and “Reset Models”.

Canvas semantics & visualization details

- Distance axis: spans all configurations with markers for current distance (blue) and computed max reach (red). The numeric labels show kilometers derived from the solver, even when the physical spacing is fixed on screen.
- Transmitter cluster: anchored so the right edge of the TX stack sits on the zero tick. Cards stack vertically with consistent spacing; gain/loss tags sit top-right.
- Receiver cluster: anchored so the left edge of the RX stack sits on the computed max-reach tick. When the system cannot close the link (`maxReach = 0`), TX and RX remain visible with a compressed gap and a red “0 km” marker.
- Beam envelope: blue polygon drawn above the channel panel, showing divergence between TX and RX anchors. Width scales with evaluated divergence and target distance.
- Receiver capture graphic: semi-transparent circle sized to the effective receiver footprint (objective or array envelope). The label reports the aperture or array diameter so users can see how well the beam fits the optics.
- Gain/loss chain: stage cards in the channel column list atmospheric, scintillation, pointing, and geometric contributions with instantaneous power progression.

High‑level architecture

- Data
  - Component database (JSON): rich, granular specs per device (optical, electrical, mechanical, cost, power). Seeded with placeholders, designed to ingest real datasheets later.
  - Configuration (JSON): current system instance (global settings + selected components + overrides).

- Engine
  - Evaluator: computes node‑by‑node link budget, P_rx vs distance, BER vs distance, margins, and control requirements given the configuration.
  - Compatibility: validates component limits vs global bitrate/λ/OMA; explains blockers and suggests alternatives.

- UI
  - Renderer: SVG/Canvas beam visualization with distance scale and beam envelope shaped by divergence.
  - Panels: parts palette, inspector, metrics/plots.
  - Persistence: localStorage session autosave; JSON import/export with `schema_version`.

File layout (proposed)

/
  index.html
  styles.css
  app.js                (bootstrap + state)
  components.db.json    (seed database; user can extend)
  schemas/
    component.schema.json
    config.schema.json
  js/
    calc/
      evaluator.js      (link budget, BER, margins)
      turbulence.js     (scintillation models)
      pointing.js       (mispointing & control)
      compatibility.js  (limits and rules)
    ui/
      canvas.js         (SVG/Canvas rendering)
      inspector.js
      palette.js
      metrics.js
      importExport.js
  docs/
    simplifications.md  (what’s simplified now, how to upgrade)
    hardware_integration.md (I/O plan for gimbal/FSM)

JSON schemas (v0.1 — stable core, expandable)

Component database (components.db.json)

Notes

- Components are granular to expose actual bottlenecks (e.g., separate `laser_driver`, `tosa`, `tia`, `la`, `cdr`, not just “ROSA”).
- Devices declare supported bitrates and operating ranges; the compatibility engine flags violations.
- Optics capture aperture, divergence, efficiency, and AR coatings. Alignment devices (gimbals/FSM) capture bandwidth, range, resolution, and latency.

Schema sketch

```json
{
  "schema_version": "0.1",
  "categories": [
    {
      "type": "laser_driver",
      "models": [
        {
          "id": "drv-abc123",
          "vendor": "ExampleCo",
          "bitrate_gbps_max": 10,
          "modulation_current_mapp": {
            "100M": [2, 10],
            "1G": [4, 20],
            "10G": [10, 40]
          },
          "rise_fall_ps": 60,
          "power_w": 0.4,
          "cost_usd": 12,
          "weight_g": 1.2,
          "notes": "Bias + modulation driver; APC compatible"
        }
      ]
    },
    {
      "type": "tosa",
      "models": [
        {
          "id": "tosa-1550-0dbm",
          "wavelength_nm": 1550,
          "optical_power_dbm": 0,
          "oma_dbm": -3,
          "supports_bitrates": [0.1, 1, 10],
          "requires_driver": true,
          "integrated_isolator": true,
          "monitor_pd": true,
          "power_w": 0.2,
          "cost_usd": 50,
          "weight_g": 1.8
        }
      ]
    },
    {
      "type": "collimator",
      "models": [
        {
          "id": "col-grin-2mm",
          "aperture_mm": 2.0,
          "output_divergence_mrad": 5.0,
          "insertion_loss_db": 0.7,
          "power_w": 0,
          "cost_usd": 30,
          "weight_g": 1.0
        }
      ]
    },
    {
      "type": "beam_expander",
      "models": [
        {
          "id": "exp-5x-mini",
          "magnification": 5,
          "residual_divergence_mrad": 0.5,
          "insertion_loss_db": 0.5,
          "cost_usd": 80,
          "weight_g": 8
        }
      ]
    },
    {
      "type": "filter_dichroic",
      "models": [
        {
          "id": "dich-1310-1550",
          "lambda_pass_nm": 1310,
          "lambda_reflect_nm": 1550,
          "il_pass_db": 0.3,
          "il_reflect_db": 0.3,
          "cost_usd": 40,
          "weight_g": 2
        }
      ]
    },
    {
      "type": "tap_splitter",
      "models": [
        {
          "id": "tap-95-5",
          "ratio_main": 0.95,
          "ratio_tap": 0.05,
          "il_db": 0.5,
          "cost_usd": 20,
          "weight_g": 1.5
        }
      ]
    },
    {
      "type": "fsm",
      "models": [
        {
          "id": "fsm-1khz",
          "bandwidth_hz": 1000,
          "range_mrad": 5,
          "resolution_urad": 5,
          "latency_ms": 0.5,
          "power_w": 1.2,
          "cost_usd": 250,
          "weight_g": 25
        }
      ]
    },
    {
      "type": "gimbal",
      "models": [
        {
          "id": "gim-100hz",
          "bandwidth_hz": 100,
          "range_deg": 10,
          "resolution_mrad": 0.1,
          "latency_ms": 5,
          "power_w": 6,
          "cost_usd": 400,
          "weight_g": 180
        }
      ]
    },
    {
      "type": "receiver_objective",
      "models": [
        {
          "id": "rx-aperture-100mm",
          "aperture_mm": 100,
          "efficiency": 0.85,
          "type": "refractive",
          "cost_usd": 120,
          "weight_g": 220
        },
        {
          "id": "rx-fresnel-150mm",
          "aperture_mm": 150,
          "efficiency": 0.7,
          "type": "fresnel",
          "cost_usd": 60,
          "weight_g": 120
        }
      ]
    },
    {
      "type": "sensor_quad",
      "models": [
        {
          "id": "quad-1khz",
          "bandwidth_hz": 1000,
          "nep_w_sqrtHz": 1e-12,
          "active_area_mm": 3,
          "cost_usd": 90,
          "weight_g": 3
        }
      ]
    },
    {
      "type": "rosa",
      "models": [
        {
          "id": "rosa-pin-1g",
          "responsivity_a_w": 0.9,
          "bitrate_gbps_supported": [0.1, 1],
          "sensitivity_dbm": {"0.1": -28, "1": -20},
          "overload_dbm": -3,
          "power_w": 0.35,
          "cost_usd": 45,
          "weight_g": 2.5
        },
        {
          "id": "rosa-apd-10g",
          "responsivity_a_w": 0.6,
          "gain": 10,
          "bitrate_gbps_supported": [1, 10],
          "sensitivity_dbm": {"1": -24, "10": -18},
          "overload_dbm": -6,
          "power_w": 0.6,
          "cost_usd": 120,
          "weight_g": 3
        }
      ]
    },
    {
      "type": "tia",
      "models": [
        {
          "id": "tia-10g-lownoise",
          "bandwidth_ghz": 7,
          "input_noise_pa_sqrtHz": 5e-12,
          "power_w": 0.4,
          "cost_usd": 35,
          "weight_g": 1
        }
      ]
    },
    {
      "type": "la_cdr",
      "models": [
        {
          "id": "cdr-1g",
          "bitrate_gbps": 1,
          "jitter_tolerance_ui_pp": 0.5,
          "power_w": 0.5,
          "cost_usd": 30,
          "weight_g": 1.2
        }
      ]
    },
    {
      "type": "fec",
      "models": [
        {
          "id": "fec-rs",
          "coding_gain_db": 3,
          "overhead_pct": 7,
          "latency_ms": 0.2,
          "power_w": 0.3,
          "cost_usd": 10,
          "weight_g": 1
        }
      ]
    }
  ]
}
```

Configuration (config.schema.json)

```json
{
  "schema_version": "0.1",
  "global": {
    "bitrate_gbps": 1,
    "wavelength_nm": 1550,
    "target_ber": 1e-12,
    "weather": "clear",     
    "distance_m": 1000,
    "fec_model": "fec-rs",
    "alignment_mode": "dual_lambda"  
  },
  "channel": {
    "atmospheric_alpha_db_per_km": 0.2,
    "Cn2": 1e-14,                        
    "pointing_jitter_mrad_rms": 0.2
  },
  "topology": {
    "tx": ["laser_driver", "tosa", "collimator", "beam_expander", "filter_dichroic", "tap_splitter", "fsm", "gimbal"],
    "rx": ["receiver_objective", "filter_dichroic", "rosa", "tia", "la_cdr"],
    "align_tx": ["laser_driver", "tosa", "filter_dichroic", "fsm"],
    "align_rx": ["receiver_objective", "filter_dichroic", "sensor_quad"]
  },
  "components": [
    {"id": "drv-abc123"},
    {"id": "tosa-1550-0dbm"},
    {"id": "col-grin-2mm"},
    {"id": "exp-5x-mini"},
    {"id": "dich-1310-1550"},
    {"id": "tap-95-5"},
    {"id": "fsm-1khz"},
    {"id": "gim-100hz"},
    {"id": "rx-aperture-100mm"},
    {"id": "rosa-pin-1g"},
    {"id": "tia-10g-lownoise"},
    {"id": "cdr-1g"}
  ],
  "overrides": {
    "beam_expander": {"magnification": 6}
  }
}
```

Calculation models (v1)

Notation

- Use λ in nm, distances in m/km; powers in dBm; angles in mrad/µrad; areas in m²; rates in b/s.

Transmit optics and beam

- Divergence: start from component divergence or compute from Gaussian beam with output aperture D: θ_diff ≈ 1.22·λ/D (radians) for diffraction limit; actual divergence = max(component_spec_divergence, θ_diff).
- Beam radius at range L: w(L) ≈ L·θ (for far‑field, small angles).
- Beam power density at range: S(L) ≈ P_t / (π·w(L)²).

Geometric coupling and receiver capture

- Receiver aperture radius a = D_r/2; captured fraction η_geo ≈ A_r / A_beam = πa² / (πw²) = (a/w)² for w ≫ a; more generally use overlap of Gaussian and circular aperture.
- Additional optical efficiencies: multiply by η_chain = ∏(10^(−IL_db/10)) across optics.

Atmosphere

- Attenuation: L_atm_db ≈ α_db_per_km · (L_km).
- Scintillation (log‑normal): Rytov variance σ_R² ≈ 1.23·C_n²·k^(7/6)·L^(11/6) (k = 2π/λ); convert to dB margin via M_scin ≈ Q·σ_R (Q from target outage; start with Q≈2–3 for 95–99.7%).

Pointing/jitter loss

- Model angular jitter as zero‑mean Gaussian with σ_point (mrad). Effective mispointing loss for Gaussian beam to circular aperture: η_point ≈ exp[−2·(Δ/w_eff)²]; approximate Δ ≈ L·σ_point. Convert to dB: L_point_db = −10·log10(η_point). For small jitter vs beam size, linearize or Monte‑Carlo for a refinement.

Link budget (per node and end‑to‑end)

- Start at P_tx_dbm from TOSA; subtract insertion losses; subtract atmospheric and pointing losses; add geometric coupling (negative dB); compute P_rx_dbm(L). Keep a per‑node running total and store deltas for tooltips.

Bandwidth ↔ sensitivity and BER

- Receiver sensitivity tables per ROSA/TIA/CDR provide P_min_dbm for target BER at given bitrate; optionally scale with noise bandwidth B (first‑order: ΔS ≈ 10·log10(B/B_ref)).
- If FEC selected, apply coding gain to effective sensitivity (minus overhead SNR penalty if modeled).
- BER vs distance: find P_rx_dbm(L), compare to sensitivity curves; optionally interpolate to produce an estimated BER curve (Q‑function mapping) or piecewise: BER≈good when margin>0, else rapidly degrades.

Max distance and margin

- Max distance at target BER: perform a coarse sweep to bracket the last span that meets the target, then binary-search between the last passing and first failing distance until convergence (meter-level). If no sample passes, report 0 km and surface the dominant loss terms.
- Report link margin at selected L: M_db = P_rx_dbm(L) − P_min_dbm.
- “Max Distance Explained” panel mirrors the solver’s inputs: transmit power, total insertion, atmospheric + scintillation + pointing losses, geometric gain, received power, sensitivity, and resulting margin.

Control dynamics (alignment channel)

- Input: platform jitter PSD or RMS, sensor bandwidth/latency, actuator bandwidth/range/resolution.
- Required closed‑loop BW: f_cl ≳ κ·f_vibe_max (κ≈3). Check FSM/gimbal pair: f_fsm for high‑freq jitter, gimbal for low‑freq drift.
- Residual pointing σ_res from loop gain/phase (first‑order approx): σ_res² ≈ σ_in²·(1 − |L(j2πf)|²/(1+|L(j2πf)|)²) integrated over frequency; v1 simplifies via band‑split: low‑freq handled by gimbal, high‑freq by FSM.
- Output: min bandwidths, resolution requirement (≤ 0.2·w(L)/L for <1 dB loss), range margin.

Alignment channel strategies

1) Dual‑λ (recommended baseline)

- Components: dichroic splitter/combiner, alignment laser/TOSA at λ₂, quad detector + TIA/ADC.
- Pros: isolation from data path; tunable gain/bandwidth; robust to data format.
- Cons: added optics and BOM.

2) Pilot subcarriers (single‑λ with optical tap)

- Components: tap splitter, narrowband PD/LNA/demod; notched before data chain if shared.
- Pros: single laser wavelength.
- Cons: coupling into LA/CTLE/CDR; must be isolated and validated; fragile across platforms.

3) Retroreflector beacon (corner cube on the far end)

- TX sends probe; RX returns a co‑axial beacon. Local sensor measures return for alignment.
- Pros: cooperative alignment without dedicated λ₂ transmitter at far end.
- Cons: return loss high; requires time‑division or separate optics; sensitive to range.

4) Imaging‑based centroid (camera/FPA)

- Low‑rate NIR camera observes spot on a screen or semi‑transparent sensor; compute centroid.
- Pros: rich diagnostics; robust to speckle.
- Cons: latency and power; needs optics; slower control loop.

Compatibility logic (examples)

- Bitrate: every element in the data path must support `global.bitrate_gbps` (laser driver, TOSA modulation bandwidth, ROSA/TIA/LA/CDR bandwidth/jitter tolerance). Incompatibilities block the configuration and highlight the limiting part.
- Wavelength: dichroics/filters must match λ; ROSA responsivity deduced from λ.
- Power/OMA: driver + TOSA must deliver required OMA for BER at bitrate; flags if insufficient.
- Optical path: beam expander + collimator combine into final divergence; ensure receiver FoV and actuator range cover required pointing.

Weather presets (initial)

- Clear: α=0.2 dB/km, Cn²=1e−15–1e−14
- Haze: α=2 dB/km, Cn²≈3e−14
- Light fog: α=10 dB/km, Cn²≈1e−13
- Heavy fog: α=100 dB/km, Cn² high (link often infeasible)

KPIs reported

- Cost (USD), weight (g), energy (W)
- Max distance at target BER
- Link margin at selected distance
- P_rx vs distance curve; BER vs distance curve
- Required pointing accuracy (mrad/µrad), actuator bandwidth/resolution/range
- Tolerance budgets (loss contributions: atmosphere, pointing, optics IL)
- Eye safety class (future): based on power/aperture per IEC 60825

Simplifications (v1) and planned fidelity upgrades

- Gaussian beam and circular apertures; upgrade: full Gaussian overlap integral and truncation losses.
- Log‑normal scintillation via Rytov variance; upgrade: aperture averaging, strong turbulence models, Monte‑Carlo.
- Pointing jitter as RMS Gaussian; upgrade: PSD‑based integration with actuator closed‑loop transfer functions.
- Receiver sensitivity via tables; upgrade: noise‑equation based (shot/thermal) with ROSA/TIA parameters and OMA.
- BER mapping via sensitivity + margin; upgrade: modulation‑specific BER curves, FEC waterfall, temporal fade statistics.
- Optics IL constants; upgrade: wavelength‑dependent IL, temperature effects.

External hardware integration (pathway)

- Define a `control-api` (JSON over serial/WebUSB/WebSocket) for actuators/sensors: setpoint, mode, status, telemetry streaming.
- Provide a shim in `app.js` to connect to devices and mirror the simulator’s alignment loop output.

Roadmap (see TODOs; highlights)

1) Define schemas and seed database.
2) Scaffold static site and core state model.
3) Implement evaluator: link budget → P_rx(L) → BER(L) → max distance.
4) Add turbulence/pointing models and alignment strategies.
5) Build visualization (beam envelope, scale, node tooltips) and metrics panel with plots.
6) Enforce compatibility rules and explain blockers.
7) Import/export with schema versioning; session persistence; migrations.
8) Populate database from real datasheets.
9) Plan and prototype external hardware I/O for gimbals/FSMs.


