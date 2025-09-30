Evaluator/Compatibility Quick Test Plan (manual)

Cases

1) Link budget monotonicity
- Increase distance_m → prx_dbm decreases; link_margin_db decreases.

2) Array combiner IL
- Select receiver_array with N=16 and combiner=comb-tree-standard → combiner_il_db ≈ base + per_stage * ceil(log2 16).

3) Per-λ efficiency
- Set wavelength_nm=1310 with array having efficiency_1310 < efficiency_1550 → geometric_coupling_db increases (more negative) vs 1550.

4) Dual-λ warnings
- Select dual_lambda; pick AR centers mismatched to align λ → warnings appear for optics/filters.

5) Control targets
- Set wind_mps high → greenwood_hz rises; targets increase accordingly.

6) PSD residual
- Increase psdLow/psdHigh → residual_pointing_sigma_mrad_psd increases.


