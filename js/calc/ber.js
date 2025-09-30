(function(global){
  'use strict';

  // Simplified BER mapping from link margin (dB) to BER (unitless)
  // Heuristic: at margin = 0 dB → BER ≈ 1e-3 (pre-FEC threshold);
  // Each "slope" dB improves BER by one decade. slope depends on bitrate.
  function slopeDbPerDecade(bitrate_gbps){
    if(bitrate_gbps <= 0.1) return 1.2;   // faster improvement at low rates
    if(bitrate_gbps <= 1) return 1.5;
    return 2.0;                            // slower improvement at higher rates
  }

  function estimatePreFecBer(margin_db, bitrate_gbps){
    const s = slopeDbPerDecade(bitrate_gbps);
    const decades = (margin_db || 0) / Math.max(s, 0.5);
    const ber = 1e-3 * Math.pow(10, -decades);
    return clampBer(ber);
  }

  function applyFecGain(preFecBer, coding_gain_db, bitrate_gbps){
    if(!coding_gain_db || coding_gain_db <= 0) return preFecBer;
    const s = slopeDbPerDecade(bitrate_gbps);
    const extra_decades = coding_gain_db / Math.max(s, 0.5);
    const post = preFecBer * Math.pow(10, -extra_decades);
    return clampBer(post);
  }

  function clampBer(x){
    return Math.min(Math.max(x, 1e-15), 1e-1);
  }

  global.Calc = global.Calc || {};
  global.Calc.BER = { estimatePreFecBer, applyFecGain };
})(window);


