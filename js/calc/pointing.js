(function(global){
  'use strict';

  function gaussianCaptureFraction(radius_m, lensRadius_m, sigma_m){
    const w = Math.max(radius_m, 1e-9);
    const a = Math.max(lensRadius_m, 0);
    if(a <= 0) return 0;
    const encircled = 1 - Math.exp(-2 * Math.pow(a / w, 2));
    const jitter = Math.max(sigma_m, 0);
    const jitterPenalty = Math.exp(-2 * Math.pow(jitter / w, 2));
    return Math.min(1, Math.max(0, encircled * jitterPenalty));
  }

  function jittersToSigma(delay_m, sigmaPoint_mrad){
    const sigma_rad = Math.max(sigmaPoint_mrad || 0, 0) / 1000;
    return delay_m * sigma_rad;
  }

  function captureForConfig(distance_m, beamRadius_m, lensRadius_m, sigmaPoint_mrad){
    const sigma_m = jittersToSigma(distance_m, sigmaPoint_mrad);
    return gaussianCaptureFraction(beamRadius_m, lensRadius_m, sigma_m);
  }

  function pointingLossDb(distance_m, beamRadius_m, lensRadius_m, sigmaPoint_mrad){
    const frac = captureForConfig(distance_m, beamRadius_m, lensRadius_m, sigmaPoint_mrad);
    return -10 * Math.log10(Math.max(frac, 1e-9));
  }

  global.Calc = global.Calc || {};
  global.Calc.Pointing = {
    captureForConfig,
    pointingLossDb,
    gaussianCaptureFraction
  };
})(window);


