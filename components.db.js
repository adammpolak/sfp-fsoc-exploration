window.COMPONENTS_DB = {
  "schema_version": "0.1",
  "categories": [
    {"type": "tosa_type", "models": [
      {"id": "tosa-dfb-1550", "wavelength_nm": 1550, "extinction_ratio_db": 10, "oma_dbm_max": 3, "supports_bitrates": [0.1,1,10], "has_mpd": true, "requires_apc": true},
      {"id": "tosa-fp-1310", "wavelength_nm": 1310, "extinction_ratio_db": 7, "oma_dbm_max": 0, "supports_bitrates": [0.1,1], "has_mpd": true, "requires_apc": false},
      {"id": "tosa-vcsel-850", "wavelength_nm": 850, "extinction_ratio_db": 6, "oma_dbm_max": -1, "supports_bitrates": [0.1,1,10], "has_mpd": false, "requires_apc": false},
      {"id": "tosa-eml-1550", "wavelength_nm": 1550, "extinction_ratio_db": 12, "oma_dbm_max": 4, "supports_bitrates": [10], "has_mpd": true, "requires_apc": true},
      {"id": "real-lumentum-dfb-1550", "vendor": "Lumentum", "wavelength_nm": 1550, "extinction_ratio_db": 10, "oma_dbm_max": 3, "supports_bitrates": [1,10], "has_mpd": true, "requires_apc": true, "source_url": "https://www.lumentum.com"},
      {"id": "real-lumentum-eml-1550", "vendor": "Lumentum", "wavelength_nm": 1550, "extinction_ratio_db": 12, "oma_dbm_max": 4, "supports_bitrates": [10], "has_mpd": true, "requires_apc": true, "source_url": "https://www.lumentum.com"}
    ]},
    {"type": "optical_isolator", "models": [
      {"id": "iso-1550", "isolation_db": 35, "il_db": 0.6, "lambda_min_nm": 1500, "lambda_max_nm": 1600},
      {"id": "real-thorlabs-io-3-1550", "vendor": "Thorlabs", "isolation_db": 35, "il_db": 0.6, "lambda_min_nm": 1500, "lambda_max_nm": 1600, "connector": "FC/APC", "source_url": "https://www.thorlabs.com"}
    ]},
    {"type": "aspheric_collimator", "models": [
      {"id": "asp-4.5mm-1550", "focal_length_mm": 4.5, "na": 0.5, "ar_wavelength_nm": 1550, "residual_divergence_mrad": 2.0, "il_db": 0.3, "dual_lambda_ok": true},
      {"id": "real-thorlabs-f240fc-1550", "vendor": "Thorlabs", "focal_length_mm": 8.0, "na": 0.49, "ar_wavelength_nm": 1550, "residual_divergence_mrad": 0.5, "il_db": 0.3, "aperture_mm": 5.9, "dual_lambda_ok": true, "source_url": "https://www.thorlabs.com"}
    ]},
    {"type": "grin_collimator", "models": [
      {"id": "grin-0.25pitch-1.8mm", "pitch": 0.25, "diameter_mm": 1.8, "working_distance_mm": 4.5, "residual_divergence_mrad": 3.0, "il_db": 0.5, "dual_lambda_ok": true},
      {"id": "real-thorlabs-grin-1p8-0p23", "vendor": "Thorlabs", "pitch": 0.23, "diameter_mm": 1.8, "working_distance_mm": 0.5, "residual_divergence_mrad": 2.0, "il_db": 0.5, "ar_center_nm": 1550, "dual_lambda_ok": true, "source_url": "https://www.thorlabs.com"}
    ]},
    {"type": "tx_telescope", "models": [
      {"id": "tx-tel-5x-20mm", "aperture_mm": 20, "magnification": 5, "residual_divergence_mrad": 0.2, "throughput": 0.9}
    ]},
    {"type": "voa", "models": [
      {"id": "voa-0-10db-1550", "range_db": 10, "il_db": 0.6, "wavelength_nm": 1550}
    ]},
    {"type": "safety_shutter", "models": [
      {"id": "shutter-basic", "attenuation_closed_db": 25, "ar_db": 0.3, "sealed": true}
    ]},
    {"type": "apc", "models": [
      {"id": "apc-std", "bandwidth_hz": 2000, "mpd_responsivity_mA_per_mW": 0.1, "range_mA": 50}
    ]},
    {"type": "bias_dac", "models": [
      {"id": "biasdac-10b", "bits": 10, "update_rate_hz": 100}
    ]},
    {"type": "mod_dac", "models": [
      {"id": "moddac-10b", "bits": 10, "update_rate_hz": 100}
    ]},
    {"type": "tec", "models": [
      {"id": "tec-1w", "deltaT_C": 30, "power_w": 1.0, "stability_C": 0.1}
    ]},
    {"type": "align_laser", "models": [
      {"id": "align-1310-0dbm", "wavelength_nm": 1310, "power_dbm": 0, "eye_class": "1M"}
    ]},
    {"type": "corner_cube", "models": [
      {"id": "cc-25mm", "aperture_mm": 25, "return_loss_db": 12}
    ]},
    {"type": "pilot_injector", "models": [
      {"id": "pilot-inj-1pct", "depth_percent_max": 1.0, "tones": [1000,2000]}
    ]},
    {"type": "pilot_demod", "models": [
      {"id": "pilot-demod-2khz", "bandwidth_hz": 3000, "noise_v_sqrtHz": 1e-9, "tool_tip": "Demodulates pilot tone for alignment."}
    ]},
    {"type": "interference_filter", "models": [
      {"id": "if-1550-3nm", "center_nm": 1550, "fwhm_nm": 3, "il_db": 0.6},
      {"id": "if-1310-3nm", "center_nm": 1310, "fwhm_nm": 3, "il_db": 0.6},
      {"id": "real-semrock-1550-3nm", "vendor": "Semrock", "center_nm": 1550, "fwhm_nm": 3, "il_db": 0.7, "source_url": "https://www.semrock.com"}
    ]},
    {"type": "od_filter", "models": [
      {"id": "od-2-1550", "od": 2, "center_nm": 1550, "bw_nm": 50}
    ]},
    {"type": "field_stop", "models": [
      {"id": "fs-5mm", "diameter_mm": 5}
    ]},
    {"type": "baffle", "models": [
      {"id": "baffle-basic", "stray_light_db": 10}
    ]},
    {"type": "window", "models": [
      {"id": "win-ar-1550", "ar_db": 0.3, "contamination_penalty_db": 0.2}
    ]},
    {"type": "photodiode", "models": [
      {"id": "pd-pin-60um", "pd_type": "pin", "diameter_um": 60, "C_pd_pF": 0.15, "responsivity_A_W": 0.9, "dark_current_nA": 3},
      {"id": "pd-apd-40um", "pd_type": "apd", "diameter_um": 40, "C_pd_pF": 0.2, "responsivity_A_W": 0.6, "apd_gain": 10, "excess_noise_F": 4, "dark_current_nA": 50},
      {"id": "real-hamamatsu-ingaas-pin-40um", "vendor": "Hamamatsu", "pd_type": "pin", "diameter_um": 40, "C_pd_pF": 0.15, "responsivity_A_W": 0.9, "dark_current_nA": 5, "bandwidth_ghz": 10, "source_url": "https://www.hamamatsu.com/jp/en/product/optical-sensors/photodiodes/index.html"}
    ]},
    {"type": "los_detector", "models": [
      {"id": "los-std", "threshold_dbm": -28}
    ]},
    {"type": "tia_model", "models": [
      {"id": "tia-7ghz-lownoise", "zt_ohms": 2500, "input_noise_A_sqrtHz": 3e-12, "bandwidth_ghz": 7, "agc": false},
      {"id": "real-adi-adn2882", "vendor": "Analog Devices", "zt_ohms": 1000, "input_noise_A_sqrtHz": 3e-12, "bandwidth_ghz": 7, "agc": true, "source_url": "https://www.analog.com"}
    ]},
    {"type": "la_model", "models": [
      {"id": "la-12ghz-20db", "gain_db": 20, "peaking_db": 2, "bandwidth_ghz": 12},
      {"id": "real-semtech-10g-la", "vendor": "Semtech", "gain_db": 20, "peaking_db": 3, "bandwidth_ghz": 12, "source_url": "https://www.semtech.com"}
    ]},
    {"type": "cdr_model", "models": [
      {"id": "cdr-1g-std", "bitrate_gbps": 1, "jitter_tolerance_ui_pp": 0.5, "loop_bw_mhz": 5, "ctle": true, "dfe": false},
      {"id": "cdr-10g-std", "bitrate_gbps": 10, "jitter_tolerance_ui_pp": 0.3, "loop_bw_mhz": 3, "ctle": true, "dfe": true},
      {"id": "real-semtech-10g-cdr", "vendor": "Semtech", "bitrate_gbps": 10, "jitter_tolerance_ui_pp": 0.3, "loop_bw_mhz": 3, "ctle": true, "dfe": true, "source_url": "https://www.semtech.com"}
    ]},
    {"type": "array_delay", "models": [
      {"id": "delay-ps-100", "ps_range": 100}
    ]},
    {"type": "digital_combiner", "models": [
      {"id": "combiner-select", "algorithm": "selection", "delay_align_ps": 100, "power_w": 1.0},
      {"id": "combiner-weighted", "algorithm": "weighted", "delay_align_ps": 200, "power_w": 1.5}
    ]},
    {"type": "expanded_beam", "models": [
      {"id": "ebo-mini", "beam_diameter_mm": 1.0, "divergence_mrad": 2.0, "il_db": 1.0, "rl_db": 35}
    ]},
    {"type": "laser_driver", "models": [{"id": "drv-abc123", "vendor": "ExampleCo", "bitrate_gbps_max": 10, "power_w": 0.4, "cost_usd": 12, "weight_g": 1.2}]},
    {"type": "tosa", "models": [{"id": "tosa-1550-0dbm", "wavelength_nm": 1550, "optical_power_dbm": 0, "supports_bitrates": [0.1, 1, 10], "power_w": 0.2, "cost_usd": 50, "weight_g": 1.8, "tool_tip": "DFB-based TOSA with 0 dBm launch."}]},
    {"type": "collimator", "models": [{"id": "col-grin-2mm", "aperture_mm": 2.0, "output_divergence_mrad": 5.0, "insertion_loss_db": 0.7, "power_w": 0, "cost_usd": 30, "weight_g": 1.0, "tool_tip": "Compact GRIN collimator for 1550 nm."}]},
    {"type": "beam_expander", "models": [{"id": "exp-5x-mini", "magnification": 5, "residual_divergence_mrad": 0.5, "insertion_loss_db": 0.5, "cost_usd": 80, "weight_g": 8, "tool_tip": "5× beam expander to reduce divergence."}]},
    {"type": "filter_dichroic", "models": [{"id": "dich-1310-1550", "lambda_pass_nm": 1310, "lambda_reflect_nm": 1550, "il_pass_db": 0.3, "il_reflect_db": 0.3, "cost_usd": 40, "weight_g": 2, "tool_tip": "Passes 1310 nm alignment and reflects 1550 nm data."}]},
    {"type": "tap_splitter", "models": [{"id": "tap-95-5", "ratio_main": 0.95, "ratio_tap": 0.05, "il_db": 0.5, "cost_usd": 20, "weight_g": 1.5, "tool_tip": "95/5 tap feeding alignment sensor."}]},
    {"type": "fsm", "models": [{"id": "fsm-1khz", "bandwidth_hz": 1000, "range_mrad": 5, "resolution_urad": 5, "latency_ms": 0.5, "power_w": 1.2, "cost_usd": 250, "weight_g": 25}, {"id": "real-mirrorcle-a7m20", "vendor": "Mirrorcle", "bandwidth_hz": 1000, "range_mrad": 7, "resolution_urad": 2, "latency_ms": 0.4, "power_w": 1.0, "cost_usd": 450, "weight_g": 20, "source_url": "https://www.mirrorcletech.com"}]},
    {"type": "gimbal", "models": [{"id": "gim-100hz", "bandwidth_hz": 100, "range_deg": 10, "resolution_mrad": 0.1, "latency_ms": 5, "power_w": 6, "cost_usd": 400, "weight_g": 180}, {"id": "real-newscale-m3", "vendor": "New Scale", "bandwidth_hz": 50, "range_deg": 5, "resolution_mrad": 0.35, "latency_ms": 8, "power_w": 3, "cost_usd": 900, "weight_g": 60, "source_url": "https://www.newscaletech.com"}]},
    {"type": "receiver_objective", "models": [
      {"id": "rx-refractive-100mm", "aperture_mm": 100, "efficiency": 0.85, "type": "refractive", "cost_usd": 120, "weight_g": 220},
      {"id": "rx-refractive-150mm", "aperture_mm": 150, "efficiency": 0.88, "type": "refractive", "cost_usd": 180, "weight_g": 380},
      {"id": "rx-fresnel-150mm", "aperture_mm": 150, "efficiency": 0.7, "type": "fresnel", "cost_usd": 60, "weight_g": 120},
      {"id": "rx-fresnel-200mm", "aperture_mm": 200, "efficiency": 0.65, "type": "fresnel", "cost_usd": 75, "weight_g": 180},
      {"id": "rx-mirror-120mm", "aperture_mm": 120, "efficiency": 0.9, "type": "reflective", "cost_usd": 160, "weight_g": 300}
    ]},
    {"type": "lens_stack", "models": [
      {"id": "stack-none", "elements": [], "transmission": 1.0, "aperture_mm": 0, "cost_usd": 0, "weight_g": 0, "tool_tip": "No additional lens stack."},
      {"id": "stack-2x-fresnel-150", "elements": [
        {"type": "fresnel", "diameter_mm": 150, "tau": 0.8},
        {"type": "fresnel", "diameter_mm": 150, "tau": 0.8}
      ], "transmission": 0.64, "aperture_mm": 150, "cost_usd": 130, "weight_g": 260, "spacing_tolerance_um": 200},
      {"id": "stack-galilean-mini", "elements": [
        {"type": "negative", "diameter_mm": 20, "tau": 0.95},
        {"type": "positive", "diameter_mm": 40, "tau": 0.96}
      ], "transmission": 0.91, "aperture_mm": 40, "cost_usd": 140, "weight_g": 90, "spacing_tolerance_um": 50}
    ]},
    {"type": "optomech_mount", "models": [
      {"id": "mount-basic", "supports_stack": true, "adjust_axial_um": 300, "adjust_tilt_mrad": 3, "cost_usd": 45, "weight_g": 120, "tool_tip": "Basic mount; supports lens stacks."},
      {"id": "mount-precision", "supports_stack": true, "adjust_axial_um": 50, "adjust_tilt_mrad": 1, "cost_usd": 120, "weight_g": 200}
    ]},
    {"type": "sensor_quad", "models": [{"id": "quad-1khz", "bandwidth_hz": 1000, "nep_w_sqrtHz": 1e-12, "active_area_mm": 3, "cost_usd": 90, "weight_g": 3}]},
    {"type": "receiver_array", "models": [
      {"id": "arr-none", "count": 0, "sub_aperture_mm": 0, "fill_factor": 0, "combiner_il_db": 0, "efficiency": 0, "dual_lambda_ok": true, "tool_tip": "No receiver array (single objective only)."},
      {"id": "arr-3x150-fresnel", "count": 3, "sub_aperture_mm": 150, "fill_factor": 0.9, "combiner_il_db": 1.0, "efficiency": 0.68, "efficiency_1550": 0.68, "efficiency_1310": 0.6, "envelope_diameter_mm": 300, "grid_rows": 3, "grid_cols": 1, "pitch_mm": 155, "envelope_shape": "circle", "aoa_k": 1.0, "sampling_factor": 0.95, "dual_lambda_ok": true, "tilt_std_mrad": 0.5, "flatness_um_rms": 150, "offset_mrad": 0, "aoa_extra_mrad": 0, "cost_usd": 220, "weight_g": 420},
      {"id": "arr-4x1in-fresnel", "count": 16, "sub_aperture_mm": 25.4, "fill_factor": 0.9, "combiner_il_db": 2.0, "efficiency": 0.65, "efficiency_1550": 0.65, "efficiency_1310": 0.58, "grid_rows": 4, "grid_cols": 4, "pitch_mm": 27.0, "envelope_shape": "rect", "envelope_width_mm": 110, "envelope_height_mm": 110, "aoa_k": 1.2, "sampling_factor": 0.92, "dual_lambda_ok": true, "tilt_std_mrad": 0.7, "flatness_um_rms": 200, "offset_mrad": 0, "aoa_extra_mrad": 0, "cost_usd": 96, "weight_g": 240},
      {"id": "arr-2x2-2in-refractive", "count": 4, "sub_aperture_mm": 50.8, "fill_factor": 0.95, "combiner_il_db": 1.2, "efficiency": 0.85, "efficiency_1550": 0.85, "efficiency_1310": 0.83, "grid_rows": 2, "grid_cols": 2, "pitch_mm": 53.0, "envelope_shape": "rect", "envelope_width_mm": 110, "envelope_height_mm": 110, "aoa_k": 0.8, "sampling_factor": 0.97, "dual_lambda_ok": true, "tilt_std_mrad": 0.3, "flatness_um_rms": 80, "offset_mrad": 0, "aoa_extra_mrad": 0, "cost_usd": 180, "weight_g": 520}
    ]},
    {"type": "combiner", "models": [
      {"id": "comb-tree-lowloss", "base_il_db": 0.5, "per_stage_il_db": 0.2, "notes": "Approx IL ≈ base + per_stage * ceil(log2 N)"},
      {"id": "comb-tree-standard", "base_il_db": 0.8, "per_stage_il_db": 0.35}
    ]},
    {"type": "rosa", "models": [{"id": "rosa-pin-1g", "responsivity_a_w": 0.9, "bitrate_gbps_supported": [0.1, 1], "sensitivity_dbm": {"0.1": -28, "1": -20}, "overload_dbm": -3, "power_w": 0.35, "cost_usd": 45, "weight_g": 2.5}, {"id": "rosa-apd-10g", "responsivity_a_w": 0.6, "gain": 10, "bitrate_gbps_supported": [1, 10], "sensitivity_dbm": {"1": -24, "10": -18}, "overload_dbm": -6, "power_w": 0.6, "cost_usd": 120, "weight_g": 3}]},
    {"type": "tia", "models": [{"id": "tia-10g-lownoise", "bandwidth_ghz": 7, "input_noise_pa_sqrtHz": 5e-12, "power_w": 0.4, "cost_usd": 35, "weight_g": 1}]},
    {"type": "la_cdr", "models": [{"id": "cdr-1g", "bitrate_gbps": 1, "jitter_tolerance_ui_pp": 0.5, "power_w": 0.5, "cost_usd": 30, "weight_g": 1.2}]},
    {"type": "fec", "models": [{"id": "fec-rs", "coding_gain_db": 3, "overhead_pct": 7, "latency_ms": 0.2, "power_w": 0.3, "cost_usd": 10, "weight_g": 1}]}
  ]
};


