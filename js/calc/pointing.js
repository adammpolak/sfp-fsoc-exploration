(function(global){
  'use strict';

  // Mispointing loss for Gaussian beam captured by circular aperture
  // Approximate with exp(-2*(delta/w)^2), delta ≈ L * sigma_point (radians)
  function mispointingLossDb(L_m, sigmaPoint_mrad, beamRadiusAtL_m){
    const sigma_rad = (sigmaPoint_mrad / 1000.0);
    const delta = L_m * sigma_rad;
    const w = Math.max(beamRadiusAtL_m, 1e-9);
    const eta = Math.exp(-2.0 * Math.pow(delta / w, 2));
    const loss_db = -10.0 * Math.log10(Math.max(eta, 1e-9));
    return loss_db;
  }

  global.Calc = global.Calc || {};
  global.Calc.Pointing = { mispointingLossDb };
})(window);


