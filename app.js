(function(){
  'use strict';

  // App state
  const state = {
    db: null,
    config: null,
    selection: {
      // selected model id per category type
    }
  };
  // Canvas interaction state
  state.canvas = { zoom: 1, panX: 0, panY: 0, isPanning: false, lastX: 0, lastY: 0, bound: false };

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
        return `<div class="stage-card"><div class="stage-label">${stage.label}</div><div class="stage-gain">${delta} dB</div><div class="stage-power">${stage.p_in_dbm.toFixed(2)} → ${stage.p_out_dbm.toFixed(2)} dBm</div></div>`;
      }).join('');
    el.innerHTML = `<h4>Gain / Loss Chain</h4><div class="stage-container">${entries || '<p>All stages neutral.</p>'}</div>`;
  }

  function buildMaxDistanceSummary(res, selDb){
    const rawMax = computeMaxReachMeters(selDb, state.config);
    const maxReach = rawMax === null ? state.config.global.distance_m : rawMax;
    if(maxReach <= 0){
      return `<h4>Max Distance Explained</h4><p class="no-reach">The link budget never meets receiver sensitivity at any distance. Increase Tx power, reduce fixed losses, improve geometric capture, or choose a more sensitive receiver.</p>`;
    }
    const rows = [
      {k: 'Tx power (dBm)', v: res.ptx_dbm.toFixed(2)},
      {k: 'Total insertion (dB)', v: (-res.il_db).toFixed(2)},
      {k: 'Atmospheric loss (dB)', v: (-res.atm_db).toFixed(2)},
      {k: 'Scintillation margin (dB)', v: (-res.scin_db).toFixed(2)},
      {k: 'Pointing loss (dB)', v: (-res.point_db).toFixed(2)},
      {k: 'Geometric gain (dB)', v: res.geo_db.toFixed(2)},
      {k: 'Received power (dBm)', v: res.prx_dbm.toFixed(2)},
      {k: 'Sensitivity (dBm)', v: res.sens_dbm.toFixed(2)},
      {k: 'Margin (dB)', v: res.margin_db.toFixed(2)},
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
    if(type === 'receiver_array' || type === 'aspheric_collimator' || type === 'grin_collimator' || type === 'tx_telescope' || type === 'tosa_type' || type === 'optical_isolator' || type === 'interference_filter' || type === 'tosa'){
      const fields = [
        // receiver_array fields
        ...(type==='receiver_array' ? [
          {k:'sub_aperture_mm', step:0.1}, {k:'grid_rows', step:1}, {k:'grid_cols', step:1}, {k:'pitch_mm', step:0.1},
          {k:'fill_factor', step:0.01}, {k:'sampling_factor', step:0.01}, {k:'tilt_std_mrad', step:0.1}, {k:'flatness_um_rms', step:10}, {k:'offset_mrad', step:0.1}, {k:'aoa_extra_mrad', step:0.1}
        ] : []),
        // optics
        ...(type==='aspheric_collimator' ? [
          {k:'focal_length_mm', step:0.1}, {k:'na', step:0.01}, {k:'residual_divergence_mrad', step:0.1}, {k:'ar_wavelength_nm', step:1}
        ] : []),
        ...(type==='grin_collimator' ? [
          {k:'pitch', step:0.01}, {k:'working_distance_mm', step:0.1}, {k:'residual_divergence_mrad', step:0.1}, {k:'ar_center_nm', step:1}
        ] : []),
        ...(type==='tx_telescope' ? [
          {k:'aperture_mm', step:0.1}, {k:'magnification', step:0.1}, {k:'residual_divergence_mrad', step:0.01}
        ] : []),
        // TOSA type
        ...(type==='tosa_type' ? [
          {k:'extinction_ratio_db', step:0.1}, {k:'oma_dbm_max', step:0.1}
        ] : []),
        // Isolator
        ...(type==='optical_isolator' ? [
          {k:'isolation_db', step:0.1}, {k:'il_db', step:0.1}
        ] : []),
        // Interference filter
        ...(type==='interference_filter' ? [
          {k:'center_nm', step:1}, {k:'fwhm_nm', step:0.5}
        ] : []),
        // TOSA editable output power (dBm)
        ...(type==='tosa' ? [ {k:'optical_power_dbm', step:0.1, min:-10, max:20} ] : [])
      ];
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
    const svg = document.getElementById('beamCanvas');
    const { width, height } = svg.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${Math.max(10,width)} ${Math.max(10,height)}`);
    svg.innerHTML = '';

    const root = document.createElementNS(SVG_NS, 'g');
    root.setAttribute('transform', `translate(${state.canvas.panX},${state.canvas.panY}) scale(${state.canvas.zoom})`);
    svg.appendChild(root);

    const selDb = selectedDb();
    const evalRes = (window.Calc && window.Calc.Evaluator) ? window.Calc.Evaluator.evaluate(selDb, state.config) : null;
    const stageRes = (window.Calc && window.Calc.Evaluator) ? window.Calc.Evaluator.buildStageBreakdown(selDb, state.config) : null;

    const cardWidth = 240;
    const outerMargin = 80;
    const axisStart = outerMargin + cardWidth;
    const axisEnd = Math.max(axisStart + 260, width - (outerMargin + cardWidth));
    const axisY = height - 70;
    let baselineY = outerMargin + 60;

    const rawMaxReach = computeMaxReachMeters(selDb, state.config);
    const maxReach = rawMaxReach === null ? state.config.global.distance_m : Math.max(rawMaxReach, 0);
    const effectiveRange = Math.max(maxReach, 1);
    const span = axisEnd - axisStart;
    const scaledReach = maxReach > 0 ? Math.min(maxReach / effectiveRange, 1) : 0;
    const rxPhysicalX = axisStart + scaledReach * span;

    const txColumn = COLUMN_LAYOUT.find(c => c.id === 'tx');
    const channelColumn = COLUMN_LAYOUT.find(c => c.id === 'channel');
    const rxColumn = COLUMN_LAYOUT.find(c => c.id === 'rx');

    const launchY = groupTop('Launch Optics', txColumn);
    const detectorY = groupTop('Detector & Front-End', rxColumn);
    if(launchY && detectorY){
      baselineY = Math.max(outerMargin + 40, Math.min(launchY, detectorY) - 20);
    }

    // Draw channel background first so the beam overlays it
    drawChannel(root, channelColumn, axisStart, axisEnd - axisStart, baselineY, evalRes, stageRes, true);

    drawDistanceAxis(root, axisStart, axisEnd, axisY, evalRes, maxReach);
    let beamEndX = axisStart + span;
    if(maxReach > 0){
      beamEndX = Math.max(rxPhysicalX, axisStart + 12);
    }
    drawBeamEnvelope(root, axisStart, beamEndX, baselineY, evalRes, maxReach);

    // TX total output label at the left above the start line
    if(evalRes){
      const ptx = document.createElementNS(SVG_NS, 'text');
      ptx.setAttribute('x', String(axisStart - 8));
      ptx.setAttribute('y', String(baselineY - 36));
      ptx.setAttribute('text-anchor', 'end');
      ptx.setAttribute('font-size', '12');
      ptx.setAttribute('fill', '#0f172a');
      ptx.textContent = 'TX output: ' + evalRes.ptx_dbm.toFixed(1) + ' dBm';
      root.appendChild(ptx);
    }
    drawColumn(root, txColumn, axisStart, baselineY, evalRes, stageRes, { align: 'right', theme: 'tx' });
    drawColumn(root, rxColumn, axisEnd, baselineY, evalRes, stageRes, { align: 'left', theme: 'rx' });

    bindCanvasInteractions(svg);
  }

  function drawDistanceAxis(root, xStart, xEnd, axisY, evalRes, maxReach){
    const Lcurr = Math.max(state.config.global.distance_m, 1);
    const effectiveRange = Math.max(maxReach, 1);

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(xStart));
    line.setAttribute('y1', String(axisY));
    line.setAttribute('x2', String(xEnd));
    line.setAttribute('y2', String(axisY));
    line.setAttribute('stroke', '#0f172a');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('opacity', '0.6');
    root.appendChild(line);

    const ticks = 4;
    for(let i=0;i<=ticks;i++){
      const t = i / ticks;
      const x = xStart + t * (xEnd - xStart);
      const tick = document.createElementNS(SVG_NS, 'line');
      tick.setAttribute('x1', String(x));
      tick.setAttribute('y1', String(axisY));
      tick.setAttribute('x2', String(x));
      tick.setAttribute('y2', String(axisY + (i % ticks === 0 ? 12 : 6)));
      tick.setAttribute('stroke', '#0f172a');
      tick.setAttribute('opacity', '0.4');
      root.appendChild(tick);
      const lbl = document.createElementNS(SVG_NS, 'text');
      lbl.setAttribute('x', String(x));
      lbl.setAttribute('y', String(axisY + 28));
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('font-size', '11');
      lbl.setAttribute('fill', '#334155');
      lbl.textContent = (t * effectiveRange / 1000).toFixed(2) + ' km';
      root.appendChild(lbl);
    }

    const scalePxPerM = (xEnd - xStart) / effectiveRange;
    const xc = xStart + Math.min(Lcurr, effectiveRange) * scalePxPerM;
    const xm = xStart + Math.min(maxReach, effectiveRange) * scalePxPerM;

    const current = document.createElementNS(SVG_NS, 'line');
    current.setAttribute('x1', String(xc));
    current.setAttribute('y1', String(axisY - 12));
    current.setAttribute('x2', String(xc));
    current.setAttribute('y2', String(axisY + 12));
    current.setAttribute('stroke', '#0ea5e9');
    current.setAttribute('stroke-width', '2');
    root.appendChild(current);

    const marker = document.createElementNS(SVG_NS, 'line');
    marker.setAttribute('x1', String(xm));
    marker.setAttribute('y1', String(axisY - 18));
    marker.setAttribute('x2', String(xm));
    marker.setAttribute('y2', String(axisY + 18));
    marker.setAttribute('stroke', '#ef4444');
    marker.setAttribute('stroke-width', '2.5');
    root.appendChild(marker);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', String(xm));
    label.setAttribute('y', String(axisY - 24));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '12');
    label.setAttribute('fill', '#ef4444');
    label.textContent = 'Max reach ' + (maxReach/1000).toFixed(2) + ' km';
    root.appendChild(label);

    if(maxReach < Lcurr){
      const shade = document.createElementNS(SVG_NS, 'rect');
      shade.setAttribute('x', String(xm));
      shade.setAttribute('y', '0');
      shade.setAttribute('width', String(Math.max(xEnd - xm, 0)));
      shade.setAttribute('height', String(axisY - 20));
      shade.setAttribute('fill', 'rgba(239, 68, 68, 0.06)');
      root.appendChild(shade);
    }

    if(evalRes && evalRes.margin_db != null){
      const marginNote = document.createElementNS(SVG_NS, 'text');
      marginNote.setAttribute('x', String(xm - 8));
      marginNote.setAttribute('y', String(axisY - 40));
      marginNote.setAttribute('text-anchor', 'end');
      marginNote.setAttribute('font-size', '11');
      marginNote.setAttribute('fill', evalRes.margin_db >= 0 ? '#15803d' : '#b91c1c');
      marginNote.textContent = 'Margin @ current: ' + evalRes.margin_db.toFixed(2) + ' dB';
      root.appendChild(marginNote);
    }
  }

  function drawBeamEnvelope(root, txAnchor, rxAnchor, baselineY, evalRes, maxReach){
    if(!evalRes){ return; }
    const divergence = evalRes.divergence_mrad || 0.5;
    const halfAngle = divergence / 1000;
    const span = Math.max(rxAnchor - txAnchor, 1);
    const beamWidth = Math.max((maxReach || 1) * halfAngle * (span / Math.max(maxReach || 1, 1)), 6);
    const inset = span * 0.03;
    const startX = txAnchor + inset;
    const endX = rxAnchor - inset;
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', `${startX},${baselineY} ${endX},${baselineY - beamWidth} ${endX},${baselineY + beamWidth}`);
    poly.setAttribute('fill', 'rgba(59, 130, 246, 0.08)');
    poly.setAttribute('stroke', 'rgba(59, 130, 246, 0.45)');
    poly.setAttribute('stroke-width', '2');
    root.appendChild(poly);

    const lens = drawReceiverLens(endX, baselineY, evalRes);
    if(lens) root.appendChild(lens);
  }

  function drawReceiverLens(x, baselineY, evalRes){
    const rxObjective = getSelected('receiver_objective');
    const rxArray = getSelected('receiver_array');
    const hasArray = rxArray && hasActiveArray(rxArray);
    const diameter = hasArray ? (Number(rxArray.envelope_diameter_mm || rxArray.envelope_width_mm || 100) * 1e-3) : (rxObjective ? (rxObjective.aperture_mm || 100) * 1e-3 : 0);
    if(diameter <= 0) return null;

    const beamRadius = evalRes ? evalRes.beam_radius_m : 0.1;
    const captureRatio = Math.min(diameter / (beamRadius * 2), 1);
    const outline = document.createElementNS(SVG_NS, 'g');
    const lensRadiusPx = 40 * captureRatio;

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(x));
    circle.setAttribute('cy', String(baselineY));
    circle.setAttribute('r', String(lensRadiusPx));
    circle.setAttribute('fill', 'rgba(13, 148, 136, 0.18)');
    circle.setAttribute('stroke', 'rgba(13, 148, 136, 0.6)');
    circle.setAttribute('stroke-width', '2');
    outline.appendChild(circle);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('class', 'receiver-lens-label');
    label.setAttribute('x', String(x));
    label.setAttribute('y', String(baselineY + lensRadiusPx + 14));
    label.setAttribute('text-anchor', 'middle');
    label.textContent = hasArray ? `${rxArray.count || 0} lens array (${Math.round(diameter*1000)} mm footprint)` : `${Math.round(diameter*1000)} mm lens`;
    outline.appendChild(label);
    return outline;
  }

  function drawColumn(root, columnDef, anchorX, baselineY, evalRes, stageRes, opts){
    if(!columnDef) return;
    const align = (opts && opts.align) || 'left';
    const theme = (opts && opts.theme) || 'tx';
    const columnWidth = 240;
    const boxPadding = 14;
    const titleOffset = 28;
    const cardHeight = 96;
    const cardGap = 10;
    const groupGap = 32;
    const x = align === 'right' ? anchorX - columnWidth : anchorX;
    let yCursor = baselineY;

    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', String(x));
    title.setAttribute('y', String(yCursor - 22));
    title.setAttribute('text-anchor', 'start');
    title.setAttribute('font-size', '15');
    title.setAttribute('fill', theme === 'tx' ? '#2563eb' : '#0f766e');
    title.setAttribute('font-weight', '700');
    title.textContent = columnDef.label;
    root.appendChild(title);

    const stageList = stageRes && stageRes.stages ? stageRes.stages : [];

    columnDef.groups.forEach(group => {
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

      const count = components.length;
      const box = document.createElementNS(SVG_NS, 'rect');
      const boxY = yCursor;
      const boxH = boxPadding * 2 + titleOffset + count * cardHeight + Math.max(0, count - 1) * cardGap;
      box.setAttribute('x', String(x));
      box.setAttribute('y', String(boxY));
      box.setAttribute('width', String(columnWidth));
      box.setAttribute('height', String(boxH));
      box.setAttribute('rx', '12');
      box.setAttribute('fill', theme === 'tx' ? 'rgba(59,130,246,0.06)' : 'rgba(20,184,166,0.08)');
      box.setAttribute('stroke', theme === 'tx' ? 'rgba(59,130,246,0.35)' : 'rgba(13,148,136,0.35)');
      root.appendChild(box);

      const gTitle = document.createElementNS(SVG_NS, 'text');
      gTitle.setAttribute('x', String(x + boxPadding));
    gTitle.setAttribute('y', String(boxY + boxPadding + 12));
      gTitle.setAttribute('text-anchor', 'start');
      gTitle.setAttribute('font-size', '12');
      gTitle.setAttribute('font-weight', '600');
      gTitle.setAttribute('fill', '#1e293b');
      gTitle.textContent = group.label;
      root.appendChild(gTitle);

      let cardY = boxY + boxPadding + titleOffset;
      components.forEach((c, idx) => {
        const comp = c.type ? getSelected(c.type) : null;
        const stage = c.stageType ? stageList.find(s => s.type === c.stageType) : null;
        drawComponentCard(root, {
          x: x + boxPadding,
          y: cardY,
          width: columnWidth - boxPadding * 2,
          label: c.label,
          model: comp,
          stage,
          type: c.type,
          theme
        });
        cardY += cardHeight + cardGap;
      });

      yCursor += boxH + groupGap;
    });
  }

  function drawChannel(root, columnDef, x, width, baselineY, evalRes, stageRes, isBackground){
    if(!columnDef) return;
    const budgetStages = stageRes && stageRes.stages ? stageRes.stages : [];
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', 'channel-layer');
    if(isBackground && root.firstChild){
      root.insertBefore(group, root.firstChild);
    } else {
      root.appendChild(group);
    }

    const panel = document.createElementNS(SVG_NS, 'rect');
    const startY = baselineY;
    panel.setAttribute('x', String(x));
    panel.setAttribute('y', String(startY));
    panel.setAttribute('width', String(width));
    panel.setAttribute('height', String(220));
    panel.setAttribute('rx', '18');
    panel.setAttribute('fill', '#fde1d2');
    panel.setAttribute('stroke', 'rgba(217,119,6,0.3)');
    group.appendChild(panel);

    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', String(x + width/2));
    title.setAttribute('y', String(startY - 12));
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '13');
    title.setAttribute('font-weight', '600');
    title.setAttribute('fill', '#b45309');
    title.textContent = columnDef.label;
    group.appendChild(title);

    let stageIdx = 0;
    columnDef.groups.forEach(groupDef => {
      groupDef.components.forEach(comp => {
        const stage = comp.stageType ? budgetStages.find(s => s.type === comp.stageType) : null;
        const cardWidth = width - 34;
        const cardX = x + 17;
        const cardY = startY + 40 + stageIdx * 52;
        stageIdx++;

        const card = document.createElementNS(SVG_NS, 'rect');
        card.setAttribute('x', String(cardX));
        card.setAttribute('y', String(cardY));
        card.setAttribute('width', String(cardWidth));
        card.setAttribute('height', '44');
        card.setAttribute('rx', '12');
        card.setAttribute('fill', 'rgba(255,255,255,0.9)');
        card.setAttribute('stroke', 'rgba(217,119,6,0.35)');
        group.appendChild(card);

        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', String(cardX + 12));
        text.setAttribute('y', String(cardY + 20));
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', '#0f172a');
        text.textContent = comp.label;
        group.appendChild(text);

        if(stage){
          const delta = stage.delta_db;
          const gain = document.createElementNS(SVG_NS, 'text');
          gain.setAttribute('x', String(cardX + cardWidth - 12));
          gain.setAttribute('y', String(cardY + 20));
          gain.setAttribute('text-anchor', 'end');
          gain.setAttribute('font-size', '12');
          gain.setAttribute('fill', delta >= 0 ? '#15803d' : '#b91c1c');
          gain.textContent = (delta >= 0 ? '+' : '') + delta.toFixed(2) + ' dB';
          group.appendChild(gain);

          const power = document.createElementNS(SVG_NS, 'text');
          power.setAttribute('x', String(cardX + cardWidth - 12));
          power.setAttribute('y', String(cardY + 34));
          power.setAttribute('text-anchor', 'end');
          power.setAttribute('font-size', '10');
          power.setAttribute('fill', '#475569');
          power.textContent = `${stage.p_in_dbm.toFixed(1)} → ${stage.p_out_dbm.toFixed(1)} dBm`;
          group.appendChild(power);
        }
      });
    });

    root.appendChild(group);
  }

  function drawComponentCard(root, cfg){
    const { x, y, width, label, model, stage, type, theme } = cfg;
    const cardHeight = 96;
    const card = document.createElementNS(SVG_NS, 'rect');
    card.setAttribute('x', String(x));
    card.setAttribute('y', String(y));
    card.setAttribute('width', String(width));
    card.setAttribute('height', String(cardHeight));
    card.setAttribute('rx', '10');
    card.setAttribute('fill', '#ffffff');
    card.setAttribute('stroke', theme === 'rx' ? 'rgba(20,184,166,0.4)' : 'rgba(59,130,246,0.4)');
    root.appendChild(card);

    const content = document.createElementNS(SVG_NS, 'foreignObject');
    content.setAttribute('x', String(x + 6));
    content.setAttribute('y', String(y + 6));
    content.setAttribute('width', String(width - 12));
    content.setAttribute('height', String(cardHeight - 12));

    const body = document.createElement('div');
    body.className = 'card-content';

    const header = document.createElement('div');
    header.className = 'card-header';
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = model ? `${label} • ${model.id}` : label;
    header.appendChild(title);

    const gains = document.createElement('div');
    gains.className = 'card-gains';
    if(stage){
      const gainLine = document.createElement('div');
      gainLine.className = 'gain ' + (stage.delta_db >= 0 ? 'positive' : '');
      gainLine.textContent = (stage.delta_db >= 0 ? '+' : '') + stage.delta_db.toFixed(2) + ' dB';
      gains.appendChild(gainLine);
      const powerLine = document.createElement('div');
      powerLine.className = 'power';
      powerLine.textContent = `${stage.p_in_dbm.toFixed(1)} → ${stage.p_out_dbm.toFixed(1)} dBm`;
      gains.appendChild(powerLine);
    }
    header.appendChild(gains);
    body.appendChild(header);

    const meta = document.createElement('div');
    meta.className = 'card-body';
    if(model && type === 'receiver_array' && hasActiveArray(model)){
      meta.textContent = `${Number(model.count||0)} elements • ${Number(model.sub_aperture_mm||0)} mm • fill ${Math.round((model.fill_factor||0)*100)}%`;
    } else if(model){
      meta.textContent = model.tool_tip || 'Selected component';
    } else {
      meta.textContent = 'Not selected';
    }
    body.appendChild(meta);

    content.appendChild(body);
    root.appendChild(content);

    const hitBox = document.createElementNS(SVG_NS, 'rect');
    hitBox.setAttribute('x', String(x));
    hitBox.setAttribute('y', String(y));
    hitBox.setAttribute('width', String(width));
    hitBox.setAttribute('height', String(cardHeight));
    hitBox.setAttribute('fill', 'transparent');
    hitBox.setAttribute('cursor', type && model ? 'pointer' : 'default');
    if(type && model){
      hitBox.addEventListener('click', () => {
        state.selection[type] = model.id;
        saveSession();
        renderPartsList();
        renderInspector(type, model);
        renderAll();
      });
    }
    root.appendChild(hitBox);
  }

  function bindCanvasInteractions(svg){
    if(state.canvas.bound) return;
    state.canvas.bound = true;
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const prevZoom = state.canvas.zoom;
      const factor = Math.exp(-e.deltaY * 0.001);
      const nextZoom = Math.min(5, Math.max(0.4, prevZoom * factor));
      const worldX = (mx - state.canvas.panX) / prevZoom;
      const worldY = (my - state.canvas.panY) / prevZoom;
      state.canvas.zoom = nextZoom;
      state.canvas.panX = mx - worldX * nextZoom;
      state.canvas.panY = my - worldY * nextZoom;
      renderCanvas();
    }, { passive: false });

    svg.addEventListener('mousedown', (e) => {
      state.canvas.isPanning = true;
      state.canvas.lastX = e.clientX;
      state.canvas.lastY = e.clientY;
      svg.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if(!state.canvas.isPanning) return;
      const dx = e.clientX - state.canvas.lastX;
      const dy = e.clientY - state.canvas.lastY;
      state.canvas.lastX = e.clientX;
      state.canvas.lastY = e.clientY;
      state.canvas.panX += dx;
      state.canvas.panY += dy;
      renderCanvas();
    });

    window.addEventListener('mouseup', () => {
      state.canvas.isPanning = false;
      svg.style.cursor = 'default';
    });

    svg.addEventListener('dblclick', () => {
      state.canvas.zoom = 1;
      state.canvas.panX = 0;
      state.canvas.panY = 0;
      renderCanvas();
    });
  }

  function computeMaxReachMeters(selDb, config){
    try{
      const eval0 = window.Calc && window.Calc.Evaluator && window.Calc.Evaluator.evaluate(selDb, config);
      if(!eval0) return null;
      const sens = eval0.sens_dbm;
      const fecId = config.global.fec_model;
      const fec = (state.db.categories.find(c => c.type==='fec')||{models:[]}).models.find(m => m.id===fecId);
      const cg = fec && fec.coding_gain_db ? Number(fec.coding_gain_db) : 0;
      const targetBer = config.global.target_ber || 1e-12;
      const okAt = (L) => {
        const cfg = JSON.parse(JSON.stringify(config));
        cfg.global.distance_m = Math.max(L, 0);
        const r = window.Calc.Evaluator.evaluate(selDb, cfg);
        const margin = r.prx_dbm - sens;
        const pre = window.Calc.BER.estimatePreFecBer(margin, cfg.global.bitrate_gbps);
        const post = window.Calc.BER.applyFecGain(pre, cg, cfg.global.bitrate_gbps);
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
      res.beam_radius_m,
      state.config.channel.pointing_jitter_mrad_rms,
      1.0
    ) : null;
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
    // combiner IL exposed in KPIs
    const rxArr = getSelected('receiver_array');
    const comb = getSelected('combiner');
    let combiner_il_db = rxArr ? (rxArr.combiner_il_db || 0) : 0;
    if(rxArr && comb && (comb.base_il_db != null) && (comb.per_stage_il_db != null)){
      const stages = Math.ceil(Math.log2(Math.max(rxArr.count||1,1)));
      combiner_il_db = comb.base_il_db + comb.per_stage_il_db * stages;
    }
    const fsm = getSelected('fsm');
    const gim = getSelected('gimbal');
    const fsmOk = fsm ? (fsm.bandwidth_hz >= (ctrl ? ctrl.fsm_bw_hz : 0) && fsm.resolution_urad <= (ctrl ? ctrl.resolution_urad : Infinity) && fsm.range_mrad >= (ctrl ? ctrl.range_mrad : 0)) : true;
    const gimOk = gim ? (gim.bandwidth_hz >= (ctrl ? ctrl.gimbal_bw_hz : 0) && gim.resolution_mrad <= (ctrl ? ctrl.range_mrad : Infinity)) : true;
    const kpis = {
      cost_usd: sumField('cost_usd'),
      weight_g: sumField('weight_g'),
      power_w: sumField('power_w'),
      prx_dbm_at_distance: res ? Number(res.prx_dbm.toFixed(2)) : null,
      sensitivity_dbm: res ? res.sens_dbm : null,
      link_margin_db: res ? Number(res.margin_db.toFixed(2)) : null,
      ber_prefec: res ? berPreFec(res.margin_db) : null,
      ber_postfec: res ? berPostFec(res.margin_db) : null,
      divergence_mrad: res ? Number(res.divergence_mrad.toFixed(3)) : null,
      beam_radius_m: res ? Number(res.beam_radius_m.toFixed(3)) : null,
      atm_loss_db: res ? Number(res.atm_db.toFixed(2)) : null,
      pointing_loss_db: res ? Number(res.point_db.toFixed(2)) : null,
      scint_margin_db: res ? Number(res.scin_db.toFixed(2)) : null,
      geometric_coupling_db: res ? Number(res.geo_db.toFixed(2)) : null,
      combiner_il_db: Number(combiner_il_db.toFixed(2)),
      ctrl_required_sigma_mrad: ctrl ? Number(ctrl.required_sigma_mrad.toFixed(3)) : null,
      ctrl_fsm_bw_hz: ctrl ? ctrl.fsm_bw_hz : null,
      ctrl_gimbal_bw_hz: ctrl ? ctrl.gimbal_bw_hz : null,
      ctrl_resolution_urad: ctrl ? Number(ctrl.resolution_urad.toFixed(1)) : null,
      ctrl_range_mrad: ctrl ? Number(ctrl.range_mrad.toFixed(2)) : null,
      greenwood_hz: act ? act.greenwood_hz : null,
      target_gimbal_bw_hz: act ? act.gimbal_bw_hz : null,
      target_fsm_bw_hz: act ? act.fsm_bw_hz : null,
      residual_pointing_sigma_mrad_psd: psdRes ? Number(psdRes.sigma_mrad.toFixed(3)) : null,
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
    kpiBox.innerHTML = `<h4>Key Metrics</h4><div class="kpi-list">${rows}</div>`;

    if(maxPanel && res){
      maxPanel.innerHTML = buildMaxDistanceSummary(res, selDb);
    }
  }

  function berPreFec(margin_db){
    const br = state.config.global.bitrate_gbps;
    return Number(window.Calc.BER.estimatePreFecBer(margin_db, br).toExponential(2));
  }

  function berPostFec(margin_db){
    const br = state.config.global.bitrate_gbps;
    const fecId = state.config.global.fec_model;
    const fec = (state.db.categories.find(c => c.type==='fec')||{models:[]}).models.find(m => m.id===fecId);
    const cg = fec && fec.coding_gain_db ? Number(fec.coding_gain_db) : 0;
    const pre = window.Calc.BER.estimatePreFecBer(margin_db, br);
    const post = window.Calc.BER.applyFecGain(pre, cg, br);
    return Number(post.toExponential(2));
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
    const path2 = sweep.map((d,i) => {
      const x = margin + (d.L/maxL) * plotW;
      const marginDb = d.prx_dbm - sens;
      const ber = window.Calc.BER.estimatePreFecBer(marginDb, state.config.global.bitrate_gbps);
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
})();


