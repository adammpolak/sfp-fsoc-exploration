(function(){
  'use strict';

  // App state
  const state = {
    db: null,
    config: null,
    selection: {
      // selected model id per category type
    },
    metrics: {},
    beam: {
      profile: null,
      zoomToLens: false,
      jitterActive: false,
      autoAlign: true,
      animation: null,
      svgRefs: null,
      distance_m: null,
      capture: {
        fraction: 1,
        history: []
      }
    },
    ui: {
      channelOffsetPx: 0
    }
  };
  // Canvas interaction state
  state.canvas = { 
    zoom: 1, panX: 0, panY: 0, isPanning: false, lastX: 0, lastY: 0, bound: false,
    expandedGroups: new Set(), // Set of group keys that are expanded
    expandedComponents: new Set(), // Set of component keys that are expanded
    highlightStage: null
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';

  const CATEGORY_TREE = [
    {
      label: 'Transmitter',
      children: [
        {
          label: 'TOSA Assembly',
          children: [
            { type: 'tosa_type', label: 'Laser Architecture' },
            { type: 'tosa', label: 'Optical Engine' },
            { type: 'laser_driver', label: 'Laser Driver' },
            { type: 'apc', label: 'APC Controller' },
            { type: 'bias_dac', label: 'Bias DAC' },
            { type: 'mod_dac', label: 'Modulation DAC' },
            { type: 'tec', label: 'TEC Module' }
          ]
        },
        {
          label: 'Launch Optics',
          children: [
            { type: 'aspheric_collimator', label: 'Aspheric Collimator' },
            { type: 'grin_collimator', label: 'GRIN Collimator' },
            { type: 'tx_telescope', label: 'Transmit Telescope' },
            { type: 'optical_isolator', label: 'Optical Isolator' },
            { type: 'voa', label: 'Variable Attenuator' },
            { type: 'filter_dichroic', label: 'Dichroic Filter' },
            { type: 'lens_stack', label: 'Lens Stack' },
            { type: 'safety_shutter', label: 'Safety Shutter' },
            { type: 'window', label: 'Aperture Window' }
          ]
        },
        {
          label: 'Pointing & Alignment',
          children: [
            { type: 'align_laser', label: 'Alignment Laser' },
            { type: 'pilot_injector', label: 'Pilot Injector' },
            { type: 'pilot_demod', label: 'Pilot Demodulator' },
            { type: 'fsm', label: 'Fast Steering Mirror' },
            { type: 'gimbal', label: 'Gimbal' }
          ]
        }
      ]
    },
    {
      label: 'Free-Space Channel',
      children: [
        { type: 'none', label: 'Propagation Path (auto)', disabled: true }
      ]
    },
    {
      label: 'Receiver',
      children: [
        {
          label: 'Capture Optics',
          children: [
            { type: 'receiver_objective', label: 'Receiver Objective' },
            { type: 'receiver_array', label: 'Receiver Array' },
            { type: 'optomech_mount', label: 'Opto-Mechanical Mount' },
            { type: 'combiner', label: 'Optical Combiner' },
            { type: 'interference_filter', label: 'Interference Filter' },
            { type: 'od_filter', label: 'OD / Solar Filter' },
            { type: 'field_stop', label: 'Field Stop' },
            { type: 'baffle', label: 'Baffle / Hood' },
            { type: 'window', label: 'Aperture Window' }
          ]
        },
        {
          label: 'Detector & Front-End',
          children: [
            { type: 'photodiode', label: 'Photodiode' },
            { type: 'los_detector', label: 'LOS Detector' },
            { type: 'tia_model', label: 'TIA Model' },
            { type: 'tia', label: 'TIA (Discrete)' },
            { type: 'la_model', label: 'Limiting Amplifier' },
            { type: 'la_cdr', label: 'Receiver CDR' },
            { type: 'cdr_model', label: 'Digital CDR' },
            { type: 'array_delay', label: 'Array Delay Line' },
            { type: 'digital_combiner', label: 'Digital Combiner' },
            { type: 'fec', label: 'FEC' }
          ]
        },
        {
          label: 'Alignment Sensors',
          children: [
            { type: 'sensor_quad', label: 'Quad Sensor / Imager' },
            { type: 'tap_splitter', label: 'Tap Splitter' },
            { type: 'corner_cube', label: 'Retroreflector' },
            { type: 'expanded_beam', label: 'Expanded Beam Coupler' }
          ]
        }
      ]
    }
  ];

  const TOOLTIP_DEFAULTS = {
    tosa_type: 'Defines the laser architecture (DFB/EML/VCSEL) and wavelength support.',
    tosa: 'Transmitter optical subassembly providing launch power into the link.',
    laser_driver: 'Electronics that modulate and bias the laser diode.',
    apc: 'Automatic power control loop using monitor photodiode feedback.',
    bias_dac: 'Digital-to-analog converter setting the laser bias point.',
    mod_dac: 'Digital-to-analog converter driving modulation signals.',
    tec: 'Thermo-electric cooler regulating laser temperature.',
    align_laser: 'Secondary laser used for alignment channel.',
    pilot_injector: 'Applies pilot tone for pointing feedback.',
    pilot_demod: 'Demodulates alignment pilot tone.',
    aspheric_collimator: 'Aspheric lens capturing fiber output into free space.',
    grin_collimator: 'GRIN lens for compact beam collimation.',
    tx_telescope: 'Expands beam to reduce divergence before the channel.',
    optical_isolator: 'Protects laser from back reflections.',
    voa: 'Variable optical attenuator for link-power trim.',
    filter_dichroic: 'Splits alignment and data wavelengths.',
    lens_stack: 'Stacked optics to adjust effective aperture.',
    safety_shutter: 'Safety mechanism to block beam during faults.',
    window: 'Environmental window protecting optics.',
    fsm: 'Fast steering mirror handling high-frequency pointing corrections.',
    gimbal: 'Coarse pointing mechanism for large motions.',
    receiver_objective: 'Primary receive optic focusing onto detector plane.',
    receiver_array: 'Array of apertures to capture and combine light.',
    optomech_mount: 'Structure providing alignment adjustments for optics.',
    combiner: 'Optical combiner tree merging array outputs.',
    interference_filter: 'Narrowband filter passing signal wavelength.',
    od_filter: 'Optical density filter reducing background light.',
    field_stop: 'Limits field-of-view to reduce stray light.',
    baffle: 'Mechanical baffle blocking stray light.',
    photodiode: 'Detector converting received photons to current.',
    los_detector: 'Monitors link loss-of-signal condition.',
    tia_model: 'Trans-impedance amplifier model parameters.',
    tia: 'Discrete TIA selection.',
    la_model: 'Limiting amplifier / post amplifier model.',
    la_cdr: 'Clock and data recovery stage.',
    cdr_model: 'Digital CDR implementation characteristics.',
    array_delay: 'Programmable delay line aligning array channels.',
    digital_combiner: 'Combines digitized channels coherently or selectively.',
    fec: 'Forward error correction processing block.',
    sensor_quad: 'Quad-cell or imaging sensor for alignment feedback.',
    tap_splitter: 'Provides power tap for alignment sensing.',
    corner_cube: 'Retroreflector returning alignment beam.',
    expanded_beam: 'Expanded beam connector for rugged coupling.',
    interference_filter: 'Narrowband optical filter.',
    optical_isolator: 'Stops back reflections into TOSA.',
    od_filter: 'Optical density filter attenuating out-of-band light.',
    lens_stack: 'Stacked lens assembly modifying beam profile.',
    interference_filter: 'Narrowband optical filter.',
    optical_isolator: 'Stops back reflections into TOSA.',
    od_filter: 'Optical density filter attenuating out-of-band light.'
  };

  const STAGE_TOOLTIPS = {
    atmosphere: 'Attenuation from atmospheric absorption and scattering.',
    scintillation: 'Scintillation margin applied for turbulence-induced fading.',
    pointing: 'Loss due to residual pointing error.',
    geometry: 'Gain from geometric coupling into the receiver aperture/array.',
    receiver_sensitivity: 'Receiver sensitivity threshold used for BER evaluation.',
    combiner: 'Insertion loss from optical combining of array channels.',
    window: 'Transmission loss through protective windows.',
    lens_stack: 'Transmission impact from stacked lenses.',
    tap_splitter: 'Insertion loss introduced by the tap splitter.',
    optical_isolator: 'Insertion loss through the optical isolator.',
    voa: 'VOA attenuation contribution.',
    tx_telescope: 'Residual loss from the transmit telescope.',
    aspheric_collimator: 'Insertion loss from the aspheric collimator.',
    grin_collimator: 'Insertion loss from the GRIN collimator.',
    fsm: 'Residual pointing penalty handled by the FSM.',
    gimbal: 'Residual pointing penalty handled by the gimbal.',
    receiver_input: 'Optical power at the photodiode input.'
  };

  const COLUMN_LAYOUT = [
    {
      id: 'tx',
      label: 'Transmitter',
      groups: [
        {
          label: 'TOSA Assembly',
          components: [
            { type: 'tosa_type', label: 'Laser Type', stageType: 'tosa_output' },
            { type: 'tosa', label: 'TOSA', stageType: 'tosa_output' },
            { type: 'laser_driver', label: 'Laser Driver' },
            { type: 'apc', label: 'APC Controller' },
            { type: 'bias_dac', label: 'Bias DAC' },
            { type: 'mod_dac', label: 'Modulation DAC' },
            { type: 'tec', label: 'TEC' }
          ]
        },
        {
          label: 'Launch Optics',
          components: [
            { type: 'aspheric_collimator', label: 'Aspheric Collimator', stageType: 'aspheric_collimator' },
            { type: 'grin_collimator', label: 'GRIN Collimator', stageType: 'grin_collimator' },
            { type: 'tx_telescope', label: 'Transmit Telescope', stageType: 'tx_telescope' },
            { type: 'optical_isolator', label: 'Optical Isolator', stageType: 'optical_isolator' },
            { type: 'voa', label: 'VOA', stageType: 'voa' },
            { type: 'filter_dichroic', label: 'Dichroic Filter', stageType: 'filter_dichroic' },
            { type: 'lens_stack', label: 'Lens Stack', stageType: 'lens_stack' },
            { type: 'window', label: 'Launch Window', stageType: 'window' }
          ]
        },
        {
          label: 'Pointing & Alignment',
          components: [
            { type: 'align_laser', label: 'Alignment Laser' },
            { type: 'pilot_injector', label: 'Pilot Injector' },
            { type: 'tap_splitter', label: 'Tap Splitter', stageType: 'tap_splitter' },
            { type: 'sensor_quad', label: 'Alignment Sensor' },
            { type: 'fsm', label: 'FSM', stageType: 'fsm' },
            { type: 'gimbal', label: 'Gimbal', stageType: 'gimbal' }
          ]
        }
      ]
    },
    {
      id: 'channel',
      label: 'Free-Space Channel',
      groups: [
        {
          label: 'Propagation Effects',
          components: [
            { stageType: 'atmosphere', label: 'Atmospheric Loss' },
            { stageType: 'scintillation', label: 'Scintillation Margin' },
            { stageType: 'pointing', label: 'Pointing Loss' },
            { stageType: 'geometry', label: 'Geometric Coupling' }
          ]
        }
      ]
    },
    {
      id: 'rx',
      label: 'Receiver',
      groups: [
        {
          label: 'Receiver Optics',
          components: [
            { type: 'receiver_objective', label: 'Receiver Objective' },
            { type: 'receiver_array', label: 'Receiver Array', hideWhenInactive: true },
            { type: 'optomech_mount', label: 'Opto-Mechanical Mount', dependsOn: 'receiver_array' },
            { type: 'combiner', label: 'Combiner', stageType: 'combiner', dependsOn: 'receiver_array' },
            { type: 'interference_filter', label: 'Interference Filter', stageType: 'interference_filter' },
            { type: 'od_filter', label: 'OD Filter', stageType: 'od_filter' },
            { type: 'field_stop', label: 'Field Stop', stageType: 'field_stop' },
            { type: 'baffle', label: 'Baffle', stageType: 'baffle' },
            { type: 'window', label: 'Receive Window', stageType: 'window' }
          ]
        },
        {
          label: 'Detector & Front-End',
          components: [
            { type: 'photodiode', label: 'Photodiode', stageType: 'receiver_input' },
            { type: 'tia_model', label: 'TIA Model' },
            { type: 'tia', label: 'TIA' },
            { type: 'la_model', label: 'Limiting Amplifier' },
            { type: 'la_cdr', label: 'Receiver CDR' },
            { type: 'cdr_model', label: 'Digital CDR' },
            { type: 'array_delay', label: 'Array Delay' },
            { type: 'digital_combiner', label: 'Digital Combiner' },
            { type: 'fec', label: 'FEC', stageType: 'receiver_sensitivity' }
          ]
        }
      ]
    }
  ];

  // Defaults
  const defaultConfig = {
        schema_version: '0.1',
        global: {
          bitrate_gbps: 1,
          wavelength_nm: 1550,
          target_ber: 1e-12,
          weather: 'clear',
          distance_m: 1000,
          fec_model: 'fec-rs',
      alignment_mode: 'pilot',
      align_wavelength_nm: 1550
        },
        channel: {
          atmospheric_alpha_db_per_km: 0.2,
          Cn2: 1e-14,
          pointing_jitter_mrad_rms: 0.2,
      wind_mps: 5
    }
  };

  function hasActiveArray(model){
    return !!(model && Number(model.count || 0) > 0);
  }

  // Init
  window.addEventListener('load', async () => {
    // Load DB from embedded script to avoid file:// fetch CORS
    const rawDb = window.COMPONENTS_DB ? window.COMPONENTS_DB : { categories: [] };
    state.db = JSON.parse(JSON.stringify(rawDb));
    applyTooltips(state.db);
    // Keep a snapshot of initial DB for revert
    state.initialDb = JSON.parse(JSON.stringify(state.db));
    state.config = loadSession() || defaultConfig;
    bindToolbar();
    initSelectionFromDb();
    renderPartsList();
    renderAll();
    bindPartsSearch();
    bindTabs();
    const zoomToggle = document.getElementById('beamZoomToggle');
    if(zoomToggle){
      zoomToggle.addEventListener('click', () => {
        state.beam.zoomToLens = !state.beam.zoomToLens;
        zoomToggle.classList.toggle('active', state.beam.zoomToLens);
        renderCanvas();
      });
    }
    const jitterToggle = document.getElementById('beamJitterToggle');
    if(jitterToggle){
      jitterToggle.addEventListener('click', () => {
        state.beam.jitterActive = !state.beam.jitterActive;
        jitterToggle.classList.toggle('active', state.beam.jitterActive);
        if(state.beam.jitterActive){
          initBeamJitterAnimation();
        } else {
          stopBeamJitter();
        }
      });
    }
    const autoAlignToggle = document.getElementById('beamAutoAlign');
    if(autoAlignToggle){
      autoAlignToggle.checked = state.beam.autoAlign;
      autoAlignToggle.addEventListener('change', () => {
        state.beam.autoAlign = autoAlignToggle.checked;
        if(!state.beam.autoAlign){
          stopBeamJitter();
          state.beam.jitterActive = false;
          jitterToggle && jitterToggle.classList.remove('active');
        } else if(state.beam.jitterActive){
          initBeamJitterAnimation();
        }
      });
    }
  });

  function initSelectionFromDb(){
    // Initialize selection to first model in each category if not present
    for(const cat of state.db.categories){
      if(!state.selection[cat.type] && cat.models && cat.models.length){
        state.selection[cat.type] = cat.models[0].id;
      }
    }
  }

  function renderStageBreakdown(){
    const el = document.getElementById('stageBreakdown');
    if(!el) return;
    const selDb = selectedDb();
    const res = window.Calc && window.Calc.Evaluator && window.Calc.Evaluator.buildStageBreakdown(selDb, state.config);
    if(!res){ el.innerHTML = '<p>No data.</p>'; return; }
    const entries = res.stages
      .filter(stage => stage.delta_db !== 0)
      .map(stage => {
        const delta = stage.delta_db >= 0 ? `+${stage.delta_db.toFixed(2)}` : stage.delta_db.toFixed(2);
        return `<div class="stage-card" data-stage="${stage.type}"><div class="stage-label">${stage.label}</div><div class="stage-gain">${delta} dB</div><div class="stage-power">${stage.p_in_dbm.toFixed(2)} → ${stage.p_out_dbm.toFixed(2)} dBm</div></div>`;
      }).join('');
    el.innerHTML = `<h4>Gain / Loss Chain</h4><div class="stage-container">${entries || '<p>All stages neutral.</p>'}</div>`;

    const cards = el.querySelectorAll('.stage-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const stageType = card.getAttribute('data-stage');
        if(!stageType) return;
        state.canvas.highlightStage = stageType;
        expandForStage(stageType);
        requestAnimationFrame(() => {
          renderCanvas();
          const target = document.querySelector('.component.highlighted');
          if(target){
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          setTimeout(() => { state.canvas.highlightStage = null; renderCanvas(); }, 1800);
        });
      });
    });
  }

  function buildMaxDistanceSummary(res, selDb, maxReachMeters){
    const maxReach = (typeof maxReachMeters === 'number' && isFinite(maxReachMeters)) ? maxReachMeters : state.config.global.distance_m;
    if(maxReach == null || !isFinite(maxReach) || maxReach <= 0){
      return `<h4>Max Distance Explained</h4><p class="no-reach">The link budget never meets receiver sensitivity at any distance. Increase Tx power, reduce fixed losses, improve geometric capture, or choose a more sensitive receiver.</p>`;
    }
    const rows = [
      {k: 'Tx power (dBm)', v: safeFixedString(res.ptx_dbm, 2)},
      {k: 'Total insertion (dB)', v: safeFixedString(res.il_db != null ? -res.il_db : null, 2)},
      {k: 'Atmospheric loss (dB)', v: safeFixedString(res.atm_db != null ? -res.atm_db : null, 2)},
      {k: 'Scintillation margin (dB)', v: safeFixedString(res.scin_db != null ? -res.scin_db : null, 2)},
      {k: 'Pointing loss (dB)', v: safeFixedString(res.point_db != null ? -res.point_db : null, 2)},
      {k: 'Geometric gain (dB)', v: safeFixedString(res.geo_db, 2)},
      {k: 'Received power (dBm)', v: safeFixedString(res.prx_dbm, 2)},
      {k: 'Sensitivity (dBm)', v: safeFixedString(res.sens_dbm, 2)},
      {k: 'Margin (dB)', v: safeFixedString(res.margin_db, 2)},
      {k: 'Max reach (km)', v: (maxReach/1000).toFixed(2)}
    ];
    const html = rows.map(r => `<div class="term"><span>${r.k}</span><span>${r.v}</span></div>`).join('');
    const geoInsight = `Geometric gain reflects aperture/array capture. If margin is low, increase capture area or receiver sensitivity.`;
    return `<h4>Max Distance Explained</h4><p>We integrate Tx power, optical losses, atmospheric effects, and receiver sensitivity. Max distance is where post-FEC BER meets the target (${state.config.global.target_ber}). ${geoInsight}</p><div class="term-list">${html}</div>`;
  }

  function applyTooltips(db){
    for(const cat of db.categories){
      for(const model of cat.models){
        if(!model.tool_tip){
          model.tool_tip = TOOLTIP_DEFAULTS[cat.type] || (model.description || '');
        }
      }
    }
  }

  function bindPartsSearch(){
    const input = document.getElementById('searchParts');
    if(!input) return;
    input.addEventListener('input', () => {
      renderPartsList(input.value.trim().toLowerCase());
    });
  }

  // Removed fetchJson to prevent CORS on file://; DB is provided by components.db.js

  function loadSession(){
    try { return JSON.parse(localStorage.getItem('fsoc_config_v01')); } catch(e){ return null; }
  }

  function saveSession(){
    localStorage.setItem('fsoc_config_v01', JSON.stringify(state.config));
  }

  function bindTabs(){
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    if(!tabButtons.length || !tabPanels.length) return;

    const activateTab = (targetId) => {
      tabButtons.forEach(btn => {
        const id = btn.getAttribute('data-tab');
        const isActive = id === targetId;
        btn.classList.toggle('active', isActive);
      });
      tabPanels.forEach(panel => {
        const isActive = panel.id === `tab-${targetId}`;
        panel.classList.toggle('active', isActive);
      });
      saveUIState('active_tab', targetId);
    };

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-tab');
        activateTab(id);
      });
    });

    const savedTab = loadUIState('active_tab');
    if(savedTab){
      const targetPanel = document.getElementById(`tab-${savedTab}`);
      if(targetPanel){
        activateTab(savedTab);
        return;
      }
    }
    activateTab('properties');
  }

  function saveUIState(key, value){
    try {
      const stateStr = localStorage.getItem('fsoc_ui_state');
      const state = stateStr ? JSON.parse(stateStr) : {};
      state[key] = value;
      localStorage.setItem('fsoc_ui_state', JSON.stringify(state));
    } catch(e){
      // ignore localStorage errors silently
    }
  }

  function loadUIState(key){
    try {
      const stateStr = localStorage.getItem('fsoc_ui_state');
      if(!stateStr) return null;
      const state = JSON.parse(stateStr);
      return state[key];
    } catch(e){
      return null;
    }
  }

  function bindToolbar(){
    const bitrate = document.getElementById('bitrate');
    const wavelength = document.getElementById('wavelength');
    const targetBer = document.getElementById('targetBer');
    const weather = document.getElementById('weather');
    const alignmentMode = document.getElementById('alignmentMode');
    const importBtn = document.getElementById('importBtn');
    const exportBtn = document.getElementById('exportBtn');
    const resetBtn = document.getElementById('resetBtn');
    const resetModelsBtn = document.getElementById('resetModelsBtn');
    const autoUpdate = document.getElementById('autoUpdate');
    const runBtn = document.getElementById('runBtn');
    const alignWavelength = document.getElementById('alignWavelength');
    const windMps = document.getElementById('windMps');
    const jitterMaxHz = document.getElementById('jitterMaxHz');
    const psdLow = document.getElementById('psdLow');
    const psdHigh = document.getElementById('psdHigh');
    const psdSplitHz = document.getElementById('psdSplitHz');

    bitrate.value = String(state.config.global.bitrate_gbps);
    wavelength.value = String(state.config.global.wavelength_nm);
    targetBer.value = String(state.config.global.target_ber);
    weather.value = state.config.global.weather;
    alignmentMode.value = state.config.global.alignment_mode || 'dual_lambda';
    alignWavelength.value = String(state.config.global.align_wavelength_nm || 1310);
    windMps.value = String(state.config.channel.wind_mps || 5);
    jitterMaxHz.value = String(state.config.channel.jitter_max_hz || 1000);
    psdLow.value = String(state.config.channel.psd_low_mrad2_Hz || 0.0001);
    psdHigh.value = String(state.config.channel.psd_high_mrad2_Hz || 0.00005);
    psdSplitHz.value = String(state.config.channel.psd_split_hz || 100);

    const maybeRender = () => {
      if(autoUpdate && autoUpdate.checked){
        renderPartsList();
        renderAll();
      }
    };
    const forceRun = () => {
      renderPartsList();
      renderAll();
    };
    runBtn.addEventListener('click', forceRun);

    bitrate.addEventListener('change', e => {
      state.config.global.bitrate_gbps = Number(e.target.value);
      saveSession();
      maybeRender();
    });
    wavelength.addEventListener('change', e => {
      state.config.global.wavelength_nm = Number(e.target.value);
      saveSession();
      maybeRender();
    });
    targetBer.addEventListener('change', e => {
      state.config.global.target_ber = Number(e.target.value);
      saveSession();
      maybeRender();
    });
    weather.addEventListener('change', e => {
      state.config.global.weather = String(e.target.value);
      // map preset to channel alpha/Cn2 (simple v1 mapping)
      const presets = {
        clear: { alpha: 0.2, Cn2: 1e-14 },
        haze: { alpha: 2.0, Cn2: 3e-14 },
        light_fog: { alpha: 10.0, Cn2: 1e-13 },
        heavy_fog: { alpha: 100.0, Cn2: 1e-12 }
      };
      const p = presets[state.config.global.weather];
      if(p){
        state.config.channel.atmospheric_alpha_db_per_km = p.alpha;
        state.config.channel.Cn2 = p.Cn2;
      }
      saveSession();
      maybeRender();
    });

    alignmentMode.addEventListener('change', e => {
      state.config.global.alignment_mode = String(e.target.value);
      saveSession();
      maybeRender();
    });
    alignWavelength.addEventListener('change', e => {
      state.config.global.align_wavelength_nm = Number(e.target.value);
      saveSession();
      maybeRender();
    });
    windMps.addEventListener('change', e => {
      state.config.channel.wind_mps = Number(e.target.value);
      saveSession();
      maybeRender();
    });
    jitterMaxHz.addEventListener('change', e => {
      state.config.channel.jitter_max_hz = Number(e.target.value);
      saveSession();
      maybeRender();
    });
    psdLow.addEventListener('change', e => {
      state.config.channel.psd_low_mrad2_Hz = Number(e.target.value);
      saveSession();
      maybeRender();
    });
    psdHigh.addEventListener('change', e => {
      state.config.channel.psd_high_mrad2_Hz = Number(e.target.value);
      saveSession();
      maybeRender();
    });
    psdSplitHz.addEventListener('change', e => {
      state.config.channel.psd_split_hz = Number(e.target.value);
      saveSession();
      maybeRender();
    });

    exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state.config, null, 2)], {type: 'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'fsoc_config.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });

    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async () => {
        const file = input.files && input.files[0];
        if(!file) return;
        const text = await file.text();
        try {
          const json = JSON.parse(text);
          if(json.schema_version){
            state.config = json;
            saveSession();
            bindToolbar();
            renderPartsList();
            renderAll();
          } else {
            alert('Invalid config: missing schema_version');
          }
        } catch(e){
          alert('Invalid JSON');
        }
      };
      input.click();
    });

    resetBtn.addEventListener('click', () => {
      state.config = JSON.parse(JSON.stringify(defaultConfig));
      saveSession();
      bindToolbar();
      forceRun();
    });
    resetModelsBtn.addEventListener('click', () => {
      // Restore DB models from initial snapshot
      if(state.initialDb){
        state.db = JSON.parse(JSON.stringify(state.initialDb));
        initSelectionFromDb();
        saveSession();
        forceRun();
      }
    });
  }

  function renderAll(){
    renderCanvas();
    renderKPIs();
    renderPlots();
    renderStageBreakdown();
  }

  function renderPartsList(filterTerm){
      const list = document.getElementById('partsList');
      list.innerHTML = '';
    for(const group of CATEGORY_TREE){
        const groupEl = document.createElement('div');
        groupEl.className = 'category-group';
      const groupTitle = document.createElement('div');
      groupTitle.className = 'category-title';
      groupTitle.textContent = group.label;
      groupEl.appendChild(groupTitle);
      for(const child of group.children){
        renderCategoryNode(child, groupEl, filterTerm, 0);
        }
        list.appendChild(groupEl);
      }
    }

  function renderCategoryNode(node, container, filterTerm, depth){
    if(node.children){
      const title = document.createElement('div');
      title.className = 'subcategory-title';
      title.style.paddingLeft = `${depth*12}px`;
      title.textContent = node.label;
      container.appendChild(title);
      for(const child of node.children){
        renderCategoryNode(child, container, filterTerm, depth + 1);
      }
      return;
    }
    if(node.disabled) return;
    const cat = state.db.categories.find(c => c.type === node.type);
    if(!cat) return;
    const group = document.createElement('div');
    group.className = 'part-group';
    group.style.marginLeft = `${Math.max(depth-1,0)*16}px`;
    const title = document.createElement('div');
    title.className = 'subcategory-title';
    title.style.paddingLeft = `${depth*12}px`;
    title.textContent = node.label;
    group.appendChild(title);
    let added = false;
    for(const m of cat.models){
      const matches = !filterTerm || m.id.toLowerCase().includes(filterTerm) || (m.tool_tip && m.tool_tip.toLowerCase().includes(filterTerm));
      if(!matches) continue;
      added = true;
      const item = document.createElement('div');
      const compatible = isCompatible(cat.type, m);
      item.className = 'part' + (state.selection[cat.type] === m.id ? ' selected' : '') + (compatible ? '' : ' incompatible');
      item.setAttribute('data-type', cat.type);
      item.setAttribute('data-id', m.id);
      const textWrap = document.createElement('div');
      textWrap.style.display = 'flex';
      textWrap.style.flexDirection = 'column';
      const main = document.createElement('div');
      main.className = 'id';
      main.textContent = m.id;
      textWrap.appendChild(main);
      const subtitle = document.createElement('div');
      subtitle.className = 'subtitle';
      subtitle.textContent = compatible ? (node.label || cat.type) : 'Incompatible @ ' + state.config.global.bitrate_gbps + ' Gb/s';
      textWrap.appendChild(subtitle);
      item.appendChild(textWrap);
      if(m.tool_tip){
        const tip = document.createElement('div');
        tip.className = 'part-tooltip';
        tip.textContent = m.tool_tip;
        item.appendChild(tip);
      }
      item.title = m.tool_tip || JSON.stringify(m);
      item.addEventListener('click', () => {
        if(!isCompatible(cat.type, m)) return;
        state.selection[cat.type] = m.id;
        saveSession();
        renderPartsList(filterTerm);
        renderInspector(cat.type, m);
        renderAll();
      });
      group.appendChild(item);
    }
    if(added) container.appendChild(group);
  }

  function isCompatible(type, model){
    const br = state.config.global.bitrate_gbps;
    // Examples of gating
    if(type === 'tosa' && Array.isArray(model.supports_bitrates)){
      if(!model.supports_bitrates.some(v => Number(v) === br)) return false;
    }
    if(type === 'tosa_type' && Array.isArray(model.supports_bitrates)){
      if(!model.supports_bitrates.some(v => Number(v) === br)) return false;
    }
    if(type === 'rosa' && Array.isArray(model.bitrate_gbps_supported)){
      if(!model.bitrate_gbps_supported.some(v => Number(v) === br)) return false;
    }
    if(type === 'la_cdr' && typeof model.bitrate_gbps === 'number'){
      if(Number(model.bitrate_gbps) !== br) return false;
    }
    // Lens stacks require mounts that support stacks
    if(type === 'lens_stack'){
      const mount = getSelected('optomech_mount');
      if(!mount || !mount.supports_stack) return false;
    }
    // Alignment wavelength compatibility
    if(type === 'receiver_array'){
      const mode = state.config.global.alignment_mode || 'dual_lambda';
      if(mode === 'dual_lambda' && model.dual_lambda_ok === false) return false;
      }
      return true;
    }

  function renderInspector(type, model){
    const insp = document.getElementById('inspector');
    insp.innerHTML = '';
      const title = document.createElement('div');
    title.innerHTML = '<strong>' + type + '</strong>: ' + model.id;
    insp.appendChild(title);
    // Editable fields for receiver_array
    if(type === 'receiver_array' || type === 'aspheric_collimator' || type === 'grin_collimator' || type === 'tx_telescope' || type === 'tosa_type' || type === 'optical_isolator' || type === 'interference_filter' || type === 'tosa' || type === 'fsm' || type === 'gimbal' || type === 'pilot_injector' || type === 'pilot_demod' || type === 'align_laser'){
      const fields = [
        ...(type==='receiver_array' ? [
          {k:'sub_aperture_mm', step:0.1}, {k:'grid_rows', step:1}, {k:'grid_cols', step:1}, {k:'pitch_mm', step:0.1},
          {k:'fill_factor', step:0.01}, {k:'sampling_factor', step:0.01}, {k:'tilt_std_mrad', step:0.1}, {k:'flatness_um_rms', step:10}, {k:'offset_mrad', step:0.1}, {k:'aoa_extra_mrad', step:0.1}
        ] : []),
        ...(type==='aspheric_collimator' ? [
          {k:'focal_length_mm', step:0.1}, {k:'na', step:0.01}, {k:'residual_divergence_mrad', step:0.1}, {k:'ar_wavelength_nm', step:1}
        ] : []),
        ...(type==='grin_collimator' ? [
          {k:'pitch', step:0.01}, {k:'working_distance_mm', step:0.1}, {k:'residual_divergence_mrad', step:0.1}, {k:'ar_center_nm', step:1}
        ] : []),
        ...(type==='tx_telescope' ? [
          {k:'aperture_mm', step:0.1}, {k:'magnification', step:0.1}, {k:'residual_divergence_mrad', step:0.01}
        ] : []),
        ...(type==='tosa_type' ? [
          {k:'extinction_ratio_db', step:0.1}, {k:'oma_dbm_max', step:0.1}
        ] : []),
        ...(type==='optical_isolator' ? [
          {k:'isolation_db', step:0.1}, {k:'il_db', step:0.1}
        ] : []),
        ...(type==='interference_filter' ? [
          {k:'center_nm', step:1}, {k:'fwhm_nm', step:0.5}
        ] : []),
        ...(type==='tosa' ? [ {k:'optical_power_dbm', step:0.1, min:-10, max:20} ] : []),
        ...(type==='fsm' ? [
          {k:'bandwidth_hz', step:50}, {k:'range_mrad', step:0.1}, {k:'resolution_urad', step:0.1}, {k:'latency_ms', step:0.1}
        ] : []),
        ...(type==='gimbal' ? [
          {k:'bandwidth_hz', step:10}, {k:'range_deg', step:0.1}, {k:'resolution_mrad', step:0.01}, {k:'latency_ms', step:0.5}
        ] : []),
        ...(type==='pilot_injector' ? [
          {k:'pilot_ratio_pct', step:0.1}
        ] : []),
        ...(type==='pilot_demod' ? [
          {k:'bandwidth_hz', step:10}, {k:'noise_v_sqrtHz', step:1e-10}
        ] : []),
        ...(type==='align_laser' ? [
          {k:'power_dbm', step:0.1}, {k:'wavelength_nm', step:1}
        ] : [])
      ];
      if(type==='beam_expander'){
        fields.push({k:'residual_divergence_mrad', step:0.1});
        fields.push({k:'output_waist_mm', step:0.1});
      }
      if(type==='tx_telescope'){
        fields.push({k:'residual_divergence_mrad', step:0.05});
        fields.push({k:'output_waist_mm', step:0.1});
      }
      if(type==='receiver_array'){
        fields.push({k:'envelope_diameter_mm', step:1});
        fields.push({k:'envelope_width_mm', step:1});
        fields.push({k:'envelope_height_mm', step:1});
        fields.push({k:'sub_aperture_mm', step:0.1});
        fields.push({k:'fill_factor', step:0.01});
        fields.push({k:'efficiency', step:0.01});
        fields.push({k:'efficiency_1550', step:0.01});
        fields.push({k:'efficiency_1310', step:0.01});
      }
      for(const f of fields){
        const wrap = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = f.k + ': ';
        const input = document.createElement('input');
        input.type = 'number';
        input.step = String(f.step);
        input.value = String(model[f.k] != null ? model[f.k] : '');
        if(f.min != null) input.min = String(f.min);
        if(f.max != null) input.max = String(f.max);
        input.addEventListener('change', () => {
          // mutate selected model in db for custom config
          const cat = state.db.categories.find(c => c.type === type);
          const idx = cat.models.findIndex(m => m.id === model.id);
          if(idx >= 0){
          const v = Number(input.value);
            cat.models[idx][f.k] = isNaN(v) ? cat.models[idx][f.k] : v;
            saveSession();
            renderAll();
          }
        });
        label.appendChild(input);
        wrap.appendChild(label);
        insp.appendChild(wrap);
      }
      if(type === 'tosa'){
        const wrapMw = document.createElement('div');
        const labelMw = document.createElement('label');
        labelMw.textContent = 'optical_power_mw: ';
        const inputMw = document.createElement('input');
        inputMw.type = 'number';
        inputMw.step = '0.1';
        const mwVal = model.optical_power_dbm != null ? Math.pow(10, model.optical_power_dbm / 10) : '';
        inputMw.value = mwVal === '' ? '' : mwVal.toFixed(3);
        inputMw.addEventListener('change', () => {
          const cat = state.db.categories.find(c => c.type === 'tosa');
          const idx = cat.models.findIndex(m => m.id === model.id);
          if(idx >= 0){
            const v = Number(inputMw.value);
            if(!isNaN(v) && v > 0){
              cat.models[idx].optical_power_dbm = 10 * Math.log10(v);
              saveSession();
              renderAll();
              renderInspector(type, cat.models[idx]);
            }
          }
        });
        labelMw.appendChild(inputMw);
        wrapMw.appendChild(labelMw);
        insp.appendChild(wrapMw);
      }
      // Revert to defaults button
      const revert = document.createElement('button');
      revert.textContent = 'Revert to defaults';
      revert.addEventListener('click', () => {
        const cat = state.db.categories.find(c => c.type === type);
        const idx = cat.models.findIndex(m => m.id === model.id);
        const origCat = state.initialDb.categories.find(c => c.type === type);
        const orig = origCat && origCat.models.find(m => m.id === model.id);
        if(idx >= 0 && orig){
          // restore full original model fields
          cat.models[idx] = JSON.parse(JSON.stringify(orig));
          saveSession();
          renderAll();
          renderInspector(type, cat.models[idx]);
        }
      });
      insp.appendChild(revert);
      } else {
        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(model, null, 2);
      insp.appendChild(pre);
    }
  }

  function renderCanvas(){
    stageColumnMap = {};
    const selDb = selectedDb();
    const evalRes = (window.Calc && window.Calc.Evaluator) ? window.Calc.Evaluator.evaluate(selDb, state.config) : null;
    const stageRes = (window.Calc && window.Calc.Evaluator) ? window.Calc.Evaluator.buildStageBreakdown(selDb, state.config) : null;

    // Render TX column
    renderColumn('txGroups', 'tx', evalRes, stageRes);

    // Render Channel column with alignment adjustment
    renderChannel('channelGroups', evalRes, stageRes);

    // Evaluate beam at max reach for visualization
    let maxBeamEval = null;
    const maxReach = computeMaxReachMeters(selDb, state.config);
    if(maxReach && isFinite(maxReach) && maxReach > 0){
      try {
        const cfgMax = JSON.parse(JSON.stringify(state.config));
        cfgMax.global.distance_m = maxReach;
        const evalMax = window.Calc && window.Calc.Evaluator && window.Calc.Evaluator.evaluate(selDb, cfgMax);
        if(evalMax && evalMax.beam_profile){
          maxBeamEval = { eval: evalMax, distance_m: maxReach };
        }
      } catch(e){ /* swallow */ }
    }
    const renderedProfile = renderBeamVisual(evalRes, maxBeamEval, state.config.global.distance_m, { zoomToLens: state.beam.zoomToLens });
    const activeProfile = renderedProfile || (maxBeamEval ? maxBeamEval.eval.beam_profile : (evalRes ? evalRes.beam_profile : null));
    state.beam.profile = activeProfile;
    state.beam.distance_m = maxBeamEval ? maxBeamEval.distance_m : state.config.global.distance_m;

    // Render RX column
    renderColumn('rxGroups', 'rx', evalRes, stageRes);

    alignChannelColumn();
  }

  function makeGroupKey(columnId, groupLabel){
    return `${columnId}-${groupLabel}`;
  }

  function makeComponentKey(columnId, groupLabel, componentLabel){
    return `${makeGroupKey(columnId, groupLabel)}-${componentLabel}`;
  }

  let stageColumnMap = {};

  function renderColumn(containerId, columnId, evalRes, stageRes){
    const container = document.getElementById(containerId);
    if(!container) return;
    
    const columnDef = COLUMN_LAYOUT.find(c => c.id === columnId);
    if(!columnDef) return;
    
    const stageList = stageRes && stageRes.stages ? stageRes.stages : [];
    container.innerHTML = '';
    
    columnDef.groups.forEach(group => {
    const groupDetails = { columnId: columnId, label: group.label };
      const components = group.components.filter(c => {
        if(c.hideWhenInactive){
          const active = hasActiveArray(getSelected('receiver_array'));
          return active;
        }
        if(c.dependsOn){
          const dep = getSelected(c.dependsOn);
          if(!dep) return false;
          if(c.dependsOn === 'receiver_array' && !hasActiveArray(dep)) return false;
        }
        return true;
      });
      if(!components.length) return;

      const groupKey = makeGroupKey(columnId, group.label);
      const isExpanded = state.canvas.expandedGroups.has(groupKey);
      
      // Calculate group total gain/loss
      const groupStages = components
        .map(c => c.stageType ? stageList.find(s => s.type === c.stageType) : null)
        .filter(s => s && s.delta_db !== 0);
      const groupTotalDelta = groupStages.reduce((sum, stage) => sum + stage.delta_db, 0);
      const groupStartPower = groupStages.length > 0 ? groupStages[0].p_in_dbm : 0;
      const groupEndPower = groupStages.length > 0 ? groupStages[groupStages.length - 1].p_out_dbm : 0;

      const groupEl = document.createElement('div');
      groupEl.className = `group ${isExpanded ? 'expanded' : ''}`;
      
      // Group header
      const headerEl = document.createElement('div');
      headerEl.className = 'group-header';
      headerEl.onclick = () => toggleGroup(groupKey);
      
      const arrowEl = document.createElement('span');
      arrowEl.className = 'group-arrow';
      arrowEl.textContent = '▶';
      headerEl.appendChild(arrowEl);
      
      const titleEl = document.createElement('span');
      titleEl.className = 'group-title';
      titleEl.textContent = group.label;
      headerEl.appendChild(titleEl);
      
      if(groupTotalDelta !== 0) {
        const totalEl = document.createElement('div');
        totalEl.className = `group-total ${groupTotalDelta >= 0 ? 'positive' : 'negative'}`;
        totalEl.textContent = (groupTotalDelta >= 0 ? '+' : '') + groupTotalDelta.toFixed(2) + ' dB';
        headerEl.appendChild(totalEl);
        
        const powerEl = document.createElement('div');
        powerEl.className = 'group-power';
        powerEl.textContent = `${groupStartPower.toFixed(1)} → ${groupEndPower.toFixed(1)} dBm`;
        headerEl.appendChild(powerEl);
      }
      
      groupEl.appendChild(headerEl);
      
      // Group content
      const contentEl = document.createElement('div');
      contentEl.className = 'group-content';
      
      const componentsEl = document.createElement('div');
      componentsEl.className = 'components-list';
      
      components.forEach(c => {
        const componentKey = makeComponentKey(columnId, group.label, c.label);
        const isComponentExpanded = state.canvas.expandedComponents.has(componentKey);
        
        const comp = c.type ? getSelected(c.type) : null;
        const stage = c.stageType ? stageList.find(s => s.type === c.stageType) : null;
        if(stage){
          stageColumnMap[stage.type] = {
            groupKey,
            componentKey,
            columnId
          };
        }
        
        const componentEl = document.createElement('div');
        componentEl.className = `component ${isComponentExpanded ? 'expanded' : ''}`;
        if(stage && state.canvas.highlightStage === stage.type){
          componentEl.classList.add('highlighted');
        }
        componentEl.onclick = (e) => {
          if(e && e.stopPropagation) e.stopPropagation();
          if(comp) {
            state.selection[c.type] = comp.id;
            saveSession();
            renderPartsList();
            renderInspector(c.type, comp);
            renderAll();
          }
        };
        
        // Component header
        const compHeaderEl = document.createElement('div');
        compHeaderEl.className = 'component-header';
        
        if(comp) {
          const compArrowEl = document.createElement('span');
          compArrowEl.className = 'component-arrow';
          compArrowEl.textContent = '▶';
          compArrowEl.onclick = (e) => {
            if(e && e.stopPropagation) e.stopPropagation();
            toggleComponent(componentKey);
          };
          compHeaderEl.appendChild(compArrowEl);
        }
        
        const compTitleEl = document.createElement('span');
        compTitleEl.className = 'component-title';
        compTitleEl.textContent = comp ? `${c.label} • ${comp.id}` : c.label;
        compHeaderEl.appendChild(compTitleEl);

        if(comp){
          compHeaderEl.addEventListener('click', (e) => {
            if(e && e.stopPropagation) e.stopPropagation();
            toggleComponent(componentKey);
          });
        }
        
        if(stage && stage.delta_db !== 0) {
          const compGainEl = document.createElement('div');
          compGainEl.className = `component-gain ${stage.delta_db >= 0 ? 'positive' : 'negative'}`;
          compGainEl.textContent = (stage.delta_db >= 0 ? '+' : '') + stage.delta_db.toFixed(2) + ' dB';
          compHeaderEl.appendChild(compGainEl);
          
          const compPowerEl = document.createElement('div');
          compPowerEl.className = 'component-power';
          compPowerEl.textContent = `${stage.p_in_dbm.toFixed(1)} → ${stage.p_out_dbm.toFixed(1)} dBm`;
          compHeaderEl.appendChild(compPowerEl);
        }
        
        componentEl.appendChild(compHeaderEl);
        
        // Component details
        if(comp) {
          const detailsEl = document.createElement('div');
          detailsEl.className = 'component-details';
          
          const metaEl = document.createElement('div');
          metaEl.className = 'component-meta';
          
          if(c.type === 'receiver_array' && hasActiveArray(comp)){
            metaEl.textContent = `${Number(comp.count||0)} elements • ${Number(comp.sub_aperture_mm||0)} mm • fill ${Math.round((comp.fill_factor||0)*100)}%`;
          } else {
            metaEl.textContent = comp.tool_tip || 'Selected component';
          }
          
          detailsEl.appendChild(metaEl);
          componentEl.appendChild(detailsEl);
        }
        
        componentsEl.appendChild(componentEl);
      });
      
      contentEl.appendChild(componentsEl);
      groupEl.appendChild(contentEl);
      container.appendChild(groupEl);
    });
  }

  function renderChannel(containerId, evalRes, stageRes){
    const container = document.getElementById(containerId);
    if(!container) return;
    
    const budgetStages = stageRes && stageRes.stages ? stageRes.stages : [];
    
    container.innerHTML = '';
    
    const effectsEl = document.createElement('div');
    effectsEl.className = 'channel-effects';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'channel-title';
    titleEl.textContent = 'Propagation Effects';
    effectsEl.appendChild(titleEl);
    
    const effects = [
      { stageType: 'atmosphere', label: 'Atmospheric Loss' },
      { stageType: 'scintillation', label: 'Scintillation Margin' },
      { stageType: 'pointing', label: 'Pointing Loss' },
      { stageType: 'geometry', label: 'Geometric Coupling' }
    ];
    
    effects.forEach(effect => {
      const stage = budgetStages.find(s => s.type === effect.stageType);
      if(!stage) return;
      
      const effectEl = document.createElement('div');
      effectEl.className = 'channel-effect';
      
      const labelEl = document.createElement('div');
      labelEl.className = 'effect-label';
      labelEl.textContent = effect.label;
      effectEl.appendChild(labelEl);
      
      const gainEl = document.createElement('div');
      gainEl.className = `effect-gain ${stage.delta_db >= 0 ? 'positive' : 'negative'}`;
      gainEl.textContent = (stage.delta_db >= 0 ? '+' : '') + stage.delta_db.toFixed(2) + ' dB';
      effectEl.appendChild(gainEl);
      
      const powerEl = document.createElement('div');
      powerEl.className = 'effect-power';
      powerEl.textContent = `${stage.p_in_dbm.toFixed(1)} → ${stage.p_out_dbm.toFixed(1)} dBm`;
      effectEl.appendChild(powerEl);
      
      effectsEl.appendChild(effectEl);
    });
    
    container.appendChild(effectsEl);
  }

  function lensRadiusPx(profile){
    if(!profile || !profile.geometry) return 0;
    return profile.geometry.lens_radius_at_end_m * profile.geometry.scale_px_per_m;
  }

  function beamRadiusPx(profile){
    if(!profile || !profile.geometry) return 0;
    return profile.geometry.beam_radius_at_end_m * profile.geometry.scale_px_per_m;
  }

  function renderBeamVisual(currentEval, maxEval, currentDistance, opts){
    const container = document.getElementById('beamVisual');
    const readout = document.getElementById('beamCaptureReadout');
    if(!container) return null;
    container.innerHTML = '';
    const zoomMode = opts && opts.zoomToLens;
    const targetEval = zoomMode && maxEval && maxEval.eval ? maxEval.eval : currentEval;
    if(!targetEval || !targetEval.beam_profile){
      container.style.display = 'none';
      state.beam.profile = null;
      state.beam.svgRefs = null;
      if(readout) readout.textContent = 'Capture: —';
      return null;
    }
    container.style.display = 'block';

    const L = maxEval ? maxEval.distance_m : currentDistance;
    const profile = zoomMode
      ? (targetEval.beam_profile_zoom || targetEval.beam_profile)
      : (maxEval && maxEval.eval && maxEval.eval.beam_profile ? maxEval.eval.beam_profile : currentEval.beam_profile);
    const distanceLabelKm = maxEval ? (maxEval.distance_m/1000).toFixed(2) : (currentDistance/1000).toFixed(2);

    let svgString = profile.svg.replace('##DIST_KM##', distanceLabelKm);
    if(maxEval && maxEval.eval && maxEval.eval.beam_profile){
      const divMax = maxEval.eval.beam_profile.divergence_mrad != null ? maxEval.eval.beam_profile.divergence_mrad.toFixed(2) : null;
      if(divMax){
        svgString = svgString.replace('##DIV_MRAD##', divMax);
      }
    }
    const divCurr = currentEval.beam_profile.divergence_mrad != null ? currentEval.beam_profile.divergence_mrad.toFixed(2) : null;
    if(divCurr){
      svgString = svgString.replace('##DIV_MRAD##', divCurr);
    }
    /* compatibility with updated SVG that has no placeholder */

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.documentElement;

    if(svgEl){
      svgEl.setAttribute('width', '100%');
      svgEl.setAttribute('height', '100%');
      svgEl.removeAttribute('xmlns:xlink');
      const lensOverlay = doc.querySelector('#lensOverlay');
      let captureOverlay = doc.querySelector('#captureOverlay');
      if(!captureOverlay){
        captureOverlay = doc.createElementNS(SVG_NS, 'circle');
        captureOverlay.setAttribute('id', 'captureOverlay');
        captureOverlay.setAttribute('fill', 'rgba(15,118,110,0.35)');
        captureOverlay.setAttribute('stroke', 'none');
        captureOverlay.setAttribute('visibility', 'hidden');
        const envelopeGroup = doc.querySelector('#beamEnvelopeGroup');
        if(envelopeGroup && envelopeGroup.parentNode){
          envelopeGroup.parentNode.insertBefore(captureOverlay, envelopeGroup.nextSibling);
        } else {
          doc.documentElement.appendChild(captureOverlay);
        }
      }
      container.appendChild(svgEl);
      state.beam.svgRefs = {
        svg: svgEl,
        envelope: svgEl.querySelector('#beamEnvelope'),
        lens: lensOverlay,
        capture: captureOverlay,
        geometry: profile.geometry,
        windowStart: profile.window_start_m,
        windowEnd: profile.window_end_m
      };
      state.beam.profile = profile;
      if(zoomMode){
        requestAnimationFrame(() => {
          container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
        });
      }
      updateBeamCaptureReadout(profile, 0);
      if(state.beam.jitterActive && profile && profile.geometry && state.beam.autoAlign !== false){
        initBeamJitterAnimation();
      } else {
        stopBeamJitter();
      }
    }

    return profile;
  }

  function alignChannelColumn(){
    const channel = document.querySelector('.channel-column .column-title');
    const tx = document.querySelector('.tx-column .column-title');
    const rx = document.querySelector('.rx-column .column-title');
    const column = document.querySelector('.channel-column');
    if(!channel || !tx || !rx || !column) return;
    const targetTop = Math.max(tx.offsetTop, rx.offsetTop);
    const channelTop = channel.offsetTop;
    const delta = targetTop - channelTop;
    state.ui.channelOffsetPx = Math.max(delta, 0);
    column.style.setProperty('--channel-offset', `${state.ui.channelOffsetPx}px`);
  }

  function toggleGroup(groupKey){
    if(state.canvas.expandedGroups.has(groupKey)) {
      state.canvas.expandedGroups.delete(groupKey);
    } else {
      state.canvas.expandedGroups.add(groupKey);
    }
    renderCanvas();
  }

  function toggleComponent(componentKey){
    if(state.canvas.expandedComponents.has(componentKey)) {
      state.canvas.expandedComponents.delete(componentKey);
    } else {
      state.canvas.expandedComponents.add(componentKey);
    }
    renderCanvas();
  }

  function expandForStage(stageType){
    const column = stageColumnMap[stageType];
    if(!column) return;
    if(column.groupKey){
      state.canvas.expandedGroups.add(column.groupKey);
    }
    if(column.componentKey){
      state.canvas.expandedComponents.add(column.componentKey);
    }
  }

  function stopBeamJitter(){
    if(state.beam.animation){
      cancelAnimationFrame(state.beam.animation);
      state.beam.animation = null;
    }
    const refs = state.beam.svgRefs;
    if(refs && refs.envelope){
      refs.envelope.setAttribute('transform', '');
      refs.lens && refs.lens.setAttribute('transform', '');
    }
  }

  function initBeamJitterAnimation(){
    stopBeamJitter();
    const refs = state.beam.svgRefs;
    const profile = state.beam.profile;
    if(!refs || !profile || !profile.geometry) return;

    const { svg, geometry, capture } = refs;
    const beamRadius = beamRadiusPx(profile);
    const lensRadius = lensRadiusPx(profile);
    const lensCenterX = geometry.marginX + (geometry.windowEnd_m - geometry.windowStart_m) * geometry.scale_px_per_m;
    const lensCenterY = geometry.midY;

    let beamDot = svg.querySelector('#beamCentroid');
    if(!beamDot){
      beamDot = document.createElementNS(SVG_NS, 'circle');
      beamDot.setAttribute('id', 'beamCentroid');
      beamDot.setAttribute('r', Math.max(beamRadius * 0.2, 2));
      beamDot.setAttribute('fill', 'rgba(59,130,246,0.9)');
      beamDot.setAttribute('stroke', '#1d4ed8');
      beamDot.setAttribute('stroke-width', '1');
      svg.appendChild(beamDot);
    }

    let lensDot = svg.querySelector('#lensCentroid');
    if(!lensDot){
      lensDot = document.createElementNS(SVG_NS, 'circle');
      lensDot.setAttribute('id', 'lensCentroid');
      lensDot.setAttribute('r', Math.max(lensRadius * 0.25, 2));
      lensDot.setAttribute('fill', 'rgba(13,148,136,0.35)');
      lensDot.setAttribute('stroke', '#0f766e');
      lensDot.setAttribute('stroke-width', '1');
      svg.appendChild(lensDot);
    }

    if(capture){
      capture.setAttribute('cx', lensCenterX.toFixed(2));
      capture.setAttribute('cy', lensCenterY.toFixed(2));
      capture.setAttribute('r', lensRadius.toFixed(2));
      capture.setAttribute('visibility', 'visible');
    }

    const readout = document.getElementById('beamCaptureReadout');

    const durationMs = 6000;
    const frameHz = 60;
    const totalFrames = Math.floor(durationMs / (1000/frameHz));

    const residual = computePointingResidual();
    const txSeries = synthesizeJitterSeries(residual.tx, totalFrames);
    const rxSeries = synthesizeJitterSeries(residual.rx, totalFrames);

    let frame = 0;
    const manualSigma = state.config.channel.manual_jitter_mrad || 0;
    const manualSeries = manualSigma > 0 ? synthesizeJitterSeries({ sigma_mrad: manualSigma, bandwidth_hz: 2 }, totalFrames) : null;

    const animate = () => {
      if(!state.beam.jitterActive){
        stopBeamJitter();
        return;
      }
      const tx = txSeries[frame % txSeries.length];
      const rx = state.beam.autoAlign ? rxSeries[frame % rxSeries.length] : 0;
      const manual = (!state.beam.autoAlign && manualSeries) ? manualSeries[frame % manualSeries.length] : 0;
      const relative = (tx + manual) - rx;

      const offsetPx = relative * geometry.scale_px_per_m;
      const beamCx = lensCenterX;
      const beamCy = lensCenterY + offsetPx;

      beamDot.setAttribute('cx', beamCx.toFixed(2));
      beamDot.setAttribute('cy', beamCy.toFixed(2));

      lensDot.setAttribute('cx', lensCenterX.toFixed(2));
      lensDot.setAttribute('cy', lensCenterY.toFixed(2));

      const captureFraction = updateBeamCaptureReadout(profile, Math.abs(relative));
      if(capture){
        capture.setAttribute('fill', `rgba(15,118,110,${0.15 + 0.55 * captureFraction})`);
      }
      checkAlignmentLock();
      if(readout){
        readout.textContent = `Capture: ${(captureFraction*100).toFixed(1)}%`;
      }
      state.beam.capture.fraction = captureFraction;

      frame++;
      state.beam.animation = requestAnimationFrame(animate);
    };
    animate();
  }








  function computeMaxReachMeters(selDb, config){
    try{
      const eval0 = window.Calc && window.Calc.Evaluator && window.Calc.Evaluator.evaluate(selDb, config);
      if(!eval0) return null;
      const sens = eval0.sens_dbm;
      const fecId = config.global.fec_model;
      const fec = (state.db.categories.find(c => c.type==='fec')||{models:[]}).models.find(m => m.id===fecId);
      const cg = fec && fec.coding_gain_db ? Number(fec.coding_gain_db) : 0;
      const overhead = fec && fec.overhead_pct ? Number(fec.overhead_pct) : 0;
      const targetBer = config.global.target_ber || 1e-12;
      const rosa = getSelected('rosa');
      const tia = getSelected('tia') || getSelected('tia_model');
      const okAt = (L) => {
        const cfg = JSON.parse(JSON.stringify(config));
        cfg.global.distance_m = Math.max(L, 0);
        const r = window.Calc.Evaluator.evaluate(selDb, cfg);
        const berRes = window.Calc.BER.estimatePostFecBer({
          receivedPower_dbm: r.prx_dbm,
          rosa,
          tia,
          bitrate_gbps: cfg.global.bitrate_gbps
        }, cg, overhead);
        const post = berRes.ber_post != null ? berRes.ber_post : Infinity;
        return post <= targetBer;
      };
      // Coarse sweep to bracket
      const Lcurr = Math.max(config.global.distance_m, 1);
      const Lmax = Math.max(5*Lcurr, 20000);
      const steps = 80;
      let lastGood = okAt(0) ? 0 : null;
      let firstBad = null;
      for(let i=1;i<=steps;i++){
        const L = (i/steps) * Lmax;
        if(okAt(L)){
          lastGood = L;
        } else {
          firstBad = L;
          break;
        }
      }
      if(lastGood == null) return 0; // even at L=0 not OK
      if(firstBad == null) return lastGood; // never failed within range
      // Binary search between lastGood and firstBad for tighter bound
      let lo = lastGood, hi = firstBad;
      for(let iter=0; iter<24; iter++){
        const mid = 0.5*(lo+hi);
        if(okAt(mid)) lo = mid; else hi = mid;
      }
      return lo;
    } catch(e){ return null; }
  }

  function pipelineNodes(){
    const typesInOrder = [
      'tosa_type','tosa','aspheric_collimator','grin_collimator','tx_telescope','optical_isolator','filter_dichroic','voa','fsm','gimbal',
      // free space placeholder (not a selectable type)
      'receiver_objective','receiver_array','interference_filter','od_filter','tap_splitter','sensor_quad','photodiode','tia_model','tia','la_model','la_cdr','cdr_model','fec'
    ];
    const nodes = [];
    for(const t of typesInOrder){
      const m = getSelected(t);
      if(m){
        nodes.push({ type: t, model: m, label: t.replace(/_/g,' ') });
      }
      if(t === 'gimbal'){
        // Insert a visual placeholder for free-space channel
        nodes.push({ type: 'channel', model: { id: 'free-space', distance_m: state.config.global.distance_m }, label: 'Free Space' });
      }
    }
    return nodes;
  }

  function safeFixedNumber(val, digits){
    if(typeof val !== 'number' || !isFinite(val)) return null;
    return Number(val.toFixed(digits));
  }

  function safeFixedString(val, digits){
    if(typeof val !== 'number' || !isFinite(val)) return '—';
    return val.toFixed(digits);
  }

  function renderKPIs(){
    const kpiBox = document.getElementById('kpis');
      const warnBox = document.getElementById('warnings');
    const maxPanel = document.getElementById('maxReachExplain');
    if(warnBox) warnBox.innerHTML = '';
    if(maxPanel) maxPanel.innerHTML = '';
    const selDb = selectedDb();
    const res = window.Calc && window.Calc.Evaluator && window.Calc.Evaluator.evaluate(selDb, state.config);
    const ctrl = (res && window.Calc.Control) ? window.Calc.Control.estimateControlRequirements(
      state.config.global.distance_m,
      res ? res.beam_radius_m : 0,
      state.config.channel.pointing_jitter_mrad_rms,
      1.0
    ) : null;
    state.metrics.controlRaw = ctrl;
    const act = (res && window.Calc.Control) ? window.Calc.Control.estimateActuatorBandwidthTargets(
      state.config.global.wavelength_nm,
      state.config.global.distance_m,
      state.config.channel.Cn2,
      state.config.channel.wind_mps
    ) : null;
    const psdRes = (res && window.Calc.Control) ? window.Calc.Control.estimateResidualPointingFromPsd(
      state.config.channel.psd_low_mrad2_Hz || 0.0001,
      state.config.channel.psd_high_mrad2_Hz || 0.00005,
      state.config.channel.psd_split_hz || 100,
      state.config.channel.jitter_max_hz || 1000,
      act ? act.gimbal_bw_hz : 0,
      act ? act.fsm_bw_hz : 0
    ) : null;
    state.metrics.controlResidual = psdRes ? {
      tx: { sigma_mrad: (psdRes.sigma_mrad || 0), bandwidth_hz: act ? act.gimbal_bw_hz || 10 : 10 },
      rx: { sigma_mrad: (psdRes.sigma_mrad || 0) * 0.8, bandwidth_hz: act ? act.fsm_bw_hz || 50 : 50 }
    } : null;
    const rxArr = getSelected('receiver_array');
    const comb = getSelected('combiner');
    let combiner_il_db = rxArr ? (typeof rxArr.combiner_il_db === 'number' ? rxArr.combiner_il_db : 0) : 0;
    if(rxArr && comb && (comb.base_il_db != null) && (comb.per_stage_il_db != null)){
      const stages = Math.ceil(Math.log2(Math.max(rxArr.count||1,1)));
      combiner_il_db = comb.base_il_db + comb.per_stage_il_db * stages;
    }
    const fsm = getSelected('fsm');
    const gim = getSelected('gimbal');
    const fsmOk = fsm ? (fsm.bandwidth_hz >= (ctrl ? ctrl.fsm_bw_hz : 0) && fsm.resolution_urad <= (ctrl ? ctrl.resolution_urad : Infinity) && fsm.range_mrad >= (ctrl ? ctrl.range_mrad : 0)) : true;
    const gimOk = gim ? (gim.bandwidth_hz >= (ctrl ? ctrl.gimbal_bw_hz : 0) && gim.resolution_mrad <= (ctrl ? ctrl.range_mrad : Infinity)) : true;
    const berMetrics = res ? computeBerMetrics(res) : null;
    const kpis = {
      cost_usd: sumField('cost_usd'),
      weight_g: sumField('weight_g'),
      power_w: sumField('power_w'),
      prx_dbm_at_distance: safeFixedNumber(res ? res.prx_dbm : null, 2),
      sensitivity_dbm: res ? res.sens_dbm : null,
      link_margin_db: safeFixedNumber(res ? res.margin_db : null, 2),
      ber_prefec: berMetrics ? berMetrics.pre : null,
      ber_postfec: berMetrics ? berMetrics.post : null,
      divergence_mrad: safeFixedNumber(res ? res.divergence_mrad : null, 3),
      beam_radius_m: safeFixedNumber(res ? res.beam_radius_m : null, 3),
      atm_loss_db: safeFixedNumber(res ? res.atm_db : null, 2),
      pointing_loss_db: safeFixedNumber(res ? res.point_db : null, 2),
      scint_margin_db: safeFixedNumber(res ? res.scin_db : null, 2),
      geometric_coupling_db: safeFixedNumber(res ? res.geo_db : null, 2),
      combiner_il_db: safeFixedNumber(combiner_il_db, 2),
      ctrl_required_sigma_mrad: safeFixedNumber(ctrl ? ctrl.required_sigma_mrad : null, 3),
      ctrl_fsm_bw_hz: ctrl ? ctrl.fsm_bw_hz : null,
      ctrl_gimbal_bw_hz: ctrl ? ctrl.gimbal_bw_hz : null,
      ctrl_resolution_urad: safeFixedNumber(ctrl ? ctrl.resolution_urad : null, 1),
      ctrl_range_mrad: safeFixedNumber(ctrl ? ctrl.range_mrad : null, 2),
      greenwood_hz: act ? act.greenwood_hz : null,
      target_gimbal_bw_hz: act ? act.gimbal_bw_hz : null,
      target_fsm_bw_hz: act ? act.fsm_bw_hz : null,
      residual_pointing_sigma_mrad_psd: safeFixedNumber(psdRes ? psdRes.sigma_mrad : null, 3),
      fsm_ok: fsmOk,
      gimbal_ok: gimOk
    };
    const warnings = collectWarnings();
    if(ctrl && fsm && !fsmOk){ warnings.push('FSM capability insufficient for required bandwidth/resolution/range'); }
    if(ctrl && gim && !gimOk){ warnings.push('Gimbal capability insufficient for required bandwidth/range'); }
    if(warnBox){
      warnBox.innerHTML = warnings.map(w => '<div class="warning">' + w + '</div>').join('');
    }
    const rows = Object.entries(kpis).map(([k,v]) => `<div class="kpi-row"><span>${k}</span><span>${v != null ? v : '—'}</span></div>`).join('');
    if(kpiBox){
      kpiBox.innerHTML = `<h4>Key Metrics</h4><div class="kpi-list">${rows}</div>`;
    }

    if(res){
      const maxReachMeters = computeMaxReachMeters(selDb, state.config);
      if(maxPanel){
        maxPanel.innerHTML = buildMaxDistanceSummary(res, selDb, maxReachMeters);
      }
    } else {
      if(kpiBox){
        kpiBox.innerHTML = '<p>No evaluation available.</p>';
      }
      if(maxPanel){
        maxPanel.innerHTML = '';
      }
    }
  }

  function computeBerMetrics(linkEval){
    const br = state.config.global.bitrate_gbps;
    const fecId = state.config.global.fec_model;
    const fec = (state.db.categories.find(c => c.type==='fec')||{models:[]}).models.find(m => m.id===fecId);
    const cg = fec && fec.coding_gain_db ? Number(fec.coding_gain_db) : 0;
    const overhead = fec && fec.overhead_pct ? Number(fec.overhead_pct) : 0;
    const rosa = getSelected('rosa');
    const tia = getSelected('tia') || getSelected('tia_model');
    const params = {
      receivedPower_dbm: linkEval.prx_dbm,
      rosa,
      tia,
      bitrate_gbps: br
    };
    const ctx = { sensitivity_dbm: linkEval.sens_dbm, margin_db: linkEval.margin_db };
    const result = window.Calc.BER.estimatePostFecBer(params, cg, overhead, ctx);
    if(!result || result.ber == null) return null;
    return {
      pre: Number(result.ber.toExponential(2)),
      post: result.ber_post != null ? Number(result.ber_post.toExponential(2)) : null,
      snr: result.snr
    };
  }

  function collectWarnings(){
    const br = state.config.global.bitrate_gbps;
    const warns = [];
    for(const c of state.db.categories){
      const id = state.selection[c.type];
      const m = c.models.find(mm => mm.id === id) || c.models[0];
      if(!isCompatible(c.type, m)){
        warns.push('Incompatible: ' + c.type + ' → ' + m.id + ' at ' + br + ' Gb/s');
      }
    }
    // Alignment gating
    const mode = state.config.global.alignment_mode || 'dual_lambda';
    if(mode === 'dual_lambda'){
      const hasDichroic = !!getSelected('filter_dichroic');
      const hasQuad = !!getSelected('sensor_quad');
      if(!hasDichroic || !hasQuad) warns.push('Dual-λ requires dichroic filter and quad sensor');
      // Check dual-λ lens/array compatibility
      const arr = getSelected('receiver_array');
      const activeArray = hasActiveArray(arr);
      if(activeArray && arr.dual_lambda_ok === false) warns.push('Receiver array not rated for dual-λ operation');
      // Optics/filter broadband warning
      const asph = getSelected('aspheric_collimator');
      const grin = getSelected('grin_collimator');
      const ifilt = getSelected('interference_filter');
      const alignNm = state.config.global.align_wavelength_nm || 1310;
      const dataNm = state.config.global.wavelength_nm;
      if(asph && asph.ar_wavelength_nm && Math.abs(asph.ar_wavelength_nm - alignNm) > 50){ warns.push('Aspheric AR not centered for alignment λ'); }
      if(grin && grin.ar_center_nm && Math.abs(grin.ar_center_nm - alignNm) > 50){ warns.push('GRIN AR not centered for alignment λ'); }
      if(ifilt && ifilt.center_nm && ifilt.fwhm_nm && (Math.abs(ifilt.center_nm - alignNm) > ifilt.fwhm_nm)){ warns.push('Interference filter bandwidth may not pass alignment λ'); }
      if(ifilt && ifilt.center_nm && ifilt.fwhm_nm && (Math.abs(ifilt.center_nm - dataNm) > ifilt.fwhm_nm)){ warns.push('Interference filter bandwidth may not pass data λ'); }
    } else if(mode === 'pilot'){
      const hasTap = !!getSelected('tap_splitter');
      const hasQuad = !!getSelected('sensor_quad');
      if(!hasTap || !hasQuad) warns.push('Pilot requires optical tap and a narrowband sensor chain');
    } else if(mode === 'retroreflector'){
      const hasSensor = !!getSelected('sensor_quad') || !!getSelected('receiver_objective');
      if(!hasSensor) warns.push('Retroreflector mode needs a return sensing path (quad or imaging)');
    } else if(mode === 'imaging'){
      // For now reuse sensor_quad slot; later add camera component type
      const hasImager = !!getSelected('sensor_quad');
      if(!hasImager) warns.push('Imaging mode requires an imaging sensor');
    }
    const arrSelected = getSelected('receiver_array');
    const activeArray = hasActiveArray(arrSelected);
    if(activeArray && getSelected('receiver_objective')){
      warns.push('Choose either a single receiver objective or a receiver array, not both.');
    }
    if(activeArray && !getSelected('optomech_mount')){
      warns.push('Receiver array selected: add an optomech mount for proper alignment.');
    }
    if(activeArray && !getSelected('combiner')){
      warns.push('Receiver array selected: add a combiner to model splitter-tree IL.');
    }
    if(state.ui && state.ui.extraWarnings){
      warns.push(...state.ui.extraWarnings);
    }
    if(state.beam && state.beam.locked === false){
      warns.push('Alignment loop unlocked: capture too low for servo hold.');
    }
    return warns;
  }

  function renderPlots(){
    const prxEl = document.getElementById('prxPlot');
    const berEl = document.getElementById('berPlot');
    if(prxEl) prxEl.innerHTML = '';
    if(berEl) berEl.innerHTML = '';
    const width = (prxEl && prxEl.clientWidth) ? prxEl.clientWidth : 300;
    const height = 140;
    const svg1 = document.createElementNS(SVG_NS, 'svg');
    const svg2 = document.createElementNS(SVG_NS, 'svg');
    svg1.setAttribute('width', String(width));
    svg1.setAttribute('height', String(height));
    svg2.setAttribute('width', String(width));
    svg2.setAttribute('height', String(height));
    if(prxEl) prxEl.appendChild(svg1);
    if(berEl) berEl.appendChild(svg2);

    const selDb = selectedDb();
    const maxL = state.config.global.distance_m;
    const distances = Array.from({length: 21}, (_,i) => (i/20) * maxL);
    const sweep = window.Calc && window.Calc.Evaluator ? window.Calc.Evaluator.sweepPrx(selDb, state.config, distances) : [];

    if(!sweep || !sweep.length){
      if(prxEl) prxEl.innerHTML = '<p class="plot-empty">No data</p>';
      if(berEl) berEl.innerHTML = '<p class="plot-empty">No data</p>';
      return;
    }

    const prxVals = sweep.map(d => d.prx_dbm);
    const minPrx = Math.min(...prxVals);
    const maxPrx = Math.max(...prxVals);

    const margin = 24;
    const plotW = width - margin*2;
    const plotH = height - margin*2;

    const path = sweep.map((d,i) => {
      const x = margin + (d.L/maxL) * plotW;
      const y = margin + (1 - (d.prx_dbm - minPrx) / Math.max(maxPrx - minPrx, 1e-3)) * plotH;
      return (i===0?'M':'L') + x + ' ' + y;
    }).join(' ');
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', path);
    p.setAttribute('stroke', '#0ea5e9');
    p.setAttribute('fill', 'none');
    svg1.appendChild(p);

    const sensEval = window.Calc && window.Calc.Evaluator ? window.Calc.Evaluator.evaluate(selDb, state.config) : null;
    const sens = sensEval ? sensEval.sens_dbm : -40;
    const rosa = getSelected('rosa');
    const tia = getSelected('tia') || getSelected('tia_model');
    const brGbps = state.config.global.bitrate_gbps;
    const path2 = sweep.map((d,i) => {
      const x = margin + (d.L/maxL) * plotW;
      const berRes = window.Calc.BER.estimateBer({
        receivedPower_dbm: d.prx_dbm,
        rosa,
        tia,
        bitrate_gbps: brGbps
      });
      const marginDb = d.prx_dbm - sens;
      const ber = (berRes && berRes.ber != null) ? berRes.ber : window.Calc.BER.berFromMargin(marginDb, brGbps);
      const log = Math.log10(Math.max(ber, 1e-15));
      const y = margin + (1 - (log + 15)/14) * plotH;
      return (i===0?'M':'L') + x + ' ' + y;
    }).join(' ');
    const p2 = document.createElementNS(SVG_NS, 'path');
    p2.setAttribute('d', path2);
    p2.setAttribute('stroke', '#ef4444');
    p2.setAttribute('fill', 'none');
    svg2.appendChild(p2);

    const caption1 = document.createElementNS(SVG_NS, 'text');
    caption1.setAttribute('x', String(width - 4));
    caption1.setAttribute('y', String(height - 8));
    caption1.setAttribute('text-anchor', 'end');
    caption1.setAttribute('font-size', '11');
    caption1.setAttribute('fill', '#475569');
    caption1.textContent = 'Blue: received power vs distance';
    svg1.appendChild(caption1);

    const caption2 = document.createElementNS(SVG_NS, 'text');
    caption2.setAttribute('x', String(width - 4));
    caption2.setAttribute('y', String(height - 8));
    caption2.setAttribute('text-anchor', 'end');
    caption2.setAttribute('font-size', '11');
    caption2.setAttribute('fill', '#475569');
    caption2.textContent = 'Red: BER trend (pre-FEC)';
    svg2.appendChild(caption2);
  }

  function sumField(field){
    // Sum selected models only
    let sum = 0;
    for(const c of state.db.categories){
      const selectedId = state.selection[c.type];
      const m = c.models.find(mm => mm.id === selectedId) || c.models[0];
      if(m && typeof m[field] === 'number') sum += m[field];
    }
    return Number(sum.toFixed(3));
  }

  function selectedDb(){
    // Build a db-like object containing only the selected model per category
    return {
      categories: state.db.categories.map(c => ({
        type: c.type,
        models: [ c.models.find(m => m.id === state.selection[c.type]) || c.models[0] ]
      }))
    };
  }

  function getSelected(type){
    const cat = state.db.categories.find(c => c.type === type);
    if(!cat) return null;
    const id = state.selection[type];
    return cat.models.find(m => m.id === id) || null;
  }

  // Ensure selection includes new categories with defaults
  function ensureDefaults(){
    if(!state.db || !state.db.categories) return;
    for(const cat of state.db.categories){
      if(!state.selection[cat.type] && cat.models && cat.models.length){
        state.selection[cat.type] = cat.models[0].id;
      }
    }
  }

  function groupTop(label, columnDef){
    const idx = columnDef.groups.findIndex(g => g.label === label);
    if(idx < 0) return 0;
    return 60 + idx * 140;
  }

  function getColumnLayouts(txColumn, rxColumn){
    const txLaunch = groupTop('Launch Optics', txColumn);
    const rxDetector = groupTop('Detector & Front-End', rxColumn);
    return { txLaunch, rxDetector };
  }

  function synthesizeJitterSeries(config, totalFrames){
    const { sigma_mrad, bandwidth_hz } = config;
    const sigma_rad = (sigma_mrad || 0) / 1000;
    const bw = Math.max(bandwidth_hz || 5, 0.5);
    const dt = 1/60;
    const alpha = Math.exp(-2*Math.PI*bw*dt);
    const out = [];
    let stateVal = sigma_rad * (Math.random()-0.5);
    for(let i=0;i<totalFrames;i++){
      const noise = sigma_rad * (Math.random()-Math.random());
      stateVal = alpha * stateVal + (1-alpha) * noise;
      out.push(stateVal * (state.beam.distance_m || 0));
    }
    return out;
  }

  function computePointingResidual(){
    const res = state.metrics.controlResidual;
    if(res) return res;
    const ctrl = state.metrics.controlRaw;
    if(ctrl){
      const sigma = state.config.channel.pointing_jitter_mrad_rms || 0.2;
      return {
        tx: { sigma_mrad: sigma * 0.5, bandwidth_hz: ctrl.gimbal_bw_hz || 10 },
        rx: { sigma_mrad: sigma * 0.5, bandwidth_hz: ctrl.fsm_bw_hz || 50 }
      };
    }
    const sigma = state.config.channel.pointing_jitter_mrad_rms || 0.2;
    return {
      tx: { sigma_mrad: sigma, bandwidth_hz: 5 },
      rx: { sigma_mrad: sigma, bandwidth_hz: 20 }
    };
  }

  function gaussianCaptureFraction(offset_m, profile){
    if(!profile || !profile.geometry) return 1;
    const w_m = Math.max(profile.geometry.beam_radius_at_end_m || 0, 1e-9);
    const a_m = Math.max(profile.geometry.lens_radius_at_end_m || 0, 0);
    if(a_m <= 0) return 0;
    const encircled = 1 - Math.exp(-2 * Math.pow(a_m / w_m, 2));
    const shiftPenalty = Math.exp(-2 * Math.pow(offset_m / w_m, 2));
    return Math.min(1, Math.max(0, encircled * shiftPenalty));
  }

  function updateBeamCaptureReadout(profile, offset_m){
    const readout = document.getElementById('beamCaptureReadout');
    if(!readout) return;
    const frac = gaussianCaptureFraction(offset_m || 0, profile);
    readout.textContent = `Capture: ${(frac * 100).toFixed(1)}%`;
    readout.classList.toggle('low-capture', frac < 0.2);
    state.beam.capture.fraction = frac;
    state.beam.capture.history.push({ at: performance.now(), frac });
    const cutoff = performance.now() - 3000;
    state.beam.capture.history = state.beam.capture.history.filter(item => item.at >= cutoff);
    return frac;
  }

  function checkAlignmentLock(){
    const history = state.beam.capture.history || [];
    if(history.length === 0) return true;
    const avg = history.reduce((sum, item) => sum + item.frac, 0) / history.length;
    const locked = avg >= 0.2;
    state.beam.locked = locked;
    if(!locked && state.beam.autoAlign){
      state.beam.autoAlign = false;
      state.beam.jitterActive = false;
      const jitterToggle = document.getElementById('beamJitterToggle');
      const autoAlignToggle = document.getElementById('beamAutoAlign');
      jitterToggle && jitterToggle.classList.remove('active');
      autoAlignToggle && (autoAlignToggle.checked = false);
      stopBeamJitter();
      addWarning('Alignment lost: auto-align disabled due to low capture.');
    }
    return locked;
  }

  function addWarning(msg){
    state.ui = state.ui || {};
    state.ui.extraWarnings = state.ui.extraWarnings || [];
    if(!state.ui.extraWarnings.includes(msg)){
      state.ui.extraWarnings.push(msg);
    }
  }
})();


