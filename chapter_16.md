# Chapter 16: ROSA, Photodiode & TIA

## Why This Chapter Matters

Our photons have survived an epic journey. They began as 10¹⁶ photons per second carrying 10.3125 Gbps of data, traveled 40 kilometers through single-mode fiber, and arrived as a mere 5.76×10¹⁴ photons per second—a survival rate of just 2.6%. Now, at -10.6 dBm (0.087 milliwatts), they face their final transformation: from light back to electricity.

This chapter reveals exactly how Receiver Optical Sub-Assemblies (ROSAs) perform this quantum mechanical miracle. We'll follow our photons from the moment they exit the fiber at the LC connector, through the precision optics that focus them onto a photodiode smaller than a grain of sand, into the quantum realm where each photon liberates a single electron-hole pair, and finally through the analog electronics that amplify picoamperes into usable signals.

By the end, you'll understand not just the theory, but the practical engineering—why certain design choices dominate, where the fundamental limits lie, and how you might modify or extend these designs for applications like free-space optical communication where the constraints of the SFP housing no longer apply.

## 16.1 The Receiver's Challenge: Extracting Signals from Noise

### What Actually Arrives at the Receiver

After 40 kilometers of single-mode fiber, our optical signal emerges from the LC connector fundamentally changed from when it entered. The fiber has acted as both protector and predator—guiding our photons faithfully while stealing 96% of them along the way. Let's be precise about what survives:

The power has dropped from 5.3 dBm to -10.6 dBm—that's 0.087 milliwatts, barely enough to cast a shadow. The photon rate, once a mighty 10¹⁶ per second, has dwindled to:

**N = P/(hf) = (0.087×10⁻³ W) / (6.626×10⁻³⁴ J·s × 2.29×10¹⁴ Hz) = 5.76×10¹⁴ photons/second**

Each photon still carries its quantum of energy **E = hc/λ = 1.52×10⁻¹⁹ J = 0.948 eV** at 1310nm, but the collective stream is a whisper of its former self.

The spectral characteristics have evolved too. Our laser's narrow 0.1nm linewidth has broadened to about 0.45nm through self-phase modulation in the fiber. The polarization, once potentially well-defined, now changes randomly with time—scrambled by the fiber's microscopic imperfections and stress-induced birefringence. The mode remains purely LP₀₁ fundamental, a testament to single-mode fiber's filtering action.

Most critically, our 10.3125 Gbps NRZ modulation persists, though degraded. The extinction ratio has dropped from 10 dB to about 9.5 dB—still healthy but showing the accumulated imperfections of the journey. The rise and fall times have stretched from 35 picoseconds to about 40 picoseconds, and the eye opening has contracted from nearly 100% to about 70%. These photons are tired, but they still carry our data.

### Through the LC Connector Interface

The LC connector represents the boundary between guided and free-space propagation. Inside the fiber, our photons traveled in the precise patterns dictated by the waveguide equations. But the moment they reach the fiber's end face, they're free to diverge.

The numerical aperture of SMF-28 fiber determines the exit cone:

**NA = √(n₁² - n₂²) = √(1.4682² - 1.4629²) = 0.13**

This means light exits in a cone with a half-angle of **θ = sin⁻¹(NA) = sin⁻¹(0.13) = 7.5°**. From the 10.4-micron mode field diameter, the beam immediately begins expanding:

**Beam diameter(z) = 10.4 µm + 2z × tan(7.5°) = 10.4 µm + 0.26z**

After just 0.3 millimeters—the typical air gap in an LC connection—the beam has grown to 141 microns in diameter. This fifteenfold expansion happens in less than the thickness of three sheets of paper.

This expanding cone of light must somehow be captured and focused onto a photodiode typically only 40 to 80 microns in diameter. Miss the target by even 10 microns and you lose 20% of your signal. This is the receiver's first great challenge.

The LC connector itself introduces losses. At the glass-air interface, the Fresnel reflection coefficient is:

**r = (n₁ - n₂)/(n₁ + n₂) = (1.468 - 1.0)/(1.468 + 1.0) = 0.189**

This gives a power reflection of **R = r² = 0.0357** or 3.57%, corresponding to a loss of **-10log₁₀(1-R) = 0.158 dB**. The 0.3mm air gap causes additional divergence loss. The beam coupling efficiency between two Gaussian beams is:

**η = 4/[(w₁/w₂ + w₂/w₁)² + (πw₁w₂/λz)²]**

Where w₁ = 5.2 µm (initial radius), w₂ = 70.5 µm (expanded radius), giving η ≈ 0.85 or 0.7 dB additional loss. Any contamination on the connector faces—a fingerprint, a speck of dust—absorbs or scatters more photons. Angular misalignment, even a fraction of a degree, steers the beam away from its target.

When we sum these effects, the LC connector typically costs us 0.5 to 1 dB of precious optical power. Our -10.6 dBm signal drops to about -11.4 dBm before it even enters the ROSA. In the accounting of photons, every decibel matters.

### The Reflection Problem

Reflections at the receiver don't just waste power—they can destabilize the distant transmitter. Light reflected from the receiver travels back through the fiber, arriving at the transmitter delayed by the round-trip time. For our 40km link, that's 400 microseconds later. This reflected light can interfere with the laser cavity, causing instabilities, mode hopping, or excess noise.

The industry has developed strict return loss requirements to manage this problem. An LC connector with ultra-physical contact (UPC) polish must provide at least 35 dB return loss—meaning less than 0.03% of the light reflects. Angled physical contact (APC) connectors, with their 8-degree angle polish, achieve 45 dB or better by ensuring reflected light doesn't couple back into the fiber core.

Inside the ROSA, every optical surface poses a reflection risk. The ROSA window, the ball lens surfaces, and the photodiode itself all create interfaces where light can reflect. Careful anti-reflection coatings reduce these reflections to acceptable levels, but the engineering is delicate. A coating optimized for 1310nm might perform poorly at 1550nm. Environmental exposure can degrade coatings over time. The entire optical path must be designed as a system to manage reflections.

## 16.2 ROSA Optical Design: Focusing Scattered Photons

### The Diverging Beam Challenge

Light obeys the dictates of diffraction. The moment our carefully guided mode exits the fiber, it begins spreading according to the laws of physics. For a Gaussian beam, the beam radius evolves as:

**w(z) = w₀√[1 + (zλ/πw₀²)²]**

Where w₀ = 5.2 µm (MFD/2), λ = 1310 nm, and z is the propagation distance. The Rayleigh range—where the beam area doubles—is:

**z_R = πw₀²/λ = π(5.2×10⁻⁶)²/(1310×10⁻⁹) = 64.8 µm**

This formula reveals a harsh truth: after just 1 millimeter, our 10.4-micron beam has expanded to:

**2w(1mm) = 2 × 5.2µm × √[1 + (1000µm × 1.31µm/(π × 27µm²))²] = 273 µm**

After 5 millimeters—a typical distance in optical assemblies—it's grown to 1.36 millimeters. The beam expands quadratically with distance, making every millimeter count in ROSA design.

### Ball Lens Design and Optimization

The ball lens is the unsung hero of ROSA optics. This tiny sphere, typically 1 to 1.5 millimeters in diameter, must capture the diverging light from the fiber and focus it onto the photodiode. The physics is deceptively simple—it's just a thick lens—but the engineering is exquisite.

The focal length of a ball lens depends on its refractive index and diameter:

**f = nD/[4(n-1)]**

For a 1mm diameter sapphire ball (n=1.765 at 1310nm), the focal length is:

**f = 1.765 × 1mm / [4(1.765-1)] = 0.576 mm**

This short focal length allows compact packaging while providing the magnification needed to match the fiber mode to the photodiode.

Material selection involves multiple trade-offs. The refractive indices and properties at 1310nm are:

| Material | n @ 1310nm | dn/dT (10⁻⁶/K) | Cost | Transmission |
|----------|------------|-----------------|------|--------------|
| BK7 glass | 1.507 | 2.4 | Low | 92% |
| Sapphire (Al₂O₃) | 1.765 | 13.0 | High | 95% |
| Ruby (Cr:Al₂O₃) | 1.762 | 12.8 | Medium | 94% |
| SF11 glass | 1.768 | 5.5 | Medium | 91% |

The Gaussian beam propagation through the ball lens follows:

**M = -s₂/s₁ × [1 + (f/s₁ - 1)²]/[1 + (f/s₂ - 1)²]**

Where s₁ is the object distance (fiber to lens) and s₂ is the image distance (lens to photodiode). For typical distances of s₁ = 0.3mm and s₂ = 0.5mm with our sapphire ball:

**M = -0.5/0.3 × [1 + (0.576/0.3 - 1)²]/[1 + (0.576/0.5 - 1)²] ≈ -5.9×**

This magnification transforms the 10.4 µm mode to a 61 µm spot—nearly perfect for a 60-80 µm photodiode.

### The Critical Alignment Challenge

ROSA assembly requires positioning accuracy measured in single microns. Consider what happens with lateral misalignment: if the focused spot shifts just 7 microns from the photodiode center, coupling drops by 0.5 dB. A 15-micron error costs 1.5 dB—enough to push a marginal link into failure.

Angular alignment is equally critical. A 0.2-degree tilt of the fiber translates to a 7-micron lateral shift at the photodiode. Temperature changes cause differential expansion of the package materials, potentially shifting alignment by several microns over the operating range.

This is why ROSA assembly remains one of the most challenging manufacturing processes in optics. Automated assembly machines use vision systems and active feedback—monitoring the photocurrent while adjusting position—to achieve optimal coupling. The lens is then fixed in place with UV-cured epoxy, chosen for minimal shrinkage and matched thermal expansion.

The entire process takes 30 to 60 seconds per device, making it a significant cost driver. Some manufacturers have experimented with self-aligning structures using surface tension or V-grooves, but active alignment remains the gold standard for performance.

## 16.3 Photodiode Physics and Design

### The Quantum Detection Process

When our travel-weary photons finally reach the photodiode, we enter the quantum realm. Each 1310nm photon carries exactly:

**E_photon = hc/λ = (6.626×10⁻³⁴ J·s × 3×10⁸ m/s)/(1310×10⁻⁹ m) = 1.52×10⁻¹⁹ J = 0.948 eV**

This energy must exceed the semiconductor's bandgap to be absorbed. InGaAs, the workhorse material for telecom photodiodes, has a bandgap that varies with composition. For In₀.₅₃Ga₀.₄₇As lattice-matched to InP:

**E_g = 0.75 eV at 300K**

Our photons exceed this threshold by 0.198 eV. This excess energy doesn't create extra electron-hole pairs—quantum mechanics forbids it. Instead, it dissipates as phonons with energy:

**E_phonon = E_photon - E_g = 0.948 - 0.75 = 0.198 eV**

The absorption process follows Beer's law with the absorption coefficient:

**α(1310nm) = 1.04×10⁴ cm⁻¹**

The intensity decays exponentially with depth:

**I(z) = I₀ × exp(-αz)**

After distance z into the InGaAs:
- 1 µm: 1 - exp(-1.04) = 65% absorbed
- 2 µm: 1 - exp(-2.08) = 87.5% absorbed
- 3 µm: 1 - exp(-3.12) = 95.7% absorbed
- 4 µm: 1 - exp(-4.16) = 98.4% absorbed

This exponential absorption profile drives the choice of a 2.5-3 µm intrinsic region thickness.

### PIN Photodiode Structure

The PIN photodiode adds an intrinsic (undoped) layer between the p and n regions, creating a structure optimized for high-speed detection. Under reverse bias, the entire intrinsic region depletes of mobile carriers, creating a uniform electric field that efficiently separates photogenerated electrons and holes.

```
PIN Photodiode Cross-Section with Field Distribution:

     Top Contact Ring (Ti/Pt/Au)
    ╱         10-50 µm         ╲
   ║  p+ InGaAs (0.2µm)         ║ ← NA = 2×10¹⁹ cm⁻³
   ╟────────────────────────────╢
   ║  i-InGaAs (2.5µm)          ║ ← ND-NA < 10¹⁵ cm⁻³
   ╟────────────────────────────╢   
   ║  n+ InP substrate          ║ ← ND = 5×10¹⁸ cm⁻³
   ╚════════════════════════════╝
    ╲      n-contact (AuGe)     ╱

Electric field: E = (Vbias + Vbi)/W = (5V + 0.6V)/2.5µm = 22.4 kV/cm
```

The typical InGaAs PIN photodiode for 10 Gbps operation uses a 2.5-micron thick intrinsic InGaAs layer. This thickness represents a careful optimization. The depletion width W under bias V is:

**W = √[2ε(Vbi + V)/(qN)]**

Where ε = 13.9ε₀ for InGaAs, but with intrinsic material, the entire i-region depletes, so W = 2.5 µm by design.

The electric field distribution is nearly uniform:

**E(x) = (V + Vbi)/W = (5V + 0.6V)/2.5µm = 22.4 kV/cm**

This field accelerates carriers to their saturation velocities:
- Electrons: **v_sat,e = 6×10⁶ cm/s** (reached at E > 5 kV/cm)
- Holes: **v_sat,h = 4×10⁶ cm/s** (reached at E > 10 kV/cm)

The transit times are thus:
- Electrons: **t_e = W/v_sat,e = 2.5×10⁻⁴ cm / 6×10⁶ cm/s = 4.2 ps**
- Holes: **t_h = W/v_sat,h = 2.5×10⁻⁴ cm / 4×10⁶ cm/s = 62.5 ps**

The photodiode impulse response is approximately:

**h(t) = (q/W) × [v_e × u(t) - v_e × u(t-t_e) + v_h × u(t) - v_h × u(t-t_h)]**

Where u(t) is the unit step function. The 3-dB bandwidth is approximately:

**f_3dB ≈ 0.45/t_h = 0.45/62.5ps = 7.2 GHz**

### Carrier Dynamics and Transit Time

The photodiode's speed depends on a complex interplay of carrier dynamics. When a photon creates an electron-hole pair, the carriers don't instantly appear at the electrodes. They must drift through the semiconductor under the influence of the electric field.

Electrons, with their lower effective mass, accelerate quickly and reach saturation velocity in InGaAs at relatively modest fields. They zip across the intrinsic region in about 4 picoseconds. Holes, burdened by their higher effective mass and lower mobility, struggle along at one-fifteenth the speed, taking 60 picoseconds for the same journey.

This disparity creates an asymmetric impulse response. The initial current spike comes from the fast electrons, followed by a long tail from the plodding holes. In the frequency domain, this translates to reduced bandwidth and phase distortion.

Clever photodiode designs try to minimize the hole transit distance. Some use thin intrinsic layers but sacrifice quantum efficiency. Others use graded bandgap structures that create quasi-electric fields to accelerate holes. The most sophisticated use uni-traveling carrier (UTC) structures where only electrons contribute to the photocurrent, eliminating slow hole transport entirely.

### Quantum Efficiency and Responsivity

Quantum efficiency—the probability that an incident photon creates a collected electron-hole pair—determines the fundamental sensitivity of our receiver. Every loss mechanism chips away at this efficiency:

**QE = (1 - R) × η_absorption × η_collection × η_surface**

Where:
- R = surface reflection coefficient
- η_absorption = fraction of photons absorbed in depletion region
- η_collection = fraction of generated carriers collected
- η_surface = fraction not lost to surface recombination

At the surface, Fresnel reflection for normal incidence:

**R = [(n_InGaAs - n_air)/(n_InGaAs + n_air)]² = [(3.5 - 1.0)/(3.5 + 1.0)]² = 0.309**

Without anti-reflection coating, we'd lose 31%! A quarter-wave coating of Si₃N₄ (n = 2.0) reduces this dramatically:

**R_coated = [(n₁² - n₀n₂)/(n₁² + n₀n₂)]² ≈ 0.004** (0.4% reflection)

The absorption efficiency for our 2.5 µm intrinsic region:

**η_absorption = 1 - exp(-αW) = 1 - exp(-1.04×10⁴ × 2.5×10⁻⁴) = 0.926**

Collection efficiency depends on carrier lifetime τ and transit time t_transit:

**η_collection = 1 - t_transit/τ ≈ 0.99** (for τ > 1 ns)

Surface recombination velocity S ≈ 10⁴ cm/s causes losses at the perimeter:

**η_surface ≈ 1 - (perimeter × S × τ)/(active area) ≈ 0.98**

Total quantum efficiency:

**QE = (1 - 0.004) × 0.926 × 0.99 × 0.98 = 0.892 (89.2%)**

This translates to responsivity:

**R = QE × qλ/(hc) = 0.892 × 1.6×10⁻¹⁹ × 1310×10⁻⁹/(6.626×10⁻³⁴ × 3×10⁸) = 0.94 A/W**

### Dark Current: The Noise Floor

Even in perfect darkness, current flows through a reverse-biased photodiode. This dark current sets the noise floor for optical detection and reveals the quality of the semiconductor material and processing.

In the intrinsic region, thermal generation follows semiconductor statistics:

**I_gen = qn_iWA/τ_g**

Where:
- q = 1.6×10⁻¹⁹ C
- n_i = intrinsic carrier concentration
- W = depletion width = 2.5 µm
- A = active area = π(25µm)² = 1.96×10⁻⁵ cm²
- τ_g = generation lifetime ≈ 1 µs

The intrinsic carrier concentration for In₀.₅₃Ga₀.₄₇As:

**n_i = √(N_cN_v) × exp(-E_g/2kT)**

At 25°C: **n_i ≈ 5.4×10¹¹ cm⁻³**
At 70°C: **n_i ≈ 8.6×10¹² cm⁻³** (16× increase!)

This gives generation current:
- At 25°C: **I_gen = 1.6×10⁻¹⁹ × 5.4×10¹¹ × 2.5×10⁻⁴ × 1.96×10⁻⁵ / 10⁻⁶ = 0.42 nA**
- At 70°C: **I_gen = 6.7 nA**

Surface generation adds significantly:

**I_surface = qn_iSP**

Where S ≈ 10⁴ cm/s (surface recombination velocity) and P = 2π×50µm (perimeter).

**I_surface ≈ 1.6×10⁻¹⁹ × 5.4×10¹¹ × 10⁴ × 3.14×10⁻² = 2.7 nA** at 25°C

Total dark current: **I_dark = I_gen + I_surface ≈ 3.1 nA** at 25°C, rising to ~50 nA at 70°C.

This dark current contributes shot noise:

**i_n,dark = √(2qI_darkB) = √(2 × 1.6×10⁻¹⁹ × 50×10⁻⁹ × 7.2×10⁹) = 0.34 µA RMS**

## 16.4 The Transimpedance Amplifier: Current to Voltage

### Understanding the TIA Challenge

The photodiode has done its quantum mechanical duty, converting our -11.4 dBm optical signal (after connector and coupling losses) into photocurrent:

**P_optical = 10^(-11.4/10) mW = 0.0724 mW**

**I_photo = R × P_optical = 0.94 A/W × 0.0724 mW = 68.1 µA average**

**Where the AC Modulation Comes From:**

The optical signal isn't constant - it's modulated with our 10.3125 Gbps data! The laser turns brighter for "1" bits and dimmer for "0" bits. This on-off keying (OOK) creates time-varying optical power:

```
Optical Power vs Time:
        "1"    "0"    "1"    "1"    "0"
Power   ┌──┐   ┌──┐   ┌──┐   ┌──┐
        │  │   │  │   │  │   │  │
     ───┘  └───┘  └───┘  └───┘  └───  
     
     P₁ (mark) = 0.122 mW
     P₀ (space) = 0.0137 mW
     P_avg = 0.0724 mW
```

The extinction ratio tells us how much the power varies:
- Extinction ratio = P₁/P₀ = 8.91 (or 9.5 dB)
- This ratio was set by the laser transmitter modulation

Each photon creates exactly one electron-hole pair. More photons = more current:
- During "1" bit: 0.122 mW → 122.5 µA (lots of photons)
- During "0" bit: 0.0137 mW → 13.7 µA (few photons)

With the 9.5 dB extinction ratio (ratio r = 8.91), the AC modulation swings between:
- Mark (1): **I₁ = I_avg × 2r/(r+1) = 68.1 × 17.82/9.91 = 122.5 µA**
- Space (0): **I₀ = I_avg × 2/(r+1) = 68.1 × 2/9.91 = 13.7 µA**

The AC component is simply: **I_AC = I₁ - I₀ = 108.8 µA peak-to-peak**

This current varies at our data rate - billions of times per second! The TIA must amplify these tiny, fast variations into measurable voltages.

These are pitifully small currents—a typical LED indicator draws 250,000 times more current.

### Basic TIA Architecture

The transimpedance amplifier's elegance lies in its simplicity. A high-gain amplifier with resistive feedback simultaneously provides low input impedance (to handle the photodiode's capacitance) and current-to-voltage conversion:

**Why TIA Has Low Input Impedance:**

The negative feedback creates a "virtual ground" at the input:

```
                 Rf = 2.5kΩ
                 ├─────────────────┤
                 │                 │
     PD      C1  │    ┌─────┐     │
  ──►│──┬───┤├───┴────┤ -A  ├─────┴───── Vout = -Iph × Rf
        │   100pF     │ G=1000     
     -5V│             └─────┘      
        ╧             Virtual Ground
                      (≈0V always)

How Virtual Ground Works:
1. If input tries to rise above 0V
2. Output goes strongly negative (×1000)
3. Negative feedback through Rf pulls input back to 0V
4. Net result: Input stays at ≈0V regardless of current
```

The input impedance looking into this virtual ground is:

**Z_in = Rf/(1+A) ≈ 2500Ω/1000 = 2.5Ω**

This is 1000× lower than the feedback resistor!

**How Low Impedance "Handles" Photodiode Capacitance:**

It's not about matching - it's about preventing an RC filter! Consider two cases:

```
Case 1: Direct to 2.5kΩ Load (No TIA)
        
   PD → 0.15pF → 2.5kΩ → Ground
   
   This forms RC lowpass: f_3dB = 1/(2πRC) = 424 MHz
   Result: 10 Gbps signal completely filtered out!

Case 2: Into TIA Virtual Ground (2.5Ω input)

   PD → 0.15pF → 2.5Ω (virtual ground)
   
   New RC cutoff: f_3dB = 1/(2π × 2.5Ω × 0.15pF) = 424 GHz!
   Result: No filtering of 10 Gbps signal
```

**The Physics - Why This Matters:**

When photodiode current changes rapidly (billions of times per second):

```
Without TIA (High Impedance Load):
ΔI → Must charge C_pd through R_load → Slow voltage rise
Time constant: τ = R_load × C_pd = 2.5kΩ × 0.15pF = 375ps
Can't follow 97ps bits!

With TIA (Virtual Ground):
ΔI → Flows directly into virtual ground → No capacitor charging!
Current instantaneously becomes voltage via Rf
Bandwidth limited only by amplifier, not RC
```

**Visual Demonstration:**

```
High Impedance Load:          Low Impedance TIA:
                                     
I_photo ──┤C├──[R]──┤         I_photo ──┤C├──●── Virtual Gnd
                                           │
Capacitor must charge              Current flows directly
Voltage lags current               No voltage across C_pd
V = slow integral of I             V_out = -I × Rf instantly
```

The key insight: **The virtual ground prevents voltage from building up across the photodiode capacitance.** Since V = Q/C and we keep V ≈ 0, the capacitor never charges significantly, so it can't slow down the signal!

This is why all high-speed photoreceivers use transimpedance amplifiers - they make the photodiode capacitance "disappear" by preventing voltage from developing across it.

### The Fundamental Design Trade-offs

TIA design embodies the classic engineering trilemma: gain, bandwidth, and noise. You can optimize any two at the expense of the third.

The bandwidth limitation comes from the RC time constant formed by Rf and the total input capacitance:

**Understanding the RC Time Constant:**

Rf (feedback resistor) is the resistor connecting the amplifier output back to its input. It serves two critical functions:
1. Sets the gain: V_out = I_photo × Rf
2. Forms an RC filter with parasitic capacitances

```
The Hidden RC Circuit in Every TIA:

                 Rf = 250Ω
     ┌───────────┤├──────────┐
     │                       │
     │  ┌─────┐              │
  ───┴──┤ -A  ├──────────────┴─── Vout
     ↑  └─────┘
     │
   C_total (all capacitances in parallel)
     │
     ╧

Where C_total = C_pd + C_amp + C_parasitic
```

**What is an RC Time Constant?**

When current suddenly changes, the voltage across a capacitor cannot change instantly. It must charge through the resistance:

```
Capacitor Charging:
V(t) = V_final × (1 - e^(-t/τ))

Where τ = RC is the time constant

At t = τ: Charged to 63.2%
At t = 2τ: Charged to 86.5%
At t = 3τ: Charged to 95.0%
At t = 5τ: Charged to 99.3%
```

**Why This Limits Bandwidth:**

For sinusoidal signals, the RC circuit acts as a lowpass filter:

```
Frequency Response:
|H(f)| = 1/√(1 + (f/fc)²)

Where fc = 1/(2πRC) is the -3dB frequency

At f = fc: Output is 0.707× input (-3dB)
At f = 10fc: Output is 0.1× input (-20dB)
```

**Specific TIA Example:**

Let's trace what happens when photocurrent steps from 10µA to 100µA:

```
Initial: I = 10µA, Vout = 10µA × 250Ω = 2.5mV
Final: I = 100µA, Vout = 100µA × 250Ω = 25mV

With C_total = 0.25pF:
τ = RC = 250Ω × 0.25pF = 62.5ps

Voltage vs Time:
t=0:    2.5mV (starting)
t=62.5ps: 16.6mV (63% of change)
t=125ps: 22.1mV (86% of change)
t=187ps: 24.4mV (95% of change)

Rise time (10% to 90%) = 2.2τ = 137.5ps
This is LONGER than one 97ps bit period at 10 Gbps!
```

**f_3dB = 1/(2πRfC_total)**

Where C_total includes:
- Photodiode capacitance: **C_pd = εA/W = 13.9ε₀ × π(25µm)² / 2.5µm = 0.15 pF**
- TIA input capacitance: **C_in ≈ 0.05 pF**
- Parasitic capacitance: **C_par ≈ 0.05 pF**
- Total: **C_total ≈ 0.25 pF**

**The Inescapable Trade-off:**

```
Want high gain? → Need large Rf → But RC increases → Bandwidth drops
Want high bandwidth? → Need small Rf → But gain drops → Poor sensitivity
Want low noise? → Need large Rf → But bandwidth drops again

You cannot win all three!
```

For different feedback resistor values:

| Rf (Ω) | Gain (dB) | f_3dB (GHz) | i_n,thermal (µA RMS) | SNR @ -18dBm |
|--------|-----------|-------------|---------------------|--------------|
| 50 | 34 | 12.7 | 30.8 | -6 dB (fail) |
| 250 | 48 | 2.5 | 13.8 | 3 dB (marginal) |
| 500 | 54 | 1.3 | 9.7 | 6 dB (marginal) |
| 2500 | 68 | 0.25 | 4.4 | 12 dB (good) |
| 5000 | 74 | 0.13 | 3.1 | 15 dB (excellent) |

The sweet spot for 10 Gbps typically falls around 250-500Ω, but this requires bandwidth enhancement techniques to reach the needed 7.2 GHz.

### Advanced TIA Techniques

Modern TIAs employ sophisticated techniques to break the classical trade-offs. The shunt-shunt feedback architecture uses multiple amplifier stages with tailored frequency responses:

```
Enhanced Bandwidth TIA Architecture:

           Rf = 2.5kΩ    Cf = 50fF
     ┌─────┤├──────┬────┤├────┐
     │             │          │
  ──►┤  A1: 40dB   ├──┤ A2: 20dB ├──→ Output
     │  BW: 1GHz   │  │ BW: 15GHz│    50Ω differential
     └─────────────┴──┴──────────┘

Transfer function: H(s) = -Rf / [1 + s(RfCin)/(1+A) + s²LCin/(1+A)]
```

The inductor L (typically 1-2 nH) creates a resonance that extends bandwidth:

**f_peak = 1/(2π√(LC_in)) ≈ 10 GHz**

This pushes the -3dB bandwidth to:

**f_3dB,enhanced ≈ 1.8 × f_3dB,basic = 1.8 × 0.25 GHz = 4.5 GHz**

Automatic gain control adapts the receiver to varying signal levels. The implementation typically uses a peak detector with millisecond time constants:

```
AGC Control Loop:

TIA Output → Peak → Comparator → Control
           Detector  (Vref)      Logic
               ↓                    ↓
           C = 1µF              Rf select:
           (τ = 1ms)            5kΩ, 2.5kΩ,
                                1kΩ, 500Ω
```

The single-ended photodiode current must become differential signals. Modern TIAs integrate this function:

```
Differential Output Generation:

TIA Core → Buffer → 180° → OUT+ (CML levels)
                  Hybrid → OUT- (400mV p-p diff)

Common-mode rejection: >40 dB
Output impedance: 100Ω differential
Rise/fall time: <35 ps
```

### Real TIA Implementation

A practical TIA for our 10G receiver might use the following architecture with specific component values:

```
Complete TIA Schematic:

                    VCC (3.3V)
                      │
                    ┌─┴─┐ RFC (600Ω @ 100MHz)
                    │   │
     ┌──────────────┴───┴─────────────┐
     │          R1 = 2.5kΩ            │
     │     ┌────┤├────────┤├────┐     │
     │     │         C1 = 50fF   │     │
     │     │                     │     │
 PD ─┴─►───┤Q1    Q2       Q3    ├─────┴─→ OUT+
           │ InGaAs  SiGe   SiGe  │         (200mV)
    -5V    │  HBT    HBT    HBT  │
     │     │ ft=60GHz            ├─────────→ OUT-
     ╧     └─────────────────────┘
           
     C2 = 100pF  C3 = 0.1µF  C4 = 10µF
     (bypass capacitors at VCC pins)
```

The input stage uses a cascode configuration to minimize Miller capacitance multiplication. InGaAs heterojunction bipolar transistors (HBTs) provide the needed ft (transition frequency):

**ft = gm/(2πCπ) ≈ 60 GHz** for 10mA bias current

The transimpedance core operates with:
- Open loop gain: **A = gmRout = 0.4 S × 1kΩ = 400 (52 dB)**
- Closed loop gain: **Zt = Rf/(1 + 1/A) ≈ Rf = 2.5 kΩ**
- Input impedance: **Zin = Rf/A ≈ 6.25 Ω**

Following the transimpedance core, a cherry-picker buffer provides:
- Output impedance: **50Ω single-ended, 100Ω differential**
- Voltage gain: **Av = 2 (6 dB)**
- Bandwidth: **>15 GHz**

Power supply filtering cannot be overlooked:

**PSRR ≈ 20log₁₀(1 + jωRfCbypass) ≈ 20log₁₀(ωRfCbypass)**

At 1 MHz: PSRR = 20log₁₀(2π × 10⁶ × 2500 × 100×10⁻¹² ) = 30 dB
At 1 GHz: PSRR = 20log₁₀(2π × 10⁹ × 2500 × 0.1×10⁻¹² ) = 48 dB

The complete noise budget at -18 dBm sensitivity:
- Optical power: **P = 15.8 µW**
- Photocurrent: **I = 14.9 µA**
- Shot noise: **in,shot = √(2qIB) = 0.58 µA RMS**
- Thermal noise: **in,thermal = 6.9 µA RMS**
- Amplifier noise: **in,amp = 3pA/√Hz × √7.2GHz = 8.1 µA RMS**
- Total noise: **in,total = √(0.58² + 6.9² + 8.1²) = 10.6 µA RMS**
- SNR: **20log₁₀(14.9/10.6) = 3.0 dB** (marginal but adequate for FEC)

## 16.5 Complete ROSA Integration

### Mechanical Package Design

The TO-can (transistor outline) package has evolved from its origins housing simple transistors to become the dominant format for ROSAs. The TO-46 hermetic package provides:

```
TO-46 ROSA Package Specifications:

External Dimensions:
- Diameter: 5.6mm ±0.1mm
- Height: 4.5mm (without pins)
- Pin circle diameter: 2.54mm (100 mil)
- Pin diameter: 0.46mm (18 mil)
- Pin length: 4.0mm minimum

Materials:
- Header: Kovar (Fe-Ni-Co) for CTE matching
- Pins: Kovar with gold plating (50µ" over nickel)
- Window: AR-coated glass (R < 0.5% @ 1310±40nm)
- Seal: Glass-to-metal hermetic

Electrical Specifications @ 10 GHz:
- Pin capacitance: <0.08 pF
- Pin inductance: <0.8 nH
- Characteristic impedance: 50Ω ±5Ω
- Insertion loss: <0.5 dB
```

Inside, a ceramic substrate hosts the photodiode and possibly the TIA:

```
Internal Assembly Stack-up:

     Glass Window (0.5mm thick)
            ↓ 0.8mm
     Ball Lens (1.0mm sapphire)
            ↓ 0.5mm  
     Photodiode Die (InGaAs/InP)
            ↓ Die attach
     AlN Substrate (0.635mm thick)
     - εr = 8.8
     - Thermal conductivity: 170 W/m·K
     - Au traces: 10µm thick
            ↓ Solder attach
     TO-46 Header (1.0mm thick)
```

Wire bonds connect the photodiode to the substrate traces:

**Wire bond inductance: L = 0.2nH × length(mm) × ln(2h/d)**

Where h = loop height (0.2mm typical) and d = wire diameter (25µm).

For a 1mm bond wire: **L ≈ 0.9 nH**

At 10 GHz: **XL = 2πfL = 57Ω** - significant impedance!

This is why multiple parallel bonds are used:
- 2 wires in parallel: **L_eff = 0.45 nH, XL = 28Ω**
- 3 wires in parallel: **L_eff = 0.30 nH, XL = 19Ω**

### Thermal Management in ROSA

ROSAs generate far less heat than their transmitter counterparts, but thermal management still matters. Let's calculate the complete thermal budget:

**Power Dissipation Sources:**
- Photodiode (absorbed optical): **P_opt = 0.072 mW**
- Photodiode (I²R from bias): **P_bias = I_dark × V_bias = 50nA × 5V = 0.25 µW** (negligible)
- TIA (if integrated): **P_TIA = V_CC × I_CC = 3.3V × 45mA = 148.5 mW**
- Total: **P_total ≈ 149 mW**

**Thermal Resistance Network:**
```
Junction → Die Attach → Substrate → Header → Ambient
  θj-c       θc-s         θs-h       θh-a
```

For TO-46 package:
- θj-c (TIA junction to case): **80°C/W**
- θc-s (die attach): **10°C/W** (AuSn eutectic)
- θs-h (substrate to header): **15°C/W**
- θh-a (header to ambient): **200°C/W** (still air)

Total thermal resistance: **θj-a = 305°C/W**

Temperature rise: **ΔT = P × θ = 0.149W × 305°C/W = 45.4°C**

At 70°C ambient: **Tj = 70 + 45.4 = 115.4°C**

This exceeds the typical 110°C maximum rating! Solutions:
- Forced air cooling reduces θh-a to ~100°C/W
- Heat sink attachment reduces θh-a to ~50°C/W
- Lower power TIA design (<100mW)

Temperature impacts performance:
- Dark current: **I_dark(T) = I_dark(25°C) × 2^((T-25)/9)**
- At 115°C: **I_dark = 3nA × 2^(90/9) = 3.1 µA** (1000× increase!)
- Responsivity: **R(T) = R(25°C) × [1 - 0.0002(T-25)]**
- At 115°C: **R = 0.94 × 0.982 = 0.923 A/W** (1.8% drop)

### EMI Susceptibility and Shielding

Unlike transmitters that generate EMI, receivers suffer from it. The high-gain TIA amplifies any noise that couples into the signal path. Let's quantify the coupling mechanisms:

**1. Electric Field Coupling to Photodiode:**

The photodiode cathode-anode forms a dipole antenna with effective length:

**l_eff = h × (λ/π) × sin(πh/λ)**

For h = 1mm at 1 GHz (λ = 300mm):

**l_eff = 1mm × (300/π) × sin(π/300) ≈ 1mm**

Induced voltage from E-field:

**V_induced = E × l_eff = 1 V/m × 1mm = 1 mV**

This appears directly at the TIA input!

**2. Magnetic Field Coupling to Bond Wires:**

Bond wire loops have area A ≈ 0.2mm². From Faraday's law:

**V_induced = -dΦ/dt = -A × dB/dt**

For 1 A/m magnetic field at 1 GHz:

**B = μ₀H = 4π×10⁻⁷ × 1 = 1.26 µT**

**dB/dt = 2πf × B = 7.9×10⁻³ T/s**

**V_induced = 0.2×10⁻⁶ × 7.9×10⁻³ = 1.6 µV**

**3. Shielding Effectiveness:**

The TO-46 Kovar package (μr ≈ 1000) provides magnetic shielding:

**SE_magnetic = 20log₁₀[1 + μr×t/(2r)]**

Where t = 0.25mm (wall thickness) and r = 2.8mm (radius).

At 1 MHz: **SE = 20log₁₀[1 + 1000×0.25/(2×2.8)] = 33 dB**
At 1 GHz: **SE ≈ 20 dB** (μr drops with frequency)

For electric fields above 10 MHz:

**SE_electric = 20log₁₀[σt/(2ωε₀)] = 20log₁₀[3×10⁷×0.25×10⁻³/(2×2π×10⁷×8.854×10⁻¹²)] > 100 dB**

**4. Power Supply Rejection:**

Noise on VCC couples through finite PSRR:

**V_out_noise = V_CC_noise × 10^(-PSRR/20)**

With 10mV ripple and 30dB PSRR:

**V_out_noise = 10mV × 10^(-30/20) = 0.316 mV**

This is 0.2% of our 170mV signal—potentially visible in the eye diagram!

### Critical PCB Layout for ROSA

The printed circuit board design around the ROSA determines whether the module meets specifications or becomes an expensive paperweight. Every millimeter of trace, every via, every component placement affects performance at 10 GHz.

```
ROSA PCB Layout Design Rules:

Component Placement:
├─ ROSA position: <20mm from LC connector
├─ Orientation: Minimize bond wire coupling to signals
├─ Keep-out radius: 3mm (no traces/vias)
└─ Height clearance: 2mm (for optical path)

Critical Traces:
├─ Photodiode bias (-5V):
│  ├─ Width: 0.2mm (10Ω + jωL)
│  ├─ Current: 50nA to 5µA
│  └─ Filter: 10Ω + 10µF + 0.1µF
│
├─ TIA output (differential):
│  ├─ Width/Space: 0.15mm/0.15mm
│  ├─ Impedance: 100Ω ±5%
│  ├─ Length match: ±0.1mm (±0.7ps)
│  └─ Via coupling: <2 per trace
│
└─ Power supply (3.3V):
   ├─ Width: 0.3mm minimum
   ├─ Current: 50mA typical
   └─ Decoupling: 100pF + 0.1µF + 10µF

Layer Stack Assignment:
Layer 1: ROSA signals + components
Layer 2: SOLID GROUND (no splits!)
Layer 3: Power planes (3.3V, -5V)
Layer 4: Low-speed signals only
```

The ground plane on Layer 2 must be continuous with no breaks, slots, or splits under the ROSA. This provides:

1. **Return current path:** High-frequency return currents follow signal traces closely:

   **Current density J(x) = I/(πh) × h/(x² + h²)**
   
   Where h = 0.075mm (dielectric height) and x = lateral distance.
   
   90% of return current flows within: **x = ±3h = ±0.225mm** of signal trace!

2. **EMI shielding:** The ground plane reflects incident fields:

   **Shielding effectiveness SE = 8.7t/δ + 20log₁₀[Z_wave/(4Z_shield)]**
   
   At 1 GHz in 1oz copper: **SE > 80 dB**

3. **Thermal spreading:** Copper conducts heat away from hot spots:

   **Thermal resistance: θ = 1/(k×t×A) = 1/(400×35µm×1cm²) = 71°C/W**1 GHz. A 0.1 microfarad capacitor handles medium frequencies, while 10 microfarads provides bulk storage. Each capacitor needs its own via to ground—sharing vias defeats the purpose.

The output signal routing demands the same attention given to transmitter paths. Differential 100Ω impedance, matched lengths, no crossing of plane splits—all the high-speed design rules apply. The receiver has done its job; don't corrupt the signal in the last few centimeters.

## 16.6 Signal Path Analysis: From Light to Logic

### Complete Signal Chain

Let's trace our -10.6 dBm optical signal through the entire receiver, following each transformation with the detail needed to understand why each component exists and how they interconnect.

**Stage 1: LC Connector Interface**
- Input: -10.6 dBm (0.0871 mW)
- Fresnel loss: 0.16 dB
- Gap loss: 0.5 dB
- Contamination: 0.2 dB (typical)
- Output: -11.46 dBm (0.0714 mW)

**Stage 2: ROSA Optical Path**
- Ball lens coupling efficiency: 85% (-0.7 dB)
- Window loss: 0.05 dB
- Output: -12.21 dBm (0.0602 mW) incident on photodiode

**Stage 3: Photodetection**
- Quantum efficiency: 89.2%
- Responsivity: 0.94 A/W
- Photocurrent: **I = R × P = 0.94 × 0.0602 = 56.6 µA average**

With 9.5 dB extinction ratio (r = 8.91):
- Mark current: **I₁ = I_avg × 2r/(r+1) = 101.8 µA**
- Space current: **I₀ = I_avg × 2/(r+1) = 11.4 µA**
- Modulation depth: **90.4 µA peak-to-peak**

**Stage 4: Transimpedance Amplification**

The TIA converts tiny photocurrents to usable voltages while maintaining bandwidth:

```
TIA Implementation and PCB Connection:

    Photodiode        TIA Core           Output to AC Coupling
         │              │                       │
    ──►│─┴─────┬───────►├─────────┬────────────┤
         -5V   │        │   Rf    │            │
              ╧        │  2.5kΩ  │            ├─→ V_out
                       └─────────┘            │   141.5mV DC
                                             ╧    226mV p-p AC

PCB Implementation:
- PD cathode bond pad → 25µm Au wire → TIA input pad
- Bond wire length: <1mm (0.9nH inductance)
- Substrate trace: 50Ω microstrip, <2mm length
- Critical: No vias in signal path (would add 0.6nH)
```

Why TIA exists: Without it, 56.6µA into 50Ω load = 2.8mV - too small!
Different types:
- Shunt feedback (used here): Simple, stable
- Cherry-Hooper: Higher bandwidth but more complex
- Distributed: For >40 Gbps applications

Thermal considerations:
- TIA dissipates 150mW → ΔT = 12°C rise
- Bias drift: 2mV/°C → 24mV shift at 70°C
- Solution: Thermal pad under TIA die

**Stage 5: AC Coupling**

AC coupling removes DC bias and low-frequency variations:

```
AC Coupling Network:

TIA Output    C1      R1        To LA Input
    │        1nF    10kΩ           │
    ├────────┤├──────┤├────────────┤
    │                              │
    │        C2      R2            │
    └────────┤├──────┤├────────────┘
            1nF    10kΩ

Component values:
- C1,C2: 1nF (0402 package, C0G dielectric)
- R1,R2: 10kΩ (sets input bias point)
- Cutoff frequency: fc = 1/(2πRC) = 16 kHz
- Blocks DC while passing 10 Gbps data
```

Why AC coupling exists:
- TIA output sits at ~140mV DC
- LA input needs to center around 0V
- Temperature drift would shift operating point
- Without it: LA would saturate, no data recovery!

PCB layout critical:
- Capacitors within 1mm of LA input
- No vias between caps and LA (preserve bandwidth)
- Guard traces prevent coupling

Data rate considerations:
- 10 Gb/s: Needs fc < 100 kHz (√)
- 1 Gb/s: Needs fc < 10 kHz (√)
- 100 Mb/s: Needs fc < 1 kHz (√ with margin)

**Stage 6: Limiting Amplifier Chain**

The LA restores signal amplitude and creates digital levels:

```
Three-Stage Limiting Amplifier Details:

           Stage 1         Stage 2         Stage 3
AC Input → Linear Amp → Soft Limiter → Hard Limiter → Output Buffer
            20dB          14dB            6dB           

Stage 1 - Linear Amplification:
- Input: 226mV p-p (varies ±10dB with link conditions)
- Gain: 10× (20dB) linear
- Output: 2.26V p-p (begins to compress)
- Purpose: Boost signal above noise floor
- Implementation: Differential pair with resistive load

Stage 2 - Soft Limiting:
- Input: 0.2-5V p-p (wide range)
- Gain: 5× nominal, reduces with input level
- Output: 400mV p-p (nearly constant)
- Purpose: Begin amplitude stabilization
- Implementation: Gilbert cell with current steering

Stage 3 - Output Driver:
- Input: 400mV p-p
- Gain: 2× (6dB)
- Output: 800mV p-p differential
- Purpose: Drive 50Ω transmission lines
- Implementation: Emitter followers with current sources
```

Without LA: Signal amplitude varies 20dB → CDR cannot lock
Alternative: AGC could work but adds complexity and loop stability issues

Thermal management:
- LA dissipates 120mW concentrated in 1mm²
- Junction temp reaches 95°C without heatsinking
- Solution: Thermal vias under LA die to ground plane

**Stage 7: Output Buffer and Termination**

The output buffer drives the transmission lines to the SFP edge connector:

```
Output Network Implementation:

LA Output   R1    L1    C3     PCB Trace    Edge Finger
   Diff    150Ω  1nH   100pF   ~~50Ω~~      Pin 12/13
    │       │     │      │         │            │
  ──┴───────┴─────┴──────┴─────────┴────────────┤
  ──┬───────┬─────┬──────┬─────────┬────────────┤
    │      150Ω  1nH   100pF       │            │

Purpose of each component:
- R1,R2: Back termination prevents reflections
- L1,L2: Extends bandwidth, compensates bond wire
- C3,C4: AC coupling to SFP host board
- PCB traces: Controlled 100Ω differential impedance
```

Why output buffer exists:
- LA internal circuits use 5mA bias → can't drive 50Ω directly
- Buffer provides 20mA drive capability
- Maintains edge rates while driving capacitive loads

Without proper termination:
- Reflections from impedance mismatch
- ISI degrades eye opening by 40%
- Potential oscillation in high-gain system

PCB routing to edge fingers:
```
Layer 1: Differential pair, 6/6 mil width/space
         Length: 3.5mm ±0.1mm (matched)
         Reference: Layer 2 ground plane
         
Layer 2: SOLID ground, no splits
         Return current path directly under traces
         
Key: Route as pair, no stubs, chamfered bends
```

Thermal path from LA to case:
- Thermal vias: 12× 0.3mm diameter under die
- Copper pour on Layer 3 for spreading
- Total thermal resistance: 45°C/W to ambient

**Complete Signal Evolution:**

| Stage | Signal Type | Level | Bandwidth | SNR |
|-------|-------------|-------|-----------|-----|
| Optical | 1310nm photons | -12.2 dBm | N/A | N/A |
| Photodiode | Current | 56.6 µA avg | 7.2 GHz | >20 dB |
| TIA Output | Voltage | 141 mV DC | 5 GHz | 8.6 dB |
| After AC | Voltage | 0V DC, 226mV AC | 5 GHz | 8.6 dB |
| After LA | Digital | 800mV p-p diff | 12 GHz | >20 dB |
| At Pins | CML | 400mV p-p/50Ω | 10 GHz | >18 dB |

### Eye Diagram Evolution

The eye diagram tells the story of signal quality through the receiver. At each stage, we can observe how the signal transforms:

**At Photodiode Output (Current Domain):**
```
Signal Characteristics:
- Level: 11.4 µA (space) to 101.8 µA (mark)
- Modulation: 90.4 µA p-p
- Bandwidth: 7.2 GHz (limited by 62 ps transit time)
- Noise: 0.51 µA RMS (shot noise limited)
- SNR: >35 dB

Eye Diagram Features:
         Cannot directly observe - currents too small
         If we could see it:
         - Eye height: >95% (very clean)
         - Rise time: 62 ps (hole transit)
         - Fall time: 42 ps (electron transit)
         - No visible noise
```

**After TIA (Voltage Domain, Before AC Coupling):**
```
Signal Characteristics:
- DC level: 141.5 mV (temperature dependent)
- AC swing: 226 mV p-p
- Bandwidth: 5 GHz (RC limited)
- Noise: 26.5 mV RMS (thermal noise dominated)
- SNR: 8.6 dB (marginal)

Eye Diagram:
    250mV ┤ ╱╲    ╱╲    ╱╲
          ├╱  ╲  ╱  ╲  ╱  ╲   ← Fuzzy traces from noise
    141mV ┤────╲╱────╲╱────   ← DC offset visible
          ├╲  ╱╲╲  ╱╲╲  ╱
     30mV ┤ ╲╱  ╲╲╱  ╲╲╱
          └────────────────
            0   100  200 ps

- Eye height: 60% (noise eats margin)
- Jitter: 2.8 ps RMS
- Asymmetry from photodiode transit times
```

**After AC Coupling:**
```
Effect of AC Coupling:
- DC component removed → centered at 0V
- Low frequencies (<16 kHz) blocked
- Baseline wander if long strings of 1s or 0s
- 8B/10B coding prevents this

Eye Diagram:
    +113mV ┤ ╱╲    ╱╲    ╱╲
           ├╱  ╲  ╱  ╲  ╱  ╲
        0V ┤╲  ╱╲╲  ╱╲╲  ╱    ← Now centered
           ├ ╲╱  ╲╲╱  ╲╲╱
    -113mV ┤
           └────────────────
```

**After Stage 1 of LA (Linear Amplification):**
```
Signal amplified 10×:
- Swing: 2.26V p-p (beginning to compress)
- Noise amplified too: 265 mV RMS
- But SNR unchanged at 8.6 dB

Eye shows compression starting:
         ┌─╱─╲─╱─╲─╱─╲─┐ ← Top clipping
         ├╱   ╲   ╲   ╲│
         │╲   ╱╲   ╱╲  ╱
         └─╲─╱─╲─╱─╲─╱─┘ ← Bottom clipping
```

**After Complete LA Chain (Digital Output):**
```
Signal Characteristics:
- Level: 800mV p-p differential (constant)
- Rise/fall: 35 ps (restored by peaking)
- Bandwidth: >12 GHz
- Jitter: 3.5 ps RMS (accumulated)
- SNR: >20 dB (noise removed by limiting)

Eye Diagram:
    +400mV ┤━━━━━━━━━━━━━┓
           ┃             ┃
           ┃    >80%     ┃  ← Clean digital eye
           ┃   opening   ┃
    -400mV ┤━━━━━━━━━━━━━┛
           └─────────────────
             0   50  100 ps

- Amplitude variations gone
- Noise eliminated by clipping
- Fast, clean transitions
- Ready for CDR
```

**At SFP Output Pins (After Termination):**
```
Final signal at module edge:
- CML levels: 400mV p-p into 50Ω load
- Common mode: 2.5V
- Differential impedance: 100Ω ±5%
- Return loss: >12 dB to 10 GHz

Eye at receiver chip input:
         Some degradation from PCB transmission
         - Eye height: 75% (vs 80% at LA output)
         - Added jitter: 1 ps from ISI
         - Still exceeds requirements
```

The transformation from barely detectable photocurrents (nanoamperes of signal) to robust digital signals (hundreds of millivolts) represents a gain of over 70 dB while maintaining signal integrity sufficient for error-free transmission.

### Sensitivity Calculation

Receiver sensitivity—the minimum detectable optical power—determines link reach and margin. For our target BER of 10⁻¹² (one error per trillion bits), we need careful analysis.

The fundamental limit comes from shot noise on the photocurrent:

**SNR_shot = I_signal² / (2qI_signal B) = I_signal / (2qB)**

For BER = 10⁻¹² with OOK modulation, we need Q = 7:

**Q = (I₁ - I₀)/(σ₁ + σ₀)**

For 10:1 extinction ratio and assuming Gaussian noise:

**Q = 9I₀/(2σ) = 7**

This gives: **I₀ = 1.56σ**

But thermal noise dominates in practical PIN receivers:

**σ_total = √(σ²_shot + σ²_thermal + σ²_amp)**

At sensitivity limit with I_avg = 15 µA:
- Shot noise: **σ_shot = √(2 × 1.6×10⁻¹⁹ × 15×10⁻⁶ × 7.2×10⁹) = 0.59 µA**
- Thermal noise: **σ_thermal = 6.9 µA**
- Amp noise: **σ_amp = 8.1 µA**
- Total: **σ_total = 10.7 µA**

Required average current: **I_avg = 5.5 × I₀ = 5.5 × 1.56 × 10.7 = 91.8 µA**

Theoretical sensitivity:
**P_min = I_avg/R = 91.8 µA / 0.94 A/W = 97.7 µW = -10.1 dBm**

But we must add real-world penalties:

| Penalty Source | Value (dB) | Reason |
|----------------|------------|---------|
| Connector loss | 0.5 | Fresnel + contamination |
| Coupling loss | 0.8 | Ball lens efficiency |
| Aging margin | 1.0 | Component degradation |
| Temperature | 0.5 | 0-70°C variations |
| Implementation | 1.0 | Non-ideal circuits |
| **Total** | **3.8 dB** | |

**Practical sensitivity: -10.1 - 3.8 = -13.9 dBm**

Our -10.6 dBm signal has only 3.3 dB margin—adequate but not generous. This is why link budgets require careful management.

## 16.7 Advanced Topics: APDs, Arrays, and FSOC

### When APDs Make Sense

Avalanche photodiodes (APDs) provide internal gain through impact ionization. When photogenerated carriers accelerate in high electric fields, they gain kinetic energy:

**E_kinetic = qE × λ_mfp**

Where E is the electric field (>10⁵ V/cm) and λ_mfp is the mean free path (~100 nm in InGaAs).

When E_kinetic exceeds the ionization threshold (~1.5E_g), the carrier can create a new electron-hole pair:

```
Impact Ionization Chain:

Photon → e⁻ + h⁺ (primary pair)
         ↓
e⁻ accelerates in high field
         ↓
e⁻ + lattice → 2e⁻ + h⁺ (impact ionization)
         ↓
Multiple generations → Avalanche gain M
```

The multiplication factor M depends exponentially on voltage:

**M = 1 / [1 - (V/V_br)ⁿ]**

Where V_br is breakdown voltage and n ≈ 2-3 for InGaAs.

But APDs add excess noise. The multiplication process is statistical, characterized by the excess noise factor:

**F = k_eff × M + (1 - k_eff)(2 - 1/M)**

Where k_eff is the effective ionization ratio. For InGaAs, k_eff ≈ 0.4, giving F ≈ 4 at M = 10.

The signal-to-noise improvement:

**SNR_APD/SNR_PIN = M/√F = 10/√4 = 5 (7 dB)**

This 7 dB improvement comes at significant cost:
- Bias voltage: 20-40V (vs 5V for PIN)
- Temperature coefficient: -0.4V/°C
- Gain variation: 2-3%/°C
- Bandwidth reduction: GBP = 100 GHz typical
- Cost: 5-10× higher than PIN

For our 40km link at -10.6 dBm, a PIN receiver provides adequate margin. APDs make sense for:
- Submarine cables (>100km spans)
- High data rates (40G+) where thermal noise dominates
- Systems requiring ultimate sensitivity

### Multi-Photodiode Arrays for FSOC

Free-space optical communication removes the fiber's constraints but introduces new challenges. Atmospheric turbulence causes beam wander, spreading, and scintillation. The receiver must collect light from a larger, time-varying area while maintaining high-speed response.

**Understanding Atmospheric Scintillation:**

Scintillation—the twinkling of stars—occurs when atmospheric turbulence creates refractive index variations. These act like dynamic lenses, focusing and defocusing the beam:

```
Scintillation Physics:

Turbulent eddies → n variations → Phase distortions → Intensity fluctuations
     (cm-m scale)    (Δn~10⁻⁶)     (radians)         (0.1-10× mean)

Scintillation index: σ_I² = <I²>/<I>² - 1

Weak turbulence (σ_I² < 0.3):
σ_I² = 1.23 C_n² k^(7/6) L^(11/6)

Strong turbulence (σ_I² > 1):
σ_I² saturates at ~3-5
```

For our 1km link at 1310nm with C_n² = 10⁻¹⁴ m^(-2/3):
**σ_I² = 1.23 × 10⁻¹⁴ × (2π/1.31×10⁻⁶)^(7/6) × 1000^(11/6) = 0.42**

**What ±65% Intensity Variation Actually Means:**

First, let's extract σ_I from σ_I²:
**σ_I = √0.42 = 0.65** (65% standard deviation)

The intensity follows log-normal statistics in weak turbulence. This means:
- Mean power: 100% (normalized)
- Standard deviation: 65% of mean

The log-normal distribution is asymmetric—it can increase more than it decreases:
- 1σ range: 35% to 165% of mean power
- 2σ range: 10% to 230% of mean power (95% of time)
- 3σ range: 3% to 300% of mean power (99.7% of time)

**Why Power Can Increase Beyond 100%:**

This isn't energy from nowhere—it's atmospheric focusing! Turbulence creates refractive index cells that act like lenses:

```
Normal Beam:          During Focusing Event:
||||||||||||          \||||||||||/
||||||||||||           \||||||||/
||||||||||||            \||||||/
     ↓                    \||/
  Receiver                 ↓
  (100% power)          Receiver
                       (300% power!)

The atmosphere temporarily concentrates power from 
a larger area onto the receiver - like a magnifying glass
```

The same volume of air that sometimes focuses can also defocus:
- Focusing: Collects light from 3× normal area → 300% intensity
- Defocusing: Spreads light over 30× area → 3% reaching receiver

Energy is conserved—what the receiver gains, the surrounding area loses.

**Understanding BER and FEC:**

**Bit Error Rate (BER):** The fraction of bits received incorrectly
- BER = 10⁻¹² means 1 error per trillion bits
- At 10 Gb/s: 1 error every 100 seconds
- BER = 10⁻⁹ means 1 error per billion bits  
- At 10 Gb/s: 1 error every 0.1 seconds (10 errors/second)

**Forward Error Correction (FEC):** Adds redundancy to detect and correct errors
- Reed-Solomon (255,223): Adds 32 check bytes per 223 data bytes
- Can correct up to 16 byte errors per block
- Overhead: 14.3% extra bandwidth
- Improves BER from 10⁻³ to 10⁻¹⁵ (12 orders of magnitude!)

**Duration Matters—Fade Statistics:**

Scintillation fades aren't constant. They follow temporal statistics:

```
Fade Duration Probability:
10ms:  63% (most common - atmospheric eddies passing)
100ms: 23% (larger turbulent cells)
1s:    10% (weather front edges)
10s:   3%  (fog banks, heavy rain cells)
>60s:  <1% (major weather events)
```

**System Response to Fades:**

**Short fade (<100ms):**
- Buffers absorb the burst errors
- FEC corrects when data arrives
- User sees no impact

**Long fade (>1s):**
- Buffers overflow
- TCP timeouts occur
- User experiences "frozen" connection
- System may switch to lower rate

**Why Lower Data Rates Tolerate Scintillation Better:**

It's NOT just fewer symbols—it's fundamental receiver sensitivity:

**10 Gb/s System:**
- Bit duration: 97 ps
- Required SNR for BER=10⁻¹²: 15.6 dB (Q=7)
- Receiver sensitivity: -13.9 dBm
- Thermal noise limited

**1 Gb/s System:**
- Bit duration: 970 ps (10× longer)
- Required SNR: Still 15.6 dB (same Q factor)
- BUT: Bandwidth reduced 10× → Noise reduced √10×
- Receiver sensitivity: -23.9 dBm (10 dB better!)
- Can use FEC more aggressively (more time per bit)

**100 Mb/s System:**
- Bit duration: 9.7 ns (100× longer than 10G)
- Bandwidth 100× narrower → Noise √100× = 10× lower
- Receiver sensitivity: -33.9 dBm (20 dB better!)
- Can use larger photodiodes (bandwidth doesn't matter)
- Can integrate signal longer (averaging reduces noise)

The key insight: **Lower rates improve sensitivity faster than scintillation degrades signal**

During a 90% fade (-10 dB):
- 10 Gb/s: Link fails (needs -13.9, gets -20.6 dBm)
- 1 Gb/s: Marginal but works (needs -23.9, gets -20.6 dBm)
- 100 Mb/s: No problem (needs -33.9, gets -20.6 dBm)

**Array Solutions and Signal Combining:**

**Design Constraints and Trade-offs:**

Before exploring combining architectures, we must understand the fundamental constraints that dictate where and how signals can be combined:

**1. Capacitance Addition - The Bandwidth Killer:**

When photodiodes connect in parallel, their capacitances sum directly. Let's see exactly why this destroys bandwidth:

```
The RC Circuit Physics:

Single Photodiode:               4 Photodiodes in Parallel:

   I_photo                         I₁  I₂  I₃  I₄
      ↓                            ↓   ↓   ↓   ↓
    ┌─┴─┐                        ┌─┴───┴───┴───┴─┐
    │CPD│ 0.15pF                 │ 4×CPD = 0.6pF │
    └─┬─┘                        └───────┬───────┘
      │                                  │
    [Rf] 250Ω                          [Rf] 250Ω
      │                                  │
      ↓                                  ↓
    V_out                              V_out

Why Bandwidth Drops - The Electron's Journey:

When photocurrent tries to change rapidly:
1. Electrons must charge/discharge the capacitor
2. This takes time: τ = RC
3. Voltage can't change faster than the RC time constant
```

**"But wait!" you might ask, "Didn't we just say the virtual ground prevents capacitance from mattering?"**

This is a crucial subtlety. The virtual ground does prevent the photodiode voltage from changing significantly, but it doesn't make the capacitance disappear! Here's why:

**The Hidden Feedback Path:**

```
Complete TIA Picture with Feedback Current:

                    Rf = 250Ω
                 ┌──┤├──────────┐
                 │              │
                 │   i_f        │
                 │   ←──        │
     I_pd    C_pd│              │
  ──►│────┬──┤├──┴──●─[-A]─────┴──── V_out
          │      Virtual         
       -5V│       Ground
          ╧      (≈0V)

Key insight: ALL of I_pd must flow through Rf!
But some current temporarily charges/discharges C_pd
```

**What Really Happens During a Current Step:**

When photocurrent suddenly increases from 10µA to 100µA:

```
Time = 0: Initial State
I_pd = 10µA, all flowing through Rf
V_out = -10µA × 250Ω = -2.5mV

Time = 0+: Current Steps Up
I_pd = 100µA (instantaneous change)
But V_out cannot change instantly!

Current Division:
I_pd = i_f + i_c
100µA = i_f + C(dV/dt)

Initially: i_f ≈ 10µA (can't change instantly)
So: i_c ≈ 90µA flows into capacitor!
```

**The Capacitor Charging Process:**

```
Even with virtual ground at ≈0V:
- Left plate of C_pd is at -5V (photodiode bias)
- Right plate is at ≈0V (virtual ground)
- Voltage across capacitor: 5V

When current changes, this voltage must change slightly:
ΔV_cap = ∫(i_c/C)dt

This small voltage change at the virtual ground 
(maybe 0.1mV) is amplified by -A to change V_out!
```

**Why More Capacitance = Slower Response:**

```
Single PD (0.15pF):
90µA charging current → dV/dt = 90µA/0.15pF = 600V/µs
Reaches new equilibrium in ~60ps

4 PDs (0.6pF):
360µA total step, but into 4× capacitance
dV/dt = 360µA/0.6pF = 600V/µs (same!)
NO - the feedback fights this!

Actually: dV/dt = 90µA/0.6pF = 150V/µs
4× slower! Takes ~240ps to settle
```

**The Mathematical Truth:**

The closed-loop transfer function of a TIA is:

**H(s) = -Rf / (1 + sRfC_total/(1+A))**

Even with huge gain A, the term sRfC_total still matters!

As frequency increases:
- At low f: |H| ≈ Rf (full gain)
- At f = (1+A)/(2πRfC_total): Down -3dB
- But A isn't infinite, so bandwidth = 1/(2πRfC_total) × (1+A)/β

Where β is the feedback factor. For typical values:
**f_3dB ≈ 0.5 to 0.7 × 1/(2πRfC_total)**

**The Bottom Line:**

The virtual ground keeps the photodiode voltage nearly constant, which helps a lot! But:
1. "Nearly" isn't "exactly" - microvolts of change still occur
2. These tiny changes control the entire output through high gain
3. More capacitance = more current needed for the same dV/dt
4. The feedback loop bandwidth fundamentally depends on RfC_total

So yes, the TIA helps enormously compared to a simple resistor load, but it cannot completely eliminate the bandwidth penalty of parallel capacitance. Physics always wins in the end!

**Detailed Analysis with Real Numbers:**

Consider a step change from "0" to "1" (11.4 µA to 101.8 µA):

**Single Photodiode Case:**
```
Initial state: V = 11.4 µA × 250Ω = 2.85 mV
Final state: V = 101.8 µA × 250Ω = 25.45 mV
Change needed: ΔV = 22.6 mV

Capacitor charging equation: V(t) = V_final(1 - e^(-t/RC))

Time constant: τ = RC = 250Ω × 0.15pF = 37.5 ps
Rise time (10% to 90%): t_r = 2.2τ = 82.5 ps
3dB bandwidth: f_3dB = 0.35/t_r = 4.24 GHz

At 10 Gb/s (97 ps bit period): BARELY ADEQUATE
```

**Four Photodiode Case:**
```
Same current change but 4× capacitance:
C_total = 4 × 0.15pF = 0.6pF

Time constant: τ = 250Ω × 0.6pF = 150 ps
Rise time: t_r = 2.2τ = 330 ps
3dB bandwidth: f_3dB = 0.35/t_r = 1.06 GHz

At 10 Gb/s: Rise time > 3 bit periods!
Result: COMPLETE EYE CLOSURE

The voltage literally cannot change fast enough to represent the data!
```

**Visual Demonstration of Bandwidth Loss:**

```
Input Current Pattern (10 Gb/s):
     ┌─┐ ┌─┐ ┌─┐
─────┘ └─┘ └─┘ └─────  Clean digital current

Single PD Output Voltage:
     ╱─╲ ╱─╲ ╱─╲
────╱   ╲   ╲   ╲────  Good edges, clear eye

4 PD Output Voltage:
    ╱───────────╲
───╱             ╲───  Cannot follow data!
```

**The Fundamental Physics:**

The capacitor stores charge Q = CV. To change voltage by ΔV requires moving charge ΔQ = CΔV.

Current is charge per time: I = ΔQ/Δt

Therefore: **Δt = CΔV/I**

With 4× capacitance, it takes 4× longer to achieve the same voltage change!

**This is why arrays devastate high-speed performance:**
- 1 PD: 4.24 GHz bandwidth ✓
- 2 PDs: 2.12 GHz bandwidth (marginal)  
- 4 PDs: 1.06 GHz bandwidth ✗
- 7 PDs: 606 MHz bandwidth ✗✗

No amount of clever engineering can overcome this fundamental physics. The only solution is to avoid parallel connection for high-speed applications.

**2. Current Mode vs. Voltage Mode - Fundamental Circuit Theory:**

```
Current Mode (Can Sum):         Voltage Mode (Cannot Sum):

I₁ →┐                          V₁ →┐
I₂ →┼→ I_total = I₁+I₂+I₃      V₂ →┼→ V_total = ???
I₃ →┘                          V₃ →┘

Current sources in parallel:   Voltage sources in parallel:
Natural addition at node       Would short each other!
```

**Why current summing works:** The TIA input is a "virtual ground" - essentially 0Ω impedance. Multiple current sources naturally sum at this node. Kirchhoff's Current Law handles the math.

**Why voltage summing fails:** Each TIA output is a low-impedance voltage source (~50Ω). Connecting them directly creates fighting sources, undefined output, and potential damage.

**3. Impedance Matching - The 50Ω Religion:**

High-speed signals demand matched impedances to prevent reflections:

```
Impedance Mismatch Effects:

Source → Transmission Line → Load
 50Ω         Z₀=50Ω         Z_L

Reflection coefficient: Γ = (Z_L - Z₀)/(Z_L + Z₀)

If Z_L = 50Ω: Γ = 0 (no reflection) ✓
If Z_L = 25Ω: Γ = -0.33 (33% reflects) ✗
If Z_L = ∞:   Γ = 1 (100% reflects) ✗

At 10 Gb/s, 10% reflection causes:
- 20% eye closure
- 3 ps additional jitter
- Potential oscillation
```

Every interface must maintain proper termination. This is why we can't just wire multiple outputs together - the combined impedance would be Z_total = Z/N for N sources.

**4. Noise Correlation - The √N Advantage:**

```
Uncorrelated Noise Addition:    Signal Addition:

N sources, each σ noise         N sources, each S signal
Total noise = σ√N               Total signal = NS
SNR improves by √N              

Example with 7 elements:
Individual: SNR = 10 dB
Combined: SNR = 10 + 10log₁₀(7) = 18.5 dB
Improvement: 8.5 dB
```

But this only works if noise sources are independent. Photodiode shot noise? Independent. ✓
TIA thermal noise? Independent if separate. ✓
Power supply noise? Correlated if shared! ✗

This drives the need for independent channels rather than simple summing.

**5. Timing Alignment - The Hidden Killer:**

At 10 Gb/s, each bit lasts only 97 picoseconds:

```
Timing Skew Impact:

Element 1: ─┐╱╲╱╲╱╲╱
            │  │  │
Element 2: ─┘╲╱╲╱╲╱╲  ← 20ps skew

Combined:   ─╱╲╲╱╲╲╱  ← ISI destroys eye!

Sources of skew:
- Path length differences: 0.15mm = 1ps
- Component variations: ±10ps typical
- Temperature gradients: 2ps/°C
- Total budget at 10 Gb/s: <10ps!
```

For 1mm element spacing in an array, outer elements have 3mm longer paths = 20ps skew. Without careful delay matching, combining destroys the eye diagram.

**Analysis at Each Signal Chain Stage:**

**Stage 1: After Photodiode (Current Domain)**
```
Can we combine here? YES, but with severe bandwidth penalty

7 photodiodes → Summing Node → Single TIA
                (Virtual Gnd)

Circuit Implementation:
     ┌────────────────────┐
PD1 ─┤ →11.4-101.8µA      │
PD2 ─┤ →11.4-101.8µA      ├─ Σ currents → TIA
 ⋮   │    each element    │  79.8-712.6µA total
PD7 ─┘                    ╧

Physics: Currents add algebraically at virtual ground
Bandwidth impact: f_3dB = 1/(2πR_f C_total)

Data rate analysis:
- 10 Gb/s needs >7 GHz: C_max = 35 fF → Cannot use ANY array!
- 1 Gb/s needs >700 MHz: C_max = 350 fF → 2 PDs maximum
- 100 Mb/s needs >70 MHz: C_max = 3.5 pF → 23 PDs possible

The math is unforgiving: bandwidth drops linearly with photodiode count.
```

**Stage 2: After TIA (Voltage Domain)**
```
Can we combine here? NO - voltage summing violates circuit theory

PD1 → TIA1 → 50Ω, 141mV DC + 226mV AC ─┐
PD2 → TIA2 → 50Ω, 141mV DC + 226mV AC ─┼─ ???
PD3 → TIA3 → 50Ω, 141mV DC + 226mV AC ─┘

Problems:
1. Each output is low impedance (50Ω)
2. Direct connection shorts outputs together
3. Undefined voltage at junction
4. Potential damage to output drivers

Resistive combining network?
     R₁
V1 ──┤├──┐
     R₂  ├── V_out (massive attenuation!)
V2 ──┤├──┘

For matched impedances: 6dB loss per stage!
7 inputs → 16.9 dB loss → Signal buried in noise
```

**Stage 3: After Limiting Amplifier (Digital Domain)**
```
Can we combine here? YES - this is the optimal location

PD1 → TIA1 → LA1 → 800mV digital ─┐
PD2 → TIA2 → LA2 → 800mV digital ─┼→ Digital MUX/DSP
PD3 → TIA3 → LA3 → 800mV digital ─┘

Advantages:
- Full bandwidth preserved per channel
- Digital levels immune to noise
- Timing can be adjusted digitally
- Smart algorithms possible (selection, weighting)

Implementation:
- High-speed digital MUX (>10 Gb/s capability)
- FPGA/ASIC for adaptive combining
- Per-channel delay adjustment
- Standard digital interfaces (CML/LVDS)
```

**Stage 4: At SFP Output Pins**
```
Can we combine here? ABSOLUTELY NOT

The SFP MSA defines exactly ONE differential pair:

Pin 12: RD+ ─┐
             ├─ 100Ω differential data
Pin 13: RD- ─┘

7 channels → 2 pins is impossible because:
1. No protocol for multiplexing at physical layer
2. Receiver expects single differential signal
3. Impedance would be destroyed (14Ω!)
4. No timing reference between channels

Even if we tried:
CH1+ ─┐
CH2+ ─┼─ Impedance = 100Ω/7 = 14Ω ✗
  ⋮   │  Reflections destroy signal
CH7+ ─┴→ Pin 12 (expecting 100Ω)
```

**Practical Implementations:**

Based on these constraints, here are the viable approaches:

**1. Current Summing (100 Mb/s - 1 Gb/s Max):**
```
Simple Implementation for Lower Rates:

All PDs → Summing Node → High-Gain TIA → LA → Output
           Low C_total     Rf = 5-10kΩ

- Bandwidth limited but adequate for ≤1 Gb/s
- Simple, low cost, low power
- Good for high reliability links
- Spatial diversity inherent
```

**2. Individual Channels (Required for 10 Gb/s):**
```
Full Parallel Processing:

Each PD → Own ROSA → Digital Domain → Smart Combining

- No bandwidth compromise
- Maximum flexibility
- High cost and complexity
- 7× power consumption
```

**3. Hybrid Architecture (Best Compromise):**
```
Center Element: Optimized for 10 Gb/s
Outer Ring: Current summed for diversity

Provides 10 Gb/s when aligned, degrades gracefully
Only 2× cost, moderate complexity
```

The key insight: High-speed arrays require processing in the digital domain. Analog combining destroys bandwidth through capacitance addition. The physics cannot be cheated - only worked around through clever architecture.

**PCB Layout for Array Combining:**

```
7-Element Array PCB Implementation:

Layer 1 (Signal):
    ┌─────────────────────────────┐
    │  PD1  [TIA1]  Diff → CDR1   │ ← 100Ω controlled impedance
    │   ●                         │
    │ ●   ●  [Sum]  Diff → CDR2  │ ← Current sum node
    │● ● ● ●                      │   (star configuration)
    │ ●   ●                       │
    │   ●                         │
    └─────────────────────────────┘

Layer 2: SOLID GROUND (critical!)

Layer 3 (Power):
    -5V photodiode bias (star routing)
    +3.3V TIA supply (filtered per channel)

Layer 4 (Control):
    I²C for threshold adjustment
    GPIO for channel enable/disable
```

Critical routing rules:
- Star configuration for bias to avoid crosstalk
- Matched trace lengths (±0.5mm) for outer elements
- Guard traces between high-speed signals
- Dedicated return vias for each photodiode

**Atmospheric Turbulence Compensation:**

The coherence diameter (Fried parameter) determines optimal element spacing:

**r₀ = 0.185 × (λ²/C_n²)^(3/5) × L^(-3/5)**

For different link scenarios:

| Link Distance | C_n² (m^(-2/3)) | r₀ | Optimal Array |
|--------------|-----------------|-----|---------------|
| 100m | 10⁻¹⁵ | 7.6cm | Single large PD |
| 1km | 10⁻¹⁴ | 2.4cm | 7-element array |
| 10km | 10⁻¹³ | 7.6mm | 19-element array |

Elements separated by more than r₀ experience uncorrelated scintillation—spatial diversity!

**Multiple ROSA Combining for Building-Scale FSOC:**

For larger apertures, combine complete ROSAs:

```
4-ROSA Spatial Diversity Receiver:

    ROSA1 ─────┐                   ┌─ Data1
    (NW corner)├─→ Switch Matrix →─┤
    ROSA2 ─────┤   + Combiner DSP  ├─ Data2
    (NE corner)├─→ with Adaptive →─┤
    ROSA3 ─────┤   Thresholds      ├─ Data3
    (SW corner)├─→ and Timing   →──┤
    ROSA4 ─────┘   Recovery        └─ Data4
    (SE corner)
    
    Separation: 1-2 meters
    Benefit: Uncorrelated fading
    Combining gain: 10log₁₀(4) = 6 dB average
                   Up to 12 dB during deep fades
```

**Signal Combining at the Electrical Interface:**

The combined signals must interface with standard protocols:

```
Output Pin Mapping (SFP+ Compatible):

Pin  Signal      From Array
1    VeeT        Ground
2    Fault       OR of all LOS signals
3    TX_DIS      Not used
4    SDA         I²C data (diagnostics)
5    SCL         I²C clock
6    MOD_ABS     Ground (module present)
7    RS0         Rate select (10G/1G)
8    RX_LOS      Combined LOS indicator
9    RS1         Diversity mode select
10   VeeR        Ground
11   VeeR        Ground
12   RD-         Combined differential data
13   RD+         Combined differential data
14   VeeR        Ground
15   VccR        +3.3V (1.4W for array)
16   VccT        +3.3V
17   VeeT        Ground
18   TD+         Not used (RX only)
19   TD-         Not used (RX only)
20   VeeT        Ground
```

**Performance Benefits of Array Combining:**

1. **Scintillation Mitigation:**
   - Single element: Fades to <10% power
   - 7-element array: Worst element at 10%, others average 60%
   - Combining gain: 7.8 dB during fade

2. **Pointing Tolerance:**
   - Single 60µm PD: ±30µm pointing required
   - 216µm array: ±108µm pointing acceptable
   - 3.6× improvement in mechanical tolerance

3. **Background Rejection:**
   - Smaller individual elements = smaller field of view
   - Less solar background per element
   - Coincidence detection possible

The key insight: Arrays transform the impossible (10 Gbps through turbulence) into the merely difficult (multiple channels with smart combining).

### Why Arrays Are Hard at 10 Gbps

The fundamental challenge with arrays at high speed comes from the capacitance-bandwidth trade-off. Each photodiode adds capacitance in parallel, reducing the RC-limited bandwidth. To maintain 7.5 GHz bandwidth with a 250Ω TIA, total capacitance must stay below 0.085 picofarads—less than a single photodiode!

Traveling wave photodiodes offer one solution. Instead of lumping elements together, they're distributed along a transmission line. The capacitances don't add directly; instead, they become part of the line's characteristic impedance. Bandwidths exceeding 40 GHz are possible, though the design complexity rivals that of the original transmitter.

Another approach uses segmented detectors with electronic beam steering. A 2×2 array of elements, each with its own TIA, feeds an electronic switch matrix. High-speed comparators determine which segment receives the most light and route that signal to the output. The "dead time" during switching limits this to specialized applications.

For truly massive arrays—imagine 100×100 elements for wide field of view—high-speed operation becomes impossible with current technology. Each element would need its own readout channel, creating a data avalanche exceeding terabits per second. Physics and economics conspire against such designs.

### Breaking Free from SFP Constraints

The SFP package, while industry-standard, imposes strict limitations:

```
SFP Mechanical Constraints:
- Volume: 13.4 × 56.5 × 8.5 mm³ = 6.4 cm³
- PCB area: ~7 cm²
- Component height: <5mm
- Power budget: 1.5W maximum
- Thermal resistance: >50°C/W to ambient
```

For FSOC experimentation, abandoning these constraints opens new possibilities:

**Large Area Photodiodes:**

Without size constraints, we can use InGaAs photodiodes with dramatic size increases:

| Diameter | Area | Capacitance | Bandwidth | Dark Current |
|----------|------|-------------|-----------|--------------|
| 0.1 mm | 0.008 mm² | 0.15 pF | 10 GHz | 3 nA |
| 1 mm | 0.79 mm² | 15 pF | 100 MHz | 300 nA |
| 3 mm | 7.1 mm² | 135 pF | 11 MHz | 2.7 µA |
| 5 mm | 19.6 mm² | 375 pF | 4 MHz | 7.5 µA |

**Why Bandwidth Drops with Size:**

The bandwidth limitation comes from the RC time constant:

**Photodiode capacitance scales with area:**
**C_pd = ε₀εᵣA/W**

For InGaAs with εᵣ = 13.9, depletion width W = 2.5 µm:
- 100 µm diameter: C = 0.15 pF
- 5 mm diameter: C = 375 pF (2500× increase!)

**With typical 50Ω load resistance:**
**f_3dB = 1/(2πRC)**

- 100 µm PD: f_3dB = 1/(2π × 50Ω × 0.15pF) = 21.2 GHz
- 5 mm PD: f_3dB = 1/(2π × 50Ω × 375pF) = 8.5 MHz

**But it's worse with TIA input:**
With 250Ω TIA feedback resistor:
- 5 mm PD: f_3dB = 1/(2π × 250Ω × 375pF) = 1.7 MHz

**This is why the 5mm photodiode bandwidth drops to 4 MHz—the massive capacitance creates a severe RC limitation.**

**Data Rate Implications:**
- 10 Gb/s: Requires >7 GHz bandwidth → Maximum PD diameter ~200 µm
- 1 Gb/s: Requires >700 MHz bandwidth → Maximum PD diameter ~600 µm
- 100 Mb/s: Requires >70 MHz bandwidth → Maximum PD diameter ~2 mm

The trade-off is stark: collection area vs. speed. Choose based on link requirements.

**Advanced Optical Designs:**

Free from the ball lens constraint, we can implement sophisticated optical systems:

**1. Cassegrain Telescope Design:**

The Cassegrain uses two mirrors to achieve long focal length in a compact package:

```
Cassegrain vs. Simple Ball Lens Comparison:

Ball Lens (Current ROSA):              Cassegrain Telescope:
    1mm diameter                            200mm primary mirror
    ↓ (7.5° cone)                          ↓ (collimated)
    Ball                                   Parabolic Primary
    ↓ (0.58mm FL)                         ↓ (reflects to)
    PD (60µm)                             Hyperbolic Secondary
                                          ↓ (magnifies)
                                          PD (60µm)

Ball Lens Performance:                 Cassegrain Performance:
- Aperture: 1mm                       - Aperture: 200mm
- Light gathering: πr² = 0.785mm²     - Light gathering: πr² = 31,416mm²
- F-number: f/0.58                    - F-number: f/10 (typical)
- Aberrations: Significant            - Aberrations: Diffraction limited
- Spot size: 50-100µm                 - Spot size: 3.2µm (Airy disk)
```

**Optical Gain Explained:**

Optical gain = 10log₁₀(A_telescope/A_ball_lens)
            = 10log₁₀(31,416/0.785)
            = 46 dB

**This means 40,000× more photons collected!** What was a marginal -10.6 dBm signal becomes an overwhelming +35.4 dBm—enough to damage the photodiode. In practice, we'd operate with smaller aperture or add attenuation.

**Why Cassegrain for FSOC:**
- Long focal length (2m) in short package (200mm)
- Secondary mirror blocks center (reduces scintillation)
- Easy to add adaptive optics to secondary
- Proven design from astronomy

The 46 dB gain transforms link budgets: a 1km link becomes possible at 100km, or the same 1km link works through heavy fog.

**2. Adaptive Optics:**

Atmospheric turbulence distorts the wavefront. A deformable mirror with Shack-Hartmann sensor can correct these distortions:

- Wavefront sensor: 32×32 lenslet array
- Deformable mirror: 97 actuators
- Control bandwidth: >1 kHz
- Strehl ratio improvement: 0.1 → 0.8

**3. Spatial Diversity Combining:**

Multiple apertures with independent receivers:

```
Four 50mm apertures at corners of 1m square
Each feeds separate ROSA
DSP combines signals optimally

Advantages:
- Scintillation averaging
- Angle-of-arrival variation tolerance  
- Graceful degradation
```

**Thermal Management Freedom:**

Without SFP constraints:
- TEC cooling for photodiode (reduce dark current 100×)
- Water cooling for high-power TIAs
- Temperature stabilization to ±0.1°C

**Ultimate Achievable Performance:**

Combining all advantages:
- Optical gain: 46 dB (200mm aperture)
- Reduced dark current: 20 dB (TEC to -20°C)
- Lower noise TIA: 3 dB (optimal design)
- Spatial diversity: 6 dB (4 apertures)
- **Total improvement: 75 dB!**

This transforms a marginal 1km link into a robust 100km capability.

## 16.8 Testing and Troubleshooting

### Essential Measurements

Validating ROSA performance requires systematic testing with calibrated equipment. Let's examine each critical measurement:

**1. Responsivity Verification:**

Equipment needed:
- Calibrated optical source (±1% accuracy)
- Precision current meter (pA resolution)
- Temperature-controlled mount

Procedure:
```
1. Set optical source to 1310 nm, -10 dBm
2. Measure ROSA temperature: T = 25°C ±0.5°C
3. Apply -5V bias to photodiode
4. Measure photocurrent: I_photo
5. Calculate: R = I_photo/P_optical

Expected: R = 0.94 ±0.05 A/W
```

**2. Bandwidth Measurement:**

Using a lightwave component analyzer (LCA):

Setup:
```
DFB Laser → Modulator → ROSA → Network Analyzer
     ↓           ↑                    ↑
Reference PD ────┴────────────────────┘

Calibration removes laser/modulator response
```

The measured response typically shows:

**|H(f)|² = |H₀|² / [1 + (f/f_c)²ⁿ]**

Where n ≈ 1 for first-order rolloff, f_c is the -3dB frequency.

Expected results:
- f_3dB > 7.2 GHz
- Rolloff: 20 dB/decade above f_3dB
- Peaking: <3 dB (indicates good damping)

**3. Sensitivity Testing:**

The gold standard uses a bit error rate tester (BERT):

```
BERT Pattern → Variable → ROSA → Error
Generator      Attenuator        Detector
   ↓                                ↑
   └────────── Clock ───────────────┘

Test conditions:
- Pattern: PRBS 2³¹-1
- Data rate: 10.3125 Gbps
- Measurement time: >100 seconds per point
```

Sensitivity determination:
1. Start at -5 dBm (strong signal)
2. Increase attenuation in 0.5 dB steps
3. At each level, count errors for 10¹² bits
4. Plot log(BER) vs optical power
5. Extrapolate to BER = 10⁻¹²

Typical result: -13.9 dBm ±0.5 dB

### Common Failure Modes

When receivers fail, symptoms often point to specific causes. Understanding the physics helps rapid diagnosis:

**No Signal Detection:**

Symptom: LOS (Loss of Signal) asserted, no data recovery

Diagnostic flow:
```
1. Measure optical power at ROSA input
   → <-20 dBm: Upstream problem (TX, fiber, connectors)
   → >-20 dBm: Continue diagnosis

2. Check photodiode bias
   → Measure voltage at cathode: Should be -5V ±0.25V
   → No bias: Check DC-DC converter, inductor continuity

3. Verify photocurrent
   → Remove TIA, measure PD current directly
   → Expected: ~50-100 µA at -10 dBm input
   → No current: PD damaged or optical misalignment

4. TIA functionality
   → Inject current pulse via 50Ω resistor
   → Should see amplified output
   → No output: TIA failure
```

**High Bit Errors (BER > 10⁻⁹):**

With adequate optical power, errors indicate signal integrity issues:

Power Supply Noise:
- Symptom: Pattern-dependent errors
- Test: Scope VCC with 50Ω termination
- Limit: <10 mV p-p ripple
- Fix: Add ferrite bead + capacitors

Impedance Mismatch:
- Symptom: ISI, eye closure
- Test: TDR measurement of output traces
- Limit: 100Ω ±10%
- Fix: Adjust trace width/spacing

Temperature Effects:
- Symptom: BER increases with time
- Test: Monitor ROSA case temperature
- Limit: <70°C
- Fix: Improve heatsinking/airflow

**Gradual Degradation:**

Performance metrics that drift over time:

| Parameter | Degradation Rate | Failure Mechanism |
|-----------|------------------|-------------------|
| Responsivity | -1%/year | Facet contamination |
| Dark current | +100%/year | Crystal defects |
| Bandwidth | -5%/3 years | Wire bond fatigue |
| Coupling | -0.5 dB/year | Epoxy creep |

Mitigation: Specify 2-3 dB link margin for 10-year life.

### Field Debugging Techniques

In the field, sophisticated test equipment gives way to practical debugging. Here's the field engineer's toolkit and methodology:

**Visual Fault Locator (VFL):**
- Red laser (650 nm, 1-5 mW)
- Visible through fiber jacket at breaks
- Range: 5 km in single-mode fiber
- Use: Quick continuity check

**Optical Power Meter:**
Essential specifications:
- Wavelength calibration: 1310 ±20 nm
- Accuracy: ±0.2 dB
- Range: +3 to -50 dBm
- Resolution: 0.01 dB

Power budget verification:
```
TX output:        -3 dBm (measure at TX pigtail)
- Connector loss:  0.5 dB × 2
- Fiber loss:      0.35 dB/km × distance
- Splices:         0.1 dB × N
- Margin:          3 dB
= RX input:        Must exceed -13.9 dBm
```

**Loopback Testing:**

Three levels of loopback isolation:

1. Electrical loopback:
   - Configure ASIC to loop TX→RX internally
   - Tests digital functionality only

2. Optical loopback:
   - Fiber jumper from TX to RX on same module
   - Tests electro-optics excluding plant

3. Far-end loopback:
   - Remote site loops signal back
   - Tests complete link bidirectionally

**OTDR for Fiber Characterization:**

Interpreting OTDR traces for receiver issues:

```
Loss (dB)
  │
  │\_ Good fiber (0.35 dB/km slope)
  │  \
  │   \__ Bad splice (0.8 dB step)
  │      \
  │       \_ Dirty connector (1.5 dB)
  │          \_
  │            ↑
  └────────────┴───→ Distance (km)
              Problem location

High connector loss often indicates contamination
affecting receiver performance
```

**The "Known Good" Method:**

Most effective field technique:
1. Swap suspected module with known good unit
2. If problem follows module → module fault
3. If problem stays → infrastructure issue
4. Document which specific function fails

Keep golden reference modules that are:
- Recently calibrated
- Protected from contamination
- Never opened or modified
- Tested across temperature range

## Summary: From Photons to Data—The Complete Journey

We've completed the journey from faint optical signals to robust digital data. Those photons that survived 40km of fiber have surrendered their energy to create electrical currents, which we've amplified and processed into useful signals.

**The Quantum-Mechanical Foundation:**
Each 1310nm photon carries exactly 0.948 eV of energy—enough to promote an electron across InGaAs's 0.75 eV bandgap with 0.198 eV to spare. The absorption coefficient of 10,400 cm⁻¹ means 96% of photons are captured in our 2.5 µm intrinsic region. With 89% quantum efficiency and 0.94 A/W responsivity, we achieve near-theoretical photon-to-electron conversion.

**The Engineering Marvel:**
The ROSA performs multiple precision operations in a 5.6mm diameter package:
- Ball lens focusing with ±7 µm alignment tolerance
- 22.4 kV/cm electric field sweeping carriers in 62 ps
- TIA amplifying 56.6 µA to 141.5 mV with 10.6 µA RMS noise
- Maintaining 7.2 GHz bandwidth despite 0.25 pF total capacitance

**The Complete Power and Current Budget:**
Starting with -10.6 dBm (0.0871 mW) from fiber:
- LC connector: -0.86 dB → -11.46 dBm (0.0714 mW)
- ROSA coupling: -0.75 dB → -12.21 dBm (0.0602 mW)
- Photocurrent: 56.6 µA average (0.94 A/W × 0.0602 mW)
- After TIA: 141.5 mV DC with 226 mV p-p modulation
- SNR: 8.6 dB (marginal but sufficient)
- After limiting: 400 mV p-p differential CML output

**Critical Materials and Components:**
- InGaAs photodiode: In₀.₅₃Ga₀.₄₇As lattice-matched to InP
- Sapphire ball lens: n = 1.765, CTE = 5.3 ppm/°C
- AlN substrate: εr = 8.8, k = 170 W/m·K
- Kovar TO-46: CTE-matched, μr ≈ 1000 for shielding
- Si₃N₄ AR coating: n = 2.0, λ/4 thickness = 164 nm

**For FSOC Applications:**
Breaking free from SFP constraints enables:
- 5mm photodiodes: 2500× collection area, 4 MHz bandwidth
- 200mm telescopes: 46 dB optical gain
- TEC cooling: 100× dark current reduction
- Array receivers: Turbulence averaging
- Total link improvement: 75 dB possible

**The Bottom Line:**
The ROSA successfully extracts our 10.3125 Gbps data from -10.6 dBm of optical power with 3.3 dB margin to the -13.9 dBm sensitivity limit. Every element—from LC connector alignment through quantum efficiency to thermal noise—has been optimized within the constraints of physics and economics.

The photons have completed their journey. From laser through fiber to photodiode, they've carried our data faithfully. The ROSA has extracted their message and delivered it to the electronic domain. Chapter 17 awaits, where clock and data recovery circuits will extract pristine timing and complete the optical communication system.