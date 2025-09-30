FSOC Simulator Simplifications and Planned Upgrades

Scope of current models (v0.1)

- Beam model: Far-field Gaussian with linear growth w(R) ≈ θ·R. Planned: near-field/Rayleigh range, M², beam shaping.
- Geometric capture: Envelope/area ratio with AoA ellipse factor and array-level penalties. Planned: per-element Gaussian–aperture integral.
- Atmosphere: Scalar dB/km preset; Rytov-based scintillation margin. Planned: Kim/Kruse visibility mapping UI, aperture averaging.
- Pointing: RMS jitter + mispointing loss; PSD split model for gimbal/FSM. Planned: full PSD integration, closed-loop transfer functions, delays.
- Receiver sensitivity: Table/heuristic per bitrate. Planned: noise-equation driven (shot/thermal/amp), OMA and ER per chain.
- Alignment: Dual-λ and pilot gating; simple broadband checks. Planned: explicit alignment path efficiency and SNR models.
- Optics IL: Aggregated IL with combiner stages for arrays. Planned: wavelength/temperature dependent IL by part.

Planned fidelity upgrades

- Per-element overlap: Compute ∫aperture I0·exp(−2 r²/w²) dA for each sub-aperture with grid geometry, offset and tilt.
- Control loops: Greenwood fG + actuator BW targets integrated with PSD to compute residual σ_point; include latency margins.
- Noise and BER: Use PD responsivity, TIA noise density, bandwidth to compute Q/BER; support PAM4.
- Multi-wavelength optics: Track per-λ throughput for filters/lenses/arrays; warn and apply penalties when misaligned.
- Environmental: Background irradiance model + narrowband filter benefits; sun angle/glint penalties.

Assumptions and notes

- Gaussian beam and circular apertures assumed for capture; arrays approximate packing with fill_factor and sampling_factor.
- PSD model uses two-band white PSDs as a placeholder; closed-loop attenuation uses simple 1st-order forms.
- Combiner loss scales with log₂(N) stages; real trees may differ; fiber mismatch in combiners not modeled yet.


