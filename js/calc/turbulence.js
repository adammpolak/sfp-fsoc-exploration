(function(global){
  'use strict';

  // Scintillation margin using Rytov variance (plane wave approximation)
  // sigma_R^2 = 1.23 * Cn2 * k^(7/6) * L^(11/6)
  // Return a conservative dB margin M = Q * sigma_R (Q≈2–3)
  function estimateScintillationMarginDb(lambda_nm, L_m, Cn2, Q){
    const lambda_m = lambda_nm * 1e-9;
    const k = 2 * Math.PI / lambda_m;
    const sigmaR2 = 1.23 * Cn2 * Math.pow(k, 7/6) * Math.pow(L_m, 11/6);
    const sigmaR = Math.sqrt(Math.max(sigmaR2, 0));
    const q = (typeof Q === 'number' && Q > 0) ? Q : 2.0;
    // Convert variance factor to an equivalent power margin (approximate)
    // Use M_db ≈ 4.343 * q * sigmaR (mapping from log-amplitude std to dB)
    const M_db = 4.343 * q * sigmaR;
    return M_db;
  }

  global.Calc = global.Calc || {};
  global.Calc.Turbulence = { estimateScintillationMarginDb };
})(window);


