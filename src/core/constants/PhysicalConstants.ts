/**
 * Qlaws Ham - PhysicalConstants Module (M01.06)
 * 
 * Defines all known physical constants with maximum precision.
 * Based on CODATA 2018 values (latest SI definitions).
 * Includes uncertainty propagation and constant validation.
 * 
 * @module PhysicalConstants
 * @version 1.0.0
 * @dependencies Logger (M01.01), BigNumber (M01.03)
 */

import { Logger, LogLevel } from '../logger/Logger';
import { BigNumber } from '../math/BigNumber';
import { HashVerifier } from '../logger/HashVerifier';

/**
 * Helper function to create BigNumber from number or string
 */
function createBigNumber(value: number | string): BigNumber {
  return new BigNumber(value);
}

/**
 * Represents the uncertainty in a physical constant
 */
export interface Uncertainty {
  value: number;
  type: 'absolute' | 'relative';
  standardError?: number;
  confidenceLevel?: number;
}

/**
 * Represents a physical constant with its value, unit, and uncertainty
 */
export interface ConstantValue {
  name: string;
  symbol: string;
  value: BigNumber;
  numericValue: number;
  unit: string;
  uncertainty: Uncertainty;
  isExact: boolean;
  source: string;
  hash: string;
}

/**
 * Unit dimensions for dimensional analysis
 */
export interface UnitDimensions {
  length: number;     // meters (m)
  mass: number;       // kilograms (kg)
  time: number;       // seconds (s)
  current: number;    // amperes (A)
  temperature: number; // kelvin (K)
  amount: number;     // moles (mol)
  luminosity: number; // candela (cd)
}

/**
 * Derived constant definition
 */
export interface DerivedConstant {
  name: string;
  symbol: string;
  formula: string;
  dependencies: string[];
  compute: () => ConstantValue;
}

/**
 * Physical constants registry with CODATA 2018 values
 */
export class PhysicalConstants {
  private static instance: PhysicalConstants | null = null;
  private constants: Map<string, ConstantValue> = new Map();
  private derivedConstants: Map<string, DerivedConstant> = new Map();
  private logger: Logger;
  private hashVerifier: typeof HashVerifier = HashVerifier;
  private validationEnabled: boolean = true;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.logger = Logger.getInstance({ minLevel: LogLevel.DEBUG });
    this.initializeFundamentalConstants();
    this.initializeDerivedConstants();
    this.logger.info('PhysicalConstants initialized', { 
      fundamentalCount: this.constants.size,
      derivedCount: this.derivedConstants.size
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PhysicalConstants {
    if (!PhysicalConstants.instance) {
      PhysicalConstants.instance = new PhysicalConstants();
    }
    return PhysicalConstants.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    PhysicalConstants.instance = null;
  }

  /**
   * Initialize all fundamental CODATA 2018 constants
   */
  private initializeFundamentalConstants(): void {
    // === EXACT CONSTANTS (SI 2019 Redefinition) ===
    
    // Speed of light in vacuum - EXACT
    this.addConstant({
      name: 'speed_of_light',
      symbol: 'c',
      value: createBigNumber(299792458),
      numericValue: 299792458,
      unit: 'm/s',
      uncertainty: { value: 0, type: 'absolute' },
      isExact: true,
      source: 'CODATA 2018 (SI 2019 exact)',
      hash: ''
    });

    // Planck constant - EXACT
    this.addConstant({
      name: 'planck_constant',
      symbol: 'h',
      value: createBigNumber('6.62607015e-34'),
      numericValue: 6.62607015e-34,
      unit: 'J⋅s',
      uncertainty: { value: 0, type: 'absolute' },
      isExact: true,
      source: 'CODATA 2018 (SI 2019 exact)',
      hash: ''
    });

    // Elementary charge - EXACT
    this.addConstant({
      name: 'elementary_charge',
      symbol: 'e',
      value: createBigNumber('1.602176634e-19'),
      numericValue: 1.602176634e-19,
      unit: 'C',
      uncertainty: { value: 0, type: 'absolute' },
      isExact: true,
      source: 'CODATA 2018 (SI 2019 exact)',
      hash: ''
    });

    // Boltzmann constant - EXACT
    this.addConstant({
      name: 'boltzmann_constant',
      symbol: 'k_B',
      value: createBigNumber('1.380649e-23'),
      numericValue: 1.380649e-23,
      unit: 'J/K',
      uncertainty: { value: 0, type: 'absolute' },
      isExact: true,
      source: 'CODATA 2018 (SI 2019 exact)',
      hash: ''
    });

    // Avogadro constant - EXACT
    this.addConstant({
      name: 'avogadro_constant',
      symbol: 'N_A',
      value: createBigNumber('6.02214076e23'),
      numericValue: 6.02214076e23,
      unit: 'mol⁻¹',
      uncertainty: { value: 0, type: 'absolute' },
      isExact: true,
      source: 'CODATA 2018 (SI 2019 exact)',
      hash: ''
    });

    // === MEASURED CONSTANTS (with uncertainty) ===

    // Gravitational constant
    this.addConstant({
      name: 'gravitational_constant',
      symbol: 'G',
      value: createBigNumber('6.67430e-11'),
      numericValue: 6.67430e-11,
      unit: 'm³/(kg⋅s²)',
      uncertainty: { 
        value: 0.00015e-11, 
        type: 'absolute',
        standardError: 0.00015e-11,
        confidenceLevel: 0.68
      },
      isExact: false,
      source: 'CODATA 2018',
      hash: ''
    });

    // Fine-structure constant
    this.addConstant({
      name: 'fine_structure_constant',
      symbol: 'α',
      value: createBigNumber('7.2973525693e-3'),
      numericValue: 7.2973525693e-3,
      unit: 'dimensionless',
      uncertainty: { 
        value: 0.0000000011e-3, 
        type: 'absolute',
        standardError: 0.0000000011e-3,
        confidenceLevel: 0.68
      },
      isExact: false,
      source: 'CODATA 2018',
      hash: ''
    });

    // Electron mass
    this.addConstant({
      name: 'electron_mass',
      symbol: 'm_e',
      value: createBigNumber('9.1093837015e-31'),
      numericValue: 9.1093837015e-31,
      unit: 'kg',
      uncertainty: { 
        value: 0.0000000028e-31, 
        type: 'absolute',
        standardError: 0.0000000028e-31,
        confidenceLevel: 0.68
      },
      isExact: false,
      source: 'CODATA 2018',
      hash: ''
    });

    // Proton mass
    this.addConstant({
      name: 'proton_mass',
      symbol: 'm_p',
      value: createBigNumber('1.67262192369e-27'),
      numericValue: 1.67262192369e-27,
      unit: 'kg',
      uncertainty: { 
        value: 0.00000000051e-27, 
        type: 'absolute',
        standardError: 0.00000000051e-27,
        confidenceLevel: 0.68
      },
      isExact: false,
      source: 'CODATA 2018',
      hash: ''
    });

    // Neutron mass
    this.addConstant({
      name: 'neutron_mass',
      symbol: 'm_n',
      value: createBigNumber('1.67492749804e-27'),
      numericValue: 1.67492749804e-27,
      unit: 'kg',
      uncertainty: { 
        value: 0.00000000095e-27, 
        type: 'absolute',
        standardError: 0.00000000095e-27,
        confidenceLevel: 0.68
      },
      isExact: false,
      source: 'CODATA 2018',
      hash: ''
    });

    // Vacuum permittivity (electric constant)
    this.addConstant({
      name: 'vacuum_permittivity',
      symbol: 'ε_0',
      value: createBigNumber('8.8541878128e-12'),
      numericValue: 8.8541878128e-12,
      unit: 'F/m',
      uncertainty: { 
        value: 0.0000000013e-12, 
        type: 'absolute',
        standardError: 0.0000000013e-12,
        confidenceLevel: 0.68
      },
      isExact: false,
      source: 'CODATA 2018',
      hash: ''
    });

    // Vacuum permeability (magnetic constant)
    this.addConstant({
      name: 'vacuum_permeability',
      symbol: 'μ_0',
      value: createBigNumber('1.25663706212e-6'),
      numericValue: 1.25663706212e-6,
      unit: 'H/m',
      uncertainty: { 
        value: 0.00000000019e-6, 
        type: 'absolute',
        standardError: 0.00000000019e-6,
        confidenceLevel: 0.68
      },
      isExact: false,
      source: 'CODATA 2018',
      hash: ''
    });

    // Rydberg constant
    this.addConstant({
      name: 'rydberg_constant',
      symbol: 'R_∞',
      value: createBigNumber('10973731.568160'),
      numericValue: 10973731.568160,
      unit: 'm⁻¹',
      uncertainty: { 
        value: 0.000021, 
        type: 'absolute',
        standardError: 0.000021,
        confidenceLevel: 0.68
      },
      isExact: false,
      source: 'CODATA 2018',
      hash: ''
    });

    // Bohr radius
    this.addConstant({
      name: 'bohr_radius',
      symbol: 'a_0',
      value: createBigNumber('5.29177210903e-11'),
      numericValue: 5.29177210903e-11,
      unit: 'm',
      uncertainty: { 
        value: 0.00000000080e-11, 
        type: 'absolute',
        standardError: 0.00000000080e-11,
        confidenceLevel: 0.68
      },
      isExact: false,
      source: 'CODATA 2018',
      hash: ''
    });

    // Stefan-Boltzmann constant
    this.addConstant({
      name: 'stefan_boltzmann_constant',
      symbol: 'σ',
      value: createBigNumber('5.670374419e-8'),
      numericValue: 5.670374419e-8,
      unit: 'W/(m²⋅K⁴)',
      uncertainty: { 
        value: 0, 
        type: 'absolute'
      },
      isExact: true, // Derived from exact constants
      source: 'CODATA 2018 (derived)',
      hash: ''
    });

    // Molar gas constant
    this.addConstant({
      name: 'molar_gas_constant',
      symbol: 'R',
      value: createBigNumber('8.314462618'),
      numericValue: 8.314462618,
      unit: 'J/(mol⋅K)',
      uncertainty: { 
        value: 0, 
        type: 'absolute'
      },
      isExact: true, // R = N_A * k_B (both exact)
      source: 'CODATA 2018 (derived, exact)',
      hash: ''
    });

    // Faraday constant
    this.addConstant({
      name: 'faraday_constant',
      symbol: 'F',
      value: createBigNumber('96485.33212'),
      numericValue: 96485.33212,
      unit: 'C/mol',
      uncertainty: { 
        value: 0, 
        type: 'absolute'
      },
      isExact: true, // F = N_A * e (both exact)
      source: 'CODATA 2018 (derived, exact)',
      hash: ''
    });

    // Compton wavelength of electron
    this.addConstant({
      name: 'compton_wavelength_electron',
      symbol: 'λ_C',
      value: createBigNumber('2.42631023867e-12'),
      numericValue: 2.42631023867e-12,
      unit: 'm',
      uncertainty: { 
        value: 0.00000000073e-12, 
        type: 'absolute',
        standardError: 0.00000000073e-12,
        confidenceLevel: 0.68
      },
      isExact: false,
      source: 'CODATA 2018',
      hash: ''
    });

    // Classical electron radius
    this.addConstant({
      name: 'classical_electron_radius',
      symbol: 'r_e',
      value: createBigNumber('2.8179403262e-15'),
      numericValue: 2.8179403262e-15,
      unit: 'm',
      uncertainty: { 
        value: 0.0000000013e-15, 
        type: 'absolute',
        standardError: 0.0000000013e-15,
        confidenceLevel: 0.68
      },
      isExact: false,
      source: 'CODATA 2018',
      hash: ''
    });

    // Electron volt
    this.addConstant({
      name: 'electron_volt',
      symbol: 'eV',
      value: createBigNumber('1.602176634e-19'),
      numericValue: 1.602176634e-19,
      unit: 'J',
      uncertainty: { 
        value: 0, 
        type: 'absolute'
      },
      isExact: true, // 1 eV = e * 1 V (e is exact)
      source: 'CODATA 2018 (SI 2019 exact)',
      hash: ''
    });

    // Atomic mass unit
    this.addConstant({
      name: 'atomic_mass_unit',
      symbol: 'u',
      value: createBigNumber('1.66053906660e-27'),
      numericValue: 1.66053906660e-27,
      unit: 'kg',
      uncertainty: { 
        value: 0.00000000050e-27, 
        type: 'absolute',
        standardError: 0.00000000050e-27,
        confidenceLevel: 0.68
      },
      isExact: false,
      source: 'CODATA 2018',
      hash: ''
    });

    // Thomson cross section
    this.addConstant({
      name: 'thomson_cross_section',
      symbol: 'σ_T',
      value: createBigNumber('6.6524587321e-29'),
      numericValue: 6.6524587321e-29,
      unit: 'm²',
      uncertainty: { 
        value: 0.0000000060e-29, 
        type: 'absolute',
        standardError: 0.0000000060e-29,
        confidenceLevel: 0.68
      },
      isExact: false,
      source: 'CODATA 2018',
      hash: ''
    });

    // Wien displacement constant
    this.addConstant({
      name: 'wien_displacement_constant',
      symbol: 'b',
      value: createBigNumber('2.897771955e-3'),
      numericValue: 2.897771955e-3,
      unit: 'm⋅K',
      uncertainty: { 
        value: 0, 
        type: 'absolute'
      },
      isExact: true, // Derived from exact constants
      source: 'CODATA 2018 (derived)',
      hash: ''
    });

    // First radiation constant
    this.addConstant({
      name: 'first_radiation_constant',
      symbol: 'c_1',
      value: createBigNumber('3.741771852e-16'),
      numericValue: 3.741771852e-16,
      unit: 'W⋅m²',
      uncertainty: { 
        value: 0, 
        type: 'absolute'
      },
      isExact: true, // c_1 = 2πhc² (all exact)
      source: 'CODATA 2018 (derived, exact)',
      hash: ''
    });

    // Second radiation constant
    this.addConstant({
      name: 'second_radiation_constant',
      symbol: 'c_2',
      value: createBigNumber('1.438776877e-2'),
      numericValue: 1.438776877e-2,
      unit: 'm⋅K',
      uncertainty: { 
        value: 0, 
        type: 'absolute'
      },
      isExact: true, // c_2 = hc/k_B (all exact)
      source: 'CODATA 2018 (derived, exact)',
      hash: ''
    });
  }

  /**
   * Initialize derived constants (Planck units, etc.)
   */
  private initializeDerivedConstants(): void {
    // Reduced Planck constant (ħ = h/2π)
    this.derivedConstants.set('reduced_planck_constant', {
      name: 'reduced_planck_constant',
      symbol: 'ħ',
      formula: 'h / (2 * π)',
      dependencies: ['planck_constant'],
      compute: () => {
        const h = this.get('planck_constant');
        const hbar = h.numericValue / (2 * Math.PI);
        return this.createConstant(
          'reduced_planck_constant',
          'ħ',
          hbar,
          'J⋅s',
          { value: 0, type: 'absolute' },
          true,
          'Derived from exact h'
        );
      }
    });

    // Planck length
    this.derivedConstants.set('planck_length', {
      name: 'planck_length',
      symbol: 'l_P',
      formula: 'sqrt(ħG/c³)',
      dependencies: ['reduced_planck_constant', 'gravitational_constant', 'speed_of_light'],
      compute: () => {
        const hbar = this.getDerived('reduced_planck_constant').numericValue;
        const G = this.get('gravitational_constant').numericValue;
        const c = this.get('speed_of_light').numericValue;
        const lP = Math.sqrt(hbar * G / Math.pow(c, 3));
        return this.createConstant(
          'planck_length',
          'l_P',
          lP,
          'm',
          { value: 0.000018e-35, type: 'absolute', standardError: 0.000018e-35, confidenceLevel: 0.68 },
          false,
          'CODATA 2018'
        );
      }
    });

    // Planck time
    this.derivedConstants.set('planck_time', {
      name: 'planck_time',
      symbol: 't_P',
      formula: 'sqrt(ħG/c⁵)',
      dependencies: ['reduced_planck_constant', 'gravitational_constant', 'speed_of_light'],
      compute: () => {
        const hbar = this.getDerived('reduced_planck_constant').numericValue;
        const G = this.get('gravitational_constant').numericValue;
        const c = this.get('speed_of_light').numericValue;
        const tP = Math.sqrt(hbar * G / Math.pow(c, 5));
        return this.createConstant(
          'planck_time',
          't_P',
          tP,
          's',
          { value: 0.000060e-44, type: 'absolute', standardError: 0.000060e-44, confidenceLevel: 0.68 },
          false,
          'CODATA 2018'
        );
      }
    });

    // Planck mass
    this.derivedConstants.set('planck_mass', {
      name: 'planck_mass',
      symbol: 'm_P',
      formula: 'sqrt(ħc/G)',
      dependencies: ['reduced_planck_constant', 'gravitational_constant', 'speed_of_light'],
      compute: () => {
        const hbar = this.getDerived('reduced_planck_constant').numericValue;
        const G = this.get('gravitational_constant').numericValue;
        const c = this.get('speed_of_light').numericValue;
        const mP = Math.sqrt(hbar * c / G);
        return this.createConstant(
          'planck_mass',
          'm_P',
          mP,
          'kg',
          { value: 0.000024e-8, type: 'absolute', standardError: 0.000024e-8, confidenceLevel: 0.68 },
          false,
          'CODATA 2018'
        );
      }
    });

    // Planck temperature
    this.derivedConstants.set('planck_temperature', {
      name: 'planck_temperature',
      symbol: 'T_P',
      formula: 'sqrt(ħc⁵/(Gk_B²))',
      dependencies: ['reduced_planck_constant', 'gravitational_constant', 'speed_of_light', 'boltzmann_constant'],
      compute: () => {
        const hbar = this.getDerived('reduced_planck_constant').numericValue;
        const G = this.get('gravitational_constant').numericValue;
        const c = this.get('speed_of_light').numericValue;
        const kB = this.get('boltzmann_constant').numericValue;
        const TP = Math.sqrt(hbar * Math.pow(c, 5) / (G * Math.pow(kB, 2)));
        return this.createConstant(
          'planck_temperature',
          'T_P',
          TP,
          'K',
          { value: 0.000016e32, type: 'absolute', standardError: 0.000016e32, confidenceLevel: 0.68 },
          false,
          'CODATA 2018'
        );
      }
    });

    // Planck charge
    this.derivedConstants.set('planck_charge', {
      name: 'planck_charge',
      symbol: 'q_P',
      formula: 'sqrt(4πε_0ħc)',
      dependencies: ['vacuum_permittivity', 'reduced_planck_constant', 'speed_of_light'],
      compute: () => {
        const eps0 = this.get('vacuum_permittivity').numericValue;
        const hbar = this.getDerived('reduced_planck_constant').numericValue;
        const c = this.get('speed_of_light').numericValue;
        const qP = Math.sqrt(4 * Math.PI * eps0 * hbar * c);
        return this.createConstant(
          'planck_charge',
          'q_P',
          qP,
          'C',
          { value: 0.0000000015e-18, type: 'absolute' },
          false,
          'Derived'
        );
      }
    });

    // Planck energy
    this.derivedConstants.set('planck_energy', {
      name: 'planck_energy',
      symbol: 'E_P',
      formula: 'm_P * c²',
      dependencies: ['planck_mass', 'speed_of_light'],
      compute: () => {
        const mP = this.getDerived('planck_mass').numericValue;
        const c = this.get('speed_of_light').numericValue;
        const EP = mP * Math.pow(c, 2);
        return this.createConstant(
          'planck_energy',
          'E_P',
          EP,
          'J',
          { value: 0.000014e9, type: 'absolute' },
          false,
          'Derived'
        );
      }
    });
  }

  /**
   * Add a constant to the registry with hash verification
   */
  private addConstant(constant: ConstantValue): void {
    // Generate hash for the constant
    const hashInput = `${constant.name}:${constant.numericValue}:${constant.unit}:${constant.source}`;
    constant.hash = this.hashVerifier.hash(hashInput);
    
    this.constants.set(constant.name, constant);
    
    this.logger.debug(`Added constant: ${constant.symbol}`, {
      name: constant.name,
      value: constant.numericValue,
      hash: constant.hash
    });
  }

  /**
   * Create a constant value object
   */
  private createConstant(
    name: string,
    symbol: string,
    value: number,
    unit: string,
    uncertainty: Uncertainty,
    isExact: boolean,
    source: string
  ): ConstantValue {
    const hashInput = `${name}:${value}:${unit}:${source}`;
    return {
      name,
      symbol,
      value: createBigNumber(value),
      numericValue: value,
      unit,
      uncertainty,
      isExact,
      source,
      hash: this.hashVerifier.hash(hashInput)
    };
  }

  /**
   * Get a fundamental constant by name
   */
  public get(name: string): ConstantValue {
    const constant = this.constants.get(name);
    if (!constant) {
      throw new Error(`Unknown constant: ${name}`);
    }
    
    // Verify hash
    if (this.validationEnabled) {
      const expectedHash = this.hashVerifier.hash(
        `${constant.name}:${constant.numericValue}:${constant.unit}:${constant.source}`
      );
      if (constant.hash !== expectedHash) {
        this.logger.error('Constant hash verification failed', { name, expected: expectedHash, actual: constant.hash });
        throw new Error(`Hash verification failed for constant: ${name}`);
      }
    }
    
    return constant;
  }

  /**
   * Get a derived constant by name (computes if necessary)
   */
  public getDerived(name: string): ConstantValue {
    const derived = this.derivedConstants.get(name);
    if (!derived) {
      throw new Error(`Unknown derived constant: ${name}`);
    }
    return derived.compute();
  }

  /**
   * Get constant by symbol
   */
  public getBySymbol(symbol: string): ConstantValue {
    for (const constant of this.constants.values()) {
      if (constant.symbol === symbol) {
        return constant;
      }
    }
    for (const derived of this.derivedConstants.values()) {
      if (derived.symbol === symbol) {
        return derived.compute();
      }
    }
    throw new Error(`Unknown constant symbol: ${symbol}`);
  }

  /**
   * Check if a constant exists
   */
  public has(name: string): boolean {
    return this.constants.has(name) || this.derivedConstants.has(name);
  }

  /**
   * Get all constant names
   */
  public getAllNames(): string[] {
    return [
      ...Array.from(this.constants.keys()),
      ...Array.from(this.derivedConstants.keys())
    ];
  }

  /**
   * Get all exact constants
   */
  public getExactConstants(): ConstantValue[] {
    return Array.from(this.constants.values()).filter(c => c.isExact);
  }

  /**
   * Get all measured constants (with uncertainty)
   */
  public getMeasuredConstants(): ConstantValue[] {
    return Array.from(this.constants.values()).filter(c => !c.isExact);
  }

  /**
   * Propagate uncertainty through a calculation
   * Uses standard error propagation for independent variables
   */
  public propagateUncertainty(
    result: number,
    partialDerivatives: Map<string, number>,
    constants: string[]
  ): Uncertainty {
    let totalVariance = 0;
    
    for (const name of constants) {
      const constant = this.get(name);
      const partialDerivative = partialDerivatives.get(name) || 0;
      
      if (!constant.isExact && constant.uncertainty.standardError !== undefined) {
        totalVariance += Math.pow(partialDerivative * constant.uncertainty.standardError, 2);
      }
    }
    
    const standardError = Math.sqrt(totalVariance);
    
    return {
      value: standardError,
      type: 'absolute',
      standardError,
      confidenceLevel: 0.68
    };
  }

  /**
   * Validate that derived constants are consistent with fundamental constants
   */
  public validateConsistency(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check R = N_A * k_B
    const R = this.get('molar_gas_constant').numericValue;
    const NA = this.get('avogadro_constant').numericValue;
    const kB = this.get('boltzmann_constant').numericValue;
    const calculatedR = NA * kB;
    if (Math.abs(R - calculatedR) / R > 1e-10) {
      errors.push(`Molar gas constant inconsistency: expected ${calculatedR}, got ${R}`);
    }
    
    // Check F = N_A * e
    const F = this.get('faraday_constant').numericValue;
    const e = this.get('elementary_charge').numericValue;
    const calculatedF = NA * e;
    if (Math.abs(F - calculatedF) / F > 1e-10) {
      errors.push(`Faraday constant inconsistency: expected ${calculatedF}, got ${F}`);
    }
    
    // Check c² = 1/(ε_0 * μ_0)
    const c = this.get('speed_of_light').numericValue;
    const eps0 = this.get('vacuum_permittivity').numericValue;
    const mu0 = this.get('vacuum_permeability').numericValue;
    const calculatedC2 = 1 / (eps0 * mu0);
    if (Math.abs(c * c - calculatedC2) / (c * c) > 1e-8) {
      errors.push(`Speed of light consistency: c² = ${c * c}, 1/(ε_0μ_0) = ${calculatedC2}`);
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Get dimensional analysis for a constant's unit
   */
  public getDimensions(name: string): UnitDimensions {
    const constant = this.constants.get(name) || this.getDerived(name);
    const unit = constant.unit;
    
    // Parse common units
    const dimensions: UnitDimensions = {
      length: 0,
      mass: 0,
      time: 0,
      current: 0,
      temperature: 0,
      amount: 0,
      luminosity: 0
    };
    
    // Simple unit parsing (can be extended)
    if (unit.includes('m') && !unit.includes('mol')) {
      if (unit.includes('m²')) dimensions.length = 2;
      else if (unit.includes('m³')) dimensions.length = 3;
      else if (unit.includes('m⁻¹')) dimensions.length = -1;
      else dimensions.length = 1;
    }
    if (unit.includes('kg')) dimensions.mass = 1;
    if (unit.includes('/s') || unit.includes('⋅s')) {
      if (unit.includes('s²')) dimensions.time = -2;
      else dimensions.time = -1;
    }
    if (unit.includes('A')) dimensions.current = 1;
    if (unit.includes('K')) {
      if (unit.includes('K⁴')) dimensions.temperature = -4;
      else dimensions.temperature = -1;
    }
    if (unit.includes('mol')) {
      if (unit.includes('mol⁻¹')) dimensions.amount = -1;
      else dimensions.amount = 1;
    }
    
    return dimensions;
  }

  /**
   * Export all constants to JSON
   */
  public exportToJson(): string {
    const data = {
      fundamental: Array.from(this.constants.entries()).map(([name, c]) => ({
        name,
        symbol: c.symbol,
        value: c.numericValue,
        unit: c.unit,
        uncertainty: c.uncertainty,
        isExact: c.isExact,
        source: c.source,
        hash: c.hash
      })),
      derived: Array.from(this.derivedConstants.keys()).map(name => {
        const c = this.getDerived(name);
        return {
          name,
          symbol: c.symbol,
          value: c.numericValue,
          unit: c.unit,
          uncertainty: c.uncertainty,
          source: c.source,
          hash: c.hash
        };
      })
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Enable/disable hash validation
   */
  public setValidationEnabled(enabled: boolean): void {
    this.validationEnabled = enabled;
    this.logger.info(`Hash validation ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get total count of constants
   */
  public get count(): number {
    return this.constants.size + this.derivedConstants.size;
  }

  /**
   * Get fundamental constants count
   */
  public get fundamentalCount(): number {
    return this.constants.size;
  }

  /**
   * Get derived constants count
   */
  public get derivedCount(): number {
    return this.derivedConstants.size;
  }
}

// Convenience exports for common constants
export const CONSTANTS = PhysicalConstants.getInstance();

// Shorthand accessors
export const c = () => CONSTANTS.get('speed_of_light');
export const h = () => CONSTANTS.get('planck_constant');
export const hbar = () => CONSTANTS.getDerived('reduced_planck_constant');
export const G = () => CONSTANTS.get('gravitational_constant');
export const e = () => CONSTANTS.get('elementary_charge');
export const kB = () => CONSTANTS.get('boltzmann_constant');
export const NA = () => CONSTANTS.get('avogadro_constant');
export const alpha = () => CONSTANTS.get('fine_structure_constant');
export const me = () => CONSTANTS.get('electron_mass');
export const mp = () => CONSTANTS.get('proton_mass');
export const eps0 = () => CONSTANTS.get('vacuum_permittivity');
export const mu0 = () => CONSTANTS.get('vacuum_permeability');
export const lP = () => CONSTANTS.getDerived('planck_length');
export const tP = () => CONSTANTS.getDerived('planck_time');
export const mP = () => CONSTANTS.getDerived('planck_mass');
export const TP = () => CONSTANTS.getDerived('planck_temperature');
