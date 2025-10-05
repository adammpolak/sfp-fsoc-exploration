(function(global){
  'use strict';

  const Q_LIMIT = 14;

  function qFunction(x){
    const z = Math.max(Math.min(x, Q_LIMIT), -Q_LIMIT);
    const c = 1 / Math.sqrt(2 * Math.PI);
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    const approx = c * Math.exp(-0.5 * z * z) * poly;
    return z >= 0 ? approx : 1 - approx;
  }

  function clamp(value, min, max){
    return Math.min(Math.max(value, min), max);
  }

  function toMilliwatts(dbm){
    if(dbm == null) return 0;
    return Math.pow(10, dbm / 10);
  }

  function slopeDbPerDecade(bitrate_gbps){
    const br = Math.max(bitrate_gbps || 0, 0);
    if(br <= 0.1) return 1.2;
    if(br <= 1) return 1.5;
    if(br <= 10) return 2.0;
    return 2.5;
  }

  function berFromMargin(margin_db, bitrate_gbps){
    if(margin_db == null) return null;
    const slope = slopeDbPerDecade(bitrate_gbps);
    const decades = margin_db / Math.max(slope, 0.5);
    return clamp(1e-3 * Math.pow(10, -decades), 1e-15, 1e-1);
  }

  function computeShotNoiseCurrent(responsivity_A_W, receivedPower_mW, bandwidth_Hz){
    const q = 1.602176634e-19;
    const responsivity = Math.max(responsivity_A_W || 0, 0);
    const power_W = Math.max(receivedPower_mW || 0, 0) * 1e-3;
    const dcCurrent = responsivity * power_W;
    return Math.sqrt(2 * q * dcCurrent * Math.max(bandwidth_Hz, 0));
  }

  function computeThermalNoiseCurrent(noise_amps_per_sqrtHz, bandwidth_Hz){
    const spectral = Math.max(noise_amps_per_sqrtHz || 0, 0);
    return spectral * Math.sqrt(Math.max(bandwidth_Hz, 0));
  }

  function responsivityFromRosa(rosa){
    if(!rosa) return null;
    if(typeof rosa.responsivity_a_w === 'number') return rosa.responsivity_a_w;
    if(typeof rosa.responsivity_A_W === 'number') return rosa.responsivity_A_W;
    if(typeof rosa.gain === 'number' && rosa.photodiode && typeof rosa.photodiode.responsivity_a_w === 'number'){
      return rosa.gain * rosa.photodiode.responsivity_a_w;
    }
    return null;
  }

  function maxPhotocurrentFromRosa(rosa){
    if(!rosa) return null;
    if(typeof rosa.max_photocurrent_ma === 'number') return rosa.max_photocurrent_ma * 1e-3;
    if(typeof rosa.max_input_current_ma === 'number') return rosa.max_input_current_ma * 1e-3;
    if(typeof rosa.overload_dbm === 'number'){
      const overload_mW = Math.pow(10, rosa.overload_dbm / 10);
      const resp = responsivityFromRosa(rosa);
      if(resp != null){
        return resp * overload_mW * 1e-3;
      }
    }
    return null;
  }

  function tiaNoiseCurrent(tia, rosa){
    if(tia && typeof tia.input_noise_pa_sqrtHz === 'number'){
      return tia.input_noise_pa_sqrtHz;
    }
    if(rosa && typeof rosa.input_noise_pa_sqrtHz === 'number'){
      return rosa.input_noise_pa_sqrtHz;
    }
    return null;
  }

  function effectiveBandwidth(tia, rosa, bitrate_gbps){
    const bitRate = Math.max(bitrate_gbps || 1, 0.01) * 1e9;
    const bwCandidates = [];
    if(tia){
      if(typeof tia.bandwidth_ghz === 'number') bwCandidates.push(tia.bandwidth_ghz * 1e9);
      if(typeof tia.bandwidth_Hz === 'number') bwCandidates.push(tia.bandwidth_Hz);
    }
    if(rosa){
      if(typeof rosa.bandwidth_ghz === 'number') bwCandidates.push(rosa.bandwidth_ghz * 1e9);
      if(typeof rosa.bandwidth_Hz === 'number') bwCandidates.push(rosa.bandwidth_Hz);
    }
    const minBw = bitRate / 2;
    if(!bwCandidates.length) return minBw;
    return Math.max(minBw, Math.min.apply(null, bwCandidates.filter(Boolean)) || minBw);
  }

  function signalCurrent(responsivity, receivedPower_dbm, tiaGain){
    if(responsivity == null || receivedPower_dbm == null) return null;
    const linearGain = Math.max(tiaGain || 1, 1);
    const power_mW = Math.pow(10, receivedPower_dbm / 10);
    return responsivity * power_mW * 1e-3 * linearGain;
  }

  function tiaGainFromModel(tia){
    if(!tia) return 1;
    if(typeof tia.transimpedance_ohms === 'number') return tia.transimpedance_ohms;
    if(typeof tia.zt_ohms === 'number') return tia.zt_ohms;
    return 1e3;
  }

  function maxTiaVoltage(tia){
    if(!tia) return null;
    if(typeof tia.vmax_out_mv === 'number') return tia.vmax_out_mv * 1e-3;
    if(typeof tia.vmax_in_mv === 'number') return tia.vmax_in_mv * 1e-3;
    return null;
  }

  function tiaIip3(tia){
    if(!tia) return null;
    if(typeof tia.iip3_ma === 'number') return tia.iip3_ma * 1e-3;
    if(typeof tia.iip3_A === 'number') return tia.iip3_A;
    if(typeof tia.oip3_dbm === 'number'){
      const zt = tiaGainFromModel(tia);
      const v_oip3 = Math.sqrt(2 * 50 * Math.pow(10, tia.oip3_dbm/10) * 1e-3);
      return v_oip3 / zt;
    }
    return null;
  }

  function pilotRatio(pilot){
    if(!pilot) return 0;
    if(typeof pilot.pilot_ratio_pct === 'number') return pilot.pilot_ratio_pct / 100;
    if(typeof pilot.pilot_ratio === 'number') return pilot.pilot_ratio;
    return 0;
  }

  function thermalDriftFactor(tia, receivedPower_dbm){
    if(!tia) return 1;
    const coeff = tia.gain_ppm_per_C || tia.gain_ppm_per_c || 0;
    if(coeff === 0) return 1;
    const power_mW = toMilliwatts(receivedPower_dbm);
    const deltaT = 0.05 * power_mW; // simple heuristic 0.05 °C per mW
    return 1 + coeff * 1e-6 * deltaT;
  }

  function snrFromSpecs(params){
    const { receivedPower_dbm, rosa, tia, bitrate_gbps, pilot } = params;
    const responsivity = responsivityFromRosa(rosa);
    const gain = tiaGainFromModel(tia);
    const bandwidth = effectiveBandwidth(tia, rosa, bitrate_gbps);
    const thermalFactor = thermalDriftFactor(tia, receivedPower_dbm);
    const power_mW = (receivedPower_dbm != null) ? Math.pow(10, receivedPower_dbm / 10) : 0;

    const signal = (responsivity != null && receivedPower_dbm != null) ? signalCurrent(responsivity, receivedPower_dbm, gain) : null;
    const shotCurrent = computeShotNoiseCurrent(responsivity, power_mW, bandwidth);
    const thermalSpectral = tiaNoiseCurrent(tia, rosa);
    const thermalCurrent = computeThermalNoiseCurrent(thermalSpectral, bandwidth) * thermalFactor;

    const saturation = maxPhotocurrentFromRosa(rosa);
    let saturationScale = 1;
    let saturationPenalty = 0;
    if(signal != null && saturation != null && saturation > 0){
      const photCurrent = responsivity * power_mW * 1e-3;
      if(photCurrent > saturation){
        saturationScale = saturation / photCurrent;
        saturationPenalty = photCurrent - saturation;
      }
    }

    const vmax = maxTiaVoltage(tia);
    let clipNoise = 0;
    if(vmax != null && signal != null){
      const vSignal = signal / Math.max(1, gain);
      if(vSignal > vmax){
        const excess = vSignal - vmax;
        clipNoise = excess / Math.sqrt(3);
      }
    }

    const iip3 = tiaIip3(tia);
    let imdNoise = 0;
    const pilotFraction = pilotRatio(pilot);
    if(iip3 != null && pilotFraction > 0 && signal != null){
      const photCurrent = responsivity * power_mW * 1e-3;
      const pilotCurrent = photCurrent * pilotFraction;
      const fundamental = photCurrent - pilotCurrent;
      const tone = pilotCurrent * gain;
      const curr = tone / gain;
      const imd3 = (3/4) * Math.pow(curr, 3) / Math.pow(Math.max(iip3, 1e-9), 2);
      imdNoise = Math.abs(imd3) * gain;
    }

    const totalNoise = Math.sqrt(Math.pow((shotCurrent || 0), 2) + Math.pow((thermalCurrent || 0), 2) + Math.pow(clipNoise, 2) + Math.pow(imdNoise, 2));

    const effectiveSignal = signal != null ? signal * saturationScale : null;
    if(effectiveSignal == null || effectiveSignal <= 0){
      return {
        snr_linear: null,
        components: {
          signal,
          effectiveSignal,
          shotCurrent,
          thermalCurrent,
          clipNoise,
          imdNoise,
          saturationScale,
          saturationPenalty,
          bandwidth
        }
      };
    }

    if(totalNoise <= 0){
      return {
        snr_linear: Number.POSITIVE_INFINITY,
        components: {
          signal,
          effectiveSignal,
          shotCurrent,
          thermalCurrent,
          clipNoise,
          imdNoise,
          saturationScale,
          saturationPenalty,
          bandwidth
        }
      };
    }

    const snr = Math.pow(effectiveSignal / totalNoise, 2);
    return {
      snr_linear: snr,
      components: {
        signal,
        effectiveSignal,
        shotCurrent,
        thermalCurrent,
        clipNoise,
        imdNoise,
        saturationScale,
        saturationPenalty,
        bandwidth
      }
    };
  }

  function berFromSnr(snr_linear){
    if(snr_linear == null || snr_linear <= 0) return null;
    const q = Math.sqrt(Math.max(snr_linear, 1e-30));
    return qFunction(q / Math.sqrt(2));
  }

  function applyFecGainFromSnr(ber, coding_gain_db, overhead_pct){
    if(ber == null) return null;
    if(!coding_gain_db || coding_gain_db <= 0) return ber;
    const snr_gain_linear = Math.pow(10, coding_gain_db / 10);
    const snr_eff = snr_gain_linear / (1 + Math.max(overhead_pct || 0, 0) / 100);
    const q = Math.sqrt(Math.max(snr_eff, 1e-30));
    return clamp(qFunction(q / Math.sqrt(2)), 1e-15, 1e-1) * (ber / clamp(qFunction(q / Math.sqrt(2)), 1e-15, 1e-1));
  }

  function resolveMargin(ctx, params){
    if(ctx && ctx.margin_db != null) return ctx.margin_db;
    if(ctx && ctx.sensitivity_dbm != null && params && params.receivedPower_dbm != null){
      return params.receivedPower_dbm - ctx.sensitivity_dbm;
    }
    return null;
  }

  function estimateBer(params, ctx){
    const snr = snrFromSpecs(params);
    let ber = berFromSnr(snr.snr_linear);
    let usedFallback = false;
    if(ber == null){
      const margin = resolveMargin(ctx, params);
      const fallback = berFromMargin(margin, params.bitrate_gbps);
      if(fallback != null){
        ber = fallback;
        usedFallback = true;
      }
    }
    return {
      snr,
      ber,
      usedFallback
    };
  }

  function estimatePostFecBer(params, coding_gain_db, overhead_pct, ctx){
    const raw = estimateBer(params, ctx);
    let post = null;
    if(raw.snr && raw.snr.snr_linear != null && isFinite(raw.snr.snr_linear)){
      const gain = Math.pow(10, Math.max(coding_gain_db || 0, 0) / 10);
      const overheadFactor = 1 + Math.max(overhead_pct || 0, 0) / 100;
      post = berFromSnr(raw.snr.snr_linear * gain / overheadFactor);
    }
    if(post == null && raw.ber != null){
      const margin = resolveMargin(ctx, params);
      if(margin != null){
        const effectiveMargin = margin + Math.max(coding_gain_db || 0, 0);
        post = berFromMargin(effectiveMargin, params.bitrate_gbps);
      } else {
        post = raw.ber;
      }
    }
    return {
      ...raw,
      ber_post: post
    };
  }

  global.Calc = global.Calc || {};
  global.Calc.BER = {
    estimateBer,
    estimatePostFecBer,
    snrFromSpecs,
    berFromSnr,
    qFunction,
    applyFecGainFromSnr,
    berFromMargin,
    slopeDbPerDecade
  };
})(window);


