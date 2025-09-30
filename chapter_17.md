# Chapter 17: Clock/Data Recovery & Output

*The final transformation: From analog eye diagrams to digital certainty*

## Introduction: Why Clock Recovery?

Imagine you're listening to someone speak over a noisy phone line. Even with static and distortion, your brain automatically figures out the rhythm of their speech—where words begin and end. Clock and Data Recovery (CDR) does exactly this for digital signals.

In our SFP receiver, we face a fundamental challenge: the transmitter sent perfectly-timed bits at 10.3125 billion per second, but by the time they reach us through fiber and photodetectors, that timing has been corrupted. This chapter explores how we recover that original timing and produce clean digital output.

## 17.1 The Timing Problem

### 17.1.1 Where Did Our Clock Go?

Let's start with a simple question: why don't we just send a clock signal alongside our data?

**Parallel Interface (like old printer cables):**
```
Data Bit 0  ─────┐0├─────┐1├─────┐1├─────
Data Bit 1  ─────┐1├─────┐0├─────┐1├─────
Data Bit 2  ─────┐0├─────┐0├─────┐1├─────
...
Data Bit 7  ─────┐1├─────┐1├─────┐0├─────
Clock       ─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─
             └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘
             Sample here ↑
```

This works great at low speeds, but at 10 Gbps, we'd need 8 data fibers plus a clock fiber. Expensive!

**Serial Interface (what SFPs use):**
```
Single Data ─────┐0├─┐1├───┐0├─┐0├───┐1├─┐1├─┐1├───┐0├───
                  ↑   ↑     ↑   ↑     ↑   ↑   ↑     ↑
                  Transitions contain timing information!
```

We save fibers, but now we must figure out when each bit starts and ends by looking at the data itself.

### 17.1.2 How Edges Encode Timing

Think about Morse code: even without a explicit timing reference, you can decode it by listening to the transitions between dots and dashes. Digital signals work similarly:

```
Transmitter sends at exactly 10.3125 GHz:
     Bit:    1    0    1    1    0    1    0    0    1
           ┌────┐    ┌─────────┐    ┌────┐         ┌────
Signal: ───┘    └────┘         └────┘    └─────────┘
           ↑    ↑    ↑         ↑    ↑    ↑         ↑
           │<96.97ps>│         │    │    │         │
           These edges happen at precise multiples of the bit period
```

**What determines the bit period?** At the transmitter, a crystal oscillator creates a precise frequency, but we can't use a 10 GHz crystal directly:

```
Crystal oscillator fundamentals:
- Crystals vibrate mechanically (like a tuning fork)
- 10 MHz crystal: ~2mm thick quartz wafer
- 10 GHz crystal: ~0.2 nanometers thick (impossible!)
- Above ~200 MHz, crystals become impractically thin

So we start with a manageable crystal (10-156.25 MHz)
and multiply up to GHz frequencies electronically
```

**How PLL Multiplication Works**

The key insight: A PLL can lock to a divided version of its output!

```
Basic PLL multiplication for SFP:

156.25 MHz              10.3125 GHz
Crystal Ref ──┐         ┌──► Output to serializer
              │         │
              ▼         │
          ┌───────┐     │
          │ Phase │     │
          │  Det  │◄────┤
          └───┬───┘     │
              │         │
              ▼         │
          ┌───────┐     │
          │  VCO  ├─────┤
          └───────┘     │
                        │
                    ┌───┴───┐
                    │  ÷66  │
                    └───────┘
                        ▲
                    156.25 MHz
```

**Step-by-Step Process:**

1. **Initial State**: VCO runs at ~10 GHz (not locked yet)
2. **Division**: ÷66 gives ~151 MHz (too slow)
3. **Phase Detection**: Compares with 156.25 MHz reference
4. **Correction**: Phase detector says "speed up"
5. **VCO Adjust**: Control voltage increases frequency
6. **Lock**: When VCO = 10.3125 GHz, ÷66 = 156.25 MHz exactly!

**Inside the VCO (Voltage-Controlled Oscillator)**

Two common types in SFPs:

**Ring Oscillator Type:**
```
     ┌─────┐  ┌─────┐  ┌─────┐
  ┌──┤ NOT ├──┤ NOT ├──┤ NOT ├──┐
  │  └─────┘  └─────┘  └─────┘  │
  └──────────────────────────────┘
  
Odd number of inversions = oscillation

Control voltage changes inverter speed:
- Higher V → faster switching → higher frequency
- Lower V → slower switching → lower frequency
```

**LC Tank Type:**
```
       L (inductor)
       ╱╲╱╲╱╲
      ────────
         ││ C (varactor capacitor)
         ││ ← Voltage changes capacitance
         
f = 1/(2π√LC)

Control voltage → Changes C → Changes frequency
```

**Why This Matters for Jitter:**

The multiplication process affects jitter:
```
Crystal jitter: 1 ps
After ×66 multiplication: 1 ps × 66 = 66 ps? No!

Only phase noise within PLL bandwidth gets multiplied:

         │ Crystal phase noise
     -80 │────────
         │        ╲
    -100 │         ╲   PLL filters
         │          ╲  high frequencies
    -120 │           ╲
         └────────────╲───────►
         10k   100k   1M     f (Hz)
              ↑
          PLL bandwidth (~100 kHz)
          
Only noise below ~100 kHz gets multiplied by 66
Higher frequency noise is filtered by PLL
```

This gives us:
- Precise frequency (crystal stability: ±20 ppm)
- Low jitter (PLL filtering)
- Programmable rates (change division ratio)
- Power efficiency (no 10 GHz crystal needed)

The result: Bit period = 1/10.3125 GHz = 96.97 picoseconds exactly (when locked)

Every time the signal changes from 0→1 or 1→0, it's telling us "a bit boundary is HERE!" But there's a catch...

### 17.1.3 The Missing Edges Problem

What if we send many consecutive 1s or 0s?

```
Data:     1 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0 1
        ┌─┐ ┌─┐                       ┌─┐ ┌─
Signal: ┘ └─┘ └───────────────────────┘ └─┘
        ↑   ↑   ↑ ? ? ? ? ? ? ? ? ? ↑   ↑
        edges   no edges for 12 bits!   edges
```

Without transitions, we lose timing information. It's like trying to count seconds without a clock—after a while, you drift. This is why we use line coding (8b/10b, 64b/66b) to guarantee regular transitions.

## 17.2 Understanding Jitter

### 17.2.1 What Is Jitter?

In a perfect world, edges would occur at exact intervals:

```
Ideal:    ↑     ↑     ↑     ↑     ↑     ↑     ↑
         0ns  97ps  194ps 291ps 388ps 485ps 582ps
```

In reality, edges wander around their ideal positions:

```
Real:     ↑      ↑    ↑      ↑    ↑      ↑       ↑
         0ns  95ps  196ps 289ps 391ps 483ps  584ps
              -2ps  +2ps  -2ps  +3ps  -2ps   +2ps
```

This timing uncertainty is **jitter**. It's like a drummer who can't keep perfect time—sometimes early, sometimes late.

### 17.2.2 Sources of Jitter

Where does jitter come from? Let's trace it through our system and understand the physics:

**1. Transmitter Jitter:**

**Thermal Noise in Transistors**
Every transistor contains electrons randomly bouncing around due to temperature:
```
Inside laser driver MOSFET at 300K:
Electrons move randomly → Random current fluctuations

Gate voltage to switch: 1.0V
Thermal noise: ±1mV (random)

Result: Sometimes switches at 0.999V (early)
        Sometimes switches at 1.001V (late)
        
If edge normally at t=0:
With noise: t = -0.5ps to +0.5ps randomly
```

**Power Supply Ripple**
The 3.3V supply isn't perfectly steady:
```
Ideal supply: 3.3000V ────────────────

Real supply:  3.3V with 100kHz ripple
              3.31V ╱╲  ╱╲  ╱╲
              3.29V╱  ╲╱  ╲╱  ╲

How this creates jitter:
- Transistor speed depends on supply voltage
- Higher V → faster switching → edge arrives early  
- Lower V → slower switching → edge arrives late

Example: 20mV ripple → ±1ps timing variation
```

**Crystal Oscillator Phase Noise**
The reference clock isn't perfect:
```
Crystal physically vibrates:
    ←→ ←→ ←→  (10 MHz mechanical resonance)
    
But thermal energy randomly perturbs it:
    ←→  ←→ ←→  (sometimes 10.000001 MHz)
     ↑
   slightly slow
   
This gets multiplied by PLL to 10.3125 GHz:
- Crystal at 10.000001 MHz (0.1 ppm high)
- Output at 10.312501 GHz (0.1 ppm high)
- Bit period: 96.9699 ps instead of 96.9700 ps
- After 1 million bits: 1 ps accumulated error!
```

**2. Fiber-Induced Jitter:**

**Chromatic Dispersion - The Physics**
Different wavelengths travel at different speeds in glass:
```
Laser spectrum isn't perfect single wavelength:
        Power
          ↑
          │  ╱╲
          │ ╱  ╲
          │╱    ╲
        ──┴──────┴──► λ
        1549  1550  1551 nm

In fiber, refractive index varies with wavelength:
n(1549nm) = 1.4682
n(1550nm) = 1.4680  
n(1551nm) = 1.4678

Speed = c/n, so:
1549nm photons: slower
1551nm photons: faster

After 10 km:
1551nm photons arrive 17 ps before 1549nm photons!

Original pulse edge:      After 10 km:
      │                      ╱│╲
      │                     ╱ │ ╲
    ──┘──                 ─╯  │  ╰─
      ↑                    ↑  ↑  ↑
   Sharp edge            Which point is
                        the "edge"?
```

**Modal Dispersion in Multimode Fiber**
Light takes multiple paths:
```
    Fiber core (50 μm diameter)
    ┌─────────────────────────┐
    │  Ray 1: straight ────►  │ Distance: 1.000 km
    │  Ray 2: ╱╲╱╲╱╲╱╲╱╲╱╲   │ Distance: 1.001 km  
    │  Ray 3: bounces more    │ Distance: 1.002 km
    └─────────────────────────┘

Time difference = distance / speed
                = 2 m / (3×10⁸ m/s × 0.68)
                = 10 ps

Pulse enters:    Pulse exits:
     │                ╱──╲
     │               ╱    ╲
   ──┘──          ──╯      ╰──
                   Different paths
                   arrive at different times
```

**Polarization Mode Dispersion**
Fiber isn't perfectly round - it's slightly oval:
```
Cross-section:       Refractive index:
    ╱───╲           nx = 1.4680
   │     │          ny = 1.4681 (tiny difference!)
    ╲───╱           

Light polarized in X travels faster than Y
After 10 km: ~0.5 ps difference

But fiber shape changes randomly with:
- Temperature
- Mechanical stress  
- Manufacturing variations

So delay difference varies randomly → jitter!
```

**3. Receiver Jitter:**

**Shot Noise Creating Timing Variations**
Photons arrive randomly (Poisson statistics):
```
Average photocurrent: 50 μA
But instant by instant:
    
Time window 1: 47 photons → 47 μA
Time window 2: 53 photons → 53 μA
Time window 3: 49 photons → 49 μA

This affects edge detection:
         Threshold
            ↓
Noisy:  ───╱╲╱╲─── (crosses at different times)
         ╱╲╱
       ↑  ↑ ↑
     Early │ Late
         Nominal

Lower current → slower rise → late crossing
Higher current → faster rise → early crossing
```

**TIA Thermal Noise**
Resistors in TIA generate noise:
```
Feedback resistor RF = 5kΩ at 300K

Thermal noise voltage: vn = √(4kTRΔf)
                          = √(4×1.38×10⁻²³×300×5000×10×10⁹)
                          = 9.1 nV/√Hz

At signal edge, this adds to photocurrent:
(Iphoto + Inoise) × RF = output voltage

Noise changes when edge crosses threshold:
      ──────╱────── Threshold
           ╱ ↑
      ───╱───┼───── Signal + noise
        ╱    ↑
       ╱   Timing varies by
      ╱    noise / slew rate
```

**Bandwidth Limiting**
Limited bandwidth makes edges slower:
```
Infinite BW:        7 GHz BW:         3 GHz BW:
    │                 ╱                 ╱───
    │                ╱                 ╱
────┘──            ─╱──              ─╱
    ↑               ↑                 ↑
    10 ps          30 ps             100 ps
    rise           rise              rise

With same noise voltage (10 mV):
Fast edge: 10 mV / (400 mV/10 ps) = 0.25 ps jitter
Slow edge: 10 mV / (400 mV/100 ps) = 2.5 ps jitter

10× slower edge → 10× more jitter!
```

### 17.2.3 Types of Jitter

Understanding jitter types helps us filter it:

**Random Jitter (RJ): The Dice Roll**

Random jitter is like measuring the arrival time of raindrops:
```
Expected interval: 100 ms between drops
Actual arrivals:   97, 103, 98, 102, 99, 101, 96, 104 ms

Distribution looks Gaussian:
         │
      20 │      ╱╲
         │     ╱  ╲
Count 10 │    ╱    ╲
         │   ╱      ╲
       0 │──╱────────╲──
         90  95 100 105 110
            Interval (ms)
```

**Key Properties:**
1. **Unbounded**: While most are near 100 ms, you might rarely get 85 ms or 115 ms
2. **Accumulates with time**: Like a "random walk"
   ```
   After 1 step:     ±1 position
   After 100 steps:  ±10 positions (√100)
   After 10000:      ±100 positions (√10000)
   
   In CDR terms:
   1 bit:     0.1 ps RMS jitter
   100 bits:  1 ps RMS jitter  
   10k bits:  10 ps RMS jitter
   ```

**Sources**: Thermal noise, shot noise, quantum effects

**Deterministic Jitter (DJ): The Pattern**

DJ is predictable - it depends on what data you send:
```
Example - Bandwidth-limited channel:

Send: 1 0 1 0 1 0 (high frequency)
Edge timing: Always 2 ps late (consistent)

Send: 1 1 1 0 0 0 (low frequency)  
Edge timing: Always 0.5 ps early (consistent)

The jitter depends on the pattern!
```

**Common DJ Types:**

1. **Data-Dependent Jitter (DDJ)**:
   ```
   After long run of 1s:  0 0 0 1 1 1 1 1 1 0
                                          ↑
                          Capacitor charged high
                          Falls slowly → late edge
   
   After alternating:     1 0 1 0 1 0 1 0 1 0
                                          ↑
                          Capacitor at mid-point
                          Falls normally → on time
   ```

2. **Duty-Cycle Distortion (DCD)**:
   ```
   Ideal 50% duty:    ┌───┐   ┌───┐
                   ───┘   └───┘   └───
                      50%  50%
   
   Real 45/55%:      ┌──┐    ┌──┐
                   ───┘  └────┘  └────
                      45%  55%
   
   Rising edges: Always on time
   Falling edges: Always 5% late
   ```

3. **Periodic Jitter (PJ)**:
   ```
   Crosstalk from adjacent lane at 5 GHz:
   
   Our 10G signal: ─┐ ┌─┐ ┌─┐ ┌─┐ ┌─
                    └─┘ └─┘ └─┘ └─┘
   
   Crosstalk:      ~~~~~~~~~~~~~~~~~~~~~
                   5 GHz sine wave
   
   When crosstalk high → edges pushed late
   When crosstalk low → edges pushed early
   Pattern repeats every 200 ps (1/5 GHz)
   ```

**Key Properties:**
1. **Bounded**: DDJ might shift edges ±5 ps max
2. **Repeatable**: Same pattern → same jitter
3. **Doesn't grow with time**: After 1 million bits, still ±5 ps

**Total Jitter: RJ + DJ**

Real signals have both:
```
Time →
Bit edges: │ │ │ │ │ │ │ │ │ │ │ │

RJ only:   │ ││ │││ │ ││││ │ │││ │  (random spread)

DJ only:   │ │ │ │ │ │ │ │ │ │ │ │  (pattern shifts)
           ↑       ↑       ↑
          early   late    early

Both:      │ ││ │││  │ ││││  │ │││  (spread + shift)
           ↑       ↑        ↑
         early   late     early
         region  region   region
```

**Why This Matters for CDR:**
- RJ: Need loop filter to average it out
- DJ: Need equalization to compensate patterns
- Total: Determines bit error rate

```
Eye diagram shows both:
         ╱─────╲        ← DJ makes eyes shift
        ╱ ╱─╲ ╲ ╲
       ╱ ╱   ╲ ╲ ╲      ← RJ makes edges fuzzy
      ╱ ╱     ╲ ╲ ╲
```

**Engineering Approaches:**

For RJ:
- Use low-noise components
- Filter power supplies
- Control temperature
- Shield from interference

For DJ:
- Pre-emphasis compensates bandwidth limits
- 8b/10b encoding limits run lengths
- Differential signaling cancels common-mode
- Equalization undoes channel effects

## 17.3 Clock Recovery Fundamentals

### 17.3.1 The Basic Idea: Phase-Locked Loops

How do we extract timing from jittery edges? We use a Phase-Locked Loop (PLL)—essentially a timing flywheel that smooths out variations.

**Analogy:** Imagine you're trying to walk in step with someone whose pace varies:
1. You watch their feet (phase detector)
2. If they're ahead, you speed up (control)
3. If they're behind, you slow down
4. Your momentum prevents instant changes (loop filter)
5. Eventually, you're synchronized but smoother

### 17.3.2 PLL Components Explained

Let's build understanding of each component:

**Phase Detector: "Are we early or late?"**
```
Data edge arrives:  ──┐
                      └────
Our clock samples:     ↑ (too late!)
                       │
                   ────┼───
                       │
Phase detector says: "Speed up!"
```

**Charge Pump: "Convert timing to voltage"**
```
Early → Inject positive current → Voltage goes up
Late  → Inject negative current → Voltage goes down
On-time → No current → Voltage holds steady

Circuit implementation:
         VDD
          │
         ╱ (current source)
        ╱
    UP ○──┤
           ├──→ To loop filter
   DOWN ○──┤
           ╲
            ╲ (current sink)
             │
            VSS
```

**Loop Filter: "Add momentum"**
```
Without filter:          With filter:
Voltage jumps around     Voltage changes smoothly
  ┌─┐ ┌─┐                  ╱──────
──┘ └─┘ └──              ╱
                       ──╯
Noisy!                 Filtered!

Common implementation:
         R1
Charge ──┤├──┬──── Control
Pump         │     Voltage
            C1│
             ═╧═

Creates a pole at 1/(R1×C1)
```

**VCO: "Voltage controls frequency"**
```
Low voltage  → 10.300 GHz (slow)
Mid voltage  → 10.3125 GHz (right on!)  
High voltage → 10.325 GHz (fast)

Tuning range must cover:
- Process variations (±5%)
- Temperature (-40°C to +85°C)
- Supply variations (±10%)
- Aging effects
Total: ~±10% frequency range needed
```

### 17.3.3 How It All Works Together

Let's trace through one cycle:

```
1. Data edge arrives early
   Data: ──┐
          └──
   Clock:   ↑ (we're late)

2. Phase detector outputs "speed up"
   PD output: ───┐
                └─── (positive pulse)

3. Charge pump adds current
   Current: ──┐█████
             └─────

4. Loop filter integrates to voltage
   Voltage: ────╱── (ramping up)

5. VCO speeds up gradually
   Before: ┌─┐ ┌─┐ ┌─┐ ┌─┐
   After:  ┌┐ ┌┐ ┌┐ ┌┐ ┌┐ (faster!)

6. Next edge is closer to aligned
   Data: ──┐
          └──
   Clock:  ↑ (better!)
```

This happens continuously, billions of times per second!

### 17.3.4 CDR vs Transmit PLL Differences

The CDR PLL differs from the transmit clock multiplier:

**Transmit PLL (from crystal):**
```
Reference: Clean 156.25 MHz crystal
           Edges always present
           Exactly periodic
           Known frequency

Design: Narrow bandwidth (~100 kHz)
        Optimize for low phase noise
        Fixed division ratio
```

**CDR PLL (from data):**
```
Reference: Random data edges
           Sometimes no edges (run of 1s/0s)
           Jittery timing
           Unknown frequency (±100 ppm)

Design: Wider bandwidth (~5 MHz)
        Must track jitter
        Frequency detector for initial lock
        Pattern-dependent behavior
```

### 17.3.5 Practical CDR Architectures

**Type I: Simple PLL**
```
Best for: Low data rates (<1 Gbps)
Pro: Simple, low power
Con: Limited jitter tolerance
```

**Type II: Dual-Loop**
```
         ┌─────────────┐
Data ────┤ Frequency   ├──┐
         │ Detector    │  │
         └─────────────┘  ▼
                      ┌────────┐
                      │ Coarse │
         ┌─────────┐  │  VCO   │
Data ────┤ Phase   ├──┤        │──► Clock
         │ Detector│  │  Fine  │
         └─────────┘  │  VCO   │
                      └────────┘

Frequency loop: Gets close quickly
Phase loop: Fine-tunes and tracks
```

**Type III: Digital CDR**
```
        ADC      DSP        DAC
Data ───┤├───────┤├─────────┤├─── Clock
      Analog → Digital → Analog

Pro: Programmable, adaptive
Con: Higher power, latency
Used in: 25G+ PAM4 systems
```

## 17.4 CDR Design Details

### 17.4.1 The Phase Detector Deep Dive

The phase detector is the CDR's "eyes." Different types have trade-offs:

**Linear Phase Detector (Hogge):**
```
How it works:
Data: ────┐  ┌────┐  ┌────
          └──┘    └──┘
Clock:      ↑   ↑   ↑   ↑
          (edges) (centers)

It creates two signals:
UP:   ──┐  ┌─┐  ┌─┐  ┌── (data transitions)
      └──┘ └─┘ └─┘ └─
DOWN: ───┐ ┌──┐ ┌──┐ ┌── (clock edges)
        └─┘  └─┘  └─┘

Phase error = UP - DOWN pulse widths
```

Advantage: Proportional output (small error = small correction)
Disadvantage: Needs perfect 50% duty cycle

**Binary Phase Detector (Alexander/Bang-Bang):**
```
Samples data at 3 points:
     A     B     C
     ↓     ↓     ↓
   ──┐           ┌──
     └───────────┘
   early center late

Decision logic:
If A≠B and B=C: We're late (transition before center)
If A=B and B≠C: We're early (transition after center)
If A=B=C: No data (no information)
```

Advantage: Works with any duty cycle
Disadvantage: Only says "early/late," not how much

### 17.4.2 Loop Dynamics: The Balancing Act

The CDR faces a fundamental trade-off:

**Wide Bandwidth (Fast Loop):**
- Quickly tracks data rate changes
- Follows transmitter wander
- BUT: Lets jitter through!

**Narrow Bandwidth (Slow Loop):**
- Filters out jitter
- Stable, clean clock
- BUT: Slow to acquire lock

```
Jitter Transfer:
Input jitter →│ CDR │→ Output jitter
              └─────┘

High-freq jitter: Filtered out ✓
Low-freq wander: Passes through ✗

Transfer function:
     │H(f)│
      1 ────╲
            ╲  
     0.7 ────╲────── -3dB point
              ╲
              ╲
        0 ─────╲───────
               f_loop   f →
```

**Real Numbers for 10G:**
- Loop bandwidth: 4 MHz
- Means: Filters jitter > 4 MHz
- But: Tracks wander < 400 kHz
- Lock time: ~1000 bit periods = 97 ns

### 17.4.3 Handling Different Data Rates

SFPs must work at various rates. How does the CDR adapt?

**Rate Detection:**
```
1. Start with wide-range VCO
2. Count transitions over fixed time
3. Estimate data rate
4. Switch to appropriate range

Example:
100 transitions in 100 ns → ~1 Gbps
1000 transitions in 100 ns → ~10 Gbps
```

**Multi-Rate Architecture:**
```
         ┌──────────┐
Data ────┤ Rate     ├──┐
         │ Detect   │  │
         └──────────┘  ↓
                   ┌───────┐
                   │ 1G    │
                   │ CDR   ├──┐
                   └───────┘  │
                   ┌───────┐  ├── Mux → Output
                   │ 10G   │  │
                   │ CDR   ├──┘
                   └───────┘
```

**Fractional-N for Fine Rate Adjustment:**

What if we need a non-integer multiplication ratio?

```
Example: 10.70911 Gbps (odd OTN rate)
Crystal: 156.25 MHz
Needed ratio: 10709.11 / 156.25 = 68.538...

Solution: Fractional-N PLL
- Divide by 68 for 462 cycles
- Divide by 69 for 538 cycles
- Average: 68.538
- Output: 156.25 MHz × 68.538 = 10.709 GHz

Sigma-delta modulator randomizes the
division pattern to minimize spurs
```

**VCO Implementation Details:**

For 10G CDR, the VCO must have specific characteristics:

```
Ring Oscillator Design:
         ┌────────────────────────┐
         │    Differential Pair    │
    ┌────┤  with variable delay   ├────┐
    │    └────────────────────────┘    │
    │    ┌────────────────────────┐    │
    ├────┤  Stage 2               ├────┤
    │    └────────────────────────┘    │
    │    ┌────────────────────────┐    │
    └────┤  Stage 3 (odd number)  ├────┘
         └────────────────────────┘

Each stage delay = 16 ps
3 stages × 2 (differential) × 16 ps = 96 ps
Frequency = 1/96ps = 10.4 GHz

Control voltage adjusts bias current:
More current → faster switching → higher freq
```

**LC-VCO for Better Phase Noise:**
```
                 VDD
                  │
              ┌───┴───┐
              │       │
            ──┤ Cross ├──
              │ Coup. │
            ──┤ Pair  ├──
              │       │
              └───┬───┘
                  │
         L₁ ╱╲╱╲╱ │ ╱╲╱╲╱ L₂
        ────┤     │     ├────
            │     │     │
           C_var C_fix C_var
            │     │     │
           ═╧═   ═╧═   ═╧═
            ↑           ↑
      Varactors change with V_ctrl

At 10.3125 GHz:
L = 500 pH (tiny spiral inductor)
C = 475 fF (mostly parasitics!)
Q factor > 10 for low phase noise
```

## 17.5 Why Equalization?

### 17.5.1 The Problem: Intersymbol Interference

As signals travel through fiber and PCB traces, high frequencies lose more energy than low frequencies:

```
What we send:          What arrives:
┌─┐ ┌─┐ ┌─┐           ╱╲ ╱╲ ╱╲
│ │ │ │ │ │          ╱  ╲╱ ╲╱ ╲
┘ └─┘ └─┘ └        ─╯          ╰─
Sharp edges         Rounded, overlapping
```

This causes bits to "bleed" into each other:

```
Send: 1 0 1 0 0 0 1

Receive without equalization:
        ╱╲    
       ╱  ╲   ╱────  
    ──╯    ╲─╱      ╲
            ↑        ↑
       Should be 0  Looks like 1!
```

The "ghost" of previous bits interferes with current bits—this is **Intersymbol Interference (ISI)**.

### 17.5.2 Frequency Domain View

Think of a square wave as containing many frequencies:

```
Square wave = Fundamental + 3rd harmonic + 5th + ...

1 0 1 0 pattern at 10 Gbps contains:
- 5 GHz fundamental
- 15 GHz 3rd harmonic  
- 25 GHz 5th harmonic
- etc.

Channel response:
   │Gain│
    1 ──╲
        ╲ 
    0.5 ─╲──── -6dB at 5 GHz
         ╲
    0.1 ──╲─── -20dB at 15 GHz
      0 ───╲───────
           5  15  f(GHz)
```

High frequencies (sharp edges) are attenuated more!

### 17.5.3 Equalization: Undoing the Damage

Equalization boosts high frequencies to compensate:

```
Channel loss:        Equalizer gain:     Result:
    ╲                    ╱                ─────
     ╲                  ╱                  Flat!
      ╲                ╱
       ╲              ╱
        ╲____________╱
```

**Feed-Forward Equalizer (FFE) Intuition:**

Think of it as "edge sharpening" in photo editing:

```
Original blurry edge:     Add inverted neighbors:    Sharp result:
                          
      ████                    ████                        ██
    ████████                ████--██                    ██████
  ████████████            ████------██                ██████████
████████████████        ████----------██            ████████████
                         ↑   ↑      ↑   ↑
                      subtract    subtract
                      from past   from future
```

## 17.6 Output Driver: Meeting Host Requirements

### 17.6.1 Why Differential Signaling?

The SFP outputs differential signals. Why not single-ended?

**Single-ended problems at 10 Gbps:**
```
Signal: ─┐  ┌─┐  ┌─
         └──┘ └──┘
Ground: ─────────── (supposedly)

Reality with ground bounce:
Signal: ─┐  ┌─┐  ┌─
         └──┘ └──┘
Ground: ─┐  ┌─┐  ┌─ (also bouncing!)
         └──┘ └──┘
         
Receiver sees the difference → errors!
```

**Differential solution:**
```
OUT+:   ─┐  ┌─┐  ┌─
         └──┘ └──┘
OUT-:   ┌──┐ ┌──┐ 
        ─┘  └─┘  └─

Receiver sees: OUT+ minus OUT- = 2× signal
Ground noise affects both equally → cancels!
```

### 17.6.2 Current Mode Logic (CML)

Why current steering instead of voltage switching?

**Voltage switching (like CMOS):**
```
To switch 400mV in 30ps:
dV/dt = 400mV/30ps = 13.3 V/ns (!!)

This creates huge di/dt in power supply:
C * dV/dt = 10pF * 13.3 V/ns = 133 mA spikes
```

**Current steering (CML):**
```
         VDD
          │
      ┌───┼───┐
     50Ω 50Ω 50Ω
      │   │   │
    OUT+ GND OUT-
      │   │   │
      └───┼───┘
          │
         8mA constant
          │
         VSS

Current always flows—we just steer it left or right
No supply spikes!
```

### 17.6.3 Pre-emphasis: Boosting Transitions

Pre-emphasis compensates for PCB trace losses:

```
Data pattern: 1 0 1 1 1 0 0 1

Normal drive:
     ┌─────────────┐     ┌───
─────┘             └─────┘

With pre-emphasis:
     ┌─────────────┐     ┌───
────┌┘             └┐───┌┘
    ↑               ↑   ↑
   Boost           Boost at
   first           transitions
   bit

Why it works:
- Transitions contain high frequencies
- PCB attenuates high frequencies  
- Boost transitions = pre-compensate for loss
```

## 17.7 Complete Signal Path Example

Let's follow a specific bit pattern through the entire CDR:

**Starting point:** Optical "10110" pattern arrives

### Step 1: TIA Output (from Chapter 16)
```
Photocurrent: 50µA peak
TIA gain: 5kΩ
Output: 250mV differential

But with ISI:
Ideal:    ┌──┐ ┌────────
      ────┘  └─┘
Real:     ╱──╲ ╱────────
      ───╯    ╰╯
```

### Step 2: Limiting Amplifier
```
Input: 250mV with ISI
Gain: 32 dB (40×)
Output: 800mV limited

Still has timing jitter:
     ┌──┐ ┌────────
─────┘  └─┘
  ↑  ↑  ↑ ↑
  96 99 95 98 ps (varies!)
```

### Step 3: CDR Phase Detection
```
Data edges:  ↑  ↑  ↑  ↑
Clock:       ↑  ↑  ↑  ↑
Error:      +3 -1 +2 -2 ps

Phase detector integrates these errors
VCO gradually aligns to average position
```

### Step 4: Retiming
```
Original data (jittery):
     ┌──┐ ┌────────
─────┘  └─┘

Sample with recovered clock:
      ↑  ↑  ↑  ↑  ↑  (perfectly spaced)
      
Retimed output:
     ┌──┐ ┌────────
─────┘  └─┘
     97 97 97 97 ps (consistent!)
```

### Step 5: Equalization & Output
```
Equalizer boosts edges:
     ┌──┐ ┌────────
────┌┘  └┘└┐
    ↑      ↑ pre-emphasis

Final output to host:
- 400mV differential
- < 30ps rise/fall
- < 5ps RMS jitter
- Meets all SFP+ specs!
```

## 17.8 FSOC-Specific Challenges

### 17.8.1 Atmospheric Turbulence Effects

Air turbulence creates unique timing challenges:

```
Fiber jitter:           Atmospheric jitter:
                       
Stable baseline         Wandering baseline
  ╱╲                      ╱╲    ╱╲
 ╱  ╲                    ╱  ╲  ╱  ╲
╱    ╲                  ╱    ╲╱    ╲
                       Changes with weather!
```

**Why this happens:**
1. Air pockets have different densities
2. Light travels at different speeds
3. Path length effectively varies
4. Arrives early/late randomly

**Solution: Adaptive CDR**
```
Clear day:            Turbulent:
BW = 2 MHz           BW = 8 MHz
(filter jitter)      (track wander)

Monitor jitter spectrum → Adjust loop BW
```

### 17.8.2 Scintillation-Induced Burst Errors

Atmospheric scintillation causes signal fading:

```
Normal fiber link:
Power: ──────────────────── (constant)

FSOC link with scintillation:
Power: ───╱╲───╱╲─────╱╲── (fading)
         ↑   ↑     ↑
      Signal lost → CDR loses lock!
```

**Fast Reacquisition Strategy:**

```
1. Detect loss of signal
2. Remember last frequency (store VCO voltage)
3. Switch to wide bandwidth
4. When signal returns, start near last frequency
5. Quickly reacquire lock
6. Switch back to narrow bandwidth

Traditional: 1000 bit times to lock
Fast reacq: 50 bit times to lock
```

### 17.8.3 Multi-Aperture Diversity

With multiple receive apertures, we can combine CDRs:

```
Aperture 1: ─┐ ┌─┐ ?─┐ ┌─  (faded)
             └─┘ └─? └─┘
             
Aperture 2: ─┐ ┌─┐ ┌─┐ ┌─  (good)
             └─┘ └─┘ └─┘

Aperture 3: ─? ?─? ┌─┐ ┌─  (blocked)
             ? ? ? └─┘ └─┘

Quality indicators:
1: Lock=Y, Eye=30%, Freq_err=+10ppm
2: Lock=Y, Eye=80%, Freq_err=+2ppm  ← Best!
3: Lock=N, Eye=0%,  Freq_err=???

Output: Use Aperture 2 data
```

## 17.9 Practical Implementation

### 17.9.1 Power Supply Considerations

CDRs are extremely sensitive to power supply noise:

```
Why? VCO frequency depends on voltage:

Clean supply:         Noisy supply:
V = 1.200 V          V = 1.200 ± 0.010 V
f = 10.3125 GHz      f = 10.3125 ± 0.001 GHz
                           ↑
                     100 kHz jitter!
```

**Solution: Multi-stage filtering**
```
3.3V Input ──┬──────────┬──────────┬─────
             │          │          │
           ┌─┴─┐      ┌─┴─┐      ┌─┴─┐
           │ L1│      │ L2│      │ L3│  Ferrite
           └─┬─┘      └─┬─┘      └─┬─┘  beads
             │          │          │
            ═╪═ C1     ═╪═ C2     ═╪═ C3
             │          │          │
            ─┴─        ─┴─        ─┴─
          Digital    CDR Core   VCO Only
          (noisy)   (cleaner)   (cleanest)
```

### 17.9.2 Testing CDR Performance

**Jitter Tolerance Test:**
```
How much input jitter can CDR handle?

Test setup:
Pattern Gen → Jitter Injector → CDR → Error Detector

Inject sinusoidal jitter:
Frequency: 100 Hz to 10 MHz
Amplitude: 0.01 UI to 10 UI

Pass criteria: BER < 10^-12

Results plot:
UI p-p │
   10  │  ╱─────────── Pass region
       │ ╱
    1  │╱
       │
  0.1  │
       └────────────────
       100  1k  10k  100k
          Jitter freq (Hz)
```

**Why the shape?**
- Low freq: CDR tracks it (high tolerance)
- High freq: CDR filters it (lower tolerance)
- Mid freq: Worst case (near loop BW)

## 17.10 Advanced Topics

### 17.10.1 Decision Feedback Equalization (DFE)

DFE uses past decisions to cancel ISI:

```
How it works - intuitive example:

Receive: 1 ? ? (can't tell - too much ISI)
         ↑
    We know this was 1

If previous bit was 1, it "bleeds" into next bit
Subtract expected bleed: ? - 0.3 = clean signal

Detailed view:
Current input ──────(+)────→ Decision ──→ Output
                     ↑          │
                     │          ↓
                  ───(-)←─── Feedback
                     ↑       Filter
                Subtract ISI
```

**Advantage:** No noise amplification
**Risk:** Wrong decision propagates errors

### 17.10.2 Clock and Data Recovery for PAM4

25G+ links use 4-level signaling:

```
NRZ (2-level):      PAM4 (4-level):
                    
  1 ────             11 ────  Level 3
                     10 ────  Level 2  
  0 ────             01 ────  Level 1
                     00 ────  Level 0

2× data rate, but 3 decision thresholds!
```

**PAM4 CDR Challenges:**

```
NRZ eye:            PAM4 eyes:
                    
   ◆ ◆               ◆ ◆   ← Eye 3
  ◆   ◆              ◆ ◆   ← Eye 2  
   ◆ ◆               ◆ ◆   ← Eye 1
                    
1 eye to monitor    3 eyes, all smaller!
```

Requires more sophisticated processing:
- ADC samples at 2× symbol rate
- Digital signal processing
- Maximum likelihood sequence detection
- Forward error correction

## Summary

Clock and Data Recovery completes our receive chain, solving three critical challenges:

1. **Timing Recovery**: We showed how edges encode timing information and how PLLs extract stable clocks from jittery data

2. **Jitter Filtering**: We explored the sources of jitter and how CDR loop dynamics balance tracking versus filtering

3. **Signal Restoration**: Through equalization and proper output drive, we deliver clean signals that meet host specifications

For FSOC applications, we identified unique challenges:
- Atmospheric turbulence requires adaptive loop bandwidth
- Scintillation demands fast reacquisition
- Multi-aperture systems benefit from CDR-based selection

The elegance of the CDR lies in performing complex signal processing while appearing simple to the host—just clean, retimed data arriving at precisely spaced intervals.

## Next Chapter Preview

Chapter 18 will zoom out to compare how every component we've studied—from lasers to CDRs—scales across different speeds, revealing the engineering trade-offs that shape each generation of optical communication.

## References

1. Razavi, B. "Design of Integrated Circuits for Optical Communications" - Chapter 8: Clock and Data Recovery
2. Gardner, F.M. "Phaselock Techniques" - The definitive PLL reference
3. Alexander, J.D.H. "Clock Recovery from Random Binary Signals" - The bang-bang PD paper
4. Lee, T.H. "The Design of CMOS Radio-Frequency Integrated Circuits" - VCO design principles
5. Stojanović, V. et al. "Adaptive Equalization and Data Recovery in a Dual-Mode (PAM2/4) Serial Link Transceiver"