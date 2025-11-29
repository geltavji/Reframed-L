/**
 * Qlaws Ham - Information Energy Module (M06.03)
 * 
 * Explores information-energy equivalence and conversion formulas.
 * Implements Landauer's principle and reversible computation concepts.
 * 
 * @module InformationEnergy
 * @version 1.0.0
 * @dependencies BigNumber (M01.03), PhysicalConstants (M01.06), Logger (M01.01)
 */

import * as crypto from 'crypto';
import { Logger, LogLevel } from '../../core/logger/Logger';
import { BigNumber } from '../../core/math/BigNumber';

/**
 * Physical constants used in information-energy calculations
 * Values from CODATA 2018
 */
export const InfoEnergyConstants = {
  // Boltzmann constant (J/K)
  kB: 1.380649e-23,
  
  // Speed of light (m/s)
  c: 299792458,
  
  // Planck constant (J·s)
  h: 6.62607015e-34,
  
  // Reduced Planck constant (J·s)
  hbar: 1.054571817e-34,
  
  // Room temperature reference (K)
  roomTemperature: 300,
  
  // Natural logarithm of 2
  ln2: Math.LN2,
  
  // Planck temperature (K)
  planckTemperature: 1.416784e32,
  
  // Planck energy (J)
  planckEnergy: 1.956e9,
  
  // Planck time (s)
  planckTime: 5.391247e-44
};

/**
 * Types of information-energy operations
 */
export enum OperationType {
  BIT_ERASURE = 'Bit Erasure',
  BIT_COPY = 'Bit Copy',
  COMPUTATION = 'Computation',
  MEASUREMENT = 'Measurement',
  INITIALIZATION = 'Initialization',
  REVERSIBLE = 'Reversible Operation'
}

/**
 * Interface for Landauer limit calculation result
 */
export interface LandauerResult {
  temperature: number;
  minimumEnergy: number;
  bitsErased: number;
  totalEnergy: number;
  entropyChange: number;
  hash: string;
}

/**
 * Interface for reversible computation analysis
 */
export interface ReversibleAnalysis {
  operation: string;
  isReversible: boolean;
  energyRequired: number;
  energyDissipated: number;
  efficiency: number;
  bitsLost: number;
  hash: string;
}

/**
 * Interface for information-energy conversion
 */
export interface EnergyConversion {
  inputBits: number;
  outputEnergy: number;
  temperature: number;
  efficiency: number;
  mechanism: string;
  hash: string;
}

/**
 * Interface for computational energy bounds
 */
export interface ComputationalBounds {
  minimumEnergy: number;
  maximumOperationsPerSecond: number;
  energyPerOperation: number;
  temperature: number;
  mass?: number;
  bremermannLimit?: number;
  lloydLimit?: number;
  hash: string;
}

/**
 * Interface for information density
 */
export interface InformationDensity {
  bits: number;
  volume: number;
  density: number;
  bekensteinBound: number;
  holographicLimit: number;
  isBelowBound: boolean;
  hash: string;
}

/**
 * LandauerLimit - Implements Landauer's principle
 * E_min = kT·ln(2) per bit erased
 */
export class LandauerLimit {
  private static logger: Logger | null = null;
  private calculations: LandauerResult[] = [];

  /**
   * Set logger
   */
  public static setLogger(logger: Logger): void {
    LandauerLimit.logger = logger;
  }

  /**
   * Calculate minimum energy for bit erasure at given temperature
   */
  public calculateMinimumEnergy(temperature: number = InfoEnergyConstants.roomTemperature): number {
    // E_min = kT·ln(2)
    return InfoEnergyConstants.kB * temperature * InfoEnergyConstants.ln2;
  }

  /**
   * Calculate energy for erasing multiple bits
   */
  public calculateErasureEnergy(bits: number, temperature: number = InfoEnergyConstants.roomTemperature): LandauerResult {
    const minimumEnergy = this.calculateMinimumEnergy(temperature);
    const totalEnergy = minimumEnergy * bits;
    
    // Entropy change: ΔS = k·ln(2) per bit
    const entropyChange = InfoEnergyConstants.kB * InfoEnergyConstants.ln2 * bits;

    const result: LandauerResult = {
      temperature,
      minimumEnergy,
      bitsErased: bits,
      totalEnergy,
      entropyChange,
      hash: ''
    };
    result.hash = this.hashResult(result);
    
    this.calculations.push(result);
    
    if (LandauerLimit.logger) {
      LandauerLimit.logger.log(LogLevel.DEBUG, '[LandauerLimit] Calculated erasure energy', {
        bits,
        temperature,
        totalEnergy
      });
    }

    return result;
  }

  /**
   * Calculate number of bits that can be erased with given energy
   */
  public calculateBitsFromEnergy(energy: number, temperature: number = InfoEnergyConstants.roomTemperature): number {
    const minimumEnergy = this.calculateMinimumEnergy(temperature);
    return Math.floor(energy / minimumEnergy);
  }

  /**
   * Calculate temperature required to erase bits with given energy budget
   */
  public calculateTemperatureForEnergy(energy: number, bits: number): number {
    // E = kT·ln(2)·n → T = E / (k·ln(2)·n)
    return energy / (InfoEnergyConstants.kB * InfoEnergyConstants.ln2 * bits);
  }

  /**
   * Check if an operation violates Landauer limit
   */
  public violatesLimit(energy: number, bits: number, temperature: number): boolean {
    const minimumRequired = this.calculateMinimumEnergy(temperature) * bits;
    return energy < minimumRequired;
  }

  /**
   * Get all calculations
   */
  public getCalculations(): LandauerResult[] {
    return [...this.calculations];
  }

  /**
   * Clear calculations
   */
  public clear(): void {
    this.calculations = [];
  }

  /**
   * Hash a result
   */
  private hashResult(result: Omit<LandauerResult, 'hash'>): string {
    const data = JSON.stringify({
      temperature: result.temperature,
      bitsErased: result.bitsErased,
      totalEnergy: result.totalEnergy
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * ReversibleComputation - Analyzes reversible vs irreversible operations
 */
export class ReversibleComputation {
  private static logger: Logger | null = null;
  private analyses: ReversibleAnalysis[] = [];
  private landauer: LandauerLimit;

  constructor() {
    this.landauer = new LandauerLimit();
  }

  /**
   * Set logger
   */
  public static setLogger(logger: Logger): void {
    ReversibleComputation.logger = logger;
  }

  /**
   * Analyze a logical operation for reversibility
   */
  public analyze(
    operation: string,
    inputBits: number,
    outputBits: number,
    temperature: number = InfoEnergyConstants.roomTemperature
  ): ReversibleAnalysis {
    // Reversible if input can be reconstructed from output
    // Information is lost if outputBits < inputBits
    const bitsLost = Math.max(0, inputBits - outputBits);
    const isReversible = bitsLost === 0;
    
    // Energy dissipated for lost information (Landauer limit)
    const energyDissipated = this.landauer.calculateMinimumEnergy(temperature) * bitsLost;
    
    // Reversible operations can theoretically use zero energy
    const energyRequired = isReversible ? 0 : energyDissipated;
    
    // Efficiency: 1 for reversible, decreases with bits lost
    const efficiency = inputBits > 0 ? outputBits / inputBits : 1;

    const analysis: ReversibleAnalysis = {
      operation,
      isReversible,
      energyRequired,
      energyDissipated,
      efficiency,
      bitsLost,
      hash: ''
    };
    analysis.hash = this.hashAnalysis(analysis);
    
    this.analyses.push(analysis);

    if (ReversibleComputation.logger) {
      ReversibleComputation.logger.log(LogLevel.DEBUG, '[ReversibleComputation] Analyzed operation', {
        operation,
        isReversible,
        bitsLost
      });
    }

    return analysis;
  }

  /**
   * Analyze common logical gates
   */
  public analyzeGate(gateName: string, temperature: number = InfoEnergyConstants.roomTemperature): ReversibleAnalysis {
    // Gate input/output bits mapping
    const gateInfo: Record<string, { input: number; output: number }> = {
      'NOT': { input: 1, output: 1 },          // Reversible
      'AND': { input: 2, output: 1 },          // Loses 1 bit
      'OR': { input: 2, output: 1 },           // Loses 1 bit
      'XOR': { input: 2, output: 1 },          // Loses 1 bit
      'NAND': { input: 2, output: 1 },         // Loses 1 bit
      'NOR': { input: 2, output: 1 },          // Loses 1 bit
      'CNOT': { input: 2, output: 2 },         // Reversible
      'CCNOT': { input: 3, output: 3 },        // Reversible (Toffoli)
      'SWAP': { input: 2, output: 2 },         // Reversible
      'FREDKIN': { input: 3, output: 3 },      // Reversible
      'IDENTITY': { input: 1, output: 1 }      // Reversible
    };

    const gate = gateInfo[gateName.toUpperCase()];
    if (!gate) {
      return this.analyze(gateName, 1, 1, temperature);
    }

    return this.analyze(gateName.toUpperCase(), gate.input, gate.output, temperature);
  }

  /**
   * Calculate energy savings from reversible computation
   */
  public calculateEnergySavings(
    irreversibleBits: number,
    temperature: number = InfoEnergyConstants.roomTemperature
  ): { saved: number; original: number; percentage: number } {
    const original = this.landauer.calculateMinimumEnergy(temperature) * irreversibleBits;
    // Reversible computation theoretically uses zero energy
    const saved = original;
    const percentage = 100;

    return { saved, original, percentage };
  }

  /**
   * Get all analyses
   */
  public getAnalyses(): ReversibleAnalysis[] {
    return [...this.analyses];
  }

  /**
   * Get reversible operations only
   */
  public getReversibleOperations(): ReversibleAnalysis[] {
    return this.analyses.filter(a => a.isReversible);
  }

  /**
   * Get irreversible operations only
   */
  public getIrreversibleOperations(): ReversibleAnalysis[] {
    return this.analyses.filter(a => !a.isReversible);
  }

  /**
   * Clear analyses
   */
  public clear(): void {
    this.analyses = [];
    this.landauer.clear();
  }

  /**
   * Hash an analysis
   */
  private hashAnalysis(analysis: Omit<ReversibleAnalysis, 'hash'>): string {
    const data = JSON.stringify({
      operation: analysis.operation,
      isReversible: analysis.isReversible,
      bitsLost: analysis.bitsLost
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * InformationEnergy - Main class for information-energy equivalence
 */
export class InformationEnergy {
  private static logger: Logger | null = null;
  private landauer: LandauerLimit;
  private reversible: ReversibleComputation;
  private conversions: EnergyConversion[] = [];
  private boundsHistory: ComputationalBounds[] = [];

  constructor() {
    this.landauer = new LandauerLimit();
    this.reversible = new ReversibleComputation();
  }

  /**
   * Set logger
   */
  public static setLogger(logger: Logger): void {
    InformationEnergy.logger = logger;
    LandauerLimit.setLogger(logger);
    ReversibleComputation.setLogger(logger);
  }

  /**
   * Log a message
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (InformationEnergy.logger) {
      InformationEnergy.logger.log(level, `[InformationEnergy] ${message}`, data);
    }
  }

  /**
   * Calculate energy equivalent of information
   * Based on E = kT·ln(2) per bit at thermal equilibrium
   */
  public informationToEnergy(
    bits: number,
    temperature: number = InfoEnergyConstants.roomTemperature
  ): EnergyConversion {
    const energyPerBit = InfoEnergyConstants.kB * temperature * InfoEnergyConstants.ln2;
    const totalEnergy = energyPerBit * bits;

    const conversion: EnergyConversion = {
      inputBits: bits,
      outputEnergy: totalEnergy,
      temperature,
      efficiency: 1.0, // Theoretical maximum
      mechanism: 'Thermal Information-Energy Equivalence',
      hash: ''
    };
    conversion.hash = this.hashConversion(conversion);

    this.conversions.push(conversion);
    this.log(LogLevel.DEBUG, 'Converted information to energy', { bits, totalEnergy });

    return conversion;
  }

  /**
   * Calculate information equivalent of energy
   */
  public energyToInformation(
    energy: number,
    temperature: number = InfoEnergyConstants.roomTemperature
  ): number {
    const energyPerBit = InfoEnergyConstants.kB * temperature * InfoEnergyConstants.ln2;
    return energy / energyPerBit;
  }

  /**
   * Calculate mass-energy-information equivalence
   * Using E = mc² and information-energy relation
   */
  public massToInformation(mass: number, temperature: number = InfoEnergyConstants.roomTemperature): number {
    // E = mc²
    const energy = mass * InfoEnergyConstants.c * InfoEnergyConstants.c;
    // Convert energy to bits
    return this.energyToInformation(energy, temperature);
  }

  /**
   * Calculate mass from information content
   */
  public informationToMass(bits: number, temperature: number = InfoEnergyConstants.roomTemperature): number {
    // E = kT·ln(2)·n
    const energy = InfoEnergyConstants.kB * temperature * InfoEnergyConstants.ln2 * bits;
    // m = E/c²
    return energy / (InfoEnergyConstants.c * InfoEnergyConstants.c);
  }

  /**
   * Calculate computational bounds for a system
   */
  public calculateBounds(
    energy: number,
    mass?: number,
    temperature: number = InfoEnergyConstants.roomTemperature
  ): ComputationalBounds {
    // Lloyd's limit: Maximum operations/second = 2E/(πℏ)
    const lloydLimit = (2 * energy) / (Math.PI * InfoEnergyConstants.hbar);
    
    // Energy per operation at Landauer limit
    const energyPerOperation = InfoEnergyConstants.kB * temperature * InfoEnergyConstants.ln2;
    
    // Maximum operations per second at Landauer limit
    const maxOpsLandauer = energy / energyPerOperation;
    
    // Bremermann limit if mass provided: c²/h operations per second per kg
    let bremermannLimit: number | undefined;
    if (mass !== undefined) {
      bremermannLimit = (mass * InfoEnergyConstants.c * InfoEnergyConstants.c) / InfoEnergyConstants.h;
    }

    const bounds: ComputationalBounds = {
      minimumEnergy: energyPerOperation,
      maximumOperationsPerSecond: lloydLimit,
      energyPerOperation,
      temperature,
      mass,
      bremermannLimit,
      lloydLimit,
      hash: ''
    };
    bounds.hash = this.hashBounds(bounds);

    this.boundsHistory.push(bounds);
    this.log(LogLevel.INFO, 'Calculated computational bounds', { lloydLimit, bremermannLimit });

    return bounds;
  }

  /**
   * Calculate Bekenstein bound for information density
   */
  public calculateInformationDensity(
    energy: number,
    radius: number,
    actualBits: number
  ): InformationDensity {
    // Bekenstein bound: S ≤ 2πkRE/(ℏc)
    // In bits: I ≤ 2πRE/(ℏc·ln(2))
    const bekensteinBound = (2 * Math.PI * radius * energy) / 
      (InfoEnergyConstants.hbar * InfoEnergyConstants.c * InfoEnergyConstants.ln2);
    
    // Holographic limit: 1 bit per 4 Planck areas
    const planckLength = 1.616255e-35;
    const surfaceArea = 4 * Math.PI * radius * radius;
    const planckArea = planckLength * planckLength;
    const holographicLimit = surfaceArea / (4 * planckArea);
    
    // Volume
    const volume = (4/3) * Math.PI * radius * radius * radius;
    
    // Density
    const density = actualBits / volume;

    const result: InformationDensity = {
      bits: actualBits,
      volume,
      density,
      bekensteinBound,
      holographicLimit: Math.min(bekensteinBound, holographicLimit),
      isBelowBound: actualBits <= bekensteinBound,
      hash: ''
    };
    result.hash = crypto.createHash('sha256').update(JSON.stringify({
      bits: actualBits,
      bekensteinBound,
      isBelowBound: result.isBelowBound
    })).digest('hex');

    return result;
  }

  /**
   * Get Landauer limit calculator
   */
  public getLandauer(): LandauerLimit {
    return this.landauer;
  }

  /**
   * Get reversible computation analyzer
   */
  public getReversible(): ReversibleComputation {
    return this.reversible;
  }

  /**
   * Get all energy conversions
   */
  public getConversions(): EnergyConversion[] {
    return [...this.conversions];
  }

  /**
   * Get bounds history
   */
  public getBoundsHistory(): ComputationalBounds[] {
    return [...this.boundsHistory];
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    totalConversions: number;
    totalBoundsCalculations: number;
    averageEfficiency: number;
  } {
    const avgEfficiency = this.conversions.length > 0
      ? this.conversions.reduce((sum, c) => sum + c.efficiency, 0) / this.conversions.length
      : 0;

    return {
      totalConversions: this.conversions.length,
      totalBoundsCalculations: this.boundsHistory.length,
      averageEfficiency: avgEfficiency
    };
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.conversions = [];
    this.boundsHistory = [];
    this.landauer.clear();
    this.reversible.clear();
  }

  /**
   * Export to JSON
   */
  public exportToJson(): string {
    return JSON.stringify({
      conversions: this.conversions,
      bounds: this.boundsHistory,
      statistics: this.getStatistics(),
      exportTimestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Get proof chain hash
   */
  public getProofChainHash(): string {
    const data = JSON.stringify({
      conversions: this.conversions.map(c => c.hash),
      bounds: this.boundsHistory.map(b => b.hash)
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Hash a conversion
   */
  private hashConversion(conversion: Omit<EnergyConversion, 'hash'>): string {
    const data = JSON.stringify({
      inputBits: conversion.inputBits,
      outputEnergy: conversion.outputEnergy,
      temperature: conversion.temperature
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Hash bounds
   */
  private hashBounds(bounds: Omit<ComputationalBounds, 'hash'>): string {
    const data = JSON.stringify({
      minimumEnergy: bounds.minimumEnergy,
      lloydLimit: bounds.lloydLimit,
      temperature: bounds.temperature
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * Factory for creating InformationEnergy instances
 */
export class InformationEnergyFactory {
  /**
   * Create a new InformationEnergy with logger
   */
  public static create(logger?: Logger): InformationEnergy {
    if (logger) {
      InformationEnergy.setLogger(logger);
    }
    return new InformationEnergy();
  }
}
