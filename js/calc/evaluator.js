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

  function computeBeamRadiusAtDistance(config, dbModels){
    // Rough beam radius model: start with divergence from optics (collimator/expander),
    // else fallback to diffraction from last transmitter aperture.
    const L_m = config.global.distance_m;
    const lambda_nm = config.global.wavelength_nm;

    const col = findModel(dbModels, 'collimator');
    const exp = findModel(dbModels, 'beam_expander');
    const stack = findModel(dbModels, 'lens_stack');
    let divergence_rad = null;
    if(exp && typeof exp.residual_divergence_mrad === 'number'){
      divergence_rad = (exp.residual_divergence_mrad / 1000.0);
    } else if(col && typeof col.output_divergence_mrad === 'number'){
      divergence_rad = (col.output_divergence_mrad / 1000.0);
    } else {
      // diffraction from TOSA exit aperture (assume ~2 mm if unknown)
      let Dmm = (col && col.aperture_mm) ? col.aperture_mm : 2.0;
      if(stack && stack.aperture_mm){
        Dmm = Math.max(Dmm, stack.aperture_mm);
      }
      divergence_rad = diffractionDivergenceRad(lambda_nm, Dmm) || (0.005);
    }
    const w = L_m * Math.max(divergence_rad, 1e-6); // beam radius at L
    return { divergence_rad, w_m: w };
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
    // Map: in v1, simply take the first model in each category as selected
    const dbModels = db;
    const lambda = config.global.wavelength_nm;
    const L = config.global.distance_m;
    const bitrate = config.global.bitrate_gbps;

    // Transmit power from TOSA
    const tosa = findModel(dbModels, 'tosa');
    const ptx_dbm = tosa && typeof tosa.optical_power_dbm === 'number' ? tosa.optical_power_dbm : 0;

    // Optics IL
    const insertion = insertionStageDetails(dbModels);
    const il_db = insertion.total;

    // Beam radius/divergence
    const beam = computeBeamRadiusAtDistance(config, dbModels);

    // Geometric coupling: single aperture or array capture
    const rxObj = findModel(dbModels, 'receiver_objective');
    const rxArr = findModel(dbModels, 'receiver_array');
    let eta_geo = 0;
    if(rxArr){
      // Per-subaperture Gaussian overlap approximation and penalties
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
      // Beam center offset at array plane
      const beamDx = Lm * offset_rad;
      const beamDy = 0; // assume lateral offset in one axis for v1
      // Gaussian intensity normalization for 2D: I(r) = (2/(π w^2)) e^{-2 r^2 / w^2}
      // Small-aperture approximation per element: fraction_i ≈ (2 * a^2 / w^2) * exp(-2 d_i^2 / w^2)
      let fracSum = 0;
      const a2_over_w2 = (aSub_m * aSub_m) * 2 / (w*w);
      const rowsHalf = (gridRows - 1)/2;
      const colsHalf = (gridCols - 1)/2;
      for(let r=0;r<gridRows;r++){
        for(let c=0;c<gridCols;c++){
          const x = (c - colsHalf) * pitch_m;
          const y = (r - rowsHalf) * pitch_m;
          const dx = x - beamDx;
          const dy = y - beamDy;
          const d2 = dx*dx + dy*dy;
          const local = a2_over_w2 * Math.exp(-2 * d2 / (w*w));
          fracSum += local;
        }
      }
      // Apply packing and sampling factors
      fracSum *= Math.max(Math.min(rxArr.fill_factor || 1,1),0) * Math.max(Math.min(rxArr.sampling_factor || 1,1),0);
      // AoA ellipse penalty on effective footprint
      const ellipsePenalty = (1/Math.max(Math.cos(theta_a), 0.5));
      const effectiveFrac = fracSum / ellipsePenalty;
      // Per-wavelength efficiency
      const eff_1550 = (typeof rxArr.efficiency_1550 === 'number') ? rxArr.efficiency_1550 : rxArr.efficiency;
      const eff_1310 = (typeof rxArr.efficiency_1310 === 'number') ? rxArr.efficiency_1310 : rxArr.efficiency;
      const eff = (config.global.wavelength_nm && Math.abs(config.global.wavelength_nm - 1310) < 50) ? eff_1310 : eff_1550;
      eta_geo = Math.min(1.0, effectiveFrac) * Math.max(Math.min(eff || 1,1),0) * eta_aoa * mech_penalty;
    } else {
      const a_m = ((rxObj && rxObj.aperture_mm) ? rxObj.aperture_mm : 100) * 1e-3 / 2;
      eta_geo = Math.min(1.0, Math.pow(a_m / Math.max(beam.w_m, 1e-9), 2)) * Math.max(Math.min((rxObj && rxObj.efficiency) || 1,1),0);
    }
    const geo_db = linToDb(eta_geo);

    // Atmospheric loss
    const atm_db = atmosphericLossDb(config.channel.atmospheric_alpha_db_per_km, L);

    // Scintillation margin (turbulence)
    const scin_db = (global.Calc && global.Calc.Turbulence) ? global.Calc.Turbulence.estimateScintillationMarginDb(lambda, L, config.channel.Cn2, 2.0) : 0;

    // Pointing loss
    const point_db = (global.Calc && global.Calc.Pointing) ? global.Calc.Pointing.mispointingLossDb(L, config.channel.pointing_jitter_mrad_rms, beam.w_m) : 0;

    // Received power
    const prx_dbm = ptx_dbm - il_db - atm_db - scin_db - point_db + geo_db;

    // Sensitivity and margin
    const sens_dbm = estimateSensitivityDbm(dbModels, bitrate);
    const margin_db = prx_dbm - sens_dbm;

    // Build stage breakdown (dBm chain)
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
    // Initial transmitter output reference
    stages.push({ type: 'tosa_output', label: 'TOSA output', delta_db: 0, p_in_dbm: currentPower, p_out_dbm: currentPower, model: tosa });
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
      divergence_mrad: beam.divergence_rad * 1000.0,
      beam_radius_m: beam.w_m,
      atm_db,
      scin_db,
      point_db,
      geo_db,
      prx_dbm,
      sens_dbm,
      margin_db,
      stages
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


