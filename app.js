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
      alignment_mode: 'dual_lambda'
    },
    channel: {
      atmospheric_alpha_db_per_km: 0.2,
      Cn2: 1e-14,
      pointing_jitter_mrad_rms: 0.2,
      wind_mps: 5
    }
  };

  // Init
  window.addEventListener('load', async () => {
    // Load DB from embedded script to avoid file:// fetch CORS
    state.db = (window.COMPONENTS_DB) ? window.COMPONENTS_DB : { categories: [] };
    // Keep a snapshot of initial DB for revert
    state.initialDb = JSON.parse(JSON.stringify(state.db));
    state.config = loadSession() || defaultConfig;
    bindToolbar();
    initSelectionFromDb();
    renderPartsList();
    renderAll();
  });

  function initSelectionFromDb(){
    // Initialize selection to first model in each category if not present
    for(const cat of state.db.categories){
      if(!state.selection[cat.type] && cat.models && cat.models.length){
        state.selection[cat.type] = cat.models[0].id;
      }
    }
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

    const maybeRender = () => { if(autoUpdate && autoUpdate.checked){ renderPartsList(); renderAll(); } };
    const forceRun = () => { renderPartsList(); renderAll(); };
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
  }

  function renderPartsList(){
    const list = document.getElementById('partsList');
    list.innerHTML = '';
    for(const cat of state.db.categories){
      const h = document.createElement('div');
      h.className = 'cat';
      const title = document.createElement('h4');
      title.textContent = cat.type;
      h.appendChild(title);
      for(const m of cat.models){
        const item = document.createElement('div');
        const compatible = isCompatible(cat.type, m);
        item.className = 'part' + (state.selection[cat.type] === m.id ? ' selected' : '') + (compatible ? '' : ' incompatible');
        item.textContent = m.id;
        item.title = JSON.stringify(m);
        item.addEventListener('click', () => {
          if(!isCompatible(cat.type, m)) return;
          state.selection[cat.type] = m.id;
          saveSession();
          renderPartsList();
          renderInspector(cat.type, m);
          renderAll();
        });
        h.appendChild(item);
      }
      list.appendChild(h);
    }
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
    if(type === 'receiver_array' || type === 'aspheric_collimator' || type === 'grin_collimator' || type === 'tx_telescope' || type === 'tosa_type' || type === 'optical_isolator' || type === 'interference_filter'){
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
        ] : [])
      ];
      for(const f of fields){
        const wrap = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = f.k + ': ';
        const input = document.createElement('input');
        input.type = 'number';
        input.step = String(f.step);
        input.value = String(model[f.k] != null ? model[f.k] : '');
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
    // Root group for pan/zoom
    const gRoot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gRoot.setAttribute('transform', `translate(${state.canvas.panX},${state.canvas.panY}) scale(${state.canvas.zoom})`);
    svg.appendChild(gRoot);
    // simple distance scale
    const axisY = height - 40;
    const scale = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    scale.setAttribute('x1', '40');
    scale.setAttribute('y1', String(axisY));
    scale.setAttribute('x2', String(width - 40));
    scale.setAttribute('y2', String(axisY));
    scale.setAttribute('stroke', '#0f172a');
    scale.setAttribute('stroke-width', '2');
    scale.setAttribute('opacity', '0.6');
    gRoot.appendChild(scale);
    // axis ticks and labels (0 to current distance)
    const Lcurr = Math.max(state.config.global.distance_m, 1);
    const tickN = 10;
    for(let i=0;i<=tickN;i++){
      const t = i/tickN;
      const x = 40 + t * (width - 80);
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', String(x));
      tick.setAttribute('y1', String(axisY));
      tick.setAttribute('x2', String(x));
      tick.setAttribute('y2', String(axisY + (i%5===0?8:4)));
      tick.setAttribute('stroke', '#0f172a');
      tick.setAttribute('opacity', '0.5');
      gRoot.appendChild(tick);
      if(i%5===0){
        const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        lbl.setAttribute('x', String(x));
        lbl.setAttribute('y', String(axisY + 20));
        lbl.setAttribute('text-anchor', 'middle');
        lbl.setAttribute('font-size', '11');
        lbl.setAttribute('fill', '#334155');
        lbl.textContent = (t * Lcurr / 1000).toFixed(2) + ' km';
        gRoot.appendChild(lbl);
      }
    }

    // beam envelope (triangle placeholder based on divergence)
    const L = state.config.global.distance_m; // map to canvas width
    const startXBeam = 80, startY = height/2;
    const endXBeam = width - 80;
    const pixelsPerMeter = (endXBeam - startXBeam) / Math.max(L, 1);
    // Use evaluator for divergence
    let evalRes = null;
    try { evalRes = window.Calc && window.Calc.Evaluator && window.Calc.Evaluator.evaluate(state.db, state.config); } catch(e){}
    const divergence_mrad = (evalRes && evalRes.divergence_mrad) || 0.5;
    const halfAngle = divergence_mrad / 1000.0; // rad
    const halfWidth = (L * halfAngle) * pixelsPerMeter;

    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', `${startXBeam},${startY} ${endXBeam},${startY - halfWidth} ${endXBeam},${startY + halfWidth}`);
    poly.setAttribute('fill', 'rgba(99, 102, 241, 0.15)');
    poly.setAttribute('stroke', 'rgba(99, 102, 241, 0.6)');
    gRoot.appendChild(poly);

    // Draw component nodes as two systems: TX (left cluster) and RX (right cluster)
    const { txNodes, rxNodes } = pipelineClusters();
    const baselineY = height/2;
    const startXNodes = 100;
    const endXNodes = width - 100;
    const clusterWidth = Math.max((endXNodes - startXNodes) * 0.32, 220);
    const txStart = startXNodes;
    const txEnd = txStart + clusterWidth;
    const rxEnd = endXNodes;
    const rxStart = Math.max(rxEnd - clusterWidth, txEnd + 120);
    const txStep = txNodes.length > 1 ? (txEnd - txStart) / (txNodes.length - 1) : 0;
    const rxStep = rxNodes.length > 1 ? (rxEnd - rxStart) / (rxNodes.length - 1) : 0;

    // Connector across free space
    const longConn = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    longConn.setAttribute('x1', String(txEnd));
    longConn.setAttribute('y1', String(baselineY));
    longConn.setAttribute('x2', String(rxStart));
    longConn.setAttribute('y2', String(baselineY));
    longConn.setAttribute('stroke', '#94a3b8');
    longConn.setAttribute('stroke-width', '2');
    longConn.setAttribute('stroke-dasharray', '10 6');
    gRoot.appendChild(longConn);

    // Free-space label
    const midX = (txEnd + rxStart) / 2;
    const fsLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    fsLabel.setAttribute('x', String(midX));
    fsLabel.setAttribute('y', String(baselineY - 16));
    fsLabel.setAttribute('text-anchor', 'middle');
    fsLabel.setAttribute('font-size', '12');
    fsLabel.setAttribute('fill', '#334155');
    fsLabel.textContent = 'Free Space ' + (state.config.global.distance_m/1000).toFixed(2) + ' km';
    gRoot.appendChild(fsLabel);

    // Render TX nodes
    txNodes.forEach((n, idx) => drawNode(n, txStart + idx*txStep, baselineY, gRoot));
    // Render RX nodes (right to left for connection order)
    rxNodes.forEach((n, idx) => drawNode(n, rxEnd - idx*rxStep, baselineY, gRoot));

    // Current distance marker and Max-reach marker on distance axis
    const selDb = selectedDb();
    const maxReach = computeMaxReachMeters(selDb, state.config);
    if(maxReach != null){
      const LmaxAxis = Math.max(Lcurr, maxReach);
      const scalePxPerM = (endXBeam - startXBeam) / LmaxAxis;
      // current distance
      const xc = startXBeam + Lcurr * scalePxPerM;
      const cmark = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      cmark.setAttribute('x1', String(xc));
      cmark.setAttribute('y1', String(axisY - 10));
      cmark.setAttribute('x2', String(xc));
      cmark.setAttribute('y2', String(axisY + 10));
      cmark.setAttribute('stroke', '#0ea5e9');
      cmark.setAttribute('stroke-width', '2');
      gRoot.appendChild(cmark);
      // max
      const xm = startXBeam + maxReach * scalePxPerM;
      const mark = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      mark.setAttribute('x1', String(xm));
      mark.setAttribute('y1', String(axisY - 20));
      mark.setAttribute('x2', String(xm));
      mark.setAttribute('y2', String(axisY + 20));
      mark.setAttribute('stroke', '#ef4444');
      mark.setAttribute('stroke-width', '2');
      gRoot.appendChild(mark);
      const mtext = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      mtext.setAttribute('x', String(xm));
      mtext.setAttribute('y', String(axisY - 26));
      mtext.setAttribute('text-anchor', 'middle');
      mtext.setAttribute('font-size', '12');
      mtext.setAttribute('fill', '#ef4444');
      mtext.textContent = 'Max reach ' + (maxReach/1000).toFixed(2) + ' km';
      gRoot.appendChild(mtext);
      // shade beyond max reach
      if(maxReach < Lcurr){
        const shade = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shade.setAttribute('x', String(xm));
        shade.setAttribute('y', '0');
        shade.setAttribute('width', String(Math.max(endXBeam - xm, 0)));
        shade.setAttribute('height', String(height));
        shade.setAttribute('fill', 'rgba(239, 68, 68, 0.06)');
        gRoot.appendChild(shade);
      }
    }

    // Bind pan/zoom once
    if(!state.canvas.bound){
      state.canvas.bound = true;
      svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = svg.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const prevZoom = state.canvas.zoom;
        const factor = Math.exp(-e.deltaY * 0.001);
        const nextZoom = Math.min(5, Math.max(0.4, prevZoom * factor));
        // Zoom around mouse
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
        state.canvas.zoom = 1; state.canvas.panX = 0; state.canvas.panY = 0; renderCanvas();
      });
    }
  }

  function drawNode(n, x, y, root){
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('cursor', 'pointer');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const rw = 120, rh = 38;
    rect.setAttribute('x', String(x - rw/2));
    rect.setAttribute('y', String(y - rh/2));
    rect.setAttribute('width', String(rw));
    rect.setAttribute('height', String(rh));
    rect.setAttribute('rx', '6');
    rect.setAttribute('fill', '#ffffff');
    const selected = state.selection[n.type] === n.model.id;
    rect.setAttribute('stroke', selected ? '#6366f1' : '#64748b');
    rect.setAttribute('stroke-width', selected ? '2.5' : '1.5');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '12');
    text.setAttribute('fill', '#0f172a');
    text.textContent = n.label;
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = JSON.stringify(n.model);
    group.appendChild(rect);
    group.appendChild(text);
    group.appendChild(title);
    group.addEventListener('click', () => {
      state.selection[n.type] = n.model.id;
      saveSession();
      renderPartsList();
      renderInspector(n.type, n.model);
      renderAll();
    });
    root.appendChild(group);
  }

  function pipelineClusters(){
    const txTypes = ['tosa_type','tosa','aspheric_collimator','grin_collimator','tx_telescope','optical_isolator','filter_dichroic','voa','fsm','gimbal'];
    const rxTypes = ['receiver_objective','receiver_array','interference_filter','od_filter','tap_splitter','sensor_quad','photodiode','tia_model','tia','la_model','la_cdr','cdr_model','fec'];
    const txNodes = [];
    const rxNodes = [];
    for(const t of txTypes){ const m = getSelected(t); if(m) txNodes.push({ type: t, model: m, label: t.replace(/_/g,' ') }); }
    for(const t of rxTypes){ const m = getSelected(t); if(m) rxNodes.push({ type: t, model: m, label: t.replace(/_/g,' ') }); }
    return { txNodes, rxNodes };
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
    const box = document.getElementById('kpis');
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
    box.innerHTML = warnings.map(w => '<div class="warning">' + w + '</div>').join('') + '<pre>' + JSON.stringify(kpis, null, 2) + '</pre>';
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
      if(arr && arr.dual_lambda_ok === false) warns.push('Receiver array not rated for dual-λ operation');
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
    // Array gating: must have an objective or array (not both conflicting)
    if(getSelected('receiver_array') && getSelected('receiver_objective')){
      warns.push('Choose either a single receiver objective or a receiver array, not both.');
    }
    // If array selected, recommend combiner and mount
    if(getSelected('receiver_array') && !getSelected('optomech_mount')){
      warns.push('Receiver array selected: add an optomech mount for proper alignment.');
    }
    if(getSelected('receiver_array') && !getSelected('combiner')){
      warns.push('Receiver array selected: add a combiner to model splitter-tree IL.');
    }
    return warns;
  }

  function renderPlots(){
    const prxEl = document.getElementById('prxPlot');
    const berEl = document.getElementById('berPlot');
    prxEl.innerHTML = '';
    berEl.innerHTML = '';
    const width = prxEl.clientWidth || 300;
    const height = 100;
    const svg1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const svg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg1.setAttribute('width', String(width));
    svg1.setAttribute('height', String(height));
    svg2.setAttribute('width', String(width));
    svg2.setAttribute('height', String(height));
    prxEl.appendChild(svg1);
    berEl.appendChild(svg2);

    // Sweep distances
    const maxL = state.config.global.distance_m;
    const distances = [];
    for(let i=0;i<=20;i++) distances.push((i/20)*maxL);
    const selDb = selectedDb();
    const sweep = window.Calc.Evaluator.sweepPrx(selDb, state.config, distances);

    if(!sweep || !sweep.length) return;
    const prxVals = sweep.map(d => d.prx_dbm);
    const minPrx = Math.min(...prxVals);
    const maxPrx = Math.max(...prxVals);

    const margin = 20;
    const plotW = width - margin*2;
    const plotH = height - margin*2;

    const path = sweep.map((d,i) => {
      const x = margin + (d.L/maxL) * plotW;
      const y = margin + (1 - (d.prx_dbm - minPrx) / Math.max(maxPrx - minPrx, 1e-3)) * plotH;
      return (i===0?'M':'L') + x + ' ' + y;
    }).join(' ');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', path);
    p.setAttribute('stroke', '#0ea5e9');
    p.setAttribute('fill', 'none');
    svg1.appendChild(p);

    // BER curve: map margin to BER logarithmically
    const sens = window.Calc.Evaluator.evaluate(selDb, state.config).sens_dbm;
    const path2 = sweep.map((d,i) => {
      const x = margin + (d.L/maxL) * plotW;
      const marginDb = d.prx_dbm - sens;
      const ber = window.Calc.BER.estimatePreFecBer(marginDb, state.config.global.bitrate_gbps);
      const log = Math.log10(Math.max(ber, 1e-15)); // range [-15, -1]
      const y = margin + (1 - (log + 15)/14) * plotH;
      return (i===0?'M':'L') + x + ' ' + y;
    }).join(' ');
    const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p2.setAttribute('d', path2);
    p2.setAttribute('stroke', '#ef4444');
    p2.setAttribute('fill', 'none');
    svg2.appendChild(p2);
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
})();


