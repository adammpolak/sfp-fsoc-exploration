(function(global){
  'use strict';

  // Estimate control requirements from pointing jitter and beam geometry
  // Inputs: distance L, beam radius w(L), desired pointing loss budget (dB)
  // Outputs: required RMS pointing (mrad), actuator bandwidth targets, resolution, range margin
  function estimateControlRequirements(L_m, beamRadius_m, jitterRms_mrad, lossBudget_db){
    const targetLossDb = (typeof lossBudget_db === 'number') ? lossBudget_db : 1.0;
    // From loss ≈ 10*log10(exp(-2*(Δ/w)^2)); invert at Δ ≈ L * sigma
    const w = Math.max(beamRadius_m, 1e-6);
    const lossLin = Math.pow(10, -targetLossDb/10);
    const term = -Math.log(Math.max(lossLin, 1e-6))/2.0;
    const maxDelta = Math.sqrt(term) * w; // meters at range plane
    const requiredSigma_mrad = (maxDelta / Math.max(L_m, 1e-6)) * 1000.0; // mrad

    // Bandwidth guidance: f_fsm ≳ 3× dominant jitter freq; without PSD, assume heuristic
    const f_fsm_hz = 1000; // placeholder target
    const f_gimbal_hz = 50; // low-frequency drift

    // Resolution: keep ≤ 0.2 of required sigma to avoid quantization loss
    const resolution_urad = Math.max(1, (requiredSigma_mrad * 1000) * 0.2);
    const range_mrad = Math.max(2, jitterRms_mrad * 5);

    return {
      required_sigma_mrad: requiredSigma_mrad,
      fsm_bw_hz: f_fsm_hz,
      gimbal_bw_hz: f_gimbal_hz,
      resolution_urad,
      range_mrad
    };
  }

  // Greenwood frequency estimate: f_G ≈ 0.43 v / r0 ; r0 ≈ [0.423 k^2 Cn2 L]^{-3/5}
  function estimateGreenwoodFrequencyHz(lambda_nm, L_m, Cn2, wind_mps){
    const lambda_m = lambda_nm * 1e-9;
    const k = 2 * Math.PI / lambda_m;
    const denom = 0.423 * (k*k) * Cn2 * Math.max(L_m, 1e-3);
    const r0 = Math.pow(denom, -3/5);
    const fG = 0.43 * Math.max(wind_mps || 0, 0) / Math.max(r0, 1e-6);
    return fG;
  }

  function estimateActuatorBandwidthTargets(lambda_nm, L_m, Cn2, wind_mps){
    const fG = estimateGreenwoodFrequencyHz(lambda_nm, L_m, Cn2, wind_mps);
    // Gimbal > fG, FSM several × fG for higher-frequency correction
    const gimbal_bw = Math.ceil(fG * 1.5);
    const fsm_bw = Math.ceil(fG * 5);
    return { greenwood_hz: Math.round(fG), gimbal_bw_hz: gimbal_bw, fsm_bw_hz: fsm_bw };
  }

  // Simple two-band jitter PSD integration (mrad^2/Hz) over [0, split] and [split, fmax]
  function estimateResidualPointingFromPsd(psdLow_mrad2_Hz, psdHigh_mrad2_Hz, splitHz, fmaxHz, gimbal_bw_hz, fsm_bw_hz){
    const sLow = Math.max(psdLow_mrad2_Hz || 0, 0);
    const sHigh = Math.max(psdHigh_mrad2_Hz || 0, 0);
    const fSplit = Math.max(splitHz || 1, 1);
    const fMax = Math.max(fmaxHz || 1000, fSplit);
    // Open-loop variances per band (assuming white within bands)
    const varLow = sLow * fSplit;                 // [0..split]
    const varHigh = sHigh * (fMax - fSplit);      // [split..fmax]
    // Closed-loop attenuation: assume 1st-order lowpass/highpass approximations
    const attGimbal = (gimbal_bw_hz && gimbal_bw_hz > 0) ? (fSplit/(fSplit + gimbal_bw_hz)) : 1; // residual of low band
    const attFsm = (fsm_bw_hz && fsm_bw_hz > 0) ? ( (fMax - fSplit)/( (fMax - fSplit) + fsm_bw_hz) ) : 1; // residual of high band
    const resVarLow = varLow * attGimbal;
    const resVarHigh = varHigh * attFsm;
    const resVarTotal = resVarLow + resVarHigh;
    const sigma_mrad = Math.sqrt(Math.max(resVarTotal, 0));
    return { sigma_mrad, resVarLow, resVarHigh };
  }

  global.Calc = global.Calc || {};
  global.Calc.Control = { estimateControlRequirements, estimateGreenwoodFrequencyHz, estimateActuatorBandwidthTargets, estimateResidualPointingFromPsd };
})(window);


