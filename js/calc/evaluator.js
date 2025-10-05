(function(global){
  'use strict';

  // Helper: dB <-> linear
  function dbToLin(db){ return Math.pow(10, db/10); }
  function linToDb(l){ return 10 * Math.log10(Math.max(l, 1e-12)); }

  // Compute diffraction-limited divergence given aperture D (m) and wavelength λ (nm)
  function diffractionDivergenceRad(lambda_nm, aperture_mm){
    const lambda_m = lambda_nm * 1e-9;
    const D_m = (aperture_mm || 0) * 1e-3;
    if(D_m <= 0) return null;
    return 1.22 * lambda_m / D_m; // radians (full-angle approx)
  }

  function gaussianBeamParameters(config, dbModels){
    const lambda_nm = config.global.wavelength_nm;
    const lambda_m = lambda_nm * 1e-9;
    let waist_mm = null;
    let m2 = 1.0;

    const tosa = findModel(dbModels, 'tosa');
    if(tosa){
      if(typeof tosa.beam_waist_mm === 'number') waist_mm = tosa.beam_waist_mm;
      if(typeof tosa.m2 === 'number') m2 = Math.max(tosa.m2, 1.0);
    }

    const col = findModel(dbModels, 'collimator');
    const expander = findModel(dbModels, 'beam_expander');
    const txTelescope = findModel(dbModels, 'tx_telescope');

    if(!waist_mm && col && col.aperture_mm){
      const ap_mm = col.aperture_mm;
      const diverg = col.output_divergence_mrad != null ? col.output_divergence_mrad/1000 : diffractionDivergenceRad(lambda_nm, ap_mm);
      if(diverg) waist_mm = Math.max(ap_mm/(2*Math.sqrt(Math.log(2))), 0.5);
    }

    if(expander && typeof expander.output_waist_mm === 'number'){
      waist_mm = expander.output_waist_mm;
    } else if(txTelescope && typeof txTelescope.output_waist_mm === 'number'){
      waist_mm = txTelescope.output_waist_mm;
    }

    if(!waist_mm){
      const defaultDmm = (col && col.aperture_mm) ? col.aperture_mm : 2.0;
      const d_m = defaultDmm * 1e-3;
      const diffTheta = diffractionDivergenceRad(lambda_nm, defaultDmm) || 0.005;
      waist_mm = (Math.max(lambda_m * m2 / (Math.PI * Math.max(diffTheta,1e-6)), d_m/2) * 1e3) || 1.0;
    }

    const waist_m = Math.max(waist_mm, 0.1) * 1e-3;
    const zR = Math.PI * Math.pow(waist_m, 2) / Math.max(lambda_m, 1e-12);
    return { waist_m, waist_mm, lambda_m, m2, zR };
  }

  function beamRadiusGaussian(params, z_m){
    const z = Math.max(z_m, 0);
    const { waist_m, m2, zR } = params;
    const zrEff = zR * m2;
    const term = 1 + Math.pow(z / Math.max(zrEff, 1e-12), 2);
    const w = waist_m * Math.sqrt(term);
    return w;
  }

  function formatDistanceLabel(m){
    if(m >= 1000){
      return (m/1000).toFixed(2) + ' km';
    }
    if(m >= 1){
      return m.toFixed(0) + ' m';
    }
    return (m*100).toFixed(1) + ' cm';
  }

  function beamRadiusSamples(params, maxDistance_m, steps){
    const n = Math.max(steps || 40, 2);
    const out = [];
    for(let i=0;i<n;i++){
      const z = (i/(n-1)) * Math.max(maxDistance_m, 0);
      out.push({ z, w: beamRadiusGaussian(params, z) });
    }
    return out;
  }

  function receiverApertureRadius_m(dbModels){
    const rxArray = findModel(dbModels, 'receiver_array');
    if(rxArray){
      if(rxArray.envelope_diameter_mm){
        return 0.5 * rxArray.envelope_diameter_mm * 1e-3;
      }
      if(rxArray.sub_aperture_mm){
        return 0.5 * rxArray.sub_aperture_mm * 1e-3;
      }
    }
    const rxObj = findModel(dbModels, 'receiver_objective');
    if(rxObj && rxObj.aperture_mm){
      return 0.5 * rxObj.aperture_mm * 1e-3;
    }
    return null;
  }

  function buildBeamProfileInternal(params, L_m, dbModels, config, options){
    const opts = options || {};
    if(!params || !isFinite(L_m) || L_m <= 0){
      return null;
    }

    const width = 380;
    const height = 220;
    const marginX = 28;
    const marginY = 18;
    const midY = height / 2;
    const maxHeightTarget = (height * 0.8) / 2;

    const samples = beamRadiusSamples(params, L_m, 48);
    const lensRadius_m = receiverApertureRadius_m(dbModels);

    const enforceHeight = !!opts.enforceHeight;

    let windowEnd_m = Math.min(Math.max(opts.windowEnd_m || L_m, 1e-6), L_m);
    let windowStart_m = opts.windowStart_m != null
      ? Math.max(0, Math.min(opts.windowStart_m, windowEnd_m - 1e-6))
      : Math.max(windowEnd_m - L_m * 0.1, 0);

    let span_m = Math.max(windowEnd_m - windowStart_m, 1);
    const spanPixels = Math.max(width - 2 * marginX, 1);
    const spanScaleBaseline = spanPixels / span_m;
    const targetRadius = beamRadiusGaussian(params, windowEnd_m);
    const maxRadiusAtLens = Math.max(targetRadius, lensRadius_m || 0);
    const heightScale = maxRadiusAtLens > 0 ? maxHeightTarget / maxRadiusAtLens : Number.POSITIVE_INFINITY;

    let scale = spanScaleBaseline;
    if(enforceHeight && Number.isFinite(heightScale)){
      scale = Math.max(heightScale, 1e-9);
    } else if(heightScale < spanScaleBaseline && Number.isFinite(heightScale)){
      scale = Math.max(heightScale, 1e-9);
    }

    if(scale !== spanScaleBaseline){
      span_m = spanPixels / Math.max(scale, 1e-9);
      windowStart_m = Math.max(windowEnd_m - span_m, 0);
    }

    if(!Number.isFinite(scale) || scale <= 0){
      scale = spanScaleBaseline;
    }

    const zoomFactor = Math.abs(scale - spanScaleBaseline) > 1e-6
      ? Math.max(scale, spanScaleBaseline) / Math.min(scale, spanScaleBaseline)
      : 1;

    const windowSamples = samples.filter(s => s.z >= windowStart_m && s.z <= windowEnd_m);
    if(windowSamples.length === 0){
      windowSamples.push(samples[samples.length - 1]);
    }

    const topPath = [];
    const bottomPath = [];

    windowSamples.forEach((s, idx) => {
      const localZ = s.z - windowStart_m;
      const x = marginX + localZ * scale;
      const yTop = midY - s.w * scale;
      const yBottom = midY + s.w * scale;
      if(idx === 0){
        topPath.push(`M ${x.toFixed(2)} ${yTop.toFixed(2)}`);
      } else {
        topPath.push(`L ${x.toFixed(2)} ${yTop.toFixed(2)}`);
      }
      bottomPath.unshift(`L ${x.toFixed(2)} ${yBottom.toFixed(2)}`);
    });

    const pathData = topPath.join(' ') + ' ' + bottomPath.join(' ') + ' Z';

    const lensElements = lensRadius_m ? (() => {
      const localEnd = windowEnd_m - windowStart_m;
      const xLens = marginX + localEnd * scale;
      const rLens = Math.max(lensRadius_m * scale, 1);
      return `<g id="lensOverlay"><line x1="${xLens.toFixed(2)}" y1="${(midY - rLens).toFixed(2)}" x2="${xLens.toFixed(2)}" y2="${(midY + rLens).toFixed(2)}" stroke="rgba(13,148,136,0.6)" stroke-width="2" />
        <circle cx="${xLens.toFixed(2)}" cy="${midY.toFixed(2)}" r="${rLens.toFixed(2)}" fill="rgba(13,148,136,0.12)" stroke="rgba(13,148,136,0.6)" stroke-width="2" />
        <text x="${(xLens + 6).toFixed(2)}" y="${(midY - rLens - 8).toFixed(2)}" font-size="11" fill="#0f766e">Lens aperture</text></g>`;
    })() : '';

    const divergence_mrad = ((params.lambda_m * params.m2) / (Math.PI * Math.max(params.waist_m, 1e-9))) * 1e3;

    const svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${width}" height="${height}" fill="rgba(59,130,246,0.05)" />
      <g id="beamEnvelopeGroup">
        <path id="beamEnvelope" d="${pathData}" fill="rgba(59,130,246,0.30)" stroke="rgba(59,130,246,0.7)" stroke-width="2" />
      </g>
      ${lensElements}
      <text x="${marginX}" y="${(height - marginY + 6).toFixed(2)}" font-size="11" fill="#475569">${formatDistanceLabel(windowStart_m)}</text>
      <text x="${(width - marginX)}" y="${(height - marginY + 6).toFixed(2)}" font-size="11" text-anchor="end" fill="#475569">${formatDistanceLabel(windowEnd_m)}</text>
      <text x="${(width - marginX - 4).toFixed(2)}" y="${(marginY + 12).toFixed(2)}" text-anchor="end" font-size="11" fill="#1e293b">Divergence ≈ ${divergence_mrad.toFixed(2)} mrad</text>
      <text x="${(width/2).toFixed(2)}" y="${(height - marginY + 20).toFixed(2)}" text-anchor="middle" font-size="10" fill="#64748b">Beam width shown at 1/e² radius${zoomFactor > 1 ? ` (zoom ×${zoomFactor.toFixed(1)})` : ''}</text>
    </svg>`;

    return {
      svg,
      samples,
      windowSamples,
      lens_radius_m: lensRadius_m,
      divergence_mrad,
      zoom_factor: zoomFactor,
      window_start_m: windowStart_m,
      window_end_m: windowEnd_m,
      total_distance_m: L_m,
      geometry: {
        width,
        height,
        marginX,
        marginY,
        midY,
        scale_px_per_m: scale,
        windowStart_m,
        windowEnd_m,
        span_m,
        beam_radius_at_end_m: targetRadius,
        lens_radius_at_end_m: lensRadius_m || 0
      }
    };
  }

  function buildBeamProfile(params, L_m, dbModels, config, options){
    return buildBeamProfileInternal(params, L_m, dbModels, config, options);
  }

  global.Calc = global.Calc || {};
  global.Calc.Evaluator = global.Calc.Evaluator || {};
  global.Calc.Evaluator.buildBeamProfileHelper = buildBeamProfile;

  function computeBeamRadiusAtDistance(config, dbModels){
    // Rough beam radius model: start with divergence from optics (collimator/expander),
    // else fallback to diffraction from last transmitter aperture.
    const L_m = config.global.distance_m;
    const lambda_nm = config.global.wavelength_nm;

    const params = gaussianBeamParameters(config, dbModels);
    let divergence_rad = null;

    const exp = findModel(dbModels, 'beam_expander');
    if(exp){
      if(typeof exp.residual_divergence_mrad === 'number'){
        divergence_rad = exp.residual_divergence_mrad / 1000.0;
      } else if(typeof exp.output_divergence_mrad === 'number'){
        divergence_rad = exp.output_divergence_mrad / 1000.0;
      }
    }
    const txTel = findModel(dbModels, 'tx_telescope');
    if(!divergence_rad && txTel){
      if(typeof txTel.residual_divergence_mrad === 'number'){
        divergence_rad = txTel.residual_divergence_mrad / 1000.0;
      }
    }
    const col = findModel(dbModels, 'collimator');
    if(!divergence_rad && col){
      if(typeof col.residual_divergence_mrad === 'number'){
        divergence_rad = col.residual_divergence_mrad / 1000.0;
      } else if(typeof col.output_divergence_mrad === 'number'){
        divergence_rad = col.output_divergence_mrad / 1000.0;
      }
    }

    const w_m = beamRadiusGaussian(params, L_m);
    const divergenceFar = divergence_rad || (params.waist_m > 0 ? (lambda_nm * 1e-9 * params.m2) / (Math.PI * params.waist_m) : 0.005);

    const profile = buildBeamProfile(params, L_m, dbModels, config, { windowStart_m: Math.max(L_m - Math.max(L_m*0.1, 10), 0) });
    const zoomProfile = buildBeamProfile(params, L_m, dbModels, config, {
      windowEnd_m: L_m,
      windowStart_m: Math.max(L_m - Math.max(L_m * 0.08, 2), 0),
      enforceHeight: true
    });

    return { divergence_rad: divergenceFar, w_m, waist_m: params.waist_m, zR_m: params.zR, beam_params: params, profile, zoom_profile: zoomProfile };
  }

  function atmosphericLossDb(alpha_db_per_km, L_m){
    const L_km = L_m / 1000.0;
    return alpha_db_per_km * L_km;
  }

  function insertionStageDetails(dbModels){
    let total = 0;
    const stages = [];
    const addStage = (type, model, loss_db, label) => {
      const val = typeof loss_db === 'number' ? Number(loss_db) : null;
      if(val && val > 0){
        total += val;
        stages.push({ type, model, label: label || (model && model.id) || type, delta_db: -val });
      }
    };
    const col = findModel(dbModels, 'collimator');
    addStage('collimator', col, col && col.insertion_loss_db);
    const iso = findModel(dbModels, 'optical_isolator');
    addStage('optical_isolator', iso, iso && iso.il_db);
    const exp = findModel(dbModels, 'beam_expander');
    addStage('beam_expander', exp, exp && exp.insertion_loss_db);
    const tel = findModel(dbModels, 'tx_telescope');
    if(tel && typeof tel.throughput === 'number'){
      const il = -linToDb(Math.max(Math.min(tel.throughput,1), 1e-6));
      addStage('tx_telescope', tel, il, 'TX telescope');
    }
    const voa = findModel(dbModels, 'voa');
    addStage('voa', voa, voa && voa.il_db, 'VOA');
    const dich = findModel(dbModels, 'filter_dichroic');
    if(dich){
      const il = Math.max(dich.il_pass_db || 0, dich.il_reflect_db || 0);
      addStage('filter_dichroic', dich, il, 'Dichroic filter');
    }
    const tap = findModel(dbModels, 'tap_splitter');
    addStage('tap_splitter', tap, tap && (tap.il_db || 0), 'Tap splitter');
    const shutter = findModel(dbModels, 'safety_shutter');
    addStage('safety_shutter', shutter, shutter && shutter.attenuation_closed_db, 'Safety shutter');
    const window = findModel(dbModels, 'window');
    if(window){
      const il = (window.ar_db || 0) + (window.contamination_penalty_db || 0);
      addStage('window', window, il, 'Window');
    }
    const fieldStop = findModel(dbModels, 'field_stop');
    if(fieldStop){
      const il = fieldStop.il_db || 0;
      addStage('field_stop', fieldStop, il, 'Field stop');
    }
    const od = findModel(dbModels, 'od_filter');
    addStage('od_filter', od, od && od.il_db, 'OD filter');
    const filt = findModel(dbModels, 'interference_filter');
    addStage('interference_filter', filt, filt && (filt.il_db || 0), 'Interference filter');
    const stack = findModel(dbModels, 'lens_stack');
    if(stack && typeof stack.transmission === 'number'){
      const il = -linToDb(Math.max(Math.min(stack.transmission,1), 1e-6));
      addStage('lens_stack', stack, il, 'Lens stack');
    }
    const rxArr = findModel(dbModels, 'receiver_array');
    const comb = findModel(dbModels, 'combiner');
    if(rxArr){
      let combIl = Math.max(rxArr.combiner_il_db || 0, 0);
      if(comb && (comb.base_il_db != null) && (comb.per_stage_il_db != null)){
        const stages = Math.ceil(Math.log2(Math.max(rxArr.count||1,1)));
        combIl = comb.base_il_db + comb.per_stage_il_db * stages;
      }
      addStage('combiner', comb || rxArr, combIl, 'Combiner');
    }
    return { total, stages };
  }

  function findModel(db, type){
    const cat = db.categories.find(c => c.type === type);
    return cat && cat.models && cat.models[0];
  }

  function estimateSensitivityDbm(dbModels, bitrate_gbps){
    // Use ROSA sensitivity table; fallback to simple scaling
    const rosa = findModel(dbModels, 'rosa');
    if(rosa && rosa.sensitivity_dbm){
      const key = String(bitrate_gbps);
      if(rosa.sensitivity_dbm[key] != null) return rosa.sensitivity_dbm[key];
    }
    // Fallback heuristic
    if(bitrate_gbps <= 0.1) return -28;
    if(bitrate_gbps <= 1) return -20;
    return -18;
  }

  function evaluate(db, config){
    const dbModels = db;
    const lambda = config.global.wavelength_nm;
    const L = config.global.distance_m;
    const bitrate = config.global.bitrate_gbps;

    const tosa = findModel(dbModels, 'tosa');
    const ptx_dbm = tosa && typeof tosa.optical_power_dbm === 'number' ? tosa.optical_power_dbm : 0;

    const insertion = insertionStageDetails(dbModels);
    const il_db = insertion.total;

    const beam = computeBeamRadiusAtDistance(config, dbModels);

    const rxObj = findModel(dbModels, 'receiver_objective');
    const rxArr = findModel(dbModels, 'receiver_array');
    const lensRadius = receiverApertureRadius_m(dbModels);
    const jitter_mrad = config.channel.pointing_jitter_mrad_rms || 0;
    const captureFrac = (global.Calc && global.Calc.Pointing) ? global.Calc.Pointing.captureForConfig(L, beam.w_m, lensRadius || beam.w_m, jitter_mrad) : 1;

    let eta_geo = 0;
    if(rxArr){
      const aSub_m = (rxArr.sub_aperture_mm || 100) * 1e-3 / 2;
      const gridRows = Math.max(rxArr.grid_rows || 1, 1);
      const gridCols = Math.max(rxArr.grid_cols || 1, 1);
      const pitch_m = Math.max((rxArr.pitch_mm || (2*aSub_m*1e3)) * 1e-3, 1e-6);
      const Lm = config.global.distance_m;
      const offset_rad = Math.max(rxArr.offset_mrad || 0, 0) / 1000.0;
      const extra = Math.max(rxArr.aoa_extra_mrad || 0, 0) / 1000.0;
      const theta_a = Math.max((config.channel.pointing_jitter_mrad_rms || 0)/1000.0, 0) + extra;
      const k = (typeof rxArr.aoa_k === 'number') ? rxArr.aoa_k : 1.0;
      const eta_aoa = Math.pow(Math.cos(theta_a), Math.max(k,0));
      const tilt_std = Math.max(rxArr.tilt_std_mrad || 0, 0) / 1000.0;
      const flatness = Math.max(rxArr.flatness_um_rms || 0, 0) * 1e-6;
      const mech_penalty = Math.max(0.7, 1.0 - 0.5 * (tilt_std / 0.01) - 0.1 * (flatness / 1e-4));
      const w = Math.max(beam.w_m, 1e-9);
      const beamDx = Lm * offset_rad;
      const beamDy = 0;
      let fracSum = 0;
      const rowsHalf = (gridRows - 1)/2;
      const colsHalf = (gridCols - 1)/2;
      for(let r=0;r<gridRows;r++){
        for(let c=0;c<gridCols;c++){
          const x = (c - colsHalf) * pitch_m;
          const y = (r - rowsHalf) * pitch_m;
          const dx = x - beamDx;
          const dy = y - beamDy;
          const d2 = dx*dx + dy*dy;
          const encircled = 1 - Math.exp(-2 * Math.pow(aSub_m / w, 2));
          const shiftPenalty = Math.exp(-2 * d2 / (w*w));
          fracSum += encircled * shiftPenalty;
        }
      }
      fracSum *= Math.max(Math.min(rxArr.fill_factor || 1,1),0) * Math.max(Math.min(rxArr.sampling_factor || 1,1),0);
      fracSum = Math.min(fracSum, 1.0);
      const ellipsePenalty = (1/Math.max(Math.cos(theta_a), 0.5));
      const effectiveFrac = fracSum / ellipsePenalty;
      const eff_1550 = (typeof rxArr.efficiency_1550 === 'number') ? rxArr.efficiency_1550 : rxArr.efficiency;
      const eff_1310 = (typeof rxArr.efficiency_1310 === 'number') ? rxArr.efficiency_1310 : rxArr.efficiency;
      const eff = (config.global.wavelength_nm && Math.abs(config.global.wavelength_nm - 1310) < 50) ? eff_1310 : eff_1550;
      eta_geo = Math.min(1.0, effectiveFrac) * Math.max(Math.min(eff || 1,1),0) * eta_aoa * mech_penalty;
    } else {
      const aperture_mm = (rxObj && rxObj.aperture_mm) ? rxObj.aperture_mm : 100;
      const a_m = aperture_mm * 1e-3 / 2;
      const w = Math.max(beam.w_m, 1e-9);
      const eta_circ = 1 - Math.exp(-2 * Math.pow(a_m / w, 2));
      eta_geo = Math.max(Math.min((rxObj && rxObj.efficiency) || 1,1),0) * Math.min(1.0, eta_circ);
      if(rxObj && typeof rxObj.obscuration_ratio === 'number' && rxObj.obscuration_ratio > 0){
        const obsc = Math.min(Math.max(rxObj.obscuration_ratio, 0), 0.9);
        const inner = eta_circ * Math.pow(obsc, 2);
        eta_geo = Math.max(eta_geo - inner, 0);
      }
    }
    eta_geo = Math.min(Math.max(eta_geo * captureFrac, 0), 1);
    const geo_db = linToDb(eta_geo);

    const atm_db = atmosphericLossDb(config.channel.atmospheric_alpha_db_per_km, L);

    const point_db = (global.Calc && global.Calc.Pointing && lensRadius)
      ? global.Calc.Pointing.pointingLossDb(L, beam.w_m, lensRadius, jitter_mrad)
      : (global.Calc && global.Calc.Pointing) ? global.Calc.Pointing.pointingLossDb(L, beam.w_m, beam.w_m, jitter_mrad)
      : 0;

    const scin_db = (global.Calc && global.Calc.Turbulence) ? global.Calc.Turbulence.estimateScintillationMarginDb(lambda, L, config.channel.Cn2, 2.0, lensRadius ? lensRadius * 2 * 1e3 : null) : 0;

    const prx_dbm = ptx_dbm - il_db - atm_db - scin_db - point_db + geo_db;

    const sens_dbm = estimateSensitivityDbm(dbModels, bitrate);
    const margin_db = prx_dbm - sens_dbm;

    const stages = [];
    let currentPower = ptx_dbm;
    const pushStage = (type, label, deltaDb, model) => {
      const entry = {
        type,
        label,
        delta_db: deltaDb,
        p_in_dbm: currentPower,
        p_out_dbm: currentPower + deltaDb,
        model: model || null
      };
      stages.push(entry);
      currentPower = entry.p_out_dbm;
    };
    pushStage('tosa_output', 'TOSA output', 0, tosa);
    insertion.stages.forEach(stage => {
      pushStage(stage.type, stage.label, stage.delta_db, stage.model || findModel(dbModels, stage.type));
    });
    pushStage('atmosphere', 'Atmospheric loss', -atm_db);
    pushStage('scintillation', 'Scintillation margin', -scin_db);
    pushStage('pointing', 'Pointing loss', -point_db);
    const geomLabel = (rxArr ? 'Capture (array)' : 'Capture (aperture)');
    pushStage('geometry', geomLabel, geo_db, rxArr || rxObj);
    const prStage = { type: 'receiver_input', label: 'Photodiode input', delta_db: 0, p_in_dbm: currentPower, p_out_dbm: currentPower, model: findModel(dbModels, 'photodiode') || findModel(dbModels, 'rosa') };
    stages.push(prStage);
    stages.push({ type: 'receiver_sensitivity', label: 'Receiver sensitivity', delta_db: 0, p_in_dbm: currentPower, p_out_dbm: currentPower, model: findModel(dbModels, 'rosa'), sens_dbm, margin_db });

    return {
      ptx_dbm,
      il_db,
      atm_db,
      scin_db,
      point_db,
      geo_db,
      prx_dbm,
      sens_dbm,
      margin_db,
      eta_geo,
      beam_radius_m: beam.w_m,
      beam_divergence_rad: beam.divergence_rad,
      beam_profile: beam.profile,
      beam_profile_zoom: beam.zoom_profile,
      beam_params: beam.beam_params,
      stages,
      misc: {
        eta_geo,
        capture_frac: captureFrac,
        atm_db,
        scin_db,
        point_db,
        geo_db,
        insertion_db: il_db,
        aperture_radius_m: receiverApertureRadius_m(dbModels),
        waist_m: beam.waist_m,
        zR_m: beam.zR_m
      }
    };
  }

  // Simple sweep for P_rx vs distance (m) and derived BER threshold
  function sweepPrx(db, config, distances_m){
    const out = [];
    for(const L of distances_m){
      const cfg = JSON.parse(JSON.stringify(config));
      cfg.global.distance_m = L;
      const r = evaluate(db, cfg);
      out.push({ L, prx_dbm: r.prx_dbm, margin_db: r.margin_db });
    }
    return out;
  }

  function buildStageBreakdown(db, config){
    const res = evaluate(db, config);
    return {
      stages: res.stages,
      ptx_dbm: res.ptx_dbm,
      prx_dbm: res.prx_dbm,
      sens_dbm: res.sens_dbm,
      margin_db: res.margin_db
    };
  }

  global.Calc = global.Calc || {};
  global.Calc.Evaluator = { evaluate, sweepPrx, buildStageBreakdown };
})(window);


