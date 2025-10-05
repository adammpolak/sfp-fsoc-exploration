(function(global){
  'use strict';

  function rytovVariance(lambda_m, L_m, Cn2){
    const k = 2 * Math.PI / Math.max(lambda_m, 1e-12);
    return 1.23 * Cn2 * Math.pow(k, 7/6) * Math.pow(Math.max(L_m, 1e-6), 11/6);
  }

  // Aperture averaging factor (Andrews & Phillips approximation)
  function apertureAveragingFactor(lambda_m, L_m, aperture_m){
    if(!aperture_m || aperture_m <= 0) return 1;
    const rF = Math.sqrt(Math.max(lambda_m, 1e-15) * Math.max(L_m, 1e-6) / (2 * Math.PI));
    if(rF <= 0) return 1;
    const ratio = Math.max(aperture_m / rF, 1e-6);
    const denom = 1 + 1.12 * Math.pow(ratio, 7/6) + 0.7 * Math.pow(ratio, 7/3);
    return 1 / denom;
  }

  function attenuationDbFromVisibility(visibility_km, wavelength_nm){
    if(!visibility_km || visibility_km <= 0) return null;
    const lambda_um = wavelength_nm * 1e-3;
    let q;
    if(visibility_km > 50){
      q = 1.6;
    } else if(visibility_km > 6){
      q = 1.3;
    } else if(visibility_km >= 1){
      q = 0.16 * visibility_km + 0.34;
    } else {
      q = visibility_km - 0.5;
    }
    const alpha = (3.91 / visibility_km) * Math.pow(lambda_um / 0.55, -q);
    return alpha;
  }

  function estimateScintillation(lambda_nm, L_m, Cn2, options){
    const opts = options || {};
    const lambda_m = lambda_nm * 1e-9;
    const sigmaR2 = rytovVariance(lambda_m, L_m, Cn2);
    const sigmaR = Math.sqrt(Math.max(sigmaR2, 0));
    const q = (typeof opts.Q === 'number' && opts.Q > 0) ? opts.Q : 2.0;
    const apertureFactor = apertureAveragingFactor(lambda_m, L_m, opts.aperture_m);
    const sigmaR_eff = sigmaR * apertureFactor;
    const margin_db = 4.343 * q * sigmaR_eff;
    return {
      sigmaR,
      sigmaR_eff,
      aperture_factor: apertureFactor,
      margin_db
    };
  }

  function estimateScintillationMarginDb(lambda_nm, L_m, Cn2, Q, aperture_m){
    const res = estimateScintillation(lambda_nm, L_m, Cn2, { Q, aperture_m });
    return res.margin_db;
  }

  global.Calc = global.Calc || {};
  global.Calc.Turbulence = {
    estimateScintillation,
    estimateScintillationMarginDb,
    attenuationDbFromVisibility,
    apertureAveragingFactor
  };
})(window);


