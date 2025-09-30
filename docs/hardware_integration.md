Hardware Integration Plan (Gimbal / Fast Steering Mirror)

Goals

- Allow simulator outputs (target_gimbal_bw_hz, target_fsm_bw_hz, residual pointing) to drive real hardware.
- Provide a simple JSON I/O contract for control setpoints and telemetry.

I/O Transport Options

- WebUSB / WebSerial: Browser-based serial link to microcontroller.
- WebSocket: Connect to local bridge (Node/Python) exposing serial/USB devices.
- TCP/UDP: For networked gimbals/FSM controllers.

JSON Messages

- Outbound (Simulator → Device):
  {
    "cmd": "set_targets",
    "gimbal_bw_hz": 120,
    "fsm_bw_hz": 400,
    "align_mode": "dual_lambda",
    "psd": {"low": 1e-4, "high": 5e-5, "split_hz": 100, "fmax_hz": 1000}
  }

- Inbound (Device → Simulator):
  {
    "telemetry": {
      "sigma_point_mrad": 0.15,
      "gimbal_bw_hz": 130,
      "fsm_bw_hz": 450,
      "latency_ms": 2.1,
      "status": "ok"
    }
  }

Device Abstraction

- MCU maps JSON to actuator-specific commands (PWM/analog/RS-485).
- Provide calibration mapping angle (mrad) ↔ device units.

Safety & Eye-safety

- Include interlocks: simulator can issue emergency stop; device must implement.
- State machine: init → ready → tracking → fault.

Next Steps

- Implement a small Node bridge exposing serial devices over WebSocket.
- Add a “Connect Hardware” button in the toolbar; mirror KPIs vs telemetry.


