/**
 * PlanckComputation.ts - Planck Scale Computation Model
 * PRD-04 Phase 4.4: Module M04.04
 * 
 * Implements computational limits at the Planck scale, including:
 * - Lloyd's limit for maximum computation rate
 * - Maximum computation density
 * - Fundamental limits of information processing
 * 
 * Dependencies:
 * - Logger (M01.01)
 * 
 * Note: InformationTheory (M04.02) and PhysicalConstants (M01.06) are listed
 * in PRD but this module defines its own constants for self-containment.
 * 
 * Key formulas:
 * - Maximum operations/second = 2E/(πħ)
 * - Maximum bits = E·t/(πħ·ln2)
 */

import { HashVerifier } from '../../core/logger/HashVerifier';

// ============================================================================
// PHYSICAL CONSTANTS
// ============================================================================

const CONSTANTS = {
  // Speed of light (m/s) - exact
  c: 299792458,
  // Planck constant (J·s) - exact
  h: 6.62607015e-34,
  // Reduced Planck constant (J·s)
  hbar: 1.054571817e-34,
  // Boltzmann constant (J/K) - exact
  kB: 1.380649e-23,
  // Gravitational constant (m³/(kg·s²))
  G: 6.6743e-11,
  // Planck length (m)
  lP: 1.616255e-35,
  // Planck time (s)
  tP: 5.391247e-44,
  // Planck mass (kg)
  mP: 2.176434e-8,
  // Planck energy (J)
  EP: 1.956e9,
  // Planck temperature (K)
  TP: 1.416784e32,
  // Natural logarithm of 2
  LN2: Math.LN2
};

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Computation density specification
 */
export interface ComputationDensitySpec {
  operationsPerSecond: number;     // Operations per second
  operationsPerSecondPerVolume: number;  // Ops/s per cubic meter
  operationsPerSecondPerMass: number;    // Ops/s per kilogram
  bitsPerSecond: number;           // Bits processed per second
  hash: string;
}

/**
 * Maximum computation result
 */
export interface MaximumComputationResult {
  energy: number;                  // Energy available (Joules)
  time: number;                    // Time available (seconds)
  maxOperations: number;           // Maximum operations
  maxBits: number;                 // Maximum bits processed
  operationsPerSecond: number;     // Operations per second
  efficiency: number;              // Actual vs maximum (0-1)
  hash: string;
}

/**
 * Lloyd's limit result
 */
export interface LloydLimitResult {
  energy: number;                  // Energy (Joules)
  maxOpsPerSecond: number;         // Maximum operations per second
  maxBitsPerSecond: number;        // Maximum bits per second
  maxOpsPerJoule: number;          // Operations per Joule
  planckNormalized: number;        // In Planck units
  hash: string;
}

/**
 * Computation resource specification
 */
export interface ComputationResource {
  energy: number;                  // Energy in Joules
  mass: number;                    // Mass in kg
  volume: number;                  // Volume in m³
  time: number;                    // Time in seconds
}

/**
 * Margolus-Levitin bound result
 */
export interface MargolusLevitinResult {
  energy: number;                  // Energy (Joules)
  minTime: number;                 // Minimum time for orthogonal state transition
  maxFrequency: number;            // Maximum frequency of state changes
  hash: string;
}

/**
 * Landauer limit result
 */
export interface LandauerLimitResult {
  temperature: number;             // Temperature (Kelvin)
  minEnergyPerBit: number;        // Minimum energy to erase one bit (Joules)
  maxBitsPerJoule: number;        // Maximum bits erased per Joule
  hash: string;
}

/**
 * Bremermann limit result
 */
export interface BremermannLimitResult {
  mass: number;                    // Mass (kg)
  maxBitsPerSecond: number;       // Maximum bits per second
  maxOpsPerSecond: number;        // Maximum operations per second
  hash: string;
}

/**
 * Black hole computer specification
 */
export interface BlackHoleComputerSpec {
  mass: number;                    // Mass (kg)
  schwarzschildRadius: number;    // Event horizon radius (m)
  hawkingTemperature: number;     // Hawking temperature (K)
  lifetime: number;               // Evaporation time (seconds)
  maxOperations: number;          // Maximum operations before evaporation
  maxMemory: number;              // Maximum memory (bits)
  hash: string;
}

// ============================================================================
// COMPUTATION DENSITY CLASS
// ============================================================================

/**
 * ComputationDensity - Computes maximum computation density
 */
export class ComputationDensity {
  private readonly hash: string;

  constructor() {
    this.hash = HashVerifier.hash(JSON.stringify({
      class: 'ComputationDensity',
      constants: CONSTANTS
    }));
  }

  /**
   * Maximum computation density at Planck scale
   * One operation per Planck time per Planck volume
   */
  maxPlanckDensity(): ComputationDensitySpec {
    const planckVolume = Math.pow(CONSTANTS.lP, 3);
    const opsPerSecond = 1 / CONSTANTS.tP;
    const opsPerSecondPerVolume = opsPerSecond / planckVolume;
    const opsPerSecondPerMass = opsPerSecond / CONSTANTS.mP;
    const bitsPerSecond = opsPerSecond / CONSTANTS.LN2;

    return {
      operationsPerSecond: opsPerSecond,
      operationsPerSecondPerVolume: opsPerSecondPerVolume,
      operationsPerSecondPerMass: opsPerSecondPerMass,
      bitsPerSecond,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'maxPlanckDensity',
        opsPerSecond
      }))
    };
  }

  /**
   * Computation density for a given energy
   * Rate = 2E/(πħ)
   */
  forEnergy(energy: number): ComputationDensitySpec {
    const opsPerSecond = (2 * energy) / (Math.PI * CONSTANTS.hbar);
    const bitsPerSecond = opsPerSecond / CONSTANTS.LN2;

    return {
      operationsPerSecond: opsPerSecond,
      operationsPerSecondPerVolume: 0, // Requires volume info
      operationsPerSecondPerMass: 0,   // Requires mass info
      bitsPerSecond,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'forEnergy',
        energy,
        opsPerSecond
      }))
    };
  }

  /**
   * Computation density for a given mass
   * Using E = mc²
   */
  forMass(mass: number): ComputationDensitySpec {
    const energy = mass * CONSTANTS.c * CONSTANTS.c;
    const opsPerSecond = (2 * energy) / (Math.PI * CONSTANTS.hbar);
    const bitsPerSecond = opsPerSecond / CONSTANTS.LN2;

    return {
      operationsPerSecond: opsPerSecond,
      operationsPerSecondPerVolume: 0,
      operationsPerSecondPerMass: opsPerSecond / mass,
      bitsPerSecond,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'forMass',
        mass,
        opsPerSecond
      }))
    };
  }

  /**
   * Computation density for a black hole of given mass
   * Maximum possible computational density for a given mass
   */
  blackHoleDensity(mass: number): ComputationDensitySpec {
    // Schwarzschild radius
    const rs = (2 * CONSTANTS.G * mass) / (CONSTANTS.c * CONSTANTS.c);
    const volume = (4/3) * Math.PI * Math.pow(rs, 3);
    
    const energy = mass * CONSTANTS.c * CONSTANTS.c;
    const opsPerSecond = (2 * energy) / (Math.PI * CONSTANTS.hbar);
    const opsPerSecondPerVolume = opsPerSecond / volume;
    const opsPerSecondPerMass = opsPerSecond / mass;
    const bitsPerSecond = opsPerSecond / CONSTANTS.LN2;

    return {
      operationsPerSecond: opsPerSecond,
      operationsPerSecondPerVolume: opsPerSecondPerVolume,
      operationsPerSecondPerMass: opsPerSecondPerMass,
      bitsPerSecond,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'blackHoleDensity',
        mass,
        opsPerSecond
      }))
    };
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// MAXIMUM COMPUTATION CLASS
// ============================================================================

/**
 * MaximumComputation - Computes fundamental limits on computation
 */
export class MaximumComputation {
  private readonly hash: string;

  constructor() {
    this.hash = HashVerifier.hash(JSON.stringify({
      class: 'MaximumComputation'
    }));
  }

  /**
   * Maximum number of operations for given energy and time
   * N_max = 2Et/(πħ)
   */
  maxOperations(energy: number, time: number): MaximumComputationResult {
    const maxOps = (2 * energy * time) / (Math.PI * CONSTANTS.hbar);
    const maxBits = (energy * time) / (Math.PI * CONSTANTS.hbar * CONSTANTS.LN2);
    const opsPerSecond = maxOps / time;

    return {
      energy,
      time,
      maxOperations: maxOps,
      maxBits,
      operationsPerSecond: opsPerSecond,
      efficiency: 1.0,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'maxOperations',
        energy,
        time,
        maxOps
      }))
    };
  }

  /**
   * Maximum computation from mass using E = mc²
   */
  fromMass(mass: number, time: number): MaximumComputationResult {
    const energy = mass * CONSTANTS.c * CONSTANTS.c;
    return this.maxOperations(energy, time);
  }

  /**
   * Calculate efficiency of actual computation vs maximum
   */
  computeEfficiency(actualOps: number, energy: number, time: number): MaximumComputationResult {
    const result = this.maxOperations(energy, time);
    result.efficiency = actualOps / result.maxOperations;

    return {
      ...result,
      efficiency: Math.min(1.0, actualOps / result.maxOperations),
      hash: HashVerifier.hash(JSON.stringify({
        method: 'computeEfficiency',
        actualOps,
        energy,
        time,
        efficiency: result.efficiency
      }))
    };
  }

  /**
   * Maximum computation at Planck scale
   * One Planck time with one Planck energy
   */
  planckMaximum(): MaximumComputationResult {
    return this.maxOperations(CONSTANTS.EP, CONSTANTS.tP);
  }

  /**
   * Minimum energy required for N operations in time t
   * E_min = Nπħ/(2t)
   */
  minimumEnergy(operations: number, time: number): number {
    return (operations * Math.PI * CONSTANTS.hbar) / (2 * time);
  }

  /**
   * Minimum time required for N operations with energy E
   * t_min = Nπħ/(2E)
   */
  minimumTime(operations: number, energy: number): number {
    return (operations * Math.PI * CONSTANTS.hbar) / (2 * energy);
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// LLOYD'S LIMIT CLASS
// ============================================================================

/**
 * LloydLimit - Implements Lloyd's ultimate physical limits to computation
 * 
 * Seth Lloyd showed that a computer with energy E can perform at most
 * 2E/(πħ) operations per second.
 */
export class LloydLimit {
  private readonly hash: string;

  constructor() {
    this.hash = HashVerifier.hash(JSON.stringify({
      class: 'LloydLimit',
      formula: '2E/(πħ)'
    }));
  }

  /**
   * Calculate Lloyd's limit for given energy
   * Max ops/s = 2E/(πħ)
   */
  compute(energy: number): LloydLimitResult {
    const maxOpsPerSecond = (2 * energy) / (Math.PI * CONSTANTS.hbar);
    const maxBitsPerSecond = maxOpsPerSecond / CONSTANTS.LN2;
    const maxOpsPerJoule = 2 / (Math.PI * CONSTANTS.hbar);
    const planckNormalized = energy / CONSTANTS.EP;

    return {
      energy,
      maxOpsPerSecond,
      maxBitsPerSecond,
      maxOpsPerJoule,
      planckNormalized,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'compute',
        energy,
        maxOpsPerSecond
      }))
    };
  }

  /**
   * Lloyd's limit from mass
   */
  fromMass(mass: number): LloydLimitResult {
    const energy = mass * CONSTANTS.c * CONSTANTS.c;
    return this.compute(energy);
  }

  /**
   * Lloyd's limit at Planck energy
   */
  planckLimit(): LloydLimitResult {
    return this.compute(CONSTANTS.EP);
  }

  /**
   * Energy required for target ops/s
   */
  requiredEnergy(targetOpsPerSecond: number): number {
    return (targetOpsPerSecond * Math.PI * CONSTANTS.hbar) / 2;
  }

  /**
   * Universal operation rate constant
   * 2/(πħ) ops/s per Joule
   */
  universalConstant(): number {
    return 2 / (Math.PI * CONSTANTS.hbar);
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// MARGOLUS-LEVITIN LIMIT CLASS
// ============================================================================

/**
 * MargolusLevitin - Implements the Margolus-Levitin theorem
 * 
 * The minimum time for a quantum state to evolve to an orthogonal state
 * is t_min = πħ/(2E)
 */
export class MargolusLevitin {
  private readonly hash: string;

  constructor() {
    this.hash = HashVerifier.hash(JSON.stringify({
      class: 'MargolusLevitin',
      formula: 't_min = πħ/(2E)'
    }));
  }

  /**
   * Compute minimum transition time for given energy
   */
  minTransitionTime(energy: number): MargolusLevitinResult {
    const minTime = (Math.PI * CONSTANTS.hbar) / (2 * energy);
    const maxFrequency = 1 / minTime;

    return {
      energy,
      minTime,
      maxFrequency,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'minTransitionTime',
        energy,
        minTime
      }))
    };
  }

  /**
   * Maximum frequency of orthogonal state transitions
   */
  maxTransitionFrequency(energy: number): number {
    return (2 * energy) / (Math.PI * CONSTANTS.hbar);
  }

  /**
   * Energy required for target transition time
   */
  requiredEnergy(targetTime: number): number {
    return (Math.PI * CONSTANTS.hbar) / (2 * targetTime);
  }

  /**
   * Planck scale transition
   */
  planckTransition(): MargolusLevitinResult {
    return this.minTransitionTime(CONSTANTS.EP);
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// LANDAUER LIMIT CLASS
// ============================================================================

/**
 * LandauerLimit - Implements Landauer's principle
 * 
 * The minimum energy to erase one bit of information is:
 * E_min = kT·ln(2)
 */
export class LandauerLimit {
  private readonly hash: string;

  constructor() {
    this.hash = HashVerifier.hash(JSON.stringify({
      class: 'LandauerLimit',
      formula: 'E_min = kT·ln(2)'
    }));
  }

  /**
   * Compute Landauer limit at given temperature
   */
  compute(temperature: number): LandauerLimitResult {
    const minEnergyPerBit = CONSTANTS.kB * temperature * CONSTANTS.LN2;
    const maxBitsPerJoule = 1 / minEnergyPerBit;

    return {
      temperature,
      minEnergyPerBit,
      maxBitsPerJoule,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'compute',
        temperature,
        minEnergyPerBit
      }))
    };
  }

  /**
   * Landauer limit at room temperature (300K)
   */
  roomTemperature(): LandauerLimitResult {
    return this.compute(300);
  }

  /**
   * Landauer limit at Planck temperature
   */
  planckTemperature(): LandauerLimitResult {
    return this.compute(CONSTANTS.TP);
  }

  /**
   * Maximum bits that can be erased with given energy at temperature
   */
  maxBitsErased(energy: number, temperature: number): number {
    const minEnergyPerBit = CONSTANTS.kB * temperature * CONSTANTS.LN2;
    return energy / minEnergyPerBit;
  }

  /**
   * Minimum temperature to erase bits with given energy
   */
  minTemperature(energy: number, bits: number): number {
    return energy / (bits * CONSTANTS.kB * CONSTANTS.LN2);
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// BREMERMANN LIMIT CLASS
// ============================================================================

/**
 * BremermannLimit - Implements Bremermann's limit
 * 
 * The maximum rate of information processing is limited by mass:
 * Rate ≤ mc²/h bits/second
 */
export class BremermannLimit {
  private readonly hash: string;

  constructor() {
    this.hash = HashVerifier.hash(JSON.stringify({
      class: 'BremermannLimit',
      formula: 'Rate ≤ mc²/h'
    }));
  }

  /**
   * Compute Bremermann limit for given mass
   */
  compute(mass: number): BremermannLimitResult {
    const energy = mass * CONSTANTS.c * CONSTANTS.c;
    const maxBitsPerSecond = energy / CONSTANTS.h;
    const maxOpsPerSecond = maxBitsPerSecond * CONSTANTS.LN2;

    return {
      mass,
      maxBitsPerSecond,
      maxOpsPerSecond,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'compute',
        mass,
        maxBitsPerSecond
      }))
    };
  }

  /**
   * Bremermann limit for 1 kg
   */
  oneKilogram(): BremermannLimitResult {
    return this.compute(1);
  }

  /**
   * Bremermann limit at Planck mass
   */
  planckMass(): BremermannLimitResult {
    return this.compute(CONSTANTS.mP);
  }

  /**
   * Mass required for target processing rate
   */
  requiredMass(targetBitsPerSecond: number): number {
    return (targetBitsPerSecond * CONSTANTS.h) / (CONSTANTS.c * CONSTANTS.c);
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// BLACK HOLE COMPUTER CLASS
// ============================================================================

/**
 * BlackHoleComputer - Models computation at the black hole limit
 * 
 * A black hole represents the maximum information density and
 * computation rate for a given mass.
 */
export class BlackHoleComputer {
  private readonly hash: string;

  constructor() {
    this.hash = HashVerifier.hash(JSON.stringify({
      class: 'BlackHoleComputer'
    }));
  }

  /**
   * Compute black hole computer specifications
   */
  compute(mass: number): BlackHoleComputerSpec {
    // Schwarzschild radius: R = 2GM/c²
    const schwarzschildRadius = (2 * CONSTANTS.G * mass) / (CONSTANTS.c * CONSTANTS.c);
    
    // Hawking temperature: T = ħc³/(8πGMkB)
    const hawkingTemperature = (CONSTANTS.hbar * Math.pow(CONSTANTS.c, 3)) / 
                               (8 * Math.PI * CONSTANTS.G * mass * CONSTANTS.kB);
    
    // Black hole lifetime (Page time): t ∝ M³
    // t = 5120πG²M³/(ħc⁴)
    const lifetime = (5120 * Math.PI * Math.pow(CONSTANTS.G, 2) * Math.pow(mass, 3)) / 
                    (CONSTANTS.hbar * Math.pow(CONSTANTS.c, 4));
    
    // Maximum operations = 2Et/πħ where E = Mc²
    const energy = mass * CONSTANTS.c * CONSTANTS.c;
    const maxOperations = (2 * energy * lifetime) / (Math.PI * CONSTANTS.hbar);
    
    // Bekenstein-Hawking entropy: S = A/(4l_P²) = πR²/l_P²
    const area = 4 * Math.PI * schwarzschildRadius * schwarzschildRadius;
    const maxMemory = area / (4 * Math.pow(CONSTANTS.lP, 2));

    return {
      mass,
      schwarzschildRadius,
      hawkingTemperature,
      lifetime,
      maxOperations,
      maxMemory,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'compute',
        mass,
        maxOperations,
        maxMemory
      }))
    };
  }

  /**
   * Compute for Planck mass black hole
   */
  planckMassBlackHole(): BlackHoleComputerSpec {
    return this.compute(CONSTANTS.mP);
  }

  /**
   * Compute for solar mass black hole
   */
  solarMassBlackHole(): BlackHoleComputerSpec {
    const solarMass = 1.989e30; // kg
    return this.compute(solarMass);
  }

  /**
   * Mass required for given memory capacity
   * From S = πR²/l_P² and R = 2GM/c²
   * M = √(S·l_P²·c⁴/(4πG²))
   */
  massForMemory(bits: number): number {
    const numerator = bits * Math.pow(CONSTANTS.lP, 2) * Math.pow(CONSTANTS.c, 4);
    const denominator = 4 * Math.PI * Math.pow(CONSTANTS.G, 2);
    return Math.sqrt(numerator / denominator);
  }

  /**
   * Memory capacity for given mass
   */
  memoryForMass(mass: number): number {
    const result = this.compute(mass);
    return result.maxMemory;
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// COMPUTATION LIMITS FACTORY
// ============================================================================

/**
 * ComputationLimits - Factory for accessing all computation limits
 */
export class ComputationLimits {
  public readonly lloyd: LloydLimit;
  public readonly margolusLevitin: MargolusLevitin;
  public readonly landauer: LandauerLimit;
  public readonly bremermann: BremermannLimit;
  public readonly blackHole: BlackHoleComputer;
  public readonly density: ComputationDensity;
  public readonly maximum: MaximumComputation;
  private readonly hash: string;

  constructor() {
    this.lloyd = new LloydLimit();
    this.margolusLevitin = new MargolusLevitin();
    this.landauer = new LandauerLimit();
    this.bremermann = new BremermannLimit();
    this.blackHole = new BlackHoleComputer();
    this.density = new ComputationDensity();
    this.maximum = new MaximumComputation();
    
    this.hash = HashVerifier.hash(JSON.stringify({
      class: 'ComputationLimits',
      components: ['lloyd', 'margolusLevitin', 'landauer', 'bremermann', 'blackHole', 'density', 'maximum']
    }));
  }

  /**
   * Summary of all limits for given resources
   */
  allLimits(resources: ComputationResource): object {
    const energy = resources.energy || (resources.mass ? resources.mass * CONSTANTS.c * CONSTANTS.c : 0);
    
    return {
      lloyd: this.lloyd.compute(energy),
      margolusLevitin: this.margolusLevitin.minTransitionTime(energy),
      landauer: this.landauer.compute(300), // Room temperature default
      bremermann: resources.mass ? this.bremermann.compute(resources.mass) : null,
      maximum: this.maximum.maxOperations(energy, resources.time || 1),
      density: this.density.forEnergy(energy),
      hash: HashVerifier.hash(JSON.stringify({
        method: 'allLimits',
        resources
      }))
    };
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// PLANCK COMPUTATION CONSTANTS
// ============================================================================

/**
 * PlanckComputationConstants - Physical constants for computation limits
 */
export const PlanckComputationConstants = {
  ...CONSTANTS,
  
  // Universal computation constant: 2/(πħ) ops/s per Joule
  computationConstant: 2 / (Math.PI * CONSTANTS.hbar),
  
  // Maximum ops at Planck scale: 1/t_P
  planckOpsPerSecond: 1 / CONSTANTS.tP,
  
  // Landauer energy at room temperature (300K)
  landauerEnergyRoomTemp: CONSTANTS.kB * 300 * CONSTANTS.LN2,
  
  // Bremermann constant: c²/h
  bremermannConstant: (CONSTANTS.c * CONSTANTS.c) / CONSTANTS.h
};

// ============================================================================
// MODULE INTEGRATION HASH
// ============================================================================

export const MODULE_HASH = HashVerifier.hash(JSON.stringify({
  module: 'PlanckComputation',
  version: '1.0.0',
  phase: 'PRD-04 Phase 4.4',
  moduleId: 'M04.04',
  exports: [
    'ComputationDensity',
    'MaximumComputation',
    'LloydLimit',
    'MargolusLevitin',
    'LandauerLimit',
    'BremermannLimit',
    'BlackHoleComputer',
    'ComputationLimits',
    'PlanckComputationConstants'
  ]
}));
